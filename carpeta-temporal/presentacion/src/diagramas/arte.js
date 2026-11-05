import * as THREE from "three";
import { gsap } from "gsap";
import { el, t, img, eventos, juntas } from "../util.js";
import { USADAS, ESTANTES } from "../datos.js";
import { crearPersonaje } from "../personaje3d.js";
import { escena3d, texturaPunto, cajaDosCaras } from "./tablero.js";
import { cargando } from "../vista3d.js";

/*
 * El arte de Martín en 3D. Las imágenes de assets/ llueven y se apilan por carpeta: cada pila es un gráfico de unidades
 * (una carta, una imagen). Después las pilas estallan en un depósito donde se ve cada imagen y se encienden las 28
 * que el juego usa. Al final esas 28 vuelan y arman un nivel del juego: con 28 imágenes alcanza para todo el tablero.
 */
const ANCHO = { characters: 2, boxes: 2, goals: 2, backgrounds: 2, ui: 4, tiles: 8 }; // columnas de cada estante
const HUECO = 0.8, CARTA = 0.92, GROSOR = 0.07, PILA_Z = 2.2, BASE_Y = 0.6;
const ANCHAS = (k) => k.startsWith("backgrounds/") || k.startsWith("ui/pantalla_");

/** Nivel que arman las 28 imágenes: tres épocas lado a lado (columnas 0-3, 4-7 y 8-11). */
const NIVEL = [
  "############",
  "#  .  M  K #",
  "# @$  F  L #",
  "#   ~~W  G #",
  "#  .    .  #",
  "############",
];
const EPOCAS = ["1955", "1985", "2015"];
const epocaDe = (x) => EPOCAS[Math.min(2, Math.floor(x / 4))];
const PISO = { 1955: "tiles/floor_1955", 1985: "tiles/floor_1985", 2015: "tiles/floor_2015" };
const PARED = { 1955: "tiles/wall_brick", 1985: "tiles/wall_mall", 2015: "tiles/wall_future" };
const FONDO = { 1955: "backgrounds/background_hill_valley_1955", 1985: "backgrounds/background_mall_1985", 2015: "backgrounds/background_future_2015" };
const SIMBOLO = { ".": "goals/goal", G: "goals/goal_placed", "~": "tiles/terreno_resbaladizo", W: "tiles/muro_abierto", M: "tiles/muro_cerrado", K: "tiles/cerrojo_cerrado",
  $: "boxes/box_wood", F: "boxes/caja_fragil_intacta", L: "boxes/caja_llave" };
const BLOQUES = { M: 0.5, K: 0.5, $: 0.78, F: 0.78, L: 0.78 }; // alto de lo que no es piso
const HUD = ["ui/indicador_nivel", "ui/indicador_movimientos", "ui/indicador_empujes", "ui/boton_undo", "ui/boton_restart", "ui/boton_pause"];
const COLS = NIVEL[0].length, FILAS = NIVEL.length, TAB_Z = 3.4;
const celda = (x, z, y = 0) => new THREE.Vector3(x - COLS / 2 + 0.5, y, TAB_Z + z);

const PLANOS = {
  pilas: { tx: 0, ty: 2.4, tz: 2.2, az: 0, el: 0.22, d: 26, oy: 130 },
  pared: { tx: 0, ty: 4.8, tz: 0, az: 0, el: 0.04, d: 33, oy: 115 },
  tablero: { tx: 0.2, ty: 0.7, tz: 5.4, az: -0.14, el: 0.68, d: 23.5, oy: 165 },
};

const qEje = new THREE.Quaternion(), qPlano = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const ejeY = new THREE.Vector3(0, 1, 0);
const plana = (giro) => qEje.setFromAxisAngle(ejeY, giro).clone().multiply(qPlano);
const suave = gsap.parseEase("power3.inOut"), cae = gsap.parseEase("bounce.out"), sale = gsap.parseEase("back.out(1.6)");
const tramo = (v, desde, dur) => Math.max(0, Math.min(1, (v - desde) / dur));

