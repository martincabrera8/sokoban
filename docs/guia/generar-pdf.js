// Genera docs/guia/Guia-del-proyecto-Sokoban.pdf a partir de guia.html.
// Uso (desde la raíz del repo):  node docs/guia/generar-pdf.js
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const html = path.join(__dirname, 'guia.html');
  const pdf = path.join(__dirname, 'Guia-del-proyecto-Sokoban.pdf');
  const navegador = await chromium.launch();
  const pagina = await navegador.newPage();
  await pagina.goto('file://' + html, { waitUntil: 'networkidle' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await navegador.close();
  console.log('PDF generado: ' + pdf);
})();
