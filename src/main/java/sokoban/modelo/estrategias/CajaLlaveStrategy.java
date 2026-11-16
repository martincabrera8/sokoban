package sokoban.modelo.estrategias;

import sokoban.modelo.entidades.Caja;
import sokoban.modelo.movimiento.MediadorMovimiento;

/** La caja llave avisa que se movió: si quedó sobre el cerrojo, se abren los muros. */
public class CajaLlaveStrategy implements ComportamientoCaja {

    @Override
    public void despuesDeEmpujar(Caja caja, MediadorMovimiento mediador) {
        mediador.llaveEmpujada(caja);
    }

    @Override
    public char simbolo(Caja caja) {
        return 'L';
    }
}
