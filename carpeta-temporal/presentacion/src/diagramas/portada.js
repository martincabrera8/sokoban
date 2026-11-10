import * as THREE from "three";
import { gsap } from "gsap";
import { crearEscena, EPOCAS, GIRO } from "../escena3d.js";
import { el, t, eventos, juntas } from "../util.js";

/*
 * Portada: el almacén con sus tres épocas. Plano corto del personaje empujando una caja; la caja encastra en su
 * destino (onda, chispas, columna de luz) y la cámara sube en grúa hasta mostrar el tablero entero, con un foco
 * del color de cada época y el fondo real de 1955, 1985 y 2015 detrás.
 */
export default {
  montar(lienzo) {
    const esc = crearEscena(lienzo, { etiqueta: "El almacén del Sokoban en 3D: el personaje empuja una caja hasta su destino; el tablero cruza 1955, 1985 y 2015" });
    el("div", "portada__velo", lienzo);
    if (esc.sin3d) return { esc };
    const { pos, cajas, destinos, haz, onda, chispas } = esc;
    const caja0 = cajas.find((c) => !c.userData.enDestino && c.userData.y === 3);
    const meta = destinos.find((d) => d.y === 3);
    const pMeta = pos(meta.x, meta.y);
    const columna = haz({ color: t("acento"), arriba: pMeta.clone().setY(5.5), abajo: pMeta.clone().setY(0), rArriba: 0.62, rAbajo: 0.5, desdeArriba: false });
    const luzMeta = new THREE.PointLight(t("acento"), 0, 4.5, 1.6);
    luzMeta.position.copy(pMeta).setY(0.9);
    esc.escena.add(luzMeta);
    const anillo = onda(t("acento"), pMeta);
    const brote = chispas(160, t("acento"), { vel: [0.8, 3.6], alto: [2, 5.5] });
    brote.origen.copy(pMeta).setY(0.8);
    const pies = [chispas(26, t("tinta-2"), { tam: 0.09, vel: [0.2, 0.7], alto: [0.3, 0.8], g: 0.9, vida: [0.6, 1] }), chispas(26, t("tinta-2"), { tam: 0.09, vel: [0.2, 0.7], alto: [0.3, 0.8], g: 0.9, vida: [0.6, 1] })];
    // Un foco por época, del color de su época, sobre su tercio del almacén
    const focos = EPOCAS.map((ep, i) => {
      const x = (i - 1) * 3.4;
      return haz({ color: t("e" + ep), arriba: new THREE.Vector3(x - 0.8, 7.5, -1.2), abajo: new THREE.Vector3(x, 0, 0), rArriba: 0.1, rAbajo: 2.1, luz: true, intensidad: 26 });
    });
    // Año de cada época flotando sobre la pared del fondo
    const capa = esc.capaAnclas("portada__anclas");
    const anios = EPOCAS.map((ep, i) => {
      const ancla = el("div", "portada__ancla", capa);
      esc.anclar(ancla, pos(2 + i * 3, 0).setY(1.3));
      return el("div", "portada__anio portada__anio--" + ep, ancla, { texto: ep });
    });
    return { esc, caja0, meta, columna, luzMeta, anillo, brote, pies, focos, anios };
  },

  construir(tl, c) {
    const { esc } = c;
    if (esc.sin3d) return;
    const { rig, pj, jugador, F, filos } = esc;
    // Plano corto: la cámara al costado del personaje, que mira hacia la caja
    jugador.rotation.y = GIRO.derecha;
    tl.fromTo(rig.mira, { x: -2.3, y: 0.45, z: 0 }, { x: -1.1, y: 0.45, z: 0, duration: 2, ease: "power1.inOut" }, 0)
      .fromTo(rig, { dist: 4.4, giro: 0.1, alto: 0.48, encuadre: 0.25 }, { dist: 5, giro: 0.24, alto: 0.5, encuadre: 0.25, duration: 2, ease: "power1.inOut" }, 0)
      .set(F.uLuz, { value: 0.22 }, 0)
      .set(filos.map((f) => f.scale), { y: 0.001 }, 0)
      .set(c.focos.map((f) => f.fuerza), { value: 0 }, 0)
      .set(c.focos.map((f) => f.luz), { intensity: 0 }, 0)
      .set(c.anios, { autoAlpha: 0 }, 0);

    // Empuja dos baldosas y la caja encastra
    const llega = esc.empujar(tl, 0.75, c.caja0, 1, 0, 2, { paso: 0.55, polvoPies: c.pies }) - 0.1;
    const brote = { p: 0 };
    tl.to(c.meta.mat, { emissiveIntensity: 2, duration: 0.18, ease: "power2.out" }, llega)
      .to(c.meta.mat, { emissiveIntensity: 1.3, duration: 1.2, ease: "power2.inOut" }, llega + 0.2)
      .to(c.caja0.material, { emissiveIntensity: 0.55, duration: 0.5, ease: "power2.out" }, llega)
      .to(c.luzMeta, { intensity: 6, duration: 0.4, ease: "power2.out" }, llega)
      .fromTo(c.anillo.scale, { x: 0.2, y: 0.2 }, { x: 13, y: 13, duration: 1.4, ease: "power2.out" }, llega)
      .fromTo(c.anillo.material, { opacity: 0.95 }, { opacity: 0, duration: 1.4, ease: "power1.in" }, llega)
      .fromTo(brote, { p: 0 }, { p: 1, duration: 1.6, ease: "power1.out", onUpdate: () => c.brote.brotar(brote.p) }, llega)
      .fromTo(c.columna.fuerza, { value: 0 }, { value: 0.85, duration: 0.25, ease: "power2.out" }, llega)
      .to(c.columna.fuerza, { value: 0.42, duration: 1.4, ease: "power2.inOut" }, llega + 0.3)
      .fromTo(rig, { temblor: 0.05 }, { temblor: 0, duration: 0.45, ease: "power2.out", immediateRender: false }, llega);

    // El personaje se da vuelta y festeja con un saltito
    const pose = (en, v, d = 0.18, ease = "power2.out") => tl.to(pj.pose, { ...v, duration: d, ease, onUpdate: pj.aplicar }, en);
    tl.to(jugador.rotation, { y: 0.45, duration: 0.5, ease: "power2.inOut" }, llega + 0.35);
    pose(llega + 0.75, { aplaste: 0.6, brazoI: 0.4, brazoD: 0.4 }, 0.1);
    pose(llega + 0.85, { aplaste: -0.4, brazoI: -2.8, brazoD: -2.8, abrir: 0.35 }, 0.14);
    tl.to(jugador.position, { y: 0.55, duration: 0.24, ease: "power2.out" }, llega + 0.85)
      .to(jugador.position, { y: 0, duration: 0.24, ease: "power2.in" }, llega + 1.09);
    pose(llega + 1.33, { aplaste: 0.7, brazoI: 0, brazoD: 0, abrir: 0 }, 0.07);
    pose(llega + 1.4, { aplaste: 0 }, 0.4, "elastic.out(1, 0.4)");

    // Grúa: sube y se aleja hasta mostrar el almacén entero; se encienden las tres épocas
    const g = llega + 0.2;
    tl.to(rig.mira, { x: 0.4, y: 0.2, z: 0, duration: 3, ease: "power2.inOut" }, g)
      .to(rig, { dist: 24.5, giro: -0.32, alto: 0.5, encuadre: 0.19, duration: 3, ease: "power2.inOut" }, g)
      // Margen para el salto: el cuadro baja un poco mientras el personaje festeja con los brazos arriba y después vuelve
      .fromTo(rig, { bajar: 0 }, { bajar: 0.16, duration: 0.45, ease: "power2.out", immediateRender: false }, llega + 0.4)
      .to(rig, { bajar: 0, duration: 1.6, ease: "power2.inOut" }, llega + 1.5)
      .to(F.uLuz, { value: 1, duration: 2.2, ease: "power1.inOut" }, g + 0.6);
    c.focos.forEach((f, i) => {
      const en = g + 1 + i * 0.32;
      tl.to(f.fuerza, { value: 0.5, duration: 0.12, ease: "power2.out" }, en)
        .to(f.fuerza, { value: 0.2, duration: 0.6, ease: "power2.inOut" }, en + 0.12)
        .to(f.luz, { intensity: f.intensidad, duration: 0.25, ease: "power2.out" }, en);
      tl.to(filos.filter((x) => x.userData.ep === EPOCAS[i]).map((x) => x.scale), { y: 1, duration: 0.4, ease: "power2.out" }, en);
    });
    tl.fromTo(c.anios, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.32, ease: "power3.out", immediateRender: false }, g + 1.1);
  },

  vida(c) {
    const { esc } = c;
    if (esc.sin3d) return { kill() {} };
    const base = esc.vida();
    const fases = c.focos.map(() => Math.random() * 6);
    const tick = (tt) => {
      c.focos.forEach((f, i) => { f.pulso.value = 1 + Math.sin(tt * (0.6 + i * 0.13) + fases[i]) * 0.2; });
      c.columna.pulso.value = 1 + Math.sin(tt * 1.1) * 0.15;
    };
    gsap.ticker.add(tick);
    // La caja que falta amaga moverse; la ubicada destella cada tanto
    const pendiente = esc.cajas.find((x) => !x.userData.enDestino && x !== c.caja0);
    const amague = eventos(() => {
      if (!pendiente) return;
      gsap.fromTo(pendiente.position, { x: pendiente.position.x }, { x: "+=0.07", duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" });
    }, [2.6, 6]);
    const destello = eventos(() => {
      gsap.fromTo(c.columna.pulso, { value: 1 }, { value: 2.2, duration: 0.25, yoyo: true, repeat: 1, ease: "sine.inOut" });
    }, [2.5, 6]);
    return juntas(base, { kill: () => gsap.ticker.remove(tick) }, amague, destello);
  },

  desmontar: ({ esc }) => esc.destruir(),
};
