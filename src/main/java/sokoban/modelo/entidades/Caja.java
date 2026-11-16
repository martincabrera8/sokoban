package sokoban.modelo.entidades;

import sokoban.modelo.Posicion;
import sokoban.modelo.estrategias.ComportamientoCaja;

/**
 * Una caja del nivel. Es el contexto del patrón Strategy: lo que pasa después de un
 * empuje depende de su comportamiento (normal, frágil o llave).
 */
public class Caja extends ElementoMovil {

    private final ComportamientoCaja comportamiento;
    private int resistencia;

    public Caja(Posicion posicion, ComportamientoCaja comportamiento, int resistencia) {
        super(posicion);
        this.comportamiento = comportamiento;
        this.resistencia = resistencia;
    }

    public void despuesDeEmpujar() {
        comportamiento.despuesDeEmpujar(this, mediador);
    }

    public void quitarResistencia() {
        resistencia--;
    }

    public int getResistencia() {
        return resistencia;
    }

    public char getSimbolo() {
        return comportamiento.simbolo(this);
    }

    public Caja copiar() {
        return new Caja(posicion, comportamiento, resistencia);
    }
}
