package sokoban.modelo;

import java.util.List;

/**
 * Foto de la partida que el juego les manda a los observadores. Es inmutable,
 * así la vista puede leerla pero no cambiar nada del dominio.
 * El tablero viaja como texto, con un carácter por casilla.
 */
public record EstadoJuego(int nivel, int movimientos, int empujes, int deshacerUsados,
                          int plutonio, int viajes, int puntosEnElTiempo, int puntaje,
                          boolean completado, boolean sinSolucion, Evento evento,
                          List<String> tablero) {

    public EstadoJuego {
        tablero = List.copyOf(tablero);
    }
}
