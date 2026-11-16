package sokoban.sonido;

import javax.sound.sampled.Clip;

/**
 * Patrón State: el estado. El sonido puede estar activado o silenciado; cada estado
 * sabe qué hacer al reproducir y a cuál pasar cuando se aprieta la M.
 *
 * @author Mora Coghlan
 */
interface EstadoSonido {

    /** Qué hacer cuando el juego pide reproducir un efecto. */
    void reproducir(Clip clip);

    /** Tecla M: cada estado decide a cuál pasa. */
    void alternar(Sonidos contexto);
}
