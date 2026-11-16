package sokoban.modelo.estrategias;

import sokoban.modelo.entidades.Caja;
import sokoban.modelo.movimiento.MediadorMovimiento;

/** La caja normal no hace nada especial después de un empuje. */
public class CajaNormalStrategy implements ComportamientoCaja {

    @Override
    public void despuesDeEmpujar(Caja caja, MediadorMovimiento mediador) {
    }

    @Override
    public char simbolo(Caja caja) {
        return '$';
    }
}
