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
# Miembros: una línea cada uno. "_" = static. "*" al principio = redefine un método de una interfaz
# o de una clase abstracta: está en el modelo, pero en el diagrama completo no se dibuja (se lee en
# la interfaz); los diagramas de cada patrón lo muestran cuando hace falta.

CLASES = {}


def clase(nombre, paquete, autor, tipo="clase", miembros="", literales="", estereotipo=None,
          final=False, abstracta=False, visibilidad="public", dentro_de=None, doc=""):
    CLASES[nombre] = dict(nombre=nombre, paquete=paquete, autor=autor, tipo=tipo, abstracta=abstracta,
                          miembros=[l.rstrip() for l in miembros.strip("\n").splitlines() if l.strip()],
                          literales=literales.split(), estereotipo=estereotipo, final=final,
                          visibilidad=visibilidad, dentro_de=dentro_de, doc=doc)


# ───────── sokoban ─────────
clase("Main", "sokoban", "luca", final=True,
      doc="Punto de entrada: new VentanaPrincipal(new JuegoConSonido(new JuegoSokoban(new CargadorNivel(carpeta)))).",
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
      doc="Pantalla de la partida: HUD arriba, tablero al centro. Cliente del Command: cada tecla o botón "
          "es un comando que ejecuta la grabadora.",
      miembros="""
_- FLECHAS: Map<Integer, Direccion>
- juego: Juego
- volverAlMenu: Runnable
- tablero: PanelTablero
- grabadora: GrabadoraDePartida
- aviso: JLabel
- ocultarAviso: Timer
+ PantallaJuego(juego: Juego, volverAlMenu: Runnable)
+ iniciar(nivel: int): void
- mover(direccion: Direccion): void
- deshacer(): void
- viajarEnElTiempo(): void
- reiniciar(): void
- alApretarEscape(): void
- verRepeticion(nivel: int): void
- pausar(): void
- mostrarResultado(estado: EstadoJuego): void
- mostrarCajaRota(estado: EstadoJuego): void
- mostrarCartel(titulo: String, mensaje: String, opciones: Map<String, Runnable>): void
- avisar(texto: String): void
- crearAviso(): JLabel
- asignarTecla(tecla: int, accion: Runnable): void
""")
clase("PanelHUD", "sokoban.vista", "luca", miembros="""
- nivel: JLabel
- movimientos: JLabel
- empujes: JLabel
- plutonio: JLabel
- delorean: JButton
+ PanelHUD(alDeshacer: Runnable, alReiniciar: Runnable, alViajar: Runnable, alPausar: Runnable)
*+ actualizar(estado: EstadoJuego): void
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
*+ actualizar(estado: EstadoJuego): void
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
clase("Imagenes", "sokoban.vista", "luca", final=True,
      doc="Singleton: una única caché de imágenes compartida.",
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
clase("SujetoJuego", "sokoban.modelo", "luca", tipo="interfaz",
      doc="Sujeto del Observer: suscribe, desuscribe y avisa a los observadores.",
      miembros="""
+ agregarObservador(observador: ObservadorJuego): void
+ quitarObservador(observador: ObservadorJuego): void
+ notificarObservadores(): void
""")
clase("Juego", "sokoban.modelo", "luca", tipo="interfaz",
      doc="Facade del dominio para la vista (extiende SujetoJuego).",
      miembros="""
+ getCantidadNiveles(): int
+ iniciarNivel(numero: int): void
+ mover(direccion: Direccion): void
+ deshacer(): void
+ reiniciar(): void
+ viajarEnElTiempo(): void
+ getEstado(): EstadoJuego
""")
clase("JuegoDecorado", "sokoban.modelo", "luca", abstracta=True,
      doc="Decorator base (abstracta): implementa Juego, guarda el Juego envuelto y le delega todo.",
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
+ notificarObservadores(): void
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
- deshacerUsados: int
- plutonio: int
- viajes: int
- puntosEnElTiempo: int
- puntaje: int
- completado: boolean
- sinSolucion: boolean
- evento: Evento
- tablero: List<String>
""")
clase("Evento", "sokoban.modelo", "dominio", tipo="enum",
      literales="NINGUNO INICIO_NIVEL REINICIO PASO CHOQUE EMPUJE CAJA_DANADA CAJA_ROTA CAJA_EN_DESTINO "
                "CERROJO_ABIERTO PLUTONIO DESHACER VIAJE_EN_EL_TIEMPO VICTORIA",
      doc="Lo que pasó en la última acción (el sonido lo traduce a un efecto).")
clase("Direccion", "sokoban.modelo", "luca", tipo="enum", literales="ARRIBA ABAJO IZQUIERDA DERECHA",
      miembros="""
- deltaFila: int
- deltaColumna: int
+ getDeltaFila(): int
+ getDeltaColumna(): int
""")

