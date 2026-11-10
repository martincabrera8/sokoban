# Dirección de arte: presentación del Sokoban

## Lectura del pedido
Presentación de avance del trabajo integrador (Proceso de Desarrollo de Software, UADE), proyectada en el aula, para el profesor y el curso. Muestra lo hecho hasta hoy (arte, interfaz, integración, patrones y UML) y lo que falta.
Diales: variación 8, movimiento 6, densidad 3.

## Idea
**El proyecto es un nivel de Sokoban que todavía estamos resolviendo.** Cada parte del trabajo es una caja; lo terminado está sobre su destino y lo pendiente todavía hay que empujarlo. El mismo tablero, con el arte real de Martín (pisos, paredes, cajas, destinos, el personaje en sus cuatro direcciones), aparece en 3D en la portada y el cierre, y en 2D como material de los diagramas.

## No es
- Una presentación azul noche con acentos neón genéricos: el azul sale del cielo nocturno de los fondos de Martín y el acento es el naranja del destino (`goal.png`).
- Tarjetas de ícono + título + texto, barras o tortas por defecto, rectángulos con flechas.
- Personajes, logos o nombres con derechos (las épocas se nombran solo por año).

## Sistema
**Paleta** (medida de los PNG de `assets/`):

| Rol | Hex | De dónde sale |
|---|---|---|
| fondo | `#0B1630` | cielo de los fondos 1955 / 1985 |
| superficie | `#142035` | fondo del cartel `pantalla_menu` |
| superficie-2 | `#1C2F4E` | panel del cartel |
| linea | `#79DCF4` | borde celeste del cartel (al 10–30 %) |
| tinta | `#EBF8FF` | texto del cartel |
| tinta-2 | `#B9C8DA` | |
| tinta-3 | `#8193AE` | |
| titulo | `#F8E4A5` | título dorado del cartel |
| acento | `#FFB245` | el destino (`goal.png`): lo que está en su lugar |
| exito | `#8CEAF5` | números del HUD |
| pendiente | `#D69765` | madera de la caja todavía sin ubicar |
| 1955 · 1985 · 2015 | `#D0614F` · `#8E7CE0` · `#27A898` | ladrillo, neón del shopping, panel del futuro (validadas con el script de dataviz: CVD y contraste OK) |

**Tipografía**
- Display: Pixelify Sans, solo en títulos y cifras (habla el idioma de los sprites).
- Texto: Atkinson Hyperlegible Next, diseñada para baja visión, rinde en un proyector lavado.
- Mono: JetBrains Mono, solo para código Java.

**Componentes:** cartel (superficie con borde celeste de 1 px, sombra en capas, radio 14), rótulo pegado, cifra con unidad, chip de código, baldosa (64 px, pixel art con `image-rendering: pixelated`).

**Movimiento:** las cajas se empujan (traslación en pasos de baldosa, ease seca), las líneas se dibujan, los documentos vuelan desde su lugar, el mazo se reparte. Vida con fases al azar; nada en bucle visible.

## Mapa de diagramas

| # | Diapositiva | Frase | Forma | Metáfora | Composición | Qué se mueve |
|---|---|---|---|---|---|---|
| 1 | Portada | Un almacén que cambia de época | Escena 3D con las baldosas reales | El nivel | Tablero a la derecha en perspectiva, título abajo a la izquierda | El personaje empuja una caja al destino (intro); deriva leve de cámara |
| 2 | El equipo | Cinco partes, tres en su lugar | Tablero 2D cenital: cada parte es una caja con su nombre | Cajas sobre destinos | Tablero a sangre en la mitad izquierda, ficha de avance a la derecha | El personaje empuja las tres cajas terminadas; las pendientes esperan |
| 3 | El arte | 101 imágenes, 28 ya en el juego | Mazo de baldosas que se reparte en estantes por carpeta | Depósito ordenado | Estantes a lo ancho, cifra pegada | Se reparte el mazo; se encienden las 28 en uso; brillo al azar |
| 4 | La interfaz | Cinco pantallas, un recorrido | Capturas reales unidas por el camino del jugador | Mapa de recorrido | Diagonal ascendente | Se dibuja el camino; una captura vuela al frente |
| 5 | Arquitectura | La vista nunca toca el dominio | Tres placas isométricas apiladas | Capas de un edificio | Pila centrada a la izquierda, rótulos anclados | Se encastran las placas; el bloque de prueba sale y entra el dominio |
| 6 | Observer | Un movimiento, todos se enteran | Tablero chico + HUD real + ondas que viajan | Aviso que se propaga | Sujeto a la izquierda, observadores en arco | El jugador se mueve solo cada tanto; la onda llega y los contadores suben |
| 7 | Facade | Una sola puerta | Una llamada que entra por una puerta que se abre | Mostrador | Llamada a la izquierda, puerta al centro, piezas detrás | La puerta gira y deja ver el subsistema pendiente |
| 8 | Singleton | Cada imagen se lee una vez | Pedidos que convergen en una caché única, contadores en vivo | Depósito con una sola llave | Tres clientes en columna, caché al centro, disco a la derecha | Pedidos al azar; la cuenta de lecturas se frena en 28 |
| 9 | UML | Todo el diseño en un plano | El diagrama completo real con zoom por zonas | Plano | A sangre | Zoom por `viewBox` de zona en zona |
| 10 | Lo que falta | Seis cerrojos por abrir | Mapa de niveles con cerrojos (assets reales) | Caja llave que abre muros | Fila de cerrojos en escalera | Se abren los que ya están; los pendientes quedan cerrados |
| 11 | Cierre | Próximo nivel: el dominio | Vuelve la escena 3D, cámara alta | El nivel siguiente | Tablero completo | La cámara se aleja; la última caja espera |

## Skills de este trabajo
Siempre: find-skills, frontend-design, design-taste-frontend, ui-ux-pro-max, theme-factory, brand-guidelines, web-design-guidelines, stop-slop, design:ux-copy, impeccable, design:design-critique, design:accessibility-review.
Por contenido: dataviz (diagramas), 3d-web-experience (escena), pdf / resumenes-de-estudio (si se pide el guion).
No instaladas en esta sesión: craft-design-engineering, accessibility-performance, webapp-testing, diagram-animation, gsap-core, gsap-timeline, gsap-plugins, gsap-scrolltrigger, animation-performance, isometric-animation, context7.
