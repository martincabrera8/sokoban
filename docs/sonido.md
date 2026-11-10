# Sonido — parte de Marcelo Coghlan

Esta parte agrega los **efectos de sonido** que pide la consigna ("las acciones del juego deben estar acompañadas de efectos de sonido apropiados"). No cambia cómo se juega ni cómo se ve el juego.

## Qué suena y cuándo

| Situación | Sonido | Archivo |
|---|---|---|
| Se abre el juego | Arpegio de bienvenida | `arranque.wav` |
| Empieza un nivel (o se pasa al siguiente) | Dos notas | `inicio_nivel.wav` |
| El jugador da un paso | Blip corto | `paso.wav` |
| El jugador empuja una caja | Golpe de madera | `empuje.wav` |
| Una caja queda sobre su destino | "Ding" | `caja_destino.wav` |
| Se empuja una caja frágil (pierde resistencia) | Crujido | `caja_danada.wav` |
| Una caja frágil se rompe | Estallido | `caja_rota.wav` |
| La caja llave abre los muros (cerrojo) | Clic metálico + campanita | `cerrojo.wav` |
| Deshacer | Barrido descendente | `deshacer.wav` |
| Reiniciar el nivel | Barrido bajada-subida | `reiniciar.wav` |
| Nivel ganado | Fanfarria | `victoria.wav` |
| Nivel perdido (se rompió una caja y ya no alcanzan para cubrir los destinos) | "Trombón triste" | `derrota.wav` |
| Movimiento imposible (pared, caja trabada) | Golpe sordo | `choque.wav` |
| Cualquier botón (menú, pausa, resultados, HUD) | Clic | `clic.wav` |

**Tecla M**: activa/desactiva el sonido.

## Archivos

**Lo único que se tocó del código de los chicos es `Main.java`** (2 imports y 2 líneas, marcadas con `// [Sonido - M. Coghlan]`). `Main` es el lugar que el equipo dejó justamente para conectar las piezas ("es el único lugar que conoce las clases concretas"). Ninguna pantalla, botón, clase del modelo ni el README se modificaron.

```java
Juego juego = new JuegoConSonido(new JuegoSokoban()); // antes: new JuegoSokoban()
new VentanaPrincipal(juego).setVisible(true);
SonidosDeInterfaz.instalar();
```

Para sacar el sonido del juego alcanza con volver esas líneas atrás y borrar el paquete `sonido`.

**Nuevos (todo mío), en el paquete `sokoban.sonido`:**

| Archivo | Qué hace |
|---|---|
| `Sonido.java` | Enumerado con los 14 efectos y la ruta de cada archivo. |
| `Sonidos.java` | Carga todos los `.wav` una sola vez y los reproduce. **Singleton** + **Facade** + contexto del **State**. Si la PC no tiene audio, el juego sigue sin sonido en vez de cortarse. |
| `EstadoSonido.java` | **State**: interfaz de los estados del sonido. |
| `SonidoActivado.java` | **State**: estado concreto, suena (estado inicial). Con M pasa a Silenciado. |
| `SonidoSilenciado.java` | **State**: estado concreto, no suena. Con M pasa a Activado. |
| `JuegoConSonido.java` | Sonidos **del juego** (**Decorator**). "Envuelve" al juego: implementa la misma interfaz `Juego`, le pasa cada pedido al juego real y, comparando el estado antes y después, hace sonar lo que corresponde. |
| `SonidosDeInterfaz.java` | Sonidos **de la interfaz**: arranque, clic de cualquier botón y tecla M. Escucha los eventos de toda la aplicación desde afuera, sin tocar ninguna pantalla. |

Además: `assets/sonidos/*.wav` (los 14 efectos), `docs/generar_sonidos.py` (los genera) y este documento.

## Cómo funciona (para la defensa)

**Bajo acoplamiento:** ni la vista ni el dominio saben que existe el sonido. Ninguna clase de ellos importa nada del paquete `sonido`; la dependencia va en un solo sentido (sonido → modelo). **Alta cohesión:** cada clase hace una sola cosa (qué efectos hay / reproducir / sonidos del juego / sonidos de la interfaz).

1. **`JuegoConSonido`** se pone "delante" del juego real. Como implementa la misma interfaz `Juego`, la vista lo usa sin darse cuenta.
   - `iniciarNivel` → inicio de nivel; `reiniciar` → reinicio; `deshacer` → deshacer (o choque si no había nada para deshacer).
   - `mover`: guarda la foto del estado antes, mueve, toma la foto después y compara:
     - no cambió nada → choque (pared o caja trabada)
     - `completado` pasó a verdadero → victoria
     - hay menos cajas frágiles (`F` `f` `G` `g`) → caja frágil rota (y si ya no alcanzan las cajas para los destinos → derrota)
     - hay más `O`/`c` o menos `X` → se abrió un muro (cerrojo)
     - hay más cajas sobre destino (`*` `G` `g` `K`) → caja sobre destino
     - subieron los empujes → empuje (si se movió una caja frágil, crujido)
     - si no, fue un paso
   
     Si pasan varias cosas a la vez, suena la más importante (es el orden de la lista).
