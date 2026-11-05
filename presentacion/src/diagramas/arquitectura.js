import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { el, s, eventos } from "../util.js";
import { CAPAS } from "../datos.js";

gsap.registerPlugin(DrawSVGPlugin);

/* Tres placas isométricas: la vista arriba, el contrato en el medio y abajo quien lo implementa. */
const U = 62, CX = 620, CY = 640, GROSOR = 0.3;
const Z = { vista: 4.2, contrato: 2.1, base: 0 };
const P = (x, y, z) => [CX + (x - y) * 0.866 * U, CY + (x + y) * 0.5 * U - z * U];
const pts = (...ps) => ps.map((p) => p.join(",")).join(" ");

function placa(svg, clase, z, ancho = 6, fondo = 4) {
  const g = s("g", { class: "placa " + clase }, svg);
  s("polygon", { class: "placa__lado", points: pts(P(0, fondo, z), P(ancho, fondo, z), P(ancho, fondo, z - GROSOR), P(0, fondo, z - GROSOR)) }, g);
  s("polygon", { class: "placa__lado", points: pts(P(ancho, 0, z), P(ancho, fondo, z), P(ancho, fondo, z - GROSOR), P(ancho, 0, z - GROSOR)) }, g);
  s("polygon", { class: "placa__cara", points: pts(P(0, 0, z), P(ancho, 0, z), P(ancho, fondo, z), P(0, fondo, z)) }, g);
  return g;
}

function bloque(svg, clase, x0, y0, x1, y1, z0, z1, texto) {
  const g = s("g", { class: "bloque " + clase }, svg);
  s("polygon", { class: "bloque__cara", points: pts(P(x0, y1, z1), P(x1, y1, z1), P(x1, y1, z0), P(x0, y1, z0)) }, g);
  s("polygon", { class: "bloque__cara", points: pts(P(x1, y0, z1), P(x1, y1, z1), P(x1, y1, z0), P(x1, y0, z0)) }, g);
  s("polygon", { class: "bloque__cara", points: pts(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)) }, g);
  const [tx, ty] = P((x0 + x1) / 2, (y0 + y1) / 2, z1);
  const t = s("text", { class: "bloque__texto", x: tx, y: ty + 7, "text-anchor": "middle" }, g);
  t.textContent = texto;
  return g;
}

function rotulo(lienzo, svg, z, nombre, dato) {
  const [x, y] = P(6, 2, z);
  const linea = s("line", { class: "lider", x1: x + 10, y1: y, x2: 1080, y2: y }, svg);
  const caja = el("div", "anclado anclado--ancho pos", lienzo, { vars: { x: 1100, y: y - 26 } });
  el("div", "placa__rotulo", caja, { texto: nombre });
  el("div", "anclado__detalle", caja, { texto: dato });
  return [linea, caja];
}

