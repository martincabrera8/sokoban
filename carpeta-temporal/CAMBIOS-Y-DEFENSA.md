# Cambios después de la auditoría y guía para la defensa

> **Documento de la etapa anterior (16/11).** Después de esto el código se simplificó para que cada patrón tenga su estructura clásica. Lo vigente está en `Resumen-de-estudio-Sokoban.pdf` y en las fichas de `patrones/`.

Este documento es para el equipo (está en la carpeta temporal, que se borra antes de entregar). Explica **qué se cambió, por qué, dónde está y cómo comprobarlo**, para que cada uno lo revise y lo pueda defender.

## 1. Qué dijo la auditoría y qué se hizo

La auditoría de Luca es muy buena: está bien medida (57 pruebas y 1200 partidas al azar), los errores que encontró son reales y los riesgos de patrones son los mismos que vería un docente. Se aplicó casi todo. Lo que no se aplicó tiene un motivo:

| Punto de la auditoría | Qué se hizo |
|---|---|
| Niveles triviales (se ganaban yendo a la derecha) | **Se reemplazaron** por los 3 niveles propuestos, verificados con un solucionador. Cada uno obliga a usar su mecánica |
| E1: suena «cerrojo» al pisar un muro ya abierto | **Arreglado** en `JuegoConSonido` y con prueba automática |
| E2: la frágil se rompe y no hay aviso | **Arreglado**: cartel «SE ROMPIÓ LA CAJA» con Deshacer, DeLorean, Reiniciar y Menú |
| E3: frágil y llave sobre destino no se distinguen | **Arreglado**: marco dorado en `PanelTablero` |
| E7: las flechas dejan de responder al cerrar un cartel | **Arreglado**: la ventana recupera el foco |
| Mediator con un solo colega (riesgo alto) | **Se completó**: la caja también es colega (ver sección 3) |
| Decorator sin decorador base (riesgo alto) | **Se completó**: `JuegoDecorado` (ver sección 3) |
| Observer sin desuscribir | **Agregado** `quitarObservador` |
| Autoría «Marcelo Coghlan» | **Corregido** a Mora Coghlan en el código y en `docs/sonido.md` |
| Cantidad de niveles fija en 3 | **Arreglado**: el juego cuenta los `nivelN.txt` |
| Archivos con BOM o línea vacía al final | **Tolerados** al cargar |
| No se entienden las casillas | **Nuevo**: botón «Cómo jugar» en el menú |
| No se sabe a dónde vuelve el DeLorean | **Nuevo**: aviso «Punto en el tiempo guardado» |
| Puntaje que quedaba en 0 con niveles largos | **Ajustado**: 1000 − 5·mov − 2·emp − 50·deshacer − 100·viaje |
| Sin pruebas automáticas | **Nuevo**: 23 pruebas con JUnit (`mvn test`) |
| Video de gameplay | **Hecho**: `docs/video/gameplay-sokoban.mp4` |
| Getters sin dibujar en el StarUML | Se dibujan todos (getters y setters) |
| Presentación desactualizada y larga | Se armó una **versión corta** centrada en el video |

**No se aplicó, a propósito:**

- **Factory Method para crear cajas.** Lo que encaja ahí es una «fábrica simple» (un método con un `switch`), que no es el Factory Method de GoF. Presentarla como Factory Method sería forzar un patrón, y el profesor dijo que «es peor forzar uno que no debería estar».
- **Un segundo decorador (JuegoConRegistro).** Sumar una clase solo para justificar el patrón también sería forzarlo. Con el decorador base alcanza para mostrar la estructura completa.
- **Cerrojo que abre solo «sus» muros.** Hoy la llave abre todos los muros del nivel. Como cada nivel tiene un solo cerrojo, el resultado es el mismo. Si preguntan: con varios cerrojos habría que asociar cada uno con sus muros (por ejemplo, con un Observer: el cerrojo publica y sus muros se suscriben).
- **Detalles menores.** El terreno que queda tapado bajo una caja (E4), un nivel que arranca resuelto (E5), el botón deshacer atenuado y el número de empujes que le quedan a la frágil. No afectan la consigna.

