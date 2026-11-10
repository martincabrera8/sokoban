import * as THREE from "three";
import { gsap } from "gsap";
import { t, img, el, pixel, eventos, juntas } from "../util.js";
import { NIVEL_LLAVE, NIVEL_HIELO, DESHACER } from "../datos.js";
import { crearPersonaje } from "../personaje3d.js";
import { cargando } from "../vista3d.js";
import { mundo3d, textura, chispa, anclar } from "./patrones3d.js";

/*
 * El dominio de Pedro y Lucía, jugado sobre sus niveles reales con las mismas reglas que el código (simulación).
 * Paso 1, Strategy: la caja frágil pierde resistencia en cada empuje (3, 2, 1) y cambia de dibujo.
 * Paso 2, Strategy: la caja llave llega al cerrojo y abre el muro; sigue de largo por donde estaba el muro.
 * Paso 3, deshacer: antes de cada movimiento se sacó una foto del nivel entero (la pila de la derecha). Deshacer saca
 *   cinco fotos y restaura la última: el muro vuelve a cerrarse, porque la foto guarda todo el nivel.
 * Paso 4, Mediator: nivel 3. El jugador le pide el movimiento al motor y el motor deja que la caja siga sobre el hielo.
 * Abajo, la cadena del Mediator se enciende en cada movimiento: jugador, motor y, si hubo empuje, la estrategia de la caja.
 */

const DIR = { R: [0, 1, "DERECHA"], L: [0, -1, "IZQUIERDA"], D: [1, 0, "ABAJO"], U: [-1, 0, "ARRIBA"] };
const GIRO = { R: Math.PI / 2, L: -Math.PI / 2, D: 0, U: Math.PI };
const PLAN_LLAVE = [..."RRRLLDRRRR"];   // frágil hasta su destino; después la llave al cerrojo y dos pasos más
const PASOS_FRAGIL = 3;               // los tres primeros movimientos son el paso 1
const PLAN_HIELO = [..."RRRR"];
const IMG = {
  "#": { 1985: "tiles/wall_mall", 2015: "tiles/wall_future" },
  " ": { 1985: "tiles/floor_1985", 2015: "tiles/floor_2015" },
  ".": "goals/goal", "~": "tiles/terreno_resbaladizo", C: "tiles/cerrojo_cerrado", c: "tiles/cerrojo_abierto", X: "tiles/muro_cerrado", O: "tiles/muro_abierto",
  N: "boxes/box_wood", F: "boxes/caja_fragil_intacta", f: "boxes/caja_fragil_danada", L: "boxes/caja_llave",
};
const ESTRATEGIAS = [
  { tipo: "N", clase: "CajaNormalStrategy", efecto: "no hace nada", img: "boxes/box_wood" },
  { tipo: "F", clase: "CajaFragilStrategy", efecto: `resistencia ${3}: al tercer empuje se rompe`, img: "boxes/caja_fragil_intacta" },
  { tipo: "L", clase: "CajaLlaveStrategy", efecto: "sobre el cerrojo, abre los muros", img: "boxes/caja_llave" },
];
const FOTO = 0.25;          // escala de cada foto respecto del tablero
const PILA = new THREE.Vector3(9.7, 0.25, 0.9);
const ALTO_FOTO = 0.13;
const CAMARA = new THREE.Vector3(2.6, 19.6, 11.4), MIRA = new THREE.Vector3(2.7, 0, 0.9);

/* ── Las reglas del dominio, copiadas de MotorMovimiento, EstadoNivel y las tres estrategias ── */
function cargar(lineas) {
  const e = { terreno: [], cajas: [], jugador: null };
  lineas.forEach((l, f) => {
    e.terreno.push([...l].map((s, c) => {
      if (s === "@") { e.jugador = [f, c]; return " "; }
      if (s === "$" || s === "F" || s === "L") { e.cajas.push({ id: e.cajas.length, f, c, tipo: s === "$" ? "N" : s, res: s === "F" ? 3 : 0 }); return " "; }
      return s;
    }));
  });
  return e;
}
const copiar = (e) => ({ terreno: e.terreno.map((f) => f.slice()), cajas: e.cajas.map((k) => ({ ...k })), jugador: e.jugador.slice() });
const dentro = (e, f, c) => f >= 0 && f < e.terreno.length && c >= 0 && c < e.terreno[0].length;
const cajaEn = (e, f, c) => e.cajas.find((k) => k.f === f && k.c === c);
const libre = (e, f, c) => dentro(e, f, c) && !"#X".includes(e.terreno[f][c]) && !cajaEn(e, f, c) && !(e.jugador[0] === f && e.jugador[1] === c);
const hielo = (e, f, c) => dentro(e, f, c) && e.terreno[f][c] === "~";

/** intentarMover(direccion): devuelve qué pasó, o null si no se pudo mover. */
function mover(e, d) {
  const [df, dc] = DIR[d];
  const [f, c] = [e.jugador[0] + df, e.jugador[1] + dc];
  const caja = cajaEn(e, f, c);
  if (!caja) {
    if (!libre(e, f, c)) return null;
    e.jugador = [f, c];
    return { empuje: false };
  }
  let [cf, cc] = [f + df, c + dc];
  if (!libre(e, cf, cc)) return null;
  const paso = [cf, cc];
  while (hielo(e, cf, cc) && libre(e, cf + df, cc + dc)) { cf += df; cc += dc; }
  const r = { empuje: true, caja: caja.id, desde: [caja.f, caja.c], paso, hasta: [cf, cc], deslizo: cf !== paso[0] || cc !== paso[1] };
  caja.f = cf; caja.c = cc;
  if (caja.tipo === "F") { caja.res -= 1; r.res = caja.res; if (caja.res <= 0) e.cajas = e.cajas.filter((k) => k !== caja); }
  if (caja.tipo === "L" && e.terreno[cf][cc] === "C") {
    e.terreno = e.terreno.map((fila) => fila.map((s) => (s === "X" ? "O" : s === "C" ? "c" : s)));
    r.abrio = true;
  }
  e.jugador = [f, c];
  return r;
}

