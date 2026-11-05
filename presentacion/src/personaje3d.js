import * as THREE from "three";
import { t } from "./util.js";

/**
 * El personaje del Sokoban en vóxeles, con los colores del sprite de Martín (assets/characters).
 * El grupo tiene el origen en los pies; brazos y piernas giran desde el hombro y la cadera.
 */
export function crearPersonaje(escala = 1) {
  const mat = (k) => new THREE.MeshStandardMaterial({ color: new THREE.Color(t(k)), roughness: 0.75, metalness: 0 });
  const campera = mat("pj-campera"), jean = mat("pj-jean"), piel = mat("pj-piel"), pelo = mat("pj-pelo"), oscuro = mat("pj-oscuro");
  const caja = (w, h, d, m, x, y, z, padre) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    c.position.set(x, y, z);
    c.castShadow = true;
    padre.add(c);
    return c;
  };
  const raiz = new THREE.Group();
  const cuerpo = new THREE.Group();          // se aplasta y se estira sin mover los pies
  raiz.add(cuerpo);

  const pierna = (x) => {
    const g = new THREE.Group();
    g.position.set(x, 0.38, 0);
    caja(0.14, 0.32, 0.16, jean, 0, -0.16, 0, g);
    caja(0.15, 0.07, 0.2, oscuro, 0, -0.345, 0.02, g);
    cuerpo.add(g);
    return g;
  };
  const brazo = (x) => {
    const g = new THREE.Group();
    g.position.set(x, 0.68, 0);
    caja(0.11, 0.26, 0.12, campera, 0, -0.13, 0, g);
    caja(0.1, 0.08, 0.1, piel, 0, -0.3, 0, g);
    cuerpo.add(g);
    return g;
  };
  const piernas = [pierna(-0.085), pierna(0.085)];
  caja(0.36, 0.34, 0.21, campera, 0, 0.54, 0, cuerpo);
  caja(0.37, 0.06, 0.22, jean, 0, 0.39, 0, cuerpo);
  const brazos = [brazo(-0.24), brazo(0.24)];
  const cabeza = new THREE.Group();
  cabeza.position.set(0, 0.71, 0);
  caja(0.32, 0.3, 0.28, piel, 0, 0.15, 0, cabeza);
  caja(0.34, 0.1, 0.3, pelo, 0, 0.31, -0.005, cabeza);
  caja(0.34, 0.2, 0.06, pelo, 0, 0.2, -0.14, cabeza);
  caja(0.05, 0.06, 0.02, oscuro, -0.07, 0.17, 0.145, cabeza);
  caja(0.05, 0.06, 0.02, oscuro, 0.07, 0.17, 0.145, cabeza);
  cuerpo.add(cabeza);
  raiz.scale.setScalar(escala);

  const pose = { brazoI: 0, brazoD: 0, piernaI: 0, piernaD: 0, aplaste: 0 };
  /** Aplica la pose: ángulos en radianes (negativo = hacia adelante) y aplaste (-1 estira, 1 aplasta). */
  const aplicar = () => {
    brazos[0].rotation.x = pose.brazoI; brazos[1].rotation.x = pose.brazoD;
    piernas[0].rotation.x = pose.piernaI; piernas[1].rotation.x = pose.piernaD;
    cuerpo.scale.set(1 + pose.aplaste * 0.18, 1 - pose.aplaste * 0.22, 1 + pose.aplaste * 0.18);
  };
  /** Ciclo de carrera: f avanza con el tiempo. */
  const correr = (f, amplitud = 0.9) => {
    const s = Math.sin(f);
    pose.brazoI = s * amplitud; pose.brazoD = -s * amplitud; pose.piernaI = -s * amplitud * 0.8; pose.piernaD = s * amplitud * 0.8;
    aplicar();
  };
  return { raiz, cabeza, brazos, pose, aplicar, correr };
}
