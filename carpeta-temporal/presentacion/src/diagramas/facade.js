import * as THREE from "three";
import { gsap } from "gsap";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { t, img, el, pixel, eventos, juntas, respirar } from "../util.js";
import { SUBSISTEMA } from "../datos.js";
import { crearPersonaje } from "../personaje3d.js";
import { mundo3d, textura, chispa, haz, anclar } from "./patrones3d.js";

/*
 * Facade. La interfaz Juego es una caja cerrada con una sola puerta. Los clientes de la vista mandan sus
 * llamadas reales (las siete de la interfaz) y todas entran por ahí. Paso 1: la caja se vuelve de vidrio
 * y adentro está lo que hay hoy, JuegoDePrueba, una sola clase que hace todo. Paso 2: ese bloque se desarma
 * en las piezas del dominio pendiente; cada llamada se reparte entre las piezas que la resuelven.
 * Las llamadas siguen entrando igual por la misma puerta: la vista no se entera del cambio.
 */

/** Quién llama qué. Fuente: PantallaJuego, PanelHUD y VentanaPrincipal. */
const CLIENTES = [
  { nombre: "PantallaJuego", llamadas: ["mover(DERECHA)", "mover(ARRIBA)", "getEstado()", "iniciarNivel(2)", "reiniciar()", "agregarObservador(hud)"] },
  { nombre: "PanelHUD", llamadas: ["deshacer()", "reiniciar()"] },
  { nombre: "VentanaPrincipal", llamadas: ["getCantidadNiveles()"] },
];
const METODOS = ["getCantidadNiveles()", "iniciarNivel(numero)", "mover(direccion)", "deshacer()", "reiniciar()", "getEstado()", "agregarObservador(o)"];
/** Qué piezas del dominio coordinaría cada llamada (ilustrativo: el dominio todavía no está). */
const RUTA = {
  mover: ["Jugador", "Tablero", "Caja normal", "Caja frágil", "Historial 15 · 5 · 3", "Puntaje"],
  deshacer: ["Historial 15 · 5 · 3", "Tablero", "Puntaje"],
  reiniciar: ["Niveles .txt", "Tablero", "Historial 15 · 5 · 3"],
  iniciarNivel: ["Niveles .txt", "Tablero", "Caja llave"],
  getCantidadNiveles: ["Niveles .txt"],
  getEstado: ["Tablero", "Puntaje"],
  agregarObservador: [],
};
const ORDEN = ["Niveles .txt", "Tablero", "Historial 15 · 5 · 3", "Puntaje", "Jugador", "Caja normal", "Caja frágil", "Caja llave"]; // atrás y adelante
const CAMARA = new THREE.Vector3(-8, 9, 16), MIRA = new THREE.Vector3(-2, 2.2, 0);
const ANCHO = 7.5, ALTO = 3, FONDO = 4.5, VIDRIERA = 0.75; // la caja Juego, hecha con las vidrieras de 1985
const PUERTA = new THREE.Vector3(-2.85, 0, FONDO / 2);
const CARTEL_FIJO = { x: 1190, y: 96 };

/** Vidriera o techo con baldosas de 0,75 de lado, sin estirar el pixel art. */
function revestimiento(k, ancho, alto, corte) {
  const x = new THREE.TextureLoader().load(img(k));
  x.colorSpace = THREE.SRGBColorSpace;
  x.magFilter = x.minFilter = THREE.NearestFilter;
  x.generateMipmaps = false;
  x.wrapS = x.wrapT = THREE.RepeatWrapping;
  x.repeat.set(Math.round(ancho / VIDRIERA), Math.round(alto / VIDRIERA));
  return new THREE.MeshStandardMaterial({ map: x, roughness: 0.5, metalness: 0.2, clippingPlanes: [corte], side: THREE.DoubleSide, emissive: new THREE.Color(t("linea")), emissiveMap: x, emissiveIntensity: 0.12 });
}

function canvasTextura(w, h, dibujar) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  dibujar(c.getContext("2d"), w, h);
  const x = new THREE.CanvasTexture(c);
  x.colorSpace = THREE.SRGBColorSpace;
  x.anisotropy = 4;
  return x;
}

