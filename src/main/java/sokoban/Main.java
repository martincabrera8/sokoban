package sokoban;

import javax.swing.SwingUtilities;

import sokoban.modelo.CargadorNivel;
import sokoban.modelo.Juego;
import sokoban.modelo.JuegoSokoban;
import sokoban.sonido.JuegoConSonido;
import sokoban.sonido.SonidosDeInterfaz;
import sokoban.vista.VentanaPrincipal;

/**
 * Punto de entrada. Es el único lugar que conoce las clases concretas y las conecta:
 * el dominio (JuegoSokoban), el sonido que lo envuelve (JuegoConSonido) y la ventana.
 *
 * Sin argumentos juega la carpeta "niveles". Con un argumento juega otra carpeta,
 * por ejemplo: java -jar target/sokoban.jar mis-niveles
 */
public final class Main {
    private Main() { }

    public static void main(String[] args) {
        String carpeta = args.length > 0 ? args[0] : CargadorNivel.CARPETA_POR_DEFECTO;
        SwingUtilities.invokeLater(() -> {
            Juego juego = new JuegoConSonido(new JuegoSokoban(new CargadorNivel(carpeta)));
            new VentanaPrincipal(juego).setVisible(true);
            SonidosDeInterfaz.instalar();
        });
    }
}
