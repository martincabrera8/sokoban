import { gsap } from "gsap";
import { el, pixel, eventos } from "../util.js";
import { SUBSISTEMA } from "../datos.js";

/* Los clientes llegan a una sola puerta (Juego). Cuando se abre, se ve el dominio que va a coordinar todo detrás. */
const CLIENTES = [
  { nombre: "PantallaJuego", llamadas: ["mover(DERECHA)", "iniciarNivel(2)"] },
  { nombre: "PanelHUD", llamadas: ["deshacer()", "reiniciar()"] },
  { nombre: "VentanaPrincipal", llamadas: ["getCantidadNiveles()"] },
];
const METODOS = ["getCantidadNiveles()", "iniciarNivel(numero)", "mover(direccion)", "deshacer()", "reiniciar()", "getEstado()", "agregarObservador(o)"];
const PUERTA = { x: 640, y: 420, w: 440, h: 560 };
const MARCO = { x: 760, y: 420, w: 1040, h: 560 };

export default {
  montar(lienzo) {
    const clientes = CLIENTES.map((cl, i) => {
      const c = el("div", "cartel pos dim", lienzo, { vars: { x: 120, y: 430 + i * 190, w: 400 } });
      el("p", "cartel__rotulo", c, { texto: "cliente" });
      el("p", "cartel__titulo cartel__titulo--chico", c, { texto: cl.nombre });
      return { c, llamadas: cl.llamadas, y: 430 + i * 190 + 70 };
    });
    const marco = el("div", "cartel cartel--fantasma pos dim", lienzo, { vars: MARCO });
    el("p", "cartel__rotulo marco__rotulo", marco, { texto: "Dominio: a construir" });
    const piezas = SUBSISTEMA.map((p, i) => {
      const pz = el("div", "pieza pos", marco, { vars: { x: 470 + (i % 2) * 280, y: 70 + Math.floor(i / 2) * 116 } });
      pixel(p.img, pz, "");
      el("span", "", pz, { texto: p.nombre });
      return { pz, usa: p.usa };
    });
    const puerta = el("div", "puerta pos dim", lienzo, { vars: PUERTA });
    const hoja = el("div", "puerta__hoja cartel", puerta);
    el("p", "cartel__rotulo", hoja, { texto: "interface" });
    el("p", "cartel__titulo", hoja, { texto: "Juego" });
    const lista = el("div", "metodo", hoja);
    METODOS.forEach((m) => { const fila = el("div", "", lista); el("b", "", fila, { texto: m.split("(")[0] }); fila.append("(" + m.split("(")[1]); });
    const llamada = el("code", "chip chip--codigo paquete-codigo", lienzo, { texto: "mover(DERECHA)" });
    gsap.set(llamada, { autoAlpha: 0 });
    return { clientes, marco, piezas, puerta, hoja, llamada };
  },

  construir(tl, { clientes, marco, piezas, hoja }) {
    tl.fromTo(clientes.map((c) => c.c), { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.12, ease: "power3.out" }, 0.4)
      .fromTo(marco, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.7)
      .fromTo(hoja, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.8)
      .set(piezas.map((p) => p.pz), { autoAlpha: 0 }, 0);
    tl.addLabel("p1");
    tl.to(hoja, { rotationY: -58, transformPerspective: 1400, duration: 1.2, ease: "power3.inOut" }, "p1")
      .fromTo(piezas.map((p) => p.pz), { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.07, ease: "power2.out" }, "p1+=0.5");
  },

  vida({ clientes, piezas, hoja, llamada }) {
    return eventos(() => {
      const cl = gsap.utils.random(clientes);
      llamada.textContent = gsap.utils.random(cl.llamadas);
      const abierta = gsap.getProperty(hoja, "rotationY") < -40;
      const tl = gsap.timeline();
      tl.set(llamada, { x: 540, y: cl.y, autoAlpha: 1 })
        .to(llamada, { x: PUERTA.x + 30, y: PUERTA.y + 270, duration: 0.7, ease: "power2.inOut" });
      if (!abierta) {
        tl.to(hoja, { x: 6, duration: 0.08, yoyo: true, repeat: 1 }).to(llamada, { autoAlpha: 0, duration: 0.25 });
        return;
      }
      const usadas = piezas.filter((p) => p.usa);
      tl.to(llamada, { autoAlpha: 0, duration: 0.2 })
        .to(usadas.map((p) => p.pz), { "--marco": 1, duration: 0.12, stagger: 0.18, yoyo: true, repeat: 1 }, "<");
    }, [1.6, 3.2]);
  },
};