# ───────── sokoban.modelo: dominio (Pedro y Lucía) ─────────
clase("JuegoSokoban", "sokoban.modelo", "dominio",
      doc="Fachada concreta y sujeto concreto del Observer. Coordina el nivel, el deshacer, el DeLorean y el puntaje.",
      miembros="""
- cargador: CargadorNivel
- cantidadNiveles: int
- observadores: List<ObservadorJuego>
- historial: HistorialDeshacer
- maquinaDelTiempo: MaquinaDelTiempo
- puntaje: Puntaje
- nivel: EstadoNivel
- numeroNivel: int
- evento: Evento
+ JuegoSokoban()
+ JuegoSokoban(cargador: CargadorNivel)
*+ getCantidadNiveles(): int
*+ iniciarNivel(numero: int): void
*+ reiniciar(): void
*+ mover(direccion: Direccion): void
*+ deshacer(): void
*+ viajarEnElTiempo(): void
*+ getEstado(): EstadoJuego
*+ agregarObservador(observador: ObservadorJuego): void
*+ quitarObservador(observador: ObservadorJuego): void
*+ notificarObservadores(): void
- cargar(numero: int): void
- enJuego(): boolean
""")
clase("Puntaje", "sokoban.modelo", "dominio",
      doc="max(0, 1000 - 5 movimientos - 2 empujes - 50 deshacer - 100 viajes).",
      miembros="""
- deshacerUsados: int
- viajes: int
+ reiniciar(): void
+ registrarDeshacer(): void
+ registrarViaje(): void
+ getDeshacerUsados(): int
+ getViajes(): int
+ calcular(movimientos: int, empujes: int): int
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
      doc="Terreno, jugador, cajas y contadores. Originador del Memento: crea y lee los recuerdos.",
      miembros="""
_- RESISTENCIA_FRAGIL: int = 3
- terreno: char[][]
- jugador: Jugador
- cajas: List<Caja>
- cantidadDestinos: int
- movimientos: int
- empujes: int
- plutonio: int
- mediador: MediadorMovimiento
+ EstadoNivel(lineas: List<String>)
+ conectarMediador(mediador: MediadorMovimiento): void
+ getJugador(): Jugador
+ getCajas(): List<Caja>
+ moverJugador(direccion: Direccion): Evento
+ esTransitable(posicion: Posicion): boolean
+ esHielo(posicion: Posicion): boolean
+ esCerrojo(posicion: Posicion): boolean
+ abrirMuros(): void
+ quitarCaja(caja: Caja): void
+ contarMovimiento(fueEmpuje: boolean): void
+ recogerPlutonio(posicion: Posicion): boolean
+ gastarPlutonio(): void
+ cajasEnDestino(): int
+ estaCompleto(): boolean
+ sinSolucion(): boolean
+ getMovimientos(): int
+ getEmpujes(): int
+ getPlutonio(): int
+ crearRecuerdo(): RecuerdoNivel
+ restaurar(recuerdo: RecuerdoNivel): void
+ viajarA(punto: RecuerdoNivel): void
+ tableroParaVista(): List<String>
_- sobreDestino(simbolo: char): char
- dentro(p: Posicion): boolean
- casilla(p: Posicion): char
_- copiar(original: char[][]): char[][]
_- copiar(original: List<Caja>): List<Caja>
""")
clase("Posicion", "sokoban.modelo", "dominio", tipo="record", miembros="""
- fila: int
- columna: int
+ siguiente(direccion: Direccion): Posicion
""")
clase("ElementoMovil", "sokoban.modelo.entidades", "dominio", abstracta=True,
      doc="Colega del Mediator: lo que se mueve en el tablero y conoce al mediador.",
      miembros="""
# posicion: Posicion
# mediador: MediadorMovimiento
# ElementoMovil(posicion: Posicion)
+ conectar(mediador: MediadorMovimiento): void
+ getPosicion(): Posicion
+ setPosicion(posicion: Posicion): void
""")
clase("Jugador", "sokoban.modelo.entidades", "dominio", doc="Colega concreto: pide moverse al mediador.",
      miembros="""
+ Jugador(posicion: Posicion)
+ mover(direccion: Direccion): Evento
""")
clase("Caja", "sokoban.modelo.entidades", "dominio",
      doc="Colega concreto y contexto del Strategy: después de un empuje le pasa el mediador a su comportamiento.",
      miembros="""
- comportamiento: ComportamientoCaja
- resistencia: int
+ Caja(posicion: Posicion, comportamiento: ComportamientoCaja, resistencia: int)
+ despuesDeEmpujar(): void
+ quitarResistencia(): void
+ getResistencia(): int
+ getSimbolo(): char
+ copiar(): Caja
""")
clase("ComportamientoCaja", "sokoban.modelo.estrategias", "dominio", tipo="interfaz",
      doc="Strategy: qué hace cada tipo de caja después de un empuje y con qué símbolo se dibuja.",
      miembros="""
+ despuesDeEmpujar(caja: Caja, mediador: MediadorMovimiento): void
+ simbolo(caja: Caja): char
""")
for _s, _doc in (("CajaNormalStrategy", "No agrega nada. Símbolo $."),
                 ("CajaFragilStrategy", "Pierde resistencia: avisa cajaDanada y, a los 3 empujes, cajaRota. Símbolos F y f."),
                 ("CajaLlaveStrategy", "Avisa llaveEmpujada: sobre un cerrojo se abren los muros X. Símbolo L.")):
    clase(_s, "sokoban.modelo.estrategias", "dominio", doc=_doc, miembros="""
*+ despuesDeEmpujar(caja: Caja, mediador: MediadorMovimiento): void
*+ simbolo(caja: Caja): char
""")
clase("MediadorMovimiento", "sokoban.modelo.movimiento", "dominio", tipo="interfaz",
      doc="Mediator: los elementos móviles se comunican solo a través de él.",
      miembros="""
+ intentarMover(direccion: Direccion): Evento
+ cajaDanada(caja: Caja): void
+ cajaRota(caja: Caja): void
+ llaveEmpujada(caja: Caja): void
""")
clase("MotorMovimiento", "sokoban.modelo.movimiento", "dominio",
      doc="Mediator concreto: colisiones, empujes, hielo, cajas dañadas o rotas y cerrojos.",
      miembros="""
- nivel: EstadoNivel
- jugador: Jugador
- cajas: List<Caja>
- evento: Evento
+ MotorMovimiento(nivel: EstadoNivel)
*+ intentarMover(direccion: Direccion): Evento
- estaLibre(posicion: Posicion): boolean
- cajaEn(posicion: Posicion): Caja
- deslizar(destino: Posicion, direccion: Direccion): Posicion
*+ cajaDanada(caja: Caja): void
*+ cajaRota(caja: Caja): void
*+ llaveEmpujada(caja: Caja): void
""")

# ───────── sokoban.modelo: DeLorean y deshacer (Martín) ─────────
clase("RecuerdoNivel", "sokoban.modelo", "martin", final=True,
      doc="Memento: copia del terreno, del jugador, de las cajas y de los contadores. Solo EstadoNivel lo crea y lo lee.",
      miembros="""
- terreno: char[][]
- posicionJugador: Posicion
- cajas: List<Caja>
- movimientos: int
- empujes: int
- plutonio: int
~ RecuerdoNivel(terreno: char[][], posicionJugador: Posicion, cajas: List<Caja>, movimientos: int, empujes: int, plutonio: int)
~ terreno(): char[][]
~ posicionJugador(): Posicion
~ cajas(): List<Caja>
~ movimientos(): int
~ empujes(): int
~ plutonio(): int
""")
clase("HistorialDeshacer", "sokoban.modelo.tiempo", "martin",
      doc="Cuidador del deshacer: hasta 15 recuerdos, cada deshacer vuelve 5 pasos, máximo 3 seguidos.",
      miembros="""
_- MAXIMO: int = 15
_- PASOS_POR_USO: int = 5
_- USOS_SEGUIDOS: int = 3
- recuerdos: Deque<RecuerdoNivel>
- usosSeguidos: int
+ guardar(recuerdo: RecuerdoNivel): void
+ deshacer(): RecuerdoNivel
+ olvidarTodo(): void
""")
clase("MaquinaDelTiempo", "sokoban.modelo.tiempo", "martin",
      doc="Cuidador del DeLorean: hasta 10 puntos en el tiempo.",
      miembros="""
_- MAXIMO_PUNTOS: int = 10
- puntos: Deque<Punto>
+ guardar(movimiento: int, recuerdo: RecuerdoNivel): void
+ volverAntesDe(movimientoActual: int): RecuerdoNivel
+ olvidarDespuesDe(movimiento: int): void
+ cantidad(): int
+ olvidarTodo(): void
""")
clase("Punto", "sokoban.modelo.tiempo", "martin", tipo="record", visibilidad="private", dentro_de="MaquinaDelTiempo",
      doc="Record privado dentro de MaquinaDelTiempo (MaquinaDelTiempo.Punto).",
      miembros="""
- movimiento: int
- recuerdo: RecuerdoNivel
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
*+ ejecutar(): void
""")
clase("ComandoDeshacer", "sokoban.comandos", "martin", miembros="""
- juego: Juego
+ ComandoDeshacer(juego: Juego)
*+ ejecutar(): void
""")
clase("ComandoViajarEnElTiempo", "sokoban.comandos", "martin", miembros="""
- juego: Juego
+ ComandoViajarEnElTiempo(juego: Juego)
*+ ejecutar(): void
""")
clase("GrabadoraDePartida", "sokoban.comandos", "martin",
      doc="Invocador: ejecuta cada comando y lo anota; después puede reproducir la partida (uno cada 160 ms).",
      miembros="""
_- PAUSA_MS: int = 160
- comandos: List<Comando>
- reloj: Timer
- pendientes: Iterator<Comando>
- alTerminar: Runnable
+ ejecutar(comando: Comando): void
+ borrar(): void
+ reproducir(alTerminar: Runnable): void
+ saltarAlFinal(): void
+ estaReproduciendo(): boolean
- ejecutarSiguiente(): void
- terminar(): void
""")

# ───────── sokoban.sonido (Mora) ─────────
clase("JuegoConSonido", "sokoban.sonido", "sonido",
      doc="Decorator concreto: extiende JuegoDecorado y, después de cada acción, hace sonar el efecto del evento.",
      miembros="""
_- DEMORA_DERROTA_MS: int
+ JuegoConSonido(juego: Juego)
+ iniciarNivel(numero: int): void
+ mover(direccion: Direccion): void
+ deshacer(): void
+ reiniciar(): void
+ viajarEnElTiempo(): void
- sonarLoQuePaso(): void
_- sonarMasTarde(sonido: Sonido): void
""")
clase("Sonidos", "sokoban.sonido", "sonido", final=True,
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
for _s in ("SonidoActivado", "SonidoSilenciado"):
    clase(_s, "sokoban.sonido", "sonido", visibilidad="package", miembros="""
*+ reproducir(clip: Clip): void
*+ alternar(contexto: Sonidos): void
""")
clase("Sonido", "sokoban.sonido", "sonido", tipo="enum",
      literales="ARRANQUE INICIO_NIVEL PASO EMPUJE CAJA_EN_DESTINO CAJA_DANADA CAJA_ROTA "
                "CERROJO_ABIERTO DESHACER REINICIAR VICTORIA DERROTA CHOQUE CLIC PLUTONIO VIAJE_EN_EL_TIEMPO",
      miembros="""
- archivo: String
_+ de(evento: Evento): Sonido
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

# ───────── biblioteca (solo para dibujar la herencia) ─────────
clase("JFrame", "javax.swing", "swing", tipo="externa")
clase("JPanel", "javax.swing", "swing", tipo="externa")

# ════════════════════════════════════════════════════════════════════════════
# 2. Relaciones
# ════════════════════════════════════════════════════════════════════════════
# tipos: hereda, implementa, asociacion, composicion, agregacion, dependencia.
# rol y mult describen el extremo destino; rol_o y mult_o, el de origen (solo en asociaciones de ida y vuelta,
# ambos=True). nombre: texto sobre la línea.

RELACIONES = {}


def rel(clave, tipo, origen, destino, rol="", mult="", nombre="", ambos=False, rol_o="", mult_o=""):
    assert clave not in RELACIONES, clave
    RELACIONES[clave] = dict(clave=clave, tipo=tipo, origen=origen, destino=destino, rol=rol, mult=mult,
                             nombre=nombre, ambos=ambos, rol_o=rol_o, mult_o=mult_o)


# herencia
rel("VentanaPrincipal-JFrame", "hereda", "VentanaPrincipal", "JFrame")
for _p in ("MenuPrincipal", "PantallaJuego", "PanelHUD", "PanelTablero", "Cartel", "PanelAyuda"):
    rel(f"{_p}-JPanel", "hereda", _p, "JPanel")
rel("Juego-SujetoJuego", "hereda", "Juego", "SujetoJuego")
rel("JuegoConSonido-JuegoDecorado", "hereda", "JuegoConSonido", "JuegoDecorado")
rel("Jugador-ElementoMovil", "hereda", "Jugador", "ElementoMovil")
rel("Caja-ElementoMovil", "hereda", "Caja", "ElementoMovil")
# realizaciones
rel("PanelHUD-ObservadorJuego", "implementa", "PanelHUD", "ObservadorJuego")
rel("PanelTablero-ObservadorJuego", "implementa", "PanelTablero", "ObservadorJuego")
rel("JuegoSokoban-Juego", "implementa", "JuegoSokoban", "Juego")
rel("JuegoSokoban-SujetoJuego", "implementa", "JuegoSokoban", "SujetoJuego")
rel("JuegoDecorado-Juego", "implementa", "JuegoDecorado", "Juego")
rel("SonidoActivado-EstadoSonido", "implementa", "SonidoActivado", "EstadoSonido")
rel("SonidoSilenciado-EstadoSonido", "implementa", "SonidoSilenciado", "EstadoSonido")
rel("MotorMovimiento-MediadorMovimiento", "implementa", "MotorMovimiento", "MediadorMovimiento")
for _s in ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"):
    rel(f"{_s}-ComportamientoCaja", "implementa", _s, "ComportamientoCaja")
for _c in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
    rel(f"{_c}-Comando", "implementa", _c, "Comando")
# Main
rel("Main-VentanaPrincipal", "dependencia", "Main", "VentanaPrincipal", nombre="crea")
rel("Main-JuegoConSonido", "dependencia", "Main", "JuegoConSonido", nombre="new JuegoConSonido(new JuegoSokoban(...))")
rel("Main-JuegoSokoban", "dependencia", "Main", "JuegoSokoban", nombre="crea")
rel("Main-CargadorNivel", "dependencia", "Main", "CargadorNivel", nombre="crea (carpeta de niveles)")
rel("Main-SonidosDeInterfaz", "dependencia", "Main", "SonidosDeInterfaz", nombre="instalar()")
rel("Main-Juego", "dependencia", "Main", "Juego", nombre="variable local juego")
# vista
rel("VentanaPrincipal-MenuPrincipal", "composicion", "VentanaPrincipal", "MenuPrincipal", mult="1")
rel("VentanaPrincipal-PantallaJuego", "composicion", "VentanaPrincipal", "PantallaJuego", rol="pantallaJuego", mult="1")
rel("MenuPrincipal-Cartel", "composicion", "MenuPrincipal", "Cartel", mult="1")
rel("MenuPrincipal-PanelAyuda", "dependencia", "MenuPrincipal", "PanelAyuda", nombre="crea (Cómo jugar)")
rel("PantallaJuego-Cartel", "dependencia", "PantallaJuego", "Cartel", nombre="crea")
rel("PantallaJuego-PanelTablero", "composicion", "PantallaJuego", "PanelTablero", rol="tablero", mult="1")
rel("PantallaJuego-PanelHUD", "composicion", "PantallaJuego", "PanelHUD", mult="1")
rel("PanelTablero-Epoca", "asociacion", "PanelTablero", "Epoca", rol="epoca", mult="1")
rel("PanelTablero-Direccion", "asociacion", "PanelTablero", "Direccion", rol="orientacion", mult="1")
rel("PanelTablero-Imagenes", "dependencia", "PanelTablero", "Imagenes", nombre="obtenerInstancia()")
rel("PanelHUD-Imagenes", "dependencia", "PanelHUD", "Imagenes", nombre="obtenerInstancia()")
rel("MenuPrincipal-Imagenes", "dependencia", "MenuPrincipal", "Imagenes", nombre="obtenerInstancia()")
rel("PanelAyuda-Imagenes", "dependencia", "PanelAyuda", "Imagenes", nombre="obtenerInstancia()")
rel("Imagenes-instancia", "asociacion", "Imagenes", "Imagenes", rol="instancia", mult="1")
rel("PantallaJuego-Juego", "asociacion", "PantallaJuego", "Juego", rol="juego", mult="1")
rel("PantallaJuego-GrabadoraDePartida", "asociacion", "PantallaJuego", "GrabadoraDePartida", rol="grabadora", mult="1")
for _c in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
    rel(f"PantallaJuego-{_c}", "dependencia", "PantallaJuego", _c, nombre="new")
# contrato
rel("SujetoJuego-ObservadorJuego", "dependencia", "SujetoJuego", "ObservadorJuego", nombre="avisa a")
rel("Juego-EstadoJuego", "dependencia", "Juego", "EstadoJuego", nombre="devuelve")
rel("ObservadorJuego-EstadoJuego", "dependencia", "ObservadorJuego", "EstadoJuego", nombre="recibe")
rel("Juego-Direccion", "dependencia", "Juego", "Direccion", nombre="mover(direccion)")
rel("EstadoJuego-Evento", "asociacion", "EstadoJuego", "Evento", rol="evento", mult="1")
rel("JuegoDecorado-juego", "agregacion", "JuegoDecorado", "Juego", rol="juego", mult="1")
# sonido
rel("JuegoConSonido-Sonidos", "dependencia", "JuegoConSonido", "Sonidos", nombre="obtenerInstancia()")
rel("JuegoConSonido-Sonido", "dependencia", "JuegoConSonido", "Sonido", nombre="Sonido.de(evento)")
rel("Sonido-Evento", "dependencia", "Sonido", "Evento", nombre="de(evento)")
rel("Sonidos-instancia", "asociacion", "Sonidos", "Sonidos", rol="instancia", mult="1")
rel("Sonidos-EstadoSonido", "asociacion", "Sonidos", "EstadoSonido", rol="estado", mult="1")
rel("Sonidos-Sonido", "dependencia", "Sonidos", "Sonido", nombre="un Clip por cada uno")
rel("SonidoActivado-SonidoSilenciado", "dependencia", "SonidoActivado", "SonidoSilenciado",
    nombre="alternar: new SonidoSilenciado()")
rel("SonidoSilenciado-SonidoActivado", "dependencia", "SonidoSilenciado", "SonidoActivado",
    nombre="alternar: new SonidoActivado()")
rel("SonidoActivado-Sonidos", "dependencia", "SonidoActivado", "Sonidos", nombre="establecerEstado()")
rel("SonidoSilenciado-Sonidos", "dependencia", "SonidoSilenciado", "Sonidos", nombre="establecerEstado()")
rel("SonidosDeInterfaz-Sonidos", "dependencia", "SonidosDeInterfaz", "Sonidos", nombre="obtenerInstancia()")
rel("SonidosDeInterfaz-Sonidos-estado", "dependencia", "SonidosDeInterfaz", "Sonidos",
    nombre="alternarSonido(), reproducir(CLIC)")
rel("SonidosDeInterfaz-Sonido", "dependencia", "SonidosDeInterfaz", "Sonido", nombre="ARRANQUE, CLIC")
# dominio
rel("JuegoSokoban-observadores", "asociacion", "JuegoSokoban", "ObservadorJuego", rol="observadores", mult="*")
rel("JuegoSokoban-EstadoJuego", "dependencia", "JuegoSokoban", "EstadoJuego", nombre="crea")
rel("JuegoSokoban-CargadorNivel", "asociacion", "JuegoSokoban", "CargadorNivel", rol="cargador", mult="1")
rel("JuegoSokoban-EstadoNivel", "asociacion", "JuegoSokoban", "EstadoNivel", rol="nivel", mult="0..1")
rel("JuegoSokoban-MotorMovimiento", "dependencia", "JuegoSokoban", "MotorMovimiento", nombre="crea")
rel("JuegoSokoban-HistorialDeshacer", "asociacion", "JuegoSokoban", "HistorialDeshacer", rol="historial", mult="1")
rel("JuegoSokoban-MaquinaDelTiempo", "asociacion", "JuegoSokoban", "MaquinaDelTiempo", rol="maquinaDelTiempo",
    mult="1")
rel("JuegoSokoban-Puntaje", "asociacion", "JuegoSokoban", "Puntaje", rol="puntaje", mult="1")
rel("CargadorNivel-EstadoNivel", "dependencia", "CargadorNivel", "EstadoNivel", nombre="crea")
rel("EstadoNivel-Jugador", "asociacion", "EstadoNivel", "Jugador", rol="jugador", mult="1")
rel("EstadoNivel-Caja", "asociacion", "EstadoNivel", "Caja", rol="cajas", mult="*")
for _s in ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"):
    rel(f"EstadoNivel-{_s}", "dependencia", "EstadoNivel", _s, nombre="new")
rel("EstadoNivel-RecuerdoNivel", "dependencia", "EstadoNivel", "RecuerdoNivel", nombre="crea y lee")
rel("EstadoNivel-MediadorMovimiento", "asociacion", "EstadoNivel", "MediadorMovimiento", rol="mediador", mult="0..1")
rel("MotorMovimiento-EstadoNivel", "asociacion", "MotorMovimiento", "EstadoNivel", rol="nivel", mult="1")
rel("MotorMovimiento-Jugador", "asociacion", "MotorMovimiento", "Jugador", rol="jugador", mult="1")
rel("MotorMovimiento-Caja", "asociacion", "MotorMovimiento", "Caja", rol="cajas", mult="*")
rel("MediadorMovimiento-ElementoMovil", "asociacion", "MediadorMovimiento", "ElementoMovil", nombre="se conocen",
    mult="*", ambos=True, mult_o="1")
rel("MediadorMovimiento-Evento", "dependencia", "MediadorMovimiento", "Evento", nombre="devuelve")
rel("ElementoMovil-Posicion", "asociacion", "ElementoMovil", "Posicion", rol="posicion", mult="1")
rel("Caja-ComportamientoCaja", "asociacion", "Caja", "ComportamientoCaja", rol="comportamiento", mult="1")
rel("ComportamientoCaja-MediadorMovimiento", "dependencia", "ComportamientoCaja", "MediadorMovimiento",
    nombre="avisa (cajaDanada, cajaRota, llaveEmpujada)")
rel("Posicion-Direccion", "dependencia", "Posicion", "Direccion", nombre="siguiente(direccion)")
rel("RecuerdoNivel-Posicion", "asociacion", "RecuerdoNivel", "Posicion", rol="posicionJugador", mult="1")
rel("RecuerdoNivel-Caja", "asociacion", "RecuerdoNivel", "Caja", rol="cajas", mult="*")
rel("HistorialDeshacer-RecuerdoNivel", "agregacion", "HistorialDeshacer", "RecuerdoNivel", rol="recuerdos",
    mult="0..15")
rel("MaquinaDelTiempo-Punto", "agregacion", "MaquinaDelTiempo", "Punto", rol="puntos", mult="0..10")
rel("Punto-RecuerdoNivel", "asociacion", "Punto", "RecuerdoNivel", rol="recuerdo", mult="1")
# comandos
rel("GrabadoraDePartida-Comando", "agregacion", "GrabadoraDePartida", "Comando", rol="comandos", mult="*")
for _c in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
    rel(f"{_c}-Juego", "asociacion", _c, "Juego", rol="juego", mult="1")
rel("ComandoMover-Direccion", "asociacion", "ComandoMover", "Direccion", rol="direccion", mult="1")

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
    redefine = linea.startswith("*")
    linea = linea.lstrip("*")
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
        return dict(clase="op", nombre=nombre.strip(), vis=vis, estatico=estatico, params=lista, ret=ret or None,
                    redefine=redefine)
    nombre, _, tipo = resto.partition(":")
    tipo, _, valor = tipo.partition("=")
    return dict(clase="attr", nombre=nombre.strip(), vis=vis, estatico=estatico, tipo=tipo.strip(), valor=valor.strip(),
                redefine=redefine)


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
                         "reference": ref(o["_id"]), "visibility": "public",
                         "navigable": "navigable" if r["ambos"] else "unspecified",
                         "aggregation": agreg, "isReadOnly": False, "isOrdered": False, "isUnique": False,
                         "isDerived": False, "isID": False}
            if r["rol_o"]:
                e["end1"]["name"] = r["rol_o"]
            if r["mult_o"]:
                e["end1"]["multiplicity"] = r["mult_o"]
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
    """items: lista de (id del modelo, texto, subrayado, visible). Los renglones ocultos (visible=False) siguen en
    el archivo, como los guarda StarUML, pero no se dibujan ni ocupan lugar: así cada diagrama elige qué miembros
    muestra de la misma clase del modelo."""
    c = _base(tipo, clave, padre, modelo, visible=visible)
    n = sum(1 for it in items if it[3])
    h = n * LINEA + 2 * PAD if n else 10
    _nodo(c, x, y, w, h)
    subs = []
    k = 0
    for j, (mid, txt, sub, ver) in enumerate(items):
        subs.append(_etiqueta(f"{clave}:{j}", c["_id"], x + PAD, y + PAD + k * LINEA, w - 2 * PAD, txt,
                              alineacion=0, subrayado=sub, tipo=tipo_item, modelo=mid, visible=ver))
        k += 1 if ver else 0
    if subs:
        c["subViews"] = subs
    return c, (h if visible else 0)


