package sokoban.modelo;

/** Patrón Observer: el sujeto. Permite suscribir y desuscribir observadores y avisarles. */
public interface SujetoJuego {

    void agregarObservador(ObservadorJuego observador);

    void quitarObservador(ObservadorJuego observador);

    void notificarObservadores();
}
