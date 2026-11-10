import * as THREE from "three";
import { gsap } from "gsap";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { t, img, el, s as svgEl, eventos, juntas, puntoEn } from "../util.js";
import { NIVEL_PRUEBA } from "../datos.js";
import { crearPersonaje } from "../personaje3d.js";
import { tableroPixel, mirar } from "./tablero.js";
import { mundo3d, textura, chispa, haz, anclar } from "./patrones3d.js";

/*
 * Observer. El sujeto (Juego) es un núcleo 3D con el nivel 3 del juego de prueba encima, y el personaje
 * lo resuelve solo con las mismas reglas de JuegoDePrueba (simulación). Cada movimiento que cambia algo
 * llama a notificar(): el núcleo late, sale una onda y la misma foto EstadoJuego viaja a cada observador
 * en órbita. PanelHUD reescribe sus tres números y PanelTablero se vuelve a pintar desde las líneas de texto.
 * Un choque contra la pared no cambia nada y no avisa.
 */

/* ── Reglas y constantes de JuegoSokoban (cajas normales) sobre un nivel de prueba ── */
const NIVEL = 3;
const MAXIMO = 1000, COSTO_MOV = 10, COSTO_EMP = 5, COSTO_UNDO = 50, PASOS_POR_UNDO = 5;
const DELTA = { arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0] };
const PLAN = [..."RRUULDULLLLDDRRRRLLLULUR"].map((c) => ({ R: "derecha", L: "izquierda", U: "arriba", D: "abajo" })[c]); // resuelve el nivel 3
const GIRO = { arriba: Math.PI, abajo: 0, izquierda: -Math.PI / 2, derecha: Math.PI / 2 };

function crearJuego() {
  const j = {};
  j.iniciarNivel = () => {
    j.celdas = NIVEL_PRUEBA.map((l) => [...l].map((c) => (c === "#" ? "#" : c === "$" || c === "*" ? "$" : " ")));
    j.destinos = NIVEL_PRUEBA.map((l) => [...l].map((c) => c === "." || c === "*" || c === "+"));
    NIVEL_PRUEBA.forEach((l, y) => [...l].forEach((c, x) => { if (c === "@" || c === "+") { j.x = x; j.y = y; } }));
    j.mov = 0; j.emp = 0; j.undos = 0; j.historial = [];
  };
  j.completo = () => j.celdas.every((f, y) => f.every((c, x) => c !== "$" || j.destinos[y][x]));
  /** mover(): si está completo o bloqueado vuelve sin notificar (devuelve null). */
  j.mover = (d) => {
    const [dx, dy] = DELTA[d];
    const x = j.x + dx, y = j.y + dy, cx = x + dx, cy = y + dy;
    const empuja = j.celdas[y][x] === "$";
    const bloqueado = j.celdas[y][x] === "#" || (empuja && j.celdas[cy][cx] !== " ");
    if (j.completo() || bloqueado) return null;
    j.historial.push({ celdas: j.celdas.map((f) => f.slice()), x: j.x, y: j.y, mov: j.mov, emp: j.emp });
    if (empuja) { j.celdas[y][x] = " "; j.celdas[cy][cx] = "$"; j.emp += 1; }
    j.x = x; j.y = y; j.mov += 1;
    return { empuja, de: [x, y], a: [cx, cy] };
  };
  /** deshacer(): saca hasta 5 fotos del historial y suma un uso. */
  j.deshacer = () => {
    if (!j.historial.length || j.completo()) return 0;
    let foto = j.historial.pop(), pasos = 1;
    while (pasos < PASOS_POR_UNDO && j.historial.length) { foto = j.historial.pop(); pasos += 1; }
    Object.assign(j, { celdas: foto.celdas, x: foto.x, y: foto.y, mov: foto.mov, emp: foto.emp });
    j.undos += 1;
    return pasos;
  };
  j.cajas = () => j.celdas.flatMap((f, y) => f.map((c, x) => (c === "$" ? [x, y] : null)).filter(Boolean));
  j.getEstado = () => ({
    nivel: NIVEL, movimientos: j.mov, empujes: j.emp, undosUsados: j.undos,
    puntaje: Math.max(0, MAXIMO - j.mov * COSTO_MOV - j.emp * COSTO_EMP - j.undos * COSTO_UNDO),
    completado: j.completo(),
    tablero: j.celdas.map((f, y) => f.map((c, x) => {
      const dest = j.destinos[y][x];
      if (x === j.x && y === j.y) return dest ? "+" : "@";
      if (c === "$") return dest ? "*" : "$";
      return dest ? "." : c;
    }).join("")),
  });
  j.iniciarNivel();
  return j;
}

