#!/usr/bin/env node
/**
 * Compara a leitura nova do PJe com a base e monta o e-mail da checagem semanal.
 *   node comparar.mjs --base pje-checagem-semanal.json --leitura leitura.json --data 05/11/2026 \
 *                     --email email.json [--gravar-base]
 * email.json = { assunto, html, texto, total, movimentados, novos, sairam }.
 * --gravar-base reescreve a base com a leitura (só depois do e-mail enviado).
 */
import fs from 'node:fs/promises';
import { comparar, montarEmail } from './nucleo.mjs';

const a = {};
for (let i = 2; i < process.argv.length; i++) {
  const k = process.argv[i].replace(/^--/, '');
  a[k] = process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[++i] : true;
}
if (!a.base || !a.leitura) { console.error('uso: --base <json> --leitura <json> [--data dd/mm/aaaa] [--email saida.json] [--gravar-base]'); process.exit(1); }
// --base aceita a base pura ou o arquivo privado do Drive ({ config, base }).
const arqBase = JSON.parse(await fs.readFile(a.base, 'utf8'));
const base = arqBase.base || arqBase;
const leitura = JSON.parse(await fs.readFile(a.leitura, 'utf8'));
const r = comparar(base, leitura);
const email = montarEmail(r, { data: a.data || leitura.capturado_em, avisos: leitura.avisos || [] });
if (a.email) await fs.writeFile(a.email, JSON.stringify({ ...email, movimentados: r.movimentados, novos: r.novos, sairam: r.sairam }, null, 1));
if (a['gravar-base']) await fs.writeFile(a.base, JSON.stringify(arqBase.base ? { ...arqBase, base: r.novaBase } : r.novaBase, null, 1) + '\n');
console.log(`${r.movimentados.length} movimentado(s), ${r.novos.length} novo(s), ${r.sairam.length} saíram, ${r.absorvidos} incorporado(s) sem aviso.`);
console.log(email.assunto);
