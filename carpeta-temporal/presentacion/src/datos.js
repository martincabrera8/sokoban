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

/** Partes del trabajo. Fuente: historial de commits del repo (dominio: commits de Pedro del 6/11 y 9/11; sonido: pull request 1 de Mora, 9/11). */
export const PARTES = [
  { nombre: "Arte", quien: "Martín", detalle: "104 imágenes en assets/", listo: true },
  { nombre: "Interfaz Swing", quien: "Luca", detalle: "13 archivos Java: menú, HUD, tablero, carteles", listo: true },
  { nombre: "Integración", quien: "Martín y Luca", detalle: "épocas y personaje en 4 direcciones", listo: true },
  { nombre: "Dominio y personaje", quien: "Pedro y Lucía", detalle: "3 cajas, hielo, cerrojos y deshacer", listo: true, recien: true },
  { nombre: "Sonido", quien: "Mora", detalle: "14 efectos propios y tecla M", listo: true, recien: true },
];

/** Imágenes que hoy usa el juego (30). Fuente: rutas en src/main/java/sokoban/vista/*.java. */
export const USADAS = [
  "backgrounds/background_future_2015", "backgrounds/background_hill_valley_1955", "backgrounds/background_mall_1985",
  "boxes/box_wood", "boxes/caja_fragil_danada", "boxes/caja_fragil_intacta", "boxes/caja_llave",
  "characters/player_down", "characters/player_left", "characters/player_right", "characters/player_up",
  "goals/goal", "goals/goal_placed",
  "tiles/cerrojo_abierto", "tiles/cerrojo_cerrado", "tiles/floor_1955", "tiles/floor_1985", "tiles/floor_2015", "tiles/muro_abierto", "tiles/muro_cerrado",
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
  dominio: "JuegoSokoban",
  decorador: "JuegoConSonido",
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

/** Piezas reales que coordina JuegoSokoban detrás de la fachada. Fuente: src/main/java/sokoban/modelo/. */
export const SUBSISTEMA = [
  { nombre: "CargadorNivel", img: "tiles/terreno_resbaladizo" },
  { nombre: "EstadoNivel", img: "tiles/floor_1985" },
  { nombre: "Historial 15 · 5 · 3", img: "ui/boton_undo" },
  { nombre: "MotorMovimiento", img: "ui/indicador_empujes" },
  { nombre: "Jugador", img: "characters/player_down" },
  { nombre: "Caja normal", img: "boxes/box_wood" },
  { nombre: "Caja frágil", img: "boxes/caja_fragil_intacta" },
  { nombre: "Caja llave", img: "boxes/caja_llave" },
];

/** Niveles reales del juego. Fuente: niveles/nivel2.txt y niveles/nivel3.txt (F frágil, L llave, C cerrojo, X muro, ~ hielo). */
export const NIVEL_LLAVE = [
  "#############",
  "#           #",
  "# @ F .     #",
  "#   L C X . #",
  "#           #",
  "#############",
];
export const NIVEL_HIELO = [
  "###########",
  "#         #",
  "# @$~  .  #",
  "#         #",
  "###########",
];

/** Reglas del deshacer. Fuente: constantes de JuegoSokoban. */
export const DESHACER = { historial: 15, pasos: 5, seguidos: 3 };

/** Lo que pide la consigna. Fuente: docs/consigna-prof-pepe.pdf y el estado del repo al 9/11. */
export const ENTREGAS = [
  { nombre: "Arte", listo: true },
  { nombre: "Interfaz Swing", listo: true },
  { nombre: "Dominio y personaje", listo: true },
  { nombre: "Sonido", listo: true },
  { nombre: "UML de revisión", listo: true },
  { nombre: "Dos funcionalidades con patrones", listo: false },
  { nombre: "Diagrama en StarUML", listo: false },
  { nombre: "Informe técnico", listo: false },
  { nombre: "Video de gameplay", listo: false },
];

/** Los 14 efectos del enum Sonido con su archivo de assets/sonidos/, su duración (s) y la envolvente real de la onda:
 *  el pico de cada uno de 40 tramos, de 0 a 1 (leído de los .wav con el módulo wave de Python). */
export const SONIDOS = [
  { clave: "PASO", archivo: "paso.wav", seg: 0.06, onda: [.12,.12,.22,.27,.19,.25,.21,.17,.20,.18,.13,.15,.14,.12,.12,.11,.09,.09,.08,.08,.08,.07,.06,.06,.05,.05,.05,.04,.04,.04,.03,.03,.03,.02,.03,.02,.02,.02,.02,.01] },
  { clave: "EMPUJE", archivo: "empuje.wav", seg: 0.16, onda: [.40,.59,.50,.49,.46,.36,.35,.32,.27,.24,.23,.20,.18,.15,.16,.15,.12,.10,.10,.09,.08,.06,.07,.06,.05,.05,.05,.04,.04,.03,.03,.03,.02,.02,.02,.02,.02,.01,.01,.01] },
  { clave: "CAJA_EN_DESTINO", archivo: "caja_destino.wav", seg: 0.40, onda: [.61,.60,.56,.52,.49,.45,.43,.39,.37,.34,.32,.29,.28,.26,.24,.22,.21,.19,.18,.17,.16,.15,.14,.13,.12,.11,.10,.10,.09,.08,.08,.07,.07,.06,.06,.05,.05,.05,.04,.04] },
  { clave: "CAJA_DANADA", archivo: "caja_danada.wav", seg: 0.15, onda: [.49,.48,.45,.39,.33,.34,.26,.24,.23,.22,.18,.15,.14,.13,.12,.10,.09,.08,.07,.06,.06,.06,.04,.04,.03,.03,.03,.03,.03,.02,.02,.02,.01,.01,.01,.01,.01,.01,.01,0] },
  { clave: "CAJA_ROTA", archivo: "caja_rota.wav", seg: 0.45, onda: [.89,.83,.80,.75,.71,.76,.68,.64,.55,.49,.43,.41,.38,.31,.29,.26,.22,.21,.19,.18,.15,.14,.12,.10,.11,.09,.08,.08,.06,.06,.05,.03,.03,.03,.02,.02,.02,.02,.01,.01] },
  { clave: "CERROJO_ABIERTO", archivo: "cerrojo.wav", seg: 0.51, onda: [.34,.18,.07,.02,0,0,0,.33,.30,.27,.23,.20,.18,.16,.14,.12,.38,.38,.35,.33,.30,.28,.26,.24,.22,.21,.19,.18,.16,.15,.14,.13,.12,.11,.10,.10,.09,.08,.08,.07] },
  { clave: "DESHACER", archivo: "deshacer.wav", seg: 0.25, onda: [.38,.38,.37,.36,.35,.34,.33,.32,.31,.30,.29,.28,.27,.26,.25,.25,.24,.23,.23,.22,.21,.21,.20,.19,.19,.18,.18,.17,.17,.16,.15,.15,.15,.14,.14,.13,.13,.12,.12,.12] },
  { clave: "REINICIAR", archivo: "reiniciar.wav", seg: 0.30, onda: [.39,.38,.37,.36,.35,.34,.33,.32,.31,.30,.29,.28,.28,.27,.26,.25,.39,.38,.37,.36,.35,.34,.33,.32,.31,.30,.29,.29,.27,.27,.26,.25,.24,.24,.23,.22,.21,.21,.20,.20] },
  { clave: "VICTORIA", archivo: "victoria.wav", seg: 1.23, onda: [.22,.18,.14,.13,.22,.17,.13,.22,.21,.17,.13,.22,.21,.16,.13,.10,0,.49,.46,.42,.38,.35,.32,.29,.27,.24,.22,.20,.18,.17,.15,.14,.13,.12,.11,.10,.09,.08,.07,.07] },
  { clave: "DERROTA", archivo: "derrota.wav", seg: 1.70, onda: [.22,.21,.19,.17,.16,.15,.14,.22,.21,.19,.18,.16,.15,.14,.22,.21,.19,.18,.16,.15,.14,.22,.21,.19,.18,.16,.15,.14,.13,.12,.11,.10,.09,.08,.08,.07,.06,.06,.05,.05] },
  { clave: "CHOQUE", archivo: "choque.wav", seg: 0.10, onda: [.24,.42,.33,.45,.39,.33,.33,.16,.26,.22,.19,.20,.11,.15,.15,.12,.12,.06,.09,.09,.07,.07,.04,.06,.05,.04,.04,.02,.03,.03,.03,.03,.01,.02,.02,.02,.02,.01,.01,.01] },
  { clave: "INICIO_NIVEL", archivo: "inicio_nivel.wav", seg: 0.42, onda: [.38,.37,.33,.31,.28,.26,.24,.22,.20,.18,.17,.42,.42,.40,.36,.35,.31,.30,.27,.25,.24,.22,.20,.19,.18,.16,.15,.14,.13,.12,.11,.11,.10,.09,.08,.08,.07,.07,.06,.06] },
  { clave: "ARRANQUE", archivo: "arranque.wav", seg: 0.92, onda: [.43,.38,.34,.29,.25,.22,.43,.39,.34,.30,.26,.22,.43,.40,.34,.30,.26,.23,.48,.46,.42,.39,.35,.32,.29,.26,.24,.22,.20,.19,.17,.15,.14,.13,.12,.11,.10,.09,.08,.07] },
  { clave: "CLIC", archivo: "clic.wav", seg: 0.03, onda: [.13,.15,.15,.15,.15,.15,.15,.13,.12,.10,.10,.09,.08,.07,.06,.06,.05,.05,.04,.04,.03,.03,.02,.02,.02,.02,.02,.02,.01,.01,.01,.01,.01,.01,.01,.01,.01,.01,.01,.01] },
];
