#!/usr/bin/env python3
"""Genera Sokoban.mdj, el diagrama de clases del proyecto en formato StarUML.

Uso (desde cualquier carpeta):  python3 local/docs/staruml/generar_staruml.py
Solo usa la biblioteca estándar de Python 3. Con "--png CARPETA" además exporta cada diagrama a PNG
usando la línea de comandos de StarUML ("staruml image"), si está instalado.

Contenido: el modelo completo (paquetes, clases, interfaces, enums y records con sus atributos,
operaciones, parámetros y relaciones), el "Diagrama de clases completo" y un diagrama por patrón
(Observer, Facade, Singleton, Strategy, Mediator, Decorator, State, Memento y Command) que reusan
los mismos elementos del modelo con vistas nuevas. El color de relleno de cada clase indica quién la hizo.

El archivo se arma igual que lo guarda StarUML: Project -> UMLModel -> paquetes -> clases,
cada elemento con su "_id" y su "_parent", y cada diagrama con sus vistas (UMLClassView con
sus compartimentos, relaciones con "head"/"tail" y sus etiquetas EdgeLabelView).
Los ids salen de un hash del nombre de cada elemento, así que al regenerar no cambian.

Para actualizarlo cuando cambia el código:
  1. Clases nuevas o miembros nuevos: editar CLASES (una línea por atributo u operación,
     con la misma notación que el diagrama: "_" al principio = static, después + - # ~).
  2. Relaciones nuevas: agregarlas en RELACIONES (con su clave).
  3. Ubicar la clase en DIAGRAMA_COMPLETO (x, y) y, si hace falta, el recorrido de las
     flechas nuevas. Las cajas se dimensionan solas a partir del texto.
Convenciones: se dibujan todos los getters y setters públicos (la auditoría pidió todos o ninguno);
se omiten las constantes de estilo (colores, fuentes, tamaños) y los métodos que solo implementan
una interfaz (se ven en la interfaz), salvo en el Decorator, donde se ve qué redefine cada clase.
"""
import base64
import hashlib
import json
import math
import os
import sys

CARPETA = os.path.dirname(os.path.abspath(__file__))
SALIDA = os.path.join(CARPETA, "Sokoban.mdj")

# ════════════════════════════════════════════════════════════════════════════
# 1. Clases (fuente de verdad: src/main/java/sokoban)
# ════════════════════════════════════════════════════════════════════════════
# paquete: ruta de paquetes Java. tipo: clase, interfaz, enum, record, externa.
# autor: luca, martin, integ, dominio (Pedro y Lucía), sonido (Mora), swing (biblioteca).

CLASES = {}


def clase(nombre, paquete, autor, tipo="clase", miembros="", literales="", estereotipo=None,
          final=False, abstracta=False, visibilidad="public", dentro_de=None, doc=""):
    CLASES[nombre] = dict(nombre=nombre, paquete=paquete, autor=autor, tipo=tipo, abstracta=abstracta,
                          miembros=[l.rstrip() for l in miembros.strip("\n").splitlines() if l.strip()],
                          literales=literales.split(), estereotipo=estereotipo, final=final,
                          visibilidad=visibilidad, dentro_de=dentro_de, doc=doc)


# ───────── sokoban ─────────
clase("Main", "sokoban", "luca", final=True,
      doc="Punto de entrada: arma new VentanaPrincipal(new JuegoConSonido(new JuegoSokoban())) e instala los sonidos de interfaz.",
      miembros="""
- Main()
_+ main(args: String[]): void
""")

# ───────── sokoban.vista (Luca) ─────────
clase("VentanaPrincipal", "sokoban.vista", "luca",
      doc="JFrame con las dos pantallas (menú y partida) en un CardLayout.",
      miembros="""
- pantallas: CardLayout
- contenido: JPanel
- pantallaJuego: PantallaJuego
+ VentanaPrincipal(juego: Juego)
- mostrarMenu(): void
- jugar(nivel: int): void
""")
clase("MenuPrincipal", "sokoban.vista", "luca", miembros="""
+ MenuPrincipal(cantidadNiveles: int, alElegirNivel: IntConsumer, alSalir: Runnable)
- mostrarAyuda(): void
# paintComponent(g: Graphics): void
""")
clase("PanelAyuda", "sokoban.vista", "luca",
      doc="Contenido del cartel «Cómo jugar»: cada casilla con su imagen y su regla, y las teclas.",
      miembros="""
_- CASILLAS: String[][]
+ PanelAyuda()
_- crearFila(imagen: String, texto: String): JLabel
""")
clase("PantallaJuego", "sokoban.vista", "luca",
      doc="Pantalla de la partida: HUD arriba, tablero al centro. Traduce teclas en comandos (cliente del Command) "
          "y muestra los carteles de pausa, caja rota, resultado y repetición, y los avisos de abajo.",
      miembros="""
_- TECLAS: Map<Integer, Direccion>
- juego: Juego
- volverAlMenu: Runnable
- tablero: PanelTablero
- grabadora: GrabadoraDePartida
- avisoRepeticion: JLabel
- ocultarAviso: Timer
- repeticion: Repeticion
+ PantallaJuego(juego: Juego, volverAlMenu: Runnable)
+ iniciar(nivel: int): void
- configurarTeclado(): void
- asignarTecla(tecla: int, accion: Runnable): void
- mover(direccion: Direccion): void
- deshacer(): void
- viajarEnElTiempo(): void
- reiniciar(): void
- alApretarEscape(): void
- pausar(): void
- mostrarResultadoSiTermino(): void
- mostrarSinSolucion(estado: EstadoJuego): void
- mostrarResultado(estado: EstadoJuego): void
- verRepeticion(nivel: int): void
- avisar(texto: String): void
- repitiendo(): boolean
- crearAviso(): JLabel
- mostrarCartel(titulo: String, mensaje: String, opciones: Map<String, Runnable>): void
- devolverFocoALaVentana(): void
""")
clase("PanelHUD", "sokoban.vista", "luca", miembros="""
- nivel: JLabel
- movimientos: JLabel
- empujes: JLabel
- plutonio: JLabel
- delorean: JButton
+ PanelHUD(alDeshacer: Runnable, alReiniciar: Runnable, alViajar: Runnable, alPausar: Runnable)
_- crearIndicador(ruta: String, valor: int): Icon
_- crearBoton(ruta: String, descripcion: String, accion: Runnable): JButton
_- atenuar(imagen: Image): Image
""")
clase("PanelTablero", "sokoban.vista", "luca", miembros="""
_- SPRITES_JUGADOR: Map<Direccion, String>
_- CAPAS: Map<Character, List<String>>
_- SOBRE_DESTINO: String
- tablero: List<String>
- epoca: Epoca
- orientacion: Direccion
+ mirarHacia(direccion: Direccion): void
# paintComponent(g: Graphics): void
- dibujarCelda(g: Graphics, simbolo: char, x: int, y: int, tamano: int): void
_- pasoDelJugador(antes: List<String>, despues: List<String>): Direccion
_- buscarJugador(filas: List<String>): int[]
- rutaDe(capa: String): String
""")
clase("Cartel", "sokoban.vista", "luca", miembros="""
_+ FONDO: Color
+ Cartel(titulo: String, mensaje: String, opciones: Map<String, Runnable>)
+ Cartel(titulo: String, contenido: JComponent, opciones: Map<String, Runnable>)
# paintComponent(g: Graphics): void
_- crearEtiqueta(texto: String, fuente: Font, color: Color): JLabel
_- crearBoton(texto: String, accion: Runnable): JButton
""")
clase("Imagenes", "sokoban.vista", "luca", estereotipo="Singleton", final=True,
      doc="Patrón Singleton: una única caché de imágenes compartida.",
      miembros="""
_- CARPETA: String
_- instancia: Imagenes
- cache: Map<String, Image>
- Imagenes()
_+ obtenerInstancia(): Imagenes
+ obtener(ruta: String): Image
+ dibujarFondo(g: Graphics, ruta: String, ancho: int, alto: int): void
- cargar(ruta: String): Image
""")
clase("Epoca", "sokoban.vista", "integ", tipo="enum",
      literales="HILL_VALLEY_1955 MALL_1985 FUTURO_2015",
      miembros="""
_+ PISO: String
_+ PARED: String
- fondo: String
- piso: String
- pared: String
_+ delNivel(nivel: int): Epoca
+ getFondo(): String
+ resolver(capa: String): String
""")

# ───────── sokoban.modelo: contrato entre vista y dominio (Luca) ─────────
clase("Juego", "sokoban.modelo", "luca", tipo="interfaz",
      doc="Facade del dominio para la vista y sujeto del Observer.",
      miembros="""
+ getCantidadNiveles(): int
+ iniciarNivel(numero: int): void
+ mover(direccion: Direccion): void
+ deshacer(): void
+ reiniciar(): void
+ viajarEnElTiempo(): void
+ getEstado(): EstadoJuego
+ agregarObservador(observador: ObservadorJuego): void
+ quitarObservador(observador: ObservadorJuego): void
""")
clase("JuegoDecorado", "sokoban.modelo", "luca", abstracta=True,
      doc="Decorator base (abstracta): implementa Juego, guarda el Juego envuelto y le delega todo. "
          "Agregada por la auditoría.",
      miembros="""
# juego: Juego
# JuegoDecorado(juego: Juego)
+ getCantidadNiveles(): int
+ iniciarNivel(numero: int): void
+ mover(direccion: Direccion): void
+ deshacer(): void
+ reiniciar(): void
+ viajarEnElTiempo(): void
+ getEstado(): EstadoJuego
+ agregarObservador(observador: ObservadorJuego): void
+ quitarObservador(observador: ObservadorJuego): void
""")
clase("ObservadorJuego", "sokoban.modelo", "luca", tipo="interfaz", miembros="""
+ actualizar(estado: EstadoJuego): void
""")
clase("EstadoJuego", "sokoban.modelo", "luca", tipo="record",
      doc="DTO inmutable: lo único que la vista recibe del dominio.",
      miembros="""
- nivel: int
- movimientos: int
- empujes: int
- undosUsados: int
- plutonio: int
- viajes: int
- puntosEnElTiempo: int
- puntaje: int
- completado: boolean
- sinSolucion: boolean
- tablero: List<String>
""")
clase("Direccion", "sokoban.modelo", "luca", tipo="enum", literales="ARRIBA ABAJO IZQUIERDA DERECHA",
      miembros="""
- deltaFila: int
- deltaColumna: int
+ getDeltaFila(): int
+ getDeltaColumna(): int
""")

