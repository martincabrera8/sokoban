package sokoban.sonido;

import javax.sound.sampled.Clip;

/**
 * Patrón State — interfaz Estado.
 *
 * El sonido puede estar activado o silenciado, y según eso se comporta distinto
 * ante los mismos pedidos. Cada estado concreto sabe qué hacer al reproducir y
 * a qué estado pasar cuando se aprieta la tecla M (las transiciones están adentro
 * de cada estado, no en un if del contexto).
 *
 * Contexto: {@link Sonidos}.
 *
 * @author Marcelo Coghlan
 */
interface EstadoSonido {

    /** Qué hacer cuando el juego pide reproducir un efecto. */
    void reproducir(Clip clip);

    /** Tecla M: cada estado decide a cuál pasa. */
    void alternar(Sonidos contexto);
}
