# Integración Mediator + Strategy — Sokoban

## Opción 1: Copiar sobre el proyecto existente

1. Descomprimí este ZIP.
2. Copiá su contenido en la raíz de tu proyecto `sokoban-main/`, es decir donde están `pom.xml`, `assets/` y `src/`.
3. Cuando el explorador pregunte, elegí **reemplazar** los archivos con igual nombre.
4. Se incorporan archivos bajo `src/main/java/sokoban/modelo/` y `niveles/`.
5. Se reemplazan los archivos `src/main/java/sokoban/Main.java`, `src/main/java/sokoban/vista/PanelTablero.java` y `pom.xml`.
6. El resto de archivos del proyecto se conserva. `sokoban/prueba/JuegoDePrueba.java` puede quedar: ya no se usa.
7. Ejecutá `sokoban.Main` desde tu IDE (Java 17+) o, si tenés Maven, ejecutá `mvn clean package` y `java -jar target/sokoban.jar`.

## Diseño

- Mediator: `MediadorMovimiento` y `MotorMovimiento` coordinan el movimiento de `Jugador` y `Caja`.
- Strategy: `ComportamientoCaja` y las tres estrategias (normal, frágil y llave).
- EstadoNivel: almacena el estado interno dinámico del tablero.
- JuegoSokoban: implementa la interfaz `Juego` existente; notifica a `PanelHUD` y `PanelTablero`.
- EstadoJuego, Direccion, ObservadorJuego, VentanaPrincipal, PantallaJuego y PanelHUD se mantienen sin cambios.

## Comprobaciones

Compilado con `javac --release 17` y probado con movimientos, deslizamiento en hielo, cajas frágiles, apertura de cerrojos y Undo.
Los archivos de niveles son ejemplos editables. Ejecutar la ventana gráfica en tu computadora para comprobar los gráficos y controles de Swing.

## Notas de diseño

- El cerrojo de llave abre todos los muros X del nivel.
- La caja frágil soporta 3 empujes y desaparece al agotarlos.
- El botón Undo deshace hasta 5 movimientos por pulsación.
- Las reglas se pueden ajustar con el resto del grupo.
