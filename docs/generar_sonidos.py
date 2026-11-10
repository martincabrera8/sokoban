"""
Genera los efectos de sonido del Sokoban en assets/sonidos/ (WAV, 16 bits, mono, 44.1 kHz).

Los sonidos se sintetizan por código (ondas + ruido), así que son 100% propios y se
pueden liberar como dominio público, como pide la consigna.

Uso (desde la raíz del repositorio):  python docs/generar_sonidos.py
Autor: Marcelo Coghlan
"""
import math
import random
import struct
import wave
from pathlib import Path

FRECUENCIA_MUESTREO = 44100
CARPETA = Path(__file__).resolve().parent.parent / "assets" / "sonidos"
random.seed(1980)  # mismo resultado cada vez que se ejecuta


def tono(frecuencia, duracion, volumen=0.5, forma="seno", caida=4.0, frecuencia_final=None):
    """Una nota con envolvente (ataque corto + caída exponencial). Puede deslizarse de frecuencia."""
    total = int(duracion * FRECUENCIA_MUESTREO)
    final = frecuencia if frecuencia_final is None else frecuencia_final
    muestras, fase = [], 0.0
    for i in range(total):
        t = i / FRECUENCIA_MUESTREO
        f = frecuencia + (final - frecuencia) * (i / total)
        fase += 2 * math.pi * f / FRECUENCIA_MUESTREO
        if forma == "cuadrada":
            valor = 1.0 if math.sin(fase) >= 0 else -1.0
            valor *= 0.5
        elif forma == "triangulo":
            valor = 2 / math.pi * math.asin(math.sin(fase))
        else:
            valor = math.sin(fase)
        ataque = min(1.0, t / 0.005)
        envolvente = ataque * math.exp(-caida * t)
        muestras.append(valor * envolvente * volumen)
    return muestras


def ruido(duracion, volumen=0.5, caida=10.0, suavizado=0.0):
    """Ruido blanco con caída (golpes, roturas). suavizado > 0 lo hace más grave."""
    total = int(duracion * FRECUENCIA_MUESTREO)
    muestras, anterior = [], 0.0
    for i in range(total):
        t = i / FRECUENCIA_MUESTREO
        valor = random.uniform(-1, 1)
        anterior = anterior * suavizado + valor * (1 - suavizado)
        muestras.append(anterior * math.exp(-caida * t) * volumen)
    return muestras


def silencio(duracion):
    return [0.0] * int(duracion * FRECUENCIA_MUESTREO)


def mezclar(*pistas):
    largo = max(len(p) for p in pistas)
    return [sum(p[i] for p in pistas if i < len(p)) for i in range(largo)]


def seguido(*partes):
    resultado = []
    for parte in partes:
        resultado.extend(parte)
    return resultado


def guardar(nombre, muestras):
    pico = max(0.001, max(abs(m) for m in muestras))
    escala = min(1.0, 0.9 / pico)
    with wave.open(str(CARPETA / f"{nombre}.wav"), "wb") as archivo:
        archivo.setnchannels(1)
        archivo.setsampwidth(2)
        archivo.setframerate(FRECUENCIA_MUESTREO)
        archivo.writeframes(b"".join(struct.pack("<h", int(m * escala * 32767)) for m in muestras))
    print(f"  {nombre}.wav")


DO, MI, SOL, DO2, MI2, SOL2 = 523.25, 659.25, 783.99, 1046.5, 1318.5, 1568.0


