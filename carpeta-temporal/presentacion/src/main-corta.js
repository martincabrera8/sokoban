import { registrar, iniciar } from "./motor.js";
import portada from "./diagramas/portada.js";
import capas from "./diagramas/capas.js";
import patron from "./diagramas/patron.js";
import niveles from "./diagramas/niveles.js";
import final from "./diagramas/final.js";

/* Presentación corta: portada, arquitectura, un patrón por diapositiva, calidad y cierre (python3 build.py --corta). */
Object.entries({ portada, capas, patron, niveles, final })
  .forEach(([clave, modulo]) => registrar(clave, modulo));

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
else iniciar();
