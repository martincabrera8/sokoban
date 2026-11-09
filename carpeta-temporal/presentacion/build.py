"""Arma la presentación en un solo HTML offline: dist/presentacion-sokoban.html

Uso (desde presentacion/):  npm install  y después  python3 build.py
Antes de armar corre un control: sin colores ni tipografías fuera de tokens.css, sin style= en el HTML,
sin rayas largas en los textos y sin funciones exportadas que nadie use. Si algo falla, no arma.
"""
import base64
import io
import json
import os
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

AQUI = Path(__file__).resolve().parent
SRC = AQUI / "src"
ASSETS = AQUI.parent.parent / "assets"  # assets/ del juego, en la raíz del repo
UML = Path(os.environ.get("PRESENTACION_UML", AQUI.parent / "docs" / "uml" / "2-diagrama-completo.svg"))  # otro plano para probar
FUENTES = AQUI / "node_modules" / "@fontsource"
SALIDA = Path(os.environ.get("PRESENTACION_SALIDA", AQUI / "dist" / "presentacion-sokoban.html"))  # otra salida para pruebas en paralelo

TIPOS = [  # (familia, archivo, peso)
    ("Pixelify Sans", "pixelify-sans/files/pixelify-sans-latin-500-normal.woff2", 500),
    ("Pixelify Sans", "pixelify-sans/files/pixelify-sans-latin-600-normal.woff2", 600),
    ("Atkinson Hyperlegible Next", "atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff2", 400),
    ("Atkinson Hyperlegible Next", "atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-600-normal.woff2", 600),
    ("Atkinson Hyperlegible Next", "atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-700-normal.woff2", 700),
    ("JetBrains Mono", "jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2", 400),
    ("JetBrains Mono", "jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2", 500),
]


def control():
    errores = []
    fuentes = [p for p in SRC.rglob("*") if p.suffix in (".css", ".js") and p.name != "tokens.css"]
    for p in fuentes:
        texto = p.read_text(encoding="utf-8")
        for n, linea in enumerate(texto.splitlines(), 1):
            if re.search(r"#[0-9a-fA-F]{3,8}\b", linea) and "replaceState" not in linea:
                errores.append(f"{p.name}:{n} color fuera de tokens.css")
            m = re.search(r"font-family\s*:\s*([^;\"]+)", linea)
            if m and not m.group(1).strip().startswith("var("):
                errores.append(f"{p.name}:{n} tipografía fuera de tokens.css")
    html = (AQUI / "index.src.html").read_text(encoding="utf-8")
    if re.search(r"\sstyle=", html):
        errores.append("index.src.html: hay style= en el HTML")
    for p in [AQUI / "index.src.html", *SRC.rglob("*.js")]:
        if re.search("[—–]", p.read_text(encoding="utf-8")):
            errores.append(f"{p.name}: tiene raya larga (usar coma, punto o dos puntos)")
    todo_js = {p: p.read_text(encoding="utf-8") for p in SRC.rglob("*.js")}
    for p, texto in todo_js.items():
        for nombre in re.findall(r"export (?:function|const) (\w+)", texto):
            usos = sum(len(re.findall(rf"\b{nombre}\b", t)) for q, t in todo_js.items() if q != p)
            if usos == 0:
                errores.append(f"{p.name}: {nombre} se exporta y nadie lo usa")
    if errores:
        print("CONTROL FALLÓ:\n  " + "\n  ".join(errores))
        sys.exit(1)
    print("control ok")


def empaquetar():
    esbuild = AQUI / "node_modules" / ".bin" / "esbuild"
    r = subprocess.run([str(esbuild), str(SRC / "main.js"), "--bundle", "--format=iife", "--minify", "--target=es2020",
                        "--legal-comments=none"], capture_output=True, text=True, cwd=AQUI)
    if r.returncode != 0:
        print(r.stderr)
        sys.exit(1)
    js = r.stdout
    chequeo = subprocess.run(["node", "-e", "new Function(require('fs').readFileSync(0,'utf8'))"], input=js, text=True, capture_output=True)
    if chequeo.returncode != 0:
        print("El JS armado no compila:\n" + chequeo.stderr)
        sys.exit(1)
    return js.replace("</script", "<\\/script")


