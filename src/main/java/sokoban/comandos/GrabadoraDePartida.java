package sokoban.comandos;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.swing.Timer;

/**
 * Patrón Command: el invocador. Ejecuta cada comando del jugador y lo guarda.
 * Como los comandos quedan guardados, después puede volver a ejecutarlos
 * uno por uno para mostrar la repetición de la partida.
 */
public class GrabadoraDePartida {

    private static final int PAUSA_MS = 160;

    private final List<Comando> comandos = new ArrayList<>();
    private Timer reloj;
    private Iterator<Comando> pendientes;
    private Runnable alTerminar;

    /** Durante la repetición no se aceptan comandos nuevos. */
    public void ejecutar(Comando comando) {
        if (estaReproduciendo()) {
            return;
        }
        comando.ejecutar();
        comandos.add(comando);
    }

    public void borrar() {
        comandos.clear();
    }

    /**
     * Vuelve a ejecutar los comandos guardados, uno cada 160 ms. Antes, quien la llama
     * deja el nivel como al principio: como el juego no tiene azar, se repite la misma partida.
     */
    public void reproducir(Runnable alTerminar) {
        this.alTerminar = alTerminar;
        pendientes = List.copyOf(comandos).iterator();
        reloj = new Timer(PAUSA_MS, evento -> ejecutarSiguiente());
        reloj.start();
    }

    /** Ejecuta de golpe lo que falta de la repetición. */
    public void saltarAlFinal() {
        if (!estaReproduciendo()) {
            return;
        }
        reloj.stop();
        pendientes.forEachRemaining(Comando::ejecutar);
        terminar();
    }

    public boolean estaReproduciendo() {
        return reloj != null && reloj.isRunning();
    }

    private void ejecutarSiguiente() {
        if (pendientes.hasNext()) {
            pendientes.next().ejecutar();
        } else {
            reloj.stop();
            terminar();
        }
    }

    private void terminar() {
        reloj = null;
        alTerminar.run();
    }
}
