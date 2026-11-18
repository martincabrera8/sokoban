---
title: "Sokoban · Por qué usamos cada patrón (y no otro)"
lang: es
---

**Idea general.** La vista (Swing) no conoce el dominio. Habla con una sola puerta (`Juego`) y se entera de los cambios por aviso. Adentro, cada problema del juego tiene su patrón. Para cada uno: **el problema**, **cómo lo aplicamos**, **por qué así** y **por qué no otro patrón**, que es lo que más probablemente pregunten.

## 1. MVC: separar lo que se ve de las reglas

- **Problema:** si las reglas viven mezcladas con Swing, no se pueden probar ni cambiar la pantalla sin romper el juego.
- **Cómo:**
  - *Modelo:* `modelo/`, con las reglas, el nivel y las cajas.
  - *Vista:* `vista/`, con las pantallas y los paneles.
  - *Controlador de entrada:* `PantallaJuego`, que convierte cada tecla en un comando.
  - *Controlador de GRASP:* `JuegoSokoban`.
- **Por qué:** el modelo no importa nada de Swing. Por eso las 24 pruebas corren sin abrir ninguna ventana.
- **¿Por qué no poner la lógica en los botones y las teclas?** Cada `actionPerformed` tendría reglas de Sokoban adentro. Cambiar la pantalla obligaría a reescribir el juego y no se podría probar nada sin abrir la ventana.

## 2. Facade: una sola puerta al juego · *Luca*

- **Problema:** la vista tendría que hablar con el nivel, el motor, el deshacer, el DeLorean y el puntaje, y quedaría acoplada a todo.
- **Cómo:**
  - La interfaz `Juego` tiene 7 métodos simples: `mover`, `deshacer`, `reiniciar`, `viajarEnElTiempo`, `iniciarNivel`, `getEstado` y `getCantidadNiveles`.
  - `JuegoSokoban` la implementa y reparte el trabajo entre `EstadoNivel`, `MotorMovimiento`, `HistorialDeshacer`, `MaquinaDelTiempo`, `Puntaje` y `CargadorNivel`.
- **Por qué:** la vista depende de una interfaz y no de clases concretas (DIP, bajo acoplamiento). Por eso la vista se pudo hacer antes que el dominio.
- **¿Por qué Facade y no Mediator?**
  - En el **Facade** la comunicación va en un solo sentido: la vista llama a la fachada y la fachada llama a las clases de adentro, que no saben que la fachada existe.
  - En el **Mediator** los colegas conocen al mediador y le hablan (ida y vuelta).
  - La vista no necesita coordinar a nadie: solo necesita una puerta simple.
- **¿Por qué Facade y no Adapter?** El Adapter **convierte** una interfaz incompatible; el Facade **simplifica** un subsistema. Acá no había nada incompatible, había demasiadas clases.

## 3. Observer: la pantalla se actualiza sola · *Luca*

- **Problema:** cuando el jugador se mueve, el HUD y el tablero se tienen que redibujar, pero el dominio no puede conocer clases de Swing.
- **Cómo:**
  - `SujetoJuego` tiene `agregarObservador`, `quitarObservador` y `notificarObservadores`.
  - `JuegoSokoban` guarda la lista y, después de cada acción, le manda a cada observador una foto de la partida (`EstadoJuego`).
  - `PanelHUD` y `PanelTablero` implementan `ObservadorJuego.actualizar(estado)`.
- **Por qué:** el dominio solo conoce la interfaz del observador. La foto es inmutable, así la vista no puede saltearse las reglas.
- **¿Por qué no que la vista le pregunte al juego cada tanto?** Tendría que preguntar todo el tiempo, aunque no haya pasado nada (lo que se llama *polling*). Con Observer el juego avisa solo cuando algo cambió.
- **¿Por qué no que el juego llame directo a `hud.repintar()`?** El dominio quedaría atado a Swing. Con la interfaz `ObservadorJuego` no sabe quién lo escucha, y se pueden sumar observadores sin tocarlo (OCP).

## 4. Singleton: una sola caché · *Luca (`Imagenes`) y Mora (`Sonidos`)*

- **Problema:** las imágenes y los sonidos se usan en muchos lugares. Conviene cargarlos del disco una sola vez y compartirlos.
- **Cómo:** constructor privado, atributo `static instancia` y método `static obtenerInstancia()`.
- **Por qué:** garantiza una sola instancia, accesible desde cualquier lado. No es seguro con varios hilos, pero todo corre en el hilo de Swing.
- **¿Por qué no crear un `new Imagenes()` en cada panel?** Cada panel volvería a leer los mismos archivos del disco y habría varias copias en memoria. En el caso del sonido, cada copia tendría su propio estado activado o silenciado, y la tecla M silenciaría solo a una.
- **¿Por qué no una clase con todo `static`?** `Sonidos` necesita ser un objeto, porque es el contexto del State: guarda su estado actual y delega en él. Además, con el Singleton la carga se hace recién la primera vez que se pide.

