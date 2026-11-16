package sokoban.comandos;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoJuego;
import sokoban.modelo.JuegoSokoban;

/** Command: la repetición vuelve a ejecutar los comandos grabados y llega a la misma partida. */
class RepeticionTest {

    @Test
    void laRepeticionTerminaExactamenteIgualQueLaPartida() {
        JuegoSokoban juego = new JuegoSokoban();
        juego.iniciarNivel(2);
        GrabadoraDePartida grabadora = new GrabadoraDePartida();
        for (char letra : "←↑→↑→↓↓←↓→↓→→←↑←↑→→→←←↑←↑→→→→".toCharArray()) {
            Direccion direccion = switch (letra) {
                case '↑' -> Direccion.ARRIBA;
                case '↓' -> Direccion.ABAJO;
                case '←' -> Direccion.IZQUIERDA;
                default -> Direccion.DERECHA;
            };
            grabadora.ejecutar(new ComandoMover(juego, direccion));
        }
        grabadora.ejecutar(new ComandoDeshacer(juego)); // no hace nada: el nivel ya está completo
        EstadoJuego partida = juego.getEstado();
        assertTrue(partida.completado());

        List<Comando> grabados = grabadora.getGrabados();
        assertEquals(30, grabados.size());
        juego.iniciarNivel(2);
        new Repeticion(grabados, () -> { }).saltarAlFinal();
        assertEquals(partida, juego.getEstado());
    }
}