class Caja:
    """Vista de un clasificador (clase, interfaz, enum o record) con sus compartimentos."""

    def __init__(self, diagrama, nombre, x, y, w=None, ver=None, sin_miembros=False, rol=None, color=None):
        c = CLASES[nombre]
        self.nombre, self.c = nombre, c
        self.modelo_id = diagrama.modelo.ids[nombre]
        clave = f"{diagrama.clave}/{nombre}"
        while nuevo_id_libre(clave) is False:
            clave += "+"
        # Siempre van las vistas de todos los miembros (StarUML las crea igual al abrir el archivo); cada
        # diagrama decide cuáles se ven. Sin `ver`: todos menos los que solo redefinen un método heredado.
        # Con `ver` (lista de nombres; el constructor se llama como la clase): solo esos, y los compartimentos
        # vacíos se ocultan, como «hide empty members» de PlantUML. `sin_miembros` deja solo el nombre.
        miembros = c.get("_miembros", [])
        if sin_miembros:
            visible = lambda m: False  # noqa: E731
        elif ver is None:
            visible = lambda m: not m["redefine"]  # noqa: E731
        else:
            visible = lambda m: m["nombre"] in ver  # noqa: E731
        attrs = [(m["_id"], texto_miembro(m), m["estatico"], visible(m)) for m in miembros if m["clase"] == "attr"]
        ops = [(m["_id"], texto_miembro(m), m["estatico"], visible(m)) for m in miembros if m["clase"] == "op"]
        lits = [(i, n, False, not sin_miembros and ver is None) for n, i in c.get("_literales", [])]
        completa = ver is None and not sin_miembros
        ver_lits = any(l[3] for l in lits)
        ver_attrs = any(a[3] for a in attrs) or (completa and c["tipo"] in ("clase", "record"))
        ver_ops = any(o[3] for o in ops) or (completa and c["tipo"] == "clase")
        tipo = c["tipo"]
        estereo = {"interfaz": "interface", "enum": "enumeration"}.get(tipo) or c["estereotipo"] or \
            ("record" if tipo == "record" else None)
        textos = [t for _, t, _, vis in attrs + ops + lits if vis]
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
        if rol:
            diagrama.texto(rol, x, y - 19, max(self.w, ancho(rol) + 12), 17, tam=11, color="#7A5A12")

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

    def contencion(self, hijo, padre, pts):
        """Línea de anidamiento (UMLContainmentView): el círculo con la cruz va del lado de `padre`."""
        ch, cp = self.cajas[hijo], self.cajas[padre]
        v = _base("UMLContainmentView", f"{self.clave}/contencion:{hijo}:{padre}", self.id, estilo_padre=False)
        v.update({"head": ref(cp.id), "tail": ref(ch.id), "lineStyle": 0,
                  "points": ";".join(f"{x:g}:{y:g}" for x, y in pts)})
        self.lineas.append(v)
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
            ("tailRoleNameLabel", e1, math.pi / 5, 26 + ancho(r["rol_o"]) / 2, 2, r["rol_o"], bool(r["rol_o"]), tx, ty),
            ("tailPropertyLabel", e1, math.pi / 4, 40, 2, "", False, tx, ty),
            ("tailMultiplicityLabel", e1, -math.pi / 5, 20, 2, r["mult_o"], bool(r["mult_o"]), tx, ty),
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
    ("luca", "Luca: interfaz gráfica Swing (sokoban.vista) y el contrato vista/dominio (Juego, SujetoJuego, ObservadorJuego, EstadoJuego, Direccion, JuegoDecorado)."),
    ("dominio", "Pedro y Lucía: dominio y personaje (JuegoSokoban, niveles, Puntaje, Evento, entidades, Strategy, Mediator)."),
    ("sonido", "Mora: sonido (sokoban.sonido: Decorator, Singleton + Facade, State)."),
    ("martin", "Martín: arte (assets/) y las funcionalidades adicionales: deshacer y DeLorean (Memento: RecuerdoNivel, HistorialDeshacer, MaquinaDelTiempo) y repetición de la partida (Command: sokoban.comandos)."),
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
    d.paquete("sokoban", 200, 20, 3500, 2030, PAQ_RAIZ)
    d.paquete("sokoban.vista", 215, 150, 1025, 1270, PAQ_VISTA)
    d.paquete("sokoban.comandos", 215, 1450, 1025, 420, PAQ_MARTIN)
    d.paquete("sokoban.sonido", 1305, 150, 2380, 610, PAQ_SONIDO)
    d.paquete("sokoban.modelo", 1290, 775, 2395, 1240, PAQ_MODELO)
    d.paquete("sokoban.modelo.entidades", 2910, 1420, 760, 410, PAQ_SUB)
    d.paquete("sokoban.modelo.estrategias", 2430, 1720, 460, 280, PAQ_SUB)
    d.paquete("sokoban.modelo.movimiento", 3180, 805, 380, 560, PAQ_SUB)
    d.paquete("sokoban.modelo.tiempo", 1310, 1505, 860, 210, PAQ_MARTIN)
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
    d.caja("GrabadoraDePartida", 240, 1480)
    d.caja("Comando", 620, 1500)
    fila(d, ["ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"], 240, 1735, 38)
    # sonido
    d.caja("JuegoConSonido", 1600, 190)
    d.caja("Sonidos", 1900, 190)
    d.caja("EstadoSonido", 2360, 200)
    d.caja("SonidoActivado", 2280, 330)
    d.caja("SonidoSilenciado", 2470, 330)
    d.caja("Sonido", 1900, 420)
    d.caja("SonidosDeInterfaz", 2400, 500)
    # modelo: contrato
    d.caja("SujetoJuego", 1310, 800)
    d.caja("Juego", 1310, 950)
    d.caja("JuegoDecorado", 1600, 960)
    d.caja("ObservadorJuego", 1310, 1230)
    d.caja("EstadoJuego", 1700, 1190)
    d.caja("Evento", 1880, 1190)
    d.caja("Direccion", 1310, 1330)
    # modelo: dominio
    d.caja("JuegoSokoban", 2190, 810)
    d.caja("CargadorNivel", 2480, 810)
    d.caja("Puntaje", 2480, 1090)
    d.caja("EstadoNivel", 2810, 810)
    d.caja("MotorMovimiento", 3200, 840)
    d.caja("MediadorMovimiento", 3240, 1240)
    d.caja("Posicion", 2470, 1440)
    d.caja("ElementoMovil", 3260, 1460)
    d.caja("Caja", 2930, 1650)
    d.caja("Jugador", 3420, 1650)
    d.caja("ComportamientoCaja", 2450, 1760)
    fila(d, ["CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"], 2445, 1890, 15)
    d.caja("HistorialDeshacer", 1330, 1540)
    d.caja("MaquinaDelTiempo", 1620, 1540)
    d.caja("Punto", 1990, 1560)
    d.caja("RecuerdoNivel", 1310, 1760)
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
    R("Main-JuegoConSonido", "right", "top", 70, 1700)
    R("Main-SonidosDeInterfaz", "right", "top", 90, 2620)
    R("Main-JuegoSokoban", "right", "top", 108, 2270, via=[(1860, 108), (1860, 757), (2270, 757)])
    R("Main-CargadorNivel", "right", "top", 108, 2600, via=[(1860, 108), (1860, 757), (2600, 757)])
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
    R("PantallaJuego-Juego", "right", "left", 420, 980, via=[(1250, 420), (1250, 980)])
    R("PanelTablero-ObservadorJuego", "right", "left", 1090, 1260, via=[(1150, 1090), (1150, 1260)])
    R("PanelHUD-ObservadorJuego", "bottom", "left", 1150, 1260, via=[(1150, 1260)])
    R("PanelTablero-Direccion", "bottom", "left", 610, 1390, via=[(610, 1150), (1278, 1150), (1278, 1390)])
    # vista -> comandos
    R("PantallaJuego-GrabadoraDePartida", "right", "top", 700, 350, via=[(1222, 700), (1222, 1462), (350, 1462)])
    # ── comandos ──
    R("GrabadoraDePartida-Comando", "right", "left", 1528, 1528)
    arbol(d, ["ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"], "Comando",
          sep=C["ComandoMover"].y - 24 - C["Comando"].y - C["Comando"].h)
    vj = C["ComandoViajarEnElTiempo"]
    R("ComandoViajarEnElTiempo-Juego", "right", "left", vj.y + 40, 1050, via=[(1262, vj.y + 40), (1262, 1050)])
    for s in ("ComandoMover", "ComandoDeshacer"):
        k = C[s]
        R(f"{s}-Juego", "bottom", "left", k.x + k.w - 40, 1050, via=[(k.x + k.w - 40, 1838), (1262, 1838), (1262, 1050)])
    R("ComandoMover-Direccion", "bottom", "left", 300, 1440, via=[(300, 1852), (1293, 1852), (1293, 1440)])
    # ── contrato ──
    R("Juego-SujetoJuego", "top", "bottom", 1400, 1400)
    R("SujetoJuego-ObservadorJuego", "left", "top", 860, 1420, via=[(1296, 860), (1296, 1212), (1420, 1212)])
    R("Juego-EstadoJuego", "bottom", "top", 1480, 1760, via=[(1480, 1180), (1760, 1180)])
    R("ObservadorJuego-EstadoJuego", "right", "left", 1260, 1260)
    R("EstadoJuego-Evento", "right", "left", 1220, 1220)
    R("JuegoDecorado-Juego", "left", "right", 990, 990)
    R("JuegoDecorado-juego", "left", "right", 1070, 1070)
    # ── sonido ──
    R("JuegoConSonido-JuegoDecorado", "bottom", "top", 1700, 1700)
    R("JuegoConSonido-Sonidos", "right", "left", 230, 230)
    R("JuegoConSonido-Sonido", "right", "left", 330, 450, via=[(1870, 330), (1870, 450)])
    R("Sonido-Evento", "bottom", "top", 1960, 1960)
    R("Sonidos-EstadoSonido", "right", "left", 235, 235)
    so = C["Sonidos"]
    R("Sonidos-instancia", "top", "top", so.x + 40, so.x + 100,
      via=[(so.x + 40, so.y - 22), (so.x + 100, so.y - 22)])
    R("Sonidos-Sonido", "bottom", "top", 1960, 1960)
    arbol(d, ["SonidoActivado", "SonidoSilenciado"], "EstadoSonido", sep=22)
    act, sil = C["SonidoActivado"], C["SonidoSilenciado"]
    R("SonidoActivado-SonidoSilenciado", "right", "left", act.y + 15, act.y + 15)
    R("SonidoSilenciado-SonidoActivado", "bottom", "bottom", sil.x + 50, act.x + 60,
      via=[(sil.x + 50, act.y + act.h + 26), (act.x + 60, act.y + act.h + 26)])
    R("SonidosDeInterfaz-Sonidos", "left", "bottom", 525, 2150, via=[(2150, 525)])
    R("SonidosDeInterfaz-Sonido", "left", "right", 590, 590)
    # ── dominio ──
    R("JuegoSokoban-SujetoJuego", "top", "top", 2210, 1550, via=[(2210, 785), (1550, 785)])
    R("JuegoSokoban-Juego", "left", "right", 925, 975, via=[(1560, 925), (1560, 975)])
    R("JuegoSokoban-observadores", "left", "bottom", 1015, 1500, via=[(2150, 1015), (2150, 1470), (1500, 1470)])
    R("JuegoSokoban-CargadorNivel", "right", "left", 840, 840)
    R("CargadorNivel-EstadoNivel", "right", "left", 840, 840)
    R("JuegoSokoban-EstadoNivel", "right", "left", 1025, 1025)
    R("JuegoSokoban-Puntaje", "bottom", "left", 2400, 1150, via=[(2400, 1150)])
    R("JuegoSokoban-MotorMovimiento", "top", "top", 2330, 3330, via=[(2330, 792), (3330, 792)])
    R("JuegoSokoban-HistorialDeshacer", "bottom", "top", 2250, 1450, via=[(2250, 1482), (1450, 1482)])
    R("JuegoSokoban-MaquinaDelTiempo", "bottom", "top", 2300, 1780, via=[(2300, 1497), (1780, 1497)])
    R("HistorialDeshacer-RecuerdoNivel", "bottom", "top", 1440, 1440)
    R("MaquinaDelTiempo-Punto", "right", "left", 1585, 1585)
    d.contencion("Punto", "MaquinaDelTiempo", [(1990, 1615), (C["MaquinaDelTiempo"].x + C["MaquinaDelTiempo"].w, 1615)])
    R("Punto-RecuerdoNivel", "bottom", "right", 2060, 1840, via=[(2060, 1840)])
    R("EstadoNivel-RecuerdoNivel", "left", "right", 1300, 1800, via=[(2170, 1300), (2170, 1800)])
    R("MotorMovimiento-EstadoNivel", "left", "right", 870, 870)
    R("MotorMovimiento-MediadorMovimiento", "bottom", "top", 3360, 3360)
    R("MotorMovimiento-Caja", "right", "bottom", 900, 3150, via=[(3665, 900), (3665, 1860), (3150, 1860)])
    R("MotorMovimiento-Jugador", "right", "right", 940, 1690, via=[(3650, 940), (3650, 1690)])
    R("EstadoNivel-Caja", "bottom", "top", 3000, 3000)
    R("EstadoNivel-Jugador", "bottom", "top", 3100, 3560, via=[(3100, 1410), (3560, 1410)])
    R("EstadoNivel-MediadorMovimiento", "right", "left", 1290, 1290)
    R("MediadorMovimiento-ElementoMovil", "bottom", "top", 3380, 3380)
    arbol(d, ["Caja", "Jugador"], "ElementoMovil", sep=36)
    R("ElementoMovil-Posicion", "left", "right", 1480, 1480)
    R("Caja-ComportamientoCaja", "left", "right", 1700, 1795, via=[(2895, 1700), (2895, 1795)])
    arbol(d, ["CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"], "ComportamientoCaja", sep=26)

    # ── notas ──
    leyenda(d, 200, 2080, 640)
    d.nota("Cómo leer el diagrama\n"
           "Subrayado = static. + público, - privado, # protegido, ~ de paquete. Cursiva = abstracto.\n"
           "Se dibujan todos los getters y setters públicos. Se omiten las constantes de estilo (colores, fuentes, "
           "tamaños) y los métodos que solo redefinen uno de una interfaz (se leen en la interfaz; los diagramas de "
           "cada patrón los muestran cuando importan). JuegoDecorado y JuegoConSonido sí muestran lo que redefinen.\n"
           "Para no cruzar todo, estas relaciones están en el modelo pero no se dibujan acá (se ven en los diagramas "
           "de cada patrón): MenuPrincipal y PanelAyuda usan Imagenes; PantallaJuego crea los tres comandos "
           "(Command); EstadoNivel crea las estrategias y ComportamientoCaja le avisa al mediador (Strategy); "
           "Main usa Juego (Decorator); SonidosDeInterfaz alterna el estado (State); JuegoSokoban crea EstadoJuego; "
           "SonidoActivado y SonidoSilenciado le cambian el estado a Sonidos; MediadorMovimiento devuelve Evento; "
           "RecuerdoNivel guarda la posición del jugador y las cajas; Direccion la usan Juego.mover y "
           "Posicion.siguiente.",
           880, 2080, 900)
    return d


