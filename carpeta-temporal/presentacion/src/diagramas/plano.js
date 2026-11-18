import { gsap } from "gsap";
import { el, s } from "../util.js";
import { PATRONES } from "../datos-patrones.js";

/*
 * El diagrama de clases completo (docs/uml/2-diagrama-completo.svg), en 2D y vectorial: se ve nítido a cualquier zoom.
 * Cada → lleva la cámara a un patrón: encuadra sus clases, las deja encendidas sobre un velo, les pone el título
 * del patrón dentro del plano y muestra arriba sus roles. Al final vuelve al plano entero con todos los títulos.
 * Las clases de cada patrón salen de datos-patrones.js (los mismos roles de las fichas); las que no estén en el
 * plano se saltean, y un patrón sin clases en el plano no tiene paso.
 */
const REGION = { x: 60, y: 236, w: 1800, h: 812 }; // dónde se dibuja el plano, en px del escenario
const MARGEN = 70;                                  // aire alrededor de cada encuadre, en unidades del SVG
const ZOOM_MAX = 1.1;
const DUR = 1.1;

/* Patrones cuyas clases quedan lejos entre sí: se recorren en dos tomas. */
const TOMAS = {
  singleton: [["Imagenes", "PanelTablero", "PanelHUD"], ["Sonidos", "JuegoConSonido", "SonidosDeInterfaz"]],
  command: [["GrabadoraDePartida", "Comando", "ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"], ["PantallaJuego", "Juego"]],
  facade: [["PantallaJuego", "Juego", "JuegoSokoban"], ["JuegoSokoban", "CargadorNivel", "EstadoNivel", "MotorMovimiento", "HistorialDeshacer", "MaquinaDelTiempo", "Puntaje"]],
};
const NOMBRES = { facade: "Facade", observer: "Observer", singleton: "Singleton", builder: "Builder", strategy: "Strategy", mediator: "Mediator",
  decorator: "Decorator", state: "State", memento: "Memento", command: "Command" };

function leerPlano(contenedor) {
  contenedor.innerHTML = window.UML || "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'></svg>";
  const svg = contenedor.querySelector("svg");
  // Notas de herramientas entre paréntesis (por ejemplo, de la leyenda) no van en la proyección
  svg.querySelectorAll("text, tspan").forEach((x) => { if (!x.children.length) x.textContent = x.textContent.replace(/\s*\([^)]*\bIA\b[^)]*\)/g, ""); });
  const [, , VW, VH] = (svg.getAttribute("viewBox") || "0 0 10 10").split(/[\s,]+/).map(Number);
  svg.setAttribute("width", VW); svg.setAttribute("height", VH);
  const num = (e, k) => parseFloat(e.getAttribute(k)) || 0;
  const cajas = {};
  svg.querySelectorAll("g.caja").forEach((g) => {
    const r = g.querySelector("rect");
    cajas[g.id] = { x: num(r, "x"), y: num(r, "y"), w: num(r, "width"), h: num(r, "height") };
  });
  return { svg, VW, VH, cajas };
}

