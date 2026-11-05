import * as THREE from "three";
import { gsap } from "gsap";
import { crearEscena, GIRO } from "../escena3d.js";
import { el, t, eventos, juntas } from "../util.js";
import { PARTES } from "../datos.js";

/*
 * Cierre: vuelve el almacén y la cámara sube en grúa mientras cae la noche. Cada parte del trabajo es una caja:
 * las tres terminadas se encienden sobre su destino; la del dominio espera bajo un foco, con el personaje listo
 * para empujarla. El remate es una onda dorada que recorre el tablero.
 */
const NIVEL = [
  "###########",
  "#  *    * #",
  "#         #",
  "# @$ .  * #",
  "#      $  #",
  "#      .  #",
  "###########",
];
/** Caja de cada parte (columna, fila) en el orden de PARTES; el destino de las pendientes. */
const UBICACION = [[3, 1], [8, 1], [8, 3], [3, 3], [7, 4]];
const DESTINO_PENDIENTE = { 3: [5, 3], 4: [7, 5] };

export default {
  montar(lienzo, { slide }) {
    const esc = crearEscena(lienzo, { nivel: NIVEL, etiqueta: "El almacén visto desde arriba: tres cajas terminadas brillan sobre su destino y la del dominio espera bajo un foco" });
    el("div", "cierre__velo", lienzo);
    const equipo = slide.querySelector(".equipo-linea");
    if (equipo) equipo.classList.add("cierre__equipo");
    if (esc.sin3d) return { esc, equipo };
    const { pos, cajas, destinos, haz, onda, chispas } = esc;
    const capa = esc.capaAnclas("cierre__anclas");
    const partes = PARTES.map((parte, i) => {
      const [x, y] = UBICACION[i];
      const caja = cajas.find((m) => m.userData.x === x && m.userData.y === y);
      const [dx, dy] = parte.listo ? [x, y] : DESTINO_PENDIENTE[i];
      const destino = destinos.find((d) => d.x === dx && d.y === dy);
      const p = pos(x, y);
      const ancla = el("div", "cierre__ancla", capa);
      esc.anclar(ancla, parte.listo ? p.clone().setY(1.05) : p.clone().add(new THREE.Vector3(0, 0, 0.62)));
      if (!parte.listo) ancla.classList.add("cierre__ancla--abajo");
      const chip = el("div", "cierre__chip" + (parte.listo ? " cierre__chip--listo" : i === 3 ? " cierre__chip--proximo" : ""), ancla);
      el("b", "", chip, { texto: parte.nombre });
      el("span", "", chip, { texto: parte.listo ? parte.quien : i === 3 ? "próximo nivel" : "pendiente" });
      const res = { parte, caja, destino, chip, p };
      if (parte.listo) {
        res.columna = haz({ color: t("acento"), arriba: p.clone().setY(4.2), abajo: p.clone(), rArriba: 0.55, rAbajo: 0.48, desdeArriba: false });
        res.anillo = onda(t("acento"), p);
        res.luz = new THREE.PointLight(t("acento"), 0, 3.5, 1.6);
        res.luz.position.copy(p).setY(0.9);
        esc.escena.add(res.luz);
      }
      return res;
    });
    const dominio = partes[3], musica = partes[4];
    const entre = dominio.p.clone().lerp(pos(5, 3), 0.5);
    const foco = haz({ color: t("titulo"), arriba: entre.clone().add(new THREE.Vector3(-0.6, 7.5, 0.8)), abajo: entre, rArriba: 0.08, rAbajo: 1.35, luz: true, sombra: true, intensidad: 45 });
    const focoMusica = haz({ color: t("tinta-2"), arriba: musica.p.clone().add(new THREE.Vector3(0.4, 6.5, 0.6)), abajo: musica.p.clone().setZ(musica.p.z + 0.5), rArriba: 0.06, rAbajo: 1.05, luz: true, intensidad: 22 });
    const fuegos = [0, 1, 2].map((i) => {
      const ch = chispas(180, i === 1 ? t("titulo") : t("acento"), { vel: [1.5, 4.2], alto: [-1, 2.5], g: 2.2, abierto: 1, vida: [0.7, 1] });
      ch.origen.set(-2.5 + i * 2.6, 5.2 + (i % 2) * 0.8, -0.6);
      return ch;
    });
    const brotes = partes.filter((x) => x.parte.listo).map((x) => {
      const ch = chispas(70, t("acento"), { vel: [0.4, 1.8], alto: [2.5, 5], g: 3.5 });
      ch.origen.copy(x.p).setY(0.85);
      return ch;
    });
    return { esc, equipo, partes, dominio, musica, foco, focoMusica, fuegos, brotes };
  },

  construir(tl, c) {
    const { esc } = c;
    if (esc.sin3d) {
      tl.addLabel("p1").addLabel("p2");
      if (c.equipo) tl.fromTo(c.equipo, { "--luz": 0 }, { "--luz": 1, duration: 0.8 }, "p2");
      return;
    }
    const { rig, F, U, pj, jugador } = esc;
    const listos = c.partes.filter((x) => x.parte.listo);
    const pendientes = c.partes.filter((x) => !x.parte.listo);
    jugador.rotation.y = GIRO.derecha;

    // Estado inicial: el mismo encuadre con que terminó la portada, todo apagado
    tl.set(listos.map((x) => x.caja.material), { emissiveIntensity: 0 }, 0)
      .set(listos.map((x) => x.destino.mat), { emissiveIntensity: 0.25 }, 0)
      .set(listos.map((x) => x.columna.fuerza), { value: 0 }, 0)
      .set([c.foco.fuerza, c.focoMusica.fuerza], { value: 0 }, 0)
      .set([c.foco.luz, c.focoMusica.luz], { intensity: 0 }, 0)
      .set(c.partes.map((x) => x.chip), { autoAlpha: 0 }, 0);
    if (c.equipo) tl.set(c.equipo, { "--luz": 0 }, 0);

    // La cámara se eleva y cae la noche
    tl.fromTo(rig.mira, { x: 0.4, y: 0.2, z: 0 }, { x: 0.7, y: 0, z: 0.5, duration: 3.6, ease: "power2.inOut" }, 0)
      .fromTo(rig, { dist: 24.5, giro: -0.32, alto: 0.5, encuadre: 0.19, bajar: 0 }, { dist: 24.5, giro: 0.1, alto: 1.0, encuadre: 0.2, bajar: 0, duration: 3.6, ease: "power2.inOut" }, 0)
      .fromTo(F.uLuz, { value: 1 }, { value: 0.3, duration: 2.6, ease: "power1.inOut" }, 0.2)
      .fromTo(esc.hemi, { intensity: 2 }, { intensity: 0.75, duration: 2.6, ease: "power1.inOut" }, 0.2)
      .fromTo(esc.sol, { intensity: 2.6 }, { intensity: 0.9, duration: 2.6, ease: "power1.inOut" }, 0.2);

    // Las tres partes terminadas se encienden una por una
    listos.forEach((x, i) => {
      const en = 1.5 + i * 0.55, br = { p: 0 };
      tl.to(x.destino.mat, { emissiveIntensity: 2.4, duration: 0.15, ease: "power2.out" }, en)
        .to(x.destino.mat, { emissiveIntensity: 1.3, duration: 0.9 }, en + 0.2)
        .to(x.caja.material, { emissiveIntensity: 0.6, duration: 0.4 }, en)
        .to(x.luz, { intensity: 7, duration: 0.4 }, en)
        .fromTo(x.columna.fuerza, { value: 0 }, { value: 1.5, duration: 0.18, ease: "power2.out", immediateRender: false }, en)
        .to(x.columna.fuerza, { value: 0.55, duration: 1.1, ease: "power2.inOut" }, en + 0.2)
        .fromTo(x.anillo.scale, { x: 0.2, y: 0.2 }, { x: 7, y: 7, duration: 1.1, ease: "power2.out" }, en)
        .fromTo(x.anillo.material, { opacity: 0.9 }, { opacity: 0, duration: 1.1, ease: "power1.in" }, en)
        .fromTo(br, { p: 0 }, { p: 1, duration: 1.3, ease: "power1.out", immediateRender: false, onUpdate: () => c.brotes[i].brotar(br.p) }, en)
        .fromTo(x.chip, { autoAlpha: 0, y: 16, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.8)", immediateRender: false }, en + 0.15);
    });

    // Paso 1: se prende el foco sobre el dominio; el personaje se prepara para empujar
    tl.addLabel("p1", 3.8);
    tl.to(c.foco.fuerza, { keyframes: [{ value: 0.7, duration: 0.06 }, { value: 0.1, duration: 0.08 }, { value: 0.85, duration: 0.07 }, { value: 0.4, duration: 0.6, ease: "power2.inOut" }] }, "p1")
      .to(c.foco.luz, { keyframes: [{ intensity: 40, duration: 0.06 }, { intensity: 6, duration: 0.08 }, { intensity: c.foco.intensidad, duration: 0.07 }] }, "p1")
      .to(c.dominio.destino.mat, { emissiveIntensity: 1, duration: 0.6, ease: "sine.inOut", yoyo: true, repeat: 3 }, "p1+=0.4")
      .fromTo(c.dominio.chip, { autoAlpha: 0, y: 16, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.8)", immediateRender: false }, "p1+=0.35")
      .to(rig.mira, { x: 0.1, y: 0, z: 0.4, duration: 2.2, ease: "power2.inOut" }, "p1")
      .to(rig, { dist: 22, giro: 0.22, alto: 0.9, duration: 2.2, ease: "power2.inOut" }, "p1")
      .to(esc.hemi, { intensity: 0.5, duration: 1 }, "p1")
      .to(c.focoMusica.fuerza, { value: 0.3, duration: 0.5 }, "p1+=1.1")
      .to(c.focoMusica.luz, { intensity: c.focoMusica.intensidad, duration: 0.5 }, "p1+=1.1")
      .fromTo(c.musica.chip, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", immediateRender: false }, "p1+=1.3");
    tl.to(pj.pose, { brazoI: -1.5, brazoD: -1.5, aplaste: 0.12, duration: 0.35, ease: "power2.out", onUpdate: pj.aplicar }, "p1+=0.6")
      .to(jugador.rotation, { x: 0.22, duration: 0.35, ease: "power2.out" }, "p1+=0.6")
      .to(jugador.position, { x: "+=0.12", duration: 0.35, ease: "power2.out" }, "p1+=0.6");

    // Paso 2: remate. Una onda dorada sale del destino que falta y recorre el almacén; fuegos arriba
    tl.addLabel("p2", "p1+=2.6");
    U.uBorde.value.set(t("acento")).multiplyScalar(0.55);
    U.uCentro.value.copy(c.dominio.destino.m.position);
    U.uAncho.value = 0.4;
    tl.fromTo(U.uFrente, { value: -1 }, { value: 13, duration: 2.4, ease: "power1.inOut", immediateRender: false }, "p2")
      .to(rig.mira, { x: 0.5, y: 0, z: 0.4, duration: 3, ease: "power2.inOut" }, "p2")
      .to(rig, { dist: 28, giro: 0.34, alto: 1.08, duration: 3, ease: "power2.inOut" }, "p2")
      .to(F.uLuz, { value: 0.45, duration: 2 }, "p2")
      .fromTo(esc.bloom, { strength: 0.7 }, { strength: 0.9, duration: 0.6, yoyo: true, repeat: 1, ease: "sine.inOut", immediateRender: false }, "p2+=0.4");
    listos.forEach((x, i) => {
      tl.to(x.columna.fuerza, { value: 1.4, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" }, `p2+=${0.5 + i * 0.25}`);
    });
    c.fuegos.forEach((f, i) => {
      const br = { p: 0 };
      tl.fromTo(br, { p: 0 }, { p: 1, duration: 1.7, ease: "power1.out", immediateRender: false, onUpdate: () => f.brotar(br.p) }, `p2+=${0.7 + i * 0.35}`);
    });
    if (c.equipo) tl.fromTo(c.equipo, { "--luz": 0 }, { "--luz": 1, duration: 1.2, ease: "power2.inOut", immediateRender: false }, "p2+=1");
  },

  vida(c) {
    const { esc } = c;
    if (esc.sin3d) return { kill() {} };
    const base = esc.vida();
    const fases = c.partes.map(() => Math.random() * 6);
    const tick = (tt) => {
      c.foco.pulso.value = 1 + Math.sin(tt * 0.9) * 0.08 + (Math.random() < 0.01 ? -0.3 : 0);
      c.partes.forEach((x, i) => { if (x.columna) x.columna.pulso.value = 1 + Math.sin(tt * (0.8 + i * 0.17) + fases[i]) * 0.18; });
    };
    gsap.ticker.add(tick);
    // La caja del dominio tiembla cada tanto: el personaje la quiere empujar y todavía no puede
    const caja = c.dominio.caja;
    const amague = eventos(() => {
      gsap.fromTo(caja.position, { x: caja.position.x }, { x: "+=0.06", duration: 0.1, yoyo: true, repeat: 3, ease: "power1.inOut" });
    }, [2.5, 5.5]);
    return juntas(base, { kill: () => gsap.ticker.remove(tick) }, amague);
  },

  desmontar: (c) => {
    if (c.equipo) c.equipo.classList.remove("cierre__equipo");
    c.esc.destruir();
  },
};
