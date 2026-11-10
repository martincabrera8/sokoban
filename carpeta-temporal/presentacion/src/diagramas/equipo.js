import * as THREE from "three";
import { gsap } from "gsap";
import { el, s, t, eventos, juntas } from "../util.js";
import { PARTES } from "../datos.js";
import { crearPersonaje } from "../personaje3d.js";
import { escena3d, crearBrote, texturaPunto, texturaHaz, cajaDosCaras, enInstancias } from "./tablero.js";

/*
 * Cinco cajas, cinco destinos. Un nivel de Sokoban en 3D con las baldosas reales de 1985: cada fila es una parte del trabajo.
 * El personaje del juego empuja las tres primeras cajas hasta su destino y cada una estalla en luz.
 * Las dos últimas (dominio y sonido) empiezan como hologramas, se materializan cuando llegan al repo y también se empujan.
 */
const NIVEL = [
  "########",
  "#  $  .#",
  "#  $  .#",
  "#  $  .#",
  "#  h  .#",
  "#  h  .#",
  "########",
];
const COLS = NIVEL[0].length, FILAS = NIVEL.length;
const X_CAJA = 3, X_META = 6, X_INICIO = 2, ALTO_PARED = 0.5;
const GIRO = { arriba: Math.PI, abajo: 0, izquierda: -Math.PI / 2, derecha: Math.PI / 2 };
const P = (x, z, y = 0) => new THREE.Vector3(x - COLS / 2 + 0.5, y, z - FILAS / 2 + 0.5);
const ROTULO = { x: 1268, y: 360, paso: 124 };

/** Cámara en órbita alrededor de un punto: az gira, el sube, d aleja. */
const PLANOS = {
  cenital: { tx: 0.4, tz: 0.6, az: 0, el: 1.5, d: 24 },
  amplio: { tx: 1, tz: 0.5, az: -0.12, el: 0.95, d: 16.4 },
  fila: (z, i) => ({ tx: 1, tz: 0.5 + P(0, z).z * 0.22, az: -0.2 + i * 0.06, el: 0.93, d: 15.4 }),
  recientes: { tx: 0.7, tz: 1.1, az: -0.26, el: 0.88, d: 15 },
  final: { tx: 1, tz: 0.45, az: -0.07, el: 0.97, d: 16.6 },
};
/* Corre el dibujo a la izquierda y abajo, sin cambiar la perspectiva. Con estas distancias el tablero entero
   (paredes incluidas) queda dentro de la pantalla, entre la bajada y el borde de abajo. */
const ENCUADRE = { x: 250, y: 165 };

function rotulo(lienzo, parte, i, totalImagenes) {
  const r = el("div", "equipo__parte pos" + (parte.recien ? " equipo__parte--reciente" : ""), lienzo, { vars: { x: ROTULO.x, y: ROTULO.y + i * ROTULO.paso } });
  const cabeza = el("div", "equipo__cabeza", r);
  el("span", "equipo__nombre", cabeza, { texto: parte.nombre });
  const estados = el("span", "equipo__estados", cabeza);
  const antes = el("span", "equipo__estado", estados, { texto: parte.recien ? "recién subida" : "en camino" });
  const listo = el("span", "equipo__estado equipo__estado--listo", estados, { texto: "en su destino" });
  gsap.set(listo, { autoAlpha: 0 });
  const detalle = totalImagenes ? parte.detalle.replace(/\d+ imágenes/, totalImagenes + " imágenes") : parte.detalle;
  const p = el("p", "equipo__detalle", r);
  el("b", "", p, { texto: parte.quien });
  p.append(": " + detalle);
  return { r, antes, listo };
}

/** Rayas horizontales de holograma (se usan como transparencia). */
function texturaRayas() {
  const c = document.createElement("canvas"); c.width = 4; c.height = 64;
  const g = c.getContext("2d");
  const datos = g.createImageData(4, 64);
  for (let i = 0; i < datos.data.length; i++) { const y = Math.floor(i / 16); datos.data[i] = y % 4 < 2 ? (y % 8 < 4 ? 255 : 150) : 25; }
  g.putImageData(datos, 0, 0);
  const x = new THREE.CanvasTexture(c);
  x.magFilter = THREE.NearestFilter;
  return x;
}

