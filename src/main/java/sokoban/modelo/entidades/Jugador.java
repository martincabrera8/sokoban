package sokoban.modelo.entidades;

import sokoban.modelo.Direccion;
import sokoban.modelo.Evento;
import sokoban.modelo.Posicion;

/** El personaje. Le pide al mediador moverse y él resuelve paredes, cajas y hielo. */
public class Jugador extends ElementoMovil {

    public Jugador(Posicion posicion) {
        super(posicion);
    }

    public Evento mover(Direccion direccion) {
        return mediador.intentarMover(direccion);
    }
}
