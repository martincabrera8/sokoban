import * as THREE from "three";
import { gsap } from "gsap";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { t, el, eventos, juntas } from "../util.js";
import { SONIDOS, CAPAS } from "../datos.js";
import { mundo3d, textura, chispa, anclar } from "./patrones3d.js";

/*
 * El sonido de Mora. En el centro, la caja del juego (JuegoSokoban) dentro de una caja de vidrio lila (JuegoConSonido):
 * el Decorator la envuelve y cumple el mismo contrato. Alrededor, un ecualizador circular con la onda real de los
 * 14 efectos (la envolvente de cada .wav). Cada pedido entra al vidrio, pasa a la caja de adentro, vuelve el estado
 * y el vidrio decide qué sonó comparando antes y después: se enciende el arco de ese efecto y su nombre.
 * Paso 1: un mover() en cámara lenta, línea por línea del código real. Paso 2: varias situaciones, cada una con su efecto.
 * Paso 3: State. La tecla M da vuelta la moneda: en SonidoSilenciado el pedido llega igual, pero reproducir no hace nada.
 */

const R = 4.2, BARRAS = SONIDOS[0].onda.length, ALTO = 2.1;
const VIDRIO = 2.5, NUCLEO = 1.25, Y = VIDRIO / 2 + 0.05;
const TRAMO = (Math.PI * 2) / SONIDOS.length;
const angulo = (i) => Math.PI / 2 - (i - 2.5) * TRAMO; // los efectos más comunes quedan adelante
const indice = (clave) => SONIDOS.findIndex((x) => x.clave === clave);
const MONEDA = new THREE.Vector3(2.6, 0, 1.3), TECLA = new THREE.Vector3(3.55, 0, 0.15);
const CAMARA = new THREE.Vector3(0.3, 10.6, 16.8), MIRA = new THREE.Vector3(0.3, 0.9, 0.2);

/** Líneas de JuegoConSonido.mover (src/main/java/sokoban/sonido/JuegoConSonido.java), resumidas sin el caso del choque. */
const CODIGO = [
  "public void mover(Direccion direccion) {",
  "  EstadoJuego antes = juego.getEstado();",
  "  juego.mover(direccion);",
  "  EstadoJuego despues = juego.getEstado();",
  "  sonar(queSonidoCorresponde(antes, despues));",
  "}",
];
/** Situaciones reales del juego y el efecto que elige queSonidoCorresponde (o el choque, si nada cambió). */
const SITUACIONES = [
  { llamada: "mover(DERECHA)", motivo: "una caja llegó a un destino", sonido: "CAJA_EN_DESTINO" },
  { llamada: "mover(ARRIBA)", motivo: "pared: antes y después son iguales", sonido: "CHOQUE" },
  { llamada: "mover(DERECHA)", motivo: "la caja frágil se rompió", sonido: "CAJA_ROTA" },
  { llamada: "mover(ABAJO)", motivo: "se abrió el cerrojo", sonido: "CERROJO_ABIERTO" },
  { llamada: "deshacer()", motivo: "volvió a una foto anterior", sonido: "DESHACER" },
  { llamada: "mover(IZQUIERDA)", motivo: "la última caja en su destino", sonido: "VICTORIA" },
];
/** Lo que pasa mientras la diapositiva queda en pantalla (más pasos y empujes que otra cosa, como en una partida). */
const PARTIDA = [
  ["mover(DERECHA)", "caminó una baldosa", "PASO", 4], ["mover(ARRIBA)", "empujó una caja", "EMPUJE", 4], ["mover(IZQUIERDA)", "pared: nada cambió", "CHOQUE", 2],
  ["mover(ABAJO)", "una caja llegó a un destino", "CAJA_EN_DESTINO", 2], ["mover(DERECHA)", "la frágil perdió resistencia", "CAJA_DANADA", 1],
  ["deshacer()", "volvió a una foto anterior", "DESHACER", 1], ["reiniciar()", "el nivel empieza de nuevo", "REINICIAR", 1],
].flatMap(([llamada, motivo, sonido, peso]) => Array(peso).fill({ llamada, motivo, sonido }));