## 2. Cómo comprobar todo (cada uno puede hacerlo)

1. `mvn test`: corre las 23 pruebas. Tienen que pasar todas.
   - `ReglasTest` (17): cada regla de la consigna sobre un tablero chico.
   - `NivelesTest` (3): juega la solución de cada nivel y comprueba que se gana.
   - `RepeticionTest` (1): la repetición termina igual que la partida.
   - `JuegoConSonidoTest` (2): el arreglo del sonido del cerrojo.
2. Ejecutar `sokoban.niveles.VerificadorDeNiveles` (en `src/test/java`). Resuelve cada nivel con el motor real, muestra la solución más corta con flechas y dice qué pasa si se quita el cerrojo o el hielo.
3. `mvn package` y `java -jar target/sokoban.jar`, y jugar. Si se traban, las soluciones con flechas las imprime el verificador.
4. Mirar el video `docs/video/gameplay-sokoban.mp4`.

## 3. Los patrones que cambiaron (lo más importante para la defensa)

### Mediator: ahora con dos colegas

**Antes:** solo el `Jugador` hablaba con el mediador. Las estrategias de las cajas tocaban el tablero directamente (`estado.abrirMuros()`, `estado.quitarCaja()`).

**Ahora:**
- **Colegas:** `Jugador` y `Caja`. Ninguno toca el tablero ni conoce al otro.
- **Mediador:** `MediadorMovimiento` (interfaz) y `MotorMovimiento` (concreto).
- **Cómo conversan:** el jugador pide `intentarMover(direccion)`. Una caja avisa `cajaRota(caja)` (la frágil sin resistencia) o `llaveEmpujada(caja)` (la llave después de un empuje). El mediador decide: quita la caja del tablero, o abre los muros si la llave quedó sobre el cerrojo.
- **Cómo se conectan:** el constructor de `MotorMovimiento` llama a `estado.conectarColegas(this)`, que conecta al jugador y a cada caja.
- **Ganancia:**
  - se cortó una dependencia circular (las cajas y las estrategias ya no conocen `EstadoNivel`);
  - todo cambio del tablero por un movimiento pasa por un solo lugar.

Archivos: `modelo/movimiento/*`, `modelo/entidades/Caja.java`, `modelo/estrategias/*`, `EstadoNivel.conectarColegas`.

### Decorator: con decorador base

- **Componente:** `Juego` (interfaz).
- **Componente concreto:** `JuegoSokoban`.
- **Decorador base:** `JuegoDecorado` (abstracta). Guarda el `Juego` envuelto, que recibe en el constructor y no puede ser null, y le pasa los 9 métodos tal cual.
- **Decorador concreto:** `JuegoConSonido`. Hereda del base y sobrescribe solo lo que suena.
- **Si preguntan «¿por qué Decorator y no Observer para el sonido?»:** un observador solo se entera de los cambios que el juego notifica. No vería un choque contra la pared ni un deshacer que no hizo nada. El decorador ve cada pedido y su resultado.
- **Si preguntan «¿una sola combinación?»:** la estructura ya permite apilar decoradores, `new A(new B(new JuegoSokoban()))`, sin tocar nada existente.

### Observer: suscribir y desuscribir

`Juego` tiene `agregarObservador` y `quitarObservador`. `JuegoSokoban` notifica con `notificar()`. Los observadores son `PanelHUD` y `PanelTablero`.

### Strategy: sin cambios de idea

Ahora la estrategia recibe al mediador: `despuesDeEmpujar(caja, mediador)`.
- **Si preguntan por `setEstrategia`:** la estrategia se elige al cargar el nivel y no cambia, porque una caja no cambia de tipo. Si pudiera transformarse, se agregaría el setter.
- **Si preguntan «¿por qué Strategy y no Decorator para las cajas?»:** la consigna no pide combinar tipos (una caja es normal, frágil o llave).

