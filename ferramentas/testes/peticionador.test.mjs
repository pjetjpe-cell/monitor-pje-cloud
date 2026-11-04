// Testa o ferramentas/peticionador/preencher.mjs contra um peticionador falso
// que reproduz a regra de contexto do v41 (a que pôs o nº de parcelas na venda).
//   node --test ferramentas/testes/peticionador.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RUNNER = path.resolve(AQUI, '../peticionador/preencher.mjs');
const FALSO = path.join(AQUI, 'fixtures/peticionador_falso.html');
// PNG 1x1 vermelho
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64');

function rodar(dados, extra = []) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pet-'));
  fs.writeFileSync(path.join(dir, 'print.png'), PNG);
  const arq = path.join(dir, 'caso.dados.json');
  fs.writeFileSync(arq, JSON.stringify(dados));
  const r = spawnSync('node', [RUNNER, '--peticionador', FALSO, '--dados', arq, '--saida', path.join(dir, 'saida'), '--sem-png', ...extra], { encoding: 'utf8', timeout: 120000 });
  const html = fs.existsSync(path.join(dir, 'saida')) ? fs.readdirSync(path.join(dir, 'saida')).filter(f => f.endsWith('.html')).map(f => fs.readFileSync(path.join(dir, 'saida', f), 'utf8'))[0] : '';
  return { ...r, html, dir };
}

const BASE = () => ({
  aba: 'quitada', nomeArquivo: 'teste',
  controles: { q_autor2: true },
  autores: [{ genero: 'm' }, { genero: 'f' }],
  campos: {
    nome: 'FULANO DE TAL', rg: '1.111.111 – SSP/PE', cpf: '000.000.000-00', temSegundoAutor: true,
    nome2: 'BELTRANA DE TAL', rg2: '2.222.222 – SDS/PE', cpf2: '111.111.111-11', endereco: 'Rua Fictícia, 1, Recife/PE',
    cep: '50000-000', contrato: '55555', venda: '99999', dataContrato: '01/02/2023', cota: '7', cotaDescricao: '7 (Bloco 01, Apto 0101)',
    parcelasPagas: '40', valorRecebido: '10.000,00', dataBase: '01/01/2026',
  },
  valorCausa: 'R$ 20.000,00 (vinte mil reais)',
  ajustes: [{ op: 'imagens', sel: 'h3', contem: 'V - DA CONTRATAÇÃO', onde: 'antes', imagens: [{ arquivo: 'print.png', legenda: 'Print 1 – teste' }] }],
});

test('resolve [Nº]/[DATA] pelo contexto local, não pela frase inteira', () => {
  const r = rodar(BASE());
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.html, /identifica a venda nº <span class="B">99999<\/span> como/);
  assert.match(r.html, /<span class="B">40<\/span> parcelas pagas<\/b>/);
  assert.match(r.html, /\(data-base <span class="B">01\/01\/2026<\/span>\)/);
  assert.match(r.html, /à Cota <span class="B">7 \(Bloco 01, Apto 0101\)<\/span>/);
  assert.match(r.html, /contrato\/proposta nº <span class="B">55555<\/span>/);
});

test('concordância: plural para dois autores e gênero na qualificação', () => {
  const r = rodar(BASE());
  assert.match(r.html, /Os autores celebraram com a ré/);
  assert.match(r.html, /O que os consumidores cumpriram/);
  assert.match(r.html, /portador da cédula[\s\S]*portadora da cédula/);
  assert.match(r.html, /inscrito no CPF[\s\S]*inscrita no CPF/);
});

test('insere print como figura com legenda e preenche o valor da causa', () => {
  const r = rodar(BASE());
  assert.match(r.html, /<figure[^>]*><img src="data:image\/png;base64,/);
  assert.match(r.html, /Print 1 – teste/);
  assert.match(r.html, /R\$ 20\.000,00 \(vinte mil reais\)/);
});

test('marcador que sobra reprova (código 2), salvo --permitir-pendencias', () => {
  const d = BASE(); delete d.campos.cep;
  const r = rodar(d);
  assert.equal(r.status, 2, r.stdout);
  assert.match(r.stdout, /PENDENTE \[CEP\]/);
  assert.equal(rodar(d, ['--permitir-pendencias']).status, 0);
});

test('ajuste que não acha o alvo reprova (código 3) em vez de passar calado', () => {
  const d = BASE(); d.ajustes.push({ op: 'trocar', sel: 'p', contem: 'texto que não existe', html: '<p>x</p>' });
  const r = rodar(d);
  assert.equal(r.status, 3, r.stdout);
  assert.match(r.stdout, /AJUSTE SEM ALVO/);
});
