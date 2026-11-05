import * as THREE from "three";
import { gsap } from "gsap";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { t, img, el, eventos, juntas } from "../util.js";
import { crearPersonaje } from "../personaje3d.js";

/*
 * Intro en 3D. El personaje entra corriendo, salta con los brazos arriba, empuja la N hasta su destino
 * y la palabra, hecha de cubos, se enciende de la N a la S. Termina arriba de la N saludando a cámara.
 */
const FUENTE = { // letras de 5×7 píxeles
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
};
const PALABRA = [..."SOKOBAN"];
const L = 1.2, VOX = 0.18, ALTO_LETRA = 7 * VOX;
const xLetra = (i) => (i - 4) * L;
const X_DESTINO = xLetra(6), CORRIDA = 2;

function letra(char, material) {
  const filas = FUENTE[char];
  const celdas = [];
  filas.forEach((f, y) => [...f].forEach((c, x) => { if (c === "#") celdas.push([x, 6 - y]); }));
  const malla = new THREE.InstancedMesh(new THREE.BoxGeometry(VOX * 0.94, VOX * 0.94, VOX * 1.6), material, celdas.length);
  const m = new THREE.Matrix4();
  celdas.forEach(([x, y], i) => malla.setMatrixAt(i, m.makeTranslation((x - 2) * VOX, y * VOX + VOX / 2, 0)));
  malla.castShadow = true; malla.receiveShadow = true;
  const g = new THREE.Group();
  g.add(malla);
  return g;
}

