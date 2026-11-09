package sokoban.modelo;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import sokoban.modelo.movimiento.MotorMovimiento;

public class JuegoSokoban implements Juego {
    private static final int NIVELES = 3;
    private static final int MAX_HISTORIAL = 15;
    private static final int PASOS_POR_UNDO = 5;
    private static final int MAX_UNDOS_CONSECUTIVOS = 3;

    private final CargadorNivel cargador = new CargadorNivel();
    private final List<ObservadorJuego> observadores = new ArrayList<>();
    private final Deque<Foto> historial = new ArrayDeque<>();
    private EstadoNivel estado;
    private MotorMovimiento motor;
    private int nivel, movimientos, empujes, undosUsados, undosConsecutivos;

    @Override
    public int getCantidadNiveles() { return NIVELES; }

    @Override
    public void iniciarNivel(int numero) {
        if (numero < 1 || numero > NIVELES) throw new IllegalArgumentException("Nivel inexistente");
        nivel = numero;
        estado = cargador.cargar(numero);
        conectarMotor();
        movimientos = empujes = undosUsados = undosConsecutivos = 0;
        historial.clear();
        notificar();
    }

    private void conectarMotor() {
        motor = new MotorMovimiento(estado);
        estado.getJugador().conectar(motor);
    }

    @Override
    public void mover(Direccion direccion) {
        if (estado == null || estado.estaCompleto()) return;
        Foto anterior = new Foto(estado.copiar(), movimientos, empujes);
        if (!estado.getJugador().mover(direccion)) return;

        historial.push(anterior);
        if (historial.size() > MAX_HISTORIAL) historial.removeLast();
        movimientos++;
        if (motor.fueEmpuje()) empujes++;
        undosConsecutivos = 0;
        notificar();
    }

    @Override
    public void deshacer() {
        if (estado == null || estado.estaCompleto() || historial.isEmpty()
                || undosConsecutivos >= MAX_UNDOS_CONSECUTIVOS) return;
        Foto foto = null;
        for (int i = 0; i < PASOS_POR_UNDO && !historial.isEmpty(); i++) {
            foto = historial.pop();
        }
        estado = foto.estado();
        movimientos = foto.movimientos();
        empujes = foto.empujes();
        undosUsados++;
        undosConsecutivos++;
        conectarMotor();
        notificar();
    }

    @Override
    public void reiniciar() {
        if (nivel > 0) iniciarNivel(nivel);
    }

    @Override
    public EstadoJuego getEstado() {
        if (estado == null) return new EstadoJuego(0, 0, 0, 0, 0, false, List.of());
        int puntaje = Math.max(0, 1000 - 10 * movimientos - 5 * empujes - 50 * undosUsados);
        return new EstadoJuego(nivel, movimientos, empujes, undosUsados,
                puntaje, estado.estaCompleto(), estado.tableroParaVista());
    }

    @Override
    public void agregarObservador(ObservadorJuego observador) {
        observadores.add(observador);
        if (estado != null) observador.actualizar(getEstado());
    }

    private void notificar() {
        EstadoJuego foto = getEstado();
        for (ObservadorJuego obs : observadores) obs.actualizar(foto);
    }

    private record Foto(EstadoNivel estado, int movimientos, int empujes) { }
}
