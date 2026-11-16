"""Las clases del proyecto tal como están en el código (una sola fuente para todos los diagramas).

Convenciones: "_" al principio = static (va subrayado). Visibilidad: + público, - privado, # protegido,
~ de paquete (sin modificador en Java). Un renglón que empieza con espacios continúa el anterior.
Reglas (desde la auditoría del 16/11): se dibujan TODOS los getters y setters públicos; se omiten las
constantes de estilo (colores, fuentes, tamaños) y los métodos que solo implementan una interfaz
(actualizar en los observadores, los de Juego en JuegoSokoban), salvo en el Decorator, donde se ve
qué redefine cada clase.
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
                               "- mostrarAyuda(): void", "# paintComponent(g: Graphics): void"]),
    "PanelAyuda": dict(nombre="PanelAyuda", autor="luca", extiende="extiende JPanel",
                       attrs=["_- CASILLAS: String[][]"],
                       ops=["+ PanelAyuda()", "_- crearFila(imagen: String, texto: String): JLabel"]),
    "PantallaJuego": dict(nombre="PantallaJuego", autor="luca", extiende="extiende JPanel",
                          attrs=["_- TECLAS: Map<Integer, Direccion>", "- juego: Juego", "- volverAlMenu: Runnable",
                                 "- tablero: PanelTablero", "- grabadora: GrabadoraDePartida", "- avisoRepeticion: JLabel",
                                 "- ocultarAviso: Timer", "- repeticion: Repeticion"],
                          ops=["+ PantallaJuego(juego: Juego, volverAlMenu: Runnable)", "+ iniciar(nivel: int): void",
                               "- configurarTeclado(): void", "- asignarTecla(tecla: int, accion: Runnable): void",
                               "- mover(direccion: Direccion): void", "- deshacer(): void", "- viajarEnElTiempo(): void",
                               "- reiniciar(): void", "- alApretarEscape(): void", "- pausar(): void",
                               "- mostrarResultadoSiTermino(): void", "- mostrarSinSolucion(estado: EstadoJuego): void",
                               "- mostrarResultado(estado: EstadoJuego): void", "- verRepeticion(nivel: int): void",
                               "- avisar(texto: String): void", "- repitiendo(): boolean", "- crearAviso(): JLabel",
                               "- mostrarCartel(titulo: String, mensaje: String,", "      opciones: Map<String, Runnable>): void",
                               "- devolverFocoALaVentana(): void"]),
    "PanelHUD": dict(nombre="PanelHUD", autor="luca", extiende="extiende JPanel",
                     attrs=["- nivel: JLabel", "- movimientos: JLabel", "- empujes: JLabel", "- plutonio: JLabel",
                            "- delorean: JButton"],
                     ops=["+ PanelHUD(alDeshacer: Runnable, alReiniciar: Runnable,", "      alViajar: Runnable, alPausar: Runnable)",
                          "_- crearIndicador(ruta: String, valor: int): Icon",
                          "_- crearBoton(ruta: String, descripcion: String,", "_      accion: Runnable): JButton",
                          "_- atenuar(imagen: Image): Image"]),
    "PanelTablero": dict(nombre="PanelTablero", autor="luca", extiende="extiende JPanel",
                         attrs=["_- SPRITES_JUGADOR: Map<Direccion, String>", "_- CAPAS: Map<Character, List<String>>",
                                "_- SOBRE_DESTINO: String", "- tablero: List<String>", "- epoca: Epoca",
                                "- orientacion: Direccion"],
                         ops=["+ mirarHacia(direccion: Direccion): void", "# paintComponent(g: Graphics): void",
                              "- dibujarCelda(g: Graphics, simbolo: char,", "      x: int, y: int, tamano: int): void",
                              "_- pasoDelJugador(antes: List<String>,", "_      despues: List<String>): Direccion",
                              "_- buscarJugador(filas: List<String>): int[]", "- rutaDe(capa: String): String"]),
    "Cartel": dict(nombre="Cartel", autor="luca", extiende="extiende JPanel",
                   attrs=["_+ FONDO: Color"],
                   ops=["+ Cartel(titulo: String, mensaje: String,", "      opciones: Map<String, Runnable>)",
                        "+ Cartel(titulo: String, contenido: JComponent,", "      opciones: Map<String, Runnable>)",
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
                  ops=["_+ delNivel(nivel: int): Epoca", "+ getFondo(): String", "+ resolver(capa: String): String"]),

    # ───────── sokoban.modelo: contrato (Luca) ─────────
    "Juego": dict(nombre="Juego", autor="luca", estereo="interface", tipo="interface",
                  ops=["+ getCantidadNiveles(): int", "+ iniciarNivel(numero: int): void", "+ mover(direccion: Direccion): void",
                       "+ deshacer(): void", "+ reiniciar(): void", "+ viajarEnElTiempo(): void", "+ getEstado(): EstadoJuego",
                       "+ agregarObservador(observador: ObservadorJuego): void",
                       "+ quitarObservador(observador: ObservadorJuego): void"]),
    "JuegoDecorado": dict(nombre="JuegoDecorado", autor="luca", estereo="abstract", abstracta=True,
                          attrs=["# juego: Juego"],
                          ops=["# JuegoDecorado(juego: Juego)", "+ getCantidadNiveles(): int",
                               "+ iniciarNivel(numero: int): void", "+ mover(direccion: Direccion): void",
                               "+ deshacer(): void", "+ reiniciar(): void", "+ viajarEnElTiempo(): void",
                               "+ getEstado(): EstadoJuego", "+ agregarObservador(observador: ObservadorJuego): void",
                               "+ quitarObservador(observador: ObservadorJuego): void"]),
    "ObservadorJuego": dict(nombre="ObservadorJuego", autor="luca", estereo="interface", tipo="interface",
                            ops=["+ actualizar(estado: EstadoJuego): void"]),
    "EstadoJuego": dict(nombre="EstadoJuego", autor="luca", estereo="record", tipo="record",
                        attrs=["- nivel: int", "- movimientos: int", "- empujes: int", "- undosUsados: int",
                               "- plutonio: int", "- viajes: int", "- puntosEnElTiempo: int", "- puntaje: int",
                               "- completado: boolean", "- sinSolucion: boolean", "- tablero: List<String>"]),
    "Direccion": dict(nombre="Direccion", autor="luca", estereo="enumeration", tipo="enum",
                      valores=["ARRIBA", "ABAJO", "IZQUIERDA", "DERECHA"],
                      attrs=["- deltaFila: int", "- deltaColumna: int"],
                      ops=["+ getDeltaFila(): int", "+ getDeltaColumna(): int"]),

    # ───────── sokoban.modelo · dominio (Pedro y Lucía) ─────────
    "JuegoSokoban": dict(nombre="JuegoSokoban", autor="dominio",
                         attrs=["_- MAX_HISTORIAL: int = 15", "_- PASOS_POR_UNDO: int = 5",
                                "_- MAX_UNDOS_CONSECUTIVOS: int = 3", "- cargador: CargadorNivel",
                                "- cantidadNiveles: int", "- observadores: List<ObservadorJuego>",
                                "- historial: Deque<RecuerdoNivel>", "- maquinaDelTiempo: MaquinaDelTiempo",
                                "- estado: EstadoNivel", "- motor: MediadorMovimiento", "- nivel: int", "- movimientos: int",
                                "- empujes: int", "- undosUsados: int", "- undosConsecutivos: int", "- plutonio: int",
                                "- viajes: int"],
                         ops=["+ JuegoSokoban()", "+ JuegoSokoban(cargador: CargadorNivel)", "- conectarMotor(): void",
                              "- calcularPuntaje(): int", "- crearRecuerdo(): RecuerdoNivel",
                              "- restaurar(recuerdo: RecuerdoNivel): void", "- olvidarPuntosDelFuturo(): void",
                              "- notificar(): void"]),
    "CargadorNivel": dict(nombre="CargadorNivel", autor="dominio",
                          attrs=['_+ CARPETA_POR_DEFECTO: String = "niveles"', "_- BOM: String", "- carpeta: String"],
                          ops=["+ CargadorNivel()", "+ CargadorNivel(carpeta: String)", "+ cargar(numero: int): EstadoNivel",
                               "+ existe(numero: int): boolean", "+ contarNiveles(): int", "+ getCarpeta(): String",
                               "_- nombreDe(numero: int): String", "- leer(nombre: String): List<String>",
                               "_- limpiar(lineas: List<String>): List<String>"]),
    "EstadoNivel": dict(nombre="EstadoNivel", autor="dominio",
                        attrs=["- terreno: char[][]", "- jugador: Jugador", "- cajas: List<Caja>", "- cantidadDestinos: int"],
                        ops=["+ EstadoNivel(lineas: List<String>)", "- EstadoNivel(terreno: char[][], jugador: Jugador,",
                             "      cajas: List<Caja>, cantidadDestinos: int)", "+ getJugador(): Jugador",
                             "+ conectarColegas(mediador: MediadorMovimiento): void",
                             "+ cajaEn(posicion: Posicion): Caja", "- dentro(p: Posicion): boolean",
                             "+ estaLibre(p: Posicion): boolean", "+ esHielo(p: Posicion): boolean",
                             "+ esCerrojo(p: Posicion): boolean", "+ abrirMuros(): void", "+ quitarCaja(caja: Caja): void",
                             "+ recogerPlutonio(p: Posicion): boolean",
                             "+ conservarPlutonioRecogido(presente: EstadoNivel): void", "+ cajasEnDestino(): int",
                             "+ sinSolucion(): boolean", "+ estaCompleto(): boolean", "+ tableroParaVista(): List<String>",
                             "- copiarTerreno(): char[][]", "+ copiar(): EstadoNivel"]),
    "Posicion": dict(nombre="Posicion", autor="dominio", estereo="record", tipo="record",
                     attrs=["- fila: int", "- columna: int"], ops=["+ siguiente(direccion: Direccion): Posicion"]),
    "Jugador": dict(nombre="Jugador", autor="dominio",
                    attrs=["- posicion: Posicion", "- mediador: MediadorMovimiento"],
                    ops=["+ Jugador(posicion: Posicion)", "+ getPosicion(): Posicion",
                         "+ setPosicion(posicion: Posicion): void", "+ conectar(mediador: MediadorMovimiento): void",
                         "+ mover(direccion: Direccion): boolean"]),
    "Caja": dict(nombre="Caja", autor="dominio",
                 attrs=["- posicion: Posicion", "- estrategia: ComportamientoCaja", "- resistencia: int",
                        "- mediador: MediadorMovimiento"],
                 ops=["+ Caja(posicion: Posicion,", "      estrategia: ComportamientoCaja, resistencia: int)",
                      "+ getPosicion(): Posicion", "+ setPosicion(posicion: Posicion): void", "+ getResistencia(): int",
                      "+ quitarResistencia(): void", "+ getSimbolo(): char",
                      "+ conectar(mediador: MediadorMovimiento): void", "+ despuesDeEmpujar(): void", "+ copiar(): Caja"]),
    "ComportamientoCaja": dict(nombre="ComportamientoCaja", autor="dominio", estereo="interface", tipo="interface",
                               ops=["+ despuesDeEmpujar(caja: Caja,", "      mediador: MediadorMovimiento): void",
                                    "+ simbolo(caja: Caja): char"]),
    "CajaNormalStrategy": dict(nombre="CajaNormalStrategy", autor="dominio"),
    "CajaFragilStrategy": dict(nombre="CajaFragilStrategy", autor="dominio"),
    "CajaLlaveStrategy": dict(nombre="CajaLlaveStrategy", autor="dominio"),
    "MediadorMovimiento": dict(nombre="MediadorMovimiento", autor="dominio", estereo="interface", tipo="interface",
                               ops=["+ intentarMover(direccion: Direccion): boolean", "+ fueEmpuje(): boolean",
                                    "+ cajaRota(caja: Caja): void", "+ llaveEmpujada(caja: Caja): void"]),
    "MotorMovimiento": dict(nombre="MotorMovimiento", autor="dominio",
                            attrs=["- estado: EstadoNivel", "- empuje: boolean"],
                            ops=["+ MotorMovimiento(estado: EstadoNivel)"]),

    # ───────── sokoban.modelo: DeLorean (Martín) ─────────
    "RecuerdoNivel": dict(nombre="RecuerdoNivel", autor="martin", estereo="Memento",
                          attrs=["- nivel: EstadoNivel", "- movimientos: int", "- empujes: int", "- plutonio: int"],
                          ops=["~ RecuerdoNivel(nivel: EstadoNivel, movimientos: int,", "      empujes: int, plutonio: int)",
                               "~ nivel(): EstadoNivel", "~ movimientos(): int", "~ empujes(): int", "~ plutonio(): int"]),
    "MaquinaDelTiempo": dict(nombre="MaquinaDelTiempo", autor="martin",
                             attrs=["_- MAXIMO_PUNTOS: int = 10", "- puntos: Deque<RecuerdoNivel>"],
                             ops=["+ guardar(recuerdo: RecuerdoNivel): void", "+ ultimo(): RecuerdoNivel",
                                  "+ descartarUltimo(): void", "+ cantidad(): int", "+ olvidarTodo(): void"]),

    # ───────── sokoban.comandos (Martín) ─────────
    "Comando": dict(nombre="Comando", autor="martin", estereo="interface", tipo="interface", ops=["+ ejecutar(): void"]),
    "ComandoMover": dict(nombre="ComandoMover", autor="martin", attrs=["- juego: Juego", "- direccion: Direccion"],
                         ops=["+ ComandoMover(juego: Juego, direccion: Direccion)"]),
    "ComandoDeshacer": dict(nombre="ComandoDeshacer", autor="martin", attrs=["- juego: Juego"],
                            ops=["+ ComandoDeshacer(juego: Juego)"]),
    "ComandoViajarEnElTiempo": dict(nombre="ComandoViajarEnElTiempo", autor="martin", attrs=["- juego: Juego"],
                                    ops=["+ ComandoViajarEnElTiempo(juego: Juego)"]),
    "GrabadoraDePartida": dict(nombre="GrabadoraDePartida", autor="martin", attrs=["- grabados: List<Comando>"],
                               ops=["+ ejecutar(comando: Comando): void", "+ borrar(): void",
                                    "+ getGrabados(): List<Comando>"]),
    "Repeticion": dict(nombre="Repeticion", autor="martin",
                       attrs=["_- PAUSA_MS: int = 160", "- pendientes: Iterator<Comando>", "- alTerminar: Runnable",
                              "- reloj: Timer"],
                       ops=["+ Repeticion(comandos: List<Comando>,", "      alTerminar: Runnable)", "+ empezar(): void",
                            "+ saltarAlFinal(): void", "+ estaReproduciendo(): boolean", "- siguiente(): void"]),

    # ───────── sokoban.sonido (Mora) ─────────
    "JuegoConSonido": dict(nombre="JuegoConSonido", autor="sonido", extiende="extiende JuegoDecorado",
                           attrs=["_- CAJAS_EN_DESTINO: String", "_- CAJAS_FRAGILES: String", "_- MURO_CERRADO: char",
                                  "_- DEMORA_DERROTA_MS: int"],
                           ops=["+ JuegoConSonido(juego: Juego)", "+ iniciarNivel(numero: int): void",
                                "+ mover(direccion: Direccion): void", "+ deshacer(): void", "+ viajarEnElTiempo(): void",
                                "+ reiniciar(): void",
                                "_~ queSonidoCorresponde(antes: EstadoJuego,", "_      despues: EstadoJuego): Sonido",
                                "_- sonar(sonido: Sonido): void", "_- sonarMasTarde(sonido: Sonido): void",
                                "_- contar(estado: EstadoJuego, simbolo: char): int",
                                "_- contar(estado: EstadoJuego, simbolos: String): int",
                                "_- posiciones(estado: EstadoJuego,", "_      simbolos: String): Set<Integer>"]),
    "Sonidos": dict(nombre="Sonidos", autor="sonido", estereo="Singleton",
                    attrs=["_- instancia: Sonidos", "- clips: Map<Sonido, Clip>", "- estado: EstadoSonido"],
                    ops=["- Sonidos()", "_+ obtenerInstancia(): Sonidos", "+ reproducir(sonido: Sonido): void",
                         "+ alternarSonido(): void", "~ establecerEstado(nuevoEstado: EstadoSonido): void",
                         "~ detenerTodo(): void", "- cargar(sonido: Sonido): void",
                         "_- abrir(ruta: String): AudioInputStream"]),
    "EstadoSonido": dict(nombre="EstadoSonido", autor="sonido", estereo="interface", tipo="interface",
                         ops=["+ reproducir(clip: Clip): void", "+ alternar(contexto: Sonidos): void"]),
    "SonidoActivado": dict(nombre="SonidoActivado", autor="sonido"),
    "SonidoSilenciado": dict(nombre="SonidoSilenciado", autor="sonido"),
    "Sonido": dict(nombre="Sonido", autor="sonido", estereo="enumeration", tipo="enum",
                   valores=["ARRANQUE, INICIO_NIVEL, PASO,", "EMPUJE, CAJA_EN_DESTINO,", "CAJA_DANADA, CAJA_ROTA,",
                            "CERROJO_ABIERTO, DESHACER,", "REINICIAR, VICTORIA, DERROTA,", "CHOQUE, CLIC, PLUTONIO,",
                            "VIAJE_EN_EL_TIEMPO  (16 efectos)"],
                   attrs=["- archivo: String"], ops=["+ getRuta(): String"]),
    "SonidosDeInterfaz": dict(nombre="SonidosDeInterfaz", autor="sonido",
                              ops=["- SonidosDeInterfaz()", "_+ instalar(): void",
                                   "_- alHacerClic(evento: MouseEvent): void",
                                   "_- alApretarTecla(evento: KeyEvent): boolean"]),

    # ───────── recursos ─────────
    "Assets": dict(nombre="assets/  (107 PNG)", autor="martin", estereo="carpeta de recursos",
                   texto=["characters/    4   (se usan 4)", "backgrounds/   3   (se usan 3)", "boxes/         8   (se usan 4)",
                          "goals/         3   (se usan 2)", "items/         1   (se usa 1)", "tiles/        69   (se usan 11)",
                          "ui/           19   (se usan 8)"]),
    "AssetsSonidos": dict(nombre="assets/sonidos/  (16 WAV)", autor="sonido", estereo="carpeta de recursos",
                          texto=["un .wav por cada efecto de Sonido", "generados con docs/generar_sonidos.py",
                                 "propios, de dominio público"]),
    "Niveles": dict(nombre="niveles/  (3 TXT)", autor="dominio", estereo="carpeta de recursos",
                    texto=["nivel1.txt   1955 · 3 cajas normales", "nivel2.txt   1985 · llave, cerrojo, frágil",
                           "nivel3.txt   2015 · hielo y frágil", "cada uno con un plutonio"]),
}


def _miembros(lineas):
    """Agrupa cada miembro con sus renglones de continuación (los que empiezan con espacios)."""
    grupos = []
    for l in lineas:
        if l.lstrip("_").startswith(" ") and grupos:
            grupos[-1].append(l)
        else:
            grupos.append([l])
    return grupos


def poner(d, id, x, y, w=None, solo=None, **extra):
    """Ubica la clase `id` en el diagrama `d`. `solo` permite mostrar menos miembros (diagramas de patrones):
    se queda con los miembros cuyo primer renglón contiene alguno de esos textos (y sus continuaciones)."""
    datos = dict(CLASES[id])
    datos.pop("abstracta", None)
    if solo is not None:
        for k in ("attrs", "ops"):
            datos[k] = [l for g in _miembros(datos.get(k, [])) if any(s in g[0] for s in solo) for l in g]
    datos.update(extra)
    nombre = datos.pop("nombre")
    return d.caja(id, nombre, x, y, w, **datos)
