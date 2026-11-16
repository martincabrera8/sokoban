package sokoban.modelo.estrategias;

import sokoban.modelo.entidades.Caja;
import sokoban.modelo.movimiento.MediadorMovimiento;

/** Caja normal: un empuje no tiene ningún efecto extra. */
public class CajaNormalStrategy implements ComportamientoCaja {
    @Override
    public void despuesDeEmpujar(Caja caja, MediadorMovimiento mediador) {
    }

    @Override
    public char simbolo(Caja caja) { return '$'; }
}
