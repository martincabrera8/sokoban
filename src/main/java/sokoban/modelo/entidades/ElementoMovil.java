package sokoban.modelo.entidades;

import sokoban.modelo.Posicion;
import sokoban.modelo.movimiento.MediadorMovimiento;

/**
 * Lo que se mueve por el tablero: el jugador y las cajas.
 * En el patrón Mediator cumple el rol de "colega": no se conocen entre sí ni tocan
 * el tablero; todo lo que necesitan se lo piden o se lo avisan al mediador.
 */
public abstract class ElementoMovil {

    protected Posicion posicion;
    protected MediadorMovimiento mediador;

    protected ElementoMovil(Posicion posicion) {
        this.posicion = posicion;
    }

    public void conectar(MediadorMovimiento mediador) {
        this.mediador = mediador;
    }

    public Posicion getPosicion() {
        return posicion;
    }

    public void setPosicion(Posicion posicion) {
        this.posicion = posicion;
    }
}