/** Juega un plan y guarda, como JuegoSokoban, una foto del nivel antes de cada movimiento. */
function jugar(lineas, plan) {
  const e = cargar(lineas);
  const fotos = [], pasos = [];
  plan.forEach((d) => {
    const antes = copiar(e);
    const r = mover(e, d);
    if (!r) return;
    fotos.push(antes);
    pasos.push({ d, r, antes, despues: copiar(e) });
  });
  return { inicio: cargar(lineas), fotos, pasos, final: copiar(e) };
}

/* ── Fotos del nivel: el estado dibujado con las imágenes del juego, como lo pinta PanelTablero ── */
const imagenes = {};
const imagen = (k) => {
  if (!imagenes[k]) {
    const im = new Image();
    imagenes[k] = { im, listo: new Promise((r) => { im.onload = r; im.onerror = r; }) };
    im.src = img(k);
  }
  return imagenes[k].im;
};
function pintarEstado(g, e, epoca, b) {
  e.terreno.forEach((fila, f) => fila.forEach((s, c) => {
    const capas = s === "#" ? [IMG["#"][epoca]] : s === " " ? [IMG[" "][epoca]] : s === "." ? [IMG[" "][epoca], IMG["."]] : [IMG[s]];
    capas.forEach((k) => g.drawImage(imagen(k), c * b, f * b, b, b));
  }));
  e.cajas.forEach((k) => g.drawImage(imagen(IMG[k.tipo === "F" && k.res === 1 ? "f" : k.tipo]), k.c * b, k.f * b, b, b));
  g.drawImage(imagen("characters/player_down"), e.jugador[1] * b, e.jugador[0] * b, b, b);
}

/** Sombra suave de contacto (sin mapa de sombras). */
let manchaGuardada = null;
function mancha() {
  if (manchaGuardada) return manchaGuardada;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), col = new THREE.Color(t("fondo-hondo"));
  const rgba = (a) => `rgba(${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)},${a})`;
  const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  gr.addColorStop(0, rgba(0.85)); gr.addColorStop(0.6, rgba(0.4)); gr.addColorStop(1, rgba(0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  manchaGuardada = new THREE.CanvasTexture(c);
  return manchaGuardada;
}

/* ── Un tablero 3D a partir de las líneas del nivel ── */
function tablero3d(escena, lineas, epoca) {
  const filas = lineas.length, cols = lineas[0].length;
  const celda = (f, c, y = 0) => new THREE.Vector3(c - cols / 2 + 0.5, y, f - filas / 2 + 0.5);
  const grupo = new THREE.Group();
  escena.add(grupo);
  const pisos = [], muros = [];
  const especiales = {};
  const geoPiso = new THREE.PlaneGeometry(1, 1);
  lineas.forEach((l, f) => [...l].forEach((s, c) => {
    const o = Math.hypot(f - 2, c - 2) / 12;
    if (s === "#") { muros.push({ f, c, o }); return; }
    pisos.push({ f, c, o });
    if (".~CX".includes(s)) {
      const m = new THREE.Mesh(geoPiso, new THREE.MeshStandardMaterial({ map: textura(IMG[s]), roughness: s === "~" ? 0.15 : 0.7, metalness: s === "~" ? 0.3 : 0,
        emissive: new THREE.Color(t(s === "~" ? "linea" : "acento")), emissiveMap: textura(IMG[s]), emissiveIntensity: s === "." ? 0.3 : s === "~" ? 0.25 : 0, transparent: true }));
      m.rotation.x = -Math.PI / 2;
      m.position.copy(celda(f, c, 0.004));
      m.userData.o = o;
      grupo.add(m);
      (especiales[s] ||= []).push(m);
    }
  }));
  const instancias = (lista, geo, mat, alto) => {
    const malla = new THREE.InstancedMesh(geo, mat, lista.length);
    malla.frustumCulled = false;
    grupo.add(malla);
    return { malla, lista, alto };
  };
  const ladoPared = new THREE.MeshStandardMaterial({ map: textura(IMG["#"][epoca]), color: t("tinta-3"), roughness: 0.85 });
  const capaPiso = instancias(pisos, new THREE.BoxGeometry(1, 0.16, 1).translate(0, -0.08, 0), new THREE.MeshStandardMaterial({ map: textura(IMG[" "][epoca]), roughness: 0.9 }), 0);
  const capaMuro = instancias(muros, new THREE.BoxGeometry(1, 0.5, 1).translate(0, 0.25, 0), [ladoPared, ladoPared, new THREE.MeshStandardMaterial({ map: textura(IMG["#"][epoca]), roughness: 0.8 }), ladoPared, ladoPared, ladoPared], 0.5);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
  const sale = gsap.parseEase("back.out(1.7)");
  /** El nivel se arma (o se desarma) baldosa por baldosa: p de 0 a 1. */
  const armar = (p) => {
    [capaPiso, capaMuro].forEach(({ malla, lista }) => {
      lista.forEach((b, i) => {
        const k = Math.max(0, Math.min(1, (p * 1.4 - b.o) / 0.4));
        const r = sale(k);
        p3.copy(celda(b.f, b.c)).setY(-(1 - r) * 2.5);
        q.setFromEuler(e3.set((1 - k) * 0.7, 0, (1 - k) * -0.4));
        s3.setScalar(Math.max(0.001, k));
        malla.setMatrixAt(i, m4.compose(p3, q, s3));
      });
      malla.instanceMatrix.needsUpdate = true;
    });
    Object.values(especiales).flat().forEach((m) => {
      const k = Math.max(0, Math.min(1, (p * 1.4 - m.userData.o) / 0.4));
      m.visible = k > 0.5;
    });
  };
  armar(0);
  return { grupo, celda, armar, especiales, filas, cols };
}

/** Una caja del juego: el dibujo real arriba, los costados en sombra (así se lee como un cubo) y su sombra de contacto. */
function cajaDe(grupo, clave) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ map: textura(clave), roughness: 0.7, emissive: new THREE.Color(t("acento")), emissiveMap: textura(clave), emissiveIntensity: 0 });
  const lado = new THREE.MeshStandardMaterial({ map: textura(clave), color: t("tinta-3"), roughness: 0.8, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0 });
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.82, 0.82), [lado, lado, mat, lado, lado, lado]);
  m.position.y = 0.41;
  const sombra = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25), new THREE.MeshBasicMaterial({ map: mancha(), transparent: true, depthWrite: false }));
  sombra.rotation.x = -Math.PI / 2; sombra.position.y = 0.012;
  g.add(sombra, m);
  grupo.add(g);
  return { g, m, mat, lado };
}

