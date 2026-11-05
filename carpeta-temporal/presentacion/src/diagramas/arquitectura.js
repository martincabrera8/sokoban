import * as THREE from "three";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { t, img, el, eventos, juntas } from "../util.js";
import { crearVista, cargando } from "../vista3d.js";
import { CAPAS } from "../datos.js";
import { crearPersonaje } from "../personaje3d.js";

gsap.registerPlugin(SplitText);

/*
 * Tres placas apiladas en 3D: arriba la vista (8 clases), en el medio el contrato (4 tipos que atraviesan la placa
 * como únicas puertas) y abajo quien lo implementa. Los datos viajan siempre por el contrato: las llamadas bajan
 * (naranja) y las fotos del estado suben (celeste). Una llamada que intenta ir directo al dominio choca con la placa.
 * Al final la caja JuegoDePrueba sale despedida y el personaje empuja la caja del dominio hasta su destino:
 * en Main cambia una línea y ni la vista ni el contrato se tocan.
 */
const FOV = 30;
const Y = { vista: 2.5, contrato: 0, impl: -2.5 };
const COL = [-3.75, -1.25, 1.25, 3.75];
const BLOQUE = { w: 2.3, h: 0.42, d: 0.95 };
const PLACA = { w: 10.6, grosor: 0.16, dVista: 3.9, d: 2.5 };
const FILA = { frente: 1.0, fondo: -1.15 };
const CAJA = 1.3;
const PASOS_CAJA = 3;
const X_DESTINO = 0;
/** Qué tipos del contrato importa cada clase de la vista (src/main/java/sokoban/vista/*.java). */
const USA = {
  VentanaPrincipal: ["Juego"],
  PantallaJuego: ["Juego", "EstadoJuego", "Direccion"],
  PanelHUD: ["Juego", "EstadoJuego", "ObservadorJuego"],
  PanelTablero: ["ObservadorJuego", "EstadoJuego", "Direccion"],
};
const TIPO = { Juego: "interface", ObservadorJuego: "interface", EstadoJuego: "record", Direccion: "enum" };
/** Los cuatro tipos de CAPAS.contrato, en el orden que menos cruza los conductos. */
const CONTRATO = ["Juego", "EstadoJuego", "ObservadorJuego", "Direccion"].filter((k) => CAPAS.contrato.includes(k));
Object.values(USA).forEach((lista) => lista.sort((a, b) => CONTRATO.indexOf(a) - CONTRATO.indexOf(b)));
/** Blanco del papel (token) con transparencia, para las máscaras que después tiñe cada material. */
function blanco(a) {
  const h = t("papel").replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)}, ${parseInt(h.slice(2, 4), 16)}, ${parseInt(h.slice(4, 6), 16)}, ${a})`;
}

const suave = (a, b, x) => { const k = Math.max(0, Math.min(1, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
const luz = (k, f = 1) => new THREE.Color(t(k)).multiplyScalar(f);

/** Textura pixel art; con fondo, los píxeles transparentes del sprite se pintan del color del cielo. */
function textura(k, fondo = null) {
  if (!fondo) {
    const x = new THREE.TextureLoader().load(img(k));
    x.colorSpace = THREE.SRGBColorSpace; x.magFilter = x.minFilter = THREE.NearestFilter; x.generateMipmaps = false;
    return x;
  }
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = new THREE.CanvasTexture(c);
  x.colorSpace = THREE.SRGBColorSpace; x.magFilter = x.minFilter = THREE.NearestFilter; x.generateMipmaps = false;
  const im = new Image();
  cargando(new Promise((listo) => {
    im.onload = () => { const g = c.getContext("2d"); g.fillStyle = fondo; g.fillRect(0, 0, 64, 64); g.drawImage(im, 0, 0, 64, 64); x.needsUpdate = true; listo(); };
    im.onerror = listo;
  }));
  im.src = img(k);
  return x;
}

function punto() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, blanco(1)); gr.addColorStop(0.3, blanco(0.5)); gr.addColorStop(1, blanco(0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function rejilla(n) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  g.strokeStyle = blanco(0.8); g.lineWidth = 1.5; g.strokeRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(n[0], n[1]);
  tex.anisotropy = 8;
  return tex;
}

/** Un camino hecho de varias curvas (cada una se puede recorrer al revés). */
function camino(tramos) {
  const largos = tramos.map(([c]) => c.getLength());
  const total = largos.reduce((a, b) => a + b, 0);
  return {
    total,
    en(u, destino) {
      let d = Math.max(0, Math.min(1, u)) * total;
      for (let i = 0; i < tramos.length; i++) {
        if (d <= largos[i] || i === tramos.length - 1) {
          const f = Math.min(1, d / largos[i]);
          const [c, alReves] = tramos[i];
          return destino.copy(c.getPointAt(alReves ? 1 - f : f));
        }
        d -= largos[i];
      }
      return destino;
    },
  };
}

/** Sin WebGL: las tres capas como texto. */
function respaldo(lienzo) {
  const pila = el("div", "arq__respaldo", lienzo);
  [["Vista", CAPAS.vista.join(", ")], ["Contrato", CAPAS.contrato.join(", ")], ["Implementación", "hoy JuegoDePrueba; después, el dominio"]].forEach(([n, d]) => {
    const f = el("div", "arq__respaldo-capa", pila);
    el("div", "arq__capa-nombre", f, { texto: n });
    el("div", "arq__capa-dato", f, { texto: d });
  });
  return { sin3d: true, pila };
}

export default {
  montar(lienzo) {
    const vista = crearVista(lienzo, { aria: "Tres placas apiladas: la vista arriba, el contrato en el medio y la implementación abajo. Los datos pasan solo por el contrato.", tono: THREE.NoToneMapping });
    if (!vista) return respaldo(lienzo);
    const { W, H } = vista;
    const EX = vista.ex, EY = vista.ey;
    el("div", "arq__velo", lienzo);
    const capa = el("div", "arq__capa", lienzo, { "aria-hidden": "true" });

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(t("fondo-hondo"));
    escena.fog = new THREE.Fog(t("fondo-hondo"), 24, 52);
    const camara = vista.camara(FOV, 0.1, 200);
    // La pila va a la izquierda del centro y un poco abajo: a la derecha quedan los rótulos y arriba el título.
    camara.setViewOffset(W, H, W * 0.115, -H * 0.12, W, H);

    escena.add(new THREE.HemisphereLight(t("superficie-2"), t("fondo-hondo"), 2.4));
    const sol = new THREE.DirectionalLight(t("tinta-2"), 2.2);
    sol.position.set(6, 12, 9);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
    sol.shadow.bias = -0.0008;
    escena.add(sol);

    const mapaPunto = punto();
    const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: luz("linea", 0.9), map: mapaPunto, size: 0.08, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: 1800 }, (_, i) => (i % 3 === 1 ? gsap.utils.random(-9, 12) : gsap.utils.random(-22, 22))), 3));
    escena.add(polvo);

    // ── Placas ──
    const placas = {};
    const placa = (k, prof, color) => {
      const g = new THREE.Group();
      g.position.y = Y[k];
      const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(PLACA.w, PLACA.grosor, prof, 3, 0.05), new THREE.MeshStandardMaterial({ color: t("superficie"), metalness: 0.4, roughness: 0.55, transparent: true, opacity: 0.9 }));
      cuerpo.receiveShadow = true;
      g.add(cuerpo);
      const piel = new THREE.Mesh(new THREE.PlaneGeometry(PLACA.w - 0.1, prof - 0.1), new THREE.MeshBasicMaterial({ map: rejilla([PLACA.w * 2, prof * 2]), color: luz(color, 0.22), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      piel.rotation.x = -Math.PI / 2; piel.position.y = PLACA.grosor / 2 + 0.003;
      g.add(piel);
      const borde = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(PLACA.w, PLACA.grosor, prof)), new THREE.LineBasicMaterial({ color: luz(color, 1.5), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(borde);
      escena.add(g);
      placas[k] = { g, prof, cuerpo, borde, cae: { v: 0 } };
    };
    placa("vista", PLACA.dVista, "linea");
    placa("contrato", PLACA.d, "acento");
    placa("impl", PLACA.d, "exito");

    // ── Bloques (clases) ──
    const bloques = {};
    const geoBloque = new RoundedBoxGeometry(BLOQUE.w, BLOQUE.h, BLOQUE.d, 3, 0.05);
    const bloque = (nombre, padre, x, y, z, color, alto = BLOQUE.h, tipo = null) => {
      const g = new THREE.Group();
      g.position.set(x, y, z);
      const mat = new THREE.MeshStandardMaterial({ color: t("superficie-2"), metalness: 0.3, roughness: 0.5, emissive: luz(color), emissiveIntensity: 0 });
      const m = new THREE.Mesh(alto === BLOQUE.h ? geoBloque : new RoundedBoxGeometry(BLOQUE.w * 0.8, alto, BLOQUE.d, 3, 0.05), mat);
      m.castShadow = true; m.receiveShadow = true;
      g.add(m);
      const ancho = alto === BLOQUE.h ? BLOQUE.w : BLOQUE.w * 0.8;
      const aristas = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(ancho, alto, BLOQUE.d)), new THREE.LineBasicMaterial({ color: luz(color, 1.3), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
      g.add(aristas);
      padre.add(g);
      const rotulo = el("div", "arq__clase arq__clase--" + color, capa);
      el("span", "arq__clase-nombre", rotulo, { texto: nombre });
      if (tipo) el("span", "arq__clase-tipo", rotulo, { texto: tipo });
      bloques[nombre] = { g, m, mat, aristas, color, rotulo, alto, brillo: 0, nace: { v: 0 }, base: aristas.material.color.clone() };
      return bloques[nombre];
    };
    const frente = Object.keys(USA);
    const fondo = CAPAS.vista.filter((k) => !USA[k]);
    frente.forEach((k, i) => bloque(k, escena, COL[i], Y.vista + PLACA.grosor / 2 + BLOQUE.h / 2, FILA.frente, "linea"));
    fondo.forEach((k, i) => bloque(k, escena, COL[i], Y.vista + PLACA.grosor / 2 + BLOQUE.h / 2, FILA.fondo, "linea"));
    CONTRATO.forEach((k, i) => bloque(k, escena, COL[i], 0, 0, "acento", 0.8, TIPO[k]));

    // ── Implementación: cajas del juego sobre su destino ──
    const pisoImpl = Y.impl + PLACA.grosor / 2;
    const destino = new THREE.Mesh(new THREE.PlaneGeometry(CAJA * 1.25, CAJA * 1.25), new THREE.MeshStandardMaterial({ map: textura("goals/goal"), roughness: 0.7, emissive: luz("acento"), emissiveIntensity: 0, transparent: true }));
    destino.rotation.x = -Math.PI / 2; destino.position.set(X_DESTINO, pisoImpl + 0.006, 0);
    destino.receiveShadow = true;
    escena.add(destino);
    const cajaDe = (k) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(CAJA, CAJA, CAJA), new THREE.MeshStandardMaterial({ map: textura(k, t("superficie")), roughness: 0.8, emissive: luz("acento"), emissiveIntensity: 0 }));
      m.castShadow = true;
      escena.add(m);
      return m;
    };
    const prueba = cajaDe("boxes/box_tools");
    const dominio = cajaDe("boxes/box_wood");
    const rotPrueba = el("div", "arq__clase arq__clase--exito", capa);
    el("span", "arq__clase-nombre", rotPrueba, { texto: "JuegoDePrueba" });
    el("span", "arq__clase-tipo", rotPrueba, { texto: "de prueba, 3 niveles" });
    const rotDominio = el("div", "arq__clase arq__clase--pendiente", capa);
    el("span", "arq__clase-nombre", rotDominio, { texto: "ControladorJuego" });
    el("span", "arq__clase-tipo", rotDominio, { texto: "el dominio (simulado)" });
    const pj = crearPersonaje(0.82);
    pj.raiz.rotation.y = Math.PI / 2;
    pj.raiz.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    escena.add(pj.raiz);
    const onda = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 64), new THREE.MeshBasicMaterial({ color: luz("acento", 2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    onda.rotation.x = -Math.PI / 2; onda.position.set(X_DESTINO, pisoImpl + 0.02, 0);
    escena.add(onda);
    const choque = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.3, 48), new THREE.MeshBasicMaterial({ color: luz("e1955", 2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    choque.rotation.x = -Math.PI / 2;
    escena.add(choque);

    // ── Conductos: de la vista al contrato y del contrato a la implementación ──
    const conductos = {};
    const tubo = (clave, curva, color, r = 0.03) => {
      const nucleo = new THREE.Mesh(new THREE.TubeGeometry(curva, 90, r, 8, false), new THREE.MeshBasicMaterial({ color: luz(color, 1.05), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
      const halo = new THREE.Mesh(new THREE.TubeGeometry(curva, 90, r * 3, 8, false), new THREE.MeshBasicMaterial({ color: luz(color, 0.5), transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }));
      [nucleo, halo].forEach((m) => { m.frustumCulled = false; escena.add(m); });
      conductos[clave] = { curva, nucleo, halo, trazo: { v: 0 } };
    };
    const xTipo = (k) => COL[CONTRATO.indexOf(k)];
    const entrantes = {};
    frente.forEach((v) => USA[v].forEach((k) => { (entrantes[k] ||= []).push(v); }));
    frente.forEach((v, i) => {
      USA[v].forEach((k, j) => {
        const n = USA[v].length, lista = entrantes[k].sort((a, b) => frente.indexOf(a) - frente.indexOf(b));
        const a = new THREE.Vector3(COL[i] + (j - (n - 1) / 2) * 0.36, Y.vista - PLACA.grosor / 2, FILA.frente);
        const b = new THREE.Vector3(xTipo(k) + (lista.indexOf(v) - (lista.length - 1) / 2) * 0.3, 0.4, 0.05);
        tubo(v + ">" + k, new THREE.CubicBezierCurve3(a, a.clone().add(new THREE.Vector3(0, -1.0, 0)), b.clone().add(new THREE.Vector3(0, 1.0, 0.2)), b), "linea");
      });
    });
    const topeCaja = pisoImpl + CAJA;
    CONTRATO.forEach((k, j) => {
      const a = new THREE.Vector3(X_DESTINO + (j - 1.5) * 0.26, topeCaja, 0);
      const b = new THREE.Vector3(xTipo(k), -0.4, 0);
      tubo("impl>" + k, new THREE.CubicBezierCurve3(a, a.clone().add(new THREE.Vector3(0, 0.55, 0)), b.clone().add(new THREE.Vector3(0, -0.5, 0)), b), "exito", 0.034);
    });
    const atraviesa = (k, baja) => [new THREE.LineCurve3(new THREE.Vector3(xTipo(k), 0.4, 0.05), new THREE.Vector3(xTipo(k), -0.4, 0)), !baja];

    /** Recorridos reales: llamadas que bajan por Juego y fotos del estado que suben por ObservadorJuego o EstadoJuego. */
    const llamada = (v, k = "Juego") => camino([[conductos[v + ">" + k].curva, false], atraviesa(k, true), [conductos["impl>" + k].curva, true]]);
    const foto = (k, v) => camino([[conductos["impl>" + k].curva, false], atraviesa(k, false), [conductos[v + ">" + k].curva, true]]);
    const FLUJOS = [
      { c: llamada("PantallaJuego"), baja: true, peso: 3 },
      { c: llamada("VentanaPrincipal"), baja: true, peso: 1 },
      { c: llamada("PanelHUD"), baja: true, peso: 1 },
      { c: llamada("PantallaJuego", "Direccion"), baja: true, peso: 1 },
      { c: foto("ObservadorJuego", "PanelHUD"), baja: false, peso: 2 },
      { c: foto("ObservadorJuego", "PanelTablero"), baja: false, peso: 2 },
      { c: foto("EstadoJuego", "PantallaJuego"), baja: false, peso: 1 },
      { c: foto("EstadoJuego", "PanelTablero"), baja: false, peso: 1 },
    ];
    const guion = {
      mover: llamada("PantallaJuego"),
      direccion: llamada("PantallaJuego", "Direccion"),
      hud: foto("ObservadorJuego", "PanelHUD"),
      tablero: foto("ObservadorJuego", "PanelTablero"),
    };
    const atajo = new THREE.LineCurve3(new THREE.Vector3(COL[3] + 0.8, Y.vista - PLACA.grosor / 2, 0.95), new THREE.Vector3(COL[3] + 0.8, PLACA.grosor / 2, 0.95));
    choque.position.copy(atajo.v2).add(new THREE.Vector3(0, 0.01, 0));

    // ── Partículas ──
    const chispa = (color) => {
      const g = new THREE.Group();
      const sprites = Array.from({ length: 6 }, (_, i) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mapaPunto, color: luz(color, 3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        sp.scale.setScalar(0.42 - i * 0.05);
        g.add(sp);
        return sp;
      });
      escena.add(g);
      return { sprites, recorrido: null, u: 0, rapidez: 1 };
    };
    const enjambre = Array.from({ length: 10 }, (_, i) => chispa(i % 2 ? "exito" : "acento"));
    const actores = { mover: chispa("acento"), direccion: chispa("acento"), hud: chispa("exito"), tablero: chispa("exito"), atajo: chispa("e1955") };
    const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), proy = new THREE.Vector3();
    const ubicarChispa = (ch, curvaEn, u, visible) => {
      ch.sprites.forEach((sp, i) => {
        const uu = u - i * 0.012;
        sp.material.opacity = visible && uu > 0 && uu < 1 ? (1 - i / 6) * Math.min(1, uu * 12, (1 - uu) * 12) : 0;
        if (sp.material.opacity > 0) curvaEn(uu, sp.position);
      });
    };

    // Rótulos de capa, anclados a la esquina de su placa, y mensajes que acompañan a las partículas
    const rotCapa = (nombre, dato) => {
      const r = el("div", "arq__rotulo", capa);
      el("div", "arq__guia", r);
      const cuerpo = el("div", "arq__rotulo-cuerpo", r);
      el("div", "arq__capa-nombre", cuerpo, { texto: nombre });
      const d = el("div", "arq__capa-dato", cuerpo, { texto: dato });
      const igual = nombre === "Implementación" ? null : el("div", "arq__sin-cambios", cuerpo, { texto: "sin cambios" });
      return { r, d, igual };
    };
    const rotulos = {
      vista: rotCapa("Vista", "8 clases de Swing en sokoban.vista"),
      contrato: rotCapa("Contrato", "4 tipos en sokoban.modelo"),
      impl: rotCapa("Implementación", "hoy JuegoDePrueba, en sokoban.prueba"),
    };
    const nuevoDato = el("div", "arq__capa-dato arq__capa-dato--nuevo", rotulos.impl.d.parentNode, { texto: "después, el dominio del equipo" });
    const mensajes = {
      mover: el("div", "arq__mensaje", capa, { texto: "juego.mover(DERECHA)" }),
      hud: el("div", "arq__mensaje arq__mensaje--estado", capa, { texto: "actualizar(estado)" }),
      atajo: el("div", "arq__mensaje arq__mensaje--no", capa, { texto: "la vista solo importa sokoban.modelo" }),
    };

    // Main.java
    const main = el("div", "arq__main", lienzo);
    el("div", "arq__main-archivo", main, { texto: "Main.java" });
    const comentario = el("div", "arq__main-linea arq__main-comentario", main);
    const comHoy = el("span", "", comentario, { texto: "// hoy" });
    const comDespues = el("span", "arq__main-despues", comentario, { texto: "// cuando llegue el dominio" });
    const linea = el("div", "arq__main-linea arq__main-cambia", main);
    el("span", "", linea, { texto: "Juego juego = new " });
    const hueco = el("span", "arq__main-hueco", linea);
    const viejo = el("span", "arq__main-clase arq__main-viejo", hueco, { texto: "JuegoDePrueba" });
    const nuevo = el("span", "arq__main-clase arq__main-nuevo", hueco, { texto: "ControladorJuego" });
    el("span", "", linea, { texto: "();" });

    // ── Estado que mueve el timeline ──
    const est = {
      cam: { el: 1, r: 1, y: 0 },
      impl: { v: 0 },          // conductos de la implementación dibujados
      cambio: { v: 0 },        // 0 JuegoDePrueba, 1 dominio
      cae: { v: 0 },           // la caja de prueba cae en su destino
      fuera: { v: 0 },         // la caja de prueba sale despedida
      entra: { v: 0 },         // la caja del dominio y el personaje aparecen
      empuje: { v: 0 },        // cuántas baldosas empujó
      llega: { v: 0 },         // la onda al encastrar
      guion: { mover: { u: 0 }, direccion: { u: 0 }, hud: { u: 0 }, tablero: { u: 0 }, atajo: { u: 0 } },
      rotulos: { v: 0 },
      nota: { v: 0 },          // el mensaje del atajo que no existe
    };
    const orbita = { az: 0, el: 0 };

    function proyectar(v) {
      proy.copy(v).project(camara);
      return { x: (proy.x + 1) / 2 * W - EX, y: (1 - proy.y) / 2 * H - EY, visible: proy.z < 1 };
    }
    const colocar = (e, p, alfa) => {
      e.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;
      e.style.opacity = p.visible ? Math.max(0, Math.min(1, alfa)).toFixed(3) : 0;
    };

    const IMPL_PRUEBA = luz("exito", 1.05), IMPL_DOMINIO = luz("acento", 1.3);
    function actualizar() {
      // Cámara en órbita: el timeline da la base y la vida la hace girar despacio
      const az = 0.2 + orbita.az + vista.orbita.giro, elev = Math.max(0.02, Math.min(1.45, 0.38 + (est.cam.el - 1) * 0.9 + orbita.el + vista.orbita.alto)), r = 23.5 * est.cam.r;
      camara.position.set(Math.sin(az) * Math.cos(elev) * r, Math.sin(elev) * r + est.cam.y, Math.cos(az) * Math.cos(elev) * r);
      camara.lookAt(0, est.cam.y, 0);
      camara.updateMatrixWorld();

      // Placas que caen y se encastran
      Object.entries(placas).forEach(([k, p]) => {
        const v = p.cae.v;
        p.g.position.y = Y[k] + (1 - v) * 7;
        p.g.visible = v > 0.001;
      });
      Object.values(bloques).forEach((b) => {
        const v = b.nace.v;
        b.g.scale.set(1, Math.max(0.01, v), 1);
        b.g.visible = v > 0.001;
      });
      Object.entries(conductos).forEach(([k, c]) => {
        const f = k.startsWith("impl>") ? Math.min(c.trazo.v, est.impl.v) : c.trazo.v;
        const n = Math.floor(Math.max(0, Math.min(1, f)) * 90) * 8 * 6;
        c.nucleo.geometry.setDrawRange(0, n); c.halo.geometry.setDrawRange(0, n);
        if (k.startsWith("impl>")) { c.nucleo.material.color.copy(IMPL_PRUEBA).lerp(IMPL_DOMINIO, est.cambio.v); }
      });

      // Caja de prueba: cae en su destino y después sale despedida
      const fv = est.fuera.v;
      prueba.position.set(X_DESTINO + fv * 9, pisoImpl + CAJA / 2 + (1 - est.cae.v) * 6 + fv * 3.2 - fv * fv * 14, 0);
      prueba.rotation.set(fv * 3.4, 0, -fv * 7);
      prueba.visible = est.cae.v > 0.001 && fv < 0.999;
      // Caja del dominio empujada por el personaje
      const ev = est.entra.v, xd = X_DESTINO - (PASOS_CAJA - est.empuje.v) * CAJA;
      dominio.position.set(xd, pisoImpl + CAJA / 2 + (1 - ev) * 5, 0);
      dominio.visible = ev > 0.001;
      pj.raiz.position.set(xd - CAJA / 2 - 0.32, pisoImpl + (1 - ev) * 6.5, 0);
      pj.raiz.visible = ev > 0.001;
      const lv = est.llega.v;
      dominio.material.emissiveIntensity = suave(0, 0.3, lv) * 0.14;
      destino.material.emissiveIntensity = Math.max(fv > 0.2 ? 0.5 : 0, suave(0, 0.3, lv) * 0.7);
      onda.scale.setScalar(1 + lv * 9);
      onda.material.opacity = lv > 0 && lv < 1 ? (1 - lv) : 0;

      // Partículas guionadas y brillo de los bloques por donde pasan
      Object.values(bloques).forEach((b) => { b.brillo = 0; });
      const tocar = (p) => {
        Object.values(bloques).forEach((b) => {
          const d = b.g.position.distanceTo(p);
          if (d < 1.2) b.brillo = Math.max(b.brillo, 1 - d / 1.2);
        });
      };
      Object.entries(actores).forEach(([k, ch]) => {
        const u = est.guion[k].u;
        const visible = u > 0 && u < 1;
        // el atajo baja hasta la placa del contrato, rebota y se apaga
        const en = k === "atajo" ? (uu, d) => d.copy(atajo.getPoint(uu < 0.8 ? uu / 0.8 : 1 - Math.sin(((uu - 0.8) / 0.2) * Math.PI) * 0.12)) : (uu, d) => guion[k].en(uu, d);
        ubicarChispa(ch, en, u, visible);
        if (visible) tocar(ch.sprites[0].position);
      });
      enjambre.forEach((ch) => { if (ch.recorrido) tocar(ch.sprites[0].position); });
      const av = est.guion.atajo.u;
      choque.scale.setScalar(1 + Math.max(0, av - 0.8) * 26);
      choque.material.opacity = av > 0.8 && av < 1 ? (1 - (av - 0.8) / 0.2) : 0;
      Object.values(bloques).forEach((b) => {
        b.mat.emissiveIntensity = b.brillo * 0.55;
        b.aristas.material.color.copy(b.base).multiplyScalar(1 + b.brillo * 1.2);
      });

      // Rótulos
      const rv = est.rotulos.v;
      Object.entries(bloques).forEach(([k, b]) => {
        // las del fondo se rotulan sobre su cara de arriba, así no tapan a las de adelante
        const p = proyectar(tmp.copy(b.g.position).add(fondo.includes(k) ? tmp2.set(0, BLOQUE.h / 2 + 0.05, -0.15) : tmp2.set(0, 0, BLOQUE.d / 2 + 0.02)));
        colocar(b.rotulo, p, suave(0.6, 1, b.nace.v) * (fondo.includes(k) ? 0.85 : 1));
      });
      colocar(rotPrueba, proyectar(tmp.set(prueba.position.x, pisoImpl, CAJA / 2 + 0.35)), est.cae.v * (1 - suave(0, 0.08, fv)));
      colocar(rotDominio, proyectar(tmp.set(dominio.position.x, pisoImpl, CAJA / 2 + 0.35)), suave(0.5, 1, ev));
      const fondoPlaca = { vista: PLACA.dVista, contrato: PLACA.d, impl: PLACA.d };
      Object.entries(rotulos).forEach(([k, r]) => {
        const p = proyectar(tmp.set(PLACA.w / 2, placas[k].g.position.y, fondoPlaca[k] / 2));
        r.r.style.setProperty("--guia", Math.max(0, 1340 - p.x).toFixed(1) + "px");
        colocar(r.r, p, rv * suave(0.5, 1, placas[k].cae.v));
      });
      const pm = actores.mover.sprites[0].position, ph = actores.hud.sprites[0].position;
      colocar(mensajes.mover, proyectar(pm), Math.sin(Math.PI * Math.min(1, Math.max(0, est.guion.mover.u))) * 3);
      colocar(mensajes.hud, proyectar(ph), Math.sin(Math.PI * Math.min(1, Math.max(0, est.guion.hud.u))) * 3);
      colocar(mensajes.atajo, proyectar(choque.position), est.nota.v);
    }

    vista.animar({ escena, camara, brillo: [0.7, 0.5, 0.82], orbita: { giro: 0.5, alto: 0.2 }, cada: actualizar });

    return {
      est, orbita, placas, bloques, conductos, enjambre, FLUJOS, pj, polvo, rotulos, nuevoDato, comHoy, comDespues, hueco, viejo, nuevo, linea, main, ubicarChispa,
      destruir: () => vista.destruir(),
    };
  },

  construir(tl, c) {
    if (c.sin3d) {
      tl.fromTo(c.pila.children, { autoAlpha: 0, y: -30 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.2 }, 0.4);
      return;
    }
    const { est, placas, bloques, conductos, pj } = c;
    const orden = ["impl", "contrato", "vista"];

    // Entrada: la grúa baja mientras caen las placas, nacen las clases y se tienden los conductos
    tl.fromTo(est.cam, { el: 2.1, r: 1.25, y: 1.5 }, { el: 1, r: 1, y: 0, duration: 4.2, ease: "power2.inOut" }, 0);
    orden.forEach((k, i) => tl.fromTo(placas[k].cae, { v: 0 }, { v: 1, duration: 0.9, ease: "bounce.out" }, 0.3 + i * 0.45));
    const nacen = (k, en) => tl.fromTo(bloques[k].nace, { v: 0 }, { v: 1, duration: 0.45, ease: "back.out(2)" }, en);
    CAPAS.contrato.forEach((k, i) => nacen(k, 1.4 + i * 0.1));
    CAPAS.vista.forEach((k, i) => nacen(k, 1.9 + i * 0.07));
    tl.fromTo(est.cae, { v: 0 }, { v: 1, duration: 0.7, ease: "bounce.out" }, 1.5);
    Object.entries(conductos).forEach(([k, cd], i) => tl.fromTo(cd.trazo, { v: 0 }, { v: 1, duration: 0.7, ease: "power2.inOut" }, 2.5 + (i % 10) * 0.08));
    tl.fromTo(est.impl, { v: 0 }, { v: 1, duration: 0.7, ease: "power2.inOut" }, 2.9)
      .fromTo(est.rotulos, { v: 0 }, { v: 1, duration: 0.6 }, 2.6)
      .fromTo(c.main, { autoAlpha: 0, y: -16 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 3.0)
      .set([est.cambio, est.fuera, est.entra, est.empuje, est.llega], { v: 0 }, 0)
      .set(Object.values(est.guion), { u: 0 }, 0)
      .set([c.comDespues, c.nuevo, c.nuevoDato, c.rotulos.vista.igual, c.rotulos.contrato.igual], { autoAlpha: 0 }, 0)
      .set(est.nota, { v: 0 }, 0)
      .set(c.hueco, { width: "13ch" }, 0);

    // 1. Una llamada baja por el contrato y la foto del estado sube a los observadores
    tl.addLabel("p1", 4.6);
    tl.fromTo(est.guion.mover, { u: 0 }, { u: 1, duration: 2.2, ease: "power1.inOut" }, "p1+=0.2")
      .fromTo(est.guion.direccion, { u: 0 }, { u: 1, duration: 2.2, ease: "power1.inOut" }, "p1+=0.35")
      .fromTo([est.guion.hud, est.guion.tablero], { u: 0 }, { u: 1, duration: 2.0, ease: "power1.inOut", stagger: 0.12 }, "p1+=2.4");

    // 2. Un atajo de la vista al dominio no existe: choca con la placa del contrato
    tl.addLabel("p2", tl.labels.p1 + 4.8);
    tl.fromTo(est.guion.atajo, { u: 0 }, { u: 1, duration: 1.4, ease: "power1.in" }, "p2+=0.1")
      .to(placas.contrato.g.position, { x: 0.05, duration: 0.06, yoyo: true, repeat: 3, ease: "sine.inOut" }, "p2+=1.22")
      .fromTo(est.nota, { v: 0 }, { v: 1, duration: 0.4 }, "p2+=1.2");

    // 3. Sale JuegoDePrueba, el personaje empuja la caja del dominio hasta su destino y en Main cambia una línea
    tl.addLabel("p3", tl.labels.p2 + 2.2);
    const p3 = tl.labels.p3;
    tl.to(est.nota, { v: 0, duration: 0.3 }, p3)
      .to(est.cam, { el: 0.95, duration: 1.4, ease: "power2.inOut" }, p3)
      .to(est.impl, { v: 0, duration: 0.6, ease: "power2.in" }, p3 + 0.1)
      .to(est.fuera, { v: 1, duration: 1.3, ease: "power1.in" }, p3 + 0.8)
      .fromTo(est.entra, { v: 0 }, { v: 1, duration: 0.7, ease: "bounce.out" }, p3 + 1.5);
    const pose = (en, v, dur = 0.2, ease = "power2.out") => tl.to(pj.pose, { ...v, duration: dur, ease, onUpdate: pj.aplicar }, en);
    const paso = { f: 0 };
    pose(p3 + 2.2, { brazoI: -1.45, brazoD: -1.45 });
    for (let i = 0; i < PASOS_CAJA; i++) {
      const en = p3 + 2.45 + i * 0.6;
      tl.to(est.empuje, { v: i + 1, duration: 0.48, ease: "empuje" }, en)
        .to(paso, { f: `+=${Math.PI * 2}`, duration: 0.48, ease: "none", onUpdate: () => { pj.pose.piernaI = -Math.sin(paso.f) * 0.6; pj.pose.piernaD = Math.sin(paso.f) * 0.6; pj.aplicar(); } }, en);
    }
    const llega = p3 + 2.45 + PASOS_CAJA * 0.6 - 0.1;
    pose(llega + 0.1, { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0 }, 0.25);
    tl.fromTo(est.llega, { v: 0 }, { v: 1, duration: 1.3, ease: "power2.out" }, llega)
      .to(est.cambio, { v: 1, duration: 0.4 }, llega)
      .to(est.impl, { v: 1, duration: 0.8, ease: "power2.out" }, llega + 0.2)
      .to(est.cam, { el: 1, duration: 1.6, ease: "power2.inOut" }, llega + 0.4);
    // Main: se cae la clase de prueba, entra la del dominio
    const letrasViejas = SplitText.create(c.viejo, { type: "chars" }).chars;
    const letrasNuevas = SplitText.create(c.nuevo, { type: "chars" }).chars;
    tl.to(letrasViejas, { y: 34, rotation: () => gsap.utils.random(-50, 50), autoAlpha: 0, duration: 0.45, ease: "power2.in", stagger: 0.025 }, llega)
      .to(c.hueco, { width: "16ch", duration: 0.5, ease: "power2.inOut" }, llega + 0.35)
      .set(c.nuevo, { autoAlpha: 1 }, llega + 0.45)
      .fromTo(letrasNuevas, { y: -30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, ease: "back.out(2)", stagger: 0.03 }, llega + 0.45)
      .to(c.comHoy, { autoAlpha: 0, duration: 0.3 }, llega + 0.3)
      .to(c.comDespues, { autoAlpha: 1, duration: 0.4 }, llega + 0.5)
      .fromTo(c.linea, { "--marca": 0 }, { "--marca": 1, duration: 0.5 }, llega + 0.45)
      .to(c.rotulos.impl.d, { autoAlpha: 0, duration: 0.3 }, llega + 0.3)
      .to(c.nuevoDato, { autoAlpha: 1, duration: 0.4 }, llega + 0.5)
      .fromTo([c.rotulos.vista.igual, c.rotulos.contrato.igual], { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.15 }, llega + 0.9);
    // Festejo
    pose(llega + 1.2, { aplaste: 0.6 }, 0.1);
    pose(llega + 1.3, { aplaste: -0.3, brazoI: -2.8, brazoD: -2.8, abrir: 0.3 }, 0.14);
    tl.to(pj.raiz.rotation, { y: 0, duration: 0.3 }, llega + 1.1);
    pose(llega + 1.75, { aplaste: 0, brazoI: 0, brazoD: 0, abrir: 0 }, 0.4, "elastic.out(1, 0.4)");
  },

  vida(c) {
    if (c.sin3d) return { kill() {} };
    const fase = Math.random() * 6.28;
    const tick = (tt) => {
      c.orbita.az = Math.sin(tt * 0.07 + fase) * 0.13;
      c.orbita.el = Math.sin(tt * 0.05 + fase * 2) * 0.03;
      c.polvo.rotation.y = tt * 0.01;
      c.enjambre.forEach((ch) => {
        if (!ch.recorrido) return;
        ch.u += (0.0055 * ch.rapidez * 22) / ch.recorrido.c.total;
        if (ch.u >= 1.05) { ch.recorrido = null; c.ubicarChispa(ch, () => {}, 0, false); return; }
        c.ubicarChispa(ch, (uu, d) => ch.recorrido.c.en(uu, d), ch.u, true);
      });
      c.pj.cabeza.rotation.y = Math.sin(tt * 0.5 + fase) * 0.4;
    };
    gsap.ticker.add(tick);
    const bolsa = c.FLUJOS.flatMap((f) => Array(f.peso).fill(f));
    const color = { true: new THREE.Color(t("acento")).multiplyScalar(3), false: new THREE.Color(t("exito")).multiplyScalar(3) };
    const flujo = eventos(() => {
      const cv = c.est.cambio.v;
      if ((cv > 0.01 && cv < 0.99) || c.est.impl.v < 0.99) return; // durante el cambio no viaja nada
      const ch = c.enjambre.find((x) => !x.recorrido);
      if (!ch) return;
      const f = gsap.utils.random(bolsa);
      ch.recorrido = f; ch.u = 0; ch.rapidez = gsap.utils.random(0.7, 1.3);
      ch.sprites.forEach((sp) => sp.material.color.copy(color[f.baja]));
    }, [0.25, 0.9]);
    return juntas({ kill: () => gsap.ticker.remove(tick) }, flujo);
  },

  desmontar(c) { if (c.destruir) c.destruir(); },
};
