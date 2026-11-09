package sokoban.modelo.estrategias;

import sokoban.modelo.EstadoNivel;
import sokoban.modelo.entidades.Caja;

public class CajaLlaveStrategy implements ComportamientoCaja {
    @Override
    public void despuesDeEmpujar(Caja caja, EstadoNivel estado) {
        if (estado.esCerrojo(caja.getPosicion())) {
            estado.abrirMuros();
        }
    }

    @Override
    public char simbolo(Caja caja) { return 'L'; }
}
