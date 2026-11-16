package sokoban.modelo;

/** Lo último que pasó en la partida. Lo usa el sonido para elegir qué efecto reproducir. */
public enum Evento {
    NINGUNO,
    INICIO_NIVEL,
    REINICIO,
    PASO,
    CHOQUE,
    EMPUJE,
    CAJA_DANADA,
    CAJA_ROTA,
    CAJA_EN_DESTINO,
    CERROJO_ABIERTO,
    PLUTONIO,
    DESHACER,
    VIAJE_EN_EL_TIEMPO,
    VICTORIA
}
