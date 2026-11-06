package sokoban.vista;

import java.awt.Graphics;
import java.util.List;
import java.util.Map;

import javax.swing.JPanel;

import sokoban.modelo.EstadoJuego;
import sokoban.modelo.ObservadorJuego;

/**
 * Dibuja el tablero con las imágenes del diseño del grupo, sobre el fondo de la
 * época del nivel (1955, 1985, 2015). Es OBSERVADOR: cada vez que cambia la
 * partida guarda el estado nuevo y se vuelve a pintar.
 *
 * Cada símbolo se dibuja como una o más capas (primero el piso, después lo que
 * está encima). Para un elemento nuevo alcanza con agregar su símbolo acá.
 */
public class PanelTablero extends JPanel implements ObservadorJuego {

    private static final int TAMANO_MAXIMO_CELDA = 64;
    private static final String PISO = "tiles/floor_1985";
    private static final String DESTINO = "goals/goal";
    private static final String JUGADOR = "characters/player_down";
    private static final List<String> FONDOS = List.of(
            "backgrounds/background_hill_valley_1955",
            "backgrounds/background_mall_1985",
            "backgrounds/background_future_2015");
    private static final Map<Character, List<String>> CAPAS = Map.ofEntries(
            Map.entry('#', List.of("tiles/wall_brick")),
            Map.entry(' ', List.of(PISO)),
            Map.entry('.', List.of(PISO, DESTINO)),
            Map.entry('@', List.of(PISO, JUGADOR)),
            Map.entry('+', List.of(PISO, DESTINO, JUGADOR)),
            Map.entry('$', List.of(PISO, "boxes/box_wood")),
            Map.entry('*', List.of(PISO, "goals/goal_placed")),
            Map.entry('F', List.of(PISO, "boxes/caja_fragil_intacta")),
            Map.entry('f', List.of(PISO, "boxes/caja_fragil_danada")),
            Map.entry('G', List.of(PISO, DESTINO, "boxes/caja_fragil_intacta")),
            Map.entry('g', List.of(PISO, DESTINO, "boxes/caja_fragil_danada")),
            Map.entry('L', List.of(PISO, "boxes/caja_llave")),
            Map.entry('K', List.of(PISO, DESTINO, "boxes/caja_llave")),
            Map.entry('~', List.of("tiles/terreno_resbaladizo")),
            Map.entry('C', List.of("tiles/cerrojo_cerrado")),
            Map.entry('c', List.of("tiles/cerrojo_abierto")),
            Map.entry('X', List.of("tiles/muro_cerrado")),
            Map.entry('O', List.of("tiles/muro_abierto")));

    private List<String> tablero = List.of();
    private int nivel = 1;

    @Override
    public void actualizar(EstadoJuego estado) {
        tablero = estado.tablero();
        nivel = estado.nivel();
        repaint();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Imagenes.obtenerInstancia().dibujarFondo(g, FONDOS.get((nivel - 1) % FONDOS.size()), getWidth(), getHeight());
        int filas = tablero.size();
        int columnas = tablero.stream().mapToInt(String::length).max().orElse(0);
        if (filas == 0 || columnas == 0) {
            return;
        }
        int tamano = Math.min(TAMANO_MAXIMO_CELDA, Math.min(getWidth() / columnas, getHeight() / filas));
        int margenX = (getWidth() - tamano * columnas) / 2;
        int margenY = (getHeight() - tamano * filas) / 2;
        for (int fila = 0; fila < filas; fila++) {
            String linea = tablero.get(fila);
            for (int columna = 0; columna < linea.length(); columna++) {
                dibujarCelda(g, linea.charAt(columna), margenX + columna * tamano, margenY + fila * tamano, tamano);
            }
        }
    }

    private void dibujarCelda(Graphics g, char simbolo, int x, int y, int tamano) {
        for (String capa : CAPAS.getOrDefault(simbolo, List.of())) {
            g.drawImage(Imagenes.obtenerInstancia().obtener(capa), x, y, tamano, tamano, null);
        }
    }
}
