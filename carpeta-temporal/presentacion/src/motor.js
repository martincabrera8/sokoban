import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { t, seg, reducido, preparada } from "./util.js";

const DIAGRAMAS = {};
export const registrar = (clave, modulo) => { DIAGRAMAS[clave] = modulo; };

const FRENO = 450; // ms entre cambios de diapositiva
let escenario, slides, actual = -1, ocupado = false, ultimo = 0, est = null, notas = null, inicioCharla = Date.now(), turno = 0;
/** Mediciones para pruebas: montaje (ms), espera de preparación (ms) y transición (ms) de la última entrada. */
const medidas = { montaje: 0, preparacion: 0, transicion: 0 };

/** Escenario de 1920×1080 dibujado a la resolución real (zoom, no transform: el texto y el 3D quedan nítidos).
 *  --ex y --ey son los márgenes que sobran a los costados, para que los fondos lleguen hasta el borde. */
function ajustar() {
  const raiz = document.documentElement;
  const escala = Math.min(innerWidth / 1920, innerHeight / 1080);
  raiz.style.setProperty("--escala", escala);
  raiz.style.setProperty("--ex", (innerWidth / escala - 1920) / 2 + "px");
  raiz.style.setProperty("--ey", (innerHeight / escala - 1080) / 2 + "px");
}

/** La cabecera entra igual en todas: rótulo, título por palabras con máscara y bajada. */
function entradaCabecera(tl, slide) {
  const cab = slide.querySelector(".cab");
  if (!cab) return;
  const titulo = cab.querySelector(".titulo");
  const resto = cab.querySelectorAll(".rotulo, .bajada, .equipo-linea");
  if (titulo) {
    if (slide._partes) slide._partes.revert();
    const partes = SplitText.create(titulo, { type: "words", mask: "words", wordsClass: "palabra" });
    tl.fromTo(partes.words, { yPercent: 110 }, { yPercent: 0, duration: seg("dur-escena"), ease: t("ease-entrada"), stagger: 0.07, clearProps: "transform" }, 0.1);
    slide._partes = partes;
  }
  tl.fromTo(resto, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: seg("dur-escena"), ease: t("ease-entrada"), stagger: 0.12, clearProps: "transform" }, 0.35);
}

function montar(i) {
  const slide = slides[i];
  const lienzo = slide.querySelector(".lienzo");
  lienzo.replaceChildren();
  const modulo = DIAGRAMAS[slide.dataset.diagrama] || { montar: () => ({}), construir() {} };
  const ctx = modulo.montar(lienzo, { slide, escenario });
  const tl = gsap.timeline({ paused: true });
  entradaCabecera(tl, slide);
  modulo.construir(tl, ctx);
  const pasos = Object.values(tl.labels).sort((a, b) => a - b).filter((x) => x > 0 && x < tl.duration());
  pasos.push(tl.duration());
  return { slide, modulo, ctx, tl, pasos, paso: 0, vida: null, reproductor: null };
}

function desmontar(e) {
  if (!e) return;
  if (e.vida) e.vida.kill();
  if (e.reproductor) e.reproductor.kill();
  e.tl.kill();
  if (e.modulo.desmontar) e.modulo.desmontar(e.ctx);
}

function arrancarVida(e) {
  if (reducido() || !e.modulo.vida || e.vida) return;
  e.vida = e.modulo.vida(e.ctx);
}

function reproducirHasta(e, tiempo) {
  if (e.reproductor) e.reproductor.kill();
  if (reducido()) { e.tl.seek(tiempo, false); return; }
  e.reproductor = e.tl.tweenTo(tiempo, { ease: "none" });
}

let mosaico = null;
/** Mosaico de baldosas que tapa y destapa la pantalla (se arma una sola vez). */
function crearMosaico() {
  mosaico = document.createElement("div");
  mosaico.className = "mosaico";
  mosaico.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 16 * 9; i++) mosaico.appendChild(document.createElement("i"));
  escenario.appendChild(mosaico);
}

