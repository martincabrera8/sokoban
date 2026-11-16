import { gsap } from "gsap";
import { el, s } from "../util.js";

/*
 * El diagrama de clases real (docs/uml/2-diagrama-completo.svg, lo embebe build.py) como SVG vectorial en la página:
 * la cámara es el viewBox, así el texto queda nítido a cualquier zoom. Se recorre patrón por patrón: cada paso
 * enciende las clases del patrón y sus flechas, apaga el resto y encuadra una o dos tomas legibles.
 * Las clases se buscan por id (g.caja#Nombre) o por su texto, así el plano puede cambiar sin tocar este archivo.
 */
const PATRONES = [
  { nombre: "MVC y Facade", clases: ["VentanaPrincipal", "PantallaJuego", "PanelHUD", "PanelTablero", "Juego", "EstadoJuego", "ObservadorJuego", "Direccion", "JuegoSokoban"],
    tomas: [["PantallaJuego", "Juego"], ["Juego", "EstadoJuego", "ObservadorJuego", "Direccion"]],
    porque: "La vista solo conoce la fachada Juego y recibe un EstadoJuego inmutable: el dominio y el sonido entraron sin tocar la vista." },
  { nombre: "Observer", clases: ["Juego", "ObservadorJuego", "EstadoJuego", "PanelHUD", "PanelTablero"],
    tomas: [["Juego", "ObservadorJuego", "EstadoJuego"], ["ObservadorJuego", "PanelHUD", "PanelTablero"]],
    porque: "Después de cada cambio, el juego le manda la foto a cada observador: el HUD y el tablero se redibujan solos." },
  { nombre: "Singleton", clases: ["Imagenes", "Assets", "Sonidos", "Sonido"],
    tomas: [["Imagenes", "Assets"], ["Sonidos", "Sonido"]],
    porque: "Cada imagen y cada sonido se cargan una sola vez: todo el juego usa la misma instancia, con obtenerInstancia()." },
  { nombre: "Strategy", clases: ["Caja", "ComportamientoCaja", "CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"],
    tomas: [["Caja", "ComportamientoCaja", "CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"]],
    porque: "Lo único que cambia entre cajas es qué pasa al empujarlas: un tipo nuevo de caja es una estrategia nueva." },
  { nombre: "Mediator", clases: ["MediadorMovimiento", "MotorMovimiento", "Jugador", "Caja", "EstadoNivel"],
    tomas: [["MotorMovimiento", "MediadorMovimiento", "Jugador", "Caja"]],
    porque: "El jugador y las cajas no se conocen: el motor resuelve choques, empujes, hielo y efectos en un solo lugar." },
  { nombre: "Decorator", clases: ["Juego", "JuegoDecorado", "JuegoConSonido"],
    tomas: [["Juego", "JuegoDecorado"], ["JuegoDecorado", "JuegoConSonido"]],
    porque: "El sonido se suma envolviendo al juego sin cambiarlo; un observador no se enteraría de un choque contra la pared." },
  { nombre: "State", clases: ["Sonidos", "EstadoSonido", "SonidoActivado", "SonidoSilenciado"],
    tomas: [["Sonidos", "EstadoSonido", "SonidoActivado", "SonidoSilenciado"]],
    porque: "Con la tecla M cada estado decide a cuál pasa: reproducir no necesita preguntar si hay silencio." },
  { nombre: "Memento", clases: ["JuegoSokoban", "RecuerdoNivel", "MaquinaDelTiempo"],
    tomas: [["JuegoSokoban", "RecuerdoNivel"], ["RecuerdoNivel", "MaquinaDelTiempo"]],
    porque: "Un recuerdo del nivel entero devuelve todo (caja rota, muros, plutonio) sin lógica inversa: deshacer y DeLorean." },
  { nombre: "Command", clases: ["Comando", "ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo", "GrabadoraDePartida", "Repeticion", "PantallaJuego"],
    tomas: [["GrabadoraDePartida", "Comando", "Repeticion", "ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"]],
    porque: "Cada acción es un objeto: se ejecuta, se anota y se vuelve a ejecutar para ver la repetición." },
];
const MARCO = { x: 620, y: 40, w: 1260, h: 1000 };   // el plano, en px del escenario
const ZOOM_MAX = 2.2;                                  // px de pantalla por unidad del SVG, como mucho
const APAGADO = 0.13;

