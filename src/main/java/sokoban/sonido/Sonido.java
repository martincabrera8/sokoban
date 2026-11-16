package sokoban.sonido;

import sokoban.modelo.Evento;

/**
 * Efectos de sonido del juego. Cada uno sabe cuál es su archivo dentro de assets/sonidos/.
 *
 * @author Mora Coghlan
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

    /** El efecto que corresponde a cada evento del juego (null si no suena nada). */
    public static Sonido de(Evento evento) {
        return switch (evento) {
            case INICIO_NIVEL -> INICIO_NIVEL;
            case REINICIO -> REINICIAR;
            case PASO -> PASO;
            case CHOQUE -> CHOQUE;
            case EMPUJE -> EMPUJE;
            case CAJA_DANADA -> CAJA_DANADA;
            case CAJA_ROTA -> CAJA_ROTA;
            case CAJA_EN_DESTINO -> CAJA_EN_DESTINO;
            case CERROJO_ABIERTO -> CERROJO_ABIERTO;
            case PLUTONIO -> PLUTONIO;
            case DESHACER -> DESHACER;
            case VIAJE_EN_EL_TIEMPO -> VIAJE_EN_EL_TIEMPO;
            case VICTORIA -> VICTORIA;
            case NINGUNO -> null;
        };
    }

    /** Ruta relativa a la raíz del proyecto (o del .jar), por ejemplo "assets/sonidos/paso.wav". */
    public String getRuta() {
        return "assets/sonidos/" + archivo + ".wav";
    }
}
