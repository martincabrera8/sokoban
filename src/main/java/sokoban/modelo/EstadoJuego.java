package sokoban.modelo;

import java.util.List;

/**
 * DTO (record inmutable) con la foto del nivel en curso. Es lo único que la vista
 * recibe del dominio: nunca un Tablero, una Caja ni el Jugador.
 *
 * El tablero viaja como líneas de texto, con un símbolo por celda, igual que en
 * los archivos de nivel (por ejemplo "#  $.@#").
 */
public record EstadoJuego(int nivel, int movimientos, int empujes, int undosUsados,
                          int puntaje, boolean completado, List<String> tablero) {

    public EstadoJuego {
        tablero = List.copyOf(tablero);
    }
}
