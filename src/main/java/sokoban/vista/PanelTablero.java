package sokoban.vista;

import static sokoban.vista.Epoca.PARED;
import static sokoban.vista.Epoca.PISO;

import java.awt.Graphics;
import java.util.List;
import java.util.Map;

import javax.swing.JPanel;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoJuego;
import sokoban.modelo.ObservadorJuego;

/**
 * Dibuja el tablero con las imágenes del diseño del grupo, con el fondo, el piso
 * y la pared de la época del nivel (1955, 1985, 2015). Es OBSERVADOR: cada vez
 * que cambia la partida guarda el estado nuevo y se vuelve a pintar.
 *
 * Cada símbolo se dibuja como una o más capas (primero el piso, después lo que
 * está encima). Para un elemento nuevo alcanza con agregar su símbolo acá.
 * El jugador se dibuja mirando hacia donde se movió por última vez.
 */
public class PanelTablero extends JPanel implements ObservadorJuego {

    private static final int TAMANO_MAXIMO_CELDA = 64;
    private static final String DESTINO = "goals/goal";
    private static final String JUGADOR = "{jugador}";
    private static final Map<Direccion, String> SPRITES_JUGADOR = Map.of(
            Direccion.ARRIBA, "characters/player_up",
            Direccion.ABAJO, "characters/player_down",
            Direccion.IZQUIERDA, "characters/player_left",
            Direccion.DERECHA, "characters/player_right");
    private static final Map<Character, List<String>> CAPAS = Map.ofEntries(
            Map.entry('#', List.of(PARED)),
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
    private Epoca epoca = Epoca.delNivel(1);
    private Direccion orientacion = Direccion.ABAJO;

    @Override
    public void actualizar(EstadoJuego estado) {
        tablero = estado.tablero();
        epoca = Epoca.delNivel(estado.nivel());
        repaint();
    }

    /** Gira al jugador hacia la dirección elegida, aunque el movimiento quede bloqueado. */
    public void mirarHacia(Direccion direccion) {
        orientacion = direccion;
        repaint();
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);
        Imagenes.obtenerInstancia().dibujarFondo(g, epoca.getFondo(), getWidth(), getHeight());
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
            g.drawImage(Imagenes.obtenerInstancia().obtener(rutaDe(capa)), x, y, tamano, tamano, null);
        }
    }

    private String rutaDe(String capa) {
        return JUGADOR.equals(capa) ? SPRITES_JUGADOR.get(orientacion) : epoca.resolver(capa);
    }
}
