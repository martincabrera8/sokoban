"""Mini generador de diagramas de clases UML en SVG con posiciones y recorridos elegidos a mano.

Se usa en vez de un layout automático para que las flechas no se crucen y se lea
claramente a dónde va cada una. Cada diagrama es un script (ver diagramas.py)
que ubica las cajas y dice por qué lado sale y entra cada flecha.
"""
from html import escape
from PIL import ImageFont

FUENTE = "/usr/share/fonts/opentype/inter/Inter-Regular.otf"
FUENTE_B = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
_f = ImageFont.truetype(FUENTE, 12)
_fb = ImageFont.truetype(FUENTE_B, 14)
_fs = ImageFont.truetype(FUENTE, 10.5)


def ancho(texto, f=_f):
    return f.getlength(texto)


# Colores de autoría (relleno, borde)
AUTOR = {
    "luca": ("#DAE8FC", "#6C8EBF"),
    "martin": ("#D5E8D4", "#82B366"),
    "integ": ("#FFF2CC", "#D6B656"),
    "pend": ("#F5F5F5", "#9E9E9E"),
    "swing": ("#FFFFFF", "#9E9E9E"),
}
TINTA = "#1E1A17"
GRIS = "#6B6B6B"
VIOLETA = "#7B3FA0"
ORO = "#B8892A"
DEP = "#5F5650"

LINEA = 17      # alto de cada renglón de miembros
PAD = 7         # relleno de cada compartimento


class Caja:
    def __init__(self, d, id, nombre, x, y, w=None, estereo=None, attrs=(), ops=(), valores=(),
                 tipo="class", autor="luca", rol=None, extiende=None, texto=None):
        self.id, self.nombre, self.x, self.y = id, nombre, x, y
        self.estereo, self.attrs, self.ops, self.valores = estereo, list(attrs), list(ops), list(valores)
        self.tipo, self.autor, self.rol, self.extiende, self.texto = tipo, autor, rol, extiende, texto
        lineas = [m.lstrip("_~") for m in self.attrs + self.ops + self.valores] + list(texto or [])
        minimo = max([ancho(l) for l in lineas] + [ancho(nombre, _fb) + 10, ancho(estereo or "", _fs) + 10,
                                                    ancho(extiende or "", _fs) + 10])
        self.w = w or int(minimo + 2 * PAD + 6)
        self.h_cab = 26 + (14 if estereo else 0) + (13 if extiende else 0)
        if texto:
            comps = [list(texto)]
        elif tipo == "class":
            comps = [self.attrs, self.ops]
        else:
            comps = [c for c in (self.valores, self.attrs, self.ops) if c]
        self.comps = comps
        self.h = self.h_cab + sum(len(c) * LINEA + 2 * PAD - 4 for c in comps)
        d.cajas[id] = self

    def punto(self, lado, f=0.5):
        if lado == "top":
            return (self.x + self.w * f, self.y)
        if lado == "bottom":
            return (self.x + self.w * f, self.y + self.h)
        if lado == "left":
            return (self.x, self.y + self.h * f)
        return (self.x + self.w, self.y + self.h * f)

    def svg(self):
        fondo, borde = AUTOR[self.autor]
        punteada = ' stroke-dasharray="6 4"' if self.autor == "pend" else ""
        color_txt = GRIS if self.autor in ("pend", "swing") else TINTA
        o = [f'<g class="caja" id="{self.id}">']
        if self.rol:
            tw = ancho(self.rol, _fs) + 16
            o.append(f'<rect x="{self.x}" y="{self.y - 19}" width="{tw}" height="17" rx="8.5" fill="#F6EBCF" stroke="{ORO}" stroke-width="1"/>'
                     f'<text x="{self.x + 8}" y="{self.y - 7}" font-size="10.5" font-weight="600" fill="#7A5A12">{escape(self.rol)}</text>')
        o.append(f'<rect x="{self.x}" y="{self.y}" width="{self.w}" height="{self.h}" rx="6" fill="{fondo}" stroke="{borde}" stroke-width="1.4"{punteada}/>')
        cx = self.x + self.w / 2
        y = self.y + 17
        if self.estereo:
            o.append(f'<text x="{cx}" y="{y}" text-anchor="middle" font-size="10.5" fill="{GRIS}">«{escape(self.estereo)}»</text>')
            y += 14
        estilo = ' font-style="italic"' if self.tipo == "interface" else ""
        o.append(f'<text x="{cx}" y="{y + 1}" text-anchor="middle" font-size="14" font-weight="600" fill="{color_txt}"{estilo}>{escape(self.nombre)}</text>')
        if self.extiende:
            o.append(f'<text x="{cx}" y="{y + 15}" text-anchor="middle" font-size="10.5" fill="{VIOLETA}">{escape(self.extiende)}</text>')
        yy = self.y + self.h_cab
        for comp in self.comps:
            o.append(f'<line x1="{self.x}" y1="{yy}" x2="{self.x + self.w}" y2="{yy}" stroke="{borde}" stroke-width="1"/>')
            yy += PAD - 2
            for m in comp:
                estatico = m.startswith("_")
                abstracto = self.tipo == "interface" and m.startswith("+") and "(" in m
                txt = m.lstrip("_~")
                sangria = len(txt) - len(txt.lstrip(" "))
                txt = txt.lstrip(" ")
                deco = ' text-decoration="underline"' if estatico else ""
                it = ' font-style="italic"' if abstracto else ""
                o.append(f'<text x="{self.x + PAD + 2 + sangria * 3.4}" y="{yy + 12.5}" font-size="12" fill="{color_txt}"{deco}{it}>{escape(txt)}</text>')
                yy += LINEA
            yy += PAD - 2
        o.append("</g>")
        return "\n".join(o)


