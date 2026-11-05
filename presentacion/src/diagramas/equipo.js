import { gsap } from "gsap";
import { el, s, eventos, juntas, respirar } from "../util.js";
import { PARTES } from "../datos.js";
import { tableroPixel, mirar } from "./tablero.js";

/* Cada parte del trabajo es una caja: las terminadas se empujan a su destino; las pendientes esperan lejos. */
const B = 84, X0 = 120, Y0 = 420, COLUMNA_DESTINO = 5;
const NIVEL = [
  "#########",
  "#   $. ##",
  "#   $.  #",
  "#   $.  #",
  "# $  .  #",
  "# $  .  #",
  "#########",
];

export default {
  montar(lienzo) {
    const tab = tableroPixel(lienzo, NIVEL, { b: B, x: X0, y: Y0, epoca: 1985 });
    const jugador = el("div", "ficha ficha--jugador", tab.raiz, { vars: { b: B } });
    el("img", "pixel", jugador, { src: window.IMG["characters/player_right"], alt: "Jugador" });
    tab.cajas.forEach((c) => gsap.set(c, { x: c.dataset.x * B, y: c.dataset.y * B }));
    gsap.set(jugador, { x: 3 * B, y: 1 * B });
    const listas = tab.cajas.filter((c) => +c.dataset.x === 4).sort((a, b) => a.dataset.y - b.dataset.y);
    const pendientes = tab.cajas.filter((c) => +c.dataset.x === 2);
    const vacios = [4, 5].map((fila) => tab.fondo.children[fila * NIVEL[0].length + COLUMNA_DESTINO]);
    vacios.forEach((v) => v.classList.add("destino-vacio"));

    const svg = s("svg", { class: "svg", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    const xBorde = X0 + NIVEL[0].length * B;
    const filas = PARTES.map((p, i) => {
      const fila = i + 1, yc = Y0 + (fila + 0.5) * B;
      const linea = s("line", { class: "lider", x1: xBorde + 8, y1: yc, x2: xBorde + 52, y2: yc }, svg);
      const rot = el("div", "anclado", lienzo, { vars: { x: xBorde + 64, y: yc - 26 } });
      rot.classList.add("pos");
      el("span", "chip " + (p.listo ? "chip--listo" : "chip--pendiente"), rot, { texto: p.nombre });
      el("span", "anclado__detalle", rot, { texto: p.listo ? `  ${p.quien}: ${p.detalle}` : "  pendiente: la tienen hecha dos compañeros" });
      return { linea, rot, listo: p.listo };
    });
    return { tab, jugador, listas, pendientes, vacios, filas };
  },

  construir(tl, { tab, jugador, listas, pendientes, filas }) {
    tl.fromTo(tab.fondo.children, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: "back.out(1.6)", stagger: { each: 0.008, from: "start" } }, 0.2)
      .fromTo([...tab.cajas, jugador], { autoAlpha: 0, y: "-=30" }, { autoAlpha: 1, y: "+=30", duration: 0.4, ease: "power2.out", stagger: 0.05 }, 0.7)
      .fromTo(filas.map((f) => f.rot), { autoAlpha: 0, x: -16 }, { autoAlpha: 0.45, x: 0, duration: 0.5, stagger: 0.08 }, 0.9)
      .fromTo(filas.map((f) => f.linea), { autoAlpha: 0 }, { autoAlpha: 0.5, duration: 0.5, stagger: 0.08 }, 0.9)
      .to(filas.filter((f) => !f.listo).map((f) => f.rot), { autoAlpha: 1, duration: 0.4 }, 1.4);

    let t0 = 1.5;
    listas.forEach((caja, i) => {
      const fila = +caja.dataset.y;
      if (i > 0) {
        tl.addLabel("p" + i, t0);
        tl.call(mirar, [jugador, "izquierda"], t0)
          .to(jugador, { x: 3 * B, duration: 0.3, ease: "empuje" }, t0)
          .call(mirar, [jugador, "abajo"], t0 + 0.3)
          .to(jugador, { y: fila * B, duration: 0.3, ease: "empuje" }, t0 + 0.32);
        t0 += 0.7;
      }
      tl.call(mirar, [jugador, "derecha"], t0)
        .to(jugador, { x: 4 * B, duration: 0.45, ease: "empuje" }, t0)
        .to(caja, { x: 5 * B, duration: 0.45, ease: "empuje" }, t0)
        .to(filas[i].rot, { autoAlpha: 1, duration: 0.35 }, t0 + 0.4)
        .to(filas[i].linea, { autoAlpha: 0.9, duration: 0.35 }, t0 + 0.4)
        .fromTo(caja, { "--marco": 0 }, { "--marco": 1, duration: 0.3 }, t0 + 0.42);
      t0 += 0.9;
    });
    tl.set(pendientes, { autoAlpha: 1 }, t0);
  },

  vida({ jugador, pendientes, vacios }) {
    const amague = eventos(() => {
      const c = gsap.utils.random(pendientes);
      gsap.fromTo(c, { x: 2 * B }, { x: 2 * B + 7, duration: 0.11, yoyo: true, repeat: 1, ease: "power1.inOut" });
    }, [1.8, 4.5]);
    const destinos = respirar(vacios);
    const quieto = respirar([jugador]);
    return juntas(amague, destinos, quieto);
  },
};
