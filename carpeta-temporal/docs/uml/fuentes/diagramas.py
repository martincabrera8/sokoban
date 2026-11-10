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
            ("#D5E8D4", "#82B366", "Martín · arte (assets/)"),
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
def completo():
    d = Diagrama(3370, 2050, "Sokoban · Diagrama de clases completo",
                 "Estado al 09/11/2026 · todas las clases, atributos, métodos y relaciones · "
                 "violeta = implementa / es un · negro = tiene · gris punteado = usa / crea")
    # paquetes
    d.paquete(30, 200, 1120, 1165, "sokoban.vista · VISTA (lo que se ve)")
    d.paquete(1190, 200, 580, 900, "sokoban.modelo · CONTRATO vista ↔ dominio")
    d.paquete(1820, 200, 1480, 640, "sokoban.sonido · SONIDO (Mora)", color="#FBF6FC", borde="#A0559F")
    d.paquete(1820, 890, 1480, 1100,
              "sokoban.modelo (+ .entidades, .estrategias, .movimiento) · DOMINIO (Pedro y Lucía)",
              color="#FEF7F1", borde="#C8683A")
    d.paquete(640, 1400, 360, 230, "assets/ · ARTE (Martín)", color="#F3FAF1", borde="#82B366")
    # arranque
    poner(d, "Main", 700, 88)
    d.texto(700, 80, "sokoban · arranque", 11, "#8A7F76", italic=True)
    # vista
    poner(d, "VentanaPrincipal", 330, 240)
    poner(d, "MenuPrincipal", 60, 460)
    poner(d, "PantallaJuego", 620, 450)
    poner(d, "Cartel", 60, 640)
    poner(d, "PanelTablero", 440, 800)
    poner(d, "PanelHUD", 800, 800)
    poner(d, "Epoca", 380, 1080)
    poner(d, "Imagenes", 620, 1080)
    poner(d, "Assets", 700, 1440)
    # contrato
    poner(d, "Juego", 1230, 270)
    poner(d, "ObservadorJuego", 1230, 560)
    poner(d, "EstadoJuego", 1530, 480)
    poner(d, "Direccion", 1205, 880)
    # sonido
    poner(d, "JuegoConSonido", 1850, 240)
    poner(d, "Sonidos", 2250, 240)
    poner(d, "EstadoSonido", 2755, 250)
    poner(d, "SonidoActivado", 2700, 410)
    poner(d, "SonidoSilenciado", 2880, 410)
    poner(d, "Sonido", 2250, 560)
    poner(d, "SonidosDeInterfaz", 2700, 560)
    poner(d, "AssetsSonidos", 2700, 722)
    # dominio
    poner(d, "JuegoSokoban", 1850, 950)
    poner(d, "Foto", 1855, 1330)
    poner(d, "CargadorNivel", 2200, 990)
    poner(d, "Niveles", 2195, 1100)
    poner(d, "EstadoNivel", 2560, 1000)
    poner(d, "MotorMovimiento", 3005, 1000)
    poner(d, "MediadorMovimiento", 2989, 1440)
    poner(d, "Jugador", 2590, 1440)
    poner(d, "Caja", 2180, 1440)
    poner(d, "Posicion", 2590, 1660)
    poner(d, "ComportamientoCaja", 2160, 1730)
    poner(d, "CajaNormalStrategy", 2060, 1880)
    poner(d, "CajaFragilStrategy", 2262, 1880)
    poner(d, "CajaLlaveStrategy", 2453, 1880)
    for x, w, txt in ((2060, 166, "no agrega nada · símbolo $"), (2262, 155, "resta resistencia;"),
                      (2453, 153, "sobre un cerrojo"), ):
        d.texto(x + w / 2, 1943, txt, 10.5, "#8A7F76", anchor="middle", italic=True)
    d.texto(2262 + 155 / 2, 1957, "en 0 se rompe · F / f", 10.5, "#8A7F76", anchor="middle", italic=True)
    d.texto(2453 + 153 / 2, 1957, "abre los muros · L", 10.5, "#8A7F76", anchor="middle", italic=True)

    C = d.cajas
    F = d.flecha

    def fy(id, y):  # fracción para que la flecha toque el lado izquierdo/derecho a la altura y
        return (y - C[id].y) / C[id].h

    def fx(id, x):  # fracción para tocar arriba/abajo en la coordenada x
        return (x - C[id].x) / C[id].w

    # Main
    F("Main", "VentanaPrincipal", "dependencia", "left", "top", via=[(434.5, 128)], etiqueta="crea", pos=(560, 128))
    F("Main", "JuegoConSonido", "dependencia", "right", "top", fo=0.7, fd=fx("JuegoConSonido", 2110),
      via=[(2110, 144)], etiqueta="crea y le pasa el dominio adentro", pos=(1470, 144))
    F("Main", "SonidosDeInterfaz", "dependencia", "right", "right", fo=0.5, fd=fy("SonidosDeInterfaz", 617),
      via=[(3320, 128), (3320, 617)], etiqueta="instalar()", pos=(2700, 128))
    F("Main", "JuegoSokoban", "dependencia", "right", "left", fo=0.3, fd=fy("JuegoSokoban", 985),
      via=[(3345, 112), (3345, 865), (1795, 865), (1795, 985)], etiqueta="crea el dominio", pos=(2600, 865))
    # vista
    F("VentanaPrincipal", "MenuPrincipal", "composicion", "left", "top", fo=0.7, etiqueta="contiene", mult="1")
    F("VentanaPrincipal", "PantallaJuego", "composicion", "right", "top", fo=0.7, etiqueta="contiene", mult="1")
    F("MenuPrincipal", "Cartel", "composicion", "bottom", "top", fo=0.5, fd=(207 - 60) / 323, etiqueta="contiene", mult="1")
    F("PantallaJuego", "Cartel", "dependencia", "left", "right", fo=0.85, fd=(688 - 640) / 178, etiqueta="crea (pausa y resultado)")
    F("PantallaJuego", "PanelTablero", "composicion", "bottom", "top", fo=0.15, fd=(670.7 - 440) / 283, etiqueta="contiene", mult="1",
      pos=(670.7, 765))
    F("PantallaJuego", "PanelHUD", "composicion", "bottom", "top", fo=0.75, fd=(873.5 - 800) / 287, etiqueta="contiene", mult="1",
      pos=(873.5, 765))
    F("PanelTablero", "Epoca", "asociacion", "bottom", "top", fo=0.25, fd=(510.75 - 380) / 194, etiqueta="epoca", mult="1",
      pos=(510.75, 1052))
    F("PanelTablero", "Imagenes", "dependencia", "bottom", "top", fo=0.75, fd=(652.25 - 620) / 248, etiqueta="usa", pos=(645, 1052))
    F("PanelHUD", "Imagenes", "dependencia", "bottom", "top", fo=0.05, fd=(814.35 - 620) / 248, etiqueta="usa", pos=(790, 1010))
    F("MenuPrincipal", "Imagenes", "dependencia", "left", "bottom", fo=0.6, fd=0.5,
      via=[(42, 526), (42, 1340), (744, 1340)], etiqueta="usa", pos=(400, 1340))
    F("Imagenes", "Imagenes", "asociacion", "right", "right", fo=0.2, fd=0.36, via=[(905, 1122.6), (905, 1156.7)],
      etiqueta="instancia", pos=(945, 1140), mult="0..1", mult_pos=(885, 1175))
    F("Imagenes", "Assets", "dependencia", "bottom", "top", fo=0.8, fd=(818.4 - 700) / 189, etiqueta="lee del disco o del .jar",
      pos=(818, 1365))
    # vista → contrato
    F("PantallaJuego", "Juego", "asociacion", "right", "left", fo=0.2, fd=(380 - 270) / 169, via=[(1094, 506), (1094, 380)],
      etiqueta="juego", mult="1", pos=(1026, 506))
    F("PanelHUD", "Juego", "dependencia", "right", "left", fo=0.1, fd=(420 - 270) / 169, via=[(1120, 817.8), (1120, 420)],
      etiqueta="deshacer() / reiniciar()", pos=(1120, 470))
    F("PanelHUD", "ObservadorJuego", "implementa", "right", "left", fo=0.5, via=[(1170, 889), (1170, 593.5)],
      etiqueta="implementa", pos=(1170, 700))
    F("PanelTablero", "ObservadorJuego", "implementa", "bottom", "left", fo=0.95,
      via=[(708.85, 1040), (1170, 1040), (1170, 593.5)], saltos=[(814.35, 1040)])
    F("PanelTablero", "Direccion", "asociacion", "bottom", "bottom", fo=0.9, fd=(1269 - 1205) / 128,
      via=[(694.7, 1061), (1269, 1061)], saltos=[(814.35, 1061)], etiqueta="orientacion", pos=(1000, 1061), mult="1",
      mult_pos=(1282, 1056))
    # contrato
    F("Juego", "ObservadorJuego", "dependencia", "bottom", "top", fo=0.3, fd=(1336.5 - 1230) / 245, etiqueta="avisa a", pos=(1336.5, 500))
    F("Juego", "EstadoJuego", "dependencia", "bottom", "top", fo=0.9, fd=(1549.5 - 1530) / 148, etiqueta="devuelve", pos=(1600, 459))
    F("ObservadorJuego", "EstadoJuego", "dependencia", "right", "left", fo=0.5, fd=(593.5 - 480) / 169, etiqueta="recibe", pos=(1503, 580))
    # sonido → contrato (Decorator: implementa Juego y además guarda un Juego)
    yj = 270 + 0.4 * 169
    F("JuegoConSonido", "Juego", "asociacion", "left", "right", fo=fy("JuegoConSonido", 292), fd=fy("Juego", 292),
      etiqueta="juego (el que envuelve)", pos=(1760, 292), mult="1", mult_pos=(1600, 286))
    F("JuegoConSonido", "Juego", "implementa", "left", "right", fo=fy("JuegoConSonido", yj), fd=0.4,
      etiqueta="implementa", pos=(1780, yj))
    F("JuegoConSonido", "EstadoJuego", "dependencia", "left", "right", fo=fy("JuegoConSonido", 540), fd=fy("EstadoJuego", 540),
      saltos=[(1720, 540)], etiqueta="compara", pos=(1790, 540))
    # sonido
    F("JuegoConSonido", "Sonidos", "dependencia", "right", "left", fo=fy("JuegoConSonido", 300), fd=fy("Sonidos", 300),
      etiqueta="usa")
    F("JuegoConSonido", "Sonido", "dependencia", "right", "left", fo=fy("JuegoConSonido", 575), fd=fy("Sonido", 575),
      etiqueta="elige el efecto")
    F("Sonidos", "EstadoSonido", "asociacion", "right", "left", fo=fy("Sonidos", 292), fd=fy("EstadoSonido", 292),
      etiqueta="estado", mult="1", pos=(2660, 292))
    cx = 2755 + C["EstadoSonido"].w / 2
    F("SonidoActivado", "EstadoSonido", "implementa", "top", "bottom", fd=0.5, via=[(2768, 378), (cx, 378)])
    F("SonidoSilenciado", "EstadoSonido", "implementa", "top", "bottom", fd=0.5, via=[(2953.5, 378), (cx, 378)])
    d.texto(cx + 8, 372, "implementan", 10.5, "#7B3FA0")
    F("SonidoActivado", "Sonidos", "dependencia", "left", "right", fd=fy("Sonidos", 433))
    F("SonidoSilenciado", "Sonidos", "dependencia", "bottom", "right", fd=fy("Sonidos", 475),
      via=[(2953.5, 475)], etiqueta="le cambian el estado", pos=(2775, 475))
    F("Sonidos", "Sonido", "dependencia", "bottom", "top", fo=fx("Sonidos", 2330), fd=fx("Sonido", 2330),
      etiqueta="un Clip por cada uno", pos=(2330, 523))
    F("SonidosDeInterfaz", "Sonidos", "dependencia", "left", "bottom", fo=fy("SonidosDeInterfaz", 590), fd=fx("Sonidos", 2545),
      via=[(2545, 590)], etiqueta="usa", pos=(2620, 590))
    F("SonidosDeInterfaz", "Sonido", "dependencia", "left", "right", fo=fy("SonidosDeInterfaz", 650), fd=fy("Sonido", 650),
      saltos=[(2500, 650)], etiqueta="ARRANQUE, CLIC", pos=(2610, 650))
    F("Sonidos", "AssetsSonidos", "dependencia", "bottom", "left", fo=fx("Sonidos", 2500), fd=fy("AssetsSonidos", 772),
      via=[(2500, 772)], etiqueta="lee cada .wav una vez", pos=(2600, 772))
    # dominio → contrato
    F("JuegoSokoban", "Juego", "implementa", "left", "right", fo=fy("JuegoSokoban", 1045), fd=0.4,
      via=[(1720, 1045), (1720, yj)], etiqueta="implementa", pos=(1720, 800))
    F("JuegoSokoban", "ObservadorJuego", "agregacion", "left", "bottom", fo=fy("JuegoSokoban", 1095), fd=fx("ObservadorJuego", 1400),
      via=[(1400, 1095)], etiqueta="observadores", pos=(1620, 1095), mult="0..*", mult_pos=(1424, 650))
    # dominio
    F("JuegoSokoban", "Foto", "composicion", "bottom", "top", fo=fx("JuegoSokoban", 1975), fd=fx("Foto", 1975),
      etiqueta="historial", pos=(2025, 1300), mult="0..15", mult_pos=(1945, 1318))
    F("JuegoSokoban", "CargadorNivel", "composicion", "right", "left", fo=fy("JuegoSokoban", 1021.5), fd=0.5,
      etiqueta="cargador", mult="1")
    F("JuegoSokoban", "EstadoNivel", "asociacion", "right", "left", fo=fy("JuegoSokoban", 1245), fd=fy("EstadoNivel", 1245),
      etiqueta="estado (el nivel actual)", mult="1")
    F("JuegoSokoban", "MotorMovimiento", "asociacion", "top", "top", fo=fx("JuegoSokoban", 2051), fd=0.5,
      via=[(2051, 925), (3131, 925)], etiqueta="motor", pos=(2900, 925), mult="1")
    F("Foto", "EstadoNivel", "asociacion", "right", "left", fo=fy("Foto", 1340), fd=fy("EstadoNivel", 1340),
      etiqueta="estado (copia del nivel)", mult="1")
    F("CargadorNivel", "EstadoNivel", "dependencia", "right", "left", fo=0.5, fd=fy("EstadoNivel", 1021.5), etiqueta="crea")
    F("CargadorNivel", "Niveles", "dependencia", "bottom", "top", fo=fx("CargadorNivel", 2307), fd=fx("Niveles", 2307),
      etiqueta="lee nivelN.txt", pos=(2365, 1076))
    F("MotorMovimiento", "EstadoNivel", "asociacion", "left", "right", fo=fy("MotorMovimiento", 1040), fd=fy("EstadoNivel", 1040),
      etiqueta="estado", mult="1")
    F("MotorMovimiento", "MediadorMovimiento", "implementa", "bottom", "top", fo=fx("MotorMovimiento", 3131),
      fd=fx("MediadorMovimiento", 3131), etiqueta="implementa", pos=(3131, 1270))
    F("EstadoNivel", "Jugador", "composicion", "bottom", "top", fo=fx("EstadoNivel", 2740), fd=fx("Jugador", 2740),
      etiqueta="jugador", pos=(2740, 1396), mult="1")
    F("EstadoNivel", "Caja", "composicion", "bottom", "top", fo=fx("EstadoNivel", 2600), fd=fx("Caja", 2340),
      via=[(2600, 1396), (2340, 1396)], etiqueta="cajas", pos=(2450, 1396), mult="0..*", mult_pos=(2362, 1430))
    F("Jugador", "MediadorMovimiento", "asociacion", "right", "left", fo=fy("Jugador", 1482), fd=fy("MediadorMovimiento", 1482),
      etiqueta="mediador", mult="1")
    F("Jugador", "Posicion", "asociacion", "bottom", "top", fo=fx("Jugador", 2700), fd=fx("Posicion", 2700),
      etiqueta="posicion", pos=(2700, 1624), mult="1")
    F("Caja", "Posicion", "asociacion", "right", "left", fo=fy("Caja", 1700), fd=fy("Posicion", 1700),
      etiqueta="posicion", mult="1")
    cc = 2160 + C["ComportamientoCaja"].w / 2
    F("Caja", "ComportamientoCaja", "asociacion", "bottom", "top", fo=fx("Caja", cc), fd=0.5,
      etiqueta="estrategia", pos=(cc, 1693), mult="1")
    for s in ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"):
        k = C[s]
        F(s, "ComportamientoCaja", "implementa", "top", "bottom", fd=0.5, via=[(k.x + k.w / 2, 1848), (cc, 1848)])
    d.texto(cc + 8, 1842, "implementan", 10.5, "#7B3FA0")

    leyenda_autoria(d, 1200, 1170)
    leyenda_flechas(d, 1200, 1340)
    d.nota(60, 1400, 540, [
        "**Herencia de Swing:** debajo del nombre dice «extiende JPanel / JFrame».",
        "No se dibuja la flecha a JPanel para no cruzar todo el diagrama.",
        "**Direccion** también la usan PantallaJuego (TECLAS), Juego.mover,",
        "Jugador.mover, Posicion.siguiente y MediadorMovimiento.",
        "**MotorMovimiento** mueve al Jugador y a la Caja que encuentra en el",
        "EstadoNivel (no las guarda: por eso no tiene flecha propia).",
        "**Subrayado** = static · **+** público · **-** privado · **#** protegido",
        "**~** de paquete. Se omiten constantes de estilo, getters y los",
        "métodos que solo implementan una interfaz (actualizar, mover...).",
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
         "PanelHUD hud = new PanelHUD(juego, this::pausar);  add(hud);"),
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
           texto=["Main: crea las piezas y las conecta", "new JuegoConSonido(new JuegoSokoban())"])
    d.caja("Swing", "javax.swing (Java)", 60, 90, 230, estereo="biblioteca", autor="swing",
           texto=["JFrame, JPanel, JDialog, JButton…"])
    d.caja("Vista", "VISTA · sokoban.vista", 60, 290, 330, estereo="paquete · Luca", autor="luca",
           texto=["VentanaPrincipal (ventana)", "MenuPrincipal (menú)", "PantallaJuego (partida y teclado)",
                  "PanelHUD (indicadores y botones)", "PanelTablero (dibuja el tablero)", "Cartel (pausa / resultado)",
                  "Imagenes (caché de imágenes)  ← Singleton", "Epoca (estilo por época) · integración"])
    d.caja("Contrato", "CONTRATO · sokoban.modelo", 600, 330, 330, estereo="paquete · Luca", autor="luca",
           texto=["Juego  ← Facade + sujeto del Observer", "ObservadorJuego  ← Observer", "EstadoJuego  ← DTO (record)",
                  "Direccion  ← enum"])
    d.caja("Sonido", "SONIDO · sokoban.sonido", 1130, 290, 410, estereo="paquete · Mora", autor="sonido",
           texto=["JuegoConSonido  ← Decorator de Juego", "Sonidos  ← Singleton + Facade de javax.sound",
                  "EstadoSonido, SonidoActivado, SonidoSilenciado  ← State", "Sonido (14 efectos), SonidosDeInterfaz (clics, M)",
                  "assets/sonidos/: 14 archivos .wav propios"])
    d.caja("Dominio", "DOMINIO · sokoban.modelo y subpaquetes", 1130, 540, 410, estereo="paquete · Pedro y Lucía", autor="dominio",
           texto=["JuegoSokoban  ← implementa Juego (sujeto del Observer)", "   deshacer con fotos del nivel (idea de Memento)",
                  "CargadorNivel, EstadoNivel, Posicion", "entidades: Jugador, Caja",
                  "estrategias: ComportamientoCaja + 3 cajas  ← Strategy",
                  "movimiento: MediadorMovimiento, MotorMovimiento  ← Mediator", "niveles/: nivel1.txt a nivel3.txt"])
    d.caja("Arte", "ARTE · assets/", 60, 650, 330, estereo="carpeta · Martín", autor="martin",
           texto=["104 imágenes PNG (se usan 30)", "personaje, cajas, pisos, paredes, fondos, HUD"])
    C = d.cajas
    F = d.flecha
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
        "JuegoConSonido envuelve «un Juego» sin saber que adentro está JuegoSokoban. Por eso las dos partes entraron sin tocar la vista",
        "(solo se sumaron símbolos en PanelTablero) y cambiando unas pocas líneas de Main. Eso es el principio **DIP** (inversión de dependencias).",
    ], titulo="La idea de esta arquitectura")
    leyenda_autoria(d, 60, 790)
    return d


