import { el, pixel, img } from "../util.js";

const PISO = { 1955: "tiles/floor_1955", 1985: "tiles/floor_1985", 2015: "tiles/floor_2015" };
const PARED = { 1955: "tiles/wall_brick", 1985: "tiles/wall_mall", 2015: "tiles/wall_future" };
const MIRA = { arriba: "characters/player_up", abajo: "characters/player_down", izquierda: "characters/player_left", derecha: "characters/player_right" };

/**
 * Arma un tablero 2D cenital con las baldosas reales a partir de líneas de nivel ("#", " ", ".", "$", "*", "@").
 * Las cajas y el jugador son fichas que se mueven con transform; el fondo son baldosas fijas.
 */
export function tableroPixel(padre, lineas, { b = 64, x = 0, y = 0, epoca = 1985, clases = "" } = {}) {
  const cols = lineas[0].length;
  const raiz = el("div", "pos " + clases, padre, { vars: { x, y } });
  const fondo = el("div", "tablero pixel", raiz, { vars: { cols: String(cols), b } });
  const celdas = [];
  const cajas = [];
  let jugador = null;
  lineas.forEach((linea, fy) => [...linea].forEach((c, fx) => {
    const destino = c === "." || c === "*" || c === "+";
    const clave = c === "#" ? PARED[epoca] : destino ? "goals/goal" : PISO[epoca];
    celdas.push(pixel(clave, fondo, ""));
    if (c === "$" || c === "*") {
      const caja = el("div", "ficha" + (c === "*" ? " ficha--en-destino" : ""), raiz, { vars: { b } });
      pixel("boxes/box_wood", caja, "Caja");
      caja.dataset.x = fx; caja.dataset.y = fy;
      cajas.push(caja);
    }
    if (c === "@" || c === "+") {
      jugador = el("div", "ficha ficha--jugador", raiz, { vars: { b } });
      pixel(MIRA.abajo, jugador, "Jugador");
      jugador.dataset.x = fx; jugador.dataset.y = fy;
    }
  }));
  return { raiz, fondo, cajas, jugador, b, cols, filas: lineas.length };
}

/** Cambia el sprite del jugador según hacia dónde mira. */
export function mirar(jugador, direccion) {
  const imagen = jugador.querySelector("img");
  imagen.src = img(MIRA[direccion]);
}