# ════════════════════════════════════════════════════════════════════════════
# 8. Diagramas por patrón: las mismas clases del modelo con vistas nuevas. Su contenido copia las fichas
#    aprobadas (carpeta-temporal/patrones/*.puml): mismas clases, miembros, relaciones y multiplicidades. El
#    rol de cada clase en el patrón va como rótulo arriba de la caja (en el modelo no es un estereotipo,
#    porque una misma clase cumple roles distintos en patrones distintos).
# ════════════════════════════════════════════════════════════════════════════
NOTA_PATRON = ("#FFFDE7", "#B8892A")


def nota_patron(d, texto, x, y, w, h=None, unir=None):
    return d.nota(texto, x, y, w, color=NOTA_PATRON[0], borde=NOTA_PATRON[1], unir=unir)


def abanico(d, origen, destinos, lado_x, separacion=14):
    """Varias flechas que salen del costado derecho de `origen` hacia el costado izquierdo de cada destino,
    sin cruzarse: cada una baja o sube por su propio carril vertical."""
    o = d.cajas[origen]
    salidas = [o.y + o.h * (k + 1) / (len(destinos) + 1) for k in range(len(destinos))]
    pares = sorted(zip(destinos, salidas), key=lambda p: d.cajas[p[0][1]].y)
    salidas = sorted(salidas)
    arriba = [(dest, s) for (dest, _), s in zip(pares, salidas) if d.cajas[dest[1]].y + 20 < s]
    abajo = [(dest, s) for (dest, _), s in zip(pares, salidas) if d.cajas[dest[1]].y + 20 >= s]
    carriles = {}
    for k, (dest, s) in enumerate(arriba):
        carriles[dest[0]] = (lado_x + k * separacion, s)
    for k, (dest, s) in enumerate(reversed(abajo)):
        carriles[dest[0]] = (lado_x + k * separacion, s)
    for (clave, destino) in destinos:
        x, s = carriles[clave]
        c = d.cajas[destino]
        yt = c.y + min(c.h / 2, 30)
        d.rel(clave, "right", "left", s, yt, via=[(x, s), (x, yt)])


