import * as THREE from "three";
import { gsap } from "gsap";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { t, el, pixel, juntas, reducido, offsetEn } from "../util.js";
import { USADAS } from "../datos.js";
import { mundo3d, textura, chispa, haz, anclar } from "./patrones3d.js";

/*
 * Singleton. Una sola bóveda (la instancia de Imagenes) con 28 casilleros, uno por imagen que usa el juego.
 * Los tres clientes de la vista piden imágenes; la primera vez que se pide una, la bóveda la lee del disco
 * (assets/) y la guarda; después responde sola. Los pedidos crecen sin parar y las lecturas se frenan en 28.
 * Al entrar se crea la instancia (la primera llamada real es de PanelHUD, al armar sus botones);
 * en el paso 1, un new Imagenes() rebota contra el constructor privado; en el paso 2 la sesión se acelera.
 */

/** Niveles de JuegoDePrueba (para contar cuántas veces pide imágenes cada repintado del tablero). */
const NIVELES = [
  ["#######", "#     #", "# @$ .#", "#     #", "#######"],
  ["#######", "#.    #", "#  #  #", "# $#  #", "#  @  #", "#######"],
  ["########", "#  .   #", "# $##$ #", "#   @ .#", "########"],
];
const EPOCA = [
  { fondo: "backgrounds/background_hill_valley_1955", piso: "tiles/floor_1955", pared: "tiles/wall_brick" },
  { fondo: "backgrounds/background_mall_1985", piso: "tiles/floor_1985", pared: "tiles/wall_mall" },
  { fondo: "backgrounds/background_future_2015", piso: "tiles/floor_2015", pared: "tiles/wall_future" },
];
const CAPAS = { "#": 1, " ": 1, ".": 2, "@": 2, "+": 3, "$": 2, "*": 2 }; // capas por símbolo en PanelTablero
/** obtener() que hace un repintado del tablero: el fondo más cada capa de cada celda. */
const pedidosPorRepintado = (nivel) => 1 + nivel.join("").split("").reduce((a, s) => a + (CAPAS[s] || 1), 0);
const JUGADOR = ["characters/player_down", "characters/player_up", "characters/player_left", "characters/player_right"];
const DOMINIO = ["boxes/caja_fragil_intacta", "boxes/caja_llave", "tiles/terreno_resbaladizo", "tiles/cerrojo_cerrado", "tiles/muro_cerrado", "tiles/muro_abierto"];
const CLIENTES = ["MenuPrincipal", "PanelHUD", "PanelTablero"];
const COLS = 7, PASO = 0.62, LADO = 0.5;
const BOVEDA = new THREE.Vector3(0, 1.9, 0), DISCO = new THREE.Vector3(6.6, 0.2, 0.6);
const CAMARA = new THREE.Vector3(-0.1, 5.9, 22), MIRA = new THREE.Vector3(1.3, 2.45, 0);
const numero = (n) => n.toLocaleString("es-AR");

/** Una sesión de juego simulada: menú, niveles de las tres épocas, movimientos y, al final, niveles del dominio. */
function crearSesion() {
  let paso = 0, nivel = 0, movs = 0;
  return () => {
    paso += 1;
    if (paso === 1) return [{ cliente: 1, claves: ["ui/boton_undo", "ui/boton_restart", "ui/boton_pause"], cuantos: 3 }];
    if (paso === 2) return [{ cliente: 0, claves: ["backgrounds/background_mall_1985"], cuantos: 1 }];
    const ep = EPOCA[nivel % 3], dominio = nivel >= 3;
    const mira = movs === 0 ? JUGADOR[0] : gsap.utils.random(JUGADOR);
    const caja = Math.random() < 0.3 ? "goals/goal_placed" : "boxes/box_wood";
    const tablero = [ep.fondo, ep.piso, ep.pared, "goals/goal", caja, mira];
    if (dominio) tablero.push(gsap.utils.random(DOMINIO));
    movs += 1;
    if (movs > gsap.utils.random(5, 9, 1)) { movs = 0; nivel += 1; if (Math.random() < 0.4) return [{ cliente: 0, claves: ["backgrounds/background_mall_1985"], cuantos: 1 }]; }
    return [
      { cliente: 1, claves: ["ui/indicador_nivel", "ui/indicador_movimientos", "ui/indicador_empujes"], cuantos: 3 },
      { cliente: 2, claves: tablero, cuantos: pedidosPorRepintado(NIVELES[nivel % 3]) },
    ];
  };
}

