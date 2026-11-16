package sokoban.modelo.estrategias;

import sokoban.modelo.entidades.Caja;
import sokoban.modelo.movimiento.MediadorMovimiento;

/** Caja frágil: cada empuje le quita resistencia; sin resistencia se rompe. */
public class CajaFragilStrategy implements ComportamientoCaja {
    @Override
    public void despuesDeEmpujar(Caja caja, MediadorMovimiento mediador) {
        caja.quitarResistencia();
        if (caja.getResistencia() <= 0) {
            mediador.cajaRota(caja);
        }
    }

    @Override
    public char simbolo(Caja caja) {
        return caja.getResistencia() == 1 ? 'f' : 'F';
    }
}