# ───────── sokoban.modelo: dominio (Pedro y Lucía) ─────────
clase("JuegoSokoban", "sokoban.modelo", "dominio",
      doc="Controlador del dominio y Originador del Memento. Deshacer: guarda hasta 15 recuerdos, cada deshacer "
          "vuelve 5 pasos, máximo 3 seguidos. DeLorean: vuelve al último punto en el tiempo y gasta 1 plutonio. "
          "Puntaje: max(0, 1000 - 5 movimientos - 2 empujes - 50 deshacer - 100 viajes).",
      miembros="""
_- MAX_HISTORIAL: int = 15
_- PASOS_POR_UNDO: int = 5
_- MAX_UNDOS_CONSECUTIVOS: int = 3
- cargador: CargadorNivel
- cantidadNiveles: int
- observadores: List<ObservadorJuego>
- historial: Deque<RecuerdoNivel>
- maquinaDelTiempo: MaquinaDelTiempo
- estado: EstadoNivel
- motor: MediadorMovimiento
- nivel: int
- movimientos: int
- empujes: int
- undosUsados: int
- undosConsecutivos: int
- plutonio: int
- viajes: int
+ JuegoSokoban()
+ JuegoSokoban(cargador: CargadorNivel)
- conectarMotor(): void
- calcularPuntaje(): int
- crearRecuerdo(): RecuerdoNivel
- restaurar(recuerdo: RecuerdoNivel): void
- olvidarPuntosDelFuturo(): void
- notificar(): void
""")
clase("RecuerdoNivel", "sokoban.modelo", "martin", final=True,
      doc="Memento: copia del nivel y de los contadores. Solo JuegoSokoban (mismo paquete) puede crearlo y leerlo.",
      miembros="""
- nivel: EstadoNivel
- movimientos: int
- empujes: int
- plutonio: int
~ RecuerdoNivel(nivel: EstadoNivel, movimientos: int, empujes: int, plutonio: int)
~ nivel(): EstadoNivel
~ movimientos(): int
~ empujes(): int
~ plutonio(): int
""")
clase("MaquinaDelTiempo", "sokoban.modelo.tiempo", "martin",
      doc="Cuidador del Memento: guarda hasta 10 puntos en el tiempo sin poder leerlos (está en otro paquete).",
      miembros="""
_- MAXIMO_PUNTOS: int = 10
- puntos: Deque<RecuerdoNivel>
+ guardar(recuerdo: RecuerdoNivel): void
+ ultimo(): RecuerdoNivel
+ descartarUltimo(): void
+ cantidad(): int
+ olvidarTodo(): void
""")
clase("CargadorNivel", "sokoban.modelo", "dominio",
      doc="Lee niveles/nivelN.txt (del .jar o de una carpeta) y cuenta cuántos niveles hay.",
      miembros="""
_+ CARPETA_POR_DEFECTO: String = "niveles"
_- BOM: String
- carpeta: String
+ CargadorNivel()
+ CargadorNivel(carpeta: String)
+ cargar(numero: int): EstadoNivel
+ existe(numero: int): boolean
+ contarNiveles(): int
+ getCarpeta(): String
_- nombreDe(numero: int): String
- leer(nombre: String): List<String>
_- limpiar(lineas: List<String>): List<String>
""")
clase("EstadoNivel", "sokoban.modelo", "dominio",
      doc="Terreno y entidades del nivel. Valida el archivo, conecta a los colegas con el mediador y sabe copiarse.",
      miembros="""
- terreno: char[][]
- jugador: Jugador
- cajas: List<Caja>
- cantidadDestinos: int
+ EstadoNivel(lineas: List<String>)
- EstadoNivel(terreno: char[][], jugador: Jugador, cajas: List<Caja>, cantidadDestinos: int)
+ getJugador(): Jugador
+ conectarColegas(mediador: MediadorMovimiento): void
+ cajaEn(posicion: Posicion): Caja
- dentro(p: Posicion): boolean
+ estaLibre(p: Posicion): boolean
+ esHielo(p: Posicion): boolean
+ esCerrojo(p: Posicion): boolean
+ abrirMuros(): void
+ quitarCaja(caja: Caja): void
+ recogerPlutonio(p: Posicion): boolean
+ conservarPlutonioRecogido(presente: EstadoNivel): void
+ cajasEnDestino(): int
+ sinSolucion(): boolean
+ estaCompleto(): boolean
+ tableroParaVista(): List<String>
- copiarTerreno(): char[][]
+ copiar(): EstadoNivel
""")
clase("Posicion", "sokoban.modelo", "dominio", tipo="record", miembros="""
- fila: int
- columna: int
+ siguiente(direccion: Direccion): Posicion
""")
clase("Jugador", "sokoban.modelo.entidades", "dominio", doc="Colega del Mediator: pide moverse al mediador.",
      miembros="""
- posicion: Posicion
- mediador: MediadorMovimiento
+ Jugador(posicion: Posicion)
+ getPosicion(): Posicion
+ setPosicion(posicion: Posicion): void
+ conectar(mediador: MediadorMovimiento): void
+ mover(direccion: Direccion): boolean
""")
clase("Caja", "sokoban.modelo.entidades", "dominio",
      doc="Colega del Mediator y contexto del Strategy: después de un empuje le pasa el mediador a su estrategia.",
      miembros="""
- posicion: Posicion
- estrategia: ComportamientoCaja
- resistencia: int
- mediador: MediadorMovimiento
+ Caja(posicion: Posicion, estrategia: ComportamientoCaja, resistencia: int)
+ getPosicion(): Posicion
+ setPosicion(posicion: Posicion): void
+ getResistencia(): int
+ quitarResistencia(): void
+ getSimbolo(): char
+ conectar(mediador: MediadorMovimiento): void
+ despuesDeEmpujar(): void
+ copiar(): Caja
""")
clase("ComportamientoCaja", "sokoban.modelo.estrategias", "dominio", tipo="interfaz",
      doc="Strategy: qué hace cada tipo de caja después de un empuje y con qué símbolo se dibuja.",
      miembros="""
+ despuesDeEmpujar(caja: Caja, mediador: MediadorMovimiento): void
+ simbolo(caja: Caja): char
""")
clase("CajaNormalStrategy", "sokoban.modelo.estrategias", "dominio", doc="No agrega nada. Símbolo $.")
clase("CajaFragilStrategy", "sokoban.modelo.estrategias", "dominio",
      doc="Resta resistencia; a los 3 empujes avisa al mediador que la caja se rompió (cajaRota). Símbolos F y f.")
clase("CajaLlaveStrategy", "sokoban.modelo.estrategias", "dominio",
      doc="Avisa al mediador que se empujó la llave (llaveEmpujada); sobre un cerrojo se abren los muros X. Símbolo L.")
clase("MediadorMovimiento", "sokoban.modelo.movimiento", "dominio", tipo="interfaz",
      doc="Mediator: los colegas (Jugador y Caja) se comunican solo a través de él.",
      miembros="""
+ intentarMover(direccion: Direccion): boolean
+ fueEmpuje(): boolean
+ cajaRota(caja: Caja): void
+ llaveEmpujada(caja: Caja): void
""")
clase("MotorMovimiento", "sokoban.modelo.movimiento", "dominio",
      doc="Mediator concreto: colisiones, empujes, deslizamiento sobre hielo, cajas rotas y cerrojos. "
          "Al crearse conecta a los colegas (estado.conectarColegas(this)).",
      miembros="""
- estado: EstadoNivel
- empuje: boolean
+ MotorMovimiento(estado: EstadoNivel)
""")

# ───────── sokoban.sonido (Mora) ─────────
clase("JuegoConSonido", "sokoban.sonido", "sonido",
      doc="Decorator concreto: extiende JuegoDecorado y solo redefine las acciones que suenan.",
      miembros="""
_- CAJAS_EN_DESTINO: String
_- CAJAS_FRAGILES: String
_- MURO_CERRADO: char
_- DEMORA_DERROTA_MS: int
+ JuegoConSonido(juego: Juego)
+ iniciarNivel(numero: int): void
+ mover(direccion: Direccion): void
+ deshacer(): void
+ viajarEnElTiempo(): void
+ reiniciar(): void
_~ queSonidoCorresponde(antes: EstadoJuego, despues: EstadoJuego): Sonido
_- sonar(sonido: Sonido): void
_- sonarMasTarde(sonido: Sonido): void
_- contar(estado: EstadoJuego, simbolo: char): int
_- contar(estado: EstadoJuego, simbolos: String): int
_- posiciones(estado: EstadoJuego, simbolos: String): Set<Integer>
""")
clase("Sonidos", "sokoban.sonido", "sonido", estereotipo="Singleton", final=True,
      doc="Singleton + Facade de javax.sound y contexto del State.",
      miembros="""
_- instancia: Sonidos
- clips: Map<Sonido, Clip>
- estado: EstadoSonido
- Sonidos()
_+ obtenerInstancia(): Sonidos
+ reproducir(sonido: Sonido): void
+ alternarSonido(): void
~ establecerEstado(nuevoEstado: EstadoSonido): void
~ detenerTodo(): void
- cargar(sonido: Sonido): void
_- abrir(ruta: String): AudioInputStream
""")
clase("EstadoSonido", "sokoban.sonido", "sonido", tipo="interfaz", visibilidad="package",
      doc="State: activado o silenciado. Tecla M alterna.",
      miembros="""
+ reproducir(clip: Clip): void
+ alternar(contexto: Sonidos): void
""")
clase("SonidoActivado", "sokoban.sonido", "sonido", visibilidad="package")
clase("SonidoSilenciado", "sokoban.sonido", "sonido", visibilidad="package")
clase("Sonido", "sokoban.sonido", "sonido", tipo="enum",
      literales="ARRANQUE INICIO_NIVEL PASO EMPUJE CAJA_EN_DESTINO CAJA_DANADA CAJA_ROTA "
                "CERROJO_ABIERTO DESHACER REINICIAR VICTORIA DERROTA CHOQUE CLIC PLUTONIO VIAJE_EN_EL_TIEMPO",
      miembros="""
- archivo: String
+ getRuta(): String
""")
clase("SonidosDeInterfaz", "sokoban.sonido", "sonido", final=True,
      doc="Escucha clics en botones y la tecla M en toda la aplicación.",
      miembros="""
- SonidosDeInterfaz()
_+ instalar(): void
_- alHacerClic(evento: MouseEvent): void
_- alApretarTecla(evento: KeyEvent): boolean
""")

# ───────── sokoban.comandos (Martín) ─────────
clase("Comando", "sokoban.comandos", "martin", tipo="interfaz",
      doc="Command: una acción del jugador guardada como objeto, para poder repetirla.",
      miembros="""
+ ejecutar(): void
""")
clase("ComandoMover", "sokoban.comandos", "martin", miembros="""
- juego: Juego
- direccion: Direccion
+ ComandoMover(juego: Juego, direccion: Direccion)
""")
clase("ComandoDeshacer", "sokoban.comandos", "martin", miembros="""
- juego: Juego
+ ComandoDeshacer(juego: Juego)
""")
clase("ComandoViajarEnElTiempo", "sokoban.comandos", "martin", miembros="""
- juego: Juego
+ ComandoViajarEnElTiempo(juego: Juego)
""")
clase("GrabadoraDePartida", "sokoban.comandos", "martin",
      doc="Invocador: ejecuta cada comando y lo anota.",
      miembros="""
- grabados: List<Comando>
+ ejecutar(comando: Comando): void
+ borrar(): void
+ getGrabados(): List<Comando>
""")
clase("Repeticion", "sokoban.comandos", "martin",
      doc="Vuelve a ejecutar los comandos grabados, uno cada 160 ms, con un javax.swing.Timer.",
      miembros="""
_- PAUSA_MS: int = 160
- pendientes: Iterator<Comando>
- alTerminar: Runnable
- reloj: Timer
+ Repeticion(comandos: List<Comando>, alTerminar: Runnable)
+ empezar(): void
+ saltarAlFinal(): void
+ estaReproduciendo(): boolean
- siguiente(): void
""")

# ───────── biblioteca (solo para dibujar la herencia) ─────────
clase("JFrame", "javax.swing", "swing", tipo="externa")
clase("JPanel", "javax.swing", "swing", tipo="externa")

# ════════════════════════════════════════════════════════════════════════════
# 2. Relaciones
# ════════════════════════════════════════════════════════════════════════════
# tipos: hereda, implementa, asociacion, composicion, agregacion, dependencia.
# rol y mult describen el extremo destino (el que "se conoce"). nombre: texto sobre la línea.

RELACIONES = {}


def rel(clave, tipo, origen, destino, rol="", mult="", nombre=""):
    assert clave not in RELACIONES, clave
    RELACIONES[clave] = dict(clave=clave, tipo=tipo, origen=origen, destino=destino, rol=rol, mult=mult, nombre=nombre)


# herencia de Swing
rel("VentanaPrincipal-JFrame", "hereda", "VentanaPrincipal", "JFrame")
for _p in ("MenuPrincipal", "PantallaJuego", "PanelHUD", "PanelTablero", "Cartel", "PanelAyuda"):
    rel(f"{_p}-JPanel", "hereda", _p, "JPanel")
# realizaciones
rel("PanelHUD-ObservadorJuego", "implementa", "PanelHUD", "ObservadorJuego")
rel("PanelTablero-ObservadorJuego", "implementa", "PanelTablero", "ObservadorJuego")
rel("JuegoSokoban-Juego", "implementa", "JuegoSokoban", "Juego")
rel("JuegoDecorado-Juego", "implementa", "JuegoDecorado", "Juego")
rel("JuegoConSonido-JuegoDecorado", "hereda", "JuegoConSonido", "JuegoDecorado")
rel("SonidoActivado-EstadoSonido", "implementa", "SonidoActivado", "EstadoSonido")
rel("SonidoSilenciado-EstadoSonido", "implementa", "SonidoSilenciado", "EstadoSonido")
rel("MotorMovimiento-MediadorMovimiento", "implementa", "MotorMovimiento", "MediadorMovimiento")
for _s in ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"):
    rel(f"{_s}-ComportamientoCaja", "implementa", _s, "ComportamientoCaja")