export default {
  montar(lienzo) {
    const svg = s("svg", { class: "svg", viewBox: "0 0 1920 1080", role: "img", "aria-label": "Tres capas: la vista, el contrato y la implementación" }, lienzo);
    const base = placa(svg, "placa--dominio", Z.base);
    const prueba = bloque(svg, "bloque--real", 0.8, 1, 2.8, 3, 0, 0.9, "JuegoDePrueba");
    const dominio = bloque(svg, "", 3.4, 1, 5.4, 3, 0, 0.9, "Dominio");
    const pilarAbajo = s("line", { class: "pilar", x1: P(1.8, 2, 0.9)[0], y1: P(1.8, 2, 0.9)[1], x2: P(1.8, 2, Z.contrato - GROSOR)[0], y2: P(1.8, 2, Z.contrato - GROSOR)[1] }, svg);
    const pilarDominio = s("line", { class: "pilar", x1: P(4.4, 2, 0.9)[0], y1: P(4.4, 2, 0.9)[1], x2: P(4.4, 2, Z.contrato - GROSOR)[0], y2: P(4.4, 2, Z.contrato - GROSOR)[1] }, svg);
    const contrato = placa(svg, "placa--contrato", Z.contrato);
    const pilares = [1.5, 4.5].map((x) => s("line", { class: "pilar", x1: P(x, 2, Z.contrato)[0], y1: P(x, 2, Z.contrato)[1], x2: P(x, 2, Z.vista - GROSOR)[0], y2: P(x, 2, Z.vista - GROSOR)[1] }, svg));
    const vista = placa(svg, "placa--vista", Z.vista);
    const rotulos = [
      rotulo(lienzo, svg, Z.vista, "Vista", CAPAS.vista.join(", ")),
      rotulo(lienzo, svg, Z.contrato, "Contrato", CAPAS.contrato.join(", ")),
      rotulo(lienzo, svg, Z.base, "Implementación", "hoy JuegoDePrueba; después, la clase del dominio"),
    ];
    const main = el("div", "pos", lienzo, { vars: { x: 1100, y: 958 } });
    el("div", "anclado__detalle", main, { texto: "En Main:" });
    const hoy = el("code", "chip chip--codigo", main, { texto: "Juego juego = new JuegoDePrueba();" });
    const despues = el("code", "chip chip--codigo chip--despues", main, { texto: "Juego juego = new ControladorJuego();" });
    const particulas = [0, 1, 2, 3].map(() => s("circle", { class: "particula", r: 5, cx: -20, cy: -20 }, svg));
    return { base, contrato, vista, prueba, dominio, pilares, pilarAbajo, pilarDominio, rotulos, hoy, despues, particulas };
  },

  construir(tl, c) {
    [c.base, c.contrato, c.vista].forEach((g, i) => {
      tl.fromTo(g, { y: -70, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out" }, 0.4 + i * 0.3);
    });
    tl.fromTo(c.prueba, { y: -40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, ease: "back.out(1.4)" }, 0.8)
      .set(c.dominio, { autoAlpha: 0 }, 0)
      .set(c.pilarDominio, { autoAlpha: 0 }, 0)
      .set(c.despues, { autoAlpha: 0 }, 0)
      .fromTo([c.pilarAbajo, ...c.pilares], { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6, stagger: 0.15 }, 1.3)
      .fromTo(c.rotulos.flat(), { autoAlpha: 0, x: -12 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.1 }, 1.5)
      .fromTo(c.hoy, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, 2);
    tl.addLabel("p1");
    tl.to([c.prueba, c.pilarAbajo], { x: 160, y: 92, autoAlpha: 0, duration: 0.8, ease: "power2.in" }, "p1")
      .fromTo(c.dominio, { x: -160, y: -92, autoAlpha: 0 }, { x: 0, y: 0, autoAlpha: 1, duration: 0.8, ease: "power2.out" }, "p1+=0.6")
      .fromTo(c.pilarDominio, { drawSVG: "0%", autoAlpha: 1 }, { drawSVG: "100%", duration: 0.5 }, "p1+=1.3")
      .to(c.hoy, { autoAlpha: 0, y: -10, duration: 0.4 }, "p1+=0.6")
      .fromTo(c.despues, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4 }, "p1+=0.9");
  },

  vida(c) {
    let libre = 0;
    return eventos(() => {
      const pilar = gsap.utils.random([...c.pilares, gsap.getProperty(c.dominio, "autoAlpha") > 0.5 ? c.pilarDominio : c.pilarAbajo]);
      const bola = c.particulas[libre++ % c.particulas.length];
      const sube = Math.random() > 0.5;
      const [a, b] = [["x1", "y1"], ["x2", "y2"]];
      const desde = sube ? a : b, hasta = sube ? b : a;
      gsap.fromTo(bola, { attr: { cx: +pilar.getAttribute(desde[0]), cy: +pilar.getAttribute(desde[1]) }, autoAlpha: 1 },
        { attr: { cx: +pilar.getAttribute(hasta[0]), cy: +pilar.getAttribute(hasta[1]) }, duration: 1.1, ease: "power1.inOut", onComplete: () => gsap.set(bola, { autoAlpha: 0 }) });
    }, [0.35, 1.2]);
  },
};
