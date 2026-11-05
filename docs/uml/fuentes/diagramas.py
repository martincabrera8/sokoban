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
            ("#DAE8FC", "#6C8EBF", "Luca · interfaz gráfica Swing"),
            ("#D5E8D4", "#82B366", "Martín · arte (assets/)"),
            ("#FFF2CC", "#D6B656", "Integración Luca + Martín (asistida por IA)"),
            ("#F5F5F5", "#9E9E9E", "Pendiente · dominio/personaje y música/sonido")]):
        yy = y + 14 + i * 22
        dash = ' stroke-dasharray="4 3"' if i == 3 else ""
        d.raw(f'<rect x="{x}" y="{yy}" width="30" height="16" rx="3" fill="{color}" stroke="{borde}"{dash}/>')
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
    from uml import Flecha, TIPOS, _extremo, _camino
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
    d = Diagrama(2290, 1690, "Sokoban · Diagrama de clases completo",
                 "Estado al 05/11/2026 · todas las clases, atributos, métodos y relaciones · "
                 "violeta = implementa / es un · negro = tiene · gris punteado = usa / crea")
    # paquetes
    d.paquete(30, 200, 1120, 1165, "sokoban.vista · VISTA (lo que se ve)")
    d.paquete(1190, 200, 580, 900, "sokoban.modelo · CONTRATO vista ↔ dominio")
    d.paquete(1820, 200, 420, 165, "PENDIENTE · dominio y personaje", color="#FAFAFA", borde="#9E9E9E", punteado=True)
    d.paquete(1820, 400, 420, 600, "sokoban.prueba · PROVISORIO", color="#FBF8F2")
    d.paquete(1820, 1040, 420, 210, "PENDIENTE · música y sonido", color="#FAFAFA", borde="#9E9E9E", punteado=True)
    d.paquete(640, 1400, 360, 230, "assets/ · ARTE (Martín)", color="#F3FAF1", borde="#82B366")
    # arranque
    poner(d, "Main", 700, 88)
    d.texto(886, 112, "sokoban · arranque", 11, "#8A7F76", italic=True)
    # vista
    poner(d, "VentanaPrincipal", 330, 240)
    poner(d, "MenuPrincipal", 60, 460)
    poner(d, "PantallaJuego", 620, 450)
    poner(d, "Cartel", 60, 640)
    poner(d, "PanelTablero", 440, 800)
    poner(d, "PanelHUD", 800, 800)
    poner(d, "Epoca", 380, 1080)
    poner(d, "Imagenes", 620, 1080)
    # modelo
    poner(d, "Juego", 1230, 270)
    poner(d, "ObservadorJuego", 1230, 560)
    poner(d, "EstadoJuego", 1530, 480)
    poner(d, "Direccion", 1205, 880)
    # derecha
    poner(d, "ControladorJuego", 1850, 230)
    poner(d, "JuegoDePrueba", 1850, 440)
    poner(d, "Foto", 1950, 830)
    poner(d, "ReproductorSonido", 1840, 1090)
    poner(d, "Musica", 2030, 1090)
    poner(d, "Assets", 700, 1440)

    F = d.flecha
    # Main
    F("Main", "VentanaPrincipal", "dependencia", "left", "top", via=[(434.5, 128)], etiqueta="crea", pos=(560, 128))
    F("Main", "JuegoDePrueba", "dependencia", "right", "right", fd=0.24, via=[(2262, 128), (2262, 520.4)],
      etiqueta="crea (hasta que llegue el dominio)", pos=(1560, 128))
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
    # vista → modelo
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
    # modelo
    F("Juego", "ObservadorJuego", "dependencia", "bottom", "top", fo=0.3, fd=(1336.5 - 1230) / 245, etiqueta="avisa a", pos=(1336.5, 500))
    F("Juego", "EstadoJuego", "dependencia", "bottom", "top", fo=0.9, fd=(1549.5 - 1530) / 148, etiqueta="devuelve", pos=(1600, 459))
    F("ObservadorJuego", "EstadoJuego", "dependencia", "right", "left", fo=0.5, fd=(593.5 - 480) / 169, etiqueta="recibe", pos=(1503, 580))
    # implementaciones de Juego (comparten el triángulo)
    F("JuegoDePrueba", "Juego", "implementa", "left", "right", fo=0.1, fd=(337.6 - 270) / 169, via=[(1700, 473.5), (1700, 337.6)],
      etiqueta="implementa", pos=(1775, 473.5))
    F("ControladorJuego", "Juego", "pend_implementa", "left", "right", fo=0.6, fd=(337.6 - 270) / 169,
      via=[(1700, 300.8), (1700, 337.6)], etiqueta="implementará", pos=(1775, 300.8))
    F("JuegoDePrueba", "ObservadorJuego", "agregacion", "left", "bottom", fo=(700 - 440) / 335, fd=(1426 - 1230) / 245,
      via=[(1426, 700)], etiqueta="observadores", pos=(1640, 700), mult="0..*", mult_pos=(1450, 645))
    F("JuegoDePrueba", "Foto", "composicion", "bottom", "top", fo=0.5, fd=(2015.5 - 1950) / 145, etiqueta="historial", pos=(1975, 802), mult="0..*", mult_pos=(2040, 822))
    F("ReproductorSonido", "ObservadorJuego", "pend_implementa", "left", "bottom", fo=0.5, fd=(1350 - 1230) / 245,
      via=[(1350, 1140.5)], etiqueta="implementará", pos=(1600, 1140.5))
    d.texto(2035, 1205, "(Main creará la música)", 10.5, "#8A7F76", italic=True)

    leyenda_autoria(d, 1200, 1320)
    leyenda_flechas(d, 1600, 1320)
    d.nota(60, 1400, 520, [
        "**Herencia de Swing:** debajo del nombre dice «extiende JPanel / JFrame».",
        "No se dibuja la flecha a JPanel para no cruzar todo el diagrama.",
        "**Direccion** también la usa PantallaJuego en TECLAS (Map<Integer, Direccion>).",
        "**Subrayado** = static · **+** público · **-** privado · **#** protegido",
        "Se omiten constantes de estilo, getters y actualizar() de los observadores.",
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
        ("agregacion", ("JuegoDePrueba", "luca", "class"), ("ObservadorJuego", "luca", "interface"),
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
    d = Diagrama(1480, 920, "Vista general: las capas del proyecto",
                 "Cada caja es un paquete. Fijate que todas las flechas llegan al CONTRATO: la vista nunca apunta al dominio.")
    d.caja("Main", "sokoban · arranque", 580, 90, 280, estereo="paquete", autor="luca",
           texto=["Main: crea las piezas y las conecta"])
    d.caja("Swing", "javax.swing (Java)", 60, 90, 230, estereo="biblioteca", autor="swing",
           texto=["JFrame, JPanel, JDialog, JButton…"])
    d.caja("Vista", "VISTA · sokoban.vista", 60, 280, 330, estereo="paquete · Luca", autor="luca",
           texto=["VentanaPrincipal (ventana)", "MenuPrincipal (menú)", "PantallaJuego (partida y teclado)",
                  "PanelHUD (indicadores y botones)", "PanelTablero (dibuja el tablero)", "Cartel (pausa / resultado)",
                  "Imagenes (caché de imágenes)", "Epoca (estilo por época) · integración"])
    d.caja("Contrato", "CONTRATO · sokoban.modelo", 580, 300, 330, estereo="paquete · Luca", autor="luca",
           texto=["Juego  ← Facade + sujeto del Observer", "ObservadorJuego  ← Observer", "EstadoJuego  ← DTO (record)",
                  "Direccion  ← enum"])
    d.caja("Prueba", "PRUEBA · sokoban.prueba", 1090, 90, 330, estereo="paquete · provisorio", autor="luca",
           texto=["JuegoDePrueba: Sokoban mínimo de 3 niveles", "Se borra cuando llegue el dominio"])
    d.caja("Dominio", "DOMINIO y PERSONAJE", 1090, 330, 330, estereo="pendiente", autor="pend",
           texto=["ControladorJuego (implementa Juego)", "tablero, jugador, cajas, niveles .txt,", "deshacer, puntaje"])
    d.caja("Sonido", "MÚSICA y SONIDO", 1090, 560, 330, estereo="pendiente", autor="pend",
           texto=["ReproductorSonido (implementa ObservadorJuego)", "Musica (fondo)"])
    d.caja("Arte", "ARTE · assets/", 60, 640, 330, estereo="carpeta · Martín", autor="martin",
           texto=["101 imágenes PNG (se usan 28)", "personaje, cajas, pisos, paredes, fondos, HUD"])
    F = d.flecha
    F("Main", "Vista", "dependencia", "left", "top", fd=0.9, etiqueta="crea la ventana", pos=(470, 125))
    F("Main", "Prueba", "dependencia", "right", "left", etiqueta="crea (por ahora)", pos=(985, 125))
    F("Vista", "Swing", "hereda", "top", "bottom", fo=0.35, fd=(175.5 - 60) / 230, etiqueta="extiende", pos=(175.5, 235))
    F("Vista", "Contrato", "dependencia", "right", "left", fo=0.4, fd=(380 - 300) / d.cajas["Contrato"].h,
      etiqueta="usa / implementa", pos=(485, 362))
    F("Prueba", "Contrato", "implementa", "bottom", "top", fo=0.2, fd=0.9, via=[(1156, 245), (877, 245)], etiqueta="implementa Juego", pos=(1010, 245))
    F("Dominio", "Contrato", "pend_implementa", "left", "right", fo=0.4, fd=0.4, etiqueta="implementará Juego", pos=(1000, 440))
    F("Sonido", "Contrato", "pend_implementa", "left", "bottom", fo=0.5, fd=0.6, etiqueta="implementará ObservadorJuego",
      pos=(1000, 618))
    F("Vista", "Arte", "dependencia", "bottom", "top", etiqueta="lee las imágenes", pos=(225, 610))
    d.nota(470, 720, 960, [
        "**Por qué importa:** la VISTA solo conoce el CONTRATO (interfaces). El dominio real puede reemplazar a JuegoDePrueba",
        "sin tocar ninguna clase de la vista: solo cambia una línea en Main. Eso es el principio **DIP** (inversión de dependencias)",
        "y es lo que permite que cada integrante trabaje por separado.",
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
    poner(d, "JuegoDePrueba", 60, 430, solo=["observadores", "notificar"], rol="Sujeto concreto")
    poner(d, "PanelHUD", 560, 520, solo=["nivel:", "movimientos:", "empujes:"], ops=["+ actualizar(estado: EstadoJuego): void"],
          rol="Observador concreto")
    poner(d, "PanelTablero", 900, 520, solo=["- tablero:", "- epoca:"], ops=["+ actualizar(estado: EstadoJuego): void"],
          rol="Observador concreto")
    poner(d, "ReproductorSonido", 1240, 520, rol="Observador concreto (futuro)")
    F = d.flecha
    ju, ob = d.cajas["Juego"], d.cajas["ObservadorJuego"]
    F("Juego", "ObservadorJuego", "dependencia", "right", "left", fo=(173.5 - 120) / ju.h, fd=0.5, etiqueta="avisa a", num=3)
    F("ObservadorJuego", "EstadoJuego", "dependencia", "right", "left", fd=(173.5 - 100) / d.cajas["EstadoJuego"].h,
      etiqueta="recibe", num=4)
    F("JuegoDePrueba", "Juego", "implementa", "top", "bottom", fo=0.3, fd=(60 + 0.3 * d.cajas["JuegoDePrueba"].w - 60) / ju.w,
      etiqueta="implementa", num=1)
    jx = 60 + d.cajas["JuegoDePrueba"].w
    F("JuegoDePrueba", "ObservadorJuego", "agregacion", "right", "bottom", fo=0.25, fd=(790 - 760) / ob.w,
      via=[(790, 430 + 0.25 * d.cajas["JuegoDePrueba"].h)], etiqueta="observadores (la lista)", mult="0..*", mult_pos=(812, 228), num=2,
      pos=((jx + 790) / 2, 430 + 0.25 * d.cajas["JuegoDePrueba"].h))
    tx = 900
    for c in ("PanelHUD", "PanelTablero"):
        k = d.cajas[c]
        fo = 0.85 if c == "PanelHUD" else 0.5
        F(c, "ObservadorJuego", "implementa", "top", "bottom", fo=fo, fd=(tx - 760) / ob.w,
          via=[(k.x + k.w * fo, 420), (tx, 420)])
    k = d.cajas["ReproductorSonido"]
    F("ReproductorSonido", "ObservadorJuego", "pend_implementa", "top", "bottom", fo=0.5, fd=(tx - 760) / ob.w,
      via=[(k.x + k.w / 2, 420), (tx, 420)])
    d.texto(tx + 10, 330, "implementan", 11, "#7B3FA0")
    d.nota(60, 690, 660, [
        "**1** JuegoDePrueba cumple el contrato Juego (y mañana lo hará el dominio).",
        "**2** Guarda la lista de observadores que le pasan con agregarObservador(...).",
        "**3** Después de cada cambio recorre la lista: observador.actualizar(getEstado()).",
        "**4** Cada observador recibe una foto inmutable (EstadoJuego) y se redibuja.",
    ], titulo="Cómo se lee (seguí los números)")
    d.nota(760, 690, 700, ["private void notificar() {", "    EstadoJuego estado = getEstado();",
                           "    observadores.forEach(observador -> observador.actualizar(estado));", "}",
                           "// Registro (PantallaJuego): juego.agregarObservador(hud); juego.agregarObservador(tablero);"],
           titulo="El código clave (JuegoDePrueba.notificar)", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def facade():
    d = Diagrama(1500, 760, "Patrón Facade (estructural)",
                 "La vista habla con UNA sola interfaz simple (Juego). Atrás, el dominio coordina todas sus piezas sin que la vista se entere.")
    poner(d, "PantallaJuego", 50, 250, solo=["- juego:", "iniciar(", "- mover("], rol="Cliente")
    poner(d, "PanelHUD", 50, 470, solo=["+ PanelHUD("], rol="Cliente")
    poner(d, "Juego", 520, 230, rol="Fachada (Facade)")
    poner(d, "JuegoDePrueba", 1080, 110, solo=["~"], rol="Fachada concreta (provisoria)")
    poner(d, "ControladorJuego", 1080, 300, rol="Fachada concreta (la real)")
    d.caja("Sub", "Subsistema del dominio", 1080, 520, 330, estereo="pendiente · nombres de ejemplo", autor="pend",
           texto=["Tablero, Jugador, Caja (normal / frágil / llave),", "LectorDeNiveles (.txt), Historial (deshacer),",
                  "Puntaje…"])
    F = d.flecha
    ju = d.cajas["Juego"]
    pj = d.cajas["PantallaJuego"]
    F("PantallaJuego", "Juego", "asociacion", "right", "left", fo=0.5, fd=(250 + pj.h / 2 - 230) / ju.h,
      etiqueta="juego.mover(dir) / iniciarNivel(n)", mult="1")
    hu = d.cajas["PanelHUD"]
    F("PanelHUD", "Juego", "dependencia", "right", "left", fo=0.4, fd=0.85, via=[(470, 470 + 0.4 * hu.h), (470, 230 + 0.85 * ju.h)],
      etiqueta="juego.deshacer() / reiniciar()", pos=(470, 470))
    F("JuegoDePrueba", "Juego", "implementa", "left", "right", fo=0.5, fd=0.35, via=[(1000, 110 + d.cajas["JuegoDePrueba"].h / 2),
      (1000, 230 + 0.35 * ju.h)])
    F("ControladorJuego", "Juego", "pend_implementa", "left", "right", fo=0.5, fd=0.35,
      via=[(1000, 300 + d.cajas["ControladorJuego"].h / 2), (1000, 230 + 0.35 * ju.h)])
    d.texto(990, 300, "implementan", 11, "#7B3FA0", anchor="end")
    F("ControladorJuego", "Sub", "pend_dependencia", "bottom", "top", etiqueta="coordina")
    d.nota(50, 620, 900, [
        "Para la vista, mover al jugador es UNA llamada: juego.mover(Direccion.DERECHA). La fachada real tendrá que mirar",
        "el tablero, empujar la caja, ver si es frágil o resbala, guardar el historial y sumar el puntaje. **La vista no se entera.**",
        "Hoy JuegoDePrueba hace todo junto (no hay subsistema): el patrón **se termina de validar cuando llegue el dominio.**",
    ], titulo="Qué gana el proyecto")
    return d


# ════════════════════════════════════════════════════════════════════════════
def singleton():
    d = Diagrama(1360, 700, "Patrón Singleton (creacional)",
                 "Existe UNA sola caché de imágenes y todos la piden con Imagenes.obtenerInstancia(): cada PNG se lee del disco una vez.")
    poner(d, "MenuPrincipal", 50, 110, solo=["~"], rol="Cliente")
    poner(d, "PanelHUD", 50, 260, solo=["~"], rol="Cliente")
    poner(d, "PanelTablero", 50, 410, solo=["~"], rol="Cliente")
    poner(d, "Imagenes", 520, 200, rol="Singleton")
    poner(d, "Assets", 1060, 220)
    F = d.flecha
    im = d.cajas["Imagenes"]
    for c, f in (("MenuPrincipal", 0.2), ("PanelHUD", 0.5), ("PanelTablero", 0.8)):
        k = d.cajas[c]
        F(c, "Imagenes", "dependencia", "right", "left", fo=0.5, fd=f, etiqueta="obtenerInstancia().obtener(ruta)" if f == 0.5 else None)
    yb = 200 + im.h + 26
    F("Imagenes", "Imagenes", "asociacion", "bottom", "bottom", fo=0.75, fd=0.35, via=[(520 + 0.75 * im.w, yb), (520 + 0.35 * im.w, yb)],
      etiqueta="instancia (la única)", mult="0..1", mult_pos=(520 + 0.35 * im.w - 20, 200 + im.h + 16))
    F("Imagenes", "Assets", "dependencia", "right", "left", fo=0.4, fd=(200 + 0.4 * im.h - 220) / d.cajas["Assets"].h,
      etiqueta="lee cada PNG una vez")
    d.nota(520, 500, 780, [
        "private static Imagenes instancia;          // 1. la única instancia, guardada en la clase",
        "private Imagenes() { }                       // 2. constructor privado: nadie más puede hacer new",
        "public static Imagenes obtenerInstancia() {  // 3. punto de acceso global",
        "    if (instancia == null) instancia = new Imagenes();   // se crea la primera vez que se pide",
        "    return instancia; }",
    ], titulo="Las 3 piezas que tiene que tener un Singleton", mono=True)
    return d


# ════════════════════════════════════════════════════════════════════════════
def mvc():
    d = Diagrama(1520, 600, "MVC: quién hace qué",
                 "Modelo = reglas del juego · Vista = lo que se ve · Controlador = traduce lo que hace el usuario en pedidos al modelo.")
    d.caja("V", "VISTA", 40, 120, 360, estereo="lo que se ve", autor="luca",
           texto=["VentanaPrincipal, MenuPrincipal, Cartel", "PanelHUD: muestra nivel, movimientos, empujes",
                  "PanelTablero: dibuja el tablero", "Imagenes, Epoca: imágenes y estilo"])
    d.caja("C", "CONTROLADOR", 580, 120, 360, estereo="traduce acciones", autor="luca",
           texto=["PantallaJuego: flecha → juego.mover(dir)", "PanelHUD: botón → juego.deshacer() / reiniciar()",
                  "(controlador de entrada de Swing, vive en la vista)", "ControladorJuego del dominio (pendiente)"])
    d.caja("M", "MODELO", 1120, 120, 360, estereo="reglas del juego", autor="pend",
           texto=["Dominio (pendiente): tablero, jugador, cajas,", "niveles, deshacer, puntaje",
                  "Hoy lo simula JuegoDePrueba", "Se accede SOLO por la interfaz Juego"])
    F = d.flecha
    F("V", "C", "dependencia", "right", "left", etiqueta="tecla o botón", num=1)
    F("C", "M", "dependencia", "right", "left", etiqueta="mover · deshacer · reiniciar", num=2)
    F("M", "V", "dependencia", "bottom", "bottom", via=[(1300, 360), (220, 360)],
      etiqueta="avisa con EstadoJuego (Observer: actualizar)", num=3, pos=(730, 360))
    d.nota(40, 410, 1440, [
        "**Regla de oro:** el modelo no conoce a la vista. Le avisa a una interfaz (ObservadorJuego) y le manda un **DTO inmutable**",
        "(EstadoJuego), nunca un Tablero ni una Caja. Así la vista no puede romper las reglas del juego por accidente.",
        "**Ojo:** en Swing es normal que la parte de «controlador de entrada» (teclas y botones) quede dentro de los paneles.",
        "El controlador GRASP (quien recibe los pedidos y coordina el dominio) va a ser la clase del dominio que implemente Juego.",
    ], titulo="Para validar")
    return d


DIAGRAMAS = {"0-como-leer-flechas": flechas, "1-vista-general": general, "2-diagrama-completo": completo,
             "3-patron-observer": observer, "4-patron-facade": facade, "5-patron-singleton": singleton, "6-mvc": mvc}


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
