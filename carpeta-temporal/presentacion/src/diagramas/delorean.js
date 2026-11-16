import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { el, s, pixel, esperarEn, juntas, respirar } from "../util.js";
import { crearVideo, fragmento } from "../videoteca.js";
import { VIDEO_MOMENTOS } from "../datos-corta.js";

/*
 * DeLorean y Memento. Arriba a la derecha, el momento real del video. En el medio, los tres roles:
 * JuegoSokoban crea el recuerdo, RecuerdoNivel lo guarda cerrado, MaquinaDelTiempo lo cuida sin mirarlo.
 * Abajo, la línea de tiempo del nivel: se guardan puntos, se junta plutonio, la frágil se rompe y el
 * DeLorean vuelve al último punto. Pasos: 1 guardar, 2 viajar, 3 la diferencia con deshacer.
 */
const Y = 905;                       // altura de la línea de tiempo
const X0 = 170, X1 = 1750;           // extremos
const PUNTO2 = 760, PLUTONIO = 450, ROTURA = 1210;

export default {
  montar(lienzo, { slide }) {
    gsap.registerPlugin(DrawSVGPlugin);
    const c = {};
    // El momento real del video
    const marco = el("figure", "clip pos dim", lienzo, { vars: { x: 1240, y: 84, w: 560, h: 350 } });
    const v = crearVideo(marco, "clip__video", "Fragmento del video: la caja frágil se rompe y el DeLorean vuelve al último punto en el tiempo", { mudo: true, desde: VIDEO_MOMENTOS.delorean.desde });
    esperarEn(slide, v.listo);
    c.video = v.video;
    c.marco = marco;
    c.pie = el("figcaption", "clip__pie pos dim", lienzo, { vars: { x: 1240, y: 448, w: 560 }, texto: VIDEO_MOMENTOS.delorean.texto });

    // Los tres roles del Memento
    const rol = (x, w, rotulo, nombre, lineas, clase) => {
      const r = el("div", "mem__rol pos dim " + clase, lienzo, { vars: { x, y: 528, w } });
      el("div", "mem__rotulo", r, { texto: rotulo });
      el("div", "mem__nombre", r, { texto: nombre });
      lineas.forEach((l) => el("code", "mem__linea", r, { texto: l }));
      return r;
    };
    c.orig = rol(120, 430, "Originador", "JuegoSokoban", ["crearRecuerdo()", "restaurar(recuerdo)"], "mem__rol--orig");
    c.rec = rol(640, 520, "Memento", "RecuerdoNivel", ["copia del nivel, movimientos,", "empujes y plutonio"], "mem__rol--rec");
    el("div", "mem__sello", c.rec, { texto: "solo se lee desde sokoban.modelo" });
    c.cuid = rol(1250, 550, "Cuidador", "MaquinaDelTiempo", ["guardar(r) · ultimo()", "hasta 10 puntos, sin mirar adentro"], "mem__rol--cuid");
    c.pila = el("div", "mem__pila", c.cuid);
    c.fichas = [0, 1].map(() => el("i", "mem__ficha", c.pila));
    c.capsula = el("div", "mem__capsula pos", lienzo, { texto: "RecuerdoNivel" });

    // La línea de tiempo del nivel
    const svg = s("svg", { class: "svg", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    c.via = s("path", { d: `M${X0} ${Y} L${X1} ${Y}`, class: "mem__via" }, svg);
    c.hecho = s("path", { d: `M${X0} ${Y} L${ROTURA} ${Y}`, class: "mem__hecho" }, svg);
    c.arco = s("path", { d: `M${ROTURA} ${Y - 40} C${ROTURA - 120} ${Y - 125}, ${PUNTO2 + 120} ${Y - 125}, ${PUNTO2} ${Y - 40}`, class: "mem__arco" }, svg);
    c.futuro = s("path", { d: `M${PUNTO2} ${Y} L${ROTURA} ${Y}`, class: "mem__futuro" }, svg);
    const marca = (x, texto, clase = "") => {
      const m = el("div", "mem__marca pos " + clase, lienzo, { vars: { x, y: Y } });
      el("i", "", m);
      el("span", "", m, { texto });
      return m;
    };
    c.m1 = marca(X0, "inicio del nivel", "mem__marca--punto");
    c.m2 = marca(PUNTO2, "una caja llegó a su destino", "mem__marca--punto");
    c.mRota = marca(ROTURA, "se rompe la frágil", "mem__marca--rota");
    c.plu = el("div", "mem__plutonio pos", lienzo, { vars: { x: PLUTONIO, y: Y - 60 } });
    pixel("items/plutonio", c.plu, "Plutonio");
    c.jugador = el("div", "mem__jugador pos", lienzo, { vars: { x: X0, y: Y - 64 } });
    pixel("characters/player_right", c.jugador, "Jugador");
    c.delorean = el("div", "mem__delorean pos", lienzo);
    pixel("ui/boton_delorean", c.delorean, "DeLorean");
    c.carga = el("div", "mem__carga pos", lienzo, { vars: { x: 1560, y: 810 } });
    pixel("ui/indicador_plutonio", c.carga, "");
    c.cargaN = el("b", "", c.carga, { texto: "0" });
    el("span", "", c.carga, { texto: "plutonio" });

    // La diferencia con deshacer
    c.dif = el("div", "mem__dif pos", lienzo, { vars: { x: 120, y: 994 } });
    const d1 = el("p", "", c.dif);
    el("b", "", d1, { texto: "Deshacer" });
    d1.appendChild(document.createTextNode(" vuelve 5 movimientos, hasta 3 veces seguidas"));
    const d2 = el("p", "", c.dif);
    el("b", "", d2, { texto: "DeLorean" });
    d2.appendChild(document.createTextNode(" vuelve al último punto y gasta 1 plutonio"));
    el("p", "mem__dif-igual", c.dif, { texto: "Los dos restauran un RecuerdoNivel" });
    return c;
  },

  construir(tl, c) {
    const capsula = (desde, hasta, en, texto) => {
      tl.set(c.capsula, { autoAlpha: 1, x: desde.x, y: desde.y, xPercent: -50, yPercent: -50, scale: 0.6, textContent: texto }, en)
        .to(c.capsula, { scale: 1, duration: 0.25, ease: "back.out(2)" }, en)
        .to(c.capsula, { x: hasta.x, y: hasta.y, duration: 0.8, ease: "power2.inOut" }, en + 0.2)
        .to(c.capsula, { autoAlpha: 0, scale: 0.6, duration: 0.25 }, en + 1);
    };
    const O = { x: 335, y: 610 }, R = { x: 900, y: 610 }, K = { x: 1525, y: 610 };
    tl.fromTo(c.marco, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power3.out" }, 0.2)
      .fromTo(c.pie, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.7)
      .fromTo([c.orig, c.rec, c.cuid], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.14, ease: "power3.out" }, 0.5)
      .fromTo(c.via, { drawSVG: "0%" }, { drawSVG: "100%", duration: 1, ease: "power2.inOut" }, 0.8)
      .set(c.hecho, { drawSVG: "0%" }, 0)
      .set([c.arco], { drawSVG: "0%" }, 0)
      .set(c.futuro, { autoAlpha: 0 }, 0)
      .set([c.m2, c.mRota, c.delorean, c.capsula, c.dif], { autoAlpha: 0 }, 0)
      .set(c.fichas[1], { autoAlpha: 0 }, 0)
      .fromTo([c.m1, c.jugador, c.plu, c.carga], { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.4, stagger: 0.1, ease: "back.out(2)" }, 1.2)
      .fromTo(c.fichas[0], { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 1.5);

    // Paso 1: se juega; se junta plutonio y, cuando una caja llega a destino, se guarda otro punto
    tl.addLabel("p1", 2.2);
    const p1 = tl.labels.p1;
    tl.to(c.hecho, { drawSVG: `0% ${((PUNTO2 - X0) / (ROTURA - X0)) * 100}%`, duration: 1.6, ease: "none" }, p1)
      .to(c.jugador, { "--x": PUNTO2 + "px", duration: 1.6, ease: "none" }, p1)
      .to(c.plu, { y: -40, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, p1 + 0.55)
      .fromTo(c.cargaN, { textContent: "0" }, { textContent: "1", duration: 0.01, immediateRender: false }, p1 + 0.7)
      .fromTo(c.carga, { scale: 1 }, { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }, p1 + 0.7)
      .fromTo(c.m2, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, p1 + 1.6);
    capsula(O, R, p1 + 1.8, "crearRecuerdo()");
    capsula(R, K, p1 + 2.8, "guardar(recuerdo)");
    tl.fromTo(c.fichas[1], { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.35, immediateRender: false }, p1 + 3.7);

    // Paso 2: un error rompe la frágil; el DeLorean vuelve al último punto
    tl.addLabel("p2", "p1+=4.3");
    const p2 = tl.labels.p2;
    tl.to(c.hecho, { drawSVG: "0% 100%", duration: 1, ease: "none" }, p2)
      .to(c.jugador, { "--x": ROTURA + "px", duration: 1, ease: "none" }, p2)
      .fromTo(c.mRota, { autoAlpha: 0, scale: 1.6 }, { autoAlpha: 1, scale: 1, duration: 0.3, ease: "power3.out" }, p2 + 1)
      .set(c.delorean, { autoAlpha: 1, x: ROTURA, y: Y - 40, xPercent: -50, yPercent: -50 }, p2 + 1.6)
      .to(c.arco, { drawSVG: "100%", duration: 1, ease: "power2.inOut" }, p2 + 1.6)
      .to(c.delorean, { keyframes: [{ x: (ROTURA + PUNTO2) / 2, y: Y - 100, duration: 0.5, ease: "power1.out" }, { x: PUNTO2, y: Y - 40, duration: 0.5, ease: "power1.in" }] }, p2 + 1.6)
      .to(c.jugador, { autoAlpha: 0, duration: 0.2 }, p2 + 1.6)
      .set(c.jugador, { "--x": PUNTO2 + "px" }, p2 + 2.6)
      .to(c.jugador, { autoAlpha: 1, duration: 0.3 }, p2 + 2.6)
      .to(c.delorean, { autoAlpha: 0, scale: 1.6, duration: 0.4 }, p2 + 2.6)
      .fromTo(c.cargaN, { textContent: "1" }, { textContent: "0", duration: 0.01, immediateRender: false }, p2 + 2.6)
      .to(c.hecho, { drawSVG: `0% ${((PUNTO2 - X0) / (ROTURA - X0)) * 100}%`, duration: 0.5 }, p2 + 2.6)
      .to(c.futuro, { autoAlpha: 1, duration: 0.4 }, p2 + 2.6)
      .to(c.mRota, { autoAlpha: 0.35, duration: 0.4 }, p2 + 2.8);
    capsula(K, O, p2 + 2.9, "restaurar(recuerdo)");

    // Paso 3: la diferencia con deshacer
    tl.addLabel("p3", "p2+=4.2");
    tl.fromTo(c.dif, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, "p3")
      .fromTo(c.rec, { "--marco": 0 }, { "--marco": 1, duration: 0.4, immediateRender: false }, "p3+=0.3")
      .to({}, { duration: 0.3 });
  },

  vida(c) {
    return juntas(fragmento(c.video, { desde: VIDEO_MOMENTOS.delorean.desde, hasta: VIDEO_MOMENTOS.delorean.hasta }), respirar([c.rec]));
  },

  desmontar(c) {
    c.video.pause();
    c.video.removeAttribute("src");
    c.video.load();
  },
};