# Main
rel("Main-VentanaPrincipal", "dependencia", "Main", "VentanaPrincipal", nombre="crea")
rel("Main-JuegoConSonido", "dependencia", "Main", "JuegoConSonido", nombre="crea")
rel("Main-JuegoSokoban", "dependencia", "Main", "JuegoSokoban", nombre="crea")
rel("Main-CargadorNivel", "dependencia", "Main", "CargadorNivel", nombre="crea (carpeta de niveles)")
rel("Main-SonidosDeInterfaz", "dependencia", "Main", "SonidosDeInterfaz", nombre="instalar()")
# vista
rel("VentanaPrincipal-MenuPrincipal", "composicion", "VentanaPrincipal", "MenuPrincipal", mult="1")
rel("VentanaPrincipal-PantallaJuego", "composicion", "VentanaPrincipal", "PantallaJuego", rol="pantallaJuego", mult="1")
rel("MenuPrincipal-Cartel", "composicion", "MenuPrincipal", "Cartel", mult="1")
rel("PantallaJuego-Cartel", "dependencia", "PantallaJuego", "Cartel", nombre="crea")
rel("PantallaJuego-PanelTablero", "composicion", "PantallaJuego", "PanelTablero", rol="tablero", mult="1")
rel("PantallaJuego-PanelHUD", "composicion", "PantallaJuego", "PanelHUD", mult="1")
rel("PanelTablero-Epoca", "asociacion", "PanelTablero", "Epoca", rol="epoca", mult="1")
rel("PanelTablero-Direccion", "asociacion", "PanelTablero", "Direccion", rol="orientacion", mult="1")
rel("PanelTablero-Imagenes", "dependencia", "PanelTablero", "Imagenes", nombre="usa")
rel("PanelHUD-Imagenes", "dependencia", "PanelHUD", "Imagenes", nombre="usa")
rel("MenuPrincipal-Imagenes", "dependencia", "MenuPrincipal", "Imagenes", nombre="usa")
rel("MenuPrincipal-PanelAyuda", "dependencia", "MenuPrincipal", "PanelAyuda", nombre="crea (Cómo jugar)")
rel("PanelAyuda-Imagenes", "dependencia", "PanelAyuda", "Imagenes", nombre="usa")
rel("Imagenes-instancia", "asociacion", "Imagenes", "Imagenes", rol="instancia", mult="0..1")
rel("PantallaJuego-Juego", "asociacion", "PantallaJuego", "Juego", rol="juego", mult="1")
rel("PantallaJuego-Direccion", "dependencia", "PantallaJuego", "Direccion", nombre="TECLAS")
# contrato
rel("Juego-ObservadorJuego", "dependencia", "Juego", "ObservadorJuego", nombre="avisa a")
rel("Juego-EstadoJuego", "dependencia", "Juego", "EstadoJuego", nombre="devuelve")
rel("ObservadorJuego-EstadoJuego", "dependencia", "ObservadorJuego", "EstadoJuego", nombre="recibe")
rel("Juego-Direccion", "dependencia", "Juego", "Direccion", nombre="mover(direccion)")
# sonido
rel("JuegoDecorado-juego", "asociacion", "JuegoDecorado", "Juego", rol="juego", mult="1")
rel("JuegoConSonido-EstadoJuego", "dependencia", "JuegoConSonido", "EstadoJuego", nombre="compara")
rel("JuegoConSonido-Sonidos", "dependencia", "JuegoConSonido", "Sonidos", nombre="usa")
rel("JuegoConSonido-Sonido", "dependencia", "JuegoConSonido", "Sonido", nombre="elige el efecto")
rel("Sonidos-instancia", "asociacion", "Sonidos", "Sonidos", rol="instancia", mult="0..1")
rel("Sonidos-EstadoSonido", "asociacion", "Sonidos", "EstadoSonido", rol="estado", mult="1")
rel("Sonidos-Sonido", "dependencia", "Sonidos", "Sonido", nombre="un Clip por cada uno")
rel("SonidoActivado-Sonidos", "dependencia", "SonidoActivado", "Sonidos", nombre="le cambia el estado")
rel("SonidoSilenciado-Sonidos", "dependencia", "SonidoSilenciado", "Sonidos", nombre="le cambia el estado")
rel("SonidoActivado-SonidoSilenciado", "dependencia", "SonidoActivado", "SonidoSilenciado", nombre="crea al silenciar")
rel("SonidoSilenciado-SonidoActivado", "dependencia", "SonidoSilenciado", "SonidoActivado", nombre="crea al activar")
rel("SonidosDeInterfaz-Sonidos", "dependencia", "SonidosDeInterfaz", "Sonidos", nombre="usa")
rel("SonidosDeInterfaz-Sonido", "dependencia", "SonidosDeInterfaz", "Sonido", nombre="ARRANQUE, CLIC")
# dominio
rel("JuegoSokoban-observadores", "agregacion", "JuegoSokoban", "ObservadorJuego", rol="observadores", mult="0..*")
rel("JuegoSokoban-EstadoJuego", "dependencia", "JuegoSokoban", "EstadoJuego", nombre="crea")
rel("JuegoSokoban-RecuerdoNivel", "composicion", "JuegoSokoban", "RecuerdoNivel", rol="historial", mult="0..15")
rel("JuegoSokoban-MaquinaDelTiempo", "composicion", "JuegoSokoban", "MaquinaDelTiempo", rol="maquinaDelTiempo", mult="1")
rel("MaquinaDelTiempo-RecuerdoNivel", "agregacion", "MaquinaDelTiempo", "RecuerdoNivel", rol="puntos", mult="0..10")
rel("RecuerdoNivel-EstadoNivel", "asociacion", "RecuerdoNivel", "EstadoNivel", rol="nivel", mult="1")
rel("JuegoSokoban-CargadorNivel", "asociacion", "JuegoSokoban", "CargadorNivel", rol="cargador", mult="1")
rel("JuegoSokoban-EstadoNivel", "asociacion", "JuegoSokoban", "EstadoNivel", rol="estado", mult="0..1")
rel("JuegoSokoban-MediadorMovimiento", "asociacion", "JuegoSokoban", "MediadorMovimiento", rol="motor", mult="0..1")
rel("JuegoSokoban-MotorMovimiento", "dependencia", "JuegoSokoban", "MotorMovimiento", nombre="crea")
rel("CargadorNivel-EstadoNivel", "dependencia", "CargadorNivel", "EstadoNivel", nombre="crea")
rel("MotorMovimiento-EstadoNivel", "asociacion", "MotorMovimiento", "EstadoNivel", rol="estado", mult="1")
rel("MotorMovimiento-Jugador", "dependencia", "MotorMovimiento", "Jugador", nombre="mueve")
rel("MotorMovimiento-Caja", "dependencia", "MotorMovimiento", "Caja", nombre="empuja")
rel("EstadoNivel-Jugador", "composicion", "EstadoNivel", "Jugador", rol="jugador", mult="1")
rel("EstadoNivel-Caja", "composicion", "EstadoNivel", "Caja", rol="cajas", mult="0..*")
rel("EstadoNivel-ComportamientoCaja", "dependencia", "EstadoNivel", "ComportamientoCaja", nombre="crea la estrategia")
rel("Jugador-MediadorMovimiento", "asociacion", "Jugador", "MediadorMovimiento", rol="mediador", mult="0..1")
rel("Jugador-Posicion", "asociacion", "Jugador", "Posicion", rol="posicion", mult="1")
rel("Caja-Posicion", "asociacion", "Caja", "Posicion", rol="posicion", mult="1")
rel("Caja-ComportamientoCaja", "asociacion", "Caja", "ComportamientoCaja", rol="estrategia", mult="1")
rel("Caja-MediadorMovimiento", "asociacion", "Caja", "MediadorMovimiento", rol="mediador", mult="0..1")
rel("EstadoNivel-MediadorMovimiento", "dependencia", "EstadoNivel", "MediadorMovimiento", nombre="conectarColegas()")
rel("ComportamientoCaja-MediadorMovimiento", "dependencia", "ComportamientoCaja", "MediadorMovimiento", nombre="avisa")
rel("CajaFragilStrategy-MediadorMovimiento", "dependencia", "CajaFragilStrategy", "MediadorMovimiento", nombre="cajaRota()")
rel("CajaLlaveStrategy-MediadorMovimiento", "dependencia", "CajaLlaveStrategy", "MediadorMovimiento", nombre="llaveEmpujada()")
rel("Posicion-Direccion", "dependencia", "Posicion", "Direccion", nombre="siguiente(direccion)")
# comandos
for _c in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
    rel(f"{_c}-Comando", "implementa", _c, "Comando")
    rel(f"{_c}-Juego", "asociacion", _c, "Juego", rol="juego", mult="1")
    rel(f"PantallaJuego-{_c}", "dependencia", "PantallaJuego", _c, nombre="crea")
rel("ComandoMover-Direccion", "asociacion", "ComandoMover", "Direccion", rol="direccion", mult="1")
rel("GrabadoraDePartida-Comando", "agregacion", "GrabadoraDePartida", "Comando", rol="grabados", mult="0..*")
rel("Repeticion-Comando", "asociacion", "Repeticion", "Comando", rol="pendientes", mult="0..*")
rel("PantallaJuego-GrabadoraDePartida", "composicion", "PantallaJuego", "GrabadoraDePartida", rol="grabadora", mult="1")
rel("PantallaJuego-Repeticion", "asociacion", "PantallaJuego", "Repeticion", rol="repeticion", mult="0..1")

# ════════════════════════════════════════════════════════════════════════════
# 3. Modelo UML en formato StarUML (Project -> UMLModel -> paquetes -> clasificadores)
# ════════════════════════════════════════════════════════════════════════════
_IDS = {}


def nuevo_id(clave):
    """Id estable con la forma de StarUML (14 bytes en base64), derivado de una clave única."""
    i = base64.b64encode(hashlib.sha1(clave.encode("utf-8")).digest()[:14]).decode()
    assert _IDS.setdefault(i, clave) == clave, f"id repetido: {clave} / {_IDS[i]}"
    return i


def nuevo_id_libre(clave):
    """False si esa clave ya generó un id (una segunda vista de la misma clase en un diagrama)."""
    return clave not in _IDS.values()


def ref(i):
    return {"$ref": i}


VISIBILIDAD = {"+": "public", "-": "private", "#": "protected", "~": "package"}
SIMBOLO_VIS = {v: k for k, v in VISIBILIDAD.items()}


def partir(texto, sep=","):
    """Separa por comas que no estén dentro de <...> (Map<String, Runnable>)."""
    partes, nivel, actual = [], 0, ""
    for c in texto:
        if c == "<":
            nivel += 1
        elif c == ">":
            nivel -= 1
        if c == sep and nivel == 0:
            partes.append(actual.strip())
            actual = ""
        else:
            actual += c
    if actual.strip():
        partes.append(actual.strip())
    return partes


def leer_miembro(linea):
    estatico = linea.startswith("_")
    linea = linea.lstrip("_")
    vis, resto = VISIBILIDAD[linea[0]], linea[1:].strip()
    if "(" in resto:
        nombre, _, cola = resto.partition("(")
        params, _, ret = cola.rpartition(")")
        ret = ret.strip().lstrip(":").strip()
        lista = []
        for p in partir(params):
            pn, _, pt = p.partition(":")
            lista.append((pn.strip(), pt.strip()))
        return dict(clase="op", nombre=nombre.strip(), vis=vis, estatico=estatico, params=lista, ret=ret or None)
    nombre, _, tipo = resto.partition(":")
    tipo, _, valor = tipo.partition("=")
    return dict(clase="attr", nombre=nombre.strip(), vis=vis, estatico=estatico, tipo=tipo.strip(), valor=valor.strip())


def texto_miembro(m):
    """Texto como lo muestra StarUML: visibilidad pegada al nombre."""
    s = SIMBOLO_VIS[m["vis"]]
    if m["clase"] == "attr":
        t = f"{s}{m['nombre']}: {m['tipo']}"
        return t + (f" = {m['valor']}" if m["valor"] else "")
    ps = ", ".join(f"{n}: {t}" for n, t in m["params"])
    return f"{s}{m['nombre']}({ps})" + (f": {m['ret']}" if m["ret"] else "")


