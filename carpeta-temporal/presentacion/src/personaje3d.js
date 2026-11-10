import * as THREE from "three";

/**
 * El personaje del juego en 3D, hecho con los píxeles reales del sprite de Martín (characters/player_down.png):
 * cada píxel de arte es un cubito de su mismo color. build.py lo lee del PNG y lo deja en window.PERSONAJE.
 * Cabeza, brazos y piernas son grupos aparte que giran desde el cuello, los hombros y la cadera.
 */
const V = 0.045;                                    // lado de un píxel de arte, en metros de la escena
const FILAS = 28, CENTRO = 9;
const PROFUNDIDAD = { cabeza: 7, torso: 5, brazoI: 4, brazoD: 4, piernaI: 4, piernaD: 4 };
const PIVOTE = { cabeza: 13, brazoI: 14, brazoD: 14, piernaI: 22, piernaD: 22, torso: 0 }; // fila de arte del giro
const mundo = (c, r) => [(c - CENTRO) * V, (FILAS - 1 - r) * V + V / 2];

export function crearPersonaje(escala = 1) {
  const datos = window.PERSONAJE || [];
  const raiz = new THREE.Group();
  const cuerpo = new THREE.Group();
  raiz.add(cuerpo);
  const geo = new THREE.BoxGeometry(V * 1.002, V * 1.002, V * 1.002);
  const material = new THREE.MeshStandardMaterial({ roughness: 0.72, metalness: 0 }); // uno para todo el cuerpo: un solo programa
  const grupos = {};
  Object.keys(PROFUNDIDAD).forEach((zona) => {
    const propios = datos.filter((d) => d[3] === zona);
    const prof = PROFUNDIDAD[zona];
    const malla = new THREE.InstancedMesh(geo, material, Math.max(1, propios.length * prof));
    malla.castShadow = true;
    malla.frustumCulled = false;
    const g = new THREE.Group();
    const columnas = propios.map((d) => d[0]);
    const cx = columnas.length ? (Math.min(...columnas) + Math.max(...columnas)) / 2 : CENTRO;
    const [px, py] = zona === "torso" ? [0, 0] : mundo(zona.startsWith("pierna") || zona.startsWith("brazo") ? cx : CENTRO, PIVOTE[zona]);
    g.position.set(px, zona === "torso" ? 0 : py + V / 2, 0);
    const m = new THREE.Matrix4(), color = new THREE.Color();
    let i = 0;
    propios.forEach(([c, r, rgb]) => {
      const [x, y] = mundo(c, r);
      color.setHex(rgb, THREE.SRGBColorSpace);
      for (let k = 0; k < prof; k++) {
        m.makeTranslation(x - g.position.x, y - g.position.y, (k - (prof - 1) / 2) * V);
        malla.setMatrixAt(i, m);
        malla.setColorAt(i, color);
        i += 1;
      }
    });
    malla.count = i;
    g.add(malla);
    cuerpo.add(g);
    grupos[zona] = g;
  });
  raiz.scale.setScalar(escala);

  const pose = { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0, aplaste: 0, abrir: 0 };
  /** Ángulos en radianes (negativo = hacia adelante); aplaste: 1 aplasta, -1 estira; abrir separa los brazos del cuerpo. */
  const aplicar = () => {
    grupos.brazoI.rotation.x = pose.brazoI; grupos.brazoD.rotation.x = pose.brazoD;
    grupos.brazoI.rotation.z = -pose.abrir; grupos.brazoD.rotation.z = pose.abrir;
    grupos.piernaI.rotation.x = pose.piernaI; grupos.piernaD.rotation.x = pose.piernaD;
    cuerpo.scale.set(1 + pose.aplaste * 0.16, 1 - pose.aplaste * 0.2, 1 + pose.aplaste * 0.16);
  };
  const correr = (f, amplitud = 0.9) => {
    const s = Math.sin(f);
    pose.brazoI = s * amplitud; pose.brazoD = -s * amplitud; pose.piernaI = -s * amplitud * 0.8; pose.piernaD = s * amplitud * 0.8;
    aplicar();
  };
  return { raiz, cabeza: grupos.cabeza, pose, aplicar, correr, alto: FILAS * V * escala };
}