/** Curva de vuelo: de a hasta b pasando por arriba. */
function arco(a, b, k, alto, salida) {
  const c = a.clone().lerp(b, 0.5);
  c.y = Math.max(a.y, b.y) + alto;
  if (salida) c.z += salida;
  const u = 1 - k;
  return new THREE.Vector3(u * u * a.x + 2 * u * k * c.x + k * k * b.x, u * u * a.y + 2 * u * k * c.y + k * k * b.y, u * u * a.z + 2 * u * k * c.z + k * k * b.z);
}

const CELDA = 128; // px de cada imagen en el atlas de las cartas
/**
 * Atlas con las 104 imágenes: todas las cartas se dibujan en un solo grupo de instancias (antes eran 104 mallas,
 * más de 400 dibujos por cuadro con las sombras). Las anchas (fondos y carteles) van recortadas al cuadrado del centro.
 */
function atlas(claves) {
  const cols = Math.ceil(Math.sqrt(claves.length)), filas = Math.ceil(claves.length / cols);
  const c = document.createElement("canvas"); c.width = cols * CELDA; c.height = filas * CELDA;
  const g = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  const celda = {};
  claves.forEach((clave, i) => {
    const cx = i % cols, fy = Math.floor(i / cols);
    celda[clave] = [cx / cols, 1 - (fy + 1) / filas, 1 / cols, 1 / filas];
    const im = new Image();
    cargando(new Promise((listo) => {
      im.onload = () => {
        const w = im.naturalWidth, h = im.naturalHeight, ancha = ANCHAS(clave);
        const lado = ancha ? Math.min(w, h) : 0;
        g.imageSmoothingEnabled = ancha || w > CELDA;
        if (ancha) g.drawImage(im, (w - lado) / 2, (h - lado) / 2, lado, lado, cx * CELDA, fy * CELDA, CELDA, CELDA);
        else g.drawImage(im, cx * CELDA, fy * CELDA, CELDA, CELDA);
        tex.needsUpdate = true;
        listo();
      };
      im.onerror = listo;
    }));
    im.src = img(clave);
  });
  return { tex, celda };
}