/** Cada pieza del dominio, hecha con el arte real. */
function crearPieza(nombre) {
  const g = new THREE.Group();
  const madera = (k) => new THREE.Mesh(new RoundedBoxGeometry(0.72, 0.72, 0.72, 3, 0.05), new THREE.MeshStandardMaterial({ map: textura(k), roughness: 0.75, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0 }));
  let cuerpo;
  if (nombre === "Tablero") {
    cuerpo = new THREE.Group();
    for (let i = 0; i < 9; i++) {
      const k = i === 4 ? "goals/goal" : i % 3 === 0 && i < 3 ? "tiles/wall_mall" : "tiles/floor_1985";
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, k.includes("wall") ? 0.3 : 0.06, 0.42), new THREE.MeshStandardMaterial({ map: textura(k), roughness: 0.8, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0 }));
      b.position.set((i % 3 - 1) * 0.43, k.includes("wall") ? 0.15 : 0.03, (Math.floor(i / 3) - 1) * 0.43);
      cuerpo.add(b);
    }
  } else if (nombre === "Jugador") {
    const pj = crearPersonaje(0.62);
    cuerpo = pj.raiz;
    cuerpo.rotation.y = 0.5;
    g.userData.pj = pj;
  } else if (nombre.startsWith("Caja")) {
    cuerpo = madera({ "Caja normal": "boxes/box_wood", "Caja frágil": "boxes/caja_fragil_intacta", "Caja llave": "boxes/caja_llave" }[nombre]);
    cuerpo.position.y = 0.36;
  } else if (nombre === "Niveles .txt") {
    cuerpo = new THREE.Group();
    const texto = canvasTextura(256, 320, (g2, w, h) => {
      g2.fillStyle = t("papel"); g2.fillRect(0, 0, w, h);
      g2.fillStyle = t("fondo"); g2.font = `500 34px ${t("f-mono")}`;
      ["#######", "#     #", "# @$ .#", "#     #", "#######"].forEach((l, i) => g2.fillText(l, 22, 70 + i * 46));
    });
    for (let i = 0; i < 3; i++) {
      const hoja = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.012, 0.78), new THREE.MeshStandardMaterial({ color: t("papel"), map: i === 2 ? texto : null, roughness: 0.9, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0 }));
      hoja.position.set(i * 0.05, 0.08 + i * 0.05, -i * 0.04);
      hoja.rotation.set(-0.5, i * 0.12 - 0.12, 0);
      cuerpo.add(hoja);
    }
    cuerpo.position.y = 0.2;
  } else if (nombre.startsWith("Historial")) {
    cuerpo = new THREE.Group();
    for (let i = 0; i < 15; i++) {
      const lamina = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.025, 0.5), new THREE.MeshStandardMaterial({ color: t("linea"), transparent: true, opacity: 0.55, roughness: 0.3, emissive: new THREE.Color(t("linea")), emissiveIntensity: 0.25 }));
      lamina.position.y = 0.05 + i * 0.055;
      cuerpo.add(lamina);
    }
  } else {
    const plano = canvasTextura(320, 200, (g2, w, h) => {
      g2.fillStyle = t("superficie"); g2.fillRect(0, 0, w, h);
      g2.strokeStyle = t("exito"); g2.lineWidth = 8; g2.strokeRect(6, 6, w - 12, h - 12);
      g2.fillStyle = t("exito"); g2.font = `700 96px ${t("f-mono")}`; g2.textAlign = "center"; g2.textBaseline = "middle";
      g2.fillText("1000", w / 2, h / 2 + 4);
    });
    cuerpo = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.54, 0.06), new THREE.MeshStandardMaterial({ map: plano, roughness: 0.5, emissive: new THREE.Color(t("exito")), emissiveMap: plano, emissiveIntensity: 0.4 }));
    cuerpo.position.y = 0.5;
    cuerpo.rotation.x = -0.25;
  }
  g.add(cuerpo);
  g.userData.cuerpo = cuerpo;
  // Base de obra: aro punteado del color de lo pendiente
  const aro = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 65 }, (_, i) => new THREE.Vector3(Math.cos((i / 64) * Math.PI * 2) * 0.62, 0.02, Math.sin((i / 64) * Math.PI * 2) * 0.62))),
    new THREE.LineDashedMaterial({ color: new THREE.Color(t("pendiente")), dashSize: 0.08, gapSize: 0.06, transparent: true }));
  aro.computeLineDistances();
  g.add(aro);
  g.userData.aro = aro;
  return g;
}

