import { el, pixel, img } from "./util.js";
import { jugar } from "./sokoban-sim.js";

/* Un tablero chico con las baldosas reales de su época que juega una partida con las reglas de MotorMovimiento.
   dibujar(t, k) lo muestra en el movimiento k (con fracción, entre dos movimientos). Lo usan Calidad, DeLorean y Repetición. */
const PISO = { 1955: "tiles/floor_1955", 1985: "tiles/floor_1985", 2015: "tiles/floor_2015" };
const PARED = { 1955: "tiles/wall_brick", 1985: "tiles/wall_mall", 2015: "tiles/wall_future" };
const CAJA = { normal: "boxes/box_wood", fragil: "boxes/caja_fragil_intacta", llave: "boxes/caja_llave" };
const MIRA = { arriba: "characters/player_up", abajo: "characters/player_down", izquierda: "characters/player_left", derecha: "characters/player_right" };

export function crearTablero(padre, nivel, teclas, { x, y, b }) {
  const { fijo, cuadros } = jugar(nivel.mapa, teclas);
  const raiz = el("div", "tsim pos", padre, { vars: { x, y, cols: String(fijo[0].length), b } });
  const grilla = el("div", "tsim__grilla pixel", raiz);
  const capas = { cerrojo: [], muro: [], plutonio: null };
  fijo.forEach((fila) => fila.forEach((ch) => {
    const celda = el("div", "tsim__celda", grilla);
    pixel(ch === "#" ? PARED[nivel.epoca] : ch === "~" ? "tiles/terreno_resbaladizo" : PISO[nivel.epoca], celda, "");
    if (ch === ".") pixel("goals/goal", celda, "");
    if (ch === "C") capas.cerrojo.push([pixel("tiles/cerrojo_cerrado", celda, ""), pixel("tiles/cerrojo_abierto", celda, "")]);
    if (ch === "X") capas.muro.push([pixel("tiles/muro_cerrado", celda, ""), pixel("tiles/muro_abierto", celda, "")]);
    if (ch === "P") capas.plutonio = pixel("items/plutonio", celda, "");
  }));
  const fichas = cuadros[0].cajas.map((k) => { const f = el("div", "tsim__ficha", raiz); pixel(CAJA[k.tipo], f, ""); return f; });
  const jugador = el("div", "tsim__ficha tsim__ficha--jugador", raiz);
  pixel(MIRA.abajo, jugador, "");
  // Cada cuadro sabe cuántas cajas hay en destino: ahí se guarda un punto en el tiempo
  cuadros.forEach((c) => { c.enDestino = c.cajas.filter((k) => k.viva && fijo[k.y][k.x] === ".").length; });
  const t = { raiz, cuadros, fijo, fichas, jugador, capas, b, mira: "abajo", estado: { k: 0 } };
  dibujar(t, 0);
  return t;
}

const suave = (u) => u * u * (3 - 2 * u);

export function dibujar(t, k) {
  const n = t.cuadros.length - 1;
  const i = Math.max(0, Math.min(n, Math.floor(k)));
  const u = i >= n ? 0 : suave(k - i);
  const a = t.cuadros[i], z = t.cuadros[Math.min(n, i + 1)];
  const pos = (p, q) => `translate(${(p.x + (q.x - p.x) * u) * t.b}px, ${(p.y + (q.y - p.y) * u) * t.b}px)`;
  t.jugador.style.transform = pos(a.jug, z.jug);
  const mira = (u > 0 ? z : a).jug.mira;
  if (mira !== t.mira) { t.mira = mira; t.jugador.firstChild.src = img(MIRA[mira]); }
  a.cajas.forEach((ca, j) => {
    const f = t.fichas[j];
    f.style.transform = pos(ca, z.cajas[j]);
    f.classList.toggle("tsim__ficha--rota", !ca.viva);
    f.classList.toggle("ficha--en-destino", ca.viva && u === 0 && t.fijo[ca.y][ca.x] === ".");
    if (ca.tipo === "fragil") f.firstChild.src = img(!ca.viva ? "boxes/caja_fragil_rota" : ca.res === 1 ? "boxes/caja_fragil_danada" : "boxes/caja_fragil_intacta");
  });
  [...t.capas.cerrojo, ...t.capas.muro].forEach(([cerrado, abierto]) => {
    cerrado.classList.toggle("tsim__oculto", a.abiertos);
    abierto.classList.toggle("tsim__oculto", !a.abiertos);
  });
  if (t.capas.plutonio) t.capas.plutonio.classList.toggle("tsim__oculto", a.plutonio);
  t.raiz.classList.toggle("tsim--completo", a.completo);
}