class Modelo:
    def __init__(self):
        self.ids = {}            # nombre de clase -> id del clasificador
        self.paquetes = {}       # "sokoban.vista" -> elemento UMLPackage
        self.elementos = {}      # nombre de clase -> elemento
        self.relaciones = {}     # clave -> (elemento relación, id cola, id cabeza, ids extremos)
        self.proyecto = {"_type": "Project", "_id": nuevo_id("proyecto"), "name": "Sokoban",
                         "ownedElements": [], "author": "Martín, Luca, Pedro, Lucía y Mora",
                         "documentVersion": 8}
        self.raiz = {"_type": "UMLModel", "_id": nuevo_id("modelo"), "_parent": ref(self.proyecto["_id"]),
                     "name": "Modelo", "ownedElements": [], "visibility": "public"}
        self.proyecto["ownedElements"].append(self.raiz)
        self.diagramas = []

    def paquete(self, ruta):
        if ruta in self.paquetes:
            return self.paquetes[ruta]
        if ruta == "javax.swing" or "." not in ruta:
            padre, nombre = self.raiz, ruta
        else:
            base, _, nombre = ruta.rpartition(".")
            padre = self.paquete(base)
        p = {"_type": "UMLPackage", "_id": nuevo_id("paquete:" + ruta), "_parent": ref(padre["_id"]),
             "name": nombre, "ownedElements": [], "visibility": "public"}
        padre["ownedElements"].append(p)
        self.paquetes[ruta] = p
        return p

    def tipo(self, nombre):
        """Tipo real: referencia al clasificador si es una clase del proyecto, si no el texto."""
        return ref(self.ids[nombre]) if nombre in self.ids else nombre

    def construir(self):
        for c in CLASES.values():          # primero los ids, para poder referenciar tipos
            self.ids[c["nombre"]] = nuevo_id("clase:" + c["nombre"])
        for c in CLASES.values():
            self._clasificador(c)
        for r in RELACIONES.values():
            self._relacion(r)

    def _clasificador(self, c):
        tipo_uml = {"clase": "UMLClass", "record": "UMLClass", "externa": "UMLClass",
                    "interfaz": "UMLInterface", "enum": "UMLEnumeration"}[c["tipo"]]
        dueno = self.elementos[c["dentro_de"]] if c["dentro_de"] else self.paquete(c["paquete"])
        e = {"_type": tipo_uml, "_id": self.ids[c["nombre"]], "_parent": ref(dueno["_id"]), "name": c["nombre"]}
        if c["doc"]:
            e["documentation"] = c["doc"]
        e["ownedElements"] = []
        estereo = c["estereotipo"] or ("record" if c["tipo"] == "record" else None)
        if estereo:
            e["stereotype"] = estereo
        e["visibility"] = c["visibilidad"]
        e["isAbstract"] = bool(c["abstracta"])
        e["isFinalSpecialization"] = False
        e["isLeaf"] = bool(c["final"] or c["tipo"] in ("record", "enum"))
        if tipo_uml == "UMLClass":
            e["isActive"] = False
        miembros = [leer_miembro(l) for l in c["miembros"]]
        c["_miembros"] = miembros
        attrs, ops = [], []
        vistos = {}
        for m in miembros:
            n = vistos[m["nombre"]] = vistos.get(m["nombre"], 0) + 1
            clave = f"{c['nombre']}.{m['nombre']}" + (f"#{n}" if n > 1 else "")
            if m["clase"] == "attr":
                a = {"_type": "UMLAttribute", "_id": nuevo_id("attr:" + clave), "_parent": ref(e["_id"]),
                     "name": m["nombre"], "visibility": m["vis"], "isStatic": m["estatico"], "isLeaf": False,
                     "type": self.tipo(m["tipo"]), "isReadOnly": m["estatico"] and m["nombre"].isupper(),
                     "isOrdered": False, "isUnique": False}
                if m["valor"]:
                    a["defaultValue"] = m["valor"]
                a.update({"isDerived": False, "aggregation": "none", "isID": False})
                attrs.append(a)
                m["_id"] = a["_id"]
            else:
                o = {"_type": "UMLOperation", "_id": nuevo_id("op:" + clave), "_parent": ref(e["_id"]),
                     "name": m["nombre"], "visibility": m["vis"], "isStatic": m["estatico"], "isLeaf": False,
                     "parameters": [], "concurrency": "sequential", "isQuery": False,
                     "isAbstract": tipo_uml == "UMLInterface" or m.get("abstracta", False)}
                for k, (pn, pt) in enumerate(m["params"]):
                    o["parameters"].append({"_type": "UMLParameter", "_id": nuevo_id(f"param:{clave}:{pn}:{k}"),
                                            "_parent": ref(o["_id"]), "name": pn, "visibility": "public",
                                            "isStatic": False, "isLeaf": False, "type": self.tipo(pt),
                                            "isReadOnly": False, "isOrdered": False, "isUnique": False,
                                            "direction": "in"})
                if m["ret"]:
                    o["parameters"].append({"_type": "UMLParameter", "_id": nuevo_id(f"param:{clave}:return"),
                                            "_parent": ref(o["_id"]), "visibility": "public", "isStatic": False,
                                            "isLeaf": False, "type": self.tipo(m["ret"]), "isReadOnly": False,
                                            "isOrdered": False, "isUnique": False, "direction": "return"})
                if not o["parameters"]:
                    del o["parameters"]
                ops.append(o)
                m["_id"] = o["_id"]
        if attrs:
            e["attributes"] = attrs
        if ops:
            e["operations"] = ops
        if c["literales"]:
            c["_literales"] = []
            e["literals"] = []
            for lit in c["literales"]:
                li = {"_type": "UMLEnumerationLiteral", "_id": nuevo_id(f"literal:{c['nombre']}.{lit}"),
                      "_parent": ref(e["_id"]), "name": lit, "visibility": "public"}
                e["literals"].append(li)
                c["_literales"].append((lit, li["_id"]))
        dueno["ownedElements"].append(e)
        self.elementos[c["nombre"]] = e

    def _relacion(self, r):
        o, d = self.elementos[r["origen"]], self.elementos[r["destino"]]
        i = nuevo_id("rel:" + r["clave"])
        if r["tipo"] in ("hereda", "implementa", "dependencia"):
            t = {"hereda": "UMLGeneralization", "implementa": "UMLInterfaceRealization",
                 "dependencia": "UMLDependency"}[r["tipo"]]
            e = {"_type": t, "_id": i, "_parent": ref(o["_id"])}
            if r["nombre"]:
                e["name"] = r["nombre"]
            e.update({"source": ref(o["_id"]), "target": ref(d["_id"]), "visibility": "public"})
            if t == "UMLDependency":
                e["mapping"] = ""
            elif t == "UMLGeneralization":
                e["discriminator"] = ""
        else:
            agreg = {"asociacion": "none", "composicion": "composite", "agregacion": "shared"}[r["tipo"]]
            e = {"_type": "UMLAssociation", "_id": i, "_parent": ref(o["_id"])}
            if r["nombre"]:
                e["name"] = r["nombre"]
            e["end1"] = {"_type": "UMLAssociationEnd", "_id": nuevo_id("end1:" + r["clave"]), "_parent": ref(i),
                         "reference": ref(o["_id"]), "visibility": "public", "navigable": "unspecified",
                         "aggregation": agreg, "isReadOnly": False, "isOrdered": False, "isUnique": False,
                         "isDerived": False, "isID": False}
            e["end2"] = {"_type": "UMLAssociationEnd", "_id": nuevo_id("end2:" + r["clave"]), "_parent": ref(i),
                         "name": r["rol"], "reference": ref(d["_id"]), "visibility": "private",
                         "navigable": "navigable", "aggregation": "none", "multiplicity": r["mult"],
                         "isReadOnly": False, "isOrdered": False, "isUnique": False,
                         "isDerived": False, "isID": False}
            if not r["rol"]:
                del e["end2"]["name"]
                e["end2"]["visibility"] = "public"
            e.update({"visibility": "public", "isDerived": False})
        o["ownedElements"].append(e)
        self.relaciones[r["clave"]] = e

# ════════════════════════════════════════════════════════════════════════════
# 4. Medidas del texto (Arial 12, tabla de anchos de Liberation Sans, métrica de Arial)
# ════════════════════════════════════════════════════════════════════════════
_REGULAR = {191: "'", 222: 'ijl', 260: '|', 278: ' !,./:;I[\\]ftíÍ', 333: '()-`r·¡', 334: '{}', 355: '"',
            389: '*', 469: '^', 500: 'Jcksvxyz', 556: '#$0123456789?L_abdeghnopquáéóúñü«»', 584: '+<=>~',
            611: 'FTZ¿', 667: '&ABEKPSVXYÁÉ', 722: 'CDHNRUwÚÑÜ', 778: 'GOQÓ', 833: 'Mm', 889: '%', 944: 'W',
            1015: '@'}
_NEGRITA = {238: "'", 278: ' ,./I\\ijlíÍ', 280: '|', 333: '!()-:;[]`ft·¡', 389: '*r{}', 474: '"', 500: 'z',
            556: '#$0123456789J_aceksvxyáé«»', 584: '+<=>^~', 611: '?FLTZbdghnopquóúñü¿', 667: 'EPSVXYÉ',
            722: '&ABCDHKNRUÁÚÑÜ', 778: 'GOQwÓ', 833: 'M', 889: '%m', 944: 'W', 975: '@'}
_ANCHOS = {f: {c: w for w, cs in t.items() for c in cs} for f, t in (("r", _REGULAR), ("b", _NEGRITA))}
TAM = 12                     # tamaño de letra de todo el diagrama
FUENTE = f"Arial;{TAM};0"


def ancho(texto, negrita=False):
    t = _ANCHOS["b" if negrita else "r"]
    return sum(t.get(c, 600) for c in texto) * TAM / 1000


# Constantes de dibujo de StarUML 8 (medidas sobre su propia exportación a SVG)
LINEA = 14          # alto de cada renglón de un compartimento
PAD = 4             # relleno arriba y abajo de cada compartimento con renglones
NOMBRE_ALTO = 24    # compartimento del nombre sin estereotipo
ESTEREO_ALTO = 12   # renglón extra del «estereotipo»
MARGEN_ANCHO = 16   # aire a los lados del texto más ancho (StarUML usa 5 + 5)

# ════════════════════════════════════════════════════════════════════════════
# 5. Vistas (mismos campos y orden que guarda StarUML)
# ════════════════════════════════════════════════════════════════════════════
COLORES = {  # relleno, borde
    "luca": ("#DAE8FC", "#6C8EBF"),
    "martin": ("#D5E8D4", "#82B366"),
    "integ": ("#FFF2CC", "#D6B656"),
    "dominio": ("#FCDDC7", "#C8683A"),
    "sonido": ("#EEDDF3", "#A0559F"),
    "swing": ("#F5F5F5", "#9E9E9E"),
}
TINTA = "#000000"
COLOR_LINEA = {"hereda": "#7B3FA0", "implementa": "#7B3FA0", "dependencia": "#5F5650",
               "asociacion": "#000000", "composicion": "#000000", "agregacion": "#000000"}


def _base(tipo, clave, padre, modelo=None, linea=TINTA, relleno="#FFFFFF", texto=TINTA, estilo_padre=True,
          contenedor_cambiable=False, visible=True):
    v = {"_type": tipo, "_id": nuevo_id(clave), "_parent": ref(padre)}
    if modelo:
        v["model"] = ref(modelo)
    v.update({"visible": visible, "enabled": True, "lineColor": linea, "fillColor": relleno, "fontColor": texto,
              "font": FUENTE, "parentStyle": estilo_padre, "showShadow": False,
              "containerChangeable": contenedor_cambiable, "containerExtending": True})
    return v


def _nodo(v, x, y, w, h):
    v.update({"left": round(x), "top": round(y), "width": round(w), "height": round(h), "autoResize": False})
    return v


def _etiqueta(clave, padre, x, y, w, texto="", visible=True, negrita=False, alineacion=2, subrayado=False,
              tipo="LabelView", modelo=None, fuente=None):
    v = _base(tipo, clave, padre, modelo=modelo, visible=visible)
    if negrita or fuente:
        v["font"] = fuente or f"Arial;{TAM};1"
    if tipo != "LabelView":
        v["containerChangeable"] = False
    _nodo(v, x, y, w, TAM)
    v["underline"] = subrayado
    if texto:
        v["text"] = texto
    v["horizontalAlignment"] = alineacion
    v["verticalAlignment"] = 5
    return v


def _compartimento_nombre(clave, padre, modelo, x, y, w, nombre, estereo, h):
    c = _base("UMLNameCompartmentView", clave + ":nombre", padre, modelo)
    _nodo(c, x, y, w, h)
    yy = y + 6
    l_est = _etiqueta(clave + ":estereotipo", c["_id"], x + 5, yy, w - 10, f"«{estereo}»" if estereo else "",
                      visible=bool(estereo))
    if estereo:
        yy += ESTEREO_ALTO
    l_nom = _etiqueta(clave + ":nombretxt", c["_id"], x + 5, yy, w - 10, nombre, negrita=True)
    l_ns = _etiqueta(clave + ":namespace", c["_id"], x, y, w, "", visible=False, fuente=f"Arial;{TAM * 0.9:g};0")
    l_prop = _etiqueta(clave + ":propiedad", c["_id"], x, y, w, "", visible=False, alineacion=1)
    c["subViews"] = [l_est, l_nom, l_ns, l_prop]
    c.update({"stereotypeLabel": ref(l_est["_id"]), "nameLabel": ref(l_nom["_id"]),
              "namespaceLabel": ref(l_ns["_id"]), "propertyLabel": ref(l_prop["_id"])})
    return c


def _compartimento_lista(tipo, tipo_item, clave, padre, modelo, x, y, w, items, visible=True):
    """items: lista de (id del modelo, texto, subrayado)."""
    c = _base(tipo, clave, padre, modelo, visible=visible)
    h = len(items) * LINEA + 2 * PAD if items else 10
    _nodo(c, x, y, w, h)
    subs = []
    for k, (mid, txt, sub) in enumerate(items):
        subs.append(_etiqueta(f"{clave}:{k}", c["_id"], x + PAD, y + PAD + k * LINEA, w - 2 * PAD, txt,
                              alineacion=0, subrayado=sub, tipo=tipo_item, modelo=mid))
    if subs:
        c["subViews"] = subs
    return c, (h if visible else 0)


