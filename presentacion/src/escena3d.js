import * as THREE from "three";
import { gsap } from "gsap";
import { t, img, el, eventos, juntas } from "./util.js";
import { NIVEL_ESCENA } from "./datos.js";
import { crearPersonaje } from "./personaje3d.js";

/** Época de cada columna: el mismo almacén cruza 1955, 1985 y 2015. */
const epocaDe = (x) => (x <= 3 ? "1955" : x <= 6 ? "1985" : "2015");
const PISO = { 1955: "tiles/floor_1955", 1985: "tiles/floor_1985", 2015: "tiles/floor_2015" };
const PARED = { 1955: "tiles/wall_brick", 1985: "tiles/wall_mall", 2015: "tiles/wall_future" };
const GIRO = { arriba: Math.PI, abajo: 0, izquierda: -Math.PI / 2, derecha: Math.PI / 2 };
const DESTINO_CAJA = 5; // columna del destino al que se empuja la caja en la portada

/**
 * Monta la escena 3D del tablero dentro del contenedor.
 * Devuelve { intro, cierre, vida, destruir } o un respaldo con la captura del juego si no hay WebGL.
 */
export function crearEscena(contenedor, { encuadre = 0, bajar = 0, epocaFija = null } = {}) {
  const caja = el("div", "escena3d", contenedor);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  } catch (err) {
    el("img", "escena3d__respaldo", caja, { src: img("medios/partida"), alt: "Captura del Sokoban en el nivel de 1985" });
    return { intro() {}, cierre() {}, vida: () => ({ kill() {} }), destruir() {} };
  }
  const W = caja.offsetWidth || 1920, H = caja.offsetHeight || 1080;
  const escala = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--escala")) || 1;
  renderer.setPixelRatio(Math.min(2, (window.devicePixelRatio || 1) * Math.max(escala, 0.5)));
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  caja.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-label", "Tablero del Sokoban en 3D con las baldosas de las tres épocas");
  renderer.domElement.setAttribute("role", "img");

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(t("fondo"));
  escena.fog = new THREE.Fog(t("fondo"), 18, 34);

  const cargador = new THREE.TextureLoader();
  const texturas = {};
  const tex = (k) => {
    if (!texturas[k]) {
      const x = cargador.load(img(k));
      x.colorSpace = THREE.SRGBColorSpace;
      x.magFilter = THREE.NearestFilter;
      x.minFilter = THREE.NearestFilter;
      x.generateMipmaps = false;
      texturas[k] = x;
    }
    return texturas[k];
  };
  const materiales = {};
  const mat = (k) => (materiales[k] ||= new THREE.MeshStandardMaterial({ map: tex(k), roughness: 0.92, metalness: 0 }));

  const filas = NIVEL_ESCENA.length, cols = NIVEL_ESCENA[0].length;
  const pos = (x, y) => new THREE.Vector3(x - cols / 2 + 0.5, 0, y - filas / 2 + 0.5);
  const tablero = new THREE.Group();
  escena.add(tablero);

  const geoPiso = new THREE.PlaneGeometry(1, 1);
  const geoPared = new THREE.BoxGeometry(1, 0.9, 1);
  const geoCaja = new THREE.BoxGeometry(0.82, 0.82, 0.82);
  const cajas = [];
  let jugador = null, pj = null;

  const cambiables = [];
  NIVEL_ESCENA.forEach((linea, y) => [...linea].forEach((c, x) => {
    const p = pos(x, y), ep = epocaFija || epocaDe(x);
    if (c === "#") {
      const m = new THREE.Mesh(geoPared, mat(PARED[ep]));
      m.position.set(p.x, 0.45, p.z);
      m.castShadow = true; m.receiveShadow = true;
      tablero.add(m);
      cambiables.push({ m, tabla: PARED, x });
      return;
    }
    const destino = c === "." || c === "*" || c === "+";
    const piso = new THREE.Mesh(geoPiso, mat(destino ? "goals/goal" : PISO[ep]));
    piso.rotation.x = -Math.PI / 2;
    piso.position.copy(p);
    piso.receiveShadow = true;
    tablero.add(piso);
    if (!destino) cambiables.push({ m: piso, tabla: PISO, x });
    if (c === "$" || c === "*") {
      const m = new THREE.Mesh(geoCaja, new THREE.MeshStandardMaterial({ map: tex(c === "*" ? "boxes/box_plutonium" : "boxes/box_wood"), roughness: 0.85,
        emissive: new THREE.Color(t("acento")), emissiveIntensity: c === "*" ? 0.22 : 0 }));
      m.position.set(p.x, 0.41, p.z);
      m.castShadow = true; m.receiveShadow = true;
      m.userData = { x, y };
      tablero.add(m);
      cajas.push(m);
    }
    if (c === "@") {
      pj = crearPersonaje(0.82);
      jugador = pj.raiz;
      jugador.position.set(p.x, 0, p.z);
      jugador.rotation.y = GIRO.derecha;
      jugador.userData = { x, y };
      tablero.add(jugador);
    }
  }));

  const cielo = new THREE.HemisphereLight(t("superficie-2"), t("pendiente"), 1.5);
  escena.add(cielo);
  const sol = new THREE.DirectionalLight(t("titulo"), 2.4);
  sol.position.set(-5, 9, 6);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -8, right: 8, top: 6, bottom: -6, near: 1, far: 30 });
  sol.shadow.bias = -0.0008;
  escena.add(sol);
  const brillo = new THREE.PointLight(t("acento"), 0, 3.2, 1.6);
  brillo.position.copy(pos(DESTINO_CAJA, 3)).setY(0.9);
  escena.add(brillo);

  const camara = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
  if (encuadre || bajar) camara.setViewOffset(W, H, -W * encuadre, -H * bajar, W, H);
  const objetivo = new THREE.Vector3(0, 0, 0.3);
  const base = { x: -3.2, y: 9.2, z: 10.6 };
  camara.position.set(base.x, base.y, base.z);
  const deriva = { x: 0, y: 0 };

  const dibujar = () => {
    camara.position.x += deriva.x; camara.position.y += deriva.y;
    camara.lookAt(objetivo);
    renderer.render(escena, camara);
    camara.position.x -= deriva.x; camara.position.y -= deriva.y;
  };
  renderer.compile(escena, camara);
  let corriendo = true, ultimoCuadro = 0;
  const bucle = (ms) => {
    if (!corriendo) return;
    requestAnimationFrame(bucle);
    if (ms - ultimoCuadro < 1000 / 30) return; // 30 cuadros por segundo alcanzan
    ultimoCuadro = ms;
    dibujar();
  };
  requestAnimationFrame(bucle);

  const caja0 = cajas.find((c) => c.userData.y === 3);
  const pendiente = cajas.find((c) => c.userData.y === 4);
  const mirar = (d) => () => { if (jugador) jugador.rotation.y = GIRO[d]; };

  /** Un empujón: el jugador y la caja avanzan una baldosa juntos, con los brazos adelante. */
  function empujar(tl, en, pasos) {
    const paso = { f: 0 };
    tl.to(pj.pose, { brazoI: -1.45, brazoD: -1.45, duration: 0.2, onUpdate: pj.aplicar }, en - 0.2);
    for (let i = 0; i < pasos; i++) {
      const p = en + i * 0.5;
      tl.to(jugador.position, { x: "+=1", duration: 0.42, ease: "empuje" }, p)
        .to(caja0.position, { x: "+=1", duration: 0.42, ease: "empuje" }, p)
        .to(paso, { f: `+=${Math.PI * 2}`, duration: 0.42, ease: "none", onUpdate: () => { pj.pose.piernaI = -Math.sin(paso.f) * 0.6; pj.pose.piernaD = Math.sin(paso.f) * 0.6; pj.aplicar(); } }, p);
    }
    tl.to(pj.pose, { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0, duration: 0.3, onUpdate: pj.aplicar }, en + pasos * 0.5);
  }

  return {
    intro(tl, en = 0) {
      if (!jugador || !caja0) return;
      tl.fromTo(camara.position, { x: 0.5, y: 24, z: 3 }, { x: base.x, y: base.y, z: base.z, duration: 2.6, ease: "power3.inOut" }, en)
        .call(mirar("derecha"), null, en + 2.3);
      empujar(tl, en + 2.5, DESTINO_CAJA - caja0.userData.x);
      const llega = en + 2.5 + (DESTINO_CAJA - caja0.userData.x) * 0.5;
      tl.to(caja0.material, { emissiveIntensity: 0.3, duration: 0.5, ease: "power2.out" }, llega - 0.05)
        .to(brillo, { intensity: 6, duration: 0.5, ease: "power2.out" }, llega - 0.05)
        .call(mirar("abajo"), null, llega + 0.4);
    },
    cierre(tl, en = 0) {
      if (caja0) { caja0.position.x += DESTINO_CAJA - caja0.userData.x; caja0.material.emissiveIntensity = 0.3; brillo.intensity = 6; }
      if (jugador) { jugador.position.x += DESTINO_CAJA - 1 - jugador.userData.x; mirar("abajo")(); }
      tl.fromTo(camara.position, { x: base.x, y: base.y, z: base.z }, { x: 0, y: 15.5, z: 6.5, duration: 2.4, ease: "power3.inOut" }, en);
    },
    /** Un haz de luz cruza el tablero y lo pasa de una época a otra, columna por columna (reversible). */
    barrido(tl, en, desde, hasta, fondos) {
      const haz = this.haz || (this.haz = (() => {
        const h = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.4, filas + 1), new THREE.MeshBasicMaterial({ color: t("acento"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        h.position.y = 1; escena.add(h); return h;
      })());
      const avance = { x: -1 };
      tl.to(avance, { x: cols + 1, duration: 1.6, ease: "power2.inOut", onUpdate: () => {
        haz.position.x = avance.x - cols / 2;
        haz.material.opacity = avance.x <= -1 || avance.x >= cols + 1 ? 0 : 0.85;
        cambiables.forEach((c) => { c.m.material = mat(c.tabla[c.x < avance.x ? hasta : desde]); });
      } }, en);
      if (fondos) tl.to(fondos[desde], { opacity: 0, duration: 1.4 }, en).to(fondos[hasta], { opacity: 1, duration: 1.4 }, en);
    },
    /** Fondos reales de cada época como telón detrás del almacén. */
    telones() {
      const t3 = {};
      ["1955", "1985", "2015"].forEach((ep, i) => {
        const clave = { 1955: "backgrounds/background_hill_valley_1955", 1985: "backgrounds/background_mall_1985", 2015: "backgrounds/background_future_2015" }[ep];
        const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 22.5), new THREE.MeshBasicMaterial({ map: tex(clave), transparent: true, opacity: ep === epocaFija ? 1 : 0, fog: false, depthWrite: false }));
        m.position.set(0, 7, -14 - i * 0.01);
        escena.add(m);
        t3[ep] = m.material;
      });
      return t3;
    },
    orbita(tl, en) { tl.fromTo(camara.position, { x: -9, y: 6, z: 9 }, { x: base.x, y: base.y, z: base.z, duration: 2.4, ease: "power2.inOut" }, en); },
    vida() {
      const tick = (tt) => { deriva.x = Math.sin(tt * 0.17) * 0.35; deriva.y = Math.sin(tt * 0.23 + 1.3) * 0.2; };
      gsap.ticker.add(tick);
      const rebote = jugador ? eventos(() => gsap.to(pj.cabeza.rotation, { y: gsap.utils.random(-0.45, 0.45), duration: gsap.utils.random(0.4, 0.9), ease: "sine.inOut" }), [1.2, 3.5]) : null;
      const amague = eventos(() => {
        if (!pendiente) return;
        gsap.fromTo(pendiente.position, { x: pendiente.position.x }, { x: "+=0.06", duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" });
      }, [2.5, 6]);
      return juntas({ kill: () => gsap.ticker.remove(tick) }, rebote, amague);
    },
    destruir() {
      corriendo = false;
      renderer.dispose();
      Object.values(texturas).forEach((x) => x.dispose());
      try { renderer.forceContextLoss(); } catch (err) { /* contexto ya liberado */ }
      caja.remove();
    },
  };
}
