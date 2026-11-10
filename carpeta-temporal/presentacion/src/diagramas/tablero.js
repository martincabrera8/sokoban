import * as THREE from "three";
import { gsap } from "gsap";
import { el, pixel, img, t } from "../util.js";
import { crearVista, orbitar } from "../vista3d.js";

const PISO = { 1955: "tiles/floor_1955", 1985: "tiles/floor_1985", 2015: "tiles/floor_2015" };
const PARED = { 1955: "tiles/wall_brick", 1985: "tiles/wall_mall", 2015: "tiles/wall_future" };
const MIRA = { arriba: "characters/player_up", abajo: "characters/player_down", izquierda: "characters/player_left", derecha: "characters/player_right" };

/**
 * Arma un tablero 2D cenital con las baldosas reales a partir de líneas de nivel ("#", " ", ".", "$", "*", "@").
 * Las cajas y el jugador son fichas que se mueven con transform; el fondo son baldosas fijas.
 */
export function tableroPixel(padre, lineas, { b = 64, x = 0, y = 0, epoca = 1985, clases = "" } = {}) {
  const cols = lineas[0].length;
  const raiz = el("div", "pos " + clases, padre, { vars: { x, y } });
  const fondo = el("div", "tablero pixel", raiz, { vars: { cols: String(cols), b } });
  const celdas = [];
  const cajas = [];
  let jugador = null;
  lineas.forEach((linea, fy) => [...linea].forEach((c, fx) => {
    const destino = c === "." || c === "*" || c === "+";
    const clave = c === "#" ? PARED[epoca] : destino ? "goals/goal" : PISO[epoca];
    celdas.push(pixel(clave, fondo, ""));
    if (c === "$" || c === "*") {
      const caja = el("div", "ficha" + (c === "*" ? " ficha--en-destino" : ""), raiz, { vars: { b } });
      pixel("boxes/box_wood", caja, "Caja");
      caja.dataset.x = fx; caja.dataset.y = fy;
      cajas.push(caja);
    }
    if (c === "@" || c === "+") {
      jugador = el("div", "ficha ficha--jugador", raiz, { vars: { b } });
      pixel(MIRA.abajo, jugador, "Jugador");
      jugador.dataset.x = fx; jugador.dataset.y = fy;
    }
  }));
  return { raiz, fondo, cajas, jugador, b, cols, filas: lineas.length };
}

/** Cambia el sprite del jugador según hacia dónde mira. */
export function mirar(jugador, direccion) {
  const imagen = jugador.querySelector("img");
  imagen.src = img(MIRA[direccion]);
}

/* ───────────── Kit 3D compartido por el equipo y el arte ───────────── */

/** Textura pixel art nítida (sin suavizado) a partir de la imagen embebida. */
function texturaPixel(clave) {
  const x = new THREE.TextureLoader().load(img(clave));
  x.colorSpace = THREE.SRGBColorSpace;
  x.magFilter = THREE.NearestFilter;
  x.minFilter = THREE.NearestFilter;
  x.generateMipmaps = false;
  return x;
}

