package sokoban.sonido;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

import sokoban.modelo.EstadoJuego;

/** Decorator: qué efecto elige JuegoConSonido comparando el estado antes y después. */
class JuegoConSonidoTest {

    private static EstadoJuego estado(int empujes, String... filas) {
        return new EstadoJuego(1, 0, empujes, 0, 0, 0, 1, 1000, false, false, List.of(filas));
    }

    @Test
    void caminarPorUnMuroYaAbiertoEsUnPasoNoUnCerrojo() {
        EstadoJuego antes = estado(0, "#  @O .#");   // el jugador está a punto de pisar el muro abierto
        EstadoJuego encima = estado(0, "#   @ .#");  // parado encima: la O no se ve
        EstadoJuego despues = estado(0, "#   O@.#"); // al salir, la O vuelve a verse
        assertEquals(Sonido.PASO, JuegoConSonido.queSonidoCorresponde(antes, encima));
        assertEquals(Sonido.PASO, JuegoConSonido.queSonidoCorresponde(encima, despues));
    }

    @Test
    void abrirLosMurosConLaLlaveSuenaElCerrojo() {
        EstadoJuego antes = estado(0, "#@LC X.#");
        EstadoJuego despues = estado(1, "# @L O.#");
        assertEquals(Sonido.CERROJO_ABIERTO, JuegoConSonido.queSonidoCorresponde(antes, despues));
    }
}
