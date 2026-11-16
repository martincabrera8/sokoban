package sokoban.modelo.movimiento;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoNivel;
import sokoban.modelo.Posicion;
import sokoban.modelo.entidades.Caja;
import sokoban.modelo.entidades.Jugador;

/**
 * MEDIATOR concreto: concentra colisiones, empujes, deslizamiento en el hielo y los
 * efectos de las cajas especiales. Es el único que modifica el tablero por un movimiento.
 */
public class MotorMovimiento implements MediadorMovimiento {
    private final EstadoNivel estado;
    private boolean empuje;

    /** Se conecta con todos sus colegas: el jugador y cada caja del nivel. */
    public MotorMovimiento(EstadoNivel estado) {
        this.estado = estado;
        estado.conectarColegas(this);
    }

    @Override
    public boolean intentarMover(Direccion direccion) {
        empuje = false;
        Jugador jugador = estado.getJugador();
        Posicion siguiente = jugador.getPosicion().siguiente(direccion);
        Caja caja = estado.cajaEn(siguiente);

        if (caja == null) {
            if (!estado.estaLibre(siguiente)) return false;
            jugador.setPosicion(siguiente);
            return true;
        }

        Posicion destinoCaja = siguiente.siguiente(direccion);
        if (!estado.estaLibre(destinoCaja)) return false; // Ni pared ni segunda caja.

        // Si entra al hielo, sigue hasta el primer piso normal o un obstaculo.
        while (estado.esHielo(destinoCaja)
                && estado.estaLibre(destinoCaja.siguiente(direccion))) {
            destinoCaja = destinoCaja.siguiente(direccion);
        }

        caja.setPosicion(destinoCaja);
        caja.despuesDeEmpujar(); // STRATEGY: la frágil o la llave avisan su efecto al mediador.
        jugador.setPosicion(siguiente);
        empuje = true;
        return true;
    }

    @Override
    public boolean fueEmpuje() { return empuje; }

    @Override
    public void cajaRota(Caja caja) {
        estado.quitarCaja(caja);
    }

    @Override
    public void llaveEmpujada(Caja caja) {
        if (estado.esCerrojo(caja.getPosicion())) {
            estado.abrirMuros();
        }
    }
}
