package sokoban.modelo.estrategias;

import sokoban.modelo.EstadoNivel;
import sokoban.modelo.entidades.Caja;

public class CajaFragilStrategy implements ComportamientoCaja {
    @Override
    public void despuesDeEmpujar(Caja caja, EstadoNivel estado) {
        caja.quitarResistencia();
        if (caja.getResistencia() <= 0) {
            estado.quitarCaja(caja);
        }
    }

    @Override
    public char simbolo(Caja caja) {
        return caja.getResistencia() == 1 ? 'f' : 'F';
    }
}
