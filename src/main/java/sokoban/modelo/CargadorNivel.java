package sokoban.modelo;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

import sokoban.modelo.construccion.ConstructorEstadoNivel;
import sokoban.modelo.construccion.ConstructorNivel;
import sokoban.modelo.construccion.DirectorNivel;

/**
 * Lee los niveles nivel1.txt, nivel2.txt, ... de una carpeta (por defecto "niveles"),
 * primero desde el .jar y si no, desde el disco. Para agregar un nivel alcanza con
 * crear el archivo siguiente.
 */
public class CargadorNivel {

    public static final String CARPETA_POR_DEFECTO = "niveles";
    private static final String BOM = "\uFEFF";

    private final String carpeta;

    public CargadorNivel() {
        this(CARPETA_POR_DEFECTO);
    }

    public CargadorNivel(String carpeta) {
        this.carpeta = carpeta;
    }

    public EstadoNivel cargar(int numero) {
        String nombre = nombreDe(numero);
        try {
            List<String> lineas = leer(nombre);
            if (lineas == null) {
                throw new IllegalStateException("No existe " + carpeta + "/" + nombre);
            }
            return construir(limpiar(lineas));
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo cargar " + carpeta + "/" + nombre, e);
        }
    }

    /**
     * Patrón Builder: el cliente. Crea el builder y el director, el director arma el nivel
     * con los pasos del builder y el builder entrega el resultado.
     */
    public static EstadoNivel construir(List<String> lineas) {
        ConstructorNivel constructor = new ConstructorEstadoNivel();
        new DirectorNivel(constructor).construir(lineas);
        return constructor.obtenerNivel();
    }

    /** Hay un archivo nivelN.txt para ese número. */
    public boolean existe(int numero) {
        String nombre = nombreDe(numero);
        return getClass().getResource("/" + carpeta + "/" + nombre) != null
                || Files.isRegularFile(Path.of(carpeta, nombre));
    }

    /** Cuenta los niveles seguidos que hay desde nivel1.txt: agregar un archivo agrega un nivel. */
    public int contarNiveles() {
        int cantidad = 0;
        while (existe(cantidad + 1)) {
            cantidad++;
        }
        return cantidad;
    }

    public String getCarpeta() {
        return carpeta;
    }

    private static String nombreDe(int numero) {
        return "nivel" + numero + ".txt";
    }

    private List<String> leer(String nombre) throws IOException {
        try (InputStream recurso = getClass().getResourceAsStream("/" + carpeta + "/" + nombre)) {
            if (recurso != null) {
                return new String(recurso.readAllBytes(), StandardCharsets.UTF_8).lines().toList();
            }
        }
        Path archivo = Path.of(carpeta, nombre);
        return Files.isRegularFile(archivo) ? Files.readAllLines(archivo, StandardCharsets.UTF_8) : null;
    }

    /**
     * Tolera lo que suelen agregar los editores de texto: la marca BOM al principio
     * (Bloc de notas de Windows) y líneas vacías al final del archivo.
     */
    private static List<String> limpiar(List<String> lineas) {
        List<String> resultado = new ArrayList<>(lineas);
        if (!resultado.isEmpty() && resultado.get(0).startsWith(BOM)) {
            resultado.set(0, resultado.get(0).substring(BOM.length()));
        }
        while (!resultado.isEmpty() && resultado.get(resultado.size() - 1).isBlank()) {
            resultado.remove(resultado.size() - 1);
        }
        return resultado;
    }
}
