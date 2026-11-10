package sokoban.modelo;

/**
 * Patrón MEMENTO: el recuerdo de un momento del nivel (el tablero completo y los
 * contadores). Lo crea JuegoSokoban (el originador) y lo guardan otros sin poder
 * mirar adentro: sus datos solo se leen desde este paquete.
 *
 * Lo usan el deshacer (pila de los últimos 15 movimientos) y el DeLorean
 * (puntos en el tiempo de MaquinaDelTiempo).
 */
public final class RecuerdoNivel {

    private final EstadoNivel nivel;
    private final int movimientos;
    private final int empujes;
    private final int plutonio;

    RecuerdoNivel(EstadoNivel nivel, int movimientos, int empujes, int plutonio) {
        this.nivel = nivel.copiar();
        this.movimientos = movimientos;
        this.empujes = empujes;
        this.plutonio = plutonio;
    }

    /** Devuelve una copia nueva: el mismo recuerdo se puede restaurar más de una vez. */
    EstadoNivel nivel() {
        return nivel.copiar();
    }

    int movimientos() {
        return movimientos;
    }

    int empujes() {
        return empujes;
    }

    int plutonio() {
        return plutonio;
    }
}
