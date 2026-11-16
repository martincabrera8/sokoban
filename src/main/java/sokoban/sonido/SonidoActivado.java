package sokoban.sonido;

import javax.sound.sampled.Clip;

/**
 * Patrón State: estado concreto. El sonido está activado (es el estado inicial).
 *
 * @author Mora Coghlan
 */
class SonidoActivado implements EstadoSonido {

    /** Reproduce el efecto desde el principio (si ya estaba sonando, lo reinicia). */
    @Override
    public void reproducir(Clip clip) {
        clip.stop();
        clip.setFramePosition(0);
        clip.start();
    }

    /** Al silenciar, corta lo que esté sonando y pasa a Silenciado. */
    @Override
    public void alternar(Sonidos contexto) {
        contexto.detenerTodo();
        contexto.establecerEstado(new SonidoSilenciado());
    }
}
