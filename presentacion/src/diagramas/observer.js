import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { el, s, pixel, eventos, puntoEn } from "../util.js";
import { NIVEL_PRUEBA } from "../datos.js";
import { tableroPixel, mirar } from "./tablero.js";

gsap.registerPlugin(DrawSVGPlugin);

/* El sujeto juega solo con las reglas del juego de prueba; cada movimiento viaja como una foto a cada observador. */
const DIR = { arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0] };
const ORIGEN = { x: 690, y: 650 };

/** Sokoban mínimo con las mismas reglas que JuegoDePrueba: paredes, cajas, destinos y empujes. */
function crearJuego() {
  const j = {};
  j.reiniciar = () => {
    j.paredes = new Set(); j.destinos = new Set(); j.cajas = new Set(); j.mov = 0; j.emp = 0;
    NIVEL_PRUEBA.forEach((l, y) => [...l].forEach((c, x) => {
      const k = x + "," + y;
      if (c === "#") j.paredes.add(k);
      if (c === "." || c === "*" || c === "+") j.destinos.add(k);
      if (c === "$" || c === "*") j.cajas.add(k);
      if (c === "@" || c === "+") { j.x = x; j.y = y; }
    }));
  };
  j.libre = (k) => !j.paredes.has(k) && !j.cajas.has(k);
  j.puede = (d) => {
    const [dx, dy] = DIR[d], k1 = (j.x + dx) + "," + (j.y + dy), k2 = (j.x + 2 * dx) + "," + (j.y + 2 * dy);
    return !j.paredes.has(k1) && (!j.cajas.has(k1) || j.libre(k2));
  };
  j.mover = (d) => {
    const [dx, dy] = DIR[d], k1 = (j.x + dx) + "," + (j.y + dy), k2 = (j.x + 2 * dx) + "," + (j.y + 2 * dy);
    if (j.cajas.has(k1)) { j.cajas.delete(k1); j.cajas.add(k2); j.emp += 1; }
    j.x += dx; j.y += dy; j.mov += 1;
  };
  j.completado = () => [...j.cajas].every((k) => j.destinos.has(k));
  j.lineas = () => NIVEL_PRUEBA.map((l, y) => [...l].map((c, x) => {
    const k = x + "," + y, dest = j.destinos.has(k);
    if (j.x === x && j.y === y) return dest ? "+" : "@";
    if (j.cajas.has(k)) return dest ? "*" : "$";
    if (j.paredes.has(k)) return "#";
    return dest ? "." : " ";
  }).join(""));
  j.reiniciar();
  return j;
}

function cartel(lienzo, { x, y, w, h }, rotulo, fantasma) {
  const c = el("div", "cartel pos dim" + (fantasma ? " cartel--fantasma" : ""), lienzo, { vars: { x, y, w, h } });
  el("p", "cartel__rotulo", c, { texto: rotulo });
  return c;
}

