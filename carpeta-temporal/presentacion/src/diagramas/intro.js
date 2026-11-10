import * as THREE from "three";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { t as tok, img, el, eventos, juntas, fovPara } from "../util.js";
import { crearPersonaje } from "../personaje3d.js";

gsap.registerPlugin(SplitText);

/*
 * Intro en 3D, como un plano secuencia de tráiler.
 * Oscuridad. Se prende un cenital y cae una sola caja: golpe seco y polvo. Después llueven 520 cajas reales
 * (boxes/box_wood) que tapizan el piso y, como si alguien ordenara el caos, vuelan a su lugar: 232 forman
 * SOKOBAN y el resto se apila en pallets al fondo. La N queda corrida dos baldosas.
 * Entra el personaje del juego (los píxeles del sprite de Martín), salta con los brazos arriba y empuja la N
 * hasta su destino. El encastre enciende todo: la palabra de la N a la S, una onda que arma el nivel baldosa
 * por baldosa con las tres épocas (1955, 1985, 2015), haces de luz y el cielo con estrellas.
 * Remata en un plano héroe con la palabra encendida y el personaje saludando arriba de la N.
 *
 * Todo el estado de la escena es una función del tiempo del timeline (reloj.t): se puede saltar a cualquier
 * segundo, volver atrás o ir al final y siempre se ve bien.
 */

const DUR = 13.6;
const VOX = 0.2, T = 1.3, FOV = 30, G = 22, VEL_ONDA = 11;
const FUENTE = {
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
};
const PALABRA = [..."SOKOBAN"];
const xLetra = (i) => (i - 3) * T;
const X_META = xLetra(6), ALTO = 7 * VOX;

/* El nivel que arma la onda. Columna c → i = c - 9; fila r → j = r - 8 (la palabra está en j = 0).
   # pared, . piso, * destino con un pallet de cajas, o destino vacío (lo que falta resolver). */
const MAPA = [
  "  #####.....#####  ",
  " ##.............## ",
  " #..*....*....*..# ",
  " #.....o.........# ",
  "##.*...........*.##",
  "#*................#",
  "#..............o..#",
  "#.................#",
  "#..................",
  "#.................#",
  " ................. ",
  "  ...............  ",
];
const PISO = ["tiles/floor_1955", "tiles/floor_1985", "tiles/floor_2015"];
const PARED = ["tiles/wall_brick", "tiles/wall_mall", "tiles/wall_future"];
const TINTE = [0.5, 1.1, 0.85];

/* Marcas de tiempo (segundos) */
const M = {
  luz: 0.3, primera: 0.55, lluvia: 1.35, orden: 3.9,
  entra: 5.05, salto: 5.85, aterriza: 6.55, empuje1: 7.0, empuje2: 7.7, encastre: 8.25,
  festejo: 9.15, cae: 9.9, saludo: 10.5, bajada: 11.2,
};

const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const tramo = (x, a, b) => cl((x - a) / (b - a));
const suave = (x) => x * x * (3 - 2 * x);
const mez = (a, b, k) => a + (b - a) * k;
const campana = (x, a, b) => Math.sin(Math.PI * tramo(x, a, b));
const E = {
  io3: gsap.parseEase("power3.inOut"), io2: gsap.parseEase("power2.inOut"), o2: gsap.parseEase("power2.out"),
  o3: gsap.parseEase("power3.out"), back: gsap.parseEase("back.out(2.2)"), elas: gsap.parseEase("elastic.out(1, 0.38)"),
};

/** Azar con semilla: la coreografía es siempre la misma. */
function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let x = Math.imul(a ^ (a >>> 15), 1 | a);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Interpolación cúbica monótona (Fritsch y Carlson): reparte el avance de la cámara sin frenazos. */
function monotona(xs, ys) {
  const n = xs.length, d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], s = (x - xs[i]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * ys[i + 1] + (s3 - s2) * h * m[i + 1];
  };
}

/** Una pista de cámara: claves [t, x, y, z] unidas por una curva Catmull-Rom centrípeta. */
function pista(claves) {
  const curva = new THREE.CatmullRomCurve3(claves.map((c) => new THREE.Vector3(c[1], c[2], c[3])), false, "centripetal");
  const u = monotona(claves.map((c) => c[0]), claves.map((_, i) => i / (claves.length - 1)));
  return (x, out) => curva.getPoint(cl(u(x)), out);
}

const POS = pista([
  [0.0, 0.95, 0.3, 3.45], [1.3, 0.78, 0.32, 3.15], [1.9, 1.0, 0.75, 4.6], [2.9, 1.5, 3.1, 9.1], [3.7, 0.6, 5.6, 12.5],
  [4.5, -1.1, 3.7, 11.5], [5.1, 2.6, 2.5, 10.3], [5.8, 11.6, 1.95, 8.3], [6.5, 10.9, 2.0, 8.5], [7.1, 9.6, 1.7, 7.2],
  [8.25, 7.7, 1.5, 6.2], [8.75, 8.4, 1.85, 7.7], [9.7, 6.1, 2.8, 11.2], [10.9, 2.1, 3.0, 12.9], [12.2, 0.2, 2.75, 12.4], [DUR, 0, 2.7, 12.2],
]);
const MIRA = pista([
  [0.0, 0.1, 0.24, 1.75], [1.3, 0.1, 0.22, 1.75], [1.9, 0.05, 0.95, 0.4], [2.9, 0.0, 0.8, -0.5], [3.7, 0.0, 0.45, -1.0],
  [4.5, -0.8, 0.9, 0], [5.1, 2.4, 0.9, 0], [5.8, 7.7, 1.45, 0], [6.5, 7.2, 1.45, 0], [7.1, 6.2, 1.05, 0],
  [8.25, 4.7, 1.0, 0], [8.75, 4.3, 1.1, 0], [9.7, 2.8, 1.45, -1.0], [10.9, 0.8, 1.5, -1.5], [12.2, 0.1, 1.5, -1.6], [DUR, 0, 1.5, -1.6],
]);
/* Golpes de cámara: [momento, fuerza] */
const GOLPES = [[1.08, 0.03], [6.58, 0.014], [7.55, 0.008], [8.25, 0.06], [9.92, 0.012]];

function textura(k, recorte) {
  const x = new THREE.TextureLoader().load(img(k));
  x.colorSpace = THREE.SRGBColorSpace;
  x.magFilter = THREE.NearestFilter;
  x.minFilter = THREE.LinearMipmapLinearFilter;
  if (recorte) { x.repeat.set(recorte[2] / 64, recorte[3] / 64); x.offset.set(recorte[0] / 64, 1 - (recorte[1] + recorte[3]) / 64); }
  return x;
}

function punto() {
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d"), b = new THREE.Color(tok("tinta"));
  const rgba = (a) => `rgba(${Math.round(b.r * 255)},${Math.round(b.g * 255)},${Math.round(b.b * 255)},${a})`;
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, rgba(1)); gr.addColorStop(0.3, rgba(0.55)); gr.addColorStop(1, rgba(0));
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

