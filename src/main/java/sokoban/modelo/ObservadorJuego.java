package sokoban.modelo;

/**
 * Patrón OBSERVER: lo implementa cada parte de la vista que tiene que
 * actualizarse cuando cambia la partida (el HUD y el tablero).
 */
public interface ObservadorJuego {

    void actualizar(EstadoJuego estado);
}
