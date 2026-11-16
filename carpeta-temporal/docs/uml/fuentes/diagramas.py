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
    d = Diagrama(3700, 2470, "Sokoban · Diagrama de clases completo",
                 "Estado al 16/11/2026 (después de la auditoría) · todas las clases, atributos, métodos y relaciones · "
                 "violeta = implementa / es un · negro = tiene · gris punteado = usa / crea")
    # zonas
    d.paquete(30, 200, 1120, 1520, "sokoban.vista · VISTA (lo que se ve)")
    d.paquete(30, 1760, 1120, 470, "sokoban.comandos · REPETICIÓN (Command, Martín)", color="#F3FAF1", borde="#82B366")
    d.paquete(1190, 200, 860, 1060, "sokoban.modelo · CONTRATO vista ↔ dominio")
    d.paquete(2080, 200, 1590, 610, "sokoban.sonido · SONIDO (Mora)", color="#FBF6FC", borde="#A0559F")
    d.paquete(2080, 840, 1590, 1240,
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
    poner(d, "Repeticion", 620, 1800)
    poner(d, "ComandoMover", 60, 2060)
    poner(d, "ComandoDeshacer", 420, 2060)
    poner(d, "ComandoViajarEnElTiempo", 680, 2060)
    # contrato
    poner(d, "Juego", 1220, 240)
    poner(d, "JuegoDecorado", 1670, 240)
    poner(d, "ObservadorJuego", 1220, 560)
    poner(d, "EstadoJuego", 1670, 560)
    poner(d, "Direccion", 1220, 720)
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
    poner(d, "JuegoSokoban", 2110, 890)
    poner(d, "CargadorNivel", 2440, 890)
    poner(d, "Niveles", 2440, 1180)
    poner(d, "EstadoNivel", 2790, 890)
    poner(d, "MotorMovimiento", 3240, 900)
    poner(d, "MediadorMovimiento", 3230, 1420)
    poner(d, "RecuerdoNivel", 2110, 1440)
    poner(d, "MaquinaDelTiempo", 2110, 1780)
    poner(d, "Caja", 2470, 1440)
    poner(d, "Jugador", 2860, 1440)
    poner(d, "Posicion", 2900, 1800)
    poner(d, "ComportamientoCaja", 2480, 1800)
    for x, s in ((2320, "CajaNormalStrategy"), (2510, "CajaFragilStrategy"), (2690, "CajaLlaveStrategy")):
        poner(d, s, x, 1970)
    for x, w, txt in ((2320, 166, "no agrega nada · $"), (2510, 155, "a los 3 empujes: cajaRota"),
                      (2690, 153, "llaveEmpujada · L")):
        d.texto(x + w / 2, 2034, txt, 10.5, "#8A7F76", anchor="middle", italic=True)

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
    A("Main", "JuegoSokoban", "dependencia", "right", "top", 136, 2160, via=[(2064, 136), (2064, 826), (2160, 826)],
      etiqueta="crea el dominio", pos=(2064, 760))
    A("Main", "CargadorNivel", "dependencia", "right", "top", 136, 2600, via=[(2064, 136), (2064, 826), (2600, 826)],
      etiqueta="crea (carpeta de niveles)", pos=(2440, 826))
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
      pos=(im.x + im.w + 34, im.y + 100), mult="0..1", mult_pos=(im.x + im.w + 14, im.y + 88))
    A("Imagenes", "Assets", "dependencia", "right", "left", 1600, 1600, etiqueta="lee del disco o del .jar",
      pos=(860, 1622))
    # vista → contrato y comandos
    A("PantallaJuego", "Juego", "asociacion", "right", "left", 500, 300, via=[(1160, 500), (1160, 300)], etiqueta="juego",
      mult="1", pos=(1030, 500))
    A("PanelHUD", "ObservadorJuego", "implementa", "right", "left", 1100, 595, via=[(1184, 1100), (1184, 595)],
      etiqueta="implementan", pos=(1184, 680))
    A("PanelTablero", "ObservadorJuego", "implementa", "right", "left", 1330, 595, via=[(1184, 1330), (1184, 595)])
    A("PanelTablero", "Direccion", "asociacion", "right", "left", 1356, 830, via=[(1200, 1356), (1200, 830)],
      etiqueta="orientacion", pos=(1080, 1356), mult="1")
    A("PantallaJuego", "GrabadoraDePartida", "composicion", "right", "top", 900, 175,
      via=[(1140, 900), (1140, 1796), (175, 1796)], etiqueta="grabadora", mult="1", pos=(330, 1796))
    A("PantallaJuego", "Repeticion", "asociacion", "right", "right", 940, 1850, via=[(1128, 940), (1128, 1850)],
      etiqueta="repeticion", mult="0..1", pos=(1128, 1880))
    # comandos
    A("GrabadoraDePartida", "Comando", "agregacion", "right", "left", 1850, 1850, etiqueta="grabados", mult="0..*")
    A("Repeticion", "Comando", "asociacion", "left", "right", 1850, 1850, etiqueta="pendientes", mult="0..*")
    co = C["Comando"]
    for s in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
        k = C[s]
        A(s, "Comando", "implementa", "top", "bottom", k.x + k.w / 2, co.x + co.w / 2,
          via=[(k.x + k.w / 2, 2030), (co.x + co.w / 2, 2030)])
    d.texto(co.x + co.w / 2 + 8, 2024, "implementan", 10.5, "#7B3FA0")
    A("ComandoViajarEnElTiempo", "Juego", "asociacion", "right", "left", 2100, 380, via=[(1172, 2100), (1172, 380)],
      etiqueta="juego (receptor)", pos=(1172, 1650), mult="1")
    for s in ("ComandoMover", "ComandoDeshacer"):
        k = C[s]
        A(s, "Juego", "asociacion", "bottom", "left", k.x + k.w - 30, 380,
          via=[(k.x + k.w - 30, 2190), (1172, 2190), (1172, 380)])
    A("ComandoMover", "Direccion", "asociacion", "bottom", "left", 120, 880, via=[(120, 2210), (1210, 2210), (1210, 880)],
      etiqueta="direccion", pos=(700, 2210), mult="1")
    # contrato
    A("Juego", "ObservadorJuego", "dependencia", "bottom", "top", 1300, 1300, etiqueta="avisa a", pos=(1300, 500))
    A("Juego", "EstadoJuego", "dependencia", "bottom", "left", 1540, 585, via=[(1540, 585)], etiqueta="devuelve",
      pos=(1600, 585))
    A("ObservadorJuego", "EstadoJuego", "dependencia", "right", "left", 610, 610, etiqueta="recibe", pos=(1560, 625))
    A("JuegoDecorado", "Juego", "implementa", "left", "right", 300, 300, etiqueta="implementa", pos=(1622, 288))
    A("JuegoDecorado", "Juego", "asociacion", "left", "right", 400, 400, etiqueta="juego (el que envuelve)",
      pos=(1622, 425), mult="1")
    # sonido
    A("JuegoConSonido", "JuegoDecorado", "hereda", "left", "right", 300, 300, etiqueta="extiende", pos=(2062, 288))
    A("JuegoConSonido", "EstadoJuego", "dependencia", "left", "right", 590, 590, etiqueta="compara", pos=(1960, 590))
    A("JuegoConSonido", "Sonidos", "dependencia", "right", "left", 300, 300, etiqueta="usa")
    A("JuegoConSonido", "Sonido", "dependencia", "right", "left", 580, 580, etiqueta="elige el efecto")
    A("Sonidos", "EstadoSonido", "asociacion", "right", "left", 292, 292, etiqueta="estado", mult="1", pos=(2920, 292))
    so = C["Sonidos"]
    A("Sonidos", "Sonidos", "asociacion", "top", "top", so.x + 40, so.x + 100,
      via=[(so.x + 40, so.y - 24), (so.x + 100, so.y - 24)], etiqueta="instancia", pos=(so.x + 150, so.y - 24),
      mult="0..1", mult_pos=(so.x + 118, so.y - 8))
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
    A("JuegoSokoban", "Juego", "implementa", "left", "right", 920, 420, via=[(1620, 920), (1620, 420)],
      etiqueta="implementa", pos=(1840, 920))
    A("JuegoSokoban", "EstadoJuego", "dependencia", "left", "bottom", 960, 1740, via=[(1740, 960)], etiqueta="crea",
      pos=(1900, 960))
    A("JuegoSokoban", "ObservadorJuego", "agregacion", "left", "bottom", 1300, 1420, via=[(1420, 1300)],
      etiqueta="observadores", pos=(1780, 1300), mult="0..*", mult_pos=(1444, 650))
    # dominio
    A("JuegoSokoban", "CargadorNivel", "asociacion", "right", "left", 920, 920, etiqueta="cargador", mult="1")
    A("CargadorNivel", "EstadoNivel", "dependencia", "right", "left", 920, 920, etiqueta="crea")
    A("CargadorNivel", "Niveles", "dependencia", "bottom", "top", 2550, 2550, etiqueta="lee nivelN.txt", pos=(2610, 1160))
    A("JuegoSokoban", "EstadoNivel", "asociacion", "right", "left", 1320, 1320, etiqueta="estado (el nivel actual)",
      mult="0..1")
    A("JuegoSokoban", "MediadorMovimiento", "asociacion", "top", "right", 2200, 1480,
      via=[(2200, 870), (3610, 870), (3610, 1480)], etiqueta="motor (guardado como la interfaz)", pos=(3100, 870),
      mult="0..1", mult_pos=(3540, 1470))
    A("JuegoSokoban", "MotorMovimiento", "dependencia", "top", "top", 2260, 3366, via=[(2260, 881), (3366, 881)],
      etiqueta="crea", pos=(3300, 881))
    A("JuegoSokoban", "RecuerdoNivel", "composicion", "bottom", "top", 2200, 2200, etiqueta="historial",
      pos=(2250, 1400), mult="0..15", mult_pos=(2170, 1428))
    A("JuegoSokoban", "MaquinaDelTiempo", "composicion", "left", "left", 1340, 1850, via=[(2090, 1340), (2090, 1850)],
      etiqueta="maquinaDelTiempo", pos=(2090, 1730), mult="1", mult_pos=(2100, 1842))
    A("MaquinaDelTiempo", "RecuerdoNivel", "agregacion", "top", "bottom", 2240, 2240, etiqueta="puntos", mult="0..10",
      pos=(2290, 1720), mult_pos=(2268, 1688))
    A("RecuerdoNivel", "EstadoNivel", "asociacion", "right", "bottom", 1460, 2950,
      via=[(2452, 1460), (2452, 1375), (2950, 1375)], etiqueta="nivel (una copia)", pos=(2700, 1375), mult="1",
      mult_pos=(2964, 1360))
    A("MotorMovimiento", "EstadoNivel", "asociacion", "left", "right", 940, 940, etiqueta="estado", mult="1")
    A("MotorMovimiento", "MediadorMovimiento", "implementa", "bottom", "top", 3366, 3366, etiqueta="implementa",
      pos=(3366, 1250))
    A("MotorMovimiento", "Caja", "dependencia", "left", "top", 965, 2700, via=[(3160, 965), (3160, 1395), (2700, 1395)],
      etiqueta="empuja", pos=(3000, 1395))
    A("MotorMovimiento", "Jugador", "dependencia", "left", "top", 985, 3060, via=[(3180, 985), (3180, 1412), (3060, 1412)],
      etiqueta="mueve", pos=(3200, 1300))
    A("EstadoNivel", "Caja", "composicion", "bottom", "top", 2820, 2760, via=[(2820, 1385), (2760, 1385)],
      etiqueta="cajas", pos=(2830, 1365), mult="0..*", mult_pos=(2740, 1432))
    A("EstadoNivel", "Jugador", "composicion", "bottom", "top", 3000, 3000, etiqueta="jugador", pos=(3000, 1360),
      mult="1")
    A("Jugador", "MediadorMovimiento", "asociacion", "right", "left", 1470, 1470, etiqueta="mediador", mult="0..1")
    A("Caja", "MediadorMovimiento", "asociacion", "right", "left", 1620, 1520, via=[(3200, 1620), (3200, 1520)],
      etiqueta="mediador", pos=(3060, 1620), mult="0..1", mult_pos=(3210, 1512))
    A("Jugador", "Posicion", "asociacion", "bottom", "top", 3040, 3040, etiqueta="posicion", pos=(3040, 1720), mult="1")
    A("Caja", "Posicion", "asociacion", "right", "left", 1680, 1850, via=[(2850, 1680), (2850, 1850)],
      etiqueta="posicion", pos=(2850, 1760), mult="1")
    cc = C["ComportamientoCaja"]
    A("Caja", "ComportamientoCaja", "asociacion", "bottom", "top", 2600, 2600, etiqueta="estrategia", pos=(2600, 1760),
      mult="1")
    ccx = cc.x + cc.w / 2
    for s in ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"):
        k = C[s]
        A(s, "ComportamientoCaja", "implementa", "top", "bottom", k.x + k.w / 2, ccx,
          via=[(k.x + k.w / 2, 1940), (ccx, 1940)])
    d.texto(ccx + 8, 1934, "implementan", 10.5, "#7B3FA0")
    auto_saltos(d)

    leyenda_autoria(d, 30, 2290)
    leyenda_flechas(d, 560, 2290)
    d.nota(1300, 2280, 1040, [
        "**Herencia de Swing:** debajo del nombre dice «extiende JPanel / JFrame» (no se dibuja la flecha a JPanel).",
        "**Getters y setters:** se dibujan todos los públicos. Se omiten las constantes de estilo y los métodos que solo",
        "implementan una interfaz (actualizar, los de Juego en JuegoSokoban), salvo en el Decorator, que muestra lo que redefine.",
        "**Mediator:** Jugador y Caja son colegas; las estrategias le avisan al mediador (cajaRota, llaveEmpujada) y",
        "EstadoNivel.conectarColegas los conecta. Esas dependencias se ven en el diagrama 9, no acá, para no cruzar todo.",
        "**Direccion** también la usan Juego.mover, PantallaJuego (TECLAS), Posicion.siguiente y MediadorMovimiento.",
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
        ("agregacion", ("JuegoSokoban", "dominio", "class"), ("ObservadorJuego", "luca", "interface"),
         "TIENE UNA LISTA, SIN CREARLOS  ·  agregación (◇ vacío)", "Se los pasan desde afuera con agregarObservador(...).",
         "private final List<ObservadorJuego> observadores = new ArrayList<>();"),
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
        "**Multiplicidad** (número en la punta): 1 = exactamente uno · 0..1 = cero o uno · 0..* = cualquier cantidad.",
        "**Visibilidad**: + público · - privado · # protegido.  **Subrayado** = static (es de la clase, no de cada objeto).  "
        "**Cursiva** = abstracto (método de interfaz, sin código).",
        "**«interface», «enumeration», «record»**: el tipo de la clase. Violeta = jerarquía · negro = tener · gris punteado = usar.",
    ], titulo="Además")
    return d