### Memento y Command: sin cambios

Siguen igual que antes. Lo que conviene saber decir:
- **Command guarda acciones; Memento guarda el estado completo.**
- **Deshacer usa Memento y no Command** porque revertir un empuje con lógica inversa obligaría a deshacer a mano el deslizamiento en el hielo, la resistencia, la caja rota, los muros y el plutonio.

## 4. Preguntas probables y respuesta corta

| Pregunta | Respuesta |
|---|---|
| ¿Quién es originador, memento y cuidador? | **Originador:** `JuegoSokoban` (`crearRecuerdo`, `restaurar`). **Memento:** `RecuerdoNivel`. **Cuidadores:** la pila `historial` (deshacer) y `MaquinaDelTiempo` (DeLorean) |
| ¿Cómo se protege el recuerdo? | Su constructor y sus lectores son de paquete; `MaquinaDelTiempo` está en otro paquete y no puede leerlo |
| ¿Quién es el invocador en Command? | `GrabadoraDePartida` ejecuta y anota. **Cliente:** `PantallaJuego`. **Receptor:** `Juego`. `Repeticion` vuelve a ejecutar la lista |
| ¿Por qué la repetición da la misma partida? | Arranca del mismo nivel, ejecuta los mismos comandos y el juego no tiene azar (hay una prueba que lo comprueba) |
| ¿En qué se diferencian State y Strategy? | En **State** el estado decide a cuál pasa (`SonidoActivado` crea un `SonidoSilenciado`). En **Strategy** la elige el cliente desde afuera |
| ¿El Singleton es seguro con hilos? | No, pero todo corre en el hilo de eventos de Swing. Con hilos se usaría `synchronized` o creación anticipada |
| ¿Dónde está el controlador del MVC? | **Entrada:** en Swing vive en la vista (`PantallaJuego` traduce teclas en comandos). **Controlador de GRASP:** `JuegoSokoban` recibe los eventos del sistema |
| ¿Qué cambia para agregar un tipo de caja? | Una estrategia nueva, un caso en `EstadoNivel`, su letra en `tableroParaVista`, su imagen en `PanelTablero` y su letra en `JuegoConSonido`. Son 5 lugares: decirlo con honestidad |
| ¿Cómo saben que los niveles tienen solución? | `VerificadorDeNiveles` los resuelve con el motor real (búsqueda en anchura). Sin el cerrojo, el nivel 2 no tiene solución, y sin el hielo, el nivel 3 tampoco |
| ¿Cómo se calcula el puntaje? | 1000 − 5 por movimiento − 2 por empuje − 50 por deshacer − 100 por viaje (mínimo 0) |
| ¿Qué parte hizo la IA? | Lo que dice la sección 10 del informe. Cada uno tiene que haber leído las clases de su parte y las de las funcionalidades adicionales |

**Repaso sugerido:**
- **Luca:** Facade, Observer, el contrato y el Singleton de `Imagenes`.
- **Pedro y Lucía:** Strategy, Mediator y deshacer.
- **Mora:** Decorator, State y el Singleton de `Sonidos`.
- **Martín:** Memento (DeLorean) y Command (repetición).

Igual cualquiera puede recibir cualquier pregunta.

## 5. Lo que falta antes de entregar

- [ ] **Informe, campos en amarillo:**
  - nombre del equipo;
  - declaración de IA de Luca, de Pedro y Lucía y de Mora;
  - confirmar la fila de Martín.
- [ ] Revisar el video y, si les gusta, subirlo (YouTube sin listar o Drive) para mandar el enlace.
- [ ] Borrar `carpeta-temporal/` de `main` y las ramas `claude/practical-feynman-jv81og` y `feature/sonido`.
- [ ] Mail a jpepe@uade.edu.ar desde un integrante, con copia al resto, nombre del equipo y apellido y nombre de cada uno.
