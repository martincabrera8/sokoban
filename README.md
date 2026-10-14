# Sokoban — Volver al Futuro 🚗⚡

Proyecto académico: adaptación visual del juego clásico **Sokoban** con una estética de viaje en el tiempo inspirada en *Volver al Futuro*.

> **Estado:** preparación de recursos gráficos. El código del videojuego se desarrollará por separado para la materia. Los gráficos se pueden utilizar sin introducir código generado por IA en la lógica del juego.

## Objetivo del juego

Desplazar todas las cajas hasta sus casillas objetivo. El personaje puede empujar una caja por vez, pero no tirar de ellas; paredes y obstáculos delimitan los movimientos válidos.

## Ambientes propuestos

- **1955 — Plaza y torre del reloj:** estética retro, adoquines y arquitectura histórica.
- **1985 — Estacionamiento nocturno:** asfalto, luminarias y señales de electricidad.
- **2015 — Ciudad futurista:** pavimento tecnológico, neón y paneles luminosos.

## Organización de archivos

```text
assets/
  backgrounds/    # Escenarios decorativos (no tienen colisiones)
  characters/     # Personaje en cuatro direcciones
  boxes/          # Cajas para empujar
  goals/          # Destinos de las cajas
  tiles/          # Pisos, muros y obstáculos
  ui/             # Elementos de interfaz
docs/
  consigna.pdf    # Reservado para el PDF de la facultad; pendiente de subir
README.md
```

Los archivos gráficos se preparan para integrarse desde `assets/`. Los recursos jugables son PNG de **64 × 64 píxeles** y deben colocarse sobre una grilla uniforme. Los fondos decorativos pueden escalarse a la resolución de la ventana sin intervenir en las reglas de Sokoban.

## Reglas de integración

1. Dibujar primero el **fondo decorativo** del nivel.
2. Representar el tablero mediante una matriz: suelo, pared y objetivo.
3. Dibujar las **cajas** sobre el suelo y el **jugador** en su posición.
4. Resolver movimiento, colisiones, empuje de cajas y condiciones de victoria **en código propio**.

**Importante:** una imagen de fondo no contiene colisiones ni comportamiento; el programa decidirá qué casillas son transitables.

## Material de la facultad

Cuando esté disponible el enunciado oficial en PDF, incorporarlo como `docs/consigna.pdf`. Hasta que se agregue, este README describe solo el concepto gráfico y las reglas generales del juego, no los requisitos específicos de la materia.

## Créditos

- Basado en la mecánica de **Sokoban**.
- Dirección artística de carácter académico, inspirada en la ciencia ficción y la cultura pop de los ochenta.
- Referencia de dimensiones y categorías: *Kenney Sokoban Pack*. Créditos y licencias de terceros deben mantenerse según sus condiciones.
- Los recursos visuales nuevos y adaptados pueden haber sido elaborados con asistencia de IA. El código del juego queda fuera de ese proceso.

*Uso educativo. No es un producto oficial ni está afiliado a los titulares de la franquicia.*
