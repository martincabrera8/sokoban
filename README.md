# Sokoban

Trabajo integrador de Proceso de Desarrollo de Software (UADE): Sokoban en Java con Swing.

## Consigna

[Consigna del trabajo integrador — Prof. Jonathan Pepe](docs/consigna-prof-pepe.pdf)

## Cómo ejecutarlo

Requisito: **Java 17 o superior**. Se ejecuta desde la **raíz del repositorio**.

- **Con Maven**: `mvn package` y después `java -jar target/sokoban.jar` (el `.jar` ya incluye las imágenes).
- **VS Code / IntelliJ / Eclipse / NetBeans**: abrir la carpeta (se importa como proyecto Maven) y ejecutar `sokoban.Main`.

Controles: **flechas** para mover, **Esc** para pausar y botones de deshacer, reiniciar y pausa en el HUD.

## Equipo y estado

| Parte | Autor | Estado |
|---|---|---|
| Arte y recursos (`assets/`) | Martín | Listo e integrado |
| Interfaz gráfica Swing (`sokoban.vista`, `sokoban.modelo`) | Luca | Lista e integrada |
| Dominio y personaje | — | Pendiente |
| Música y sonido | — | Pendiente |

## Documentación

- [Integración, autoría y lo que falta](docs/integracion.md)
- [Diagrama de clases completo](docs/uml/diagrama-completo.png) (fuente: [`diagrama-completo.puml`](docs/uml/diagrama-completo.puml))
- [Interfaz gráfica: diseño, patrones y cómo conectar el dominio](docs/interfaz.md)
