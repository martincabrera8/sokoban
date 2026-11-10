package sokoban.modelo.tiempo;

import java.util.ArrayDeque;
import java.util.Deque;

import sokoban.modelo.RecuerdoNivel;

/**
 * Patrón MEMENTO, el cuidador: el DeLorean guarda los puntos en el tiempo del nivel.
 * Guarda los recuerdos y los devuelve, pero no sabe qué tienen adentro (no puede
 * leerlos ni cambiarlos), así el estado del nivel sigue encapsulado.
 *
 * Los puntos se guardan solos: al empezar el nivel y cada vez que una caja llega a
 * un destino. Viajar cuesta una carga de plutonio (eso lo controla JuegoSokoban).
 */
public class MaquinaDelTiempo {

    private static final int MAXIMO_PUNTOS = 10;

    private final Deque<RecuerdoNivel> puntos = new ArrayDeque<>();

    public void guardar(RecuerdoNivel recuerdo) {
        puntos.push(recuerdo);
        if (puntos.size() > MAXIMO_PUNTOS) {
            puntos.removeLast();
        }
    }

    /** El punto en el tiempo más reciente, o null si no hay ninguno. */
    public RecuerdoNivel ultimo() {
        return puntos.peek();
    }

    /** Borra el punto más reciente (por ejemplo, si quedó en un futuro que ya no existe). */
    public void descartarUltimo() {
        puntos.pop();
    }

    public int cantidad() {
        return puntos.size();
    }

    public void olvidarTodo() {
        puntos.clear();
    }
}
