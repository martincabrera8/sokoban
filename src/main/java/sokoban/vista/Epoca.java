package sokoban.vista;

/**
 * Época de cada nivel (diseño del grupo: 1955, 1985 y 2015). Cada una tiene su
 * fondo, su piso y su pared, así el tablero y el fondo combinan.
 * Los niveles van rotando: 1 → 1955, 2 → 1985, 3 → 2015, 4 → 1955, ...
 * Para sumar una época alcanza con agregar una constante.
 */
public enum Epoca {

    HILL_VALLEY_1955("backgrounds/background_hill_valley_1955", "tiles/floor_1955", "tiles/wall_brick"),
    MALL_1985("backgrounds/background_mall_1985", "tiles/floor_1985", "tiles/wall_mall"),
    FUTURO_2015("backgrounds/background_future_2015", "tiles/floor_2015", "tiles/wall_future");

    /** Capa genérica: se reemplaza por el piso de la época. */
    public static final String PISO = "{piso}";
    /** Capa genérica: se reemplaza por la pared de la época. */
    public static final String PARED = "{pared}";

    private final String fondo;
    private final String piso;
    private final String pared;

    Epoca(String fondo, String piso, String pared) {
        this.fondo = fondo;
        this.piso = piso;
        this.pared = pared;
    }

    public static Epoca delNivel(int nivel) {
        Epoca[] epocas = values();
        return epocas[Math.floorMod(nivel - 1, epocas.length)];
    }

    public String getFondo() {
        return fondo;
    }

    /** Devuelve la imagen real de una capa: el piso y la pared dependen de la época. */
    public String resolver(String capa) {
        if (PISO.equals(capa)) {
            return piso;
        }
        if (PARED.equals(capa)) {
            return pared;
        }
        return capa;
    }
}
