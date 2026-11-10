package sokoban.comandos;

import sokoban.modelo.Juego;

/** Comando concreto: el DeLorean vuelve al último punto en el tiempo. */
public class ComandoViajarEnElTiempo implements Comando {

    private final Juego juego;

    public ComandoViajarEnElTiempo(Juego juego) {
        this.juego = juego;
    }

    @Override
    public void ejecutar() {
        juego.viajarEnElTiempo();
    }
}