export default {
  montar(lienzo) {
    const inventario = window.INVENTARIO || {};
    const usadas = new Set(USADAS);
    const k = escena3d(lienzo, { aria: "Las imágenes del juego se apilan por carpeta, se ordenan en un depósito, se encienden las 28 que usa el juego y vuelan a armar un nivel", niebla: [30, 70], brillo: [0.55, 0.5, 0.86] });
    el("div", "arte__velo", lienzo);

    // Estantes: una columna de cartas por carpeta, con su nombre y su cuenta
    const total = ESTANTES.reduce((a, c) => a + ANCHO[c] + HUECO, -HUECO);
    let x = -total / 2;
    const estantes = ESTANTES.map((nombre) => {
      const claves = inventario[nombre] || [];
      const e = { nombre, claves, x0: x, cx: x + ANCHO[nombre] / 2, usa: claves.filter((c) => usadas.has(c)).length };
      x += ANCHO[nombre] + HUECO;
      e.rotulo = el("div", "arte__estante pos", lienzo);
      el("span", "arte__carpeta", e.rotulo, { texto: nombre + "/" });
      const capas = el("span", "arte__capas", e.rotulo);
      e.cuenta = el("b", "arte__cuenta", capas, { texto: "0" });
      e.enUso = el("span", "arte__en-uso", capas, { html: " de " + claves.length + "<br>en uso" });
      e.enUso.prepend(el("b", "arte__usa", null, { texto: String(e.usa) }));
      return e;
    });
    const totalImagenes = estantes.reduce((a, e) => a + e.claves.length, 0);
    const resumen = el("p", "arte__resumen pos", lienzo, { vars: { x: 120, y: 410 } });
    const nTotal = el("b", "cifra arte__total", resumen, { texto: "0" });
    el("span", "arte__unidad", resumen, { texto: "imágenes en assets/" });
    const nUsadas = el("b", "cifra arte__total arte__total--usadas", resumen, { texto: "28" });
    el("span", "arte__unidad arte__unidad--usadas", resumen, { texto: "las usa el juego" });
    nUsadas.textContent = String(USADAS.length);
    if (!k) return { sin3d: true, estantes, resumen, nTotal, totalImagenes };

    const { escena, tex, camara } = k;
    escena.add(new THREE.HemisphereLight(t("superficie-2"), t("fondo-hondo"), 1.4));
    const sol = new THREE.DirectionalLight(t("titulo"), 2.1);
    sol.position.set(-6, 12, 10); sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -12, right: 12, top: 12, bottom: -6, near: 1, far: 50 });
    sol.shadow.bias = -0.0005;
    const contra = new THREE.DirectionalLight(t("linea"), 0.7);
    contra.position.set(8, 6, -10);
    escena.add(sol, contra);

    // Piso del depósito
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: t("fondo"), roughness: 0.55, metalness: 0.2 }));
    piso.rotation.x = -Math.PI / 2; piso.position.y = -0.01; piso.receiveShadow = true;
    escena.add(piso);

    // Cartas: una por imagen, con la imagen al frente
    const geoCarta = cajaDosCaras(CARTA, CARTA, GROSOR, 4);
    const canto = new THREE.MeshStandardMaterial({ color: t("superficie-2"), roughness: 0.6 });
        const halo = texturaPunto("acento");
    const geoHalo = new THREE.PlaneGeometry(1.7, 1.7), geoMarco = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.0, 1.0));
    const cartas = [];
    const { tex: texAtlas, celda: celdaAtlas } = atlas(estantes.flatMap((e) => e.claves));
    const cara = new THREE.MeshBasicMaterial({ map: texAtlas });
    cara.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec4 aCelda;")
        .replace("#include <uv_vertex>", "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vMapUv * aCelda.zw + aCelda.xy;\n#endif");
    };
    cara.customProgramCacheKey = () => "arte-atlas";
    estantes.forEach((e) => e.claves.forEach((clave, i) => {
      const m = new THREE.Group(); // la carta: su lugar lo copia el grupo de instancias; sus hijos (halo, marco) la siguen
      const usada = usadas.has(clave);
      const fila = Math.floor(i / ANCHO[e.nombre]), col = i % ANCHO[e.nombre];
      const c = {
        m, cara, clave, usada, estante: e, orden: cartas.length,
        mural: new THREE.Vector3(e.x0 + col + 0.5, BASE_Y + fila + 0.5, 0),
        pila: new THREE.Vector3(e.cx + gsap.utils.random(-0.06, 0.06), GROSOR / 2 + i * (GROSOR + 0.025), PILA_Z + gsap.utils.random(-0.06, 0.06)),
        giroPila: gsap.utils.random(-0.25, 0.25),
        cielo: new THREE.Vector3(e.cx + gsap.utils.random(-3, 3), gsap.utils.random(10, 15), PILA_Z + gsap.utils.random(-4, 2)),
        qCielo: new THREE.Quaternion().setFromEuler(new THREE.Euler(gsap.utils.random(-3, 3), gsap.utils.random(-3, 3), gsap.utils.random(-3, 3))),
        retraso: 0, salto: gsap.utils.random(2, 4.5),
      };
      if (usada) {
        c.halo = new THREE.Mesh(geoHalo, new THREE.MeshBasicMaterial({ map: halo, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
        c.halo.position.z = -0.05;
        c.marco = new THREE.LineSegments(geoMarco, new THREE.LineBasicMaterial({ color: t("acento"), transparent: true, opacity: 0 }));
        c.marco.position.z = GROSOR / 2 + 0.005;
        m.add(c.halo, c.marco);
      }
      escena.add(m);
      cartas.push(c);
    }));
    const nCartas = cartas.length;
    geoCarta.setAttribute("aCelda", new THREE.InstancedBufferAttribute(Float32Array.from(cartas.flatMap((c) => celdaAtlas[c.clave])), 4));
    const mazo = new THREE.InstancedMesh(geoCarta, [canto, cara], nCartas);
    mazo.castShadow = true; mazo.frustumCulled = false;
    const gris = new THREE.Color(), nada = new THREE.Matrix4().makeScale(0, 0, 0);
    cartas.forEach((c, i) => mazo.setColorAt(i, gris.setScalar(1)));
    escena.add(mazo);
    // Cada pila se arma de abajo hacia arriba; el reparto arranca por las pilas más bajas
    cartas.forEach((c) => { c.retraso = (c.pila.y / 6.6) * 0.75 + c.orden * 0.004; c.retrasoReparto = (c.mural.y / 10) * 0.35 + Math.abs(c.mural.x) * 0.012; });

    // Tablero que arman las 28
    const tablero = new THREE.Group();
    escena.add(tablero);
    const geoPiso = new THREE.PlaneGeometry(1, 1), geoMuro = cajaDosCaras(1, 0.5, 1, 2).translate(0, 0.25, 0);
    const mats = {};
    const matDe = (clave, lado) => (mats[clave + (lado ? "~" : "")] ||= new THREE.MeshStandardMaterial({ map: tex(clave), roughness: 0.85, ...(lado ? { color: t("tinta-3") } : {}) }));
    const piezas = {}; // clave → [{ obj, d (distancia a la primera) }]
    const sumar = (clave, obj, x, z) => { (piezas[clave] ||= []).push({ obj, x, z }); tablero.add(obj); };
    NIVEL.forEach((linea, z) => [...linea].forEach((ch, x) => {
      const ep = epocaDe(x);
      if (ch === "#") {
        const m = new THREE.Mesh(geoMuro, [matDe(PARED[ep], true), matDe(PARED[ep])]);
        m.position.copy(celda(x, z)); m.castShadow = true; m.receiveShadow = true;
        sumar(PARED[ep], m, x, z);
        return;
      }
      const plano = (clave) => {
        const m = new THREE.Mesh(geoPiso, matDe(clave));
        m.rotation.x = -Math.PI / 2; m.position.copy(celda(x, z, 0.002)); m.receiveShadow = true;
        sumar(clave, m, x, z);
      };
      if (".G~W".includes(ch)) { plano(SIMBOLO[ch]); return; }
      if (!"MK".includes(ch)) plano(PISO[ep]);
      if (BLOQUES[ch]) {
        const alto = BLOQUES[ch], esCaja = "$FL".includes(ch);
        const g = esCaja ? new THREE.BoxGeometry(alto, alto, alto) : cajaDosCaras(1, alto, 1, 2);
        g.translate(0, alto / 2, 0);
        const m = new THREE.Mesh(g, esCaja ? matDe(SIMBOLO[ch]) : [matDe(SIMBOLO[ch], true), matDe(SIMBOLO[ch])]);
        m.position.copy(celda(x, z)); m.castShadow = true; m.receiveShadow = true;
        sumar(SIMBOLO[ch], m, x, z);
      }
    }));
    // Fondos: uno por época detrás de su tercio del tablero
    EPOCAS.forEach((ep, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.25), new THREE.MeshBasicMaterial({ map: tex(FONDO[ep]), transparent: true, opacity: 0, fog: false }));
      m.position.copy(celda(i * 4 + 1.5, -0.6, 1.13));
      sumar(FONDO[ep], m, i * 4 + 1.5, -1);
    });
    // HUD flotando arriba, como en la pantalla del juego
    HUD.forEach((clave, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.78), new THREE.MeshBasicMaterial({ map: tex(clave), transparent: true, fog: false }));
      m.position.copy(celda(COLS / 2 - 0.5 + (i - 2.5) * 0.92 + (i > 2 ? 0.5 : 0) - 0.25, -0.75, 2.75));
      m.rotation.x = -0.25;
      sumar(clave, m, 6, -1);
    });
    const pj = crearPersonaje(0.78);
    const xJugador = NIVEL[2].indexOf("@");
    pj.raiz.position.copy(celda(xJugador, 2));
    tablero.add(pj.raiz);
    ["characters/player_down", "characters/player_right", "characters/player_up", "characters/player_left"].forEach((clave, i) => {
      const m = new THREE.Mesh(geoPiso, new THREE.MeshBasicMaterial({ map: tex(clave), transparent: true, side: THREE.DoubleSide, alphaTest: 0.1 }));
      const a = (i * Math.PI) / 2;
      m.userData.giro = a;
      sumar(clave, m, xJugador, 2);
    });

    // Destino de cada carta usada: su primera pieza; las demás aparecen en onda desde ahí
    const ordenObra = (clave) => {
      if (clave.includes("floor_")) return 0;
      if (clave.includes("wall_")) return 1;
      if (clave.startsWith("goals/") || /terreno|muro_abierto/.test(clave)) return 2;
      if (/muro_cerrado|cerrojo/.test(clave) || clave.startsWith("boxes/")) return 3;
      if (clave.startsWith("characters/")) return 4;
      if (clave.startsWith("backgrounds/")) return 5;
      return 6;
    };
    const vuelan = cartas.filter((c) => c.usada).sort((a, b) => ordenObra(a.clave) - ordenObra(b.clave) || a.orden - b.orden);
    vuelan.forEach((c, i) => {
      const lista = piezas[c.clave] || [];
      const centro = { x: lista.reduce((a, p) => a + p.x, 0) / (lista.length || 1), z: lista.reduce((a, p) => a + p.z, 0) / (lista.length || 1) };
      const primera = lista.slice().sort((a, b) => Math.hypot(a.x - centro.x, a.z - centro.z) - Math.hypot(b.x - centro.x, b.z - centro.z))[0];
      lista.forEach((p) => { p.d = primera ? Math.hypot(p.x - primera.x, p.z - primera.z) : 0; });
      c.piezas = lista;
      c.primera = primera;
      c.salida = ordenObra(c.clave) * 0.42 + (i % 6) * 0.07;
    });
    // Pose final de la carta en el tablero
    vuelan.forEach((c) => {
      const p = c.primera && c.primera.obj;
      if (!p) return;
      if (c.clave.startsWith("characters/")) {
        const a = p.userData.giro;
        c.fin = celda(xJugador, 2, 0.62).add(new THREE.Vector3(Math.sin(a) * 0.42, 0, Math.cos(a) * 0.42));
        c.qFin = new THREE.Quaternion().setFromAxisAngle(ejeY, a);
        c.escala = 0.8;
      } else if (c.clave.startsWith("backgrounds/")) {
        c.fin = p.position.clone(); c.qFin = new THREE.Quaternion(); c.escala = 2.25;
      } else if (c.clave.startsWith("ui/")) {
        c.fin = p.position.clone(); c.qFin = p.quaternion.clone(); c.escala = 0.85;
      } else {
        const alto = p.geometry.parameters && p.geometry.parameters.height !== undefined && p.geometry.type === "BoxGeometry" ? p.geometry.parameters.height : 0;
        c.fin = p.position.clone().setY(alto + 0.02);
        c.qFin = plana(0);
        c.escala = p.geometry.type === "BoxGeometry" ? p.geometry.parameters.width / CARTA : 1 / CARTA;
      }
    });
    const piezasTodas = Object.values(piezas).flat();
    piezasTodas.forEach((p) => { p.obj.visible = false; });
    pj.raiz.visible = false;

    // Rótulos del tablero
    const notas = [
      { texto: "Fondo de cada época", ancla: celda(1.5, -0.6, 2.45), lado: "arriba" },
      { texto: "HUD: indicadores y botones", ancla: celda(COLS / 2 - 0.5 + 3.3, -0.75, 2.75), lado: "derecha" },
      { texto: "Personaje en 4 direcciones", ancla: celda(xJugador, 2, 2.05), lado: "arriba" },
      { texto: "Piso y pared de cada época", ancla: celda(9.5, 5, 0.6), lado: "abajo" },
      { texto: "Cajas, destinos y bloques", ancla: celda(6, 1, 1.5), lado: "arriba" },
    ].map((n) => ({ ...n, e: el("p", "arte__nota pos arte__nota--" + n.lado, lienzo, { texto: n.texto }) }));

    // Polvo
    const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: t("titulo"), map: texturaPunto("tinta"), size: 0.08, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
    polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: 900 }, (_, i) => (i % 3 === 0 ? gsap.utils.random(-14, 14) : i % 3 === 1 ? gsap.utils.random(0, 11) : gsap.utils.random(-3, 10))), 3));
    escena.add(polvo);

    // Estado de la escena: todo se calcula a partir de estos valores, así cualquier salto del timeline queda bien
    const E = { lluvia: 0, reparto: 0, luz: 0, obra: 0, notas: 0 };
    const cam = { ...PLANOS.pilas, dx: 0, dy: 0 };
    const v = new THREE.Vector3(), q = new THREE.Quaternion(), mira = new THREE.Vector3();
    const pose = (c) => {
      // 1. lluvia: del cielo a la pila
      const kl = cae(tramo(E.lluvia * 1.9, c.retraso, 0.65));
      v.copy(c.cielo).lerp(c.pila, kl);
      q.copy(c.qCielo).slerp(plana(c.giroPila), Math.min(1, kl * 1.4));
      let s = 1;
      // 2. reparto: de la pila al depósito
      const kr = suave(tramo(E.reparto * 1.8, c.retrasoReparto, 1.25));
      if (kr > 0) {
        const mural = c.mural.clone();
        mural.z += E.luz * (c.usada ? 0.45 : -0.35);
        v.copy(arco(c.pila, mural, kr, c.salto * 0.5, 2.5));
        q.copy(plana(c.giroPila)).slerp(new THREE.Quaternion(), kr);
      }
      // 3. obra: las usadas vuelan al tablero
      if (c.usada && c.fin && E.obra > c.salida) {
        const ko = suave(tramo(E.obra, c.salida, 0.95));
        const desde = c.mural.clone(); desde.z += E.luz * 0.45;
        v.copy(arco(desde, c.fin, ko, 2.2, 1.5));
        q.copy(new THREE.Quaternion()).slerp(c.qFin, ko);
        s = 1 + (c.escala - 1) * ko;
        c.llego = ko >= 1;
      } else c.llego = false;
      if (!c.usada) { const kf = suave(tramo(E.obra, 0, 1.6)); v.z -= 14 * kf; v.y += 3 * kf; }
      c.m.position.copy(v); c.m.quaternion.copy(q); c.m.scale.set(s, s, 1);
    };
    const ubicar = () => {
      cartas.forEach((c) => {
        pose(c);
        const apagada = !c.usada ? E.luz * 0.72 + tramo(E.obra, 0, 1.6) * 0.22 : 0;
        mazo.setColorAt(c.orden, gris.setScalar(1 - apagada));
        if (c.usada) {
          const brillo = E.luz * (c.llego ? 0 : 1) * Math.max(0, 1 - tramo(E.obra, c.salida, 0.5));
          c.halo.material.opacity = brillo * 0.55;
          c.marco.material.opacity = brillo;
        }
        // La carta que llegó deja su lugar a la pieza del tablero (y a las copias, en onda)
        c.m.visible = !(c.llego && c.piezas && c.piezas.length);
        c.m.updateMatrix();
        mazo.setMatrixAt(c.orden, c.m.visible ? c.m.matrix : nada);
      });
      mazo.instanceMatrix.needsUpdate = true;
      if (mazo.instanceColor) mazo.instanceColor.needsUpdate = true;
      vuelan.forEach((c) => {
        if (!c.piezas) return;
        const llegada = c.salida + 0.95;
        c.piezas.forEach((p) => {
          const kp = tramo(E.obra, llegada + p.d * 0.07, 0.32);
          p.obj.visible = kp > 0;
          if (c.clave.startsWith("backgrounds/")) { p.obj.material.opacity = kp; return; }
          if (c.clave.startsWith("characters/")) {
            // Los cuatro sprites rodean al jugador y se funden en el personaje 3D
            const kf = tramo(E.obra, 3.55, 0.45);
            const a = p.obj.userData.giro + kf * Math.PI;
            p.obj.position.copy(celda(xJugador, 2, 0.62)).add(new THREE.Vector3(Math.sin(a) * 0.42 * (1 - kf), 0, Math.cos(a) * 0.42 * (1 - kf)));
            p.obj.rotation.set(0, a, 0);
            p.obj.scale.setScalar(0.8 * (1 - kf));
            p.obj.visible = kp > 0 && kf < 1;
            return;
          }
          const e = sale(kp);
          p.obj.scale.set(e, e, e);
        });
      });
      const kj = sale(tramo(E.obra, 3.65, 0.5));
      pj.raiz.visible = kj > 0; pj.raiz.scale.setScalar(0.78 * kj);
      estantes.forEach((e) => {
        const caidas = cartas.filter((c) => c.estante === e && tramo(E.lluvia * 1.9, c.retraso, 0.65) >= 0.55).length;
        e.cuenta.textContent = String(caidas);
      });
    };
    k.antes = () => {
      const ce = Math.cos(cam.el);
      mira.set(cam.tx, cam.ty, cam.tz);
      camara.position.set(cam.tx + cam.d * ce * Math.sin(cam.az) + cam.dx, cam.ty + cam.d * Math.sin(cam.el) + cam.dy, cam.tz + cam.d * ce * Math.cos(cam.az));
      camara.lookAt(mira);
      camara.setViewOffset(k.W, k.H, 0, -cam.oy, k.W, k.H);
      k.orbitar(mira);
      camara.updateMatrixWorld();
      estantes.forEach((e) => {
        const r = Math.min(1, E.reparto * 1.4);
        const p = k.proyectar(v.set(e.cx, (BASE_Y - 0.1) * r, (PILA_Z + 0.6) * (1 - r) + 0.2 * r));
        e.rotulo.style.setProperty("--x", p.x + "px"); e.rotulo.style.setProperty("--y", p.y + "px");
      });
      notas.forEach((n) => {
        const p = k.proyectar(n.ancla);
        n.e.style.setProperty("--x", p.x + "px"); n.e.style.setProperty("--y", p.y + "px");
      });
    };
    ubicar();
    k.arrancar();
    return { k, E, cam, ubicar, cartas, vuelan, estantes, resumen, nTotal, totalImagenes, notas, pj, polvo };
  },

  construir(tl, c) {
    const { estantes } = c;
    const rotulos = estantes.map((e) => e.rotulo);
    const enUso = estantes.map((e) => e.enUso);
    tl.set(enUso, { autoAlpha: 0 }, 0);
    tl.fromTo(c.resumen, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.6)
      .fromTo({ n: 0 }, { n: 0 }, { n: c.totalImagenes, duration: 2.2, ease: "power1.inOut", onUpdate() { c.nTotal.textContent = Math.round(this.targets()[0].n); } }, 0.6);
    const usadas = c.resumen.querySelectorAll(".arte__total--usadas, .arte__unidad--usadas");
    tl.set(usadas, { autoAlpha: 0 }, 0);
    if (c.sin3d) {
      tl.fromTo(rotulos, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.08 }, 0.5);
      tl.addLabel("p1").to(enUso, { autoAlpha: 1, duration: 0.4, stagger: 0.06 }).to(usadas, { autoAlpha: 1, duration: 0.4 }, "<");
      return;
    }
    const { E, cam, ubicar } = c;
    const anima = (prop, hasta, dur, en, ease = "none") => tl.to(E, { [prop]: hasta, duration: dur, ease, onUpdate: ubicar }, en);

    // Entrada: llueven las imágenes y se apilan por carpeta (cada pila, una barra de cartas)
    tl.fromTo(cam, { ...PLANOS.pilas, el: 0.9, d: 34 }, { ...PLANOS.pilas, duration: 3.2, ease: "power3.inOut" }, 0);
    anima("lluvia", 1, 2.6, 0.2);
    tl.fromTo(rotulos, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }, 0.5);

    // p1: las pilas estallan en un depósito donde se ve cada imagen y se encienden las 28 que usa el juego
    tl.addLabel("p1", 3.4);
    tl.to(cam, { ...PLANOS.pared, duration: 2.2, ease: "power3.inOut" }, "p1");
    anima("reparto", 1, 2.4, "p1");
    anima("luz", 1, 1, "p1+=2.5", "power2.inOut");
    tl.to(estantes.map((e) => e.cuenta), { autoAlpha: 0, duration: 0.3 }, "p1+=2.5")
      .to(enUso, { autoAlpha: 1, duration: 0.4, stagger: 0.07 }, "p1+=2.6")
      .fromTo(estantes.map((e) => e.rotulo.querySelector(".arte__usa")), { scale: 1.8 }, { scale: 1, duration: 0.5, ease: "back.out(2.5)", stagger: 0.07 }, "p1+=2.6")
      .to(usadas, { autoAlpha: 1, duration: 0.5 }, "p1+=2.8");

    // p2: las 28 vuelan y arman un nivel del juego
    tl.addLabel("p2", "p1+=4.2");
    tl.to(cam, { ...PLANOS.tablero, duration: 2.6, ease: "power2.inOut" }, "p2");
    tl.to(rotulos, { autoAlpha: 0, duration: 0.5 }, "p2")
      .to(c.resumen, { x: 1148, y: -214, duration: 1.6, ease: "power3.inOut" }, "p2+=0.4");
    anima("obra", 4.4, 4.4, "p2+=0.3");
    tl.fromTo(c.notas.map((n) => n.e), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.12, ease: "power3.out" }, "p2+=4.4");
  },

  vida(c) {
    if (c.sin3d) return { kill() {} };
    const tick = (tt) => {
      c.cam.dx = Math.sin(tt * 0.11) * 0.5;
      c.cam.dy = Math.sin(tt * 0.17 + 0.7) * 0.25;
      c.polvo.rotation.y = tt * 0.01;
      if (c.pj.raiz.visible) c.pj.cabeza.rotation.y = Math.sin(tt * 0.5) * 0.4;
    };
    gsap.ticker.add(tick);
    // Un destello recorre al azar alguna de las 28 mientras están en el depósito
    const destello = eventos(() => {
      const carta = gsap.utils.random(c.vuelan);
      if (!carta.halo || carta.llego || c.E.luz < 1 || c.E.obra > 0) return;
      gsap.fromTo(carta.halo.material, { opacity: 0.55 }, { opacity: 1, duration: 0.3, yoyo: true, repeat: 1, ease: "sine.inOut" });
    }, [0.5, 1.6]);
    // El personaje mira hacia las cuatro direcciones que dibujó Martín
    const giro = eventos(() => {
      if (!c.pj.raiz.visible) return;
      gsap.to(c.pj.raiz.rotation, { y: gsap.utils.random([0, Math.PI / 2, Math.PI, -Math.PI / 2]), duration: 0.35, ease: "power2.inOut" });
    }, [1.6, 3.4]);
    return juntas({ kill: () => gsap.ticker.remove(tick) }, destello, giro);
  },

  desmontar(c) { if (c.k) c.k.destruir(); },
};
