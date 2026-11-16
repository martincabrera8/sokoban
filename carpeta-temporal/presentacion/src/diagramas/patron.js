import { gsap } from "gsap";
import { el, s } from "../util.js";
import { PATRONES } from "../datos-patrones.js";
import { NIVELES, DEMOS } from "../datos-corta.js";
import { crearTablero, dibujar } from "../tablero-sim.js";

/*
 * Un patrón por diapositiva: a la izquierda el diagrama aprobado del patrón (SVG vectorial, la cámara es el viewBox,
 * así el texto queda nítido) y a la derecha la teoría. Cada paso enciende un rol en el diagrama y aparece su línea.
 * Después, el porqué; en DeLorean y Repetición, el juego funcionando; al final, el código real.
 * <section data-diagrama="patron" data-patron="observer"> elige el patrón de datos-patrones.js.
 */
const CARTA = { x: 100, y: 262, w: 1000, h: 778 };    // el diagrama, en px del escenario
const MARGEN = 26;                                    // aire entre la carta y el dibujo
const ZOOM_MAX = 1.55;                                // px por unidad del SVG, como mucho (texto de 15 → 23 px)
const APAGADO = 0.22;

/** Encuadre de unas cajas del SVG con aire, en la proporción de la carta y sin pasar el zoom máximo. */
function encuadre(rs, aire = 34) {
  const W = CARTA.w - MARGEN * 2, H = CARTA.h - MARGEN * 2;
  let x0 = Math.min(...rs.map((r) => r.x)) - aire, y0 = Math.min(...rs.map((r) => r.y)) - aire;
  let w = Math.max(...rs.map((r) => r.x + r.w)) + aire - x0, h = Math.max(...rs.map((r) => r.y + r.h)) + aire - y0;
  const minW = W / ZOOM_MAX;
  if (w < minW) { x0 -= (minW - w) / 2; w = minW; }
  if (w / h > W / H) { const nh = (w * H) / W; y0 -= (nh - h) / 2; h = nh; } else { const nw = (h * W) / H; x0 -= (nw - w) / 2; w = nw; }
  return { x: x0, y: y0, w, h };
}

/** El diagrama: SVG de PlantUML con un rectángulo por clase (g#elem_Nombre) y un grupo por flecha (g#link_A_B). */
function montarDiagrama(carta, texto) {
  const doc = new DOMParser().parseFromString(texto || "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'/>", "image/svg+xml");
  const svg = document.importNode(doc.documentElement, true);
  ["width", "height", "style"].forEach((k) => svg.removeAttribute(k));
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.setAttribute("class", "pat__svg");
  carta.appendChild(svg);
  const [vx, vy, vw, vh] = (svg.getAttribute("viewBox") || "0 0 10 10").split(/[\s,]+/).map(Number);
  const num = (e, k) => parseFloat(e.getAttribute(k)) || 0;
  const clases = {};
  svg.querySelectorAll("g[id^='elem_']").forEach((g) => {
    const r = g.querySelector("rect");
    if (r) clases[g.id.slice(5)] = { g, x: num(r, "x"), y: num(r, "y"), w: num(r, "width"), h: num(r, "height") };
  });
  const flechas = [...svg.querySelectorAll("g[id^='link_']")].map((g) => ({ g, extremos: g.id.slice(5).split("_") }));
  return { svg, clases, flechas, todo: { x: vx, y: vy, w: vw, h: vh } };
}

/** El juego funcionando: el DeLorean en el nivel 2 o la repetición en el nivel 1, con las reglas del motor. */
function montarDemo(lienzo, cual) {
  const caja = el("div", "pat__demo pos dim", lienzo, { vars: { x: CARTA.x, y: CARTA.y, w: CARTA.w, h: CARTA.h } });
  const datos = DEMOS[cual];
  const nivel = NIVELES.find((n) => n.numero === datos.nivel);
  const b = 56;
  const ancho = nivel.mapa[0].length * b;
  const t = crearTablero(caja, nivel, datos.teclas, { x: (CARTA.w - ancho) / 2, y: 40, b });
  t.raiz.setAttribute("aria-label", cual === "delorean" ? "Nivel 2: la caja frágil llega a su destino, un empuje de más la rompe y el DeLorean vuelve al punto guardado" : "Nivel 1: seis comandos se graban y después se vuelven a ejecutar");
  const pie = el("div", "pat__demo-pie", caja);
  const d = { caja, t, cual, destello: el("div", "pat__destello", caja), textos: {} };
  if (cual === "delorean") {
    const cs = t.cuadros;
    d.kPunto = cs.findIndex((q, i) => i > 0 && q.enDestino > cs[i - 1].enDestino);
    d.kRota = cs.length - 1;
    [["punto", "La frágil llega a su destino: se guarda un punto en el tiempo"], ["rota", "Un empuje de más la rompe"], ["viaje", "DeLorean: vuelve al punto guardado y gasta un plutonio"]]
      .forEach(([k, txt]) => { d.textos[k] = el("p", "pat__demo-texto", pie, { texto: txt }); });
  } else {
    const fila = el("div", "pat__demo-cinta", pie);
    el("code", "pat__demo-cinta-nombre", fila, { texto: "comandos" });
    d.chips = [...datos.teclas].map((k) => el("span", "pat__chip", fila, { texto: "Mover " + k }));
    [["graba", "Cada tecla: GrabadoraDePartida.ejecutar(comando)"], ["repite", "Ver repetición: reproducir() vuelve a ejecutar la lista y termina igual"]]
      .forEach(([k, txt]) => { d.textos[k] = el("p", "pat__demo-texto", pie, { texto: txt }); });
  }
  return d;
}

