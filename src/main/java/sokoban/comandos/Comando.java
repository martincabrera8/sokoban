package sokoban.comandos;

/**
 * Patrón COMMAND: una acción del jugador convertida en objeto. Quien la ejecuta
 * (GrabadoraDePartida o Repeticion) no sabe qué hace cada una: solo llama a ejecutar().
 * Como son objetos, se pueden guardar y volver a ejecutar para ver la repetición.
 */
public interface Comando {

    void ejecutar();
}
