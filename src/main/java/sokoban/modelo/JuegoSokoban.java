package sokoban.modelo;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import sokoban.modelo.movimiento.MediadorMovimiento;
import sokoban.modelo.movimiento.MotorMovimiento;
import sokoban.modelo.tiempo.MaquinaDelTiempo;

/**
 * Controlador del dominio: implementa el contrato Juego que usa la vista.
 *
 * Es el ORIGINADOR del patrón Memento: crea los RecuerdoNivel y sabe restaurarlos.
 * Los guardan el historial del deshacer y la MaquinaDelTiempo del DeLorean.
 */
public class JuegoSokoban implements Juego {
    private static final int MAX_HISTORIAL = 15;
    private static final int PASOS_POR_UNDO = 5;
    private static final int MAX_UNDOS_CONSECUTIVOS = 3;

    private final CargadorNivel cargador;
    private final int cantidadNiveles;
    private final List<ObservadorJuego> observadores = new ArrayList<>();
    private final Deque<RecuerdoNivel> historial = new ArrayDeque<>();
    private final MaquinaDelTiempo maquinaDelTiempo = new MaquinaDelTiempo();
    private EstadoNivel estado;
    private MediadorMovimiento motor;
    private int nivel;
    private int movimientos;
    private int empujes;
    private int undosUsados;
    private int undosConsecutivos;
    private int plutonio;
    private int viajes;

    /** Juega los niveles oficiales de la carpeta "niveles". */
    public JuegoSokoban() {
        this(new CargadorNivel());
    }

    /** Juega los niveles de otra carpeta (por ejemplo, mapas de prueba). */
    public JuegoSokoban(CargadorNivel cargador) {
        this.cargador = cargador;
        this.cantidadNiveles = cargador.contarNiveles(); // agregar un nivelN.txt agrega un nivel
        if (cantidadNiveles == 0) {
            throw new IllegalStateException("No hay niveles en la carpeta " + cargador.getCarpeta());
        }
    }

    @Override
    public int getCantidadNiveles() { return cantidadNiveles; }

    @Override
    public void iniciarNivel(int numero) {
        if (numero < 1 || numero > cantidadNiveles) throw new IllegalArgumentException("Nivel inexistente");
        nivel = numero;
        estado = cargador.cargar(numero);
        conectarMotor();
        movimientos = empujes = undosUsados = undosConsecutivos = plutonio = viajes = 0;
        historial.clear();
        maquinaDelTiempo.olvidarTodo();
        maquinaDelTiempo.guardar(crearRecuerdo()); // primer punto en el tiempo: el comienzo del nivel
        notificar();
    }

    private void conectarMotor() {
        motor = new MotorMovimiento(estado); // se conecta solo con el jugador y las cajas
    }

    @Override
    public void mover(Direccion direccion) {
        if (estado == null || estado.estaCompleto()) return;
        RecuerdoNivel anterior = crearRecuerdo();
        int cajasAntes = estado.cajasEnDestino();
        if (!estado.getJugador().mover(direccion)) return;

        historial.push(anterior);
        if (historial.size() > MAX_HISTORIAL) historial.removeLast();
        movimientos++;
        if (motor.fueEmpuje()) empujes++;
        if (estado.recogerPlutonio(estado.getJugador().getPosicion())) plutonio++;
        undosConsecutivos = 0;
        if (estado.cajasEnDestino() > cajasAntes) {
            maquinaDelTiempo.guardar(crearRecuerdo()); // momento importante: una caja llegó a destino
        }
        notificar();
    }

    @Override
    public void deshacer() {
        if (estado == null || estado.estaCompleto() || historial.isEmpty()
                || undosConsecutivos >= MAX_UNDOS_CONSECUTIVOS) return;
        RecuerdoNivel recuerdo = null;
        for (int i = 0; i < PASOS_POR_UNDO && !historial.isEmpty(); i++) {
            recuerdo = historial.pop();
        }
        restaurar(recuerdo);
        olvidarPuntosDelFuturo();
        undosUsados++;
        undosConsecutivos++;
        notificar();
    }

    /**
     * DeLorean: gasta una carga y vuelve al último punto en el tiempo. Si ese punto es
     * el presente (no hubo movimientos desde que se guardó), vuelve al anterior.
     * El plutonio ya juntado no reaparece y las cargas no se recuperan.
     */
    @Override
    public void viajarEnElTiempo() {
        if (estado == null || estado.estaCompleto() || plutonio == 0) return;
        if (maquinaDelTiempo.ultimo().movimientos() == movimientos) {
            if (maquinaDelTiempo.cantidad() < 2) return; // no hay pasado al que volver
            maquinaDelTiempo.descartarUltimo();
        }
        EstadoNivel presente = estado;
        int cargasRestantes = plutonio - 1;
        restaurar(maquinaDelTiempo.ultimo());
        estado.conservarPlutonioRecogido(presente);
        plutonio = cargasRestantes;
        viajes++;
        historial.clear();
        undosConsecutivos = 0;
        notificar();
    }

    @Override
    public void reiniciar() {
        if (nivel > 0) iniciarNivel(nivel);
    }

    @Override
    public EstadoJuego getEstado() {
        if (estado == null) return new EstadoJuego(0, 0, 0, 0, 0, 0, 0, 0, false, false, List.of());
        return new EstadoJuego(nivel, movimientos, empujes, undosUsados, plutonio, viajes,
                maquinaDelTiempo.cantidad(),
                calcularPuntaje(), estado.estaCompleto(), estado.sinSolucion(), estado.tableroParaVista());
    }

    /**
     * Criterio del equipo: se arranca con 1000 y se descuenta por cada acción, así gana
     * quien resuelve el nivel de la forma más eficiente.
     */
    private int calcularPuntaje() {
        return Math.max(0, 1000 - 5 * movimientos - 2 * empujes - 50 * undosUsados - 100 * viajes);
    }

    @Override
    public void agregarObservador(ObservadorJuego observador) {
        observadores.add(observador);
        if (estado != null) observador.actualizar(getEstado());
    }

    @Override
    public void quitarObservador(ObservadorJuego observador) {
        observadores.remove(observador);
    }

    /** Memento: guarda el momento actual sin exponer cómo está hecho. */
    private RecuerdoNivel crearRecuerdo() {
        return new RecuerdoNivel(estado, movimientos, empujes, plutonio);
    }

    /** Memento: vuelve al momento guardado. */
    private void restaurar(RecuerdoNivel recuerdo) {
        estado = recuerdo.nivel();
        movimientos = recuerdo.movimientos();
        empujes = recuerdo.empujes();
        plutonio = recuerdo.plutonio();
        conectarMotor();
    }

    /** Después de deshacer, los puntos en el tiempo guardados más adelante ya no existen. */
    private void olvidarPuntosDelFuturo() {
        while (maquinaDelTiempo.cantidad() > 1 && maquinaDelTiempo.ultimo().movimientos() > movimientos) {
            maquinaDelTiempo.descartarUltimo();
        }
    }

    private void notificar() {
        EstadoJuego foto = getEstado();
        for (ObservadorJuego obs : observadores) obs.actualizar(foto);
    }
}