export default {
  montar(lienzo, { slide }) {
    const P = PATRONES[slide.dataset.patron];
    const c = { P };
    c.carta = el("div", "pat__carta pos dim", lienzo, { vars: { x: CARTA.x, y: CARTA.y, w: CARTA.w, h: CARTA.h } });
    c.d = montarDiagrama(c.carta, (window.PATRONES_SVG || {})[P.svg]);
    c.cam = { ...encuadre([c.d.todo], 6) };
    c.todo = { ...c.cam };
    c.aplicar = () => c.d.svg.setAttribute("viewBox", `${c.cam.x} ${c.cam.y} ${c.cam.w} ${c.cam.h}`);
    c.aplicar();

    // Cada rol: sus clases, sus flechas, su marco de luz y su encuadre
    const luces = s("g", { class: "pat__luces" }, c.d.svg);
    c.roles = P.roles.map((r) => {
      const cajas = r.clases.map((n) => c.d.clases[n]).filter(Boolean);
      const nombres = new Set(r.clases);
      return {
        ...r,
        encendidos: new Set([...cajas.map((k) => k.g), ...c.d.flechas.filter((f) => f.extremos.some((n) => nombres.has(n))).map((f) => f.g)]),
        luces: cajas.map((k) => s("rect", { x: k.x - 6, y: k.y - 6, width: k.w + 12, height: k.h + 12, rx: 8, class: "pat__luz" }, luces)),
        tomas: (r.tomas || [r.clases]).map((ids) => encuadre(ids.map((n) => c.d.clases[n]).filter(Boolean))),
      };
    });
    c.piezas = [...Object.values(c.d.clases).map((k) => k.g), ...c.d.flechas.map((f) => f.g)];

    // La teoría
    const teoria = el("div", "pat__teoria pos dim", lienzo, { vars: { x: 1140, y: CARTA.y, w: 680 } });
    const bloque = (rotulo, texto, clase = "") => {
      const b = el("div", "pat__bloque " + clase, teoria);
      el("p", "pat__rotulo", b, { texto: rotulo });
      if (texto) el("p", "pat__texto", b, { texto });
      return b;
    };
    c.problema = bloque("Problema", P.problema);
    c.solucion = bloque("Solución", P.solucion);
    const roles = bloque("Roles", "", "pat__bloque--roles");
    c.lineas = P.roles.map((r) => {
      const li = el("p", "pat__rol", roles);
      el("b", "", li, { texto: r.rol });
      el("code", "", li, { texto: r.nombres || r.clases.join(", ") });
      el("span", "", li, { texto: r.texto });
      return li;
    });
    c.porque = bloque("Por qué así", P.porque, "pat__bloque--porque");

    if (P.demo) c.demo = montarDemo(lienzo, P.demo);

    // El código real
    c.codigo = el("div", "pat__codigo pos dim", lienzo, { vars: { x: 1000, y: CARTA.y, w: 820, h: CARTA.h } });
    el("p", "pat__rotulo", c.codigo, { texto: "Código real" });
    P.codigo.forEach(({ archivo, lineas }) => {
      el("p", "pat__archivo", c.codigo, { texto: archivo });
      const pre = el("pre", "pat__pre", c.codigo);
      lineas.forEach((l) => el("code", "pat__linea" + (l.trim().startsWith("//") ? " pat__linea--nota" : ""), pre, { texto: l }));
    });
    return c;
  },

  construir(tl, c) {
    const cam = (destino, en, d = 1) => tl.to(c.cam, { ...destino, duration: d, ease: "power2.inOut", onUpdate: c.aplicar }, en);
    const todasLuces = c.roles.flatMap((r) => r.luces);
    tl.fromTo(c.carta, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.15)
      .fromTo([c.problema, c.solucion], { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.15, ease: "power3.out" }, 0.4)
      .set(c.cam, { ...c.todo, onUpdate: c.aplicar, onComplete: c.aplicar }, 0)
      .set(todasLuces, { autoAlpha: 0 }, 0)
      .set(c.piezas, { opacity: 1 }, 0)
      .set([...c.lineas, c.porque, c.codigo], { autoAlpha: 0 }, 0);
    if (c.demo) tl.set(c.demo.caja, { autoAlpha: 0 }, 0);

    // Un paso por rol: se enciende en el diagrama y aparece su línea
    let en = 1.4;
    c.roles.forEach((r, i) => {
      tl.addLabel("rol" + i, en);
      tl.to(c.piezas, { opacity: (j, e) => (r.encendidos.has(e) ? 1 : APAGADO), duration: 0.4 }, en)
        .to(todasLuces, { autoAlpha: 0, duration: 0.2 }, en)
        .to(r.luces, { autoAlpha: 1, duration: 0.35, stagger: 0.05 }, en + 0.3)
        .to(c.lineas, { "--marco": 0, duration: 0.2 }, en)
        .fromTo(c.lineas[i], { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, "--marco": 1, duration: 0.45, ease: "power2.out", immediateRender: false }, en + 0.15);
      r.tomas.forEach((toma, j) => cam(toma, en + j * 1.3, j ? 1.1 : 0.9));
      en += 0.9 + r.tomas.length * 1.2;
    });

    // El porqué, con el diagrama entero
    tl.addLabel("porque", en);
    tl.to(c.piezas, { opacity: 1, duration: 0.4 }, en)
      .to(todasLuces, { autoAlpha: 0, duration: 0.3 }, en)
      .to(c.lineas, { "--marco": 0, duration: 0.3 }, en)
      .fromTo(c.porque, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, en + 0.2);
    cam(c.todo, en, 1);
    en += 1.4;

    // El juego funcionando
    if (c.demo) {
      tl.addLabel("demo", en);
      const D = c.demo, T = D.t, ver = () => dibujar(T, T.estado.k);
      tl.set(T.estado, { k: 0, onUpdate: ver, onComplete: ver }, 0)
        .set(Object.values(D.textos), { autoAlpha: 0 }, 0)
        .set(D.destello, { autoAlpha: 0 }, 0)
        .fromTo(D.caja, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power2.out", immediateRender: false }, en);
      en += 0.6;
      if (D.cual === "delorean") {
        const paso = 0.18;
        tl.to(T.estado, { k: D.kPunto, duration: D.kPunto * paso, ease: "none", onUpdate: ver }, en);
        en += D.kPunto * paso;
        tl.to(D.textos.punto, { autoAlpha: 1, duration: 0.3 }, en);
        tl.to(T.estado, { k: D.kRota, duration: 0.4, ease: "none", onUpdate: ver }, en + 1);
        tl.to(D.textos.rota, { autoAlpha: 1, duration: 0.3 }, en + 1.4);
        tl.fromTo(D.destello, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, yoyo: true, repeat: 1, immediateRender: false }, en + 2.4)
          .to(T.estado, { k: D.kPunto, duration: 0.01, onUpdate: ver }, en + 2.65)
          .to(D.textos.viaje, { autoAlpha: 1, duration: 0.3 }, en + 2.7);
        en += 3.4;
      } else {
        const n = D.chips.length;
        tl.set(D.chips, { autoAlpha: 0 }, 0).to(D.textos.graba, { autoAlpha: 1, duration: 0.3 }, en);
        D.chips.forEach((chip, i) => {
          tl.to(T.estado, { k: i + 1, duration: 0.22, ease: "none", onUpdate: ver }, en + i * 0.45)
            .fromTo(chip, { autoAlpha: 0, y: -14 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, en + i * 0.45);
        });
        en += n * 0.45 + 0.6;
        tl.to(D.textos.repite, { autoAlpha: 1, duration: 0.3 }, en)
          .to(T.estado, { k: 0, duration: 0.35, ease: "power2.inOut", onUpdate: ver }, en + 0.2);
        D.chips.forEach((chip, i) => {
          const t0 = en + 0.8 + i * 0.35;
          tl.to(T.estado, { k: i + 1, duration: 0.18, ease: "none", onUpdate: ver }, t0)
            .fromTo(chip, { "--marco": 0 }, { "--marco": 1, duration: 0.12, yoyo: true, repeat: 1, immediateRender: false }, t0);
        });
        en += 0.8 + n * 0.35 + 0.4;
      }
    }

    // El código real, sobre la teoría
    tl.addLabel("codigo", en);
    tl.fromTo(c.codigo, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.55, ease: "power3.out", immediateRender: false }, en);
    if (c.demo) tl.to(c.demo.caja, { autoAlpha: 0, duration: 0.4 }, en);
    tl.to({}, { duration: 0.5 }, en + 0.5);
  },
};
