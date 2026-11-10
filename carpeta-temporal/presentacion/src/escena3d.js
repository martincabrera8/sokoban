import * as THREE from "three";
import { gsap } from "gsap";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { t, img, el } from "./util.js";
import { crearVista } from "./vista3d.js";
import { cajaDosCaras } from "./diagramas/tablero.js";
import { NIVEL_ESCENA } from "./datos.js";
import { crearPersonaje } from "./personaje3d.js";

/*
 * El almacén en 3D que comparten la portada, las épocas y el cierre.
 * Las baldosas son las del juego (enum Epoca: piso, pared y fondo de cada época). Cada material de época sabe
 * reescribirse con una onda: dentro del radio muestra la época nueva, afuera la vieja, y el borde brilla.
 * La disolución va en bloques del tamaño de un píxel de arte, para que el cambio hable el idioma de los sprites.
 */
export const EPOCAS = ["1955", "1985", "2015"];
const PISO = { 1955: "tiles/floor_1955", 1985: "tiles/floor_1985", 2015: "tiles/floor_2015" };
const PARED = { 1955: "tiles/wall_brick", 1985: "tiles/wall_mall", 2015: "tiles/wall_future" };
/* Caras laterales de las paredes: el frente de pared que Martín dibujó para cada época. */
const LADO = { 1955: "tiles/1955/paredes/parede_1955_02", 1985: "tiles/1985/paredes/parede_1985_04", 2015: "tiles/2015/paredes/parede_2015_03" };
const LADO2 = { 1955: "tiles/1955/paredes/parede_1955_04", 1985: "tiles/1985/paredes/parede_1985_05", 2015: "tiles/2015/paredes/parede_2015_04" };
const FONDO = { 1955: "backgrounds/background_hill_valley_1955", 1985: "backgrounds/background_mall_1985", 2015: "backgrounds/background_future_2015" };
/* Cuánto brillan los píxeles claros de cada época (el neón de 2015 se enciende, el ladrillo de 1955 no). */
const NEON = { 1955: 0.05, 1985: 0.35, 2015: 1.1 };
const epocaDeColumna = (x) => (x <= 3 ? "1955" : x <= 6 ? "1985" : "2015");
export const GIRO = { arriba: Math.PI, abajo: 0, izquierda: -Math.PI / 2, derecha: Math.PI / 2 };

const RUIDO = /* glsl */`
float ruidoE(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }`;

/** Textura redonda y suave para chispas y polvo. */
function textPunto() {
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d"), b = new THREE.Color(t("tinta"));
  const rgba = (a) => `rgba(${Math.round(b.r * 255)},${Math.round(b.g * 255)},${Math.round(b.b * 255)},${a})`;
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, rgba(1)); gr.addColorStop(0.3, rgba(0.55)); gr.addColorStop(1, rgba(0));
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

/**
 * Monta la escena dentro del contenedor.
 * opciones: nivel (líneas del tablero), epoca (fija) o null para repartir 1955 · 1985 · 2015 por columnas,
 * fondo: "triptico" (las tres épocas lado a lado) o "epoca", etiqueta (texto alternativo).
 */