/** Ícono de la moneda del estado: parlante con ondas o parlante tachado, dibujado en un canvas. */
function caraMoneda(activo) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = t("superficie-2"); g.beginPath(); g.arc(128, 128, 126, 0, Math.PI * 2); g.fill();
  g.lineWidth = 10; g.strokeStyle = t(activo ? "sonido" : "tinta-3"); g.beginPath(); g.arc(128, 128, 118, 0, Math.PI * 2); g.stroke();
  g.fillStyle = t(activo ? "titulo" : "tinta-3");
  g.beginPath(); g.moveTo(62, 104); g.lineTo(92, 104); g.lineTo(130, 70); g.lineTo(130, 186); g.lineTo(92, 152); g.lineTo(62, 152); g.closePath(); g.fill();
  g.lineCap = "round"; g.lineWidth = 12;
  if (activo) {
    g.strokeStyle = t("sonido");
    [30, 56].forEach((r) => { g.beginPath(); g.arc(138, 128, r, -0.75, 0.75); g.stroke(); });
  } else {
    g.strokeStyle = t("tinta-2");
    g.beginPath(); g.moveTo(156, 100); g.lineTo(204, 156); g.moveTo(204, 100); g.lineTo(156, 156); g.stroke();
  }
  const x = new THREE.CanvasTexture(c);
  x.colorSpace = THREE.SRGBColorSpace;
  return x;
}

/** La letra de la tecla, en un canvas. */
function caraTecla() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = t("superficie-2"); g.fillRect(0, 0, 128, 128);
  g.fillStyle = t("tinta"); g.font = `700 76px ${t("f-mono")}`; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("M", 64, 68);
  const x = new THREE.CanvasTexture(c);
  x.colorSpace = THREE.SRGBColorSpace;
  return x;
}

