package sokoban.modelo.entidades;

import sokoban.modelo.Direccion;
import sokoban.modelo.Posicion;
import sokoban.modelo.movimiento.MediadorMovimiento;

public class Jugador {
    private Posicion posicion;
    private MediadorMovimiento mediador;

    public Jugador(Posicion posicion) {
        this.posicion = posicion;
    }

    public Posicion getPosicion() { return posicion; }
    public void setPosicion(Posicion posicion) { this.posicion = posicion; }

    public void conectar(MediadorMovimiento mediador) {
        this.mediador = mediador;
    }

    public boolean mover(Direccion direccion) {
        if (mediador == null) throw new IllegalStateException("Jugador sin mediador");
        return mediador.intentarMover(direccion);
    }
}