/** Color de un token con alfa, para dibujar en un canvas. */
function rgba(token, a) {
  const c = new THREE.Color(t(token));
  return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`;
}

/** Punto suave para partículas. */
export function texturaPunto(token = "tinta") {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(token, 1)); gr.addColorStop(0.3, rgba(token, 0.55)); gr.addColorStop(1, rgba(token, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

/** Degradé vertical (opaco abajo, transparente arriba) para haces de luz. */
export function texturaHaz() {
  const c = document.createElement("canvas"); c.width = 4; c.height = 128;
  const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 128, 0, 0);
  gr.addColorStop(0, rgba("tinta", 1)); gr.addColorStop(0.25, rgba("tinta", 0.45)); gr.addColorStop(1, rgba("tinta", 0));
  g.fillStyle = gr; g.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(c);
}

/**
 * Brote de chispas: n partículas que salen de un punto, suben y caen con gravedad.
 * aplicar(p) las ubica según el avance 0..1 (reversible desde un tween).
 */
export function crearBrote(escena, { n = 140, token = "acento", tam = 0.12, fuerza = 3, alto = 4.5, mapa } = {}) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const puntos = new THREE.Points(geo, new THREE.PointsMaterial({ color: t(token), map: mapa || texturaPunto(), size: tam, transparent: true, opacity: 0,
    blending: THREE.AdditiveBlending, depthWrite: false }));
  puntos.frustumCulled = false;
  const vel = Array.from({ length: n }, () => {
    const a = Math.random() * Math.PI * 2, v = gsap.utils.random(0.3, 1) * fuerza;
    return [Math.cos(a) * v, gsap.utils.random(0.4, 1) * alto, Math.sin(a) * v];
  });
  escena.add(puntos);
  const origen = new THREE.Vector3();
  const aplicar = (p) => {
    vel.forEach(([vx, vy, vz], i) => pos.set([origen.x + vx * p, origen.y + vy * p - 4.2 * p * p, origen.z + vz * p], i * 3));
    geo.attributes.position.needsUpdate = true;
    puntos.material.opacity = p > 0 && p < 1 ? Math.min(1, (1 - p) * 1.6) : 0;
  };
  aplicar(0);
  return { puntos, origen, aplicar };
}

/**
 * Escena 3D de una diapositiva: renderer propio con resplandor, cámara y proyección a coordenadas del escenario
 * (para anclar rótulos HTML nítidos). antes() corre en cada cuadro, antes de dibujar; orbitar(mira) suma el giro
 * que el expositor le da arrastrando.
 */
export function escena3d(lienzo, { aria, niebla = [20, 46], exposicion = 1.1, brillo = [0.7, 0.55, 0.8], fov = 30, orbita = { giro: 0.5, alto: 0.2 } } = {}) {
  const vista = crearVista(lienzo, { aria, exposicion });
  if (!vista) return null;
  const { caja, renderer, W, H } = vista;
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(t("fondo"));
  escena.fog = new THREE.Fog(t("fondo"), niebla[0], niebla[1]);
  const camara = vista.camara(fov, 0.1, 160);
  const texturas = {};
  const tex = (k) => (texturas[k] ||= texturaPixel(k));
  const proyectar = (p) => vista.proyectar(p, camara);
  const kit = { caja, renderer, escena, camara, tex, proyectar, antes: null, W, H };
  kit.orbitar = (mira) => orbitar(camara, mira, vista.orbita);
  kit.arrancar = () => vista.animar({ escena, camara, brillo, orbita, cada: () => { if (kit.antes) kit.antes(); } });
  kit.destruir = () => { vista.liberarTambien(...Object.values(texturas)); vista.destruir(); };
  return kit;
}

/**
 * Muchas baldosas iguales en un solo dibujo. Cada baldosa sigue siendo un objeto con posición, giro y escala
 * (la línea de tiempo los anima igual que antes); sincronizar() los copia a las instancias.
 */
export function enInstancias(padre, geo, mat, objetos, { sombra = true } = {}) {
  const malla = new THREE.InstancedMesh(geo, mat, objetos.length);
  malla.castShadow = sombra; malla.receiveShadow = true; malla.frustumCulled = false;
  padre.add(malla);
  const sincronizar = () => {
    objetos.forEach((o, i) => { o.updateMatrix(); malla.setMatrixAt(i, o.matrix); });
    malla.instanceMatrix.needsUpdate = true;
  };
  sincronizar();
  return sincronizar;
}

/**
 * Caja con dos materiales en dos tramos (menos dibujos por cuadro que seis caras sueltas):
 * material 0 para los costados y material 1 para la cara elegida (0 +x, 1 -x, 2 arriba, 3 abajo, 4 frente, 5 atrás).
 */
export function cajaDosCaras(ancho, alto, fondo, cara) {
  const g = new THREE.BoxGeometry(ancho, alto, fondo);
  const idx = Array.from(g.index.array);
  const propia = idx.slice(cara * 6, cara * 6 + 6);
  g.setIndex([...idx.slice(0, cara * 6), ...idx.slice(cara * 6 + 6), ...propia]);
  g.clearGroups();
  g.addGroup(0, 30, 0);
  g.addGroup(30, 6, 1);
  return g;
}
