// Testes da checagem semanal do PJe: node ferramentas/testes/test_pje.mjs
import assert from 'node:assert/strict';
import { comparar, montarEmail, filtrar } from '../pje/nucleo.mjs';

let ok = 0;
const t = (nome, f) => { f(); ok++; console.log(`  ok   ${nome}`); };
const P = (numero, ultima, extra = {}) => ({ numero, vara: '1ª', autuado: '01/01/2026', classe: 'PC', ativo: 'CLIENTE ' + numero, passivo: 'GAV', ultima, ...extra });

t('só a última movimentação diferente entra como movimentado (ponto final e espaços não contam)', () => {
  const base = { advogados: { A: { completo: true, processos: [P('1', 'Conclusos para decisão'), P('2', 'Expedição de Certidão.')] } } };
  const lei = { advogados: { A: { completo: true, processos: [P('1', 'Publicado Decisão em 04/11/2026.'), P('2', 'Expedição de  Certidão')] } } };
  const r = comparar(base, lei);
  assert.deepEqual(r.movimentados.map((m) => m.numero), ['1']);
  assert.equal(r.movimentados[0].antes, 'Conclusos para decisão');
});
t('base incompleta absorve processo novo sem avisar; base completa avisa', () => {
  const lei = { advogados: { A: { completo: true, processos: [P('1', 'x'), P('9', 'y')] } } };
  assert.equal(comparar({ advogados: { A: { completo: false, processos: [P('1', 'x')] } } }, lei).absorvidos, 1);
  assert.equal(comparar({ advogados: { A: { completo: true, processos: [P('1', 'x')] } } }, lei).novos.length, 1);
});
t('saiu da lista só conta em leitura completa', () => {
  const base = { advogados: { A: { completo: true, processos: [P('1', 'x'), P('2', 'y')] } } };
  assert.equal(comparar(base, { advogados: { A: { completo: true, processos: [P('1', 'x')] } } }).sairam.length, 1);
  assert.equal(comparar(base, { advogados: { A: { completo: false, processos: [P('1', 'x')] } } }).sairam.length, 0);
});
t('processo de dois advogados aparece uma vez no e-mail', () => {
  const base = { advogados: { A: { completo: true, processos: [P('1', 'x')] }, B: { completo: true, processos: [P('1', 'x')] } } };
  const lei = { advogados: { A: { completo: true, processos: [P('1', 'z')] }, B: { completo: true, processos: [P('1', 'z')] } } };
  assert.equal(comparar(base, lei).movimentados.length, 1);
});
t('filtro por advogado deixa só os processos dele', () => {
  const ps = [P('0000001-11.2026.8.17.2730', 'x'), P('0000002-22.2026.8.17.2730', 'y')];
  assert.deepEqual(filtrar(ps, { apenas: ['0000001-11.2026.8.17.2730'] }).map((p) => p.numero), ['0000001-11.2026.8.17.2730']);
});
t('e-mail traz só a tabela dos modificados e escapa HTML', () => {
  const r = comparar({ advogados: { A: { completo: true, processos: [P('1', 'a')] } } },
    { advogados: { A: { completo: true, processos: [P('1', '<b>novo</b>')] } } });
  const e = montarEmail(r, { data: '05/11/2026' });
  assert.match(e.assunto, /1 processo com novidade/);
  assert.match(e.html, /&lt;b&gt;novo/);
  assert.doesNotMatch(e.html, /Processos novos na lista/);
  const vazio = montarEmail(comparar({ advogados: {} }, { advogados: {} }), { data: '05/11/2026' });
  assert.match(vazio.assunto, /nenhuma movimentação nova/);
});
console.log(`\n${ok} testes passaram.`);