function marco(ids, cajas) {
  const bs = ids.map((id) => cajas[id]).filter(Boolean);
  const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y));
  const x1 = Math.max(...bs.map((b) => b.x + b.w)), y1 = Math.max(...bs.map((b) => b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** Transformación del plano para que el rectángulo b (en unidades del SVG) quede centrado en la región. */
function encuadre(b, zoomMax = ZOOM_MAX) {
  const escala = Math.min(REGION.w / (b.w + 2 * MARGEN), REGION.h / (b.h + 2 * MARGEN), zoomMax);
  return { scale: escala, x: REGION.w / 2 - (b.x + b.w / 2) * escala, y: REGION.h / 2 - (b.y + b.h / 2) * escala };
}

export default {
  montar(lienzo) {
    const caja = el("div", "umlp", lienzo);
    const ventana = el("div", "umlp__ventana", caja, { vars: { x: REGION.x, y: REGION.y, w: REGION.w, h: REGION.h } });
    const mundo = el("div", "umlp__mundo", ventana);
    const P = leerPlano(mundo);
    const NS = P.svg;

    // Velo sobre todo el plano y, encima, una copia de las clases de cada toma (encendidas) con el título del patrón
    const velo = s("rect", { class: "umlp__velo", x: 0, y: 0, width: P.VW, height: P.VH }, NS);
    const pasos = [];
    Object.entries(PATRONES).forEach(([clave, p]) => {
      const todas = [...new Set(p.roles.flatMap((r) => r.clases))].filter((id) => P.cajas[id]);
      if (!todas.length) return;
      const tomas = (TOMAS[clave] || [todas]).map((ids) => ids.filter((id) => P.cajas[id])).filter((ids) => ids.length);
      tomas.forEach((ids, n) => pasos.push({ clave, nombre: NOMBRES[clave] || clave, p, ids, n, de: tomas.length }));
    });
    const titulosPlano = [];
    pasos.forEach((paso) => {
      const g = s("g", { class: "umlp__luz" }, NS);
      paso.ids.forEach((id) => {
        const b = P.cajas[id];
        s("use", { href: "#" + id }, g);
        s("rect", { class: "umlp__borde", x: b.x - 5, y: b.y - 5, width: b.w + 10, height: b.h + 10, rx: 9 }, g);
      });
      paso.luz = g;
      paso.marco = marco(paso.ids, P.cajas);
    });
    // Un título por patrón dentro del plano, sobre su primera toma (se ve en su paso y en el plano completo del final)
    const yaTitulado = new Set();
    pasos.forEach((paso) => {
      if (yaTitulado.has(paso.clave)) return;
      yaTitulado.add(paso.clave);
      const m = paso.marco, alto = 46, ancho = paso.nombre.length * 25 + 40;
      const g = s("g", { class: "umlp__titulo" }, NS);
      s("rect", { x: m.x - 6, y: m.y - alto - 14, width: ancho, height: alto, rx: 10 }, g);
      const tx = s("text", { x: m.x + 14, y: m.y - 26 }, g);
      tx.textContent = paso.nombre;
      titulosPlano.push({ clave: paso.clave, g });
      paso.titulo = g;
    });

    // Rótulos de arriba: uno para el plano completo, uno por paso y uno para el cierre
    const arriba = el("div", "umlp__arriba", caja);
    const rotulo = (titulo, bajada, roles) => {
      const r = el("div", "umlp__rotulo", arriba);
      el("p", "umlp__nombre", r, { texto: titulo });
      if (bajada) el("p", "umlp__bajada", r, { texto: bajada });
      if (roles) {
        const lista = el("ul", "umlp__roles", r);
        roles.forEach((x) => {
          const li = el("li", "", lista);
          el("span", "umlp__rol", li, { texto: x.rol });
          el("code", "", li, { texto: x.clases.join(", ") });
        });
      }
      return r;
    };
    const inicio = rotulo("Diagrama de clases completo", "Cada color es quien hizo esa parte. Con → recorremos los patrones uno por uno.");
    pasos.forEach((paso) => {
      const enToma = paso.p.roles.map((r) => ({ rol: r.rol, clases: r.clases.filter((c) => paso.ids.includes(c)) })).filter((r) => r.clases.length);
      const parte = paso.de > 1 ? ` (${paso.n + 1} de ${paso.de})` : "";
      paso.rotulo = rotulo(paso.nombre + parte, paso.p.solucion, enToma);
    });
    const cierre = rotulo(`${titulosPlano.length} patrones en un solo diseño`, "Cada título marca dónde vive su patrón en el plano.");

    return { caja, mundo, velo, pasos, titulosPlano, inicio, cierre, P };
  },

  construir(tl, c) {
    const total = encuadre({ x: 0, y: 0, w: c.P.VW, h: c.P.VH }, 1);
    gsap.set(c.mundo, { ...total, width: c.P.VW, height: c.P.VH, transformOrigin: "0 0" });
    gsap.set(c.P.svg, { width: c.P.VW, height: c.P.VH });
    gsap.set([c.velo, ...c.pasos.map((p) => p.luz), ...c.titulosPlano.map((t) => t.g)], { opacity: 0 });
    gsap.set([c.inicio, ...c.pasos.map((p) => p.rotulo), c.cierre], { autoAlpha: 0 });

    tl.fromTo(c.mundo, { autoAlpha: 0, y: total.y + 30 }, { autoAlpha: 1, y: total.y, duration: 0.8, ease: "power2.out" }, 0.2)
      .fromTo(c.inicio, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.4);
    tl.addLabel("umlp");

    // Cada paso arranca donde terminó el anterior y su etiqueta marca dónde termina (así lo lee el motor).
    let antes = { rotulo: c.inicio, luz: null, titulo: null };
    c.pasos.forEach((paso, i) => {
      const t0 = tl.duration();
      tl.to(c.mundo, { ...encuadre(paso.marco), duration: DUR, ease: "power2.inOut" }, t0)
        .to(c.velo, { opacity: 0.82, duration: 0.5 }, t0)
        .to(antes.rotulo, { autoAlpha: 0, y: -10, duration: 0.3 }, t0)
        .fromTo(paso.rotulo, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45 }, t0 + 0.3);
      if (antes.luz) tl.to(antes.luz, { opacity: 0, duration: 0.35 }, t0);
      if (antes.titulo && antes.titulo !== paso.titulo) tl.to(antes.titulo, { opacity: 0, duration: 0.35 }, t0);
      tl.to(paso.luz, { opacity: 1, duration: 0.5 }, t0 + 0.35);
      if (paso.titulo && paso.titulo !== antes.titulo) tl.fromTo(paso.titulo, { opacity: 0 }, { opacity: 1, duration: 0.45 }, t0 + 0.5);
      tl.addLabel("paso" + i);
      antes = { rotulo: paso.rotulo, luz: paso.luz, titulo: paso.titulo || antes.titulo };
    });

    // Cierre: el plano entero con el título de cada patrón
    const tf = tl.duration();
    tl.to(c.mundo, { ...total, duration: DUR, ease: "power2.inOut" }, tf)
      .to(c.velo, { opacity: 0, duration: 0.5 }, tf)
      .to(antes.rotulo, { autoAlpha: 0, y: -10, duration: 0.3 }, tf)
      .fromTo(c.cierre, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45 }, tf + 0.3);
    if (antes.luz) tl.to(antes.luz, { opacity: 0, duration: 0.35 }, tf);
    tl.to(c.titulosPlano.map((t) => t.g), { opacity: 1, duration: 0.5, stagger: 0.05 }, tf + 0.5);
  },
};