## 5. Strategy: cada caja con su regla · *Pedro y Lucía*

- **Problema:** la caja normal, la frágil y la llave se mueven igual, pero después del empuje hacen cosas distintas. Con `if` o `switch` por tipo, cada caja nueva obliga a tocar el código existente.
- **Cómo:** `Caja` (el contexto) tiene un `ComportamientoCaja` (la estrategia):
  - `CajaNormalStrategy` no hace nada;
  - `CajaFragilStrategy` le resta resistencia y al tercer empuje la rompe;
  - `CajaLlaveStrategy` abre los muros si queda sobre el cerrojo.
- **Por qué:**
  - Cada comportamiento vive en su propia clase (OCP).
  - No hay `setEstrategia` porque una caja nunca cambia de tipo.
- **¿Por qué Strategy y no State?** En **State** el objeto cambia de comportamiento solo, según lo que le pasa (como el sonido con la M). Una caja **nunca deja de ser** lo que es: la frágil no se convierte en llave. El comportamiento se elige una vez, al cargar el nivel.
- **¿Por qué Strategy y no herencia (`CajaFragil extends Caja`)?** Composición antes que herencia: `Caja` se queda con lo que todas comparten (la posición y el mediador), y lo que cambia va aparte, en una clase chica y fácil de probar.
- **¿Por qué no Decorator?** El Decorator sirve para **combinar** comportamientos (frágil y llave a la vez). La consigna no pide combinar tipos de caja.

## 6. Mediator: nadie se mueve solo · *Pedro y Lucía*

- **Problema:** el jugador, las cajas, las paredes, el hielo y los cerrojos se afectan entre sí. Si cada uno conociera a los demás, quedaría una red de dependencias.
- **Cómo:**
  - `ElementoMovil` (el rol de "colega") es la base de `Jugador` y `Caja`, y guarda al `mediador`.
  - El jugador le pide `intentarMover(direccion)`. Las cajas le avisan `cajaDanada`, `cajaRota` o `llaveEmpujada`.
  - `MotorMovimiento` (el mediador concreto) conoce al jugador y a las cajas, y resuelve choques, empujes, hielo y cerrojos.
  - En el UML va una sola flecha bidireccional, como pide el profesor, porque se conocen mutuamente.
- **Por qué:** todas las reglas de movimiento quedan en un solo lugar y las piezas no se conocen entre sí.
- **¿Por qué Mediator y no Observer?** Es la pregunta más probable:
  - El **Observer difunde**: el sujeto avisa «cambié» a quien quiera escuchar, no espera respuesta y no decide nada sobre los demás.
  - El **Mediator coordina**: el jugador **pregunta** «¿me puedo mover?» y necesita una respuesta (choque, empuje, deslizamiento). Para responder hay que mirar a varios objetos a la vez: la pared, la caja de adelante, el hielo y el cerrojo.
  - Esa decisión tiene que estar en algún lado. Con Observer quedaría repartida entre los que escuchan; con Mediator está en un solo lugar.
- **¿Por qué no que la caja mueva a la caja de al lado, o que el jugador mire el tablero?** Sería la red de dependencias que el patrón evita: cada regla nueva (hielo, cerrojo) obligaría a tocar al jugador y a las cajas.

## 7. Decorator: sonido sin tocar el juego · *Mora*

- **Problema:** agregar sonido sin modificar ni el dominio ni la vista.
- **Cómo:**
  - `JuegoDecorado` (el decorador base) envuelve a otro `Juego` y le pasa todo.
  - `JuegoConSonido` hereda de él: primero llama al juego real y después hace sonar el efecto de lo que pasó (`Sonido.de(evento)`).
  - En `Main`: `new JuegoConSonido(new JuegoSokoban(...))`.
- **Por qué:** se agrega comportamiento sin cambiar las clases existentes (OCP), y se saca cambiando una línea.
- **¿Por qué Decorator y no Observer?** Un observador solo se entera cuando el juego **cambia** y avisa. Un choque contra la pared no cambia nada, así que no habría aviso y no sonaría el golpe. El decorador ve **cada pedido** y su resultado, cambie o no el juego.
- **¿Por qué no `JuegoSokobanConSonido extends JuegoSokoban`?** La herencia ata el sonido a una clase concreta: si mañana hay otro `Juego`, habría que heredar de nuevo. El decorador envuelve a **cualquier** `Juego` y se pueden apilar varios.
- **¿Por qué no poner el sonido adentro de `JuegoSokoban`?** El dominio dependería de `javax.sound` y tendría dos responsabilidades (SRP).

