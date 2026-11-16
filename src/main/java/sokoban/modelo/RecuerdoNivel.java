package sokoban.modelo;

import java.util.List;

import sokoban.modelo.entidades.Caja;

/**
 * Patrón Memento: el recuerdo. Una foto del nivel en un momento: el terreno, dónde
 * estaban el jugador y las cajas, y los contadores. Solo EstadoNivel puede leerlo
 * (los métodos son de paquete); los cuidadores lo guardan sin mirar adentro.
 */
public final class RecuerdoNivel {

    private final char[][] terreno;
    private final Posicion posicionJugador;
    private final List<Caja> cajas;
    private final int movimientos;
    private final int empujes;
    private final int plutonio;

    RecuerdoNivel(char[][] terreno, Posicion posicionJugador, List<Caja> cajas,
                  int movimientos, int empujes, int plutonio) {
        this.terreno = terreno;
        this.posicionJugador = posicionJugador;
        this.cajas = cajas;
        this.movimientos = movimientos;
        this.empujes = empujes;
        this.plutonio = plutonio;
    }

    char[][] terreno() {
        return terreno;
    }

    Posicion posicionJugador() {
        return posicionJugador;
    }

    List<Caja> cajas() {
        return cajas;
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
