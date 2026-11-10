package sokoban.sonido;

/**
 * Efectos de sonido del juego. Cada uno sabe cuál es su archivo dentro de assets/sonidos/.
 *
 * @author Marcelo Coghlan
 */
public enum Sonido {

    ARRANQUE("arranque"),
    INICIO_NIVEL("inicio_nivel"),
    PASO("paso"),
    EMPUJE("empuje"),
    CAJA_EN_DESTINO("caja_destino"),
    CAJA_DANADA("caja_danada"),
    CAJA_ROTA("caja_rota"),
    CERROJO_ABIERTO("cerrojo"),
    DESHACER("deshacer"),
    REINICIAR("reiniciar"),
    VICTORIA("victoria"),
    DERROTA("derrota"),
    CHOQUE("choque"),
    CLIC("clic"),
    PLUTONIO("plutonio"),
    VIAJE_EN_EL_TIEMPO("viaje_tiempo");

    private final String archivo;

    Sonido(String archivo) {
        this.archivo = archivo;
    }

    /** Ruta relativa a la raíz del proyecto (o del .jar), por ejemplo "assets/sonidos/paso.wav". */
    public String getRuta() {
        return "assets/sonidos/" + archivo + ".wav";
    }
}