def patron_facade(m):
    d = Diagrama(m, "facade", "Patrón Facade", doc="La vista solo conoce la interfaz Juego; JuegoSokoban coordina el subsistema.")
    d.caja("PantallaJuego", 40, 200, ver=["juego"], rol="«Cliente»")
    d.caja("Juego", 330, 150, rol="«Fachada»")
    d.caja("JuegoSokoban", 640, 250, ver=["nivel", "historial", "maquinaDelTiempo", "puntaje", "cargador"],
           rol="«Fachada concreta»")
    y = 70
    for nombre, ver in (("CargadorNivel", ["cargar"]),
                        ("EstadoNivel", ["conectarMediador", "moverJugador", "crearRecuerdo", "restaurar"]),
                        ("MotorMovimiento", ["intentarMover"]), ("HistorialDeshacer", ["guardar", "deshacer"]),
                        ("MaquinaDelTiempo", ["guardar", "volverAntesDe"]), ("Puntaje", ["registrarDeshacer", "calcular"])):
        c = d.caja(nombre, 1140, y, ver=ver, rol="«Subsistema»")
        y += c.h + 40
    C, R = d.cajas, d.rel
    R("PantallaJuego-Juego", "right", "left", 223, 223)
    R("JuegoSokoban-Juego", "left", "right", 270, 270)
    abanico(d, "JuegoSokoban", [("JuegoSokoban-CargadorNivel", "CargadorNivel"), ("JuegoSokoban-EstadoNivel", "EstadoNivel"),
                                ("JuegoSokoban-MotorMovimiento", "MotorMovimiento"),
                                ("JuegoSokoban-HistorialDeshacer", "HistorialDeshacer"),
                                ("JuegoSokoban-MaquinaDelTiempo", "MaquinaDelTiempo"),
                                ("JuegoSokoban-Puntaje", "Puntaje")], C["JuegoSokoban"].x + C["JuegoSokoban"].w + 40)
    mo, es = C["MotorMovimiento"], C["EstadoNivel"]
    xd = max(mo.x + mo.w, es.x + es.w) + 40
    R("MotorMovimiento-EstadoNivel", "right", "right", mo.y + mo.h / 2, es.y + es.h / 2,
      via=[(xd, mo.y + mo.h / 2), (xd, es.y + es.h / 2)])
    nota_patron(d, "Facade (Luca)\nLa vista habla con UNA interfaz simple: Juego. JuegoSokoban, la fachada concreta, "
                "coordina el subsistema: carga el nivel, le conecta el motor de movimiento, guarda recuerdos para "
                "deshacer y para el DeLorean y calcula el puntaje. La vista no conoce a ninguna de esas clases.",
                40, max(y, 520), 1000)
    return d


