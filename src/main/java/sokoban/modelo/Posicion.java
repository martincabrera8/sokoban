package sokoban.modelo;

public record Posicion(int fila, int columna) {
    public Posicion siguiente(Direccion direccion) {
        return new Posicion(fila + direccion.getDeltaFila(),
                columna + direccion.getDeltaColumna());
    }
}