/* ── Sombreadores ── */
const VERT_HAZ = `
uniform float uAlto; varying float vH; varying vec3 vN; varying vec3 vV;
void main() {
  vH = position.y / uAlto;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
/* Haz volumétrico falso: borde suave por ángulo de vista y desvanecido a lo largo. uModo 0 = cono de un cenital, 1 = reflector. */
const FRAG_HAZ = `
uniform vec3 uColor; uniform float uOpacidad, uModo; varying float vH; varying vec3 vN; varying vec3 vV;
void main() {
  float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
  float cono = smoothstep(0.0, 0.12, vH) * mix(0.25, 1.0, vH);
  float reflector = pow(1.0 - vH, 1.7) * smoothstep(0.0, 0.03, vH);
  gl_FragColor = vec4(uColor, f * uOpacidad * mix(cono, reflector, uModo));
}`;
const VERT_ANILLO = `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG_ANILLO = `
uniform vec3 uColor; uniform float uR, uAncho, uOpacidad; varying vec2 vP;
void main() {
  float d = length(vP);
  float a = exp(-pow((d - uR) / uAncho, 2.0)) + 0.16 * smoothstep(uR, 0.0, d) * step(0.001, uR);
  gl_FragColor = vec4(uColor, a * uOpacidad);
}`;
const VERT_CIELO = `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAG_CIELO = `
uniform vec3 uAbajo, uArriba, uHalo, uNoche; uniform float uBrillo, uHaloF; varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir); float h = d.y;
  vec3 c = mix(uAbajo, uArriba, smoothstep(0.0, 0.5, h));
  vec2 az = normalize(d.xz + vec2(0.0001));
  float halo = pow(max(-az.y, 0.0), 2.0) * exp(-h * 4.5) * smoothstep(0.0, 0.2, h);
  c += uHalo * halo * uHaloF;
  c = mix(uNoche, c, uBrillo);
  gl_FragColor = vec4(c, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const VERT_ESTRELLAS = `
attribute float aFase; attribute float aTam; attribute vec3 aColor; uniform float uTiempo, uPx; varying float vTit; varying vec3 vColor;
void main() {
  vColor = aColor;
  vTit = 0.6 + 0.4 * sin(uTiempo * (0.7 + aFase * 1.6) + aFase * 40.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aTam * uPx;
}`;
const FRAG_ESTRELLAS = `
uniform float uBrillo; varying float vTit; varying vec3 vColor;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d); a *= a;
  gl_FragColor = vec4(vColor, a * vTit * uBrillo);
}`;
/* Polvo en suspensión: brilla dentro del cono del cenital, como en un depósito real. */
const VERT_POLVO = `
attribute float aFase; uniform float uTiempo, uPx, uMax, uFocoCos, uFoco, uBase; uniform vec3 uFocoPos, uFocoDir; varying float vA;
void main() {
  vec3 p = position;
  p.x += sin(uTiempo * 0.21 + aFase * 7.0) * 0.25; p.y += sin(uTiempo * 0.17 + aFase * 3.0) * 0.3; p.z += cos(uTiempo * 0.19 + aFase * 5.0) * 0.25;
  vec4 w = modelMatrix * vec4(p, 1.0);
  float c = dot(normalize(w.xyz - uFocoPos), uFocoDir);
  vA = uFoco * smoothstep(uFocoCos, mix(uFocoCos, 1.0, 0.35), c) + uBase;
  vec4 mv = viewMatrix * w;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = min(uPx * (0.6 + aFase) * 0.02 / -mv.z, uMax);
}`;
const FRAG_POLVO = `
uniform vec3 uColor; varying float vA;
void main() { float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(uColor, smoothstep(0.5, 0.0, d) * vA); }`;
/* Etalonado final, después del tone mapping: aberración leve en los bordes, viñeta, grano, destello, fundido y bandas de cine. */
const ETALON = {
  uniforms: {
    tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1920, 1080) }, uTiempo: { value: 0 }, uGrano: { value: 0.03 }, uVineta: { value: 0.55 },
    uNegro: { value: 1 }, uColNegro: { value: new THREE.Vector3() }, uDestello: { value: 0 }, uColDestello: { value: new THREE.Vector3(1, 1, 1) },
    uBanda: { value: 1 }, uBarras: { value: 1 },
  },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