# ════════════════════════════════════════════════════════════════════════════
def observer():
    d = Diagrama(1500, 860, "Patrón Observer (comportamiento)",
                 "Cuando cambia la partida, el sujeto avisa a todos los observadores; cada uno se actualiza solo. "
                 "La etiqueta dorada es el ROL de la clase en el patrón.")
    poner(d, "Juego", 60, 120, solo=["agregarObservador", "getEstado"], rol="Sujeto (Subject)")
    poner(d, "ObservadorJuego", 760, 140, rol="Observador (Observer)")
    poner(d, "EstadoJuego", 1210, 100, rol="Lo que se avisa (estado)")
    poner(d, "JuegoSokoban", 60, 430, solo=["observadores", "notificar"], rol="Sujeto concreto")
    poner(d, "PanelHUD", 720, 520, solo=["nivel:", "movimientos:", "empujes:"], ops=["+ actualizar(estado: EstadoJuego): void"],
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
          via=[(k.x + k.w * 0.5, 420), (tx, 420)])
    d.texto(tx + 10, 330, "implementan", 11, "#7B3FA0")
    d.nota(1000, 300, 460, [
        "El sonido **no** es un observador: es un Decorator",
        "(ver el diagrama 10). JuegoConSonido.agregarObservador",
        "le pasa cada observador a JuegoSokoban, que es",
        "quien los guarda y les avisa.",
    ], titulo="¿Y el sonido?")
    d.nota(60, 690, 660, [
        "**1** JuegoSokoban cumple el contrato Juego.",
        "**2** Guarda la lista de observadores que le pasan con agregarObservador(...).",
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
    poner(d, "PanelHUD", 50, 470, solo=["+ PanelHUD("], rol="Cliente")
    poner(d, "Juego", 480, 230, rol="Fachada (Facade)")
    poner(d, "JuegoSokoban", 960, 260, solo=["- cargador", "- historial", "- estado:", "- motor:"],
          ops=["+ mover(direccion: Direccion): void", "+ deshacer(): void", "- notificar(): void"], rol="Fachada concreta")
    poner(d, "JuegoConSonido", 960, 110, solo=["- juego:"], ops=[], rol="Decorator: también es un Juego (ver 10)")
    d.paquete(1360, 110, 490, 600, "Subsistema del dominio")
    poner(d, "CargadorNivel", 1390, 150)
    poner(d, "EstadoNivel", 1390, 250, solo=["- jugador", "- cajas", "estaLibre", "copiar(): E", "tableroParaVista"])
    poner(d, "MotorMovimiento", 1390, 440, solo=["- estado"], ops=["+ intentarMover(direccion: Direccion): boolean"])
    poner(d, "Jugador", 1390, 570, solo=["mover("])
    d.texto(1605, 680, "y además: Caja, las 3 estrategias, Posicion", 10.5, "#8A7F76", anchor="middle", italic=True)
    F = d.flecha
    C = d.cajas
    ju = C["Juego"]
    pj = C["PantallaJuego"]
    F("PantallaJuego", "Juego", "asociacion", "right", "left", fo=0.5, fd=(250 + pj.h / 2 - 230) / ju.h,
      etiqueta="juego.mover(dir)", mult="1")
    hu = C["PanelHUD"]
    F("PanelHUD", "Juego", "dependencia", "right", "left", fo=0.4, fd=0.85, via=[(430, 470 + 0.4 * hu.h), (430, 230 + 0.85 * ju.h)],
      etiqueta="deshacer() / reiniciar()", pos=(430, 480))
    yj = 230 + 0.35 * ju.h
    js, jc = C["JuegoSokoban"], C["JuegoConSonido"]
    F("JuegoSokoban", "Juego", "implementa", "left", "right", fo=0.3, fd=0.35, via=[(910, 260 + 0.3 * js.h), (910, yj)])
    F("JuegoConSonido", "Juego", "implementa", "left", "right", fo=0.5, fd=0.35, via=[(910, 110 + jc.h / 2), (910, yj)])
    d.texto(900, 200, "implementan", 11, "#7B3FA0", anchor="end")

    def fy(id, y):
        return (y - C[id].y) / C[id].h
    F("JuegoSokoban", "CargadorNivel", "composicion", "right", "left", fo=fy("JuegoSokoban", 285), fd=0.5,
      via=[(1300, 285), (1300, 150 + C["CargadorNivel"].h / 2)], etiqueta="cargador", pos=(1300, 235))
    F("JuegoSokoban", "EstadoNivel", "asociacion", "right", "left", fo=fy("JuegoSokoban", 330), fd=fy("EstadoNivel", 330),
      etiqueta="estado")
    F("JuegoSokoban", "MotorMovimiento", "asociacion", "right", "left", fo=fy("JuegoSokoban", 400), fd=fy("MotorMovimiento", 470),
      via=[(1300, 400), (1300, 470)], etiqueta="motor", pos=(1300, 437))
    F("JuegoSokoban", "Jugador", "dependencia", "bottom", "left", fo=0.5, fd=0.5,
      via=[(960 + js.w / 2, 570 + C["Jugador"].h / 2)], etiqueta="estado.getJugador().mover(dir)", pos=(1200, 570 + C["Jugador"].h / 2))
    d.nota(50, 730, 1800, [
        "Para la vista, mover al jugador es UNA llamada: juego.mover(Direccion.DERECHA). Atrás, JuegoSokoban guarda una foto para deshacer, le pide al Jugador que se mueva (y él al",
        "MotorMovimiento), suma movimientos y empujes y avisa a los observadores. **La vista no se entera de nada de eso.** Hay otra fachada en el proyecto: **Sonidos**, que esconde javax.sound (diagrama 11).",
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
           texto=["VentanaPrincipal, MenuPrincipal, Cartel", "PanelHUD: muestra nivel, movimientos, empujes",
                  "PanelTablero: dibuja el tablero", "Imagenes, Epoca: imágenes y estilo"])
    d.caja("C", "CONTROLADOR", 540, 120, 340, estereo="traduce acciones", autor="luca",
           texto=["PantallaJuego: flecha → juego.mover(dir)", "PanelHUD: botón → juego.deshacer() / reiniciar()",
                  "(controlador de entrada de Swing,", " vive en la vista)"])
    d.caja("S", "SONIDO", 1050, 120, 240, estereo="decora al modelo", autor="sonido",
           texto=["JuegoConSonido: deja pasar", "cada pedido y hace sonar", "el efecto que corresponde"])
    d.caja("M", "MODELO", 1460, 120, 340, estereo="reglas del juego", autor="dominio",
           texto=["JuegoSokoban: recibe los pedidos y", "coordina (Controlador de GRASP)",
                  "EstadoNivel, Jugador, Caja, MotorMovimiento,", "niveles, deshacer, puntaje", "Se accede SOLO por la interfaz Juego"])
    F = d.flecha
    F("V", "C", "dependencia", "right", "left", fo=0.4, fd=0.4, etiqueta="tecla o botón", num=1)
    F("C", "S", "dependencia", "right", "left", fo=0.4, fd=0.4 * d.cajas["C"].h / d.cajas["S"].h,
      etiqueta="mover · deshacer…", num=2, pos=(970, 120 + 0.4 * d.cajas["C"].h))
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
    poner(d, "Caja", 470, 140, solo=["- estrategia", "- resistencia", "despuesDeEmpujar", "getSimbolo", "quitarResistencia"],
          rol="Contexto (Context)")
    poner(d, "ComportamientoCaja", 1020, 150, rol="Estrategia (Strategy)")
    ops = ["+ despuesDeEmpujar(caja: Caja, estado: EstadoNivel): void", "+ simbolo(caja: Caja): char"]
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
               ["caja.quitarResistencia();", "if (caja.getResistencia() <= 0)", "    estado.quitarCaja(caja);",
                "simbolo: 'f' si queda 1, si no 'F'"],
               ["if (estado.esCerrojo(caja.getPosicion()))", "    estado.abrirMuros();", "simbolo: 'L'"]]
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
        "public void despuesDeEmpujar(EstadoNivel estado) {    // 3. la Caja delega",
        "    estrategia.despuesDeEmpujar(this, estado);",
        "}",
        "public char getSimbolo() { return estrategia.simbolo(this); }",
        "// Una caja nueva (por ejemplo, explosiva) = una clase nueva que implemente",
        "// ComportamientoCaja y una letra más en EstadoNivel. Caja no cambia (OCP).",
    ], titulo="El código clave (entidades/Caja.java)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def mediator():
    d = Diagrama(1640, 1000, "Patrón Mediator (comportamiento): el movimiento",
                 "El Jugador no sabe nada de paredes, cajas ni hielo: le pide el movimiento a un mediador, y el mediador resuelve todo.")
    poner(d, "Jugador", 50, 150, solo=["- mediador", "- posicion", "conectar", "mover(", "setPosicion"], rol="Colega (Colleague)")
    poner(d, "MediadorMovimiento", 600, 160, rol="Mediador (Mediator)")
    poner(d, "EstadoNivel", 1180, 140, solo=["- jugador", "- cajas", "cajaEn", "estaLibre", "esHielo"],
          rol="El tablero que consulta")
    poner(d, "JuegoSokoban", 50, 500, solo=["- motor", "- estado:", "conectarMotor"], rol="Arma la conexión")
    poner(d, "MotorMovimiento", 600, 440, ops=["+ MotorMovimiento(estado: EstadoNivel)",
                                                "+ intentarMover(direccion: Direccion): boolean", "+ fueEmpuje(): boolean"],
          rol="Mediador concreto")
    poner(d, "Caja", 1180, 470, solo=["- posicion", "setPosicion", "despuesDeEmpujar"], rol="Lo que empuja (no conoce al mediador)")
    C = d.cajas
    F = d.flecha

    def fy(id, y):
        return (y - C[id].y) / C[id].h

    def fx(id, x):
        return (x - C[id].x) / C[id].w
    mm, mo, ju, js, en = C["MediadorMovimiento"], C["MotorMovimiento"], C["Jugador"], C["JuegoSokoban"], C["EstadoNivel"]
    F("Jugador", "MediadorMovimiento", "asociacion", "right", "left", fo=fy("Jugador", 215), fd=fy("MediadorMovimiento", 215),
      etiqueta="mediador", mult="1", num=1)
    F("MotorMovimiento", "MediadorMovimiento", "implementa", "top", "bottom", fo=0.5, fd=(600 + mo.w / 2 - 600) / mm.w,
      etiqueta="implementa", num=2)
    F("MotorMovimiento", "EstadoNivel", "asociacion", "right", "left", fo=fy("MotorMovimiento", 470), fd=fy("EstadoNivel", 250),
      via=[(1110, 470), (1110, 250)], etiqueta="estado", mult="1", pos=(1110, 360))
    F("MotorMovimiento", "Caja", "dependencia", "right", "left", fo=fy("MotorMovimiento", 550), fd=fy("Caja", 550),
      etiqueta="setPosicion · despuesDeEmpujar", num=3)
    F("MotorMovimiento", "Jugador", "dependencia", "left", "bottom", fo=fy("MotorMovimiento", 470), fd=fx("Jugador", 330),
      via=[(330, 470)], etiqueta="setPosicion(siguiente)", num=4, pos=(470, 470))
    F("JuegoSokoban", "MotorMovimiento", "asociacion", "right", "left", fo=fy("JuegoSokoban", 570), fd=fy("MotorMovimiento", 570),
      etiqueta="motor (lo crea)", mult="1")
    F("JuegoSokoban", "Jugador", "dependencia", "top", "bottom", fo=fx("JuegoSokoban", 230), fd=fx("Jugador", 230),
      etiqueta="conectar(motor)", pos=(230, 400))
    d.nota(50, 690, 700, [
        "**1** El Jugador guarda un MediadorMovimiento (la interfaz, no el motor).",
        "**2** MotorMovimiento lo implementa y concentra las reglas: paredes, cajas,",
        "     segunda caja, hielo (la caja sigue hasta piso normal u obstáculo).",
        "**3** Si hay empuje, mueve la Caja y le avisa (ahí entra el Strategy).",
        "**4** Por último mueve al Jugador y devuelve true.",
        "JuegoSokoban crea un motor nuevo por nivel (y después de deshacer)",
        "y lo conecta al Jugador con conectarMotor().",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(800, 690, 790, [
        "public boolean mover(Direccion direccion) {          // Jugador",
        "    if (mediador == null) throw new IllegalStateException(\"Jugador sin mediador\");",
        "    return mediador.intentarMover(direccion);",
        "}",
        "// El Jugador nunca pregunta por paredes ni cajas: eso lo sabe el mediador.",
    ], titulo="El código clave (entidades/Jugador.java)", mono=True)
    d.nota(800, 830, 790, [
        "En el Mediator del libro, VARIOS colegas se hablan a través del mediador.",
        "Acá solo el Jugador le habla: la Caja no conoce al mediador (el motor la mueve).",
        "Conviene explicarlo así o hacer que la Caja también pase por el mediador.",
    ], titulo="Para la defensa")
    return d


# ════════════════════════════════════════════════════════════════════════════
def decorator():
    d = Diagrama(1560, 850, "Patrón Decorator (estructural): el sonido",
                 "JuegoConSonido «envuelve» a otro Juego: tiene la misma interfaz, le pasa cada pedido y agrega algo (el sonido) antes o después.")
    poner(d, "PantallaJuego", 50, 260, solo=["- juego:", "- mover("], rol="Cliente")
    poner(d, "Juego", 480, 230, rol="Componente (Component)")
    poner(d, "JuegoSokoban", 1060, 110, solo=[], ops=["+ mover(direccion: Direccion): void", "+ deshacer(): void",
                                                     "+ getEstado(): EstadoJuego", "+ …  (los 7 de Juego)"],
          rol="Componente concreto (el dominio)")
    poner(d, "JuegoConSonido", 1060, 340, 360, solo=["- juego:"],
          ops=["+ JuegoConSonido(juego: Juego)", "+ mover(direccion: Direccion): void", "+ deshacer(): void",
               "+ reiniciar(): void", "+ iniciarNivel(numero: int): void", "+ getEstado(): EstadoJuego  (solo delega)",
               "_~ queSonidoCorresponde(antes: EstadoJuego,", "_      despues: EstadoJuego): Sonido",
               "_- sonar(sonido: Sonido): void"], rol="Decorador (Decorator)")
    C = d.cajas
    F = d.flecha
    ju, js, jc, pj = C["Juego"], C["JuegoSokoban"], C["JuegoConSonido"], C["PantallaJuego"]
    F("PantallaJuego", "Juego", "asociacion", "right", "left", fo=0.5, fd=(260 + pj.h / 2 - 230) / ju.h, etiqueta="juego", mult="1")
    yj = 230 + 0.4 * ju.h
    F("JuegoSokoban", "Juego", "implementa", "left", "right", fo=0.5, fd=0.4, via=[(980, 110 + js.h / 2), (980, yj)], num=1,
      etiqueta="implementan", pos=(980, 200))
    F("JuegoConSonido", "Juego", "implementa", "left", "right", fo=0.12, fd=0.4, via=[(980, 340 + 0.12 * jc.h), (980, yj)])
    F("JuegoConSonido", "Juego", "asociacion", "left", "bottom", fo=0.8, fd=0.6,
      via=[(480 + 0.6 * ju.w, 340 + 0.8 * jc.h)], etiqueta="juego: el que envuelve", mult="1", num=2,
      pos=(860, 340 + 0.8 * jc.h), mult_pos=(480 + 0.6 * ju.w + 14, 230 + ju.h + 22))
    d.texto(860, 340 + 0.8 * jc.h + 26, "(un Juego cualquiera: hoy, JuegoSokoban)", 10.5, "#8A7F76", anchor="middle", italic=True)
    d.nota(50, 610, 620, [
        "**1** El dominio y el decorador cumplen el mismo contrato Juego.",
        "**2** El decorador guarda adentro otro Juego y le pasa cada pedido.",
        "**3** Antes y después de mover compara el EstadoJuego y elige el efecto",
        "     (paso, empuje, caja en destino, frágil, cerrojo, victoria, choque…).",
        "La vista y el dominio no se enteran: solo cambió Main:",
        "     new JuegoConSonido(new JuegoSokoban())",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(720, 610, 790, [
        "public void mover(Direccion direccion) {",
        "    EstadoJuego antes = juego.getEstado();",
        "    juego.mover(direccion);                 // 2. delega en el juego real",
        "    EstadoJuego despues = juego.getEstado();",
        "    if (antes.equals(despues)) { sonar(Sonido.CHOQUE); return; }",
        "    Sonido sonido = queSonidoCorresponde(antes, despues);   // 3.",
        "    sonar(sonido);  ...  // si se rompió una frágil y no alcanza: DERROTA",
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
    d = Diagrama(1600, 840, "Deshacer con fotos del nivel (idea del patrón Memento)",
                 "Antes de cada movimiento se guarda una copia completa del nivel. Deshacer es volver a una copia anterior.")
    poner(d, "JuegoSokoban", 50, 140, solo=["MAX_HISTORIAL", "PASOS_POR_UNDO", "MAX_UNDOS", "- historial", "- estado:",
                                           "- movimientos", "- empujes", "- undosUsados", "undosConsecutivos"],
          ops=["+ mover(direccion: Direccion): void", "+ deshacer(): void"], rol="Cuidador (Caretaker)")
    poner(d, "Foto", 560, 170, rol="Recuerdo (Memento)")
    poner(d, "EstadoNivel", 1040, 140, solo=["- terreno", "- jugador", "- cajas", "copiar(): E", "copiarTerreno"],
          rol="Originador (Originator)")
    C = d.cajas
    F = d.flecha
    js, fo_, en = C["JuegoSokoban"], C["Foto"], C["EstadoNivel"]

    def fy(id, y):
        return (y - C[id].y) / C[id].h
    yf = 170 + fo_.h / 2
    F("JuegoSokoban", "Foto", "composicion", "right", "left", fo=fy("JuegoSokoban", yf), fd=0.5, etiqueta="historial",
      mult="0..15", num=1, mult_pos=(530, yf - 8))
    F("Foto", "EstadoNivel", "asociacion", "right", "left", fo=0.5, fd=fy("EstadoNivel", yf), etiqueta="una copia", mult="1", num=2)
    ya = 140 + js.h - 30
    F("JuegoSokoban", "EstadoNivel", "asociacion", "right", "bottom", fo=fy("JuegoSokoban", ya), fd=0.5,
      via=[(1040 + en.w / 2, ya)], etiqueta="estado: el nivel actual", mult="1", pos=(800, ya))
    # dibujo de la pila
    x0, y0, w, h, g = 60, 470, 64, 34, 8
    d.texto(x0, y0 - 16, "**La pila historial** (máximo 15 fotos; la más nueva a la derecha)", 12.5)
    for i in range(15):
        x = x0 + i * (w + g)
        reciente = i >= 10
        fill = "#FCDDC7" if reciente else "#FEF7F1"
        d.raw(f'<rect x="{x}" y="{y0}" width="{w}" height="{h}" rx="4" fill="{fill}" stroke="#C8683A" stroke-width="1.2"/>')
        d.texto(x + w / 2, y0 + 22, f"foto {i + 1}", 11, anchor="middle")
    xa = x0 + 10 * (w + g)
    xb = x0 + 15 * (w + g) - g
    d.raw(f'<path d="M {xa} {y0 + h + 8} L {xa} {y0 + h + 16} L {xb} {y0 + h + 16} L {xb} {y0 + h + 8}" fill="none" stroke="#6E1A2C" stroke-width="1.4"/>')
    d.texto((xa + xb) / 2, y0 + h + 34, "un deshacer saca estas 5 y vuelve a la «foto 11»", 11.5, "#6E1A2C", 600, anchor="middle")
    x1 = x0 + w
    d.raw(f'<path d="M {x0} {y0 + h + 8} L {x0} {y0 + h + 16} L {x1} {y0 + h + 16} L {x1} {y0 + h + 8}" fill="none" stroke="#8A7F76" stroke-width="1.2" stroke-dasharray="4 3"/>')
    d.texto(x0, y0 + h + 34, "cuando llega la foto 16, sale la foto 1 (la más vieja)", 11, "#8A7F76", italic=True)
    d.nota(50, 600, 700, [
        "**1** mover(): antes de mover arma new Foto(estado.copiar(), movimientos, empujes).",
        "     Si el movimiento se hizo, la apila; si pasa de 15, borra la más vieja.",
        "**2** La Foto guarda una copia completa del EstadoNivel (terreno, jugador, cajas).",
        "**deshacer():** saca hasta 5 fotos, restaura la última que sacó y suma 1 a",
        "     undosUsados. Máximo 3 deshacer seguidos: el contador vuelve a 0 al mover.",
        "No hace nada si el historial está vacío o el nivel ya se completó.",
    ], titulo="Las reglas de la consigna: 15 / 5 / 3")
    d.nota(800, 600, 750, [
        "En el Memento del libro, el originador crea el recuerdo y lo restaura",
        "(crearMemento / restaurar) y el cuidador solo lo guarda sin mirarlo.",
        "Acá JuegoSokoban arma la Foto con estado.copiar() y la restaura con",
        "estado = foto.estado(). Funciona igual: es una **instantánea del estado**.",
        "Para presentarlo como Memento conviene nombrarlo así en el informe.",
    ], titulo="¿Es un Memento?")
    return d


DIAGRAMAS = {"0-como-leer-flechas": flechas, "1-vista-general": general, "2-diagrama-completo": completo,
             "3-patron-observer": observer, "4-patron-facade": facade, "5-patron-singleton": singleton, "6-mvc": mvc,
             "8-patron-strategy": strategy, "9-patron-mediator": mediator, "10-patron-decorator": decorator,
             "11-patron-state": state, "12-deshacer-memento": memento}



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
