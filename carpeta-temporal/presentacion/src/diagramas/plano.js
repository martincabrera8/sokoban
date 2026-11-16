import { gsap } from "gsap";
import { el, s } from "../util.js";

/*
 * El diagrama de clases real (docs/uml/2-diagrama-completo.svg, lo embebe build.py) recorrido por zonas.
 * Cada zona nombra sus clases: se buscan en el SVG por id o por texto, así el plano puede crecer o
 * reordenarse sin tocar este archivo. La cámara (el viewBox) encuadra la zona; el resto queda en penumbra.
 */
const ZONAS = [
  { nombre: "Vista y contrato", patrones: "MVC · Facade · Observer · Singleton",
    clases: ["VentanaPrincipal", "MenuPrincipal", "PantallaJuego", "PanelHUD", "PanelTablero", "Imagenes", "Juego", "ObservadorJuego", "EstadoJuego", "Direccion"] },
  { nombre: "Dominio", patrones: "Strategy · Mediator",
    clases: ["JuegoSokoban", "EstadoNivel", "Jugador", "Caja", "ComportamientoCaja", "CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy", "MediadorMovimiento", "MotorMovimiento"] },
  { nombre: "DeLorean", patrones: "Memento",
    clases: ["JuegoSokoban", "RecuerdoNivel", "MaquinaDelTiempo"] },
  { nombre: "Repetición", patrones: "Command",
    clases: ["Comando", "ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo", "GrabadoraDePartida", "Repeticion"] },
  { nombre: "Sonido", patrones: "Decorator · State · Singleton",
    clases: ["JuegoDecorado", "JuegoConSonido", "Sonidos", "EstadoSonido", "SonidoActivado", "SonidoSilenciado", "Sonido"] },
];
const ZONA = { x: 680, y: 64, w: 1120, h: 952 };    // dónde puede ir el plano, en px del escenario

/** El marco toma la proporción del plano (sea cual sea su tamaño), alineado a la derecha y centrado en vertical. */
function marcoPara(asp) {
  let w = ZONA.w, h = w / asp;
  if (h > ZONA.h) { h = ZONA.h; w = h * asp; }
  return { x: ZONA.x + ZONA.w - w, y: Math.max(ZONA.y, 540 - h / 2), w, h };
}

/** La caja de una clase en el SVG: por id (g.caja#Nombre) o, si no, por el texto con su nombre. */
function buscar(svg, nombre) {
  const porId = svg.querySelector(`[id="${nombre}"]`);
  if (porId) return porId;
  const textos = [...svg.querySelectorAll("text")].filter((t) => t.textContent.replace(/«[^»]*»/g, "").trim() === nombre);
  if (!textos.length) return null;
  const t = textos[0];
  const g = t.closest("g");
  return g && g !== svg ? g : t;
}

/** Rectángulo de un elemento en las coordenadas del viewBox (respeta transformaciones). */
function rect(svg, e) {
  const b = e.getBBox();
  const m = svg.getScreenCTM().inverse().multiply(e.getScreenCTM());
  const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => {
    const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(m);
  });
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

/** Encuadre de una zona con margen y la proporción del marco. */
function encuadre(rs, vb, asp) {
  if (!rs.length) return { ...vb };
  let x0 = Math.min(...rs.map((r) => r.x)), y0 = Math.min(...rs.map((r) => r.y));
  let x1 = Math.max(...rs.map((r) => r.x + r.w)), y1 = Math.max(...rs.map((r) => r.y + r.h));
  const pad = Math.max(x1 - x0, y1 - y0) * 0.08 + 20;
  x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  let w = x1 - x0, h = y1 - y0;
  if (w / h > asp) { const nh = w / asp; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * asp; x0 -= (nw - w) / 2; w = nw; }
  return { x: x0, y: y0, w, h };
}