def patron_observer(m):
    d = Diagrama(m, "observer", "Patrón Observer", doc="Luca. La vista se actualiza sola cuando cambia la partida.")
    d.caja("SujetoJuego", 40, 80, rol="«Sujeto»")
    d.caja("JuegoSokoban", 40, 290, ver=["observadores"], rol="«Sujeto concreto»")
    d.caja("ObservadorJuego", 560, 290, rol="«Observador»")
    d.caja("PanelHUD", 960, 200, ver=["actualizar"], rol="«Observador concreto»")
    d.caja("PanelTablero", 960, 380, ver=["actualizar"], rol="«Observador concreto»")
    C, R = d.cajas, d.rel
    R("JuegoSokoban-SujetoJuego", "top", "bottom", 120, 120)
    ob = C["ObservadorJuego"]
    yo = ob.y + ob.h / 2
    R("JuegoSokoban-observadores", "right", "left", yo, yo)
    for s in ("PanelHUD", "PanelTablero"):
        k = C[s]
        R(f"{s}-ObservadorJuego", "left", "right", k.y + k.h / 2, yo, via=[(910, k.y + k.h / 2), (910, yo)])
    nota_patron(d, "Observer (Luca)\nSujeto: SujetoJuego (agregarObservador, quitarObservador, notificarObservadores). "
                "Juego la extiende y JuegoSokoban la implementa: guarda la lista de observadores y, después de cada "
                "cambio, les manda el EstadoJuego. Observadores: PanelHUD y PanelTablero implementan ObservadorJuego.",
                40, 520, 1000)
    return d


