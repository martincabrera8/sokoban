package sokoban.modelo.construccion;

import sokoban.modelo.EstadoNivel;
import sokoban.modelo.Posicion;

/**
 * Patrón Builder: el builder. Declara los pasos para armar un nivel pieza por pieza.
 * El director decide el orden de los pasos; el builder concreto sabe cómo armar cada pieza.
 */
public interface ConstructorNivel {

    void empezar(int filas, int columnas);

    /** Una casilla de terreno: pared, piso, destino, hielo, cerrojo, muro o plutonio. */
    void agregarTerreno(Posicion posicion, char simbolo);

    void agregarJugador(Posicion posicion, boolean sobreDestino);

    void agregarCajaNormal(Posicion posicion, boolean sobreDestino);

    void agregarCajaFragil(Posicion posicion);

    void agregarCajaLlave(Posicion posicion);

    EstadoNivel obtenerNivel();
}
