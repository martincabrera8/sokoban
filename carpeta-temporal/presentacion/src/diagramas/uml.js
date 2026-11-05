import * as THREE from "three";
import { gsap } from "gsap";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { t, el, s, eventos, juntas } from "../util.js";
import { crearVista, cargando, orbitar } from "../vista3d.js";

/*
 * El plano real (docs/uml/2-diagrama-completo.svg) apoyado en una mesa 3D.
 * Se imprime con un haz de luz; las clases se levantan del papel en capas, una por autor (los colores
 * y los nombres salen de la leyenda del propio SVG). Después la cámara recorre las zonas: en cada una
 * las flechas reales se encienden en el sentido de la dependencia y el resto del plano queda en penumbra.
 */
const U = 100;                 // unidades del SVG por metro de la escena
const ESP = 0.05;              // espesor de cada caja
/* Resolución de las texturas (px por unidad del SVG). En la toma más cercana una unidad ocupa unos 2,3 px de pantalla:
   las cajas (con los nombres) van a 2,4 y el papel (líneas y huellas) a 1,25. Antes eran 2 y 3: unos 98 MB de video. */
const ESC_PAPEL = 1.25, ESC_CAJA = 2.4;
const REGION = { x: 640, w: 1240, y: 70, h: 960 }; // dónde se encuadra el plano, en px del escenario
const CORRE = REGION.x + REGION.w / 2 - 960;          // corrimiento del centro óptico hacia la derecha
const ALTURA = [1.5, 2.6, 3.6, 4.6];                // capas: Luca, integración, Martín, pendiente

/* Recorrido. Cada toma es un rectángulo del SVG (x0, y0, x1, y1) y la inclinación de la cámara. */
const TOMA = {
  general: [0, 70, 2290, 1640, 0.62],
  capas: [80, -520, 2620, 1500, 1.12],
  arranque: [250, 70, 990, 660, 0.36],
  menu: [30, 380, 760, 900, 0.36],
  paneles: [360, 700, 1110, 1330, 0.36],
  frontera: [880, 230, 1760, 1110, 0.4],
  contrato: [1180, 240, 1720, 690, 0.32],
  prueba: [1790, 110, 2270, 820, 0.3],
  pendientes: [1780, 770, 2250, 1270, 0.32],
};
const ZONAS = [
  { nombre: "Vista", detalle: "Las pantallas de Luca. Cada una contiene a la siguiente y todas piden imágenes a la misma caché.", tomas: ["arranque", "menu", "paneles"] },
  { nombre: "Contrato", detalle: "Las flechas que salen de la vista terminan acá. Nunca tocan JuegoDePrueba.", tomas: ["frontera", "contrato"] },
  { nombre: "Prueba y pendientes", detalle: "JuegoDePrueba cumple el contrato por ahora. Lo gris se enchufa al mismo contrato cuando llegue.", tomas: ["prueba", "pendientes"] },
];

/* Orden en que se encienden las relaciones de cada zona: [desde, hasta]. */
const LUCES = [
  [["Main", "VentanaPrincipal"], ["VentanaPrincipal", "PantallaJuego"], ["VentanaPrincipal", "MenuPrincipal"], ["MenuPrincipal", "Cartel"], ["PantallaJuego", "Cartel"],
    ["PantallaJuego", "PanelTablero"], ["PantallaJuego", "PanelHUD"], ["PanelTablero", "Epoca"], ["PanelTablero", "Imagenes"], ["PanelHUD", "Imagenes"], ["MenuPrincipal", "Imagenes"], ["Imagenes", "Imagenes"], ["Imagenes", "Assets"]],
  [["PantallaJuego", "Juego"], ["PanelHUD", "Juego"], ["PanelHUD", "ObservadorJuego"], ["PanelTablero", "ObservadorJuego"], ["PanelTablero", "Direccion"],
    ["Juego", "ObservadorJuego"], ["Juego", "EstadoJuego"], ["ObservadorJuego", "EstadoJuego"]],
  [["JuegoDePrueba", "Juego"], ["Main", "JuegoDePrueba"], ["ControladorJuego", "Juego"], ["JuegoDePrueba", "Foto"], ["JuegoDePrueba", "ObservadorJuego"], ["ReproductorSonido", "ObservadorJuego"]],
];

