# Dominio: Mediator + Strategy (Pedro y Lucía)

Esta parte ya está integrada en el proyecto: el dominio vive en `src/main/java/sokoban/modelo/` (con `entidades/`, `estrategias/` y `movimiento/`) y los niveles en `niveles/`. Se ejecuta desde `sokoban.Main`.

## Diseño

- Mediator: `MediadorMovimiento` y `MotorMovimiento` coordinan el movimiento de `Jugador` y `Caja`.
- Strategy: `ComportamientoCaja` y las tres estrategias (normal, frágil y llave).
- EstadoNivel: almacena el estado interno dinámico del tablero.
- JuegoSokoban: implementa la interfaz `Juego` existente; notifica a `PanelHUD` y `PanelTablero`.
- EstadoJuego, Direccion, ObservadorJuego, VentanaPrincipal, PantallaJuego y PanelHUD se mantienen sin cambios.
- Main crea `new JuegoConSonido(new JuegoSokoban())`: el sonido (Mora) envuelve al dominio.

## Comprobaciones

Compilado con `javac --release 17` y probado con movimientos, deslizamiento en hielo, cajas frágiles, apertura de cerrojos y Undo.
Los archivos de niveles son ejemplos editables. Ejecutar la ventana gráfica en tu computadora para comprobar los gráficos y controles de Swing.

## Notas de diseño

- El cerrojo de llave abre todos los muros X del nivel.
- La caja frágil soporta 3 empujes y desaparece al agotarlos.
- El botón Undo deshace hasta 5 movimientos por pulsación.
- Las reglas se pueden ajustar con el resto del grupo.
