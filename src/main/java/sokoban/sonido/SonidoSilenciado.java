package sokoban.sonido;

import javax.sound.sampled.Clip;

/**
 * Patrón State: estado concreto. El sonido está silenciado.
 *
 * @author Mora Coghlan
 */
class SonidoSilenciado implements EstadoSonido {

    /** En silencio no suena nada. */
    @Override
    public void reproducir(Clip clip) {
        // intencionalmente vacío
    }

    /** Al volver a apretar M, pasa a Activado. */
    @Override
    public void alternar(Sonidos contexto) {
        contexto.establecerEstado(new SonidoActivado());
    }
}
