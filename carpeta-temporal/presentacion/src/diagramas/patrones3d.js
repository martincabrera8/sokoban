import * as THREE from "three";
import { t, img } from "../util.js";
import { crearVista, orbitar } from "../vista3d.js";

/*
 * Base 3D de las tres diapositivas de patrones (Observer, Facade, Singleton).
 * Un renderer por diapositiva, con resplandor, y utilidades para anclar carteles HTML a puntos 3D:
 * el texto queda nítido y legible, y el 3D se mueve detrás.
 */

const texturas = new Map();
/** Textura pixel art de assets/ (sin suavizado, como en el juego). */
export function textura(k, repetir = 0) {
  const clave = k + "×" + repetir;
  if (texturas.has(clave)) return texturas.get(clave);
  const x = new THREE.TextureLoader().load(img(k));
  x.colorSpace = THREE.SRGBColorSpace;
  x.magFilter = x.minFilter = THREE.NearestFilter;
  x.generateMipmaps = false;
  if (repetir) { x.wrapS = x.wrapT = THREE.RepeatWrapping; x.repeat.set(repetir, repetir); }
  texturas.set(clave, x);
  return x;
}

let puntoGuardado = null;
/** Punto de luz difuso para chispas y paquetes que viajan. */
export function brillo() {
  if (puntoGuardado) return puntoGuardado;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  const b = new THREE.Color(t("tinta"));
  const rgba = (a) => `rgba(${Math.round(b.r * 255)},${Math.round(b.g * 255)},${Math.round(b.b * 255)},${a})`;
  gr.addColorStop(0, rgba(1)); gr.addColorStop(0.25, rgba(0.75)); gr.addColorStop(1, rgba(0));
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  puntoGuardado = new THREE.CanvasTexture(c);
  return puntoGuardado;
}

/** Chispa aditiva del color de un token. */
export function chispa(color, tam = 0.5) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brillo(), color: new THREE.Color(t(color)), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  s.scale.setScalar(tam);
  s.frustumCulled = false;
  return s;
}

/** Haz de luz a lo largo de una curva; se dibuja con drawRange (0 a 1 en `haz.userData.avance`). */
export function haz(curva, color, radio = 0.03, opacidad = 0.5) {
  const geo = new THREE.TubeGeometry(curva, 90, radio, 8, false);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(t(color)), transparent: true, opacity: opacidad, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.frustumCulled = false;
  const total = geo.index.count;
  m.userData.dibujar = (f) => geo.setDrawRange(0, Math.round((total / 6) * Math.max(0, Math.min(1, f))) * 6);
  return m;
}

/** Ubica un elemento HTML en coordenadas del escenario (las posiciones van por variables CSS). */
export function anclar(e, p, escala = 1) {
  e.style.setProperty("--ax", p.x.toFixed(1));
  e.style.setProperty("--ay", p.y.toFixed(1));
  e.style.setProperty("--as", escala.toFixed(3));
}

/**
 * Monta el mundo: renderer, cámara, resplandor y bucle (el de la vista común).
 * Devuelve null si no hay WebGL (la diapositiva muestra su respaldo 2D).
 */
export function mundo3d(lienzo, { descripcion, fov = 30, resplandor = [0.8, 0.55, 0.78], niebla = [22, 48], orbita = { giro: 0.5, alto: 0.18 } }) {
  const vista = crearVista(lienzo, { aria: descripcion, exposicion: 1.1, recorte: true, sombras: false });
  if (!vista) return null;
  const { W, H } = vista;
  const escena = new THREE.Scene();
  escena.background = new THREE.Color(t("fondo-hondo"));
  escena.fog = new THREE.Fog(t("fondo-hondo"), niebla[0], niebla[1]);
  const camara = vista.camara(fov, 0.1, 200);
  const mira = new THREE.Vector3();
  const deriva = new THREE.Vector3();

  const tareas = [];
  const v = new THREE.Vector3();
  const ox = vista.ex, oy = vista.ey;
  /** Punto 3D → coordenadas del escenario de 1920×1080, más la distancia a la cámara. */
  const proyectar = (p) => {
    v.copy(p).project(camara);
    return { x: ((v.x + 1) / 2) * W - ox, y: ((1 - v.y) / 2) * H - oy, d: camara.position.distanceTo(p), atras: v.z > 1 };
  };
  const rayo = new THREE.Raycaster();
  /** Punto del escenario → punto 3D sobre un plano (para que los haces lleguen a un cartel HTML). */
  const enPlano = (x, y, plano) => {
    rayo.setFromCamera(new THREE.Vector2(((x + ox) / W) * 2 - 1, 1 - ((y + oy) / H) * 2), camara);
    return rayo.ray.intersectPlane(plano, new THREE.Vector3());
  };

  // La posición de la cámara la fija la diapositiva; acá se le suma la deriva y la órbita del arrastre, y se restan después.
  const base = new THREE.Vector3();
  const t0 = performance.now();
  let preparada = false;
  const cada = (seg) => {
    base.copy(camara.position);
    camara.position.add(deriva);
    camara.lookAt(mira);
    orbitar(camara, mira, vista.orbita);
    camara.updateMatrixWorld();
    tareas.forEach((f) => f(seg - t0 / 1000));
  };
  const despues = () => camara.position.copy(base);

  return {
    escena, camara, mira, deriva, W, H, proyectar, enPlano,
    /** Antes de dibujar cada cuadro (anclas, viajes). Recibe los segundos desde el montaje. */
    cadaCuadro: (f) => tareas.push(f),
    /** Arranca el bucle: compila los shaders y sube las texturas antes de que la diapositiva entre. */
    preparar: () => { if (!preparada) { preparada = true; vista.animar({ escena, camara, brillo: resplandor, orbita, cada, despues }); } },
    destruir: () => { vista.liberarTambien(...texturas.values(), puntoGuardado); texturas.clear(); puntoGuardado = null; vista.destruir(); },
  };
}