## 8. State: sonido activado o silenciado · *Mora*

- **Problema:** con la tecla M, el sonido se comporta distinto ante el mismo pedido de "reproducir".
- **Cómo:**
  - `Sonidos` (el contexto) delega en su estado actual: `SonidoActivado` reproduce y `SonidoSilenciado` no hace nada.
  - Cada estado decide a cuál pasa cuando se aprieta M.
- **Por qué:** no hay `if (silenciado)` repartidos por el código.
- **¿Por qué no un simple `boolean silenciado`?** Con dos estados alcanzaría, pero cada método de `Sonidos` tendría su `if`, y un tercer estado (por ejemplo, «solo música») obligaría a revisarlos todos. Con State se agrega una clase.
- **¿Por qué State y no Strategy?** Tienen el mismo diagrama, pero en **State el propio estado decide el cambio** (`SonidoActivado` pasa a `SonidoSilenciado`) y el cambio pasa mientras el programa corre. En **Strategy** la elige alguien de afuera y no suele cambiar.

## 9. Memento: el deshacer y el DeLorean · *Martín*

- **Problema:** volver a un momento anterior del nivel implica devolver la caja que se deslizó, la frágil rota, los muros abiertos y el plutonio. Hacerlo "al revés", paso por paso, sería muy complicado.
- **Cómo:**
  - `EstadoNivel` (el originador) crea un `RecuerdoNivel`, una foto completa, y sabe restaurarse desde él.
  - Hay dos cuidadores que guardan las fotos sin poder leerlas: `HistorialDeshacer`, con la regla de 15/5/3, y `MaquinaDelTiempo`, con los puntos en el tiempo del DeLorean.
- **Por qué:**
  - Se restaura el estado entero sin escribir la lógica inversa de cada regla.
  - El recuerdo solo lo lee el originador: sus métodos son de paquete y los cuidadores están en otro paquete.
- **¿Por qué el deshacer no usa Command con `deshacer()`?** Cada comando tendría que saber revertirse: devolver la caja que se deslizó en el hielo, recomponer la frágil rota, volver a cerrar los muros y devolver el plutonio. Son muchos casos y es fácil equivocarse. Con Memento se vuelve a la foto y listo.
- **¿Por qué no copiar los atributos del nivel desde afuera?** Habría que hacer públicos todos los datos internos del nivel (se rompe el encapsulamiento). En el Memento el nivel arma y lee su propia foto.

## 10. Command: la repetición de la partida · *Martín*

- **Problema:** grabar lo que hace el jugador para poder reproducirlo después.
- **Cómo:**
  - Cada acción es un objeto `Comando`: `ComandoMover`, `ComandoDeshacer` y `ComandoViajarEnElTiempo`.
  - `PantallaJuego` (el cliente) los crea.
  - `GrabadoraDePartida` (el invocador) los ejecuta, los guarda y al final los vuelve a ejecutar en "Ver repetición".
  - El receptor es `Juego`.
- **Por qué:** al ser objetos, las acciones se pueden guardar y repetir. Como el juego no tiene azar, la repetición sale idéntica.
- **¿Por qué no guardar una foto (Memento) por cada paso?** Funcionaría, pero serían cientos de copias del tablero solo para mirarlas. El comando guarda la **acción**, que es chica, y la repetición la vuelve a ejecutar sobre el juego real.
- **¿Por qué no guardar solo una lista de direcciones?** Una lista de flechas no cubre el deshacer ni el viaje en el tiempo. Con Command las tres acciones tienen la misma forma (`ejecutar()`) y la grabadora las trata igual sin saber cuál es cuál.

> **Command o Memento:** Command guarda **acciones** (para la repetición) y Memento guarda el **estado completo** (para deshacer y viajar). Usamos los dos, cada uno para lo suyo.

## ¿Y el Adapter?

No lo usamos: no hay ninguna clase existente con una interfaz incompatible que haya que adaptar, y el profesor dijo que en el Sokoban difícilmente aparezca. Forzarlo sería peor que no usarlo. Lo más parecido es `Sonidos`, que esconde `javax.sound` detrás de `reproducir(...)`, pero eso es **Facade**: simplifica, no convierte.
