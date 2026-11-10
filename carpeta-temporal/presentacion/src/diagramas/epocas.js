import * as THREE from "three";
import { gsap } from "gsap";
import { crearEscena, EPOCAS } from "../escena3d.js";
import { el, s as svg, t, pixel, eventos, juntas } from "../util.js";

/*
 * Viaje en el tiempo: el almacén se arma en 1955. En cada paso se abre un portal detrás del tablero que deja ver
 * la época siguiente; de él sale una onda que reescribe pisos, paredes y por último el fondo, en bloques del tamaño
 * de un píxel de arte. Es lo que hace el enum Epoca: el mismo nivel toma el piso, la pared y el fondo de su época.
 */
const INFO = {
  1955: { nivel: 1, texto: "Ladrillo, adoquín y la torre del reloj de fondo", piso: "floor_1955", pared: "wall_brick" },
  1985: { nivel: 2, texto: "Vidrieras del shopping y asfalto con autos", piso: "floor_1985", pared: "wall_mall" },
  2015: { nivel: 3, texto: "Paneles de luz y una ciudad que brilla", piso: "floor_2015", pared: "wall_future" },
};
const GIROS = [-0.46, 0.02, 0.46];
/* Dígitos de 5 × 7 píxeles para el año: el 5 de Pixelify se confunde con una S a la distancia. */
const DIGITOS = {
  0: [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."], 1: ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  2: [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"], 3: ["#####", "...#.", "..#..", "...#.", "....#", "#...#", ".###."],
  4: ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."], 5: ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  6: ["..##.", ".#...", "#....", "####.", "#...#", "#...#", ".###."], 7: ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  8: [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."], 9: [".###.", "#...#", "#...#", ".####", "....#", "...#.", ".##.."],
};
/** Dibuja el año con píxeles cuadrados dentro del SVG (solo si cambió). */
function dibujarAnio(lienzo, n) {
  const texto = String(n);
  if (lienzo.dataset.n === texto) return;
  lienzo.dataset.n = texto;
  lienzo.setAttribute("aria-label", texto);
  lienzo.replaceChildren();
  [...texto].forEach((d, i) => DIGITOS[d].forEach((fila, y) => [...fila].forEach((c, x) => {
    if (c === "#") svg("rect", { x: i * 6 + x, y, width: 1.02, height: 1.02 }, lienzo);
  })));
}
const DUR = 3.8;
const suave = (x) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };
const tramo = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));

