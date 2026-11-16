package sokoban.sonido;

import javax.swing.Timer;

import sokoban.modelo.Direccion;
import sokoban.modelo.EstadoJuego;
import sokoban.modelo.Evento;
import sokoban.modelo.Juego;
import sokoban.modelo.JuegoDecorado;

/**
 * Patrón Decorator: decorador concreto. Le agrega sonido a cualquier Juego sin
 * modificarlo. Cada acción se la pasa al juego real y después hace sonar el efecto
 * del evento que pasó. En Main se envuelve al juego real: new JuegoConSonido(new JuegoSokoban(...)).
 *
 * @author Mora Coghlan
 */
public class JuegoConSonido extends JuegoDecorado {

    private static final int DEMORA_DERROTA_MS = 600;

    public JuegoConSonido(Juego juego) {
        super(juego);
    }

    @Override
    public void iniciarNivel(int numero) {
        super.iniciarNivel(numero);
        sonarLoQuePaso();
    }

    @Override
    public void mover(Direccion direccion) {
        super.mover(direccion);
        sonarLoQuePaso();
    }

    @Override
    public void deshacer() {
        super.deshacer();
        sonarLoQuePaso();
    }

    @Override
    public void reiniciar() {
        super.reiniciar();
        sonarLoQuePaso();
    }

    @Override
    public void viajarEnElTiempo() {
        super.viajarEnElTiempo();
        sonarLoQuePaso();
    }

    private void sonarLoQuePaso() {
        EstadoJuego estado = juego.getEstado();
        Sonido sonido = Sonido.de(estado.evento());
        if (sonido != null) {
            Sonidos.obtenerInstancia().reproducir(sonido);
        }
        if (estado.evento() == Evento.CAJA_ROTA && estado.sinSolucion()) {
            sonarMasTarde(Sonido.DERROTA);
        }
    }

    private static void sonarMasTarde(Sonido sonido) {
        Timer timer = new Timer(DEMORA_DERROTA_MS, evento -> Sonidos.obtenerInstancia().reproducir(sonido));
        timer.setRepeats(false);
        timer.start();
    }
}