function armarEscena(w) {
  const { escena } = w;
  escena.add(new THREE.HemisphereLight(t("tinta-2"), t("fondo-hondo"), 1.3));
  const sol = new THREE.DirectionalLight(t("titulo"), 1.8);
  sol.position.set(-4, 9, 10);
  escena.add(sol);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ map: textura("tiles/floor_1955", 90), color: t("superficie-2"), roughness: 0.95 }));
  piso.rotation.x = -Math.PI / 2;
  piso.position.y = -0.4;
  escena.add(piso);

  // La bóveda: la única instancia, con un casillero por imagen
  const boveda = new THREE.Group();
  boveda.position.copy(BOVEDA);
  escena.add(boveda);
  const filas = Math.ceil(USADAS.length / COLS);
  const ancho = COLS * PASO + 0.5, alto = filas * PASO + 0.5;
  const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(ancho, alto, 1.6, 4, 0.14), new THREE.MeshStandardMaterial({ color: t("superficie-2"), roughness: 0.55, metalness: 0.15 }));
  cuerpo.position.z = -0.8;
  boveda.add(cuerpo);
  const marco = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(ancho + 0.04, alto + 0.04, 1.64)), new THREE.LineBasicMaterial({ color: new THREE.Color(t("linea")), transparent: true, opacity: 0.7 }));
  marco.position.z = -0.8;
  boveda.add(marco);
  const zocalo = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.5, 0.3, 64), new THREE.MeshStandardMaterial({ color: t("superficie"), roughness: 0.5, metalness: 0.4 }));
  zocalo.position.set(0, -BOVEDA.y - 0.25, -0.8);
  boveda.add(zocalo);
  // Halo de la única instancia: dos arcos que giran alrededor de la bóveda
  const halo = new THREE.Group();
  halo.position.z = -0.2;
  boveda.add(halo);
  const matHalo = new THREE.MeshBasicMaterial({ color: new THREE.Color(t("acento")), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  [0, Math.PI].forEach((giro) => { const a = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.03, 8, 160, Math.PI * 0.7), matHalo); a.rotation.z = giro; halo.add(a); });
  const matHalo2 = matHalo.clone();
  matHalo2.color.set(t("linea"));
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(3.45, 0.012, 6, 220), matHalo2);
  halo.add(anillo);
  // Marcos de los casilleros
  const lineas = [];
  for (let i = 0; i < USADAS.length; i++) {
    const p = new THREE.Vector3(((i % COLS) - (COLS - 1) / 2) * PASO, ((filas - 1) / 2 - Math.floor(i / COLS)) * PASO, 0.025);
    const h = LADO / 2 + 0.03;
    [[-h, -h, h, -h], [h, -h, h, h], [h, h, -h, h], [-h, h, -h, -h]].forEach(([x1, y1, x2, y2]) => lineas.push(p.x + x1, p.y + y1, p.z, p.x + x2, p.y + y2, p.z));
  }
  const marcos = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: new THREE.Color(t("linea")), transparent: true, opacity: 0.35 }));
  marcos.geometry.setAttribute("position", new THREE.Float32BufferAttribute(lineas, 3));
  boveda.add(marcos);
  const posCasillero = (i) => new THREE.Vector3(((i % COLS) - (COLS - 1) / 2) * PASO, ((filas - 1) / 2 - Math.floor(i / COLS)) * PASO, 0.02);
  const geoLado = new THREE.PlaneGeometry(LADO, LADO);
  const casilleros = USADAS.map((k, i) => {
    const p = posCasillero(i);
    const hueco = new THREE.Mesh(geoLado, new THREE.MeshBasicMaterial({ color: new THREE.Color(t("superficie")) }));
    hueco.position.copy(p);
    boveda.add(hueco);
    const imagen = new THREE.Mesh(geoLado, new THREE.MeshBasicMaterial({ map: textura(k), transparent: true, opacity: 0, toneMapped: false }));
    imagen.position.copy(p).setZ(0.034);
    boveda.add(imagen);
    const luz = new THREE.Mesh(new THREE.PlaneGeometry(LADO * 1.3, LADO * 1.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(t("exito")), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    luz.position.copy(p).setZ(0.026); // detrás de la imagen: brilla el borde, la imagen se sigue viendo
    boveda.add(luz);
    return { hueco, imagen, luz };
  });
  const cerrojo = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: textura("tiles/cerrojo_cerrado"), transparent: true, opacity: 0, toneMapped: false }));
  cerrojo.position.set(-ancho / 2 - 0.85, 0.2, 0.3);
  boveda.add(cerrojo);

  // El disco: assets/ como un fichero con las 28 imágenes de pie
  const disco = new THREE.Group();
  disco.position.copy(DISCO);
  disco.rotation.y = -0.2;
  disco.scale.setScalar(1.3);
  escena.add(disco);
  const bandeja = new THREE.Mesh(new RoundedBoxGeometry(COLS * 0.56 + 0.5, 0.35, 4 * 0.62 + 0.4, 3, 0.08), new THREE.MeshStandardMaterial({ color: t("superficie"), roughness: 0.6, metalness: 0.3 }));
  disco.add(bandeja);
  const fichas = USADAS.map((k, i) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.46), new THREE.MeshStandardMaterial({ map: textura(k), roughness: 0.8, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0, side: THREE.DoubleSide }));
    f.position.set(((i % COLS) - (COLS - 1) / 2) * 0.56, 0.42, (Math.floor(i / COLS) - 1.5) * 0.62);
    f.rotation.x = -0.55;
    disco.add(f);
    return f;
  });

  const viajeros = Array.from({ length: 8 }, () => {
    const m = new THREE.Mesh(geoLado, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, toneMapped: false, depthWrite: false, side: THREE.DoubleSide }));
    m.frustumCulled = false;
    escena.add(m);
    return m;
  });
  const chispas = Array.from({ length: 40 }, () => { const s = chispa("exito", 0.32); escena.add(s); return s; });
  return { boveda, halo, casilleros, cerrojo, disco, fichas, viajeros, chispas, ancho, alto };
}