function armarEscena(w) {
  const { escena } = w;
  escena.add(new THREE.HemisphereLight(t("tinta-2"), t("fondo-hondo"), 1.4));
  const sol = new THREE.DirectionalLight(t("titulo"), 2);
  sol.position.set(-6, 12, 8);
  escena.add(sol);
  const interior = new THREE.PointLight(t("acento"), 0, 9, 1.2);
  interior.position.set(0, 2.2, 0);
  escena.add(interior);

  const piso = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ map: textura("tiles/floor_1985", 80), color: t("tinta-3"), roughness: 0.9 }));
  piso.rotation.x = -Math.PI / 2;
  escena.add(piso);

  const caja = new THREE.Group();
  caja.rotation.y = -0.4;
  escena.add(caja);
  const corte = new THREE.Plane(new THREE.Vector3(0, -1, 0), ALTO + 0.1);
  const lado = revestimiento("tiles/wall_mall", FONDO, ALTO, corte), frente = revestimiento("tiles/wall_mall", ANCHO, ALTO, corte), techo = revestimiento("tiles/wall_concrete", ANCHO, FONDO, corte);
  const cuerpo = new THREE.Mesh(new THREE.BoxGeometry(ANCHO, ALTO, FONDO), [lado, lado, techo, techo, frente, frente]);
  cuerpo.position.y = ALTO / 2;
  caja.add(cuerpo);
  const vidrio = new THREE.Mesh(new THREE.BoxGeometry(ANCHO + 0.02, ALTO + 0.02, FONDO + 0.02), new THREE.MeshBasicMaterial({ color: new THREE.Color(t("linea")), transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
  vidrio.position.y = ALTO / 2;
  caja.add(vidrio);
  const aristas = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(ANCHO, ALTO, FONDO)), new THREE.LineBasicMaterial({ color: new THREE.Color(t("linea")), transparent: true, opacity: 0.8 }));
  aristas.position.y = ALTO / 2;
  caja.add(aristas);
  const barrido = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z]) => new THREE.Vector3((x * ANCHO) / 2, 0, (z * FONDO) / 2))),
    new THREE.LineBasicMaterial({ color: new THREE.Color(t("acento")), transparent: true, opacity: 0 }));
  caja.add(barrido);

  // La puerta: un marco de luz en el frente
  const puerta = new THREE.Group();
  puerta.position.copy(PUERTA);
  caja.add(puerta);
  const matMarco = new THREE.MeshBasicMaterial({ color: new THREE.Color(t("acento")) });
  [[-0.55, 1, 0.08, 2], [0.55, 1, 0.08, 2], [0, 2, 1.18, 0.08]].forEach(([x, y, a, h]) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(a, h, 0.08), matMarco);
    m.position.set(x, y, 0.02);
    puerta.add(m);
  });
  const luzPuerta = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 1.96), new THREE.MeshBasicMaterial({ color: new THREE.Color(t("acento")), transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false }));
  luzPuerta.position.set(0, 0.98, 0.03);
  puerta.add(luzPuerta);

  // Hoy: JuegoDePrueba, un solo bloque que hace todo
  const lugar = (i) => new THREE.Vector3(-1.6 + (i % 4) * 1.5, 0, i < 4 ? -1.05 : 1.05);
  const matBloque = new THREE.MeshStandardMaterial({ color: t("superficie-2"), roughness: 0.5, metalness: 0.3, emissive: new THREE.Color(t("linea")), emissiveIntensity: 0.05 });
  const bloque = new THREE.Group();
  bloque.position.y = 0.8;
  caja.add(bloque);
  const partes = ORDEN.map((_, i) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.6, 1), matBloque);
    const p = lugar(i);
    m.position.set(p.x, 0, Math.sign(p.z) * 0.5);
    m.userData.desde = m.position.clone();
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), new THREE.LineBasicMaterial({ color: new THREE.Color(t("linea")), transparent: true, opacity: 0.3 })));
    bloque.add(m);
    return m;
  });
  const bordeBloque = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(6, 1.6, 2)), new THREE.LineBasicMaterial({ color: new THREE.Color(t("exito")), transparent: true, opacity: 0.9 }));
  bordeBloque.position.x = 0.65;
  bloque.add(bordeBloque);

  // Después: las piezas del dominio, cada una en su base de obra
  const centro = new THREE.Vector3(PUERTA.x, 0.5, PUERTA.z - 0.6);
  const piezas = ORDEN.map((nombre, i) => {
    const g = crearPieza(nombre);
    g.position.copy(lugar(i));
    caja.add(g);
    const curva = new THREE.CatmullRomCurve3([centro.clone(), new THREE.Vector3((centro.x + g.position.x) / 2, 1.6, (centro.z + g.position.z) / 2), g.position.clone().setY(0.35)]);
    const h = haz(curva, "pendiente", 0.018, 0.55);
    h.userData.dibujar(0);
    caja.add(h);
    return { nombre, g, curva, haz: h };
  });
  const paquetes = Array.from({ length: 10 }, () => { const s = chispa("acento", 0.55); caja.add(s); return s; });

  return { caja, cuerpo, corte, vidrio, aristas, barrido, puerta, luzPuerta, interior, bloque, partes, bordeBloque, piezas, paquetes, centro };
}

