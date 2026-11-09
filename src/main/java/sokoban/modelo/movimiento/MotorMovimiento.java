package sokoban.modelo.movimiento;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoNivel;
import sokoban.modelo.Posicion;
import sokoban.modelo.entidades.Caja;
import sokoban.modelo.entidades.Jugador;

/** MEDIATOR concreto: concentra colisiones, empujes y deslizamiento. */
public class MotorMovimiento implements MediadorMovimiento {
    private final EstadoNivel estado;
    private boolean empuje;

    public MotorMovimiento(EstadoNivel estado) { this.estado = estado; }

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
        caja.despuesDeEmpujar(estado); // STRATEGY: fragil o llave aplican su efecto.
        jugador.setPosicion(siguiente);
        empuje = true;
        return true;
    }

    @Override
    public boolean fueEmpuje() { return empuje; }
}
