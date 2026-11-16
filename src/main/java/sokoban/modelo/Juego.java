package sokoban.modelo;

/**
 * Patrón Facade: lo único que la vista conoce del juego.
 * Hereda de SujetoJuego para que la vista pueda suscribirse a los cambios.
 */
public interface Juego extends SujetoJuego {

    int getCantidadNiveles();

    void iniciarNivel(int numero);

    void mover(Direccion direccion);

    void deshacer();

    void reiniciar();

    void viajarEnElTiempo();

    EstadoJuego getEstado();
}
