import * as THREE from "three";
import { gsap } from "gsap";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { t, img, el, eventos, juntas } from "../util.js";
import { crearVista, cargando, orbitar } from "../vista3d.js";
import { PANTALLAS } from "../datos.js";
import { crearPersonaje } from "../personaje3d.js";

/*
 * Las cinco capturas reales del juego flotan en el espacio como monitores. Las une el recorrido real de quien juega,
 * hecho con tubos de luz. El personaje camina por los tubos y la cámara lo sigue de pantalla en pantalla:
 * elige nivel, Esc, Continuar, cajas en destino, siguiente nivel y último nivel, donde festeja.
 * Cada tramo recorrido queda encendido en naranja (lo que ya está en su lugar).
 */
const TEX_W = 1024, TEX_H = 640;               // tamaño real de las capturas
const ASPECTO = TEX_H / TEX_W;
const FOV = 30;
const TAN_H = Math.tan((FOV * Math.PI) / 360) * (16 / 9); // medio ángulo horizontal en 16:9

/** Dónde flota cada pantalla (metros de la escena) y qué clase de la vista la dibuja. */
const LUGAR = {
  menu: { p: [-7.2, -2.6, 0.6], w: 3.2, giro: 0.28, clase: "MenuPrincipal" },
  partida: { p: [-1.8, -0.7, -0.8], w: 4.2, giro: 0.06, clase: "PantallaJuego" },
  pausa: { p: [0.75, -4.15, 2.4], w: 2.4, giro: 0.08, clase: "Cartel", rotuloIzq: true },
  completado: { p: [4.3, -1.6, 0.4], w: 3.2, giro: -0.2, clase: "Cartel" },
  resultados: { p: [6.7, 2.6, -2.0], w: 3.2, giro: -0.3, clase: "Cartel" },
};
const BAJO = 0.5; // distancia de la pantalla a su estación, donde llegan los tubos

/** El recorrido en orden. Cada tramo sale y llega a la estación de su pantalla pasando por "por".
 *  Las ramas (volver) son más finas y su rótulo solo aparece cuando se usan. */
const TRAMOS = [
  { de: "menu", a: "partida", txt: "elige nivel", f: 0.42, por: [[-6.9, -4.6, 1.3], [-4.6, -4.0, 1.0], [-2.7, -3.1, 0.2]] },
  { de: "partida", a: "pausa", txt: "Esc", f: 0.5, por: [[-1.7, -3.3, 0.5], [-1.0, -5.0, 2.2], [0.0, -5.6, 2.7]] },
  { de: "pausa", a: "partida", txt: "Continuar", f: 0.45, rama: true, por: [[0.2, -5.95, 3.2], [-1.7, -5.1, 2.9], [-2.4, -3.4, 1.2]] },
  { de: "partida", a: "completado", txt: "cajas en destino", f: 0.9, por: [[-1.0, -3.2, 0.2], [1.6, -3.3, 0.9], [3.8, -3.8, 1.1]] },
  { de: "completado", a: "partida", txt: "siguiente nivel", f: 0.45, rama: true, por: [[4.0, -3.6, 0.2], [2.0, -2.9, -1.0], [-0.4, -2.9, -0.8]] },
  { de: "partida", a: "resultados", txt: "último nivel", f: 0.64, por: [[-1.2, -3.0, -0.9], [0.9, -2.4, -1.6], [1.4, 0.2, -1.9], [3.6, 0.8, -2.0], [5.6, 0.4, -1.7]] },
];

/** Botones de las capturas que se iluminan cuando se usan (en píxeles de la captura). */
const BOTON = {
  menu: [418, 348, 511, 386],          // Nivel 2 (la partida muestra NIV 002)
  pausaHud: [714, 17, 768, 70],        // botón de pausa del HUD
  pausa: [341, 348, 457, 386],         // Continuar
  completado: [327, 348, 481, 386],    // Siguiente nivel
  resultados: [527, 348, 610, 386],    // Menú
};
const HUD_ALTO = 88;                   // la franja del HUD en la captura de la partida
const INDICADORES = [[236, 296], [314, 374], [392, 452]];
const BOTONES_HUD = [[490, 544], [602, 656], [714, 768]];

/** Tomas de cámara: 0 vista general, después cada pantalla, el HUD de cerca y la vista general final. */
const TOMAS = ["general", "menu", "partida", "hud", "pausa", "completado", "resultados", "final"];
const SIGUE = [0, 0, 0.55, 0, 0.5, 0.42, 0.42, 0]; // cuánto se acerca la cámara al personaje en cada vuelo
const suave = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };

