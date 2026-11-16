package sokoban.comandos;

import sokoban.modelo.Direccion;
import sokoban.modelo.Juego;

/** Comando concreto: mover al jugador. El receptor es el juego. */
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
