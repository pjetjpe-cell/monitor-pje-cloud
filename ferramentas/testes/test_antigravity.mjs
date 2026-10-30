// Testes da ponte painel → Antigravity: node ferramentas/testes/test_antigravity.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

process.env.GAV_TOKEN_ARQUIVO = join(tmpdir(), `gav-token-teste-${process.pid}.txt`);
const aqui = dirname(fileURLToPath(import.meta.url));
const { assinar, verificar, abrir, lerToken } = await import('../antigravity/ponte.mjs');
const { montarPedido } = await import('../antigravity/nucleo.mjs');
const catalogo = JSON.parse(readFileSync(join(aqui, '../antigravity/tarefas.json'), 'utf8'));

let ok = 0;
function t(nome, f) { f(); ok++; console.log(`  ok   ${nome}`); }
const token = lerToken();
const base = { v: 1, tarefa: 'missao', campos: { cliente: '110. VALTEMIR URCINO' }, modo: 'cli' };
const novo = (extra = {}) => ({ ...base, ts: Date.now(), nonce: Math.random().toString(36).slice(2), ...extra });

t('pedido assinado é aceito e vira prompt com as travas', () => {
  const p = verificar(assinar(token, novo()), token);
  assert.equal(p.tarefa, 'missao');
  assert.match(p.prompt, /\.agent\/rules\/gav-esteira\.md/);
  assert.match(p.prompt, /Cliente \(nome ou título da conversa\): 110\. VALTEMIR URCINO\./);
  assert.ok(!p.prompt.includes('"'), 'prompt não pode ter aspas duplas');
});
t('token errado é recusado', () => {
  assert.throws(() => verificar(assinar('outro-token', novo()), token), /assinatura/);
});
t('pedido adulterado é recusado', () => {
  const s = assinar(token, novo()).split('.');
  s[1] = Buffer.from(JSON.stringify(novo({ tarefa: 'publicar', campos: { pasta: 'x' } }))).toString('base64url');
  assert.throws(() => verificar(s.join('.'), token), /assinatura/);
});
t('pedido vencido e pedido repetido são recusados', () => {
  assert.throws(() => verificar(assinar(token, novo({ ts: Date.now() - 11 * 60e3 })), token), /vencido/);
  const vistos = new Set(); const txt = assinar(token, novo());
  verificar(txt, token, { vistos });
  assert.throws(() => verificar(txt, token, { vistos }), /repetido/);
});
t('tarefa fora da lista, campo obrigatório vazio e tipo inventado são recusados', () => {
  assert.throws(() => verificar(assinar(token, novo({ tarefa: 'rm' })), token), /desconhecida/);
  assert.throws(() => verificar(assinar(token, novo({ campos: {} })), token), /preencha/);
  assert.throws(() => montarPedido(catalogo, 'peticao', { cliente: 'X', tipo: 'Agravo' }), /fora da lista/);
});
t('campo só entra se a tarefa usa; quebra de linha e aspas viram texto simples', () => {
  const p = montarPedido(catalogo, 'coletar', { cliente: 'A\n"B"', tipo: 'Réplica à contestação', pasta: 'C:\\x' });
  assert.equal(p.campos.cliente, "A 'B'");
  assert.equal(p.campos.tipo, undefined);
});
t('abrir só simula fora do Windows e aponta para o acordar.ps1', () => {
  const r = abrir(verificar(assinar(token, novo()), token), { simular: true });
  assert.ok(r.simulado);
  assert.ok(r.comando.some((a) => a.endsWith('acordar.ps1')));
  assert.ok(!r.comando.some((a) => a.includes('dangerously')));
});
t('todo workflow citado existe no repositório', () => {
  for (const tf of catalogo.tarefas) {
    readFileSync(join(aqui, '../../.agent/workflows', `${tf.workflow}.md`));
    if (tf.agente) readFileSync(join(aqui, '../../.claude/agents', `${tf.agente}.md`));
  }
});
console.log(`\n${ok} testes passaram.`);