2. **`SonidosDeInterfaz`** se registra una vez al arrancar en el sistema de eventos de Java (`Toolkit` y `KeyboardFocusManager`): cada vez que se aprieta un botón cualquiera suena el clic, y la tecla M activa/desactiva el sonido. Un botón nuevo que agreguen los chicos suena solo.

El sonido usa los mismos símbolos de tablero que dibuja `PanelTablero`: `$` caja, `*` caja en destino, `F`/`f` caja frágil intacta/dañada, `G`/`g` caja frágil sobre destino, `L`/`K` caja llave (fuera/sobre destino), `C`/`c` cerrojo cerrado/abierto, `X`/`O` muro cerrado/abierto. Si el equipo agrega símbolos nuevos, solo hay que sumarlos a las constantes de `JuegoConSonido`.

## Patrones de diseño aplicados

| Patrón | Dónde | Por qué |
|---|---|---|
| **Decorator** (estructural) | `JuegoConSonido` | Agrega sonido al juego **sin modificar** su código: implementa la misma interfaz `Juego`, tiene adentro el juego real y le delega cada pedido, sumando el sonido antes/después. Cumple OCP: el juego se extiende sin tocarse. |
| **Singleton** (creacional) | `Sonidos` | Los `.wav` se cargan **una sola vez** y todo el juego comparte la misma instancia (constructor privado + `obtenerInstancia()`), igual que `Imagenes` de la interfaz. |
| **State** (comportamiento) | `EstadoSonido`, `SonidoActivado`, `SonidoSilenciado`; contexto `Sonidos` | El sonido se comporta distinto según esté activado o silenciado. En vez de un `if (silenciado)`, `Sonidos` delega en su estado actual, y **cada estado decide a cuál pasar** al apretar M. Agregar un estado nuevo (ej. "volumen bajo") no obliga a tocar `Sonidos`. |
| **Facade** (estructural) | `Sonidos` | Esconde la complejidad de `javax.sound` (AudioSystem, Clip, formatos, excepciones) detrás de un único `reproducir(Sonido.PASO)`. El resto del código no sabe cómo se reproduce un audio. |

**State vs. Strategy (posible pregunta):** en State el objeto cambia de comportamiento solo, porque las transiciones están adentro de cada estado (`SonidoActivado` sabe que después viene `SonidoSilenciado`). En Strategy es el cliente el que elige desde afuera qué algoritmo usar.

### Diagrama de clases (simplificado)

```
              «interface»                         «interface»
                 Juego  ◁- - - - - - - - -┐      EstadoSonido
                   △                       ┆   + reproducir(clip)
                   ┆                       ┆   + alternar(contexto)
           JuegoSokoban             JuegoConSonido      △        △
          (de los chicos)        «Decorator»            ┆        ┆
                   ◆─────────── - juego: Juego   SonidoActivado  SonidoSilenciado
                                   + mover(...)          «State concreto»
                                       │ usa                 △
                                       ▼                     │ estado actual
  SonidosDeInterfaz ──usa──▶      Sonidos  ◆─────────────────┘
  (clics y tecla M)          «Singleton» «Facade» «Contexto State»
                             - instancia: Sonidos
                             - estado: EstadoSonido
                             + obtenerInstancia()
                             + reproducir(Sonido)
                             + alternarSonido()
                                       │ usa
                                       ▼
                               «enum» Sonido
                         PASO, EMPUJE, VICTORIA, ...
```
(◁┆ realización / implements · ◆─ composición · ──▶ dependencia / usa)

## Licencia de los sonidos

La consigna exige assets de dominio público. Los 14 sonidos **no se bajaron de ningún lado**: se generan por código con `docs/generar_sonidos.py` (ondas y ruido sintetizados), así que son propios y se liberan como dominio público. Para regenerarlos o modificarlos: `python docs/generar_sonidos.py` desde la raíz del repositorio.

## Uso de IA

Esta parte se desarrolló con asistencia de Claude (Anthropic), declarado según pide la consigna. El código fue revisado y probado: la detección de eventos se verificó con una partida simulada (paso, empuje, caja en destino, victoria, siguiente nivel, deshacer, reinicio, caja frágil, rotura, derrota y cerrojo) y el juego se ejecutó completo con clics y teclas reales, verificando qué sonido se disparaba en cada acción.
