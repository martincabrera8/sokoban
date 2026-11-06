package sokoban.modelo;

public interface Juego {

    int getCantidadNiveles();

    void iniciarNivel(int numero);

    void mover(Direccion direccion);

    void deshacer();

    void reiniciar();

    EstadoJuego getEstado();

    void agregarObservador(ObservadorJuego observador);
}
