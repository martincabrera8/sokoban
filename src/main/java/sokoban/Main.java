package sokoban;

import javax.swing.SwingUtilities;
import sokoban.modelo.Juego;
import sokoban.modelo.JuegoSokoban;
import sokoban.sonido.JuegoConSonido;     // [Sonido - M. Coghlan]
import sokoban.sonido.SonidosDeInterfaz;  // [Sonido - M. Coghlan]
import sokoban.vista.VentanaPrincipal;

/**
 * Punto de entrada. Es el único lugar que conoce las clases concretas y las conecta:
 * el dominio (JuegoSokoban), el sonido que lo envuelve (JuegoConSonido) y la ventana.
 */
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