uniform sampler2D tDiffuse; uniform vec2 uRes; uniform float uTiempo, uGrano, uVineta, uNegro, uDestello, uBanda, uBarras; uniform vec3 uColNegro, uColDestello; varying vec2 vUv;
void main() {
  vec2 c = vUv - 0.5; vec2 ca = c; ca.x *= uRes.x / uRes.y;
  float r2 = dot(c, c);
  vec2 off = c * r2 * 0.012;
  vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
  col *= mix(1.0, smoothstep(1.15, 0.2, length(ca)), uVineta);
  float n = fract(sin(dot(floor(vUv * uRes) + fract(uTiempo * 7.13) * vec2(37.0, 91.0), vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * uGrano;
  col = mix(col, uColDestello, uDestello);
  col = mix(col, uColNegro, uNegro);
  float barra = (1.0 - uBanda) * 0.5 * uBarras;
  if (vUv.y < barra || vUv.y > 1.0 - barra) col = uColNegro;
  gl_FragColor = vec4(col, 1.0);
}`,
};

function materialHaz(color, modo, alto) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacidad: { value: 0 }, uModo: { value: modo }, uAlto: { value: alto } },
    vertexShader: VERT_HAZ, fragmentShader: FRAG_HAZ, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
}
const ARRIBA = new THREE.Vector3(0, 1, 0);
function haz(color, rBase, rTope, alto, modo) {
  const geo = new THREE.CylinderGeometry(rTope, rBase, alto, 40, 1, true);
  geo.translate(0, alto / 2, 0);
  const m = new THREE.Mesh(geo, materialHaz(color, modo, alto));
  m.frustumCulled = false;
  m.renderOrder = 2;
  return m;
}
function anillo(color, lado) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(lado, lado), new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uR: { value: 0 }, uAncho: { value: 0.3 }, uOpacidad: { value: 0 } },
    vertexShader: VERT_ANILLO, fragmentShader: FRAG_ANILLO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}
function nube(n, color, tam, mapa) {
  const p = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color, map: mapa, size: tam, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  p.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  p.frustumCulled = false;
  return p;
}

/* ── Respaldo sin WebGL: la palabra hecha con las cajas del juego en HTML ── */
function montarRespaldo(lienzo, bajada, linea) {
  const caja = el("div", "intro__respaldo2", lienzo, { "aria-hidden": "true" });
  const celdas = [];
  PALABRA.forEach((ch) => {
    const letra = el("div", "intro__letra", caja);
    FUENTE[ch].forEach((fila) => [...fila].forEach((c) => {
      const celda = el("i", "intro__celda", letra);
      if (c === "#") celdas.push(el("img", "intro__caja pixel", celda, { src: img("boxes/box_wood"), alt: "" }));
    }));
  });
  return { sin3d: true, celdas, bajada, linea };
}

export default {
  montar(lienzo) {
    const velo = el("div", "intro__velo", lienzo);
    const linea = el("div", "intro__linea pos", lienzo, { vars: { x: 810, y: 868 } });
    const bajada = el("p", "intro__bajada intro__credito pos", lienzo, { texto: "Proceso de Desarrollo de Software, UADE", vars: { x: 0, y: 890 } });
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    } catch (err) {
      return { ...montarRespaldo(lienzo, bajada, linea), velo };
    }
    const caja = el("div", "escena3d intro__escena", lienzo);
    lienzo.insertBefore(caja, velo);
    let W = caja.offsetWidth || 1920, H = caja.offsetHeight || 1080;
    const escala = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--escala")) || 1;
    const prBase = Math.min(1.5, (window.devicePixelRatio || 1) * escala);
    renderer.setPixelRatio(prBase);
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "En la oscuridad cae una caja y después cientos que se ordenan formando la palabra Sokoban. El personaje del juego empuja la N hasta su destino y eso enciende el nivel con sus tres épocas.");
    caja.appendChild(renderer.domElement);
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const rnd = azar(1985);

    const col = (k) => new THREE.Color(tok(k));
    const escena = new THREE.Scene();
    const noche = col("fondo-hondo").multiplyScalar(0.55);
    const horizonte = col("superficie-2").lerp(col("fondo"), 0.35);
    escena.fog = new THREE.Fog(noche.clone(), 12, 40);
    const camara = new THREE.PerspectiveCamera(fovPara(FOV, W / H), W / H, 0.05, 700);

    // Bóveda: cielo con degradé y estrellas; sigue a la cámara, así el horizonte coincide siempre con la niebla
    const boveda = new THREE.Group();
    const cieloMat = new THREE.ShaderMaterial({
      uniforms: { uAbajo: { value: horizonte }, uArriba: { value: col("fondo-hondo") }, uHalo: { value: col("acento").multiplyScalar(0.22) }, uNoche: { value: noche }, uBrillo: { value: 0 }, uHaloF: { value: 0 } },
      vertexShader: VERT_CIELO, fragmentShader: FRAG_CIELO, side: THREE.BackSide, depthWrite: false, fog: false,
    });
    const cielo = new THREE.Mesh(new THREE.SphereGeometry(300, 48, 24), cieloMat);
    cielo.renderOrder = -10; cielo.frustumCulled = false;
    boveda.add(cielo);
    const nEst = 1500, posEst = new Float32Array(nEst * 3), faseEst = new Float32Array(nEst), tamEst = new Float32Array(nEst), colEst = new Float32Array(nEst * 3);
    const tonos = [col("tinta"), col("linea"), col("titulo"), col("tinta-2")];
    for (let i = 0; i < nEst; i++) {
      const az = rnd() * Math.PI * 2, el2 = Math.asin(mez(0.07, 1, Math.pow(rnd(), 0.8))), r = 280;
      posEst.set([Math.cos(az) * Math.cos(el2) * r, Math.sin(el2) * r, Math.sin(az) * Math.cos(el2) * r], i * 3);
      faseEst[i] = rnd(); tamEst[i] = rnd() < 0.06 ? mez(2.6, 3.6, rnd()) : mez(0.9, 2.0, rnd());
      const c = tonos[rnd() < 0.7 ? 0 : 1 + Math.floor(rnd() * 3)];
      colEst.set([c.r, c.g, c.b], i * 3);
    }
    const geoEst = new THREE.BufferGeometry();
    geoEst.setAttribute("position", new THREE.BufferAttribute(posEst, 3));
    geoEst.setAttribute("aFase", new THREE.BufferAttribute(faseEst, 1));
    geoEst.setAttribute("aTam", new THREE.BufferAttribute(tamEst, 1));
    geoEst.setAttribute("aColor", new THREE.BufferAttribute(colEst, 3));
    const estrellas = new THREE.Points(geoEst, new THREE.ShaderMaterial({
      uniforms: { uTiempo: { value: 0 }, uPx: { value: prBase }, uBrillo: { value: 0 } },
      vertexShader: VERT_ESTRELLAS, fragmentShader: FRAG_ESTRELLAS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    }));
    estrellas.frustumCulled = false; estrellas.renderOrder = -9;
    boveda.add(estrellas);
    escena.add(boveda);

    // Piso oscuro y brillante, enorme: su borde queda siempre dentro de la niebla
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(420, 420), new THREE.MeshStandardMaterial({ color: col("fondo-hondo").multiplyScalar(0.6), roughness: 0.7, metalness: 0 }));
    suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true;
    escena.add(suelo);

    // ── El nivel: baldosas, paredes y destinos de las tres épocas ──
    const baldosas = [], paredes = [], metas = [], pallets = [];
    let metaPrincipal = null;
    MAPA.forEach((fila, r) => [...fila].forEach((ch, c) => {
      if (ch === " ") return;
      const i = c - 9, j = r - 8, x = i * T, z = j * T;
      const era = i <= -4 ? 0 : i >= 4 ? 2 : 1;
      const d = Math.hypot(x - X_META, z);
      const enFila = j === 0 && i >= -3 && i <= 5;
      const tAp = enFila ? M.orden - 0.2 + (i + 3) * 0.12 : M.encastre + 0.05 + d / VEL_ONDA;
      const lejos = 1 - 0.78 * suave(tramo(Math.hypot(x, z + 2.5), 8.5, 15.5));
      const radial = d > 0.01 ? new THREE.Vector3(z / d, 0, -(x - X_META) / d) : new THREE.Vector3(1, 0, 0);
      const b = { x, z, era, tAp, lejos, eje: enFila ? new THREE.Vector3(1, 0, 0) : radial };
      if (ch === "#") paredes.push({ ...b, tAp: tAp + 0.1 });
      else if (enFila && i === 3) metaPrincipal = b;
      else if (ch === "*" || ch === "o") { metas.push(b); if (ch === "*") pallets.push([x, z, tAp]); }
      else baldosas.push(b);
    }));

    const geoBaldosa = new THREE.PlaneGeometry(T * 0.985, T * 0.985).rotateX(-Math.PI / 2);
    const porEra = (lista) => [0, 1, 2].map((e) => lista.filter((b) => b.era === e));
    const mallasPiso = porEra(baldosas).map((lista, e) => {
      const m = new THREE.InstancedMesh(geoBaldosa, new THREE.MeshStandardMaterial({ map: textura(PISO[e]), roughness: 0.82 }), Math.max(1, lista.length));
      m.material.map.anisotropy = aniso;
      m.receiveShadow = true; m.frustumCulled = false; m.count = lista.length; m.userData.lista = lista;
      escena.add(m);
      return m;
    });
    const geoPared = new THREE.BoxGeometry(T * 0.995, T, T * 0.995).translate(0, T / 2, 0);
    const mallasPared = porEra(paredes).map((lista, e) => {
      const m = new THREE.InstancedMesh(geoPared, new THREE.MeshStandardMaterial({ map: textura(PARED[e]), roughness: 0.9 }), Math.max(1, lista.length));
      m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; m.count = lista.length; m.userData.lista = lista;
      escena.add(m);
      return m;
    });
    const texMeta = textura("goals/goal");
    const matMetas = new THREE.MeshStandardMaterial({ map: texMeta, emissiveMap: texMeta, emissive: col("acento"), emissiveIntensity: 0, roughness: 0.6 });
    const mallaMetas = new THREE.InstancedMesh(geoBaldosa, matMetas, metas.length);
    mallaMetas.receiveShadow = true; mallaMetas.frustumCulled = false; mallaMetas.userData.lista = metas;
    escena.add(mallaMetas);
    const blanco = new THREE.Color(1, 1, 1);
    [...mallasPiso, ...mallasPared, mallaMetas].forEach((m) => { for (let i = 0; i < m.count; i++) m.setColorAt(i, blanco); });
    const matMeta = matMetas.clone();
    const meta = new THREE.Mesh(geoBaldosa, matMeta);
    meta.position.set(X_META, 0.006, 0); meta.receiveShadow = true;
    escena.add(meta);

    // ── Las cajas: 232 forman la palabra (dos de profundidad) y 288 se apilan en seis pallets ──
    const cajas = [];
    PALABRA.forEach((ch, li) => FUENTE[ch].forEach((fila, ry) => [...fila].forEach((c, cx) => {
      if (c !== "#") return;
      for (let k = 0; k < 2; k++) cajas.push({ letra: li, gx: xLetra(li) + (cx - 2) * VOX, gy: (6 - ry) * VOX + VOX / 2, gz: (k - 0.5) * VOX, piso: 6 - ry });
    })));
    const nLetras = cajas.length;
    pallets.forEach(([px, pz, tAp]) => {
      for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) for (let c = 0; c < 3; c++) {
        cajas.push({ letra: -1, gx: px + (a - 1.5) * VOX, gy: c * VOX + VOX / 2, gz: pz + (b - 1.5) * VOX, piso: c, tAp });
      }
    });
    // Lugares donde aterrizan (sin superponerse) y la primera caja, la que cae sola en la oscuridad
    const lugares = [];
    for (let x = -6.6; x <= 6.6; x += 0.32) for (let z = -4.4; z <= 2.5; z += 0.32) if (Math.hypot(x - 0.1, z - 1.75) > 0.45) lugares.push([x, z]);
    for (let i = lugares.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [lugares[i], lugares[k]] = [lugares[k], lugares[i]]; }
    const PRIMERA = cajas.findIndex((c) => c.letra === 3 && c.piso === 0 && c.gz > 0);
    cajas.forEach((c, n) => {
      const primera = n === PRIMERA;
      const [lx, lz] = primera ? [0.1, 1.75] : lugares.pop();
      c.lx = lx + (primera ? 0 : (rnd() - 0.5) * 0.05); c.lz = lz + (primera ? 0 : (rnd() - 0.5) * 0.05); c.ly = VOX / 2;
      c.yaw = primera ? 0.35 : rnd() * Math.PI * 2;
      c.y0 = primera ? 3.3 : mez(4.5, 10, rnd());
      c.dx = primera ? 0 : (rnd() - 0.5) * 1.8; c.dz = primera ? 0 : (rnd() - 0.5) * 1.8;
      c.tCae = primera ? M.primera : M.lluvia + 1.3 * Math.pow(rnd(), 0.75);
      c.tCaida = Math.sqrt((2 * (c.y0 - c.ly)) / G);
      c.tSuelo = c.tCae + c.tCaida;
      c.eje = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
      c.giro = primera ? 2.2 : mez(3, 11, rnd());
      c.rebote = primera ? 0.07 : mez(0.03, 0.08, rnd());
      c.tambaleo = new THREE.Vector3(rnd() - 0.5, 0, rnd() - 0.5).normalize();
      const base = c.letra >= 0 ? M.orden + c.letra * 0.12 + c.piso * 0.02 + rnd() * 0.1 : M.orden - 0.15 + rnd() * 0.85 + c.piso * 0.1;
      c.tOrd = Math.max(base, c.tSuelo + 0.26);
      c.dOrd = c.letra >= 0 ? mez(0.6, 0.72, rnd()) : mez(0.8, 1.05, rnd());
      const dist = Math.hypot(c.gx - c.lx, c.gz - c.lz);
      c.arco = 0.5 + dist * 0.2 + rnd() * 0.6;
      c.fx = rnd() < 0.55 ? (rnd() < 0.5 ? -1 : 1) * Math.PI * 2 : 0;
      c.fz = rnd() < 0.3 ? (rnd() < 0.5 ? -1 : 1) * Math.PI * 2 : 0;
      c.yawFin = c.yaw > Math.PI ? Math.PI * 2 : 0;
      c.tLuz = c.letra >= 0 ? M.encastre + 0.06 + (6 - c.letra) * 0.085 : c.tAp;
    });
    const texCaja = textura("boxes/box_wood", [10, 14, 44, 42]);
    texCaja.anisotropy = aniso;
    const matCaja = new THREE.MeshStandardMaterial({ map: texCaja, roughness: 0.74 });
    const uCalor = { value: col("acento") };
    matCaja.onBeforeCompile = (s) => {
      s.uniforms.uCalor = uCalor;
      s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nattribute float aBrillo;\nvarying float vBrillo;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBrillo = aBrillo;");
      s.fragmentShader = s.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vBrillo;\nuniform vec3 uCalor;")
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += vBrillo * (diffuseColor.rgb * uCalor * 2.4 + uCalor * 0.1);");
    };
    const geoCaja = new RoundedBoxGeometry(VOX * 0.93, VOX * 0.93, VOX * 0.93, 1, 0.018);
    const brillo = new THREE.InstancedBufferAttribute(new Float32Array(cajas.length), 1);
    geoCaja.setAttribute("aBrillo", brillo);
    const mallaCajas = new THREE.InstancedMesh(geoCaja, matCaja, cajas.length);
    mallaCajas.castShadow = true; mallaCajas.receiveShadow = true; mallaCajas.frustumCulled = false;
    escena.add(mallaCajas);

    // ── El personaje ──
    const pj = crearPersonaje(1.05);
    pj.raiz.visible = false;
    escena.add(pj.raiz);

    // ── Luces ──
    const hemi = new THREE.HemisphereLight(col("superficie-2"), col("fondo-hondo"), 0);
    const foco = new THREE.SpotLight(col("tinta"), 0, 0, 0.17, 1, 0);
    foco.castShadow = true;
    foco.shadow.mapSize.set(1024, 1024);
    foco.shadow.camera.near = 1.5; foco.shadow.camera.far = 40;
    foco.shadow.bias = -0.0004; foco.shadow.normalBias = 0.02;
    const contra = new THREE.DirectionalLight(col("tinta-2"), 0);
    contra.position.set(-6, 7, -10);
    const relleno = new THREE.DirectionalLight(col("titulo"), 0);
    relleno.position.set(9, 5, 11);
    const luzMeta = new THREE.PointLight(col("acento"), 0, 8, 1.4);
    luzMeta.position.set(X_META, 0.5, 0.9);
    const ERAS = ["e1955", "e1985", "e2015"];
    const luzEra = [[-9, 2.4, -5], [0, 2.8, -6.5], [9, 2.4, -5]].map((p, e) => {
      const l = new THREE.PointLight(col(ERAS[e]), 0, 14, 1.2);
      l.position.set(...p);
      l.userData.tAp = M.encastre + 0.05 + Math.hypot(p[0] - X_META, p[2]) / VEL_ONDA;
      escena.add(l);
      return l;
    });
    escena.add(hemi, foco, foco.target, contra, relleno, luzMeta);
    const blancoFoco = col("tinta");

    // ── Efectos ──
    const conoFoco = haz(tok("tinta"), 1.15, 0.03, 6.5, 0);
    conoFoco.position.set(0.1, 0, 1.75);
    escena.add(conoFoco);
    const pilar = haz(tok("titulo"), 0.55, 1.6, 26, 1);
    pilar.position.set(X_META, 0, 0);
    escena.add(pilar);
    const COLORES_HACES = ["e1955", "titulo", "e1985", "titulo", "e2015"];
    const reflectores = [-9.5, -4.5, 0, 4.5, 9.5].map((x, i) => {
      const h = haz(tok(COLORES_HACES[i]), 0.35, 5.5, 80, 1);
      h.position.set(x * 1.4, 0, -20);
      h.userData = { x, fase: rnd() * 6, vel: mez(0.18, 0.32, rnd()), tAp: M.encastre + 0.35 + Math.abs(i - 2) * 0.16 + (i < 2 ? 0.06 : 0) };
      escena.add(h);
      return h;
    });
    const onda = anillo(tok("acento"), 70);
    onda.position.set(X_META, 0.02, 0);
    const golpe = anillo(tok("tinta-2"), 7);
    golpe.position.set(0.1, 0.015, 1.75);
    escena.add(onda, golpe);
    const mapaPunto = punto();
    const chispas = nube(260, col("acento"), 0.075, mapaPunto);
    const velChispas = Array.from({ length: 260 }, () => {
      const a = rnd() * Math.PI * 2, v = mez(1.2, 5.5, rnd());
      return [Math.cos(a) * v * 0.8, mez(2, 7.5, rnd()), Math.sin(a) * v * 0.6, rnd()];
    });
    const humo = nube(180, col("tinta-3"), 0.07, mapaPunto);
    const velHumo = Array.from({ length: 180 }, () => { const a = rnd() * Math.PI * 2, v = mez(0.8, 2.6, rnd()); return [Math.cos(a) * v, mez(0.1, 0.5, rnd()), Math.sin(a) * v]; });
    escena.add(chispas, humo);
    const nPolvo = 900, posPolvo = new Float32Array(nPolvo * 3), fasePolvo = new Float32Array(nPolvo);
    for (let i = 0; i < nPolvo; i++) {
      const cerca = i < 360;
      posPolvo.set(cerca ? [0.1 + (rnd() - 0.5) * 2.4, rnd() * 4.5, 1.75 + (rnd() - 0.5) * 2.4] : [(rnd() - 0.5) * 22, rnd() * 7, mez(-10, 5, rnd())], i * 3);
      fasePolvo[i] = rnd();
    }
    const geoPolvo = new THREE.BufferGeometry();
    geoPolvo.setAttribute("position", new THREE.BufferAttribute(posPolvo, 3));
    geoPolvo.setAttribute("aFase", new THREE.BufferAttribute(fasePolvo, 1));
    const polvoMat = new THREE.ShaderMaterial({
      uniforms: { uTiempo: { value: 0 }, uPx: { value: 1000 }, uMax: { value: 12 }, uFocoCos: { value: Math.cos(0.17) }, uFoco: { value: 0 }, uBase: { value: 0 }, uFocoPos: { value: new THREE.Vector3() }, uFocoDir: { value: new THREE.Vector3(0, -1, 0) }, uColor: { value: col("titulo") } },
      vertexShader: VERT_POLVO, fragmentShader: FRAG_POLVO, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    const polvo = new THREE.Points(geoPolvo, polvoMat);
    polvo.frustumCulled = false;
    escena.add(polvo);

    // ── Posproceso ──
    const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(prBase);
    composer.setSize(W, H);
    composer.addPass(new RenderPass(escena, camara));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.5, 0.55, 0.8);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const etalon = new ShaderPass(ETALON);
    const srgb = (k) => { const c = col(k), v = {}; c.getRGB(v, THREE.SRGBColorSpace); return new THREE.Vector3(v.r, v.g, v.b); };
    etalon.uniforms.uColNegro.value = srgb("fondo-hondo");
    etalon.uniforms.uColDestello.value = srgb("titulo");
    composer.addPass(etalon);

    const reloj = { t: 0 };
    const estado = { vida: false, peso: 0, saltos: [], ultimoX: -1 };
    const orbita = { yaw: 0, pitch: 0 };

    // ── Tamaño y calidad ──
    let nivel = 0, pr = prBase;
    const ajustar = () => {
      W = caja.offsetWidth || W; H = caja.offsetHeight || H;
      renderer.setPixelRatio(pr); renderer.setSize(W, H, false);
      composer.setPixelRatio(pr); composer.setSize(W, H);
      camara.aspect = W / H; camara.fov = fovPara(FOV, W / H); camara.updateProjectionMatrix();
      etalon.uniforms.uRes.value.set(W * pr, H * pr);
      etalon.uniforms.uBanda.value = Math.min(1, W / 2.39 / H);
      estrellas.material.uniforms.uPx.value = pr;
      polvoMat.uniforms.uPx.value = (H * pr) / (2 * Math.tan((camara.fov * Math.PI) / 360));
      polvoMat.uniforms.uMax.value = (H * pr) / 80;
    };
    ajustar();
    const observador = new ResizeObserver(ajustar);
    observador.observe(caja);
    /* Si un cuadro tarda más de 40 ms, se baja la calidad un escalón: resolución, después el resplandor, después las sombras. */
    const bajarCalidad = () => {
      nivel += 1;
      pr = prBase * [1, 0.8, 0.7, 0.55][nivel];
      if (nivel >= 2) bloom.enabled = false;
      if (nivel >= 3) {
        foco.castShadow = false;
        escena.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
      }
      ajustar();
    };

    // ── Arrastrar con el mouse gira la cámara un poco ──
    const corte = new AbortController();
    let arrastre = null;
    const opts = { signal: corte.signal };
    lienzo.addEventListener("pointerdown", (ev) => {
      if (ev.button > 0) return;
      gsap.killTweensOf(orbita);
      arrastre = { x: ev.clientX, y: ev.clientY, yaw: orbita.yaw, pitch: orbita.pitch, movio: false };
    }, opts);
    lienzo.addEventListener("pointermove", (ev) => {
      if (!arrastre) return;
      const dx = ev.clientX - arrastre.x, dy = ev.clientY - arrastre.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) arrastre.movio = true;
      orbita.yaw = gsap.utils.clamp(-0.45, 0.45, arrastre.yaw - dx * 0.0032);
      orbita.pitch = gsap.utils.clamp(-0.1, 0.22, arrastre.pitch + dy * 0.0022);
    }, opts);
    const soltar = (ev) => {
      if (!arrastre) return;
      if (arrastre.movio && ev.type === "pointerup") ev.stopPropagation(); // un arrastre no es un clic
      arrastre = null;
      gsap.to(orbita, { yaw: 0, pitch: 0, duration: 2.6, delay: 1.4, ease: "power2.inOut" });
    };
    lienzo.addEventListener("pointerup", soltar, opts);
    lienzo.addEventListener("pointercancel", soltar, opts);
    lienzo.addEventListener("pointerleave", soltar, opts);

    // ── Estado de la escena en el segundo x ──
    const vp = new THREE.Vector3(), vm = new THREE.Vector3(), q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), eu = new THREE.Euler(),
      sc = new THREE.Vector3(), m4 = new THREE.Matrix4(), color = new THREE.Color(), esf = new THREE.Spherical(), dir = new THREE.Vector3();
    const empuje = gsap.parseEase("empuje") || E.io2;
    const desN = (x) => T * (2 - empuje(tramo(x, M.empuje1, M.empuje1 + 0.55)) - empuje(tramo(x, M.empuje2, M.empuje2 + 0.55)));

    const ubicarCaja = (c, x) => {
      if (x < c.tCae) { sc.setScalar(0); vp.set(0, -5, 0); q.identity(); return; }
      sc.setScalar(1);
      if (x < c.tSuelo) {
        const s = x - c.tCae, k = s / c.tCaida;
        vp.set(c.lx + c.dx * (1 - k), c.y0 - 0.5 * G * s * s, c.lz + c.dz * (1 - k));
        q.setFromAxisAngle(ARRIBA, c.yaw).multiply(q2.setFromAxisAngle(c.eje, c.giro * (c.tSuelo - x)));
        return;
      }
      if (x < c.tOrd) {
        const s = tramo(x, c.tSuelo, c.tSuelo + 0.26);
        vp.set(c.lx, c.ly + c.rebote * Math.sin(Math.PI * s) * (s < 1 ? 1 : 0), c.lz);
        q.setFromAxisAngle(ARRIBA, c.yaw).multiply(q2.setFromAxisAngle(c.tambaleo, (1 - s) * Math.sin(3 * Math.PI * s) * c.rebote * 3));
        return;
      }
      const s = tramo(x, c.tOrd, c.tOrd + c.dOrd), e = E.io3(s);
      const gx = c.gx + (c.letra === 6 ? desN(x) : 0);
      const hop = c.letra >= 0 ? 0.13 * campana(x, c.tLuz, c.tLuz + 0.3) : 0;
      const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, d = e * e;
      vp.set(a * c.lx + b * (c.lx + gx) / 2 + d * gx, a * c.ly + b * ((c.ly + c.gy) / 2 + c.arco) + d * c.gy + hop, a * c.lz + b * (c.lz + c.gz) / 2 + d * c.gz);
      q.setFromEuler(eu.set(c.fx * e, mez(c.yaw, c.yawFin, e), c.fz * e, "YXZ"));
      const ap = campana(x, c.tOrd + c.dOrd, c.tOrd + c.dOrd + 0.17) * 0.17;
      sc.set(1 + ap * 0.6, 1 - ap, 1 + ap * 0.6);
    };

    const ubicarBaldosas = (malla, x, pared) => {
      const lista = malla.userData.lista;
      lista.forEach((b, i) => {
        const s = tramo(x, b.tAp, b.tAp + (pared ? 0.45 : 0.4));
        if (s <= 0) { m4.makeScale(0, 0, 0); malla.setMatrixAt(i, m4); return; }
        const meta = malla === mallaMetas;
        if (pared) { sc.set(1, Math.max(0.001, E.back(s)), 1); q.identity(); vp.set(b.x, 0, b.z); }
        else if (meta) { sc.setScalar(Math.max(0.001, E.back(s))); q.identity(); vp.set(b.x, 0.005, b.z); }
        else { q.setFromAxisAngle(b.eje, (1 - E.back(s)) * Math.PI * 0.5); sc.setScalar(mez(0.3, 1, suave(s))); vp.set(b.x, 0.004 + 0.06 * Math.sin(Math.PI * s), b.z); }
        malla.setMatrixAt(i, m4.compose(vp, q, sc));
        const flash = 1 + 3.2 * Math.pow(1 - s, 3);
        const k = b.lejos * (pared ? 0.9 : TINTE[b.era] || 1) * flash;
        malla.setColorAt(i, color.setRGB(k, k, k));
      });
      malla.instanceMatrix.needsUpdate = true;
      if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
    };

    const posar = (x, ahora) => {
      const P = pj.pose;
      P.brazoI = P.brazoD = P.piernaI = P.piernaD = P.aplaste = P.abrir = 0;
      let px = 13.5, py = 0, ry = -Math.PI / 2 + 0.75, rz = 0;
      pj.raiz.visible = x >= M.entra - 0.05;
      const fin = M.salto - 0.13;
      if (x < fin) {
        const k = Math.max(0, x - M.entra);
        px = 13.5 - 5.6 * k;
        pj.correr(k * 17, 0.95);
      } else if (x < M.salto) {
        const s = tramo(x, fin, M.salto);
        px = 9.75 - 0.15 * s; P.aplaste = 0.85 * suave(s); P.brazoI = P.brazoD = 0.75 * s;
      } else if (x < M.aterriza) {
        const s = tramo(x, M.salto, M.aterriza);
        px = mez(9.6, 7.5, s); py = 4 * 1.25 * s * (1 - s);
        const arriba = E.o3(tramo(x, M.salto, M.salto + 0.14));
        P.brazoI = P.brazoD = mez(0.75, -2.95, arriba); P.abrir = 0.35 * arriba;
        P.aplaste = mez(0.85, -0.55, tramo(x, M.salto, M.salto + 0.08)) * (1 - tramo(x, M.salto + 0.1, M.salto + 0.4));
        P.piernaI = -0.95 * campana(s, 0.05, 0.95); P.piernaD = 0.5 * campana(s, 0.05, 0.95);
      } else if (x < M.encastre) {
        px = 7.5 - (2 * T - desN(x));
        const s1 = tramo(x, M.aterriza, M.aterriza + 0.06);
        P.aplaste = x < M.aterriza + 0.06 ? s1 : 1 - E.elas(tramo(x, M.aterriza + 0.06, M.aterriza + 0.45));
        const brazo = x < M.aterriza + 0.12 ? mez(-2.95, 0.3, tramo(x, M.aterriza, M.aterriza + 0.12)) : mez(0.3, -1.45, E.io2(tramo(x, 6.75, 6.95)));
        P.brazoI = P.brazoD = brazo; P.abrir = 0.35 * (1 - tramo(x, M.aterriza, M.aterriza + 0.15));
        ry = mez(-Math.PI / 2 + 0.75, -Math.PI / 2 + 0.22, E.io2(tramo(x, 6.7, 6.95)));
        const fase = (tramo(x, M.empuje1, M.empuje1 + 0.55) + tramo(x, M.empuje2, M.empuje2 + 0.55)) * Math.PI * 2;
        P.piernaI = -Math.sin(fase) * 0.6; P.piernaD = Math.sin(fase) * 0.6;
        rz = 0;
      } else if (x < M.festejo) {
        px = 7.5 - 2 * T;
        P.brazoI = P.brazoD = mez(-1.45, 0, E.io2(tramo(x, M.encastre + 0.15, M.encastre + 0.45)));
        ry = mez(-Math.PI / 2 + 0.22, -0.35, E.io2(tramo(x, M.encastre + 0.3, M.festejo - 0.1)));
        P.aplaste = 0.8 * suave(tramo(x, M.festejo - 0.15, M.festejo));
      } else if (x < M.cae) {
        const s = tramo(x, M.festejo, M.cae);
        px = mez(7.5 - 2 * T, X_META, s); py = mez(0, ALTO, s) + 4 * 0.8 * s * (1 - s);
        ry = mez(-0.35, Math.PI * 2, E.io2(s));
        const arriba = E.o3(tramo(x, M.festejo, M.festejo + 0.14));
        P.brazoI = P.brazoD = -2.9 * arriba; P.abrir = 0.4 * arriba;
        P.aplaste = mez(0.8, -0.5, tramo(x, M.festejo, M.festejo + 0.08)) * (1 - tramo(x, M.festejo + 0.1, M.festejo + 0.4));
        P.piernaI = P.piernaD = -0.9 * campana(s, 0.05, 0.95);
      } else {
        px = X_META; py = ALTO; ry = Math.PI * 2;
        const s1 = tramo(x, M.cae, M.cae + 0.06);
        P.aplaste = x < M.cae + 0.06 ? s1 : 1 - E.elas(tramo(x, M.cae + 0.06, M.cae + 0.5));
        P.brazoI = P.brazoD = mez(-2.9, 0, tramo(x, M.cae, M.cae + 0.12));
        const saludo = suave(tramo(x, M.saludo, M.saludo + 0.22)) * (1 - suave(tramo(x, M.saludo + 1.1, M.saludo + 1.35)));
        P.brazoD = -2.95 * saludo; P.abrir = 0.28 * saludo;
        rz = 0.07 * Math.sin((x - M.saludo) * 13) * saludo;
        // Vida: cada tanto un saltito de festejo arriba de la N
        estado.saltos.forEach((t0) => {
          const k = (ahora - t0) / 0.75;
          if (k < 0 || k > 1) return;
          py += 0.55 * Math.sin(Math.PI * tramo(k, 0.12, 0.8)) * estado.peso;
          const arriba = campana(k, 0.1, 0.85);
          P.brazoI = Math.min(P.brazoI, -2.8 * arriba); P.brazoD = Math.min(P.brazoD, -2.8 * arriba); P.abrir = Math.max(P.abrir, 0.35 * arriba);
          P.aplaste += 0.6 * campana(k, 0, 0.12) + 0.7 * campana(k, 0.8, 1) - 0.4 * campana(k, 0.12, 0.4);
        });
      }
      pj.raiz.position.set(px, py, 0);
      pj.raiz.rotation.set(0, ry, rz);
      pj.cabeza.rotation.y = Math.sin(ahora * 0.5) * 0.3 * estado.peso;
      pj.aplicar();
    };

    /* Red de seguridad: si el personaje se acerca al borde del cuadro, la cámara retrocede hasta dejarle margen. */
    const ndc = new THREE.Vector3(), atras = new THREE.Vector3();
    const encuadrar = (x) => {
      if (x < M.salto - 0.2) return;
      for (let k = 0; k < 6; k++) {
        camara.updateMatrixWorld();
        let fuera = 0;
        for (const dy of [0, pj.alto + 0.12]) {
          ndc.set(pj.raiz.position.x, pj.raiz.position.y + dy, 0).project(camara);
          fuera = Math.max(fuera, ndc.y - 0.78, -0.86 - ndc.y, Math.abs(ndc.x) - 0.88);
        }
        if (fuera <= 0) return;
        camara.getWorldDirection(atras);
        camara.position.addScaledVector(atras, -(0.25 + fuera * 3));
      }
    };
    const temblor = (x) => {
      let a = 0.008 * campana(x, M.lluvia + 0.6, M.orden + 0.2);
      GOLPES.forEach(([t0, f]) => { if (x >= t0) a += f * Math.exp(-(x - t0) * 7); });
      return a;
    };

    const actualizar = (x, ahora) => {
      posar(x, ahora);
      // Cámara: pista + temblor + deriva en reposo + órbita del mouse
      POS(x, vp); MIRA(x, vm);
      const w = estado.peso;
      vp.x += Math.sin(ahora * 0.13) * 0.35 * w; vp.y += Math.sin(ahora * 0.11 + 1) * 0.12 * w;
      vm.x += Math.sin(ahora * 0.09 + 2) * 0.1 * w;
      const a = temblor(x);
      if (a > 0.0001) {
        vp.x += Math.sin(ahora * 61) * a + Math.sin(ahora * 37) * a * 0.5; vp.y += Math.sin(ahora * 53 + 1) * a;
        vm.x += Math.sin(ahora * 47 + 2) * a * 0.6; vm.y += Math.sin(ahora * 59 + 3) * a * 0.6;
      }
      if (orbita.yaw || orbita.pitch) {
        esf.setFromVector3(dir.subVectors(vp, vm));
        esf.theta += orbita.yaw;
        esf.phi = gsap.utils.clamp(0.35, Math.PI / 2 - 0.03, esf.phi - orbita.pitch);
        vp.copy(vm).add(dir.setFromSpherical(esf));
      }
      camara.position.copy(vp);
      camara.lookAt(vm);
      encuadrar(x);
      camara.rotation.z += Math.sin(ahora * 43) * a * 0.4;
      boveda.position.copy(camara.position);

      // Luz y aire
      const despierta = suave(tramo(x, M.encastre, M.encastre + 2.2));
      const cieloB = mez(0.22 * suave(tramo(x, M.lluvia - 0.2, M.lluvia + 1.2)), 1, despierta);
      cieloMat.uniforms.uBrillo.value = cieloB;
      cieloMat.uniforms.uHaloF.value = despierta;
      escena.fog.color.copy(noche).lerp(horizonte, cieloB);
      estrellas.material.uniforms.uBrillo.value = mez(0.25 * suave(tramo(x, M.lluvia, M.orden)), 1, suave(tramo(x, M.encastre + 0.6, M.encastre + 2.6)));
      estrellas.material.uniforms.uTiempo.value = ahora;

      const parpadeo = x < M.luz ? 0 : x < 0.34 ? 1 : x < 0.4 ? 0.1 : x < 0.43 ? 0.8 : x < 0.5 ? 0.15 : 1;
      const abre = E.io2(tramo(x, M.lluvia - 0.1, M.orden - 0.5));
      foco.angle = mez(0.17, 0.62, abre);
      foco.position.set(mez(0.1, 3.2, abre), mez(6.5, 14, abre), mez(2.05, 9.5, abre));
      foco.target.position.set(mez(0.1, 0.5, abre), 0, mez(1.75, -1.5, abre));
      foco.intensity = parpadeo * mez(4, 2.4, abre) * mez(1, 1.15, despierta);
      foco.color.copy(blancoFoco).lerp(uCalor.value, 0.25 * despierta);
      hemi.intensity = 0.4 * suave(tramo(x, M.lluvia - 0.2, M.lluvia + 1.2)) + 0.75 * despierta;
      contra.intensity = 1.1 * suave(tramo(x, M.lluvia - 0.4, M.lluvia + 0.3)) + 0.6 * despierta;
      relleno.intensity = 0.3 * parpadeo * (1 - tramo(x, M.lluvia, M.lluvia + 1)) + 0.7 * suave(tramo(x, M.orden, M.orden + 1.2));
      const pista0 = suave(tramo(x, M.orden + 0.6, M.entra));
      luzMeta.intensity = x < M.encastre ? pista0 * (0.6 + 0.4 * Math.sin(ahora * 4)) * 1.4 : mez(6, 4, E.o2(tramo(x, M.encastre, M.encastre + 1.6)));
      luzEra.forEach((l) => { l.intensity = 22 * suave(tramo(x, l.userData.tAp, l.userData.tAp + 0.8)); });
      matMeta.emissiveIntensity = x < M.encastre ? pista0 * (0.35 + 0.25 * Math.sin(ahora * 4)) : mez(2.2, 0.85, E.o2(tramo(x, M.encastre, M.encastre + 1.4)));
      matMetas.emissiveIntensity = 0.75 * suave(tramo(x, M.encastre + 0.4, M.encastre + 1.4));
      meta.scale.setScalar(Math.max(0.001, E.back(tramo(x, M.orden + 0.5, M.orden + 0.95))));

      // Cono del cenital y polvo en el haz
      dir.copy(foco.position).sub(foco.target.position);
      conoFoco.position.copy(foco.target.position);
      conoFoco.quaternion.setFromUnitVectors(ARRIBA, dir.clone().normalize());
      conoFoco.scale.set(1, dir.length() / 6.5, 1);
      conoFoco.material.uniforms.uOpacidad.value = 0.18 * parpadeo * (1 - tramo(x, M.lluvia - 0.1, M.lluvia + 0.4));
      polvoMat.uniforms.uTiempo.value = ahora;
      polvoMat.uniforms.uFocoPos.value.copy(foco.position);
      polvoMat.uniforms.uFocoDir.value.copy(dir).normalize().negate();
      polvoMat.uniforms.uFocoCos.value = Math.cos(foco.angle);
      polvoMat.uniforms.uFoco.value = 0.9 * parpadeo * (1 - 0.6 * abre);
      polvoMat.uniforms.uBase.value = 0.12 * despierta;

      // Golpe de la primera caja: anillo y polvo
      const g = tramo(x, 1.08, 2.3);
      golpe.material.uniforms.uR.value = 2.6 * E.o3(g);
      golpe.material.uniforms.uAncho.value = 0.25 + 0.5 * g;
      golpe.material.uniforms.uOpacidad.value = x >= 1.08 ? 0.22 * (1 - g) * (1 - g) : 0;
      const ph = humo.geometry.attributes.position;
      const sh = Math.max(0, x - 1.08);
      velHumo.forEach(([vx, vy, vz], i) => {
        const k = (1 - Math.exp(-3.2 * sh)) / 3.2;
        ph.setXYZ(i, 0.1 + vx * k, 0.04 + vy * (1 - Math.exp(-2 * sh)) * 0.5 + 0.02 * (i % 3), 1.75 + vz * k);
      });
      ph.needsUpdate = true;
      humo.material.opacity = x >= 1.08 ? 0.14 * (1 - tramo(x, 1.08, 2.8)) : 0;

      // Encastre: onda que arma el nivel, chispas, pilar de luz, reflectores
      const so = x - M.encastre;
      onda.material.uniforms.uR.value = Math.max(0, so) * VEL_ONDA;
      onda.material.uniforms.uAncho.value = 0.35 + Math.max(0, so) * 0.25;
      onda.material.uniforms.uOpacidad.value = so >= 0 ? 0.85 * Math.exp(-so * VEL_ONDA / 5) : 0;
      const pc = chispas.geometry.attributes.position;
      velChispas.forEach(([vx, vy, vz, r], i) => {
        const s = Math.max(0, so - r * 0.15);
        pc.setXYZ(i, X_META + vx * s, Math.max(0.02, ALTO * 0.6 + vy * s - 0.5 * 9 * s * s), vz * s);
      });
      pc.needsUpdate = true;
      chispas.material.opacity = so >= 0 ? 1 - tramo(x, M.encastre + 0.2, M.encastre + 2) : 0;
      pilar.material.uniforms.uOpacidad.value = so >= 0 ? 0.4 * (1 - E.o2(tramo(x, M.encastre, M.encastre + 1.8))) * suave(tramo(x, M.encastre, M.encastre + 0.06)) : 0;
      pilar.scale.set(mez(0.3, 1, E.o3(tramo(x, M.encastre, M.encastre + 0.5))), 1, mez(0.3, 1, E.o3(tramo(x, M.encastre, M.encastre + 0.5))));
      reflectores.forEach((h) => {
        const d = h.userData, k = x - d.tAp;
        const on = k < 0 ? 0 : k < 0.05 ? 1 : k < 0.12 ? 0.2 : k < 0.16 ? 0.9 : 1;
        h.material.uniforms.uOpacidad.value = 0.3 * on;
        const sw = Math.sin(ahora * d.vel + d.fase);
        dir.set(d.x * 0.035 + sw * 0.28, 1, -0.32 + Math.cos(ahora * d.vel * 0.7 + d.fase) * 0.08).normalize();
        h.quaternion.setFromUnitVectors(ARRIBA, dir);
      });
      bloom.strength = x < M.encastre ? 0.5 : mez(1.3, 0.8, E.o2(tramo(x, M.encastre, M.encastre + 2.2)));
      etalon.uniforms.uDestello.value = so >= 0 ? 0.16 * (1 - E.o2(tramo(x, M.encastre, M.encastre + 0.35))) : 0;
      etalon.uniforms.uNegro.value = 1 - suave(tramo(x, 0.05, 0.35));
      etalon.uniforms.uBarras.value = 1 - E.io2(tramo(x, M.orden + 0.5, M.orden + 1.4));
      etalon.uniforms.uTiempo.value = ahora;

      // Cajas, baldosas y personaje (solo si cambió el tiempo)
      if (x !== estado.ultimoX || w > 0) {
        for (let i = 0; i < cajas.length; i++) {
          const c = cajas[i];
          ubicarCaja(c, x);
          mallaCajas.setMatrixAt(i, m4.compose(vp, q, sc));
          let b = suave(tramo(x, c.tLuz, c.tLuz + 0.3));
          if (c.letra >= 0) b = b * (1 + 0.9 * campana(x, c.tLuz, c.tLuz + 0.6)) + w * 0.12 * Math.sin(ahora * (0.8 + c.letra * 0.11) + c.letra);
          else b *= 0.32;
          brillo.array[i] = b;
        }
        mallaCajas.instanceMatrix.needsUpdate = true;
        brillo.needsUpdate = true;
        if (x !== estado.ultimoX) {
          mallasPiso.forEach((m) => ubicarBaldosas(m, x, false));
          mallasPared.forEach((m) => ubicarBaldosas(m, x, true));
          ubicarBaldosas(mallaMetas, x, false);
        }
        estado.ultimoX = x;
      }
    };

    // ── Bucle ──
    const diapositiva = lienzo.closest(".slide");
    let corriendo = true, ultimo = 0, cuadros = 0, cambio = 0;
    const tiempos = [];
    const medir = !navigator.webdriver; // en las capturas automáticas el 3D va por software: no se degrada
    renderer.compile(escena, camara);
    const bucle = (ms) => {
      if (!corriendo) return;
      requestAnimationFrame(bucle);
      if (diapositiva && diapositiva.classList.contains("saliendo")) return; // en la transición dibuja solo la que entra
      const dt = ms - ultimo;
      if (dt < 1000 / 62) return;
      ultimo = ms;
      cuadros += 1;
      if (medir && cuadros > 30 && nivel < 3) {
        tiempos.push(dt);
        if (tiempos.length > 12) tiempos.shift();
        const prom = tiempos.reduce((s, v) => s + v, 0) / tiempos.length;
        if (tiempos.length === 12 && prom > 40 && ms - cambio > 1200) { cambio = ms; tiempos.length = 0; bajarCalidad(); }
      }
      const objetivo = estado.vida && reloj.t >= DUR - 0.02 ? 1 : 0;
      estado.peso += (objetivo - estado.peso) * Math.min(1, dt / 1400);
      actualizar(reloj.t, ms / 1000);
      composer.render();
    };
    requestAnimationFrame(bucle);

    return {
      reloj, estado, velo, linea, bajada,
      destruir: () => {
        corriendo = false;
        corte.abort();
        observador.disconnect();
        gsap.killTweensOf(orbita);
        escena.traverse((o) => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) [].concat(o.material).forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
        });
        composer.dispose(); rt.dispose(); renderer.dispose();
        try { renderer.forceContextLoss(); } catch (err) { /* nada */ }
      },
    };
  },

  construir(tl, c) {
    const chars = SplitText.create(c.bajada, { type: "chars" }).chars;
    if (c.sin3d) {
      tl.fromTo(c.celdas, { y: -900, rotation: () => gsap.utils.random(-90, 90), autoAlpha: 0 },
        { y: 0, rotation: 0, autoAlpha: 1, duration: 0.8, ease: "bounce.out", stagger: { each: 0.012, from: "random" } }, 0.3)
        .fromTo(c.velo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 2.4)
        .fromTo(c.linea, { scaleX: 0 }, { scaleX: 1, duration: 0.8, ease: "power3.inOut" }, 2.6)
        .fromTo(chars, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.02, ease: "power2.out" }, 2.8);
      return;
    }
    tl.fromTo(c.reloj, { t: 0 }, { t: DUR, duration: DUR, ease: "none" }, 0)
      .fromTo(c.velo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4, ease: "power1.inOut" }, M.bajada - 0.8)
      .fromTo(c.linea, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: "power3.inOut" }, M.bajada)
      .fromTo(chars, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.022, ease: "power2.out" }, M.bajada + 0.3);
  },

  vida(c) {
    if (c.sin3d) return { kill() {} };
    c.estado.vida = true;
    const festejo = eventos(() => {
      if (c.reloj.t < DUR - 0.02) return;
      c.estado.saltos.push(performance.now() / 1000);
      if (c.estado.saltos.length > 4) c.estado.saltos.shift();
    }, [3.5, 7]);
    return juntas({ kill: () => { c.estado.vida = false; } }, festejo);
  },

  desmontar(c) { if (c.destruir) c.destruir(); },
};

