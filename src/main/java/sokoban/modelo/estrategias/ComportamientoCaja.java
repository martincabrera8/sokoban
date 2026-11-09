package sokoban.modelo.estrategias;

import sokoban.modelo.EstadoNivel;
import sokoban.modelo.entidades.Caja;

public interface ComportamientoCaja {
    void despuesDeEmpujar(Caja caja, EstadoNivel estado);
    char simbolo(Caja caja);
}
