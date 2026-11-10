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

Cada nivel necesita un jugador y una caja por cada destino.

## Estructura

```
src/main/java/sokoban/
├── Main.java          Conecta todo: new JuegoConSonido(new JuegoSokoban())
├── vista/             Interfaz Swing: ventana, menú, partida, HUD, tablero, carteles
├── modelo/            Contrato con la vista (Juego, ObservadorJuego, EstadoJuego, Direccion)
│   │                  y dominio (JuegoSokoban, EstadoNivel, CargadorNivel, Posicion)
│   ├── entidades/     Jugador y Caja
│   ├── estrategias/   Comportamiento de cada tipo de caja
│   └── movimiento/    Motor que resuelve los movimientos
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

## Equipo

| Parte | Autor |
|---|---|
| Arte y recursos (`assets/`) | Martín |
| Interfaz gráfica Swing (`sokoban.vista`, contrato de `sokoban.modelo`) | Luca |
| Dominio y personaje (`sokoban.modelo`, `niveles/`) | Pedro y Lucía |
| Sonido (`sokoban.sonido`, `assets/sonidos/`) | Mora |

Los sonidos son propios: se generan con `docs/generar_sonidos.py` (ver `docs/sonido.md`).