/** Degradé horizontal (transparente al inicio, opaco al final) para la estela de cada caja. */
function texturaDegrade() {
  const c = document.createElement("canvas"); c.width = 64; c.height = 8;
  const g = c.getContext("2d"), datos = g.createImageData(64, 8);
  for (let i = 0; i < datos.data.length; i += 4) {
    const x = (i / 4) % 64, y = Math.floor(i / 256), borde = 1 - Math.abs(y - 3.5) / 4;
    datos.data.fill(Math.round(255 * Math.pow(x / 63, 1.6) * borde), i, i + 4);
  }
  g.putImageData(datos, 0, 0);
  return new THREE.CanvasTexture(c);
}

export default {
  montar(lienzo) {
    const total = Object.values(window.INVENTARIO || {}).reduce((a, l) => a + l.length, 0);
    const k = escena3d(lienzo, { aria: "Nivel de Sokoban en 3D: el personaje empuja cinco cajas, una por parte del trabajo, hasta su destino; las dos últimas aparecen como hologramas y se materializan" });
    el("div", "equipo__velo", lienzo);
    const svg = s("svg", { class: "svg equipo__lineas", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    const partes = PARTES.map((p, i) => ({ ...rotulo(lienzo, p, i, total), parte: p, z: i + 1 }));
    const marcador = el("div", "equipo__marcador pos", lienzo, { vars: { x: ROTULO.x, y: 168 } });
    const cifra = el("p", "cifra equipo__cifra", marcador);
    const numero = el("span", "", cifra, { texto: "0" });
    el("span", "equipo__de", cifra, { texto: " de " + PARTES.length });
    el("span", "cifra__unidad", marcador, { texto: "partes en su destino" });
    const cuenta = { n: 0, numero };
    const globo = el("p", "equipo__globo pos", lienzo, { texto: "Llegaron al repo el 9/11" });
    gsap.set(globo, { autoAlpha: 0, xPercent: -50, yPercent: -100 });
    partes.forEach((p) => {
      p.linea = s("path", { class: "equipo__linea" }, svg);
      p.punto = s("circle", { class: "equipo__punto", r: 6 }, svg);
      p.trazo = { v: 0 };
    });
    if (!k) return { sin3d: true, partes, marcador, cuenta, globo };

    const { escena, tex, camara } = k;
    const mat = {};
    const estandar = (clave, extra = {}) => (mat[clave] ||= new THREE.MeshStandardMaterial({ map: tex(clave), roughness: 0.9, metalness: 0, ...extra }));
    const tablero = new THREE.Group();
    escena.add(tablero);

    // Base del diorama y su resplandor de abajo
    const base = new THREE.Mesh(new THREE.BoxGeometry(COLS + 0.4, 0.7, FILAS + 0.4), new THREE.MeshStandardMaterial({ color: t("superficie"), roughness: 0.55, metalness: 0.2 }));
    base.position.y = -0.36; base.receiveShadow = true;
    tablero.add(base);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(COLS * 2.4, FILAS * 2.6), new THREE.MeshBasicMaterial({ map: texturaPunto("linea"), transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = -0.9;
    escena.add(halo);

    // Pared baja: arriba la baldosa real (como se ve en el juego), a los costados la misma, en sombra
    const lado = new THREE.MeshStandardMaterial({ map: tex("tiles/wall_mall"), color: t("tinta-3"), roughness: 0.9 });
    const matPared = [lado, estandar("tiles/wall_mall")];
    const geoPiso = new THREE.PlaneGeometry(1, 1), geoPared = cajaDosCaras(1, ALTO_PARED, 1, 2), geoCaja = new THREE.BoxGeometry(0.84, 0.84, 0.84);
    const pisos = [], paredes = [], metas = [];
    NIVEL.forEach((linea, z) => [...linea].forEach((c, x) => {
      const p = P(x, z);
      if (c === "#") {
        const m = new THREE.Object3D(); // va en instancias: un dibujo para todas las paredes
        m.position.set(p.x, ALTO_PARED / 2, p.z);
        m.userData.d = Math.hypot(x - X_INICIO, z - 1);
        paredes.push(m);
        return;
      }
      const destino = c === ".";
      const m = destino ? new THREE.Mesh(geoPiso, new THREE.MeshStandardMaterial({ map: tex("goals/goal"), roughness: 0.6, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0 })) : new THREE.Object3D();
      m.rotation.x = -Math.PI / 2; m.position.copy(p); m.receiveShadow = true;
      m.userData.d = Math.hypot(x - X_INICIO, z - 1);
      if (destino) { tablero.add(m); metas.push(m); }
      pisos.push(m);
    }));
    const sincParedes = enInstancias(tablero, geoPared, matPared, paredes);
    const sincPisos = enInstancias(tablero, geoPiso, estandar("tiles/floor_1985"), pisos.filter((m) => !m.isMesh), { sombra: false });

    // Cajas de madera; las recién llegadas empiezan como hologramas que después se materializan
    const geoGuion = new THREE.PlaneGeometry(0.16, 0.05), geoEstela = new THREE.PlaneGeometry(1, 0.6).translate(0.5, 0, 0);
    const haz = texturaHaz(), chispa = texturaPunto("tinta"), brilloPendiente = texturaPunto("pendiente"), rayas = texturaRayas(), degrade = texturaDegrade();
    partes.forEach((p, i) => {
      const inicio = P(X_CAJA, p.z, 0.42), meta = P(X_META, p.z);
      p.meta = metas[i];
      {
        p.caja = new THREE.Mesh(geoCaja, new THREE.MeshStandardMaterial({ map: tex("boxes/box_wood"), roughness: 0.75, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0 }));
        p.caja.castShadow = true; p.caja.receiveShadow = true;
        p.caja.position.copy(inicio);
        tablero.add(p.caja);
        // Estela: la baldosa recorrida queda encendida, como una barra de avance
        p.estela = new THREE.Mesh(geoEstela, new THREE.MeshBasicMaterial({ color: t("acento"), alphaMap: degrade, transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending, depthWrite: false }));
        p.estela.rotation.x = -Math.PI / 2; p.estela.position.copy(inicio).setY(0.012); p.estela.scale.x = 0.001;
        p.x0 = inicio.x;
        tablero.add(p.estela);
        // Luz de llegada: haz vertical, onda en el piso, anillo que sube, chispas y una luz puntual
        p.luz = new THREE.PointLight(t("acento"), 0, 4.5, 1.4);
        p.luz.position.copy(meta).setY(1.9);
        p.haz = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.36, 4.2, 32, 1, true), new THREE.MeshBasicMaterial({ map: haz, color: t("acento"), transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        p.haz.geometry.translate(0, 2.1, 0);
        p.haz.position.copy(meta); p.haz.scale.y = 0.001;
        p.onda = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.55, 96), new THREE.MeshBasicMaterial({ color: t("acento"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        p.onda.rotation.x = -Math.PI / 2; p.onda.position.copy(meta).setY(0.03);
        p.aro = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 8, 48), new THREE.MeshBasicMaterial({ color: t("titulo"), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        p.aro.rotation.x = -Math.PI / 2; p.aro.position.copy(meta);
        p.brote = crearBrote(escena, { n: 160, token: "acento", tam: 0.13, fuerza: 2.2, alto: 5, mapa: chispa });
        p.brote.origen.copy(meta).setY(0.9);
        escena.add(p.luz, p.haz, p.onda, p.aro);
      }
      if (p.parte.recien) {
        const holo = new THREE.Group();
        holo.position.copy(inicio);
        p.x0 = inicio.x;
        const cuerpo = new THREE.Mesh(geoCaja, new THREE.MeshBasicMaterial({ alphaMap: rayas, color: t("pendiente"), transparent: true, opacity: 0.34, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        const aristas = new THREE.LineSegments(new THREE.EdgesGeometry(geoCaja), new THREE.LineBasicMaterial({ color: t("titulo"), transparent: true, opacity: 0.95 }));
        const barrido = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ color: t("pendiente"), transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
        barrido.rotation.x = -Math.PI / 2;
        holo.add(cuerpo, aristas, barrido);
        tablero.add(holo);
        // Proyector en el piso y un camino punteado hasta su destino, que está reservado
        const proyector = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: brilloPendiente, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
        proyector.rotation.x = -Math.PI / 2; proyector.position.copy(inicio).setY(0.02);
        tablero.add(proyector);
        const huella = Array.from({ length: 9 }, (_, j) => {
          const d = new THREE.Mesh(geoGuion, new THREE.MeshBasicMaterial({ color: t("pendiente"), transparent: true, opacity: 0.55, depthWrite: false }));
          d.rotation.x = -Math.PI / 2; d.position.copy(P(X_CAJA + 0.62 + j * 0.3, p.z, 0.015));
          tablero.add(d);
          return d;
        });
        const reserva = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(0.86, 0.86, 0.86)), new THREE.LineDashedMaterial({ color: t("pendiente"), dashSize: 0.09, gapSize: 0.07, transparent: true, opacity: 0.9 }));
        reserva.computeLineDistances();
        reserva.position.copy(meta).setY(0.43);
        tablero.add(reserva);
        p.blanco = p.meta.material.color.clone();
        p.reservado = new THREE.Color(t("superficie-2"));
        p.meta.material.color.copy(p.reservado);
        p.flash = new THREE.PointLight(t("titulo"), 0, 5, 1.4);
        p.flash.position.copy(inicio).setY(1.2);
        escena.add(p.flash);
        Object.assign(p, { holo, cuerpo, aristas, barrido, proyector, huella, reserva });
      }
    });

    const pj = crearPersonaje(0.8);
    pj.raiz.position.copy(P(X_INICIO, 1));
    pj.raiz.rotation.y = GIRO.derecha;
    tablero.add(pj.raiz);

    // Luces
    escena.add(new THREE.HemisphereLight(t("superficie-2"), t("fondo-hondo"), 1.5));
    const sol = new THREE.DirectionalLight(t("titulo"), 2.3);
    sol.position.set(-6, 11, 7); sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -7, right: 7, top: 6, bottom: -6, near: 1, far: 34 });
    sol.shadow.bias = -0.0006;
    const contra = new THREE.DirectionalLight(t("linea"), 0.9);
    contra.position.set(7, 5, -9);
    escena.add(sol, contra);

    // Polvo en el aire
    const nPolvo = 260;
    const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: t("titulo"), map: chispa, size: 0.07, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: nPolvo * 3 }, (_, i) => (i % 3 === 0 ? gsap.utils.random(-7, 7) : i % 3 === 1 ? gsap.utils.random(0.2, 6) : gsap.utils.random(-5, 5))), 3));
    escena.add(polvo);

    // Cámara y rótulos que siguen a las cajas
    const cam = { ...PLANOS.amplio, ty: 0, sacudon: 0, dx: 0, dy: 0 };
    const mira = new THREE.Vector3(), ancla = new THREE.Vector3();
    k.antes = () => {
      sincParedes(); sincPisos();
      const tiempo = performance.now() / 1000;
      const sx = cam.sacudon ? Math.sin(tiempo * 61) * cam.sacudon * 0.07 : 0, sy = cam.sacudon ? Math.cos(tiempo * 53) * cam.sacudon * 0.05 : 0;
      const ce = Math.cos(cam.el);
      mira.set(cam.tx, cam.ty, cam.tz);
      camara.position.set(cam.tx + cam.d * ce * Math.sin(cam.az) + cam.dx + sx, cam.d * Math.sin(cam.el) + cam.dy + sy, cam.tz + cam.d * ce * Math.cos(cam.az));
      camara.lookAt(mira);
      camara.setViewOffset(k.W, k.H, ENCUADRE.x, -ENCUADRE.y, k.W, k.H);
      k.orbitar(mira);
      camara.updateMatrixWorld();
      partes.forEach((p) => {
        if (p.estela) p.estela.scale.x = Math.max(0.001, p.caja.position.x - p.x0);
        p.caja.getWorldPosition(ancla);
        ancla.y += 0.5;
        const b = k.proyectar(ancla);
        if (p.alto === undefined) p.alto = p.r.offsetHeight || 80;
        const lx = ROTULO.x - 22, ly = parseFloat(p.r.style.getPropertyValue("--y")) + 26;
        const v = p.trazo.v, ex = lx + (b.x - lx) * v, ey = ly + (b.y - ly) * v;
        const codo = lx - 46;
        p.linea.setAttribute("d", v <= 0 ? "M0,0" : `M${lx},${ly} L${codo + (lx - codo) * (1 - Math.min(1, v * 3))},${ly} L${ex},${ey}`);
        p.punto.setAttribute("cx", ex); p.punto.setAttribute("cy", ey);
        p.punto.style.opacity = v > 0.98 ? 1 : 0;
      });
      const holo = partes.find((p) => p.holo).holo;
      holo.getWorldPosition(ancla);
      ancla.y += 1.15;
      const g = k.proyectar(ancla);
      globo.style.setProperty("--x", g.x + "px"); globo.style.setProperty("--y", g.y + "px");
    };
    k.arrancar();

    return { k, cam, partes, pisos, paredes, pj, base, halo, polvo, marcador, cuenta, globo };
  },

  construir(tl, c) {
    const { partes } = c;
    const rotulos = partes.map((p) => p.r);
    if (c.sin3d) {
      tl.fromTo(rotulos, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: 0.5, stagger: 0.1 }, 0.4);
      partes.forEach((p, i) => { if (p.listo) tl.addLabel("p" + (i + 1)).to(p.antes, { autoAlpha: 0, duration: 0.3 }).fromTo(p.listo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }).to(p.r, { "--luz": 1, duration: 0.4 }, "<"); });
      return;
    }
    const { cam, pj, pisos, paredes } = c;
    const andar = { f: 0 };
    const plano = (en, destino, dur = 1.4, ease = "power2.inOut") => tl.to(cam, { ...destino, duration: dur, ease }, en);
    const pose = (en, valores, dur = 0.18, ease = "power2.out") => tl.to(pj.pose, { ...valores, duration: dur, ease, onUpdate: pj.aplicar }, en);
    const girar = (en, dir) => tl.to(pj.raiz.rotation, { y: GIRO[dir], duration: 0.16, ease: "power1.out" }, en);
    /** Camina en línea recta hasta la celda (x, z): 0.24 s por baldosa, con piernas y brazos. */
    const caminar = (en, x, z, dir, baldosas) => {
      const dur = baldosas * 0.24, destino = P(x, z);
      girar(en, dir);
      tl.to(pj.raiz.position, { x: destino.x, z: destino.z, duration: dur, ease: "none" }, en)
        .to(andar, { f: `+=${baldosas * Math.PI * 1.6}`, duration: dur, ease: "none", onUpdate: () => pj.correr(andar.f, 0.55) }, en);
      pose(en + dur, { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0 }, 0.1);
      return en + dur;
    };
    /** Empuja la caja n baldosas a la derecha, con los brazos adelante. */
    const empujar = (en, caja, n) => {
      girar(en, "derecha");
      pose(en, { brazoI: -1.45, brazoD: -1.45 }, 0.18);
      for (let i = 0; i < n; i++) {
        const p = en + 0.2 + i * 0.48;
        tl.to([pj.raiz.position, caja.position], { x: "+=1", duration: 0.42, ease: "empuje" }, p)
          .to(andar, { f: `+=${Math.PI * 2}`, duration: 0.42, ease: "none", onUpdate: () => { pj.pose.piernaI = -Math.sin(andar.f) * 0.6; pj.pose.piernaD = Math.sin(andar.f) * 0.6; pj.aplicar(); } }, p);
      }
      const llega = en + 0.2 + (n - 1) * 0.48 + 0.42;
      pose(llega, { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0 }, 0.25);
      return llega;
    };
    /** La caja llega: estalla en luz y su rótulo pasa a "en su destino". */
    const estallar = (en, p) => {
      tl.fromTo(p.caja.material, { emissiveIntensity: 0 }, { immediateRender: false, emissiveIntensity: 1.6, duration: 0.12, ease: "power2.out" }, en)
        .to(p.caja.material, { emissiveIntensity: 0.12, duration: 1.2, ease: "power2.out" }, en + 0.12)
        .fromTo(p.meta.material, { emissiveIntensity: 0 }, { immediateRender: false, emissiveIntensity: 1, duration: 0.25 }, en)
        .fromTo(p.caja.scale, { x: 1, y: 1, z: 1 }, { immediateRender: false, x: 1.12, y: 0.82, z: 1.12, duration: 0.09, yoyo: true, repeat: 1, ease: "power2.out" }, en)
        .fromTo(p.luz, { intensity: 0 }, { immediateRender: false, intensity: 16, duration: 0.12 }, en)
        .to(p.luz, { intensity: 1.6, duration: 1.4, ease: "power2.out" }, en + 0.12)
        .fromTo(p.haz.scale, { y: 0.001 }, { immediateRender: false, y: 1, duration: 0.5, ease: "expo.out" }, en)
        .fromTo(p.haz.material, { opacity: 0 }, { immediateRender: false, opacity: 0.95, duration: 0.1 }, en)
        .to(p.haz.material, { opacity: 0.16, duration: 1.6, ease: "power2.out" }, en + 0.25)
        .fromTo(p.onda.scale, { x: 0.3, y: 0.3 }, { immediateRender: false, x: 5.5, y: 5.5, duration: 1.1, ease: "power2.out" }, en)
        .fromTo(p.onda.material, { opacity: 0.8 }, { immediateRender: false, opacity: 0, duration: 1.1, ease: "power2.out" }, en)
        .fromTo(p.aro.position, { y: 0.1 }, { immediateRender: false, y: 2.6, duration: 1.3, ease: "power2.out" }, en)
        .fromTo(p.aro.scale, { x: 1, y: 1, z: 1 }, { immediateRender: false, x: 1.5, y: 1.5, z: 1.5, duration: 1.3, ease: "power2.out" }, en)
        .fromTo(p.aro.material, { opacity: 1 }, { immediateRender: false, opacity: 0, duration: 1.3, ease: "power1.in" }, en)
        .fromTo({ v: 0 }, { v: 0 }, { immediateRender: false, v: 1, duration: 1.7, ease: "power1.out", onUpdate() { p.brote.aplicar(this.targets()[0].v); } }, en)
        .fromTo(c.cam, { sacudon: 1 }, { immediateRender: false, sacudon: 0, duration: 0.5, ease: "power2.out" }, en)
        .to(p.antes, { autoAlpha: 0, duration: 0.2 }, en)
        .fromTo(p.listo, { autoAlpha: 0, scale: 1.6 }, { immediateRender: false, autoAlpha: 1, scale: 1, duration: 0.45, ease: "back.out(2.4)" }, en + 0.05)
        .fromTo(p.r, { "--luz": 0 }, { immediateRender: false, "--luz": 1, duration: 0.5, ease: "power2.out" }, en)
        .fromTo(p.r, { "--destello": 1 }, { immediateRender: false, "--destello": 0, duration: 1.2, ease: "power2.out" }, en)
        .to(c.cuenta, { n: "+=1", duration: 0.25, ease: "none", onUpdate: () => { c.cuenta.numero.textContent = Math.round(c.cuenta.n); } }, en + 0.05)
        .fromTo(c.cuenta.numero, { scale: 1.5, color: t("titulo") }, { immediateRender: false, scale: 1, color: t("acento"), duration: 0.6, ease: "back.out(2)" }, en + 0.05);
    };

    // Entrada: la cámara baja desde arriba mientras se arma el nivel baldosa por baldosa
    tl.fromTo(cam, { ...PLANOS.cenital }, { ...PLANOS.amplio, duration: 3, ease: "power3.inOut" }, 0)
      .fromTo(c.base.scale, { x: 0.001, z: 0.001 }, { x: 1, z: 1, duration: 0.8, ease: "expo.out" }, 0.2)
      .fromTo(c.halo.material, { opacity: 0 }, { opacity: 0.16, duration: 1.2 }, 0.2);
    tl.fromTo(pisos.map((m) => m.scale), { x: 0.001, y: 0.001 }, { x: 1, y: 1, duration: 0.4, ease: "back.out(2)", stagger: (i) => pisos[i].userData.d * 0.07 }, 0.5)
      .fromTo(pisos.map((m) => m.position), { y: -0.5 }, { y: 0, duration: 0.4, ease: "power2.out", stagger: (i) => pisos[i].userData.d * 0.07 }, 0.5)
      .fromTo(paredes.map((m) => m.scale), { y: 0.001 }, { y: 1, duration: 0.5, ease: "back.out(1.8)", stagger: (i) => paredes[i].userData.d * 0.06 }, 0.8)
      .fromTo(paredes.map((m) => m.position), { y: 0 }, { y: ALTO_PARED / 2, duration: 0.5, ease: "back.out(1.8)", stagger: (i) => paredes[i].userData.d * 0.06 }, 0.8);
    const viejas = partes.filter((p) => !p.parte.recien), recientes = partes.filter((p) => p.parte.recien);
    tl.fromTo(viejas.map((p) => p.meta.material), { emissiveIntensity: 0 }, { emissiveIntensity: 0.55, duration: 0.25, yoyo: true, repeat: 1, stagger: 0.1 }, 1.6);
    partes.forEach((p, i) => {
      const en = 1.7 + i * 0.13;
      if (!p.parte.recien) {
        tl.fromTo(p.caja.position, { y: 6 }, { y: 0.42, duration: 0.7, ease: "bounce.out" }, en)
          .fromTo(p.caja.rotation, { y: gsap.utils.random(-1.2, 1.2) }, { y: 0, duration: 0.7, ease: "power2.out" }, en);
      } else {
        tl.set(p.caja.scale, { x: 0.001, y: 0.001, z: 0.001 }, 0)
          .set(p.holo.scale, { x: 1, z: 1 }, 0)
          .fromTo([p.cuerpo.material, p.aristas.material], { opacity: 0 }, { keyframes: [{ opacity: 0.8, duration: 0.06 }, { opacity: 0.1, duration: 0.08 }, { opacity: 0.6, duration: 0.05 }, { opacity: 0, duration: 0.1 }, { opacity: (j) => (j === 0 ? 0.34 : 0.95), duration: 0.2 }] }, en + 0.3)
          .fromTo(p.holo.scale, { y: 0.001 }, { y: 1, duration: 0.45, ease: "expo.out" }, en + 0.3)
          .fromTo([p.proyector.material, p.reserva.material, ...p.huella.map((h) => h.material)], { opacity: 0 }, { opacity: (j, m) => (m === p.reserva.material ? 0.9 : 0.55), duration: 0.4 }, en + 0.4);
      }
    });
    tl.fromTo(pj.raiz.position, { y: 5 }, { y: 0, duration: 0.45, ease: "power2.in" }, 2.35);
    pose(2.8, { aplaste: 1 }, 0.07);
    pose(2.87, { aplaste: 0 }, 0.45, "elastic.out(1, 0.4)");
    tl.fromTo(rotulos, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out", stagger: 0.09 }, 2.0)
      .fromTo(partes.map((p) => p.trazo), { v: 0 }, { v: 1, duration: 0.7, ease: "power2.inOut", stagger: 0.09 }, 2.3);
    tl.fromTo(c.marcador, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 2.0);

    /** El personaje va hasta la fila de la caja (si no está ahí), la empuja hasta su destino y estalla en luz. */
    const llevar = (p, t0, primera) => {
      let en = t0;
      if (!primera) {
        en = caminar(en, X_INICIO, p.z - 1, "izquierda", X_META - 1 - X_INICIO);
        en = caminar(en, X_INICIO, p.z, "abajo", 1);
      }
      tl.to(p.r, { "--activo": 1, duration: 0.3 }, t0);
      const llega = empujar(en + 0.05, p.caja, X_META - X_CAJA);
      estallar(llega, p);
      tl.to(p.r, { "--activo": 0, duration: 0.4 }, llega + 0.9);
      return llega + 1.2;
    };

    // Un paso por cada una de las tres primeras cajas
    let t0 = 3.6;
    viejas.forEach((p, i) => {
      tl.addLabel("p" + (i + 1), t0);
      plano(t0, PLANOS.fila(p.z, i), 1.3);
      t0 = llevar(p, t0, i === 0);
    });

    // Las recién llegadas: los hologramas se materializan en cajas de madera
    tl.addLabel("p" + (viejas.length + 1), t0);
    plano(t0, PLANOS.recientes, 1.5);
    recientes.forEach((p, i) => {
      const en = t0 + 0.4 + i * 0.25;
      const color = { v: 0 };
      tl.to([p.cuerpo.material, p.aristas.material], { keyframes: [{ opacity: 1, duration: 0.18 }, { opacity: 0.2, duration: 0.06 }, { opacity: 1, duration: 0.06 }, { opacity: 0, duration: 0.3 }] }, en)
        .to(p.holo.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.3, ease: "power2.in" }, en + 0.1)
        .to(p.holo.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.2 }, en + 0.42)
        .to([p.proyector.material, p.reserva.material, ...p.huella.map((h) => h.material)], { opacity: 0, duration: 0.4 }, en + 0.3)
        .fromTo(p.caja.scale, { x: 0.001, y: 0.001, z: 0.001 }, { immediateRender: false, x: 1, y: 1, z: 1, duration: 0.55, ease: "back.out(2.2)" }, en + 0.35)
        .fromTo(p.caja.material, { emissiveIntensity: 0 }, { immediateRender: false, keyframes: [{ emissiveIntensity: 1.8, duration: 0.12 }, { emissiveIntensity: 0, duration: 0.9 }] }, en + 0.35)
        .fromTo(p.flash, { intensity: 0 }, { immediateRender: false, keyframes: [{ intensity: 22, duration: 0.1 }, { intensity: 0, duration: 0.9 }] }, en + 0.35)
        .fromTo(color, { v: 0 }, { immediateRender: false, v: 1, duration: 0.6, onUpdate: () => p.meta.material.color.copy(p.reservado).lerp(p.blanco, color.v) }, en + 0.4)
        .fromTo(p.r, { "--destello": 1 }, { immediateRender: false, "--destello": 0, duration: 1, ease: "power2.out" }, en + 0.35);
    });
    tl.fromTo(c.globo, { autoAlpha: 0, scale: 0.6, yPercent: -70 }, { autoAlpha: 1, scale: 1, yPercent: -100, duration: 0.35, ease: "back.out(2.5)" }, t0 + 0.9)
      .to(c.globo, { autoAlpha: 0, yPercent: -140, duration: 0.4, ease: "power2.in" }, t0 + 3.2);
    t0 = llevar(recientes[0], t0 + 1.6, false);
    tl.addLabel("p" + (viejas.length + 2), t0);
    t0 = llevar(recientes[1], t0, false);
    girar(t0 - 0.6, "abajo");
    plano(t0 - 0.6, PLANOS.final, 1.8);
  },

  vida(c) {
    if (c.sin3d) return { kill() {} };
    const listas = c.partes;
    const pos = c.polvo.geometry.attributes.position;
    const tick = (tt) => {
      c.cam.dx = Math.sin(tt * 0.13) * 0.45;
      c.cam.dy = Math.sin(tt * 0.19 + 1.3) * 0.25;
      listas.forEach((p, i) => {
        if (p.haz.scale.y > 0.5) p.haz.material.opacity = 0.15 + Math.sin(tt * (0.9 + i * 0.23) + i * 2) * 0.05;
      });
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) + 0.004;
        if (y > 6) y = 0.2;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
      c.pj.cabeza.rotation.y = Math.sin(tt * 0.45) * 0.35;
    };
    gsap.ticker.add(tick);
    // Cada tanto sube una chispa de luz desde una caja en su destino
    const respiro = eventos(() => {
      const p = gsap.utils.random(listas);
      if (p.haz.scale.y < 0.5) return;
      gsap.fromTo(p.luz, { intensity: 1.6 }, { intensity: 4, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" });
    }, [1.5, 3.5]);
    return juntas({ kill: () => gsap.ticker.remove(tick) }, respiro);
  },

  desmontar(c) { if (c.k) c.k.destruir(); },
};
