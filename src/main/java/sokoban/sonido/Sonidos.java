package sokoban.sonido;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.EnumMap;
import java.util.Map;

import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import javax.sound.sampled.Clip;
import javax.sound.sampled.LineUnavailableException;
import javax.sound.sampled.UnsupportedAudioFileException;

/**
 * Carga todos los efectos una sola vez al arrancar y los reproduce cuando se le pide.
 *
 * Patrones:
 * - Singleton: hay una única instancia compartida por todo el juego (igual que Imagenes).
 * - Facade: esconde toda la complejidad de javax.sound (AudioSystem, Clip, formatos,
 *   excepciones) detrás de un simple reproducir(Sonido.PASO).
 * - State (contexto): delega en el estado actual (SonidoActivado / SonidoSilenciado)
 *   qué hacer al reproducir y al apretar la tecla M.
 *
 * Si la computadora no tiene salida de audio, el juego sigue funcionando en silencio:
 * nunca se corta por un problema de sonido.
 *
 * @author Marcelo Coghlan
 */
public final class Sonidos {

    private static Sonidos instancia;

    private final Map<Sonido, Clip> clips = new EnumMap<>(Sonido.class);
    private EstadoSonido estado = new SonidoActivado();

    private Sonidos() {
        try {
            for (Sonido sonido : Sonido.values()) {
                cargar(sonido);
            }
        } catch (LineUnavailableException | IllegalArgumentException | SecurityException e) {
            System.err.println("[Sonido] No hay salida de audio disponible; el juego sigue sin sonido.");
            clips.clear();
        }
    }

    public static Sonidos obtenerInstancia() {
        if (instancia == null) {
            instancia = new Sonidos();
        }
        return instancia;
    }

    /** Pide reproducir un efecto; el estado actual decide si suena o no. */
    public void reproducir(Sonido sonido) {
        Clip clip = clips.get(sonido);
        if (clip != null) {                // null = la PC no tiene audio o falta el archivo
            estado.reproducir(clip);
        }
    }

    /** Tecla M: activa / desactiva el sonido. La transición la decide el estado actual. */
    public void alternarSonido() {
        estado.alternar(this);
    }

    /** Lo usan los estados para hacer la transición. */
    void establecerEstado(EstadoSonido nuevoEstado) {
        this.estado = nuevoEstado;
    }

    /** Corta todo lo que esté sonando (al pasar a Silenciado). */
    void detenerTodo() {
        clips.values().forEach(Clip::stop);
    }

    /** Busca el .wav dentro del .jar y, si no está, en la carpeta assets del repositorio. */
    private void cargar(Sonido sonido) throws LineUnavailableException {
        String ruta = sonido.getRuta();
        try (AudioInputStream audio = abrir(ruta)) {
            if (audio == null) {
                System.err.println("[Sonido] Falta el archivo " + ruta);
                return;
            }
            Clip clip = AudioSystem.getClip();
            clip.open(audio);
            clips.put(sonido, clip);
        } catch (IOException | UnsupportedAudioFileException e) {
            System.err.println("[Sonido] No se pudo leer " + ruta + ": " + e.getMessage());
        }
    }

    private static AudioInputStream abrir(String ruta) throws IOException, UnsupportedAudioFileException {
        InputStream enJar = Sonidos.class.getResourceAsStream("/" + ruta);
        if (enJar != null) {
            return AudioSystem.getAudioInputStream(new BufferedInputStream(enJar));
        }
        File enDisco = new File(ruta);
        return enDisco.isFile() ? AudioSystem.getAudioInputStream(enDisco) : null;
    }
}
