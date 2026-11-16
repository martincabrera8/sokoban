package sokoban.vista;

import java.awt.Color;
import java.awt.Font;
import java.awt.GridLayout;
import java.awt.Image;

import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.ImageIcon;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;

/**
 * Contenido del cartel "Cómo jugar": cada casilla del juego con su imagen y una línea
 * que explica la regla, y abajo las teclas. Así quien juega por primera vez entiende
 * el cerrojo, el hielo, la caja frágil o el plutonio sin que nadie se lo explique.
 */
public class PanelAyuda extends JPanel {

    private static final Color TEXTO = new Color(0xEBF8FF);
    private static final Color CELESTE = new Color(0x8CEAF5);
    private static final Font FUENTE = new Font(Font.SANS_SERIF, Font.PLAIN, 15);
    private static final Font FUENTE_TECLAS = new Font(Font.SANS_SERIF, Font.BOLD, 15);
    private static final int ICONO = 40;
    private static final String[][] CASILLAS = {
        {"characters/player_down", "Vos: te movés con las flechas y solo podés empujar"},
        {"goals/goal", "Destino: cada caja tiene que terminar en uno"},
        {"boxes/box_wood", "Caja normal: empujala hasta un destino"},
        {"boxes/caja_fragil_intacta", "Caja frágil: aguanta 2 empujes; al tercero se rompe"},
        {"boxes/caja_llave", "Caja llave: sobre el cerrojo abre los muros"},
        {"tiles/cerrojo_cerrado", "Cerrojo: ahí va la caja llave"},
        {"tiles/muro_cerrado", "Muro cerrado: no se pasa hasta abrirlo con la llave"},
        {"tiles/terreno_resbaladizo", "Hielo: la caja se desliza hasta frenar"},
        {"items/plutonio", "Plutonio: una carga para el DeLorean"},
        {"ui/boton_delorean", "DeLorean (T): volvés al último punto en el tiempo"},
    };

    public PanelAyuda() {
        setOpaque(false);
        setLayout(new BoxLayout(this, BoxLayout.Y_AXIS));
        JPanel grilla = new JPanel(new GridLayout(0, 2, 18, 6));
        grilla.setOpaque(false);
        for (String[] casilla : CASILLAS) {
            grilla.add(crearFila(casilla[0], casilla[1]));
        }
        add(grilla);
        JLabel teclas = new JLabel("Flechas: mover  •  Deshacer: 5 pasos atrás (hasta 3 veces seguidas)  •  "
                + "M: sonido  •  Esc: pausa", SwingConstants.CENTER);
        teclas.setFont(FUENTE_TECLAS);
        teclas.setForeground(CELESTE);
        teclas.setAlignmentX(CENTER_ALIGNMENT);
        teclas.setBorder(BorderFactory.createEmptyBorder(14, 0, 0, 0));
        add(teclas);
    }

    private static JLabel crearFila(String imagen, String texto) {
        Image original = Imagenes.obtenerInstancia().obtener(imagen);
        JLabel fila = new JLabel(texto, new ImageIcon(original.getScaledInstance(ICONO, ICONO, Image.SCALE_FAST)),
                SwingConstants.LEFT);
        fila.setFont(FUENTE);
        fila.setForeground(TEXTO);
        fila.setIconTextGap(12);
        return fila;
    }
}