/* ── Dibujo 2D de los observadores, igual que en la vista Swing ── */
const imagenes = {};
const imagen = (k) => { if (!imagenes[k]) { imagenes[k] = new Image(); imagenes[k].src = img(k); } return imagenes[k]; };
const SPRITE = { arriba: "characters/player_up", abajo: "characters/player_down", izquierda: "characters/player_left", derecha: "characters/player_right" };
/** Capas de PanelTablero, con piso y pared de 2015 (el nivel 3 cae en esa época). */
const CAPAS = {
  "#": ["tiles/wall_future"], " ": ["tiles/floor_2015"], ".": ["tiles/floor_2015", "goals/goal"],
  "@": ["tiles/floor_2015", "jugador"], "+": ["tiles/floor_2015", "goals/goal", "jugador"],
  "$": ["tiles/floor_2015", "boxes/box_wood"], "*": ["tiles/floor_2015", "goals/goal_placed"],
};
const INDICADORES = ["ui/indicador_nivel", "ui/indicador_movimientos", "ui/indicador_empujes"];

function lienzo2d(padre, clase, w, h) {
  const c = el("canvas", clase, padre, { width: w * 2, height: h * 2 });
  const g = c.getContext("2d");
  g.scale(2, 2);
  g.imageSmoothingEnabled = false;
  return { c, g, w, h };
}

/** paintComponent de PanelTablero: fondo de la época y cada celda como capas de imágenes. */
function pintarTablero({ g, w, h }, lineas, mira, conFondo = true) {
  g.clearRect(0, 0, w, h);
  if (conFondo) {
    const f = imagen("backgrounds/background_future_2015");
    const e = Math.max(w / 960, h / 540);
    g.drawImage(f, (w - 960 * e) / 2, (h - 540 * e) / 2, 960 * e, 540 * e);
  }
  const cols = lineas[0].length, filas = lineas.length;
  const b = Math.floor(Math.min(64, w / cols, h / filas));
  const mx = Math.floor((w - b * cols) / 2), my = Math.floor((h - b * filas) / 2);
  lineas.forEach((l, y) => [...l].forEach((s, x) => (CAPAS[s] || []).forEach((k) => g.drawImage(imagen(k === "jugador" ? SPRITE[mira] : k), mx + x * b, my + y * b, b, b))));
}

/** crearIndicador de PanelHUD: el ícono del diseño con su "000" tapado por el valor real. */
function pintarHud({ g }, estado) {
  const T = 112, e = T / 64;
  [estado.nivel, estado.movimientos, estado.empujes].forEach((valor, i) => {
    const x = i * (T + 18), icono = imagen(INDICADORES[i]);
    g.clearRect(x, 0, T, T);
    g.drawImage(icono, x, 0, T, T);
    g.fillStyle = t("superficie");
    g.fillRect(x + 13 * e, 34 * e, 38 * e, 16 * e);
    g.fillStyle = t("exito");
    g.font = `700 ${Math.round(15 * e)}px ${t("f-mono")}`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(String(valor).padStart(3, "0"), x + 32 * e, 42.5 * e);
  });
}

/* ── Geometría de la escena ── */
const R_NUCLEO = 5.2, R_ORBITA = 9.2, Y_ORBITA = 1;
// La cámara se aleja lo justo para que la órbita entera de los observadores quede dentro de la pantalla
const CAMARA = new THREE.Vector3(-2.9, 19.8, 23.6), MIRA = new THREE.Vector3(4.6, 0, 0.6);
const OBS = [ // ángulo sobre la órbita (grados, negativos hacia la cámara); el orden es el de la lista de observadores
  { clave: "hud", angulo: -13, nombre: "PanelHUD" },
  { clave: "tablero", angulo: -48, nombre: "PanelTablero" },
];
/** Lugar de cada observador cuando no hay WebGL. */
const FIJO = { hud: { x: 1320, y: 545 }, tablero: { x: 1170, y: 855 } };
const enOrbita = (grados, r = R_ORBITA, y = Y_ORBITA) => { const a = (grados * Math.PI) / 180; return new THREE.Vector3(r * Math.cos(a), y, -r * Math.sin(a)); };
const celda = (x, y) => new THREE.Vector3(x - 3.5, 0, y - 2);

