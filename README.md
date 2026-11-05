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

## Presentación

[`presentacion/dist/presentacion-sokoban.html`](presentacion/dist/presentacion-sokoban.html): presentación animada en 2D y 3D, offline (abrir con Chrome o Edge y F11). Teclas y cómo editarla en [`presentacion/README.md`](presentacion/README.md).

## Documentación

- [Integración, autoría y lo que falta](docs/integracion.md)
- **[Guía del proyecto (PDF)](docs/guia/Guia-del-proyecto-Sokoban.pdf)**: cada clase y cada patrón explicados, con listas de chequeo para validarlos
- Diagramas UML en [`docs/uml/`](docs/uml/): [cómo leer las flechas](docs/uml/0-como-leer-flechas.png), [vista general](docs/uml/1-vista-general.png), [diagrama completo](docs/uml/2-diagrama-completo.png), [Observer](docs/uml/3-patron-observer.png), [Facade](docs/uml/4-patron-facade.png), [Singleton](docs/uml/5-patron-singleton.png), [MVC](docs/uml/6-mvc.png) y [secuencia al mover](docs/uml/7-secuencia-mover.png)
- [Interfaz gráfica: diseño, patrones y cómo conectar el dominio](docs/interfaz.md)
