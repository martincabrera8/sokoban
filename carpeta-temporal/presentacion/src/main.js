import { registrar, iniciar } from "./motor.js";
import intro from "./diagramas/intro.js";
import portada from "./diagramas/portada.js";
import equipo from "./diagramas/equipo.js";
import arte from "./diagramas/arte.js";
import epocas from "./diagramas/epocas.js";
import interfaz from "./diagramas/interfaz.js";
import arquitectura from "./diagramas/arquitectura.js";
import observer from "./diagramas/observer.js";
import facade from "./diagramas/facade.js";
import singleton from "./diagramas/singleton.js";
import uml from "./diagramas/uml.js";
import falta from "./diagramas/falta.js";
import cierre from "./diagramas/cierre.js";

Object.entries({ intro, portada, equipo, arte, epocas, interfaz, arquitectura, observer, facade, singleton, uml, falta, cierre })
  .forEach(([clave, modulo]) => registrar(clave, modulo));

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
else iniciar();
