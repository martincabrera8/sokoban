import * as THREE from "three";
import { gsap } from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { el, fovPara, esperarEn } from "./util.js";

/*
 * Base común de las escenas 3D: un renderer por diapositiva con resolución contenida, resplandor a media
 * resolución, un bucle que dibuja solo mientras la diapositiva está en pantalla (se congela apenas empieza la
 * transición de salida), shaders compilados y texturas subidas antes de que la diapositiva entre,
 * calidad que baja sola si la PC no llega, liberación completa al desmontar y una órbita que se maneja arrastrando.
 */

const automatico = () => !!navigator.webdriver; // capturas automáticas: calidad completa siempre
/** Nivel de calidad que alcanzó la PC (lo heredan las escenas siguientes: el hardware no cambia entre diapositivas). */
let calidadGlobal = 0;
const vivos = new Set();
const pendientes = [];
/** Estado para pruebas: bucles vivos, nivel de calidad y cuadros dibujados. */
const estado = { vivos: 0, calidad: 0, cuadros: 0, dibujando: 0 };
window.__vista3d = estado;

/** Resolución de dibujo: la del escenario por la densidad de la pantalla, como máximo 1.5. */
function ratioBase() {
  const escala = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--escala")) || 1;
  return Math.min(1.5, (window.devicePixelRatio || 1) * escala);
}

/** Una imagen o un lienzo que se dibuja después del montaje: la diapositiva espera a que esté para entrar. */
export function cargando(promesa) { pendientes.push(promesa); return promesa; }

/** Gira la cámara alrededor de su punto de mira (la órbita del arrastre). Conserva el encuadre óptico. */
const esf = new THREE.Spherical(), desvio = new THREE.Vector3();
export function orbitar(camara, mira, o) {
  if (!o || (Math.abs(o.giro) < 1e-4 && Math.abs(o.alto) < 1e-4)) return;
  desvio.copy(camara.position).sub(mira);
  esf.setFromVector3(desvio);
  esf.theta += o.giro;
  esf.phi = Math.max(0.04, Math.min(Math.PI * 0.49, esf.phi - o.alto));
  desvio.setFromSpherical(esf);
  camara.position.copy(mira).add(desvio);
  camara.lookAt(mira);
  camara.updateMatrixWorld();
}

/**
 * Arrastrar sobre la diapositiva gira la vista: una órbita suave y limitada que vuelve sola al soltar.
 * Devuelve { giro, alto } (radianes) para sumar a la cámara.
 */
function arrastre(slide, { giro = 0.5, alto = 0.2 } = {}) {
  const o = { giro: 0, alto: 0, activo: false };
  if (!slide) return { ...o, kill() {} };
  let x0 = 0, y0 = 0, id = null;
  const escala = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--escala")) || 1;
  const abajo = (ev) => {
    if (ev.button > 0 || id !== null) return;
    id = ev.pointerId; x0 = ev.clientX; y0 = ev.clientY; o.activo = true;
    try { slide.setPointerCapture(id); } catch (err) { /* sin captura */ }
    ev.preventDefault();
  };
  const mueve = (ev) => {
    if (ev.pointerId !== id) return;
    const e = escala(), dx = (ev.clientX - x0) / e, dy = (ev.clientY - y0) / e;
    gsap.to(o, { giro: -giro * Math.tanh(dx / 700), alto: alto * Math.tanh(dy / 450), duration: 0.5, ease: "power3.out", overwrite: "auto" });
  };
  const suelta = (ev) => {
    if (ev.pointerId !== id) return;
    id = null; o.activo = false;
    gsap.to(o, { giro: 0, alto: 0, duration: 1.6, ease: "power3.inOut", overwrite: "auto" });
  };
  slide.addEventListener("pointerdown", abajo);
  slide.addEventListener("pointermove", mueve);
  slide.addEventListener("pointerup", suelta);
  slide.addEventListener("pointercancel", suelta);
  o.kill = () => {
    gsap.killTweensOf(o);
    slide.removeEventListener("pointerdown", abajo);
    slide.removeEventListener("pointermove", mueve);
    slide.removeEventListener("pointerup", suelta);
    slide.removeEventListener("pointercancel", suelta);
  };
  return o;
}

/** Todas las texturas que usa la escena (mapas de materiales y uniforms). */
function texturasDe(escena) {
  const lista = new Set();
  const mirar = (m) => {
    if (!m) return;
    Object.values(m).forEach((v) => { if (v && v.isTexture) lista.add(v); });
    if (m.uniforms) Object.values(m.uniforms).forEach((u) => { if (u && u.value && u.value.isTexture) lista.add(u.value); });
    if (m.userData && m.userData.propios) Object.values(m.userData.propios).forEach((u) => { if (u && u.value && u.value.isTexture) lista.add(u.value); });
  };
  escena.traverse((o) => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(mirar); });
  if (escena.background && escena.background.isTexture) lista.add(escena.background);
  return lista;
}