export default {
  montar(lienzo) {
    const c = {};
    const doc = new DOMParser().parseFromString(window.UML || "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'/>", "image/svg+xml");
    const svg = document.importNode(doc.documentElement, true);
    const vb = (svg.getAttribute("viewBox") || `0 0 ${parseFloat(svg.getAttribute("width")) || 10} ${parseFloat(svg.getAttribute("height")) || 10}`).split(/[\s,]+/).map(Number);
    c.vb = { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };
    const asp = c.vb.w / c.vb.h;
    const M = marcoPara(asp);
    c.marco = el("div", "plano plano__marco pos dim", lienzo, { vars: { x: M.x, y: M.y, w: M.w, h: M.h } });
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Diagrama de clases completo del Sokoban");
    svg.classList.add("plano__svg");
    c.marco.appendChild(svg);
    c.svg = svg;
    c.cam = { ...c.vb };
    c.todo = { ...c.cam };
    c.aplicar = () => svg.setAttribute("viewBox", `${c.cam.x} ${c.cam.y} ${c.cam.w} ${c.cam.h}`);
    c.aplicar();

    // Zonas: las cajas que existen, su encuadre y un marco de luz por clase
    const capa = s("g", { class: "plano__luces" }, svg);
    const todas = new Set();
    c.zonas = ZONAS.map((z) => {
      const cajas = z.clases.map((n) => buscar(svg, n)).filter(Boolean);
      cajas.forEach((k) => todas.add(k));
      const rs = cajas.map((k) => rect(svg, k));
      const luces = rs.map((r) => s("rect", { x: r.x - 6, y: r.y - 6, width: r.w + 12, height: r.h + 12, rx: 10, class: "plano__luz" }, capa));
      return { ...z, cajas, luces, cuadro: encuadre(rs, c.vb, asp) };
    });
    c.cajas = [...svg.querySelectorAll("g.caja")];
    c.todas = [...todas];

    // La lista de zonas a la izquierda
    c.lista = el("div", "plano__lista pos dim", lienzo, { vars: { x: 120, y: 330, w: 520 } });
    c.items = c.zonas.map((z) => {
      const it = el("div", "plano__zona", c.lista);
      el("div", "plano__zona-nombre", it, { texto: z.nombre });
      el("div", "plano__zona-patrones", it, { texto: z.patrones });
      return it;
    });
    if (!window.UML) el("p", "plano__falta pos", lienzo, { vars: { x: M.x + 60, y: 500 }, texto: "Falta el diagrama: build.py lo toma de docs/uml/2-diagrama-completo.svg" });
    return c;
  },

  construir(tl, c) {
    const cam = (destino, en, d = 1.3) => tl.to(c.cam, { ...destino, duration: d, ease: "power2.inOut", onUpdate: c.aplicar }, en);
    tl.fromTo(c.marco, { autoAlpha: 0, y: 40, rotationX: 12 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 1, ease: "power3.out" }, 0.2)
      .fromTo(c.items, { autoAlpha: 0, x: -20 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }, 0.6)
      .set(c.zonas.flatMap((z) => z.luces), { autoAlpha: 0 }, 0)
      .set(c.cajas, { opacity: 1 }, 0)
      .set(c.cam, { ...c.todo, onUpdate: c.aplicar }, 0);

    c.zonas.forEach((z, i) => {
      const p = "p" + (i + 1);
      tl.addLabel(p, i === 0 ? 1.8 : `p${i}+=1.6`);
      const fuera = c.cajas.filter((k) => !z.cajas.includes(k));
      tl.to(c.items, { "--marco": 0, opacity: 0.45, duration: 0.3 }, p)
        .to(c.items[i], { "--marco": 1, opacity: 1, duration: 0.3 }, p)
        .to(c.zonas.flatMap((o) => o.luces), { autoAlpha: 0, duration: 0.3 }, p)
        .to(fuera, { opacity: 0.16, duration: 0.5 }, p)
        .to(z.cajas.filter((k) => c.cajas.includes(k)), { opacity: 1, duration: 0.5 }, p)
        .to(z.luces, { autoAlpha: 1, duration: 0.4, stagger: 0.05 }, `${p}+=0.9`);
      cam(z.cuadro, p);
    });

    // Final: el plano entero, con todo encendido
    tl.addLabel("p6", `p${c.zonas.length}+=1.8`);
    tl.to(c.items, { "--marco": 0, opacity: 1, duration: 0.3 }, "p6")
      .to(c.zonas.flatMap((o) => o.luces), { autoAlpha: 0, duration: 0.3 }, "p6")
      .to(c.cajas, { opacity: 1, duration: 0.5 }, "p6");
    cam(c.todo, "p6");
  },
};