class Caja:
    """Vista de un clasificador (clase, interfaz, enum o record) con sus compartimentos."""

    def __init__(self, diagrama, nombre, x, y, w=None, solo=None, sin_miembros=False, sin_ops=False, color=None):
        c = CLASES[nombre]
        self.nombre, self.c = nombre, c
        self.modelo_id = diagrama.modelo.ids[nombre]
        clave = f"{diagrama.clave}/{nombre}"
        while nuevo_id_libre(clave) is False:
            clave += "+"
        # Siempre van todas las vistas de los miembros (StarUML las crea igual al abrir el archivo).
        # StarUML dibuja un compartimento entero o nada: `solo` elige qué compartimentos se ven
        # (los que tienen alguno de esos nombres), `sin_ops` oculta las operaciones y
        # `sin_miembros` deja solo el nombre.
        miembros = c.get("_miembros", [])
        attrs = [(m["_id"], texto_miembro(m), m["estatico"]) for m in miembros if m["clase"] == "attr"]
        ops = [(m["_id"], texto_miembro(m), m["estatico"]) for m in miembros if m["clase"] == "op"]
        lits = [(i, n, False) for n, i in c.get("_literales", [])]
        elegidas = {m["clase"] for m in miembros if solo is not None and m["nombre"] in solo}
        if sin_miembros:
            ver_attrs = ver_ops = ver_lits = False
        else:
            ver_lits = bool(lits)
            ver_attrs = (bool(attrs) or c["tipo"] in ("clase", "record")) if solo is None else "attr" in elegidas
            ver_ops = (bool(ops) or c["tipo"] == "clase") if solo is None and not sin_ops else \
                ("op" in elegidas and not sin_ops)
        tipo = c["tipo"]
        estereo = {"interfaz": "interface", "enum": "enumeration"}.get(tipo) or c["estereotipo"] or \
            ("record" if tipo == "record" else None)
        textos = [t for _, t, _ in (attrs if ver_attrs else []) + (ops if ver_ops else []) + (lits if ver_lits else [])]
        minimo = max([ancho(t) for t in textos] + [ancho(nombre, True), ancho(f"«{estereo}»" if estereo else "")])
        self.w = w or math.ceil(minimo + MARGEN_ANCHO)
        self.x, self.y = x, y
        alto_nombre = NOMBRE_ALTO + (ESTEREO_ALTO if estereo else 0)
        vista = {"interfaz": "UMLInterfaceView", "enum": "UMLEnumerationView"}.get(tipo, "UMLClassView")
        relleno, borde = COLORES[color or c["autor"]]
        v = _base(vista, clave, diagrama.id, self.modelo_id, linea=borde, relleno=relleno, estilo_padre=False,
                  contenedor_cambiable=True)
        self.id = v["_id"]
        yy = y
        nom = _compartimento_nombre(clave, self.id, self.modelo_id, x, yy, self.w, nombre, estereo, alto_nombre)
        yy += alto_nombre
        subs = [nom]
        alto = alto_nombre
        lit_comp = None
        if vista == "UMLEnumerationView":
            lit_comp, h = _compartimento_lista("UMLEnumerationLiteralCompartmentView", "UMLEnumerationLiteralView",
                                               clave + ":literales", self.id, self.modelo_id, x, yy, self.w, lits,
                                               visible=ver_lits)
            yy += h
            alto += h
        mostrar_attrs = ver_attrs
        at, h = _compartimento_lista("UMLAttributeCompartmentView", "UMLAttributeView", clave + ":atributos",
                                     self.id, self.modelo_id, x, yy, self.w, attrs, visible=mostrar_attrs)
        yy += h
        alto += h
        mostrar_ops = ver_ops
        op, h = _compartimento_lista("UMLOperationCompartmentView", "UMLOperationView", clave + ":operaciones",
                                     self.id, self.modelo_id, x, yy, self.w, ops, visible=mostrar_ops)
        alto += h
        rec = _base("UMLReceptionCompartmentView", clave + ":recepciones", self.id, self.modelo_id, visible=False)
        _nodo(rec, x, y, 10, 10)
        tpl = _base("UMLTemplateParameterCompartmentView", clave + ":plantilla", self.id, self.modelo_id,
                    visible=False)
        _nodo(tpl, x, y, 10, 10)
        subs += [at, op, rec, tpl] + ([lit_comp] if lit_comp else [])
        self.h = alto
        v["subViews"] = subs
        _nodo(v, x, y, self.w, self.h)
        v.update({"stereotypeDisplay": "label", "showVisibility": True, "showNamespace": False,
                  "showProperty": False, "showType": True, "nameCompartment": ref(nom["_id"]), "wordWrap": False,
                  "suppressAttributes": not mostrar_attrs, "suppressOperations": not mostrar_ops,
                  "suppressReceptions": True, "showMultiplicity": True, "showOperationSignature": True,
                  "attributeCompartment": ref(at["_id"]), "operationCompartment": ref(op["_id"]),
                  "receptionCompartment": ref(rec["_id"]), "templateParameterCompartment": ref(tpl["_id"])})
        if lit_comp:
            v.update({"suppressLiterals": not ver_lits, "enumerationLiteralCompartment": ref(lit_comp["_id"])})
        self.vista = v
        diagrama.agregar(v, self)

    def punto(self, lado, f=0.5):
        if lado == "top":
            return (self.x + self.w * f, self.y)
        if lado == "bottom":
            return (self.x + self.w * f, self.y + self.h)
        if lado == "left":
            return (self.x, self.y + self.h * f)
        return (self.x + self.w, self.y + self.h * f)


class Diagrama:
    def __init__(self, modelo, clave, nombre, defecto=False, doc=""):
        self.modelo, self.clave = modelo, clave
        self.id = nuevo_id("diagrama:" + clave)
        self.elemento = {"_type": "UMLClassDiagram", "_id": self.id, "_parent": ref(modelo.raiz["_id"]),
                         "name": nombre}
        if doc:
            self.elemento["documentation"] = doc
        self.elemento.update({"visible": True, "defaultDiagram": defecto, "ownedViews": []})
        self.fondos, self.cajas_v, self.lineas, self.encima = [], [], [], []
        self.cajas, self.paquetes = {}, {}
        modelo.raiz["ownedElements"].insert(len(modelo.diagramas), self.elemento)
        modelo.diagramas.append(self)

    def agregar(self, vista, caja):
        self.cajas_v.append(vista)
        self.cajas[caja.nombre] = caja

    # ── nodos ──
    def caja(self, nombre, x, y, **k):
        return Caja(self, nombre, x, y, **k)

    def paquete(self, ruta, x, y, w, h, color=None):
        p = self.modelo.paquete(ruta)
        relleno, borde = color or ("#FFFFFF", "#8A7F76")
        v = _base("UMLPackageView", f"{self.clave}/paquete:{ruta}", self.id, p["_id"], linea=borde,
                  relleno=relleno, estilo_padre=False, contenedor_cambiable=True)
        nom = _compartimento_nombre(f"{self.clave}/paquete:{ruta}", v["_id"], p["_id"], x, y + 10, ancho(ruta, True) + 20,
                                    p["name"], None, 25)
        v["subViews"] = [nom]
        _nodo(v, x, y, w, h)
        v.update({"stereotypeDisplay": "label", "showVisibility": True, "showNamespace": False,
                  "showProperty": True, "showType": True, "nameCompartment": ref(nom["_id"]), "wordWrap": False})
        self.fondos.append(v)
        self.paquetes[ruta] = (v, (x, y, w, h))
        return v

    def nota(self, texto, x, y, w, h=None, color="#FFFDE7", borde="#B8892A", unir=None):
        """Nota con el alto justo para su texto (h solo sirve para pedir una nota más alta)."""
        renglones = sum(max(1, math.ceil(ancho(p) / (w - 24))) for p in texto.split("\n"))
        h = max(h or 0, renglones * 13 + 14)
        v = _base("UMLNoteView", f"{self.clave}/nota:{texto[:40]}:{x}:{y}", self.id, linea=borde, relleno=color,
                  estilo_padre=False)
        _nodo(v, x, y, w, h)
        v.update({"text": texto, "wordWrap": True, "horzAlign": 0, "vertAlign": 3})
        self.encima.append(v)
        for nombre in unir or []:
            c = self.cajas[nombre]
            l = _base("UMLNoteLinkView", f"{self.clave}/notalink:{texto[:30]}:{nombre}", self.id, linea=borde,
                      estilo_padre=False)
            cx = min(max(x + w / 2, c.x + 10), c.x + c.w - 10)
            l.update({"head": ref(c.id), "tail": ref(v["_id"]), "lineStyle": 1,
                      "points": f"{cx:g}:{y + h / 2:g};{cx:g}:{c.y + c.h / 2:g}"})
            self.lineas.append(l)
        return v

    def texto(self, texto, x, y, w, h=None, negrita=False, tam=None, color=TINTA):
        """Texto suelto (UMLTextView), por ejemplo títulos."""
        v = _base("UMLTextView", f"{self.clave}/texto:{texto[:40]}:{x}:{y}", self.id, texto=color,
                  estilo_padre=False)
        v["font"] = f"Arial;{tam or TAM};{1 if negrita else 0}"
        v["fillColor"] = "#FFFFFF"
        _nodo(v, x, y, w, h or (tam or TAM) + 8)
        v.update({"text": texto, "wordWrap": True, "horzAlign": 0, "vertAlign": 3})
        self.encima.append(v)
        return v

    # ── líneas ──
    def rel(self, clave, de="right", a="left", fo=0.5, fd=0.5, via=None, pos=None):
        """Dibuja la relación `clave`. de/a: lado de salida y de llegada; fo/fd: fracción sobre ese lado
        (o coordenada absoluta si es > 1); via: puntos intermedios (si no, se arma un codo)."""
        r = RELACIONES[clave]
        co, cd = self.cajas[r["origen"]], self.cajas[r["destino"]]
        fo = self._frac(co, de, fo)
        fd = self._frac(cd, a, fd)
        p1, p2 = co.punto(de, fo), cd.punto(a, fd)
        if via is None:
            via = _codo(p1, de, p2, a)
        pts = [p1] + [tuple(p) for p in via] + [p2]
        self.lineas.append(_vista_relacion(self, r, co, cd, pts))

    @staticmethod
    def _frac(caja, lado, f):
        if f <= 1:
            return f
        if lado in ("top", "bottom"):
            return (f - caja.x) / caja.w
        return (f - caja.y) / caja.h

    def json(self):
        # contención de las vistas: cada caja dentro del paquete más chico que la contiene
        for caja in self.cajas.values():
            mejor = None
            for ruta, (pv, (x, y, w, h)) in self.paquetes.items():
                if x <= caja.x and y <= caja.y and caja.x + caja.w <= x + w and caja.y + caja.h <= y + h:
                    if mejor is None or w * h < mejor[1]:
                        mejor = (pv, w * h)
            if mejor:
                caja.vista["containerView"] = ref(mejor[0]["_id"])
                mejor[0].setdefault("containedViews", []).append(ref(caja.id))
        for ruta, (pv, (x, y, w, h)) in self.paquetes.items():
            mejor = None
            for ruta2, (pv2, (x2, y2, w2, h2)) in self.paquetes.items():
                if pv2 is not pv and x2 <= x and y2 <= y and x + w <= x2 + w2 and y + h <= y2 + h2:
                    if mejor is None or w2 * h2 < mejor[1]:
                        mejor = (pv2, w2 * h2)
            if mejor:
                pv["containerView"] = ref(mejor[0]["_id"])
                mejor[0].setdefault("containedViews", []).append(ref(pv["_id"]))
        for v in self.fondos + self.cajas_v + self.encima:
            _ordenar_campos(v)
        self.elemento["ownedViews"] = self.fondos + self.cajas_v + self.lineas + self.encima
        return self.elemento


def _ordenar_campos(v):
    """containerView y containedViews van justo después de subViews, como en StarUML."""
    orden = ["_type", "_id", "_parent", "model", "subViews", "containerView", "containedViews"]
    copia = dict(v)
    v.clear()
    for k in orden:
        if k in copia:
            v[k] = copia.pop(k)
    v.update(copia)


def _codo(p1, de, p2, a):
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


def _etiqueta_linea(clave, padre, modelo, alpha, distancia, posicion, texto="", visible=True, x=0, y=0):
    v = _base("EdgeLabelView", clave, padre, modelo, visible=visible, estilo_padre=False)
    _nodo(v, x, y, ancho(texto) if texto else 0, TAM)
    v.update({"alpha": alpha, "distance": distancia, "hostEdge": ref(padre), "edgePosition": posicion,
              "underline": False})
    if texto:
        v["text"] = texto
    v.update({"horizontalAlignment": 2, "verticalAlignment": 5})
    return v


def _vista_relacion(d, r, co, cd, pts):
    tipo = r["tipo"]
    modelo = d.modelo.relaciones[r["clave"]]
    vista = {"hereda": "UMLGeneralizationView", "implementa": "UMLInterfaceRealizationView",
             "dependencia": "UMLDependencyView"}.get(tipo, "UMLAssociationView")
    clave = f"{d.clave}/rel:{r['clave']}"
    v = _base(vista, clave, d.id, modelo["_id"], linea=COLOR_LINEA[tipo], estilo_padre=False)
    i = v["_id"]
    mx, my = _medio(pts)
    pi2 = math.pi / 2
    nombre = _etiqueta_linea(clave + ":nombre", i, modelo["_id"], pi2, 15, 1, r["nombre"], bool(r["nombre"]), mx, my)
    estereo = _etiqueta_linea(clave + ":estereotipo", i, modelo["_id"], pi2, 30, 1, visible=False, x=mx, y=my)
    prop = _etiqueta_linea(clave + ":propiedad", i, modelo["_id"], -pi2, 15, 1, visible=False, x=mx, y=my)
    subs = [nombre, estereo, prop]
    v["subViews"] = subs
    v.update({"head": ref(cd.id), "tail": ref(co.id), "lineStyle": 0,
              "points": ";".join(f"{x:g}:{y:g}" for x, y in ((round(a, 1), round(b, 1)) for a, b in pts)),
              "stereotypeDisplay": "label", "showVisibility": False, "showProperty": True,
              "nameLabel": ref(nombre["_id"]), "stereotypeLabel": ref(estereo["_id"]), "propertyLabel": ref(prop["_id"])})
    if vista == "UMLAssociationView":
        e1, e2 = modelo["end1"]["_id"], modelo["end2"]["_id"]
        hx, hy = pts[-1]
        tx, ty = pts[0]
        rol = r["rol"]
        etiquetas = [
            ("tailRoleNameLabel", e1, math.pi / 6, 30, 2, "", False, tx, ty),
            ("tailPropertyLabel", e1, math.pi / 4, 40, 2, "", False, tx, ty),
            ("tailMultiplicityLabel", e1, -math.pi / 6, 25, 2, "", False, tx, ty),
            # rol un poco más lejos de la punta que la multiplicidad, cada uno de un lado de la línea
            ("headRoleNameLabel", e2, -math.pi / 5, 26 + ancho(rol) / 2, 0, rol, bool(rol), hx, hy),
            ("headPropertyLabel", e2, -math.pi / 4, 40, 0, "", False, hx, hy),
            ("headMultiplicityLabel", e2, math.pi / 5, 20, 0, r["mult"], bool(r["mult"]), hx, hy),
        ]
        for campo, mid, alpha, dist, posicion, txt, vis, x, y in etiquetas:
            et = _etiqueta_linea(f"{clave}:{campo}", i, mid, alpha, dist, posicion, txt, vis, x, y)
            subs.append(et)
            v[campo] = ref(et["_id"])
        v["showMultiplicity"] = True
        v["showType"] = True
        for campo in ("tailQualifiersCompartment", "headQualifiersCompartment"):
            q = _base("UMLQualifierCompartmentView", f"{clave}:{campo}", i, e1 if campo.startswith("tail") else e2,
                      visible=False)
            _nodo(q, hx, hy, 10, 10)
            subs.append(q)
            v[campo] = ref(q["_id"])
    return v


