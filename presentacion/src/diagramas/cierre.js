import { crearEscena } from "../escena3d.js";
import { el } from "../util.js";

/** Cierre: vuelve el almacén, la cámara sube y deja ver la caja que todavía espera. */
export default {
  montar(lienzo) {
    const esc = crearEscena(lienzo, { encuadre: 0.17 });
    el("div", "velo-portada", lienzo);
    return { esc };
  },
  construir(tl, { esc }) { esc.cierre(tl, 0); },
  vida: ({ esc }) => esc.vida(),
  desmontar: ({ esc }) => esc.destruir(),
};
