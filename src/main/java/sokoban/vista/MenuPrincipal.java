package sokoban.vista;

import java.awt.Dialog;
import java.awt.Graphics;
import java.awt.GridBagLayout;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.IntConsumer;

import javax.swing.JDialog;
import javax.swing.JPanel;
import javax.swing.SwingUtilities;

/**
 * Menú principal (diseño "pantalla_menu"): título, un botón por nivel y "Cómo jugar",
 * sobre el fondo de 1985. Hay un botón por cada archivo de nivel que exista.
 */
public class MenuPrincipal extends JPanel {

    private static final String FONDO = "backgrounds/background_mall_1985";

    public MenuPrincipal(int cantidadNiveles, IntConsumer alElegirNivel, Runnable alSalir) {
        super(new GridBagLayout());
        Map<String, Runnable> opciones = new LinkedHashMap<>();
        for (int nivel = 1; nivel <= cantidadNiveles; nivel++) {
            int elegido = nivel;
            opciones.put("Nivel " + nivel, () -> alElegirNivel.accept(elegido));
        }
        opciones.put("Cómo jugar", this::mostrarAyuda);
        opciones.put("Salir", alSalir);
        add(new Cartel("SOKOBAN", "Seleccionar nivel", opciones));
    }

    /** Cartel con las reglas de cada casilla y las teclas. */
    private void mostrarAyuda() {
        JDialog dialogo = new JDialog(SwingUtilities.getWindowAncestor(this), Dialog.ModalityType.APPLICATION_MODAL);
        Map<String, Runnable> opciones = new LinkedHashMap<>();
        opciones.put("Entendido", dialogo::dispose);
        dialogo.setUndecorated(true);
        dialogo.getContentPane().setBackground(Cartel.FONDO);
        dialogo.add(new Cartel("CÓMO JUGAR", new PanelAyuda(), opciones));
        dialogo.pack();
        dialogo.setLocationRelativeTo(this);
        dialogo.setVisible(true);
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Imagenes.obtenerInstancia().dibujarFondo(g, FONDO, getWidth(), getHeight());
    }
}