# ════════════════════════════════════════════════════════════════════════════
def general():
    d = Diagrama(1600, 980, "Vista general: las capas del proyecto",
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
           texto=["Juego  ← Facade + sujeto del Observer", "JuegoDecorado  ← base del Decorator",
                  "ObservadorJuego  ← Observer", "EstadoJuego  ← DTO (record)", "Direccion  ← enum"])
    d.caja("Comandos", "REPETICIÓN · sokoban.comandos", 600, 560, 330, estereo="paquete · Martín", autor="martin",
           texto=["Comando + 3 comandos  ← Command", "GrabadoraDePartida (invocador)", "Repeticion (vuelve a ejecutarlos)"])
    d.caja("Sonido", "SONIDO · sokoban.sonido", 1130, 290, 410, estereo="paquete · Mora", autor="sonido",
           texto=["JuegoConSonido  ← Decorator (extiende JuegoDecorado)", "Sonidos  ← Singleton + Facade de javax.sound",
                  "EstadoSonido, SonidoActivado, SonidoSilenciado  ← State", "Sonido (16 efectos), SonidosDeInterfaz (clics, M)",
                  "assets/sonidos/: 16 archivos .wav propios"])
    d.caja("Dominio", "DOMINIO · sokoban.modelo y subpaquetes", 1130, 540, 410, estereo="paquete · Pedro y Lucía · Martín",
           autor="dominio",
           texto=["JuegoSokoban  ← implementa Juego (sujeto del Observer)", "CargadorNivel, EstadoNivel, Posicion",
                  "entidades: Jugador, Caja (colegas del Mediator)", "estrategias: ComportamientoCaja + 3 cajas  ← Strategy",
                  "movimiento: MediadorMovimiento, MotorMovimiento  ← Mediator",
                  "RecuerdoNivel + tiempo.MaquinaDelTiempo  ← Memento (Martín)", "niveles/: nivel1.txt a nivel3.txt"])
    d.caja("Arte", "ARTE · assets/", 60, 650, 330, estereo="carpeta · Martín", autor="martin",
           texto=["107 imágenes PNG (se usan 33)", "personaje, cajas, pisos, paredes, fondos, HUD"])
    C = d.cajas
    F = d.flecha
    F("Vista", "Comandos", "dependencia", "right", "left", fo=0.9, fd=0.5, via=[(495, 290 + 0.9 * C["Vista"].h),
      (495, 560 + C["Comandos"].h / 2)], etiqueta="PantallaJuego crea los comandos", pos=(495, 600))
    F("Comandos", "Contrato", "dependencia", "top", "bottom", fo=0.5, fd=0.5, etiqueta="usan Juego (receptor)",
      pos=(765, 530))
    F("Main", "Vista", "dependencia", "left", "top", fo=0.3, fd=0.9, etiqueta="crea la ventana", pos=(500, 90 + 0.3 * C["Main"].h))
    F("Main", "Sonido", "dependencia", "right", "top", fo=0.7, fd=(1335 - 1130) / 410, via=[(1335, 90 + 0.7 * C["Main"].h)],
      etiqueta="crea", pos=(1130, 90 + 0.7 * C["Main"].h))
    F("Main", "Dominio", "dependencia", "right", "right", fo=0.3, fd=0.3, via=[(1570, 90 + 0.3 * C["Main"].h),
      (1570, 540 + 0.3 * C["Dominio"].h)], etiqueta="crea", pos=(1130, 90 + 0.3 * C["Main"].h))
    F("Vista", "Swing", "hereda", "top", "bottom", fo=0.35, fd=(175.5 - 60) / 230, etiqueta="extiende", pos=(175.5, 245))
    yc = 330 + 0.35 * C["Contrato"].h
    F("Vista", "Contrato", "dependencia", "right", "left", fo=(yc - 290) / C["Vista"].h, fd=0.35,
      etiqueta="usa / implementa", pos=(495, yc))
    F("Sonido", "Contrato", "implementa", "left", "right", fo=(yc - 290) / C["Sonido"].h, fd=0.35,
      etiqueta="implementa y usa Juego", pos=(1030, yc))
    F("Dominio", "Contrato", "implementa", "left", "right", fo=0.2, fd=0.8,
      via=[(1030, 540 + 0.2 * C["Dominio"].h), (1030, 330 + 0.8 * C["Contrato"].h)], etiqueta="implementa Juego",
      pos=(1030, 520))
    F("Vista", "Arte", "dependencia", "bottom", "top", etiqueta="lee las imágenes", pos=(225, 622))
    d.nota(490, 770, 1070, [
        "**Por qué importa:** la VISTA solo conoce el CONTRATO (interfaces). El dominio y el sonido también dependen solo del contrato:",
        "JuegoConSonido (con su base JuegoDecorado) envuelve «un Juego» sin saber que adentro está JuegoSokoban. Por eso el dominio,",
        "el sonido y las funcionalidades nuevas entraron casi sin tocar la vista. Eso es el principio **DIP** (inversión de dependencias).",
    ], titulo="La idea de esta arquitectura")
    leyenda_autoria(d, 60, 790)
    return d