/** Libera geometrías, materiales y texturas de una escena. */
function liberar(escena, extra = []) {
  const texturas = texturasDe(escena);
  escena.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m && m.dispose());
    if (o.dispose && o.isInstancedMesh) o.dispose();
    if (o.shadow && o.shadow.map) o.shadow.map.dispose();
  });
  texturas.forEach((x) => x.dispose());
  extra.forEach((x) => x && x.dispose && x.dispose());
  if (escena.environment) escena.environment.dispose();
}

/**
 * Crea el lienzo 3D dentro de `contenedor` (div .escena3d que llega hasta los bordes de la pantalla).
 * Devuelve null si no hay WebGL. opciones: aria, exposicion, tono (tone mapping), sombras, recorte (clipping local).
 */
export function crearVista(contenedor, { aria = "", exposicion = 1.1, tono = THREE.ACESFilmicToneMapping, sombras = true, recorte = false, clase = "escena3d", caja: cajaDada = null } = {}) {
  const caja = cajaDada || el("div", clase, contenedor);
  let renderer;
  try {
    // Sin antialias del lienzo: todo pasa por el posproceso, que no lo usa (ahorra memoria y ancho de banda).
    renderer = new THREE.WebGLRenderer({ antialias: false, stencil: false, powerPreference: "high-performance" });
  } catch (err) {
    if (!cajaDada) caja.remove();
    return null;
  }
  const W = caja.offsetWidth || 1920, H = caja.offsetHeight || 1080;
  const base = ratioBase();
  renderer.setPixelRatio(base);
  renderer.setSize(W, H, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = tono;
  renderer.toneMappingExposure = exposicion;
  renderer.shadowMap.enabled = sombras;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = recorte;
  if (aria) { renderer.domElement.setAttribute("role", "img"); renderer.domElement.setAttribute("aria-label", aria); }
  caja.appendChild(renderer.domElement);
  const raiz = getComputedStyle(document.documentElement);
  const ex = parseFloat(raiz.getPropertyValue("--ex")) || (W - 1920) / 2, ey = parseFloat(raiz.getPropertyValue("--ey")) || (H - 1080) / 2;
  const slide = caja.closest(".slide");

  const vista = { caja, renderer, W, H, ex, ey, ratio: base, slide, composer: null, bloom: null, orbita: { giro: 0, alto: 0, kill() {} } };
  let corriendo = false, destruida = false, conBrillo = true, ultimo = 0, cuadros = 0, suma = 0, nivel = 0, ultimaFirma = "";
  let opciones = null;
  const extras = [];

  /** Baja la calidad un escalón: resolución, resplandor a un cuarto, sin resplandor, resolución mínima. */
  function aplicarNivel(n) {
    nivel = n;
    const f = [1, 0.8, 0.66, 0.66, 0.5][Math.min(4, n)];
    renderer.setPixelRatio(Math.max(0.5, base * f));
    if (vista.composer) { vista.composer.setPixelRatio(renderer.getPixelRatio()); vista.composer.setSize(W, H); }
    conBrillo = n < 3 && !!vista.bloom;
    estado.calidad = Math.max(estado.calidad, n);
  }

  const visible = () => !slide || (slide.classList.contains("activa") && !slide.classList.contains("saliendo"));
  const dibujar = (ms) => {
    if (opciones.cada) opciones.cada(ms / 1000);
    if (conBrillo && vista.composer) vista.composer.render(); else renderer.render(opciones.escena, opciones.camara);
    if (opciones.despues) opciones.despues();
  };
  const bucle = (ms) => {
    if (!corriendo) return;
    requestAnimationFrame(bucle);
    if (!visible()) { ultimo = 0; return; }
    const dt = ultimo ? ms - ultimo : 1000;
    if (automatico()) {
      // En las capturas dibuja solo cuando algo cambió (o cada tanto), así el navegador tiene aire para la foto
      if (opciones.firma) {
        const f = opciones.firma();
        if (f === ultimaFirma) return;
        ultimaFirma = f;
      } else if (dt < 200) return;
      ultimo = ms;
      dibujar(ms);
      return;
    }
    if (dt < 1000 / 60 - 2) return; // pantallas de 120 Hz: 60 cuadros alcanzan y cuestan la mitad
    ultimo = ms;
    estado.cuadros += 1;
    // Degradación automática: promedio de 45 cuadros fuera de las transiciones; descarta pausas sueltas (pestaña oculta, GC)
    if (nivel < 4 && !window.__calidadFija && !document.documentElement.classList.contains("en-transicion") && dt < 250) {
      cuadros += 1;
      if (cuadros > 15) suma += dt;
      if (cuadros === 60) {
        if (suma / 45 > 24) { aplicarNivel(nivel + 1); calidadGlobal = Math.max(calidadGlobal, nivel); }
        cuadros = 0; suma = 0;
      }
    }
    dibujar(ms);
  };

  /** Compila los shaders, espera las imágenes, sube las texturas y dibuja un cuadro de prueba: después la diapositiva entra sin tirones. */
  async function preparar() {
    await Promise.resolve(); // deja terminar el montaje y la construcción del timeline
    const propias = pendientes.splice(0);
    const { escena, camara } = opciones;
    const limite = performance.now() + 1500;
    // Imágenes de TextureLoader (llegan sin imagen hasta que decodifican) y lienzos que se pintan después
    await Promise.race([Promise.all(propias.map((p) => p.catch(() => null))), new Promise((r) => setTimeout(r, 1500))]);
    while (performance.now() < limite) {
      const faltan = [...texturasDe(escena)].some((x) => !x.isRenderTargetTexture && !x.isCubeTexture && !x.isDataTexture && (!x.image || (x.image.tagName === "IMG" && !x.image.complete)));
      if (!faltan) break;
      await new Promise((r) => setTimeout(r, 16));
    }
    if (destruida) return;
    try {
      if (renderer.compileAsync) await Promise.race([renderer.compileAsync(escena, camara), new Promise((r) => setTimeout(r, 2500))]);
      else renderer.compile(escena, camara);
    } catch (err) { /* sigue igual: compila en el primer cuadro */ }
    if (destruida) return;
    texturasDe(escena).forEach((x) => { try { renderer.initTexture(x); } catch (err) { /* textura sin imagen */ } });
    dibujar(performance.now()); // cuadro de prueba: sombras, destinos del posproceso y programas de profundidad
  }

  /**
   * Arranca el bucle. escena y camara obligatorias; brillo [fuerza, radio, umbral] o null; cada(seg) corre antes de
   * dibujar y despues() al terminar; firma() resume lo animado (solo para capturas automáticas); orbita { giro, alto } o false.
   */
  vista.animar = (op) => {
    opciones = op;
    const { escena, camara, brillo = [0.7, 0.55, 0.8], orbita = {} } = op;
    if (brillo) {
      const composer = new EffectComposer(renderer);
      composer.setPixelRatio(renderer.getPixelRatio());
      composer.setSize(W, H);
      composer.addPass(new RenderPass(escena, camara));
      const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), ...brillo);
      // Resplandor a media resolución del cuadro (y a un cuarto si la PC no llega)
      const tam = bloom.setSize.bind(bloom);
      bloom.setSize = (w, h) => (nivel >= 2 ? tam(w / 2, h / 2) : tam(w, h));
      composer.addPass(bloom);
      composer.addPass(new OutputPass());
      vista.composer = composer; vista.bloom = bloom;
    } else conBrillo = false;
    if (orbita && !automatico()) vista.orbita = arrastre(slide, orbita);
    if (calidadGlobal && !automatico() && !window.__calidadFija) aplicarNivel(calidadGlobal);
    corriendo = true; destruida = false;
    vivos.add(vista); estado.vivos = vivos.size;
    const listo = preparar();
    if (slide) esperarEn(slide, listo);
    requestAnimationFrame(bucle);
    return vista;
  };

  /** Cámara con el ángulo vertical que conserva el encuadre horizontal de 16:9. */
  vista.camara = (fov, cerca = 0.1, lejos = 200) => new THREE.PerspectiveCamera(fovPara(fov, W / H), W / H, cerca, lejos);
  /** Punto del mundo a coordenadas del escenario de 1920×1080. */
  const v = new THREE.Vector3();
  vista.proyectar = (p, camara = opciones && opciones.camara) => {
    v.copy(p).project(camara);
    return { x: ((v.x + 1) / 2) * W - ex, y: ((1 - v.y) / 2) * H - ey, z: v.z };
  };
  /** Algo más que liberar al desmontar (texturas fuera de la escena, por ejemplo). */
  vista.liberarTambien = (...cosas) => extras.push(...cosas);

  vista.destruir = () => {
    if (destruida) return;
    corriendo = false; destruida = true;
    vivos.delete(vista); estado.vivos = vivos.size;
    vista.orbita.kill();
    if (opciones) liberar(opciones.escena, extras);
    if (vista.composer) { vista.composer.passes.forEach((p) => p.dispose && p.dispose()); vista.composer.dispose(); }
    renderer.renderLists.dispose();
    renderer.dispose();
    try { renderer.forceContextLoss(); } catch (err) { /* contexto ya liberado */ }
    renderer.domElement.width = renderer.domElement.height = 1;
    caja.remove();
  };
  return vista;
}