export default {
  montar(lienzo) {
    const caja = el("div", "escena3d", lienzo);
    const bajada = el("p", "intro__bajada pos", lienzo, { texto: "Proceso de Desarrollo de Software, UADE", vars: { x: 0, y: 900 } });
    const cineA = el("div", "cine cine--arriba", lienzo);
    const cineB = el("div", "cine cine--abajo", lienzo);
    const destello = el("div", "destello", lienzo);
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); } catch (err) {
      el("div", "intro__respaldo pos", lienzo, { texto: "SOKOBAN", vars: { x: 0, y: 380 } });
      return { sin3d: true, bajada, cineA, cineB, destello };
    }
    const W = caja.offsetWidth || 1920, H = caja.offsetHeight || 1080;
    const escala = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--escala")) || 1;
    renderer.setPixelRatio(Math.min(2, (window.devicePixelRatio || 1) * Math.max(escala, 0.5)));
    renderer.setSize(W, H, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", "El personaje del Sokoban empuja la letra N y la palabra Sokoban se ilumina");
    caja.appendChild(renderer.domElement);

    const escena = new THREE.Scene();
    escena.background = new THREE.Color(t("fondo-hondo"));
    escena.fog = new THREE.Fog(t("fondo-hondo"), 10, 26);
    const camara = new THREE.PerspectiveCamera(32, W / H, 0.1, 100);
    const mira = new THREE.Vector3(1.2, 0.8, 0);

    // Piso de baldosas reales y el destino de la N
    const cargar = (k) => { const x = new THREE.TextureLoader().load(img(k)); x.colorSpace = THREE.SRGBColorSpace; x.magFilter = x.minFilter = THREE.NearestFilter; x.generateMipmaps = false; return x; };
    const suelo = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), new THREE.MeshStandardMaterial({ color: t("fondo"), roughness: 1 }));
    suelo.rotation.x = -Math.PI / 2; suelo.position.y = -0.002; suelo.receiveShadow = true;
    escena.add(suelo);
    const baldosas = [];
    const matPiso = new THREE.MeshStandardMaterial({ map: cargar("tiles/floor_1985"), roughness: 0.95 });
    const matDestino = new THREE.MeshStandardMaterial({ map: cargar("goals/goal"), roughness: 0.8, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0 });
    for (let i = 0; i < 9; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.98, L * 0.98), i === 6 ? matDestino : matPiso);
      b.rotation.x = -Math.PI / 2; b.position.set(xLetra(i), 0, 0); b.receiveShadow = true;
      escena.add(b); baldosas.push(b);
    }

    // Letras de cubos, apagadas
    const apagado = new THREE.Color(t("fondo")), prendido = new THREE.Color(t("titulo"));
    const letras = PALABRA.map((c, i) => {
      const material = new THREE.MeshStandardMaterial({ color: apagado.clone(), roughness: 0.55, metalness: 0.1, emissive: new THREE.Color(t("acento")), emissiveIntensity: 0 });
      const g = letra(c, material);
      g.position.set(xLetra(i), 0, 0);
      escena.add(g);
      return { g, material, luz: { v: 0 } };
    });
    const n = letras[6];
    n.g.position.x = X_DESTINO + CORRIDA * L;

    const pj = crearPersonaje(1.15);
    pj.raiz.position.set(9.5, 0, 0);
    pj.raiz.rotation.y = -Math.PI / 2;
    escena.add(pj.raiz);

    // Luces: penumbra al principio, se enciende cuando la N llega
    const ambiente = new THREE.HemisphereLight(t("superficie-2"), t("fondo-hondo"), 0.9);
    escena.add(ambiente);
    const foco = new THREE.SpotLight(t("titulo"), 25, 30, 0.55, 0.6, 1.4);
    foco.position.set(-1, 7, 7); foco.target.position.set(-1, 0.6, 0);
    foco.castShadow = true; foco.shadow.mapSize.set(1024, 1024);
    escena.add(foco, foco.target);
    const relleno = new THREE.DirectionalLight(t("tinta-2"), 0.9);
    relleno.position.set(6, 3, 6);
    escena.add(relleno);
    const luzDestino = new THREE.PointLight(t("acento"), 0, 5, 1.5);
    luzDestino.position.set(X_DESTINO, 0.4, 0.6);
    escena.add(luzDestino);

    // Chispas y polvo, con partículas redondas
    const lienzoPunto = document.createElement("canvas");
    lienzoPunto.width = lienzoPunto.height = 32;
    const g2 = lienzoPunto.getContext("2d");
    const blanco = new THREE.Color(t("tinta"));
    const grad = g2.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, `rgba(${blanco.r * 255},${blanco.g * 255},${blanco.b * 255},1)`);
    grad.addColorStop(1, `rgba(${blanco.r * 255},${blanco.g * 255},${blanco.b * 255},0)`);
    g2.fillStyle = grad; g2.fillRect(0, 0, 32, 32);
    const punto = new THREE.CanvasTexture(lienzoPunto);
    const nChispas = 90;
    const chispas = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: t("acento"), map: punto, size: 0.12, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    chispas.geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nChispas * 3), 3));
    const vel = Array.from({ length: nChispas }, () => [gsap.utils.random(-2.4, 2.4), gsap.utils.random(1.2, 4.2), gsap.utils.random(-1.2, 1.6)]);
    escena.add(chispas);
    const polvo = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: t("titulo"), map: punto, size: 0.05, transparent: true, opacity: 0.4, depthWrite: false }));
    polvo.geometry.setAttribute("position", new THREE.BufferAttribute(Float32Array.from({ length: 600 }, (_, i) => (i % 3 === 0 ? gsap.utils.random(-9, 9) : i % 3 === 1 ? gsap.utils.random(0.3, 5) : gsap.utils.random(-6, 0.8))), 3));
    escena.add(polvo);

    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(W, H);
    composer.addPass(new RenderPass(escena, camara));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.7, 0.5, 0.86);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    let corriendo = true, ultimo = 0, usarBloom = true, cuadros = 0, acumulado = 0;
    const dibujar = () => {
      camara.lookAt(mira);
      if (usarBloom) composer.render(); else renderer.render(escena, camara);
    };
    renderer.compile(escena, camara);
    const bucle = (ms) => {
      if (!corriendo) return;
      requestAnimationFrame(bucle);
      if (ms - ultimo < 1000 / 40) return;
      const dt = ms - ultimo; ultimo = ms;
      if (cuadros < 90) { cuadros += 1; if (cuadros > 30) acumulado += dt; if (cuadros === 90 && acumulado / 60 > 70) usarBloom = false; } // PC lenta: sin resplandor
      dibujar();
    };
    requestAnimationFrame(bucle);

    const ctx = { renderer, escena, camara, mira, baldosas, letras, n, pj, foco, luzDestino, matDestino, chispas, vel, polvo, apagado, prendido, bajada, cineA, cineB, destello };
    ctx.destruir = () => { corriendo = false; composer.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch (err) { /* nada */ } };
    return ctx;
  },

  construir(tl, c) {
    tl.fromTo([c.cineA, c.cineB], { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: "power2.out" }, 0)
      .set(c.bajada, { autoAlpha: 0 }, 0);
    if (c.sin3d) { tl.to([c.cineA, c.cineB], { scaleY: 0, duration: 0.8 }, 1.5).to(c.bajada, { autoAlpha: 1, duration: 0.6 }, 1.6); return; }
    const { camara, mira, pj, n, letras } = c;
    const pose = (en, valores, dur = 0.2, ease = "power2.out") => tl.to(pj.pose, { ...valores, duration: dur, ease, onUpdate: pj.aplicar }, en);
    const prender = (l, v) => { l.material.color.lerpColors(c.apagado, c.prendido, v); l.material.emissiveIntensity = v * 0.55; };

    // Cámara: arranca rasante y se aleja
    tl.fromTo(camara.position, { x: 6.5, y: 0.45, z: 3.2 }, { x: 1.6, y: 1.9, z: 11.5, duration: 3.2, ease: "power2.inOut" }, 0)
      .fromTo(c.baldosas.map((b) => b.scale), { x: 0, y: 0 }, { x: 1, y: 1, duration: 0.35, ease: "back.out(1.7)", stagger: 0.06 }, 0.3)
      .fromTo(letras.map((l) => l.g.position), { y: -1.6 }, { y: 0, duration: 0.6, ease: "back.out(1.5)", stagger: 0.08 }, 0.6)
      .fromTo(c.foco, { intensity: 0 }, { intensity: 1.2, duration: 1.5 }, 0.5);

    // Entra corriendo
    const paso = { f: 0 };
    tl.to(pj.raiz.position, { x: 7.4, duration: 1.0, ease: "none" }, 1.4)
      .to(paso, { f: 13, duration: 1.0, ease: "none", onUpdate: () => pj.correr(paso.f) }, 1.4);
    // Salto con los brazos arriba
    const xAterriza = X_DESTINO + CORRIDA * L + 0.78;
    pose(2.4, { aplaste: 0.8, brazoI: 0.6, brazoD: 0.6 }, 0.1);
    pose(2.5, { aplaste: -0.6, brazoI: -2.9, brazoD: -2.9, piernaI: -0.9, piernaD: 0.5 }, 0.15);
    tl.to(pj.raiz.position, { x: xAterriza, duration: 0.8, ease: "none" }, 2.5)
      .to(pj.raiz.position, { y: 1.5, duration: 0.4, ease: "power2.out" }, 2.5)
      .to(pj.raiz.position, { y: 0, duration: 0.4, ease: "power2.in" }, 2.9);
    pose(3.3, { aplaste: 1, brazoI: 0.4, brazoD: 0.4, piernaI: 0, piernaD: 0 }, 0.08);
    pose(3.38, { aplaste: 0 }, 0.3, "elastic.out(1, 0.4)");
    // Empuja la N dos baldosas
    pose(3.75, { brazoI: -1.45, brazoD: -1.45 }, 0.2);
    for (let i = 0; i < CORRIDA; i++) {
      const en = 3.95 + i * 0.7;
      tl.to([n.g.position, pj.raiz.position], { x: `-=${L}`, duration: 0.55, ease: "empuje" }, en)
        .to(paso, { f: `+=${Math.PI * 2}`, duration: 0.55, ease: "none", onUpdate: () => { pj.pose.piernaI = -Math.sin(paso.f) * 0.6; pj.pose.piernaD = Math.sin(paso.f) * 0.6; pj.aplicar(); } }, en);
    }
    // Encastra: destello, chispas y la palabra se enciende de la N a la S
    const llega = 3.95 + CORRIDA * 0.7 - 0.12;
    const brote = { p: 0 };
    const pos = c.chispas.geometry.attributes.position;
    tl.to(c.matDestino, { emissiveIntensity: 0.5, duration: 0.3 }, llega)
      .to(c.luzDestino, { intensity: 4, duration: 0.3 }, llega)
      .fromTo(c.destello, { autoAlpha: 0 }, { autoAlpha: 0.55, duration: 0.08, yoyo: true, repeat: 1 }, llega)
      .fromTo(brote, { p: 0 }, { p: 1, duration: 1.4, ease: "power1.out", onUpdate: () => {
        c.vel.forEach(([vx, vy, vz], i) => pos.setXYZ(i, X_DESTINO + vx * brote.p, ALTO_LETRA + vy * brote.p - 3.2 * brote.p * brote.p, vz * brote.p));
        pos.needsUpdate = true;
        c.chispas.material.opacity = brote.p > 0 ? 1 - brote.p : 0;
      } }, llega)
      .to(c.foco, { intensity: 16, duration: 0.8 }, llega + 0.1)
      .to(mira, { x: -1.2, y: 0.75, duration: 1.6, ease: "power2.inOut" }, llega)
      .to(camara.position, { x: -0.9, y: 1.8, z: 11.6, duration: 1.6, ease: "power2.inOut" }, llega);
    letras.slice().reverse().forEach((l, i) => {
      tl.to(l.luz, { v: 1, duration: 0.45, ease: "power2.out", onUpdate: () => prender(l, l.luz.v) }, llega + 0.05 + i * 0.09)
        .fromTo(l.g.scale, { y: 1 }, { y: 1.12, duration: 0.12, yoyo: true, repeat: 1 }, llega + 0.05 + i * 0.09);
    });
    // Festejo: salto con giro arriba de la N y saludo a cámara
    const salta = llega + 1.2;
    pose(salta - 0.1, { aplaste: 0.8 }, 0.1);
    pose(salta, { aplaste: -0.5, brazoI: -2.9, brazoD: -2.9, piernaI: -1, piernaD: -1 }, 0.15);
    tl.to(pj.raiz.position, { x: X_DESTINO, duration: 0.9, ease: "power1.inOut" }, salta)
      .to(pj.raiz.position, { y: ALTO_LETRA + 1.4, duration: 0.45, ease: "power2.out" }, salta)
      .to(pj.raiz.position, { y: ALTO_LETRA, duration: 0.45, ease: "power2.in" }, salta + 0.45)
      .to(pj.raiz.rotation, { y: Math.PI * 2, duration: 0.9, ease: "power1.inOut" }, salta)
      .to(n.g.scale, { y: 0.9, x: 1.05, duration: 0.09, yoyo: true, repeat: 1 }, salta + 0.9);
    pose(salta + 0.9, { aplaste: 1, brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0 }, 0.08);
    pose(salta + 0.98, { aplaste: 0 }, 0.4, "elastic.out(1, 0.4)");
    pose(salta + 1.4, { brazoD: -2.8 }, 0.25);
    tl.to(pj.raiz.rotation, { z: 0.08, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, salta + 1.6)
      .to([c.cineA, c.cineB], { scaleY: 0, duration: 0.9, ease: "power2.inOut" }, salta + 1.5)
      .fromTo(c.bajada, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7 }, salta + 1.8);
    pose(salta + 2.4, { brazoD: 0 }, 0.3);
  },

  vida(c) {
    if (c.sin3d) return { kill() {} };
    const tick = (tt) => {
      c.camara.position.x += Math.sin(tt * 0.21) * 0.0016;
      c.camara.position.y += Math.cos(tt * 0.17) * 0.0011;
      c.polvo.rotation.y = tt * 0.02;
      c.polvo.position.y = Math.sin(tt * 0.3) * 0.15;
      c.letras.forEach((l, i) => { l.material.emissiveIntensity = 0.5 + Math.sin(tt * (0.6 + i * 0.07) + i) * 0.1; });
      c.pj.cabeza.rotation.y = Math.sin(tt * 0.5) * 0.25;
    };
    gsap.ticker.add(tick);
    const festejo = eventos(() => {
      const p = c.pj;
      gsap.timeline()
        .to(p.pose, { aplaste: 0.6, duration: 0.1, onUpdate: p.aplicar })
        .to(p.pose, { aplaste: -0.4, brazoI: -2.8, brazoD: -2.8, duration: 0.12, onUpdate: p.aplicar })
        .to(p.raiz.position, { y: ALTO_LETRA + 0.6, duration: 0.25, ease: "power2.out" }, "<")
        .to(p.raiz.position, { y: ALTO_LETRA, duration: 0.25, ease: "power2.in" })
        .to(p.pose, { aplaste: 0.8, brazoI: 0, brazoD: 0, duration: 0.07, onUpdate: p.aplicar })
        .to(p.pose, { aplaste: 0, duration: 0.35, ease: "elastic.out(1, 0.4)", onUpdate: p.aplicar });
    }, [3.5, 7]);
    return juntas({ kill: () => gsap.ticker.remove(tick) }, festejo);
  },

  desmontar(c) { if (c.destruir) c.destruir(); },
};
