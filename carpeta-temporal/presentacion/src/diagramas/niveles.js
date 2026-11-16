import { gsap } from "gsap";
import { el, pixel, img } from "../util.js";
import { jugar } from "../sokoban-sim.js";
import { NIVELES, PRUEBAS } from "../datos-corta.js";

/*
 * Calidad: los tres niveles reales, con las baldosas de su época, juegan solos su solución más corta
 * (la que encontró VerificadorDeNiveles y corre NivelesTest). Debajo, lo que probó el solucionador.
 * Paso 1: las 23 pruebas JUnit.
 */
const B = 44;
const PISO = { 1955: "tiles/floor_1955", 1985: "tiles/floor_1985", 2015: "tiles/floor_2015" };
const PARED = { 1955: "tiles/wall_brick", 1985: "tiles/wall_mall", 2015: "tiles/wall_future" };
const CAJA = { normal: "boxes/box_wood", fragil: "boxes/caja_fragil_intacta", llave: "boxes/caja_llave" };
const MIRA = { arriba: "characters/player_up", abajo: "characters/player_down", izquierda: "characters/player_left", derecha: "characters/player_right" };
const PASO = 0.17;      // segundos por movimiento

function tablero(lienzo, nivel, x, y) {
  const { fijo, cuadros } = jugar(nivel.mapa, nivel.solucion);
  const raiz = el("div", "niv__tablero pos", lienzo, { vars: { x, y, cols: String(fijo[0].length), b: B } });
  const grilla = el("div", "niv__grilla pixel", raiz);
  const capas = { cerrojo: [], muro: [] };
  fijo.forEach((fila) => fila.forEach((ch) => {
    const celda = el("div", "niv__celda", grilla);
    const base = ch === "#" ? PARED[nivel.epoca] : ch === "~" ? "tiles/terreno_resbaladizo" : PISO[nivel.epoca];
    pixel(base, celda, "");
    if (ch === ".") pixel("goals/goal", celda, "");
    if (ch === "C") capas.cerrojo.push([pixel("tiles/cerrojo_cerrado", celda, ""), pixel("tiles/cerrojo_abierto", celda, "niv__abierto")]);
    if (ch === "X") capas.muro.push([pixel("tiles/muro_cerrado", celda, ""), pixel("tiles/muro_abierto", celda, "niv__abierto")]);
    if (ch === "P") capas.plutonio = pixel("items/plutonio", celda, "niv__plutonio");
  }));
  const fichas = cuadros[0].cajas.map((k) => {
    const f = el("div", "niv__ficha", raiz);
    f.dataset.tipo = k.tipo;
    pixel(CAJA[k.tipo], f, "");
    return f;
  });
  const jugador = el("div", "niv__ficha niv__ficha--jugador", raiz);
  pixel(MIRA.abajo, jugador, "");
  return { nivel, raiz, cuadros, fichas, jugador, capas, fijo, mira: "abajo", estado: { k: 0 } };
}

const suave = (u) => u * u * (3 - 2 * u);

/** Dibuja el tablero en el movimiento k (con fracción: entre dos cuadros). */
function dibujar(t, k) {
  const n = t.cuadros.length - 1;
  const i = Math.min(n, Math.floor(k));
  const u = i >= n ? 0 : suave(k - i);
  const a = t.cuadros[i], b = t.cuadros[Math.min(n, i + 1)];
  const pos = (p, q) => ({ x: (p.x + (q.x - p.x) * u) * B, y: (p.y + (q.y - p.y) * u) * B });
  const pj = pos(a.jug, b.jug);
  t.jugador.style.transform = `translate(${pj.x}px, ${pj.y}px)`;
  const mira = (u > 0 ? b : a).jug.mira;
  if (mira !== t.mira) { t.mira = mira; t.jugador.firstChild.src = img(MIRA[mira]); }
  a.cajas.forEach((ca, j) => {
    const cb = b.cajas[j];
    const f = t.fichas[j];
    const p = pos(ca, cb);
    f.style.transform = `translate(${p.x}px, ${p.y}px)`;
    f.style.opacity = ca.viva ? 1 : 0;
    const sobre = t.fijo[ca.y][ca.x] === "." && u === 0;
    f.classList.toggle("ficha--en-destino", sobre);
    if (ca.tipo === "fragil") f.firstChild.src = img(ca.res === 1 ? "boxes/caja_fragil_danada" : "boxes/caja_fragil_intacta");
  });
  const abiertos = a.abiertos;
  [...t.capas.cerrojo, ...t.capas.muro].forEach(([cerrado, abierto]) => { cerrado.style.opacity = abiertos ? 0 : 1; abierto.style.opacity = abiertos ? 1 : 0; });
  if (t.capas.plutonio) t.capas.plutonio.style.opacity = a.plutonio ? 0 : 1;
  t.raiz.classList.toggle("niv__tablero--completo", a.completo);
}

