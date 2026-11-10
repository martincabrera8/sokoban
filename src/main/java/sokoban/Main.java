package sokoban;

import javax.swing.SwingUtilities;
import sokoban.modelo.Juego;
import sokoban.modelo.JuegoSokoban;
import sokoban.sonido.JuegoConSonido;     // [Sonido - M. Coghlan]
import sokoban.sonido.SonidosDeInterfaz;  // [Sonido - M. Coghlan]
import sokoban.vista.VentanaPrincipal;

public final class Main {
    private Main() { }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            Juego juego = new JuegoConSonido(new JuegoSokoban()); // [Sonido - M. Coghlan] antes: new JuegoSokoban()
            new VentanaPrincipal(juego).setVisible(true);
            SonidosDeInterfaz.instalar();                         // [Sonido - M. Coghlan]
        });
    }
}
