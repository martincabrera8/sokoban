"""Las clases del proyecto tal como están en el código (una sola fuente para todos los diagramas).

Convenciones: "_" al principio = static (va subrayado). Visibilidad: + público, - privado, # protegido.
Reglas de la cátedra: se omiten constantes de estilo (colores, fuentes, tamaños), getters y los
métodos que solo implementan una interfaz (actualizar en los observadores).
"""

CLASES = {
    # ───────── sokoban ─────────
    "Main": dict(nombre="Main", autor="luca", ops=["- Main()", "_+ main(args: String[]): void"]),

    # ───────── sokoban.vista ─────────
    "VentanaPrincipal": dict(nombre="VentanaPrincipal", autor="luca", extiende="extiende JFrame",
                             attrs=["- pantallas: CardLayout", "- contenido: JPanel", "- pantallaJuego: PantallaJuego"],
                             ops=["+ VentanaPrincipal(juego: Juego)", "- mostrarMenu(): void", "- jugar(nivel: int): void"]),
    "MenuPrincipal": dict(nombre="MenuPrincipal", autor="luca", extiende="extiende JPanel",
                          ops=["+ MenuPrincipal(cantidadNiveles: int,", "      alElegirNivel: IntConsumer, alSalir: Runnable)",
                               "# paintComponent(g: Graphics): void"]),
    "PantallaJuego": dict(nombre="PantallaJuego", autor="luca", extiende="extiende JPanel",
                          attrs=["_- TECLAS: Map<Integer, Direccion>", "- juego: Juego", "- volverAlMenu: Runnable",
                                 "- tablero: PanelTablero"],
                          ops=["+ PantallaJuego(juego: Juego, volverAlMenu: Runnable)", "+ iniciar(nivel: int): void",
                               "- configurarTeclado(): void", "- asignarTecla(tecla: int, accion: Runnable): void",
                               "- mover(direccion: Direccion): void", "- pausar(): void",
                               "- mostrarResultado(estado: EstadoJuego): void",
                               "- mostrarCartel(titulo: String, mensaje: String,", "      opciones: Map<String, Runnable>): void"]),
    "PanelHUD": dict(nombre="PanelHUD", autor="luca", extiende="extiende JPanel",
                     attrs=["- nivel: JLabel", "- movimientos: JLabel", "- empujes: JLabel"],
                     ops=["+ PanelHUD(juego: Juego, alPausar: Runnable)", "_- crearIndicador(ruta: String, valor: int): Icon",
                          "_- crearBoton(ruta: String, descripcion: String,", "_      accion: Runnable): JButton"]),
    "PanelTablero": dict(nombre="PanelTablero", autor="luca", extiende="extiende JPanel",
                         attrs=["_- SPRITES_JUGADOR: Map<Direccion, String>", "_- CAPAS: Map<Character, List<String>>",
                                "- tablero: List<String>", "- epoca: Epoca", "- orientacion: Direccion"],
                         ops=["+ mirarHacia(direccion: Direccion): void", "# paintComponent(g: Graphics): void",
                              "- dibujarCelda(g: Graphics, simbolo: char,", "      x: int, y: int, tamano: int): void",
                              "- rutaDe(capa: String): String"]),
    "Cartel": dict(nombre="Cartel", autor="luca", extiende="extiende JPanel",
                   attrs=["_+ FONDO: Color"],
                   ops=["+ Cartel(titulo: String, mensaje: String,", "      opciones: Map<String, Runnable>)",
                        "# paintComponent(g: Graphics): void",
                        "_- crearEtiqueta(texto: String, fuente: Font,", "_      color: Color): JLabel",
                        "_- crearBoton(texto: String, accion: Runnable): JButton"]),
    "Imagenes": dict(nombre="Imagenes", autor="luca", estereo="Singleton",
                     attrs=["_- CARPETA: String", "_- instancia: Imagenes", "- cache: Map<String, Image>"],
                     ops=["- Imagenes()", "_+ obtenerInstancia(): Imagenes", "+ obtener(ruta: String): Image",
                          "+ dibujarFondo(g: Graphics, ruta: String,", "      ancho: int, alto: int): void",
                          "- cargar(ruta: String): Image"]),
    "Epoca": dict(nombre="Epoca", autor="integ", estereo="enumeration", tipo="enum",
                  valores=["HILL_VALLEY_1955", "MALL_1985", "FUTURO_2015"],
                  attrs=["_+ PISO: String", "_+ PARED: String", "- fondo: String", "- piso: String", "- pared: String"],
                  ops=["_+ delNivel(nivel: int): Epoca", "+ resolver(capa: String): String"]),

    # ───────── sokoban.modelo ─────────
    "Juego": dict(nombre="Juego", autor="luca", estereo="interface", tipo="interface",
                  ops=["+ getCantidadNiveles(): int", "+ iniciarNivel(numero: int): void", "+ mover(direccion: Direccion): void",
                       "+ deshacer(): void", "+ reiniciar(): void", "+ getEstado(): EstadoJuego",
                       "+ agregarObservador(observador: ObservadorJuego): void"]),
    "ObservadorJuego": dict(nombre="ObservadorJuego", autor="luca", estereo="interface", tipo="interface",
                            ops=["+ actualizar(estado: EstadoJuego): void"]),
    "EstadoJuego": dict(nombre="EstadoJuego", autor="luca", estereo="record", tipo="record",
                        attrs=["- nivel: int", "- movimientos: int", "- empujes: int", "- undosUsados: int",
                               "- puntaje: int", "- completado: boolean", "- tablero: List<String>"]),
    "Direccion": dict(nombre="Direccion", autor="luca", estereo="enumeration", tipo="enum",
                      valores=["ARRIBA", "ABAJO", "IZQUIERDA", "DERECHA"],
                      attrs=["- deltaFila: int", "- deltaColumna: int"]),

    # ───────── sokoban.prueba ─────────
    "JuegoDePrueba": dict(nombre="JuegoDePrueba", autor="luca",
                          attrs=["_- NIVELES: List<List<String>>", "- observadores: List<ObservadorJuego>",
                                 "- historial: Deque<Foto>", "- nivel: int", "- celdas: char[][]", "- destinos: boolean[][]",
                                 "- filaJugador: int", "- columnaJugador: int", "- movimientos: int", "- empujes: int",
                                 "- undosUsados: int"],
                          ops=["- notificar(): void", "- leerSimbolo(simbolo: char, fila: int, columna: int): void",
                               "- estaCompleto(): boolean", "- dibujarTablero(): List<String>",
                               "- simbolo(fila: int, columna: int): char", "_- copiar(origen: char[][]): char[][]"]),
    "Foto": dict(nombre="Foto", autor="luca", estereo="record", tipo="record",
                 attrs=["- celdas: char[][]", "- filaJugador: int", "- columnaJugador: int", "- movimientos: int",
                        "- empujes: int"]),

    # ───────── pendientes ─────────
    "ControladorJuego": dict(nombre="ControladorJuego", autor="pend", estereo="pendiente",
                             texto=["nombre provisorio · reemplaza a JuegoDePrueba", "tablero, jugador, cajas normal /",
                                    "frágil / llave, niveles .txt,", "deshacer 15 / 5 / 3, puntaje"]),
    "ReproductorSonido": dict(nombre="ReproductorSonido", autor="pend", estereo="pendiente",
                              texto=["nombre provisorio", "efectos: mover, empujar,", "deshacer, victoria"]),
    "Musica": dict(nombre="Musica", autor="pend", estereo="pendiente",
                   texto=["nombre provisorio", "música de fondo por época"]),

    # ───────── recursos ─────────
    "Assets": dict(nombre="assets/  (101 PNG)", autor="martin", estereo="carpeta de recursos",
                   texto=["characters/    4   (se usan 4)", "backgrounds/   3   (se usan 3)", "boxes/         8   (se usan 3)",
                          "goals/         3   (se usan 2)", "tiles/        69   (se usan 10)", "ui/           17   (se usan 6)"]),
}


def poner(d, id, x, y, w=None, solo=None, **extra):
    """Ubica la clase `id` en el diagrama `d`. `solo` permite mostrar menos miembros (diagramas de patrones)."""
    datos = dict(CLASES[id])
    if solo is not None:
        datos["attrs"] = [m for m in datos.get("attrs", []) if any(s in m for s in solo)]
        datos["ops"] = [m for m in datos.get("ops", []) if any(s in m for s in solo)]
    datos.update(extra)
    nombre = datos.pop("nombre")
    return d.caja(id, nombre, x, y, w, **datos)
