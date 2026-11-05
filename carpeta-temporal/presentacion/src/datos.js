/* Datos reales de la presentación, con su fuente. Nada de datos dentro del dibujo. */

/** Nivel de la escena 3D: el mismo almacén atraviesa 1955 (columnas 1-3), 1985 (4-6) y 2015 (7-9). Inventado para la portada. */
export const NIVEL_ESCENA = [
  "###########",
  "#    .    #",
  "#      *  #",
  "# @$ .    #",
  "#     $ . #",
  "#         #",
  "###########",
];

/** Partes del trabajo. Fuente: historial de commits del repo y docs/integracion.md. */
export const PARTES = [
  { nombre: "Arte", quien: "Martín", detalle: "104 imágenes en assets/", listo: true },
  { nombre: "Interfaz Swing", quien: "Luca", detalle: "13 archivos Java: menú, HUD, tablero, carteles", listo: true },
  { nombre: "Integración", quien: "Martín y Luca", detalle: "épocas y personaje en 4 direcciones", listo: true },
  { nombre: "Dominio y personaje", quien: "pendiente", detalle: "lo tiene hecho un compañero, falta subirlo", listo: false },
  { nombre: "Música y sonido", quien: "pendiente", detalle: "la tiene hecha otro compañero, falta subirla", listo: false },
];

/** Imágenes que hoy usa el juego (28). Fuente: rutas en src/main/java/sokoban/vista/*.java. */
export const USADAS = [
  "backgrounds/background_future_2015", "backgrounds/background_hill_valley_1955", "backgrounds/background_mall_1985",
  "boxes/box_wood", "boxes/caja_fragil_intacta", "boxes/caja_llave",
  "characters/player_down", "characters/player_left", "characters/player_right", "characters/player_up",
  "goals/goal", "goals/goal_placed",
  "tiles/cerrojo_cerrado", "tiles/floor_1955", "tiles/floor_1985", "tiles/floor_2015", "tiles/muro_abierto", "tiles/muro_cerrado",
  "tiles/terreno_resbaladizo", "tiles/wall_brick", "tiles/wall_future", "tiles/wall_mall",
  "ui/boton_pause", "ui/boton_restart", "ui/boton_undo", "ui/indicador_empujes", "ui/indicador_movimientos", "ui/indicador_nivel",
];

/** Orden de los estantes del depósito de arte (carpetas de assets/). */
export const ESTANTES = ["characters", "boxes", "goals", "backgrounds", "ui", "tiles"];

/** Pantallas de la interfaz. Fuente: docs/interfaz.md y docs/capturas/. */
export const PANTALLAS = [
  { clave: "menu", nombre: "Menú", alt: "Menú principal con un botón por nivel" },
  { clave: "partida", nombre: "Partida", alt: "Partida con el HUD arriba y el tablero de 1985" },
  { clave: "pausa", nombre: "Pausa", alt: "Cartel de pausa sobre la partida" },
  { clave: "completado", nombre: "Nivel completado", alt: "Cartel de nivel completado con movimientos, empujes y puntaje" },
  { clave: "resultados", nombre: "Resultados", alt: "Cartel de resultados del último nivel" },
];

/** Capas de la arquitectura. Fuente: src/main/java/sokoban/. */
export const CAPAS = {
  vista: ["VentanaPrincipal", "MenuPrincipal", "PantallaJuego", "PanelHUD", "PanelTablero", "Cartel", "Imagenes", "Epoca"],
  contrato: ["Juego", "ObservadorJuego", "EstadoJuego", "Direccion"],
};

/** Nivel del juego de prueba que usa el Observer en vivo. Fuente: JuegoDePrueba, nivel 3. */
export const NIVEL_PRUEBA = [
  "########",
  "#  .   #",
  "# $##$ #",
  "#   @ .#",
  "########",
];

/** Piezas que va a coordinar el dominio detrás de la fachada (consigna; nombres de ejemplo). */
export const SUBSISTEMA = [
  { nombre: "Tablero", img: "tiles/floor_1985", usa: true },
  { nombre: "Jugador", img: "characters/player_down", usa: true },
  { nombre: "Caja normal", img: "boxes/box_wood", usa: true },
  { nombre: "Caja frágil", img: "boxes/caja_fragil_intacta", usa: false },
  { nombre: "Caja llave", img: "boxes/caja_llave", usa: false },
  { nombre: "Niveles .txt", img: "tiles/terreno_resbaladizo", usa: false },
  { nombre: "Historial 15 · 5 · 3", img: "ui/boton_undo", usa: true },
  { nombre: "Puntaje", img: "ui/indicador_movimientos", usa: true },
];

/** Lo que pide la consigna. Fuente: docs/consigna-prof-pepe.pdf y docs/integracion.md. */
export const ENTREGAS = [
  { nombre: "Arte", listo: true },
  { nombre: "Interfaz Swing", listo: true },
  { nombre: "UML de revisión", listo: true },
  { nombre: "Dominio y personaje", listo: false },
  { nombre: "Música y sonido", listo: false },
  { nombre: "Dos funcionalidades con patrones", listo: false },
  { nombre: "Diagrama en StarUML", listo: false },
  { nombre: "Informe técnico", listo: false },
  { nombre: "Video de gameplay", listo: false },
];
