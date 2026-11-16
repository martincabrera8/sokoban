package sokoban.modelo.movimiento;

import sokoban.modelo.Direccion;
import sokoban.modelo.entidades.Caja;

/**
 * Patrón MEDIATOR: los colegas (Jugador y Caja) no se conocen entre sí ni tocan
 * el tablero: le avisan al mediador y él resuelve. El jugador pide moverse; una caja
 * avisa que se rompió o que la llave quedó en su lugar.
 */
public interface MediadorMovimiento {

    /** Lo pide el Jugador: moverse (y empujar, si hay una caja). */
    boolean intentarMover(Direccion direccion);

    /** Si el último movimiento empujó una caja. */
    boolean fueEmpuje();

    /** Lo avisa una caja frágil cuando se queda sin resistencia. */
    void cajaRota(Caja caja);

    /** Lo avisa una caja llave después de ser empujada: el mediador mira si quedó sobre un cerrojo. */
    void llaveEmpujada(Caja caja);
}