def patron_singleton(m):
    d = Diagrama(m, "singleton", "Patrón Singleton", doc="Imagenes (Luca) y Sonidos (Mora): una única instancia.")
    fila(d, ["PanelTablero", "PanelHUD"], 40, 60, 40, sin_miembros=True, rol="«Cliente»")
    d.caja("JuegoConSonido", 600, 60, sin_miembros=True, rol="«Cliente»")
    d.caja("SonidosDeInterfaz", 800, 60, sin_miembros=True, rol="«final» «Cliente»")
    d.caja("Imagenes", 40, 210, ver=["instancia", "cache", "Imagenes", "obtenerInstancia", "obtener"],
           rol="«final» «Singleton»")
    d.caja("Sonidos", 600, 210, ver=["instancia", "clips", "Sonidos", "obtenerInstancia", "reproducir"],
           rol="«final» «Singleton»")
    C, R = d.cajas, d.rel
    for s, dest, clave in (("PanelTablero", "Imagenes", "PanelTablero-Imagenes"), ("PanelHUD", "Imagenes", "PanelHUD-Imagenes"),
                           ("JuegoConSonido", "Sonidos", "JuegoConSonido-Sonidos"),
                           ("SonidosDeInterfaz", "Sonidos", "SonidosDeInterfaz-Sonidos")):
        k, t = C[s], C[dest]
        x = min(k.x + k.w / 2, t.x + t.w - 20)
        R(clave, "bottom", "top", x, x)
    for nombre, clave in (("Imagenes", "Imagenes-instancia"), ("Sonidos", "Sonidos-instancia")):
        k = C[nombre]
        R(clave, "right", "right", k.y + 40, k.y + 80, via=[(k.x + k.w + 40, k.y + 40), (k.x + k.w + 40, k.y + 80)])
    nota_patron(d, "Singleton\nConstructor privado, atributo static instancia y obtenerInstancia() static: toda la "
                "aplicación comparte una sola caché de imágenes (Imagenes, Luca) y un solo reproductor de sonidos "
                "(Sonidos, Mora). Cada imagen y cada .wav se lee del disco una sola vez.", 40, 430, 900)
    return d


def patron_strategy(m):
    d = Diagrama(m, "strategy", "Patrón Strategy", doc="Pedro y Lucía. Cada tipo de caja decide qué pasa después de un empuje.")
    d.caja("EstadoNivel", 40, 60, ver=["cajas", "EstadoNivel"], rol="«Cliente: elige la estrategia»")
    d.caja("MotorMovimiento", 40, 260, ver=["cajas", "intentarMover"], rol="«Cliente: dispara el empuje»")
    d.caja("Caja", 460, 180, ver=["comportamiento", "resistencia", "Caja", "despuesDeEmpujar", "getSimbolo"],
           rol="«Contexto»")
    C, R = d.cajas, d.rel
    ca = C["Caja"]
    d.caja("ComportamientoCaja", ca.x + ca.w + 120, 190, rol="«Estrategia»")
    cc = C["ComportamientoCaja"]
    fila(d, ["CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"], 460, 430, 30,
         ver=["despuesDeEmpujar", "simbolo"], rol="«Estrategia concreta»")
    es, mo = C["EstadoNivel"], C["MotorMovimiento"]
    R("EstadoNivel-Caja", "right", "left", es.y + 30, ca.y + 25, via=[(420, es.y + 30), (420, ca.y + 25)])
    R("MotorMovimiento-Caja", "right", "left", mo.y + 25, mo.y + 25)
    R("Caja-ComportamientoCaja", "right", "left", cc.y + cc.h / 2, cc.y + cc.h / 2)
    arbol(d, ["CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"], "ComportamientoCaja", sep=60)
    fondo = max(C[s].y + C[s].h for s in ("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy"))
    for k, s in enumerate(("CajaNormalStrategy", "CajaFragilStrategy", "CajaLlaveStrategy")):
        st = C[s]
        y = fondo + 30 + k * 14
        R(f"EstadoNivel-{s}", "left", "bottom", es.y + es.h - 12, st.x + 40,
          via=[(20, es.y + es.h - 12), (20, y), (st.x + 40, y)])
    nota_patron(d, "Strategy (Pedro y Lucía)\nContexto: Caja, que guarda su comportamiento. Estrategia: "
                "ComportamientoCaja. Normal no hace nada ($); Frágil pierde resistencia y avisa cajaDanada y, a los 3 "
                "empujes, cajaRota (F, f); Llave avisa llaveEmpujada y, sobre un cerrojo, se abren los muros (L).\n"
                "EstadoNivel elige la estrategia al leer el nivel (new); MotorMovimiento dispara el empuje y la caja "
                "le pasa el mediador a su comportamiento.", 40, fondo + 90, 1100)
    return d


def patron_mediator(m):
    d = Diagrama(m, "mediator", "Patrón Mediator", doc="Pedro y Lucía. Los elementos móviles solo hablan con el mediador.")
    d.caja("MediadorMovimiento", 470, 60, rol="«Mediador»")
    d.caja("MotorMovimiento", 40, 300, ver=["nivel", "jugador", "cajas", "evento", "MotorMovimiento", "estaLibre",
                                            "cajaEn", "deslizar"], rol="«Mediador concreto»")
    C, R = d.cajas, d.rel
    me, mo = C["MediadorMovimiento"], C["MotorMovimiento"]
    d.caja("ElementoMovil", me.x + me.w + 200, 60, ver=["posicion", "mediador", "conectar", "setPosicion"],
           rol="«abstract» «Colega»")
    el = C["ElementoMovil"]
    d.caja("Jugador", el.x - 120, 300, ver=["mover"], rol="«Colega concreto»")
    d.caja("Caja", el.x + 150, 300, ver=["despuesDeEmpujar"], rol="«Colega concreto»")
    xm = me.x + me.w / 2
    R("MotorMovimiento-MediadorMovimiento", "top", "bottom", mo.x + mo.w / 2, xm,
      via=[(mo.x + mo.w / 2, 250), (xm, 250)])
    R("MediadorMovimiento-ElementoMovil", "right", "left", 110, 110)
    arbol(d, ["Jugador", "Caja"], "ElementoMovil", sep=50)
    nota_patron(d, "Mediator (Pedro y Lucía)\nColegas: Jugador y Caja, que extienden ElementoMovil. El mediador y los "
                "colegas se conocen: cada colega guarda el mediador (conectar) y el motor guarda al jugador y a las "
                "cajas. El jugador pide intentarMover(direccion); la estrategia de una caja avisa cajaDanada, "
                "cajaRota o llaveEmpujada. MotorMovimiento concentra las reglas: colisiones, empuje y deslizamiento "
                "sobre hielo.", 40, 560, 1000)
    return d


def patron_decorator(m):
    d = Diagrama(m, "decorator", "Patrón Decorator", doc="Mora. JuegoConSonido le agrega sonido a cualquier Juego.")
    d.caja("Main", 40, 60, ver=["main"], rol="«final» «Cliente»")
    d.caja("Juego", 420, 60, ver=["iniciarNivel", "mover", "deshacer", "reiniciar", "viajarEnElTiempo", "getEstado"],
           rol="«Componente»")
    d.caja("JuegoSokoban", 220, 340, ver=["mover", "getEstado"], rol="«Componente concreto»")
    d.caja("JuegoDecorado", 620, 340, ver=["juego", "JuegoDecorado", "mover", "getEstado"], rol="«abstract» «Decorador»")
    C, R = d.cajas, d.rel
    jd = C["JuegoDecorado"]
    d.caja("JuegoConSonido", 620, jd.y + jd.h + 90, ver=["JuegoConSonido", "mover", "sonarLoQuePaso"],
           rol="«Decorador concreto»")
    mn, ju, jc = C["Main"], C["Juego"], C["JuegoConSonido"]
    R("Main-Juego", "right", "left", 90, 90)
    R("Main-JuegoConSonido", "bottom", "left", 100, jc.y + 40, via=[(100, jc.y + 40)])
    arbol(d, ["JuegoSokoban", "JuegoDecorado"], "Juego", sep=50)
    xr = jd.x + jd.w + 60
    R("JuegoDecorado-juego", "right", "right", jd.y + 30, ju.y + ju.h / 2, via=[(xr, jd.y + 30), (xr, ju.y + ju.h / 2)])
    R("JuegoConSonido-JuegoDecorado", "top", "bottom", jd.x + 60, jd.x + 60)
    nota_patron(d, "Decorator (Mora)\nComponente: Juego. Componente concreto: JuegoSokoban. Decorador: JuegoDecorado "
                "(abstracta), que implementa Juego, guarda el Juego envuelto y le delega todo. Decorador concreto: "
                "JuegoConSonido, que después de cada acción hace sonar el efecto del evento (Sonido.de(evento)).\n"
                "En Main: new JuegoConSonido(new JuegoSokoban(new CargadorNivel(carpeta))).",
                40, jc.y + jc.h + 50, 1000)
    return d


