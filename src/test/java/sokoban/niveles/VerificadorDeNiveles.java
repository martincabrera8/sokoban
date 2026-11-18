package sokoban.niveles;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import sokoban.modelo.Direccion;
import sokoban.modelo.CargadorNivel;
import sokoban.modelo.EstadoNivel;
import sokoban.modelo.Evento;
import sokoban.modelo.Posicion;
import sokoban.modelo.entidades.Caja;
import sokoban.modelo.movimiento.MotorMovimiento;

/**
 * Verifica los niveles con el motor real del juego (herramienta para el equipo, no es
 * parte del juego):
 *
 * 1. Que el formato sea válido (lo valida EstadoNivel, igual que al cargar un nivel).
 * 2. Que tenga solución, y cuál es la más corta (búsqueda en anchura sobre MotorMovimiento).
 * 3. Si cada mecánica es necesaria: vuelve a resolver el nivel sin cerrojo, sin hielo
 *    y con la frágil como caja normal, y compara.
 *
 * Uso (desde la raíz del repositorio):
 *   VerificadorDeNiveles                    verifica niveles/nivel1.txt, nivel2.txt, ...
 *   VerificadorDeNiveles ruta/al/nivel.txt  verifica un archivo cualquiera (un nivel nuevo)
 *
 * No usa deshacer ni DeLorean: busca la solución jugando "limpio". Por eso tampoco junta
 * el plutonio (no cambia qué cajas se pueden mover), lo que reduce a la mitad las posiciones.
 *
 * Basado en el verificador de la auditoría de Luca.
 */
public final class VerificadorDeNiveles {

    static final String CARPETA = "niveles";
    private static final int LIMITE_DE_POSICIONES = 1_500_000;
    private static final Map<Character, String> FLECHAS = Map.of('u', "↑", 'd', "↓", 'l', "←", 'r', "→");

    /** Resultado de resolver un mapa. */
    record Resultado(boolean resoluble, boolean limiteAlcanzado, int movimientos, int empujes,
                     String camino, int posiciones, int sinSalida) {
        String resumen() {
            if (limiteAlcanzado && !resoluble) {
                return "sin respuesta: se revisaron " + posiciones + " posiciones y no alcanzó";
            }
            if (!resoluble) {
                return "NO tiene solución (" + posiciones + " posiciones revisadas)";
            }
            return movimientos + " movimientos, " + empujes + " empujes ("
                    + porcentaje(sinSalida, posiciones) + "% de las posiciones alcanzables no tienen salida)";
        }
    }

    private VerificadorDeNiveles() {
    }

    public static void main(String[] args) throws IOException {
        if (args.length > 0) {
            for (String ruta : args) {
                verificar(ruta, leer(Path.of(ruta)));
            }
            return;
        }
        for (int numero = 1; Files.isRegularFile(Path.of(CARPETA, "nivel" + numero + ".txt")); numero++) {
            Path archivo = Path.of(CARPETA, "nivel" + numero + ".txt");
            verificar(archivo.toString(), leer(archivo));
        }
    }

    private static List<String> leer(Path archivo) throws IOException {
        List<String> filas = new ArrayList<>(Files.readAllLines(archivo, StandardCharsets.UTF_8));
        while (!filas.isEmpty() && filas.get(filas.size() - 1).isBlank()) {
            filas.remove(filas.size() - 1);
        }
        return filas;
    }

    static void verificar(String titulo, List<String> filas) {
        System.out.println("\n=== " + titulo);
        filas.forEach(fila -> System.out.println("    " + fila));
        try {
            CargadorNivel.construir(filas);
        } catch (IllegalArgumentException e) {
            System.out.println("  FORMATO INVÁLIDO: " + e.getMessage());
            return;
        }
        Resultado r = resolver(filas);
        System.out.println("  Solución más corta: " + r.resumen());
        if (r.resoluble()) {
            System.out.println("  Teclas: " + enFlechas(r.camino()));
        }
        String texto = String.join("\n", filas);
        probarVariante(texto, 'C', ' ', "sin el cerrojo");
        probarVariante(texto, '~', ' ', "sin el hielo");
        probarVariante(texto, 'F', '$', "con la frágil como caja normal");
    }

    private static void probarVariante(String texto, char quitar, char poner, String descripcion) {
        if (texto.indexOf(quitar) < 0) {
            return;
        }
        Resultado r = resolver(Arrays.asList(texto.replace(quitar, poner).split("\n")));
        System.out.println("  " + descripcion + ": " + r.resumen());
    }

