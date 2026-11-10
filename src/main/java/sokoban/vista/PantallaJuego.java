package sokoban.vista;

import java.awt.BorderLayout;
import java.awt.Dialog;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.swing.AbstractAction;
import javax.swing.JDialog;
import javax.swing.JPanel;
import javax.swing.KeyStroke;
import javax.swing.SwingUtilities;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoJuego;
import sokoban.modelo.Juego;

/**
 * Pantalla de la partida: HUD arriba y tablero al centro.
 * Traduce las teclas en movimientos y muestra los carteles de pausa y de
 * resultado (diseños "pantalla_pausa", "pantalla_victoria" y "pantalla_resultados").
 */
public class PantallaJuego extends JPanel {

    private static final Map<Integer, Direccion> TECLAS = Map.of(
            KeyEvent.VK_UP, Direccion.ARRIBA,
            KeyEvent.VK_DOWN, Direccion.ABAJO,
            KeyEvent.VK_LEFT, Direccion.IZQUIERDA,
            KeyEvent.VK_RIGHT, Direccion.DERECHA);

    private final Juego juego;
    private final Runnable volverAlMenu;
    private final PanelTablero tablero = new PanelTablero();

    public PantallaJuego(Juego juego, Runnable volverAlMenu) {
        super(new BorderLayout());
        this.juego = juego;
        this.volverAlMenu = volverAlMenu;

        PanelHUD hud = new PanelHUD(juego, this::pausar);
        juego.agregarObservador(hud);
        juego.agregarObservador(tablero);
        add(hud, BorderLayout.NORTH);
        add(tablero, BorderLayout.CENTER);
        configurarTeclado();
    }

    public void iniciar(int nivel) {
        tablero.mirarHacia(Direccion.ABAJO);
        juego.iniciarNivel(nivel);
    }

    private void configurarTeclado() {
        TECLAS.forEach((tecla, direccion) -> asignarTecla(tecla, () -> mover(direccion)));
        asignarTecla(KeyEvent.VK_ESCAPE, this::pausar);
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
        tablero.mirarHacia(direccion);
        juego.mover(direccion);
        EstadoJuego estado = juego.getEstado();
        if (estado.completado()) {
            mostrarResultado(estado);
        }
    }

    private void pausar() {
        Map<String, Runnable> opciones = new LinkedHashMap<>();
        opciones.put("Continuar", () -> { });
        opciones.put("Reiniciar", juego::reiniciar);
        opciones.put("Menú", volverAlMenu);
        mostrarCartel("PAUSA", "Flechas: mover  •  Esc: pausa", opciones);
    }

    /** Resumen pedido por la consigna: movimientos, empujes, uso del deshacer y puntaje. */
    private void mostrarResultado(EstadoJuego estado) {
        boolean haySiguiente = estado.nivel() < juego.getCantidadNiveles();
        Map<String, Runnable> opciones = new LinkedHashMap<>();
        if (haySiguiente) {
            opciones.put("Siguiente nivel", () -> iniciar(estado.nivel() + 1));
        }
        opciones.put("Repetir", () -> iniciar(estado.nivel()));
        opciones.put("Menú", volverAlMenu);
        String titulo = haySiguiente ? "¡NIVEL COMPLETADO!" : "RESULTADOS";
        String resumen = String.format("Movimientos: %d  •  Empujes: %d  •  Deshacer: %d  •  Puntaje: %d",
                estado.movimientos(), estado.empujes(), estado.undosUsados(), estado.puntaje());
        mostrarCartel(titulo, resumen, opciones);
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
