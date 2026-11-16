/* Datos reales de la presentación corta, con su fuente. Nada de datos dentro del dibujo. */

/** Partidas cortas sobre los niveles reales, verificadas con las reglas de MotorMovimiento (src/sokoban-sim.js).
 *  DeLorean, nivel 2: junta el plutonio, la llave abre los muros, la frágil llega a su destino (se guarda un punto)
 *  y un empuje de más la rompe. Repetición, nivel 1: seis comandos que después se vuelven a ejecutar. */
export const DEMOS = {
  delorean: { nivel: 2, teclas: "←↑↑↑→↓↓↓←↓→↓→→→→" },
  repeticion: { nivel: 1, teclas: "↓←←↑→→" },
};

/** Niveles reales (niveles/nivelN.txt) con la solución más corta que encontró VerificadorDeNiveles
 *  (la misma que juega NivelesTest). Símbolos: $ normal, F frágil, L llave, C cerrojo, X muro, ~ hielo, P plutonio. */
export const NIVELES = [
  {
    numero: 1, epoca: 1955, nombre: "El depósito",
    mapa: ["#########", "#P   . ##", "##$     #", "# $@ #. #", "#  $ #  #", "#     .##", "#########"],
    solucion: "↓←←↑→ →↑↑←↓ ↓←↓→↓ →↑↑↓↓ →→←↑↑ ←↑→→↑ →↓←←← ←↑→→", movimientos: 39, empujes: 18,
    prueba: "El 70% de las posiciones no tiene salida",
  },
  {
    numero: 2, epoca: 1985, nombre: "El centro comercial cerrado",
    mapa: ["###########", "#P   #    #", "#  $ X  . #", "# L  #    #", "# @  X .  #", "#  C #    #", "#   FX.   #", "###########"],
    solucion: "←↑→↑→ ↓↓←↓→ ↓→→←↑ ←↑→→→ ←←↑←↑ →→→→", movimientos: 29, empujes: 15,
    prueba: "Sin el cerrojo, no tiene solución",
  },
  {
    numero: 3, epoca: 2015, nombre: "La pista de hielo",
    mapa: ["############", "#    #     #", "# F ~~~~~. #", "#    #  #  #", "# @ $~~~ . #", "#  $ #   . #", "#   P#     #", "############"],
    solucion: "↑←↑→→ ↓↓→↓↓ ←↑←↑→ →→→↑→ ↓→←←↓ →→", movimientos: 27, empujes: 10,
    prueba: "Sin el hielo, no tiene solución",
  },
];

/** Pruebas JUnit 5 de src/test/java (mvn package las corre; todas pasan). Fuente: target/surefire-reports. */
export const PRUEBAS = [
  { clase: "ReglasTest", cuantas: 17, que: "movimiento, hielo, frágil, llave, deshacer, DeLorean, puntaje" },
  { clase: "NivelesTest", cuantas: 3, que: "la solución más corta completa cada nivel" },
  { clase: "JuegoConSonidoTest", cuantas: 2, que: "el sonido del cerrojo" },
  { clase: "RepeticionTest", cuantas: 1, que: "la repetición termina igual" },
];

/** Quién hizo qué. Fuente: informe técnico (Organización del trabajo) y el historial del repositorio. */
export const EQUIPO = [
  { nombre: "Martín Cabrera", parte: "Arte, integración y las dos funcionalidades: DeLorean y repetición" },
  { nombre: "Luca Di Gresia", parte: "Interfaz Swing, el contrato entre vista y dominio, y la auditoría" },
  { nombre: "Pedro Castillo y Lucía Santamarina", parte: "Dominio: reglas, cajas, hielo, cerrojo y personaje" },
  { nombre: "Mora Coghlan", parte: "Sonido: 16 efectos propios, Decorator y State" },
];
