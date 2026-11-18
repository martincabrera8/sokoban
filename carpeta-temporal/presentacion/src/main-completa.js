import { registrar, iniciar } from "./motor.js";
import intro from "./diagramas/intro.js";
import portada from "./diagramas/portada.js";
import equipo from "./diagramas/equipo.js";
import arte from "./diagramas/arte.js";
import epocas from "./diagramas/epocas.js";
import interfaz from "./diagramas/interfaz.js";
import capas from "./diagramas/capas.js";
import uml from "./diagramas/uml.js";
import patron from "./diagramas/patron.js";
import niveles from "./diagramas/niveles.js";
import final from "./diagramas/final.js";

/* Presentación completa (python3 build.py --completa): las diapositivas con data-auto se arman solas y en bucle;
   el plano UML y los diagramas de cada patrón avanzan con las flechas. */
Object.entries({ intro, portada, equipo, arte, epocas, interfaz, capas, uml, patron, niveles, final })
  .forEach(([clave, modulo]) => registrar(clave, modulo));

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
else iniciar();
