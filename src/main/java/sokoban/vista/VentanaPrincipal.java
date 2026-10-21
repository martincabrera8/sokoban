package sokoban.vista;

import java.awt.CardLayout;
import java.awt.Dimension;

import javax.swing.JFrame;
import javax.swing.JPanel;

import sokoban.modelo.Juego;

/**
 * Ventana del juego. Contiene las dos pantallas (menú y partida) y cambia entre
 * ellas con un CardLayout. Las pantallas no se conocen entre sí: reciben
 * callbacks para avisar qué eligió el usuario.
 */
public class VentanaPrincipal extends JFrame {

    private static final String MENU = "menu";
    private static final String PARTIDA = "partida";
    private static final Dimension TAMANO = new Dimension(1024, 640);

    private final CardLayout pantallas = new CardLayout();
    private final JPanel contenido = new JPanel(pantallas);
    private final PantallaJuego pantallaJuego;

    public VentanaPrincipal(Juego juego) {
        super("Sokoban");
        pantallaJuego = new PantallaJuego(juego, this::mostrarMenu);
        contenido.add(new MenuPrincipal(juego.getCantidadNiveles(), this::jugar, this::dispose), MENU);
        contenido.add(pantallaJuego, PARTIDA);
        setContentPane(contenido);
        setDefaultCloseOperation(DISPOSE_ON_CLOSE);
        setSize(TAMANO);
        setLocationRelativeTo(null);
    }

    private void mostrarMenu() {
        pantallas.show(contenido, MENU);
    }

    private void jugar(int nivel) {
        pantallas.show(contenido, PARTIDA);
        pantallaJuego.iniciar(nivel);
    }
}
