package sokoban.modelo;

/**
 * Patrón FACADE: único punto de acceso de la interfaz gráfica al dominio.
 * También es el sujeto del patrón OBSERVER.
 *
 * La implementa JuegoSokoban (el dominio) y la decora JuegoConSonido (el sonido).
 * La vista solo conoce esta interfaz (DIP), así que el dominio puede cambiar sin tocar la vista.
 *
 * Contrato: después de cada cambio (mover, deshacer, reiniciar, viajar en el tiempo o iniciar nivel)
 * hay que llamar a actualizar(getEstado()) en todos los observadores.
 */
public interface Juego {

    int getCantidadNiveles();

    void iniciarNivel(int numero);

    void mover(Direccion direccion);

    void deshacer();

    void reiniciar();

    /**
     * Funcionalidad adicional DeLorean: gasta una carga de plutonio y vuelve al
     * último punto en el tiempo guardado (sin reiniciar todo el nivel).
     */
    void viajarEnElTiempo();

    EstadoJuego getEstado();

    void agregarObservador(ObservadorJuego observador);
}
