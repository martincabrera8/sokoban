package sokoban.modelo;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class CargadorNivel {
    public EstadoNivel cargar(int numero) {
        String nombre = "nivel" + numero + ".txt";
        try (InputStream recurso = getClass().getResourceAsStream("/niveles/" + nombre)) {
            List<String> lineas;
            if (recurso != null) {
                lineas = new String(recurso.readAllBytes(), StandardCharsets.UTF_8).lines().toList();
            } else {
                lineas = Files.readAllLines(Path.of("niveles", nombre), StandardCharsets.UTF_8);
            }
            return new EstadoNivel(lineas);
        } catch (IOException e) {
            throw new IllegalStateException("No se pudo cargar " + nombre, e);
        }
    }
}
