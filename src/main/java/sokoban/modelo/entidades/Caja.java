package sokoban.modelo.entidades;

import sokoban.modelo.EstadoNivel;
import sokoban.modelo.Posicion;
import sokoban.modelo.estrategias.ComportamientoCaja;

public class Caja {
    private Posicion posicion;
    private final ComportamientoCaja estrategia;
    private int resistencia;

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

    public void despuesDeEmpujar(EstadoNivel estado) {
        estrategia.despuesDeEmpujar(this, estado);
    }

    public Caja copiar() {
        return new Caja(posicion, estrategia, resistencia);
    }
}
