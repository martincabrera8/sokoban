import { gsap } from "gsap";
import { el, s, eventos, juntas, respirar } from "../util.js";

/*
 * Sonido: Decorator y State, con Observer y Singleton al pie.
 * Izquierda: JuegoConSonido envuelve a JuegoSokoban; el pedido entra, se toma el estado antes y después y suena
 * lo que cambió. Derecha: Sonidos y sus dos estados; la tecla M pasa de uno al otro. Pasos: 1 un movimiento,
 * 2 la tecla M, 3 los otros dos patrones.
 */
const CODIGO = [
  ["antes = juego.getEstado();", "antes"],
  ["juego.mover(direccion);", "delega"],
  ["despues = juego.getEstado();", "despues"],
  ["sonar(antes.equals(despues)", "sonar"],
  ["  ? CHOQUE", "sonar"],
  ["  : queSonidoCorresponde(antes, despues));", "sonar"],
];
const EFECTOS = ["EMPUJE", "CAJA_EN_DESTINO", "PLUTONIO", "CHOQUE", "VIAJE_EN_EL_TIEMPO", "PASO"];

export default {
  montar(lienzo) {
    const c = {};
    // Decorator
    c.envase = el("div", "env__envase pos dim", lienzo, { vars: { x: 120, y: 392, w: 960, h: 360 } });
    const rot = el("div", "env__rotulo", c.envase);
    el("b", "", rot, { texto: "JuegoConSonido" });
    el("span", "", rot, { texto: "extends JuegoDecorado · Decorator" });
    const pre = el("pre", "env__codigo", c.envase);
    el("div", "env__codigo-cab", pre, { texto: "mover(direccion), resumido" });
    c.lineas = CODIGO.map(([l, k]) => el("code", "env__linea env__linea--" + k, pre, { texto: l }));
    c.real = el("div", "env__real", c.envase);
    el("b", "", c.real, { texto: "JuegoSokoban" });
    el("span", "", c.real, { texto: "el juego real, sin cambios" });
    c.efecto = el("div", "env__efecto", c.envase);
    el("span", "env__efecto-rotulo", c.efecto, { texto: "suena" });
    c.efectoN = el("code", "env__efecto-nombre", c.efecto, { texto: "EMPUJE" });
    const onda = s("svg", { class: "env__onda", viewBox: "0 0 120 40", "aria-hidden": "true" }, c.efecto);
    c.barras = Array.from({ length: 12 }, (_, i) => s("rect", { x: i * 10 + 2, y: 8, width: 6, height: 24, rx: 3 }, onda));
    c.mudo = el("span", "env__mudo", c.efecto, { texto: "silenciado" });
    c.pie = el("p", "env__pie pos dim", lienzo, { vars: { x: 120, y: 772, w: 960 }, html: "<code>JuegoDecorado</code> es la base abstracta: delega los 9 métodos de <code>Juego</code>. <code>JuegoConSonido</code> solo sobrescribe 5." });
    c.pedido = el("div", "capas__paquete pos", lienzo, { texto: "mover(DERECHA)" });

    // State
    c.estado = el("div", "env__state pos dim", lienzo, { vars: { x: 1160, y: 392, w: 640 } });
    const cab = el("div", "env__rotulo", c.estado);
    el("b", "", cab, { texto: "Sonidos" });
    el("span", "", cab, { texto: "State · tecla M" });
    el("code", "env__firma", c.estado, { texto: "estado.reproducir(clip)" });
    const nodo = (nombre, hace, clase) => {
      const n = el("div", "env__nodo " + clase, c.estado);
      el("b", "", n, { texto: nombre });
      el("span", "", n, { texto: hace });
      return n;
    };
    c.activado = nodo("SonidoActivado", "reproduce el efecto", "env__nodo--a");
    const cambio = el("div", "env__cambio", c.estado);
    c.tecla = el("div", "env__tecla", cambio, { texto: "M" });
    el("code", "env__alternar", cambio, { texto: "alternar(contexto)" });
    c.silenciado = nodo("SonidoSilenciado", "no hace nada", "env__nodo--b");
    el("p", "env__nota", c.estado, { texto: "Cada estado decide a cuál pasa." });

    // Observer y Singleton
    c.otros = el("div", "env__otros pos dim", lienzo, { vars: { x: 120, y: 878, w: 1680 } });
    const otro = (patron, texto) => {
      const o = el("div", "env__otro", c.otros);
      el("b", "", o, { texto: patron });
      el("span", "", o, { html: texto });
      return o;
    };
    c.obs = otro("Observer", "<code>PanelHUD</code> y <code>PanelTablero</code> implementan <code>ObservadorJuego</code>: se suscriben y se desuscriben.");
    c.sing = otro("Singleton", "<code>Sonidos</code> e <code>Imagenes</code>: constructor privado y <code>obtenerInstancia()</code>.");
    return c;
  },

  construir(tl, c) {
    const nombre = (txt, en) => tl.set(c.efectoN, { textContent: txt }, en);
    tl.fromTo(c.envase, { autoAlpha: 0, scale: 0.95 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "back.out(1.5)" }, 0.3)
      .fromTo(c.real, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out" }, 0.6)
      .fromTo(c.estado, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, 0.6)
      .fromTo(c.pie, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 1)
      .set([c.pedido, c.mudo, c.otros.children], { autoAlpha: 0 }, 0)
      .set(c.efecto, { autoAlpha: 0.35 }, 0)
      .set(c.activado, { "--marco": 1 }, 0)
      .set(c.silenciado, { "--marco": 0 }, 0);

    // Paso 1: un movimiento atraviesa el decorador
    tl.addLabel("p1", 1.6);
    const p1 = tl.labels.p1;
    const linea = (k, en) => tl.to(c.lineas, { "--resalte": 0, duration: 0.15 }, en).to(c.lineas.filter((l) => l.classList.contains("env__linea--" + k)), { "--resalte": 1, duration: 0.2 }, en);
    tl.set(c.pedido, { autoAlpha: 1, x: 60, y: 470, xPercent: -50, yPercent: -50 }, p1)
      .to(c.pedido, { x: 300, duration: 0.5, ease: "power2.out" }, p1);
    linea("antes", p1 + 0.4);
    linea("delega", p1 + 1);
    tl.to(c.pedido, { x: 900, y: 520, duration: 0.6, ease: "power1.inOut" }, p1 + 1)
      .fromTo(c.real, { "--marco": 0 }, { "--marco": 1, duration: 0.2, yoyo: true, repeat: 1, immediateRender: false }, p1 + 1.5)
      .to(c.pedido, { autoAlpha: 0, duration: 0.25 }, p1 + 1.8);
    linea("despues", p1 + 1.9);
    linea("sonar", p1 + 2.5);
    nombre("EMPUJE", p1 + 2.6);
    tl.to(c.efecto, { autoAlpha: 1, duration: 0.25 }, p1 + 2.6)
      .fromTo(c.barras, { scaleY: 0.2, transformOrigin: "50% 50%" }, { scaleY: 1, duration: 0.18, stagger: { each: 0.03, yoyo: true, repeat: 1 }, immediateRender: false }, p1 + 2.6);

    // Paso 2: la tecla M cambia de estado; el mismo pedido ya no suena
    tl.addLabel("p2", "p1+=3.6");
    const p2 = tl.labels.p2;
    tl.fromTo(c.tecla, { y: 0 }, { y: 6, duration: 0.1, yoyo: true, repeat: 1, immediateRender: false }, p2)
      .to(c.activado, { "--marco": 0, duration: 0.3 }, p2 + 0.2)
      .to(c.silenciado, { "--marco": 1, duration: 0.3 }, p2 + 0.4)
      .to(c.barras, { scaleY: 0.12, duration: 0.3 }, p2 + 0.5)
      .to(c.mudo, { autoAlpha: 1, duration: 0.3 }, p2 + 0.6);

    // Paso 3: Observer y Singleton, en una línea cada uno
    tl.addLabel("p3", "p2+=1.4");
    tl.fromTo(c.otros.children, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.18, ease: "power3.out", immediateRender: false }, "p3")
      .to({}, { duration: 0.3 });
  },

  vida(c) {
    // Cada tanto suena otro efecto real del enum Sonido (si el estado es activado)
    let i = 0;
    const efectos = eventos(() => {
      if (Number(gsap.getProperty(c.mudo, "opacity")) > 0.5) return;
      i = (i + 1) % EFECTOS.length;
      c.efectoN.textContent = EFECTOS[i];
      gsap.fromTo(c.barras, { scaleY: 0.2 }, { scaleY: () => gsap.utils.random(0.4, 1), duration: 0.16, stagger: { each: 0.025, yoyo: true, repeat: 1 }, transformOrigin: "50% 50%" });
    }, [1.6, 3.4]);
    return juntas(efectos, respirar([c.tecla]));
  },
};