    /** Búsqueda en anchura: la primera vez que llega a un nivel completo es con la menor cantidad de movimientos. */
    static Resultado resolver(List<String> filasConPlutonio) {
        // El plutonio no cambia qué cajas se pueden mover: se saca para no duplicar las posiciones.
        List<String> filas = filasConPlutonio.stream().map(fila -> fila.replace('P', ' ')).toList();
        EstadoNivel inicio = CargadorNivel.construir(filas);
        Map<String, Integer> indice = new HashMap<>();
        List<EstadoNivel> estados = new ArrayList<>();
        List<Integer> padre = new ArrayList<>();
        List<Character> paso = new ArrayList<>();
        List<Integer> empujes = new ArrayList<>();
        List<List<Integer>> llegaDesde = new ArrayList<>();
        List<Boolean> completo = new ArrayList<>();
        agregar(inicio, -1, ' ', 0, indice, estados, padre, paso, empujes, llegaDesde, completo);
        int meta = -1;
        boolean limite = false;
        for (int i = 0; i < estados.size(); i++) {
            EstadoNivel actual = estados.get(i);
            estados.set(i, null); // ya no hace falta guardarla: ahorra memoria en mapas grandes
            if (completo.get(i)) {
                if (meta < 0) {
                    meta = i;
                }
                continue;
            }
            if (estados.size() > LIMITE_DE_POSICIONES) {
                limite = true;
                break;
            }
            for (Direccion direccion : Direccion.values()) {
                EstadoNivel siguiente = CargadorNivel.construir(filas);
                siguiente.restaurar(actual.crearRecuerdo());
                siguiente.conectarMediador(new MotorMovimiento(siguiente));
                if (siguiente.getJugador().mover(direccion) == Evento.CHOQUE) {
                    continue;
                }
                String clave = clave(siguiente);
                Integer j = indice.get(clave);
                if (j == null) {
                    j = agregar(siguiente, i, letra(direccion), siguiente.getEmpujes(),
                            indice, estados, padre, paso, empujes, llegaDesde, completo);
                }
                llegaDesde.get(j).add(i);
            }
        }
        int sinSalida = contarSinSalida(completo, llegaDesde);
        if (meta < 0) {
            return new Resultado(false, limite, -1, -1, "", estados.size(), sinSalida);
        }
        StringBuilder camino = new StringBuilder();
        for (int x = meta; padre.get(x) >= 0; x = padre.get(x)) {
            camino.append(paso.get(x));
        }
        camino.reverse();
        return new Resultado(true, limite, camino.length(), empujes.get(meta), camino.toString(), estados.size(), sinSalida);
    }

    private static int agregar(EstadoNivel estado, int desde, char letra, int empujesHastaAca, Map<String, Integer> indice,
                               List<EstadoNivel> estados, List<Integer> padre, List<Character> paso,
                               List<Integer> empujes, List<List<Integer>> llegaDesde, List<Boolean> completo) {
        int id = estados.size();
        indice.put(clave(estado), id);
        estados.add(estado);
        padre.add(desde);
        paso.add(letra);
        empujes.add(empujesHastaAca);
        llegaDesde.add(new ArrayList<>(2));
        completo.add(estado.estaCompleto());
        return id;
    }

    /** Posiciones desde las que ya no se puede ganar (por ejemplo, una caja en un rincón). */
    private static int contarSinSalida(List<Boolean> completo, List<List<Integer>> llegaDesde) {
        boolean[] conSalida = new boolean[completo.size()];
        Deque<Integer> pendientes = new ArrayDeque<>();
        for (int i = 0; i < completo.size(); i++) {
            if (completo.get(i)) {
                conSalida[i] = true;
                pendientes.add(i);
            }
        }
        while (!pendientes.isEmpty()) {
            for (int anterior : llegaDesde.get(pendientes.poll())) {
                if (!conSalida[anterior]) {
                    conSalida[anterior] = true;
                    pendientes.add(anterior);
                }
            }
        }
        int cantidad = 0;
        for (boolean b : conSalida) {
            if (!b) {
                cantidad++;
            }
        }
        return cantidad;
    }

    /** El dibujo del tablero más la resistencia de cada caja (dos frágiles iguales pueden tener distinta resistencia). */
    private static String clave(EstadoNivel estado) {
        List<String> tablero = estado.tableroParaVista();
        StringBuilder clave = new StringBuilder(String.join("/", tablero));
        List<Caja> cajas = new ArrayList<>(estado.getCajas());
        cajas.sort((una, otra) -> una.getPosicion().fila() != otra.getPosicion().fila()
                ? Integer.compare(una.getPosicion().fila(), otra.getPosicion().fila())
                : Integer.compare(una.getPosicion().columna(), otra.getPosicion().columna()));
        for (Caja caja : cajas) {
            clave.append('|').append(caja.getResistencia());
        }
        return clave.toString();
    }

    private static char letra(Direccion direccion) {
        return switch (direccion) {
            case ARRIBA -> 'u';
            case ABAJO -> 'd';
            case IZQUIERDA -> 'l';
            case DERECHA -> 'r';
        };
    }

    private static String enFlechas(String camino) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < camino.length(); i++) {
            if (i > 0 && i % 5 == 0) {
                sb.append(' ');
            }
            sb.append(FLECHAS.get(camino.charAt(i)));
        }
        return sb.toString();
    }

    private static long porcentaje(int parte, int total) {
        return total == 0 ? 0 : Math.round(100.0 * parte / total);
    }
}
