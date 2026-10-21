package sokoban;

import javax.swing.SwingUtilities;

import sokoban.modelo.Juego;
import sokoban.prueba.JuegoDePrueba;
import sokoban.vista.VentanaPrincipal;

/**
 * Punto de entrada. Es el único lugar que conoce las clases concretas y las conecta.
 * Al integrar con el dominio, se reemplaza JuegoDePrueba por el controlador del equipo.
 */
public final class Main {

    private Main() {
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            Juego juego = new JuegoDePrueba();
            new VentanaPrincipal(juego).setVisible(true);
        });
    }
}