export default {
  montar(lienzo) {
    const w = mundo3d(lienzo, { descripcion: "Patrón Singleton: tres clientes piden imágenes a una única caché que lee cada archivo una sola vez", fov: 30, resplandor: [0.75, 0.5, 0.78] });
    el("div", "sin__velo", lienzo);
    const c = { w, lienzo, cache: new Set(), pedidos: 0, porCliente: [0, 0, 0], libre: 0, entrada: { v: 0 }, ritmo: { v: 1 }, sesion: crearSesion() };

    c.clientes = CLIENTES.map((n, i) => {
      const caja = el("div", "sin__cliente pos", lienzo, { vars: { x: 120, y: 410 + i * 196 } });
      el("p", "sin__rotulo", caja, { texto: "cliente" });
      el("p", "sin__nombre", caja, { texto: n });
      const cuenta = el("p", "sin__cuenta", caja, { texto: "0 pedidos" });
      const o = offsetEn(caja, lienzo);
      return { caja, cuenta, x: o.x + o.w, y: o.y + o.h / 2 };
    });

    c.bovedaA = el("div", "sin__ancla sin__ancla--arriba", lienzo);
    const rot = el("div", "sin__cartel", c.bovedaA);
    el("p", "sin__titulo", rot, { html: "Imagenes <span>la única instancia</span>" });
    c.instancia = el("code", "sin__codigo", rot, { texto: "instancia == null" });
    c.discoA = el("div", "sin__ancla sin__ancla--arriba", lienzo);
    const rd = el("div", "sin__cartel sin__cartel--disco", c.discoA);
    el("p", "sin__titulo", rd, { html: "assets/ <span>en disco, 28 PNG</span>" });
    el("code", "sin__codigo", rd, { texto: "cargar(ruta): ImageIO.read" });

    c.cuentas = el("div", "sin__cuentas", lienzo);
    const caja1 = el("div", "sin__cifra", c.cuentas);
    c.nPedidos = el("b", "sin__numero sin__numero--pedidos", caja1, { texto: "0" });
    el("span", "", caja1, { html: "pedidos a la caché, <code>obtener(ruta)</code>" });
    const caja2 = el("div", "sin__cifra", c.cuentas);
    c.nLecturas = el("b", "sin__numero", caja2, { texto: "0" });
    el("span", "", caja2, { html: `lecturas del disco, tope ${USADAS.length}: las imágenes que usa el juego` });
    c.simulado = el("p", "sin__simulado", c.cuentas, { texto: "Simulación de una sesión de juego" });

    c.intentoA = el("div", "sin__ancla", lienzo);
    c.intento = el("code", "sin__intento", c.intentoA, { texto: "new Imagenes()" });
    c.privadoA = el("div", "sin__ancla sin__ancla--izq", lienzo);
    c.privado = el("p", "sin__privado", c.privadoA, { html: "<code>private Imagenes()</code> nadie más puede crear otra" });
    c.primeraA = el("div", "sin__ancla", lienzo);
    c.primera = el("code", "sin__intento sin__intento--ok", c.primeraA, { texto: "obtenerInstancia()" });

    if (w) {
      Object.assign(c, armarEscena(w));
      w.camara.position.copy(CAMARA);
      w.mira.copy(MIRA);
      w.camara.lookAt(w.mira);
      w.camara.updateMatrixWorld();
      w.preparar();
      const plano = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      c.desdeCliente = c.clientes.map((cl) => w.enPlano(cl.x, cl.y, plano) || new THREE.Vector3(-8, 1, 0));
      c.referencias = c.desdeCliente.map((p) => {
        const fin = BOVEDA.clone().add(new THREE.Vector3(-c.ancho / 2, 0, -0.4));
        const curva = new THREE.QuadraticBezierCurve3(p, p.clone().lerp(fin, 0.5).setY(p.y + 0.4).setZ(1.2), fin);
        const h = haz(curva, "linea", 0.025, 0.4);
        h.userData.dibujar(0);
        w.escena.add(h);
        return { curva, haz: h };
      });
      const tmp = new THREE.Vector3();
      w.cadaCuadro(() => {
        anclar(c.bovedaA, w.proyectar(tmp.copy(BOVEDA).setY(BOVEDA.y + c.alto / 2 + 0.25)));
        anclar(c.discoA, w.proyectar(tmp.copy(DISCO).setY(1.9)));
        anclar(c.privadoA, w.proyectar(tmp.copy(BOVEDA).setY(BOVEDA.y - c.alto / 2 - 0.55).setZ(0.4)));
        c.bovedaPx = w.proyectar(tmp.copy(BOVEDA).setX(BOVEDA.x - c.ancho / 2 - 0.1));
      });
    } else {
      // Sin WebGL: la bóveda como grilla 2D que se va llenando
      const grilla = el("div", "sin__respaldo pos", lienzo, { vars: { x: 620, y: 470 } });
      c.ranuras = USADAS.map(() => el("div", "", grilla));
      anclar(c.bovedaA, { x: 870, y: 450 });
      anclar(c.discoA, { x: 1500, y: 450 });
      anclar(c.privadoA, { x: 840, y: 760 });
      c.bovedaPx = { x: 600, y: 640 };
    }
    if (reducido()) { // sin movimiento: la sesión ya ocurrió
      USADAS.forEach((k, i) => guardar(c, i));
      c.pedidos = 2400;
      c.nPedidos.textContent = numero(c.pedidos);
    }
    return c;
  },

  construir(tl, c) {
    tl.set([c.intento, c.privado], { autoAlpha: 0 }, 0)
      .fromTo(c.entrada, { v: 0 }, { v: 1, duration: 3.2, ease: "none" }, 0)
      .fromTo(c.clientes.map((cl) => cl.caja), { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 }, 0.4)
      .fromTo(c.cuentas, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 2.6)
      .fromTo(c.discoA.firstChild, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 1.2);
    // La primera llamada: PanelHUD arma sus botones y obtenerInstancia() encuentra null
    const ida = { f: 0 };
    tl.fromTo(ida, { f: 0 }, { f: 1, duration: 0.8, ease: "power2.inOut", onUpdate: () => {
      const a = c.clientes[1], b = c.bovedaPx || { x: 600, y: 640 };
      anclar(c.primeraA, { x: a.x + (b.x - a.x) * ida.f + 90, y: a.y + (b.y - a.y) * ida.f - Math.sin(ida.f * Math.PI) * 50 });
    } }, 0.9)
      .fromTo(c.primera, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, 0.9)
      .to(c.primera, { autoAlpha: 0, duration: 0.25 }, 1.7)
      .fromTo(c.bovedaA.firstChild, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 1.6)
      .fromTo(c.instancia, { "--ok": 0 }, { "--ok": 1, duration: 0.4, onUpdate: () => { c.instancia.textContent = gsap.getProperty(c.instancia, "--ok") > 0.5 ? "instancia = new Imagenes()" : "instancia == null"; } }, 1.9);
    if (c.w) {
      const { camara } = c.w;
      tl.fromTo(camara.position, { x: 6, y: 13, z: 9 }, { x: CAMARA.x, y: CAMARA.y, z: CAMARA.z, duration: 2.8, ease: "power3.inOut" }, 0)
        .fromTo(c.boveda.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1, y: 1, z: 1, duration: 0.9, ease: "back.out(1.5)" }, 1.6)
        .fromTo(c.boveda.rotation, { y: -1.2 }, { y: 0, duration: 1.2, ease: "power3.out" }, 1.6)
        .fromTo(c.disco.scale, { x: 0.001, y: 0.001, z: 0.001 }, { x: 1.3, y: 1.3, z: 1.3, duration: 0.7, ease: "power3.out" }, 1)
        .fromTo(c.halo.scale, { x: 0.3, y: 0.3 }, { x: 1, y: 1, duration: 1.2, ease: "power3.out" }, 2);
      c.referencias.forEach((r, i) => {
        const avance = { f: 0 };
        tl.fromTo(avance, { f: 0 }, { f: 1, duration: 0.8, ease: "power2.inOut", onUpdate: () => r.haz.userData.dibujar(avance.f) }, 2.4 + i * 0.15);
      });
    }

    // Paso 1: otra instancia es imposible, el constructor es privado
    tl.addLabel("p1");
    const intento = { f: 0 };
    tl.fromTo(intento, { f: 0 }, { f: 1, duration: 1.6, ease: "none", onUpdate: () => {
      const a = c.clientes[0], b = c.bovedaPx || { x: 600, y: 640 };
      const f = intento.f < 0.55 ? intento.f / 0.55 : 1 - ((intento.f - 0.55) / 0.45) * 0.35; // va, choca y rebota
      anclar(c.intentoA, { x: a.x + 90 + (b.x - 90 - a.x) * f, y: a.y + (b.y - a.y) * f - Math.sin(f * Math.PI) * 40 });
    } }, "p1")
      .fromTo(c.intento, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 }, "p1")
      .fromTo(c.intento, { rotation: 0 }, { rotation: -14, duration: 0.3, ease: "power2.out" }, "p1+=0.9")
      .to(c.intento, { autoAlpha: 0.0, duration: 0.5 }, "p1+=1.5")
      .fromTo(c.privado, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "p1+=1");
    if (c.w) {
      tl.fromTo(c.cerrojo.material, { opacity: 0 }, { opacity: 1, duration: 0.2 }, "p1+=0.8")
        .fromTo(c.cerrojo.scale, { x: 1.8, y: 1.8 }, { x: 1, y: 1, duration: 0.5, ease: "back.out(2)" }, "p1+=0.8")
        .fromTo(c.boveda.position, { x: BOVEDA.x }, { x: BOVEDA.x + 0.08, duration: 0.06, yoyo: true, repeat: 3 }, "p1+=0.88");
    }

    // Paso 2: toda una sesión, acelerada; las lecturas no pasan de 28
    tl.addLabel("p2");
    tl.fromTo(c.ritmo, { v: 1 }, { v: 6, duration: 1.2, ease: "power2.in" }, "p2")
      .fromTo(c.simulado, { "--rapido": 0 }, { "--rapido": 1, duration: 0.4, onUpdate: () => { c.simulado.textContent = c.ritmo.v > 3 ? "Simulación acelerada de una sesión de juego" : "Simulación de una sesión de juego"; } }, "p2+=0.8");
    if (c.w) tl.to(c.w.camara.position, { x: CAMARA.x + 1, y: CAMARA.y + 0.8, z: CAMARA.z + 2.2, duration: 1.4, ease: "power2.inOut" }, "p2");
  },

  vida(c) {
    const vidas = [];
    if (c.w) {
      const tick = (tt) => {
        c.w.deriva.set(Math.sin(tt * 0.12) * 0.5, Math.sin(tt * 0.17 + 0.4) * 0.3, 0);
        c.halo.children[0].rotation.z = tt * 0.3;
        c.halo.children[1].rotation.z = Math.PI + tt * 0.3;
        c.halo.children[0].material.opacity = 0.45 + Math.sin(tt * 1.1) * 0.12;
      };
      gsap.ticker.add(tick);
      vidas.push({ kill: () => gsap.ticker.remove(tick) });
    }
    let vivo = true;
    const uno = () => {
      if (!vivo) return;
      if (c.entrada.v >= 1) c.sesion().forEach((ev, i) => gsap.delayedCall((i * 0.25) / c.ritmo.v, () => vivo && pedir(c, ev)));
      gsap.delayedCall(gsap.utils.random(0.7, 1.5) / c.ritmo.v, uno);
    };
    gsap.delayedCall(0.4, uno);
    vidas.push({ kill: () => { vivo = false; } });
    return juntas(...vidas);
  },

  desmontar(c) { if (c.w) c.w.destruir(); },
};

