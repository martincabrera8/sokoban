package sokoban.vista;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dialog;
import java.awt.Font;
import java.awt.Window;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.swing.AbstractAction;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.KeyStroke;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.Timer;
import javax.swing.border.EmptyBorder;

import sokoban.comandos.ComandoDeshacer;
import sokoban.comandos.ComandoMover;
import sokoban.comandos.ComandoViajarEnElTiempo;
import sokoban.comandos.GrabadoraDePartida;
import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoJuego;
import sokoban.modelo.Juego;

/**
 * Pantalla de la partida: HUD arriba, tablero al centro y un aviso abajo.
 * Es el cliente del patrón Command: cada tecla o botón se convierte en un comando
 * que ejecuta la grabadora. También muestra los carteles de pausa y de resultado.
 */
public class PantallaJuego extends JPanel {

    private static final Map<Integer, Direccion> FLECHAS = Map.of(
            KeyEvent.VK_UP, Direccion.ARRIBA,
            KeyEvent.VK_DOWN, Direccion.ABAJO,
            KeyEvent.VK_LEFT, Direccion.IZQUIERDA,
            KeyEvent.VK_RIGHT, Direccion.DERECHA);
    private static final Color FONDO_AVISO = new Color(0x202D3F);
    private static final Color DORADO = new Color(0xF8E4A5);
    private static final int DURACION_AVISO_MS = 2500;

    private final Juego juego;
    private final Runnable volverAlMenu;
    private final PanelTablero tablero = new PanelTablero();
    private final GrabadoraDePartida grabadora = new GrabadoraDePartida();
    private final JLabel aviso = new JLabel("", SwingConstants.CENTER);
    private final Timer ocultarAviso = new Timer(DURACION_AVISO_MS, evento -> aviso.setVisible(false));

    public PantallaJuego(Juego juego, Runnable volverAlMenu) {
        super(new BorderLayout());
        this.juego = juego;
        this.volverAlMenu = volverAlMenu;

        PanelHUD hud = new PanelHUD(this::deshacer, this::reiniciar, this::viajarEnElTiempo, this::pausar);
        juego.agregarObservador(hud);
        juego.agregarObservador(tablero);
        add(hud, BorderLayout.NORTH);
        add(tablero, BorderLayout.CENTER);
        add(crearAviso(), BorderLayout.SOUTH);

        FLECHAS.forEach((tecla, direccion) -> asignarTecla(tecla, () -> mover(direccion)));
        asignarTecla(KeyEvent.VK_T, this::viajarEnElTiempo);
        asignarTecla(KeyEvent.VK_ESCAPE, this::alApretarEscape);
    }

    public void iniciar(int nivel) {
        grabadora.borrar();
        tablero.mirarHacia(Direccion.ABAJO);
        juego.iniciarNivel(nivel);
    }

    // ---------- Acciones del jugador: cada una es un comando ----------

    private void mover(Direccion direccion) {
        if (grabadora.estaReproduciendo()) {
            return;
        }
        tablero.mirarHacia(direccion);
        int puntosAntes = juego.getEstado().puntosEnElTiempo();
        grabadora.ejecutar(new ComandoMover(juego, direccion));

        EstadoJuego estado = juego.getEstado();
        if (estado.puntosEnElTiempo() > puntosAntes) {
            avisar("Punto en el tiempo guardado: el DeLorean puede volver a este momento");
        }
        if (estado.completado()) {
            mostrarResultado(estado);
        } else if (estado.sinSolucion()) {
            mostrarCajaRota(estado);
        }
    }

    private void deshacer() {
        grabadora.ejecutar(new ComandoDeshacer(juego));
    }

    private void viajarEnElTiempo() {
        grabadora.ejecutar(new ComandoViajarEnElTiempo(juego));
    }

    /** Reiniciar no se graba: la partida (y su repetición) empieza de cero. */
    private void reiniciar() {
        if (!grabadora.estaReproduciendo()) {
            grabadora.borrar();
            juego.reiniciar();
        }
    }

    private void alApretarEscape() {
        if (grabadora.estaReproduciendo()) {
            grabadora.saltarAlFinal();
        } else {
            pausar();
        }
    }

    /** Deja el nivel como al principio y la grabadora vuelve a ejecutar los comandos. */
    private void verRepeticion(int nivel) {
        tablero.mirarHacia(Direccion.ABAJO);
        juego.iniciarNivel(nivel);
        ocultarAviso.stop();
        aviso.setText("REPETICIÓN  •  Esc: saltar al final");
        aviso.setVisible(true);
        grabadora.reproducir(() -> {
            aviso.setVisible(false);
            mostrarResultado(juego.getEstado());
        });
    }