export default {
  montar(lienzo) {
    const juego = crearJuego();
    const sujeto = cartel(lienzo, { x: 120, y: 420, w: 570, h: 470 }, "Juego: el sujeto, en simulación");
    const estado = el("pre", "estado", sujeto);
    const hud = cartel(lienzo, { x: 1000, y: 420, w: 470, h: 196 }, "PanelHUD: observador");
    const fila = el("div", "hud", hud);
    const numeros = ["ui/indicador_nivel", "ui/indicador_movimientos", "ui/indicador_empujes"].map((k) => {
      const ind = el("div", "hud__indicador", fila);
      pixel(k, ind, k.split("_")[1]);
      return el("span", "hud__numero", ind);
    });
    const tab = cartel(lienzo, { x: 1000, y: 640, w: 470, h: 352 }, "PanelTablero: observador");
    const dibujo = tableroPixel(tab, NIVEL_PRUEBA, { b: 52, x: 26, y: 62, epoca: 2015 });
    const sonido = cartel(lienzo, { x: 1540, y: 420, w: 300, h: 196 }, "ReproductorSonido", true);
    el("p", "anclado__detalle", sonido, { texto: "Pendiente. Se suma con una línea en Main." });

    const svg = s("svg", { class: "svg", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    const conectores = {
      hud: s("path", { class: "conector", d: `M${ORIGEN.x},${ORIGEN.y} C850,${ORIGEN.y} 840,518 1000,518` }, svg),
      tablero: s("path", { class: "conector", d: `M${ORIGEN.x},${ORIGEN.y} C850,${ORIGEN.y} 840,816 1000,816` }, svg),
      sonido: s("path", { class: "conector conector--fantasma", d: `M${ORIGEN.x},${ORIGEN.y} C850,${ORIGEN.y} 850,396 1010,396 L1490,396 C1515,396 1515,518 1540,518` }, svg),
    };
    const fotos = Object.keys(conectores).map(() => el("div", "paquete", lienzo));
    gsap.set(fotos, { autoAlpha: 0 });
    const ctx = { juego, sujeto, estado, hud, numeros, tab, dibujo, sonido, conectores, fotos, ultimo: "derecha" };
    pintar(ctx, null);
    redibujar(ctx);
    return ctx;
  },

  construir(tl, c) {
    tl.fromTo(c.sujeto, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out" }, 0.4)
      .fromTo([c.hud, c.tab], { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out", stagger: 0.15 }, 0.7)
      .fromTo([c.conectores.hud, c.conectores.tablero], { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.7, ease: "power2.inOut", stagger: 0.15 }, 1)
      .set([c.sonido, c.conectores.sonido], { autoAlpha: 0 }, 0);
    tl.addLabel("p1");
    tl.fromTo(c.sonido, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, "p1")
      .fromTo(c.conectores.sonido, { autoAlpha: 1, drawSVG: "0%" }, { drawSVG: "100%", duration: 0.9, ease: "power2.inOut" }, "p1+=0.2");
  },

  vida(c) {
    return eventos(() => {
      const j = c.juego;
      if (j.completado() || j.mov > 60) { j.reiniciar(); avisar(c, "reinicio"); return; }
      const posibles = Object.keys(DIR).filter(j.puede);
      if (!posibles.length) { j.reiniciar(); avisar(c, "reinicio"); return; }
      const d = posibles.includes(c.ultimo) && Math.random() < 0.45 ? c.ultimo : gsap.utils.random(posibles);
      c.ultimo = d;
      const antes = j.emp;
      j.mover(d);
      avisar(c, j.emp > antes ? "empujes" : "movimientos");
    }, [1.1, 2.4]);
  },
};

/** notificar(): una foto del estado viaja por cada conector y cada observador se actualiza al recibirla. */
function avisar(c, cambio) {
  pintar(c, cambio);
  const destinos = ["hud", "tablero"];
  if (gsap.getProperty(c.sonido, "autoAlpha") > 0.5) destinos.push("sonido");
  destinos.forEach((k) => {
    const path = c.conectores[k], foto = c.fotos[["hud", "tablero", "sonido"].indexOf(k)];
    const prog = { f: 0 };
    gsap.to(prog, {
      f: 1, duration: 0.55, ease: "power1.inOut",
      onStart: () => gsap.set(foto, { autoAlpha: 1 }),
      onUpdate: () => { const p = puntoEn(path, prog.f); gsap.set(foto, { x: p.x, y: p.y }); },
      onComplete: () => {
        gsap.set(foto, { autoAlpha: 0 });
        if (k === "hud") actualizarHud(c);
        else if (k === "tablero") redibujar(c);
        else gsap.fromTo(c.sonido, { scale: 1 }, { scale: 1.03, duration: 0.12, yoyo: true, repeat: 1 });
      },
    });
  });
}

function pintar(c, cambio) {
  const j = c.juego;
  c.estado.replaceChildren();
  const linea = (clave, valor) => {
    const fila = el("span", "", c.estado, { texto: `  ${clave}: ` });
    el("b", cambio === clave ? "estado__cambio" : "", fila, { texto: String(valor) });
    c.estado.append("\n");
  };
  c.estado.append("EstadoJuego(\n");
  linea("nivel", 3);
  linea("movimientos", j.mov);
  linea("empujes", j.emp);
  linea("completado", j.completado());
  c.estado.append("  tablero:\n" + j.lineas().map((l) => "    " + l).join("\n") + "\n)");
  if (cambio === null) actualizarHud(c);
}

function actualizarHud(c) {
  [3, c.juego.mov, c.juego.emp].forEach((v, i) => { c.numeros[i].textContent = String(v).padStart(3, "0"); });
}

function redibujar(c) {
  const j = c.juego, b = c.dibujo.b;
  const cajas = c.dibujo.cajas;
  [...j.cajas].forEach((k, i) => {
    const [x, y] = k.split(",").map(Number);
    gsap.to(cajas[i], { x: x * b, y: y * b, duration: 0.18, ease: "power2.out" });
    cajas[i].classList.toggle("ficha--en-destino", j.destinos.has(k));
  });
  mirar(c.dibujo.jugador, c.ultimo || "abajo");
  gsap.to(c.dibujo.jugador, { x: j.x * b, y: j.y * b, duration: 0.18, ease: "power2.out" });
}
