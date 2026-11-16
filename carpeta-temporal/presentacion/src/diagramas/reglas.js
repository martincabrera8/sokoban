import { gsap } from "gsap";
import { el, s, pixel, respirar } from "../util.js";

/*
 * Strategy y Mediator en un solo dibujo. A la izquierda, los colegas (Jugador y Caja) que no se conocen y
 * el motor en el medio, que es el único que toca el tablero (EstadoNivel). A la derecha, la estrategia de
 * cada caja. Paso 1: caja normal. Paso 2: la frágil se rompe. Paso 3: la llave abre los muros.
 */
const P = { jugador: { x: 250, y: 470 }, caja: { x: 890, y: 470 }, motor: { x: 570, y: 668 }, estado: { x: 570, y: 900 } };
const ESTRATEGIAS = [
  { k: "normal", clase: "CajaNormalStrategy", efecto: "No hace nada.", imgs: ["boxes/box_wood"] },
  { k: "fragil", clase: "CajaFragilStrategy", efecto: "Pierde 1 de resistencia por empuje. Sin resistencia avisa cajaRota(caja).", imgs: ["boxes/caja_fragil_intacta", "boxes/caja_fragil_danada", "boxes/caja_fragil_rota"] },
  { k: "llave", clase: "CajaLlaveStrategy", efecto: "Avisa llaveEmpujada(caja). Sobre el cerrojo, el motor abre los muros.", imgs: ["boxes/caja_llave", "tiles/cerrojo_cerrado", "tiles/muro_abierto"] },
];

function nodo(lienzo, p, img, nombre, rol, clase = "") {
  const n = el("div", "reglas__nodo pos " + clase, lienzo, { vars: { x: p.x, y: p.y } });
  const caja = el("div", "reglas__sprite", n);
  const imgs = [].concat(img).map((k) => pixel(k, caja, ""));
  el("div", "reglas__nombre", n, { texto: nombre });
  el("div", "reglas__rol", n, { texto: rol });
  return { n, imgs, caja };
}