    // ---------- Carteles ----------

    private void pausar() {
        if (grabadora.estaReproduciendo()) {
            return;
        }
        Map<String, Runnable> opciones = new LinkedHashMap<>();
        opciones.put("Continuar", () -> { });
        opciones.put("Reiniciar", this::reiniciar);
        opciones.put("Menú", volverAlMenu);
        mostrarCartel("PAUSA", "Flechas: mover  •  T: DeLorean  •  M: sonido  •  Esc: pausa", opciones);
    }

    /** Resumen pedido por la consigna: movimientos, empujes, uso del deshacer y puntaje. */
    private void mostrarResultado(EstadoJuego estado) {
        boolean haySiguiente = estado.nivel() < juego.getCantidadNiveles();
        Map<String, Runnable> opciones = new LinkedHashMap<>();
        if (haySiguiente) {
            opciones.put("Siguiente nivel", () -> iniciar(estado.nivel() + 1));
        }
        opciones.put("Ver repetición", () -> verRepeticion(estado.nivel()));
        opciones.put("Repetir", () -> iniciar(estado.nivel()));
        opciones.put("Menú", volverAlMenu);
        String resumen = String.format(
                "Movimientos: %d  •  Empujes: %d  •  Deshacer: %d  •  Viajes en el tiempo: %d  •  Puntaje: %d",
                estado.movimientos(), estado.empujes(), estado.deshacerUsados(), estado.viajes(), estado.puntaje());
        mostrarCartel(haySiguiente ? "¡NIVEL COMPLETADO!" : "RESULTADOS", resumen, opciones);
    }

    /** Se rompió una caja frágil necesaria: se avisa y se ofrecen las salidas posibles. */
    private void mostrarCajaRota(EstadoJuego estado) {
        Map<String, Runnable> opciones = new LinkedHashMap<>();
        opciones.put("Deshacer", this::deshacer);
        if (estado.plutonio() > 0) {
            opciones.put("DeLorean", this::viajarEnElTiempo);
        }
        opciones.put("Reiniciar", this::reiniciar);
        opciones.put("Menú", volverAlMenu);
        mostrarCartel("SE ROMPIÓ LA CAJA", "Ya no alcanzan las cajas para cubrir todos los destinos.", opciones);
    }

    /** El cartel es una ventana modal: mientras está abierto, el juego no recibe teclas. */
    private void mostrarCartel(String titulo, String mensaje, Map<String, Runnable> opciones) {
        Window ventana = SwingUtilities.getWindowAncestor(this);
        JDialog dialogo = new JDialog(ventana, Dialog.ModalityType.APPLICATION_MODAL);
        Map<String, Runnable> alElegir = new LinkedHashMap<>();
        opciones.forEach((texto, accion) -> alElegir.put(texto, () -> {
            dialogo.dispose();
            accion.run();
        }));
        dialogo.setUndecorated(true);
        dialogo.getContentPane().setBackground(Cartel.FONDO);
        dialogo.add(new Cartel(titulo, mensaje, alElegir));
        dialogo.pack();
        dialogo.setLocationRelativeTo(this);
        dialogo.setVisible(true);
        if (ventana != null) {
            ventana.toFront();
            ventana.requestFocus(); // al cerrar el cartel, las flechas vuelven a mover
        }
    }

    // ---------- Aviso de abajo ----------

    private void avisar(String texto) {
        aviso.setText(texto);
        aviso.setVisible(true);
        ocultarAviso.setRepeats(false);
        ocultarAviso.restart();
    }

    private JLabel crearAviso() {
        aviso.setOpaque(true);
        aviso.setBackground(FONDO_AVISO);
        aviso.setForeground(DORADO);
        aviso.setFont(aviso.getFont().deriveFont(Font.BOLD, 18f));
        aviso.setBorder(new EmptyBorder(8, 0, 8, 0));
        aviso.setVisible(false);
        return aviso;
    }

    private void asignarTecla(int tecla, Runnable accion) {
        KeyStroke atajo = KeyStroke.getKeyStroke(tecla, 0);
        getInputMap(WHEN_IN_FOCUSED_WINDOW).put(atajo, atajo);
        getActionMap().put(atajo, new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent evento) {
                accion.run();
            }
        });
    }
}
