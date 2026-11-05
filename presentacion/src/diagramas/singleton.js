import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { el, s, pixel, eventos, offsetEn } from "../util.js";
import { USADAS } from "../datos.js";

gsap.registerPlugin(DrawSVGPlugin);

/* Tres clientes piden imágenes a la única caché. La primera vez la caché lee el archivo; después responde sola. */
const CLIENTES = ["MenuPrincipal", "PanelHUD", "PanelTablero"];
const BOVEDA = { x: 600, y: 420 }, DISCO = { x: 1200, y: 420 };
const numero = (n) => n.toLocaleString("es-AR");

export default {
  montar(lienzo) {
    const clientes = CLIENTES.map((n, i) => {
      const c = el("div", "cartel pos dim", lienzo, { vars: { x: 120, y: 440 + i * 150, w: 330 } });
      el("p", "cartel__rotulo", c, { texto: "cliente" });
      el("p", "cartel__titulo cartel__titulo--chico", c, { texto: n });
      return c;
    });
    const boveda = el("div", "cartel pos", lienzo, { vars: BOVEDA });
    el("p", "cartel__rotulo", boveda, { texto: "la única instancia" });
    el("p", "cartel__titulo", boveda, { texto: "Imagenes" });
    const grilla = el("div", "boveda__grilla", boveda);
    const ranuras = USADAS.map(() => el("div", "ranura", grilla));
    el("code", "chip chip--codigo boveda__codigo", boveda, { texto: "Imagenes.obtenerInstancia()" });
    const disco = el("div", "cartel cartel--disco pos", lienzo, { vars: DISCO });
    el("p", "cartel__rotulo", disco, { texto: "assets/ en disco" });
    const estante = el("div", "boveda__grilla", disco);
    const archivos = USADAS.map((k) => { const r = el("div", "ranura ranura--llena", estante); pixel(k, r, ""); return r; });
    const cuentas = el("div", "cuentas pos", lienzo, { vars: { x: 1200, y: 860 } });
    const pedidos = el("div", "", cuentas);
    const nPedidos = el("div", "cifra cifra--chica cifra--exito", pedidos, { texto: "0" });
    el("span", "cifra__unidad", pedidos, { texto: "pedidos a la caché (simulados)" });
    const lecturas = el("div", "", cuentas);
    const nLecturas = el("div", "cifra cifra--chica", lecturas, { texto: "0" });
    el("span", "cifra__unidad", lecturas, { texto: `lecturas del disco (tope: ${USADAS.length})` });
    const svg = s("svg", { class: "svg", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    const lineas = clientes.map((_, i) => s("path", { class: "conector", d: `M450,${490 + i * 150} C520,${490 + i * 150} 530,560 ${BOVEDA.x},560` }, svg));
    const paquetes = Array.from({ length: 6 }, () => el("div", "paquete", lienzo));
    gsap.set(paquetes, { autoAlpha: 0 });
    return { lienzo, clientes, boveda, ranuras, disco, archivos, nPedidos, nLecturas, cuentas, lineas, paquetes, cache: new Set(), pedidos: 0 };
  },

  construir(tl, c) {
    tl.fromTo(c.clientes, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.12, ease: "power3.out" }, 0.4)
      .fromTo(c.lineas, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.6, stagger: 0.12 }, 0.7)
      .fromTo(c.boveda, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.4)" }, 0.9)
      .fromTo(c.disco, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out" }, 1.1)
      .fromTo(c.cuentas, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 1.3);
  },

  vida(c) {
    let libre = 0;
    const viaje = (paq, desde, hasta, dur, clase) => gsap.timeline()
      .set(paq, { x: desde.x, y: desde.y, autoAlpha: 1, className: "paquete" + (clase ? " " + clase : "") })
      .to(paq, { x: hasta.x, y: hasta.y, duration: dur, ease: "power1.inOut" });
    return eventos(() => {
      const i = gsap.utils.random(0, c.clientes.length - 1, 1);
      const k = gsap.utils.random(0, USADAS.length - 1, 1);
      const paq = c.paquetes[libre++ % c.paquetes.length];
      const cliente = { x: 460, y: 490 + i * 150 };
      const ranura = offsetEn(c.ranuras[k], c.lienzo);
      const centro = { x: ranura.x + ranura.w / 2, y: ranura.y + ranura.h / 2 };
      c.pedidos += 1;
      c.nPedidos.textContent = numero(c.pedidos);
      const tl = viaje(paq, cliente, centro, 0.5);
      if (!c.cache.has(k)) {
        const archivo = offsetEn(c.archivos[k], c.lienzo);
        tl.add(viaje(paq, centro, { x: archivo.x + archivo.w / 2, y: archivo.y + archivo.h / 2 }, 0.45, "paquete--lectura"))
          .add(viaje(paq, { x: archivo.x + archivo.w / 2, y: archivo.y + archivo.h / 2 }, centro, 0.45, "paquete--lectura"))
          .call(() => {
            if (c.cache.has(k)) return;
            c.cache.add(k);
            c.ranuras[k].classList.add("ranura--llena");
            pixel(USADAS[k], c.ranuras[k], "");
            c.nLecturas.textContent = numero(c.cache.size);
          });
      }
      tl.add(viaje(paq, centro, cliente, 0.4)).set(paq, { autoAlpha: 0 });
    }, [0.18, 0.7]);
  },
};
