const { chromium } = require('playwright');
(async () => {
  const [,, salida, ancho, alto, slide, ...tiempos] = process.argv;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: +ancho, height: +alto } });
  p.on('pageerror', e => console.log('PAGEERROR ' + e.message));
  await p.goto('file://' + process.env.HTML + '#' + slide);
  await p.waitForTimeout(2500);
  for (const t of tiempos) {
    await p.evaluate((t) => window.__presentacion.seek(+t), t);
    await p.waitForTimeout(800);
    await p.screenshot({ path: `${salida}/v_${slide}_${t}.png` });
  }
  await b.close();
})();
