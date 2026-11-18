import { registrar, iniciar } from "./motor.js";
import intro from "./diagramas/intro.js";
import portada from "./diagramas/portada.js";
import equipo from "./diagramas/equipo.js";
import arte from "./diagramas/arte.js";
import epocas from "./diagramas/epocas.js";
import interfaz from "./diagramas/interfaz.js";
import capas from "./diagramas/capas.js";
import plano from "./diagramas/plano.js";
import niveles from "./diagramas/niveles.js";
import final from "./diagramas/final.js";

/* Presentación completa (python3 build.py --completa): las diapositivas con data-auto se arman solas y en bucle;
   el plano UML (con un paso por patrón) avanza con las flechas. Arranca en pausa: la I la inicia. */
Object.entries({ intro, portada, equipo, arte, epocas, interfaz, capas, plano, niveles, final })
  .forEach(([clave, modulo]) => registrar(clave, modulo));

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
else iniciar();
