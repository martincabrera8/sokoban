package sokoban.modelo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static sokoban.modelo.Tableros.mover;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

/**
 * Los niveles oficiales tienen solución: se juega la solución más corta que encontró
 * VerificadorDeNiveles y se comprueba que el nivel queda completo.
 */
class NivelesTest {

    @ParameterizedTest(name = "nivel {0}")
    @CsvSource({
        "1, ↓←←↑→ →↑↑←↓ ↓←↓→↓ →↑↑↓↓ →→←↑↑ ←↑→→↑ →↓←←← ←↑→→, 39, 18",
        "2, ←↑→↑→ ↓↓←↓→ ↓→→←↑ ←↑→→→ ←←↑←↑ →→→→, 29, 15",
        "3, ↑←↑→→ ↓↓→↓↓ ←↑←↑→ →→→↑→ ↓→←←↓ →→, 27, 10",
    })
    void laSolucionCompletaElNivel(int nivel, String solucion, int movimientos, int empujes) {
        JuegoSokoban juego = new JuegoSokoban();
        juego.iniciarNivel(nivel);
        mover(juego, solucion);
        EstadoJuego estado = juego.getEstado();
        assertTrue(estado.completado());
        assertEquals(movimientos, estado.movimientos());
        assertEquals(empujes, estado.empujes());
    }
}