function armarEscena(w) {
  const { escena } = w;
  escena.add(new THREE.HemisphereLight(t("tinta-2"), t("fondo-hondo"), 1.3));
  const sol = new THREE.DirectionalLight(t("titulo"), 1.8);
  sol.position.set(-5, 11, 7);
  escena.add(sol);
  const lila = new THREE.Color(t("sonido"));
  const luzVidrio = new THREE.PointLight(lila, 3, 9, 1.4);
  luzVidrio.position.set(0, Y + 0.4, 0);
  escena.add(luzVidrio);

  // Piso: un disco oscuro con surcos, como el cono de un parlante visto desde arriba
  const piso = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.9, R + 1.1, 0.3, 96), new THREE.MeshStandardMaterial({ color: t("superficie"), roughness: 0.6, metalness: 0.3 }));
  piso.position.y = -0.15;
  escena.add(piso);
  const surcos = [1.9, 2.8, 3.7, R + 0.55].map((r, i) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(r - 0.02, r + 0.02, 128), new THREE.MeshBasicMaterial({ color: lila, transparent: true, opacity: i === 3 ? 0.4 : 0.14, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 0.005;
    escena.add(m);
    return m;
  });

  // JuegoSokoban: la caja de madera del juego
  const nucleo = new THREE.Mesh(new RoundedBoxGeometry(NUCLEO, NUCLEO, NUCLEO, 3, 0.08), new THREE.MeshStandardMaterial({ map: textura("boxes/box_wood"), roughness: 0.7, emissive: new THREE.Color(t("acento")), emissiveMap: textura("boxes/box_wood"), emissiveIntensity: 0.05 }));
  nucleo.position.y = Y;
  escena.add(nucleo);
  // JuegoConSonido: la caja de vidrio que la envuelve
  const vidrio = new THREE.Mesh(new RoundedBoxGeometry(VIDRIO, VIDRIO, VIDRIO, 4, 0.14), new THREE.MeshStandardMaterial({ color: t("superficie-2"), emissive: lila, emissiveIntensity: 0.25, transparent: true, opacity: 0.22, roughness: 0.1, metalness: 0.2, depthWrite: false }));
  vidrio.position.y = Y;
  const filos = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(VIDRIO, VIDRIO, VIDRIO)), new THREE.LineBasicMaterial({ color: lila.clone().multiplyScalar(1.5), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  filos.position.y = Y;
  escena.add(vidrio, filos);

  // Ecualizador: 14 arcos, uno por efecto, con la envolvente real de su .wav
  const n = SONIDOS.length * BARRAS;
  const barras = new THREE.InstancedMesh(new THREE.BoxGeometry(0.032, 1, 0.032).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ toneMapped: false }), n);
  barras.frustumCulled = false;
  escena.add(barras);
  const arcos = SONIDOS.map(() => ({ luz: 0.12, k: 0 }));

  // Ondas que salen del vidrio cuando algo suena
  const ondas = Array.from({ length: 4 }, () => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(VIDRIO * 0.62, 0.028, 8, 128), new THREE.MeshBasicMaterial({ color: lila.clone().multiplyScalar(2), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    m.rotation.x = Math.PI / 2; m.position.y = Y;
    escena.add(m);
    return m;
  });
  const pulso = chispa("sonido", 1.1);
  escena.add(pulso);

  // State: la moneda (activado de un lado, silenciado del otro) y la tecla M
  const moneda = new THREE.Group();
  moneda.position.copy(MONEDA).setY(0.75);
  escena.add(moneda);
  const geoCara = new THREE.CircleGeometry(0.56, 64);
  const frente = new THREE.Mesh(geoCara, new THREE.MeshStandardMaterial({ map: caraMoneda(true), roughness: 0.5, emissive: new THREE.Color(t("tinta")), emissiveMap: caraMoneda(true), emissiveIntensity: 0.35 }));
  frente.position.z = 0.051;
  const dorso = new THREE.Mesh(geoCara, new THREE.MeshStandardMaterial({ map: caraMoneda(false), roughness: 0.5, emissive: new THREE.Color(t("tinta")), emissiveMap: caraMoneda(false), emissiveIntensity: 0.3 }));
  dorso.rotation.x = Math.PI; dorso.position.z = -0.051; // al dar vuelta la moneda sobre X, queda derecho
  const canto = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.58, 0.1, 64, 1, true), new THREE.MeshStandardMaterial({ color: t("titulo"), roughness: 0.35, metalness: 0.7 }));
  canto.rotation.x = Math.PI / 2;
  moneda.add(frente, dorso, canto);
  moneda.rotation.y = -0.35;
  const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.32, 0.12, 24), new THREE.MeshStandardMaterial({ color: t("superficie-2"), roughness: 0.5, metalness: 0.4 }));
  pie.position.copy(MONEDA).setY(0.06);
  escena.add(pie);
  const tecla = new THREE.Group();
  tecla.position.copy(TECLA);
  escena.add(tecla);
  const base = new THREE.Mesh(new RoundedBoxGeometry(0.95, 0.22, 0.95, 3, 0.06), new THREE.MeshStandardMaterial({ color: t("fondo-hondo"), roughness: 0.6 }));
  base.position.y = 0.11;
  const tapa = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.3, 0.78, 3, 0.08), [0, 1, 2, 3, 4, 5].map((i) => new THREE.MeshStandardMaterial({ color: i === 2 ? t("tinta") : t("superficie-2"), map: i === 2 ? caraTecla() : null, roughness: 0.5 })));
  tapa.position.y = 0.4;
  tecla.add(base, tapa);
  tecla.rotation.y = -0.3;

  // Polvo de luz
  const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: lila, size: 0.06, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
  polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: 900 }, (_, i) => (i % 3 === 1 ? gsap.utils.random(0, 6) : gsap.utils.random(-9, 9))), 3));
  escena.add(polvo);

  return { nucleo, vidrio, filos, luzVidrio, barras, arcos, ondas, pulso, moneda, tecla, tapa, polvo, surcos, piso };
}

