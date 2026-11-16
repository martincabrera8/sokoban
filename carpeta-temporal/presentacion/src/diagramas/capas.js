import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { el, s, offsetEn, eventos } from "../util.js";

/*
 * Arquitectura en tres franjas: la vista arriba, el contrato en el medio y la implementación abajo
 * (JuegoSokoban adentro de JuegoConSonido). Paso 1: mover(DERECHA) baja por la fachada hasta el dominio.
 * Paso 2: vuelve la foto EstadoJuego a cada observador. Paso 3: Main arma la cadena en una línea.
 */
const VISTA = ["PantallaJuego", "PanelHUD", "PanelTablero", "MenuPrincipal"];
const CONTRATO = [["Juego", "interface"], ["ObservadorJuego", "interface"], ["EstadoJuego", "record"], ["Direccion", "enum"]];
const METODOS = "mover(d) · deshacer() · reiniciar() · viajarEnElTiempo() · getEstado() · … y los 3 de SujetoJuego";
const PIEZAS = ["EstadoNivel", "MotorMovimiento", "HistorialDeshacer", "MaquinaDelTiempo", "Puntaje", "CargadorNivel"];
const MAIN = [
  ["Juego juego = new ", ["JuegoConSonido", "capas__k-sonido"], "("],
  ["    new ", ["JuegoSokoban", "capas__k-dominio"], "("],
  ["      new CargadorNivel(carpeta)));"],
  ["new ", ["VentanaPrincipal", "capas__k-vista"], "(juego);"],
];

function banda(lienzo, y, h, nombre, dato, extra = "") {
  const b = el("div", "capas__banda pos dim " + extra, lienzo, { vars: { x: 120, y, w: 1680, h } });
  const r = el("div", "capas__rotulo", b);
  el("div", "capas__nombre", r, { texto: nombre });
  el("div", "capas__dato", r, { texto: dato });
  return b;
}

