package sokoban.modelo.movimiento;

import sokoban.modelo.Direccion;
import sokoban.modelo.Evento;
import sokoban.modelo.entidades.Caja;

/** Patrón Mediator: el mediador. Recibe los pedidos del jugador y los avisos de las cajas. */
public interface MediadorMovimiento {

    Evento intentarMover(Direccion direccion);

    void cajaDanada(Caja caja);

    void cajaRota(Caja caja);

    void llaveEmpujada(Caja caja);
}
