package sokoban.vista;

import java.awt.Color;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;

import javax.swing.Icon;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;

import sokoban.modelo.EstadoJuego;
import sokoban.modelo.Juego;
import sokoban.modelo.ObservadorJuego;

/**
 * HUD pedido por la consigna, con los íconos del diseño del grupo: indicadores
 * de nivel, movimientos y empujes, y botones Deshacer, Reiniciar y Pausa.
 * Es OBSERVADOR: se actualiza solo cuando cambia la partida.
 */
public class PanelHUD extends JPanel implements ObservadorJuego {

    private static final Color FONDO = new Color(0x202D3F);
    private static final Color CELESTE = new Color(0x8CEAF5);
    private static final Font FUENTE_NUMERO = new Font(Font.MONOSPACED, Font.BOLD, 15);
    private static final Rectangle ZONA_NUMERO = new Rectangle(13, 34, 38, 16);
    private static final int TAMANO = 64;
    private static final int SEPARACION = 14;

    private final JLabel nivel = new JLabel();
    private final JLabel movimientos = new JLabel();
    private final JLabel empujes = new JLabel();

    public PanelHUD(Juego juego, Runnable alPausar) {
        super(new FlowLayout(FlowLayout.CENTER, SEPARACION, SEPARACION / 2));
        setBackground(FONDO);
        add(nivel);
        add(movimientos);
        add(empujes);
        add(crearBoton("ui/boton_undo", "Deshacer", juego::deshacer));
        add(crearBoton("ui/boton_restart", "Reiniciar", juego::reiniciar));
        add(crearBoton("ui/boton_pause", "Pausa", alPausar));
    }

    @Override
    public void actualizar(EstadoJuego estado) {
        nivel.setIcon(crearIndicador("ui/indicador_nivel", estado.nivel()));
        movimientos.setIcon(crearIndicador("ui/indicador_movimientos", estado.movimientos()));
        empujes.setIcon(crearIndicador("ui/indicador_empujes", estado.empujes()));
    }

    /** Dibuja el indicador del diseño y reemplaza su "000" por el valor real. */
    private static Icon crearIndicador(String ruta, int valor) {
        BufferedImage indicador = new BufferedImage(TAMANO, TAMANO, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = indicador.createGraphics();
        g.drawImage(Imagenes.obtenerInstancia().obtener(ruta), 0, 0, null);
        g.setColor(FONDO);
        g.fill(ZONA_NUMERO);
        g.setColor(CELESTE);
        g.setFont(FUENTE_NUMERO);
        String texto = String.format("%03d", valor);
        FontMetrics medidas = g.getFontMetrics();
        int x = ZONA_NUMERO.x + (ZONA_NUMERO.width - medidas.stringWidth(texto)) / 2;
        int y = ZONA_NUMERO.y + (ZONA_NUMERO.height + medidas.getAscent() - medidas.getDescent()) / 2;
        g.drawString(texto, x, y);
        g.dispose();
        return new ImageIcon(indicador);
    }

    /** Botones con ícono que no toman el foco, así las flechas siempre mueven al jugador. */
    private static JButton crearBoton(String ruta, String descripcion, Runnable accion) {
        JButton boton = new JButton(new ImageIcon(Imagenes.obtenerInstancia().obtener(ruta)));
        boton.setToolTipText(descripcion);
        boton.getAccessibleContext().setAccessibleName(descripcion);
        boton.setBorderPainted(false);
        boton.setContentAreaFilled(false);
        boton.setFocusable(false);
        boton.addActionListener(evento -> accion.run());
        return boton;
    }
}