/** Blanco del papel (token) con transparencia, para las máscaras que después tiñe cada material. */
function blanco(a) {
  const h = t("papel").replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

function colorLuz(k, f = 1) { return new THREE.Color(t(k)).multiplyScalar(f); }

/**
 * La captura a su tamaño real (1024 × 640): en cada toma ocupa más o menos lo mismo en pantalla, así que alcanza.
 * Solo la franja del HUD, que la cámara mira de muy cerca, va al triple con vecino más cercano (nítida y sin escalones).
 * Antes eran cinco texturas de 2048 × 1280 con mipmaps: unos 70 MB de memoria de video; ahora son unos 20.
 */
function texturaCaptura(clave, renderer, { y0 = 0, y1 = TEX_H, aumento = 1 } = {}) {
  const lienzo = document.createElement("canvas");
  lienzo.width = TEX_W * aumento; lienzo.height = (y1 - y0) * aumento;
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = aumento > 1 ? THREE.LinearFilter : THREE.NearestFilter;
  const imagen = new Image();
  cargando(new Promise((listo) => {
    imagen.onload = () => {
      const g = lienzo.getContext("2d");
      g.imageSmoothingEnabled = false;
      g.drawImage(imagen, 0, y0, TEX_W, y1 - y0, 0, 0, lienzo.width, lienzo.height);
      tex.needsUpdate = true;
      listo();
    };
    imagen.onerror = listo;
  }));
  imagen.src = img("medios/" + clave);
  return tex;
}

/** Un plano que muestra solo una franja de la captura (filas y0 a y1, en píxeles). completa: la textura es la franja sola. */
function franja(ancho, y0, y1, material, completa = false) {
  const alto = ancho * ((y1 - y0) / TEX_W);
  const geo = new THREE.PlaneGeometry(ancho, alto);
  const uv = geo.attributes.uv;
  if (!completa) for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) > 0.5 ? 1 - y0 / TEX_H : 1 - y1 / TEX_H);
  return new THREE.Mesh(geo, material);
}