TIPOS = {
    # tipo: (color, punteada, extremo_destino, extremo_origen)
    "hereda": (VIOLETA, False, "triangulo", None),
    "implementa": (VIOLETA, True, "triangulo", None),
    "asociacion": (TINTA, False, "flecha", None),
    "composicion": (TINTA, False, "flecha", "rombo_lleno"),
    "agregacion": (TINTA, False, "flecha", "rombo_vacio"),
    "dependencia": (DEP, True, "flecha", None),
    "pend_implementa": ("#A0A0A0", True, "triangulo", None),
    "pend_dependencia": ("#A0A0A0", True, "flecha", None),
}


class Flecha:
    def __init__(self, d, origen, destino, tipo, de="right", a="left", fo=0.5, fd=0.5, via=None,
                 etiqueta=None, pos=None, mult=None, mult_pos=None, num=None, saltos=()):
        self.d, self.tipo, self.saltos = d, tipo, list(saltos)
        co, cd = d.cajas[origen], d.cajas[destino]
        p1, p2 = co.punto(de, fo), cd.punto(a, fd)
        if via is None:
            via = self._auto(p1, de, p2, a)
        self.pts = [p1] + [tuple(v) for v in via] + [p2]
        self.etiqueta, self.pos, self.mult, self.mult_pos, self.num = etiqueta, pos, mult, mult_pos, num
        d.flechas.append(self)

    @staticmethod
    def _auto(p1, de, p2, a):
        horiz = {"left", "right"}
        if de in horiz and a in horiz:
            mx = (p1[0] + p2[0]) / 2
            return [] if abs(p1[1] - p2[1]) < 0.5 else [(mx, p1[1]), (mx, p2[1])]
        if de not in horiz and a not in horiz:
            my = (p1[1] + p2[1]) / 2
            return [] if abs(p1[0] - p2[0]) < 0.5 else [(p1[0], my), (p2[0], my)]
        if de in horiz:
            return [(p2[0], p1[1])]
        return [(p1[0], p2[1])]

    def svg(self):
        color, punteada, fin, inicio = TIPOS[self.tipo]
        pts = self.pts
        d = _camino(pts, self.saltos)
        dash = ' stroke-dasharray="7 5"' if punteada else ""
        o = [f'<path d="{d}" fill="none" stroke="{color}" stroke-width="1.6"{dash}/>']
        o.append(_extremo(pts[-2], pts[-1], fin, color))
        if inicio:
            o.append(_extremo(pts[1], pts[0], inicio, color))
        if self.etiqueta:
            x, y = self.pos or _medio(pts)
            o.append(_etiqueta(x, y, self.etiqueta, color if self.tipo.startswith("pend") else "#3A332E", self.num))
        if self.mult:
            x, y = self.mult_pos or _cerca_fin(pts)
            o.append(f'<text x="{x}" y="{y}" font-size="11.5" font-weight="600" fill="{TINTA}" text-anchor="middle">{escape(self.mult)}</text>')
        return "\n".join(o)


