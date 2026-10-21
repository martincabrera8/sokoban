package sokoban.vista;

import java.awt.Graphics;
import java.awt.GridBagLayout;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.function.IntConsumer;

import javax.swing.JPanel;

/** Menú principal (diseño "pantalla_menu"): título y un botón por nivel, sobre el fondo de 1985. */
public class MenuPrincipal extends JPanel {

    private static final String FONDO = "backgrounds/background_mall_1985";

    public MenuPrincipal(int cantidadNiveles, IntConsumer alElegirNivel, Runnable alSalir) {
        super(new GridBagLayout());
        Map<String, Runnable> opciones = new LinkedHashMap<>();
        for (int nivel = 1; nivel <= cantidadNiveles; nivel++) {
            int elegido = nivel;
            opciones.put("Nivel " + nivel, () -> alElegirNivel.accept(elegido));
        }
        opciones.put("Salir", alSalir);
        add(new Cartel("SOKOBAN", "Seleccionar nivel", opciones));
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Imagenes.obtenerInstancia().dibujarFondo(g, FONDO, getWidth(), getHeight());
    }
}
