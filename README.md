# Sokoban

Trabajo integrador de Proceso de Desarrollo de Software (UADE): Sokoban en Java con Swing.

## Cómo ejecutarlo

Requisito: **Java 17 o superior**. Se ejecuta desde la **raíz del repositorio**.

- **Con Maven**: `mvn package` y después `java -jar target/sokoban.jar` (el `.jar` ya incluye las imágenes, los sonidos y los niveles).
- **VS Code / IntelliJ / Eclipse / NetBeans**: abrir la carpeta (se importa como proyecto Maven) y ejecutar `sokoban.Main`.
- **Pruebas automáticas**: `mvn test` (24 pruebas con JUnit sobre las reglas, los eventos, los niveles y la repetición).

En el menú, **Cómo jugar** explica cada casilla y las teclas.

## Controles

| Tecla o botón | Acción |
|---|---|
| Flechas | Mover al personaje |
| Botón deshacer | Vuelve 5 movimientos atrás (hasta 15 movimientos, máximo 3 veces seguidas) |
| Botón reiniciar | Reinicia el nivel |
| Esc o botón pausa | Pausa (durante la repetición, salta al final) |
| T o botón DeLorean | Viaja en el tiempo al último punto guardado (gasta una carga de plutonio) |
| M | Silencia o activa el sonido |

## Niveles

| Nivel | Época | Qué hay que aprender | Solución más corta |
|---|---|---|---|
| 1 · El depósito | 1955 | Tres cajas normales: planificar el orden y no trabarlas en un rincón | 39 movimientos, 18 empujes |
| 2 · El centro comercial cerrado | 1985 | La llave sobre el cerrojo abre la sala de los destinos; la frágil tiene 2 empujes justos | 29 movimientos, 15 empujes |
| 3 · La pista de hielo | 2015 | El hielo lleva la frágil lejos de un solo empuje | 27 movimientos, 10 empujes |

Las soluciones y la prueba de que cada mecánica es necesaria (sin el cerrojo o sin el hielo el nivel no tiene solución) salen de `VerificadorDeNiveles` (en `src/test/java/sokoban/niveles/`), que resuelve cada nivel con el motor real del juego.

Los niveles están en `niveles/nivelN.txt`. Para agregar uno alcanza con crear el archivo siguiente (`nivel4.txt`): el juego cuenta los archivos que hay. Un carácter por celda y todas las filas del mismo ancho:

| Carácter | Elemento |
|---|---|
| `#` | Pared |
| (espacio) | Piso |
| `.` | Destino |
| `@` / `+` | Jugador / jugador sobre un destino |
| `$` / `*` | Caja normal / caja normal sobre un destino |
| `F` | Caja frágil (aguanta 2 empujes; al tercero se rompe) |
| `L` | Caja llave |
| `~` | Terreno resbaladizo |
| `C` | Cerrojo (la caja llave encima abre los muros) |
| `X` / `O` | Muro cerrado / muro abierto |
| `P` | Plutonio: una carga para el DeLorean |

Cada nivel necesita un jugador y una caja por cada destino.

## Funcionalidades adicionales

- **DeLorean (patrón Memento).** En los niveles hay plutonio para juntar. El juego guarda solo puntos en el tiempo: al empezar el nivel y cada vez que una caja llega a un destino. Si te trabaste o se rompió una caja frágil, el DeLorean (tecla T) gasta una carga y te devuelve al último punto, sin reiniciar todo el nivel.
- **Repetición de la partida (patrón Command).** Cada acción del jugador (mover, deshacer, viajar) es un objeto comando que se graba. Al terminar el nivel, "Ver repetición" vuelve a ejecutar esos comandos y muestra la partida completa (Esc salta al final).

## Puntaje

Se arranca con 1000 y se descuenta: 5 por movimiento, 2 por empuje, 50 por cada deshacer y 100 por cada viaje en el tiempo (mínimo 0). Así gana quien resuelve el nivel de la forma más eficiente, como pide la consigna. El resumen de cada nivel muestra movimientos, empujes, deshacer, viajes y puntaje.

