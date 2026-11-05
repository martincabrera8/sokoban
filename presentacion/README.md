# Presentación del Sokoban

Presentación animada (2D y 3D) del avance del trabajo integrador. Es **un solo archivo HTML que funciona sin internet**:

```
presentacion/dist/presentacion-sokoban.html
```

Abrilo con Chrome o Edge (doble clic) y apretá **F11** para pantalla completa. Se adapta a 1280×720, 1920×1080 y 2560×1440.

## Tarjeta de teclas (no se ven en pantalla)

| Tecla | Qué hace |
|---|---|
| → · Espacio · Enter · AvPág | Siguiente paso o siguiente diapositiva |
| ← · RePág | Diapositiva anterior (ya armada) |
| Inicio / Fin | Primera / última diapositiva |
| R | Repite la animación de la diapositiva |
| Z | Pausa o reanuda todas las animaciones |
| H | Oculta todo (pantalla limpia) |
| N | Abre las notas del expositor con reloj, en otra ventana |
| Esc | Cierra las notas y vuelve a mostrar todo |

Un control remoto de presentaciones (clicker) funciona igual, porque manda AvPág y RePág.
La intro se reproduce sola al abrir; el resto avanza solo cuando apretás una tecla.

## Diapositivas

1. Intro 3D: el personaje empuja la N y se enciende "SOKOBAN".
2. Portada: el almacén en 3D con las tres épocas.
3. El equipo: cada parte es una caja; tres ya en su destino.
4. El arte de Martín: 101 imágenes, 28 en uso.
5. Las tres épocas en 3D (1955, 1985, 2015).
6. La interfaz de Luca: las cinco pantallas reales.
7. Arquitectura: la vista no toca el dominio.
8. Observer, en vivo.
9. Facade.
10. Singleton, con contadores simulados.
11. El diagrama UML completo, con zoom por zonas.
12. Lo que falta.
13. Cierre en 3D.

## Cómo cambiarla

```
presentacion/
  index.src.html        ← textos de cada diapositiva y notas del expositor
  src/tokens.css        ← único lugar con colores, tipografías, tamaños y tiempos
  src/componentes.css   ← cada componente definido una vez
  src/datos.js          ← datos reales (partes del equipo, imágenes en uso, entregas)
  src/diagramas/*.js    ← un archivo por diagrama (montar, construir, vida)
  src/escena3d.js       ← tablero 3D con las baldosas de assets/
  src/personaje3d.js    ← el personaje en vóxeles
  src/motor.js          ← navegación, pasos y transiciones
  build.py              ← control de calidad y armado del HTML único
```

- **Cambiar un texto:** `index.src.html`.
- **Cambiar un dato** (por ejemplo, cuando llegue el dominio): `src/datos.js` (en `PARTES` y `ENTREGAS`, poner `listo: true`).
- **Cambiar la paleta o las tipografías:** solo `src/tokens.css`.

Para volver a armar el HTML (necesita Node y Python con Pillow):

```bash
cd presentacion
npm install
python3 build.py
```

`build.py` primero controla que no haya colores ni tipografías fuera de `tokens.css`, estilos sueltos en el HTML, rayas largas en los textos ni código sin usar; si algo falla, no arma.

## Notas

- Las animaciones respetan la opción del sistema "reducir movimiento": se muestra cada diapositiva armada, sin vida.
- Si la PC no tiene aceleración 3D, las escenas 3D muestran una captura del juego en su lugar. En una PC lenta, el resplandor de la intro se apaga solo.
- El Observer y el Singleton muestran **simulaciones**, y así lo dicen en pantalla.
- Safari en iPhone o iPad: no verificado.