def _medio(pts):
    mejor, largo = 0, -1
    for k in range(len(pts) - 1):
        l = abs(pts[k + 1][0] - pts[k][0]) + abs(pts[k + 1][1] - pts[k][1])
        if l > largo:
            mejor, largo = k, l
    (x1, y1), (x2, y2) = pts[mejor], pts[mejor + 1]
    return ((x1 + x2) / 2, (y1 + y2) / 2)

# ════════════════════════════════════════════════════════════════════════════
# 6. Escritura
# ════════════════════════════════════════════════════════════════════════════
def _limpiar(o):
    """StarUML no guarda listas vacías."""
    if isinstance(o, dict):
        for k in [k for k, v in o.items() if isinstance(v, list) and not v]:
            del o[k]
        for v in o.values():
            _limpiar(v)
    elif isinstance(o, list):
        for v in o:
            _limpiar(v)


def _verificar(proyecto):
    """Cada $ref apunta a un _id existente y cada _parent al dueño real."""
    ids, refs = {}, []

    def walk(o, padre):
        if isinstance(o, dict):
            if "_id" in o:
                assert o["_id"] not in ids, "id repetido " + o["_id"]
                ids[o["_id"]] = o
                if padre is not None:
                    assert o.get("_parent") == ref(padre["_id"]), f"_parent mal en {o['_type']} {o.get('name')}"
                padre = o
            for k, v in o.items():
                if k == "_parent":
                    continue
                if isinstance(v, dict) and set(v) == {"$ref"}:
                    refs.append((o.get("_type"), k, v["$ref"]))
                else:
                    walk(v, padre)
        elif isinstance(o, list):
            for v in o:
                if isinstance(v, dict) and set(v) == {"$ref"}:
                    refs.append(("lista", "", v["$ref"]))
                else:
                    walk(v, padre)

    walk(proyecto, None)
    malas = [r for r in refs if r[2] not in ids]
    assert not malas, f"referencias rotas: {malas[:5]}"
    return len(ids), len(refs)


def generar(diagramas, salida=SALIDA):
    _IDS.clear()
    m = Modelo()
    m.construir()
    for fn in diagramas:
        fn(m)
    for d in m.diagramas:
        d.json()
    _limpiar(m.proyecto)
    n_ids, n_refs = _verificar(m.proyecto)
    with open(salida, "w", encoding="utf-8") as f:
        json.dump(m.proyecto, f, ensure_ascii=False, indent="\t")
    print(f"{salida}: {len(CLASES)} clasificadores, {len(RELACIONES)} relaciones, "
          f"{len(m.diagramas)} diagramas, {n_ids} elementos, {n_refs} referencias verificadas")
    return m

# ════════════════════════════════════════════════════════════════════════════
# 7. Diagrama de clases completo
# ════════════════════════════════════════════════════════════════════════════
PAQ_VISTA = ("#F7F9FD", "#6C8EBF")
PAQ_MODELO = ("#FEFAF6", "#C8683A")
PAQ_SONIDO = ("#FBF7FC", "#A0559F")
PAQ_RAIZ = ("#FFFFFF", "#8A7F76")
PAQ_SUB = ("#FFF4EC", "#C8683A")
PAQ_MARTIN = ("#F6FBF5", "#82B366")

AUTORES = [
    ("luca", "Luca: interfaz gráfica Swing (sokoban.vista), el contrato vista/dominio (Juego, ObservadorJuego, EstadoJuego, Direccion) y la auditoría (JuegoDecorado, PanelAyuda)."),
    ("dominio", "Pedro y Lucía: dominio y personaje (JuegoSokoban, niveles, entidades, Strategy, Mediator)."),
    ("sonido", "Mora: sonido (sokoban.sonido: Decorator, Singleton + Facade, State)."),
    ("martin", "Martín: arte (assets/) y las funcionalidades adicionales: DeLorean (Memento: RecuerdoNivel, MaquinaDelTiempo) y repetición de la partida (Command: sokoban.comandos)."),
    ("integ", "Integración del arte de Martín con la interfaz de Luca (Epoca: fondo, piso y pared de cada nivel)."),
    ("swing", "Biblioteca de Java (javax.swing): solo para mostrar la herencia."),
]


def leyenda(d, x, y, w=640):
    v = d.nota("Quién hizo cada parte (color de relleno de cada clase)", x, y, w, color="#FFFFFF", borde="#8A7F76")
    y += v["height"] + 8
    for autor, txt in AUTORES:
        relleno, borde = COLORES[autor]
        v = d.nota(txt, x, y, w, color=relleno, borde=borde)
        y += v["height"] + 8
    return y


def arbol(d, hijos, padre, clave_fmt="{}-{}", sep=40):
    """Realizaciones o herencias que se juntan en un tronco y llegan al centro de abajo del padre."""
    p = d.cajas[padre]
    tronco = p.y + p.h + sep
    for h in hijos:
        k = d.cajas[h]
        d.rel(clave_fmt.format(h, padre), "top", "bottom", k.x + k.w / 2, 0.5,
              via=[(k.x + k.w / 2, tronco), (p.x + p.w / 2, tronco)])


def fila(d, nombres, x, y, sep=30, **k):
    for n in nombres:
        c = d.caja(n, x, y, **k)
        x += c.w + sep


def diagrama_completo(m):
    d = Diagrama(m, "completo", "Diagrama de clases completo", defecto=True,
                 doc="Todas las clases, interfaces, enums y records del proyecto, agrupados por paquete.")
    # ── paquetes ──
    d.paquete("javax.swing", 20, 190, 160, 640, PAQ_RAIZ)
    d.paquete("sokoban", 200, 20, 3460, 1880, PAQ_RAIZ)
    d.paquete("sokoban.vista", 215, 150, 1025, 1270, PAQ_VISTA)
    d.paquete("sokoban.comandos", 215, 1450, 1025, 410, PAQ_MARTIN)
    d.paquete("sokoban.sonido", 1305, 150, 2340, 600, PAQ_SONIDO)
    d.paquete("sokoban.modelo", 1290, 765, 2355, 1115, PAQ_MODELO)
    d.paquete("sokoban.modelo.entidades", 2420, 1205, 850, 280, PAQ_SUB)
    d.paquete("sokoban.modelo.estrategias", 2440, 1535, 480, 265, PAQ_SUB)
    d.paquete("sokoban.modelo.movimiento", 3320, 805, 300, 560, PAQ_SUB)
    d.paquete("sokoban.modelo.tiempo", 1330, 1640, 400, 210, PAQ_MARTIN)
    # ── clases ──
    d.caja("JFrame", 40, 230, w=110)
    d.caja("JPanel", 40, 760, w=110)
    d.caja("Main", 720, 50)
    # vista
    d.caja("VentanaPrincipal", 560, 190)
    d.caja("MenuPrincipal", 240, 380)
    d.caja("PantallaJuego", 740, 380)
    d.caja("Cartel", 240, 540)
    d.caja("PanelAyuda", 240, 720)
    d.caja("PanelTablero", 240, 900)
    d.caja("PanelHUD", 665, 900)
    d.caja("Epoca", 240, 1180)
    d.caja("Imagenes", 470, 1180)
    # comandos
    d.caja("GrabadoraDePartida", 300, 1490)
    d.caja("Comando", 620, 1500)
    d.caja("Repeticion", 860, 1490)
    d.caja("ComandoMover", 240, 1710)
    d.caja("ComandoDeshacer", 575, 1710)
    d.caja("ComandoViajarEnElTiempo", 815, 1710)
    # sonido
    d.caja("JuegoConSonido", 1330, 190)
    d.caja("Sonidos", 1850, 190)
    d.caja("EstadoSonido", 2310, 200)
    d.caja("SonidoActivado", 2230, 330)
    d.caja("SonidoSilenciado", 2420, 330)
    d.caja("Sonido", 1850, 420)
    d.caja("SonidosDeInterfaz", 2350, 500)
    # modelo: contrato
    d.caja("Juego", 1310, 800)
    d.caja("JuegoDecorado", 1700, 790)
    d.caja("ObservadorJuego", 1310, 1060)
    d.caja("EstadoJuego", 1720, 1060)
    d.caja("Direccion", 1310, 1220)
    # modelo: dominio
    d.caja("JuegoSokoban", 2150, 810)
    d.caja("RecuerdoNivel", 1400, 1440)
    d.caja("MaquinaDelTiempo", 1360, 1685)
    d.caja("CargadorNivel", 2440, 810)
    d.caja("EstadoNivel", 2770, 810)
    d.caja("MotorMovimiento", 3350, 840)
    d.caja("MediadorMovimiento", 3335, 1240)
    d.caja("Caja", 2440, 1240)
    d.caja("Jugador", 2920, 1240)
    d.caja("Posicion", 3000, 1560)
    d.caja("ComportamientoCaja", 2460, 1580)
    fila(d, ["CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"], 2470, 1730, 25)
    C = d.cajas
    R = d.rel

    # ── herencia de Swing (las flechas se juntan en un tronco, x = 165) ──
    R("VentanaPrincipal-JFrame", "left", "right", 242, 0.5)
    jp = C["JPanel"].y + C["JPanel"].h / 2
    for clase_, y in (("MenuPrincipal", 415), ("PantallaJuego", 505), ("Cartel", 600), ("PanelAyuda", 760),
                      ("PanelTablero", 1000)):
        R(f"{clase_}-JPanel", "left", "right", y, 0.5, via=[(165, y), (165, jp)])
    R("PanelHUD-JPanel", "top", "right", 690, 0.5, via=[(690, 870), (165, 870), (165, jp)])
    # ── Main ──
    R("Main-VentanaPrincipal", "left", "top", 85, 655)
    R("Main-JuegoConSonido", "right", "top", 70, 1520)
    R("Main-SonidosDeInterfaz", "right", "top", 90, 2580)
    R("Main-JuegoSokoban", "right", "top", 108, 2170, via=[(1800, 108), (1800, 757), (2170, 757)])
    R("Main-CargadorNivel", "right", "top", 108, 2600, via=[(1800, 108), (1800, 757), (2600, 757)])
    # ── vista ──
    R("VentanaPrincipal-MenuPrincipal", "left", "top", 290, 450)
    R("VentanaPrincipal-PantallaJuego", "right", "top", 290, 975)
    R("MenuPrincipal-Cartel", "bottom", "top", 400, 400)
    R("MenuPrincipal-PanelAyuda", "bottom", "right", 694, 780, via=[(694, 780)])
    R("PantallaJuego-Cartel", "left", "right", 600, 600)
    R("PantallaJuego-PanelTablero", "bottom", "top", 760, 560, via=[(760, 850), (560, 850)])
    R("PantallaJuego-PanelHUD", "bottom", "top", 1000, 1000)
    R("PanelTablero-Epoca", "bottom", "top", 330, 330)
    R("PanelTablero-Imagenes", "bottom", "top", 560, 560)
    R("PanelHUD-Imagenes", "bottom", "top", 760, 760)
    im = C["Imagenes"]
    R("Imagenes-instancia", "right", "right", im.y + 30, im.y + 70,
      via=[(im.x + im.w + 40, im.y + 30), (im.x + im.w + 40, im.y + 70)])
    # vista -> modelo
    R("PantallaJuego-Juego", "right", "left", 420, 840, via=[(1250, 420), (1250, 840)])
    R("PanelTablero-ObservadorJuego", "right", "left", 1090, 1090)
    R("PanelHUD-ObservadorJuego", "bottom", "left", 1150, 1090, via=[(1150, 1090)])
    R("PanelTablero-Direccion", "bottom", "left", 610, 1300, via=[(610, 1150), (1275, 1150), (1275, 1300)])
    # vista -> comandos
    R("PantallaJuego-GrabadoraDePartida", "right", "top", 740, 400, via=[(1222, 740), (1222, 1470), (400, 1470)])
    R("PantallaJuego-Repeticion", "right", "right", 760, 1570, via=[(1232, 760), (1232, 1570)])
    # ── comandos ──
    R("GrabadoraDePartida-Comando", "right", "left", 1530, 1530)
    R("Repeticion-Comando", "left", "right", 1530, 1530)
    arbol(d, ["ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"], "Comando", sep=C["ComandoMover"].y - 30
          - C["Comando"].y - C["Comando"].h)
    R("ComandoViajarEnElTiempo-Juego", "right", "left", 1745, 910, via=[(1260, 1745), (1260, 910)])
    for s in ("ComandoMover", "ComandoDeshacer"):
        k = C[s]
        R(f"{s}-Juego", "bottom", "left", k.x + k.w - 40, 910, via=[(k.x + k.w - 40, 1820), (1260, 1820), (1260, 910)])
    R("ComandoMover-Direccion", "bottom", "left", 300, 1350, via=[(300, 1838), (1290, 1838), (1290, 1350)])
    # ── contrato ──
    R("Juego-ObservadorJuego", "bottom", "top", 1360, 1360)
    R("Juego-EstadoJuego", "bottom", "left", 1590, 1080, via=[(1590, 1080)])
    R("ObservadorJuego-EstadoJuego", "right", "left", 1105, 1105)
    R("JuegoDecorado-Juego", "left", "right", 830, 830)
    R("JuegoDecorado-juego", "left", "right", 890, 890)
    # ── sonido ──
    R("JuegoConSonido-JuegoDecorado", "bottom", "top", 1740, 1740)
    R("JuegoConSonido-Sonidos", "right", "left", 230, 230)
    R("JuegoConSonido-Sonido", "right", "left", 445, 445)
    R("Sonidos-EstadoSonido", "right", "left", 235, 235)
    so = C["Sonidos"]
    R("Sonidos-instancia", "top", "top", so.x + 40, so.x + 100,
      via=[(so.x + 40, so.y - 22), (so.x + 100, so.y - 22)])
    R("Sonidos-Sonido", "bottom", "top", 1920, 1920)
    arbol(d, ["SonidoActivado", "SonidoSilenciado"], "EstadoSonido", sep=22)
    R("SonidoActivado-Sonidos", "left", "right", 352, 352)
    sil = C["SonidoSilenciado"]
    R("SonidoSilenciado-Sonidos", "bottom", "right", sil.x + 40, 388, via=[(sil.x + 40, 388)])
    R("SonidosDeInterfaz-Sonidos", "left", "bottom", 525, 2100, via=[(2100, 525)])
    R("SonidosDeInterfaz-Sonido", "left", "right", 580, 580)
    # ── dominio ──
    R("JuegoSokoban-Juego", "left", "right", 1020, 940, via=[(1680, 1020), (1680, 940)])
    R("JuegoSokoban-EstadoJuego", "left", "right", 1150, 1150)
    R("JuegoSokoban-observadores", "bottom", "bottom", 2170, 1480, via=[(2170, 1300), (1480, 1300)])
    R("JuegoSokoban-RecuerdoNivel", "bottom", "right", 2230, 1480, via=[(2230, 1480)])
    R("JuegoSokoban-MaquinaDelTiempo", "bottom", "right", 2290, 1760, via=[(2290, 1760)])
    R("MaquinaDelTiempo-RecuerdoNivel", "top", "bottom", 1480, 1480)
    R("RecuerdoNivel-EstadoNivel", "right", "bottom", 1560, 2780, via=[(2406, 1560), (2406, 1185), (2780, 1185)])
    R("JuegoSokoban-CargadorNivel", "right", "left", 850, 850)
    R("CargadorNivel-EstadoNivel", "right", "left", 850, 850)
    R("JuegoSokoban-EstadoNivel", "right", "left", 1080, 1080)
    R("JuegoSokoban-MediadorMovimiento", "top", "right", 2200, 1290, via=[(2200, 775), (3632, 775), (3632, 1290)])
    R("JuegoSokoban-MotorMovimiento", "top", "top", 2240, 3420, via=[(2240, 790), (3420, 790)])
    R("MotorMovimiento-EstadoNivel", "left", "right", 860, 860)
    R("MotorMovimiento-Caja", "left", "top", 880, 2840, via=[(3275, 880), (3275, 1195), (2840, 1195)])
    R("MotorMovimiento-Jugador", "left", "top", 900, 3150, via=[(3290, 900), (3290, 1215), (3150, 1215)])
    R("MotorMovimiento-MediadorMovimiento", "bottom", "top", 3465, 3465)
    R("EstadoNivel-Caja", "bottom", "top", 2820, 2820)
    R("EstadoNivel-Jugador", "bottom", "top", 3050, 3050)
    R("Jugador-MediadorMovimiento", "right", "left", 1290, 1290)
    R("Caja-MediadorMovimiento", "right", "left", 1420, 1325, via=[(3305, 1420), (3305, 1325)])
    R("Jugador-Posicion", "bottom", "top", 3100, 3100)
    R("Caja-Posicion", "right", "top", 1440, 3030, via=[(3030, 1440)])
    R("Caja-ComportamientoCaja", "bottom", "top", 2600, 2600)
    arbol(d, ["CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"], "ComportamientoCaja", sep=34)

    # ── notas ──
    leyenda(d, 200, 1940, 640)
    d.nota("Cómo leer el diagrama\n"
           "Subrayado = static. + público, - privado, # protegido, ~ de paquete. Cursiva = abstracto.\n"
           "Se dibujan todos los getters y setters públicos. Se omiten las constantes de estilo (colores, fuentes, "
           "tamaños) y los métodos que solo implementan una interfaz (se leen en la interfaz), salvo en el "
           "Decorator, donde JuegoDecorado y JuegoConSonido muestran lo que redefinen.\n"
           "Para no cruzar todo, estas relaciones están en el modelo pero no se dibujan acá (se ven en los "
           "diagramas de cada patrón): MenuPrincipal y PanelAyuda usan Imagenes; PantallaJuego crea los tres "
           "comandos (Command); JuegoConSonido compara EstadoJuego (Decorator); EstadoNivel crea las estrategias y "
           "conecta a los colegas, y las estrategias avisan al mediador (Strategy, Mediator); Direccion la usan "
           "Juego.mover, PantallaJuego (TECLAS), Posicion.siguiente y MediadorMovimiento.",
           880, 1940, 900)
    return d


