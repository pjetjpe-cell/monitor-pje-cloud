// Uso: node render_pdf.js /caminho/entrada.html /caminho/saida.pdf "Texto do rodapé"
// Playwright/Chromium já vêm instalados no ambiente (require('playwright') funciona de qualquer pasta).
const { chromium } = require('playwright');
(async () => {
  const [html, pdf, rodape = 'Leitura estratégica'] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + html);
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  await p.pdf({
    path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true, headerTemplate: '<span></span>',
    footerTemplate: `<div style="width:100%;font:8px Inter,sans-serif;color:#7a8296;padding:0 14mm;display:flex;justify-content:space-between"><span>${esc(rodape)}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  });
  await b.close();
})();
