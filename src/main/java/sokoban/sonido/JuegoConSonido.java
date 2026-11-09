package sokoban.sonido;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.swing.Timer;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoJuego;
import sokoban.modelo.Juego;
import sokoban.modelo.ObservadorJuego;

/**
 * Patrón Decorator.
 *
 * Le agrega sonido a cualquier Juego SIN modificarlo: lo "envuelve".
 * Implementa la misma interfaz Juego, le pasa cada pedido al juego real y,
 * según lo que cambió, hace sonar el efecto que corresponde.
 *
 * La vista y el dominio no se enteran de que existe: en Main se escribe
 *     new JuegoConSonido(juegoReal)
 * en lugar de juegoReal, y nada más cambia.
 *
 * @author Marcelo Coghlan
 */
public class JuegoConSonido implements Juego {

    /** Símbolos del tablero (los mismos que dibuja PanelTablero). */
    private static final String CAJAS = "$*FfGgLK";          // todas las cajas
    private static final String DESTINOS = ".+*GgK";         // destinos libres u ocupados
    private static final String CAJAS_EN_DESTINO = "*GgK";
    private static final String CAJAS_FRAGILES = "FfGg";     // intacta / dañada, fuera o sobre destino
    private static final String ABIERTOS = "Oc";             // muro abierto, cerrojo abierto
    private static final char MURO_CERRADO = 'X';
    private static final int DEMORA_DERROTA_MS = 600;

    private final Juego juego;

    public JuegoConSonido(Juego juego) {
        this.juego = juego;
    }

    // ---------- Acciones con sonido ----------

    @Override
    public void iniciarNivel(int numero) {
        juego.iniciarNivel(numero);
        sonar(Sonido.INICIO_NIVEL);
    }

    @Override
    public void mover(Direccion direccion) {
        EstadoJuego antes = juego.getEstado();
        juego.mover(direccion);
        EstadoJuego despues = juego.getEstado();
        if (antes.equals(despues)) {
            sonar(Sonido.CHOQUE);          // pared, caja trabada: no se pudo mover
            return;
        }
        Sonido sonido = queSonidoCorresponde(antes, despues);
        sonar(sonido);
        if (sonido == Sonido.CAJA_ROTA && quedoSinSolucion(despues)) {
            sonarMasTarde(Sonido.DERROTA);
        }
    }

    @Override
    public void deshacer() {
        EstadoJuego antes = juego.getEstado();
        juego.deshacer();
        sonar(antes.equals(juego.getEstado()) ? Sonido.CHOQUE : Sonido.DESHACER);
    }

    @Override
    public void reiniciar() {
        juego.reiniciar();
        sonar(Sonido.REINICIAR);
    }

    // ---------- Sin sonido: se delegan tal cual ----------

    @Override
    public int getCantidadNiveles() {
        return juego.getCantidadNiveles();
    }

    @Override
    public EstadoJuego getEstado() {
        return juego.getEstado();
    }

    @Override
    public void agregarObservador(ObservadorJuego observador) {
        juego.agregarObservador(observador);
    }

    // ---------- Qué pasó en un movimiento ----------

    /**
     * Compara el tablero antes y después de un movimiento. Si pasaron varias cosas
     * a la vez, gana la más importante (por eso el orden de los if).
     */
    static Sonido queSonidoCorresponde(EstadoJuego antes, EstadoJuego despues) {
        if (despues.completado() && !antes.completado()) {
            return Sonido.VICTORIA;
        }
        if (contar(despues, CAJAS_FRAGILES) < contar(antes, CAJAS_FRAGILES)) {
            return Sonido.CAJA_ROTA;
        }
        if (contar(despues, ABIERTOS) > contar(antes, ABIERTOS)
                || contar(despues, MURO_CERRADO) < contar(antes, MURO_CERRADO)) {
            return Sonido.CERROJO_ABIERTO;
        }
        if (contar(despues, CAJAS_EN_DESTINO) > contar(antes, CAJAS_EN_DESTINO)) {
            return Sonido.CAJA_EN_DESTINO;
        }
        if (despues.empujes() > antes.empujes()) {
            boolean empujoFragil = !posiciones(despues, CAJAS_FRAGILES).equals(posiciones(antes, CAJAS_FRAGILES));
            return empujoFragil ? Sonido.CAJA_DANADA : Sonido.EMPUJE;
        }
        return Sonido.PASO;
    }

    /** "Perder": se rompió una caja y ya no alcanzan las cajas para cubrir todos los destinos. */
    static boolean quedoSinSolucion(EstadoJuego estado) {
        return contar(estado, CAJAS) < contar(estado, DESTINOS);
    }

    private static void sonar(Sonido sonido) {
        Sonidos.obtenerInstancia().reproducir(sonido);
    }

    private static void sonarMasTarde(Sonido sonido) {
        Timer timer = new Timer(DEMORA_DERROTA_MS, evento -> sonar(sonido));
        timer.setRepeats(false);
        timer.start();
    }

    private static int contar(EstadoJuego estado, char simbolo) {
        return contar(estado, String.valueOf(simbolo));
    }

    private static int contar(EstadoJuego estado, String simbolos) {
        int cantidad = 0;
        for (String linea : estado.tablero()) {
            for (char celda : linea.toCharArray()) {
                if (simbolos.indexOf(celda) >= 0) {
                    cantidad++;
                }
            }
        }
        return cantidad;
    }

    private static Set<Integer> posiciones(EstadoJuego estado, String simbolos) {
        Set<Integer> resultado = new HashSet<>();
        List<String> tablero = estado.tablero();
        for (int fila = 0; fila < tablero.size(); fila++) {
            String linea = tablero.get(fila);
            for (int columna = 0; columna < linea.length(); columna++) {
                if (simbolos.indexOf(linea.charAt(columna)) >= 0) {
                    resultado.add(fila * 1000 + columna);
                }
            }
        }
        return resultado;
    }
}
