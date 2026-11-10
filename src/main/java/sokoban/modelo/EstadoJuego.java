package sokoban.modelo;

import java.util.List;

/**
 * DTO (record inmutable) con la foto del nivel en curso. Es lo único que la vista
 * recibe del dominio: nunca un Tablero, una Caja ni el Jugador.
 *
 * El tablero viaja como líneas de texto, con un símbolo por celda, igual que en
 * los archivos de nivel (por ejemplo "#  $.@#").
 *
 * plutonio son las cargas del DeLorean que tiene el jugador y viajes, las veces
 * que viajó en el tiempo en este nivel.
 */
public record EstadoJuego(int nivel, int movimientos, int empujes, int undosUsados,
                          int plutonio, int viajes,
                          int puntaje, boolean completado, List<String> tablero) {

    public EstadoJuego {
        tablero = List.copyOf(tablero);
    }
}
