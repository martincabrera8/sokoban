package sokoban.modelo.movimiento;

import sokoban.modelo.Direccion;

/** MEDIATOR: el jugador solicita el movimiento sin conocer a las cajas. */
public interface MediadorMovimiento {
    boolean intentarMover(Direccion direccion);
    boolean fueEmpuje();
}
