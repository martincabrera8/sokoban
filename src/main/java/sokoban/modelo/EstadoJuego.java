package sokoban.modelo;

import java.util.List;

public record EstadoJuego(int nivel, int movimientos, int empujes, int undosUsados,
                          int puntaje, boolean completado, List<String> tablero) {

    public EstadoJuego {
        tablero = List.copyOf(tablero);
    }
}