# ════════════════════════════════════════════════════════════════════════════
# 8. Diagramas por patrón (las mismas clases del modelo, con vistas nuevas)
# ════════════════════════════════════════════════════════════════════════════
NOTA_PATRON = ("#FFFDE7", "#B8892A")


def nota_patron(d, texto, x, y, w, h=None, unir=None):
    return d.nota(texto, x, y, w, color=NOTA_PATRON[0], borde=NOTA_PATRON[1], unir=unir)


def patron_observer(m):
    d = Diagrama(m, "observer", "Patrón Observer", doc="Luca. La vista se actualiza sola cuando cambia la partida.")
    d.caja("Juego", 300, 40)
    d.caja("JuegoSokoban", 40, 100, sin_miembros=True)
    d.caja("ObservadorJuego", 350, 270)
    d.caja("EstadoJuego", 720, 230)
    fila(d, ["PanelHUD", "PanelTablero"], 280, 440, 60, sin_miembros=True)
    C, R = d.cajas, d.rel
    js = C["JuegoSokoban"]
    R("JuegoSokoban-Juego", "right", "left", 112, 112)
    R("JuegoSokoban-observadores", "bottom", "left", 90, 300, via=[(90, 300)])
    R("Juego-ObservadorJuego", "bottom", "top", 460, 460)
    R("Juego-EstadoJuego", "right", "top", 120, 786, via=[(786, 120)])
    R("ObservadorJuego-EstadoJuego", "right", "left", 300, 300)
    arbol(d, ["PanelHUD", "PanelTablero"], "ObservadorJuego")
    nota_patron(d, "Observer (Luca)\nSujeto: Juego, implementado por JuegoSokoban, que guarda la lista de "
                "observadores; se suscriben con agregarObservador y se desuscriben con quitarObservador. Observadores: "
                "PanelHUD y PanelTablero implementan ObservadorJuego.\n"
                "Después de cada cambio (mover, deshacer, viajar en el tiempo, reiniciar) JuegoSokoban.notificar() "
                "llama a actualizar(EstadoJuego) en todos. La vista solo recibe el record EstadoJuego, nunca las "
                "entidades del dominio.", 40, 520, 820, 90)
    return d


def patron_facade(m):
    d = Diagrama(m, "facade", "Patrón Facade", doc="Juego es la fachada del dominio; Sonidos, la de javax.sound.")
    d.caja("PantallaJuego", 40, 80, sin_miembros=True)
    d.caja("Juego", 300, 40)
    d.caja("JuegoSokoban", 400, 260, sin_miembros=True)
    fila(d, ["CargadorNivel", "EstadoNivel", "MediadorMovimiento"], 260, 400, 50, sin_miembros=True)
    d.caja("JuegoConSonido", 40, 540, sin_miembros=True)
    d.caja("SonidosDeInterfaz", 40, 640, sin_miembros=True)
    d.caja("Sonidos", 330, 520)
    C, R = d.cajas, d.rel
    js = C["JuegoSokoban"]
    R("PantallaJuego-Juego", "right", "left", 92, 92)
    R("JuegoSokoban-Juego", "top", "bottom", 460, 460)
    for clave, destino, x in (("JuegoSokoban-CargadorNivel", "CargadorNivel", js.x + 15),
                              ("JuegoSokoban-EstadoNivel", "EstadoNivel", js.x + js.w / 2),
                              ("JuegoSokoban-MediadorMovimiento", "MediadorMovimiento", js.x + js.w - 15)):
        k = C[destino]
        R(clave, "bottom", "top", x, k.x + k.w / 2, via=[(x, 345), (k.x + k.w / 2, 345)])
    R("JuegoConSonido-Sonidos", "right", "left", 552, 552)
    R("SonidosDeInterfaz-Sonidos", "right", "left", 652, 652)
    nota_patron(d, "Facade del dominio (Luca)\nLa vista solo conoce la interfaz Juego: no sabe que existen "
                "CargadorNivel, EstadoNivel, el mediador de movimiento ni las cajas. Por eso el dominio, el sonido y "
                "las funcionalidades nuevas entraron casi sin tocar la vista (inversión de dependencias).",
                720, 40, 400, 110, unir=["Juego"])
    nota_patron(d, "Facade del sonido (Mora)\nSonidos esconde javax.sound (AudioSystem, Clip, formatos y "
                "excepciones) detrás de reproducir(Sonido.PASO). Si la PC no tiene audio, el juego sigue en "
                "silencio.", 720, 560, 400, 100, unir=["Sonidos"])
    return d


def patron_singleton(m):
    d = Diagrama(m, "singleton", "Patrón Singleton", doc="Imagenes (Luca) y Sonidos (Mora): una única instancia.")
    d.caja("Imagenes", 40, 200)
    d.caja("Sonidos", 520, 200)
    fila(d, ["MenuPrincipal", "PanelTablero", "PanelHUD"], 40, 60, 25, sin_miembros=True)
    fila(d, ["JuegoConSonido", "SonidosDeInterfaz"], 520, 60, 25, sin_miembros=True)
    C, R = d.cajas, d.rel
    im, so = C["Imagenes"], C["Sonidos"]
    for s in ("MenuPrincipal", "PanelTablero", "PanelHUD"):
        k = C[s]
        x = min(k.x + k.w / 2, im.x + im.w - 20)
        R(f"{s}-Imagenes", "bottom", "top", x, x)
    for s in ("JuegoConSonido", "SonidosDeInterfaz"):
        k = C[s]
        x = min(k.x + k.w / 2, so.x + so.w - 20)
        R(f"{s}-Sonidos", "bottom", "top", x, x)
    for nombre, clave in (("Imagenes", "Imagenes-instancia"), ("Sonidos", "Sonidos-instancia")):
        k = C[nombre]
        R(clave, "right", "right", k.y + 40, k.y + 80, via=[(k.x + k.w + 40, k.y + 40), (k.x + k.w + 40, k.y + 80)])
    nota_patron(d, "Singleton\nConstructor privado, atributo static instancia y obtenerInstancia() static: "
                "toda la aplicación comparte una sola caché de imágenes (Imagenes, Luca) y un solo reproductor de "
                "sonidos (Sonidos, Mora). Cada imagen y cada .wav se lee del disco una sola vez.",
                40, 440, 440, 100)
    return d


def patron_strategy(m):
    d = Diagrama(m, "strategy", "Patrón Strategy", doc="Pedro y Lucía. Cada tipo de caja decide qué pasa después de un empuje.")
    d.caja("Caja", 40, 40)
    d.caja("ComportamientoCaja", 560, 100)
    fila(d, ["CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"], 545, 290, 25)
    d.caja("MediadorMovimiento", 1080, 290)
    d.caja("EstadoNivel", 40, 340, sin_miembros=True)
    d.caja("MotorMovimiento", 220, 460)
    C, R = d.cajas, d.rel
    cc, me = C["ComportamientoCaja"], C["MediadorMovimiento"]
    R("Caja-ComportamientoCaja", "right", "left", 130, 130)
    arbol(d, ["CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"], "ComportamientoCaja")
    R("ComportamientoCaja-MediadorMovimiento", "right", "top", 136, me.x + 60, via=[(me.x + 60, 136)])
    fr, ll = C["CajaFragilStrategy"], C["CajaLlaveStrategy"]
    R("CajaFragilStrategy-MediadorMovimiento", "bottom", "left", fr.x + fr.w / 2, 375,
      via=[(fr.x + fr.w / 2, 375)])
    R("CajaLlaveStrategy-MediadorMovimiento", "right", "left", 312, 312)
    R("EstadoNivel-Caja", "top", "bottom", 100, 100)
    R("EstadoNivel-ComportamientoCaja", "right", "left", 352, 160, via=[(505, 352), (505, 160)])
    R("MotorMovimiento-Caja", "top", "bottom", 330, 330)
    R("MotorMovimiento-MediadorMovimiento", "right", "bottom", 500, me.x + 150, via=[(me.x + 150, 500)])
    nota_patron(d, "Strategy (Pedro y Lucía)\nContexto: Caja. Estrategia: ComportamientoCaja.\n"
                "Normal: no hace nada ($). Frágil: pierde resistencia y a los 3 empujes le avisa al mediador "
                "que se rompió (cajaRota). Llave: le avisa al mediador (llaveEmpujada) y, si quedó sobre un "
                "cerrojo, se abren los muros.\n"
                "EstadoNivel elige la estrategia al leer el nivel. Después de un empuje, MotorMovimiento llama a "
                "caja.despuesDeEmpujar() y la caja le pasa el mediador a su estrategia: las estrategias ya no "
                "conocen a EstadoNivel.", 40, 580, 900)
    return d

