import { crearEscena } from "../escena3d.js";
import { el } from "../util.js";

/* El mismo almacén cruza las tres épocas: un haz de luz lo recorre y cambia pisos, paredes y el telón de fondo. */
const EPOCAS = [
  { anio: "1955", texto: "Ladrillo, adoquín y la torre del reloj de fondo" },
  { anio: "1985", texto: "Vidrieras del shopping y asfalto con autos" },
  { anio: "2015", texto: "Paneles de luz y una ciudad que brilla" },
];

export default {
  montar(lienzo) {
    const esc = crearEscena(lienzo, { encuadre: 0.16, bajar: 0.12, epocaFija: "1955" });
    const fondos = esc.telones ? esc.telones() : null;
    el("div", "velo-portada velo-portada--abajo", lienzo);
    const fichas = EPOCAS.map((e) => {
      const f = el("div", "epoca pos", lienzo, { vars: { x: 120, y: 780 } });
      el("div", "epoca__anio epoca__anio--" + e.anio, f, { texto: e.anio });
      el("div", "anclado__detalle", f, { texto: e.texto });
      return f;
    });
    return { esc, fondos, fichas };
  },
  construir(tl, { esc, fondos, fichas }) {
    if (esc.orbita) esc.orbita(tl, 0);
    tl.fromTo(fichas[0], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 1)
      .set(fichas.slice(1), { autoAlpha: 0 }, 0);
    [["1955", "1985"], ["1985", "2015"]].forEach(([a, b], i) => {
      tl.addLabel("p" + (i + 1));
      if (esc.barrido) esc.barrido(tl, "p" + (i + 1), a, b, fondos);
      tl.to(fichas[i], { autoAlpha: 0, y: -16, duration: 0.4 }, "p" + (i + 1))
        .fromTo(fichas[i + 1], { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6 }, `p${i + 1}+=0.9`);
    });
  },
  vida: ({ esc }) => esc.vida(),
  desmontar: ({ esc }) => esc.destruir(),
};
