package sokoban.prueba;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoJuego;
import sokoban.modelo.Juego;
import sokoban.modelo.ObservadorJuego;

/**
 * PROVISORIO: ejemplo acotado de Juego (3 niveles chicos, uno por época) solo para ver cómo
 * reacciona la interfaz. No es parte del trabajo de la interfaz: lo reemplaza el
 * controlador del dominio que hace el resto del equipo.
 * Solo maneja paredes, pisos, destinos y cajas normales.
 */
public class JuegoDePrueba implements Juego {

    private static final List<List<String>> NIVELES = List.of(
            List.of("#######",
                    "#     #",
                    "# @$ .#",
                    "#     #",
                    "#######"),
            List.of("#######",
                    "#.    #",
                    "#  #  #",
                    "# $#  #",
                    "#  @  #",
                    "#######"),
            List.of("########",
                    "#  .   #",
                    "# $##$ #",
                    "#   @ .#",
                    "########"));

    private static final char PARED = '#';
    private static final char PISO = ' ';
    private static final char CAJA = '$';
    private static final char DESTINO = '.';
    private static final char CAJA_EN_DESTINO = '*';
    private static final char JUGADOR = '@';
    private static final char JUGADOR_EN_DESTINO = '+';
    private static final int PASOS_POR_UNDO = 5;
    private static final int PUNTAJE_MAXIMO = 1000;
    private static final int COSTO_MOVIMIENTO = 10;
    private static final int COSTO_EMPUJE = 5;
    private static final int COSTO_UNDO = 50;

    private final List<ObservadorJuego> observadores = new ArrayList<>();
    private final Deque<Foto> historial = new ArrayDeque<>();
    private int nivel;
    private char[][] celdas;
    private boolean[][] destinos;
    private int filaJugador;
    private int columnaJugador;
    private int movimientos;
    private int empujes;
    private int undosUsados;

    @Override
    public int getCantidadNiveles() {
        return NIVELES.size();
    }

    @Override
    public void iniciarNivel(int numero) {
        nivel = numero;
        List<String> mapa = NIVELES.get(numero - 1);
        celdas = new char[mapa.size()][];
        destinos = new boolean[mapa.size()][];
        for (int fila = 0; fila < mapa.size(); fila++) {
            String linea = mapa.get(fila);
            celdas[fila] = new char[linea.length()];
            destinos[fila] = new boolean[linea.length()];
            for (int columna = 0; columna < linea.length(); columna++) {
                leerSimbolo(linea.charAt(columna), fila, columna);
            }
        }
        movimientos = 0;
        empujes = 0;
        undosUsados = 0;
        historial.clear();
        notificar();
    }

    @Override
    public void mover(Direccion direccion) {
        int fila = filaJugador + direccion.getDeltaFila();
        int columna = columnaJugador + direccion.getDeltaColumna();
        int filaCaja = fila + direccion.getDeltaFila();
        int columnaCaja = columna + direccion.getDeltaColumna();
        boolean empuja = celdas[fila][columna] == CAJA;
        boolean bloqueado = celdas[fila][columna] == PARED || (empuja && celdas[filaCaja][columnaCaja] != PISO);
        if (estaCompleto() || bloqueado) {
            return;
        }
        historial.push(new Foto(copiar(celdas), filaJugador, columnaJugador, movimientos, empujes));
        if (empuja) {
            celdas[fila][columna] = PISO;
            celdas[filaCaja][columnaCaja] = CAJA;
            empujes++;
        }
        filaJugador = fila;
        columnaJugador = columna;
        movimientos++;
        notificar();
    }

    @Override
    public void deshacer() {
        if (historial.isEmpty() || estaCompleto()) {
            return;
        }
        Foto foto = historial.pop();
        for (int paso = 1; paso < PASOS_POR_UNDO && !historial.isEmpty(); paso++) {
            foto = historial.pop();
        }
        celdas = foto.celdas();
        filaJugador = foto.filaJugador();
        columnaJugador = foto.columnaJugador();
        movimientos = foto.movimientos();
        empujes = foto.empujes();
        undosUsados++;
        notificar();
    }

    @Override
    public void reiniciar() {
        iniciarNivel(nivel);
    }

    @Override
    public EstadoJuego getEstado() {
        int puntaje = Math.max(0, PUNTAJE_MAXIMO - movimientos * COSTO_MOVIMIENTO
                - empujes * COSTO_EMPUJE - undosUsados * COSTO_UNDO);
        return new EstadoJuego(nivel, movimientos, empujes, undosUsados, puntaje, estaCompleto(), dibujarTablero());
    }

    @Override
    public void agregarObservador(ObservadorJuego observador) {
        observadores.add(observador);
    }

    private void notificar() {
        EstadoJuego estado = getEstado();
        observadores.forEach(observador -> observador.actualizar(estado));
    }

    private void leerSimbolo(char simbolo, int fila, int columna) {
        destinos[fila][columna] = simbolo == DESTINO || simbolo == CAJA_EN_DESTINO || simbolo == JUGADOR_EN_DESTINO;
        if (simbolo == JUGADOR || simbolo == JUGADOR_EN_DESTINO) {
            filaJugador = fila;
            columnaJugador = columna;
        }
        if (simbolo == PARED) {
            celdas[fila][columna] = PARED;
        } else if (simbolo == CAJA || simbolo == CAJA_EN_DESTINO) {
            celdas[fila][columna] = CAJA;
        } else {
            celdas[fila][columna] = PISO;
        }
    }

    private boolean estaCompleto() {
        for (int fila = 0; fila < celdas.length; fila++) {
            for (int columna = 0; columna < celdas[fila].length; columna++) {
                if (celdas[fila][columna] == CAJA && !destinos[fila][columna]) {
                    return false;
                }
            }
        }
        return true;
    }

    private List<String> dibujarTablero() {
        List<String> lineas = new ArrayList<>();
        for (int fila = 0; fila < celdas.length; fila++) {
            StringBuilder linea = new StringBuilder();
            for (int columna = 0; columna < celdas[fila].length; columna++) {
                linea.append(simbolo(fila, columna));
            }
            lineas.add(linea.toString());
        }
        return lineas;
    }

    private char simbolo(int fila, int columna) {
        boolean destino = destinos[fila][columna];
        if (fila == filaJugador && columna == columnaJugador) {
            return destino ? JUGADOR_EN_DESTINO : JUGADOR;
        }
        if (celdas[fila][columna] == CAJA) {
            return destino ? CAJA_EN_DESTINO : CAJA;
        }
        return destino ? DESTINO : celdas[fila][columna];
    }

    private static char[][] copiar(char[][] origen) {
        char[][] copia = new char[origen.length][];
        for (int fila = 0; fila < origen.length; fila++) {
            copia[fila] = origen[fila].clone();
        }
        return copia;
    }

    /** Foto del nivel para poder deshacer. */
    private record Foto(char[][] celdas, int filaJugador, int columnaJugador, int movimientos, int empujes) {
    }
}