function armarEscena(w, juego) {
  const { escena } = w;
  escena.add(new THREE.HemisphereLight(t("tinta-2"), t("fondo-hondo"), 1.5));
  const sol = new THREE.DirectionalLight(t("titulo"), 2.2);
  sol.position.set(-5, 11, 7);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -7, right: 7, top: 6, bottom: -6, near: 1, far: 30 });
  sol.shadow.bias = -0.0008;
  escena.add(sol);
  const luzLatido = new THREE.PointLight(t("linea"), 0, 14, 1.4);
  luzLatido.position.set(0, 2.2, 0);
  escena.add(luzLatido);

  // El núcleo: una plataforma con dos anillos de luz que laten
  const nucleo = new THREE.Group();
  escena.add(nucleo);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R_NUCLEO, R_NUCLEO + 0.35, 0.7, 96), new THREE.MeshStandardMaterial({ color: t("superficie-2"), metalness: 0.35, roughness: 0.45 }));
  base.position.y = -0.37;
  base.receiveShadow = true;
  nucleo.add(base);
  const aro = (radio, grosor, color, op) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(radio, grosor, 12, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(t(color)), transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2;
    nucleo.add(m);
    return m;
  };
  const anillo = aro(R_NUCLEO + 0.02, 0.06, "linea", 0.75);
  const latido = aro(R_NUCLEO + 0.02, 0.16, "acento", 0);
  const aroBajo = aro(R_NUCLEO + 0.34, 0.03, "linea", 0.3);
  aroBajo.position.y = -0.72;

  // El tablero del nivel 3 con las baldosas reales de 2015
  const tablero = new THREE.Group();
  nucleo.add(tablero);
  const matPiso = new THREE.MeshStandardMaterial({ map: textura("tiles/floor_2015"), roughness: 0.85 });
  const matDestino = new THREE.MeshStandardMaterial({ map: textura("goals/goal"), roughness: 0.6, emissive: new THREE.Color(t("acento")), emissiveMap: textura("goals/goal"), emissiveIntensity: 0.35 });
  const matPared = new THREE.MeshStandardMaterial({ map: textura("tiles/wall_future"), roughness: 0.7 });
  const geoPiso = new THREE.PlaneGeometry(1, 1), geoPared = new THREE.BoxGeometry(1, 0.42, 1);
  const baldosas = [];
  NIVEL_PRUEBA.forEach((l, y) => [...l].forEach((c, x) => {
    const p = celda(x, y);
    const m = c === "#" ? new THREE.Mesh(geoPared, matPared) : new THREE.Mesh(geoPiso, juego.destinos[y][x] ? matDestino : matPiso);
    if (c === "#") { m.position.set(p.x, 0.21, p.z); m.castShadow = true; } else { m.rotation.x = -Math.PI / 2; m.position.copy(p); }
    m.receiveShadow = true;
    tablero.add(m);
    baldosas.push({ m, orden: x + y });
  }));
  const geoCaja = new RoundedBoxGeometry(0.8, 0.8, 0.8, 3, 0.06);
  const cajas = juego.cajas().map(([x, y]) => {
    const m = new THREE.Mesh(geoCaja, new THREE.MeshStandardMaterial({ map: textura("boxes/box_wood"), roughness: 0.75, emissive: new THREE.Color(t("acento")), emissiveMap: textura("boxes/box_wood"), emissiveIntensity: 0.12 }));
    m.position.copy(celda(x, y)).setY(0.4);
    m.castShadow = true; m.receiveShadow = true;
    m.userData = { x, y };
    tablero.add(m);
    return m;
  });
  const pj = crearPersonaje(0.62);
  pj.raiz.position.copy(celda(juego.x, juego.y));
  pj.raiz.rotation.y = GIRO.abajo;
  tablero.add(pj.raiz);

  // Órbita de los observadores
  const orbita = new THREE.Mesh(new THREE.TorusGeometry(R_ORBITA, 0.025, 8, 360), new THREE.MeshBasicMaterial({ color: new THREE.Color(t("linea")), transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
  orbita.rotation.x = Math.PI / 2;
  orbita.position.y = Y_ORBITA;
  escena.add(orbita);
  const onda = new THREE.Mesh(new THREE.RingGeometry(0.985, 1, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(t("linea")), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  onda.rotation.x = -Math.PI / 2;
  onda.position.y = 0.05;
  escena.add(onda);

  // Un haz por observador, del borde del núcleo a su lugar en la órbita
  const rutas = {};
  OBS.forEach((o) => {
    const fin = enOrbita(o.angulo);
    const ini = enOrbita(o.angulo, R_NUCLEO, 0.1);
    const medio = ini.clone().lerp(fin, 0.5).setY(3.2);
    const curva = new THREE.QuadraticBezierCurve3(ini, medio, fin);
    const h = haz(curva, "linea", 0.035, 0.55);
    h.userData.dibujar(0);
    escena.add(h);
    const pulso = chispa("exito", 0.9);
    escena.add(pulso);
    const nodo = chispa("linea", 0.8);
    nodo.position.copy(fin);
    escena.add(nodo);
    rutas[o.clave] = { curva, haz: h, pulso, nodo, fin, angulo: o.angulo };
  });

  // Polvo de luz alrededor
  const nPolvo = 420;
  const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: new THREE.Color(t("linea")), size: 0.07, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: nPolvo * 3 }, (_, i) => (i % 3 === 1 ? gsap.utils.random(-1, 9) : gsap.utils.random(-20, 20))), 3));
  escena.add(polvo);

  return { nucleo, base, anillo, latido, aroBajo, luzLatido, tablero, baldosas, cajas, pj, orbita, onda, rutas, polvo };
}

