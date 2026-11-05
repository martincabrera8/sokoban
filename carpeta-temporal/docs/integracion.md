# Integración del proyecto: estado al 05/11/2026

Este documento junta las partes que ya están en el repositorio, dice quién hizo cada una y explica cómo se suman las partes que faltan.

## Diagrama de clases completo

![Diagrama de clases completo](uml/2-diagrama-completo.png)

- Vectorial: [`uml/2-diagrama-completo.svg`](uml/2-diagrama-completo.svg). Además hay diagramas chicos por patrón, la vista general, cómo leer las flechas y un diagrama de secuencia (todos en [`uml/`](uml/)), y la [guía explicativa en PDF](guia/Guia-del-proyecto-Sokoban.pdf).
- Para regenerarlos: `python3 docs/uml/fuentes/diagramas.py` (las clases están en `clases.py`; la posición de cada caja y el recorrido de cada flecha, en `diagramas.py`). El de secuencia es PlantUML: `docs/uml/fuentes/7-secuencia-mover.puml`. La guía se regenera con `node docs/guia/generar-pdf.js`.
- Colores: **azul = Luca**, **verde = Martín**, **amarillo = integración**, **gris = pendiente**.

## Quién hizo qué

| Parte | Autor | Archivos |
|---|---|---|
| Arte: personaje (4 direcciones), cajas, destinos, pisos y paredes por época, fondos 1955/1985/2015, botones e indicadores del HUD, diseños de pantallas | **Martín** | `assets/` (101 PNG) |
| README inicial y consigna | **Martín** | `README.md`, `docs/consigna-prof-pepe.pdf` |
| Interfaz gráfica Swing: ventana, menú, partida, HUD, tablero, carteles de pausa y resultado, caché de imágenes | **Luca** | `src/main/java/sokoban/vista/*` (salvo `Epoca`), `Main.java` |
| Contrato vista-dominio: `Juego` (Facade), `ObservadorJuego` (Observer), `EstadoJuego` (DTO), `Direccion` | **Luca** | `src/main/java/sokoban/modelo/*` |
| Juego de prueba provisorio (lo reemplaza el dominio) | **Luca** | `src/main/java/sokoban/prueba/JuegoDePrueba.java` |
| Proyecto Maven, documentación y UML de la interfaz | **Luca** | `pom.xml`, `docs/interfaz.md`, `docs/uml/diagrama-interfaz-sokoban.*`, `docs/capturas/` |
| Integración Luca + Martín (ver abajo) | **Martín** (asistido por IA) | `vista/Epoca.java`, cambios en `PanelTablero` y `PantallaJuego`, tercer nivel de prueba, este documento, UML completo |
| Dominio y personaje (Sokoban) | *pendiente* | — |
| Música y efectos de sonido | *pendiente* | — |

## Qué se hizo en la integración

La interfaz de Luca ya usaba los assets de Martín, pero parte del arte no estaba conectado:

1. **Personaje con 4 direcciones.** Antes siempre se dibujaba `player_down`. Ahora `PanelTablero` dibuja `player_up`, `player_down`, `player_left` o `player_right` según la última flecha (gira aunque choque contra una pared). Lo resuelve la vista y no cambia el contrato con el dominio.
2. **Tablero con el estilo de cada época.** Antes el piso era siempre `floor_1985` y la pared `wall_brick`, aunque el fondo cambiaba. El enumerado nuevo `Epoca` agrupa fondo, piso y pared:

   | Nivel | Época | Fondo | Piso | Pared |
   |---|---|---|---|---|
   | 1, 4, 7… | `HILL_VALLEY_1955` | `background_hill_valley_1955` | `floor_1955` | `wall_brick` |
   | 2, 5, 8… | `MALL_1985` | `background_mall_1985` | `floor_1985` | `wall_mall` |
   | 3, 6, 9… | `FUTURO_2015` | `background_future_2015` | `floor_2015` | `wall_future` |

   Para cambiar o agregar una época se modifica solo `Epoca` (OCP).
   ![Las tres épocas: 1955, 1985 y 2015](capturas/6-epocas.png)

3. **Tercer nivel en `JuegoDePrueba`**, así se pueden ver las tres épocas mientras no llegue el dominio.
4. **Ahora se usan 28 de las 101 imágenes** (antes 21). Todas las rutas existen y el `.jar` las empaqueta.

Verificado: `mvn package` compila sin errores y el juego se probó en pantalla (menú, los tres niveles, giro del personaje, deshacer y nivel completado).

## Revisión de lo que ya está

**Funciona bien y está bien diseñado**
- Swing con MVC: la vista solo conoce interfaces (`Juego`, `ObservadorJuego`) y recibe datos en un DTO inmutable (`EstadoJuego`), nunca objetos del dominio.
- Los patrones están justificados: Observer (HUD y tablero se actualizan solos), Facade (`Juego`) y Singleton (`Imagenes`).
- Las teclas y los símbolos están en mapas (sin `switch`). No hay números mágicos ni clases largas.
- El HUD cumple la consigna: nivel, movimientos, empujes y botones visibles de deshacer y reiniciar. El cartel final muestra movimientos, empujes, deshacer y puntaje.

