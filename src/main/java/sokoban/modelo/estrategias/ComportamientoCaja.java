package sokoban.modelo.estrategias;

import sokoban.modelo.entidades.Caja;
import sokoban.modelo.movimiento.MediadorMovimiento;

/**
 * Patrón STRATEGY: lo que cambia entre los tipos de caja (normal, frágil, llave) es
 * qué pasa después de un empuje y cómo se dibuja. La estrategia se elige al cargar el
 * nivel y no cambia, porque una caja no cambia de tipo.
 */
public interface ComportamientoCaja {
    void despuesDeEmpujar(Caja caja, MediadorMovimiento mediador);
    char simbolo(Caja caja);
}
