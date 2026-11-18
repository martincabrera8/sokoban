package sokoban.modelo;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import sokoban.modelo.entidades.Caja;
import sokoban.modelo.entidades.Jugador;
import sokoban.modelo.movimiento.MediadorMovimiento;

/**
 * El nivel que se está jugando: el terreno, el jugador, las cajas y sus contadores.
 * Es el originador del patrón Memento: sabe guardarse en un RecuerdoNivel y volver a él.
 */
public class EstadoNivel {

    private char[][] terreno;
    private final Jugador jugador;
    private final List<Caja> cajas = new ArrayList<>();
    private final int cantidadDestinos;
    private int movimientos;
    private int empujes;
    private int plutonio;
    private MediadorMovimiento mediador;

    /** Lo usa el builder (ConstructorEstadoNivel) cuando ya juntó todas las piezas. */
    public EstadoNivel(char[][] terreno, Jugador jugador, List<Caja> cajas) {
        this.terreno = terreno;
        this.jugador = jugador;
        this.cajas.addAll(cajas);
        this.cantidadDestinos = cajas.size();
    }

    // ---------- Mediator ----------

    /** Conecta el mediador con el jugador y con cada caja. */
    public void conectarMediador(MediadorMovimiento mediador) {
        this.mediador = mediador;
        jugador.conectar(mediador);
        for (Caja caja : cajas) {
            caja.conectar(mediador);
        }
    }

    // ---------- Consultas del mediador ----------

    public Jugador getJugador() {
        return jugador;
    }

    /** Las cajas del nivel (solo lectura). Es siempre la misma lista, aunque se restaure el nivel. */
    public List<Caja> getCajas() {
        return Collections.unmodifiableList(cajas);
    }

    /** El jugador le pide el movimiento al mediador; el nivel solo se lo pasa. */
    public Evento moverJugador(Direccion direccion) {
        return jugador.mover(direccion);
    }

    /** Si se puede pisar el terreno: dentro del tablero y sin pared ni muro cerrado. */
    public boolean esTransitable(Posicion posicion) {
        if (!dentro(posicion)) {
            return false;
        }
        char casilla = casilla(posicion);
        return casilla != '#' && casilla != 'X';
    }

    public boolean esHielo(Posicion posicion) {
        return dentro(posicion) && casilla(posicion) == '~';
    }

    public boolean esCerrojo(Posicion posicion) {
        return dentro(posicion) && casilla(posicion) == 'C';
    }

    // ---------- Cambios que hace el mediador ----------

    /** La llave en el cerrojo abre todos los muros del nivel. */
    public void abrirMuros() {
        for (char[] fila : terreno) {
            for (int columna = 0; columna < fila.length; columna++) {
                if (fila[columna] == 'X') {
                    fila[columna] = 'O';
                } else if (fila[columna] == 'C') {
                    fila[columna] = 'c';
                }
            }
        }
    }

    public void quitarCaja(Caja caja) {
        cajas.remove(caja);
    }

    public void contarMovimiento(boolean fueEmpuje) {
        movimientos++;
        if (fueEmpuje) {
            empujes++;
        }
    }

    /** Si en esa casilla hay plutonio, el jugador lo junta. */
    public boolean recogerPlutonio(Posicion posicion) {
        if (casilla(posicion) != 'P') {
            return false;
        }
        terreno[posicion.fila()][posicion.columna()] = ' ';
        plutonio++;
        return true;
    }

    public void gastarPlutonio() {
        plutonio--;
    }

    // ---------- Reglas ----------

    public int cajasEnDestino() {
        int cantidad = 0;
        for (Caja caja : cajas) {
            if (casilla(caja.getPosicion()) == '.') {
                cantidad++;
            }
        }
        return cantidad;
    }

    public boolean estaCompleto() {
        return cajas.size() == cantidadDestinos && cajasEnDestino() == cantidadDestinos;
    }

    /** Se rompió una caja frágil y ya no alcanzan las cajas para todos los destinos. */
    public boolean sinSolucion() {
        return cajas.size() < cantidadDestinos;
    }

    public int getMovimientos() {
        return movimientos;
    }

    public int getEmpujes() {
        return empujes;
    }

    public int getPlutonio() {
        return plutonio;
    }

    // ---------- Memento ----------

    public RecuerdoNivel crearRecuerdo() {
        return new RecuerdoNivel(copiar(terreno), jugador.getPosicion(), copiar(cajas),
                movimientos, empujes, plutonio);
    }

    public void restaurar(RecuerdoNivel recuerdo) {
        terreno = copiar(recuerdo.terreno());
        jugador.setPosicion(recuerdo.posicionJugador());
        cajas.clear();
        cajas.addAll(copiar(recuerdo.cajas()));
        movimientos = recuerdo.movimientos();
        empujes = recuerdo.empujes();
        plutonio = recuerdo.plutonio();
        if (mediador != null) {
            conectarMediador(mediador);
        }
    }

    /**
     * El DeLorean vuelve a un punto del pasado, pero el plutonio ya juntado
     * no reaparece y las cargas que tenía siguen siendo las mismas.
     */
    public void viajarA(RecuerdoNivel punto) {
        char[][] presente = copiar(terreno);
        int cargas = plutonio;
        restaurar(punto);
        for (int fila = 0; fila < terreno.length; fila++) {
            for (int columna = 0; columna < terreno[fila].length; columna++) {
                if (terreno[fila][columna] == 'P' && presente[fila][columna] != 'P') {
                    terreno[fila][columna] = ' ';
                }
            }
        }
        plutonio = cargas;
    }

    // ---------- Vista ----------

    /** El tablero como texto, con las letras que dibuja PanelTablero. */
    public List<String> tableroParaVista() {
        char[][] dibujo = copiar(terreno);
        for (Caja caja : cajas) {
            Posicion p = caja.getPosicion();
            boolean sobreDestino = dibujo[p.fila()][p.columna()] == '.';
            dibujo[p.fila()][p.columna()] = sobreDestino ? sobreDestino(caja.getSimbolo()) : caja.getSimbolo();
        }
        Posicion p = jugador.getPosicion();
        dibujo[p.fila()][p.columna()] = dibujo[p.fila()][p.columna()] == '.' ? '+' : '@';
        List<String> filas = new ArrayList<>();
        for (char[] fila : dibujo) {
            filas.add(new String(fila));
        }
        return filas;
    }

    private static char sobreDestino(char simbolo) {
        return switch (simbolo) {
            case '$' -> '*';
            case 'F' -> 'G';
            case 'f' -> 'g';
            case 'L' -> 'K';
            default -> simbolo;
        };
    }

    // ---------- Auxiliares ----------

    private boolean dentro(Posicion p) {
        return p.fila() >= 0 && p.fila() < terreno.length
                && p.columna() >= 0 && p.columna() < terreno[0].length;
    }

    private char casilla(Posicion p) {
        return terreno[p.fila()][p.columna()];
    }

    private static char[][] copiar(char[][] original) {
        char[][] copia = new char[original.length][];
        for (int i = 0; i < original.length; i++) {
            copia[i] = original[i].clone();
        }
        return copia;
    }

    private static List<Caja> copiar(List<Caja> original) {
        List<Caja> copia = new ArrayList<>();
        for (Caja caja : original) {
            copia.add(caja.copiar());
        }
        return copia;
    }
}
