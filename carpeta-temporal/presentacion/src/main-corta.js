import { registrar, iniciar } from "./motor.js";
import portada from "./diagramas/portada.js";
import capas from "./diagramas/capas.js";
import reglas from "./diagramas/reglas.js";
import delorean from "./diagramas/delorean.js";
import repeticion from "./diagramas/repeticion.js";
import envoltura from "./diagramas/envoltura.js";
import plano from "./diagramas/plano.js";
import niveles from "./diagramas/niveles.js";
import final from "./diagramas/final.js";

/* Presentación corta: 9 diapositivas (python3 build.py --corta). */
Object.entries({ portada, capas, reglas, delorean, repeticion, envoltura, plano, niveles, final })
  .forEach(([clave, modulo]) => registrar(clave, modulo));

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
else iniciar();