/* ── Lectura del SVG real ── */
function leerPlano() {
  const doc = new DOMParser().parseFromString(window.UML || "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 10 10'/>", "image/svg+xml");
  const raiz = doc.documentElement;
  const [, , VW, VH] = (raiz.getAttribute("viewBox") || "0 0 10 10").split(/[\s,]+/).map(Number);
  const num = (e, k) => parseFloat(e.getAttribute(k)) || 0;

  // Leyenda "Quién hizo cada parte": cuadradito de color + texto en la misma fila
  const textos = [...raiz.querySelectorAll(":scope > text")];
  const autores = [...raiz.querySelectorAll(":scope > rect")].filter((r) => num(r, "width") === 30).map((r) => {
    const y = num(r, "y");
    const txt = textos.find((x) => Math.abs(num(x, "y") - y - 12.5) < 3 && num(x, "x") > num(r, "x"));
    const linea = txt ? txt.textContent.trim() : "";
    const corte = linea.search(/\s(·\s)?/);
    return { fill: r.getAttribute("fill"), stroke: r.getAttribute("stroke"), nombre: linea.slice(0, corte), resto: linea.slice(corte).replace(/^\s*·?\s*/, "") };
  });
  const orden = (a) => ["Luca", "Integración", "Martín", "Pendiente"].indexOf(a.nombre);
  autores.sort((a, b) => orden(a) - orden(b));

  const cajas = [...raiz.querySelectorAll("g.caja")].map((g) => {
    const r = g.querySelector("rect");
    const fill = r.getAttribute("fill");
    const capa = Math.max(0, autores.findIndex((a) => a.fill === fill));
    return { id: g.id, g, x: num(r, "x"), y: num(r, "y"), w: num(r, "width"), h: num(r, "height"), fill, stroke: r.getAttribute("stroke"), capa, pendiente: autores[capa] && autores[capa].nombre === "Pendiente" };
  });
  const porId = Object.fromEntries(cajas.map((c) => [c.id, c]));
  const tocada = (p) => cajas.find((c) => p[0] >= c.x - 4 && p[0] <= c.x + c.w + 4 && p[1] >= c.y - 4 && p[1] <= c.y + c.h + 4);

  // Relaciones: los caminos sueltos que salen de una caja y llegan a otra
  const relaciones = [];
  [...raiz.querySelectorAll(":scope > path")].forEach((p) => {
    if (p.getAttribute("fill") !== "none") return;
    const tok = (p.getAttribute("d") || "").match(/[MLA]|-?[\d.]+/g) || [];
    const pts = [];
    for (let i = 0; i < tok.length;) {
      const c = tok[i];
      if (c === "M" || c === "L") { pts.push([+tok[i + 1], +tok[i + 2]]); i += 3; } else if (c === "A") { pts.push([+tok[i + 6], +tok[i + 7]]); i += 8; } else i += 1;
    }
    if (pts.length < 2) return;
    const a = tocada(pts[0]), b = tocada(pts[pts.length - 1]);
    if (!a || !b) return;
    relaciones.push({ desde: a.id, hasta: b.id, pts, pendiente: a.pendiente || b.pendiente });
  });
  // Rótulos de las flechas ("contiene", "crea"...): van por encima de la luz para no taparse
  const rotulosFlecha = [...raiz.querySelectorAll(":scope > rect")].filter((r) => r.getAttribute("fill-opacity") === "0.95").map((r) => {
    const txt = r.nextElementSibling && r.nextElementSibling.tagName === "text" ? r.nextElementSibling : null;
    return { x: num(r, "x"), y: num(r, "y"), w: num(r, "width"), h: num(r, "height"), nodos: [r, txt].filter(Boolean) };
  });
  return { raiz, VW, VH, autores, cajas, porId, relaciones, rotulosFlecha };
}

/** Dibuja un SVG en un canvas (el SVG va como imagen: los textos quedan nítidos a la escala pedida). */
function rasterizar(svgTexto, ancho, alto, listo) {
  const c = document.createElement("canvas");
  c.width = ancho; c.height = alto;
  const im = new Image();
  cargando(new Promise((fin) => {
    im.onload = () => { c.getContext("2d").drawImage(im, 0, 0, ancho, alto); listo(c); fin(); };
    im.onerror = fin;
  }));
  im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgTexto);
  return c;
}