## Estructura

```
src/main/java/sokoban/
├── Main.java          Conecta todo: new JuegoConSonido(new JuegoSokoban(new CargadorNivel(carpeta)))
├── vista/             Interfaz Swing: ventana, menú, partida, HUD, tablero, carteles
├── comandos/          Comandos del jugador, grabadora y repetición (Command)
├── modelo/            Contrato con la vista (Juego, SujetoJuego, ObservadorJuego, EstadoJuego, Direccion)
│   │                  y dominio (JuegoSokoban, EstadoNivel, RecuerdoNivel, Puntaje, Evento, CargadorNivel)
│   ├── entidades/     ElementoMovil, Jugador y Caja
│   ├── estrategias/   Comportamiento de cada tipo de caja
│   ├── movimiento/    Motor que resuelve los movimientos
│   └── tiempo/        HistorialDeshacer y MaquinaDelTiempo (cuidadores del Memento)
└── sonido/            Efectos de sonido
assets/                Imágenes (personaje, cajas, pisos, fondos, HUD) y sonidos (.wav)
niveles/               Niveles en texto
docs/                  Informe técnico, diagrama StarUML (Sokoban.mdj), video de gameplay y notas del dominio y del sonido
src/test/java/         Pruebas con JUnit y VerificadorDeNiveles
```

## Patrones de diseño

| Patrón | Dónde | Para qué |
|---|---|---|
| MVC | `vista` / `modelo` | La vista no conoce las clases del dominio |
| Facade | `Juego` y `JuegoSokoban` | Único punto de entrada de la vista; reparte el trabajo entre el nivel, el mediador, el deshacer, el DeLorean y el puntaje |
| Observer | `SujetoJuego`, `JuegoSokoban`, `ObservadorJuego` (HUD y tablero) | Se actualizan solos cuando cambia la partida |
| Singleton | `Imagenes`, `Sonidos` | Una sola caché de imágenes y de sonidos |
| Strategy | `ComportamientoCaja` | Cada tipo de caja (normal, frágil, llave) tiene su regla |
| Mediator | `MediadorMovimiento`, `MotorMovimiento` y `ElementoMovil` (`Jugador` y `Caja`) | El jugador y las cajas no tocan el tablero: el mediador resuelve colisiones, empujes, hielo, roturas y cerrojos |
| Decorator | `JuegoDecorado` (base) y `JuegoConSonido` | Le agrega sonido al juego sin modificarlo |
| State | `SonidoActivado` / `SonidoSilenciado` | La tecla M cambia el comportamiento del sonido |
| Memento | `EstadoNivel` (originador), `RecuerdoNivel`, `HistorialDeshacer` y `MaquinaDelTiempo` (cuidadores) | Deshacer y DeLorean: guardar y restaurar momentos del nivel sin exponer su interior |
| Command | `Comando`, los tres comandos y `GrabadoraDePartida` (invocador) | Grabar las acciones del jugador y repetir la partida |

## Documentación

- `docs/informe/Informe-tecnico-Sokoban.pdf` (y `.docx`): decisiones de diseño, patrones, reglas, puntaje y declaración de uso de IA.
- `docs/Sokoban.mdj`: diagrama de clases completo y un diagrama por patrón (abrir con StarUML).
- `docs/video/gameplay-sokoban.mp4`: video de gameplay con los tres niveles, el DeLorean y la repetición.

## Equipo

| Parte | Autor |
|---|---|
| Arte y recursos (`assets/`) | Martín |
| Interfaz gráfica Swing (`sokoban.vista`, contrato de `sokoban.modelo`) | Luca |
| Dominio y personaje (`sokoban.modelo`, `niveles/`) | Pedro y Lucía |
| Sonido (`sokoban.sonido`, `assets/sonidos/`) | Mora |
| Integración y funcionalidades adicionales (DeLorean, repetición) | Martín |

Los sonidos son propios: se generan con `docs/generar_sonidos.py` (ver `docs/sonido.md`).