def patron_state(m):
    d = Diagrama(m, "state", "Patrón State", doc="Mora. El sonido activado o silenciado; la tecla M alterna.")
    d.caja("SonidosDeInterfaz", 40, 60, ver=["alApretarTecla"], rol="«final» «Cliente»")
    d.caja("Sonidos", 40, 220, ver=["estado", "reproducir", "alternarSonido", "establecerEstado", "detenerTodo"],
           rol="«final» «Contexto»")
    C, R = d.cajas, d.rel
    so = C["Sonidos"]
    d.caja("EstadoSonido", so.x + so.w + 160, 230, rol="«Estado»")
    es = C["EstadoSonido"]
    d.caja("SonidoActivado", es.x - 160, 440, ver=["reproducir", "alternar"], rol="«Estado concreto»")
    act = C["SonidoActivado"]
    d.caja("SonidoSilenciado", act.x + act.w + 160, 440, ver=["reproducir", "alternar"], rol="«Estado concreto»")
    sil = C["SonidoSilenciado"]
    R("SonidosDeInterfaz-Sonidos-estado", "bottom", "top", 120, 120)
    R("Sonidos-EstadoSonido", "right", "left", 260, 260)
    arbol(d, ["SonidoActivado", "SonidoSilenciado"], "EstadoSonido", sep=60)
    R("SonidoActivado-SonidoSilenciado", "right", "left", act.y + 18, act.y + 18)
    R("SonidoSilenciado-SonidoActivado", "bottom", "bottom", sil.x + 60, act.x + act.w - 60,
      via=[(sil.x + 60, act.y + act.h + 40), (act.x + act.w - 60, act.y + act.h + 40)])
    nota_patron(d, "State (Mora)\nContexto: Sonidos, que guarda el estado actual. Estado: EstadoSonido (interfaz de "
                "paquete). SonidoActivado reproduce el Clip; SonidoSilenciado no hace nada. La tecla M "
                "(SonidosDeInterfaz) llama a alternarSonido() y cada estado decide a cuál pasa: alternar crea el "
                "estado siguiente y se lo da al contexto.", 40, act.y + act.h + 80, 1000)
    return d


def patron_memento(m):
    d = Diagrama(m, "memento", "Patrón Memento", doc="Martín. Deshacer y DeLorean guardan recuerdos del nivel.")
    d.caja("JuegoSokoban", 40, 60, ver=["mover", "deshacer", "viajarEnElTiempo"], rol="«Cliente»")
    d.caja("EstadoNivel", 40, 300, ver=["terreno", "cajas", "movimientos", "crearRecuerdo", "restaurar", "viajarA"],
           rol="«Originador»")
    C, R = d.cajas, d.rel
    en = C["EstadoNivel"]
    d.caja("RecuerdoNivel", en.x + en.w + 120, 300, rol="«final» «Memento»")
    rn = C["RecuerdoNivel"]
    d.caja("HistorialDeshacer", rn.x, 60, ver=["recuerdos", "guardar", "deshacer"], rol="«Cuidador: deshacer»")
    hd = C["HistorialDeshacer"]
    d.caja("MaquinaDelTiempo", hd.x + hd.w + 80, 60, ver=["puntos", "guardar", "volverAntesDe"],
           rol="«Cuidador: DeLorean»")
    mq = C["MaquinaDelTiempo"]
    d.caja("Punto", mq.x + mq.w + 120, 70)
    pt, js = C["Punto"], C["JuegoSokoban"]
    R("JuegoSokoban-EstadoNivel", "bottom", "top", 100, 100)
    R("JuegoSokoban-HistorialDeshacer", "right", "left", js.y + 20, js.y + 20)
    xm = mq.x + mq.w / 2
    R("JuegoSokoban-MaquinaDelTiempo", "top", "top", js.x + js.w - 40, xm, via=[(js.x + js.w - 40, 30), (xm, 30)])
    R("EstadoNivel-RecuerdoNivel", "right", "left", en.y + 30, en.y + 30)
    R("HistorialDeshacer-RecuerdoNivel", "bottom", "top", hd.x + 60, hd.x + 60)
    R("MaquinaDelTiempo-Punto", "right", "left", pt.y + 15, pt.y + 15)
    d.contencion("Punto", "MaquinaDelTiempo", [(pt.x, pt.y + 48), (mq.x + mq.w, pt.y + 48)])
    xp = pt.x + pt.w / 2
    R("Punto-RecuerdoNivel", "bottom", "right", xp, rn.y + 40, via=[(xp, rn.y + 40)])
    nota_patron(d, "Memento (Martín)\nOriginador: EstadoNivel crea el recuerdo (crearRecuerdo) y lo lee (restaurar, "
                "viajarA). Memento: RecuerdoNivel, con constructor y lectores de paquete (~): nadie más puede "
                "leerlo. Cuidadores: HistorialDeshacer (15 recuerdos, cada deshacer vuelve 5 pasos, máximo 3 "
                "seguidos) y MaquinaDelTiempo (10 puntos en el tiempo, uno por cada caja que llega a destino). "
                "JuegoSokoban usa a los tres.", 40, max(en.y + en.h, rn.y + rn.h) + 50, 1100)
    return d


def patron_command(m):
    d = Diagrama(m, "command", "Patrón Command", doc="Martín. Cada acción del jugador es un objeto que se puede repetir.")
    d.caja("PantallaJuego", 40, 80, ver=["mover", "deshacer", "viajarEnElTiempo"], rol="«Cliente»")
    d.caja("GrabadoraDePartida", 440, 80, ver=["comandos", "ejecutar", "reproducir", "saltarAlFinal"], rol="«Invocador»")
    C, R = d.cajas, d.rel
    gr = C["GrabadoraDePartida"]
    d.caja("Comando", gr.x + gr.w + 160, 110, rol="«Comando»")
    co = C["Comando"]
    fila(d, ["ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"], 560, 330, 40, ver=["juego", "direccion", "ejecutar"],
         rol="«Comando concreto»")
    d.caja("Juego", 760, 560, ver=["mover", "deshacer", "viajarEnElTiempo"], rol="«Receptor»")
    pj, ju = C["PantallaJuego"], C["Juego"]
    R("PantallaJuego-GrabadoraDePartida", "right", "left", 110, 110)
    R("GrabadoraDePartida-Comando", "right", "left", co.y + 25, co.y + 25)
    arbol(d, ["ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"], "Comando", sep=60)
    for s in ("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo"):
        k = C[s]
        R(f"{s}-Juego", "bottom", "top", k.x + k.w - 40, ju.x + ju.w / 2, via=[(k.x + k.w - 40, 520), (ju.x + ju.w / 2, 520)])
    for k_, s in enumerate(("ComandoMover", "ComandoDeshacer", "ComandoViajarEnElTiempo")):
        k = C[s]
        xo = pj.x + 50 + 40 * k_
        if s == "ComandoMover":
            R(f"PantallaJuego-{s}", "bottom", "left", xo, k.y + 30, via=[(xo, k.y + 30)])
        else:
            y = 470 + 14 * k_
            R(f"PantallaJuego-{s}", "bottom", "bottom", xo, k.x + 30, via=[(xo, y), (k.x + 30, y)])
    nota_patron(d, "Command (Martín)\nCliente: PantallaJuego crea un comando por cada tecla o botón (new). Invocador: "
                "GrabadoraDePartida lo ejecuta, lo guarda en comandos y después puede reproducir la partida (uno "
                "cada 160 ms) o saltar al final. Comandos concretos: ComandoMover, ComandoDeshacer y "
                "ComandoViajarEnElTiempo. Receptor: Juego.", 40, ju.y + ju.h + 50, 1000)
    return d


DIAGRAMAS = [diagrama_completo, patron_facade, patron_observer, patron_singleton, patron_strategy,
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