export default {
  montar(lienzo) {
    const c = {};
    const anchos = NIVELES.map((n) => n.mapa[0].length * B);
    const hueco = (1680 - anchos.reduce((s, w) => s + w, 0)) / (NIVELES.length - 1);
    const altoMax = Math.max(...NIVELES.map((n) => n.mapa.length * B));
    let x = 120;
    c.tableros = NIVELES.map((n, i) => {
      const alto = n.mapa.length * B;
      const t = tablero(lienzo, n, x, 372 + (altoMax - alto));
      const pie = el("div", "niv__pie pos dim", lienzo, { vars: { x, y: 372 + altoMax + 22, w: anchos[i] + hueco - 30 } });
      el("div", "niv__nombre", pie, { html: `Nivel ${n.numero} · <span class="niv__epoca niv__epoca--${n.epoca}">${n.epoca}</span>` });
      el("div", "niv__titulo", pie, { texto: n.nombre });
      el("div", "niv__cifras", pie, { html: `<b>${n.movimientos}</b> movimientos · <b>${n.empujes}</b> empujes` });
      el("div", "niv__prueba", pie, { texto: n.prueba });
      t.pie = pie;
      dibujar(t, 0);
      x += anchos[i] + hueco;
      return t;
    });
    // Las pruebas
    c.pruebas = el("div", "niv__pruebas pos dim", lienzo, { vars: { x: 120, y: 938, w: 1680 } });
    const total = PRUEBAS.reduce((s, p) => s + p.cuantas, 0);
    const cifra = el("div", "niv__total", c.pruebas);
    c.totalN = el("b", "", cifra, { texto: String(total) });
    el("span", "", cifra, { texto: "pruebas JUnit 5, todas pasan con mvn package" });
    c.clases = PRUEBAS.map((p) => el("div", "niv__clase", c.pruebas, { html: `<code>${p.clase}</code> <b>${p.cuantas}</b>` }));
    c.total = total;
    return c;
  },

  construir(tl, c) {
    c.tableros.forEach((t, i) => {
      tl.fromTo(t.raiz, { autoAlpha: 0, y: 30, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, 0.3 + i * 0.12)
        .fromTo(t.pie.children, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.08 }, 0.6 + i * 0.12);
      const n = t.cuadros.length - 1;
      tl.fromTo(t.estado, { k: 0 }, { k: n, duration: n * PASO, ease: "none", onUpdate: () => dibujar(t, t.estado.k) }, 1.2);
    });
    tl.set(c.pruebas, { autoAlpha: 0 }, 0);

    // Paso 1: las pruebas
    tl.addLabel("p1", 1.2 + Math.max(...c.tableros.map((t) => (t.cuadros.length - 1) * PASO)) + 0.6);
    const cuenta = { n: 0 };
    tl.to(c.pruebas, { autoAlpha: 1, duration: 0.4 }, "p1")
      .fromTo(cuenta, { n: 0 }, { n: c.total, duration: 0.9, ease: "power2.out", onUpdate: () => { c.totalN.textContent = String(Math.round(cuenta.n)); } }, "p1")
      .fromTo(c.clases, { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.35, stagger: 0.1, immediateRender: false }, "p1+=0.4")
      .to({}, { duration: 0.3 });
  },
};
