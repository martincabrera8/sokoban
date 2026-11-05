import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { el, s, pixel, eventos, puntoEn } from "../util.js";
import { PANTALLAS } from "../datos.js";

gsap.registerPlugin(DrawSVGPlugin);

/* Las cinco pantallas reales, unidas por el camino que recorre quien juega. */
const LUGAR = {
  menu: { x: 120, y: 620, w: 420 },
  partida: { x: 720, y: 430, w: 480 },
  pausa: { x: 800, y: 840, w: 300 },
  completado: { x: 1360, y: 560, w: 400 },
  resultados: { x: 1480, y: 96, w: 340 },
};
const alto = (c) => LUGAR[c].w * 0.625;
const der = (c) => ({ x: LUGAR[c].x + LUGAR[c].w, y: LUGAR[c].y + alto(c) / 2 });
const izq = (c) => ({ x: LUGAR[c].x, y: LUGAR[c].y + alto(c) / 2 });
const curva = (a, b) => `M${a.x},${a.y} C${a.x + 70},${a.y} ${b.x - 70},${b.y} ${b.x},${b.y}`;
const GRANDE = { x: 360, y: 140, w: 1200 };

export default {
  montar(lienzo) {
    const svg = s("svg", { class: "camino", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    const p = LUGAR.partida, c = LUGAR.completado, r = LUGAR.resultados;
    const tramos = [
      { d: curva(der("menu"), izq("partida")), txt: "elige nivel", f: 0.5 },
      { d: `M${p.x + p.w * 0.62},${p.y + alto("partida")} C${p.x + p.w * 0.62},${p.y + alto("partida") + 40} ${LUGAR.pausa.x + 150},${LUGAR.pausa.y - 40} ${LUGAR.pausa.x + 150},${LUGAR.pausa.y}`, txt: "Esc", f: 0.45, rama: true },
      { d: curva(der("partida"), izq("completado")), txt: "cajas en destino", f: 0.5 },
      { d: `M${c.x + c.w * 0.7},${c.y} C${c.x + c.w * 0.7},${c.y - 90} ${r.x + r.w * 0.3},${r.y + alto("resultados") + 90} ${r.x + r.w * 0.3},${r.y + alto("resultados")}`, txt: "último nivel", f: 0.55 },
      { d: `M${c.x + c.w * 0.25},${c.y + alto("completado")} C${c.x + c.w * 0.25},${c.y + alto("completado") + 170} ${p.x + p.w + 120},${p.y + alto("partida") * 0.85} ${p.x + p.w},${p.y + alto("partida") * 0.85}`, txt: "siguiente nivel", f: 0.42, rama: true },
    ].map((tr) => {
      const path = s("path", { d: tr.d, class: tr.rama ? "camino__rama" : "" }, svg);
      const pt = puntoEn(path, tr.f);
      const g = s("g", {}, svg);
      const ancho = tr.txt.length * 9.6 + 20;
      s("rect", { class: "camino__fondo", x: pt.x - ancho / 2, y: pt.y - 16, width: ancho, height: 30, rx: 6 }, g);
      const t = s("text", { x: pt.x, y: pt.y + 6, "text-anchor": "middle" }, g);
      t.textContent = tr.txt;
      return { path, g };
    });
    const capturas = PANTALLAS.map((pa) => {
      const l = LUGAR[pa.clave];
      const cap = el("figure", "captura pos dim", lienzo, { vars: { x: l.x, y: l.y, w: l.w } });
      el("img", "", cap, { src: window.IMG["medios/" + pa.clave], alt: pa.alt });
      const pie = el("figcaption", "captura__pie pos", lienzo, { texto: pa.nombre, vars: { x: l.x, y: l.y + alto(pa.clave) + 12 } });
      return { cap, pie, clave: pa.clave };
    });
    const viajero = el("div", "ficha ficha--viajero", lienzo, { vars: { b: 40 } });
    pixel("characters/player_right", viajero, "");
    gsap.set(viajero, { autoAlpha: 0 });
    return { tramos, capturas, viajero };
  },

  construir(tl, { tramos, capturas }) {
    const orden = ["menu", "partida", "pausa", "completado", "resultados"];
    const cap = (k) => capturas.find((c) => c.clave === k);
    orden.forEach((k, i) => {
      const c = cap(k);
      tl.fromTo([c.cap, c.pie], { autoAlpha: 0, y: 24, scale: 0.94 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }, 0.5 + i * 0.45);
    });
    tl.fromTo(tramos.map((tr) => tr.path), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.8, ease: "power2.inOut", stagger: 0.4 }, 0.9)
      .fromTo(tramos.map((tr) => tr.g), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.4 }, 1.4);
    const partida = cap("partida");
    const l = LUGAR.partida;
    tl.addLabel("p1");
    tl.to(partida.cap, { x: GRANDE.x - l.x, y: GRANDE.y - l.y, scale: GRANDE.w / l.w, zIndex: 4, duration: 1, ease: "expo.inOut" }, "p1")
      .to(capturas.filter((c) => c !== partida).map((c) => c.cap).concat(tramos.map((tr) => tr.path), tramos.map((tr) => tr.g)), { autoAlpha: 0.12, duration: 0.6 }, "p1");
    tl.addLabel("p2");
    tl.to(partida.cap, { x: 0, y: 0, scale: 1, duration: 0.9, ease: "expo.inOut" }, "p2")
      .to(capturas.filter((c) => c !== partida).map((c) => c.cap).concat(tramos.map((tr) => tr.path), tramos.map((tr) => tr.g)), { autoAlpha: 1, duration: 0.6 }, "p2+=0.3")
      .set(partida.cap, { zIndex: 1 });
  },

  vida({ tramos, viajero }) {
    const recorrido = [tramos[0].path, tramos[2].path, tramos[3].path];
    return eventos(() => {
      const prog = { f: 0 };
      gsap.timeline()
        .set(viajero, { autoAlpha: 1 })
        .to(prog, {
          f: recorrido.length, duration: 4.2, ease: "none",
          onUpdate() {
            const i = Math.min(recorrido.length - 1, Math.floor(prog.f));
            const pt = puntoEn(recorrido[i], prog.f - i);
            gsap.set(viajero, { x: pt.x - 20, y: pt.y - 34 });
          },
        })
        .to(viajero, { autoAlpha: 0, duration: 0.3 });
    }, [5.5, 9]);
  },
};