/** La caja de una clase en el SVG: por id o, si no, por el texto con su nombre. */
function buscar(svg, nombre) {
  const porId = svg.querySelector(`[id="${nombre}"]`);
  if (porId) return porId;
  const texto = [...svg.querySelectorAll("text")].find((t) => t.textContent.replace(/«[^»]*»/g, "").trim() === nombre);
  if (!texto) return null;
  const g = texto.closest("g");
  return g && g !== svg ? g : texto;
}

/** Rectángulo de un elemento en las coordenadas del viewBox (respeta transformaciones). */
function rect(svg, e) {
  const b = e.getBBox();
  const m = svg.getScreenCTM().inverse().multiply(e.getScreenCTM());
  const pts = [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].map(([x, y]) => {
    const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(m);
  });
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}
const dentro = (p, r, m = 8) => p.x >= r.x - m && p.x <= r.x + r.w + m && p.y >= r.y - m && p.y <= r.y + r.h + m;

/** Encuadre de varias cajas con aire, en la proporción del marco y sin pasar el zoom máximo. */
function encuadre(rs, vb) {
  if (!rs.length) return { ...vb };
  let x0 = Math.min(...rs.map((r) => r.x)) - 40, y0 = Math.min(...rs.map((r) => r.y)) - 40;
  let w = Math.max(...rs.map((r) => r.x + r.w)) + 40 - x0, h = Math.max(...rs.map((r) => r.y + r.h)) + 40 - y0;
  const asp = MARCO.w / MARCO.h;
  const minW = MARCO.w / ZOOM_MAX;
  if (w < minW) { x0 -= (minW - w) / 2; w = minW; }
  if (w / h > asp) { const nh = w / asp; y0 -= (nh - h) / 2; h = nh; } else { const nw = h * asp; x0 -= (nw - w) / 2; w = nw; }
  return { x: x0, y: y0, w, h };
}

/** Extremos de un path ("M x y … x y"). */
function extremos(d) {
  const n = (d.match(/-?[\d.]+/g) || []).map(Number);
  return n.length >= 4 ? [{ x: n[0], y: n[1] }, { x: n[n.length - 2], y: n[n.length - 1] }] : null;
}

