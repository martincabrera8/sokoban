package sokoban.modelo.movimiento;

import java.util.List;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoNivel;
import sokoban.modelo.Evento;
import sokoban.modelo.Posicion;
import sokoban.modelo.entidades.Caja;
import sokoban.modelo.entidades.Jugador;

/**
 * Patrón Mediator: el mediador concreto. Resuelve todo lo que pasa cuando el jugador
 * se mueve: choques, empujes, hielo, cajas que se dañan o se rompen y cerrojos.
 */
public class MotorMovimiento implements MediadorMovimiento {

    private final EstadoNivel nivel;
    private final Jugador jugador;
    private final List<Caja> cajas;
    private Evento evento;

    public MotorMovimiento(EstadoNivel nivel) {
        this.nivel = nivel;
        this.jugador = nivel.getJugador();
        this.cajas = nivel.getCajas();
    }

    @Override
    public Evento intentarMover(Direccion direccion) {
        Posicion siguiente = jugador.getPosicion().siguiente(direccion);
        Caja caja = cajaEn(siguiente);

        if (caja == null) {
            if (!estaLibre(siguiente)) {
                return Evento.CHOQUE;
            }
            evento = Evento.PASO;
        } else {
            Posicion destino = siguiente.siguiente(direccion);
            if (!estaLibre(destino)) {
                return Evento.CHOQUE;
            }
            evento = Evento.EMPUJE;
            caja.setPosicion(deslizar(destino, direccion));
            caja.despuesDeEmpujar();
        }

        jugador.setPosicion(siguiente);
        nivel.contarMovimiento(caja != null);
        if (nivel.recogerPlutonio(siguiente) && (evento == Evento.PASO || evento == Evento.EMPUJE)) {
            evento = Evento.PLUTONIO;
        }
        return evento;
    }

    /** Libre: se puede pisar y no hay ni una caja ni el jugador. */
    private boolean estaLibre(Posicion posicion) {
        return nivel.esTransitable(posicion) && cajaEn(posicion) == null
                && !jugador.getPosicion().equals(posicion);
    }

    private Caja cajaEn(Posicion posicion) {
        for (Caja caja : cajas) {
            if (caja.getPosicion().equals(posicion)) {
                return caja;
            }
        }
        return null;
    }

    /** En el hielo la caja sigue de largo hasta el primer piso normal o un obstáculo. */
    private Posicion deslizar(Posicion destino, Direccion direccion) {
        while (nivel.esHielo(destino) && estaLibre(destino.siguiente(direccion))) {
            destino = destino.siguiente(direccion);
        }
        return destino;
    }

    @Override
    public void cajaDanada(Caja caja) {
        evento = Evento.CAJA_DANADA;
    }

    @Override
    public void cajaRota(Caja caja) {
        nivel.quitarCaja(caja);
        evento = Evento.CAJA_ROTA;
    }

    @Override
    public void llaveEmpujada(Caja caja) {
        if (nivel.esCerrojo(caja.getPosicion())) {
            nivel.abrirMuros();
            evento = Evento.CERROJO_ABIERTO;
        }
    }
}