/** Un repintado de un cliente: cuenta todos sus obtener() y dibuja un paquete por imagen distinta. */
function pedir(c, { cliente, claves, cuantos }) {
  c.pedidos += cuantos;
  c.porCliente[cliente] += cuantos;
  c.nPedidos.textContent = numero(c.pedidos);
  c.clientes[cliente].cuenta.textContent = numero(c.porCliente[cliente]) + " pedidos";
  gsap.fromTo(c.clientes[cliente].caja, { "--golpe": 1 }, { "--golpe": 0, duration: 0.6 });
  claves.forEach((k, j) => {
    const i = USADAS.indexOf(k);
    if (i < 0) return;
    gsap.delayedCall((j * 0.07) / c.ritmo.v, () => paquete(c, cliente, i));
  });
}

function paquete(c, cliente, i) {
  const nueva = !c.cache.has(i) && !c.leyendo?.has(i);
  if (!c.w) {
    if (nueva) { c.leyendo = c.leyendo || new Set(); c.leyendo.add(i); gsap.delayedCall(0.4, () => guardar(c, i)); }
    return;
  }
  const r = 1 / Math.max(1, c.ritmo.v * 0.6);
  const s = c.chispas[c.libre++ % c.chispas.length];
  const casillero = c.casilleros[i].hueco.getWorldPosition(new THREE.Vector3());
  const ida = new THREE.QuadraticBezierCurve3(c.desdeCliente[cliente], c.desdeCliente[cliente].clone().lerp(casillero, 0.5).setZ(2.2), casillero);
  s.material.color.set(t("exito"));
  volar(s, ida, 0.6 * r, () => {
    if (nueva) { c.leyendo = c.leyendo || new Set(); c.leyendo.add(i); leer(c, i, r); return; }
    golpe(c, i);
    gsap.delayedCall(0.1, () => { s.material.color.set(t("exito")); volar(s, new THREE.QuadraticBezierCurve3(casillero, casillero.clone().lerp(c.desdeCliente[cliente], 0.5).setZ(2.6).setY(casillero.y - 1), c.desdeCliente[cliente]), 0.55 * r, () => {}); });
  });
}

