package sokoban.modelo;

import java.util.ArrayList;
import java.util.List;
import sokoban.modelo.entidades.Caja;
import sokoban.modelo.entidades.Jugador;
import sokoban.modelo.estrategias.CajaFragilStrategy;
import sokoban.modelo.estrategias.CajaLlaveStrategy;
import sokoban.modelo.estrategias.CajaNormalStrategy;

/** Estado interno: terreno + entidades. No depende de Swing. */
public class EstadoNivel {
    private final char[][] terreno;
    private final Jugador jugador;
    private final List<Caja> cajas;
    private final int cantidadDestinos;

    public EstadoNivel(List<String> lineas) {
        if (lineas.isEmpty()) throw new IllegalArgumentException("Nivel vacio");
        int ancho = lineas.get(0).length();
        terreno = new char[lineas.size()][ancho];
        cajas = new ArrayList<>();
        Jugador encontrado = null;
        int destinos = 0;

        for (int f = 0; f < lineas.size(); f++) {
            if (lineas.get(f).length() != ancho) {
                throw new IllegalArgumentException("Filas de distinto ancho en fila " + f);
            }
            for (int c = 0; c < ancho; c++) {
                char s = lineas.get(f).charAt(c);
                Posicion p = new Posicion(f, c);
                switch (s) {
                    case '#', ' ', '.', '~', 'C', 'X', 'O', 'P' -> terreno[f][c] = s;
                    case '@', '+' -> {
                        if (encontrado != null) throw new IllegalArgumentException("Mas de un jugador");
                        encontrado = new Jugador(p);
                        terreno[f][c] = (s == '+') ? '.' : ' ';
                    }
                    case '$', '*' -> {
                        cajas.add(new Caja(p, new CajaNormalStrategy(), 0));
                        terreno[f][c] = (s == '*') ? '.' : ' ';
                    }
                    case 'F' -> {
                        cajas.add(new Caja(p, new CajaFragilStrategy(), 3));
                        terreno[f][c] = ' ';
                    }
                    case 'L' -> {
                        cajas.add(new Caja(p, new CajaLlaveStrategy(), 0));
                        terreno[f][c] = ' ';
                    }
                    default -> throw new IllegalArgumentException("Simbolo desconocido: " + s);
                }
                if (terreno[f][c] == '.') destinos++;
            }
        }
        if (encontrado == null) throw new IllegalArgumentException("Falta el jugador");
        if (destinos != cajas.size() || destinos == 0) {
            throw new IllegalArgumentException("Debe haber una caja por cada destino");
        }
        jugador = encontrado;
        cantidadDestinos = destinos;
    }

    private EstadoNivel(char[][] terreno, Jugador jugador, List<Caja> cajas, int cantidadDestinos) {
        this.terreno = terreno;
        this.jugador = jugador;
        this.cajas = cajas;
        this.cantidadDestinos = cantidadDestinos;
    }

    public Jugador getJugador() { return jugador; }

    public Caja cajaEn(Posicion posicion) {
        for (Caja caja : cajas) {
            if (caja.getPosicion().equals(posicion)) return caja;
        }
        return null;
    }

    private boolean dentro(Posicion p) {
        return p.fila() >= 0 && p.fila() < terreno.length
                && p.columna() >= 0 && p.columna() < terreno[0].length;
    }

    public boolean estaLibre(Posicion p) {
        if (!dentro(p)) return false;
        char s = terreno[p.fila()][p.columna()];
        return s != '#' && s != 'X' && cajaEn(p) == null
                && !jugador.getPosicion().equals(p);
    }

    public boolean esHielo(Posicion p) {
        return dentro(p) && terreno[p.fila()][p.columna()] == '~';
    }

    public boolean esCerrojo(Posicion p) {
        return dentro(p) && terreno[p.fila()][p.columna()] == 'C';
    }

    public void abrirMuros() {
        for (int f = 0; f < terreno.length; f++) {
            for (int c = 0; c < terreno[f].length; c++) {
                if (terreno[f][c] == 'X') terreno[f][c] = 'O';
                if (terreno[f][c] == 'C') terreno[f][c] = 'c';
            }
        }
    }

    public void quitarCaja(Caja caja) { cajas.remove(caja); }

    /** DeLorean: si en esa casilla hay plutonio ('P'), el jugador lo junta y desaparece. */
    public boolean recogerPlutonio(Posicion p) {
        if (!dentro(p) || terreno[p.fila()][p.columna()] != 'P') return false;
        terreno[p.fila()][p.columna()] = ' ';
        return true;
    }

    /** DeLorean: el plutonio que ya se juntó en el presente no vuelve a aparecer en el pasado. */
    public void conservarPlutonioRecogido(EstadoNivel presente) {
        for (int f = 0; f < terreno.length; f++) {
            for (int c = 0; c < terreno[f].length; c++) {
                if (terreno[f][c] == 'P' && presente.terreno[f][c] != 'P') terreno[f][c] = ' ';
            }
        }
    }

    public int cajasEnDestino() {
        int cantidad = 0;
        for (Caja caja : cajas) {
            Posicion p = caja.getPosicion();
            if (terreno[p.fila()][p.columna()] == '.') cantidad++;
        }
        return cantidad;
    }

    public boolean estaCompleto() {
        if (cajas.size() != cantidadDestinos) return false;
        for (Caja caja : cajas) {
            Posicion p = caja.getPosicion();
            if (terreno[p.fila()][p.columna()] != '.') return false;
        }
        return true;
    }

    /** Traduce el estado al formato de caracteres que entiende PanelTablero. */
    public List<String> tableroParaVista() {
        char[][] dibujo = copiarTerreno();
        for (Caja caja : cajas) {
            Posicion p = caja.getPosicion();
            char s = caja.getSimbolo();
            if (dibujo[p.fila()][p.columna()] == '.') {
                s = switch (s) {
                    case '$' -> '*';
                    case 'F' -> 'G';
                    case 'f' -> 'g';
                    case 'L' -> 'K';
                    default -> s;
                };
            }
            dibujo[p.fila()][p.columna()] = s;
        }
        Posicion p = jugador.getPosicion();
        dibujo[p.fila()][p.columna()] = dibujo[p.fila()][p.columna()] == '.' ? '+' : '@';
        List<String> resultado = new ArrayList<>();
        for (char[] fila : dibujo) resultado.add(new String(fila));
        return resultado;
    }

    private char[][] copiarTerreno() {
        char[][] copia = new char[terreno.length][];
        for (int i = 0; i < terreno.length; i++) copia[i] = terreno[i].clone();
        return copia;
    }

    /** Copia profunda del estado mutable para restaurarlo con Undo. */
    public EstadoNivel copiar() {
        List<Caja> copiaCajas = new ArrayList<>();
        for (Caja caja : cajas) copiaCajas.add(caja.copiar());
        return new EstadoNivel(copiarTerreno(), new Jugador(jugador.getPosicion()),
                copiaCajas, cantidadDestinos);
    }
}
