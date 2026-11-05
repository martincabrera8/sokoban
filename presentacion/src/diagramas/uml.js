import { gsap } from "gsap";
import { el, eventos } from "../util.js";

/* El diagrama completo real, recorrido por zonas con zoom sobre el viewBox. Cada zona enciende su rótulo. */
const ASPECTO = 1080 / 960;
const vista = (cx, cy, alto) => [cx - (alto * ASPECTO) / 2, cy - alto / 2, alto * ASPECTO, alto];
const ZONAS = [
  { nombre: "Vista", detalle: "8 clases de Luca, más Epoca de la integración", caja: vista(590, 790, 1180) },
  { nombre: "Contrato", detalle: "Juego, ObservadorJuego, EstadoJuego y Direccion", caja: vista(1480, 640, 900) },
  { nombre: "Prueba y pendientes", detalle: "JuegoDePrueba y las cajas grises que faltan", caja: vista(2030, 720, 1080) },
];
const COMPLETO = vista(1145, 845, 2040);

export default {
  montar(lienzo) {
    const plano = el("div", "plano pos dim", lienzo, { vars: { x: 760, y: 60, w: 1080, h: 960 } });
    const doc = new DOMParser().parseFromString(window.UML || "<svg xmlns='http://www.w3.org/2000/svg'/>", "image/svg+xml");
    const svg = document.importNode(doc.documentElement, true);
    svg.removeAttribute("width"); svg.removeAttribute("height");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Diagrama de clases completo del Sokoban");
    svg.setAttribute("viewBox", COMPLETO.join(" "));
    plano.appendChild(svg);
    const lista = el("div", "zonas pos", lienzo, { vars: { x: 120, y: 640 } });
    const filas = ZONAS.map((z) => {
      const f = el("div", "zona", lista);
      el("div", "zona__nombre", f, { texto: z.nombre });
      el("div", "anclado__detalle", f, { texto: z.detalle });
      return f;
    });
    return { plano, svg, filas, actual: COMPLETO.slice() };
  },

  construir(tl, c) {
    tl.fromTo(c.plano, { autoAlpha: 0, y: 40, rotationX: 8, transformPerspective: 1800 }, { autoAlpha: 1, y: 0, rotationX: 0, duration: 0.9, ease: "power3.out" }, 0.3)
      .fromTo(c.filas, { autoAlpha: 0, x: -14 }, { autoAlpha: 0.45, x: 0, duration: 0.4, stagger: 0.1 }, 0.8);
    ZONAS.forEach((z, i) => {
      tl.addLabel("p" + (i + 1));
      tl.to(c.actual, { endArray: z.caja, duration: 1.2, ease: "power3.inOut", onUpdate: () => c.svg.setAttribute("viewBox", c.actual.join(" ")) }, "p" + (i + 1))
        .to(c.filas, { autoAlpha: (j) => (j === i ? 1 : 0.45), "--marco": (j) => (j === i ? 1 : 0), duration: 0.4 }, "p" + (i + 1));
    });
    tl.addLabel("p4");
    tl.to(c.actual, { endArray: COMPLETO, duration: 1.2, ease: "power3.inOut", onUpdate: () => c.svg.setAttribute("viewBox", c.actual.join(" ")) }, "p4")
      .to(c.filas, { autoAlpha: 1, "--marco": 0, duration: 0.4 }, "p4");
  },

  vida(c) {
    return eventos(() => {
      const d = { dx: 0, dy: 0 };
      gsap.to(d, { dx: gsap.utils.random(-14, 14), dy: gsap.utils.random(-10, 10), duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: 1,
        onUpdate: () => c.svg.setAttribute("viewBox", [c.actual[0] + d.dx, c.actual[1] + d.dy, c.actual[2], c.actual[3]].join(" ")) });
    }, [5.4, 6.5]);
  },
};
