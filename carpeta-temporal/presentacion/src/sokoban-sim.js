/* Las reglas de MotorMovimiento y EstadoNivel, en chico, para reproducir en pantalla una partida real.
   Sirve para mostrar la solución más corta de cada nivel (la misma que juega NivelesTest). */
const DIR = { "↑": [0, -1, "arriba"], "↓": [0, 1, "abajo"], "←": [-1, 0, "izquierda"], "→": [1, 0, "derecha"] };
const TIPO = { $: "normal", F: "fragil", L: "llave" };

/** Juega la solución sobre el mapa y devuelve el tablero fijo y un cuadro por movimiento. */
export function jugar(mapa, solucion) {
  const terreno = mapa.map((l) => [...l].map((ch) => (ch === "@" || TIPO[ch] ? " " : ch)));
  const cajas = [];
  let jug = null;
  mapa.forEach((l, y) => [...l].forEach((ch, x) => {
    if (TIPO[ch]) cajas.push({ id: cajas.length, tipo: TIPO[ch], x, y, res: ch === "F" ? 3 : 0, viva: true });
    if (ch === "@") jug = { x, y, mira: "abajo" };
  }));
  const fijo = terreno.map((f) => f.slice());
  const destinos = fijo.flat().filter((ch) => ch === ".").length;
  const dentro = (x, y) => y >= 0 && y < terreno.length && x >= 0 && x < terreno[y].length;
  const cajaEn = (x, y) => cajas.find((k) => k.viva && k.x === x && k.y === y);
  const libre = (x, y) => dentro(x, y) && !["#", "X"].includes(terreno[y][x]) && !cajaEn(x, y) && !(jug.x === x && jug.y === y);
  let movimientos = 0, empujes = 0, abiertos = false, plutonio = false;
  const foto = () => ({ jug: { ...jug }, cajas: cajas.map((k) => ({ ...k })), abiertos, plutonio, movimientos, empujes,
    completo: cajas.filter((k) => k.viva).length === destinos && cajas.filter((k) => k.viva).every((k) => terreno[k.y][k.x] === ".") });
  const cuadros = [foto()];
  for (const tecla of solucion.replace(/\s/g, "")) {
    const [dx, dy, mira] = DIR[tecla];
    jug.mira = mira;
    const nx = jug.x + dx, ny = jug.y + dy;
    const caja = cajaEn(nx, ny);
    if (!caja) {
      if (libre(nx, ny)) { jug.x = nx; jug.y = ny; movimientos++; }
    } else {
      let cx = nx + dx, cy = ny + dy;
      if (libre(cx, cy)) {
        while (dentro(cx, cy) && terreno[cy][cx] === "~" && libre(cx + dx, cy + dy)) { cx += dx; cy += dy; }
        caja.x = cx; caja.y = cy;
        if (caja.tipo === "fragil" && --caja.res <= 0) caja.viva = false;
        if (caja.tipo === "llave" && terreno[cy][cx] === "C") {
          abiertos = true;
          terreno.forEach((f) => f.forEach((ch, i) => { if (ch === "X") f[i] = "O"; if (ch === "C") f[i] = "c"; }));
        }
        jug.x = nx; jug.y = ny; movimientos++; empujes++;
      }
    }
    if (terreno[jug.y][jug.x] === "P") { terreno[jug.y][jug.x] = " "; plutonio = true; }
    cuadros.push(foto());
  }
  return { fijo, cuadros };
}