function punto(color) {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), b = new THREE.Color(color);
  const rgba = (a) => `rgba(${Math.round(b.r * 255)},${Math.round(b.g * 255)},${Math.round(b.b * 255)},${a})`;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, rgba(1)); gr.addColorStop(0.3, rgba(0.55)); gr.addColorStop(1, rgba(0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const x = new THREE.CanvasTexture(c); x.colorSpace = THREE.SRGBColorSpace;
  return x;
}

export default {
  montar(lienzo, { slide }) {
    const P = leerPlano();
    const caja = el("div", "escena3d", lienzo);
    const velo = el("div", "uml__velo", lienzo);
    const pie = el("div", "uml__zona pos", lienzo, { vars: { x: 120, y: 520 } });
    const zonaNombre = el("div", "uml__nombre", pie);
    const zonaDetalle = el("p", "uml__detalle", pie);
    const textosZona = ZONAS.map((z) => ({ nombre: z.nombre, detalle: z.detalle }));

    // Minimapa: el plano en chico con el cuadro de la toma actual
    const mini = el("div", "uml__mini pos", lienzo, { vars: { x: 120, y: 790 } });
    const ESC_MINI = 340 / P.VW;
    const msvg = s("svg", { class: "uml__mini-svg", viewBox: `0 0 ${P.VW} ${P.VH}`, "aria-hidden": "true" }, mini);
    s("rect", { class: "uml__mini-hoja", x: 0, y: 0, width: P.VW, height: P.VH, rx: 18 }, msvg);
    P.cajas.forEach((c) => s("rect", { x: c.x, y: c.y, width: c.w, height: c.h, rx: 8, fill: c.fill, stroke: c.stroke, "stroke-width": 6, class: "uml__mini-caja" }, msvg));
    const mmarco = s("rect", { class: "uml__mini-marco", x: 0, y: 0, width: P.VW, height: P.VH, rx: 10 }, msvg);
    mini.style.setProperty("--alto", Math.round(P.VH * ESC_MINI) + "px");

    // Rótulos de las capas: fijos a la izquierda, con una línea guía hasta la capa levantada
    const guias = s("svg", { class: "svg uml__guias", viewBox: "0 0 1920 1080", "aria-hidden": "true" }, lienzo);
    const ANCLA = { Luca: "Main", "Integración": "Epoca", "Martín": "Assets", Pendiente: "ControladorJuego" };
    const rotulos = P.autores.map((a, i) => {
      const propias = P.cajas.filter((c) => c.capa === i);
      const r = el("div", "uml__capa pos", lienzo);
      const muestra = el("i", "uml__muestra", r);
      muestra.style.setProperty("--relleno", a.fill || "transparent");
      muestra.style.setProperty("--borde", a.stroke || "transparent");
      const txt = el("div", "uml__capa-texto", r);
      el("b", "", txt, { texto: a.nombre });
      el("span", "", txt, { texto: a.resto });
      el("div", "uml__capa-cuenta", r, { texto: String(propias.length) });
      const ancla = P.porId[ANCLA[a.nombre]] || propias[0];
      const guia = s("line", { class: "uml__guia" }, guias);
      const punta = s("circle", { class: "uml__punta", r: 6 }, guias);
      return { r, i, ancla, guia, punta, piezas: [r, guia, punta] };
    });
    // Orden de arriba a abajo según la altura en pantalla de cada capa levantada (lo pendiente queda más alto)
    const ORDEN = { Pendiente: 0, Luca: 1, "Integración": 2, "Martín": 3 };
    rotulos.forEach((r) => {
      const y = 492 + (ORDEN[P.autores[r.i].nombre] ?? r.i) * 82;
      r.r.style.setProperty("--x", "120px"); r.r.style.setProperty("--y", y + "px");
      r.guia.setAttribute("x1", 620); r.guia.setAttribute("y1", y + 34);
    });

    const vista = crearVista(lienzo, { caja, exposicion: 1, aria: "Diagrama de clases completo del Sokoban sobre una mesa: las clases se levantan por autor y las flechas se encienden zona por zona" });
    if (!vista) {
      const img = el("div", "uml__respaldo pos dim", lienzo, { vars: { x: 640, y: 80, w: 1240, h: 920 } });
      img.appendChild(document.importNode(P.raiz, true));
      return { sin3d: true, slide, pie, zonaNombre, zonaDetalle, textosZona, mini, mmarco, rotulos, velo };
    }
    const { renderer, W, H, ex, ey } = vista;
    // Las texturas siguen a la resolución real: en una pantalla chica no hace falta tanto detalle
    const fino = Math.max(0.6, Math.min(1, vista.ratio));
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const maxTex = renderer.capabilities.maxTextureSize || 4096;

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(t("fondo-hondo"));
    escena.fog = new THREE.Fog(t("fondo-hondo"), 26, 60);
    const camara = vista.camara(30, 0.1, 140);
    const aMundo = (x, y) => new THREE.Vector3((x - P.VW / 2) / U, 0, (y - P.VH / 2) / U);

    // Mesa: grilla de plano técnico que se pierde en la niebla
    const grilla = new THREE.GridHelper(120, 120, t("linea"), t("linea"));
    grilla.material.transparent = true; grilla.material.opacity = 0.09; grilla.material.depthWrite = false;
    grilla.position.y = -0.32;
    escena.add(grilla);
    const mesa = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.ShadowMaterial({ opacity: 0.5 }));
    mesa.rotation.x = -Math.PI / 2; mesa.position.y = -0.321; mesa.receiveShadow = true;
    escena.add(mesa);

    // Papel: textura del SVG sin las cajas (dejan su huella punteada), con penumbra fuera de la zona y haz de impresión
    const escPapel = Math.min(ESC_PAPEL * fino, (maxTex - 16) / P.VW);
    const sinCajas = P.raiz.cloneNode(true);
    sinCajas.querySelectorAll("g.caja").forEach((g) => {
      const r = g.querySelector("rect");
      const huella = sinCajas.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "rect");
      ["x", "y", "width", "height", "rx", "stroke"].forEach((k) => huella.setAttribute(k, r.getAttribute(k)));
      huella.setAttribute("fill", "none"); huella.setAttribute("stroke-width", "1.4"); huella.setAttribute("stroke-dasharray", "5 5"); huella.setAttribute("opacity", "0.7");
      g.replaceWith(huella);
    });
    sinCajas.setAttribute("width", Math.round(P.VW * escPapel)); sinCajas.setAttribute("height", Math.round(P.VH * escPapel));
    const prepararTex = (x) => { x.colorSpace = THREE.SRGBColorSpace; x.anisotropy = aniso; x.minFilter = THREE.LinearMipmapLinearFilter; x.generateMipmaps = true; return x; };
    const texPapel = prepararTex(new THREE.CanvasTexture(rasterizar(new XMLSerializer().serializeToString(sinCajas), Math.round(P.VW * escPapel), Math.round(P.VH * escPapel), () => { texPapel.needsUpdate = true; })));

    const uni = { uFoco: { value: new THREE.Vector4(0, 0, P.VW, P.VH) }, uAtenua: { value: 0 }, uRevela: { value: -400 }, uHaz: { value: new THREE.Color(t("exito")).multiplyScalar(2.2) } };
    const matPapel = new THREE.MeshBasicMaterial({ map: texPapel, toneMapped: false, color: new THREE.Color(0.84, 0.84, 0.84) });
    matPapel.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uni);
      sh.fragmentShader = sh.fragmentShader
        .replace("void main() {", "uniform vec4 uFoco; uniform float uAtenua; uniform float uRevela; uniform vec3 uHaz;\nvoid main() {")
        .replace("#include <map_fragment>", `#include <map_fragment>
          vec2 pSvg = vec2(vMapUv.x * ${P.VW.toFixed(1)}, (1.0 - vMapUv.y) * ${P.VH.toFixed(1)});
          vec2 dd = max(uFoco.xy - pSvg, pSvg - uFoco.zw);
          float fuera = clamp(max(dd.x, dd.y) / 90.0, 0.0, 1.0);
          diffuseColor.rgb *= mix(1.0, 0.2, fuera * uAtenua);
          float frente = uRevela - (pSvg.x + pSvg.y * 0.35);
          if (frente < 0.0) discard;
          diffuseColor.rgb += uHaz * smoothstep(70.0, 0.0, frente);`);
    };
    const papel = new THREE.Mesh(new THREE.PlaneGeometry(P.VW / U, P.VH / U), matPapel);
    papel.rotation.x = -Math.PI / 2;
    escena.add(papel);
    const sombraPapel = new THREE.Mesh(new THREE.PlaneGeometry(P.VW / U, P.VH / U), new THREE.ShadowMaterial({ opacity: 0.32 }));
    sombraPapel.rotation.x = -Math.PI / 2; sombraPapel.position.y = 0.003; sombraPapel.receiveShadow = true;
    escena.add(sombraPapel);
    const canto = new THREE.Mesh(new THREE.BoxGeometry(P.VW / U, 0.3, P.VH / U), new THREE.MeshStandardMaterial({ color: t("superficie"), roughness: 0.8 }));
    canto.position.y = -0.152; canto.castShadow = true;
    escena.add(canto);

    // Cajas: losas con la textura recortada de cada clase
    const fuente = P.raiz.getAttribute("font-family") || "sans-serif";
    const estilo = (P.raiz.querySelector("style") || { outerHTML: "" }).outerHTML;
    const PAD = 3;
    const cajas3d = P.cajas.map((c) => {
      const g = new THREE.Group();
      const centro = aMundo(c.x + c.w / 2, c.y + c.h / 2);
      g.position.copy(centro);
      escena.add(g);
      const ancho = Math.round((c.w + PAD * 2) * ESC_CAJA * fino), alto = Math.round((c.h + PAD * 2) * ESC_CAJA * fino);
      const sola = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${c.x - PAD} ${c.y - PAD} ${c.w + PAD * 2} ${c.h + PAD * 2}" width="${ancho}" height="${alto}" font-family="${fuente.replace(/"/g, "'")}">${estilo}${new XMLSerializer().serializeToString(c.g)}</svg>`;
      const tex = prepararTex(new THREE.CanvasTexture(rasterizar(sola, ancho, alto, () => { tex.needsUpdate = true; })));
      const cara = new THREE.Mesh(new THREE.PlaneGeometry((c.w + PAD * 2) / U, (c.h + PAD * 2) / U),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.4, toneMapped: false, color: new THREE.Color(0.86, 0.86, 0.86), opacity: c.pendiente ? 0.8 : 1 }));
      cara.rotation.x = -Math.PI / 2; cara.position.y = ESP + 0.002;
      g.add(cara);
      const cuerpo = new THREE.Mesh(new RoundedBoxGeometry(c.w / U, ESP, c.h / U, 2, 0.04),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(c.stroke || t("linea")), roughness: 0.55, transparent: c.pendiente, opacity: c.pendiente ? 0.55 : 1 }));
      cuerpo.position.y = ESP / 2; cuerpo.castShadow = true;
      g.add(cuerpo);
      // Marco que se enciende cuando le llega una flecha
      const forma = new THREE.Shape();
      const mw = c.w / U / 2 + 0.05, mh = c.h / U / 2 + 0.05, gr = 0.045;
      forma.moveTo(-mw, -mh); forma.lineTo(mw, -mh); forma.lineTo(mw, mh); forma.lineTo(-mw, mh); forma.lineTo(-mw, -mh);
      const hueco = new THREE.Path();
      hueco.moveTo(-mw + gr, -mh + gr); hueco.lineTo(-mw + gr, mh - gr); hueco.lineTo(mw - gr, mh - gr); hueco.lineTo(mw - gr, -mh + gr); hueco.lineTo(-mw + gr, -mh + gr);
      forma.holes.push(hueco);
      const marco = new THREE.Mesh(new THREE.ShapeGeometry(forma), new THREE.MeshBasicMaterial({ color: new THREE.Color(t(c.pendiente ? "pendiente" : "acento")).multiplyScalar(2.2), transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
      marco.rotation.x = -Math.PI / 2; marco.position.y = ESP + 0.004;
      g.add(marco);
      return { ...c, grupo: g, cara, cuerpo, marco, base: centro.clone(), alza: { y: 0, giro: 0 }, luz: { v: 0 } };
    });
    const caja3d = Object.fromEntries(cajas3d.map((c) => [c.id, c]));
    const serial = new XMLSerializer();
    const pegotes = P.rotulosFlecha.map((r) => {
      const ancho = Math.round((r.w + 2) * ESC_CAJA * fino), alto = Math.round((r.h + 2) * ESC_CAJA * fino);
      const svgR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${r.x - 1} ${r.y - 1} ${r.w + 2} ${r.h + 2}" width="${ancho}" height="${alto}" font-family="${fuente.replace(/"/g, "'")}">${estilo}${r.nodos.map((n) => serial.serializeToString(n)).join("")}</svg>`;
      const tex = prepararTex(new THREE.CanvasTexture(rasterizar(svgR, ancho, alto, () => { tex.needsUpdate = true; })));
      const m = new THREE.Mesh(new THREE.PlaneGeometry((r.w + 2) / U, (r.h + 2) / U), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, color: new THREE.Color(0.86, 0.86, 0.86), depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.position.copy(aMundo(r.x + r.w / 2, r.y + r.h / 2)).setY(0.03);
      m.renderOrder = 3;
      escena.add(m);
      return { ...r, m };
    });

    // Flechas: un tubo de luz sobre cada relación real, que se dibuja en el sentido de la dependencia
    const relaciones = P.relaciones.map((r) => {
      const camino = new THREE.CurvePath();
      const v = r.pts.map(([x, y]) => aMundo(x, y).setY(0.016));
      for (let i = 0; i < v.length - 1; i++) if (v[i].distanceTo(v[i + 1]) > 0.001) camino.add(new THREE.LineCurve3(v[i], v[i + 1]));
      const largo = camino.getLength();
      const geo = new THREE.TubeGeometry(camino, Math.max(8, Math.ceil(largo * 14)), 0.024, 6, false);
      const color = new THREE.Color(t(r.pendiente ? "pendiente" : "acento")).multiplyScalar(r.pendiente ? 1.6 : 2.4);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
      const m = new THREE.Mesh(geo, mat);
      m.renderOrder = 2;
      m.visible = false;
      escena.add(m);
      const total = geo.index.count;
      const estado = { p: 0, a: 0 };
      const aplicar = () => {
        m.visible = estado.p > 0.001 && estado.a > 0.001;
        geo.setDrawRange(0, Math.floor((total * estado.p) / 6) * 6);
        mat.opacity = estado.a;
      };
      return { ...r, camino, largo, m, estado, aplicar };
    });
    const relacion = (a, b) => relaciones.find((r) => r.desde === a && r.hasta === b);

    // Capas de vidrio: una por autor, a la altura donde se levantan sus clases
    const vidrios = P.autores.map((a, i) => {
      const g = new THREE.Group();
      const color = new THREE.Color(a.stroke || t("linea"));
      const hoja = new THREE.Mesh(new THREE.PlaneGeometry(P.VW / U + 0.6, P.VH / U + 0.6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
      hoja.rotation.x = -Math.PI / 2;
      const borde = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(P.VW / U + 0.6, P.VH / U + 0.6)), new THREE.LineBasicMaterial({ color: color.clone().multiplyScalar(1.8), transparent: true, opacity: 0, toneMapped: false }));
      borde.rotation.x = -Math.PI / 2;
      g.add(hoja, borde);
      g.position.y = ALTURA[i] - 0.02;
      escena.add(g);
      const estado = { v: 0 };
      return { estado, aplicar: () => { hoja.material.opacity = estado.v * 0.03; borde.material.opacity = estado.v * 0.8; g.visible = estado.v > 0.001; } };
    });
    // Hilos de luz entre capas: las relaciones reales que cruzan de un autor a otro
    const hilos = P.relaciones.filter((r) => r.desde !== r.hasta && P.porId[r.desde].capa !== P.porId[r.hasta].capa).map((r) => {
      const a = P.porId[r.desde], b = P.porId[r.hasta];
      const pa = aMundo(a.x + a.w / 2, a.y + a.h / 2).setY(ALTURA[a.capa] + ESP), pb = aMundo(b.x + b.w / 2, b.y + b.h / 2).setY(ALTURA[b.capa] + ESP);
      const medio = pa.clone().lerp(pb, 0.5); medio.y += 0.9;
      const curva = new THREE.QuadraticBezierCurve3(pa, medio, pb);
      const geo = new THREE.TubeGeometry(curva, 48, 0.035, 6, false);
      const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(t(r.pendiente ? "pendiente" : "acento")).multiplyScalar(2.6), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
      const m = new THREE.Mesh(geo, mat);
      escena.add(m);
      const estado = { p: 0 }, total = geo.index.count;
      return { estado, aplicar: () => { m.visible = estado.p > 0.001; geo.setDrawRange(0, Math.floor((total * estado.p) / 6) * 6); mat.opacity = Math.min(1, estado.p * 3); } };
    });

    // Luces
    escena.add(new THREE.HemisphereLight(t("tinta-2"), t("fondo-hondo"), 1.4));
    const sol = new THREE.DirectionalLight(t("titulo"), 2.2);
    sol.position.set(-7, 14, 9);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -14, right: 14, top: 11, bottom: -11, near: 1, far: 40 });
    sol.shadow.bias = -0.0006;
    escena.add(sol);

    // Partículas que viajan por las flechas encendidas y polvo de luz sobre la mesa
    const mapaPunto = punto(t("tinta"));
    const pulsos = Array.from({ length: 6 }, () => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mapaPunto, color: new THREE.Color(t("acento")).multiplyScalar(3), transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
      sp.scale.setScalar(0.32);
      escena.add(sp);
      return sp;
    });
    const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: t("titulo"), map: mapaPunto, size: 0.09, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
    polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: 1200 }, (_, i) => (i % 3 === 0 ? gsap.utils.random(-16, 16) : i % 3 === 1 ? gsap.utils.random(0.3, 7) : gsap.utils.random(-12, 12))), 3));
    escena.add(polvo);

    // Cámara: objetivo, distancia, inclinación desde la vertical, giro y corrimiento óptico
    const tanH = Math.tan((30 * Math.PI) / 360) * (16 / 9), tanV = Math.tan((30 * Math.PI) / 360);
    const toma = (nombre) => {
      const [x0, y0, x1, y1, incl] = TOMA[nombre];
      const c = aMundo((x0 + x1) / 2, (y0 + y1) / 2);
      const ancho = (x1 - x0) / U, alto = ((y1 - y0) / U) * Math.cos(incl);
      const d = Math.max(ancho / ((REGION.w / 1920) * 2 * tanH), alto / ((REGION.h / 1080) * 2 * tanV)) * 1.02;
      return { tx: c.x, tz: c.z + ((y1 - y0) / U) * Math.sin(incl) * 0.06, d, incl, giro: 0, ox: CORRE, rect: [x0, y0, x1, y1] };
    };
    const cam = { ...toma("general") };
    const deriva = { x: 0, y: 0, z: 0 };
    const mira = new THREE.Vector3();
    const ubicarCamara = () => {
      mira.set(cam.tx, 0, cam.tz);
      camara.position.set(cam.tx + cam.d * Math.sin(cam.incl) * Math.sin(cam.giro) + deriva.x, cam.d * Math.cos(cam.incl) + deriva.y, cam.tz + cam.d * Math.sin(cam.incl) * Math.cos(cam.giro) + deriva.z);
      camara.lookAt(mira);
      camara.setViewOffset(W, H, -cam.ox, 0, W, H);
      orbitar(camara, mira, vista.orbita);
    };

    // Brillo de cada caja según cuánto cae dentro de la zona iluminada
    const v3 = new THREE.Vector3();
    const actualizar = () => {
      const [fx0, fy0, fx1, fy1] = uni.uFoco.value.toArray();
      cajas3d.forEach((c) => {
        const ix = Math.max(0, Math.min(c.x + c.w, fx1) - Math.max(c.x, fx0)), iy = Math.max(0, Math.min(c.y + c.h, fy1) - Math.max(c.y, fy0));
        const dentro = (ix * iy) / (c.w * c.h);
        const k = 0.86 * (1 - uni.uAtenua.value * (1 - dentro) * 0.78);
        c.cara.material.color.setScalar(k);
        const aparece = Math.max(0, Math.min(1, (uni.uRevela.value - (c.x + c.w + (c.y + c.h) * 0.35)) / 120));
        c.grupo.visible = aparece > 0;
        c.grupo.scale.setScalar(0.85 + aparece * 0.15);
        c.grupo.position.y = c.alza.y + (1 - aparece) * 0.6;
        c.grupo.rotation.z = c.alza.giro;
        c.marco.material.opacity = c.luz.v;
      });
      pegotes.forEach((r) => {
        const ix = Math.max(0, Math.min(r.x + r.w, fx1) - Math.max(r.x, fx0)), iy = Math.max(0, Math.min(r.y + r.h, fy1) - Math.max(r.y, fy0));
        r.m.material.color.setScalar(0.86 * (1 - uni.uAtenua.value * (1 - (ix * iy) / (r.w * r.h)) * 0.78));
        r.m.visible = uni.uRevela.value > r.x + r.w + (r.y + r.h) * 0.35;
      });
      // Líneas guía de los rótulos de capa: del rótulo fijo a la caja levantada
      rotulos.forEach((r) => {
        const c = caja3d[r.ancla.id];
        v3.set(c.base.x - c.w / U / 2, c.alza.y + ESP, c.base.z).project(camara);
        const x = ((v3.x + 1) / 2) * W - ex, y = ((1 - v3.y) / 2) * H - ey;
        r.guia.setAttribute("x2", x.toFixed(1)); r.guia.setAttribute("y2", y.toFixed(1));
        r.punta.setAttribute("cx", x.toFixed(1)); r.punta.setAttribute("cy", y.toFixed(1));
      });
      escena.fog.near = cam.d * 0.95; escena.fog.far = cam.d * 2.8;
    };

    ubicarCamara();
    vista.animar({ escena, camara, brillo: [0.55, 0.45, 0.9], orbita: { giro: 0.45, alto: 0.18 }, cada: () => { ubicarCamara(); actualizar(); } });

    return {
      slide, P, cam, toma, uni, vidrios, hilos, cajas3d, caja3d, relaciones, relacion, pulsos, polvo, deriva, rotulos, velo,
      pie, zonaNombre, zonaDetalle, textosZona, mini, mmarco,
      destruir: () => vista.destruir(),
    };
  },

  construir(tl, c) {
    const bajada = c.slide.querySelector(".bajada");
    const mostrarZona = (i) => () => {
      const z = i < 0 ? { nombre: "", detalle: "" } : c.textosZona[i];
      c.zonaNombre.textContent = z.nombre; c.zonaDetalle.textContent = z.detalle;
    };
    // El cuadro del minimapa sigue a la toma
    const marco = { x: 0, y: 0, w: c.P.VW, h: c.P.VH };
    const pintarMarco = () => ["x", "y", "w", "h"].forEach((k) => c.mmarco.setAttribute({ x: "x", y: "y", w: "width", h: "height" }[k], marco[k].toFixed(1)));
    const aMarco = (nombre, en, dur) => {
      const [x0, y0, x1, y1] = TOMA[nombre];
      tl.to(marco, { x: x0, y: y0, w: x1 - x0, h: y1 - y0, duration: dur, ease: "power2.inOut", onUpdate: pintarMarco }, en);
    };

    const piezasRot = c.rotulos.flatMap((r) => r.piezas);
    tl.set(c.pie, { autoAlpha: 0 }, 0).set(piezasRot, { autoAlpha: 0 }, 0).set(c.mini, { autoAlpha: 0 }, 0)
      .fromTo(c.velo, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8 }, 0);
    pintarMarco();
    if (c.sin3d) {
      tl.to(c.mini, { autoAlpha: 1, duration: 0.5 }, 1);
      ZONAS.forEach((z, i) => { tl.addLabel("p" + (i + 1)); tl.call(mostrarZona(i), null, "p" + (i + 1)).to(c.pie, { autoAlpha: 1, duration: 0.4 }, "p" + (i + 1)); });
      tl.addLabel("p4"); tl.to(c.pie, { autoAlpha: 0, duration: 0.4 }, "p4");
      return;
    }
    const { cam, toma, uni } = c;
    const mover = (nombre, en, dur, extra = {}) => {
      const d = toma(nombre);
      tl.to(cam, { tx: d.tx, tz: d.tz, d: d.d, incl: d.incl, giro: 0, ox: d.ox, ...extra, duration: dur, ease: "power2.inOut" }, en);
      aMarco(nombre, en, dur);
    };
    const foco = (nombre, en, dur, atenua = 1) => {
      const [x0, y0, x1, y1] = TOMA[nombre];
      tl.to(uni.uFoco.value, { x: x0, y: y0, z: x1, w: y1, duration: dur, ease: "power2.inOut" }, en)
        .to(uni.uAtenua, { value: atenua, duration: dur * 0.8 }, en);
    };
    /** Enciende una relación: el tubo se dibuja de quien depende a quien conoce y la caja de llegada destella. */
    const luz = (par, en, dur = 0.75) => {
      const r = c.relacion(par[0], par[1]);
      if (!r) return en;
      tl.fromTo(r.estado, { p: 0, a: 1 }, { p: 1, a: 1, duration: Math.max(0.35, Math.min(1.1, dur * Math.sqrt(r.largo / 4))), ease: "power1.inOut", onUpdate: r.aplicar }, en);
      const destino = c.caja3d[par[1]];
      if (destino) tl.fromTo(destino.luz, { v: 0 }, { v: 1, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, en + 0.55);
      return en;
    };
    const apagar = (pares, en) => pares.forEach((par) => {
      const r = c.relacion(par[0], par[1]);
      if (r) tl.to(r.estado, { a: 0.28, duration: 0.6, onUpdate: r.aplicar }, en);
    });

    // Entrada: la cámara baja sobre la mesa y un haz imprime el plano
    const g = toma("general");
    tl.fromTo(cam, { tx: g.tx + 3, tz: g.tz - 2, d: g.d * 1.9, incl: 0.95, giro: -0.55, ox: CORRE }, { tx: g.tx, tz: g.tz, d: g.d, incl: g.incl, giro: -0.12, ox: CORRE, duration: 2.8, ease: "power3.inOut" }, 0)
      .fromTo(uni.uRevela, { value: -300 }, { value: c.P.VW + c.P.VH * 0.35 + 120, duration: 2.1, ease: "power1.inOut" }, 0.35)
      .fromTo(c.polvo.material, { opacity: 0 }, { opacity: 0.4, duration: 2 }, 0.5);

    // Las clases se levantan en capas por autor
    const k = toma("capas");
    tl.to(cam, { tx: k.tx, tz: k.tz, d: k.d, incl: k.incl, giro: -0.42, duration: 2.4, ease: "power2.inOut" }, 2.6);
    c.cajas3d.forEach((cj) => {
      const en = 2.75 + cj.capa * 0.42 + (cj.x / c.P.VW) * 0.35;
      tl.fromTo(cj.alza, { y: 0, giro: 0 }, { y: ALTURA[cj.capa], giro: 0, duration: 1.1, ease: "back.out(1.4)" }, en);
    });
    c.vidrios.forEach((v, i) => tl.fromTo(v.estado, { v: 0 }, { v: 1, duration: 0.8, ease: "power2.out", onUpdate: v.aplicar }, 2.9 + i * 0.42));
    c.hilos.forEach((h, i) => tl.fromTo(h.estado, { p: 0 }, { p: 1, duration: 0.7, ease: "power1.inOut", onUpdate: h.aplicar }, 4.6 + i * 0.18));
    c.rotulos.forEach((r) => {
      tl.fromTo(r.piezas, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.45, ease: "power2.out", immediateRender: false }, 3.45 + r.i * 0.42)
        .fromTo(r.r, { x: -24 }, { x: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, 3.45 + r.i * 0.42);
    });

    // Pasos: una zona por paso
    let en = 0;
    ZONAS.forEach((z, i) => {
      const etiqueta = "p" + (i + 1);
      tl.addLabel(etiqueta);
      en = tl.labels[etiqueta];
      if (i === 0) {
        // Las capas vuelven al papel
        c.vidrios.forEach((v) => tl.to(v.estado, { v: 0, duration: 0.4, onUpdate: v.aplicar }, en));
        c.hilos.forEach((h) => tl.to(h.estado, { p: 0, duration: 0.3, onUpdate: h.aplicar }, en));
        tl.to(piezasRot, { autoAlpha: 0, duration: 0.35 }, en)
          .to(bajada, { autoAlpha: 0, duration: 0.4 }, en)
          .fromTo(c.mini, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power2.out", immediateRender: false }, en + 0.5);
        c.cajas3d.forEach((cj) => tl.to(cj.alza, { y: 0, giro: 0, duration: 0.7, ease: "bounce.out" }, en + 0.1 + (3 - cj.capa) * 0.08));
        en += 0.7;
      } else {
        apagar(LUCES[i - 1], en);
      }
      tl.to(c.pie, { autoAlpha: 0, x: -16, duration: 0.25 }, en)
        .call(mostrarZona(i), null, en + 0.26)
        .to(c.pie, { autoAlpha: 1, x: 0, duration: 0.45, ease: "power2.out" }, en + 0.3);
      // Recorrido: la cámara pasa por cada toma mientras se encienden las flechas de esa parte
      const luces = LUCES[i];
      const tramo = Math.ceil(luces.length / z.tomas.length);
      z.tomas.forEach((nombre, j) => {
        const t0 = en + j * 2.6;
        mover(nombre, t0, j === 0 ? 1.8 : 2.2);
        foco(nombre, t0, j === 0 ? 1.8 : 2.2);
        luces.slice(j * tramo, (j + 1) * tramo).forEach((par, n, todas) => luz(par, t0 + 0.9 + n * (1.6 / Math.max(1, todas.length))));
      });
      // Los pendientes flotan sobre el papel mientras se nombran
      if (i === 2) {
        c.cajas3d.filter((cj) => cj.pendiente).forEach((cj, n) => {
          tl.fromTo(cj.alza, { y: 0 }, { y: 0.55, duration: 0.9, ease: "power2.out" }, en + 1 + n * 2.2);
        });
      }
    });

    // Final: todo el plano, todas las flechas encendidas
    tl.addLabel("p4");
    en = tl.labels.p4;
    mover("general", en, 2.2, { giro: -0.08 });
    tl.to(uni.uAtenua, { value: 0, duration: 1.2 }, en)
      .to(uni.uFoco.value, { x: 0, y: 0, z: c.P.VW, w: c.P.VH, duration: 1.2 }, en)
      .to([c.pie, c.mini], { autoAlpha: 0, duration: 0.4 }, en)
      .to(bajada, { autoAlpha: 1, duration: 0.6 }, en + 0.6);
    c.cajas3d.filter((cj) => cj.pendiente).forEach((cj) => tl.to(cj.alza, { y: 0.35, duration: 1 }, en));
    c.relaciones.forEach((r, n) => tl.to(r.estado, { p: 1, a: r.pendiente ? 0.8 : 0.7, duration: 0.8, ease: "power1.inOut", onUpdate: r.aplicar }, en + 0.6 + (n % 9) * 0.08));
  },

  vida(c) {
    if (c.sin3d) return { kill() {} };
    const tick = (tt) => {
      c.deriva.x = Math.sin(tt * 0.13) * 0.18; c.deriva.y = Math.sin(tt * 0.17 + 1) * 0.12; c.deriva.z = Math.sin(tt * 0.11 + 2) * 0.12;
      c.polvo.rotation.y = tt * 0.01;
    };
    gsap.ticker.add(tick);
    // Un pulso de luz recorre alguna flecha encendida, en el sentido de la dependencia
    const viaje = eventos(() => {
      const encendidas = c.relaciones.filter((r) => r.estado.p > 0.99 && r.estado.a > 0.5 && r.largo > 0.6);
      const sp = c.pulsos.find((p) => !p.userData.ocupado);
      if (!encendidas.length || !sp) return;
      const r = gsap.utils.random(encendidas);
      sp.userData.ocupado = true;
      const pos = { f: 0 };
      sp.material.color.set(t(r.pendiente ? "pendiente" : "acento")).multiplyScalar(3);
      gsap.timeline({ onComplete: () => { sp.userData.ocupado = false; sp.material.opacity = 0; } })
        .to(sp.material, { opacity: 1, duration: 0.2 }, 0)
        .to(pos, { f: 1, duration: Math.min(2.4, 0.5 + r.largo * 0.18), ease: "power1.inOut", onUpdate: () => { sp.position.copy(r.camino.getPointAt(pos.f)).setY(0.06); } }, 0)
        .to(sp.material, { opacity: 0, duration: 0.25 }, ">-0.25");
      const destino = c.caja3d[r.hasta];
      if (destino) gsap.fromTo(destino.luz, { v: 0 }, { v: 0.8, duration: 0.2, yoyo: true, repeat: 1, delay: Math.min(2.4, 0.5 + r.largo * 0.18) - 0.15 });
    }, [0.5, 1.6]);
    // Lo pendiente respira apenas sobre el papel
    const flotar = eventos(() => {
      const p = gsap.utils.random(c.cajas3d.filter((cj) => cj.pendiente));
      if (p && p.alza.y > 0.1) gsap.to(p.alza, { y: p.alza.y + gsap.utils.random(-0.08, 0.08), duration: gsap.utils.random(1.2, 2.2), ease: "sine.inOut", yoyo: true, repeat: 1 });
    }, [1.5, 3.5]);
    return juntas({ kill: () => gsap.ticker.remove(tick) }, viaje, flotar);
  },

  desmontar(c) { if (c.destruir) c.destruir(); },
};
