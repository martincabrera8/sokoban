package sokoban.comandos;

import java.util.ArrayList;
import java.util.List;

/**
 * Patrón COMMAND, el invocador: ejecuta cada comando del jugador y lo anota.
 * Al terminar el nivel, la lista anotada es la partida completa, lista para repetir.
 */
public class GrabadoraDePartida {

    private final List<Comando> grabados = new ArrayList<>();

    public void ejecutar(Comando comando) {
        comando.ejecutar();
        grabados.add(comando);
    }

    /** Se llama al empezar o reiniciar el nivel: la partida empieza de cero. */
    public void borrar() {
        grabados.clear();
    }

    public List<Comando> getGrabados() {
        return List.copyOf(grabados);
    }
}
