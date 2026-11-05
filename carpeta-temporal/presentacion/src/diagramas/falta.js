import * as THREE from "three";
import { gsap } from "gsap";
import { t, img, el, pixel, eventos, juntas } from "../util.js";
import { crearVista, cargando, orbitar } from "../vista3d.js";
import { ENTREGAS } from "../datos.js";
import { crearPersonaje } from "../personaje3d.js";

/*
 * Mapa de niveles en 3D, armado como un nivel de Sokoban con las baldosas de Martín.
 * Cada entrega de la consigna es un cerrojo (tiles/cerrojo_abierto o cerrojo_cerrado) y detrás tiene su muro:
 * lo terminado tiene el muro bajo y el cerrojo brilla; lo pendiente tiene el muro con rejas.
 * El personaje recorre lo hecho y empuja la caja llave hasta el próximo cerrojo: el del dominio.
 */
const FILAS = [3, -1, -5];                       // z de cada fila del mapa (de adelante hacia atrás)
const EPOCA = ["1955", "1985", "2015"];          // cada fila en una época
const PISO = { 1955: "tiles/floor_1955", 1985: "tiles/floor_1985", 2015: "tiles/floor_2015" };
const PARED = { 1955: "tiles/wall_brick", 1985: "tiles/wall_mall", 2015: "tiles/wall_future" };
const BORDE = 10, ALTO_MURO = 0.34, PASO = 0.3;

/** Lugar de cada entrega: fila en zigzag, tres por fila. */
const lugar = (i) => {
  const fila = Math.floor(i / 3), k = i % 3, dir = fila % 2 === 0 ? 1 : -1;
  return { x: (dir > 0 ? [-6, 0, 6] : [6, 0, -6])[k], z: FILAS[fila], dir, fila };
};
const clave = (x, z) => x + "," + z;

function textura(k) {
  const x = new THREE.TextureLoader().load(img(k));
  x.colorSpace = THREE.SRGBColorSpace; x.magFilter = x.minFilter = THREE.NearestFilter; x.generateMipmaps = false;
  return x;
}

/** Píxeles de arte con color (aro dorado, llave) de un cerrojo: se levantan como relieve de cubitos. */
function relieve(k, listo) {
  const im = new Image();
  const malla = new THREE.InstancedMesh(new THREE.BoxGeometry(1 / 32, 1, 1 / 32), new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.25, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0 }), 32 * 32);
  malla.count = 0; malla.castShadow = true; malla.frustumCulled = false;
  let fin = null;
  cargando(new Promise((r) => { fin = r; im.onerror = r; }));
  im.onload = () => {
    fin();
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d"); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, 64, 64).data;
    const m = new THREE.Matrix4(), col = new THREE.Color();
    let n = 0;
    for (let y = 0; y < 64; y += 2) for (let x = 0; x < 64; x += 2) {
      const o = (y * 64 + x) * 4, r = d[o], gg = d[o + 1], b = d[o + 2];
      if (d[o + 3] < 128 || Math.max(r, gg, b) - Math.min(r, gg, b) < 60) continue;
      const llave = gg > r;                       // la llave verde agua del cerrojo abierto sobresale más
      const h = llave && listo ? 0.3 : 0.12;
      m.makeScale(1, h, 1).setPosition((x / 2 - 15.5) / 32, h / 2, (y / 2 - 15.5) / 32);
      malla.setMatrixAt(n, m);
      malla.setColorAt(n, col.setRGB(r / 255, gg / 255, b / 255, THREE.SRGBColorSpace));
      n += 1;
    }
    malla.count = n;
    malla.instanceMatrix.needsUpdate = true;
    if (malla.instanceColor) malla.instanceColor.needsUpdate = true;
  };
  im.src = img(k);
  return malla;
}

function punto() {
  const c = document.createElement("canvas"); c.width = c.height = 32;
  const g = c.getContext("2d"), b = new THREE.Color(t("tinta"));
  const rgba = (a) => `rgba(${Math.round(b.r * 255)},${Math.round(b.g * 255)},${Math.round(b.b * 255)},${a})`;
  const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, rgba(1)); gr.addColorStop(0.35, rgba(0.6)); gr.addColorStop(1, rgba(0));
  g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

