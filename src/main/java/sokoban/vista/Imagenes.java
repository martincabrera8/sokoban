package sokoban.vista;

import java.awt.Graphics;
import java.awt.Image;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.util.HashMap;
import java.util.Map;

import javax.imageio.ImageIO;

/**
 * Patrón SINGLETON: una única caché de imágenes compartida por el menú, el HUD
 * y el tablero. Cada imagen se lee del disco una sola vez.
 * Las imágenes son las del diseño del grupo, en la carpeta assets/ del repositorio.
 */
public final class Imagenes {

    private static final String CARPETA = "assets/";

    private static Imagenes instancia;

    private final Map<String, Image> cache = new HashMap<>();

    private Imagenes() {
    }

    public static Imagenes obtenerInstancia() {
        if (instancia == null) {
            instancia = new Imagenes();
        }
        return instancia;
    }

    /** Ruta relativa a assets y sin extensión, por ejemplo "ui/boton_undo". */
    public Image obtener(String ruta) {
        return cache.computeIfAbsent(ruta, this::cargar);
    }

    /** Dibuja una imagen de fondo cubriendo todo el área, sin deformarla. */
    public void dibujarFondo(Graphics g, String ruta, int ancho, int alto) {
        Image fondo = obtener(ruta);
        double escala = Math.max((double) ancho / fondo.getWidth(null), (double) alto / fondo.getHeight(null));
        int anchoFinal = (int) Math.ceil(fondo.getWidth(null) * escala);
        int altoFinal = (int) Math.ceil(fondo.getHeight(null) * escala);
        g.drawImage(fondo, (ancho - anchoFinal) / 2, (alto - altoFinal) / 2, anchoFinal, altoFinal, null);
    }

    /** Busca la imagen dentro del .jar y, si no está, en la carpeta assets del repositorio. */
    private Image cargar(String ruta) {
        String archivo = CARPETA + ruta + ".png";
        try {
            URL enJar = Imagenes.class.getResource("/" + archivo);
            if (enJar != null) {
                return ImageIO.read(enJar);
            }
            File enDisco = new File(archivo);
            if (enDisco.isFile()) {
                return ImageIO.read(enDisco);
            }
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo leer la imagen " + archivo, e);
        }
        throw new IllegalStateException("Falta la imagen " + archivo + " (ejecutar desde la carpeta del repositorio)");
    }
}