export default {
  montar(lienzo) {
    const w = mundo3d(lienzo, { descripcion: "Patrón Facade: las llamadas de la vista entran por una sola puerta; detrás, el dominio que las coordina", fov: 30, resplandor: [0.7, 0.5, 0.75] });
    el("div", "fac__velo", lienzo);
    const c = { w, abierta: { v: 0 }, dominio: { v: 0 }, entrada: { v: 0 }, libre: 0 };

    c.clientes = CLIENTES.map((cl, i) => {
      const caja = el("div", "fac__cliente pos", lienzo, { vars: { x: 120, y: 420 + i * 196 } });
      el("p", "fac__rotulo", caja, { texto: "cliente de la vista" });
      el("p", "fac__nombre", caja, { texto: cl.nombre });
      const ultima = el("code", "fac__ultima", caja, { texto: cl.llamadas[0] });
      return { caja, ultima, llamadas: cl.llamadas, x: 520, y: 420 + i * 196 + 92 };
    });

    // La interfaz Juego: primero es la cara de la caja, después queda como cartel
    c.cartelA = el("div", "fac__ancla fac__ancla--cartel", lienzo);
    c.cartel = el("div", "fac__cartel", c.cartelA);
    el("p", "fac__rotulo", c.cartel, { html: "interface <b>Juego</b>, la fachada" });
    const lista = el("ol", "fac__metodos", c.cartel);
    c.metodos = {};
    METODOS.forEach((m) => {
      const li = el("li", "", lista);
      el("b", "", li, { texto: m.split("(")[0] });
      li.append("(" + m.split("(")[1]);
      c.metodos[m.split("(")[0]] = li;
    });

    c.llamadas = Array.from({ length: 4 }, () => {
      const a = el("div", "fac__ancla fac__ancla--llamada", lienzo);
      const chip = el("code", "fac__llamada", a);
      gsap.set(chip, { autoAlpha: 0 });
      return { a, chip };
    });
    c.respuestaA = el("div", "fac__ancla fac__ancla--llamada", lienzo);
    c.respuesta = el("code", "fac__llamada fac__llamada--vuelta", c.respuestaA, { texto: "EstadoJuego" });
    gsap.set(c.respuesta, { autoAlpha: 0 });

    c.hoyA = el("div", "fac__ancla fac__ancla--hoy", lienzo);
    c.hoy = el("p", "fac__hoy", c.hoyA, { html: "<b>JuegoDePrueba</b> hoy hace todo en una sola clase" });
    c.etiquetas = ORDEN.map((nombre) => {
      const a = el("div", "fac__ancla fac__ancla--pieza", lienzo);
      const chip = el("p", "fac__pieza", a);
      const dato = SUBSISTEMA.find((p) => p.nombre === nombre);
      if (dato) pixel(dato.img, chip, "");
      el("span", "", chip, { texto: nombre });
      return { a, chip };
    });
    c.dominioA = el("div", "fac__ancla fac__ancla--dominio", lienzo);
    c.dominioEl = el("p", "fac__dominio", c.dominioA, { html: "<b>Dominio</b> pendiente: lo sube un compañero. Las piezas son las de la consigna; el reparto es ilustrativo." });

    if (w) {
      Object.assign(c, armarEscena(w));
      w.camara.position.copy(CAMARA);
      w.mira.copy(MIRA);
      w.preparar();
      const tmp = new THREE.Vector3();
      const enCaja = (x, y, z) => { tmp.set(x, y, z); c.caja.localToWorld(tmp); return w.proyectar(tmp); };
      w.cadaCuadro(() => {
        c.caja.updateMatrixWorld();
        const cara = enCaja(0.75, ALTO * 0.55, FONDO / 2);
        const f = c.abierta.v;
        anclar(c.cartelA, { x: cara.x + (CARTEL_FIJO.x + 330 - cara.x) * f, y: cara.y + (CARTEL_FIJO.y + 115 - cara.y) * f });
        c.puertaPx = enCaja(PUERTA.x, 1, PUERTA.z + 0.1);
        anclar(c.hoyA, enCaja(0.65, 1.75, 0));
        c.piezas.forEach((p, i) => anclar(c.etiquetas[i].a, enCaja(p.g.position.x, i < 4 ? 1.3 + (i % 2) * 0.55 : -0.05, p.g.position.z)));
        anclar(c.dominioA, enCaja(1.2, 0, FONDO / 2));
      });
    } else {
      c.puertaPx = { x: 900, y: 700 };
      anclar(c.cartelA, { x: CARTEL_FIJO.x + 330, y: CARTEL_FIJO.y + 115 });
      anclar(c.hoyA, { x: 1250, y: 620 });
      c.etiquetas.forEach((e, i) => anclar(e.a, { x: 1000 + (i % 4) * 200, y: i < 4 ? 560 : 800 }));
      anclar(c.dominioA, { x: 1250, y: 420 });
    }
    return c;
  },

  construir(tl, c) {
    tl.set([c.hoy, c.dominioEl, ...c.etiquetas.map((e) => e.chip)], { autoAlpha: 0 }, 0)
      .fromTo(c.entrada, { v: 0 }, { v: 1, duration: 2.6, ease: "none" }, 0)
      .fromTo(c.clientes.map((cl) => cl.caja), { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 }, 0.5)
      .fromTo(c.cartel, { autoAlpha: 0, scale: 0.92 }, { autoAlpha: 1, scale: 1, duration: 0.7, ease: "power3.out" }, 1.3);
    if (c.w) {
      tl.fromTo(c.w.camara.position, { x: -14, y: 4, z: 12 }, { x: CAMARA.x, y: CAMARA.y, z: CAMARA.z, duration: 2.6, ease: "power3.inOut" }, 0)
        .fromTo(c.caja.scale, { y: 0.01 }, { y: 1, duration: 1.1, ease: "power3.out" }, 0.3)
        .fromTo(c.luzPuerta.material, { opacity: 0 }, { opacity: 0.18, duration: 0.6 }, 1.2)
        .set([c.bloque.scale, ...c.piezas.map((p) => p.g.scale)], { x: 0.001, y: 0.001, z: 0.001 }, 0);
    }

    // Paso 1: la caja se vuelve de vidrio y se ve lo que hay hoy detrás de la puerta
    tl.addLabel("p1");
    tl.fromTo(c.abierta, { v: 0 }, { v: 1, duration: 1.4, ease: "power2.inOut" }, "p1");
    if (c.w) {
      const corte = c.corte;
      tl.fromTo(corte, { constant: ALTO + 0.1 }, { constant: -0.05, duration: 1.6, ease: "power2.inOut",
        onUpdate: () => { c.barrido.position.y = Math.max(0, corte.constant); c.barrido.material.opacity = corte.constant > 0 && corte.constant < ALTO ? 1 : 0; } }, "p1")
        .fromTo(c.bloque.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "back.out(1.4)" }, "p1+=0.9")
        .fromTo(c.interior, { intensity: 0 }, { intensity: 8, duration: 1 }, "p1+=0.6")
        .fromTo(c.vidrio.material, { opacity: 0 }, { opacity: 0.06, duration: 1 }, "p1+=0.6")
        .to(c.w.camara.position, { x: -7, y: 9.6, z: 15, duration: 1.8, ease: "power2.inOut" }, "p1");
    }
    tl.fromTo(c.hoy, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "p1+=1.3");

    // Paso 2: el bloque se desarma en las piezas del dominio pendiente
    tl.addLabel("p2");
    tl.fromTo(c.dominio, { v: 0 }, { v: 1, duration: 2, ease: "none" }, "p2")
      .to(c.hoy, { autoAlpha: 0, duration: 0.3 }, "p2");
    if (c.w) {
      c.partes.forEach((m, i) => {
        const dest = c.piezas[i].g.position;
        tl.to(m.position, { x: dest.x, y: 1.2, z: dest.z, duration: 0.8, ease: "power3.inOut" }, "p2+=" + (0.1 + i * 0.05))
          .to(m.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.8, ease: "power3.in" }, "p2+=" + (0.1 + i * 0.05));
      });
      tl.to(c.bordeBloque.material, { opacity: 0, duration: 0.3 }, "p2")
        .to(c.interior, { intensity: 3, duration: 1 }, "p2")
        .fromTo(c.piezas.map((p) => p.g.scale), { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.6, ease: "back.out(1.8)", stagger: 0.06 }, "p2+=0.8");
      c.piezas.forEach((p, i) => {
        const avance = { f: 0 };
        tl.fromTo(avance, { f: 0 }, { f: 1, duration: 0.6, ease: "power2.out", onUpdate: () => p.haz.userData.dibujar(avance.f) }, "p2+=" + (1.1 + i * 0.05));
      });
    }
    tl.fromTo(c.etiquetas.map((e) => e.chip), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05 }, "p2+=1.2")
      .fromTo(c.dominioEl, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "p2+=1.6");
  },

  vida(c) {
    const vidas = [];
    if (c.w) {
      const tick = (tt) => {
        c.w.deriva.set(Math.sin(tt * 0.14) * 0.5, Math.sin(tt * 0.21 + 0.7) * 0.25, 0);
        c.luzPuerta.material.opacity = 0.16 + Math.sin(tt * 1.3) * 0.05;
        c.piezas.forEach((p, i) => { p.g.userData.aro.rotation.y = tt * (0.3 + i * 0.04) * (i % 2 ? 1 : -1); });
        const pj = c.piezas[ORDEN.indexOf("Jugador")].g.userData.pj;
        pj.cabeza.rotation.y = Math.sin(tt * 0.7) * 0.4;
      };
      gsap.ticker.add(tick);
      vidas.push({ kill: () => gsap.ticker.remove(tick) });
    }
    vidas.push(respirar(c.clientes.map((cl) => cl.caja)));
    vidas.push(eventos(() => { if (c.entrada.v >= 1) llamar(c); }, [1.3, 2.6]));
    return juntas(...vidas);
  },

  desmontar(c) { if (c.w) c.w.destruir(); },
};

