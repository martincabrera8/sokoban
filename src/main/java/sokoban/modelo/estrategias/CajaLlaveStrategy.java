package sokoban.modelo.estrategias;

import sokoban.modelo.entidades.Caja;
import sokoban.modelo.movimiento.MediadorMovimiento;

/** Caja llave: después de cada empuje avisa al mediador, que abre los muros si quedó sobre el cerrojo. */
public class CajaLlaveStrategy implements ComportamientoCaja {
    @Override
    public void despuesDeEmpujar(Caja caja, MediadorMovimiento mediador) {
        mediador.llaveEmpujada(caja);
    }

    @Override
    public char simbolo(Caja caja) { return 'L'; }
}