# ════════════════════════════════════════════════════════════════════════════
def observer():
    d = Diagrama(1500, 860, "Patrón Observer (comportamiento)",
                 "Cuando cambia la partida, el sujeto avisa a todos los observadores; cada uno se actualiza solo. "
                 "La etiqueta dorada es el ROL de la clase en el patrón.")
    poner(d, "Juego", 60, 120, solo=["agregarObservador", "quitarObservador", "getEstado"], rol="Sujeto (Subject)")
    poner(d, "ObservadorJuego", 760, 140, rol="Observador (Observer)")
    poner(d, "EstadoJuego", 1210, 100, rol="Lo que se avisa (estado)")
    poner(d, "JuegoSokoban", 60, 430, solo=["observadores", "notificar"], rol="Sujeto concreto")
    poner(d, "PanelHUD", 720, 520, solo=["nivel:", "movimientos:", "empujes:", "plutonio:"], ops=["+ actualizar(estado: EstadoJuego): void"],
          rol="Observador concreto")
    poner(d, "PanelTablero", 1100, 520, solo=["- tablero:", "- epoca:"], ops=["+ actualizar(estado: EstadoJuego): void"],
          rol="Observador concreto")
    F = d.flecha
    ju, ob = d.cajas["Juego"], d.cajas["ObservadorJuego"]
    js = d.cajas["JuegoSokoban"]
    F("Juego", "ObservadorJuego", "dependencia", "right", "left", fo=(173.5 - 120) / ju.h, fd=0.5, etiqueta="avisa a", num=3)
    F("ObservadorJuego", "EstadoJuego", "dependencia", "right", "left", fd=(173.5 - 100) / d.cajas["EstadoJuego"].h,
      etiqueta="recibe", num=4)
    F("JuegoSokoban", "Juego", "implementa", "top", "bottom", fo=0.3, fd=(60 + 0.3 * js.w - 60) / ju.w,
      etiqueta="implementa", num=1)
    jx = 60 + js.w
    F("JuegoSokoban", "ObservadorJuego", "agregacion", "right", "bottom", fo=0.25, fd=(790 - 760) / ob.w,
      via=[(790, 430 + 0.25 * js.h)], etiqueta="observadores (la lista)", mult="0..*", mult_pos=(812, 228), num=2,
      pos=((jx + 790) / 2 + 20, 430 + 0.25 * js.h))
    tx = 900
    for c in ("PanelHUD", "PanelTablero"):
        k = d.cajas[c]
        F(c, "ObservadorJuego", "implementa", "top", "bottom", fo=0.5, fd=(tx - 760) / ob.w,
          via=[(k.x + k.w * 0.5, 490), (tx, 490)])
    d.texto(tx + 10, 330, "implementan", 11, "#7B3FA0")
    d.nota(1000, 365, 460, [
        "El sonido **no** es un observador: es un Decorator",
        "(ver el diagrama 10). JuegoDecorado.agregarObservador",
        "y quitarObservador le pasan cada observador a",
        "JuegoSokoban, que es quien los guarda y les avisa.",
    ], titulo="¿Y el sonido?")
    d.nota(60, 690, 660, [
        "**1** JuegoSokoban cumple el contrato Juego.",
        "**2** Guarda la lista: agregarObservador(...) suscribe, quitarObservador(...) desuscribe.",
        "**3** Después de cada cambio recorre la lista: obs.actualizar(foto).",
        "**4** Cada observador recibe una foto inmutable (EstadoJuego) y se redibuja.",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(760, 690, 700, ["private void notificar() {", "    EstadoJuego foto = getEstado();",
                           "    for (ObservadorJuego obs : observadores) obs.actualizar(foto);", "}",
                           "// Registro (PantallaJuego): juego.agregarObservador(hud); juego.agregarObservador(tablero);"],
           titulo="El código clave (JuegoSokoban.notificar)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def facade():
    d = Diagrama(1880, 860, "Patrón Facade (estructural)",
                 "La vista habla con UNA sola interfaz simple (Juego). Atrás, JuegoSokoban coordina las piezas del dominio sin que la vista se entere.")
    poner(d, "PantallaJuego", 50, 250, solo=["- juego:", "iniciar(", "- mover("], rol="Cliente")
    poner(d, "Juego", 480, 230, rol="Fachada (Facade)")
    poner(d, "JuegoSokoban", 960, 260, solo=["- cargador", "- historial", "- estado:", "- motor:"],
          ops=["+ mover(direccion: Direccion): void", "+ deshacer(): void", "- notificar(): void"], rol="Fachada concreta")
    poner(d, "JuegoDecorado", 960, 110, solo=["# juego:"], ops=[], rol="Decorator: también es un Juego (ver 10)")
    d.paquete(1360, 110, 490, 600, "Subsistema del dominio")
    poner(d, "CargadorNivel", 1390, 150, solo=["cargar(", "contarNiveles"])
    poner(d, "EstadoNivel", 1390, 250, solo=["- jugador", "- cajas", "estaLibre", "copiar(): E", "tableroParaVista"])
    poner(d, "MediadorMovimiento", 1390, 440, solo=["intentarMover", "fueEmpuje"])
    poner(d, "Jugador", 1390, 570, solo=["mover("])
    d.texto(1605, 680, "y además: MotorMovimiento, Caja, las 3 estrategias, Posicion", 10.5, "#8A7F76", anchor="middle",
            italic=True)
    F = d.flecha
    C = d.cajas
    ju = C["Juego"]
    pj = C["PantallaJuego"]
    F("PantallaJuego", "Juego", "asociacion", "right", "left", fo=0.5, fd=(250 + pj.h / 2 - 230) / ju.h,
      etiqueta="juego.mover(dir)", mult="1")
    yj = 230 + 0.35 * ju.h
    js, jc = C["JuegoSokoban"], C["JuegoDecorado"]
    F("JuegoSokoban", "Juego", "implementa", "left", "right", fo=0.3, fd=0.35, via=[(910, 260 + 0.3 * js.h), (910, yj)])
    F("JuegoDecorado", "Juego", "implementa", "left", "right", fo=0.5, fd=0.35, via=[(910, 110 + jc.h / 2), (910, yj)])
    d.texto(900, 200, "implementan", 11, "#7B3FA0", anchor="end")

    def fy(id, y):
        return (y - C[id].y) / C[id].h
    F("JuegoSokoban", "CargadorNivel", "asociacion", "right", "left", fo=fy("JuegoSokoban", 285), fd=0.5,
      via=[(1300, 285), (1300, 150 + C["CargadorNivel"].h / 2)], etiqueta="cargador", pos=(1300, 235))
    F("JuegoSokoban", "EstadoNivel", "asociacion", "right", "left", fo=fy("JuegoSokoban", 330), fd=fy("EstadoNivel", 330),
      etiqueta="estado")
    F("JuegoSokoban", "MediadorMovimiento", "asociacion", "right", "left", fo=fy("JuegoSokoban", 400),
      fd=fy("MediadorMovimiento", 470), via=[(1300, 400), (1300, 470)], etiqueta="motor", pos=(1300, 437))
    F("JuegoSokoban", "Jugador", "dependencia", "bottom", "left", fo=0.5, fd=0.5,
      via=[(960 + js.w / 2, 570 + C["Jugador"].h / 2)], etiqueta="estado.getJugador().mover(dir)", pos=(1200, 570 + C["Jugador"].h / 2))
    d.nota(50, 730, 1800, [
        "Para la vista, mover al jugador es UNA llamada: juego.mover(Direccion.DERECHA). Atrás, JuegoSokoban guarda un recuerdo para deshacer, le pide al Jugador que se mueva (y él al",
        "mediador), suma movimientos, empujes y plutonio y avisa a los observadores. **La vista no se entera de nada de eso.** Hay otra fachada en el proyecto: **Sonidos**, que esconde javax.sound (diagrama 11).",
    ], titulo="Qué gana el proyecto")
    return d


# ════════════════════════════════════════════════════════════════════════════
def singleton():
    d = Diagrama(1360, 1100, "Patrón Singleton (creacional)",
                 "Hay DOS: una sola caché de imágenes (Imagenes) y un solo reproductor de sonidos (Sonidos). Todos los piden con obtenerInstancia().")
    poner(d, "MenuPrincipal", 50, 110, solo=[], rol="Cliente")
    poner(d, "PanelHUD", 50, 260, solo=[], rol="Cliente")
    poner(d, "PanelTablero", 50, 410, solo=[], rol="Cliente")
    poner(d, "Imagenes", 520, 200, rol="Singleton")
    poner(d, "Assets", 1060, 220)
    F = d.flecha
    im = d.cajas["Imagenes"]
    for c, f in (("MenuPrincipal", 0.2), ("PanelHUD", 0.5), ("PanelTablero", 0.8)):
        F(c, "Imagenes", "dependencia", "right", "left", fo=0.5, fd=f, etiqueta="obtenerInstancia().obtener(ruta)" if f == 0.5 else None)
    yb = 200 + im.h + 26
    F("Imagenes", "Imagenes", "asociacion", "bottom", "bottom", fo=0.75, fd=0.35, via=[(520 + 0.75 * im.w, yb), (520 + 0.35 * im.w, yb)],
      etiqueta="instancia (la única)", mult="0..1", mult_pos=(520 + 0.35 * im.w - 20, 200 + im.h + 16))
    F("Imagenes", "Assets", "dependencia", "right", "left", fo=0.4, fd=(200 + 0.4 * im.h - 220) / d.cajas["Assets"].h,
      etiqueta="lee cada PNG una vez")
    # Sonidos
    d.raw('<line x1="40" y1="520" x2="1320" y2="520" stroke="#D9CBAE" stroke-width="1.2" stroke-dasharray="4 4"/>')
    poner(d, "JuegoConSonido", 50, 600, solo=[], rol="Cliente")
    poner(d, "SonidosDeInterfaz", 50, 740, solo=[], rol="Cliente")
    poner(d, "Sonidos", 520, 580, rol="Singleton")
    poner(d, "AssetsSonidos", 1040, 610)
    so = d.cajas["Sonidos"]
    F("JuegoConSonido", "Sonidos", "dependencia", "right", "left", fo=0.5, fd=(623 - 580) / so.h,
      etiqueta="obtenerInstancia().reproducir(sonido)")
    sdi = d.cajas["SonidosDeInterfaz"]
    F("SonidosDeInterfaz", "Sonidos", "dependencia", "right", "left", fo=0.5, fd=(740 + sdi.h / 2 - 580) / so.h)
    yb = 580 + so.h + 26
    F("Sonidos", "Sonidos", "asociacion", "bottom", "bottom", fo=0.75, fd=0.35, via=[(520 + 0.75 * so.w, yb), (520 + 0.35 * so.w, yb)],
      etiqueta="instancia (la única)", mult="0..1", mult_pos=(520 + 0.35 * so.w - 20, 580 + so.h + 16))
    F("Sonidos", "AssetsSonidos", "dependencia", "right", "left", fo=(660 - 580) / so.h, fd=(660 - 610) / d.cajas["AssetsSonidos"].h,
      etiqueta="carga cada .wav una vez")
    d.nota(50, 930, 1260, [
        "private static Imagenes instancia;          // 1. la única instancia, guardada en la clase   (Sonidos: igual)",
        "private Imagenes() { }                      // 2. constructor privado: nadie más puede hacer new",
        "public static Imagenes obtenerInstancia() {  // 3. punto de acceso global",
        "    if (instancia == null) instancia = new Imagenes();   // se crea la primera vez que se pide",
        "    return instancia; }",
    ], titulo="Las 3 piezas que tiene que tener un Singleton (las dos clases las tienen)", mono=True)
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
           texto=["JuegoConSonido: deja pasar", "cada pedido y hace sonar", "el efecto que corresponde"])
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
    d = Diagrama(1640, 800, "Patrón Strategy (comportamiento): las tres cajas",
                 "Cada caja guarda un objeto «comportamiento». Para cambiar qué hace una caja al ser empujada se cambia ese objeto, no la clase Caja.")
    poner(d, "EstadoNivel", 50, 140, solo=["- cajas", "EstadoNivel(lineas"], rol="Cliente: elige la estrategia")
    poner(d, "Caja", 470, 140, solo=["- estrategia", "- resistencia", "- mediador", "despuesDeEmpujar", "getSimbolo",
                                     "quitarResistencia", "getResistencia"], rol="Contexto (Context)")
    poner(d, "ComportamientoCaja", 1020, 150, rol="Estrategia (Strategy)")
    ops = ["+ despuesDeEmpujar(caja: Caja,", "      mediador: MediadorMovimiento): void", "+ simbolo(caja: Caja): char"]
    xs = (120, 600, 1080)
    for x, s in zip(xs, ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy")):
        poner(d, s, x, 400, ops=ops, rol="Estrategia concreta")
    C = d.cajas
    F = d.flecha
    cc = C["ComportamientoCaja"]
    ca = C["Caja"]
    ycc = 150 + cc.h / 2
    F("EstadoNivel", "Caja", "composicion", "right", "left", fo=(ycc - 140) / C["EstadoNivel"].h, fd=(ycc - 140) / ca.h,
      etiqueta="cajas", mult="0..*")
    F("Caja", "ComportamientoCaja", "asociacion", "right", "left", fo=(ycc - 140) / ca.h, fd=0.5, etiqueta="estrategia", mult="1",
      num=1)
    cx = 1020 + cc.w / 2
    for x, s in zip(xs, ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy")):
        k = C[s]
        F(s, "ComportamientoCaja", "implementa", "top", "bottom", fd=0.5, via=[(x + k.w / 2, 360), (cx, 360)])
    d.texto(cx + 10, 300, "implementan", 11, "#7B3FA0")
    d.raw(f'<circle cx="{cx - 18}" cy="296" r="8.5" fill="#B8892A"/><text x="{cx - 18}" y="299.5" font-size="10" '
          f'font-weight="700" text-anchor="middle" fill="#FFFFFF">2</text>')
    MONO = "IBM Plex Mono, DejaVu Sans Mono, monospace"
    codigos = [["// no hace nada más", "simbolo: '$'"],
               ["caja.quitarResistencia();", "if (caja.getResistencia() <= 0)", "    mediador.cajaRota(caja);",
                "simbolo: 'f' si queda 1, si no 'F'"],
               ["mediador.llaveEmpujada(caja);", "// el motor abre los muros si", "// la llave quedó en el cerrojo",
                "simbolo: 'L'"]]
    for x, s, lineas in zip(xs, ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"), codigos):
        y = 400 + C[s].h + 24
        for i, l in enumerate(lineas):
            d.raw(f'<text x="{x}" y="{y + i * 16}" font-size="11" fill="#4A403A" font-family="{MONO}">{escape(l)}</text>')
    d.nota(50, 610, 640, [
        "**1** Cada Caja guarda su estrategia en un atributo (la recibe al crearse).",
        "**2** Las tres estrategias cumplen el mismo contrato ComportamientoCaja.",
        "**3** Después de un empuje, la Caja no pregunta «¿qué tipo soy?»:",
        "     le pasa el pedido a su estrategia (código de la derecha).",
        "**Quién elige:** el constructor de EstadoNivel, según la letra del .txt:",
        "     $ normal · F frágil (resistencia 3) · L llave.",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(740, 610, 850, [
        "public void despuesDeEmpujar() {                 // 3. la Caja delega",
        "    estrategia.despuesDeEmpujar(this, mediador);  // y le pasa el mediador",
        "}",
        "public char getSimbolo() { return estrategia.simbolo(this); }",
        "// Una caja nueva (por ejemplo, explosiva) = una clase nueva que implemente",
        "// ComportamientoCaja y una letra más en EstadoNivel. Caja no cambia (OCP).",
    ], titulo="El código clave (entidades/Caja.java)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def mediator():
    d = Diagrama(1640, 1010, "Patrón Mediator (comportamiento): el movimiento",
                 "Jugador y Caja no se conocen ni conocen el tablero: le hablan a un mediador, y el mediador resuelve todo.")
    poner(d, "Jugador", 50, 150, solo=["- mediador", "- posicion", "conectar", "mover(", "setPosicion", "getPosicion"],
          rol="Colega (Colleague)")
    poner(d, "MediadorMovimiento", 600, 160, rol="Mediador (Mediator)")
    poner(d, "Caja", 1180, 140, solo=["- mediador", "- posicion", "conectar", "setPosicion", "despuesDeEmpujar"],
          rol="Colega (Colleague)")
    poner(d, "MotorMovimiento", 600, 420, ops=["+ MotorMovimiento(estado: EstadoNivel)",
                                                "+ intentarMover(direccion: Direccion): boolean", "+ fueEmpuje(): boolean",
                                                "+ cajaRota(caja: Caja): void", "+ llaveEmpujada(caja: Caja): void"],
          rol="Mediador concreto")
    poner(d, "EstadoNivel", 1180, 470, solo=["- jugador", "- cajas", "conectarColegas", "cajaEn", "estaLibre", "esHielo",
                                             "quitarCaja", "abrirMuros"], rol="El tablero que consulta")
    poner(d, "JuegoSokoban", 50, 520, solo=["- motor", "- estado:", "conectarMotor"], rol="Arma la conexión")
    C = d.cajas
    F = d.flecha

    def fy(id, y):
        return (y - C[id].y) / C[id].h

    def fx(id, x):
        return (x - C[id].x) / C[id].w
    mm, mo, ju, js, en = C["MediadorMovimiento"], C["MotorMovimiento"], C["Jugador"], C["JuegoSokoban"], C["EstadoNivel"]
    F("Jugador", "MediadorMovimiento", "asociacion", "right", "left", fo=fy("Jugador", 205), fd=fy("MediadorMovimiento", 205),
      etiqueta="mediador", mult="0..1", num=1)
    F("Caja", "MediadorMovimiento", "asociacion", "left", "right", fo=fy("Caja", 205), fd=fy("MediadorMovimiento", 205),
      etiqueta="mediador", mult="0..1", num=1)
    F("MotorMovimiento", "MediadorMovimiento", "implementa", "top", "bottom", fo=fx("MotorMovimiento", 700),
      fd=fx("MediadorMovimiento", 700), etiqueta="implementa", num=2, pos=(700, 350))
    F("MotorMovimiento", "EstadoNivel", "asociacion", "right", "left", fo=fy("MotorMovimiento", 560), fd=fy("EstadoNivel", 560),
      etiqueta="estado", mult="1")
    F("MotorMovimiento", "Caja", "dependencia", "right", "bottom", fo=fy("MotorMovimiento", 440), fd=fx("Caja", 1300),
      via=[(1300, 440)], etiqueta="setPosicion · despuesDeEmpujar()", num=3, pos=(1050, 440))
    F("MotorMovimiento", "Jugador", "dependencia", "left", "bottom", fo=fy("MotorMovimiento", 460), fd=fx("Jugador", 200),
      via=[(200, 460)], etiqueta="setPosicion(siguiente)", num=4, pos=(420, 460))
    F("EstadoNivel", "MediadorMovimiento", "dependencia", "left", "bottom", fo=fy("EstadoNivel", 640), fd=fx("MediadorMovimiento", 850),
      via=[(1000, 640), (1000, 380), (850, 380)], etiqueta="conectarColegas(mediador)", pos=(1000, 600), saltos=[(1000, 440)])
    F("JuegoSokoban", "MotorMovimiento", "dependencia", "right", "left", fo=fy("JuegoSokoban", 580), fd=fy("MotorMovimiento", 580),
      etiqueta="lo crea")
    F("JuegoSokoban", "MediadorMovimiento", "asociacion", "right", "left", fo=fy("JuegoSokoban", 540),
      fd=fy("MediadorMovimiento", 250), via=[(560, 540), (560, 250)], etiqueta="motor", mult="0..1", pos=(560, 400),
      saltos=[(560, 460)])
    d.nota(50, 700, 700, [
        "**1** Los dos colegas, Jugador y Caja, guardan un MediadorMovimiento (la interfaz).",
        "**2** MotorMovimiento lo implementa y concentra las reglas: paredes, cajas, hielo.",
        "     Al crearse llama a estado.conectarColegas(this): así cada colega lo conoce.",
        "**3** Si hay empuje, mueve la Caja y le dice despuesDeEmpujar(). La estrategia de la",
        "     caja le avisa al mediador: cajaRota(caja) o llaveEmpujada(caja), y el motor",
        "     quita la caja o abre los muros. La Caja nunca toca el EstadoNivel.",
        "**4** Por último mueve al Jugador y devuelve true.",
        "JuegoSokoban crea un motor nuevo por nivel (y al deshacer o viajar en el tiempo)",
        "y lo guarda como MediadorMovimiento (depende de la interfaz).",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(800, 700, 790, [
        "public boolean mover(Direccion direccion) {        // Jugador",
        "    return mediador.intentarMover(direccion);",
        "}",
        "caja.quitarResistencia();                         // CajaFragilStrategy",
        "if (caja.getResistencia() <= 0) mediador.cajaRota(caja);",
        "public void cajaRota(Caja caja) { estado.quitarCaja(caja); }   // MotorMovimiento",
    ], titulo="El código clave", mono=True)
    d.nota(800, 870, 790, [
        "Mediator completo (después de la auditoría): los dos colegas hablan SOLO con el mediador.",
        "Ni el Jugador ni la Caja ni las estrategias conocen a EstadoNivel: se eliminó la dependencia circular.",
    ], titulo="Para la defensa")
    return d


# ════════════════════════════════════════════════════════════════════════════
def decorator():
    d = Diagrama(1560, 1120, "Patrón Decorator (estructural): el sonido",
                 "JuegoConSonido «envuelve» a otro Juego: tiene la misma interfaz, le pasa cada pedido y agrega algo (el sonido) "
                 "antes o después. JuegoDecorado es la base de cualquier decorador.")
    poner(d, "PantallaJuego", 50, 260, solo=["- juego:", "- mover("], rol="Cliente")
    poner(d, "Juego", 480, 230, rol="Componente (Component)")
    poner(d, "JuegoSokoban", 1060, 90, solo=[], ops=["+ mover(direccion: Direccion): void", "+ deshacer(): void",
                                                    "+ getEstado(): EstadoJuego", "+ …  (los 9 de Juego)"],
          rol="Componente concreto (el dominio)")
    poner(d, "JuegoDecorado", 1060, 330, rol="Decorador base (abstracta): delega todo")
    poner(d, "JuegoConSonido", 1060, 640, solo=["JuegoConSonido(", "+ iniciarNivel", "+ mover(", "+ deshacer", "+ viajar",
                                               "+ reiniciar", "queSonidoCorresponde", "- sonar("],
          rol="Decorador concreto: solo redefine lo que suena")
    C = d.cajas
    F = d.flecha
    ju, js, jd, jc, pj = C["Juego"], C["JuegoSokoban"], C["JuegoDecorado"], C["JuegoConSonido"], C["PantallaJuego"]
    F("PantallaJuego", "Juego", "asociacion", "right", "left", fo=0.5, fd=(260 + pj.h / 2 - 230) / ju.h, etiqueta="juego", mult="1")
    yj = 230 + 0.4 * ju.h
    F("JuegoSokoban", "Juego", "implementa", "left", "right", fo=0.5, fd=0.4, via=[(980, 90 + js.h / 2), (980, yj)], num=1,
      etiqueta="implementan", pos=(980, 200))
    F("JuegoDecorado", "Juego", "implementa", "left", "right", fo=0.1, fd=0.4, via=[(980, 330 + 0.1 * jd.h), (980, yj)])
    F("JuegoDecorado", "Juego", "asociacion", "left", "bottom", fo=0.8, fd=0.6,
      via=[(480 + 0.6 * ju.w, 330 + 0.8 * jd.h)], etiqueta="# juego: el que envuelve", mult="1", num=2,
      pos=(860, 330 + 0.8 * jd.h), mult_pos=(480 + 0.6 * ju.w + 14, 230 + ju.h + 22))
    d.texto(860, 330 + 0.8 * jd.h + 26, "(un Juego cualquiera: hoy, JuegoSokoban)", 10.5, "#8A7F76", anchor="middle", italic=True)
    F("JuegoConSonido", "JuegoDecorado", "hereda", "top", "bottom", fo=0.5, fd=(1060 + jc.w / 2 - 1060) / jd.w,
      etiqueta="extiende", num=3, pos=(1060 + jc.w / 2, 330 + jd.h + 30))
    d.nota(50, 880, 620, [
        "**1** El dominio y el decorador base cumplen el mismo contrato Juego.",
        "**2** JuegoDecorado guarda adentro otro Juego y le pasa cada pedido (los 9).",
        "**3** JuegoConSonido extiende JuegoDecorado y solo redefine lo que suena:",
        "     compara el EstadoJuego antes y después y elige el efecto.",
        "La vista y el dominio no se enteran: en Main",
        "     new JuegoConSonido(new JuegoSokoban(new CargadorNivel(carpeta)))",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(720, 880, 790, [
        "public void mover(Direccion direccion) {          // JuegoConSonido",
        "    EstadoJuego antes = juego.getEstado();",
        "    juego.mover(direccion);        // 2. delega en el juego envuelto (atributo protegido)",
        "    EstadoJuego despues = juego.getEstado();",
        "    if (antes.equals(despues)) { sonar(Sonido.CHOQUE); return; }",
        "    Sonido sonido = queSonidoCorresponde(antes, despues);",
        "    sonar(sonido);   // y si se rompió una frágil y despues.sinSolucion(): DERROTA",
        "}",
    ], titulo="El código clave (sonido/JuegoConSonido.java)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def state():
    d = Diagrama(1640, 830, "Patrón State (comportamiento): sonido activado o silenciado",
                 "El mismo pedido (reproducir) hace cosas distintas según el estado. La tecla M cambia de estado, y cada estado sabe a cuál pasa.")
    poner(d, "JuegoConSonido", 50, 160, solo=[], ops=["_- sonar(sonido: Sonido): void"], rol="Cliente (efectos)")
    poner(d, "SonidosDeInterfaz", 50, 360, solo=[], ops=["_- alApretarTecla(evento: KeyEvent): boolean"],
          rol="Cliente (tecla M)")
    poner(d, "Sonidos", 520, 150, rol="Contexto (Context) · también Singleton y Facade")
    poner(d, "EstadoSonido", 1180, 160, rol="Estado (State)")
    ops = ["+ reproducir(clip: Clip): void", "+ alternar(contexto: Sonidos): void"]
    poner(d, "SonidoActivado", 1000, 420, ops=ops, rol="Estado concreto (inicial)")
    poner(d, "SonidoSilenciado", 1380, 420, ops=ops, rol="Estado concreto")
    C = d.cajas
    F = d.flecha

    def fy(id, y):
        return (y - C[id].y) / C[id].h
    so, es = C["Sonidos"], C["EstadoSonido"]
    F("JuegoConSonido", "Sonidos", "dependencia", "right", "left", fo=0.5, fd=fy("Sonidos", 160 + C["JuegoConSonido"].h / 2),
      etiqueta="reproducir(sonido)")
    sdi = C["SonidosDeInterfaz"]
    F("SonidosDeInterfaz", "Sonidos", "dependencia", "right", "left", fo=0.5, fd=fy("Sonidos", 360 + sdi.h / 2),
      etiqueta="alternarSonido()  (M)")
    ye = 160 + es.h / 2
    F("Sonidos", "EstadoSonido", "asociacion", "right", "left", fo=fy("Sonidos", ye), fd=0.5, etiqueta="estado", mult="1", num=1)
    cx = 1180 + es.w / 2
    for s in ("SonidoActivado", "SonidoSilenciado"):
        k = C[s]
        F(s, "EstadoSonido", "implementa", "top", "bottom", fd=0.5, via=[(k.x + k.w / 2, 330), (cx, 330)])
    d.texto(cx + 10, 300, "implementan", 11, "#7B3FA0")
    sa, ss = C["SonidoActivado"], C["SonidoSilenciado"]
    F("SonidoActivado", "SonidoSilenciado", "dependencia", "right", "left", fo=0.65, fd=0.65, etiqueta="M", num=2)
    F("SonidoSilenciado", "SonidoActivado", "dependencia", "bottom", "bottom", fo=0.5, fd=0.5,
      via=[(1380 + ss.w / 2, 420 + sa.h + 40), (1000 + sa.w / 2, 420 + sa.h + 40)], etiqueta="M", pos=(1300, 420 + sa.h + 40))
    F("SonidoActivado", "Sonidos", "dependencia", "left", "bottom", fo=0.5, fd=0.7, via=[(520 + 0.7 * so.w, 420 + sa.h / 2)],
      etiqueta="contexto.establecerEstado(...)", num=3, pos=(900, 420 + sa.h / 2))
    d.nota(50, 660, 640, [
        "**1** Sonidos (el contexto) guarda el estado actual en un atributo.",
        "**2** Al apretar M, Sonidos.alternarSonido() le pasa el pedido al estado:",
        "     Activado corta lo que suena y pasa a Silenciado; Silenciado vuelve a Activado.",
        "**3** El estado hace la transición llamando a contexto.establecerEstado(...).",
        "Sonidos no tiene ningún if «si está silenciado…»: lo decide el estado.",
        "EstadoSonido y sus estados son de paquete (sin public): solo los ve sokoban.sonido.",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(740, 660, 850, [
        "public void reproducir(Sonido sonido) {             // Sonidos (contexto)",
        "    Clip clip = clips.get(sonido);",
        "    if (clip != null) estado.reproducir(clip);    // el estado decide",
        "}",
        "// SonidoActivado.reproducir: stop, volver al inicio y start",
        "// SonidoSilenciado.reproducir: no hace nada",
    ], titulo="El código clave (sonido/Sonidos.java)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def memento():
    d = Diagrama(1640, 1090, "Deshacer y DeLorean: el patrón Memento",
                 "Antes de cada movimiento y en cada «punto en el tiempo» se guarda un recuerdo del nivel. Deshacer y viajar "
                 "en el tiempo es volver a un recuerdo.")
    poner(d, "JuegoSokoban", 50, 140, solo=["MAX_HISTORIAL", "PASOS_POR_UNDO", "MAX_UNDOS", "- historial", "- maquinaDelTiempo",
                                           "- estado:", "- movimientos", "- empujes", "- plutonio", "- viajes",
                                           "crearRecuerdo", "restaurar", "olvidarPuntos"],
          rol="Originador (Originator)")
    poner(d, "RecuerdoNivel", 600, 160, rol="Recuerdo (Memento)")
    poner(d, "MaquinaDelTiempo", 600, 500, rol="Cuidador del DeLorean (Caretaker)")
    poner(d, "EstadoNivel", 1160, 140, solo=["- terreno", "- jugador", "- cajas", "copiar(): E", "recogerPlutonio",
                                            "conservarPlutonioRecogido", "cajasEnDestino"], rol="Lo que se copia")
    C = d.cajas
    F = d.flecha
    js, rn, mq, en = C["JuegoSokoban"], C["RecuerdoNivel"], C["MaquinaDelTiempo"], C["EstadoNivel"]

    def fy(id, y):
        return (y - C[id].y) / C[id].h

    def fx(id, x):
        return (x - C[id].x) / C[id].w
    yr = 200
    F("JuegoSokoban", "RecuerdoNivel", "composicion", "right", "left", fo=fy("JuegoSokoban", yr), fd=fy("RecuerdoNivel", yr),
      etiqueta="historial (deshacer)", mult="0..15", num=1, mult_pos=(575, yr - 8))
    F("JuegoSokoban", "MaquinaDelTiempo", "composicion", "bottom", "left", fo=fx("JuegoSokoban", 150), fd=0.4,
      via=[(150, 500 + 0.4 * mq.h)], etiqueta="maquinaDelTiempo", mult="1", num=2, pos=(380, 500 + 0.4 * mq.h))
    F("MaquinaDelTiempo", "RecuerdoNivel", "agregacion", "top", "bottom", fo=fx("MaquinaDelTiempo", 700),
      fd=fx("RecuerdoNivel", 700), etiqueta="puntos", mult="0..10", num=3, pos=(700, 440), mult_pos=(728, 160 + rn.h + 16))
    F("RecuerdoNivel", "EstadoNivel", "asociacion", "right", "left", fo=fy("RecuerdoNivel", yr), fd=fy("EstadoNivel", yr),
      etiqueta="nivel: una copia", mult="1")
    ye = 460
    F("JuegoSokoban", "EstadoNivel", "asociacion", "bottom", "bottom", fo=fx("JuegoSokoban", 280), fd=0.5,
      via=[(280, ye), (en.x + en.w / 2, ye)], etiqueta="estado: el nivel actual", mult="0..1", pos=(1000, ye))
    auto_saltos(d)
    # dibujo de la pila
    x0, y0, w, h, g = 60, 720, 64, 34, 8
    d.texto(x0, y0 - 16, "**La pila historial** (máximo 15 recuerdos; el más nuevo a la derecha)", 12.5)
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
    d.nota(50, 850, 760, [
        "**1** mover(): antes de mover hace crearRecuerdo() (copia del nivel y de los contadores).",
        "     Si el movimiento se hizo, lo apila; si pasa de 15, borra el más viejo.",
        "**deshacer():** saca hasta 5, restaura el último que sacó; máximo 3 seguidos.",
        "**2** Puntos en el tiempo: al iniciar el nivel y cada vez que una caja llega a destino,",
        "     guarda un recuerdo en la MaquinaDelTiempo (máximo 10).",
        "**DeLorean (tecla T):** cuesta 1 plutonio, vuelve al último punto y borra el historial.",
        "**3** La máquina guarda los recuerdos pero no puede leerlos (está en otro paquete).",
    ], titulo="Las reglas: 15 / 5 / 3 y el DeLorean")
    d.nota(860, 850, 740, [
        "**Originador:** JuegoSokoban crea el recuerdo (crearRecuerdo) y lo restaura (restaurar).",
        "**Memento:** RecuerdoNivel. Su constructor y sus lectores son de paquete (~):",
        "     solo sokoban.modelo puede crearlo y abrirlo. nivel() devuelve una copia.",
        "**Cuidadores:** el historial del deshacer y MaquinaDelTiempo (sokoban.modelo.tiempo),",
        "     que guardan los recuerdos sin poder mirarlos adentro.",
        "Deshacer descarta los puntos «del futuro» (olvidarPuntosDelFuturo).",
    ], titulo="Por qué es un Memento (Martín)")
    return d


# ════════════════════════════════════════════════════════════════════════════
def command():
    d = Diagrama(1640, 1010, "Patrón Command (comportamiento): la repetición de la partida",
                 "Cada acción del jugador es un objeto. La grabadora los ejecuta y los anota; al terminar el nivel se pueden "
                 "volver a ejecutar uno por uno.")
    poner(d, "PantallaJuego", 50, 140, solo=["- grabadora", "- repeticion", "- mover(", "- deshacer(", "- viajarEnElTiempo(",
                                            "- verRepeticion"], rol="Cliente: crea los comandos")
    poner(d, "GrabadoraDePartida", 560, 140, rol="Invocador (Invoker)")
    poner(d, "Repeticion", 560, 300, rol="Vuelve a ejecutar la partida")
    poner(d, "Comando", 1100, 160, rol="Comando (Command)")
    poner(d, "ComandoMover", 600, 600, rol="Comando concreto")
    poner(d, "ComandoDeshacer", 960, 600, rol="Comando concreto")
    poner(d, "ComandoViajarEnElTiempo", 1220, 600, rol="Comando concreto")
    poner(d, "Juego", 50, 600, solo=["mover(", "deshacer(", "viajarEnElTiempo("], rol="Receptor (Receiver)")
    C = d.cajas
    F = d.flecha

    def fy(id, y):
        return (y - C[id].y) / C[id].h

    def fx(id, x):
        return (x - C[id].x) / C[id].w
    co, ju = C["Comando"], C["Juego"]
    F("PantallaJuego", "GrabadoraDePartida", "composicion", "right", "left", fo=fy("PantallaJuego", 190),
      fd=fy("GrabadoraDePartida", 190), etiqueta="grabadora", mult="1", num=1)
    F("PantallaJuego", "Repeticion", "asociacion", "bottom", "left", fo=fx("PantallaJuego", 200), fd=fy("Repeticion", 400),
      via=[(200, 400)], etiqueta="repeticion", mult="0..1", num=4, pos=(380, 400))
    F("GrabadoraDePartida", "Comando", "agregacion", "right", "left", fo=fy("GrabadoraDePartida", 200), fd=fy("Comando", 200),
      etiqueta="grabados", mult="0..*", num=2)
    F("Repeticion", "Comando", "asociacion", "right", "bottom", fo=fy("Repeticion", 330), fd=fx("Comando", 1130),
      via=[(1130, 330)], etiqueta="pendientes", mult="0..*", pos=(980, 330))
    cx = co.x + co.w / 2
    for s in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
        k = C[s]
        F(s, "Comando", "implementa", "top", "bottom", fo=0.5, fd=0.5, via=[(k.x + k.w / 2, 560), (cx, 560)])
    d.texto(cx + 10, 554, "implementan", 11, "#7B3FA0")
    for s in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
        k = C[s]
        primero = s == "ComandoViajarEnElTiempo"  # el último se dibuja encima: lleva el rótulo
        F(s, "Juego", "asociacion", "bottom", "bottom", fo=0.3, fd=0.5, via=[(k.x + 0.3 * k.w, 750), (50 + ju.w / 2, 750)],
          etiqueta="juego" if primero else None, mult="1" if primero else None, num=3 if primero else None, pos=(450, 750))
    auto_saltos(d)
    d.nota(50, 800, 760, [
        "**1** PantallaJuego (cliente) traduce cada tecla o botón en un comando:",
        "     new ComandoMover(juego, direccion), new ComandoDeshacer(juego)...",
        "**2** La GrabadoraDePartida (invocador) lo ejecuta y lo anota en grabados.",
        "**3** Cada comando sabe a quién pedirle el trabajo: al Juego (receptor).",
        "**4** «Ver repetición» reinicia el nivel y Repeticion vuelve a ejecutar los comandos",
        "     grabados, uno cada 160 ms. Termina exactamente en el mismo estado.",
        "Reiniciar no se graba: borra la grabación.",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(860, 800, 740, [
        "private void mover(Direccion direccion) {          // PantallaJuego",
        "    tablero.mirarHacia(direccion);",
        "    grabadora.ejecutar(new ComandoMover(juego, direccion));",
        "    ...  // si se guardó un punto en el tiempo, avisa abajo",
        "}",
        "public void ejecutar(Comando c) { c.ejecutar(); grabados.add(c); }  // Grabadora",
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