const TRANSICIONES = {
  baldosas(T, prev, next, dir) {
    const celdas = mosaico.children;
    const desde = dir > 0 ? "start" : "end";
    T.set(next, { autoAlpha: 0 }, 0)
      .fromTo(celdas, { scale: 0, rotation: -90 * dir }, { scale: 1.02, rotation: 0, duration: 0.42, ease: "power2.in", stagger: { grid: [9, 16], from: desde, amount: 0.5 } }, 0)
      .set(prev, { autoAlpha: 0 }, 0.95)
      .set(next, { autoAlpha: 1 }, 0.95)
      .to(celdas, { scale: 0, rotation: 90 * dir, duration: 0.42, ease: "power2.out", stagger: { grid: [9, 16], from: desde, amount: 0.5 } }, 1);
  },
  portal(T, prev, next) {
    const anillo = escenario.querySelector(".portal-anillo");
    T.fromTo(next, { clipPath: "circle(0% at 50% 55%)" }, { clipPath: "circle(80% at 50% 55%)", duration: 1.2, ease: "power3.inOut" }, 0)
      .fromTo(prev, { scale: 1, autoAlpha: 1 }, { scale: 1.18, autoAlpha: 0.2, duration: 1.2, ease: "power2.in" }, 0)
      .fromTo(anillo, { scale: 0, autoAlpha: 1 }, { scale: 2.6, autoAlpha: 0, duration: 1.2, ease: "power3.inOut" }, 0);
  },
  empuje(T, prev, next, dir) {
    T.fromTo(next, { xPercent: 100 * dir }, { xPercent: 0, ease: "empuje" }, 0)
      .fromTo(prev, { xPercent: 0 }, { xPercent: -100 * dir, ease: "empuje" }, 0);
  },
  profundidad(T, prev, next, dir) {
    T.fromTo(prev, { scale: 1, z: 0, autoAlpha: 1 }, { scale: 0.72, z: -500, rotationX: 10 * dir, autoAlpha: 0 }, 0)
      .fromTo(next, { scale: 1.25, z: 300, autoAlpha: 0 }, { scale: 1, z: 0, autoAlpha: 1 }, 0.12);
  },
  telon(T, prev, next, dir) {
    T.fromTo(next, { clipPath: dir > 0 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)" }, 0)
      .fromTo(prev, { xPercent: 0, scale: 1, autoAlpha: 1 }, { xPercent: -26 * dir, scale: 0.86, rotationY: 18 * dir, autoAlpha: 0.3 }, 0);
  },
  cubo(T, prev, next, dir) {
    T.fromTo(prev, { rotationY: 0, xPercent: 0, z: 0, scale: 1, autoAlpha: 1 },
      { rotationY: -80 * dir, xPercent: -60 * dir, z: -500, scale: 0.8, autoAlpha: 0.35, transformOrigin: dir > 0 ? "100% 50%" : "0% 50%" }, 0)
      .fromTo(next, { rotationY: 80 * dir, xPercent: 60 * dir, z: -500, scale: 0.8, autoAlpha: 0.35, transformOrigin: dir > 0 ? "0% 50%" : "100% 50%" },
        { rotationY: 0, xPercent: 0, z: 0, scale: 1, autoAlpha: 1 }, 0);
  },
};

function mostrar(i, dir, construido) {
  if (i < 0 || i >= slides.length || i === actual) return;
  if (reducido()) construido = true;
  ocupado = true;
  const mio = ++turno;
  const anterior = est;
  const prevEl = anterior ? anterior.slide : null;
  if (anterior && anterior.vida) { anterior.vida.kill(); anterior.vida = null; }
  if (anterior && anterior.reproductor) anterior.reproductor.kill();
  actual = i;
  const t0 = performance.now();
  const e = montar(i);
  medidas.montaje = performance.now() - t0;
  est = e;
  if (construido) { e.tl.progress(1, false); e.paso = e.pasos.length - 1; } else { e.tl.progress(0); e.paso = 0; }

  // La que entra compila sus shaders y sube sus texturas antes de animar; mientras, la que sale sigue viva.
  const entrar = () => {
    medidas.preparacion = performance.now() - t0 - medidas.montaje;
    e.slide.classList.add("activa");
    e.slide.setAttribute("aria-hidden", "false");
    try { history.replaceState(null, "", "#" + (i + 1)); } catch (err) { /* visor sin historial */ }
    enviarNotas();
    const t1 = performance.now();
    const terminar = () => {
      if (prevEl) { prevEl.classList.remove("activa", "saliendo"); prevEl.setAttribute("aria-hidden", "true"); gsap.set(prevEl, { clearProps: "all" }); }
      gsap.set(e.slide, { clearProps: "transform,opacity,visibility,clipPath" });
      document.documentElement.classList.remove("en-transicion");
      desmontar(anterior);
      medidas.transicion = performance.now() - t1;
      if (mio === turno) ocupado = false;
      arrancarVida(e);
    };
    if (!construido) reproducirHasta(e, e.pasos[0]);
    if (!prevEl || reducido()) { terminar(); return; }
    // La que sale deja de dibujar su 3D apenas empieza la transición (su último cuadro queda quieto en el lienzo).
    prevEl.classList.add("saliendo");
    document.documentElement.classList.add("en-transicion");
    const T = gsap.timeline({ defaults: { duration: seg("dur-transicion"), ease: t("ease-vuelo") }, onComplete: terminar });
    (TRANSICIONES[e.slide.dataset.t] || TRANSICIONES.empuje)(T, prevEl, e.slide, dir);
  };
  const espera = reducido() ? null : preparada(e.slide);
  if (espera) espera.then(entrar); else entrar();
}

function avanzar() {
  if (!est || !est.slide.classList.contains("activa")) return; // todavía se prepara
  if (est.paso < est.pasos.length - 1 && est.tl.time() >= est.pasos[est.paso] - 0.01) {
    est.paso += 1;
    reproducirHasta(est, est.pasos[est.paso]);
    return;
  }
  if (est.tl.time() < est.pasos[est.paso] - 0.01) { // termina el paso en curso de una
    if (est.reproductor) est.reproductor.kill();
    est.tl.seek(est.pasos[est.paso], false);
    return;
  }
  irA(actual + 1, 1);
}

function irA(i, dir, construido = false) {
  const ahora = performance.now();
  if (ocupado || ahora - ultimo < FRENO) return;
  ultimo = ahora;
  mostrar(i, dir, construido);
}

function repetir() {
  if (!est || ocupado) return;
  const i = actual;
  desmontar(est);
  actual = -1; est = null;
  mostrar(i, 1, false);
}

/** Notas del expositor y reloj, en una ventana aparte (nunca en la proyección). */
function abrirNotas() {
  try {
    notas = window.open("", "notas-sokoban", "width=720,height=560");
    if (!notas) return;
    const d = notas.document;
    d.title = "Notas del expositor";
    d.body.replaceChildren();
    d.documentElement.style.setProperty("--f", t("f-texto"));
    d.documentElement.style.setProperty("--m", t("f-mono"));
    const hoja = d.createElement("style");
    hoja.textContent = "body{font-family:var(--f);font-size:22px;line-height:1.5;margin:24px} #reloj{font-family:var(--m);font-size:30px} #ns{opacity:.6}";
    d.head.appendChild(hoja);
    ["reloj", "nt", "nc", "ns"].forEach((id) => { const e = d.createElement(id === "nt" ? "h2" : "div"); e.id = id; d.body.appendChild(e); });
    enviarNotas();
    const tic = () => {
      if (!notas || notas.closed) return;
      const m = Math.floor((Date.now() - inicioCharla) / 1000);
      notas.document.getElementById("reloj").textContent = String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
      setTimeout(tic, 1000);
    };
    tic();
  } catch (err) { notas = null; }
}

function enviarNotas() {
  try {
    if (!notas || notas.closed || !est) return;
    const n = est.slide.querySelector(".notas");
    const sig = slides[actual + 1] ? slides[actual + 1].querySelector(".titulo") : null;
    notas.document.getElementById("nt").textContent = (actual + 1) + " / " + slides.length + "  " + est.slide.querySelector(".titulo").textContent;
    const nc = notas.document.getElementById("nc");
    nc.replaceChildren(...(n ? [...n.childNodes].map((x) => notas.document.importNode(x, true)) : []));
    notas.document.getElementById("ns").textContent = sig ? "Sigue: " + sig.textContent : "Última diapositiva";
  } catch (err) { notas = null; }
}

function teclado(ev) {
  if (ev.repeat) { ev.preventDefault(); return; }
  const k = ev.key;
  if (["ArrowRight", "PageDown", " ", "Enter"].includes(k)) { ev.preventDefault(); avanzar(); }
  else if (["ArrowLeft", "PageUp", "Backspace"].includes(k)) { ev.preventDefault(); irA(actual - 1, -1, true); }
  else if (k === "Home") irA(0, -1);
  else if (k === "End") irA(slides.length - 1, 1, true);
  else if (k === "z" || k === "Z") gsap.globalTimeline.paused(!gsap.globalTimeline.paused());
  else if (k === "r" || k === "R") repetir();
  else if (k === "h" || k === "H") escenario.classList.toggle("oculto-todo");
  else if (k === "n" || k === "N") abrirNotas();
  else if (k === "Escape") { try { if (notas) notas.close(); } catch (err) { /* nada */ } escenario.classList.remove("oculto-todo"); }
}

export function iniciar() {
  gsap.registerPlugin(SplitText, CustomEase);
  CustomEase.create("empuje", t("ease-empuje").replace(/"/g, ""));
  escenario = document.querySelector(".escenario");
  slides = [...escenario.querySelectorAll(".slide")];
  slides.forEach((s) => s.setAttribute("aria-hidden", "true"));
  crearMosaico();
  const anillo = document.createElement("div");
  anillo.className = "portal-anillo";
  anillo.setAttribute("aria-hidden", "true");
  escenario.appendChild(anillo);
  ajustar();
  addEventListener("resize", ajustar);
  addEventListener("keydown", teclado, true);
  let inicio = 0;
  try { inicio = Math.max(0, Math.min(slides.length - 1, parseInt(location.hash.slice(1), 10) - 1 || 0)); } catch (err) { inicio = 0; }
  document.fonts.ready.then(() => mostrar(inicio, 1, false));
  window.__presentacion = { irA: (i, c) => { ultimo = 0; ocupado = false; mostrar(i, 1, c); }, avanzar, estado: () => ({ actual, paso: est && est.paso, pasos: est && est.pasos.length, duracion: est && est.tl.duration(), marcas: est && est.pasos.map((x) => +x.toFixed(2)), ocupado, ...medidas }),
    seek: (tt) => { if (est.reproductor) est.reproductor.kill(); est.tl.seek(tt, false); } };
}
