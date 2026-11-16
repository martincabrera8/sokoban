package sokoban.modelo;

import java.util.ArrayList;
import java.util.List;

import sokoban.modelo.movimiento.MotorMovimiento;
import sokoban.modelo.tiempo.HistorialDeshacer;
import sokoban.modelo.tiempo.MaquinaDelTiempo;

/**
 * Patrón Facade: la fachada del dominio. La vista le pide cosas simples (mover,
 * deshacer, viajar) y ella las reparte entre las clases que hacen el trabajo:
 * el nivel, el mediador, los cuidadores del Memento y el puntaje.
 * También es el sujeto concreto del Observer: avisa a la vista cada vez que algo cambia.
 */
public class JuegoSokoban implements Juego, SujetoJuego {

    private final CargadorNivel cargador;
    private final int cantidadNiveles;
    private final List<ObservadorJuego> observadores = new ArrayList<>();
    private final HistorialDeshacer historial = new HistorialDeshacer();
    private final MaquinaDelTiempo maquinaDelTiempo = new MaquinaDelTiempo();
    private final Puntaje puntaje = new Puntaje();
    private EstadoNivel nivel;
    private int numeroNivel;
    private Evento evento = Evento.NINGUNO;

    public JuegoSokoban() {
        this(new CargadorNivel());
    }

    public JuegoSokoban(CargadorNivel cargador) {
        this.cargador = cargador;
        this.cantidadNiveles = cargador.contarNiveles();
        if (cantidadNiveles == 0) {
            throw new IllegalStateException("No hay niveles en la carpeta " + cargador.getCarpeta());
        }
    }

    @Override
    public int getCantidadNiveles() {
        return cantidadNiveles;
    }

    @Override
    public void iniciarNivel(int numero) {
        cargar(numero);
        evento = Evento.INICIO_NIVEL;
        notificarObservadores();
    }

    @Override
    public void reiniciar() {
        if (nivel != null) {
            cargar(numeroNivel);
            evento = Evento.REINICIO;
            notificarObservadores();
        }
    }

    @Override
    public void mover(Direccion direccion) {
        if (!enJuego()) {
            evento = Evento.CHOQUE;
            return;
        }
        RecuerdoNivel antes = nivel.crearRecuerdo();
        int cajasEnDestinoAntes = nivel.cajasEnDestino();
        evento = nivel.moverJugador(direccion);
        if (evento == Evento.CHOQUE) {
            return;
        }
        historial.guardar(antes);
        if (nivel.cajasEnDestino() > cajasEnDestinoAntes) {
            maquinaDelTiempo.guardar(nivel.getMovimientos(), nivel.crearRecuerdo());
            if (evento == Evento.EMPUJE || evento == Evento.CAJA_DANADA) {
                evento = Evento.CAJA_EN_DESTINO;
            }
        }
        if (nivel.estaCompleto()) {
            evento = Evento.VICTORIA;
        }
        notificarObservadores();
    }

    @Override
    public void deshacer() {
        RecuerdoNivel recuerdo = enJuego() ? historial.deshacer() : null;
        if (recuerdo == null) {
            evento = Evento.CHOQUE;
            return;
        }
        nivel.restaurar(recuerdo);
        maquinaDelTiempo.olvidarDespuesDe(nivel.getMovimientos());
        puntaje.registrarDeshacer();
        evento = Evento.DESHACER;
        notificarObservadores();
    }

    /** DeLorean: gasta una carga de plutonio y vuelve al último punto en el tiempo. */
    @Override
    public void viajarEnElTiempo() {
        boolean puedeViajar = enJuego() && nivel.getPlutonio() > 0;
        RecuerdoNivel punto = puedeViajar ? maquinaDelTiempo.volverAntesDe(nivel.getMovimientos()) : null;
        if (punto == null) {
            evento = Evento.CHOQUE;
            return;
        }
        nivel.viajarA(punto);
        nivel.gastarPlutonio();
        historial.olvidarTodo();
        puntaje.registrarViaje();
        evento = Evento.VIAJE_EN_EL_TIEMPO;
        notificarObservadores();
    }

    @Override
    public EstadoJuego getEstado() {
        if (nivel == null) {
            return new EstadoJuego(0, 0, 0, 0, 0, 0, 0, 0, false, false, evento, List.of());
        }
        int movimientos = nivel.getMovimientos();
        int empujes = nivel.getEmpujes();
        return new EstadoJuego(numeroNivel, movimientos, empujes, puntaje.getDeshacerUsados(),
                nivel.getPlutonio(), puntaje.getViajes(), maquinaDelTiempo.cantidad(),
                puntaje.calcular(movimientos, empujes), nivel.estaCompleto(), nivel.sinSolucion(),
                evento, nivel.tableroParaVista());
    }

    // ---------- Observer ----------

    @Override
    public void agregarObservador(ObservadorJuego observador) {
        observadores.add(observador);
    }

    @Override
    public void quitarObservador(ObservadorJuego observador) {
        observadores.remove(observador);
    }

    @Override
    public void notificarObservadores() {
        EstadoJuego estado = getEstado();
        for (ObservadorJuego observador : observadores) {
            observador.actualizar(estado);
        }
    }

    // ---------- Auxiliares ----------

    private void cargar(int numero) {
        if (numero < 1 || numero > cantidadNiveles) {
            throw new IllegalArgumentException("No existe el nivel " + numero);
        }
        numeroNivel = numero;
        nivel = cargador.cargar(numero);
        nivel.conectarMediador(new MotorMovimiento(nivel));
        historial.olvidarTodo();
        maquinaDelTiempo.olvidarTodo();
        maquinaDelTiempo.guardar(0, nivel.crearRecuerdo());
        puntaje.reiniciar();
    }

    private boolean enJuego() {
        return nivel != null && !nivel.estaCompleto();
    }
}