export default {
  montar(lienzo) {
    const esc = crearEscena(lienzo, { epoca: "1955", fondo: "epoca", etiqueta: "El mismo almacén del Sokoban viaja de 1955 a 1985 y a 2015: cambian el piso, la pared y el fondo" });
    el("div", "epocas__velo", lienzo);
    // Ficha de la época: año que corre como un contador, nivel del juego y las tres imágenes que cambian
    const ficha = el("div", "epocas__ficha pos", lienzo, { vars: { x: 120, y: 612 } });
    const linea = el("p", "epocas__nivel", ficha, { texto: "Nivel " });
    const nivel = el("b", "", linea, { texto: "1" });
    const anio = el("div", "epocas__anio", ficha);
    const digitos = svg("svg", { class: "epocas__digitos", viewBox: "0 0 23 7", role: "img", "shape-rendering": "crispEdges" }, anio);
    dibujarAnio(digitos, 1955);
    const capas = el("div", "epocas__capas", ficha);
    const detalles = EPOCAS.map((ep) => {
      const i = INFO[ep];
      const d = el("div", "epocas__capa", capas);
      el("p", "epocas__texto", d, { texto: i.texto });
      const piezas = el("div", "epocas__piezas", d);
      [["piso", "tiles/" + i.piso, i.piso], ["pared", "tiles/" + i.pared, i.pared]].forEach(([rol, clave, nombre]) => {
        const f = el("figure", "epocas__pieza", piezas);
        pixel(clave, f, rol + " de " + ep, "pixel epocas__baldosa");
        const cap = el("figcaption", "", f);
        el("span", "epocas__rol", cap, { texto: rol });
        el("code", "epocas__archivo", cap, { texto: nombre });
      });
      const f = el("figure", "epocas__pieza", piezas);
      pixel({ 1955: "backgrounds/background_hill_valley_1955", 1985: "backgrounds/background_mall_1985", 2015: "backgrounds/background_future_2015" }[ep], f, "fondo de " + ep, "pixel epocas__fondo");
      const cap = el("figcaption", "", f);
      el("span", "epocas__rol", cap, { texto: "fondo" });
      el("code", "epocas__archivo", cap, { texto: ep });
      return d;
    });
    if (esc.sin3d) return { esc, ficha, nivel, anio, digitos, detalles };

    // Portal: anillo de luz y, adentro, la época que viene arremolinada
    const portal = new THREE.Group();
    const aro = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.09, 16, 140), new THREE.MeshBasicMaterial({ color: new THREE.Color() }));
    const halo = new THREE.Mesh(new THREE.TorusGeometry(2.5, 0.4, 16, 140), new THREE.MeshBasicMaterial({ color: new THREE.Color(), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
    const ventana = { uMapa: { value: esc.fondoDe("1985") }, uColor: { value: new THREE.Color() }, uTiempo: { value: 0 }, uAbre: { value: 0 } };
    const disco = new THREE.Mesh(new THREE.CircleGeometry(2.5, 96), new THREE.ShaderMaterial({
      uniforms: ventana, transparent: true, depthWrite: false,
      vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: /* glsl */`
        uniform sampler2D uMapa; uniform vec3 uColor; uniform float uTiempo, uAbre; varying vec2 vUv;
        void main() {
          vec2 p = vUv * 2.0 - 1.0; float r = length(p);
          float a = atan(p.y, p.x) + (1.0 - r) * (1.0 - r) * 5.0 * (1.15 - uAbre) + uTiempo * 0.6 * (1.0 - r);
          vec2 q = vec2(cos(a), sin(a)) * r;
          vec3 col = texture2D(uMapa, 0.5 + q * vec2(0.3, 0.52)).rgb * 1.25;
          float espiral = 0.5 + 0.5 * sin(a * 6.0 + r * 16.0 - uTiempo * 7.0);
          col = mix(col, uColor * 1.4, 0.35) + uColor * (smoothstep(0.6, 1.0, r) * 2.4 + espiral * 0.55 * (1.0 - r));
          gl_FragColor = vec4(col, (1.0 - smoothstep(0.94, 1.0, r)) * smoothstep(0.0, 0.4, uAbre));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }));
    disco.renderOrder = 4;
    portal.add(disco, aro, halo);
    portal.visible = false;
    esc.escena.add(portal);

    // Chispas que levanta el frente al pasar por cada baldosa
    const nCh = 320;
    const geo = new THREE.BufferGeometry();
    const P = new Float32Array(nCh * 3), C = new Float32Array(nCh * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(P, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(C, 3));
    const frente = new THREE.Points(geo, new THREE.PointsMaterial({ color: new THREE.Color(), size: 0.12, map: esc.polvo.material.map, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    frente.frustumCulled = false;
    esc.escena.add(frente);
    const semillas = Array.from({ length: nCh }, () => [gsap.utils.random(-5, 5), gsap.utils.random(-3, 3), gsap.utils.random(0.6, 2.6), gsap.utils.random(0.7, 1.4)]);

    const colores = Object.fromEntries(EPOCAS.map((ep) => [ep, new THREE.Color(t("e" + ep))]));
    const base = { cielo: new THREE.Color(t("superficie-2")), linea: new THREE.Color(t("linea")) };
    return { esc, ficha, nivel, anio, digitos, detalles, portal, aro, halo, ventana, frente, semillas, colores, base, P, C };
  },

  construir(tl, c) {
    const { esc } = c;
    gsap.set(c.detalles.slice(1), { autoAlpha: 0 });
    if (esc.sin3d) {
      [1, 2].forEach((i) => tl.addLabel("p" + i).to(c.detalles[i - 1], { autoAlpha: 0, duration: 0.4 }, "p" + i).to(c.detalles[i], { autoAlpha: 1, duration: 0.5 }, "p" + i)
        .call(() => dibujarAnio(c.digitos, EPOCAS[i]), null, "p" + i));
      return;
    }
    const { rig, F, U, pos } = esc;
    const centro = new THREE.Vector3(0, 0, 0);
    rig.mira.set(0.2, 0.1, 0.2);
    if (esc.jugador) esc.jugador.rotation.y = 0.35;

    // Época: colores de las luces, del filo del zócalo y del polvo
    const tmp = new THREE.Color();
    const pintar = (a, b, k) => {
      tmp.copy(c.colores[a]).lerp(c.colores[b], k);
      esc.contra.color.copy(tmp).lerp(c.base.linea, 0.35);
      esc.hemi.color.copy(c.base.cielo).lerp(tmp, 0.3);
      esc.filos.forEach((f) => f.material.color.copy(tmp).multiplyScalar(2.2));
      esc.polvo.material.color.copy(tmp).lerp(c.base.linea, 0.3);
      c.anio.style.setProperty("--desde", `var(--e${a})`);
      c.anio.style.setProperty("--hasta", `var(--e${b})`);
      c.anio.style.setProperty("--m", k.toFixed(3));
    };
    pintar("1955", "1955", 0);

    // Entrada: el almacén se arma en 1955 y la cámara baja en órbita
    // Distancias con margen: en la órbita el lado largo del tablero gira hacia la cámara y no tiene que salirse de la pantalla
    tl.fromTo(rig, { giro: GIROS[0] - 0.9, alto: 0.95, dist: 30, encuadre: 0.155, bajar: 0.03 }, { giro: GIROS[0], alto: 0.42, dist: 22.5, encuadre: 0.155, bajar: 0.03, duration: 3, ease: "power3.inOut" }, 0)
      .fromTo(F.uLuz, { value: 0 }, { value: 1, duration: 1.8, ease: "power1.inOut" }, 0.3);
    esc.paredes.forEach((m) => {
      const d = m.position.distanceTo(centro);
      tl.from(m.position, { y: `+=${gsap.utils.random(5, 8)}`, duration: 0.75, ease: "bounce.out" }, 0.25 + d * 0.07);
    });
    esc.pisos.forEach((m) => {
      const d = m.position.distanceTo(centro);
      tl.from(m.scale, { x: 0.01, y: 0.01, duration: 0.35, ease: "back.out(2.2)" }, 0.1 + d * 0.06);
    });
    esc.cajas.forEach((m, i) => tl.from(m.position, { y: "+=5", duration: 0.7, ease: "bounce.out" }, 1.2 + i * 0.12));
    if (esc.jugador) {
      tl.from(esc.jugador.position, { y: "+=4", duration: 0.45, ease: "power2.in" }, 1.5)
        .to(esc.pj.pose, { aplaste: 0.8, duration: 0.06, onUpdate: esc.pj.aplicar }, 1.95)
        .to(esc.pj.pose, { aplaste: 0, duration: 0.4, ease: "elastic.out(1, 0.4)", onUpdate: esc.pj.aplicar }, 2.01);
    }
    tl.fromTo(c.ficha, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }, 1.4);

    // Cada paso, un viaje: portal, onda que reescribe el tablero, fondo nuevo y cámara en órbita
    [0, 1].forEach((i) => {
      const a = EPOCAS[i], b = EPOCAS[i + 1], L = "p" + (i + 1);
      const g = GIROS[i];
      const donde = new THREE.Vector3(-Math.sin(g) * 5.4, 1.9, -Math.cos(g) * 5.4);
      const v = new THREE.Vector3();
      const prog = { p: 0 };
      tl.addLabel(L, i === 0 ? 3.4 : undefined);
      tl.fromTo(prog, { p: 0 }, { p: 1, duration: DUR, ease: "none", immediateRender: false, onUpdate: () => {
        const p = prog.p;
        esc.pasar(a, b);
        // Portal
        const abre = suave(tramo(p, 0, 0.14)) * (1 - suave(tramo(p, 0.74, 0.94)));
        c.portal.visible = abre > 0.002;
        c.portal.position.copy(donde);
        c.portal.rotation.set(0, g, 0);
        c.portal.scale.setScalar(Math.max(0.001, abre * (1 + 0.08 * Math.sin(p * 40) * abre)));
        c.ventana.uAbre.value = abre; c.ventana.uMapa.value = esc.fondoDe(b); c.ventana.uTiempo.value = p * 9;
        c.ventana.uColor.value.copy(c.colores[b]);
        c.aro.material.color.copy(c.colores[b]).multiplyScalar(4.5);
        c.halo.material.color.copy(c.colores[b]);
        // Onda sobre el tablero
        const f = p < 0.14 ? -1 : 13.5 * gsap.parseEase("power1.inOut")(tramo(p, 0.14, 0.66));
        U.uFrente.value = f; U.uCentro.value.copy(donde);
        U.uBorde.value.copy(c.colores[b]);
        U.uAncho.value = 0.55;
        esc.paredes.forEach((m) => {
          const k = f - m.position.distanceTo(donde);
          const s = Math.exp(-((k - 0.5) ** 2) * 4) * (f > 0 ? 1 : 0);
          m.position.y = 0.45 + s * 0.32; m.scale.y = 1 + s * 0.12;
        });
        esc.cajas.forEach((m) => {
          const k = f - m.position.distanceTo(donde);
          m.position.y = 0.4 + Math.exp(-((k - 0.4) ** 2) * 5) * (f > 0 ? 0.35 : 0);
        });
        if (esc.jugador) {
          const k = f - esc.jugador.position.distanceTo(donde);
          const s = Math.exp(-((k - 0.6) ** 2) * 3) * (f > 0 ? 1 : 0);
          esc.jugador.position.y = s * 0.55;
          esc.pj.pose.brazoI = esc.pj.pose.brazoD = -2.7 * s; esc.pj.pose.abrir = 0.35 * s; esc.pj.aplicar();
        }
        // Chispas del frente
        const { P, C } = c;
        c.semillas.forEach(([x, z, alto, vel], j) => {
          v.set(x, 0, z);
          const q = (f - v.distanceTo(donde)) / (1.4 * vel);
          const vivo = f > 0 && q > 0 && q < 1;
          P[j * 3] = x; P[j * 3 + 1] = vivo ? q * alto : -5; P[j * 3 + 2] = z;
          const lum = vivo ? Math.pow(1 - q, 1.5) : 0;
          C[j * 3] = C[j * 3 + 1] = C[j * 3 + 2] = lum;
        });
        c.frente.geometry.attributes.position.needsUpdate = true; c.frente.geometry.attributes.color.needsUpdate = true;
        c.frente.material.color.copy(c.colores[b]).lerp(c.base.linea, 0.4).multiplyScalar(1.8);
        // Fondo: se disuelve desde el portal
        F.mapA.value = esc.fondoDe(a); F.mapB.value = esc.fondoDe(b);
        F.uMezcla.value = gsap.parseEase("power1.inOut")(tramo(p, 0.36, 0.86));
        F.uBorde.value.copy(c.colores[b]);
        v.copy(donde).project(esc.camara);
        F.uOrigen.value.set((v.x + 1) / 2, (v.y + 1) / 2);
        pintar(a, b, suave(tramo(p, 0.3, 0.75)));
        // Contador del año
        const k = gsap.parseEase("power2.inOut")(tramo(p, 0.12, 0.7));
        const anio = Math.round(+a + (+b - +a) * k);
        dibujarAnio(c.digitos, anio);
        c.anio.classList.toggle("epocas__anio--corre", k > 0 && k < 1);
        c.nivel.textContent = String(k < 0.5 ? INFO[a].nivel : INFO[b].nivel);
      } }, L);
      // Cámara en órbita hasta el ángulo de la época nueva, con un respiro hacia atrás
      tl.to(rig, { giro: GIROS[i + 1], duration: DUR, ease: "power2.inOut" }, L)
        .to(rig, { dist: 25.5, alto: 0.5, duration: DUR / 2, ease: "sine.inOut", yoyo: true, repeat: 1 }, L)
        .fromTo(esc.bloom, { strength: 0.7 }, { strength: 1.2, duration: 0.3, yoyo: true, repeat: 1, ease: "power2.out", immediateRender: false }, `${L}+=0.5`);
      // La ficha cambia de época
      tl.to(c.detalles[i], { autoAlpha: 0, y: -12, duration: 0.45, ease: "power2.in" }, `${L}+=1.2`)
        .fromTo(c.detalles[i + 1], { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", immediateRender: false }, `${L}+=1.8`);
    });
  },

  vida(c) {
    const { esc } = c;
    if (esc.sin3d) return { kill() {} };
    const base = esc.vida();
    // El personaje cada tanto da un paso de baile: no sabe en qué año está
    const salto = eventos(() => {
      if (!esc.pj) return;
      const p = esc.pj;
      gsap.timeline()
        .to(p.raiz.rotation, { y: `+=${gsap.utils.random([-1, 1]) * Math.PI / 2}`, duration: 0.3, ease: "power2.inOut" })
        .to(p.raiz.rotation, { y: 0.35, duration: 0.4, ease: "power2.inOut" }, "+=0.8");
    }, [3.5, 7]);
    return juntas(base, salto);
  },

  desmontar: ({ esc }) => esc.destruir(),
};
