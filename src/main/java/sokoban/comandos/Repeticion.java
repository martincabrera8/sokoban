package sokoban.comandos;

import java.util.Iterator;
import java.util.List;

import javax.swing.Timer;

/**
 * Funcionalidad adicional: repetición de la partida. Vuelve a ejecutar, de a uno y
 * con una pausa, los comandos que anotó la GrabadoraDePartida. No necesita saber
 * qué hace cada comando: es la ventaja del patrón Command.
 *
 * Antes de reproducir, quien la usa deja el nivel como al principio. Como el juego no
 * tiene azar, los mismos comandos llevan exactamente a la misma partida.
 */
public class Repeticion {

    private static final int PAUSA_MS = 160;

    private final Iterator<Comando> pendientes;
    private final Runnable alTerminar;
    private final Timer reloj;

    public Repeticion(List<Comando> comandos, Runnable alTerminar) {
        this.pendientes = List.copyOf(comandos).iterator();
        this.alTerminar = alTerminar;
        this.reloj = new Timer(PAUSA_MS, evento -> siguiente());
    }

    public void empezar() {
        reloj.start();
    }

    /** Ejecuta de golpe lo que falta (tecla Esc durante la repetición). */
    public void saltarAlFinal() {
        reloj.stop();
        pendientes.forEachRemaining(Comando::ejecutar);
        alTerminar.run();
    }

    public boolean estaReproduciendo() {
        return reloj.isRunning();
    }

    private void siguiente() {
        if (pendientes.hasNext()) {
            pendientes.next().ejecutar();
        } else {
            reloj.stop();
            alTerminar.run();
        }
    }
}
