package sokoban.modelo;

/**
 * Patrón FACADE: único punto de acceso de la interfaz gráfica al dominio.
 * También es el sujeto del patrón OBSERVER.
 *
 * Lo implementa el controlador del dominio (resto del equipo). La vista solo
 * conoce esta interfaz (DIP), así que el dominio puede cambiar sin tocar la vista.
 *
 * Contrato: después de cada cambio (mover, deshacer, reiniciar o iniciar nivel)
 * hay que llamar a actualizar(getEstado()) en todos los observadores.
 */
public interface Juego {

    int getCantidadNiveles();

    void iniciarNivel(int numero);

    void mover(Direccion direccion);

    void deshacer();

    void reiniciar();

    EstadoJuego getEstado();

    void agregarObservador(ObservadorJuego observador);
}
