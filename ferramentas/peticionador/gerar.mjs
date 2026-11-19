#!/usr/bin/env node
/**
 * Gera a petição inicial pelo Peticionador GAV v5.1 (o HTML do escritório, com
 * timbre, advogados e layout), sem alterar o modelo: preenche os controles da
 * tela, roda a "Extração local" sobre o texto do extrato, deixa o peticionador
 * montar a peça e imprime como o botão "Imprimir / Salvar PDF (layout de impressão)".
 *
 * Uso: node gerar.mjs <peticionador.html> <caso.json> <saida.pdf>
 * caso.json (sem dado de cliente neste repositório; fica na pasta do cliente):
 *   extrato  texto do 03 EXTRATO DE PAGAMENTOS (PyMuPDF get_text)
 *   tipo     gratuita | parcelamento | custas      nparc  6 | 12
 *   adv      índice do <select id="adv"> (5 = Gilzielle)   advFem  true/false
 *   data     "19 de novembro de 2026"
 *   autores  [{genero:"f"}, {genero:"m"}]  (2º autor liga cAutor2)
 *   campos   {id: texto} — autorNome, autorNacionalidade, autorEstadoCivil,
 *            autorProfissao, autorCPF, autorEndereco, autorCEP, autor2*, comarcaPeca, f_vcontrato
 *   checks   {id: true/false} — cBloco6, cCasos, cGrupoEcoIni...
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const [,, html, casoArq, saida] = process.argv;
const c = JSON.parse(fs.readFileSync(casoArq, 'utf8'));
const b = await chromium.launch(); const ctx = await b.newContext();
const p = await ctx.newPage();
p.on('dialog', d => d.accept());
p.on('pageerror', e => console.error('ERRO NA PÁGINA:', e.message));
await p.goto('file://' + html); await p.waitForTimeout(1500);
const log = await p.evaluate(async (c) => {
  const $ = (id) => document.getElementById(id);
  const set = (id, v) => { const e = $(id); if (!e) throw new Error('sem campo ' + id); if ('value' in e && e.tagName !== 'SPAN') { e.value = v; } else { e.textContent = v; } e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); };
  const chk = (id, v) => { const e = $(id); e.checked = v; e.dispatchEvent(new Event('change', { bubbles: true })); };
  switchTab('inicial');
  if ($('cModoIA')?.checked) chk('cModoIA', false);
  set('extratoInput', c.extrato); applyExtratos();
  const logEx = ($('extratorLog') || {}).textContent || '';
  set('tipo', c.tipo); set('nParcIni', String(c.nparc)); set('adv', String(c.adv)); set('dataPet', c.data);
  set('generoAutor', c.autores[0].genero);
  if (c.autores[1]) { chk('cAutor2', true); set('generoAutor2', c.autores[1].genero); }
  for (const [id, v] of Object.entries(c.campos || {})) set(id, v);
  for (const [id, v] of Object.entries(c.checks || {})) chk(id, v);
  if (typeof render === 'function') render();
  return logEx;
}, c);
console.log('EXTRATOR:', log.slice(0, 600));
// Concordância da qualificação (o trecho é fixo no modelo): advogada e/ou dois autores.
await p.evaluate((c) => {
  const par = document.getElementById('autorNome').closest('p');
  const w = document.createTreeWalker(par, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    if (c.advFem) n.nodeValue = n.nodeValue.replace('seu procurador infra-assinado', 'sua procuradora infra-assinada').replace(/infra-\s*assinado/, 'infra-assinada');
    if (c.autores.length > 1) n.nodeValue = n.nodeValue.replace(/,\s*vem,\s*respeitosamente/, ', vêm, respeitosamente');
  }
}, c);
// Mesmo resultado do botão "Imprimir / Salvar PDF (layout de impressão)" do peticionador.
await p.emulateMedia({ media: 'print' });
await p.pdf({ path: saida, format: 'A4', printBackground: true, preferCSSPageSize: true });
await b.close();