export default {
  montar(lienzo) {
    const A = jugar(NIVEL_LLAVE, PLAN_LLAVE), B = jugar(NIVEL_HIELO, PLAN_HIELO);
    const w = mundo3d(lienzo, { descripcion: "Simulación del dominio en 3D sobre los niveles reales: la caja frágil pierde resistencia, la caja llave abre el muro, deshacer vuelve con las fotos del nivel y la caja se desliza sobre el hielo", fov: 30, resplandor: [0.6, 0.5, 0.8], niebla: [24, 50] });
    el("div", "dom__velo", lienzo);
    const c = { w, A, B, entrada: { v: 0 }, cual: { v: 0 } };

    // Strategy: la interfaz y sus tres estrategias, con el dibujo real de cada caja
    c.estrategia = el("div", "dom__estrategia", lienzo);
    el("p", "dom__rotulo", c.estrategia, { html: "interface <b>ComportamientoCaja</b>" });
    el("code", "dom__firma", c.estrategia, { texto: "despuesDeEmpujar(caja, estado)" });
    c.filas = {};
    ESTRATEGIAS.forEach((e) => {
      const fila = el("div", "dom__fila", c.estrategia);
      pixel(e.img, fila, "", "pixel dom__icono");
      const txt = el("div", "dom__fila-texto", fila);
      el("code", "dom__clase", txt, { texto: e.clase });
      el("span", "dom__efecto", txt, { texto: e.efecto });
      c.filas[e.tipo] = fila;
    });

    // Mediator: la cadena que recorre cada movimiento
    c.cadena = el("div", "dom__cadena", lienzo);
    el("p", "dom__rotulo", c.cadena, { html: "Mediator <b>MotorMovimiento</b>" });
    const fila = el("div", "dom__eslabones", c.cadena);
    const eslabon = (quien, metodo) => {
      const e = el("div", "dom__eslabon", fila);
      el("span", "dom__quien", e, { texto: quien });
      const code = el("code", "dom__metodo", e);
      return { e, code, metodo };
    };
    c.eslabones = [eslabon("Jugador", "mover"), eslabon("MotorMovimiento", "intentarMover"), eslabon("Caja", "despuesDeEmpujar")];
    c.reglaHielo = el("p", "dom__regla", c.cadena, { html: "Sobre el <b>hielo</b>, el motor deja que la caja siga hasta el primer piso normal." });

    // Rótulos anclados al 3D
    const ancla = (clase) => el("div", "dom__ancla " + clase, lienzo);
    c.resA = ancla("dom__ancla--res");
    c.res = el("div", "dom__res", c.resA);
    el("span", "", c.res, { texto: "resistencia" });
    c.pips = [0, 1, 2].map(() => el("i", "", c.res));
    c.pilaA = ancla("dom__ancla--pila");
    c.pila = el("div", "dom__pila", c.pilaA);
    el("b", "", c.pila, { texto: "historial" });
    const cuenta = el("span", "dom__cuenta", c.pila);
    c.cuentaN = el("b", "", cuenta, { texto: "0" });
    cuenta.append(` de ${DESHACER.historial} fotos`);
    c.undoA = ancla("dom__ancla--undo");
    c.undo = el("p", "dom__undo", c.undoA, { html: `<code>deshacer()</code> saca ${DESHACER.pasos} fotos y restaura la última. Vuelve hasta el muro: la foto guarda el nivel entero.` });
    c.nivelA = ancla("dom__ancla--nivel");
    c.nivel = el("p", "dom__nivel", c.nivelA);
    c.nivelTxt = [el("span", "", c.nivel, { texto: "nivel 2 · niveles/nivel2.txt" }), el("span", "", c.nivel, { texto: "nivel 3 · niveles/nivel3.txt" })];
    c.avisoA = ancla("dom__ancla--aviso");
    c.aviso = el("p", "dom__aviso", c.avisoA);
    c.avisos = {};
    [["abre", "¡El cerrojo abre los muros!"], ["hielo", "Se desliza sobre el hielo"], ["completo", "Nivel completo"]].forEach(([k, txt]) => { c.avisos[k] = el("span", "", c.aviso, { texto: txt }); });

    if (!w) {
      // Sin WebGL: el nivel 2 al final, dibujado con las imágenes del juego
      const lienzo2d = el("canvas", "dom__respaldo", lienzo, { width: 13 * 64, height: 6 * 64 });
      const g = lienzo2d.getContext("2d");
      g.imageSmoothingEnabled = false;
      Promise.all(Object.values(imagenes).map((x) => x.listo)).then(() => pintarEstado(g, A.final, 1985, 64));
      pintarEstado(g, A.final, 1985, 64);
      [c.resA, c.pilaA, c.undoA, c.nivelA, c.avisoA].forEach((a) => anclar(a, { x: -2000, y: -2000 }));
      c.sin3d = true;
      return c;
    }

    const { escena } = w;
    escena.add(new THREE.HemisphereLight(t("tinta-2"), t("fondo-hondo"), 1.5));
    const sol = new THREE.DirectionalLight(t("titulo"), 2.1);
    sol.position.set(-5, 12, 8);
    escena.add(sol);
    const contra = new THREE.DirectionalLight(t("linea"), 0.6);
    contra.position.set(8, 6, -8);
    escena.add(contra);

    // Los dos niveles reales, en el mismo lugar: primero el 2 (1985), después el 3 (2015)
    c.ta = tablero3d(escena, NIVEL_LLAVE, 1985);
    c.tb = tablero3d(escena, NIVEL_HIELO, 2015);
    const enA = (f, cc, y = 0) => c.ta.celda(f, cc, y), enB = (f, cc, y = 0) => c.tb.celda(f, cc, y);
    c.enA = enA; c.enB = enB;
    // Cerrojo abierto y muro abierto debajo de los cerrados: aparecen cuando la llave abre
    const geoPiso = new THREE.PlaneGeometry(1, 1);
    const plano = (clave, p) => {
      const m = new THREE.Mesh(geoPiso, new THREE.MeshStandardMaterial({ map: textura(clave), roughness: 0.7, transparent: true, opacity: 0, emissive: new THREE.Color(t("acento")), emissiveMap: textura(clave), emissiveIntensity: 0.4 }));
      m.rotation.x = -Math.PI / 2; m.position.copy(p);
      c.ta.grupo.add(m);
      return m;
    };
    const [fC, cC] = [3, NIVEL_LLAVE[3].indexOf("C")], [fX, cX] = [3, NIVEL_LLAVE[3].indexOf("X")];
    c.cerrojoAbierto = plano(IMG.c, enA(fC, cC, 0.006));
    c.cerrojo = c.ta.especiales.C[0];
    c.muroAbierto = plano(IMG.O, enA(fX, cX, 0.003));
    c.muro = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.9, 0.98), new THREE.MeshStandardMaterial({ map: textura(IMG.X), roughness: 0.6 }));
    c.muro.position.copy(enA(fX, cX, 0.45));
    c.ta.grupo.add(c.muro);
    c.anilloLlave = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.58, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(t("acento")).multiplyScalar(1.6), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    c.anilloLlave.rotation.x = -Math.PI / 2; c.anilloLlave.position.copy(enA(fC, cC, 0.05));
    c.ta.grupo.add(c.anilloLlave);
    c.luzLlave = new THREE.PointLight(t("acento"), 0, 7, 1.4);
    c.luzLlave.position.copy(enA(3, (cC + cX) / 2, 1.4));
    c.ta.grupo.add(c.luzLlave);
    c.polvoMuro = Array.from({ length: 10 }, () => { const s = chispa("titulo", 0.35); c.ta.grupo.add(s); return s; });

    // Cajas de cada nivel, con el dibujo de su tipo
    const tipoClave = { N: IMG.N, F: IMG.F, L: IMG.L };
    c.cajasA = A.inicio.cajas.map((k) => { const x = cajaDe(c.ta.grupo, tipoClave[k.tipo]); x.g.position.copy(enA(k.f, k.c)); return { ...x, k }; });
    c.cajasB = B.inicio.cajas.map((k) => { const x = cajaDe(c.tb.grupo, tipoClave[k.tipo]); x.g.position.copy(enB(k.f, k.c)); return { ...x, k }; });
    c.fragil = c.cajasA.find((x) => x.k.tipo === "F");
    c.texDanada = textura(IMG.f);
    c.texIntacta = textura(IMG.F);
    c.estela = Array.from({ length: 8 }, () => { const s = chispa("linea", 0.5); c.tb.grupo.add(s); return s; });

    // El personaje
    c.pj = crearPersonaje(0.62);
    c.pj.raiz.position.copy(enA(...A.inicio.jugador));
    c.pj.raiz.rotation.y = GIRO.R;
    escena.add(c.pj.raiz);
    const sombraPj = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: mancha(), transparent: true, depthWrite: false }));
    sombraPj.rotation.x = -Math.PI / 2; sombraPj.position.y = 0.012;
    c.pj.raiz.add(sombraPj);

    // La pila de fotos: 15 lugares; cada foto es el nivel entero en chico
    const cols = NIVEL_LLAVE[0].length, filasN = NIVEL_LLAVE.length;
    const geoFoto = new THREE.BoxGeometry(cols * FOTO, 0.05, filasN * FOTO);
    const borde = new THREE.EdgesGeometry(geoFoto);
    c.lugares = Array.from({ length: DESHACER.historial }, (_, i) => {
      const l = new THREE.LineSegments(borde, new THREE.LineDashedMaterial({ color: new THREE.Color(t("linea")), dashSize: 0.12, gapSize: 0.08, transparent: true, opacity: 0 }));
      l.computeLineDistances();
      l.position.copy(PILA).add(new THREE.Vector3(0, i * ALTO_FOTO, 0));
      escena.add(l);
      return l;
    });
    const lienzoFoto = (estado, epoca, nc, nf) => {
      const cv = document.createElement("canvas");
      cv.width = cols * 16; cv.height = filasN * 16;
      const tx = new THREE.CanvasTexture(cv);
      tx.colorSpace = THREE.SRGBColorSpace; tx.magFilter = THREE.NearestFilter; tx.minFilter = THREE.LinearFilter; tx.generateMipmaps = false;
      const g = cv.getContext("2d");
      g.imageSmoothingEnabled = false;
      const dibujar = () => {
        g.fillStyle = t("fondo-hondo"); g.fillRect(0, 0, cv.width, cv.height);
        g.save(); g.translate(((cols - nc) / 2) * 16, ((filasN - nf) / 2) * 16);
        pintarEstado(g, estado, epoca, 16);
        g.restore();
        tx.needsUpdate = true;
      };
      dibujar();
      cargando(Promise.all(Object.values(imagenes).map((x) => x.listo)).then(dibujar));
      return tx;
    };
    const foto = (estado, epoca, nc, nf) => {
      const lateral = new THREE.MeshStandardMaterial({ color: t("superficie-2"), roughness: 0.5, transparent: true });
      const cara = new THREE.MeshBasicMaterial({ map: lienzoFoto(estado, epoca, nc, nf), transparent: true, toneMapped: false });
      const m = new THREE.Mesh(geoFoto, [lateral, lateral, cara, lateral, lateral, lateral]);
      m.userData.brillo = (v) => cara.color.setScalar(0.82 + v);
      const marco = new THREE.LineSegments(borde, new THREE.LineBasicMaterial({ color: new THREE.Color(t("linea")), transparent: true, opacity: 0.8 }));
      m.add(marco);
      m.visible = false;
      escena.add(m);
      return m;
    };
    c.fotosA = A.fotos.map((e) => foto(e, 1985, cols, filasN));
    c.fotosB = B.fotos.map((e) => foto(e, 2015, NIVEL_HIELO[0].length, NIVEL_HIELO.length));
    c.flash = new THREE.PointLight(t("tinta"), 0, 12, 1.2);
    c.flash.position.set(0, 4, 0);
    escena.add(c.flash);

    w.camara.position.copy(CAMARA);
    w.mira.copy(MIRA);
    w.camara.setViewOffset(w.W, w.H, 0, -w.H * 0.1, w.W, w.H);
    w.preparar();

    // Anclas que siguen al 3D
    const tmp = new THREE.Vector3();
    w.cadaCuadro(() => {
      c.fragil.g.getWorldPosition(tmp); tmp.y += 1.25;
      anclar(c.resA, w.proyectar(tmp));
      anclar(c.pilaA, w.proyectar(tmp.copy(PILA).add(new THREE.Vector3(0, 0, (filasN * FOTO) / 2 + 0.2))));
      anclar(c.undoA, w.proyectar(tmp.copy(PILA).add(new THREE.Vector3(0, 0, (filasN * FOTO) / 2 + 0.2))));
      anclar(c.nivelA, w.proyectar(enA(0, 1, 0.5)));
      c.pj.raiz.getWorldPosition(tmp); tmp.y += 1.6;
      anclar(c.avisoA, w.proyectar(tmp));
    });
    return c;
  },

  construir(tl, c) {
    const paneles = [c.estrategia, c.cadena];
    tl.set([c.reglaHielo, c.undo, c.nivelTxt[1], ...Object.values(c.avisos)], { autoAlpha: 0 }, 0)
      .set([c.res, c.pila, c.nivel], { autoAlpha: 0 }, 0)
      .fromTo(c.entrada, { v: 0 }, { v: 1, duration: 3, ease: "none" }, 0)
      .fromTo(paneles, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.15 }, 1.2);
    if (c.sin3d) {
      ["p1", "p2", "p3", "p4"].forEach((p, i) => tl.addLabel(p, 2 + i).to(c.filas[["F", "L", "N", "N"][i]], { "--activo": 1, duration: 0.3 }, p));
      return;
    }
    const { w, pj, A, B } = c;
    const ARMADO = { a: { p: 0 }, b: { p: 0 } };
    // Qué nivel se ve: 0 el 2, 1 el 3 (durante el cambio, los dos)
    const mostrarNivel = () => { c.ta.grupo.visible = c.cual.v < 1; c.tb.grupo.visible = c.cual.v > 0; };
    tl.fromTo(w.camara.position, { x: CAMARA.x - 6, y: CAMARA.y + 6, z: CAMARA.z - 4 }, { x: CAMARA.x, y: CAMARA.y, z: CAMARA.z, duration: 2.6, ease: "power3.inOut" }, 0)
      .fromTo(ARMADO.a, { p: 0 }, { p: 1, duration: 1.8, ease: "power1.inOut", onUpdate: () => c.ta.armar(ARMADO.a.p) }, 0.2)
      .fromTo(c.cual, { v: 0 }, { v: 0, duration: 0.01, onUpdate: () => mostrarNivel() }, 0)
      .fromTo(c.cajasA.map((x) => x.g.position), { y: 5 }, { y: 0, duration: 0.6, ease: "bounce.out", stagger: 0.15 }, 1.5)
      .fromTo(pj.raiz.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 0.62, y: 0.62, z: 0.62, duration: 0.45, ease: "back.out(2)" }, 1.9)
      .fromTo(c.lugares.map((l) => l.material), { opacity: 0 }, { opacity: 0.22, duration: 0.4, stagger: 0.03 }, 1.6)
      .fromTo([c.pila, c.nivel, c.res], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.1 }, 2.2)
      .set([...c.fotosA, ...c.fotosB], { visible: false }, 0)
      .set(c.pips, { "--on": 1 }, 0);

    /* Herramientas de animación: todas con valores explícitos, así el timeline se puede adelantar o volver */
    const andar = { f: 0 };
    const posA = (f, cc) => c.enA(f, cc), posB = (f, cc) => c.enB(f, cc);
    let giroActual = GIRO.R;
    const girar = (en, d) => {
      let a = GIRO[d];
      while (a - giroActual > Math.PI) a -= Math.PI * 2;
      while (a - giroActual < -Math.PI) a += Math.PI * 2;
      tl.fromTo(pj.raiz.rotation, { y: giroActual }, { y: a, duration: 0.12, ease: "power2.out", immediateRender: false }, en);
      giroActual = a;
    };
    const pierna = (en, dur, empuja) => tl.fromTo(andar, { f: 0 }, { f: Math.PI * 2, duration: dur, ease: "none", immediateRender: false,
      onUpdate: () => { const sn = Math.sin(andar.f); pj.pose.piernaI = -sn * 0.6; pj.pose.piernaD = sn * 0.6; pj.pose.brazoI = empuja ? -1.45 : sn * 0.5; pj.pose.brazoD = empuja ? -1.45 : -sn * 0.5; if (andar.f >= Math.PI * 2 - 1e-3) { pj.pose.piernaI = pj.pose.piernaD = pj.pose.brazoI = pj.pose.brazoD = 0; } pj.aplicar(); } }, en);
    let nFotos = 0;
    const cuenta = { n: 0 };
    const mostrarCuenta = () => { c.cuentaN.textContent = String(Math.round(cuenta.n)); };
    const contar = (en, n) => {
      tl.fromTo(cuenta, { n: nFotos }, { n, duration: 0.15, ease: "none", immediateRender: false, onUpdate: mostrarCuenta }, en);
      nFotos = n;
    };
    /** Saca una foto: la copia del nivel sube del tablero y vuela a su lugar en la pila. */
    const sacarFoto = (m, en, i) => {
      const v = { k: 0 };
      const destino = PILA.clone().add(new THREE.Vector3(0, i * ALTO_FOTO, 0));
      const desde = new THREE.Vector3(0, 0.6, 0);
      tl.fromTo(v, { k: 0 }, { k: 1, duration: 0.5, ease: "power2.inOut", immediateRender: false, onUpdate: () => {
        const k = v.k;
        m.visible = k > 0.001;
        m.position.lerpVectors(desde, destino, k).setY(desde.y + (destino.y - desde.y) * k + Math.sin(k * Math.PI) * 2.2);
        m.scale.setScalar(1 / FOTO + (1 - 1 / FOTO) * k);
        m.rotation.set(Math.sin(k * Math.PI) * -0.35, 0, Math.sin(k * Math.PI) * 0.15);
        m.userData.brillo((1 - k) * 0.7);
      } }, en);
      tl.fromTo(c.flash, { intensity: 0 }, { intensity: 14, duration: 0.06, yoyo: true, repeat: 1, immediateRender: false }, en);
      contar(en + 0.45, i + 1);
    };
    /** La cadena del Mediator se enciende eslabón por eslabón. */
    const cadena = (en, d, empuje) => {
      const nombre = DIR[d][2];
      const textos = [`mover(${nombre})`, `intentarMover(${nombre})`, "despuesDeEmpujar(estado)"];
      c.eslabones.forEach((e, i) => {
        if (i === 2 && !empuje) return;
        tl.fromTo(e.e, { "--golpe": 0 }, { "--golpe": 1, duration: 0.08, immediateRender: false, onStart: () => { e.code.textContent = textos[i]; }, onUpdate: () => { e.code.textContent = textos[i]; } }, en + i * 0.12)
          .to(e.e, { "--golpe": 0, duration: 0.6 }, en + i * 0.12 + 0.1);
      });
    };
    /** Un movimiento del plan: gira, camina o empuja; la caja hace lo que diga su estrategia. */
    const paso = (p, en, pos, cajas, fotos, i) => {
      const { d, r, antes, despues } = p;
      sacarFoto(fotos[i], en, i);
      girar(en, d);
      const dur = r.empuje ? 0.42 : 0.3;
      const ini = pos(...antes.jugador), fin = pos(...despues.jugador);
      tl.fromTo(pj.raiz.position, { x: ini.x, z: ini.z }, { x: fin.x, z: fin.z, duration: dur, ease: r.empuje ? "empuje" : "power1.inOut", immediateRender: false }, en + 0.08);
      pierna(en + 0.08, dur, r.empuje);
      cadena(en + 0.05, d, r.empuje);
      if (!r.empuje) return en + 0.08 + dur + 0.08;
      const caja = cajas.find((x) => x.k.id === r.caja);
      const a = pos(...r.desde), b = pos(...r.paso), z = pos(...r.hasta);
      tl.fromTo(caja.g.position, { x: a.x, z: a.z }, { x: b.x, z: b.z, duration: dur, ease: "empuje", immediateRender: false }, en + 0.08);
      let fin2 = en + 0.08 + dur;
      if (r.deslizo) {
        tl.fromTo(caja.g.position, { x: b.x, z: b.z }, { x: z.x, z: z.z, duration: 0.5, ease: "power2.out", immediateRender: false }, fin2);
        const v = { k: 0 };
        tl.fromTo(v, { k: 0 }, { k: 1, duration: 0.8, immediateRender: false, onUpdate: () => c.estela.forEach((s, j) => {
          const kk = v.k * 1.3 - j * 0.06;
          s.material.opacity = kk > 0 && kk < 1 ? Math.sin(kk * Math.PI) * 0.9 : 0;
          s.position.set(b.x + (z.x - b.x) * Math.min(1, kk + 0.1) - j * 0.12, 0.15 + j * 0.03, b.z + (j % 3 - 1) * 0.25);
        }) }, fin2 - 0.05);
        fin2 += 0.5;
      }
      // Lo que hace cada estrategia después del empuje
      if (caja.k.tipo === "F") {
        const res = r.res;
        tl.fromTo(c.pips[res], { "--on": 1 }, { "--on": 0, duration: 0.25, immediateRender: false }, fin2 - 0.1)
          .fromTo(c.res, { scale: 1.25 }, { scale: 1, duration: 0.4, ease: "back.out(2)", immediateRender: false }, fin2 - 0.1)
          .to(caja.g.rotation, { keyframes: [{ z: 0.08, duration: 0.05 }, { z: -0.06, duration: 0.05 }, { z: 0, duration: 0.08 }] }, fin2 - 0.1);
        if (res === 1) {
          const dano = { v: 0 };
          tl.fromTo(dano, { v: 0 }, { v: 1, duration: 0.05, immediateRender: false, onUpdate: () => {
            const x = dano.v > 0.5 ? c.texDanada : c.texIntacta;
            caja.mat.map = x; caja.mat.emissiveMap = x; caja.lado.map = x;
          } }, fin2 - 0.05);
        }
      }
      if (despues.terreno[r.hasta[0]][r.hasta[1]] === "." && antes.terreno[r.hasta[0]][r.hasta[1]] === ".") {
        tl.fromTo(caja.mat, { emissiveIntensity: 0 }, { emissiveIntensity: 0.9, duration: 0.15, immediateRender: false }, fin2)
          .to(caja.mat, { emissiveIntensity: 0.25, duration: 0.8 }, fin2 + 0.15);
      }
      if (r.abrio) abrir(fin2);
      return fin2 + 0.1;
    };
    /** La llave sobre el cerrojo: el muro baja, el cerrojo cambia de dibujo, destello y polvo. */
    const abrir = (en) => {
      const mv = { k: 0 };
      tl.fromTo(c.muro.position, { y: 0.45 }, { y: -0.5, duration: 0.7, ease: "power2.in", immediateRender: false }, en + 0.1)
        .to(c.muro.rotation, { keyframes: [{ z: 0.03, duration: 0.05 }, { z: -0.03, duration: 0.05 }, { z: 0, duration: 0.05 }] }, en + 0.1)
        .fromTo(c.muroAbierto.material, { opacity: 0 }, { opacity: 1, duration: 0.4, immediateRender: false }, en + 0.4)
        .fromTo(c.cerrojoAbierto.material, { opacity: 0 }, { opacity: 1, duration: 0.25, immediateRender: false }, en)
        .fromTo(c.cerrojo.material, { opacity: 1 }, { opacity: 0, duration: 0.25, immediateRender: false }, en)
        .fromTo(c.luzLlave, { intensity: 0 }, { intensity: 26, duration: 0.1, immediateRender: false }, en)
        .to(c.luzLlave, { intensity: 3, duration: 1.2 }, en + 0.1)
        .fromTo(c.anilloLlave.scale, { x: 0.4, y: 0.4 }, { x: 4, y: 4, duration: 1, ease: "power2.out", immediateRender: false }, en)
        .fromTo(c.anilloLlave.material, { opacity: 1 }, { opacity: 0, duration: 1, immediateRender: false }, en)
        .fromTo(mv, { k: 0 }, { k: 1, duration: 1.1, ease: "power1.out", immediateRender: false, onUpdate: () => c.polvoMuro.forEach((s, j) => {
          const a = (j / c.polvoMuro.length) * Math.PI * 2;
          s.position.copy(c.muroAbierto.position).add(new THREE.Vector3(Math.cos(a) * mv.k * 1.1, 0.2 + Math.sin(mv.k * Math.PI) * 0.8, Math.sin(a) * mv.k * 0.8));
          s.material.opacity = mv.k > 0 && mv.k < 1 ? (1 - mv.k) * 0.9 : 0;
        }) }, en + 0.2);
      aviso("abre", en, 1.6);
    };
    const aviso = (k, en, dur) => tl.fromTo(c.avisos[k], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, en)
      .to(c.avisos[k], { autoAlpha: 0, duration: 0.3 }, en + dur);
    const fila = (tipo, en, v) => tl.to(c.filas[tipo], { "--activo": v, duration: 0.3 }, en);

    // Paso 1: la caja frágil pierde resistencia y llega a su destino
    tl.addLabel("p1", 3.4);
    let en = tl.labels.p1 + 0.2;
    fila("F", tl.labels.p1, 1);
    A.pasos.slice(0, PASOS_FRAGIL).forEach((p, i) => { en = paso(p, en, posA, c.cajasA, c.fotosA, i); });
    fila("F", en + 0.6, 0);

    // Paso 2: la llave va al cerrojo, abre el muro y sigue por donde estaba
    tl.addLabel("p2", en + 0.9);
    en = tl.labels.p2 + 0.2;
    fila("L", tl.labels.p2, 1);
    A.pasos.slice(PASOS_FRAGIL).forEach((p, i) => { en = paso(p, en, posA, c.cajasA, c.fotosA, PASOS_FRAGIL + i); });
    fila("L", en + 0.6, 0);

    // Paso 3: deshacer saca cinco fotos de la pila y el nivel vuelve a la última: el muro se cierra de nuevo
    tl.addLabel("p3", en + 0.9);
    en = tl.labels.p3 + 0.2;
    const total = A.fotos.length, quedan = total - DESHACER.pasos;
    const vuelta = A.fotos[quedan];   // la quinta foto que saca es la que se restaura
    c.fotosA.slice(quedan).reverse().forEach((m, j) => {
      const v = { k: 0 }, i = total - 1 - j;
      const desde = PILA.clone().add(new THREE.Vector3(0, i * ALTO_FOTO, 0));
      const ultima = i === quedan;
      const hasta = ultima ? new THREE.Vector3(0, 0.6, 0) : desde.clone().add(new THREE.Vector3(1.6, 2.4, 0.6));
      tl.fromTo(v, { k: 0 }, { k: 1, duration: ultima ? 0.8 : 0.45, ease: "power2.inOut", immediateRender: false, onUpdate: () => {
        const k = v.k;
        m.visible = k < 0.999;
        m.position.lerpVectors(desde, hasta, k).setY(desde.y + (hasta.y - desde.y) * k + Math.sin(k * Math.PI) * (ultima ? 2.2 : 0.4));
        m.scale.setScalar(ultima ? 1 + (1 / FOTO - 1) * k : 1 - k * 0.6);
        m.userData.brillo(ultima ? k * 0.8 : 0.3);
        m.material.forEach((mt) => { mt.opacity = ultima ? 1 : 1 - k; });
      } }, en + j * 0.16);
    });
    const llega = en + (DESHACER.pasos - 1) * 0.16 + 0.8;
    contar(en + 0.3, quedan);
    tl.fromTo(c.flash, { intensity: 0 }, { intensity: 22, duration: 0.08, yoyo: true, repeat: 1, immediateRender: false }, llega - 0.1)
      .fromTo(c.undo, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5, immediateRender: false }, en + 0.3);
    // El nivel vuelve a la foto: jugador, llave, muro y cerrojo
    const pj0 = posA(...A.final.jugador), pj1 = posA(...vuelta.jugador);
    tl.fromTo(pj.raiz.position, { x: pj0.x, z: pj0.z }, { x: pj1.x, z: pj1.z, duration: 0.5, ease: "power2.inOut", immediateRender: false }, llega - 0.2);
    girar(llega - 0.2, "R");
    c.cajasA.forEach((x) => {
      const ka = A.final.cajas.find((k) => k.id === x.k.id), kb = vuelta.cajas.find((k) => k.id === x.k.id);
      if (!ka || !kb || (ka.f === kb.f && ka.c === kb.c)) return;
      const a = posA(ka.f, ka.c), b = posA(kb.f, kb.c);
      tl.fromTo(x.g.position, { x: a.x, z: a.z }, { x: b.x, z: b.z, duration: 0.5, ease: "power2.inOut", immediateRender: false }, llega - 0.2);
    });
    tl.fromTo(c.muro.position, { y: -0.5 }, { y: 0.45, duration: 0.5, ease: "back.out(1.6)", immediateRender: false }, llega)
      .fromTo(c.muroAbierto.material, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, llega)
      .fromTo(c.cerrojoAbierto.material, { opacity: 1 }, { opacity: 0, duration: 0.3, immediateRender: false }, llega)
      .fromTo(c.cerrojo.material, { opacity: 0 }, { opacity: 1, duration: 0.3, immediateRender: false }, llega)
      .to(c.luzLlave, { intensity: 0, duration: 0.4 }, llega);
    en = llega + 0.8;

    // Paso 4: nivel 3. El tablero cambia, la pila se vacía (iniciarNivel limpia el historial) y la caja se desliza en el hielo
    tl.addLabel("p4", en + 0.6);
    en = tl.labels.p4;
    tl.to(c.undo, { autoAlpha: 0, duration: 0.3 }, en)
      .to(c.res, { autoAlpha: 0, duration: 0.3 }, en)
      .fromTo(ARMADO.a, { p: 1 }, { p: 0, duration: 0.9, ease: "power2.in", immediateRender: false, onUpdate: () => c.ta.armar(ARMADO.a.p) }, en)
      .to(c.cajasA.map((x) => x.g.scale), { x: 0.001, y: 0.001, z: 0.001, duration: 0.4, ease: "power2.in" }, en)
      .fromTo(c.cual, { v: 0 }, { v: 1, duration: 0.45, ease: "none", immediateRender: false, onUpdate: () => mostrarNivel() }, en + 0.5)
      .fromTo(ARMADO.b, { p: 0 }, { p: 1, duration: 1.1, ease: "power1.out", immediateRender: false, onUpdate: () => c.tb.armar(ARMADO.b.p) }, en + 0.5)
      .fromTo(c.cajasB.map((x) => x.g.position), { y: 5 }, { y: 0, duration: 0.6, ease: "bounce.out", immediateRender: false }, en + 1.1)
      .to(c.nivelTxt[0], { autoAlpha: 0, duration: 0.3 }, en + 0.4)
      .to(c.nivelTxt[1], { autoAlpha: 1, duration: 0.4 }, en + 0.9)
      .to(c.reglaHielo, { autoAlpha: 1, duration: 0.5 }, en + 1.2)
      .to(c.filas.N, { "--activo": 1, duration: 0.3 }, en + 1.2);
    c.fotosA.slice(0, quedan).forEach((m, i) => {
      tl.to(m.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.35, ease: "power2.in" }, en + 0.2 + (quedan - 1 - i) * 0.06);
    });
    contar(en + 0.5, 0);
    const pjB = posB(...B.inicio.jugador);
    tl.fromTo(pj.raiz.position, { y: 0 }, { y: 3, duration: 0.45, ease: "power2.out", immediateRender: false }, en + 0.3)
      .fromTo(pj.raiz.position, { x: pj1.x, z: pj1.z }, { x: pjB.x, z: pjB.z, duration: 0.01, immediateRender: false }, en + 0.75)
      .fromTo(pj.raiz.position, { y: 3 }, { y: 0, duration: 0.5, ease: "bounce.out", immediateRender: false }, en + 0.8);
    en += 1.9;
    B.pasos.forEach((p, i) => {
      if (p.r.deslizo) aviso("hielo", en + 0.4, 1.4);
      en = paso(p, en, posB, c.cajasB, c.fotosB, i);
    });
    tl.to(c.filas.N, { "--activo": 0, duration: 0.3 }, en + 0.4);
    aviso("completo", en + 0.1, 1.8);
    tl.to(pj.raiz.rotation, { y: 0, duration: 0.3 }, en + 0.3)
      .to(pj.pose, { aplaste: 0.5, duration: 0.1, onUpdate: pj.aplicar }, en + 0.5)
      .to(pj.pose, { aplaste: -0.3, brazoI: -2.8, brazoD: -2.8, abrir: 0.3, duration: 0.15, onUpdate: pj.aplicar }, en + 0.6)
      .to(pj.pose, { aplaste: 0, brazoI: 0, brazoD: 0, abrir: 0, duration: 0.45, ease: "elastic.out(1, 0.4)", onUpdate: pj.aplicar }, en + 1);
  },

  vida(c) {
    if (c.sin3d) return { kill() {} };
    const hielo = c.tb.especiales["~"] || [];
    const tick = (tt) => {
      c.w.deriva.set(Math.sin(tt * 0.12) * 0.5, Math.sin(tt * 0.17 + 0.8) * 0.3, Math.sin(tt * 0.09 + 2) * 0.3);
      c.pj.cabeza.rotation.y = Math.sin(tt * 0.6) * 0.35;
      hielo.forEach((m) => { m.material.emissiveIntensity = 0.25 + Math.sin(tt * 1.7) * 0.12; });
    };
    gsap.ticker.add(tick);
    // Cada tanto un destello recorre la pila de fotos, de abajo hacia arriba
    const brillo = eventos(() => {
      const visibles = [...c.fotosA, ...c.fotosB].filter((m) => m.visible && m.scale.x > 0.5 && m.scale.x < 1.5);
      visibles.forEach((m, i) => { const b = { v: 0.5 }; gsap.to(b, { v: 0, duration: 0.5, delay: i * 0.06, onUpdate: () => m.userData.brillo(b.v) }); });
    }, [2.5, 5]);
    return juntas({ kill: () => gsap.ticker.remove(tick) }, brillo);
  },

  desmontar(c) {
    if (c.w) c.w.destruir();
    manchaGuardada = null;
  },
};