**Puntos a resolver antes de integrar el dominio** (ninguno rompe lo que hay hoy)
1. **Celdas con dos cosas encima.** El tablero viaja como texto, con un carácter por celda. No hay símbolo para: jugador sobre piso resbaladizo o sobre cerrojo, caja (normal, frágil o llave) sobre piso resbaladizo, caja llave sobre cerrojo o destino, caja frágil o llave en destino, caja frágil dañada (`caja_fragil_danada`) o rota, y cerrojo abierto (`cerrojo_abierto`). Hay dos opciones:
   - **(a) Más símbolos.** Es simple, pero se multiplican las combinaciones.
   - **(b) Dos capas** en `EstadoJuego`: `terreno` (pared, piso, destino, resbaladizo, cerrojo, muro) y `objetos` (jugador, cajas). `PanelTablero` dibuja una sobre la otra. **Recomendada**, porque no crece con las combinaciones.

   Hay que decidirlo con quien hace el dominio antes de unir el código.
2. **Reglas del deshacer.** `JuegoDePrueba` no las cumple, y no hace falta porque es provisorio. El dominio sí tiene que guardar solo los últimos **15** movimientos, volver **5** por cada uso y permitir como máximo **3 usos consecutivos**.
3. **Diagrama en StarUML.** La consigna pide el diagrama en **StarUML**. El de draw.io (Luca) y el de PlantUML (este) sirven para revisar, pero hay que pasarlo a StarUML antes de entregar.

## Cómo se suma la parte del dominio y personaje (Sokoban)

1. Una clase del dominio (por ejemplo `ControladorJuego`) implementa `sokoban.modelo.Juego`.
2. Después de cada cambio (`iniciarNivel`, `mover`, `deshacer`, `reiniciar`) llama a `observador.actualizar(getEstado())` en cada observador registrado.
3. `getEstado()` devuelve el tablero con los símbolos de la tabla de [`interfaz.md`](interfaz.md#integración-con-el-dominio-para-el-resto-del-equipo) (o con dos capas, si se elige la opción **b**).
4. Niveles en `.txt`: se recomienda la carpeta `niveles/` en la raíz. Para meterlos en el `.jar` se agrega otro `<resource>` en `pom.xml`, igual que el de `assets/`.
5. En `Main` se cambia `new JuegoDePrueba()` por la clase real y se borra el paquete `sokoban.prueba`. **No se toca ninguna clase de la vista.**
6. Se actualizan los diagramas: las clases nuevas van en `docs/uml/fuentes/clases.py` y se ubican en `diagramas.py`, reemplazando las cajas grises *pendiente*.

## Cómo se suma la música y los efectos de sonido

1. **Formato.** Java (`javax.sound.sampled.Clip`) solo reproduce **WAV / AIFF / AU** sin librerías externas. Si la música está en MP3 u OGG, conviene convertirla a WAV.
2. **Ubicación.** `assets/sonidos/` (efectos) y `assets/musica/` (fondo). El `pom.xml` ya empaqueta todo `assets/` en el `.jar`.
3. **Efectos.** Una clase (por ejemplo `ReproductorSonido`) implementa `ObservadorJuego` y se registra con `juego.agregarObservador(...)` en `Main`. Es el mismo patrón Observer y no hay que modificar nada de lo que existe. Para saber qué pasó, compara el estado nuevo con el anterior: si subió `movimientos`, hubo paso; si subió `empujes`, hubo empuje; si subió `undosUsados`, se deshizo; si `completado` es verdadero, ganó. **Romper una caja frágil o abrir un cerrojo no se puede deducir así**: hay que acordar con el dominio un evento extra o un dato más en `EstadoJuego`.
4. **Música de fondo.** No depende del dominio. Se puede elegir un tema por época con `Epoca.delNivel(n)`.
5. **Licencias.** La consigna exige que **todos los assets sean de dominio público**. Hay que anotar de dónde salió cada sonido y cada imagen (con su licencia) en el informe.

## Lo que falta para la entrega (según la consigna)

- [ ] Dominio completo: tablero, jugador, cajas normal/frágil/llave, piso resbaladizo, cerrojo y muros, niveles `.txt`, deshacer 15/5/3, puntaje.
- [ ] Efectos de sonido y música.
- [ ] **Dos funcionalidades adicionales** que apliquen patrones de diseño (todavía no están definidas).
- [ ] Diagrama de clases en **StarUML**.
- [ ] Informe técnico con decisiones de diseño y declaración del uso de IA.
- [ ] Video de gameplay.
- [x] README con instrucciones para ejecutar.