/** Un cliente llama a un método: la llamada cruza hasta la puerta y adentro se reparte. */
function llamar(c) {
  const cl = gsap.utils.random(c.clientes);
  const texto = gsap.utils.random(cl.llamadas);
  const metodo = texto.split("(")[0];
  const ll = c.llamadas[c.libre++ % c.llamadas.length];
  ll.chip.textContent = texto;
  cl.ultima.textContent = texto;
  gsap.fromTo(cl.caja, { "--golpe": 1 }, { "--golpe": 0, duration: 0.8 });
  const prog = { f: 0 };
  const desde = { x: cl.x, y: cl.y };
  gsap.timeline()
    .set(ll.chip, { autoAlpha: 1, scale: 1 })
    .to(prog, { f: 1, duration: 0.85, ease: "power2.inOut", onUpdate: () => {
      const p = c.puertaPx, f = prog.f;
      anclar(ll.a, { x: desde.x + (p.x - desde.x) * f, y: desde.y + (p.y - desde.y) * f - Math.sin(f * Math.PI) * 60 });
    } })
    .to(ll.chip, { scale: 0.3, autoAlpha: 0, duration: 0.2 })
    .call(() => entrar(c, metodo, texto, desde), null, "-=0.15");
}

function entrar(c, metodo, texto, cliente) {
  const li = c.metodos[metodo];
  if (li) gsap.fromTo(li, { "--golpe": 1 }, { "--golpe": 0, duration: 1.4, ease: "power2.out" });
  if (!c.w) return;
  gsap.fromTo(c.luzPuerta.material, { opacity: 0.9 }, { opacity: 0.18, duration: 0.6 });
  if (metodo === "getEstado") volver(c, cliente);
  if (c.abierta.v < 0.9) return;
  const destinos = c.dominio.v < 0.6 ? null : RUTA[metodo].map((n) => c.piezas.find((p) => p.nombre === n));
  if (!destinos) { // hoy: todo lo resuelve JuegoDePrueba
    const s = c.paquetes[c.libre++ % c.paquetes.length];
    const curva = new THREE.QuadraticBezierCurve3(c.centro, new THREE.Vector3(-1, 2.4, 0), new THREE.Vector3(0.5, 1.2, 0));
    viajar(s, curva, 0.6, () => gsap.fromTo(c.partes[0].material, { emissiveIntensity: 0.6 }, { emissiveIntensity: 0.05, duration: 0.7 }));
    return;
  }
  destinos.forEach((p, i) => {
    const s = c.paquetes[c.libre++ % c.paquetes.length];
    gsap.delayedCall(i * 0.08, () => viajar(s, p.curva, 0.55, () => reaccionar(p, metodo)));
  });
}

