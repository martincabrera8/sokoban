package sokoban.vista;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.Dialog;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.swing.AbstractAction;
import javax.swing.JDialog;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.KeyStroke;
import javax.swing.SwingConstants;
import javax.swing.SwingUtilities;
import javax.swing.border.EmptyBorder;

import sokoban.comandos.Comando;
import sokoban.comandos.ComandoDeshacer;
import sokoban.comandos.ComandoMover;
import sokoban.comandos.ComandoViajarEnElTiempo;
import sokoban.comandos.GrabadoraDePartida;
import sokoban.comandos.Repeticion;
import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoJuego;
import sokoban.modelo.Juego;

/**
 * Pantalla de la partida: HUD arriba y tablero al centro.
 * Traduce las teclas en movimientos y muestra los carteles de pausa y de
 * resultado (diseños "pantalla_pausa", "pantalla_victoria" y "pantalla_resultados").
 *
 * Patrón COMMAND (funcionalidad adicional "repetición"): es el cliente. Cada acción
 * del jugador se convierte en un Comando y la ejecuta la GrabadoraDePartida, que la
 * anota. Al terminar el nivel, "Ver repetición" vuelve a ejecutar esos comandos.
 */
public class PantallaJuego extends JPanel {

    private static final Map<Integer, Direccion> TECLAS = Map.of(
            KeyEvent.VK_UP, Direccion.ARRIBA,
            KeyEvent.VK_DOWN, Direccion.ABAJO,
            KeyEvent.VK_LEFT, Direccion.IZQUIERDA,
            KeyEvent.VK_RIGHT, Direccion.DERECHA);
    private static final Color FONDO_AVISO = new Color(0x202D3F);
    private static final Color DORADO = new Color(0xF8E4A5);

    private final Juego juego;
    private final Runnable volverAlMenu;
    private final PanelTablero tablero = new PanelTablero();
    private final GrabadoraDePartida grabadora = new GrabadoraDePartida();
    private final JLabel avisoRepeticion = new JLabel("REPETICIÓN  •  Esc: saltar al final", SwingConstants.CENTER);
    private Repeticion repeticion;

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
        configurarTeclado();
    }

    public void iniciar(int nivel) {
        grabadora.borrar();
        tablero.mirarHacia(Direccion.ABAJO);
        juego.iniciarNivel(nivel);
    }

    private void configurarTeclado() {
        TECLAS.forEach((tecla, direccion) -> asignarTecla(tecla, () -> mover(direccion)));
        asignarTecla(KeyEvent.VK_ESCAPE, this::alApretarEscape);
        asignarTecla(KeyEvent.VK_T, this::viajarEnElTiempo);
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

    private void mover(Direccion direccion) {
        if (repitiendo()) {
            return;
        }
        tablero.mirarHacia(direccion);
        grabadora.ejecutar(new ComandoMover(juego, direccion));
        mostrarResultadoSiTermino();
    }

    private void deshacer() {
        if (!repitiendo()) {
            grabadora.ejecutar(new ComandoDeshacer(juego));
        }
    }

    private void viajarEnElTiempo() {
        if (!repitiendo()) {
            grabadora.ejecutar(new ComandoViajarEnElTiempo(juego));
        }
    }

    /** Reiniciar no se graba: la partida (y la repetición) vuelve a empezar de cero. */
    private void reiniciar() {
        if (!repitiendo()) {
            grabadora.borrar();
            juego.reiniciar();
        }
    }

    private void alApretarEscape() {
        if (repitiendo()) {
            repeticion.saltarAlFinal();
        } else {
            pausar();
        }
    }

    private void pausar() {
        if (repitiendo()) {
            return;
        }
        Map<String, Runnable> opciones = new LinkedHashMap<>();
        opciones.put("Continuar", () -> { });
        opciones.put("Reiniciar", this::reiniciar);
        opciones.put("Menú", volverAlMenu);
        mostrarCartel("PAUSA", "Flechas: mover  •  T: DeLorean  •  M: sonido  •  Esc: pausa", opciones);
    }

    private void mostrarResultadoSiTermino() {
        EstadoJuego estado = juego.getEstado();
        if (estado.completado()) {
            mostrarResultado(estado);
        }
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
        String titulo = haySiguiente ? "¡NIVEL COMPLETADO!" : "RESULTADOS";
        String resumen = String.format(
                "Movimientos: %d  •  Empujes: %d  •  Deshacer: %d  •  Viajes en el tiempo: %d  •  Puntaje: %d",
                estado.movimientos(), estado.empujes(), estado.undosUsados(), estado.viajes(), estado.puntaje());
        mostrarCartel(titulo, resumen, opciones);
    }

    /** Deja el nivel como al principio y vuelve a ejecutar los comandos grabados. */
    private void verRepeticion(int nivel) {
        List<Comando> partida = grabadora.getGrabados();
        tablero.mirarHacia(Direccion.ABAJO);
        juego.iniciarNivel(nivel);
        avisoRepeticion.setVisible(true);
        repeticion = new Repeticion(partida, () -> {
            avisoRepeticion.setVisible(false);
            repeticion = null;
            mostrarResultado(juego.getEstado());
        });
        repeticion.empezar();
    }

    private boolean repitiendo() {
        return repeticion != null;
    }

    private JLabel crearAviso() {
        avisoRepeticion.setOpaque(true);
        avisoRepeticion.setBackground(FONDO_AVISO);
        avisoRepeticion.setForeground(DORADO);
        avisoRepeticion.setFont(avisoRepeticion.getFont().deriveFont(Font.BOLD, 18f));
        avisoRepeticion.setBorder(new EmptyBorder(8, 0, 8, 0));
        avisoRepeticion.setVisible(false);
        return avisoRepeticion;
    }

    /** Muestra el cartel en una ventana modal: mientras está abierto, el juego no recibe teclas. */
    private void mostrarCartel(String titulo, String mensaje, Map<String, Runnable> opciones) {
        JDialog dialogo = new JDialog(SwingUtilities.getWindowAncestor(this), Dialog.ModalityType.APPLICATION_MODAL);
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
    }
}
