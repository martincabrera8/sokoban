package sokoban.modelo.estrategias;

import sokoban.modelo.entidades.Caja;
import sokoban.modelo.movimiento.MediadorMovimiento;

/** La caja frágil pierde resistencia en cada empuje y, cuando llega a cero, se rompe. */
public class CajaFragilStrategy implements ComportamientoCaja {

    @Override
    public void despuesDeEmpujar(Caja caja, MediadorMovimiento mediador) {
        caja.quitarResistencia();
        if (caja.getResistencia() > 0) {
            mediador.cajaDanada(caja);
        } else {
            mediador.cajaRota(caja);
        }
    }

    @Override
    public char simbolo(Caja caja) {
        return caja.getResistencia() == 1 ? 'f' : 'F';
    }
}
