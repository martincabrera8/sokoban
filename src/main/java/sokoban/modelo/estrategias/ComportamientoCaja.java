package sokoban.modelo.estrategias;

import sokoban.modelo.entidades.Caja;
import sokoban.modelo.movimiento.MediadorMovimiento;

/** Patrón Strategy: la estrategia. Qué hace cada tipo de caja después de un empuje. */
public interface ComportamientoCaja {

    void despuesDeEmpujar(Caja caja, MediadorMovimiento mediador);

    char simbolo(Caja caja);
}
