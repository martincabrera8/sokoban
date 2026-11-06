package sokoban;

import javax.swing.SwingUtilities;
import sokoban.modelo.Juego;
import sokoban.modelo.JuegoSokoban;
import sokoban.vista.VentanaPrincipal;

public final class Main {
    private Main() { }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            Juego juego = new JuegoSokoban();
            new VentanaPrincipal(juego).setVisible(true);
        });
    }
}
