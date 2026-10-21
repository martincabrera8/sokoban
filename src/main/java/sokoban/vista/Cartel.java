package sokoban.vista;

import java.awt.BasicStroke;
import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.Graphics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.util.Map;

import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;
import javax.swing.border.EmptyBorder;

/**
 * Cartel con el estilo del diseño del grupo: panel azul con borde celeste,
 * título dorado, un mensaje y una fila de opciones.
 * Se reutiliza en el menú principal, la pausa y el resultado del nivel.
 */
public class Cartel extends JPanel {

    public static final Color FONDO = new Color(0x142035);
    private static final Color PANEL = new Color(0x263C5A);
    private static final Color BORDE = new Color(0x79DCF4);
    private static final Color DORADO = new Color(0xF8E4A5);
    private static final Color TEXTO = new Color(0xEBF8FF);
    private static final Font FUENTE_TITULO = new Font(Font.SANS_SERIF, Font.BOLD, 34);
    private static final Font FUENTE_TEXTO = new Font(Font.SANS_SERIF, Font.BOLD, 16);
    private static final int GROSOR_BORDE = 5;
    private static final int RADIO = 30;
    private static final int MARGEN = 32;

    public Cartel(String titulo, String mensaje, Map<String, Runnable> opciones) {
        super(new BorderLayout(0, MARGEN / 2));
        setOpaque(false);
        setBorder(new EmptyBorder(MARGEN, MARGEN * 2, MARGEN, MARGEN * 2));
        add(crearEtiqueta(titulo, FUENTE_TITULO, DORADO), BorderLayout.NORTH);
        add(crearEtiqueta(mensaje, FUENTE_TEXTO, TEXTO), BorderLayout.CENTER);

        JPanel botones = new JPanel(new FlowLayout(FlowLayout.CENTER, MARGEN / 2, 0));
        botones.setOpaque(false);
        opciones.forEach((texto, accion) -> botones.add(crearBoton(texto, accion)));
        add(botones, BorderLayout.SOUTH);
    }

    @Override
    protected void paintComponent(Graphics g) {
        Graphics2D g2 = (Graphics2D) g.create();
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        int mitad = GROSOR_BORDE / 2;
        int ancho = getWidth() - GROSOR_BORDE;
        int alto = getHeight() - GROSOR_BORDE;
        g2.setColor(PANEL);
        g2.fillRoundRect(mitad, mitad, ancho, alto, RADIO, RADIO);
        g2.setColor(BORDE);
        g2.setStroke(new BasicStroke(GROSOR_BORDE));
        g2.drawRoundRect(mitad, mitad, ancho, alto, RADIO, RADIO);
        g2.dispose();
    }

    private static JLabel crearEtiqueta(String texto, Font fuente, Color color) {
        JLabel etiqueta = new JLabel(texto, SwingConstants.CENTER);
        etiqueta.setFont(fuente);
        etiqueta.setForeground(color);
        return etiqueta;
    }

    private static JButton crearBoton(String texto, Runnable accion) {
        JButton boton = new JButton(texto);
        boton.setFont(FUENTE_TEXTO);
        boton.setForeground(TEXTO);
        boton.setBackground(FONDO);
        boton.setFocusPainted(false);
        boton.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createLineBorder(BORDE, 2), new EmptyBorder(8, 18, 8, 18)));
        boton.addActionListener(evento -> accion.run());
        return boton;
    }
}
