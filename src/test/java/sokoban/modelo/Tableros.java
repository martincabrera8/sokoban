package sokoban.modelo;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/** Ayuda para las pruebas: arma un juego a partir de un tablero escrito en el test. */
public final class Tableros {

    private Tableros() {
    }

    /** Escribe el tablero como nivel1.txt en la carpeta y devuelve un juego con ese nivel ya iniciado. */
    public static JuegoSokoban juego(Path carpeta, String... filas) throws IOException {
        Files.write(carpeta.resolve("nivel1.txt"), List.of(filas), StandardCharsets.UTF_8);
        JuegoSokoban juego = new JuegoSokoban(new CargadorNivel(carpeta.toString()));
        juego.iniciarNivel(1);
        return juego;
    }

    /** Mueve con letras: U arriba, D abajo, L izquierda, R derecha (también acepta flechas). */
    public static void mover(Juego juego, String movimientos) {
        for (char letra : movimientos.toCharArray()) {
            switch (letra) {
                case 'U', '↑' -> juego.mover(Direccion.ARRIBA);
                case 'D', '↓' -> juego.mover(Direccion.ABAJO);
                case 'L', '←' -> juego.mover(Direccion.IZQUIERDA);
                case 'R', '→' -> juego.mover(Direccion.DERECHA);
                default -> { } // espacios para agrupar
            }
        }
    }

    public static String fila(Juego juego, int numero) {
        return juego.getEstado().tablero().get(numero);
    }
}