export default {
  montar(lienzo) {
    const caja = el("div", "escena3d", lienzo);
    el("div", "falta__velo", lienzo);
    const proximo = ENTREGAS.findIndex((e) => !e.listo);

    // Rótulos de cada nivel, anclados al cerrojo
    const rotulos = ENTREGAS.map((e, i) => {
      const ancla = el("div", "falta__ancla", lienzo);
      const r = el("div", "falta__rotulo" + (e.listo ? " falta__rotulo--listo" : "") + (i === proximo ? " falta__rotulo--proximo" : ""), ancla);
      pixel(e.listo ? "tiles/cerrojo_abierto" : "tiles/cerrojo_cerrado", r, "", "pixel falta__icono");
      const txt = el("div", "falta__texto", r);
      el("b", "", txt, { texto: e.nombre });
      el("span", "falta__estado", txt, { texto: e.listo ? "listo" : i === proximo ? "próximo" : "pendiente" });
      return { ancla, r, ...lugar(i) };
    });

    const vista = crearVista(lienzo, { caja, exposicion: 1.1, aria: "Mapa de niveles: tres cerrojos abiertos y seis cerrados; el personaje empuja la caja llave hasta el cerrojo del dominio" });
    if (!vista) {
      rotulos.forEach((r, i) => { r.ancla.style.transform = `translate(${300 + (i % 3) * 600}px, ${520 + Math.floor(i / 3) * 170}px)`; });
      return { sin3d: true, rotulos, proximo };
    }
    const { W, H, ex, ey } = vista;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(t("fondo-hondo"));
    escena.fog = new THREE.Fog(t("fondo-hondo"), 14, 40);
    const camara = vista.camara(32, 0.1, 120);

    // ── El mapa: pasillos en zigzag con paredes alrededor ──
    const camino = new Map();
    const agregar = (x, z) => camino.set(clave(x, z), { x, z });
    FILAS.forEach((z) => { for (let x = -BORDE; x <= BORDE; x++) agregar(x, z); });
    for (let z = FILAS[1]; z <= FILAS[0]; z++) agregar(BORDE, z);
    for (let z = FILAS[2]; z <= FILAS[1]; z++) agregar(-BORDE, z);
    const epocaDe = (z) => EPOCA[FILAS.map((f) => Math.abs(f - z)).reduce((a, d, i, arr) => (d < arr[a] ? i : a), 0)];
    const orden = (x, z) => { // avance a lo largo del recorrido, para que el nivel se arme en orden
      const f = FILAS.map((ff) => Math.abs(ff - z)).reduce((a, d, i, arr) => (d < arr[a] ? i : a), 0);
      const avance = f % 2 === 0 ? x + BORDE : BORDE - x;
      return (f * 2 * BORDE + avance) / (FILAS.length * 2 * BORDE);
    };
    const nodoEn = new Map(ENTREGAS.map((e, i) => { const l = lugar(i); return [clave(l.x, l.z), i]; }));
    const muroEn = new Map(ENTREGAS.map((e, i) => { const l = lugar(i); return [clave(l.x + l.dir, l.z), i]; }));

    const pisos = {}, paredes = {};
    camino.forEach(({ x, z }) => {
      if (nodoEn.has(clave(x, z)) || muroEn.has(clave(x, z))) return;
      const ep = epocaDe(z);
      (pisos[ep] ||= []).push({ x, z, o: orden(x, z) });
    });
    for (let x = -BORDE - 1; x <= BORDE + 1; x++) for (let z = FILAS[2] - 1; z <= FILAS[0] + 1; z++) {
      if (camino.has(clave(x, z))) continue;
      let vecino = false;
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (camino.has(clave(x + dx, z + dz))) vecino = true;
      if (vecino) (paredes[epocaDe(z)] ||= []).push({ x, z, o: orden(x, z) });
    }
    const tex = {};
    const T = (k) => (tex[k] ||= textura(k));
    const instancias = [];
    const armarInstancias = (lista, geo, mat, alto) => {
      const malla = new THREE.InstancedMesh(geo, mat, lista.length);
      malla.receiveShadow = true; malla.castShadow = alto > 0.1; malla.frustumCulled = false;
      escena.add(malla);
      instancias.push({ malla, lista, alto });
    };
    const geoPiso = new THREE.BoxGeometry(1, 0.2, 1);
    Object.entries(pisos).forEach(([ep, lista]) => armarInstancias(lista, geoPiso, new THREE.MeshStandardMaterial({ map: T(PISO[ep]), roughness: 0.9 }), 0));
    const geoPared = new THREE.BoxGeometry(1, ALTO_MURO, 1);
    Object.entries(paredes).forEach(([ep, lista]) => armarInstancias(lista, geoPared, new THREE.MeshStandardMaterial({ map: T(PARED[ep]), roughness: 0.85 }), ALTO_MURO));
    const mat4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3();
    /** El nivel se arma: cada baldosa sube desde abajo cuando le llega el turno. */
    const armar = (prog) => instancias.forEach(({ malla, lista, alto }) => {
      lista.forEach((b, i) => {
        const k = Math.max(0, Math.min(1, (prog * 1.35 - b.o) / 0.35));
        const r = gsap.parseEase("back.out(1.6)")(k);
        p3.set(b.x, (alto > 0 ? alto / 2 : -0.1) - (1 - r) * 3, b.z);
        q.setFromEuler(e3.set((1 - k) * 0.6, 0, (1 - k) * -0.4));
        s3.setScalar(Math.max(0.001, k));
        malla.setMatrixAt(i, mat4.compose(p3, q, s3));
      });
      malla.instanceMatrix.needsUpdate = true;
    });
    armar(0);

    // ── Niveles: cerrojo en relieve, muro y luz ──
    const colAcento = new THREE.Color(t("acento"));
    const geoMuro = new THREE.BoxGeometry(0.96, 0.72, 0.96);
    const niveles = ENTREGAS.map((e, i) => {
      const l = lugar(i);
      const g = new THREE.Group();
      g.position.set(l.x, 0, l.z);
      escena.add(g);
      const claveTex = e.listo ? "tiles/cerrojo_abierto" : "tiles/cerrojo_cerrado";
      const losa = new THREE.Mesh(geoPiso, [null, null, null, null, null, null].map((_, cara) => new THREE.MeshStandardMaterial({ map: cara === 2 ? T(claveTex) : null, color: cara === 2 ? new THREE.Color(1, 1, 1) : new THREE.Color(t("superficie-2")), roughness: 0.8, emissive: colAcento, emissiveIntensity: 0, emissiveMap: cara === 2 ? T(claveTex) : null })));
      losa.position.y = -0.1; losa.receiveShadow = true;
      g.add(losa);
      const rel = relieve(claveTex, e.listo);
      g.add(rel);
      // Muro del nivel: bajo (abierto) en lo terminado, con rejas en lo pendiente
      const muro = new THREE.Group();
      muro.position.set(l.x + l.dir, 0, l.z);
      escena.add(muro);
      const piso = new THREE.Mesh(geoPiso, new THREE.MeshStandardMaterial({ map: T(e.listo ? "tiles/muro_abierto" : PISO[EPOCA[l.fila]]), roughness: 0.85 }));
      piso.position.y = -0.1; piso.receiveShadow = true;
      muro.add(piso);
      const rejas = new THREE.Mesh(geoMuro, new THREE.MeshStandardMaterial({ map: T("tiles/muro_cerrado"), roughness: 0.6 }));
      rejas.position.y = 0.36; rejas.castShadow = true; rejas.receiveShadow = true;
      muro.add(rejas);
      // Haz de luz y destello de los niveles listos
      const haz = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 7, 24, 1, true), new THREE.MeshBasicMaterial({ color: colAcento.clone().multiplyScalar(1.4), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
      haz.position.y = 3.5;
      g.add(haz);
      const anillo = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.56, 48), new THREE.MeshBasicMaterial({ color: colAcento.clone().multiplyScalar(1.3), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      anillo.rotation.x = -Math.PI / 2; anillo.position.y = 0.03;
      g.add(anillo);
      const luz = new THREE.PointLight(t("acento"), 0, 4.5, 1.6);
      luz.position.y = 0.9;
      g.add(luz);
      return { ...l, e, g, losa, rel, muro, rejas, haz, anillo, luz, o: orden(l.x, l.z), estado: { v: 0 } };
    });
    const aplicarNivel = (n) => {
      const v = n.estado.v;
      n.rel.scale.y = Math.max(0.001, n.e.listo ? 0.25 + v * 0.75 : 1);
      n.rel.material.emissiveIntensity = n.e.listo ? v * 0.9 : 0;
      n.losa.material[2].emissiveIntensity = n.e.listo ? v * 0.22 : 0;
      n.haz.material.opacity = v * 0.16;
      n.luz.intensity = v * 5;
      if (n.e.listo) { n.rejas.position.y = 0.36 - v * 0.74; n.rejas.visible = v < 0.98; }
    };
    niveles.forEach(aplicarNivel);

    // ── Personaje y caja llave ──
    const pj = crearPersonaje(0.78);
    pj.raiz.position.set(-BORDE, 0, FILAS[0]);
    pj.raiz.rotation.y = Math.PI / 2;
    escena.add(pj.raiz);
    const prox = niveles[proximo];
    const llaveIni = { x: BORDE - 1, z: prox.z };
    const llave = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.84, 0.84), new THREE.MeshStandardMaterial({ map: T("boxes/caja_llave"), roughness: 0.6, emissive: colAcento, emissiveIntensity: 0.08, emissiveMap: T("boxes/caja_llave") }));
    llave.position.set(llaveIni.x, 0.42, llaveIni.z);
    llave.castShadow = true;
    escena.add(llave);
    const luzLlave = new THREE.PointLight(t("titulo"), 1.4, 3, 1.5);
    luzLlave.position.set(0, 0.9, 0);
    llave.add(luzLlave);

    // Rastro de luz: lo recorrido (hasta la caja llave) y lo que falta recorrer
    const rastro = (puntos, color, radio, op) => {
      const cp = new THREE.CurvePath();
      for (let i = 0; i < puntos.length - 1; i++) cp.add(new THREE.LineCurve3(new THREE.Vector3(puntos[i][0], 0.025, puntos[i][1]), new THREE.Vector3(puntos[i + 1][0], 0.025, puntos[i + 1][1])));
      const geo = new THREE.TubeGeometry(cp, 400, radio, 6, false);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, toneMapped: false, depthWrite: false });
      const m = new THREE.Mesh(geo, mat);
      m.scale.y = 0.3; m.position.y = 0.014;
      escena.add(m);
      const estado = { p: 0 }, total = geo.index.count;
      return { estado, largo: cp.getLength(), aplicar: () => { m.visible = estado.p > 0.001; geo.setDrawRange(0, Math.floor((total * estado.p) / 6) * 6); } };
    };
    const zA = FILAS[0], zB = FILAS[1];
    const hecho = rastro([[-BORDE, zA], [BORDE, zA], [BORDE, zB], [prox.x + 2, zB]], colAcento.clone().multiplyScalar(1.7), 0.06, 0.9);
    const falta = rastro([[prox.x + 2, zB], [-BORDE, zB], [-BORDE, FILAS[2]], [BORDE, FILAS[2]]], new THREE.Color(t("pendiente")), 0.04, 0.55);
    hecho.aplicar(); falta.aplicar();

    // Luces
    escena.add(new THREE.HemisphereLight(t("superficie-2"), t("fondo-hondo"), 1.6));
    const sol = new THREE.DirectionalLight(t("titulo"), 1.9);
    sol.position.set(-6, 12, 9);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 10, bottom: -10, near: 1, far: 40 });
    sol.shadow.bias = -0.0008;
    escena.add(sol);
    const relleno = new THREE.DirectionalLight(t("exito"), 0.35);
    relleno.position.set(8, 5, -6);
    escena.add(relleno);

    // Chispas que suben de los cerrojos abiertos y polvo en el aire
    const mapaPunto = punto();
    const nCh = 90;
    const chispas = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: colAcento.clone().multiplyScalar(2), map: mapaPunto, size: 0.12, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    const listos = niveles.filter((n) => n.e.listo);
    const semillas = Array.from({ length: nCh }, (_, i) => ({ n: listos[i % Math.max(1, listos.length)], a: Math.random() * 6.28, r: gsap.utils.random(0.1, 0.45), v: gsap.utils.random(0.35, 0.9), f: Math.random() }));
    chispas.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nCh * 3), 3));
    escena.add(chispas);
    const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: t("titulo"), map: mapaPunto, size: 0.06, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
    polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: 1200 }, (_, i) => (i % 3 === 0 ? gsap.utils.random(-14, 14) : i % 3 === 1 ? gsap.utils.random(0.3, 6) : gsap.utils.random(-9, 6))), 3));
    escena.add(polvo);

    // Cámara: objetivo, distancia, inclinación, giro y corrimiento vertical del centro óptico
    const cam = { tx: 0, ty: 0, tz: -1, d: 24, incl: 0.78, giro: 0, oy: 0 };
    const deriva = { x: 0, y: 0 };
    const mira = new THREE.Vector3();
    const ubicarCamara = () => {
      mira.set(cam.tx, cam.ty, cam.tz);
      camara.position.set(cam.tx + cam.d * Math.sin(cam.incl) * Math.sin(cam.giro) + deriva.x, cam.ty + cam.d * Math.cos(cam.incl) + deriva.y, cam.tz + cam.d * Math.sin(cam.incl) * Math.cos(cam.giro));
      camara.lookAt(mira);
      camara.setViewOffset(W, H, 0, -cam.oy, W, H);
      orbitar(camara, mira, vista.orbita);
      escena.fog.near = cam.d * 0.8; escena.fog.far = cam.d * 2.4;
    };

    const v3 = new THREE.Vector3();
    const posChispas = chispas.geometry.attributes.position;
    const actualizar = (seg) => {
      rotulos.forEach((r) => {
        v3.set(r.x, 1.45, r.z).project(camara);
        const x = ((v3.x + 1) / 2) * W - ex, y = ((1 - v3.y) / 2) * H - ey;
        const fuera = v3.z > 1 || x < -200 || x > 2120 || y > 1200;
        // Debajo del título se apaga (nada de texto sobre texto)
        const vis = fuera ? 0 : Math.max(0, Math.min(1, (y - 330) / 70));
        r.ancla.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
        r.ancla.style.opacity = vis.toFixed(3);
      });
      semillas.forEach((s, i) => {
        if (!s.n) return;
        const f = (s.f + seg * s.v * 0.25) % 1;
        posChispas.setXYZ(i, s.n.x + Math.cos(s.a + f * 3) * s.r, 0.1 + f * 2.6, s.n.z + Math.sin(s.a + f * 3) * s.r);
      });
      posChispas.needsUpdate = true;
    };

    ubicarCamara();
    vista.animar({ escena, camara, brillo: [0.7, 0.55, 0.85], orbita: { giro: 0.45, alto: 0.18 }, cada: (seg) => { ubicarCamara(); actualizar(seg); } });

    return {
      cam, deriva, niveles, hecho, falta, aplicarNivel, armar, pj, llave, llaveIni, prox, proximo, rotulos, chispas, polvo,
      destruir: () => { vista.liberarTambien(...Object.values(tex)); vista.destruir(); },
    };
  },

  construir(tl, c) {
    const anclas = c.rotulos.map((r) => r.r);
    tl.set(anclas, { autoAlpha: 0 }, 0);
    if (c.sin3d) {
      tl.to(anclas.slice(0, c.proximo), { autoAlpha: 1, duration: 0.4, stagger: 0.15 }, 0.6);
      tl.addLabel("p1"); tl.to(anclas[c.proximo], { autoAlpha: 1, duration: 0.4 }, "p1");
      tl.addLabel("p2"); tl.to(anclas.slice(c.proximo + 1), { autoAlpha: 1, duration: 0.4, stagger: 0.15 }, "p2");
      return;
    }
    const { cam, pj, niveles } = c;
    const armado = { p: 0 };
    const verRotulo = (i, en) => tl.fromTo(anclas[i], { autoAlpha: 0, y: 16, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.8)", immediateRender: false }, en);
    const mover = (en, dur, v, ease = "power2.inOut") => tl.to(cam, { ...v, duration: dur, ease }, en);
    let giroPj = Math.PI / 2;
    const mirar = (dx, dz, en, dur = 0.15) => {
      let a = Math.atan2(dx, dz);
      while (a - giroPj > Math.PI) a -= Math.PI * 2;
      while (a - giroPj < -Math.PI) a += Math.PI * 2;
      giroPj = a;
      tl.to(pj.raiz.rotation, { y: a, duration: dur, ease: "power2.out" }, en);
    };
    const zancada = { f: 0 };
    /** Camina de baldosa en baldosa por una lista de puntos; devuelve cuándo termina. */
    const caminar = (puntos, en, porBaldosa, correr = false) => {
      let tt = en;
      for (let i = 1; i < puntos.length; i++) {
        const [x0, z0] = puntos[i - 1], [x1, z1] = puntos[i];
        const n = Math.abs(x1 - x0) + Math.abs(z1 - z0);
        mirar(x1 - x0, z1 - z0, tt);
        tl.to(pj.raiz.position, { x: x1, z: z1, duration: n * porBaldosa, ease: "none" }, tt)
          .to(zancada, { f: `+=${n * Math.PI * (correr ? 1.4 : 1)}`, duration: n * porBaldosa, ease: "none", onUpdate: () => pj.correr(zancada.f, correr ? 0.95 : 0.55) }, tt);
        tt += n * porBaldosa;
      }
      tl.to(pj.pose, { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0, duration: 0.2, onUpdate: pj.aplicar }, tt);
      return tt;
    };

    // Entrada: el nivel se arma desde abajo mientras la cámara baja del cielo
    tl.fromTo(armado, { p: 0 }, { p: 1, duration: 2.2, ease: "power1.inOut", onUpdate: () => c.armar(armado.p) }, 0.1)
      .fromTo(cam, { tx: 0, ty: 0, tz: -1, d: 34, incl: 0.25, giro: -0.6, oy: 90 }, { tx: -7, ty: 0, tz: 2.4, d: 11.5, incl: 0.66, giro: -0.4, oy: 70, duration: 2.6, ease: "power3.inOut" }, 0)
      .fromTo(c.chispas.material, { opacity: 0 }, { opacity: 0.9, duration: 1 }, 2.5)
      .fromTo(c.llave.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2)" }, 2.2);
    niveles.forEach((n) => tl.fromTo([n.g.scale, n.muro.scale], { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: "back.out(2)" }, 0.1 + (2.2 * n.o) / 1.35));
    // El personaje corre por lo que ya está hecho: cada cerrojo listo se enciende y su muro baja
    const zA = niveles[0].z;
    const salida = 2.4, porBaldosa = 0.21;
    tl.fromTo(pj.raiz.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 0.78, y: 0.78, z: 0.78, duration: 0.4, ease: "back.out(2)" }, salida - 0.4);
    const llegada = caminar([[-BORDE, zA], [BORDE - 2, zA]], salida, porBaldosa, true);
    const enRastro = (d) => d / c.hecho.largo;
    tl.fromTo(c.hecho.estado, { p: 0 }, { p: enRastro(2 * BORDE - 2), duration: llegada - salida, ease: "none", onUpdate: c.hecho.aplicar }, salida);
    mover(salida, llegada - salida + 0.6, { tx: BORDE - 3.5, tz: 1.5, d: 11.5, incl: 0.68, giro: 0.36, oy: 80 }, "power1.inOut");
    niveles.filter((n) => n.e.listo).forEach((n, i) => {
      const cuando = salida + (n.x - 2 - -BORDE) * porBaldosa;
      tl.fromTo(n.estado, { v: 0 }, { v: 1, duration: 0.55, ease: "power2.out", onUpdate: () => c.aplicarNivel(n) }, cuando)
        .fromTo(n.anillo.scale, { x: 0.3, y: 0.3 }, { x: 2.4, y: 2.4, duration: 0.9, ease: "power2.out" }, cuando)
        .fromTo(n.anillo.material, { opacity: 1 }, { opacity: 0, duration: 0.9, ease: "power1.in" }, cuando);
      verRotulo(i, cuando + 0.15);
    });
    mirar(0, 1, llegada + 0.1, 0.3);
    tl.to(pj.pose, { aplaste: 0.6, duration: 0.1, onUpdate: pj.aplicar }, llegada + 0.35)
      .to(pj.pose, { aplaste: 0, duration: 0.4, ease: "elastic.out(1, 0.4)", onUpdate: pj.aplicar }, llegada + 0.45);
    verRotulo(c.proximo, llegada + 0.3);

    // p1: rodea la pared y empuja la caja llave hasta el cerrojo del dominio
    tl.addLabel("p1");
    let en = tl.labels.p1;
    const zB = c.prox.z;
    const atras = caminar([[BORDE - 2, zA], [BORDE, zA], [BORDE, zB]], en, PASO);
    tl.to(c.hecho.estado, { p: enRastro(2 * BORDE + (zA - zB)), duration: atras - en, ease: "none", onUpdate: c.hecho.aplicar }, en);
    mover(en, atras - en + 0.3, { tx: BORDE - 2, tz: zB + 0.8, d: 9.5, incl: 0.74, giro: 0.85, oy: 50 });
    mirar(-1, 0, atras);
    tl.to(pj.pose, { brazoI: -1.45, brazoD: -1.45, duration: 0.2, onUpdate: pj.aplicar }, atras);
    const empujes = c.llaveIni.x - (c.prox.x + 1);
    for (let i = 0; i < empujes; i++) {
      const p = atras + 0.25 + i * 0.55;
      tl.to([pj.raiz.position, c.llave.position], { x: `-=1`, duration: 0.46, ease: "empuje" }, p)
        .to(zancada, { f: `+=${Math.PI * 2}`, duration: 0.46, ease: "none", onUpdate: () => { pj.pose.piernaI = -Math.sin(zancada.f) * 0.6; pj.pose.piernaD = Math.sin(zancada.f) * 0.6; pj.aplicar(); } }, p);
    }
    const llega = atras + 0.25 + empujes * 0.55;
    tl.to(c.hecho.estado, { p: 1, duration: llega - atras - 0.25, ease: "none", onUpdate: c.hecho.aplicar }, atras + 0.25);
    mover(atras, llega - atras + 0.5, { tx: c.prox.x + 1, tz: zB - 0.3, d: 8.5, incl: 0.74, giro: 0.6, oy: 130 });
    tl.to(pj.pose, { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0, duration: 0.3, onUpdate: pj.aplicar }, llega)
      .fromTo(c.prox.anillo.material, { opacity: 0 }, { opacity: 0.85, duration: 0.4 }, llega)
      .fromTo(c.prox.anillo.scale, { x: 0.6, y: 0.6 }, { x: 1.25, y: 1.25, duration: 0.5, ease: "back.out(2)" }, llega)
      .to(c.llave.material, { emissiveIntensity: 0.22, duration: 0.4 }, llega)
      .fromTo(c.prox.rejas.position, { x: 0 }, { x: 0.05, duration: 0.06, yoyo: true, repeat: 5, ease: "none" }, llega + 0.3)
      .to(c.rotulos[c.proximo].r, { "--marco": 1, duration: 0.4 }, llega);
    mirar(0, 1, llega + 0.6, 0.3);

    // p2: la cámara sube y recorre los cerrojos que faltan
    tl.addLabel("p2");
    en = tl.labels.p2;
    const resto = niveles.slice(c.proximo + 1);
    mover(en, 1.6, { tx: 1, tz: zB + 0.2, d: 16, incl: 0.7, giro: 0.15, oy: 70 });
    resto.forEach((n, i) => {
      const cuando = en + 0.6 + i * 0.75;
      verRotulo(c.proximo + 1 + i, cuando);
      tl.fromTo(n.rel.scale, { y: 1 }, { y: 1.6, duration: 0.12, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, cuando)
        .fromTo(n.rejas.rotation, { y: 0 }, { y: 0.06, duration: 0.06, yoyo: true, repeat: 3, ease: "none", immediateRender: false }, cuando + 0.1);
    });
    mover(en + 1.6, 2.4, { tx: 0, tz: niveles[niveles.length - 1].z + 0.8, d: 17, incl: 0.68, giro: -0.12, oy: 80 });

    // p3: todo el mapa desde arriba
    tl.addLabel("p3");
    en = tl.labels.p3;
    mover(en, 2.2, { tx: 0, ty: 0, tz: -1.2, d: 27.5, incl: 0.6, giro: 0, oy: 150 });
    tl.fromTo(c.falta.estado, { p: 0 }, { p: 1, duration: 2.4, ease: "power1.inOut", onUpdate: c.falta.aplicar }, en + 0.4);
  },

  vida(c) {
    if (c.sin3d) return { kill() {} };
    const tick = (tt) => {
      c.deriva.x = Math.sin(tt * 0.15) * 0.25; c.deriva.y = Math.sin(tt * 0.21 + 1.3) * 0.15;
      c.polvo.rotation.y = tt * 0.012;
      c.niveles.forEach((n, i) => { if (n.e.listo && n.estado.v > 0.9) n.haz.material.opacity = 0.13 + Math.sin(tt * (1.1 + i * 0.37) + i) * 0.04; });
      const a = c.prox.anillo;
      if (a.material.opacity > 0.1) a.scale.setScalar(1.2 + Math.sin(tt * 2.2) * 0.08);
    };
    gsap.ticker.add(tick);
    // El personaje mira a un lado y al otro; a veces salta en el lugar
    const mira = eventos(() => gsap.to(c.pj.cabeza.rotation, { y: gsap.utils.random(-0.5, 0.5), duration: gsap.utils.random(0.4, 0.9), ease: "sine.inOut" }), [1.2, 3.2]);
    const salto = eventos(() => {
      const p = c.pj;
      gsap.timeline()
        .to(p.pose, { aplaste: 0.5, duration: 0.1, onUpdate: p.aplicar })
        .to(p.pose, { aplaste: -0.3, duration: 0.1, onUpdate: p.aplicar })
        .to(p.raiz.position, { y: 0.35, duration: 0.2, ease: "power2.out" }, "<")
        .to(p.raiz.position, { y: 0, duration: 0.2, ease: "power2.in" })
        .to(p.pose, { aplaste: 0.6, duration: 0.07, onUpdate: p.aplicar })
        .to(p.pose, { aplaste: 0, duration: 0.35, ease: "elastic.out(1, 0.4)", onUpdate: p.aplicar });
    }, [4, 8]);
    // Un cerrojo pendiente al azar tironea su reja
    const reja = eventos(() => {
      const n = gsap.utils.random(c.niveles.filter((x) => !x.e.listo));
      gsap.fromTo(n.rejas.position, { x: 0 }, { x: 0.04, duration: 0.05, yoyo: true, repeat: 3, ease: "none" });
    }, [1.5, 3.8]);
    return juntas({ kill: () => gsap.ticker.remove(tick) }, mira, salto, reja);
  },

  desmontar(c) { if (c.destruir) c.destruir(); },
};
