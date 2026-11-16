package sokoban.modelo.tiempo;

import java.util.ArrayDeque;
import java.util.Deque;

import sokoban.modelo.RecuerdoNivel;

/**
 * Patrón Memento: cuidador del deshacer. Guarda los recuerdos de los últimos 15
 * movimientos; cada uso vuelve 5 atrás, hasta 3 veces seguidas.
 */
public class HistorialDeshacer {

    private static final int MAXIMO = 15;
    private static final int PASOS_POR_USO = 5;
    private static final int USOS_SEGUIDOS = 3;

    private final Deque<RecuerdoNivel> recuerdos = new ArrayDeque<>();
    private int usosSeguidos;

    /** Se llama antes de cada movimiento; moverse vuelve a habilitar los 3 usos. */
    public void guardar(RecuerdoNivel recuerdo) {
        recuerdos.push(recuerdo);
        if (recuerdos.size() > MAXIMO) {
            recuerdos.removeLast();
        }
        usosSeguidos = 0;
    }

    /** Devuelve el recuerdo de 5 movimientos atrás, o null si no se puede deshacer. */
    public RecuerdoNivel deshacer() {
        if (recuerdos.isEmpty() || usosSeguidos >= USOS_SEGUIDOS) {
            return null;
        }
        RecuerdoNivel recuerdo = null;
        for (int i = 0; i < PASOS_POR_USO && !recuerdos.isEmpty(); i++) {
            recuerdo = recuerdos.pop();
        }
        usosSeguidos++;
        return recuerdo;
    }

    public void olvidarTodo() {
        recuerdos.clear();
        usosSeguidos = 0;
    }
}
