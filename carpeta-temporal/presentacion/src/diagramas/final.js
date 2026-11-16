import { gsap } from "gsap";
import { el, pixel, respirar } from "../util.js";
import { EQUIPO } from "../datos-corta.js";

/*
 * Cierre: cada parte del equipo es una caja que llega a su destino (la mecánica del juego), el uso de IA
 * tal como está declarado en el informe y las preguntas. Paso 1: las preguntas.
 */
export default {
  montar(lienzo) {
    const c = {};
    c.filas = EQUIPO.map((p, i) => {
      const f = el("div", "fin__fila pos dim", lienzo, { vars: { x: 120, y: 268 + i * 158, w: 1000 } });
      const casilla = el("div", "fin__casilla", f);
      pixel("goals/goal", casilla, "");
      const caja = el("div", "fin__caja ficha", casilla);
      pixel("boxes/box_wood", caja, "");
      const txt = el("div", "fin__txt", f);
      el("div", "fin__nombre", txt, { texto: p.nombre });
      el("div", "fin__parte", txt, { texto: p.parte });
      return { f, caja, txt };
    });
    c.ia = el("div", "cartel fin__ia pos dim", lienzo, { vars: { x: 1220, y: 268, w: 580 } });
    el("p", "cartel__rotulo", c.ia, { texto: "Uso de IA" });
    el("p", "fin__ia-texto", c.ia, { html: "Usamos <b>Claude</b> (Anthropic) como asistente. Está declarado en el informe técnico, sección 10: el equipo revisó, probó y defiende todo el código." });
    c.preguntas = el("div", "fin__preguntas pos dim", lienzo, { vars: { x: 1220, y: 640, w: 580 } });
    c.pj = pixel("characters/player_right", c.preguntas, "", "pixel fin__pj");
    el("div", "fin__pregunta", c.preguntas, { texto: "¿Preguntas?" });
    c.repo = el("p", "fin__repo pos dim", lienzo, { vars: { x: 120, y: 960, w: 1680 }, texto: "En el repositorio: el código, las pruebas, el informe técnico, el diagrama en StarUML y el video." });
    return c;
  },

  construir(tl, c) {
    c.filas.forEach((r, i) => {
      const en = 0.4 + i * 0.28;
      tl.fromTo(r.f, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, en)
        .fromTo(r.caja, { x: -90 }, { x: 0, duration: 0.55, ease: "empuje" }, en)
        .fromTo(r.caja, { "--marco": 0 }, { "--marco": 1, duration: 0.25 }, en + 0.5)
        .fromTo(r.txt, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: "power3.out" }, en + 0.25);
    });
    tl.fromTo(c.ia, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 1.6)
      .fromTo(c.repo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 2)
      .set(c.preguntas, { autoAlpha: 0 }, 0);
    tl.addLabel("p1", 2.6);
    tl.fromTo(c.preguntas, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.8)", immediateRender: false }, "p1")
      .to({}, { duration: 0.2 });
  },

  vida(c) {
    return respirar([c.preguntas, ...c.filas.map((r) => r.caja)]);
  },
};