function punto() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, blanco(1)); gr.addColorStop(0.3, blanco(0.55)); gr.addColorStop(1, blanco(0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/** Marco redondeado que se enciende alrededor de un botón de la captura. */
function marcoBoton() {
  const c = document.createElement("canvas"); c.width = 256; c.height = 128;
  const g = c.getContext("2d");
  g.strokeStyle = blanco(1); g.lineWidth = 10;
  g.beginPath(); g.roundRect(8, 8, 240, 112, 22); g.stroke();
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

function rejilla() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  g.strokeStyle = blanco(0.9); g.lineWidth = 2;
  g.strokeRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(60, 60);
  tex.anisotropy = 8;
  return tex;
}

/** Sin WebGL: las cinco capturas en fila, con su nombre. */
function respaldo(lienzo) {
  const fila = el("div", "interfaz__respaldo", lienzo);
  PANTALLAS.forEach((pa) => {
    const f = el("figure", "interfaz__respaldo-item", fila);
    el("img", "", f, { src: img("medios/" + pa.clave), alt: pa.alt });
    el("figcaption", "", f, { texto: pa.nombre });
  });
  return { sin3d: true, fila };
}

export default {
  montar(lienzo, { slide }) {
    // Sin mapeo de tonos: las capturas se ven con sus colores reales
    const vista = crearVista(lienzo, { aria: "Las cinco pantallas reales del juego flotando en 3D, unidas por el recorrido del jugador: menú, partida, pausa, nivel completado y resultados", tono: THREE.NoToneMapping, sombras: false });
    if (!vista) return respaldo(lienzo);
    const { renderer, W, H } = vista;
    const EX = vista.ex, EY = vista.ey;
    const velo = el("div", "interfaz__velo", lienzo);
    const capa = el("div", "interfaz__capa", lienzo, { "aria-hidden": "true" });

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(t("fondo-hondo"));
    escena.fog = new THREE.Fog(t("fondo-hondo"), 16, 46);
    const camara = vista.camara(FOV, 0.1, 200);

    escena.add(new THREE.HemisphereLight(t("superficie-2"), t("fondo-hondo"), 2.2));
    const sol = new THREE.DirectionalLight(t("tinta-2"), 1.6);
    sol.position.set(4, 8, 10);
    escena.add(sol);

    // Piso de rejilla que se pierde en la niebla, para que el espacio tenga profundidad
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshBasicMaterial({ map: rejilla(), color: colorLuz("linea", 0.22), transparent: true, opacity: 0.55, depthWrite: false }));
    piso.rotation.x = -Math.PI / 2; piso.position.y = -7.2;
    escena.add(piso);
    const mapaPunto = punto();
    const nPolvo = 700;
    const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: colorLuz("titulo", 0.9), map: mapaPunto, size: 0.09, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: nPolvo * 3 }, (_, i) => (i % 3 === 0 ? gsap.utils.random(-30, 30) : i % 3 === 1 ? gsap.utils.random(-7, 14) : gsap.utils.random(-30, 6))), 3));
    escena.add(polvo);

    // Pantallas: marco, borde de luz y la captura. El grupo gira desde su base, así los tubos nunca se despegan.
    const geoMarco = new RoundedBoxGeometry(1, 1, 1, 4, 0.04);
    const pantallas = {};
    PANTALLAS.forEach((pa) => {
      const l = LUGAR[pa.clave];
      const w = l.w, h = w * ASPECTO;
      const base = new THREE.Group();                       // la base es la estación donde llegan los tubos
      base.position.set(l.p[0], l.p[1] - h / 2 - BAJO, l.p[2] + 0.45);
      base.rotation.y = l.giro;
      escena.add(base);
      const g = new THREE.Group();
      g.position.set(0, BAJO + h / 2, -0.45);
      base.add(g);
      const marco = new THREE.Mesh(geoMarco, new THREE.MeshStandardMaterial({ color: t("superficie"), metalness: 0.55, roughness: 0.35, transparent: true }));
      marco.scale.set(w + 0.2, h + 0.2, 0.12);
      g.add(marco);
      const borde = new THREE.Mesh(geoMarco, new THREE.MeshBasicMaterial({ color: colorLuz("linea", 1.05), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      borde.scale.set(w + 0.3, h + 0.3, 0.05);
      borde.position.z = -0.05;
      g.add(borde);
      const tex = texturaCaptura(pa.clave, renderer);
      const matCaptura = new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(0.93, 0.93, 0.93), fog: false });
      const pantalla = new THREE.Group();
      pantalla.position.z = 0.065;
      g.add(pantalla);
      let hud = null;
      if (pa.clave === "partida") {
        const tablero = franja(w, HUD_ALTO, TEX_H, matCaptura);
        tablero.position.y = -w * (HUD_ALTO / TEX_W) / 2;
        const texHud = texturaCaptura(pa.clave, renderer, { y0: 0, y1: HUD_ALTO, aumento: 3 });
        hud = franja(w, 0, HUD_ALTO, new THREE.MeshBasicMaterial({ map: texHud, color: new THREE.Color(0.93, 0.93, 0.93), fog: false }), true);
        hud.position.y = h / 2 - w * (HUD_ALTO / TEX_W) / 2;
        const bordeHud = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: marcoBoton(), color: colorLuz("exito", 1.3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        bordeHud.scale.set(w + 0.12, w * (HUD_ALTO / TEX_W) + 0.12, 1);
        bordeHud.position.z = 0.005;
        hud.add(bordeHud);
        hud.userData = { y0: hud.position.y, borde: bordeHud };
        pantalla.add(tablero, hud);
      } else {
        pantalla.add(new THREE.Mesh(new THREE.PlaneGeometry(w, h), matCaptura));
      }
      const destello = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: colorLuz("tinta", 1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      destello.position.z = 0.08;
      g.add(destello);
      const estacion = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 40), new THREE.MeshBasicMaterial({ color: colorLuz("linea", 1.8), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      estacion.rotation.x = -Math.PI / 2;
      base.add(estacion);
      const nombre = el("div", "interfaz__nombre" + (l.rotuloIzq ? " interfaz__nombre--izq" : ""), capa);
      el("span", "interfaz__nombre-pantalla", nombre, { texto: pa.nombre });
      el("span", "interfaz__nombre-clase", nombre, { texto: l.clase });
      const onda = new THREE.Mesh(new THREE.RingGeometry(0.26, 0.34, 48), new THREE.MeshBasicMaterial({ color: colorLuz("acento", 1.8), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      onda.rotation.x = -Math.PI / 2;
      base.add(onda);
      pantallas[pa.clave] = { clave: pa.clave, base, g, w, h, marco, borde, pantalla, matCaptura, destello, estacion, hud, nombre, tex, onda, llegada: { v: 0 }, izq: !!l.rotuloIzq, prendida: { v: 0 }, foco: 0 };
    });
    escena.updateMatrixWorld(true);

    // Botones que se iluminan cuando el jugador los usa
    const texMarco = marcoBoton();
    const botones = {};
    Object.entries(BOTON).forEach(([k, [x0, y0, x1, y1]]) => {
      const p = pantallas[k === "pausaHud" ? "partida" : k];
      const padre = k === "pausaHud" ? p.hud : p.pantalla;
      const esc = p.w / TEX_W;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: texMarco, color: colorLuz("acento", 1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      m.scale.set((x1 - x0) * esc * 1.22, (y1 - y0) * esc * 1.45, 1);
      const cx = ((x0 + x1) / 2 - TEX_W / 2) * esc;
      const cy = k === "pausaHud" ? (HUD_ALTO / 2 - (y0 + y1) / 2) * esc : (TEX_H / 2 - (y0 + y1) / 2) * esc;
      m.position.set(cx, cy, 0.02);
      padre.add(m);
      botones[k] = { m, v: { v: 0 } };
    });

    // Tubos de luz: un núcleo celeste, un halo y la estela naranja de lo ya recorrido
    const geoTubo = (curva, r) => new THREE.TubeGeometry(curva, 220, r, 10, false);
    const porSegmento = 10 * 6;
    const puerto = (k) => pantallas[k].base.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.02, 0));
    const tramos = TRAMOS.map((tr) => {
      const curva = new THREE.CatmullRomCurve3([puerto(tr.de), ...tr.por.map((q) => new THREE.Vector3(...q)), puerto(tr.a)], false, "centripetal");
      const r = tr.rama ? 0.7 : 1;
      const nucleo = new THREE.Mesh(geoTubo(curva, 0.026 * r), new THREE.MeshBasicMaterial({ color: colorLuz("linea", tr.rama ? 1.0 : 1.3), transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
      const halo = new THREE.Mesh(geoTubo(curva, 0.08 * r), new THREE.MeshBasicMaterial({ color: colorLuz("linea", 0.4), transparent: true, opacity: tr.rama ? 0.07 : 0.13, depthWrite: false, blending: THREE.AdditiveBlending }));
      const estela = new THREE.Mesh(geoTubo(curva, 0.042 * r), new THREE.MeshBasicMaterial({ color: colorLuz("acento", 1.55), depthWrite: false, blending: THREE.AdditiveBlending, transparent: true }));
      [nucleo, halo, estela].forEach((m) => { m.frustumCulled = false; escena.add(m); });
      const etiqueta = el("div", "interfaz__accion", capa, { texto: tr.txt });
      return { ...tr, curva, nucleo, halo, estela, etiqueta, trazo: { v: 0 }, medio: curva.getPointAt(tr.f), largo: curva.getLength() };
    });
    const dibujarHasta = (m, f) => m.geometry.setDrawRange(0, Math.floor(Math.max(0, Math.min(1, f)) * 220) * porSegmento);

    // Pulsos de luz que recorren los tubos (vida)
    const pulsos = Array.from({ length: 6 }, () => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mapaPunto, color: colorLuz("linea", 3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      sp.scale.setScalar(0.42);
      escena.add(sp);
      return { sp, tramo: null, f: 0 };
    });

    // El personaje del juego, hecho con los píxeles del sprite
    const pj = crearPersonaje(0.34);
    escena.add(pj.raiz);

    // Notas del HUD de cerca
    const llaves = [
      { el: el("div", "interfaz__llave", capa), txt: "nivel, movimientos y empujes", de: INDICADORES[0][0], a: INDICADORES[2][1] },
      { el: el("div", "interfaz__llave", capa), txt: "deshacer, reiniciar y pausa", de: BOTONES_HUD[0][0], a: BOTONES_HUD[2][1] },
    ];
    llaves.forEach((l) => el("span", "interfaz__llave-texto", l.el, { texto: l.txt }));
    const claseHud = el("div", "interfaz__clase", capa, { texto: "PanelHUD" });
    const claseTablero = el("div", "interfaz__clase interfaz__clase--tablero", capa, { texto: "PanelTablero" });

    // Tomas de cámara
    const arriba = new THREE.Vector3(0, 1, 0);
    function toma(centro, normal, ancho, { llenar = 0.6, dx = 0.06, dy = 0.05, az = 0, el: elev = 0.08 } = {}) {
      const d = ancho / llenar / (2 * TAN_H);
      const dir = normal.clone().applyAxisAngle(arriba, az);
      dir.y += elev; dir.normalize();
      const der = new THREE.Vector3().crossVectors(arriba, dir).normalize();
      const sube = new THREE.Vector3().crossVectors(dir, der).normalize();
      const vw = 2 * d * TAN_H, vh = vw * 9 / 16;
      const corrimiento = der.multiplyScalar(-dx * vw).add(sube.multiplyScalar(dy * vh));
      const mira = centro.clone().add(corrimiento);
      return { pos: mira.clone().add(dir.multiplyScalar(d)), mira };
    }
    const datos = (k) => {
      const p = pantallas[k];
      const centro = p.g.getWorldPosition(new THREE.Vector3());
      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(p.g.getWorldQuaternion(new THREE.Quaternion()));
      return { p, centro, normal };
    };
    const tomas = TOMAS.map((k) => {
      if (k === "general") return { pos: new THREE.Vector3(0.4, 0.8, 23), mira: new THREE.Vector3(0, -1.2, 0) };
      if (k === "final") return { pos: new THREE.Vector3(-1.8, 3.6, 23), mira: new THREE.Vector3(0.2, -0.85, 0) };
      if (k === "hud") {
        const { p, normal } = datos("partida");
        const centroHud = p.hud.localToWorld(new THREE.Vector3(((INDICADORES[0][0] + BOTONES_HUD[2][1]) / 2 - TEX_W / 2) * (p.w / TEX_W), -0.12, 0.8));
        return toma(centroHud, normal, (BOTONES_HUD[2][1] - INDICADORES[0][0]) * (p.w / TEX_W), { llenar: 0.5, dx: 0.03, dy: -0.015, az: -0.4, el: 0.02 });
      }
      const { p, centro, normal } = datos(k);
      return toma(centro, normal, p.w, { llenar: 0.54, dx: 0.03, dy: -0.045, az: k === "menu" ? -0.12 : 0.1, el: 0.06 });
    });
    const grua = { pos: new THREE.Vector3(9, 22, 30), mira: new THREE.Vector3(1, -2, -2) };

    // Estado que mueve el timeline; el cuadro se calcula entero desde acá (sirve para ir y volver)
    const est = { cam: { v: -1 }, ruta: { s: 0 }, aparece: { v: 0 }, todo: { v: 1 }, hud: { v: 0 }, notas: { v: 0 }, salto: { v: 0 } };
    const deriva = { x: 0, y: 0, z: 0 };
    const vPos = new THREE.Vector3(), vMira = new THREE.Vector3(), tmp = new THREE.Vector3(), proy = new THREE.Vector3();

    const posRuta = (s) => {
      const i = Math.max(0, Math.min(tramos.length - 1, Math.floor(s)));
      const f = Math.max(0, Math.min(1, s - i));
      return { i, f, punto: tramos[i].curva.getPointAt(f), tan: tramos[i].curva.getTangentAt(Math.min(0.999, Math.max(0.001, f))) };
    };

    function camaraEn(v, pos, mira) {
      if (v <= 0) {
        const k = v + 1;
        pos.lerpVectors(grua.pos, tomas[0].pos, k); mira.lerpVectors(grua.mira, tomas[0].mira, k);
        return;
      }
      const i = Math.min(tomas.length - 2, Math.floor(v)), f = v - i;
      const a = tomas[i], b = tomas[i + 1];
      pos.lerpVectors(a.pos, b.pos, f); mira.lerpVectors(a.mira, b.mira, f);
      const arco = Math.sin(Math.PI * f);
      pos.z += arco * 1.4; pos.y += arco * 0.5;
      const k = SIGUE[i + 1] * arco;
      if (k > 0) {
        const r = posRuta(est.ruta.s).punto;
        tmp.set(r.x + 0.4, r.y + 1.1, r.z + 4.6);
        pos.lerp(tmp, k);
        mira.lerp(tmp.set(r.x, r.y + 0.3, r.z), k);
      }
    }

    function proyectar(v) {
      proy.copy(v).project(camara);
      return { x: (proy.x + 1) / 2 * W - EX, y: (1 - proy.y) / 2 * H - EY, visible: proy.z < 1 && Math.abs(proy.x) < 1.3 && Math.abs(proy.y) < 1.3 };
    }
    const colocar = (e, p, alfa) => {
      e.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      e.style.opacity = p.visible ? alfa.toFixed(3) : 0;
    };

    const LUZ_LINEA = colorLuz("linea", 1.05), LUZ_ACENTO = colorLuz("acento", 1.3);
    let caminaba = false;
    function actualizar() {
      // Cámara
      camaraEn(est.cam.v, vPos, vMira);
      camara.position.set(vPos.x + deriva.x, vPos.y + deriva.y, vPos.z + deriva.z);
      camara.lookAt(vMira);
      orbitar(camara, vMira, vista.orbita);
      camara.updateMatrixWorld();

      // Pantallas que se prenden como un monitor viejo
      Object.values(pantallas).forEach((p) => {
        const s = p.prendida.v;
        p.g.visible = s > 0.001;
        p.g.scale.setScalar(0.85 + 0.15 * suave(0, 0.4, s));
        p.pantalla.scale.set(Math.min(1, s / 0.25 + 0.02), Math.max(0.01, suave(0.25, 0.85, s)), 1);
        const ll = p.llegada.v, enOnda = ll > 0 && ll < 1;
        p.onda.scale.setScalar(1 + ll * 7);
        p.onda.material.opacity = enOnda ? (1 - ll) * 0.9 : 0;
        p.destello.material.opacity = (s < 1 ? Math.sin(Math.PI * s) * 0.9 : 0) + (enOnda ? Math.sin(Math.PI * ll) * 0.12 : 0);
        p.destello.scale.y = Math.max(0.01, suave(0.25, 0.85, s));
        p.marco.material.opacity = suave(0, 0.3, s);
        p.estacion.scale.setScalar(suave(0.3, 1, s));
      });

      // Tubos que se dibujan y estela de lo recorrido
      const s = est.ruta.s;
      tramos.forEach((tr, i) => {
        dibujarHasta(tr.nucleo, tr.trazo.v); dibujarHasta(tr.halo, tr.trazo.v);
        dibujarHasta(tr.estela, Math.min(tr.trazo.v, s - i));
      });

      // Personaje
      const r = posRuta(s);
      pj.raiz.position.copy(r.punto).add(tmp.set(0, 0.03, 0));
      const enCamino = r.f > 0.001 && r.f < 0.999 && s < tramos.length;
      const rumbo = Math.atan2(r.tan.x, r.tan.z);
      const borde = Math.min(suave(0, 0.08, r.f), 1 - suave(0.92, 1, r.f));
      if (enCamino || caminaba) pj.raiz.rotation.y = enCamino ? rumbo * borde : 0;
      const ap = est.aparece.v;
      pj.raiz.visible = ap > 0.001;
      pj.raiz.position.y += (1 - ap) * 3 + est.salto.v * 0.45;
      if (enCamino) { pj.correr(((s * tramos[r.i].largo) / 0.32) % (Math.PI * 2), 0.8); caminaba = true; }
      else if (caminaba) { Object.assign(pj.pose, { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0 }); pj.aplicar(); caminaba = false; }

      // Pantalla en foco: su borde pasa de celeste a naranja
      Object.values(pantallas).forEach((p) => {
        p.foco = Math.max(...TOMAS.map((k, i) => (k === p.clave || (k === "hud" && p.clave === "partida") ? 1 - Math.min(1, Math.abs(est.cam.v - i) * 1.5) : 0)));
        p.borde.material.color.copy(LUZ_LINEA).lerp(LUZ_ACENTO, p.foco);
      });
      const hp = pantallas.partida.hud;
      const hv = est.hud.v;
      hp.position.set(0, hp.userData.y0 + hv * 0.18, hv * 0.75);
      hp.scale.setScalar(1 + hv * 0.06);
      hp.userData.borde.material.opacity = hv * 0.9;
      Object.values(botones).forEach((b) => { b.m.material.opacity = b.v.v; });

      // Rótulos en pantalla
      const todo = est.todo.v;
      Object.values(pantallas).forEach((p) => {
        const esquina = p.g.localToWorld(tmp.set((p.izq ? -1 : 1) * (p.w / 2 + 0.1), p.h / 2 + 0.12, 0.06));
        colocar(p.nombre, proyectar(esquina), Math.max(todo, p.foco) * suave(0.6, 1, p.prendida.v) * (1 - hv));
      });
      tramos.forEach((tr, i) => {
        const activo = 1 - Math.min(1, Math.abs(s - (i + 0.5)) * 1.4);
        colocar(tr.etiqueta, proyectar(tr.medio), Math.max(tr.rama ? 0 : todo, activo) * suave(0.5, 1, tr.trazo.v));
      });
      const nv = est.notas.v;
      const esc = pantallas.partida.w / TEX_W;
      llaves.forEach((l) => {
        const a = proyectar(hp.localToWorld(tmp.set((l.de - TEX_W / 2) * esc, -HUD_ALTO / 2 * esc - 0.05, 0)));
        const b = proyectar(hp.localToWorld(tmp.set((l.a - TEX_W / 2) * esc, -HUD_ALTO / 2 * esc - 0.05, 0)));
        l.el.style.width = Math.max(0, b.x - a.x).toFixed(1) + "px";
        colocar(l.el, { x: a.x, y: Math.max(a.y, b.y), visible: a.visible }, nv);
      });
      colocar(claseHud, proyectar(hp.localToWorld(tmp.set((INDICADORES[0][0] - TEX_W / 2) * esc, HUD_ALTO / 2 * esc + 0.06, 0))), nv);
      const pa = pantallas.partida;
      colocar(claseTablero, proyectar(pa.g.localToWorld(tmp.set((INDICADORES[0][0] - TEX_W / 2) * esc, pa.h / 2 - HUD_ALTO * esc - 0.75, 0.07))), nv);
    }

    vista.animar({ escena, camara, brillo: [0.6, 0.45, 0.95], orbita: { giro: 0.4, alto: 0.16 }, cada: actualizar });

    return {
      slide, est, pantallas, tramos, botones, pj, pulsos, polvo, deriva, velo,
      destruir: () => vista.destruir(),
    };
  },

  construir(tl, c) {
    if (c.sin3d) {
      tl.fromTo(c.fila.children, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.15 }, 0.4);
      return;
    }
    const { est, pantallas, tramos, botones } = c;
    const cab = c.slide.querySelectorAll(".cab .rotulo, .cab .bajada");
    const cabeza = c.slide.querySelector(".cab");
    const orden = ["menu", "partida", "pausa", "completado", "resultados"];
    const brillo = (k, en) => tl.to(botones[k].v, { v: 1, duration: 0.25, ease: "power2.out" }, en)
      .to(botones[k].v, { v: 0.0, duration: 0.5, ease: "power2.in" }, en + 1.1);
    const viaje = (hasta, en, dur, ease = "power2.inOut") => tl.to(est.cam, { v: hasta, duration: dur, ease }, en);
    const caminar = (hasta, en, dur, ease = "power1.inOut") => tl.to(est.ruta, { s: hasta, duration: dur, ease }, en);
    const llega = (k, en) => tl.fromTo(pantallas[k].llegada, { v: 0 }, { v: 1, duration: 1.1, ease: "power2.out", immediateRender: false }, en);

    // Entrada: la grúa baja mientras las pantallas se prenden y los tubos se dibujan en el orden del recorrido
    tl.fromTo(est.cam, { v: -1 }, { v: 0, duration: 4.4, ease: "power2.inOut" }, 0);
    orden.forEach((k, i) => tl.fromTo(pantallas[k].prendida, { v: 0 }, { v: 1, duration: 0.8, ease: "power1.inOut" }, 0.5 + i * 0.32));
    tramos.forEach((tr, i) => tl.fromTo(tr.trazo, { v: 0 }, { v: 1, duration: 0.9, ease: "power2.inOut" }, 1.7 + i * 0.28));
    tl.fromTo(est.aparece, { v: 0 }, { v: 1, duration: 0.7, ease: "bounce.out" }, 3.4)
      .set(est.ruta, { s: 0 }, 0).set(est.todo, { v: 1 }, 0).set([est.hud, est.notas], { v: 0 }, 0);

    // 1. Menú: elige el nivel 2 y viaja a la partida
    tl.addLabel("p1", 5.2);
    tl.to(est.todo, { v: 0, duration: 0.6 }, "p1").to(cab, { autoAlpha: 0, duration: 0.5 }, "p1")
      .to(cabeza, { scale: 0.6, y: -44, transformOrigin: "0% 0%", duration: 0.9, ease: "power3.inOut" }, "p1+=0.2");
    viaje(1, "p1", 1.5);
    brillo("menu", tl.labels.p1 + 1.3);
    viaje(2, tl.labels.p1 + 2.0, 2.8);
    caminar(1, tl.labels.p1 + 2.0, 2.8);
    llega("partida", tl.labels.p1 + 4.7);

    // 2. El HUD de cerca: se despega de la partida y se ve qué tiene
    tl.addLabel("p2", tl.labels.p1 + 5);
    viaje(3, "p2", 1.6);
    tl.to(est.hud, { v: 1, duration: 1.1, ease: "back.out(1.6)" }, "p2+=0.7")
      .to(est.notas, { v: 1, duration: 0.6 }, "p2+=1.4");

    // 3. Esc o el botón de pausa: la pausa
    tl.addLabel("p3", tl.labels.p2 + 2.2);
    tl.to(est.notas, { v: 0, duration: 0.3 }, "p3");
    brillo("pausaHud", tl.labels.p3 + 0.1);
    tl.to(est.hud, { v: 0, duration: 0.7, ease: "power2.inOut" }, "p3+=0.9");
    viaje(4, tl.labels.p3 + 1.1, 2.6);
    caminar(2, tl.labels.p3 + 1.1, 2.6);
    llega("pausa", tl.labels.p3 + 3.6);

    // 4. Continuar y poner las cajas en destino: nivel completado
    tl.addLabel("p4", tl.labels.p3 + 3.9);
    brillo("pausa", tl.labels.p4);
    viaje(5, tl.labels.p4 + 0.8, 3.8);
    caminar(4, tl.labels.p4 + 0.8, 3.8);
    llega("completado", tl.labels.p4 + 4.5);

    // 5. Siguiente nivel, de vuelta a la partida, y en el último nivel: resultados
    tl.addLabel("p5", tl.labels.p4 + 4.8);
    brillo("completado", tl.labels.p5);
    viaje(6, tl.labels.p5 + 0.8, 3.8);
    caminar(6, tl.labels.p5 + 0.8, 3.8);
    llega("resultados", tl.labels.p5 + 4.5);

    // 6. Festeja en los resultados y la cámara se aleja con todo el recorrido encendido
    tl.addLabel("p6", tl.labels.p5 + 4.8);
    brillo("resultados", tl.labels.p6);
    const pj = c.pj, pose = (en, v, dur = 0.15, ease = "power2.out") => tl.to(pj.pose, { ...v, duration: dur, ease, onUpdate: pj.aplicar }, en);
    const f = tl.labels.p6 + 0.3;
    pose(f, { aplaste: 0.7 }, 0.1);
    pose(f + 0.1, { aplaste: -0.4, brazoI: -2.8, brazoD: -2.8, abrir: 0.35 }, 0.14);
    tl.to(pj.raiz.rotation, { y: Math.PI * 2, duration: 0.55, ease: "power1.inOut" }, f + 0.1).set(pj.raiz.rotation, { y: 0 }, f + 0.66);
    tl.to(est.salto, { v: 1, duration: 0.28, ease: "power2.out" }, f + 0.1).to(est.salto, { v: 0, duration: 0.28, ease: "power2.in" }, f + 0.38);
    pose(f + 0.66, { aplaste: 0.6, brazoI: 0, brazoD: 0, abrir: 0 }, 0.08);
    pose(f + 0.74, { aplaste: 0 }, 0.4, "elastic.out(1, 0.4)");
    viaje(7, tl.labels.p6 + 0.9, 3.4);
    tl.to(est.todo, { v: 1, duration: 0.8 }, tl.labels.p6 + 3.2)
      .to(cabeza, { scale: 1, y: 0, duration: 0.9, ease: "power3.inOut" }, tl.labels.p6 + 2.8)
      .to(cab, { autoAlpha: 1, duration: 0.6 }, tl.labels.p6 + 3.3);
  },

  vida(c) {
    if (c.sin3d) return { kill() {} };
    const fases = Object.values(c.pantallas).map(() => [Math.random() * 6.28, gsap.utils.random(0.25, 0.5)]);
    const tick = (tt) => {
      c.deriva.x = Math.sin(tt * 0.13) * 0.35; c.deriva.y = Math.sin(tt * 0.19 + 1.3) * 0.18; c.deriva.z = Math.sin(tt * 0.11 + 2) * 0.3;
      Object.values(c.pantallas).forEach((p, i) => {
        const [f, w] = fases[i];
        p.g.rotation.x = Math.sin(tt * w + f) * 0.025; // se mece desde su base: los tubos siguen unidos
        p.g.rotation.z = Math.sin(tt * w * 0.8 + f * 2) * 0.012;
        p.estacion.material.opacity = 0.6 + Math.sin(tt * 1.3 + f) * 0.25;
      });
      c.polvo.rotation.y = tt * 0.008;
      c.pulsos.forEach((p) => {
        if (!p.tramo) return;
        p.f += 0.0065 * (p.rapidez || 1);
        if (p.f >= 1) { p.tramo = null; p.sp.material.opacity = 0; return; }
        p.sp.position.copy(p.tramo.curva.getPointAt(p.f));
        p.sp.material.opacity = Math.sin(Math.PI * p.f) * (p.tramo.trazo.v > 0.99 ? 1 : 0);
      });
      c.pj.cabeza.rotation.y = Math.sin(tt * 0.6) * 0.35;
    };
    gsap.ticker.add(tick);
    const pulsos = eventos(() => {
      const libre = c.pulsos.find((p) => !p.tramo);
      if (!libre) return;
      libre.tramo = gsap.utils.random(c.tramos);
      libre.f = 0;
      libre.rapidez = gsap.utils.random(0.6, 1.3);
      libre.sp.material.color.copy(new THREE.Color(t(Math.random() < 0.3 ? "acento" : "linea")).multiplyScalar(3));
    }, [0.25, 1.1]);
    const salto = eventos(() => {
      const s = c.est.ruta.s;
      if (Math.abs(s - Math.round(s)) > 0.001) return; // camina: no lo interrumpe
      const p = c.pj;
      gsap.timeline()
        .to(p.pose, { aplaste: 0.6, duration: 0.1, onUpdate: p.aplicar })
        .to(p.pose, { aplaste: -0.3, brazoI: -2.6, brazoD: -2.6, abrir: 0.3, duration: 0.12, onUpdate: p.aplicar })
        .to(p.pose, { aplaste: 0.5, brazoI: 0, brazoD: 0, abrir: 0, duration: 0.2, delay: 0.2, onUpdate: p.aplicar })
        .to(p.pose, { aplaste: 0, duration: 0.35, ease: "elastic.out(1, 0.4)", onUpdate: p.aplicar });
    }, [4, 8]);
    return juntas({ kill: () => gsap.ticker.remove(tick) }, pulsos, salto);
  },

  desmontar(c) { if (c.destruir) c.destruir(); },
};
