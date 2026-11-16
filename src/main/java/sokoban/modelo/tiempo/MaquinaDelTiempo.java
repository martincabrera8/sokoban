package sokoban.modelo.tiempo;

import java.util.ArrayDeque;
import java.util.Deque;

import sokoban.modelo.RecuerdoNivel;

/**
 * Patrón Memento: cuidador del DeLorean. Guarda los puntos en el tiempo del nivel
 * (al empezar y cada vez que una caja llega a un destino). Cada punto lleva el número
 * de movimiento en que se guardó, para saber cuáles quedaron en el pasado.
 */
public class MaquinaDelTiempo {

    private static final int MAXIMO_PUNTOS = 10;

    private record Punto(int movimiento, RecuerdoNivel recuerdo) {
    }

    private final Deque<Punto> puntos = new ArrayDeque<>();

    public void guardar(int movimiento, RecuerdoNivel recuerdo) {
        puntos.push(new Punto(movimiento, recuerdo));
        if (puntos.size() > MAXIMO_PUNTOS) {
            puntos.removeLast();
        }
    }

    /**
     * El último punto anterior al movimiento actual, o null si no hay. Los puntos
     * posteriores se descartan: después del viaje, ese futuro ya no existe.
     */
    public RecuerdoNivel volverAntesDe(int movimientoActual) {
        Punto destino = null;
        for (Punto punto : puntos) {
            if (punto.movimiento() < movimientoActual) {
                destino = punto;
                break;
            }
        }
        if (destino == null) {
            return null;
        }
        while (puntos.peek() != destino) {
            puntos.pop();
        }
        return destino.recuerdo();
    }

    /** Al deshacer, los puntos guardados después del momento al que se volvió ya no existen. */
    public void olvidarDespuesDe(int movimiento) {
        while (!puntos.isEmpty() && puntos.peek().movimiento() > movimiento) {
            puntos.pop();
        }
    }

    public int cantidad() {
        return puntos.size();
    }

    public void olvidarTodo() {
        puntos.clear();
    }
}
