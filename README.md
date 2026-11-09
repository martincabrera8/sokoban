# Sokoban

Trabajo integrador de Proceso de Desarrollo de Software (UADE): Sokoban en Java con Swing.

## Cómo ejecutarlo

Requisito: **Java 17 o superior**. Se ejecuta desde la **raíz del repositorio**.

- **Con Maven**: `mvn package` y después `java -jar target/sokoban.jar` (el `.jar` ya incluye las imágenes, los sonidos y los niveles).
- **VS Code / IntelliJ / Eclipse / NetBeans**: abrir la carpeta (se importa como proyecto Maven) y ejecutar `sokoban.Main`.

Controles: **flechas** para mover, **Esc** para pausar, **M** para silenciar y botones de deshacer, reiniciar y pausa en el HUD.

Los niveles están en `niveles/nivelN.txt` (un carácter por celda).

## Equipo y estado

| Parte | Autor | Estado |
|---|---|---|
| Arte y recursos (`assets/`) | Martín | Listo e integrado |
| Interfaz gráfica Swing (`sokoban.vista`, interfaces de `sokoban.modelo`) | Luca | Lista e integrada |
| Dominio y personaje (`sokoban.modelo`, `niveles/`) | Pedro y Lucía | Listo e integrado |
| Sonido (`sokoban.sonido`, `assets/sonidos/`) | Mora | Listo e integrado |