export default {
  montar(lienzo) {
    const w = mundo3d(lienzo, { descripcion: "Patrón Decorator y State: la caja de vidrio JuegoConSonido envuelve a JuegoSokoban; alrededor, la onda real de los 14 efectos de sonido; una moneda muestra si el sonido está activado o silenciado", fov: 30, resplandor: [0.75, 0.5, 0.7], niebla: [20, 44] });
    el("div", "son__velo", lienzo);
    const c = { w, crece: { v: 0 }, silencio: { v: 0 }, entrada: { v: 0 }, libre: 0 };

    // El código real del Decorator
    c.codigo = el("div", "son__codigo", lienzo);
    el("p", "son__rotulo", c.codigo, { html: "Decorator · <b>JuegoConSonido</b>" });
    const pre = el("div", "son__lineas", c.codigo);
    c.lineas = CODIGO.map((l) => el("code", "son__linea", pre, { texto: l }));
    const porque = el("p", "son__porque", c.codigo);
    el("span", "son__porque-rotulo", porque, { texto: "qué cambió:" });
    c.motivo = el("span", "son__motivo", porque);
    el("p", "son__main", c.codigo, { html: `En Main: <code>new ${CAPAS.decorador}(new ${CAPAS.dominio}())</code>` });

    // Los 14 efectos del enum Sonido
    c.lista = el("div", "son__lista", lienzo);
    el("p", "son__rotulo", c.lista, { html: `enum <b>Sonido</b> · ${SONIDOS.length} efectos en assets/sonidos/` });
    const grilla = el("div", "son__efectos", c.lista);
    c.filas = SONIDOS.map((x) => el("code", "son__efecto", grilla, { texto: x.clave }));

    // Rótulos anclados al 3D
    const ancla = (clase) => el("div", "son__ancla " + clase, lienzo);
    c.vidrioA = ancla("son__ancla--vidrio");
    c.vidrioEl = el("p", "son__clase son__clase--sonido", c.vidrioA, { html: `<b>${CAPAS.decorador}</b> también es un Juego` });
    c.nucleoA = ancla("son__ancla--nucleo");
    c.nucleoEl = el("p", "son__clase", c.nucleoA, { html: `<b>${CAPAS.dominio}</b> adentro` });
    c.llamadaA = ancla("son__ancla--llamada");
    c.llamada = el("code", "son__llamada", c.llamadaA);
    c.efectoA = ancla("son__ancla--efecto");
    c.efecto = el("p", "son__suena", c.efectoA);
    c.efectoNombre = el("b", "", c.efecto);
    c.efectoDato = el("span", "", c.efecto);
    c.estadoA = ancla("son__ancla--estado");
    const est = el("div", "son__estado", c.estadoA);
    c.estadoEl = est;
    el("p", "son__estado-rotulo", est, { html: "State · <b>Sonidos</b>" });
    const caras = el("div", "son__caras", est);
    c.caras = [
      el("p", "son__cara son__cara--activo", caras, { html: "<b>SonidoActivado</b>reproduce el clip" }),
      el("p", "son__cara son__cara--silencio", caras, { html: "<b>SonidoSilenciado</b>no hace nada" }),
    ];
    c.teclaA = ancla("son__ancla--tecla");
    c.teclaTxt = el("code", "son__tecla", c.teclaA, { texto: "M: alternarSonido()" });

    if (w) {
      Object.assign(c, armarEscena(w));
      w.camara.position.copy(CAMARA);
      w.mira.copy(MIRA);
      w.camara.setViewOffset(w.W, w.H, -w.W * 0.18, -w.H * 0.12, w.W, w.H);
      w.preparar();
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(), col = new THREE.Color(), tmp = new THREE.Vector3();
      const tenue = new THREE.Color(t("sonido")).multiplyScalar(0.24), fuerte = new THREE.Color(t("sonido")).multiplyScalar(1.6);
      const cabeza = new THREE.Color(t("tinta")).multiplyScalar(2.2), mudo = new THREE.Color(t("tinta-3")).multiplyScalar(0.25);
      const eje = new THREE.Vector3(0, 1, 0);
      w.cadaCuadro(() => {
        const sil = c.silencio.v;
        SONIDOS.forEach((snd, i) => {
          const a = angulo(i), arco = c.arcos[i];
          for (let j = 0; j < BARRAS; j++) {
            const aj = a + ((j - (BARRAS - 1) / 2) / BARRAS) * TRAMO * 0.82;
            const cabezal = arco.k > 0 && arco.k < 1 ? Math.max(0, 1 - Math.abs(j / (BARRAS - 1) - arco.k) / 0.08) : 0;
            const h = Math.max(0.001, (0.06 + snd.onda[j] * ALTO) * c.crece.v * (1 + arco.luz * 0.45 + cabezal * 0.35));
            p3.set(Math.cos(aj) * R, 0, Math.sin(aj) * R);
            q.setFromAxisAngle(eje, -aj);
            s3.set(1, h, 1);
            c.barras.setMatrixAt(i * BARRAS + j, m4.compose(p3, q, s3));
            col.copy(tenue).lerp(fuerte, Math.min(1, arco.luz)).lerp(cabeza, cabezal).lerp(mudo, sil * 0.85);
            c.barras.setColorAt(i * BARRAS + j, col);
          }
        });
        c.barras.instanceMatrix.needsUpdate = true;
        if (c.barras.instanceColor) c.barras.instanceColor.needsUpdate = true;
        c.filos.material.opacity = 0.9 - sil * 0.55;
        c.luzVidrio.intensity = 3 * (1 - sil * 0.8);
        anclar(c.vidrioA, w.proyectar(tmp.set(0, Y + VIDRIO / 2 + 0.15, 0)));
        anclar(c.nucleoA, w.proyectar(tmp.set(0, 0.05, VIDRIO / 2 + 0.1)));
        anclar(c.estadoA, w.proyectar(tmp.copy(MONEDA).setY(0)));
        anclar(c.teclaA, w.proyectar(tmp.copy(TECLA).setY(0.6)));
        if (c.activo !== undefined) {
          const a = angulo(c.activo);
          anclar(c.efectoA, w.proyectar(tmp.set(Math.cos(a) * R, ALTO * 0.95, Math.sin(a) * R)));
        }
        c.puertaPx = w.proyectar(tmp.set(-VIDRIO / 2, Y, 0));
      });
    } else {
      c.sin3d = true;
      c.puertaPx = { x: 1100, y: 640 };
      [c.vidrioA, c.nucleoA, c.efectoA, c.estadoA, c.teclaA].forEach((a, i) => anclar(a, { x: 1250, y: 420 + i * 100 }));
    }
    return c;
  },

  construir(tl, c) {
    tl.set([c.llamada, c.motivo, c.efecto, c.teclaTxt, c.caras[1]], { autoAlpha: 0 }, 0)
      .set(c.lineas, { "--paso": 0 }, 0)
      .fromTo(c.entrada, { v: 0 }, { v: 1, duration: 3, ease: "none" }, 0)
      .fromTo([c.codigo, c.lista], { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out", stagger: 0.15 }, 1)
      .fromTo([c.vidrioEl, c.nucleoEl, c.estadoEl], { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.12 }, 2.2);
    if (c.w) {
      tl.fromTo(c.w.camara.position, { x: CAMARA.x - 5, y: CAMARA.y + 7, z: CAMARA.z - 3 }, { x: CAMARA.x, y: CAMARA.y, z: CAMARA.z, duration: 2.8, ease: "power3.inOut" }, 0)
        .fromTo(c.nucleo.position, { y: 6 }, { y: Y, duration: 0.8, ease: "bounce.out" }, 0.3)
        .fromTo(c.vidrio.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "back.out(1.6)" }, 1.0)
        .fromTo(c.filos.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.8, ease: "back.out(1.6)" }, 1.0)
        .fromTo(c.crece, { v: 0 }, { v: 1, duration: 1.4, ease: "power2.out" }, 1.4)
        .fromTo([c.moneda.scale, c.tecla.scale], { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.out(2)", stagger: 0.12 }, 2.1)
        .set(c.silencio, { v: 0 }, 0)
        .set(c.moneda.rotation, { x: 0 }, 0);
    }

    // Paso 1: un mover() en cámara lenta, línea por línea
    tl.addLabel("p1", 3.4);
    let en = tl.labels.p1;
    const linea = (i, a, dur = 0.7) => tl.fromTo(c.lineas[i], { "--paso": 0 }, { "--paso": 1, duration: 0.2, immediateRender: false }, a).to(c.lineas[i], { "--paso": 0.25, duration: 0.4 }, a + dur);
    linea(0, en, 4.8);
    volar(tl, c, en + 0.1, "mover(DERECHA)");
    linea(1, en + 0.8);
    foto(tl, c, en + 0.9);
    linea(2, en + 1.6);
    delegar(tl, c, en + 1.7);
    linea(3, en + 2.5);
    foto(tl, c, en + 2.6);
    linea(4, en + 3.3, 1.5);
    motivo(tl, c, en + 3.3, "empujó una caja: hay un empuje más");
    sonar(tl, c, en + 3.6, "EMPUJE");
    en += 5.4;

    // Paso 2: cada situación, su efecto
    tl.addLabel("p2", en);
    SITUACIONES.forEach((s, i) => {
      const a = en + 0.2 + i * 1.55;
      volar(tl, c, a, s.llamada);
      delegar(tl, c, a + 0.55);
      motivo(tl, c, a + 0.8, s.motivo);
      sonar(tl, c, a + 1.0, s.sonido);
    });
    en += 0.2 + SITUACIONES.length * 1.55 + 0.6;

    // Paso 3: la tecla M cambia el estado; silenciado, el pedido llega pero no suena; otra M, y vuelve
    tl.addLabel("p3", en);
    tecla(tl, c, en + 0.2, 1);
    volar(tl, c, en + 1.6, "mover(ARRIBA)");
    delegar(tl, c, en + 2.15);
    motivo(tl, c, en + 2.4, "reproducir(clip): en silencio no hace nada");
    tecla(tl, c, en + 4.3, 0);
    volar(tl, c, en + 5.6, "mover(DERECHA)");
    delegar(tl, c, en + 6.15);
    motivo(tl, c, en + 6.4, "empujó una caja");
    sonar(tl, c, en + 6.6, "EMPUJE");
  },

  vida(c) {
    const vidas = [];
    if (c.w) {
      const tick = (tt) => {
        c.w.deriva.set(Math.sin(tt * 0.11) * 0.6, Math.sin(tt * 0.16 + 1) * 0.3, 0);
        c.nucleo.rotation.y = Math.sin(tt * 0.3) * 0.12;
        c.polvo.rotation.y = tt * 0.015;
        c.arcos.forEach((a, i) => { if (a.luz < 0.2) a.luz = 0.12 + Math.max(0, Math.sin(tt * (0.6 + i * 0.07) + i)) * 0.06; });
      };
      gsap.ticker.add(tick);
      vidas.push({ kill: () => gsap.ticker.remove(tick) });
    }
    // Una partida que sigue: pedidos al azar, cada uno con su efecto (si el sonido está activado)
    vidas.push(eventos(() => {
      if (c.entrada.v < 1 || c.silencio.v > 0.5) return;
      const s = gsap.utils.random(PARTIDA);
      const v = gsap.timeline();
      volar(v, c, 0, s.llamada);
      delegar(v, c, 0.55);
      motivo(v, c, 0.8, s.motivo);
      sonar(v, c, 1.0, s.sonido);
    }, [2.2, 3.6]));
    return juntas(...vidas);
  },

  desmontar(c) { if (c.w) c.w.destruir(); },
};

/* ── Piezas de la coreografía: cada una agrega sus tweens al timeline que recibe ── */

/** El pedido sale de la vista (a la izquierda) y entra al vidrio. */
function volar(tl, c, en, texto) {
  const p = { f: 0 };
  tl.fromTo(p, { f: 0 }, { f: 1, duration: 0.55, ease: "power2.inOut", immediateRender: false,
    onStart: () => { c.llamada.textContent = texto; },
    onUpdate: () => {
      c.llamada.textContent = texto;
      const d = c.puertaPx || { x: 1100, y: 640 };
      anclar(c.llamadaA, { x: 760 + (d.x - 760) * p.f, y: 470 + (d.y - 470) * p.f - Math.sin(p.f * Math.PI) * 70 });
    } }, en)
    .fromTo(c.llamada, { autoAlpha: 0, scale: 0.8 }, { autoAlpha: 1, scale: 1, duration: 0.15, immediateRender: false }, en)
    .to(c.llamada, { autoAlpha: 0, scale: 0.5, duration: 0.15 }, en + 0.5);
  if (c.w) tl.fromTo(c.vidrio.material, { emissiveIntensity: 0.25 }, { emissiveIntensity: 0.9, duration: 0.1, immediateRender: false }, en + 0.5).to(c.vidrio.material, { emissiveIntensity: 0.25, duration: 0.6 }, en + 0.6);
}

/** El vidrio le pasa el pedido a la caja de adentro: la caja late. */
function delegar(tl, c, en) {
  if (!c.w) return;
  tl.fromTo(c.nucleo.scale, { x: 1, y: 1, z: 1 }, { x: 1.1, y: 0.9, z: 1.1, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, en)
    .fromTo(c.nucleo.material, { emissiveIntensity: 0.05 }, { emissiveIntensity: 0.8, duration: 0.1, immediateRender: false }, en)
    .to(c.nucleo.material, { emissiveIntensity: 0.05, duration: 0.6 }, en + 0.1);
}

/** Una foto EstadoJuego: un destello de la caja de adentro hacia el vidrio. */
function foto(tl, c, en) {
  if (!c.w) return;
  tl.fromTo(c.pulso.material, { opacity: 0 }, { opacity: 1, duration: 0.1, immediateRender: false }, en)
    .fromTo(c.pulso.position, { x: 0, y: Y, z: 0 }, { x: 0, y: Y + VIDRIO / 2, z: VIDRIO / 2, duration: 0.45, ease: "power2.out", immediateRender: false }, en)
    .to(c.pulso.material, { opacity: 0, duration: 0.2 }, en + 0.4);
}

/** Por qué suena lo que suena: lo que cambió entre antes y después. */
function motivo(tl, c, en, texto) {
  tl.fromTo(c.motivo, { autoAlpha: 0, x: -10 }, { autoAlpha: 1, x: 0, duration: 0.25, immediateRender: false, onStart: () => { c.motivo.textContent = texto; }, onUpdate: () => { c.motivo.textContent = texto; } }, en)
    .to(c.motivo, { autoAlpha: 0, duration: 0.25 }, en + 1.3);
}

/** Suena un efecto: ondas desde el vidrio, se enciende su arco con la onda real y su nombre en la lista. */
function sonar(tl, c, en, clave) {
  const i = indice(clave), s = SONIDOS[i];
  const fila = c.filas[i];
  tl.fromTo(fila, { "--luz": 0 }, { "--luz": 1, duration: 0.12, immediateRender: false }, en).to(fila, { "--luz": 0, duration: 1 }, en + 0.6);
  tl.fromTo(c.efecto, { autoAlpha: 0, y: 12, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: false,
    onStart: () => { c.activo = i; c.efectoNombre.textContent = s.clave; c.efectoDato.textContent = `${s.archivo} · ${s.seg.toLocaleString("es-AR")} s`; },
    onUpdate: () => { c.activo = i; c.efectoNombre.textContent = s.clave; c.efectoDato.textContent = `${s.archivo} · ${s.seg.toLocaleString("es-AR")} s`; } }, en + 0.25)
    .to(c.efecto, { autoAlpha: 0, duration: 0.3 }, en + 1.3);
  if (!c.w) return;
  const arco = c.arcos[i];
  tl.fromTo(arco, { luz: 0.12 }, { luz: 1, duration: 0.15, immediateRender: false }, en + 0.3)
    .to(arco, { luz: 0.12, duration: 1.4, ease: "power2.in" }, en + 0.6)
    .fromTo(arco, { k: 0 }, { k: 1, duration: Math.min(1.6, Math.max(0.6, s.seg * 1.6)), ease: "none", immediateRender: false }, en + 0.3)
    .set(arco, { k: 0 }, en + 0.3 + Math.min(1.6, Math.max(0.6, s.seg * 1.6)) + 0.01);
  c.ondas.forEach((o, j) => {
    tl.fromTo(o.scale, { x: 1, y: 1, z: 1 }, { x: R / (VIDRIO * 0.62), y: R / (VIDRIO * 0.62), z: 1, duration: 0.55, ease: "power1.out", immediateRender: false }, en + j * 0.09)
      .fromTo(o.material, { opacity: 0.9 }, { opacity: 0, duration: 0.55, ease: "power1.in", immediateRender: false }, en + j * 0.09);
  });
}

/** La tecla M: se hunde, la moneda se da vuelta y el estado cambia. a = 1 silencia, a = 0 activa. */
function tecla(tl, c, en, a) {
  tl.fromTo(c.teclaTxt, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.25, immediateRender: false }, en)
    .to(c.teclaTxt, { autoAlpha: 0, duration: 0.3 }, en + 1.4)
    .fromTo(c.caras[a], { autoAlpha: 0, rotationX: -90 }, { autoAlpha: 1, rotationX: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, en + 0.45)
    .fromTo(c.caras[1 - a], { autoAlpha: 1, rotationX: 0 }, { autoAlpha: 0, rotationX: 90, duration: 0.35, ease: "power2.in", immediateRender: false }, en + 0.2)
    .fromTo(c.silencio, { v: 1 - a }, { v: a, duration: 0.6, immediateRender: false }, en + 0.3);
  if (!c.w) return;
  tl.fromTo(c.tapa.position, { y: 0.4 }, { y: 0.26, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.in", immediateRender: false }, en)
    .fromTo(c.moneda.rotation, { x: (1 - a) * Math.PI }, { x: a * Math.PI, duration: 0.8, ease: "back.out(1.4)", immediateRender: false }, en + 0.15)
    .fromTo(c.moneda.position, { y: 0.75 }, { y: 1.35, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, en + 0.1);
}
