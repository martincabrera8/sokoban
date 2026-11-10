package sokoban.comandos;

import sokoban.modelo.Juego;

/** Comando concreto: el botón deshacer. */
public class ComandoDeshacer implements Comando {

    private final Juego juego;

    public ComandoDeshacer(Juego juego) {
        this.juego = juego;
    }

    @Override
    public void ejecutar() {
        juego.deshacer();
    }
}
