package sokoban.comandos;

import sokoban.modelo.Direccion;
import sokoban.modelo.Juego;

/** Comando concreto: mover al jugador en una dirección. El receptor es el Juego. */
public class ComandoMover implements Comando {

    private final Juego juego;
    private final Direccion direccion;

    public ComandoMover(Juego juego, Direccion direccion) {
        this.juego = juego;
        this.direccion = direccion;
    }

    @Override
    public void ejecutar() {
        juego.mover(direccion);
    }
}
