// Controla que cada línea de código que muestra la presentación exista tal cual en src/main/java/sokoban/.
// Uso: node verificar-codigo.mjs   (build.py lo corre antes de armar)
import { readFileSync } from "node:fs";
import { PATRONES } from "./src/datos-patrones.js";

const RAIZ = new URL("../../src/main/java/sokoban/", import.meta.url);
let fallas = 0;
for (const [clave, p] of Object.entries(PATRONES)) {
  for (const { archivo, lineas } of p.codigo) {
    const fuente = readFileSync(new URL(archivo, RAIZ), "utf8").split("\n").map((l) => l.trim());
    for (const l of lineas) {
      if (l.trim() === "// ..." || fuente.includes(l.trim())) continue;
      console.log(`${clave}: ${archivo} no tiene «${l.trim()}»`);
      fallas++;
    }
  }
}
if (fallas) process.exit(1);
console.log("código ok");
