import { crearEscena } from "../escena3d.js";
import { el } from "../util.js";

/** Portada: el almacén en 3D; el personaje empuja una caja hasta su destino. */
export default {
  montar(lienzo) {
    const esc = crearEscena(lienzo, { encuadre: 0.17 });
    el("div", "velo-portada", lienzo);
    return { esc };
  },
  construir(tl, { esc }) { esc.intro(tl, 0); },
  vida: ({ esc }) => esc.vida(),
  desmontar: ({ esc }) => esc.destruir(),
};
