import { gsap } from "gsap";
import { el } from "../util.js";
import { crearTablero, dibujar } from "../tablero-sim.js";
import { NIVELES, PRUEBAS } from "../datos-corta.js";

/*
 * Calidad: los tres niveles reales, con las baldosas de su época, juegan solos su solución más corta
 * (la que encontró VerificadorDeNiveles y corre NivelesTest). Debajo, lo que probó el solucionador.
 * Paso 1: las 23 pruebas JUnit.
 */
const B = 44;
const PASO = 0.17;      // segundos por movimiento

export default {
  montar(lienzo) {
    const c = {};
    const anchos = NIVELES.map((n) => n.mapa[0].length * B);
    const hueco = (1680 - anchos.reduce((s, w) => s + w, 0)) / (NIVELES.length - 1);
    const altoMax = Math.max(...NIVELES.map((n) => n.mapa.length * B));
    let x = 120;
    c.tableros = NIVELES.map((n, i) => {
      const alto = n.mapa.length * B;
      const t = crearTablero(lienzo, n, n.solucion, { x, y: 372 + (altoMax - alto), b: B });
      const pie = el("div", "niv__pie pos dim", lienzo, { vars: { x, y: 372 + altoMax + 22, w: anchos[i] + hueco - 30 } });
      el("div", "niv__nombre", pie, { html: `Nivel ${n.numero} · <span class="niv__epoca niv__epoca--${n.epoca}">${n.epoca}</span>` });
      el("div", "niv__titulo", pie, { texto: n.nombre });
      el("div", "niv__cifras", pie, { html: `<b>${n.movimientos}</b> movimientos · <b>${n.empujes}</b> empujes` });
      el("div", "niv__prueba", pie, { texto: n.prueba });
      t.pie = pie;
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