def _camino(pts, saltos, r=6):
    """Camino ortogonal; en cada punto de `saltos` dibuja un puentecito (la línea pasa por encima sin conectarse)."""
    o = [f"M {pts[0][0]:.1f} {pts[0][1]:.1f}"]
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        en = []
        for sx, sy in saltos:
            if abs(y1 - y2) < 0.5 and abs(sy - y1) < 0.5 and min(x1, x2) < sx < max(x1, x2):
                en.append((sx, sy))
            elif abs(x1 - x2) < 0.5 and abs(sx - x1) < 0.5 and min(y1, y2) < sy < max(y1, y2):
                en.append((sx, sy))
        en.sort(key=lambda p: abs(p[0] - x1) + abs(p[1] - y1))
        for sx, sy in en:
            if abs(y1 - y2) < 0.5:
                d = 1 if x2 > x1 else -1
                o.append(f"L {sx - d * r:.1f} {sy:.1f} A {r} {r} 0 0 {1 if d > 0 else 0} {sx + d * r:.1f} {sy:.1f}")
            else:
                d = 1 if y2 > y1 else -1
                o.append(f"L {sx:.1f} {sy - d * r:.1f} A {r} {r} 0 0 {1 if d > 0 else 0} {sx:.1f} {sy + d * r:.1f}")
        o.append(f"L {x2:.1f} {y2:.1f}")
    return " ".join(o)


def _medio(pts):
    mejor, largo = 0, -1
    for i in range(len(pts) - 1):
        l = abs(pts[i + 1][0] - pts[i][0]) + abs(pts[i + 1][1] - pts[i][1])
        if l > largo:
            mejor, largo = i, l
    (x1, y1), (x2, y2) = pts[mejor], pts[mejor + 1]
    return ((x1 + x2) / 2, (y1 + y2) / 2)


def _cerca_fin(pts):
    (x1, y1), (x2, y2) = pts[-2], pts[-1]
    if abs(x2 - x1) > abs(y2 - y1):
        s = 1 if x2 > x1 else -1
        return (x2 - s * 16, y2 - 6)
    s = 1 if y2 > y1 else -1
    return (x2 + 12, y2 - s * 10)


def _etiqueta(x, y, texto, color, num=None):
    w = ancho(texto, _fs) + 12
    o = f'<rect x="{x - w / 2}" y="{y - 9}" width="{w}" height="17" rx="4" fill="#FFFFFF" fill-opacity="0.95"/>' \
        f'<text x="{x}" y="{y + 3.5}" font-size="10.5" text-anchor="middle" fill="{color}">{escape(texto)}</text>'
    if num is not None:
        o += f'<circle cx="{x - w / 2 - 9}" cy="{y}" r="8.5" fill="{ORO}"/>' \
             f'<text x="{x - w / 2 - 9}" y="{y + 3.5}" font-size="10" font-weight="700" text-anchor="middle" fill="#FFFFFF">{num}</text>'
    return o


def _extremo(desde, hasta, forma, color):
    import math
    (x1, y1), (x2, y2) = desde, hasta
    ang = math.atan2(y2 - y1, x2 - x1)

    def rot(px, py):
        return (x2 + px * math.cos(ang) - py * math.sin(ang), y2 + px * math.sin(ang) + py * math.cos(ang))

    if forma == "triangulo":
        p = [rot(0, 0), rot(-15, -8), rot(-15, 8)]
        return f'<polygon points="{_pts(p)}" fill="#FFFFFF" stroke="{color}" stroke-width="1.6"/>'
    if forma == "flecha":
        p = [rot(-11, -6), rot(0, 0), rot(-11, 6)]
        return f'<polyline points="{_pts(p)}" fill="none" stroke="{color}" stroke-width="1.6"/>'
    relleno = color if forma == "rombo_lleno" else "#FFFFFF"
    p = [rot(0, 0), rot(-10, -6), rot(-20, 0), rot(-10, 6)]
    return f'<polygon points="{_pts(p)}" fill="{relleno}" stroke="{color}" stroke-width="1.4"/>'


