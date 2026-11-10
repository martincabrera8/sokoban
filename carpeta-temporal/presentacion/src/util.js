import { gsap } from "gsap";

const raiz = () => getComputedStyle(document.documentElement);

/** Lee un token de tokens.css, por ejemplo t("acento"). */
export const t = (k) => raiz().getPropertyValue("--" + k).trim();
/** Lee un token de duración: seg("dur-escena") → 0.9 */
export const seg = (k) => parseFloat(t(k));
/** Imagen embebida por build.py: img("tiles/floor_1955"). */
export const img = (k) => (window.IMG && window.IMG[k]) || "";
export const reducido = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Crea un elemento HTML con clases y lo agrega al padre. Las posiciones van por variables CSS. */
export function el(tag, clases, padre, props = {}) {
  const e = document.createElement(tag);
  if (clases) e.className = clases;
  const { vars, html, texto, ...attrs } = props;
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (vars) Object.entries(vars).forEach(([k, v]) => e.style.setProperty("--" + k, typeof v === "number" ? v + "px" : v));
  if (html !== undefined) e.innerHTML = html;
  if (texto !== undefined) e.textContent = texto;
  if (padre) padre.appendChild(e);
  return e;
}

/** Crea un elemento SVG con atributos y lo agrega al padre. */
export function s(tag, attrs = {}, padre) {
  const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (padre) padre.appendChild(e);
  return e;
}

/** Imagen pixel art con su texto alternativo. */
export function pixel(clave, padre, alt = "", clases = "pixel") {
  return el("img", clases, padre, { src: img(clave), alt, draggable: "false" });
}

/** Cada elemento respira con su propia fase y velocidad (nunca en sincronía). */
export function respirar(els) {
  const f = els.map(() => Math.random() * 6.283);
  const w = els.map(() => gsap.utils.random(0.35, 0.9));
  const tick = (tt) => els.forEach((e, i) => e.style.setProperty("--vida", Math.sin(tt * w[i] + f[i]).toFixed(3)));
  gsap.ticker.add(tick);
  return { kill: () => gsap.ticker.remove(tick) };
}

/** Algo pasa cada tanto, nunca a ritmo fijo. */
export function eventos(fn, cada = [1.2, 4]) {
  let vivo = true;
  let llamada = null;
  const uno = () => {
    if (!vivo) return;
    fn();
    llamada = gsap.delayedCall(gsap.utils.random(...cada), uno);
  };
  llamada = gsap.delayedCall(gsap.utils.random(0.4, 1.2), uno);
  return { kill: () => { vivo = false; if (llamada) llamada.kill(); } };
}

/** Ángulo vertical de cámara que conserva el encuadre horizontal de 16:9 en pantallas más angostas. */
export function fovPara(fov169, aspecto) {
  if (aspecto >= 16 / 9) return fov169;
  const h = 2 * Math.atan(Math.tan((fov169 * Math.PI) / 360) * (16 / 9));
  return (2 * Math.atan(Math.tan(h / 2) / aspecto) * 180) / Math.PI;
}

/** Junta varias vidas en una sola que se apaga junta. */
export const juntas = (...vidas) => ({ kill: () => vidas.forEach((v) => v && v.kill()) });

/** Posición de un elemento respecto de un ancestro, sin transformaciones (sirve aunque la diapositiva esté en transición). */
export function offsetEn(elemento, ancestro) {
  let x = 0, y = 0, e = elemento;
  while (e && e !== ancestro) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
  return { x, y, w: elemento.offsetWidth, h: elemento.offsetHeight };
}

/** Punto a una fracción del largo de un path SVG. */
export const puntoEn = (path, f) => path.getPointAtLength(path.getTotalLength() * Math.max(0, Math.min(1, f)));

/* Diapositivas que preparan algo antes de entrar (shaders, texturas): el motor espera a que estén. */
const preparativos = new WeakMap();
/** Registra una promesa que la diapositiva tiene que cumplir antes de su transición de entrada. */
export function esperarEn(slide, promesa) {
  if (!preparativos.has(slide)) preparativos.set(slide, []);
  preparativos.get(slide).push(promesa);
}
/** Promesa que se cumple cuando la diapositiva terminó de prepararse (o al vencer el plazo, en ms). */
export function preparada(slide, plazo = 1500) {
  const lista = preparativos.get(slide) || [];
  preparativos.delete(slide);
  if (!lista.length) return null;
  return Promise.race([Promise.all(lista.map((p) => Promise.resolve(p).catch(() => null))), new Promise((r) => setTimeout(r, plazo))]);
}
