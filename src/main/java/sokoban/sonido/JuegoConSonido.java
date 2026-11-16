package sokoban.sonido;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import javax.swing.Timer;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoJuego;
import sokoban.modelo.Juego;
import sokoban.modelo.JuegoDecorado;

/**
 * Patrón DECORATOR, decorador concreto.
 *
 * Le agrega sonido a cualquier Juego SIN modificarlo: lo "envuelve". Hereda de
 * JuegoDecorado (que le pasa cada pedido al juego real) y sobrescribe solo las
 * acciones que suenan: según lo que cambió, hace sonar el efecto que corresponde.
 *
 * La vista y el dominio no se enteran de que existe: en Main se escribe
 *     new JuegoConSonido(juegoReal)
 * en lugar de juegoReal, y nada más cambia.
 *
 * Por qué Decorator y no Observer: un observador solo se entera de los cambios que el
 * juego notifica; no vería un choque contra la pared ni un deshacer que no hizo nada.
 * El decorador ve cada pedido y su resultado.
 *
 * @author Mora Coghlan
 */
public class JuegoConSonido extends JuegoDecorado {

    /** Símbolos del tablero (los mismos que dibuja PanelTablero). */
    private static final String CAJAS_EN_DESTINO = "*GgK";
    private static final String CAJAS_FRAGILES = "FfGg";     // intacta / dañada, fuera o sobre destino
    private static final char MURO_CERRADO = 'X';            // nada puede taparla: si desaparece, se abrió
    private static final int DEMORA_DERROTA_MS = 600;

    public JuegoConSonido(Juego juego) {
        super(juego);
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
        if (sonido == Sonido.CAJA_ROTA && despues.sinSolucion()) {
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
    public void viajarEnElTiempo() {
        EstadoJuego antes = juego.getEstado();
        juego.viajarEnElTiempo();
        sonar(antes.equals(juego.getEstado()) ? Sonido.CHOQUE : Sonido.VIAJE_EN_EL_TIEMPO);
    }

    @Override
    public void reiniciar() {
        juego.reiniciar();
        sonar(Sonido.REINICIAR);
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
        if (contar(despues, MURO_CERRADO) < contar(antes, MURO_CERRADO)) {
            return Sonido.CERROJO_ABIERTO;
        }
        if (contar(despues, CAJAS_EN_DESTINO) > contar(antes, CAJAS_EN_DESTINO)) {
            return Sonido.CAJA_EN_DESTINO;
        }
        if (despues.plutonio() > antes.plutonio()) {
            return Sonido.PLUTONIO;
        }
        if (despues.empujes() > antes.empujes()) {
            boolean empujoFragil = !posiciones(despues, CAJAS_FRAGILES).equals(posiciones(antes, CAJAS_FRAGILES));
            return empujoFragil ? Sonido.CAJA_DANADA : Sonido.EMPUJE;
        }
        return Sonido.PASO;
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
