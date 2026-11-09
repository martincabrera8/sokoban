package sokoban.sonido;

import java.awt.AWTEvent;
import java.awt.KeyboardFocusManager;
import java.awt.Toolkit;
import java.awt.event.KeyEvent;
import java.awt.event.MouseEvent;

import javax.swing.AbstractButton;
import javax.swing.SwingUtilities;

/**
 * Sonidos de la interfaz (no del juego): arranque, clic de botones y tecla M para silenciar.
 *
 * Escucha los eventos de TODA la aplicación desde afuera, así que no hace falta tocar
 * ninguna pantalla ni ningún botón: cualquier botón que exista o se agregue después
 * suena solo.
 *
 * @author Marcelo Coghlan
 */
public final class SonidosDeInterfaz {

    private SonidosDeInterfaz() {
    }

    /** Se llama una vez, al arrancar la aplicación. */
    public static void instalar() {
        Toolkit.getDefaultToolkit().addAWTEventListener(evento -> alHacerClic((MouseEvent) evento),
                AWTEvent.MOUSE_EVENT_MASK);
        KeyboardFocusManager.getCurrentKeyboardFocusManager().addKeyEventDispatcher(SonidosDeInterfaz::alApretarTecla);
        Sonidos.obtenerInstancia().reproducir(Sonido.ARRANQUE);
    }

    /** Clic con el botón izquierdo sobre cualquier botón habilitado. */
    private static void alHacerClic(MouseEvent evento) {
        if (evento.getID() == MouseEvent.MOUSE_PRESSED
                && SwingUtilities.isLeftMouseButton(evento)
                && evento.getComponent() instanceof AbstractButton boton
                && boton.isEnabled()) {
            Sonidos.obtenerInstancia().reproducir(Sonido.CLIC);
        }
    }

    /** Tecla M: activa / desactiva el sonido. Devuelve false para que la tecla siga su curso normal. */
    private static boolean alApretarTecla(KeyEvent evento) {
        if (evento.getID() == KeyEvent.KEY_PRESSED && evento.getKeyCode() == KeyEvent.VK_M) {
            Sonidos.obtenerInstancia().alternarSonido();
        }
        return false;
    }
}