def main():
    CARPETA.mkdir(parents=True, exist_ok=True)
    print(f"Generando sonidos en {CARPETA}")

    # Arranque de la app: arpegio ascendente
    guardar("arranque", seguido(*[tono(f, 0.14, 0.45, "triangulo", 6) for f in (DO, MI, SOL)],
                                tono(DO2, 0.5, 0.5, "triangulo", 4)))
    # Comienza (o se reinicia desde el menú) un nivel: dos notas
    guardar("inicio_nivel", seguido(tono(SOL, 0.12, 0.4, "triangulo", 8), tono(DO2, 0.3, 0.45, "triangulo", 7)))
    # Paso del jugador: blip suave y corto
    guardar("paso", mezclar(tono(220, 0.06, 0.35, "triangulo", 50), ruido(0.04, 0.08, 80, 0.6)))
    # Empuje de caja: golpe grave de madera
    guardar("empuje", mezclar(tono(110, 0.16, 0.6, "seno", 25, 70), ruido(0.12, 0.35, 35, 0.85)))
    # Caja sobre su destino: "ding" brillante
    guardar("caja_destino", mezclar(tono(MI2, 0.4, 0.4, "seno", 7), tono(SOL2, 0.4, 0.25, "seno", 7)))
    # Caja frágil que recibe un empuje y se daña: crujido corto
    guardar("caja_danada", mezclar(ruido(0.15, 0.5, 30, 0.3), tono(180, 0.12, 0.3, "cuadrada", 30, 120)))
    # Caja frágil que se rompe: estallido de ruido largo
    guardar("caja_rota", seguido(ruido(0.05, 0.9, 5, 0.0),
                                 mezclar(ruido(0.4, 0.6, 9, 0.5), tono(90, 0.3, 0.4, "seno", 10, 50))))
    # Caja llave en el cerrojo: "clic" metálico + campanita (se abren los muros)
    guardar("cerrojo", seguido(mezclar(tono(2000, 0.04, 0.4, "cuadrada", 60), ruido(0.03, 0.3, 90)),
                               silencio(0.05),
                               tono(880, 0.12, 0.35, "triangulo", 10), tono(1318.5, 0.3, 0.4, "triangulo", 6)))
    # Deshacer: barrido descendente
    guardar("deshacer", tono(900, 0.25, 0.4, "triangulo", 5, 300))
    # Reiniciar nivel: barrido bajada-subida
    guardar("reiniciar", seguido(tono(700, 0.12, 0.4, "triangulo", 4, 250), tono(250, 0.18, 0.4, "triangulo", 4, 800)))
    # Victoria: fanfarria
    guardar("victoria", seguido(*[tono(f, 0.12, 0.45, "cuadrada", 8) for f in (DO, MI, SOL, DO2)],
                                silencio(0.05),
                                mezclar(tono(DO2, 0.7, 0.4, "cuadrada", 3), tono(MI2, 0.7, 0.3, "triangulo", 3))))
    # Derrota: "trombón triste" descendente
    guardar("derrota", seguido(tono(392, 0.3, 0.45, "cuadrada", 2), tono(370, 0.3, 0.45, "cuadrada", 2),
                               tono(349, 0.3, 0.45, "cuadrada", 2), tono(330, 0.8, 0.45, "cuadrada", 2, 300)))
    # Choque contra pared / movimiento imposible: golpe sordo
    guardar("choque", mezclar(tono(80, 0.1, 0.6, "seno", 40), ruido(0.06, 0.2, 60, 0.9)))
    # Clic de botón de la interfaz
    guardar("clic", mezclar(tono(1200, 0.03, 0.35, "cuadrada", 120), ruido(0.015, 0.15, 200)))
    # DeLorean: el jugador junta plutonio (zumbido que sube)
    guardar("plutonio", mezclar(tono(440, 0.25, 0.35, "cuadrada", 6, 1320), tono(880, 0.25, 0.2, "seno", 6, 1760)))
    # DeLorean: viaje en el tiempo (barrido que sube, destello y eco que baja)
    guardar("viaje_tiempo", seguido(mezclar(tono(150, 0.45, 0.45, "cuadrada", 1.5, 1800), ruido(0.45, 0.15, 2, 0.4)),
                                    mezclar(ruido(0.08, 0.8, 30, 0.0), tono(2200, 0.1, 0.3, "seno", 20)),
                                    tono(1600, 0.5, 0.35, "triangulo", 5, 200)))


if __name__ == "__main__":
    main()