export default {
  montar(lienzo) {
    const c = {};
    const svg = s("svg", { class: "svg", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    const flecha = (a, b, clase = "") => s("path", { d: `M${a.x} ${a.y} L${b.x} ${b.y}`, class: "reglas__via " + clase }, svg);
    c.vias = {
      jm: flecha({ x: 318, y: 456 }, { x: 440, y: 606 }),
      mc: flecha({ x: 700, y: 606 }, { x: 822, y: 456 }),
      me: flecha({ x: 570, y: 726 }, { x: 570, y: 846 }),
    };
    c.jugador = nodo(lienzo, P.jugador, "characters/player_right", "Jugador", "colega");
    c.caja = nodo(lienzo, P.caja, ["boxes/box_wood", "boxes/caja_fragil_intacta", "boxes/caja_fragil_danada", "boxes/caja_fragil_rota", "boxes/caja_llave"], "Caja", "colega");
    c.motor = el("div", "reglas__motor pos", lienzo, { vars: { x: P.motor.x, y: P.motor.y } });
    el("b", "", c.motor, { texto: "MotorMovimiento" });
    el("span", "", c.motor, { texto: "Mediator · resuelve paredes, empujes y hielo" });

    // El tablero: solo lo cambia el motor
    c.estado = el("div", "reglas__estado pos", lienzo, { vars: { x: P.estado.x, y: P.estado.y } });
    const tira = el("div", "reglas__tira pixel", c.estado);
    c.tiles = {
      cerrojo: [pixel("tiles/cerrojo_cerrado", tira, ""), pixel("tiles/cerrojo_abierto", tira, "")],
      piso: pixel("tiles/floor_1985", tira, ""),
      muro1: [pixel("tiles/muro_cerrado", tira, ""), pixel("tiles/muro_abierto", tira, "")],
      muro2: [pixel("tiles/muro_cerrado", tira, ""), pixel("tiles/muro_abierto", tira, "")],
    };
    el("div", "reglas__nombre", c.estado, { html: "EstadoNivel <span>el tablero</span>" });

    // Mensajes que viajan por las vías
    const msg = (texto, clase = "") => el("div", "reglas__msg pos " + clase, lienzo, { texto });
    c.msgs = { intentar: msg("intentarMover(d)"), empujar: msg("despuesDeEmpujar()"), rota: msg("cajaRota(caja)", "reglas__msg--aviso"), llave: msg("llaveEmpujada(caja)", "reglas__msg--aviso"),
      quitar: msg("quitarCaja(caja)", "reglas__msg--aviso"), abrir: msg("abrirMuros()", "reglas__msg--aviso") };

    // Strategy: una fila por estrategia, con su efecto dibujado
    const panel = c.panel = el("div", "reglas__panel pos dim", lienzo, { vars: { x: 1090, y: 386, w: 710 } });
    const cab = el("div", "reglas__panel-cab", panel);
    el("span", "", cab, { texto: "interface " });
    el("b", "", cab, { texto: "ComportamientoCaja" });
    el("code", "reglas__firma", panel, { texto: "despuesDeEmpujar(caja, mediador)" });
    c.filas = Object.fromEntries(ESTRATEGIAS.map((e) => {
      const f = el("div", "reglas__fila reglas__fila--" + e.k, panel);
      const tira2 = el("div", "reglas__mini", f);
      e.imgs.forEach((k, i) => { if (i) el("span", "reglas__paso", tira2, { texto: "→" }); pixel(k, tira2, ""); });
      const txt = el("div", "reglas__txt", f);
      el("code", "reglas__clase", txt, { texto: e.clase });
      el("div", "reglas__efecto", txt, { texto: e.efecto });
      return [e.k, f];
    }));
    return c;
  },

  construir(tl, c) {
    const [normal, intacta, danada, rota, llave] = c.caja.imgs;
    tl.set(c.caja.imgs, { autoAlpha: 0 }, 0).set(normal, { autoAlpha: 1 }, 0)
      .set(Object.values(c.msgs), { autoAlpha: 0, xPercent: -50, yPercent: -50 }, 0)
      .set([c.tiles.cerrojo[1], c.tiles.muro1[1], c.tiles.muro2[1]], { autoAlpha: 0 }, 0)
      .fromTo([c.jugador.n, c.caja.n], { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power3.out" }, 0.3)
      .fromTo(c.motor, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)" }, 0.55)
      .fromTo(Object.values(c.vias), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.8)
      .fromTo(c.estado, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 0.9)
      .fromTo(c.panel, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out" }, 0.7)
      ;

    // Un mensaje viaja de a hacia b
    const viaje = (m, a, b, en, d = 0.6) => tl.set(m, { autoAlpha: 1, x: a.x, y: a.y }, en).to(m, { x: b.x, y: b.y, duration: d, ease: "power1.inOut" }, en).to(m, { autoAlpha: 0, duration: 0.25 }, en + d + 0.35);
    const J = { x: 330, y: 470 }, M = { x: 570, y: 625 }, C = { x: 810, y: 470 }, E = { x: 570, y: 800 };
    const foco = (k, en) => tl.to(Object.values(c.filas), { autoAlpha: 0.35, "--marco": 0, duration: 0.3 }, en).to(c.filas[k], { autoAlpha: 1, "--marco": 1, duration: 0.3 }, en);
    const empujon = (en) => tl.to(c.caja.caja, { x: 18, duration: 0.14, yoyo: true, repeat: 1, ease: "power2.out" }, en);

    // Paso 1: caja normal. El jugador le pide al motor; el motor mueve la caja
    tl.addLabel("p1", 1.8);
    foco("normal", "p1");
    viaje(c.msgs.intentar, J, M, tl.labels.p1);
    viaje(c.msgs.empujar, M, C, tl.labels.p1 + 0.8);
    empujon(tl.labels.p1 + 1.4);

    // Paso 2: frágil. Dos empujes la dañan, el tercero la rompe y avisa al motor
    tl.addLabel("p2", "p1+=2.4");
    const p2 = tl.labels.p2;
    foco("fragil", p2);
    tl.set(c.caja.imgs, { autoAlpha: 0 }, p2).set(intacta, { autoAlpha: 1 }, p2);
    viaje(c.msgs.intentar, J, M, p2 + 0.2, 0.45);
    empujon(p2 + 0.75);
    tl.set(intacta, { autoAlpha: 0 }, p2 + 0.9).set(danada, { autoAlpha: 1 }, p2 + 0.9);
    empujon(p2 + 1.3);
    tl.set(danada, { autoAlpha: 0 }, p2 + 1.45).set(rota, { autoAlpha: 1 }, p2 + 1.45)
      .fromTo(c.caja.caja, { rotation: 0 }, { rotation: 8, duration: 0.08, yoyo: true, repeat: 3, immediateRender: false }, p2 + 1.45);
    viaje(c.msgs.rota, C, M, p2 + 1.6);
    viaje(c.msgs.quitar, M, E, p2 + 2.3);
    tl.to(rota, { autoAlpha: 0.15, duration: 0.4 }, p2 + 2.6);

    // Paso 3: llave. Sobre el cerrojo, el motor abre los muros
    tl.addLabel("p3", "p2+=3.4");
    const p3 = tl.labels.p3;
    foco("llave", p3);
    tl.set(c.caja.imgs, { autoAlpha: 0 }, p3).set(llave, { autoAlpha: 1 }, p3);
    viaje(c.msgs.intentar, J, M, p3 + 0.2, 0.45);
    empujon(p3 + 0.75);
    viaje(c.msgs.llave, C, M, p3 + 1);
    viaje(c.msgs.abrir, M, E, p3 + 1.7);
    tl.set(c.tiles.cerrojo[0], { autoAlpha: 0 }, p3 + 2.3).set(c.tiles.cerrojo[1], { autoAlpha: 1 }, p3 + 2.3)
      .set([c.tiles.muro1[0], c.tiles.muro2[0]], { autoAlpha: 0 }, p3 + 2.45).set([c.tiles.muro1[1], c.tiles.muro2[1]], { autoAlpha: 1 }, p3 + 2.45)
      .fromTo(c.estado, { "--marco": 0 }, { "--marco": 1, duration: 0.25, yoyo: true, repeat: 1, immediateRender: false }, p3 + 2.3)
      .to(Object.values(c.filas), { autoAlpha: 1, duration: 0.5 }, p3 + 3)
      .to(c.filas.llave, { "--marco": 0, duration: 0.5 }, p3 + 3);
  },

  vida(c) {
    return respirar([c.jugador.n, c.motor]);
  },
};
