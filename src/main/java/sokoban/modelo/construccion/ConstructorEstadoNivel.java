package sokoban.modelo.construccion;

import java.util.ArrayList;
import java.util.List;

import sokoban.modelo.EstadoNivel;
import sokoban.modelo.Posicion;
import sokoban.modelo.entidades.Caja;
import sokoban.modelo.entidades.Jugador;
import sokoban.modelo.estrategias.CajaFragilStrategy;
import sokoban.modelo.estrategias.CajaLlaveStrategy;
import sokoban.modelo.estrategias.CajaNormalStrategy;

/**
 * Patrón Builder: el builder concreto. Va juntando el terreno, el jugador y las cajas
 * (cada una con su estrategia) y al final entrega el EstadoNivel ya armado y validado.
 */
public class ConstructorEstadoNivel implements ConstructorNivel {

    private static final int RESISTENCIA_FRAGIL = 3;

    private char[][] terreno;
    private Jugador jugador;
    private List<Caja> cajas;

    @Override
    public void empezar(int filas, int columnas) {
        terreno = new char[filas][columnas];
        jugador = null;
        cajas = new ArrayList<>();
    }

    @Override
    public void agregarTerreno(Posicion posicion, char simbolo) {
        poner(posicion, simbolo);
    }

    @Override
    public void agregarJugador(Posicion posicion, boolean sobreDestino) {
        if (jugador != null) {
            throw new IllegalArgumentException("Más de un jugador");
        }
        jugador = new Jugador(posicion);
        poner(posicion, sobreDestino ? '.' : ' ');
    }

    @Override
    public void agregarCajaNormal(Posicion posicion, boolean sobreDestino) {
        cajas.add(new Caja(posicion, new CajaNormalStrategy(), 0));
        poner(posicion, sobreDestino ? '.' : ' ');
    }

    @Override
    public void agregarCajaFragil(Posicion posicion) {
        cajas.add(new Caja(posicion, new CajaFragilStrategy(), RESISTENCIA_FRAGIL));
        poner(posicion, ' ');
    }

    @Override
    public void agregarCajaLlave(Posicion posicion) {
        cajas.add(new Caja(posicion, new CajaLlaveStrategy(), 0));
        poner(posicion, ' ');
    }

    @Override
    public EstadoNivel obtenerNivel() {
        if (jugador == null) {
            throw new IllegalArgumentException("Falta el jugador");
        }
        int destinos = contarDestinos();
        if (destinos == 0 || destinos != cajas.size()) {
            throw new IllegalArgumentException("Tiene que haber una caja por cada destino");
        }
        return new EstadoNivel(terreno, jugador, cajas);
    }

    private void poner(Posicion posicion, char simbolo) {
        terreno[posicion.fila()][posicion.columna()] = simbolo;
    }

    private int contarDestinos() {
        int destinos = 0;
        for (char[] fila : terreno) {
            for (char casilla : fila) {
                if (casilla == '.') {
                    destinos++;
                }
            }
        }
        return destinos;
    }
}
