package sokoban.modelo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static sokoban.modelo.Tableros.fila;
import static sokoban.modelo.Tableros.juego;
import static sokoban.modelo.Tableros.mover;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/** Las reglas de la consigna, una por prueba, sobre el motor real del juego. */
class ReglasTest {

    @TempDir
    Path carpeta;

    // ---------- Movimiento ----------

    @Test
    void elJugadorNoAtraviesaParedesNiMurosCerrados() throws Exception {
        JuegoSokoban j = juego(carpeta, "######", "#@X$.#", "######");
        mover(j, "R");
        assertEquals(0, j.getEstado().movimientos());
    }

    @Test
    void empujarMueveLaCajaEnLaMismaDireccion() throws Exception {
        JuegoSokoban j = juego(carpeta, "######", "#@$ .#", "######");
        mover(j, "R");
        assertEquals("# @$.#", fila(j, 1));
        assertEquals(1, j.getEstado().empujes());
    }

    @Test
    void noSePuedenEmpujarDosCajasALaVez() throws Exception {
        JuegoSokoban j = juego(carpeta, "#######", "#@$$..#", "#######");
        mover(j, "R");
        assertEquals("#@$$..#", fila(j, 1));
    }

    @Test
    void noSePuedeTirarDeUnaCaja() throws Exception {
        JuegoSokoban j = juego(carpeta, "######", "# @$.#", "######");
        mover(j, "L");
        assertEquals("#@ $.#", fila(j, 1));
    }

    // ---------- Hielo ----------

    @Test
    void enElHieloLaCajaSeDeslizaHastaElPrimerPisoNormal() throws Exception {
        JuegoSokoban j = juego(carpeta, "#########", "#@$~~~ .#", "#########");
        mover(j, "R");
        assertEquals("# @~~~$.#", fila(j, 1));
        assertEquals(1, j.getEstado().empujes());
    }

    @Test
    void enElHieloLaCajaFrenaContraUnObstaculo() throws Exception {
        JuegoSokoban j = juego(carpeta, "########", "#@$~~#.#", "########");
        mover(j, "R");
        assertEquals("# @~$#.#", fila(j, 1));
    }

    // ---------- Cajas especiales (Strategy + Mediator) ----------

    @Test
    void laFragilAguantaDosEmpujesYAlTerceroSeRompe() throws Exception {
        JuegoSokoban j = juego(carpeta, "#######", "#@F  .#", "#######");
        mover(j, "RR");
        assertEquals("#  @f.#", fila(j, 1)); // dañada: le queda un empuje
        mover(j, "R");
        assertEquals("#   @.#", fila(j, 1));
        assertTrue(j.getEstado().sinSolucion());
    }

    @Test
    void laLlaveSobreElCerrojoAbreLosMuros() throws Exception {
        JuegoSokoban j = juego(carpeta, "########", "#@LC X.#", "########");
        mover(j, "R");
        assertEquals("# @L O.#", fila(j, 1));
    }

    @Test
    void unaCajaNormalSobreElCerrojoNoAbreNada() throws Exception {
        JuegoSokoban j = juego(carpeta, "########", "#@$C X.#", "########");
        mover(j, "R");
        assertEquals("# @$ X.#", fila(j, 1));
    }

    // ---------- Deshacer (Memento) ----------

    @Test
    void deshacerVuelveCincoMovimientosHastaTresVecesSeguidas() throws Exception {
        JuegoSokoban j = juego(carpeta, "######", "#    #", "# @$.#", "######");
        mover(j, "UDUDUDUDUDUDUDUDUDUD"); // 20 movimientos: se guardan los últimos 15
        j.deshacer();
        assertEquals(15, j.getEstado().movimientos());
        j.deshacer();
        j.deshacer();
        assertEquals(5, j.getEstado().movimientos());
        j.deshacer(); // el cuarto seguido no hace nada
        assertEquals(5, j.getEstado().movimientos());
        assertEquals(3, j.getEstado().undosUsados());
    }

    @Test
    void deshacerRecuperaUnaFragilRota() throws Exception {
        JuegoSokoban j = juego(carpeta, "#######", "#@F  .#", "#######");
        mover(j, "RRR");
        j.deshacer();
        assertEquals("#@F  .#", fila(j, 1));
        assertFalse(j.getEstado().sinSolucion());
    }

    // ---------- DeLorean (Memento) ----------

    @Test
    void sinPlutonioElDeLoreanNoHaceNada() throws Exception {
        JuegoSokoban j = juego(carpeta, "######", "#@$ .#", "######");
        mover(j, "R");
        j.viajarEnElTiempo();
        assertEquals(1, j.getEstado().movimientos());
        assertEquals(0, j.getEstado().viajes());
    }

    @Test
    void elDeLoreanVuelveAlUltimoPuntoYElPlutonioNoReaparece() throws Exception {
        JuegoSokoban j = juego(carpeta,
                "#########",
                "#P F   .#",
                "#@$.    #",
                "#########");
        mover(j, "UDR");                 // junta el plutonio y lleva la caja a su destino (punto en el tiempo)
        assertEquals(1, j.getEstado().plutonio());
        mover(j, "URRR");                // empuja la frágil 3 veces: se rompe
        assertTrue(j.getEstado().sinSolucion());
        j.viajarEnElTiempo();
        assertFalse(j.getEstado().sinSolucion());
        assertEquals("#  F   .#", fila(j, 1)); // la frágil volvió entera y el plutonio no reaparece
        assertEquals("# @*    #", fila(j, 2));
        assertEquals(0, j.getEstado().plutonio());
        assertEquals(1, j.getEstado().viajes());
    }

    // ---------- Puntaje, victoria y Observer ----------

    @Test
    void victoriaYPuntaje() throws Exception {
        JuegoSokoban j = juego(carpeta, "######", "#@$ .#", "######");
        mover(j, "RR");
        EstadoJuego e = j.getEstado();
        assertTrue(e.completado());
        assertEquals(1000 - 5 * 2 - 2 * 2, e.puntaje());
        mover(j, "L"); // después de ganar no se puede seguir moviendo
        assertEquals(2, j.getEstado().movimientos());
    }

    @Test
    void unObservadorQuitadoNoRecibeMasAvisos() throws Exception {
        JuegoSokoban j = juego(carpeta, "######", "#@ $.#", "######");
        List<EstadoJuego> recibidos = new ArrayList<>();
        ObservadorJuego observador = recibidos::add;
        j.agregarObservador(observador);
        mover(j, "R");
        j.quitarObservador(observador);
        mover(j, "R");
        assertEquals(2, recibidos.size()); // el aviso al suscribirse y el del primer movimiento
    }

    // ---------- Archivos de nivel ----------

    @Test
    void unNivelSinJugadorOConCajasDeMasSeRechaza() {
        assertThrows(IllegalArgumentException.class, () -> new EstadoNivel(List.of("####", "#$.#", "####")));
        assertThrows(IllegalArgumentException.class, () -> new EstadoNivel(List.of("######", "#@$$.#", "######")));
    }

    @Test
    void laCantidadDeNivelesSaleDeLosArchivos() {
        assertEquals(3, new JuegoSokoban().getCantidadNiveles());
    }
}
