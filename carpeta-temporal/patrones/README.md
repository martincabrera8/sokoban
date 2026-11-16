# Fichas de patrones

Una ficha por patrón para repasar antes de la defensa. Cada una se lee en unos 5 minutos y tiene: una frase, el diagrama, la tabla con los roles de la materia, el código real con números de línea, un ejemplo paso a paso, las alternativas, los code smells y la lista de chequeo.

| # | Ficha | Integrante |
|---|---|---|
| 0 | [Mapa: cómo se conectan los 9 patrones](0-mapa.md) | Todos |
| 1 | [Facade](1-facade.md) | Luca |
| 2 | [Observer](2-observer.md) | Luca |
| 3 | [Singleton](3-singleton.md) | Luca y Mora |
| 4 | [Strategy](4-strategy.md) | Pedro y Lucía |
| 5 | [Mediator](5-mediator.md) | Pedro y Lucía |
| 6 | [Decorator](6-decorator.md) | Mora |
| 7 | [State](7-state.md) | Mora |
| 8 | [Memento](8-memento.md) | Martín |
| 9 | [Command](9-command.md) | Martín |

## Cómo leer los diagramas

- Primer estereotipo: `«interface»`, `«abstract»` o `«final»`. Segundo: el rol del patrón con el nombre de la materia (por ejemplo `«Sujeto»`, `«Observador concreto»`).
- Línea punteada con triángulo vacío: "implementa" una interfaz. Línea llena con triángulo vacío: "hereda".
- Flecha llena: "tiene un" (atributo); la etiqueta es el nombre del atributo y el número en la punta, la multiplicidad (`1`, `0..1`, `*`, `0..15`). Flecha punteada: "usa" o "crea" (un `new`, un parámetro, una variable local o una llamada).
- Línea llena con punta en los dos lados: asociación bidireccional, los dos lados tienen atributo (ficha 5). Círculo con una cruz: clase anidada (ficha 8).
- `+` público, `-` privado, `#` protegido, `~` de paquete. Subrayado: `static`.
- Solo están las clases y los métodos que importan para el patrón. Nada de getters.
- Todo lo que aparece en un diagrama existe así en el código: nombre de la clase, atributos (visibilidad, nombre y tipo), firmas de los métodos y cada línea. Los diagramas pueden omitir cosas, pero no agregarlas ni cambiarlas.

## Cómo regenerar los PNG

Cada `.png` tiene al lado su `.puml`. Con PlantUML:

```
java -jar plantuml.jar -tpng *.puml
```

Los números de línea de las fichas corresponden al código de `src/main/java/sokoban/` tal como está ahora. Si se cambia el código, hay que revisarlos.

## Lo que queda para discutir en equipo

Desvíos de la estructura clásica y smells que siguen en el código. Cada uno dice si lo podemos defender o si conviene arreglarlo.

1. **`JuegoConSonido` llama a `Sonidos.obtenerInstancia()` adentro** (Decorator + Singleton): no justificado; recibir `Sonidos` por constructor permitiría probarlo.
2. **No hay pruebas de Decorator, State ni Singleton**: no justificado; las 24 pruebas cubren solo el modelo y la repetición.
3. **La fachada tiene reglas** (`JuegoSokoban.mover` decide `CAJA_EN_DESTINO`, `VICTORIA` y cuándo guardar un punto) **y tres roles** (fachada, sujeto, componente): a medias; coordina varias clases del subsistema.
4. **`notificarObservadores()` es público en `Juego`** y el decorador lo reenvía: a medias; es el Sujeto de la materia, pero cualquier cliente podría forzar un aviso.
5. **Dos formas de reaccionar a la partida**: el HUD y el tablero observan, los carteles los muestra `PantallaJuego` preguntando `getEstado()`; a medias, por eso en la repetición no aparece el aviso del punto en el tiempo.
6. **Strategy sin `setEstrategia`**: justificado (una caja no cambia de tipo). **Crear estrategias no es OCP** (switch en `EstadoNivel`, `sobreDestino`, `CAPAS`): a medias. **`resistencia` en `Caja`**: justificado por el Memento. **`simbolo()` en la estrategia**: a medias.
7. **Mediator con un método por efecto de caja** (`cajaDanada`, `cajaRota`, `llaveEmpujada`): a medias, típico del patrón. **`evento` como canal lateral** en `MotorMovimiento`: a medias. **`EstadoNivel` y `MotorMovimiento` tienen los dos al jugador y a las cajas**: justificado, el motor guarda una vista de solo lectura de la misma lista (`getCajas()`), así ve las cajas rotas o restauradas sin actualizar nada. **`setPosicion` es público en `ElementoMovil`**: a medias, lo necesita el Memento. **Hay que reconectar el mediador al restaurar** (las cajas copiadas no lo traen): justificado, está resuelto en `restaurar`.
8. **Ciclos entre paquetes** (`EstadoNivel` y `movimiento`; `entidades` y `movimiento`; `Caja` y `estrategias`): a medias; compila y es esperable en un Mediator, donde el mediador y sus colegas se conocen.
9. **Memento protegido por paquete y no por clase**: a medias; cualquier clase de `sokoban.modelo` podría leerlo; una clase anidada lo cerraría. **Guarda objetos mutables**: justificado, el originador copia al crear y al restaurar. **Foto aunque el paso choque**: justificado.
10. **Command sin `deshacer()`**: justificado, el deshacer es Memento. **Invocador con `javax.swing.Timer`** (graba y programa): a medias. **La repetición depende de reiniciar el nivel antes**: a medias, está documentado. **Reiniciar no es comando**: justificado.
11. **Singleton perezoso sin sincronizar**: justificado, todo corre en el hilo de Swing. **Dependencias ocultas** en los paneles: a medias. **`Sonidos` hace cuatro cosas** (Singleton, contexto del State, carga y reproduce): a medias.
12. **State con solo dos estados**: a medias; un `boolean` alcanzaría hoy, pero el patrón deja sumar estados sin `if`.
13. **Menores**: `getEstado()` arma la foto completa 4 veces por movimiento (justificado, tablero chico); `Evento` existe sobre todo para el sonido (justificado, es un evento de dominio); nombres `...Strategy` en inglés (detalle); `JuegoSokoban()` sin argumentos solo lo usan las pruebas (detalle).
