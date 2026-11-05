import { gsap } from "gsap";
import { el, pixel, eventos, offsetEn } from "../util.js";
import { USADAS, ESTANTES } from "../datos.js";

/* Las 101 imágenes de Martín llegan como un mazo y se reparten por carpeta; después se encienden las 28 que el juego usa. */
const Y0 = 470, ALTO_FILA = 60, MAZO = { x: 1640, y: 640 };

export default {
  montar(lienzo) {
    const inventario = window.INVENTARIO || {};
    const usadas = new Set(USADAS);
    const todas = [], cuentas = [];
    let y = Y0;
    ESTANTES.forEach((carpeta) => {
      const claves = inventario[carpeta] || [];
      const estante = el("div", "estante", lienzo, { vars: { x: 120, y } });
      estante.classList.add("pos");
      el("span", "estante__nombre", estante, { texto: carpeta + "/" });
      const fila = el("div", "estante__fila", estante);
      if (carpeta === "tiles") fila.classList.add("estante__fila--ancha");
      claves.forEach((k) => {
        const m = el("div", "miniatura" + (carpeta === "backgrounds" ? " miniatura--ancha" : "") + (usadas.has(k) ? " miniatura--usada" : ""), fila);
        pixel(k, m, k.split("/")[1].replace(/_/g, " "));
        todas.push(m);
      });
      const usa = claves.filter((k) => usadas.has(k)).length;
      const cuenta = el("span", "estante__cuenta", estante);
      el("b", "", cuenta, { texto: String(usa) });
      cuenta.append(` de ${claves.length} en uso`);
      cuentas.push(cuenta);
      y += carpeta === "tiles" ? 0 : ALTO_FILA;
    });
    return { lienzo, todas, cuentas, usadas: todas.filter((m) => m.classList.contains("miniatura--usada")), sinUso: todas.filter((m) => !m.classList.contains("miniatura--usada")) };
  },

  construir(tl, { lienzo, todas, cuentas, usadas, sinUso }) {
    const destinos = todas.map((m) => offsetEn(m, lienzo));
    tl.fromTo(todas, {
      x: (i) => MAZO.x - destinos[i].x + gsap.utils.random(-14, 14),
      y: (i) => MAZO.y - destinos[i].y + gsap.utils.random(-14, 14),
      rotation: () => gsap.utils.random(-28, 28),
      autoAlpha: 0,
    }, { x: 0, y: 0, rotation: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out", stagger: { each: 0.012, from: "end" } }, 0.4);
    tl.addLabel("p1");
    tl.to(sinUso, { autoAlpha: 0.3, duration: 0.5, ease: "power1.out" }, "p1")
      .fromTo(usadas, { "--marco": 0 }, { "--marco": 1, duration: 0.3, stagger: 0.02 }, "p1")
      .fromTo(usadas, { scale: 1 }, { scale: 1.12, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", stagger: 0.02 }, "p1")
      .fromTo(cuentas, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.06 }, "p1+=0.3");
  },

  vida({ usadas }) {
    return eventos(() => {
      const m = gsap.utils.random(usadas);
      gsap.fromTo(m, { scale: 1 }, { scale: 1.16, duration: 0.22, yoyo: true, repeat: 1, ease: "power2.out" });
    }, [0.7, 2.2]);
  },
};
