package sokoban.modelo;

/** Patrón Observer: el observador. Lo implementan el HUD y el tablero. */
public interface ObservadorJuego {

    void actualizar(EstadoJuego estado);
}
