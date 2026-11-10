# Sokoban

Trabajo integrador de Proceso de Desarrollo de Software (UADE): Sokoban en Java con Swing.

## Cómo ejecutarlo

Requisito: **Java 17 o superior**. Se ejecuta desde la **raíz del repositorio**.

- **Con Maven**: `mvn package` y después `java -jar target/sokoban.jar` (el `.jar` ya incluye las imágenes, los sonidos y los niveles).
- **VS Code / IntelliJ / Eclipse / NetBeans**: abrir la carpeta (se importa como proyecto Maven) y ejecutar `sokoban.Main`.

## Controles

| Tecla o botón | Acción |
|---|---|
| Flechas | Mover al personaje |
| Botón deshacer | Vuelve 5 movimientos atrás (hasta 15 movimientos, máximo 3 veces seguidas) |
| Botón reiniciar | Reinicia el nivel |
| Esc o botón pausa | Pausa |
| T o botón DeLorean | Viaja en el tiempo al último punto guardado (gasta una carga de plutonio) |
| M | Silencia o activa el sonido |

## Niveles

Los niveles están en `niveles/nivelN.txt`, con un carácter por celda y todas las filas del mismo ancho:

| Carácter | Elemento |
|---|---|
| `#` | Pared |
| (espacio) | Piso |
| `.` | Destino |
| `@` / `+` | Jugador / jugador sobre un destino |
| `$` / `*` | Caja normal / caja normal sobre un destino |
| `F` | Caja frágil (resiste 3 empujes) |
| `L` | Caja llave |
| `~` | Terreno resbaladizo |
| `C` | Cerrojo (la caja llave encima abre los muros) |
| `X` / `O` | Muro cerrado / muro abierto |
| `P` | Plutonio: una carga para el DeLorean |

Cada nivel necesita un jugador y una caja por cada destino.

## Funcionalidades adicionales

- **DeLorean (patrón Memento).** En los niveles hay plutonio para juntar. El juego guarda solo puntos en el tiempo: al empezar el nivel y cada vez que una caja llega a un destino. Si te trabaste o se rompió una caja frágil, el DeLorean (tecla T) gasta una carga y te devuelve al último punto, sin reiniciar todo el nivel. Cada viaje resta 100 puntos.
- **Repetición de la partida (patrón Command).** Cada acción del jugador (mover, deshacer, viajar) es un objeto comando que se graba. Al terminar el nivel, "Ver repetición" vuelve a ejecutar esos comandos y muestra la partida completa (Esc salta al final).

## Estructura

```
src/main/java/sokoban/
├── Main.java          Conecta todo: new JuegoConSonido(new JuegoSokoban())
├── vista/             Interfaz Swing: ventana, menú, partida, HUD, tablero, carteles
├── comandos/          Comandos del jugador, grabadora y repetición (Command)
├── modelo/            Contrato con la vista (Juego, ObservadorJuego, EstadoJuego, Direccion)
│   │                  y dominio (JuegoSokoban, EstadoNivel, RecuerdoNivel, CargadorNivel, Posicion)
│   ├── entidades/     Jugador y Caja
│   ├── estrategias/   Comportamiento de cada tipo de caja
│   ├── movimiento/    Motor que resuelve los movimientos
│   └── tiempo/        Máquina del tiempo del DeLorean (Memento)
└── sonido/            Efectos de sonido
assets/                Imágenes (personaje, cajas, pisos, fondos, HUD) y sonidos (.wav)
niveles/               Niveles en texto
docs/                  Notas del dominio y del sonido
```

## Patrones de diseño

| Patrón | Dónde | Para qué |
|---|---|---|
| MVC | `vista` / `modelo` | La vista no conoce las clases del dominio |
| Facade | `Juego` | Único punto de entrada de la vista al juego |
| Observer | `ObservadorJuego` (HUD y tablero) | Se actualizan solos cuando cambia la partida |
| Singleton | `Imagenes`, `Sonidos` | Una sola caché de imágenes y de sonidos |
| Strategy | `ComportamientoCaja` | Cada tipo de caja (normal, frágil, llave) tiene su regla |
| Mediator | `MotorMovimiento` | Resuelve colisiones, empujes y deslizamiento |
| Decorator | `JuegoConSonido` | Le agrega sonido al juego sin modificarlo |
| State | `SonidoActivado` / `SonidoSilenciado` | La tecla M cambia el comportamiento del sonido |
| Memento | `RecuerdoNivel`, `JuegoSokoban`, `MaquinaDelTiempo` | Deshacer y DeLorean: guardar y restaurar momentos del nivel sin exponer su interior |
| Command | `Comando`, `GrabadoraDePartida`, `Repeticion` | Grabar las acciones del jugador y repetir la partida |

## Equipo

| Parte | Autor |
|---|---|
| Arte y recursos (`assets/`) | Martín |
| Interfaz gráfica Swing (`sokoban.vista`, contrato de `sokoban.modelo`) | Luca |
| Dominio y personaje (`sokoban.modelo`, `niveles/`) | Pedro y Lucía |
| Sonido (`sokoban.sonido`, `assets/sonidos/`) | Mora |
| Integración y funcionalidades adicionales (DeLorean, repetición) | Martín |

Los sonidos son propios: se generan con `docs/generar_sonidos.py` (ver `docs/sonido.md`).
