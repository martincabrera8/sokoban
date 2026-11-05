import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { el, s, pixel, eventos, respirar, juntas } from "../util.js";
import { ENTREGAS } from "../datos.js";

gsap.registerPlugin(DrawSVGPlugin);

/* Mapa de niveles: lo terminado tiene el cerrojo abierto; la caja llave espera frente al próximo. */
const PASO_X = 196, X0 = 120, Y_BASE = 860, SUBE = 52, ANCHO = 180;
const lugar = (i) => ({ x: X0 + i * PASO_X, y: Y_BASE - i * SUBE - 96 });

export default {
  montar(lienzo) {
    const svg = s("svg", { class: "svg", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    const puntos = ENTREGAS.map((_, i) => { const l = lugar(i); return [l.x + ANCHO / 2, l.y + 48]; });
    const camino = s("polyline", { class: "conector", points: puntos.map((p) => p.join(",")).join(" ") }, svg);
    const nodos = ENTREGAS.map((e, i) => {
      const l = lugar(i);
      const n = el("div", "nodo pos " + (e.listo ? "nodo--listo" : "nodo--cerrado"), lienzo, { vars: { x: l.x, y: l.y } });
      const icono = el("div", "nodo__icono", n);
      pixel(e.listo ? "tiles/cerrojo_abierto" : "tiles/cerrojo_cerrado", icono, e.listo ? "Cerrojo abierto" : "Cerrojo cerrado");
      el("div", "nodo__nombre", n, { texto: e.nombre });
      el("div", "nodo__estado", n, { texto: e.listo ? "listo" : "pendiente" });
      return { n, icono, listo: e.listo };
    });
    const proximo = nodos.findIndex((n) => !n.listo);
    const llave = el("div", "ficha", lienzo, { vars: { b: 72 } });
    pixel("boxes/caja_llave", llave, "Caja llave");
    const centro = (i) => { const l = lugar(i); return { x: l.x + ANCHO / 2, y: l.y + 48 }; };
    const a = centro(proximo - 1), b = centro(proximo);
    const largo = Math.hypot(b.x - a.x, b.y - a.y);
    const sobre = (f) => ({ x: a.x + (b.x - a.x) * f - 36, y: a.y + (b.y - a.y) * f - 36 });
    const desde = sobre(0.5), hasta = sobre(1 - 96 / largo);
    return { camino, nodos, llave, proximo, desde, hasta };
  },

  construir(tl, c) {
    tl.fromTo(c.camino, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1.4, ease: "power2.inOut" }, 0.4)
      .fromTo(c.nodos.map((n) => n.n), { autoAlpha: 0, y: 26, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.6)", stagger: 0.13 }, 0.5)
      .fromTo(c.llave, { autoAlpha: 0, x: c.desde.x, y: c.desde.y }, { autoAlpha: 1, duration: 0.4 }, 1.8);
    tl.addLabel("p1");
    tl.to(c.llave, { x: c.hasta.x, y: c.hasta.y, duration: 0.9, ease: "empuje" }, "p1")
      .to(c.nodos[c.proximo].icono, { "--marco": 1, duration: 0.4 }, "p1+=0.8");
  },

  vida(c) {
    const cerrados = c.nodos.filter((n) => !n.listo).map((n) => n.icono);
    const latido = respirar(cerrados);
    const amague = eventos(() => {
      gsap.fromTo(c.llave, { rotation: 0 }, { rotation: gsap.utils.random([-6, 6]), duration: 0.12, yoyo: true, repeat: 1 });
    }, [2, 4.5]);
    return juntas(latido, amague);
  },
};