export function crearEscena(contenedor, { nivel = NIVEL_ESCENA, epoca = null, fondo = "triptico", etiqueta = "Tablero del Sokoban en 3D con las baldosas reales" } = {}) {
  const vista = crearVista(contenedor, { aria: etiqueta, exposicion: 1.12 });
  if (!vista) {
    const caja = el("div", "escena3d", contenedor);
    el("img", "escena3d__respaldo", caja, { src: img("medios/partida"), alt: "Captura del Sokoban en el nivel de 1985" });
    return { sin3d: true, caja, destruir() { caja.remove(); } };
  }
  const { caja, renderer, W, H } = vista;

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(t("fondo-hondo"));

  // ── Texturas y materiales de época ──
  const cargador = new THREE.TextureLoader();
  const texturas = {};
  let cargadas = 0;
  const tex = (k, pixel = true) => {
    if (!texturas[k]) {
      const x = cargador.load(img(k), () => { cargadas += 1; });
      x.colorSpace = THREE.SRGBColorSpace;
      if (pixel) { x.magFilter = THREE.NearestFilter; x.minFilter = THREE.NearestFilter; x.generateMipmaps = false; }
      texturas[k] = x;
    }
    return texturas[k];
  };
  /** Onda que reescribe las baldosas: centro, radio del frente, color del borde. Compartida por todos los materiales. */
  const U = { uFrente: { value: -1 }, uCentro: { value: new THREE.Vector3() }, uBorde: { value: new THREE.Color(t("acento")) }, uAncho: { value: 0.5 } };
  const deEpoca = [];
  function matEpoca(tabla, ep, extra = {}) {
    const m = new THREE.MeshStandardMaterial({ map: tex(tabla[ep]), roughness: 0.72, metalness: 0.05, ...extra });
    const propios = { mapB: { value: m.map }, uNeonA: { value: NEON[ep] }, uNeonB: { value: NEON[ep] } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U, propios);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vMundo;")
        .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvec4 mundoE = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nmundoE = instanceMatrix * mundoE;\n#endif\nvMundo = (modelMatrix * mundoE).xyz;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", `#include <common>
varying vec3 vMundo; uniform sampler2D mapB; uniform float uFrente, uAncho, uNeonA, uNeonB; uniform vec3 uCentro, uBorde;${RUIDO}`)
        .replace("#include <map_fragment>", `
vec3 qE = floor(vMundo * 16.0 + 0.001);
float kE = length(vMundo - uCentro) - uFrente + ruidoE(qE) * 0.9;
float nuevoE = step(kE, 0.0);
vec4 tE = mix(texture2D(map, vMapUv), texture2D(mapB, vMapUv), nuevoE);
diffuseColor *= tE;
float bordeE = (1.0 - smoothstep(0.0, uAncho, abs(kE))) * step(0.0, uFrente);
float maxE = max(tE.r, max(tE.g, tE.b));
float neonE = mix(uNeonA, uNeonB, nuevoE) * smoothstep(0.3, 0.55, maxE - min(tE.r, min(tE.g, tE.b))) * smoothstep(0.35, 0.75, maxE);`)
        .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += uBorde * bordeE * 2.0 + tE.rgb * neonE;");
    };
    m.customProgramCacheKey = () => "epoca";
    m.userData = { tabla, propios };
    deEpoca.push(m);
    return m;
  }
  const juegos = {};
  const juego = (ep) => (juegos[ep] ||= {
    piso: matEpoca(PISO, ep, { roughness: 0.5 }),
    tope: matEpoca(PARED, ep),
    lado: matEpoca(LADO, ep),
    lado2: matEpoca(LADO2, ep),
  });
  /** Prepara la onda para pasar de la época a a la b (no mueve el frente: eso lo hace la línea de tiempo). */
  function pasar(a, b) {
    deEpoca.forEach((m) => {
      const { tabla, propios } = m.userData;
      m.map = tex(tabla[a]); propios.mapB.value = tex(tabla[b]);
      propios.uNeonA.value = NEON[a]; propios.uNeonB.value = NEON[b];
    });
  }

  // ── Telón: el fondo real de cada época, ocupando la pantalla como en el juego ──
  const F = {
    mapA: { value: tex(FONDO[epoca || "1955"], false) }, mapB: { value: tex(FONDO[epoca || "1985"], false) }, mapC: { value: tex(FONDO["2015"], false) },
    uTres: { value: fondo === "triptico" ? 1 : 0 }, uMezcla: { value: 0 }, uLuz: { value: 1 }, uAspecto: { value: W / H },
    uOrigen: { value: new THREE.Vector2(0.5, 0.6) }, uDesplaza: { value: new THREE.Vector2() }, uBorde: { value: new THREE.Color(t("acento")) },
    uTinte: { value: new THREE.Color(1, 1, 1) },
  };
  const telon = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: F, depthTest: false, depthWrite: false,
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }",
    fragmentShader: /* glsl */`
      uniform sampler2D mapA, mapB, mapC; uniform float uTres, uMezcla, uLuz, uAspecto; uniform vec2 uOrigen, uDesplaza; uniform vec3 uBorde, uTinte;
      varying vec2 vUv;
      float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main() {
        vec2 uv = vUv;
        float r = uAspecto / (16.0 / 9.0);
        if (r < 1.0) uv.x = 0.5 + (uv.x - 0.5) * r; else uv.y = 0.5 + (uv.y - 0.5) / r;
        uv = 0.5 + (uv - 0.5) * 0.9 + uDesplaza;
        vec3 col;
        if (uTres > 0.5) {
          float x = uv.x * 3.0 + (h(floor(uv * vec2(240.0, 135.0))) - 0.5) * 0.09;
          float i = floor(clamp(x, 0.0, 2.999));
          vec2 uvT = vec2(1.0 / 3.0 + (uv.x * 3.0 - i) / 3.0, uv.y);
          col = i < 0.5 ? texture2D(mapA, uvT).rgb : (i < 1.5 ? texture2D(mapB, uvT).rgb : texture2D(mapC, uvT).rgb);
        } else {
          float k = length((vUv - uOrigen) * vec2(uAspecto, 1.0)) - uMezcla * 2.6 + h(floor(uv * vec2(240.0, 135.0))) * 0.13;
          col = k < 0.0 ? texture2D(mapB, uv).rgb : texture2D(mapA, uv).rgb;
          col += uBorde * (1.0 - smoothstep(0.0, 0.05, abs(k))) * step(0.001, uMezcla) * step(uMezcla, 0.999) * 2.0;
        }
        gl_FragColor = vec4(col * uLuz * uTinte, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  telon.frustumCulled = false; telon.renderOrder = -1000;
  escena.add(telon);

  // ── Tablero ──
  const filas = nivel.length, cols = nivel[0].length;
  const pos = (x, y) => new THREE.Vector3(x - (cols - 1) / 2, 0, y - (filas - 1) / 2);
  const tablero = new THREE.Group();
  escena.add(tablero);
  const geoPiso = new THREE.PlaneGeometry(1, 1);
  const geoPared = cajaDosCaras(1, 0.9, 1, 2); // costados y tope: dos materiales, dos dibujos por grupo de instancias
  const geoCaja = new RoundedBoxGeometry(0.8, 0.8, 0.8, 3, 0.05);
  const madera = tex("boxes/box_wood");
  const matDestinoBase = { map: tex("goals/goal"), emissiveMap: tex("goals/goal"), emissive: new THREE.Color(t("acento")), roughness: 0.5 };
  const cajas = [], destinos = [], paredes = [], pisos = [];
  /* Paredes y pisos van en instancias (un dibujo por época y variante). Cada baldosa conserva un objeto propio
     con posición y escala, que la línea de tiempo anima como antes; se copia a las instancias en cada cuadro. */
  const lotes = {};
  const lote = (clave, geo, mat, sombra) => (lotes[clave] ||= { geo, mat, sombra, lista: [] });
  let pj = null;
  nivel.forEach((linea, y) => [...linea].forEach((c, x) => {
    const p = pos(x, y), ep = epoca || epocaDeColumna(x), J = juego(ep);
    if (c === "#") {
      const variante = (x * 7 + y * 3) % 5 === 0 ? 2 : 1;
      const m = new THREE.Object3D();
      m.position.set(p.x, 0.45, p.z);
      m.userData = { x, y, ep };
      lote("pared" + ep + variante, geoPared, [variante === 2 ? J.lado2 : J.lado, J.tope], true).lista.push(m);
      paredes.push(m);
      return;
    }
    const destino = c === "." || c === "*" || c === "+";
    const mat = destino ? new THREE.MeshStandardMaterial({ ...matDestinoBase, emissiveIntensity: c === "*" ? 1.2 : 0.25 }) : J.piso;
    const piso = destino ? new THREE.Mesh(geoPiso, mat) : new THREE.Object3D();
    piso.rotation.x = -Math.PI / 2;
    piso.position.copy(p);
    piso.userData = { x, y, ep };
    if (destino) { piso.receiveShadow = true; tablero.add(piso); } else lote("piso" + ep, geoPiso, mat, false).lista.push(piso);
    pisos.push(piso);
    if (destino) destinos.push({ m: piso, mat, x, y });
    if (c === "$" || c === "*") {
      const m = new THREE.Mesh(geoCaja, new THREE.MeshStandardMaterial({ map: madera, roughness: 0.7, emissive: new THREE.Color(t("acento")), emissiveMap: madera, emissiveIntensity: c === "*" ? 0.55 : 0 }));
      m.position.set(p.x, 0.4, p.z);
      m.castShadow = true; m.receiveShadow = true;
      m.userData = { x, y, enDestino: c === "*" };
      tablero.add(m); cajas.push(m);
    }
    if (c === "@" || c === "+") {
      pj = crearPersonaje(0.8);
      pj.raiz.rotation.order = "YXZ";
      pj.raiz.position.set(p.x, 0, p.z);
      pj.raiz.userData = { x, y };
      tablero.add(pj.raiz);
    }
  }));

  const instancias = Object.values(lotes).map(({ geo, mat, sombra, lista }) => {
    const malla = new THREE.InstancedMesh(geo, mat, lista.length);
    malla.castShadow = sombra; malla.receiveShadow = true; malla.frustumCulled = false;
    tablero.add(malla);
    return { malla, lista };
  });
  const sincronizar = () => instancias.forEach(({ malla, lista }) => {
    lista.forEach((o, i) => { o.updateMatrix(); malla.setMatrixAt(i, o.matrix); });
    malla.instanceMatrix.needsUpdate = true;
  });
  sincronizar();

  // Zócalo: el tablero apoyado como una maqueta, con un filo de luz del color de cada época
  const ancho = cols + 0.5, hondo = filas + 0.5;
  const zocalo = new THREE.Mesh(new THREE.BoxGeometry(ancho, 0.6, hondo), new THREE.MeshStandardMaterial({ color: t("superficie"), roughness: 0.55, metalness: 0.3 }));
  zocalo.position.y = -0.31; zocalo.receiveShadow = true;
  escena.add(zocalo);
  const filos = [];
  const geoFilo = new THREE.BoxGeometry(1, 0.05, 0.05);
  const filo = (x, z, largo, rot, ep) => {
    const m = new THREE.Mesh(geoFilo, new THREE.MeshBasicMaterial({ color: new THREE.Color(t("e" + ep)).multiplyScalar(2.2) }));
    m.scale.x = largo; m.position.set(x, -0.03, z); m.rotation.y = rot;
    m.userData = { ep };
    escena.add(m); filos.push(m);
  };
  [-1, 1].forEach((s) => EPOCAS.forEach((ep, i) => {
    const tramo = ancho / 3;
    filo(-ancho / 2 + tramo * (i + 0.5), s * hondo / 2, tramo, 0, epoca || ep);
  }));
  filo(-ancho / 2, 0, hondo, Math.PI / 2, epoca || "1955");
  filo(ancho / 2, 0, hondo, Math.PI / 2, epoca || "2015");

  // Reflejos suaves: un estudio neutro como entorno, así las caras pulidas toman brillo
  const pmrem = new THREE.PMREMGenerator(renderer);
  escena.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  escena.environmentIntensity = 0.28;
  pmrem.dispose();

  // ── Luces ──
  const hemi = new THREE.HemisphereLight(t("superficie-2"), t("fondo-hondo"), 2.0);
  escena.add(hemi);
  const sol = new THREE.DirectionalLight(t("titulo"), 2.6);
  sol.position.set(-6, 10, 7);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -8, right: 8, top: 6, bottom: -6, near: 1, far: 30 });
  sol.shadow.bias = -0.0006; sol.shadow.normalBias = 0.02;
  escena.add(sol);
  const contra = new THREE.DirectionalLight(t("linea"), 1.1);
  contra.position.set(4, 5, -9);
  const relleno = new THREE.DirectionalLight(t("tinta-2"), 0.7);
  relleno.position.set(9, 3, 6);
  escena.add(contra, relleno);

  // ── Efectos ──
  const mapaPunto = textPunto();
  const reloj = { v: 0 };
  const conTiempo = [];
  /** Haz de luz volumétrico (cono abierto con brillo que cae desde la fuente). Con luz:true suma un foco real. */
  function haz({ color = t("titulo"), arriba, abajo, rArriba = 0.12, rAbajo = 1.6, fuerza = 0, desdeArriba = true, luz = false, sombra = false, intensidad = 40 }) {
    const largo = arriba.distanceTo(abajo);
    const geo = new THREE.CylinderGeometry(rArriba, rAbajo, 1, 48, 1, true);
    const u = { uColor: { value: new THREE.Color(color) }, uFuerza: { value: fuerza }, uPulso: { value: 1 }, uTiempo: reloj, uDesde: { value: desdeArriba ? 1 : 0 } };
    conTiempo.push(u);
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() { vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; uniform float uFuerza, uPulso, uTiempo, uDesde; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() {
          float s = mix(vUv.y, 1.0 - vUv.y, uDesde);
          float caida = pow(1.0 - s, 1.7) * smoothstep(0.0, 0.06, s);
          float lado = smoothstep(0.0, 0.7, abs(dot(vN, vV)));
          float motas = 0.78 + 0.22 * sin(vUv.x * 50.0 + uTiempo * 0.5 + s * 4.0) * sin(vUv.x * 23.0 - uTiempo * 0.3);
          gl_FragColor = vec4(uColor, caida * lado * motas * uFuerza * uPulso);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }));
    m.position.copy(arriba).add(abajo).multiplyScalar(0.5);
    m.scale.y = largo;
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arriba.clone().sub(abajo).normalize());
    m.frustumCulled = false; m.renderOrder = 5;
    escena.add(m);
    const res = { m, u, fuerza: u.uFuerza, pulso: u.uPulso };
    if (luz) {
      const f = new THREE.SpotLight(color, 0, largo * 2.2, Math.atan2(rAbajo, largo) * 1.25, 0.55, 1.2);
      f.position.copy(arriba); f.target.position.copy(abajo);
      if (sombra) { f.castShadow = true; f.shadow.mapSize.set(1024, 1024); f.shadow.bias = -0.0008; }
      escena.add(f, f.target);
      res.luz = f; res.intensidad = intensidad;
    }
    return res;
  }
  /** Onda de choque: un anillo que se abre sobre el piso. */
  function onda(color = t("acento"), donde = new THREE.Vector3()) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 72), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.copy(donde).setY(0.03); m.renderOrder = 6;
    escena.add(m);
    return m;
  }
  /** Chispas que brotan de un punto: brotar(p) las ubica según el progreso (0 a 1), así la línea de tiempo puede ir y volver. */
  function chispas(n, color, { tam = 0.11, vel = [1, 4], alto = [1.5, 5], g = 4.5, abierto = 0.7, vida = [0.5, 1] } = {}) {
    const geo = new THREE.BufferGeometry();
    const P = new Float32Array(n * 3), C = new Float32Array(n * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(C, 3));
    const puntos = new THREE.Points(geo, new THREE.PointsMaterial({ color: new THREE.Color(color).multiplyScalar(1.6), map: mapaPunto, size: tam, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    puntos.frustumCulled = false; puntos.renderOrder = 7;
    escena.add(puntos);
    const v = Array.from({ length: n }, () => {
      const a = Math.random() * Math.PI * 2, r = gsap.utils.random(...vel);
      return [Math.cos(a) * r, gsap.utils.random(...alto), Math.sin(a) * r * abierto, gsap.utils.random(...vida)];
    });
    const origen = new THREE.Vector3();
    return {
      puntos, origen,
      brotar(p) {
        v.forEach(([vx, vy, vz, dura], i) => {
          const q = Math.min(1, p / dura);
          P[i * 3] = origen.x + vx * q; P[i * 3 + 1] = origen.y + vy * q - g * q * q; P[i * 3 + 2] = origen.z + vz * q;
          const a = p > 0 && p < dura ? Math.pow(1 - q, 1.4) : 0;
          C[i * 3] = C[i * 3 + 1] = C[i * 3 + 2] = a;
        });
        geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true;
      },
    };
  }
  // Polvo en suspensión que flota en la luz
  const nPolvo = 900;
  const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: new THREE.Color(t("titulo")), map: mapaPunto, size: 0.05, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
  polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: nPolvo * 3 }, (_, i) => (i % 3 === 0 ? gsap.utils.random(-8, 8) : i % 3 === 1 ? gsap.utils.random(0.1, 6) : gsap.utils.random(-6, 6))), 3));
  polvo.frustumCulled = false;
  escena.add(polvo);

  // ── Cámara con grúa: mira, distancia, giro, inclinación y encuadre se animan por separado ──
  const camara = vista.camara(30, 0.1, 120);
  const rig = { mira: new THREE.Vector3(0, 0, 0), dist: 15, giro: 0, alto: 0.6, encuadre: 0, bajar: 0, temblor: 0 };
  const deriva = { giro: 0, alto: 0 };
  const orb = { giro: 0, alto: 0 };
  function ubicarCamara() {
    const g = rig.giro + deriva.giro + orb.giro, a = Math.max(0.06, Math.min(1.45, rig.alto + deriva.alto + orb.alto));
    camara.position.set(rig.mira.x + rig.dist * Math.sin(g) * Math.cos(a), rig.mira.y + rig.dist * Math.sin(a), rig.mira.z + rig.dist * Math.cos(g) * Math.cos(a));
    camara.lookAt(rig.mira);
    if (rig.temblor) { camara.position.x += (Math.random() - 0.5) * rig.temblor; camara.position.y += (Math.random() - 0.5) * rig.temblor; }
    camara.setViewOffset(W, H, -W * rig.encuadre, -H * rig.bajar, W, H);
    camara.updateMatrixWorld();
    F.uDesplaza.value.set(Math.sin(g) * 0.035, (a - 0.5) * 0.03);
  }

  // ── Rótulos anclados a puntos del espacio ──
  const anclas = [];
  let capa = null;
  const v3 = new THREE.Vector3();
  function capaAnclas(clase) { capa = el("div", clase, caja); return capa; }
  function anclar(elemento, punto) { anclas.push({ elemento, punto }); }
  function moverAnclas() {
    anclas.forEach(({ elemento, punto }) => {
      v3.copy(punto.isObject3D ? punto.getWorldPosition(v3) : punto).project(camara);
      elemento.style.setProperty("--ax", ((v3.x + 1) / 2 * W).toFixed(1) + "px");
      elemento.style.setProperty("--ay", ((1 - v3.y) / 2 * H).toFixed(1) + "px");
    });
  }

  // ── Bucle: lo maneja la vista común (pausa al salir, calidad automática, shaders compilados antes de entrar) ──
  const alDibujar = [];
  /** Resumen del estado animado por la línea de tiempo (sin la vida de fondo): en las capturas solo se dibuja si cambió. */
  const firma = () => [cargadas, orb.giro, orb.alto, rig.mira.x, rig.mira.y, rig.dist, rig.giro, rig.alto, rig.encuadre, rig.bajar, U.uFrente.value, F.uLuz.value, F.uMezcla.value,
    pj ? pj.raiz.position.x + pj.raiz.position.y + pj.pose.brazoI : 0, ...cajas.map((c) => c.material.emissiveIntensity),
    ...destinos.map((d) => d.mat.emissiveIntensity)].map((x) => x.toFixed(3)).join();
  vista.animar({
    escena, camara, brillo: [0.7, 0.55, 0.78], firma, orbita: { giro: 0.55, alto: 0.22 },
    cada: (seg) => {
      orb.giro = vista.orbita.giro; orb.alto = vista.orbita.alto;
      reloj.value = seg;
      ubicarCamara();
      alDibujar.forEach((fn) => fn(seg));
      sincronizar();
      moverAnclas();
    },
  });
  const bloom = vista.bloom;

  // ── Movimientos del personaje ──
  const jugador = pj ? pj.raiz : null;
  /** Empuja una caja: el jugador y la caja avanzan juntos baldosa por baldosa, con los brazos adelante y el cuerpo inclinado. */
  function empujar(tl, en, caja0, dx, dz, pasos, { paso = 0.5, polvoPies = null } = {}) {
    if (!pj || !caja0) return en;
    const f = { v: 0 };
    tl.to(pj.pose, { brazoI: -1.5, brazoD: -1.5, aplaste: 0.12, duration: 0.25, ease: "power2.out", onUpdate: pj.aplicar }, en - 0.25)
      .to(jugador.rotation, { x: 0.22, duration: 0.25, ease: "power2.out" }, en - 0.25);
    for (let i = 0; i < pasos; i++) {
      const p = en + i * paso;
      tl.to([jugador.position, caja0.position], { x: `+=${dx}`, z: `+=${dz}`, duration: paso * 0.86, ease: "empuje" }, p)
        .fromTo(caja0.rotation, { z: 0 }, { z: -0.035 * dx, duration: paso * 0.43, yoyo: true, repeat: 1, ease: "sine.inOut" }, p)
        .to(f, { v: `+=${Math.PI * 2}`, duration: paso * 0.86, ease: "none", onUpdate: () => { pj.pose.piernaI = -Math.sin(f.v) * 0.65; pj.pose.piernaD = Math.sin(f.v) * 0.65; pj.aplicar(); } }, p);
      if (polvoPies) {
        const ch = polvoPies[i % polvoPies.length], pr = { p: 0 };
        tl.fromTo(pr, { p: 0 }, { p: 1, duration: 0.9, ease: "power1.out", onUpdate: () => { ch.origen.copy(caja0.position).setY(0.05).add(new THREE.Vector3(-0.42 * dx, 0, -0.42 * dz)); ch.brotar(pr.p); } }, p + 0.05);
      }
    }
    const fin = en + pasos * paso;
    tl.to(pj.pose, { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0, aplaste: 0, duration: 0.35, ease: "power2.out", onUpdate: pj.aplicar }, fin)
      .to(jugador.rotation, { x: 0, duration: 0.35 }, fin);
    return fin;
  }

  /** Vida de base: la cámara deriva apenas, el polvo flota, el personaje respira y mira alrededor. */
  function vida() {
    const fase = Math.random() * 10;
    const tick = (tt) => {
      const s = tt + fase;
      deriva.giro = Math.sin(s * 0.13) * 0.035 + Math.sin(s * 0.051) * 0.02;
      deriva.alto = Math.sin(s * 0.17 + 1.3) * 0.018;
      polvo.rotation.y = s * 0.012;
      polvo.position.y = Math.sin(s * 0.21) * 0.25;
    };
    gsap.ticker.add(tick);
    let mirada = null;
    const mirar = () => {
      if (!pj) return;
      gsap.to(pj.cabeza.rotation, { y: gsap.utils.random(-0.5, 0.5), x: gsap.utils.random(-0.15, 0.1), duration: gsap.utils.random(0.4, 0.9), ease: "sine.inOut" });
      mirada = gsap.delayedCall(gsap.utils.random(1.3, 3.8), mirar);
    };
    mirada = gsap.delayedCall(gsap.utils.random(0.6, 1.4), mirar);
    return { kill: () => { gsap.ticker.remove(tick); if (mirada) mirada.kill(); deriva.giro = 0; deriva.alto = 0; } };
  }

  return {
    sin3d: false, caja, escena, camara, rig, renderer, bloom, U, F, pos, pasar, tex, juego, cajas, destinos, paredes, pisos, filos, zocalo, polvo,
    pj, jugador, hemi, sol, contra, haz, onda, chispas, empujar, vida, capaAnclas, anclar, alDibujar, filas, cols,
    fondoDe: (ep) => tex(FONDO[ep], false),
    destruir() {
      vista.liberarTambien(...Object.values(texturas), mapaPunto, geoPiso, geoPared, geoCaja);
      vista.destruir();
    },
  };
}
