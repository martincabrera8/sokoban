package sokoban.modelo.entidades;

import sokoban.modelo.Posicion;
import sokoban.modelo.estrategias.ComportamientoCaja;
import sokoban.modelo.movimiento.MediadorMovimiento;

/**
 * Una caja del nivel. Es COLEGA del Mediator: no toca el tablero; lo que pasa después
 * de un empuje lo decide su STRATEGY y se lo avisa al mediador.
 */
public class Caja {
    private Posicion posicion;
    private final ComportamientoCaja estrategia;
    private int resistencia;
    private MediadorMovimiento mediador;

    public Caja(Posicion posicion, ComportamientoCaja estrategia, int resistencia) {
        this.posicion = posicion;
        this.estrategia = estrategia;
        this.resistencia = resistencia;
    }

    public Posicion getPosicion() { return posicion; }
    public void setPosicion(Posicion posicion) { this.posicion = posicion; }
    public int getResistencia() { return resistencia; }
    public void quitarResistencia() { resistencia--; }
    public char getSimbolo() { return estrategia.simbolo(this); }

    public void conectar(MediadorMovimiento mediador) {
        this.mediador = mediador;
    }

    public void despuesDeEmpujar() {
        if (mediador == null) throw new IllegalStateException("Caja sin mediador");
        estrategia.despuesDeEmpujar(this, mediador);
    }

    /** Copia para el Memento: la copia se vuelve a conectar al restaurarla. */
    public Caja copiar() {
        return new Caja(posicion, estrategia, resistencia);
    }
}
