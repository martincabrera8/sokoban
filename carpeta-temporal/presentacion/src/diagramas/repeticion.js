import { gsap } from "gsap";
import { el, pixel, esperarEn, juntas, respirar } from "../util.js";
import { crearVideo, fragmento } from "../videoteca.js";
import { VIDEO_MOMENTOS } from "../datos-corta.js";

/*
 * Repetición y Command. Cada tecla se vuelve un objeto: el cliente (PantallaJuego) lo crea, el invocador
 * (GrabadoraDePartida) lo ejecuta contra el receptor (Juego) y lo anota en la cinta. Paso 1: se juega y se graba.
 * Paso 2: Repeticion vuelve a ejecutar la cinta. Paso 3: lo que no se graba y la diferencia con Memento.
 */
const COMANDOS = [
  { tecla: "ui/arrow_right", texto: "Mover →", llamada: "mover(DERECHA)" },
  { tecla: "ui/arrow_right", texto: "Mover →", llamada: "mover(DERECHA)" },
  { tecla: "ui/arrow_up", texto: "Mover ↑", llamada: "mover(ARRIBA)" },
  { tecla: "ui/boton_undo", texto: "Deshacer", llamada: "deshacer()" },
  { tecla: "ui/boton_delorean", texto: "Viajar", llamada: "viajarEnElTiempo()" },
];

function tarjeta(lienzo, x, w, rol, nombre, codigo, clase = "") {
  const t = el("div", "cmd__rol pos dim " + clase, lienzo, { vars: { x, y: 528, w } });
  el("div", "mem__rotulo", t, { texto: rol });
  el("div", "mem__nombre", t, { texto: nombre });
  codigo.forEach((l) => el("code", "mem__linea", t, { texto: l }));
  return t;
}