export default {
  montar(lienzo) {
    const c = {};
    c.marco = el("div", "plano plano__marco pos dim", lienzo, { vars: { x: MARCO.x, y: MARCO.y, w: MARCO.w, h: MARCO.h } });
    const doc = new DOMParser().parseFromString(window.UML || "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'/>", "image/svg+xml");
    const svg = document.importNode(doc.documentElement, true);
    const vb = (svg.getAttribute("viewBox") || "0 0 10 10").split(/[\s,]+/).map(Number);
    c.vb = { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };
    ["width", "height"].forEach((k) => svg.removeAttribute(k));
    svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Diagrama de clases completo del Sokoban");
    svg.classList.add("plano__svg");
    c.marco.appendChild(svg);
    c.svg = svg;
    c.todo = encuadre([{ x: c.vb.x + 40, y: c.vb.y + 40, w: c.vb.w - 80, h: c.vb.h - 80 }], c.vb);
    c.cam = { ...c.todo };
    c.aplicar = () => svg.setAttribute("viewBox", `${c.cam.x} ${c.cam.y} ${c.cam.w} ${c.cam.h}`);
    c.aplicar();

    // Todo lo dibujado (menos el fondo) se puede apagar; cada patrón enciende sus clases, sus flechas y sus puntas
    const fondo = svg.querySelector(":scope > rect");
    c.piezas = [...svg.children].filter((e) => e !== fondo && !["style", "defs"].includes(e.tagName));
    const medidas = new Map(c.piezas.map((e) => [e, rect(svg, e)]));
    const capa = s("g", { class: "plano__luces" }, svg);
    c.patrones = PATRONES.map((p) => {
      const cajas = p.clases.map((n) => buscar(svg, n)).filter(Boolean);
      const rs = cajas.map((k) => rect(svg, k));
      const toca = (pt) => rs.some((r) => dentro(pt, r));
      const flechas = c.piezas.filter((e) => e.tagName === "path" && e.getAttribute("fill") === "none").filter((e) => {
        const x = extremos(e.getAttribute("d") || "");
        return x && toca(x[0]) && toca(x[1]);
      });
      const puntas = flechas.flatMap((f) => extremos(f.getAttribute("d")));
      const marcas = c.piezas.filter((e) => {
        const r = medidas.get(e);
        if (!["polygon", "polyline", "line"].includes(e.tagName) || r.w > 30 || r.h > 30) return false;
        const centro = { x: r.x + r.w / 2, y: r.y + r.h / 2 };
        return puntas.some((q) => Math.hypot(q.x - centro.x, q.y - centro.y) < 18);
      });
      const encendidas = new Set([...cajas, ...flechas, ...marcas]);
      const luces = rs.map((r) => s("rect", { x: r.x - 7, y: r.y - 7, width: r.w + 14, height: r.h + 14, rx: 10, class: "plano__luz" }, capa));
      const tomas = p.tomas.map((t) => encuadre(t.map((n) => buscar(svg, n)).filter(Boolean).map((k) => rect(svg, k)), c.vb));
      return { ...p, cajas, encendidas, luces, tomas };
    });

    // Lista de patrones y la ficha del que está en foco
    c.lista = el("ol", "plano__lista pos dim", lienzo, { vars: { x: 120, y: 318, w: 440 } });
    c.items = PATRONES.map((p) => el("li", "plano__item", c.lista, { texto: p.nombre }));
    const fichas = el("div", "plano__fichas pos dim", lienzo, { vars: { x: 120, y: 636, w: 460 } });
    c.fichas = c.patrones.map((p) => {
      const f = el("div", "plano__ficha", fichas);
      el("p", "plano__ficha-nombre", f, { texto: p.nombre });
      el("p", "plano__ficha-clases", f, { texto: p.clases.filter((n) => buscar(svg, n)).join(", ") });
      el("p", "plano__ficha-porque", f, { texto: p.porque });
      return f;
    });
    if (!window.UML) el("p", "plano__falta pos", lienzo, { vars: { x: MARCO.x + 60, y: 500 }, texto: "Falta el diagrama: build.py lo toma de docs/uml/2-diagrama-completo.svg" });
    return c;
  },

  construir(tl, c) {
    const cam = (destino, en, d) => tl.to(c.cam, { ...destino, duration: d, ease: "power2.inOut", onUpdate: c.aplicar }, en);
    tl.fromTo(c.marco, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.2)
      .fromTo(c.items, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.05, ease: "power3.out" }, 0.5)
      .set(c.patrones.flatMap((p) => p.luces), { autoAlpha: 0 }, 0)
      .set(c.piezas, { opacity: 1 }, 0)
      .set(c.fichas, { autoAlpha: 0 }, 0)
      .set(c.cam, { ...c.todo, onUpdate: c.aplicar, onComplete: c.aplicar }, 0);

    // Un paso por patrón: se enciende lo suyo, se apaga el resto y la cámara pasa por sus tomas
    c.patrones.forEach((p, i) => {
      const etiqueta = "p" + (i + 1);
      tl.addLabel(etiqueta, i === 0 ? 1.6 : `p${i}+=${1.2 + c.patrones[i - 1].tomas.length * 1.4}`);
      const en = tl.labels[etiqueta];
      tl.to(c.fichas, { autoAlpha: 0, x: -12, duration: 0.2 }, en)
        .to(c.items, { "--marco": 0, opacity: 0.5, duration: 0.3 }, en)
        .to(c.items[i], { "--marco": 1, opacity: 1, duration: 0.3 }, en)
        .to(c.patrones.flatMap((o) => o.luces), { autoAlpha: 0, duration: 0.25 }, en)
        .to(c.piezas, { opacity: (j, e) => (p.encendidas.has(e) ? 1 : APAGADO), duration: 0.5 }, en)
        .to(c.fichas[i], { autoAlpha: 1, x: 0, duration: 0.4, ease: "power2.out" }, en + 0.25)
        .to(p.luces, { autoAlpha: 1, duration: 0.4, stagger: 0.04 }, en + 0.9);
      p.tomas.forEach((toma, j) => cam(toma, en + j * 1.6, 1.2));
    });

    // Final: el plano entero, todo encendido
    const n = c.patrones.length;
    tl.addLabel("p" + (n + 1), `p${n}+=${1.2 + c.patrones[n - 1].tomas.length * 1.4}`);
    const fin = tl.labels["p" + (n + 1)];
    tl.to(c.items, { "--marco": 0, opacity: 1, duration: 0.3 }, fin)
      .to(c.fichas, { autoAlpha: 0, duration: 0.3 }, fin)
      .to(c.patrones.flatMap((o) => o.luces), { autoAlpha: 0, duration: 0.3 }, fin)
      .to(c.piezas, { opacity: 1, duration: 0.5 }, fin);
    cam(c.todo, fin, 1.4);
  },
};
