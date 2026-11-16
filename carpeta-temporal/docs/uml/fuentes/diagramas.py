"""Genera todos los diagramas de clases en docs/uml/ (SVG y PNG).

Uso (desde la raíz del repo):  python3 docs/uml/fuentes/diagramas.py
Requiere Python 3 + Pillow (para medir textos) y, para los PNG, Node con Playwright.
Para sumar una clase: agregarla en clases.py y ubicarla acá con poner(...) y sus flechas.
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
from html import escape  # noqa: E402
from uml import Diagrama  # noqa: E402
from clases import poner  # noqa: E402

SALIDA = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))


def leyenda_autoria(d, x, y):
    d.texto(x, y, "**Quién hizo cada parte**", 12.5)
    for i, (color, borde, txt) in enumerate([
            ("#DAE8FC", "#6C8EBF", "Luca · interfaz gráfica Swing y contrato"),
            ("#D5E8D4", "#82B366", "Martín · arte, DeLorean y repetición"),
            ("#FFF2CC", "#D6B656", "Integración Luca + Martín (asistida por IA)"),
            ("#FCDDC7", "#C8683A", "Pedro y Lucía · dominio y personaje"),
            ("#EEDDF3", "#A0559F", "Mora · sonido")]):
        yy = y + 14 + i * 22
        d.raw(f'<rect x="{x}" y="{yy}" width="30" height="16" rx="3" fill="{color}" stroke="{borde}"/>')
        d.texto(x + 40, yy + 12.5, txt, 12)


def leyenda_flechas(d, x, y):
    d.texto(x, y, "**Cómo leer las flechas**  (la flecha sale de quien depende y apunta a quien conoce)", 12.5)
    filas = [
        ("implementa", "implementa / es un  (realización o herencia)"),
        ("composicion", "contiene: la crea y vive dentro de ella"),
        ("agregacion", "tiene una lista de… (no las crea)"),
        ("asociacion", "tiene una referencia guardada en un atributo"),
        ("dependencia", "usa o crea, pero no lo guarda"),
    ]
    from uml import TIPOS, _extremo, _camino
    for i, (tipo, txt) in enumerate(filas):
        yy = y + 22 + i * 22
        color, punteada, fin, inicio = TIPOS[tipo]
        dash = ' stroke-dasharray="7 5"' if punteada else ""
        d.raw(f'<path d="{_camino([(x, yy), (x + 70, yy)], [])}" stroke="{color}" stroke-width="1.6" fill="none"{dash}/>')
        d.raw(_extremo((x, yy), (x + 70, yy), fin, color))
        if inicio:
            d.raw(_extremo((x + 70, yy), (x, yy), inicio, color))
        d.texto(x + 85, yy + 4, txt, 12)
    d.raw(f'<path d="M {x} {y + 22 + 5 * 22} L {x + 29} {y + 22 + 5 * 22} A 6 6 0 0 1 {x + 41} {y + 22 + 5 * 22} L {x + 70} {y + 22 + 5 * 22}" stroke="#5F5650" stroke-width="1.6" fill="none"/>')
    d.texto(x + 85, y + 26 + 5 * 22, "puentecito: las líneas se cruzan pero NO se conectan", 12)


# ════════════════════════════════════════════════════════════════════════════
def auto_saltos(d):
    """Pone un puentecito en cada cruce real entre un tramo vertical y uno horizontal de flechas distintas."""
    tramos = [(f, a, b) for f in d.flechas for a, b in zip(f.pts, f.pts[1:])]
    for f1, a1, b1 in tramos:
        if abs(a1[0] - b1[0]) > 0.5:
            continue
        x, (y1, y2) = a1[0], sorted((a1[1], b1[1]))
        for f2, a2, b2 in tramos:
            if f2 is f1 or abs(a2[1] - b2[1]) > 0.5:
                continue
            y, (x1, x2) = a2[1], sorted((a2[0], b2[0]))
            if x1 + 7 < x < x2 - 7 and y1 + 7 < y < y2 - 7 and (x, y) not in f1.saltos:
                f1.saltos.append((x, y))


def completo():
    d = Diagrama(3900, 2570, "Sokoban · Diagrama de clases completo",
                 "Estado al 16/11/2026 (código actual de main) · todas las clases, atributos, métodos y relaciones · "
                 "violeta = implementa / es un · negro = tiene · gris punteado = usa / crea")
    # zonas
    d.paquete(30, 200, 1120, 1520, "sokoban.vista · VISTA (lo que se ve)")
    d.paquete(30, 1760, 1120, 580, "sokoban.comandos · REPETICIÓN (Command, Martín)", color="#F3FAF1", borde="#82B366")
    d.paquete(1190, 200, 860, 1110, "sokoban.modelo · CONTRATO vista ↔ dominio")
    d.paquete(2080, 200, 1790, 620, "sokoban.sonido · SONIDO (Mora)", color="#FBF6FC", borde="#A0559F")
    d.paquete(2080, 850, 1790, 1440,
              "sokoban.modelo (+ .entidades, .estrategias, .movimiento, .tiempo) · DOMINIO (Pedro y Lucía) y DeLorean (Martín)",
              color="#FEF7F1", borde="#C8683A")
    # arranque
    poner(d, "Main", 700, 88)
    d.texto(700, 80, "sokoban · arranque", 11, "#8A7F76", italic=True)
    # vista
    poner(d, "VentanaPrincipal", 420, 240)
    poner(d, "MenuPrincipal", 70, 460)
    poner(d, "Cartel", 70, 650)
    poner(d, "PanelAyuda", 70, 920)
    poner(d, "PantallaJuego", 560, 460)
    poner(d, "PanelTablero", 330, 1070)
    poner(d, "PanelHUD", 680, 1070)
    poner(d, "Epoca", 330, 1430)
    poner(d, "Imagenes", 560, 1430)
    poner(d, "Assets", 900, 1470)
    # comandos
    poner(d, "GrabadoraDePartida", 60, 1810)
    poner(d, "Comando", 420, 1820)
    poner(d, "ComandoMover", 60, 2110)
    poner(d, "ComandoDeshacer", 420, 2110)
    poner(d, "ComandoViajarEnElTiempo", 680, 2110)
    # contrato
    poner(d, "SujetoJuego", 1220, 240)
    poner(d, "Juego", 1220, 400)
    poner(d, "JuegoDecorado", 1670, 240)
    poner(d, "ObservadorJuego", 1220, 640)
    poner(d, "EstadoJuego", 1670, 600)
    poner(d, "Direccion", 1220, 780)
    poner(d, "Evento", 1700, 1130)
    # sonido
    poner(d, "JuegoConSonido", 2110, 240)
    poner(d, "Sonidos", 2520, 240)
    poner(d, "EstadoSonido", 3000, 250)
    poner(d, "SonidoActivado", 2950, 410)
    poner(d, "SonidoSilenciado", 3130, 410)
    poner(d, "Sonido", 2520, 550)
    poner(d, "SonidosDeInterfaz", 2950, 560)
    poner(d, "AssetsSonidos", 3300, 690)
    # dominio
    poner(d, "JuegoSokoban", 2110, 910)
    poner(d, "CargadorNivel", 2110, 1250)
    poner(d, "Niveles", 2110, 1560)
    poner(d, "Puntaje", 2500, 910)
    poner(d, "HistorialDeshacer", 2500, 1150)
    poner(d, "RecuerdoNivel", 2500, 1400)
    poner(d, "MaquinaDelTiempo", 2500, 1800)
    poner(d, "Punto", 2500, 2040)
    poner(d, "EstadoNivel", 2920, 910)
    poner(d, "MotorMovimiento", 3360, 910)
    poner(d, "MediadorMovimiento", 3360, 1250)
    poner(d, "ElementoMovil", 3360, 1460)
    poner(d, "Caja", 2960, 1700)
    poner(d, "Jugador", 3420, 1720)
    poner(d, "Posicion", 3320, 1980)
    poner(d, "ComportamientoCaja", 2964, 2000)
    for x, s in ((2920, "CajaNormalStrategy"), (3106, "CajaFragilStrategy"), (3281, "CajaLlaveStrategy")):
        poner(d, s, x, 2170)
    for x, w, txt in ((2920, 166, "no agrega nada · $"), (3106, 155, "cajaDanada · cajaRota"),
                      (3281, 153, "llaveEmpujada · L")):
        d.texto(x + w / 2, 2234, txt, 10.5, "#8A7F76", anchor="middle", italic=True)

    C = d.cajas

    def A(o, dst, tipo, de, a, po=None, pd=None, via=None, **k):
        """Flecha con puntos absolutos: po/pd = coordenada sobre el lado (x si es top/bottom, y si es left/right)."""
        co, cd = C[o], C[dst]
        fo = 0.5 if po is None else ((po - co.x) / co.w if de in ("top", "bottom") else (po - co.y) / co.h)
        fd = 0.5 if pd is None else ((pd - cd.x) / cd.w if a in ("top", "bottom") else (pd - cd.y) / cd.h)
        return d.flecha(o, dst, tipo, de, a, fo=fo, fd=fd, via=via, **k)

    # Main
    A("Main", "VentanaPrincipal", "dependencia", "left", "top", 112, 524, via=[(524, 112)], etiqueta="crea", pos=(610, 112))
    A("Main", "JuegoConSonido", "dependencia", "right", "top", 100, 2250, via=[(2250, 100)],
      etiqueta="crea y le pasa el dominio adentro", pos=(1500, 100))
    A("Main", "SonidosDeInterfaz", "dependencia", "right", "top", 112, 3100, via=[(3100, 112)], etiqueta="instalar()",
      pos=(2800, 112))
    A("Main", "JuegoSokoban", "dependencia", "right", "top", 136, 2160, via=[(2064, 136), (2064, 832), (2160, 832)],
      etiqueta="crea el dominio", pos=(2064, 560))
    A("Main", "CargadorNivel", "dependencia", "right", "left", 136, 1420, via=[(2064, 136), (2064, 1420)],
      etiqueta="crea (carpeta)", pos=(2064, 1460))
    # vista
    A("VentanaPrincipal", "MenuPrincipal", "composicion", "left", "top", 340, 217, via=[(217, 340)], etiqueta="contiene",
      mult="1")
    A("VentanaPrincipal", "PantallaJuego", "composicion", "right", "top", 340, 729, via=[(729, 340)], etiqueta="contiene",
      mult="1")
    A("MenuPrincipal", "Cartel", "composicion", "bottom", "top", 217, 217, etiqueta="contiene", mult="1")
    A("MenuPrincipal", "PanelAyuda", "dependencia", "left", "left", 500, 960, via=[(52, 500), (52, 960)],
      etiqueta="crea (Cómo jugar)", pos=(112, 885))
    A("PantallaJuego", "Cartel", "dependencia", "left", "right", 760, 760, etiqueta="crea (carteles)",
      pos=(470, 760))
    A("PantallaJuego", "PanelTablero", "composicion", "bottom", "top", 590, 590, etiqueta="tablero", mult="1",
      pos=(590, 1030))
    A("PantallaJuego", "PanelHUD", "composicion", "bottom", "top", 860, 860, etiqueta="contiene", mult="1", pos=(860, 1030))
    A("PanelTablero", "Epoca", "asociacion", "bottom", "top", 420, 420, etiqueta="epoca", mult="1", pos=(420, 1400))
    A("PanelTablero", "Imagenes", "dependencia", "bottom", "top", 600, 600, etiqueta="usa", pos=(600, 1400))
    A("PanelHUD", "Imagenes", "dependencia", "bottom", "top", 760, 760, etiqueta="usa", pos=(760, 1400))
    im = C["Imagenes"]
    A("MenuPrincipal", "Imagenes", "dependencia", "left", "bottom", 540, 650, via=[(42, 540), (42, 1700), (650, 1700)],
      etiqueta="usa", pos=(300, 1700))
    A("PanelAyuda", "Imagenes", "dependencia", "bottom", "bottom", 200, 650, via=[(200, 1700), (650, 1700)])
    A("Imagenes", "Imagenes", "asociacion", "right", "right", im.y + 30, im.y + 70,
      via=[(im.x + im.w + 34, im.y + 30), (im.x + im.w + 34, im.y + 70)], etiqueta="instancia",
      pos=(im.x + im.w + 34, im.y + 100), mult="1", mult_pos=(im.x + im.w + 14, im.y + 88))
    A("Imagenes", "Assets", "dependencia", "right", "left", 1600, 1600, etiqueta="lee del disco o del .jar",
      pos=(860, 1622))
    # vista → contrato y comandos
    A("PantallaJuego", "Juego", "asociacion", "right", "left", 500, 440, via=[(1160, 500), (1160, 440)], etiqueta="juego",
      mult="1", pos=(1030, 500))
    A("PanelHUD", "ObservadorJuego", "implementa", "right", "left", 1100, 690, via=[(1184, 1100), (1184, 690)],
      etiqueta="implementan", pos=(1090, 1100))
    A("PanelTablero", "ObservadorJuego", "implementa", "right", "left", 1330, 690, via=[(1184, 1330), (1184, 690)])
    A("PanelTablero", "Direccion", "asociacion", "right", "left", 1356, 880, via=[(1200, 1356), (1200, 880)],
      etiqueta="orientacion", pos=(1080, 1356), mult="1")
    A("PantallaJuego", "GrabadoraDePartida", "asociacion", "right", "top", 880, 175,
      via=[(1140, 880), (1140, 1796), (175, 1796)], etiqueta="grabadora", mult="1", pos=(330, 1796))
    # comandos
    A("GrabadoraDePartida", "Comando", "agregacion", "right", "left", 1850, 1850, etiqueta="comandos", mult="*")
    co = C["Comando"]
    for s in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
        k = C[s]
        A(s, "Comando", "implementa", "top", "bottom", k.x + k.w / 2, co.x + co.w / 2,
          via=[(k.x + k.w / 2, 2080), (co.x + co.w / 2, 2080)])
    d.texto(co.x + co.w / 2 + 8, 2074, "implementan", 10.5, "#7B3FA0")
    A("ComandoViajarEnElTiempo", "Juego", "asociacion", "right", "left", 2150, 540, via=[(1172, 2150), (1172, 540)],
      etiqueta="juego (receptor)", pos=(1172, 1650), mult="1")
    for s in ("ComandoMover", "ComandoDeshacer"):
        k = C[s]
        A(s, "Juego", "asociacion", "bottom", "left", k.x + k.w - 30, 540,
          via=[(k.x + k.w - 30, 2290), (1172, 2290), (1172, 540)])
    A("ComandoMover", "Direccion", "asociacion", "bottom", "left", 120, 950, via=[(120, 2310), (1210, 2310), (1210, 950)],
      etiqueta="direccion", pos=(700, 2310), mult="1")
    # contrato
    A("Juego", "SujetoJuego", "hereda", "top", "bottom", 1300, 1300, etiqueta="extiende", pos=(1300, 372))
    A("SujetoJuego", "ObservadorJuego", "dependencia", "bottom", "top", 1455, 1455,
      etiqueta="avisa a", pos=(1455, 605))
    A("Juego", "EstadoJuego", "dependencia", "right", "left", 545, 720, via=[(1560, 545), (1560, 720)],
      etiqueta="devuelve", pos=(1560, 600))
    A("ObservadorJuego", "EstadoJuego", "dependencia", "right", "left", 673, 673, etiqueta="recibe", pos=(1520, 660))
    A("JuegoDecorado", "Juego", "implementa", "left", "right", 430, 430, etiqueta="implementa", pos=(1555, 418))
    A("JuegoDecorado", "Juego", "asociacion", "left", "right", 480, 480, etiqueta="juego (el que envuelve)",
      pos=(1540, 494), mult="1")
    A("EstadoJuego", "Evento", "asociacion", "bottom", "top", 1760, 1760, etiqueta="evento", mult="1", pos=(1760, 1010))
    # sonido
    A("JuegoConSonido", "JuegoDecorado", "hereda", "left", "right", 300, 300, etiqueta="extiende", pos=(2062, 288))
    A("JuegoConSonido", "EstadoJuego", "dependencia", "bottom", "right", 2150, 640, via=[(2150, 640)],
      etiqueta="getEstado().evento()", pos=(1950, 640))
    A("JuegoConSonido", "Sonidos", "dependencia", "right", "left", 300, 300, etiqueta="usa")
    A("JuegoConSonido", "Sonido", "dependencia", "bottom", "left", 2300, 600, via=[(2300, 600)], etiqueta="Sonido.de(evento)",
      pos=(2410, 600))
    A("Sonido", "Evento", "dependencia", "left", "right", 770, 1220, via=[(2040, 770), (2040, 1220)],
      etiqueta="de(evento)", pos=(2280, 770))
    A("Sonidos", "EstadoSonido", "asociacion", "right", "left", 292, 292, etiqueta="estado", mult="1", pos=(2920, 292))
    so = C["Sonidos"]
    A("Sonidos", "Sonidos", "asociacion", "top", "top", so.x + 40, so.x + 100,
      via=[(so.x + 40, so.y - 24), (so.x + 100, so.y - 24)], etiqueta="instancia", pos=(so.x + 150, so.y - 24),
      mult="1", mult_pos=(so.x + 118, so.y - 8))
    es = C["EstadoSonido"]
    cx = es.x + es.w / 2
    for s in ("SonidoActivado", "SonidoSilenciado"):
        k = C[s]
        A(s, "EstadoSonido", "implementa", "top", "bottom", k.x + k.w / 2, cx, via=[(k.x + k.w / 2, 378), (cx, 378)])
    d.texto(cx + 8, 372, "implementan", 10.5, "#7B3FA0")
    A("SonidoActivado", "Sonidos", "dependencia", "left", "right", 433, 433)
    sil = C["SonidoSilenciado"]
    A("SonidoSilenciado", "Sonidos", "dependencia", "bottom", "right", sil.x + 40, 476, via=[(sil.x + 40, 476)],
      etiqueta="le cambian el estado", pos=(2960, 476))
    A("Sonidos", "Sonido", "dependencia", "bottom", "top", 2600, 2600, etiqueta="un Clip por cada uno", pos=(2600, 520))
    A("SonidosDeInterfaz", "Sonidos", "dependencia", "left", "bottom", 590, 2800, via=[(2800, 590)], etiqueta="usa",
      pos=(2880, 590))
    A("SonidosDeInterfaz", "Sonido", "dependencia", "left", "right", 650, 650, etiqueta="ARRANQUE, CLIC", pos=(2850, 650))
    A("Sonidos", "AssetsSonidos", "dependencia", "bottom", "left", 2820, 740, via=[(2820, 740)],
      etiqueta="lee cada .wav una vez", pos=(3020, 740))
    # dominio → contrato
    A("JuegoSokoban", "SujetoJuego", "implementa", "left", "right", 940, 320, via=[(1620, 940), (1620, 320)])
    A("JuegoSokoban", "Juego", "implementa", "left", "right", 940, 520, via=[(1620, 940), (1620, 520)],
      etiqueta="implementa Juego y SujetoJuego", pos=(1900, 940))
    A("JuegoSokoban", "ObservadorJuego", "asociacion", "left", "right", 1100, 695, via=[(1600, 1100), (1600, 695)],
      etiqueta="observadores", pos=(1900, 1100), mult="*", mult_pos=(1490, 713))
    A("JuegoSokoban", "Evento", "asociacion", "left", "right", 1160, 1160, etiqueta="evento", mult="1", pos=(2000, 1160))
    # dominio
    A("JuegoSokoban", "CargadorNivel", "asociacion", "bottom", "top", 2250, 2250, etiqueta="cargador", mult="1",
      pos=(2250, 1215))
    A("CargadorNivel", "EstadoNivel", "dependencia", "right", "left", 1366, 1366, etiqueta="crea", pos=(2860, 1366))
    A("CargadorNivel", "Niveles", "dependencia", "bottom", "top", 2200, 2200, etiqueta="lee nivelN.txt", pos=(2200, 1530))
    A("JuegoSokoban", "Puntaje", "asociacion", "right", "left", 1000, 1000, etiqueta="puntaje", mult="1")
    A("JuegoSokoban", "EstadoNivel", "asociacion", "right", "left", 1120, 1120, etiqueta="nivel (el actual)",
      mult="0..1", pos=(2830, 1120))
    A("JuegoSokoban", "HistorialDeshacer", "asociacion", "right", "left", 1060, 1240, via=[(2425, 1060), (2425, 1240)],
      etiqueta="historial", mult="1", pos=(2425, 1200), mult_pos=(2484, 1232))
    A("JuegoSokoban", "MaquinaDelTiempo", "asociacion", "right", "left", 1150, 1880, via=[(2455, 1150), (2455, 1880)],
      etiqueta="maquinaDelTiempo", pos=(2455, 1760), mult="1", mult_pos=(2484, 1872))
    A("JuegoSokoban", "MotorMovimiento", "dependencia", "top", "top", 2300, 3480, via=[(2300, 890), (3480, 890)],
      etiqueta="crea uno por nivel", pos=(3300, 890))
    A("HistorialDeshacer", "RecuerdoNivel", "agregacion", "bottom", "top", 2620, 2620, etiqueta="recuerdos",
      mult="0..15", pos=(2680, 1386), mult_pos=(2600, 1392))
    A("EstadoNivel", "RecuerdoNivel", "dependencia", "left", "right", 1550, 1550, etiqueta="crea y lee", pos=(2858, 1538))
    A("MaquinaDelTiempo", "Punto", "agregacion", "bottom", "top", 2560, 2560, etiqueta="puntos", mult="0..10",
      pos=(2600, 2000), mult_pos=(2536, 2030))
    A("Punto", "RecuerdoNivel", "asociacion", "right", "right", 2080, 1660, via=[(2875, 2080), (2875, 1660)],
      etiqueta="recuerdo", mult="1", pos=(2875, 1900))
    d.texto(2712, 2118, "(record anidado en MaquinaDelTiempo)", 10.5, "#8A7F76", italic=True)
    # movimiento y entidades
    A("MotorMovimiento", "EstadoNivel", "asociacion", "left", "right", 960, 960, etiqueta="nivel", mult="1")
    A("MotorMovimiento", "MediadorMovimiento", "implementa", "bottom", "top", 3480, 3480, etiqueta="implementa",
      pos=(3480, 1180))
    A("EstadoNivel", "MediadorMovimiento", "asociacion", "right", "left", 1300, 1300, etiqueta="mediador", mult="0..1")
    A("ElementoMovil", "MediadorMovimiento", "bidireccional", "top", "bottom", 3500, 3500, etiqueta="se conocen", mult="1",
      pos=(3500, 1414), mult_pos=(3514, 1386))
    d.texto(3514, 1452, "*", 11.5, peso=600)
    em = C["ElementoMovil"]
    emx = em.x + em.w / 2
    for s in ("Caja", "Jugador"):
        k = C[s]
        A(s, "ElementoMovil", "hereda", "top", "bottom", k.x + k.w / 2, emx, via=[(k.x + k.w / 2, 1670), (emx, 1670)])
    d.texto(emx + 8, 1664, "extienden", 10.5, "#7B3FA0")
    A("EstadoNivel", "Caja", "asociacion", "bottom", "top", 3050, 3050, etiqueta="cajas", mult="*", pos=(3050, 1630))
    A("EstadoNivel", "Jugador", "asociacion", "bottom", "top", 3230, 3470, via=[(3230, 1645), (3470, 1645)],
      etiqueta="jugador", mult="1", pos=(3400, 1645))
    A("MotorMovimiento", "Jugador", "asociacion", "right", "right", 1000, 1766, via=[(3760, 1000), (3760, 1766)],
      etiqueta="jugador", mult="1", pos=(3760, 1560))
    A("MotorMovimiento", "Caja", "asociacion", "right", "right", 1060, 1880, via=[(3800, 1060), (3800, 1880)],
      etiqueta="cajas", mult="*", pos=(3600, 1880))
    A("ElementoMovil", "Posicion", "asociacion", "left", "top", 1600, 3440, via=[(3280, 1600), (3280, 1950), (3440, 1950)],
      etiqueta="posicion", mult="1", pos=(3280, 1800), mult_pos=(3456, 1972))
    A("Caja", "ComportamientoCaja", "asociacion", "bottom", "top", 3091, 3091, etiqueta="comportamiento", mult="1",
      pos=(3091, 1964))
    cc = C["ComportamientoCaja"]
    ccx = cc.x + cc.w / 2
    for s in ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"):
        k = C[s]
        A(s, "ComportamientoCaja", "implementa", "top", "bottom", k.x + k.w / 2, ccx,
          via=[(k.x + k.w / 2, 2140), (ccx, 2140)])
    d.texto(ccx + 8, 2134, "implementan", 10.5, "#7B3FA0")
    auto_saltos(d)

    leyenda_autoria(d, 30, 2400)
    leyenda_flechas(d, 560, 2400)
    d.nota(1300, 2340, 1500, [
        "**Herencia de Swing:** debajo del nombre dice «extiende JPanel / JFrame» (no se dibuja la flecha a JPanel).",
        "**Getters y setters:** se dibujan todos los públicos. Se omiten las constantes de estilo y los métodos que solo implementan una",
        "interfaz (actualizar, los de Juego y SujetoJuego en JuegoSokoban, ejecutar, los del mediador en MotorMovimiento), salvo en el Decorator.",
        "**Mediator:** Jugador y Caja son colegas y heredan de ElementoMovil, que guarda el mediador; EstadoNivel.conectarMediador los conecta.",
        "Las estrategias le avisan al mediador (cajaDanada, cajaRota, llaveEmpujada): esas dependencias se ven en el diagrama 9, no acá.",
        "**Evento** también lo guarda MotorMovimiento y lo devuelven MediadorMovimiento.intentarMover, Jugador.mover y EstadoNivel.moverJugador.",
        "**Memento:** RecuerdoNivel guarda además posicionJugador (Posicion) y una copia de las cajas (List<Caja>); esas flechas no se dibujan.",
        "**Direccion** también la usan Juego.mover, PantallaJuego (FLECHAS), Posicion.siguiente y MediadorMovimiento.",
        "**Subrayado** = static · **+** público · **-** privado · **#** protegido · **~** de paquete.",
    ], titulo="Notas para leer el diagrama")
    return d


MONO = "IBM Plex Mono, DejaVu Sans Mono, monospace"


def codigo(d, x, y, lineas, tam=11.5):
    for i, l in enumerate(lineas):
        d.raw(f'<text x="{x}" y="{y + i * 16}" font-size="{tam}" fill="#4A403A" font-family="{MONO}">{escape(l)}</text>')


# ════════════════════════════════════════════════════════════════════════════
def flechas():
    d = Diagrama(1500, 860, "Cómo leer las flechas del UML",
                 "Cada fila es un ejemplo real del proyecto: la flecha sale de la clase que depende y apunta a la que conoce.")
    filas = [
        ("hereda", ("PanelHUD", "luca", "class"), ("JPanel", "swing", "class"),
         "ES UN  ·  herencia (extends)", "PanelHUD es un panel de Swing: hereda todo lo de JPanel.",
         "public class PanelHUD extends JPanel"),
        ("implementa", ("PanelHUD", "luca", "class"), ("ObservadorJuego", "luca", "interface"),
         "CUMPLE UN CONTRATO  ·  realización (implements)", "Promete tener el método actualizar(estado).",
         "public class PanelHUD extends JPanel implements ObservadorJuego"),
        ("composicion", ("PantallaJuego", "luca", "class"), ("PanelHUD", "luca", "class"),
         "LO CREA Y LO CONTIENE  ·  composición (◆ lleno)", "PantallaJuego crea su HUD; el HUD no existe sin la pantalla.",
         "PanelHUD hud = new PanelHUD(this::deshacer, this::reiniciar, this::viajarEnElTiempo, this::pausar);"),
        ("agregacion", ("GrabadoraDePartida", "martin", "class"), ("Comando", "martin", "interface"),
         "TIENE UNA LISTA DE PARTES  ·  agregación (◇ vacío)", "Los comandos se los pasan desde afuera con ejecutar(comando).",
         "private final List<Comando> comandos = new ArrayList<>();"),
        ("asociacion", ("PantallaJuego", "luca", "class"), ("Juego", "luca", "interface"),
         "LO GUARDA EN UN ATRIBUTO  ·  asociación", "Lo recibe en el constructor y lo usa toda la partida.",
         "private final Juego juego;"),
        ("dependencia", ("PantallaJuego", "luca", "class"), ("Cartel", "luca", "class"),
         "LO USA O LO CREA Y LO SUELTA  ·  dependencia (punteada)", "Lo crea dentro de un método y no lo guarda.",
         "dialogo.add(new Cartel(titulo, mensaje, alElegir));"),
    ]
    for i, (tipo, (a, aa, at), (b, ba, bt), titulo, expl, cod) in enumerate(filas):
        y = 100 + i * 108
        ea = "interface" if at == "interface" else None
        eb = "interface" if bt == "interface" else None
        d.caja(f"a{i}", a, 40, y, 190, estereo=ea, tipo=at, autor=aa, texto=[] if at == "class" else None)
        d.caja(f"b{i}", b, 430, y, 190, estereo=eb, tipo=bt, autor=ba, texto=[] if bt == "class" else None)
        d.flecha(f"a{i}", f"b{i}", tipo, "right", "left", fo=0.5, fd=d.cajas[f"a{i}"].h / 2 / d.cajas[f"b{i}"].h)
        d.texto(670, y + 14, titulo, 13, "#6E1A2C", 700)
        d.texto(670, y + 34, expl, 12.5)
        codigo(d, 670, y + 56, [cod])
    d.nota(40, 760, 1420, [
        "**Multiplicidad** (número en la punta): 1 = exactamente uno · 0..1 = cero o uno · * = cualquier cantidad (también 0..*).",
        "**Visibilidad**: + público · - privado · # protegido.  **Subrayado** = static (es de la clase, no de cada objeto).  "
        "**Cursiva** = abstracto (método de interfaz, sin código).",
        "**«interface», «enumeration», «record»**: el tipo de la clase. Violeta = jerarquía · negro = tener · gris punteado = usar.",
    ], titulo="Además")
    return d


# ════════════════════════════════════════════════════════════════════════════
def general():
    d = Diagrama(1600, 1020, "Vista general: las capas del proyecto",
                 "Cada caja es un paquete. Fijate que todas las flechas llegan al CONTRATO: la vista, el dominio y el sonido no se conocen entre sí.")
    d.caja("Main", "sokoban · arranque", 600, 90, 330, estereo="paquete", autor="luca",
           texto=["Main: crea las piezas y las conecta",
                  "new JuegoConSonido(new JuegoSokoban(", "    new CargadorNivel(carpeta)))"])
    d.caja("Swing", "javax.swing (Java)", 60, 90, 230, estereo="biblioteca", autor="swing",
           texto=["JFrame, JPanel, JDialog, JButton…"])
    d.caja("Vista", "VISTA · sokoban.vista", 60, 290, 330, estereo="paquete · Luca", autor="luca",
           texto=["VentanaPrincipal (ventana)", "MenuPrincipal (menú) y PanelAyuda (Cómo jugar)",
                  "PantallaJuego (partida y teclado)", "PanelHUD (indicadores y botones)", "PanelTablero (dibuja el tablero)",
                  "Cartel (pausa, caja rota, resultado)", "Imagenes (caché de imágenes)  ← Singleton",
                  "Epoca (estilo por época) · integración"])
    d.caja("Contrato", "CONTRATO · sokoban.modelo", 600, 330, 330, estereo="paquete · Luca", autor="luca",
           texto=["SujetoJuego  ← sujeto del Observer", "Juego  ← Facade (extiende SujetoJuego)",
                  "JuegoDecorado  ← base del Decorator", "ObservadorJuego  ← Observer",
                  "EstadoJuego  ← DTO (record) con el Evento", "Direccion  ← enum"])
    d.caja("Comandos", "REPETICIÓN · sokoban.comandos", 600, 600, 330, estereo="paquete · Martín", autor="martin",
           texto=["Comando + 3 comandos  ← Command", "GrabadoraDePartida (invocador:", "graba y reproduce la partida)"])
    d.caja("Sonido", "SONIDO · sokoban.sonido", 1130, 290, 410, estereo="paquete · Mora", autor="sonido",
           texto=["JuegoConSonido  ← Decorator (extiende JuegoDecorado)", "Sonidos  ← Singleton + Facade de javax.sound",
                  "EstadoSonido, SonidoActivado, SonidoSilenciado  ← State", "Sonido (16 efectos, Sonido.de(evento))",
                  "SonidosDeInterfaz (clics y tecla M)", "assets/sonidos/: 16 archivos .wav propios"])
    d.caja("Dominio", "DOMINIO · sokoban.modelo y subpaquetes", 1130, 560, 410, estereo="paquete · Pedro y Lucía · Martín",
           autor="dominio",
           texto=["JuegoSokoban  ← Facade + sujeto concreto del Observer", "CargadorNivel, EstadoNivel, Posicion,",
                  "Puntaje, Evento (qué pasó en la última jugada)",
                  "entidades: ElementoMovil, Jugador, Caja  (colegas)", "estrategias: ComportamientoCaja + 3  ← Strategy",
                  "movimiento: MediadorMovimiento, Motor  ← Mediator",
                  "Memento: EstadoNivel y RecuerdoNivel; cuidadores en", "tiempo: HistorialDeshacer y MaquinaDelTiempo (Martín)",
                  "niveles/: nivel1.txt a nivel3.txt"])
    d.caja("Arte", "ARTE · assets/", 60, 650, 330, estereo="carpeta · Martín", autor="martin",
           texto=["107 imágenes PNG (se usan 33)", "personaje, cajas, pisos, paredes, fondos, HUD"])
    C = d.cajas
    F = d.flecha
    F("Vista", "Comandos", "dependencia", "right", "left", fo=0.9, fd=0.5, via=[(495, 290 + 0.9 * C["Vista"].h),
      (495, 600 + C["Comandos"].h / 2)], etiqueta="PantallaJuego crea los comandos", pos=(495, 610))
    F("Comandos", "Contrato", "dependencia", "top", "bottom", fo=0.5, fd=0.5, etiqueta="usan Juego (receptor)",
      pos=(765, 578))
    F("Main", "Vista", "dependencia", "left", "top", fo=0.3, fd=0.9, etiqueta="crea la ventana", pos=(500, 90 + 0.3 * C["Main"].h))
    F("Main", "Sonido", "dependencia", "right", "top", fo=0.7, fd=(1335 - 1130) / 410, via=[(1335, 90 + 0.7 * C["Main"].h)],
      etiqueta="crea", pos=(1130, 90 + 0.7 * C["Main"].h))
    F("Main", "Dominio", "dependencia", "right", "right", fo=0.3, fd=0.3, via=[(1570, 90 + 0.3 * C["Main"].h),
      (1570, 560 + 0.3 * C["Dominio"].h)], etiqueta="crea", pos=(1130, 90 + 0.3 * C["Main"].h))
    F("Vista", "Swing", "hereda", "top", "bottom", fo=0.35, fd=(175.5 - 60) / 230, etiqueta="extiende", pos=(175.5, 245))
    yc = 330 + 0.3 * C["Contrato"].h
    F("Vista", "Contrato", "dependencia", "right", "left", fo=(yc - 290) / C["Vista"].h, fd=0.3,
      etiqueta="usa / implementa", pos=(495, yc))
    F("Sonido", "Contrato", "implementa", "left", "right", fo=(yc - 290) / C["Sonido"].h, fd=0.3,
      etiqueta="implementa y usa Juego", pos=(1030, yc))
    F("Dominio", "Contrato", "implementa", "left", "right", fo=0.15, fd=0.8,
      via=[(1030, 560 + 0.15 * C["Dominio"].h), (1030, 330 + 0.8 * C["Contrato"].h)], etiqueta="implementa Juego",
      pos=(1030, 560))
    F("Vista", "Arte", "dependencia", "bottom", "top", etiqueta="lee las imágenes", pos=(225, 622))
    d.nota(490, 820, 1070, [
        "**Por qué importa:** la VISTA solo conoce el CONTRATO (interfaces). El dominio y el sonido también dependen solo del contrato:",
        "JuegoConSonido (con su base JuegoDecorado) envuelve «un Juego» sin saber que adentro está JuegoSokoban. Por eso el dominio,",
        "el sonido y las funcionalidades nuevas entraron casi sin tocar la vista. Eso es el principio **DIP** (inversión de dependencias).",
    ], titulo="La idea de esta arquitectura")
    leyenda_autoria(d, 60, 830)
    return d


# ════════════════════════════════════════════════════════════════════════════
def observer():
    d = Diagrama(1500, 820, "Patrón Observer (comportamiento)",
                 "Cuando cambia la partida, el sujeto avisa a todos los observadores; cada uno se actualiza solo. "
                 "La etiqueta dorada es el ROL de la clase en el patrón.")
    poner(d, "SujetoJuego", 60, 130, rol="Sujeto (Subject)")
    poner(d, "ObservadorJuego", 820, 150, rol="Observador (Observer)")
    poner(d, "JuegoSokoban", 60, 400, solo=["- observadores"], ops=[], rol="Sujeto concreto")
    act = ["+ actualizar(estado: EstadoJuego): void"]
    poner(d, "PanelHUD", 700, 500, solo=[], ops=act, extiende=None, rol="Observador concreto")
    poner(d, "PanelTablero", 1080, 500, solo=[], ops=act, extiende=None, rol="Observador concreto")
    F = d.flecha
    C = d.cajas
    su, ob, js = C["SujetoJuego"], C["ObservadorJuego"], C["JuegoSokoban"]
    F("JuegoSokoban", "SujetoJuego", "implementa", "top", "bottom", fo=0.4, fd=(60 + 0.4 * js.w - 60) / su.w,
      etiqueta="implementa", num=1)
    yo = 400 + js.h / 2
    F("JuegoSokoban", "ObservadorJuego", "asociacion", "right", "bottom", fo=0.5, fd=(860 - 820) / ob.w,
      via=[(860, yo)], etiqueta="observadores", mult="*", mult_pos=(876, 240), num=2, pos=(600, yo))
    tx = 820 + ob.w * 0.65
    for c in ("PanelHUD", "PanelTablero"):
        k = C[c]
        F(c, "ObservadorJuego", "implementa", "top", "bottom", fo=0.5, fd=0.65, via=[(k.x + k.w * 0.5, 450), (tx, 450)])
    d.texto(tx + 10, 330, "implementan", 11, "#7B3FA0")
    d.nota(60, 620, 640, [
        "**1** JuegoSokoban cumple el contrato SujetoJuego (Juego lo extiende).",
        "**2** Guarda la lista: agregarObservador(...) suscribe, quitarObservador(...) desuscribe.",
        "**3** Después de cada cambio llama a notificarObservadores(): recorre la lista.",
        "**4** Cada observador recibe una foto inmutable (EstadoJuego) y se redibuja.",
        "El sonido **no** es un observador: es un Decorator (diagrama 10).",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(740, 620, 720, ["public void notificarObservadores() {         // JuegoSokoban",
                           "    EstadoJuego estado = getEstado();",
                           "    for (ObservadorJuego observador : observadores)",
                           "        observador.actualizar(estado);", "}",
                           "// PantallaJuego: juego.agregarObservador(hud); juego.agregarObservador(tablero);"],
           titulo="El código clave", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def facade():
    d = Diagrama(1980, 830, "Patrón Facade (estructural)",
                 "La vista habla con UNA sola interfaz simple (Juego). Atrás, JuegoSokoban reparte el trabajo entre las clases del dominio "
                 "sin que la vista se entere.")
    poner(d, "PantallaJuego", 60, 170, solo=["- juego:"], ops=[], extiende=None, rol="Cliente")
    poner(d, "Juego", 430, 130, rol="Fachada (Facade)")
    poner(d, "JuegoSokoban", 900, 150, solo=["- cargador", "- historial", "- maquinaDelTiempo", "- puntaje", "- nivel:"],
          ops=[], rol="Fachada concreta")
    fila = [("CargadorNivel", dict(solo=["+ cargar("])),
            ("EstadoNivel", dict(solo=["conectarMediador", "moverJugador", "crearRecuerdo", "+ restaurar"])),
            ("MotorMovimiento", dict(solo=[], ops=["+ intentarMover(direccion: Direccion): Evento"])),
            ("HistorialDeshacer", dict(solo=["+ guardar", "+ deshacer"])),
            ("MaquinaDelTiempo", dict(solo=["+ guardar", "volverAntesDe"])),
            ("Puntaje", dict(solo=["registrarDeshacer", "calcular"]))]
    x, yf = 80, 520
    for id, k in fila:
        c = poner(d, id, x, yf, **k)
        x += c.w + (110 if id == "EstadoNivel" else 28)
    alto = max(d.cajas[id].h for id, _ in fila)
    d.paquete(50, yf - 50, x - 50 - 28 + 30, alto + 90, "Subsistema del dominio (lo que la vista no ve)")
    d.w = int(x - 28 + 30 + 40)
    C = d.cajas
    F = d.flecha
    ju, pj, js = C["Juego"], C["PantallaJuego"], C["JuegoSokoban"]
    yj = 170 + pj.h / 2
    F("PantallaJuego", "Juego", "asociacion", "right", "left", fo=0.5, fd=(yj - 130) / ju.h, etiqueta="juego", mult="1")
    F("JuegoSokoban", "Juego", "implementa", "left", "right", fo=0.4, fd=(150 + 0.4 * js.h - 130) / ju.h,
      etiqueta="implementa")
    # bus: de la parte de abajo de JuegoSokoban a cada clase del subsistema, sin cruzarse
    datos = {"CargadorNivel": ("asociacion", "cargador", "1"), "EstadoNivel": ("asociacion", "nivel", "0..1"),
             "MotorMovimiento": ("dependencia", "crea", None), "HistorialDeshacer": ("asociacion", "historial", "1"),
             "MaquinaDelTiempo": ("asociacion", "maquinaDelTiempo", "1"), "Puntaje": ("asociacion", "puntaje", "1")}
    ids = [id for id, _ in fila]
    fondo = 150 + js.h
    salidas = [js.x + js.w * (i + 1) / (len(ids) + 1) for i in range(len(ids))]
    izq = [i for i in range(len(ids)) if C[ids[i]].x + C[ids[i]].w / 2 < salidas[i]]
    der = [i for i in range(len(ids)) if i not in izq]
    niveles = {}
    for j, i in enumerate(izq):
        niveles[i] = fondo + 40 + j * 30
    for j, i in enumerate(reversed(der)):
        niveles[i] = fondo + 40 + j * 30
    for i, id in enumerate(ids):
        tipo, et, mult = datos[id]
        c = C[id]
        cx = c.x + c.w / 2
        sx = salidas[i]
        y = niveles[i]
        F("JuegoSokoban", id, tipo, "bottom", "top", fo=(sx - js.x) / js.w, fd=0.5, via=[(sx, y), (cx, y)],
          etiqueta=et, mult=mult, pos=((sx + cx) / 2 if abs(sx - cx) > 120 else cx, y if abs(sx - cx) > 120 else (y + yf) / 2))
    en, mo = C["EstadoNivel"], C["MotorMovimiento"]
    ym = yf + min(en.h, mo.h) * 0.6
    F("MotorMovimiento", "EstadoNivel", "asociacion", "left", "right", fo=(ym - yf) / mo.h, fd=(ym - yf) / en.h,
      etiqueta="nivel", mult="1")
    auto_saltos(d)
    yn = yf + alto + 70
    d.nota(50, yn, d.w - 90, [
        "Para la vista, mover al jugador es UNA llamada: juego.mover(Direccion.DERECHA). Atrás, JuegoSokoban le pide un recuerdo al nivel (crearRecuerdo), "
        "lo mueve (moverJugador, que usa al MotorMovimiento),",
        "guarda el recuerdo en el HistorialDeshacer, marca un punto en el tiempo si una caja llegó a destino y avisa a los observadores. **La vista no se entera de nada de eso.**",
        "Hay otra fachada en el proyecto: **Sonidos**, que esconde javax.sound (diagrama 11).",
    ], titulo="Qué gana el proyecto")
    return d


# ════════════════════════════════════════════════════════════════════════════
def singleton():
    d = Diagrama(1240, 940, "Patrón Singleton (creacional)",
                 "Hay DOS: una sola caché de imágenes (Imagenes) y un solo reproductor de sonidos (Sonidos). Todos los piden con obtenerInstancia().")
    poner(d, "PanelTablero", 50, 150, solo=[], ops=[], extiende=None, rol="Cliente")
    poner(d, "PanelHUD", 50, 300, solo=[], ops=[], extiende=None, rol="Cliente")
    poner(d, "Imagenes", 560, 160, solo=["instancia:", "cache", "- Imagenes()", "obtenerInstancia", "+ obtener("],
          estereo="final", rol="Singleton")
    F = d.flecha
    im = d.cajas["Imagenes"]
    for c, f in (("PanelTablero", 0.3), ("PanelHUD", 0.7)):
        F(c, "Imagenes", "dependencia", "right", "left", fo=0.5, fd=f, etiqueta="obtenerInstancia()")
    yb = 160 + im.h + 26
    F("Imagenes", "Imagenes", "asociacion", "bottom", "bottom", fo=0.75, fd=0.35, via=[(560 + 0.75 * im.w, yb), (560 + 0.35 * im.w, yb)],
      etiqueta="instancia (la única)", mult="1", mult_pos=(560 + 0.35 * im.w - 14, 160 + im.h + 16),
      pos=(560 + 0.55 * im.w, yb + 16))
    d.raw('<line x1="40" y1="420" x2="1200" y2="420" stroke="#D9CBAE" stroke-width="1.2" stroke-dasharray="4 4"/>')
    poner(d, "JuegoConSonido", 50, 490, solo=[], ops=[], extiende=None, rol="Cliente")
    poner(d, "SonidosDeInterfaz", 50, 640, solo=[], ops=[], estereo="final", rol="Cliente")
    poner(d, "Sonidos", 560, 480, solo=["instancia:", "clips", "- Sonidos()", "obtenerInstancia", "+ reproducir("],
          estereo="final", rol="Singleton")
    so = d.cajas["Sonidos"]
    for c, f in (("JuegoConSonido", 0.3), ("SonidosDeInterfaz", 0.7)):
        F(c, "Sonidos", "dependencia", "right", "left", fo=0.5, fd=f, etiqueta="obtenerInstancia()")
    yb = 480 + so.h + 26
    F("Sonidos", "Sonidos", "asociacion", "bottom", "bottom", fo=0.75, fd=0.35, via=[(560 + 0.75 * so.w, yb), (560 + 0.35 * so.w, yb)],
      etiqueta="instancia (la única)", mult="1", mult_pos=(560 + 0.35 * so.w - 14, 480 + so.h + 16),
      pos=(560 + 0.55 * so.w, yb + 16))
    d.nota(50, 790, 1150, [
        "private static Imagenes instancia;          // 1. la única instancia, guardada en la clase   (Sonidos: igual)",
        "private Imagenes() { }                      // 2. constructor privado: nadie más puede hacer new",
        "public static Imagenes obtenerInstancia() {  // 3. punto de acceso global",
        "    if (instancia == null) instancia = new Imagenes();   // se crea la primera vez que se pide",
        "    return instancia; }",
    ], titulo="Las 3 piezas de un Singleton (las dos clases las tienen; además son final)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def mvc():
    d = Diagrama(1860, 600, "MVC: quién hace qué",
                 "Modelo = reglas del juego · Vista = lo que se ve · Controlador = traduce lo que hace el usuario en pedidos al modelo.")
    d.caja("V", "VISTA", 40, 120, 330, estereo="lo que se ve", autor="luca",
           texto=["VentanaPrincipal, MenuPrincipal, Cartel", "PanelHUD: nivel, movimientos, empujes, plutonio",
                  "PanelTablero: dibuja el tablero", "Imagenes, Epoca: imágenes y estilo"])
    d.caja("C", "CONTROLADOR", 540, 120, 340, estereo="traduce acciones", autor="luca",
           texto=["PantallaJuego: tecla o botón del HUD → un", "comando (ComandoMover, ComandoDeshacer...)",
                  "que GrabadoraDePartida ejecuta y anota", "(controlador de entrada de Swing, vive en la vista)"])
    d.caja("S", "SONIDO", 1050, 120, 240, estereo="decora al modelo", autor="sonido",
           texto=["JuegoConSonido: deja pasar", "cada pedido y hace sonar", "el efecto del Evento"])
    d.caja("M", "MODELO", 1460, 120, 340, estereo="reglas del juego", autor="dominio",
           texto=["JuegoSokoban: recibe los pedidos y", "coordina (Controlador de GRASP)",
                  "EstadoNivel, Jugador, Caja, MotorMovimiento,", "niveles, deshacer, DeLorean, puntaje",
                  "Se accede SOLO por la interfaz Juego"])
    F = d.flecha
    F("V", "C", "dependencia", "right", "left", fo=0.4, fd=0.4, etiqueta="tecla o botón", num=1)
    F("C", "S", "dependencia", "right", "left", fo=0.4, fd=0.4 * d.cajas["C"].h / d.cajas["S"].h,
      etiqueta="mover · deshacer · viajar…", num=2, pos=(970, 120 + 0.4 * d.cajas["C"].h))
    F("S", "M", "dependencia", "right", "left", fo=0.4 * d.cajas["C"].h / d.cajas["S"].h, fd=0.4 * d.cajas["C"].h / d.cajas["M"].h,
      etiqueta="le pasa lo mismo", num=3)
    yb = 120 + d.cajas["M"].h
    F("M", "V", "dependencia", "bottom", "bottom", via=[(1630, 390), (205, 390)],
      etiqueta="avisa con EstadoJuego (Observer: actualizar)", num=4, pos=(920, 390))
    d.nota(40, 440, 1760, [
        "**Regla de oro:** el modelo no conoce a la vista. Le avisa a una interfaz (ObservadorJuego) y le manda un **DTO inmutable**",
        "(EstadoJuego), nunca un EstadoNivel ni una Caja. Así la vista no puede romper las reglas del juego por accidente.",
        "**Ojo:** en Swing es normal que la parte de «controlador de entrada» (teclas y botones) quede dentro de los paneles.",
        "El controlador GRASP (quien recibe los pedidos y coordina el dominio) es JuegoSokoban. El sonido se mete en el medio sin que nadie cambie.",
    ], titulo="Para validar")
    return d


# ════════════════════════════════════════════════════════════════════════════
def strategy():
    d = Diagrama(1640, 940, "Patrón Strategy (comportamiento): las tres cajas",
                 "Cada caja guarda un objeto «comportamiento». Para cambiar qué hace una caja al ser empujada se cambia ese objeto, no la clase Caja.")
    poner(d, "EstadoNivel", 70, 140, solo=["- cajas", "EstadoNivel(lineas"], rol="Cliente: elige la estrategia")
    poner(d, "MotorMovimiento", 70, 330, solo=["- cajas"], ops=["+ intentarMover(direccion: Direccion): Evento"],
          rol="Cliente: dispara el empuje")
    poner(d, "Caja", 560, 150, solo=["- comportamiento", "- resistencia", "+ Caja(", "despuesDeEmpujar", "getSimbolo"],
          extiende=None, rol="Contexto (Context)")
    poner(d, "ComportamientoCaja", 1100, 170, rol="Estrategia (Strategy)")
    ops = ["+ despuesDeEmpujar(caja: Caja,", "      mediador: MediadorMovimiento): void", "+ simbolo(caja: Caja): char"]
    xs = (420, 800, 1180)
    nombres = ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy")
    for x, s in zip(xs, nombres):
        poner(d, s, x, 500, ops=ops, rol="Estrategia concreta")
    C = d.cajas
    F = d.flecha
    cc, ca, en, mo = C["ComportamientoCaja"], C["Caja"], C["EstadoNivel"], C["MotorMovimiento"]
    ycc = 170 + cc.h / 2
    F("EstadoNivel", "Caja", "asociacion", "right", "left", fo=0.5, fd=(140 + en.h / 2 - 150) / ca.h, etiqueta="cajas", mult="*")
    ymo = 330 + mo.h / 2
    F("MotorMovimiento", "Caja", "asociacion", "right", "bottom", fo=0.5, fd=(660 - 560) / ca.w, via=[(660, ymo)],
      etiqueta="cajas", mult="*", pos=(520, ymo))
    F("Caja", "ComportamientoCaja", "asociacion", "right", "left", fo=(ycc - 150) / ca.h, fd=0.5, etiqueta="comportamiento",
      mult="1", num=1)
    cx = 1100 + cc.w / 2
    for x, s in zip(xs, nombres):
        k = C[s]
        F(s, "ComportamientoCaja", "implementa", "top", "bottom", fo=0.6, fd=0.5, via=[(x + 0.6 * k.w, 460), (cx, 460)])
    d.texto(cx + 10, 400, "implementan", 11, "#7B3FA0")
    d.raw(f'<circle cx="{cx - 18}" cy="396" r="8.5" fill="#B8892A"/><text x="{cx - 18}" y="399.5" font-size="10" '
          f'font-weight="700" text-anchor="middle" fill="#FFFFFF">2</text>')
    yb = 500 + C["CajaNormalStrategy"].h + 40
    for i, (x, s) in enumerate(zip(xs, nombres)):
        k = C[s]
        F("EstadoNivel", s, "dependencia", "left", "bottom", fo=0.5, fd=0.3,
          via=[(45, 140 + en.h / 2), (45, yb), (x + 0.3 * k.w, yb)], etiqueta="new" if i == 2 else None,
          pos=(240, yb))
    d.nota(50, yb + 40, 700, [
        "**1** Cada Caja guarda su comportamiento en un atributo (lo recibe al crearse).",
        "**2** Las tres estrategias cumplen el mismo contrato ComportamientoCaja.",
        "**3** Cuando el MotorMovimiento empuja una caja llama a caja.despuesDeEmpujar():",
        "     la Caja no pregunta «¿qué tipo soy?», le pasa el pedido a su estrategia.",
        "**Quién elige:** el constructor de EstadoNivel hace new según la letra del .txt:",
        "     $ normal · F frágil (resistencia 3) · L llave.",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(790, yb + 40, 800, [
        "public void despuesDeEmpujar() {                       // Caja",
        "    comportamiento.despuesDeEmpujar(this, mediador);",
        "}",
        "public char getSimbolo() { return comportamiento.simbolo(this); }",
        "// Normal: no hace nada ('$').  Llave: mediador.llaveEmpujada(caja) ('L').",
        "// Frágil: quitarResistencia(); si le queda, mediador.cajaDanada(caja);",
        "//         si no, mediador.cajaRota(caja) ('F', o 'f' si le queda 1).",
    ], titulo="El código clave (entidades/Caja.java)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def mediator():
    d = Diagrama(1640, 950, "Patrón Mediator (comportamiento): el movimiento",
                 "Jugador y Caja no se conocen ni conocen el tablero: le hablan a un mediador, y el mediador resuelve todo.")
    poner(d, "MediadorMovimiento", 120, 150, rol="Mediador (Mediator)")
    poner(d, "MotorMovimiento", 120, 400, rol="Mediador concreto")
    poner(d, "ElementoMovil", 900, 140, solo=["# posicion", "# mediador", "+ conectar(", "+ setPosicion"],
          rol="Colega (Colleague, abstracta)")
    poner(d, "Jugador", 760, 450, solo=["+ mover("], extiende=None, rol="Colega concreto")
    poner(d, "Caja", 1180, 450, solo=["+ despuesDeEmpujar"], extiende=None, rol="Colega concreto")
    C = d.cajas
    F = d.flecha
    mm, mo, em = C["MediadorMovimiento"], C["MotorMovimiento"], C["ElementoMovil"]
    F("MotorMovimiento", "MediadorMovimiento", "implementa", "top", "bottom", fo=130 / mo.w, fd=130 / mm.w,
      etiqueta="implementa", num=2)
    y = 150 + mm.h / 2
    F("MediadorMovimiento", "ElementoMovil", "bidireccional", "right", "left", fo=0.5, fd=(y - 140) / em.h,
      etiqueta="se conocen", num=1, mult="*")
    d.texto(120 + mm.w + 16, y - 8, "1", 11.5, peso=600)
    ex = 900 + em.w / 2
    for s in ("Jugador", "Caja"):
        k = C[s]
        F(s, "ElementoMovil", "hereda", "top", "bottom", fo=0.5, fd=0.5, via=[(k.x + k.w / 2, 400), (ex, 400)])
    d.texto(ex + 10, 380, "extienden", 11, "#7B3FA0")
    yn = 400 + mo.h + 50
    d.nota(50, yn, 760, [
        "**1** Jugador y Caja heredan de ElementoMovil, que guarda la posición y el mediador",
        "     (la interfaz). El mediador también los conoce a ellos: «se conocen».",
        "**2** MotorMovimiento lo implementa y concentra las reglas: paredes, cajas, hielo, plutonio.",
        "**3** Jugador.mover(dir) solo hace return mediador.intentarMover(dir).",
        "**4** Si hay empuje, el motor mueve la Caja y le dice despuesDeEmpujar(); la estrategia",
        "     de la caja le avisa al mediador: cajaDanada, cajaRota o llaveEmpujada. El motor",
        "     quita la caja o abre los muros y anota el Evento que devuelve.",
        "**Quién los conecta:** JuegoSokoban crea new MotorMovimiento(nivel) y",
        "     EstadoNivel.conectarMediador(motor) se lo pasa al jugador y a cada caja.",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(860, yn, 730, [
        "public Evento mover(Direccion direccion) {   // Jugador",
        "    return mediador.intentarMover(direccion);",
        "}",
        "public void cajaRota(Caja caja) {            // MotorMovimiento",
        "    nivel.quitarCaja(caja);",
        "    evento = Evento.CAJA_ROTA;",
        "}",
    ], titulo="El código clave", mono=True)
    d.nota(860, yn + 150, 730, [
        "Los colegas hablan SOLO con el mediador: ni Jugador, ni Caja, ni las estrategias",
        "conocen a EstadoNivel. Así no hay dependencias circulares.",
    ], titulo="Para la defensa")
    return d


# ════════════════════════════════════════════════════════════════════════════
def decorator():
    d = Diagrama(1500, 1050, "Patrón Decorator (estructural): el sonido",
                 "JuegoConSonido «envuelve» a otro Juego: tiene la misma interfaz, le pasa cada pedido y agrega algo (el sonido) "
                 "después. JuegoDecorado es la base de cualquier decorador.")
    poner(d, "Main", 60, 160, solo=["main("], estereo="final", rol="Cliente")
    poner(d, "Juego", 560, 140, solo=["iniciarNivel", "+ mover(", "+ deshacer", "+ reiniciar", "viajarEnElTiempo", "getEstado"],
          rol="Componente (Component)")
    poner(d, "JuegoSokoban", 300, 450, solo=[], ops=["+ mover(direccion: Direccion): void", "+ getEstado(): EstadoJuego"],
          rol="Componente concreto (el dominio)")
    poner(d, "JuegoDecorado", 760, 450, solo=["# juego", "# JuegoDecorado", "+ mover(", "+ getEstado"],
          rol="Decorador (abstracta): delega todo")
    poner(d, "JuegoConSonido", 760, 700, solo=["JuegoConSonido(", "+ mover(", "sonarLoQuePaso"], extiende=None,
          rol="Decorador concreto: redefine lo que suena")
    C = d.cajas
    F = d.flecha
    ju, js, jd, jc, ma = C["Juego"], C["JuegoSokoban"], C["JuegoDecorado"], C["JuegoConSonido"], C["Main"]
    ym = 160 + ma.h / 2
    F("Main", "Juego", "dependencia", "right", "left", fo=0.5, fd=(ym - 140) / ju.h, etiqueta="variable local juego")
    F("Main", "JuegoConSonido", "dependencia", "bottom", "left", fo=0.5, fd=0.5, via=[(60 + ma.w / 2, 700 + jc.h / 2)],
      etiqueta="new JuegoConSonido(new JuegoSokoban(...))", pos=(420, 700 + jc.h / 2))
    yj = 400
    cx = 560 + ju.w * 0.4
    for s in ("JuegoSokoban", "JuegoDecorado"):
        k = C[s]
        F(s, "Juego", "implementa", "top", "bottom", fo=0.5, fd=0.4, via=[(k.x + k.w / 2, yj), (cx, yj)])
    d.texto(cx + 8, yj - 8, "implementan", 11, "#7B3FA0")
    F("JuegoDecorado", "Juego", "agregacion", "right", "right", fo=0.3, fd=0.6,
      via=[(760 + jd.w + 40, 450 + 0.3 * jd.h), (760 + jd.w + 40, 140 + 0.6 * ju.h)], etiqueta="juego (el que envuelve)",
      mult="1", num=2, pos=(760 + jd.w + 40, 330))
    F("JuegoConSonido", "JuegoDecorado", "hereda", "top", "bottom", etiqueta="extiende", num=3)
    d.texto(760 + jd.w + 52, 354, "(un Juego cualquiera: hoy, JuegoSokoban)", 10.5, "#8A7F76", italic=True)
    yn = 700 + jc.h + 40
    d.nota(50, yn, 620, [
        "**1** El dominio y el decorador base cumplen el mismo contrato Juego.",
        "**2** JuegoDecorado guarda adentro otro Juego y le pasa cada pedido.",
        "**3** JuegoConSonido extiende JuegoDecorado y solo redefine lo que suena:",
        "     después de cada pedido lee el Evento del estado y elige el efecto.",
        "La vista y el dominio no se enteran: Main hace",
        "     new JuegoConSonido(new JuegoSokoban(new CargadorNivel(carpeta)))",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(720, yn, 740, [
        "public void mover(Direccion direccion) {      // JuegoConSonido",
        "    super.mover(direccion);    // JuegoDecorado: juego.mover(direccion)",
        "    sonarLoQuePaso();",
        "}",
        "private void sonarLoQuePaso() {",
        "    EstadoJuego estado = juego.getEstado();",
        "    Sonido sonido = Sonido.de(estado.evento());   // y si rompió la última: DERROTA",
        "    if (sonido != null) Sonidos.obtenerInstancia().reproducir(sonido); ... }",
    ], titulo="El código clave (sonido/JuegoConSonido.java)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def state():
    d = Diagrama(1700, 800, "Patrón State (comportamiento): sonido activado o silenciado",
                 "El mismo pedido (reproducir) hace cosas distintas según el estado. La tecla M cambia de estado, y cada estado sabe a cuál pasa.")
    poner(d, "SonidosDeInterfaz", 50, 190, solo=["alApretarTecla"], estereo="final", rol="Cliente (tecla M y clics)")
    poner(d, "Sonidos", 660, 150, solo=["- estado", "+ reproducir", "alternarSonido", "establecerEstado", "detenerTodo"],
          estereo="final", rol="Contexto (Context)")
    poner(d, "EstadoSonido", 1220, 160, rol="Estado (State)")
    ops = ["+ reproducir(clip: Clip): void", "+ alternar(contexto: Sonidos): void"]
    poner(d, "SonidoActivado", 960, 420, ops=ops, rol="Estado concreto (inicial)")
    poner(d, "SonidoSilenciado", 1400, 420, ops=ops, rol="Estado concreto")
    C = d.cajas
    F = d.flecha
    so, es, sa, ss, si = C["Sonidos"], C["EstadoSonido"], C["SonidoActivado"], C["SonidoSilenciado"], C["SonidosDeInterfaz"]
    ysi = 190 + si.h / 2
    F("SonidosDeInterfaz", "Sonidos", "dependencia", "right", "left", fo=0.5, fd=(ysi - 150) / so.h,
      etiqueta="alternarSonido() · reproducir(CLIC)")
    ye = 160 + es.h / 2
    F("Sonidos", "EstadoSonido", "asociacion", "right", "left", fo=(ye - 150) / so.h, fd=0.5, etiqueta="estado", mult="1", num=1)
    cx = 1220 + es.w / 2
    for s in ("SonidoActivado", "SonidoSilenciado"):
        k = C[s]
        F(s, "EstadoSonido", "implementa", "top", "bottom", fd=0.5, via=[(k.x + k.w / 2, 340), (cx, 340)])
    d.texto(cx + 10, 300, "implementan", 11, "#7B3FA0")
    F("SonidoActivado", "SonidoSilenciado", "dependencia", "right", "left", fo=0.6, fd=0.6,
      etiqueta="alternar: new SonidoSilenciado()", num=2, pos=(1290, 420 + 0.6 * sa.h))
    yb = 420 + max(sa.h, ss.h) + 40
    F("SonidoSilenciado", "SonidoActivado", "dependencia", "bottom", "bottom", fo=0.5, fd=0.5,
      via=[(1400 + ss.w / 2, yb), (960 + sa.w / 2, yb)], etiqueta="alternar: new SonidoActivado()", pos=(1290, yb))
    d.nota(50, 620, 640, [
        "**1** Sonidos (el contexto) guarda el estado actual en un atributo.",
        "**2** Al apretar M, Sonidos.alternarSonido() le pasa el pedido al estado:",
        "     Activado corta lo que suena y pasa a Silenciado; Silenciado vuelve a Activado.",
        "     El estado hace la transición con contexto.establecerEstado(...).",
        "Sonidos no tiene ningún if «si está silenciado…»: lo decide el estado.",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(740, 620, 900, [
        "public void reproducir(Sonido sonido) {           // Sonidos (contexto)",
        "    Clip clip = clips.get(sonido);",
        "    if (clip != null) estado.reproducir(clip);  // el estado decide",
        "}",
        "// SonidoActivado.reproducir: stop, volver al inicio y start",
        "// SonidoSilenciado.reproducir: no hace nada",
    ], titulo="El código clave (sonido/Sonidos.java)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def memento():
    d = Diagrama(1640, 1240, "Deshacer y DeLorean: el patrón Memento",
                 "Antes de cada movimiento y en cada «punto en el tiempo» se guarda un recuerdo del nivel. Deshacer y viajar "
                 "en el tiempo es volver a un recuerdo.")
    poner(d, "JuegoSokoban", 50, 150, solo=[], ops=["+ mover(direccion: Direccion): void", "+ deshacer(): void",
                                                   "+ viajarEnElTiempo(): void"], rol="Cliente: decide cuándo")
    poner(d, "EstadoNivel", 520, 140, solo=["- terreno", "- cajas", "- movimientos", "crearRecuerdo", "+ restaurar", "viajarA"],
          rol="Originador (Originator)")
    poner(d, "RecuerdoNivel", 1090, 140, rol="Recuerdo (Memento)")
    poner(d, "HistorialDeshacer", 520, 520, solo=["- recuerdos", "+ guardar", "+ deshacer"], rol="Cuidador: deshacer")
    poner(d, "MaquinaDelTiempo", 520, 720, solo=["- puntos", "+ guardar", "volverAntesDe"], rol="Cuidador: DeLorean")
    poner(d, "Punto", 1150, 735)
    C = d.cajas
    F = d.flecha
    js, en, rn, hd, mq, pu = (C[k] for k in ("JuegoSokoban", "EstadoNivel", "RecuerdoNivel", "HistorialDeshacer",
                                             "MaquinaDelTiempo", "Punto"))

    def fy(id, y):
        return (y - C[id].y) / C[id].h
    F("JuegoSokoban", "EstadoNivel", "asociacion", "right", "left", fo=fy("JuegoSokoban", 190), fd=fy("EstadoNivel", 190),
      etiqueta="nivel", mult="0..1")
    F("JuegoSokoban", "HistorialDeshacer", "asociacion", "bottom", "left", fo=0.4, fd=0.5,
      via=[(50 + 0.4 * js.w, 520 + hd.h / 2)], etiqueta="historial", mult="1", num=1, pos=(330, 520 + hd.h / 2))
    F("JuegoSokoban", "MaquinaDelTiempo", "asociacion", "bottom", "left", fo=0.2, fd=0.5,
      via=[(50 + 0.2 * js.w, 720 + mq.h / 2)], etiqueta="maquinaDelTiempo", mult="1", num=2, pos=(330, 720 + mq.h / 2))
    F("EstadoNivel", "RecuerdoNivel", "dependencia", "right", "left", fo=fy("EstadoNivel", 200), fd=fy("RecuerdoNivel", 200),
      etiqueta="crea y lee", num=3)
    yh = 520 + hd.h / 2
    xr = 1090 + rn.w * 0.3
    F("HistorialDeshacer", "RecuerdoNivel", "agregacion", "right", "bottom", fo=0.5, fd=0.3, via=[(xr, yh)],
      etiqueta="recuerdos", mult="0..15", pos=(950, yh), mult_pos=(xr - 24, 140 + rn.h + 18))
    F("MaquinaDelTiempo", "Punto", "agregacion", "right", "left", fo=fy("MaquinaDelTiempo", 735 + pu.h / 2), fd=0.5,
      etiqueta="puntos", mult="0..10")
    xp = 1150 + pu.w * 0.6
    F("Punto", "RecuerdoNivel", "asociacion", "top", "bottom", fo=0.6, fd=(xp - 1090) / rn.w, etiqueta="recuerdo", mult="1",
      pos=(xp, 620), mult_pos=(xp + 14, 140 + rn.h + 18))
    # anidamiento: Punto es un record privado dentro de MaquinaDelTiempo (línea con ⊕ del lado de la clase que lo contiene)
    xa, xb = 520 + mq.w * 0.7, 1150 + pu.w * 0.3
    ya = 720 + mq.h
    yb = 735 + pu.h
    yc = max(ya, yb) + 30
    d.raw(f'<path d="M {xb} {yb} L {xb} {yc} L {xa} {yc} L {xa} {ya + 14}" fill="none" stroke="#1E1A17" stroke-width="1.4"/>'
          f'<circle cx="{xa}" cy="{ya + 7}" r="7" fill="#FFFFFF" stroke="#1E1A17" stroke-width="1.4"/>'
          f'<path d="M {xa - 7} {ya + 7} L {xa + 7} {ya + 7} M {xa} {ya} L {xa} {ya + 14}" stroke="#1E1A17" stroke-width="1.4"/>')
    d.texto((xa + xb) / 2, yc + 16, "Punto es un record privado de MaquinaDelTiempo (anidado)", 10.5, "#8A7F76",
            anchor="middle", italic=True)
    auto_saltos(d)
    # dibujo de la pila
    x0, y0, w, h, g = 60, yc + 80, 64, 34, 8
    d.texto(x0, y0 - 16, "**La pila del HistorialDeshacer** (máximo 15 recuerdos; el más nuevo a la derecha)", 12.5)
    for i in range(15):
        x = x0 + i * (w + g)
        reciente = i >= 10
        fill = "#D5E8D4" if reciente else "#F3FAF1"
        d.raw(f'<rect x="{x}" y="{y0}" width="{w}" height="{h}" rx="4" fill="{fill}" stroke="#82B366" stroke-width="1.2"/>')
        d.texto(x + w / 2, y0 + 22, f"rec. {i + 1}", 11, anchor="middle")
    xa = x0 + 10 * (w + g)
    xb = x0 + 15 * (w + g) - g
    d.raw(f'<path d="M {xa} {y0 + h + 8} L {xa} {y0 + h + 16} L {xb} {y0 + h + 16} L {xb} {y0 + h + 8}" fill="none" stroke="#6E1A2C" stroke-width="1.4"/>')
    d.texto((xa + xb) / 2, y0 + h + 34, "un deshacer saca estos 5 y vuelve al «rec. 11»", 11.5, "#6E1A2C", 600, anchor="middle")
    x1 = x0 + w
    d.raw(f'<path d="M {x0} {y0 + h + 8} L {x0} {y0 + h + 16} L {x1} {y0 + h + 16} L {x1} {y0 + h + 8}" fill="none" stroke="#8A7F76" stroke-width="1.2" stroke-dasharray="4 3"/>')
    d.texto(x0, y0 + h + 34, "cuando llega el 16, sale el 1 (el más viejo)", 11, "#8A7F76", italic=True)
    yn = y0 + h + 60
    d.nota(50, yn, 760, [
        "**1** mover(): antes de mover, JuegoSokoban pide nivel.crearRecuerdo(). Si el movimiento",
        "     se hizo, lo guarda en el historial (si pasa de 15, se borra el más viejo).",
        "     **deshacer():** el historial saca hasta 5 y devuelve el último; máximo 3 seguidos.",
        "**2** Puntos en el tiempo: al iniciar el nivel y cada vez que una caja llega a destino",
        "     se guarda un Punto (movimiento + recuerdo) en la MaquinaDelTiempo (máximo 10).",
        "     **DeLorean (tecla T):** cuesta 1 plutonio; volverAntesDe(movimientos) da el punto",
        "     anterior, nivel.viajarA(punto) y se borra el historial.",
    ], titulo="Las reglas: 15 / 5 / 3 y el DeLorean")
    d.nota(860, yn, 740, [
        "**Originador:** EstadoNivel crea el recuerdo (crearRecuerdo) y lo restaura (restaurar, viajarA).",
        "**3 Memento:** RecuerdoNivel (final). Su constructor y sus lectores son de paquete (~):",
        "     solo sokoban.modelo puede crearlo y abrirlo. Guarda copias, no el nivel vivo.",
        "**Cuidadores:** HistorialDeshacer y MaquinaDelTiempo (sokoban.modelo.tiempo)",
        "     guardan los recuerdos sin poder mirarlos adentro.",
        "**Cliente:** JuegoSokoban decide cuándo guardar y a qué recuerdo volver.",
        "Deshacer descarta los puntos «del futuro» (olvidarDespuesDe).",
    ], titulo="Por qué es un Memento (Martín)")
    return d


# ════════════════════════════════════════════════════════════════════════════
def command():
    d = Diagrama(1640, 1060, "Patrón Command (comportamiento): la repetición de la partida",
                 "Cada acción del jugador es un objeto. La grabadora los ejecuta y los anota; al terminar el nivel puede "
                 "volver a ejecutarlos uno por uno.")
    poner(d, "PantallaJuego", 50, 160, solo=["- mover(", "- deshacer(", "- viajarEnElTiempo("], extiende=None,
          rol="Cliente: crea los comandos")
    poner(d, "GrabadoraDePartida", 560, 140, solo=["- comandos", "+ ejecutar(", "+ reproducir", "+ saltarAlFinal"],
          rol="Invocador (Invoker)")
    poner(d, "Comando", 1150, 170, rol="Comando (Command)")
    eje = ["+ ejecutar(): void"]
    xs = (420, 760, 1080)
    nombres = ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo")
    for x, s in zip(xs, nombres):
        poner(d, s, x, 500, ops=eje, rol="Comando concreto")
    poner(d, "Juego", 50, 700, solo=["+ mover(", "+ deshacer(", "viajarEnElTiempo("], rol="Receptor (Receiver)")
    C = d.cajas
    F = d.flecha

    def fy(id, y):
        return (y - C[id].y) / C[id].h
    co, ju, pj, gr = C["Comando"], C["Juego"], C["PantallaJuego"], C["GrabadoraDePartida"]
    F("PantallaJuego", "GrabadoraDePartida", "asociacion", "right", "left", fo=fy("PantallaJuego", 200),
      fd=fy("GrabadoraDePartida", 200), etiqueta="grabadora", mult="1", num=1)
    F("GrabadoraDePartida", "Comando", "agregacion", "right", "left", fo=fy("GrabadoraDePartida", 200), fd=fy("Comando", 200),
      etiqueta="comandos", mult="*", num=2)
    cx = co.x + co.w / 2
    for s in nombres:
        k = C[s]
        F(s, "Comando", "implementa", "top", "bottom", fo=0.6, fd=0.5, via=[(k.x + 0.6 * k.w, 420), (cx, 420)])
    d.texto(cx + 10, 380, "implementan", 11, "#7B3FA0")
    xp = 50 + pj.w * 0.5
    for i, s in enumerate(nombres):
        k = C[s]
        F("PantallaJuego", s, "dependencia", "bottom", "top", fo=0.5, fd=0.25, via=[(xp, 455), (k.x + 0.25 * k.w, 455)],
          etiqueta="new" if i == 2 else None, pos=(300, 455))
    yj = 700 + ju.h / 2
    for i, s in enumerate(nombres):
        k = C[s]
        ultimo = i == 2
        F(s, "Juego", "asociacion", "bottom", "right", fo=0.5, fd=0.5, via=[(k.x + 0.5 * k.w, yj)],
          etiqueta="juego" if ultimo else None, mult="1" if ultimo else None, num=3 if ultimo else None,
          pos=(1000, yj))
    auto_saltos(d)
    yn = 700 + ju.h + 50
    d.nota(50, yn, 760, [
        "**1** PantallaJuego (cliente) traduce cada tecla o botón en un comando:",
        "     new ComandoMover(juego, direccion), new ComandoDeshacer(juego)...",
        "**2** La GrabadoraDePartida (invocador) lo ejecuta y lo anota en comandos.",
        "**3** Cada comando sabe a quién pedirle el trabajo: al Juego (receptor).",
        "**Ver repetición:** el nivel vuelve a empezar y la grabadora reproduce los comandos",
        "     grabados, uno cada 160 ms (Esc: saltarAlFinal). Termina en el mismo estado.",
        "Reiniciar no se graba: borra la grabación.",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(860, yn, 740, [
        "private void mover(Direccion direccion) {          // PantallaJuego",
        "    tablero.mirarHacia(direccion);",
        "    grabadora.ejecutar(new ComandoMover(juego, direccion));",
        "    ...  // avisa si se guardó un punto en el tiempo",
        "}",
        "public void ejecutar(Comando comando) {            // GrabadoraDePartida",
        "    if (estaReproduciendo()) return;",
        "    comando.ejecutar(); comandos.add(comando); }",
    ], titulo="El código clave (Martín)", mono=True)
    return d


DIAGRAMAS = {"0-como-leer-flechas": flechas, "1-vista-general": general, "2-diagrama-completo": completo,
             "3-patron-observer": observer, "4-patron-facade": facade, "5-patron-singleton": singleton, "6-mvc": mvc,
             "8-patron-strategy": strategy, "9-patron-mediator": mediator, "10-patron-decorator": decorator,
             "11-patron-state": state, "12-deshacer-memento": memento, "13-patron-command": command}



def png(nombres):
    js = """
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const n of process.argv.slice(1)) {
    const p = await b.newPage({ deviceScaleFactor: 2 });
    await p.goto('file://' + n + '.svg');
    const el = await p.$('svg');
    await el.screenshot({ path: n + '.png' });
  }
  await b.close();
})();
"""
    subprocess.run(["node", "-e", js, *nombres], check=True)


if __name__ == "__main__":
    pedidos = sys.argv[1:] or list(DIAGRAMAS)
    hechos = []
    for nombre in pedidos:
        ruta = os.path.join(SALIDA, nombre)
        with open(ruta + ".svg", "w", encoding="utf-8") as f:
            f.write(DIAGRAMAS[nombre]().svg())
        hechos.append(ruta)
    png(hechos)
    print("\n".join(h + ".svg/.png" for h in hechos))
