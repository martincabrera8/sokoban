package sokoban.modelo.estrategias;

import sokoban.modelo.EstadoNivel;
import sokoban.modelo.entidades.Caja;

public class CajaNormalStrategy implements ComportamientoCaja {
    @Override
    public void despuesDeEmpujar(Caja caja, EstadoNivel estado) {
    }

    @Override
    public char simbolo(Caja caja) { return '$'; }
}
