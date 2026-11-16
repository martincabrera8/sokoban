import { gsap } from "gsap";
import { el, esperarEn } from "../util.js";
import { crearVideo } from "../videoteca.js";

/*
 * El juego: el video de gameplay a pantalla completa, con su sonido y sus subtítulos.
 * Arranca solo al entrar (la tecla que trajo hasta acá habilita el sonido). Z lo pausa junto con todo.
 * Si se vuelve a esta diapositiva, sigue desde donde quedó; si había terminado, empieza de nuevo.
 */
let quedo = 0;

function reproducir(c) {
  const { video } = c;
  c.pedido = true;
  video.muted = false;
  video.play().catch(() => {
    // Sin un gesto previo el navegador no deja sonar: arranca mudo y el sonido vuelve con la próxima tecla o clic.
    video.muted = true;
    video.play().catch(() => { c.bloqueado = true; });
    const activar = () => { video.muted = false; if (video.paused) video.play().catch(() => {}); c.bloqueado = false; };
    addEventListener("keydown", activar, { once: true });
    addEventListener("pointerdown", activar, { once: true });
    c.quitarActivar = () => { removeEventListener("keydown", activar); removeEventListener("pointerdown", activar); };
  });
}

export default {
  montar(lienzo, { slide }) {
    const marco = el("div", "video__marco", lienzo);
    const { video, listo } = crearVideo(marco, "video__pantalla", "Video de gameplay del Sokoban: cómo jugar, los tres niveles, el DeLorean, la repetición, la tecla M y los resultados");
    esperarEn(slide, listo);
    const c = { marco, video, pedido: false, bloqueado: false, quitarActivar: null };
    listo.then(() => { if (quedo > 0 && video.duration && quedo < video.duration - 1) video.currentTime = quedo; });
    c.arranque = gsap.delayedCall(0.25, () => reproducir(c));
    // La tecla Z pausa todas las animaciones: el video la sigue.
    c.sincronia = () => {
      if (!c.pedido || c.bloqueado || video.ended) return;
      const pausado = gsap.globalTimeline.paused();
      if (pausado && !video.paused) video.pause();
      else if (!pausado && video.paused) video.play().catch(() => {});
    };
    gsap.ticker.add(c.sincronia);
    return c;
  },

  construir(tl, c) {
    tl.fromTo(c.marco, { scale: 1.06, autoAlpha: 0.4 }, { scale: 1, autoAlpha: 1, duration: 1.1, ease: "power3.out", clearProps: "transform" }, 0);
  },

  desmontar(c) {
    c.arranque.kill();
    gsap.ticker.remove(c.sincronia);
    if (c.quitarActivar) c.quitarActivar();
    quedo = c.video.ended ? 0 : c.video.currentTime || 0;
    c.video.pause();
    c.video.removeAttribute("src");
    c.video.load();
  },
};
