package sokoban.modelo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static sokoban.modelo.Tableros.juego;
import static sokoban.modelo.Tableros.mover;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/** El evento que informa el dominio después de cada acción (lo usa el sonido). */
class EventosTest {

    @TempDir
    Path carpeta;

    @Test
    void laLlaveSobreElCerrojoEsCerrojoAbiertoYUnaParedEsChoque() throws Exception {
        JuegoSokoban j = juego(carpeta, "#########", "#@LC X .#", "#########");
        mover(j, "R");
        assertEquals(Evento.CERROJO_ABIERTO, j.getEstado().evento());
        mover(j, "U");
        assertEquals(Evento.CHOQUE, j.getEstado().evento());
    }

    @Test
    void cadaEmpujeDeLaFragilAvisaQueSeDanaYAlTerceroQueSeRompe() throws Exception {
        JuegoSokoban j = juego(carpeta, "########", "#@F   .#", "########");
        mover(j, "R");
        assertEquals(Evento.CAJA_DANADA, j.getEstado().evento());
        mover(j, "RR");
        assertEquals(Evento.CAJA_ROTA, j.getEstado().evento());
    }

    @Test
    void llegarAlDestinoYGanar() throws Exception {
        JuegoSokoban j = juego(carpeta, "######", "#@$. #", "#  $.#", "######");
        mover(j, "R");
        assertEquals(Evento.CAJA_EN_DESTINO, j.getEstado().evento());
        mover(j, "DR");
        assertEquals(Evento.VICTORIA, j.getEstado().evento());
    }
}
