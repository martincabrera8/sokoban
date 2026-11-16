package sokoban.modelo;

import java.util.Objects;

/**
 * Patrón DECORATOR, el decorador base: es un Juego que envuelve a otro Juego y le
 * pasa cada pedido tal cual. Un decorador concreto (por ejemplo JuegoConSonido)
 * hereda de esta clase y sobrescribe solo lo que quiere agregar.
 *
 * Como recibe cualquier Juego, los decoradores se pueden apilar:
 * new DecoradorA(new DecoradorB(new JuegoSokoban())).
 */
public abstract class JuegoDecorado implements Juego {

    protected final Juego juego;

    protected JuegoDecorado(Juego juego) {
        this.juego = Objects.requireNonNull(juego, "El juego decorado no puede ser null");
    }

    @Override
    public int getCantidadNiveles() {
        return juego.getCantidadNiveles();
    }

    @Override
    public void iniciarNivel(int numero) {
        juego.iniciarNivel(numero);
    }

    @Override
    public void mover(Direccion direccion) {
        juego.mover(direccion);
    }

    @Override
    public void deshacer() {
        juego.deshacer();
    }

    @Override
    public void reiniciar() {
        juego.reiniciar();
    }

    @Override
    public void viajarEnElTiempo() {
        juego.viajarEnElTiempo();
    }

    @Override
    public EstadoJuego getEstado() {
        return juego.getEstado();
    }

    @Override
    public void agregarObservador(ObservadorJuego observador) {
        juego.agregarObservador(observador);
    }

    @Override
    public void quitarObservador(ObservadorJuego observador) {
        juego.quitarObservador(observador);
    }
}
