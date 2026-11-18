package sokoban.modelo.construccion;

import java.util.List;

import sokoban.modelo.Posicion;

/**
 * Patrón Builder: el director. Recorre el texto del nivel, una letra por casilla,
 * y le pide al builder el paso que corresponde a cada letra. No sabe cómo se arma
 * cada pieza: eso lo resuelve el builder.
 */
public class DirectorNivel {

    private final ConstructorNivel constructor;

    public DirectorNivel(ConstructorNivel constructor) {
        this.constructor = constructor;
    }

    public void construir(List<String> lineas) {
        if (lineas.isEmpty()) {
            throw new IllegalArgumentException("Nivel vacío");
        }
        int ancho = lineas.get(0).length();
        constructor.empezar(lineas.size(), ancho);
        for (int fila = 0; fila < lineas.size(); fila++) {
            String linea = lineas.get(fila);
            if (linea.length() != ancho) {
                throw new IllegalArgumentException("Filas de distinto ancho en la fila " + fila);
            }
            for (int columna = 0; columna < ancho; columna++) {
                agregar(linea.charAt(columna), new Posicion(fila, columna));
            }
        }
    }

    private void agregar(char simbolo, Posicion posicion) {
        switch (simbolo) {
            case '#', ' ', '.', '~', 'C', 'X', 'O', 'P' -> constructor.agregarTerreno(posicion, simbolo);
            case '@', '+' -> constructor.agregarJugador(posicion, simbolo == '+');
            case '$', '*' -> constructor.agregarCajaNormal(posicion, simbolo == '*');
            case 'F' -> constructor.agregarCajaFragil(posicion);
            case 'L' -> constructor.agregarCajaLlave(posicion);
            default -> throw new IllegalArgumentException("Símbolo desconocido: " + simbolo);
        }
    }
}
