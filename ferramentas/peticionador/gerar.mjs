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
 *   tipo     parcelamento (padrão do escritório; "gratuita" é recusado) | custas   nparc  6 | 12
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
c.tipo = c.tipo || 'parcelamento';
// Ordem do escritório (23/11/2026): custas sempre por parcelamento, jamais justiça gratuita.
if (c.tipo === 'gratuita') { console.error('RECUSADO: justiça gratuita não é pedida; use tipo "parcelamento".'); process.exit(2); }
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
// Ré fora do cadastro do modelo (ex.: outro empreendimento): c.re = {nome, empreendimento, cnpj, sede}
// substitui as linhas da tabela "em face de". c.trocas = [[trecho, novo], ...] troca texto literal
// na peça (ex.: percentual mínimo pedido, cidade da assinatura); cada trecho tem de existir.
// [trecho, novo, 'no'] troca só o nó de texto que é exatamente o trecho (ex.: um <strong>25%</strong>).
// c.ocultar = [seletor CSS, ...] some com seções que não se aplicam ao caso.
const falhas = await p.evaluate((c) => {
  const erros = [];
  const raiz = document.getElementById('petBody');
  if (c.re) {
    const t = document.getElementById('tblRes').tBodies[0];
    [...t.rows].slice(1).forEach(r => r.remove());
    const tr = t.insertRow(); const td = (h) => { const x = tr.insertCell(); x.innerHTML = h; };
    td(`<strong>${c.re.nome}</strong>` + (c.re.empreendimento ? `<br><span style="font-size:10pt">(empreendimento <em>${c.re.empreendimento}</em>)</span>` : ''));
    td(c.re.cnpj); td(c.re.sede);
  }
  for (const sel of c.ocultar || []) { const els = raiz.querySelectorAll(sel); if (!els.length) erros.push('ocultar: ' + sel); els.forEach(e => e.remove()); }
  for (const [de, para, modo] of c.trocas || []) {
    let n = 0; const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    const casa = (v) => modo === 'no' ? v.trim() === de.trim() : v.includes(de); // 'no': só o nó cujo texto é exatamente o trecho
    for (let x; (x = w.nextNode());) if (casa(x.nodeValue) && x.parentElement.offsetParent !== null) { x.nodeValue = modo === 'no' ? x.nodeValue.replace(de, para) : x.nodeValue.split(de).join(para); n++; }
    if (!n) erros.push('troca sem ocorrência visível: ' + de);
  }
  return erros;
}, c);
if (falhas.length) { console.error('AJUSTES NÃO APLICADOS:\n' + falhas.join('\n')); await b.close(); process.exit(1); }
if (process.env.TEXTO) fs.writeFileSync(process.env.TEXTO, await p.evaluate(() => document.getElementById('petBody').innerText));
// Mesmo resultado do botão "Imprimir / Salvar PDF (layout de impressão)" do peticionador.
await p.emulateMedia({ media: 'print' });
await p.pdf({ path: saida, format: 'A4', printBackground: true, preferCSSPageSize: true });
await b.close();