def _pts(p):
    return " ".join(f"{x:.1f},{y:.1f}" for x, y in p)


class Diagrama:
    def __init__(self, ancho, alto, titulo=None, subtitulo=None):
        self.w, self.h, self.titulo, self.subtitulo = ancho, alto, titulo, subtitulo
        self.cajas, self.flechas, self.fondos, self.extras = {}, [], [], []

    def caja(self, *a, **k):
        return Caja(self, *a, **k)

    def flecha(self, *a, **k):
        return Flecha(self, *a, **k)

    def paquete(self, x, y, w, h, titulo, color="#FBF8F2", borde="#8A7F76", punteado=False):
        dash = ' stroke-dasharray="6 4"' if punteado else ""
        tw = ancho(titulo, _fs) * 1.12 + 22
        self.fondos.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" fill="{color}" stroke="{borde}" stroke-width="1.2"{dash}/>'
            f'<path d="M {x} {y + 22} L {x} {y + 10} Q {x} {y} {x + 10} {y} L {x + tw} {y} L {x + tw} {y + 22} Z" fill="{borde}" fill-opacity="0.16"/>'
            f'<text x="{x + 11}" y="{y + 15}" font-size="11.5" font-weight="700" fill="#4A403A" letter-spacing="0.3">{escape(titulo)}</text>')

    def nota(self, x, y, w, lineas, titulo=None, mono=False):
        h = 14 + 16 * len(lineas) + (18 if titulo else 0)
        o = [f'<path d="M {x} {y} L {x + w - 12} {y} L {x + w} {y + 12} L {x + w} {y + h} L {x} {y + h} Z" fill="#FFFDF5" stroke="{ORO}" stroke-width="1.2"/>']
        yy = y + 18
        if titulo:
            o.append(f'<text x="{x + 10}" y="{yy}" font-size="12" font-weight="700" fill="#6E1A2C">{escape(titulo)}</text>')
            yy += 18
        for l in lineas:
            fam = ' font-family="IBM Plex Mono, DejaVu Sans Mono, monospace" font-size="11"' if mono else ' font-size="11.5"'
            o.append(f'<text x="{x + 10}" y="{yy}"{fam} fill="{TINTA}">{_rico(l)}</text>')
            yy += 16
        self.extras.append("\n".join(o))
        return h

    def texto(self, x, y, s, tam=12, color=TINTA, peso=400, anchor="start", italic=False):
        it = ' font-style="italic"' if italic else ""
        self.extras.append(f'<text x="{x}" y="{y}" font-size="{tam}" font-weight="{peso}" fill="{color}" text-anchor="{anchor}"{it}>{_rico(s)}</text>')

    def raw(self, s):
        self.extras.append(s)

    def svg(self):
        o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {self.w} {self.h}" width="{self.w}" height="{self.h}" '
             f'font-family="Inter, Arial, sans-serif">',
             '<style>text{white-space:pre}</style>',
             f'<rect width="{self.w}" height="{self.h}" fill="#FFFFFF"/>']
        if self.titulo:
            o.append(f'<text x="30" y="40" font-size="22" font-weight="700" fill="#6E1A2C">{escape(self.titulo)}</text>')
        if self.subtitulo:
            o.append(f'<text x="30" y="62" font-size="12.5" fill="{GRIS}">{_rico(self.subtitulo)}</text>')
        o += self.fondos
        o += [f.svg() for f in self.flechas]
        o += [c.svg() for c in self.cajas.values()]
        o += self.extras
        o.append("</svg>")
        return "\n".join(o)


def _rico(s):
    """Permite **negrita** dentro de un texto."""
    partes = escape(s).split("**")
    return "".join(f'<tspan font-weight="700">{p}</tspan>' if i % 2 else p for i, p in enumerate(partes))