function volar(s, curva, dur, fin) {
  const prog = { f: 0 };
  gsap.fromTo(prog, { f: 0 }, { f: 1, duration: dur, ease: "power1.inOut",
    onUpdate: () => { curva.getPoint(prog.f, s.position); s.material.opacity = Math.min(1, Math.sin(prog.f * Math.PI) * 2.5); },
    onComplete: () => { s.material.opacity = 0; fin(); } });
}

/** Primera vez: la bóveda va al disco, la imagen viaja y queda guardada en su casillero. */
function leer(c, i, r) {
  const ficha = c.fichas[i];
  const desde = ficha.getWorldPosition(new THREE.Vector3());
  const hasta = c.casilleros[i].imagen.getWorldPosition(new THREE.Vector3());
  gsap.fromTo(ficha.material, { emissiveIntensity: 0.55 }, { emissiveIntensity: 0, duration: 1 });
  gsap.fromTo(ficha.position, { y: 0.42 }, { y: 0.75, duration: 0.18, yoyo: true, repeat: 1 });
  const v = c.viajeros.find((m) => m.material.opacity === 0) || c.viajeros[0];
  v.material.map = ficha.material.map;
  v.material.needsUpdate = true;
  const curva = new THREE.QuadraticBezierCurve3(desde, desde.clone().lerp(hasta, 0.5).setY(Math.max(desde.y, hasta.y) + 2.2).setZ(1.8), hasta);
  const prog = { f: 0 };
  gsap.fromTo(prog, { f: 0 }, { f: 1, duration: 0.9 * r, ease: "power2.inOut",
    onStart: () => { v.material.opacity = 1; },
    onUpdate: () => { curva.getPoint(prog.f, v.position); v.rotation.y = (1 - prog.f) * Math.PI * 2; v.scale.setScalar(1 + Math.sin(prog.f * Math.PI) * 0.8); },
    onComplete: () => { v.material.opacity = 0; guardar(c, i); } });
}

function guardar(c, i) {
  if (c.cache.has(i)) return;
  c.cache.add(i);
  c.nLecturas.textContent = numero(c.cache.size);
  gsap.fromTo(c.nLecturas, { "--golpe": 1 }, { "--golpe": 0, duration: 0.8 });
  if (c.casilleros) {
    c.casilleros[i].imagen.material.opacity = 1;
    gsap.fromTo(c.casilleros[i].imagen.scale, { x: 1.5, y: 1.5 }, { x: 1, y: 1, duration: 0.4, ease: "back.out(2)" });
    golpe(c, i, "acento");
  }
  if (c.ranuras) { c.ranuras[i].classList.add("sin__ranura--llena"); pixel(USADAS[i], c.ranuras[i], ""); }
}

function golpe(c, i, color = "exito") {
  const luz = c.casilleros[i].luz;
  luz.material.color.set(t(color));
  gsap.fromTo(luz.material, { opacity: 0.9 }, { opacity: 0, duration: 0.6 });
}
