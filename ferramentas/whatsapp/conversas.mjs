#!/usr/bin/env node
/**
 * Lista os títulos das conversas que casam com um termo — SOMENTE LEITURA.
 * Serve para achar o nome exato antes do baixar.mjs: as conversas mudam de
 * nome ("GAV Falta Gabriel Rocha (Washington)" virou "GAV Gabriel VALTEMIR
 * (Washington)"), e o baixar.mjs recusa abrir conversa de nome diferente.
 *
 *   node conversas.mjs "Gabriel"        [--porta 9222]
 */
import { chromium } from 'playwright';

const termo = process.argv[2];
const iPorta = process.argv.indexOf('--porta');
const porta = iPorta > 0 ? Number(process.argv[iPorta + 1]) : 9222;
if (!termo) { console.error('uso: node conversas.mjs "termo" [--porta 9222]'); process.exit(2); }

const nav = await chromium.connectOverCDP(`http://localhost:${porta}`).catch(() => null);
if (!nav) { console.error(`ERRO: não consegui falar com o Chrome na porta ${porta}.`); process.exit(1); }
let pagina = null;
for (const c of nav.contexts()) for (const p of c.pages()) if (p.url().includes('web.whatsapp.com')) pagina = p;
if (!pagina) { console.error('ERRO: nenhuma aba em web.whatsapp.com nessa janela.'); process.exit(1); }
const busca = pagina.locator('#side input[type="text"], input[aria-label*="esquisar" i], div[contenteditable="true"][data-tab="3"]').first();
await busca.click();
await pagina.keyboard.press('Control+A');
await pagina.keyboard.press('Backspace');
await pagina.keyboard.type(termo, { delay: 40 });
await pagina.waitForTimeout(3000);
const titulos = await pagina.evaluate(() => [...document.querySelectorAll('#pane-side span[title], #side span[title]')]
  .map((s) => s.getAttribute('title')).filter(Boolean));
const filtros = new Set(['Tudo', 'Não lidas', 'Favoritas', 'Grupos']);
const lista = [...new Set(titulos)].filter((t) => !filtros.has(t) && !t.includes('•'));
console.log(JSON.stringify(lista, null, 1));
await pagina.keyboard.press('Control+A').catch(() => {});
await pagina.keyboard.press('Backspace').catch(() => {});
await nav.close().catch(() => {});
process.exit(0);