function viajar(s, curva, dur, alLlegar) {
  const prog = { f: 0 };
  gsap.fromTo(prog, { f: 0 }, { f: 1, duration: dur, ease: "power1.inOut",
    onUpdate: () => { curva.getPoint(prog.f, s.position); s.material.opacity = Math.min(1, Math.sin(prog.f * Math.PI) * 2); },
    onComplete: () => { s.material.opacity = 0; alLlegar(); } });
}

/** Cada pieza hace su parte: el jugador salta, la caja avanza, el historial guarda o devuelve fotos. */
function reaccionar(p, metodo) {
  const cuerpo = p.g.userData.cuerpo;
  gsap.fromTo(p.g.userData.aro.material, { opacity: 1 }, { opacity: 0.5, duration: 0.8 });
  gsap.fromTo(p.g.scale, { x: 1.12, y: 1.12, z: 1.12 }, { x: 1, y: 1, z: 1, duration: 0.5, ease: "power2.out" });
  cuerpo.traverse((o) => { if (o.material && o.material.emissive && p.nombre !== "Puntaje" && !p.nombre.startsWith("Historial")) gsap.fromTo(o.material, { emissiveIntensity: 0.7 }, { emissiveIntensity: 0, duration: 0.8 }); });
  if (p.nombre === "Jugador") gsap.fromTo(cuerpo.position, { y: 0 }, { y: 0.35, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" });
  if (p.nombre.startsWith("Caja") && metodo === "mover") gsap.fromTo(cuerpo.position, { x: 0 }, { x: 0.18, duration: 0.2, yoyo: true, repeat: 1, ease: "empuje" });
  if (p.nombre.startsWith("Historial")) {
    const laminas = cuerpo.children;
    const cuantas = metodo === "deshacer" ? 5 : 1;
    const desde = metodo === "deshacer" ? laminas.length - 5 : laminas.length - 1;
    laminas.slice(desde, desde + cuantas).forEach((l, i) => gsap.fromTo(l.material, { emissiveIntensity: 1.2 }, { emissiveIntensity: 0.25, duration: 0.9, delay: i * 0.05 }));
  }
}

function volver(c, cliente) {
  const prog = { f: 0 };
  gsap.timeline()
    .set(c.respuesta, { autoAlpha: 1 })
    .to(prog, { f: 1, duration: 0.8, ease: "power2.inOut", delay: 0.25, onUpdate: () => {
      const p = c.puertaPx, f = prog.f;
      anclar(c.respuestaA, { x: p.x + (cliente.x - p.x) * f, y: p.y + (cliente.y - p.y) * f + Math.sin(f * Math.PI) * 60 });
    } })
    .to(c.respuesta, { autoAlpha: 0, duration: 0.2 });
}