def imagen(p):
    if p.parent.name == "backgrounds":  # fondos grandes: WebP sin pérdida visible
        buf = io.BytesIO()
        Image.open(p).save(buf, "WEBP", quality=88, method=6)
        return "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    return "data:image/png;base64," + base64.b64encode(p.read_bytes()).decode()


def imagenes():
    mapa, inventario = {}, {}
    for p in sorted(ASSETS.rglob("*.png")):
        rel = p.relative_to(ASSETS)
        clave = str(rel.with_suffix("")).replace("\\", "/")
        mapa[clave] = imagen(p)
        carpeta = rel.parts[0]
        inventario.setdefault(carpeta, []).append(clave)
    for p in sorted((AQUI / "medios").glob("*.png")):
        mapa["medios/" + p.stem] = imagen(p)
    uml = UML.read_text(encoding="utf-8") if UML.exists() else ""
    return mapa, inventario, uml


def personaje():
    """El sprite de Martín, píxel de arte por píxel de arte (el PNG está dibujado en bloques de 2×2), separado en zonas."""
    im = Image.open(ASSETS / "characters" / "player_down.png").convert("RGBA")
    px = im.load()
    voxeles = []
    for y in range(0, 64, 2):
        for x in range(0, 64, 2):
            r, g, b, a = px[x, y]
            if a < 128:
                continue
            if y < 30:
                zona = "cabeza"
            elif 32 <= y <= 49 and x <= 19:
                zona = "brazoI"
            elif 32 <= y <= 49 and x >= 46:
                zona = "brazoD"
            elif y >= 48:
                zona = "piernaI" if x <= 32 else "piernaD"
            else:
                zona = "torso"
            voxeles.append([(x - 14) // 2, (y - 4) // 2, r * 65536 + g * 256 + b, zona])
    return voxeles


def fuentes():
    reglas = []
    for familia, archivo, peso in TIPOS:
        datos = base64.b64encode((FUENTES / archivo).read_bytes()).decode()
        reglas.append(f'@font-face{{font-family:"{familia}";src:url(data:font/woff2;base64,{datos}) format("woff2");'
                      f'font-weight:{peso};font-style:normal;font-display:swap}}')
    return "\n".join(reglas)


def armar():
    control()
    js = empaquetar()
    mapa, inventario, uml = imagenes()
    css = fuentes() + "\n" + (SRC / "tokens.css").read_text(encoding="utf-8") + "\n" + (SRC / "componentes.css").read_text(encoding="utf-8")
    for propio in sorted((SRC / "diagramas").glob("*.css")):  # estilos propios de cada diagrama
        css += "\n" + propio.read_text(encoding="utf-8")
    datos = ("window.PERSONAJE=" + json.dumps(personaje()) + ";window.IMG=" + json.dumps(mapa) + ";window.INVENTARIO=" + json.dumps(inventario) + ";window.UML=" + json.dumps(uml) + ";")
    html = (AQUI / "index.src.html").read_text(encoding="utf-8")
    html = html.replace("<!--ESTILOS-->", "<style>\n" + css + "\n</style>")
    html = html.replace("<!--DATOS-->", "<script>" + datos.replace("</script", "<\\/script") + "</script>")
    html = html.replace("<!--PROGRAMA-->", "<script>" + js + "</script>")
    SALIDA.parent.mkdir(exist_ok=True)
    SALIDA.write_text(html, encoding="utf-8")
    print(f"armado: {SALIDA} ({SALIDA.stat().st_size / 1024 / 1024:.1f} MB)")
    # Versión para publicar como página de claude.ai: la plataforma agrega doctype, head y body.
    pagina = html
    for etiqueta in ["<!doctype html>", '<html lang="es">', "<head>", '<meta charset="utf-8">',
                     '<meta name="viewport" content="width=device-width, initial-scale=1">', "</head>", "<body>", "</body>", "</html>"]:
        pagina = pagina.replace(etiqueta, "", 1)
    (SALIDA.parent / "presentacion-sokoban-pagina.html").write_text(pagina.strip() + "\n", encoding="utf-8")


if __name__ == "__main__":
    armar()