export default {
  montar(lienzo) {
    const juego = crearJuego();
    const w = mundo3d(lienzo, { descripcion: "Simulación del patrón Observer: el juego en 3D avisa cada movimiento a sus observadores en órbita", fov: 30, resplandor: [0.85, 0.5, 0.72] });
    el("div", "obs__velo", lienzo);
    const c = { juego, w, mira: "abajo", entrada: { v: 0 } };

    // Observadores: carteles HTML anclados a su lugar en la órbita
    const ancla = (clase) => el("div", "obs__ancla " + clase, lienzo);
    c.paneles = {};
    OBS.forEach((o) => {
      const a = ancla("obs__ancla--panel obs__ancla--" + o.clave);
      const p = el("div", "obs__panel obs__panel--" + o.clave, a);
      const cab = el("div", "obs__cab", p);
      el("p", "obs__clase", cab, { texto: o.nombre });
      const metodo = el("code", "obs__metodo", cab, { texto: "actualizar(estado)" });
      let dibujo = null;
      if (o.clave === "hud") dibujo = lienzo2d(p, "obs__dibujo", 370, 110);
      if (o.clave === "tablero") { dibujo = lienzo2d(p, "obs__dibujo obs__dibujo--tablero", 432, 270); el("i", "obs__barrido", p); }
      c.paneles[o.clave] = { a, p, metodo, dibujo };
    });

    c.avisoA = ancla("obs__ancla--aviso");
    c.aviso = el("code", "obs__aviso", c.avisoA);
    c.fotos = OBS.map(() => {
      const a = ancla("obs__ancla--foto");
      const f = el("div", "obs__foto", a);
      const d = lienzo2d(f, "", 96, 60);
      el("span", "", f, { texto: "EstadoJuego" });
      gsap.set(f, { autoAlpha: 0 });
      return { a, f, d };
    });

    // El sujeto: su lista de observadores y, en el paso 1, la foto completa que reparte
    c.sujeto = el("div", "obs__sujeto", lienzo);
    el("p", "obs__clase", c.sujeto, { html: "Juego <span>el sujeto, simulado con las reglas de JuegoSokoban en un nivel de prueba</span>" });
    const fila = el("div", "obs__fila", c.sujeto);
    c.lista = el("code", "obs__lista", fila, { texto: "observadores: [hud, tablero]" });
    c.registroEl = el("div", "obs__registro", c.sujeto);
    const regInt = el("div", "obs__registro-int", c.registroEl);
    el("p", "obs__registro-titulo", regInt, { html: "<code>notificar()</code> saca una foto <b>EstadoJuego</b> y le da la misma a cada uno" });
    const cuerpo = el("div", "obs__registro-cuerpo", regInt);
    const campos = el("dl", "obs__campos", cuerpo);
    c.campos = {};
    ["nivel", "movimientos", "empujes", "undosUsados", "puntaje", "completado"].forEach((k) => {
      const f = el("div", "", campos);
      el("dt", "", f, { texto: k });
      c.campos[k] = el("dd", "", f);
    });
    c.miniRegistro = lienzo2d(cuerpo, "obs__mini", 144, 90);

    if (w) {
      Object.assign(c, armarEscena(w, juego));
      w.camara.position.copy(CAMARA);
      w.mira.copy(MIRA);
      w.preparar();
      const tmp = new THREE.Vector3();
      w.cadaCuadro(() => {
        OBS.forEach((o) => anclar(c.paneles[o.clave].a, w.proyectar(c.rutas[o.clave].fin)));
        anclar(c.avisoA, w.proyectar(tmp.copy(c.pj.raiz.position).setY(1.6)));
      });
    } else {
      // Sin WebGL: el mismo mecanismo en 2D, con el tablero de baldosas y rutas SVG
      c.plano = tableroPixel(lienzo, NIVEL_PRUEBA, { b: 64, x: 250, y: 480, epoca: 2015 });
      const svg = svgEl("svg", { class: "svg", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
      c.rutas2d = {};
      OBS.forEach((o) => {
        const f = FIJO[o.clave];
        c.rutas2d[o.clave] = svgEl("path", { class: "conector", d: `M770,640 C1000,640 1080,${f.y} ${f.x},${f.y}` }, svg);
        anclar(c.paneles[o.clave].a, f);
      });
      anclar(c.avisoA, { x: 506, y: 470 });
      ubicar2d(c, 0);
    }
    const estado = juego.getEstado();
    actualizarRegistro(c, estado, null);
    Promise.all(Object.values(imagenes).concat(INDICADORES.map(imagen), Object.values(SPRITE).map(imagen), ["backgrounds/background_future_2015", "goals/goal_placed", "boxes/box_wood", "goals/goal", "tiles/floor_2015", "tiles/wall_future"].map(imagen))
      .map((i) => (i.decode ? i.decode().catch(() => null) : null))).then(() => {
      pintarHud(c.paneles.hud.dibujo, estado);
      pintarTablero(c.paneles.tablero.dibujo, estado.tablero, c.mira);
      pintarTablero(c.miniRegistro, estado.tablero, c.mira, false);
    });
    return c;
  },

  construir(tl, c) {
    const paneles = OBS.map((o) => c.paneles[o.clave].p);
    tl.set(c.registroEl, { height: 0 }, 0)
      .fromTo(c.entrada, { v: 0 }, { v: 1, duration: 3, ease: "none" }, 0);
    if (c.w) {
      const { camara } = c.w;
      tl.fromTo(camara.position, { x: 3, y: 26, z: 9 }, { x: CAMARA.x, y: CAMARA.y, z: CAMARA.z, duration: 2.8, ease: "power3.inOut" }, 0)
        .fromTo(c.base.scale, { x: 0.2, z: 0.2 }, { x: 1, z: 1, duration: 0.9, ease: "power3.out" }, 0.2)
        .fromTo([c.anillo.scale, c.aroBajo.scale], { x: 0.2, y: 0.2 }, { x: 1, y: 1, duration: 0.9, ease: "power3.out" }, 0.25)
        .fromTo(c.baldosas.sort((a, b) => a.orden - b.orden).map((b) => b.m.scale), { x: 0.01, y: 0.01, z: 0.01 }, { x: 1, y: 1, z: 1, duration: 0.4, ease: "back.out(1.6)", stagger: 0.018 }, 0.6)
        .fromTo(c.cajas.map((m) => m.position), { y: 4 }, { y: 0.4, duration: 0.6, ease: "bounce.out", stagger: 0.12 }, 1.3)
        .fromTo(c.pj.raiz.scale, { x: 0.01, y: 0.01, z: 0.01 }, { x: 0.62, y: 0.62, z: 0.62, duration: 0.5, ease: "back.out(2)" }, 1.6)
        .fromTo(c.orbita.material, { opacity: 0 }, { opacity: 0.32, duration: 1 }, 1.4)
        .fromTo(c.orbita.scale, { x: 0.6, y: 0.6 }, { x: 1, y: 1, duration: 1.2, ease: "power3.out" }, 1.4);
      ["tablero", "hud"].forEach((k, i) => {
        const avance = { f: 0 };
        tl.fromTo(avance, { f: 0 }, { f: 1, duration: 0.9, ease: "power2.inOut", onUpdate: () => c.rutas[k].haz.userData.dibujar(avance.f) }, 1.9 + i * 0.2)
          .fromTo(c.rutas[k].nodo.material, { opacity: 0 }, { opacity: 1, duration: 0.3 }, 2.6 + i * 0.2);
      });
    }
    tl.fromTo(c.sujeto, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 1.6)
      .fromTo(paneles.slice(0, 2), { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out", stagger: 0.2 }, 2.3);

    // Paso 1: la foto completa que reparte notificar()
    tl.addLabel("p1");
    tl.fromTo(c.registroEl, { height: 0 }, { height: "auto", duration: 0.7, ease: "power3.inOut" }, "p1")
      .fromTo(c.registroEl.firstChild, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, "p1+=0.3");
  },

  vida(c) {
    const vidas = [];
    if (c.w) {
      const tick = (tt) => {
        c.w.deriva.set(Math.sin(tt * 0.13) * 0.6, Math.sin(tt * 0.19 + 1.1) * 0.35, 0);
        c.anillo.material.opacity = 0.6 + Math.sin(tt * 1.7) * 0.15;
        c.polvo.rotation.y = tt * 0.012;
        c.orbita.rotation.z = tt * 0.02;
        c.pj.cabeza.rotation.y = Math.sin(tt * 0.6) * 0.25;
        OBS.forEach((o, i) => c.rutas[o.clave].nodo.scale.setScalar(0.7 + Math.sin(tt * (1.1 + i * 0.3) + i) * 0.12));
      };
      gsap.ticker.add(tick);
      vidas.push({ kill: () => gsap.ticker.remove(tick) });
    }
    let festejo = 0;
    vidas.push(eventos(() => {
      if (c.entrada.v < 1) return;
      const j = c.juego;
      if (j.completo()) {
        festejo += 1;
        if (festejo < 3) return;
        festejo = 0;
        j.iniciarNivel();
        c.mira = "abajo";
        decir(c, "reiniciar()");
        acomodar(c, 0.6);
        notificar(c);
        return;
      }
      const bloqueadas = Object.keys(DELTA).filter((d) => { const [dx, dy] = DELTA[d]; return j.celdas[j.y + dy][j.x + dx] === "#"; });
      if (bloqueadas.length && Math.random() < 0.1) {
        const d = gsap.utils.random(bloqueadas);
        c.mira = d;
        chocar(c, d);
        decir(c, `mover(${d.toUpperCase()}): no cambia nada, no avisa`, true);
        if (c.paneles.tablero.dibujo) pintarTablero(c.paneles.tablero.dibujo, j.getEstado().tablero, c.mira);
        return;
      }
      if (j.mov >= 7 && j.undos === 0 && Math.random() < 0.14) {
        j.deshacer();
        decir(c, "deshacer(): 5 pasos atrás");
        acomodar(c, 0.5);
        notificar(c);
        return;
      }
      const d = PLAN[j.mov];
      const r = j.mover(d);
      c.mira = d;
      decir(c, `mover(${d.toUpperCase()})`);
      caminar(c, d, r);
      notificar(c);
      if (j.completo()) gsap.delayedCall(0.5, () => decir(c, "completado: true. Hasta reiniciar(), mover() no avisa", true));
    }, [1.05, 2.1]));
    return juntas(...vidas);
  },

  desmontar(c) { if (c.w) c.w.destruir(); },
};

function decir(c, texto, apagado = false) {
  c.aviso.textContent = texto;
  c.aviso.classList.toggle("obs__aviso--apagado", apagado);
  gsap.fromTo(c.aviso, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.25, overwrite: true });
  gsap.to(c.aviso, { autoAlpha: 0, duration: 0.4, delay: apagado ? 2.2 : 0.9 });
}

/** El personaje gira, camina una baldosa y, si empuja, la caja avanza con él. */
function caminar(c, d, r) {
  if (!c.w) { ubicar2d(c, 0.3); return; }
  const { pj } = c;
  girar(c, d);
  const destino = celda(c.juego.x, c.juego.y);
  gsap.to(pj.raiz.position, { x: destino.x, z: destino.z, duration: 0.36, ease: "power1.inOut" });
  const paso = { f: 0 };
  gsap.to(paso, { f: Math.PI * 2, duration: 0.36, ease: "none", onUpdate: () => { pj.pose.piernaI = -Math.sin(paso.f) * 0.6; pj.pose.piernaD = Math.sin(paso.f) * 0.6; pj.pose.brazoI = r && r.empuja ? -1.45 : Math.sin(paso.f) * 0.5; pj.pose.brazoD = r && r.empuja ? -1.45 : -Math.sin(paso.f) * 0.5; pj.aplicar(); },
    onComplete: () => { Object.assign(pj.pose, { piernaI: 0, piernaD: 0, brazoI: 0, brazoD: 0 }); pj.aplicar(); } });
  if (r && r.empuja) {
    const caja = c.cajas.find((m) => m.userData.x === r.de[0] && m.userData.y === r.de[1]);
    if (caja) { caja.userData = { x: r.a[0], y: r.a[1] }; const p = celda(r.a[0], r.a[1]); gsap.to(caja.position, { x: p.x, z: p.z, duration: 0.36, ease: "empuje" }); }
  }
  gsap.delayedCall(0.36, () => brillarCajas(c));
}

function girar(c, d) {
  const actual = c.pj.raiz.rotation.y;
  let delta = GIRO[d] - actual;
  delta = Math.atan2(Math.sin(delta), Math.cos(delta));
  gsap.to(c.pj.raiz.rotation, { y: actual + delta, duration: 0.15 });
}

function chocar(c, d) {
  if (!c.w) { mirar(c.plano.jugador, d); return; }
  girar(c, d);
  const [dx, dy] = DELTA[d];
  gsap.fromTo(c.pj.raiz.position, { x: celda(c.juego.x, 0).x, z: celda(0, c.juego.y).z }, { x: `+=${dx * 0.18}`, z: `+=${dy * 0.18}`, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out" });
}

/** Después de deshacer o reiniciar, las cajas y el personaje vuelven a donde dice el estado. */
function acomodar(c, dur) {
  if (!c.w) { ubicar2d(c, dur); return; }
  const libres = c.juego.cajas().filter(([x, y]) => !c.cajas.some((m) => m.userData.x === x && m.userData.y === y));
  c.cajas.forEach((m) => {
    if (c.juego.celdas[m.userData.y][m.userData.x] === "$") return;
    const [x, y] = libres.shift();
    m.userData = { x, y };
  });
  c.cajas.forEach((m) => { const p = celda(m.userData.x, m.userData.y); gsap.to(m.position, { x: p.x, z: p.z, duration: dur, ease: "power2.inOut" }); });
  const p = celda(c.juego.x, c.juego.y);
  gsap.to(c.pj.raiz.position, { x: p.x, z: p.z, duration: dur, ease: "power2.inOut" });
  girar(c, c.mira);
  gsap.delayedCall(dur, () => brillarCajas(c));
}

/** Sin WebGL: las fichas del tablero 2D van a donde dice el estado. */
function ubicar2d(c, dur) {
  const { plano, juego } = c;
  juego.cajas().forEach(([x, y], i) => {
    gsap.to(plano.cajas[i], { x: x * plano.b, y: y * plano.b, duration: dur, ease: "empuje" });
    plano.cajas[i].classList.toggle("ficha--en-destino", juego.destinos[y][x]);
  });
  mirar(plano.jugador, c.mira);
  gsap.to(plano.jugador, { x: juego.x * plano.b, y: juego.y * plano.b, duration: dur, ease: "power2.out" });
}

function brillarCajas(c) {
  c.cajas.forEach((m) => gsap.to(m.material, { emissiveIntensity: c.juego.destinos[m.userData.y][m.userData.x] ? 0.9 : 0.12, duration: 0.4 }));
}

/** notificar(): una sola foto (getEstado) para cada observador de la lista, en orden. */
function notificar(c) {
  const estado = c.juego.getEstado();
  const mira = c.mira;
  actualizarRegistro(c, estado, c.ultimo);
  c.ultimo = estado;
  const lista = ["hud", "tablero"];
  const color = estado.completado ? "acento" : "linea";
  if (c.w) {
    gsap.fromTo(c.latido.material, { opacity: 0.9 }, { opacity: 0, duration: 0.9, ease: "power2.out" });
    gsap.fromTo(c.luzLatido, { intensity: 40 }, { intensity: 0, duration: 0.9, ease: "power2.out" });
    gsap.fromTo(c.nucleo.scale, { x: 1.025, z: 1.025 }, { x: 1, z: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" });
    c.onda.material.color.set(t(color));
    gsap.fromTo(c.onda.scale, { x: R_NUCLEO, y: R_NUCLEO }, { x: R_ORBITA, y: R_ORBITA, duration: 0.75, ease: "power2.out" });
    gsap.fromTo(c.onda.material, { opacity: 0.9 }, { opacity: 0, duration: 0.75, ease: "power1.in" });
  }
  lista.forEach((k, i) => {
    const foto = c.fotos[i];
    pintarTablero(foto.d, estado.tablero, mira, false);
    const llega = () => recibir(c, k, estado, mira);
    const ruta = c.w ? c.rutas[k] : null, prog = { f: 0 }, tmp = new THREE.Vector3();
    gsap.fromTo(prog, { f: 0 }, {
      f: 1, duration: 0.7, ease: "power1.inOut", delay: i * 0.05,
      onStart: () => gsap.set(foto.f, { autoAlpha: 1 }),
      onUpdate: () => {
        if (!ruta) { anclar(foto.a, puntoEn(c.rutas2d[k], prog.f), 0.85); return; }
        ruta.curva.getPoint(prog.f, tmp);
        ruta.pulso.position.copy(tmp);
        ruta.pulso.material.opacity = Math.sin(prog.f * Math.PI);
        anclar(foto.a, c.w.proyectar(tmp), 0.7 + prog.f * 0.3);
        gsap.set(foto.f, { autoAlpha: prog.f > 0.8 ? (1 - prog.f) / 0.2 : 1 }); // entra en el nodo del observador
      },
      onComplete: () => { gsap.to(foto.f, { autoAlpha: 0, duration: 0.15 }); llega(); },
    });
  });
}

/** actualizar(estado) de cada observador. */
function recibir(c, k, estado, mira) {
  const panel = c.paneles[k];
  gsap.fromTo(panel.p, { "--golpe": 1 }, { "--golpe": 0, duration: 0.8, ease: "power2.out" });
  gsap.fromTo(panel.metodo, { "--golpe": 1 }, { "--golpe": 0, duration: 0.9, ease: "power2.out" });
  if (c.w) gsap.fromTo(c.rutas[k].nodo.scale, { x: 2, y: 2 }, { x: 0.8, y: 0.8, duration: 0.5 });
  if (k === "hud") pintarHud(panel.dibujo, estado);
  if (k === "tablero") {
    pintarTablero(panel.dibujo, estado.tablero, mira);
    gsap.fromTo(panel.p.querySelector(".obs__barrido"), { yPercent: -100, autoAlpha: 1 }, { yPercent: 100, autoAlpha: 0, duration: 0.45, ease: "power1.in" });
  }
}

function actualizarRegistro(c, estado, antes) {
  Object.entries(c.campos).forEach(([k, dd]) => {
    dd.textContent = String(estado[k]);
    const cambio = antes && antes[k] !== estado[k];
    if (cambio) gsap.fromTo(dd, { "--golpe": 1 }, { "--golpe": 0, duration: 1.2, ease: "power2.out" });
  });
  if (antes) pintarTablero(c.miniRegistro, estado.tablero, c.mira, false);
}