export default {
  montar(lienzo, { slide }) {
    const c = {};
    const marco = el("figure", "clip pos dim", lienzo, { vars: { x: 1240, y: 84, w: 560, h: 350 } });
    const v = crearVideo(marco, "clip__video", "Fragmento del video: Ver repetición vuelve a jugar el nivel con los comandos grabados", { mudo: true, desde: VIDEO_MOMENTOS.repeticion.desde });
    esperarEn(slide, v.listo);
    c.video = v.video;
    c.marco = marco;
    c.pie = el("figcaption", "clip__pie pos dim", lienzo, { vars: { x: 1240, y: 448, w: 560 }, texto: VIDEO_MOMENTOS.repeticion.texto });

    c.tecla = el("div", "cmd__tecla pos", lienzo, { vars: { x: 120, y: 556 } });
    c.teclas = COMANDOS.map((k) => pixel(k.tecla, c.tecla, ""));
    el("div", "cmd__tecla-pie", c.tecla, { texto: "tecla" });
    c.cliente = tarjeta(lienzo, 270, 420, "Cliente", "PantallaJuego", ["new ComandoMover(juego, d)", "grabadora.ejecutar(c)"]);
    c.invocador = tarjeta(lienzo, 740, 470, "Invocador", "GrabadoraDePartida", ["c.ejecutar();", "grabados.add(c);"], "cmd__rol--inv");
    c.receptor = tarjeta(lienzo, 1260, 540, "Receptor", "Juego", ["", ""], "cmd__rol--rec");
    c.llamada = c.receptor.querySelectorAll(".mem__linea")[0];
    c.llamada.classList.add("cmd__llamada");
    c.receptor.querySelectorAll(".mem__linea")[1].textContent = "no sabe quién lo llamó";

    // La cinta: la partida como lista de comandos
    c.cinta = el("div", "cmd__cinta pos dim", lienzo, { vars: { x: 270, y: 770, w: 1530, h: 100 } });
    el("code", "cmd__cinta-nombre", c.cinta, { texto: "grabados" });
    c.huecos = COMANDOS.map((k) => el("span", "cmd__comando", c.cinta, { texto: k.texto }));
    el("code", "cmd__cinta-tipo", c.cinta, { texto: "List<Comando>" });
    c.cabezal = el("i", "cmd__cabezal", c.cinta);
    c.volando = el("div", "cmd__comando cmd__comando--vuela pos", lienzo);

    c.repe = el("div", "cmd__repe pos dim", lienzo, { vars: { x: 270, y: 912, w: 920 } });
    el("b", "", c.repe, { texto: "Repeticion" });
    c.repe.appendChild(document.createTextNode(" reinicia el nivel y vuelve a ejecutar la lista cada 160 ms."));
    c.igual = el("span", "cmd__igual", c.repe, { texto: " Termina igual: no hay azar." });
    c.cita = el("div", "cmd__cita pos dim", lienzo, { vars: { x: 1260, y: 908, w: 540 } });
    el("p", "", c.cita, { texto: "Reiniciar no se graba: borra la grabación." });
    el("p", "cmd__cita-fuerte", c.cita, { texto: "Command guarda acciones; Memento guarda el estado." });
    return c;
  },

  construir(tl, c) {
    tl.fromTo(c.marco, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.8, ease: "power3.out" }, 0.2)
      .fromTo(c.pie, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.7)
      .fromTo([c.tecla, c.cliente, c.invocador, c.receptor], { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power3.out" }, 0.5)
      .fromTo(c.cinta, { autoAlpha: 0, scaleX: 0.9 }, { autoAlpha: 1, scaleX: 1, duration: 0.6, ease: "power3.out" }, 1)
      .set(c.huecos, { autoAlpha: 0 }, 0)
      .set([c.volando, c.cabezal, c.repe, c.cita, c.igual], { autoAlpha: 0 }, 0)
      .set(c.teclas, { autoAlpha: 0 }, 0)
      .set(c.teclas[0], { autoAlpha: 1 }, 0)
      .set(c.llamada, { textContent: "mover(d) · deshacer() · …" }, 0);

    // Paso 1: cada tecla se vuelve un comando que se ejecuta y se anota
    tl.addLabel("p1", 1.8);
    const C = { x: 480, y: 640 }, I = { x: 975, y: 640 };
    COMANDOS.forEach((k, i) => {
      const rapido = i >= 2;
      const d = rapido ? 0.5 : 1;
      const en = tl.labels.p1 + (i < 2 ? i * 2 : 4 + (i - 2) * 1.1);
      const hueco = c.huecos[i];
      tl.set(c.teclas, { autoAlpha: 0 }, en).set(c.teclas[i], { autoAlpha: 1 }, en)
        .fromTo(c.tecla, { scale: 1 }, { scale: 0.86, duration: 0.1, yoyo: true, repeat: 1, immediateRender: false }, en)
        .set(c.volando, { autoAlpha: 1, x: C.x, y: C.y, xPercent: -50, yPercent: -50, textContent: k.texto, scale: 0.7 }, en + 0.15)
        .to(c.volando, { scale: 1, duration: 0.2 }, en + 0.15)
        .to(c.volando, { x: I.x, y: I.y, duration: 0.4 * d, ease: "power2.inOut" }, en + 0.3)
        .set(c.llamada, { textContent: k.llamada }, en + 0.3 + 0.4 * d)
        .fromTo(c.receptor, { "--marco": 0 }, { "--marco": 1, duration: 0.15, yoyo: true, repeat: 1, immediateRender: false }, en + 0.3 + 0.4 * d)
        .to(c.volando, { x: () => 270 + hueco.offsetLeft + hueco.offsetWidth / 2, y: 820, duration: 0.4 * d, ease: "power2.in" }, en + 0.4 + 0.4 * d)
        .set(c.volando, { autoAlpha: 0 }, en + 0.4 + 0.8 * d)
        .fromTo(hueco, { autoAlpha: 0, scale: 1.3 }, { autoAlpha: 1, scale: 1, duration: 0.25, immediateRender: false }, en + 0.4 + 0.8 * d);
    });

    // Paso 2: la repetición vuelve a ejecutar la cinta
    tl.addLabel("p2", "p1+=7.6");
    const p2 = tl.labels.p2;
    tl.fromTo(c.repe, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4, immediateRender: false }, p2)
      .set(c.cabezal, { autoAlpha: 1, x: 0 }, p2 + 0.3);
    c.huecos.forEach((h, i) => {
      const en = p2 + 0.4 + i * 0.5;
      tl.to(c.cabezal, { x: () => h.offsetLeft - 12, duration: 0.2, ease: "power1.inOut" }, en)
        .fromTo(h, { "--marco": 0 }, { "--marco": 1, duration: 0.12, yoyo: true, repeat: 1, immediateRender: false }, en + 0.2)
        .set(c.llamada, { textContent: COMANDOS[i].llamada }, en + 0.2)
        .fromTo(c.receptor, { "--marco": 0 }, { "--marco": 1, duration: 0.12, yoyo: true, repeat: 1, immediateRender: false }, en + 0.2);
    });
    tl.fromTo(c.igual, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, immediateRender: false }, p2 + 3.1);

    // Paso 3: lo que no se graba y la diferencia con Memento
    tl.addLabel("p3", "p2+=3.8");
    tl.fromTo(c.cita, { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, "p3")
      .to({}, { duration: 0.3 });
  },

  vida(c) {
    return juntas(fragmento(c.video, { desde: VIDEO_MOMENTOS.repeticion.desde, hasta: VIDEO_MOMENTOS.repeticion.hasta }), respirar([c.invocador]));
  },

  desmontar(c) {
    c.video.pause();
    c.video.removeAttribute("src");
    c.video.load();
  },
};