export default {
  montar(lienzo) {
    gsap.registerPlugin(DrawSVGPlugin);
    const c = { lienzo };
    c.bandas = [
      banda(lienzo, 372, 104, "Vista", "sokoban.vista · Luca"),
      banda(lienzo, 540, 150, "Contrato", "lo único del modelo que importa la vista", "capas__banda--contrato"),
      banda(lienzo, 754, 284, "Modelo", "Main elige quién cumple"),
    ];
    const filaV = el("div", "capas__fila pos", lienzo, { vars: { x: 470, y: 396 } });
    c.vista = Object.fromEntries(VISTA.map((n) => [n, el("span", "chip chip--codigo capas__clase", filaV, { texto: n })]));

    const filaC = el("div", "capas__fila pos", lienzo, { vars: { x: 470, y: 562 } });
    c.contrato = Object.fromEntries(CONTRATO.map(([n, tipo]) => {
      const ch = el("span", "chip chip--codigo capas__clase" + (n === "Juego" ? " capas__clase--fachada" : ""), filaC);
      el("span", "", ch, { texto: n });
      el("span", "capas__tipo", ch, { texto: tipo });
      return [n, ch];
    }));
    c.metodos = el("div", "capas__metodos pos", lienzo, { vars: { x: 470, y: 638 }, texto: METODOS });

    // La implementación: el dominio adentro del decorador de sonido
    c.sonido = el("div", "capas__envase capas__envase--sonido pos dim", lienzo, { vars: { x: 470, y: 772, w: 740, h: 250 } });
    const rs = el("div", "capas__envase-rotulo", c.sonido);
    el("b", "", rs, { texto: "JuegoConSonido" });
    el("span", "", rs, { texto: "Decorator · Mora" });
    c.dominio = el("div", "capas__envase capas__envase--dominio pos dim", lienzo, { vars: { x: 496, y: 834, w: 688, h: 174 } });
    const rd = el("div", "capas__envase-rotulo", c.dominio);
    el("b", "", rd, { texto: "JuegoSokoban" });
    el("span", "", rd, { texto: "el dominio · Pedro y Lucía" });
    el("div", "capas__piezas", c.dominio, { texto: PIEZAS.join(" · ") });

    c.main = el("div", "capas__main pos dim", lienzo, { vars: { x: 1240, y: 772, w: 540, h: 250 } });
    el("div", "capas__main-archivo", c.main, { texto: "Main.java" });
    const pre = el("pre", "capas__codigo", c.main);
    c.lineas = MAIN.map((partes) => {
      const l = el("code", "capas__linea", pre);
      partes.forEach((p) => (Array.isArray(p) ? el("span", p[1], l, { texto: p[0] }) : l.appendChild(document.createTextNode(p))));
      return l;
    });

    // Flechas solo en los pasillos entre franjas; los paquetes viajan por ellas
    const svg = s("svg", { class: "svg capas__svg", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    const cx = (e) => { const o = offsetEn(e, lienzo); return o.x + o.w / 2; };
    const xPedido = cx(c.vista.PantallaJuego) - 40, xHud = cx(c.vista.PanelHUD), xTab = cx(c.vista.PanelTablero), xObs = cx(c.contrato.ObservadorJuego);
    const G1 = [476, 540], G2 = [690, 754];
    const flecha = (x, [y0, y1], clase, sube) => s("path", { d: sube ? `M${x} ${y1 - 4} L${x} ${y0 + 8}` : `M${x} ${y0 + 4} L${x} ${y1 - 8}`, class: "capas__ruta " + clase, "marker-end": "url(#capas-punta-" + (clase.includes("estado") ? "e" : "p") + ")" }, svg);
    const defs = s("defs", {}, svg);
    [["p", "capas__punta--pedido"], ["e", "capas__punta--estado"]].forEach(([k, cl]) => {
      const m = s("marker", { id: "capas-punta-" + k, viewBox: "0 0 10 10", refX: 5, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse" }, defs);
      s("path", { d: "M0 0 L10 5 L0 10 z", class: cl }, m);
    });
    c.flechas = {
      baja1: flecha(xPedido, G1, "capas__ruta--pedido"),
      baja2: flecha(xPedido, G2, "capas__ruta--pedido"),
      sube2: flecha(xObs, G2, "capas__ruta--estado", true),
      subeHud: flecha(xHud, G1, "capas__ruta--estado", true),
      subeTab: flecha(xTab, G1, "capas__ruta--estado", true),
    };
    const rot = (x, y, html, clase) => el("div", "capas__etiqueta pos " + clase, lienzo, { vars: { x, y }, html });
    c.etiquetas = {
      mover: rot(xPedido + 18, 491, "mover(DERECHA)", "capas__etiqueta--pedido"),
      delega: rot(xPedido + 18, 705, "lo atraviesa y delega", "capas__etiqueta--pedido"),
      notifica: rot(xObs + 18, 705, "notificarObservadores()", "capas__etiqueta--estado"),
      actualizar: rot(xTab + 22, 491, "actualizar(estado) a cada observador", "capas__etiqueta--estado"),
    };
    c.x = { xPedido, xHud, xTab, xObs, G1, G2 };
    c.pedido = el("div", "capas__paquete pos", lienzo, { texto: "mover(DERECHA)" });
    c.estado = el("div", "capas__paquete capas__paquete--estado pos", lienzo, { texto: "EstadoJuego" });
    c.estado2 = el("div", "capas__paquete capas__paquete--estado pos", lienzo, { texto: "EstadoJuego" });
    return c;
  },

  construir(tl, c) {
    const { xPedido, xHud, xTab, xObs, G1, G2 } = c.x;
    tl.fromTo(c.bandas, { autoAlpha: 0, x: -40 }, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.12, ease: "power3.out" }, 0.3)
      .fromTo([...Object.values(c.vista), ...Object.values(c.contrato)], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.04, ease: "power2.out" }, 0.6)
      .fromTo(c.metodos, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 1)
      .fromTo(c.sonido, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.6)" }, 1)
      .fromTo(c.dominio, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 1.25)
      .fromTo(c.main, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out" }, 1.4)
      .set([c.pedido, c.estado, c.estado2, ...Object.values(c.etiquetas)], { autoAlpha: 0 }, 0)
      .set(Object.values(c.flechas), { drawSVG: "0%" }, 0);

    // Paso 1: el pedido baja por la fachada y atraviesa el decorador hasta el dominio
    tl.addLabel("p1", 2.2);
    tl.set(c.pedido, { autoAlpha: 1, x: xPedido, y: G1[0] - 20, xPercent: -50, yPercent: -50, scale: 0.8 }, "p1")
      .to(c.vista.PantallaJuego, { "--marco": 1, duration: 0.2 }, "p1")
      .to(c.flechas.baja1, { drawSVG: "100%", duration: 0.5, ease: "power1.inOut" }, "p1")
      .to(c.pedido, { y: 600, duration: 0.6, ease: "power1.inOut" }, "p1")
      .to(c.etiquetas.mover, { autoAlpha: 1, duration: 0.3 }, "p1+=0.3")
      .to(c.contrato.Juego, { "--marco": 1, duration: 0.2 }, "p1+=0.6")
      .to(c.flechas.baja2, { drawSVG: "100%", duration: 0.5, ease: "power1.inOut" }, "p1+=0.9")
      .to(c.pedido, { y: 800, duration: 0.5, ease: "power1.inOut" }, "p1+=0.9")
      .to(c.sonido, { "--marco": 1, duration: 0.25 }, "p1+=1.3")
      .to(c.pedido, { y: 880, duration: 0.4, ease: "power1.inOut" }, "p1+=1.45")
      .to(c.dominio, { "--marco": 1, duration: 0.25 }, "p1+=1.75")
      .to(c.etiquetas.delega, { autoAlpha: 1, duration: 0.3 }, "p1+=1.3")
      .to(c.pedido, { autoAlpha: 0, scale: 0.6, duration: 0.3 }, "p1+=1.9")
      .to([c.vista.PantallaJuego, c.contrato.Juego, c.sonido], { "--marco": 0, duration: 0.3 }, "p1+=2.1");

    // Paso 2: vuelve la foto inmutable a cada observador
    tl.addLabel("p2", "p1+=2.6");
    tl.to(c.dominio, { "--marco": 0, duration: 0.3 }, "p2")
      .set([c.estado, c.estado2], { autoAlpha: 1, x: xObs, y: 860, xPercent: -50, yPercent: -50, scale: 0.8 }, "p2")
      .to(c.flechas.sube2, { drawSVG: "100%", duration: 0.5 }, "p2+=0.1")
      .to(c.etiquetas.notifica, { autoAlpha: 1, duration: 0.3 }, "p2+=0.3")
      .to([c.estado, c.estado2], { y: 600, duration: 0.7, ease: "power1.inOut" }, "p2")
      .to(c.contrato.ObservadorJuego, { "--marco": 1, duration: 0.2 }, "p2+=0.6")
      .to(c.estado, { x: xHud, y: 430, duration: 0.6, ease: "power1.inOut" }, "p2+=0.9")
      .to(c.estado2, { x: xTab, y: 430, duration: 0.6, ease: "power1.inOut" }, "p2+=0.9")
      .to([c.flechas.subeHud, c.flechas.subeTab], { drawSVG: "100%", duration: 0.5 }, "p2+=0.9")
      .to([c.vista.PanelHUD, c.vista.PanelTablero], { "--marco": 1, duration: 0.2 }, "p2+=1.4")
      .to([c.estado, c.estado2], { autoAlpha: 0, scale: 0.6, duration: 0.3 }, "p2+=1.5")
      .to(c.etiquetas.actualizar, { autoAlpha: 1, duration: 0.4 }, "p2+=1.4")
      .to(c.contrato.ObservadorJuego, { "--marco": 0, duration: 0.3 }, "p2+=1.9");

    // Paso 3: Main arma la cadena en una sola línea
    tl.addLabel("p3", "p2+=2.4");
    tl.to([c.vista.PanelHUD, c.vista.PanelTablero], { "--marco": 0, duration: 0.3 }, "p3")
      .to(c.main, { "--marco": 1, duration: 0.3 }, "p3")
      .fromTo(c.lineas, { "--resalte": 0 }, { "--resalte": 1, duration: 0.3, stagger: 0.25 }, "p3")
      .to(c.sonido, { "--marco": 1, duration: 0.3 }, "p3+=0.25")
      .to(c.dominio, { "--marco": 1, duration: 0.3 }, "p3+=0.5")
      .to(c.vista.PantallaJuego, { "--marco": 1, duration: 0.3 }, "p3+=0.75")
      .to({}, { duration: 0.6 });
  },

  vida(c) {
    // Cada tanto un pedido corto recorre la fachada: el contrato siempre en uso
    return eventos(() => {
      const ch = c.contrato.Juego;
      gsap.fromTo(ch, { "--brillo-capas": 0 }, { "--brillo-capas": 1, duration: 0.4, yoyo: true, repeat: 1, ease: "sine.inOut" });
    }, [2.5, 5]);
  },
};
