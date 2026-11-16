package sokoban.modelo;

/** Criterio de puntaje del equipo: se arranca con 1000 y cada acción descuenta. */
public class Puntaje {

    private int deshacerUsados;
    private int viajes;

    public void reiniciar() {
        deshacerUsados = 0;
        viajes = 0;
    }

    public void registrarDeshacer() {
        deshacerUsados++;
    }

    public void registrarViaje() {
        viajes++;
    }

    public int getDeshacerUsados() {
        return deshacerUsados;
    }

    public int getViajes() {
        return viajes;
    }

    public int calcular(int movimientos, int empujes) {
        int puntos = 1000 - 5 * movimientos - 2 * empujes - 50 * deshacerUsados - 100 * viajes;
        return Math.max(0, puntos);
    }
}
