import { gsap } from "gsap";
import { el } from "./util.js";

/* El video de gameplay viaja dentro del HTML (base64, lo pone build.py en window.VIDEO).
   La primera vez se convierte en un blob: el navegador lo lee como un archivo y puede saltar a cualquier segundo. */
let url = null;

function urlDelVideo() {
  if (url !== null) return url;
  const datos = window.VIDEO || "";
  if (!datos) { url = ""; return url; }
  try {
    const binario = atob(datos.slice(datos.indexOf(",") + 1));
    const bytes = new Uint8Array(binario.length);
    for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
    url = URL.createObjectURL(new Blob([bytes], { type: "video/mp4" }));
    window.VIDEO = ""; // el texto base64 ya no hace falta: libera memoria
  } catch (err) {
    url = datos; // sin Blob: el data: también se reproduce, solo que más lento al saltar
  }
  return url;
}

/** Crea un <video> sin controles visibles. Promesa "listo": se cumple con el primer cuadro (o al fallar). */
export function crearVideo(padre, clases, descripcion, { mudo = false, desde = 0 } = {}) {
  const video = el("video", clases, padre, { playsinline: "", preload: "auto", "aria-label": descripcion });
  video.muted = mudo;
  video.defaultMuted = mudo;
  // Con "desde", el primer cuadro que se ve ya es el del momento elegido.
  const listo = new Promise((ok) => {
    video.addEventListener(desde ? "seeked" : "loadeddata", ok, { once: true });
    video.addEventListener("error", ok, { once: true });
  });
  if (desde) video.addEventListener("loadedmetadata", () => { video.currentTime = desde; }, { once: true });
  video.src = urlDelVideo();
  return { video, listo };
}

/** Fragmento del video en bucle, mudo, entre dos segundos. Sigue la pausa global (tecla Z). */
export function fragmento(video, { desde, hasta }) {
  let vivo = true;
  const ir = () => { try { video.currentTime = desde; } catch (err) { /* todavía sin datos */ } };
  video.addEventListener("loadedmetadata", ir, { once: true });
  if (video.readyState >= 1) ir();
  const tick = () => {
    if (!vivo) return;
    if (video.currentTime >= hasta || video.ended) ir();
    const pausado = gsap.globalTimeline.paused();
    if (pausado && !video.paused) video.pause();
    else if (!pausado && video.paused) video.play().catch(() => {});
  };
  gsap.ticker.add(tick);
  return { kill: () => { vivo = false; gsap.ticker.remove(tick); video.pause(); video.removeAttribute("src"); video.load(); } };
}