def patron_mediator(m):
    d = Diagrama(m, "mediator", "Patrón Mediator",
                 doc="Pedro y Lucía, completado por la auditoría: Jugador y Caja son colegas del mediador.")
    d.caja("Jugador", 40, 60)
    d.caja("MediadorMovimiento", 420, 60)
    d.caja("Caja", 800, 60)
    d.caja("MotorMovimiento", 435, 300)
    d.caja("EstadoNivel", 1300, 330, sin_miembros=True)
    d.caja("JuegoSokoban", 60, 440, sin_miembros=True)
    C, R = d.cajas, d.rel
    me, mo, ca, ju, es = C["MediadorMovimiento"], C["MotorMovimiento"], C["Caja"], C["Jugador"], C["EstadoNivel"]
    R("Jugador-MediadorMovimiento", "right", "left", 110, 110)
    R("Caja-MediadorMovimiento", "left", "right", 110, 110)
    R("MotorMovimiento-MediadorMovimiento", "top", "bottom", 550, 550)
    R("MotorMovimiento-Jugador", "left", "bottom", 320, 180, via=[(180, 320)])
    R("MotorMovimiento-Caja", "right", "bottom", 320, 1000, via=[(1000, 320)])
    R("MotorMovimiento-EstadoNivel", "bottom", "bottom", 600, es.x + 40, via=[(600, 420), (es.x + 40, 420)])
    R("EstadoNivel-Caja", "top", "right", es.x + 40, 200, via=[(es.x + 40, 200)])
    R("EstadoNivel-MediadorMovimiento", "top", "top", es.x + 90, 600, via=[(es.x + 90, 30), (600, 30)])
    js = C["JuegoSokoban"]
    R("JuegoSokoban-MotorMovimiento", "right", "bottom", js.y + 12, 500, via=[(500, js.y + 12)])
    R("JuegoSokoban-MediadorMovimiento", "left", "top", js.y + 12, 480,
      via=[(20, js.y + 12), (20, 20), (480, 20)])
    nota_patron(d, "Mediator (Pedro y Lucía, completado por la auditoría)\n"
                "Colegas: Jugador y Caja. Ninguno conoce al otro ni a EstadoNivel: solo hablan con el "
                "MediadorMovimiento. El jugador pide intentarMover(direccion); la estrategia de una caja avisa "
                "cajaRota(caja) o llaveEmpujada(caja).\n"
                "MotorMovimiento concentra las reglas: colisiones, empuje, hielo, quitar la caja rota y abrir los "
                "muros si la llave quedó sobre el cerrojo. Al crearse llama a estado.conectarColegas(this).\n"
                "JuegoSokoban crea el motor en cada nivel (y al deshacer o viajar) pero lo guarda como "
                "MediadorMovimiento (depende de la interfaz).", 40, 520, 1000)
    return d

def patron_decorator(m):
    d = Diagrama(m, "decorator", "Patrón Decorator",
                 doc="Mora, completado por la auditoría: JuegoDecorado es la base abstracta de los decoradores.")
    d.caja("Juego", 360, 40)
    d.caja("JuegoSokoban", 120, 330, sin_miembros=True)
    d.caja("JuegoDecorado", 560, 300)
    d.caja("JuegoConSonido", 520, 580, solo=["JuegoConSonido"])
    d.caja("Main", 40, 640)
    d.caja("EstadoJuego", 1040, 280)
    C, R = d.cajas, d.rel
    ju, jd, jc, js = C["Juego"], C["JuegoDecorado"], C["JuegoConSonido"], C["JuegoSokoban"]
    d.caja("Sonidos", jc.x + jc.w + 80, 600, sin_miembros=True)
    d.caja("Sonido", jc.x + jc.w + 80, 700, sin_miembros=True)
    arbol(d, ["JuegoSokoban", "JuegoDecorado"], "Juego")
    R("JuegoDecorado-juego", "top", "right", jd.x + jd.w - 40, 120, via=[(jd.x + jd.w - 40, 120)])
    R("JuegoConSonido-JuegoDecorado", "top", "bottom", 740, 740)
    R("Main-JuegoSokoban", "top", "bottom", js.x + 40, js.x + 40)
    R("Main-JuegoConSonido", "right", "left", 680, 680)
    R("JuegoConSonido-Sonidos", "right", "left", 612, 612)
    R("JuegoConSonido-Sonido", "right", "left", 712, 712)
    ej = C["EstadoJuego"]
    R("JuegoConSonido-EstadoJuego", "top", "bottom", jc.x + jc.w - 30, ej.x + 40,
      via=[(jc.x + jc.w - 30, 540), (ej.x + 40, 540)])
    nota_patron(d, "Decorator (Mora, completado por la auditoría)\n"
                "Componente: Juego. Componente concreto: JuegoSokoban. Decorador base: JuegoDecorado (abstracta), "
                "que implementa Juego, guarda el Juego envuelto (protegido) y le delega los 9 métodos.\n"
                "Decorador concreto: JuegoConSonido, que solo redefine iniciarNivel, mover, deshacer, "
                "viajarEnElTiempo y reiniciar: compara el EstadoJuego de antes y de después y hace sonar el efecto.\n"
                "En Main: new JuegoConSonido(new JuegoSokoban(new CargadorNivel(carpeta))). "
                "Un decorador nuevo solo extiende JuegoDecorado.", 40, 820, 1000)
    return d

def patron_state(m):
    d = Diagrama(m, "state", "Patrón State", doc="Mora. El sonido activado o silenciado; la tecla M alterna.")
    d.caja("Sonidos", 40, 60)
    d.caja("EstadoSonido", 480, 70)
    d.caja("SonidoActivado", 420, 260)
    d.caja("SonidoSilenciado", 640, 260)
    d.caja("SonidosDeInterfaz", 40, 340)
    C, R = d.cajas, d.rel
    so, a, si = C["Sonidos"], C["SonidoActivado"], C["SonidoSilenciado"]
    R("Sonidos-EstadoSonido", "right", "left", 105, 105)
    arbol(d, ["SonidoActivado", "SonidoSilenciado"], "EstadoSonido")
    R("SonidoActivado-SonidoSilenciado", "right", "left", a.y + 14, a.y + 14)
    R("SonidoSilenciado-SonidoActivado", "bottom", "bottom", si.x + 40, a.x + a.w - 30,
      via=[(si.x + 40, a.y + a.h + 40), (a.x + a.w - 30, a.y + a.h + 40)])
    R("SonidoActivado-Sonidos", "left", "right", a.y + 30, so.y + so.h - 20,
      via=[(a.x - 40, a.y + 30), (a.x - 40, so.y + so.h - 20)])
    R("SonidosDeInterfaz-Sonidos", "top", "bottom", 120, 120)
    nota_patron(d, "State (Mora)\nContexto: Sonidos. Estado: EstadoSonido (interfaz de paquete).\n"
                "SonidoActivado reproduce el Clip; SonidoSilenciado no hace nada.\n"
                "La tecla M (SonidosDeInterfaz) llama a alternarSonido() y cada estado decide a cuál pasa: "
                "las transiciones están dentro de los estados, no en un if del contexto.",
                420, 400, 440, 110)
    return d


def patron_memento(m):
    d = Diagrama(m, "memento", "Patrón Memento", doc="Martín. DeLorean y deshacer guardan recuerdos del nivel.")
    d.caja("JuegoSokoban", 40, 60)
    d.caja("RecuerdoNivel", 400, 60)
    d.caja("MaquinaDelTiempo", 480, 320)
    C, R = d.cajas, d.rel
    rn = C["RecuerdoNivel"]
    d.caja("EstadoNivel", rn.x + rn.w + 100, 80, sin_miembros=True)
    R("JuegoSokoban-RecuerdoNivel", "right", "left", 100, 100)
    R("JuegoSokoban-MaquinaDelTiempo", "right", "left", 380, 380)
    R("MaquinaDelTiempo-RecuerdoNivel", "top", "bottom", 600, 600)
    R("RecuerdoNivel-EstadoNivel", "right", "left", 92, 92)
    es = C["EstadoNivel"]
    R("JuegoSokoban-EstadoNivel", "top", "top", 200, es.x + es.w / 2, via=[(200, 30), (es.x + es.w / 2, 30)])
    nota_patron(d, "Memento (Martín)\nOriginador: JuegoSokoban (crearRecuerdo y restaurar).\n"
                "Memento: RecuerdoNivel, copia del nivel y de los contadores. Su constructor y sus lectores son "
                "de paquete (~): solo sokoban.modelo puede crearlo y leerlo.\n"
                "Cuidadores: el historial del deshacer (15 recuerdos, vuelve 5 pasos) y MaquinaDelTiempo "
                "(sokoban.modelo.tiempo, 10 puntos), que los guarda sin poder abrirlos.\n"
                "DeLorean (tecla T): cuesta 1 plutonio y vuelve al último punto en el tiempo.",
                780, 300, 460, 150)
    return d


def patron_command(m):
    d = Diagrama(m, "command", "Patrón Command", doc="Martín. Cada acción del jugador es un objeto que se puede repetir.")
    d.caja("PantallaJuego", 40, 40, solo=["grabadora"])
    d.caja("GrabadoraDePartida", 420, 40)
    d.caja("Repeticion", 420, 190)
    d.caja("Comando", 900, 70)
    fila(d, ["ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"], 560, 420, 40)
    C, R = d.cajas, d.rel
    pj = C["PantallaJuego"]
    R("PantallaJuego-GrabadoraDePartida", "right", "left", 70, 70)
    R("PantallaJuego-Repeticion", "right", "left", 150, 230, via=[(380, 150), (380, 230)])
    R("GrabadoraDePartida-Comando", "right", "left", 90, 90)
    R("Repeticion-Comando", "right", "left", 220, 115, via=[(860, 220), (860, 115)])
    arbol(d, ["ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"], "Comando", sep=180)
    ultimo = C["ComandoViajarEnElTiempo"]
    d.caja("Juego", ultimo.x + ultimo.w - 326, 640)
    ju = C["Juego"]
    for s in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
        k = C[s]
        x = k.x + k.w - 40
        R(f"{s}-Juego", "bottom", "top", x, ju.x + ju.w * 0.5, via=[(x, 610), (ju.x + ju.w * 0.5, 610)])
    for k_, s in enumerate(("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo")):
        k = C[s]
        xo = pj.x + 50 + 40 * k_
        y = 560 + 15 * k_
        if s == "ComandoMover":
            R(f"PantallaJuego-{s}", "bottom", "left", xo, k.y + k.h / 2, via=[(xo, k.y + k.h / 2)])
        else:
            R(f"PantallaJuego-{s}", "bottom", "bottom", xo, k.x + 30, via=[(xo, y), (k.x + 30, y)])
    nota_patron(d, "Command (Martín)\nCliente: PantallaJuego crea un comando por cada tecla o botón.\n"
                "Invocador: GrabadoraDePartida lo ejecuta y lo anota.\n"
                "Comandos concretos: ComandoMover, ComandoDeshacer y ComandoViajarEnElTiempo. Receptor: Juego.\n"
                "Repeticion vuelve a ejecutar la partida grabada (un comando cada 160 ms) y termina exactamente "
                "en el mismo estado. Reiniciar no se graba: borra la grabación.",
                40, 640, 480, 130)
    return d


DIAGRAMAS = [diagrama_completo, patron_observer, patron_facade, patron_singleton, patron_strategy,
             patron_mediator, patron_decorator, patron_state, patron_memento, patron_command]

def exportar_png(mdj, carpeta, staruml="staruml"):
    """Opcional: exporta cada diagrama a PNG con la línea de comandos de StarUML (si está instalado)."""
    import subprocess
    os.makedirs(carpeta, exist_ok=True)
    salida = os.path.join(os.path.abspath(carpeta), "<%=filenamify(element.name)%>.png")
    subprocess.run([staruml, "image", os.path.abspath(mdj), "-f", "png", "-o", salida], check=True)


if __name__ == "__main__":
    # python3 generar_staruml.py [--png CARPETA] [--staruml RUTA_AL_EJECUTABLE]
    args = sys.argv[1:]
    generar(DIAGRAMAS)
    if "--png" in args:
        exe = args[args.index("--staruml") + 1] if "--staruml" in args else "staruml"
        exportar_png(SALIDA, args[args.index("--png") + 1], exe)
