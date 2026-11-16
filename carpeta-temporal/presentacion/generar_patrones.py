"""Genera los diagramas de cada patrón para la presentación corta, en SVG vectorial (texto nítido a cualquier zoom).

Fuente: los .puml aprobados de carpeta-temporal/patrones/ (no se tocan). Solo se cambian colores y grosores con
skinparam para que combinen con la presentación: las clases, los miembros y las flechas quedan iguales.

Uso (desde presentacion/):  PLANTUML_JAR=/ruta/plantuml.jar python3 generar_patrones.py
Salida: medios/patrones/<n>-<patron>.svg, que build.py embebe.
"""
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

AQUI = Path(__file__).resolve().parent
FUENTES = AQUI.parent.parent / "carpeta-temporal" / "patrones"
SALIDA = AQUI / "medios" / "patrones"
JAR = os.environ.get("PLANTUML_JAR", "plantuml.jar")

# Colores del diagrama sobre papel claro (la paleta de la presentación, en su versión para fondo claro)
ESTILO = """
skinparam backgroundColor transparent
skinparam class {
  BackgroundColor #FFFFFF
  BorderColor #1C2F4E
  BorderThickness 1.4
  ArrowColor #1C2F4E
  ArrowThickness 1.4
  FontColor #0B1630
  AttributeFontColor #1C2F4E
  StereotypeFontColor #9A5B00
}
skinparam ArrowFontColor #3A4A66
"""


def generar():
    SALIDA.mkdir(parents=True, exist_ok=True)
    fuentes = sorted(p for p in FUENTES.glob("[1-9]-*.puml"))
    if not fuentes:
        sys.exit(f"No hay diagramas en {FUENTES}")
    with tempfile.TemporaryDirectory() as tmp:
        for p in fuentes:
            texto = p.read_text(encoding="utf-8")
            if "hide circle" not in texto:
                sys.exit(f"{p.name}: no encuentro dónde insertar el estilo")
            (Path(tmp) / p.name).write_text(texto.replace("hide circle", ESTILO + "hide circle", 1), encoding="utf-8")
        r = subprocess.run(["java", "-jar", JAR, "-tsvg", "-charset", "UTF-8", *[str(Path(tmp) / p.name) for p in fuentes]], capture_output=True, text=True)
        if r.returncode != 0:
            sys.exit(r.stderr)
        for p in fuentes:
            svg = (Path(tmp) / (p.stem + ".svg")).read_text(encoding="utf-8")
            svg = re.sub(r"<!--SRC=\[.*?\]-->", "", svg, flags=re.S)
            svg = re.sub(r'\sstyle="width:[^"]*"', "", svg, count=1)
            (SALIDA / (p.stem + ".svg")).write_text(svg, encoding="utf-8")
            print(SALIDA / (p.stem + ".svg"), re.search(r'viewBox="([^"]*)"', svg).group(1))


if __name__ == "__main__":
    generar()
