#!/usr/bin/env node
/**
 * Lê no PJe/TJPE (1º grau) a lista de processos de cada advogado do escritório
 * em Ipojuca e grava um JSON com a "Última moviment." de cada um.
 *
 * Roda no COMPUTADOR DO ESCRITÓRIO, ligado ao Chrome já aberto (porta de
 * depuração 9222, a mesma do WhatsApp). Usa primeiro a Consulta Pública (não
 * precisa de login); se ela não trouxer a última movimentação, usa a tela
 * logada "Consulta processos" que o usuário tenha deixado aberta. Nenhuma
 * senha passa por aqui. SOMENTE LEITURA: só preenche filtros e lê a tabela.
 *
 * Contorna o limite de resultados do PJe: pesquisa por Órgão julgador (1ª e 2ª
 * Vara, quando a tela tem esse filtro) e, se ainda vier a faixa "somente os N
 * primeiros", divide pela Data de Autuação até cada parte vir inteira.
 *
 * Uso:
 *   node acervo.mjs --saida leitura.json [--config advogados.json] [--porta 9222]
 *                   [--url <tela de consulta>] [--so "Luan Victor"]
 * Saída 0 = leu tudo; 2 = Chrome indisponível; 3 = nenhuma tela do PJe deu a lista.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RE_CNJ, filtrar } from './nucleo.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const URL_PUBLICA = 'https://pje.cloud.tjpe.jus.br/1g/ConsultaPublica/listView.seam';

function args(argv) {
  const a = { porta: 9222, config: path.join(AQUI, 'advogados.json'), saida: null, url: null, so: null };
  for (let i = 2; i < argv.length; i++) {
    const v = () => argv[++i];
    switch (argv[i]) {
      case '--porta': a.porta = Number(v()); break;
      case '--config': a.config = v(); break;
      case '--saida': a.saida = v(); break;
      case '--url': a.url = v(); break;
      case '--so': a.so = v(); break;
      default: throw new Error(`opção desconhecida: ${argv[i]}`);
    }
  }
  if (!a.saida) throw new Error('falta --saida <arquivo.json>');
  return a;
}

function sair(codigo, msg) { console.error(`ERRO: ${msg}`); process.exit(codigo); }

const dataBR = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
const doBR = (s) => { const [d, m, y] = s.split('/').map(Number); return new Date(y, m - 1, d); };

// Campo que vem logo depois do rótulo visível (o PJe não liga <label for>).
const depoisDoRotulo = (pagina, rotulo, tag = 'input', n = 1) =>
  pagina.locator(`xpath=(//*[text()[normalize-space()='${rotulo}']])[1]/following::${tag}[${n}]`);

async function aguardarResultado(pagina) {
  await pagina.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
  await pagina.waitForFunction(() => {
    const t = document.body.innerText;
    return /resultados? encontrados?|nenhum (processo|registro|resultado)|somente os \d+ primeiros/i.test(t);
  }, null, { timeout: 60000 });
  await pagina.waitForTimeout(800);
}

// Consulta Pública: "Nome do advogado"; tela logada: "Nome do Representante".
const ROTULOS_NOME = ['Nome do advogado', 'Nome do Representante'];
async function campoNome(pagina) {
  for (const r of ROTULOS_NOME) if (await depoisDoRotulo(pagina, r).count()) return depoisDoRotulo(pagina, r);
  return null;
}
const temCampo = async (pagina, rotulo, tag) => (await depoisDoRotulo(pagina, rotulo, tag).count()) > 0;

async function pesquisar(pagina, { advogado, jurisdicao, orgao, de, ate }) {
  const limpar = pagina.getByRole('button', { name: /^limpar$/i });
  if (await limpar.count()) { await limpar.first().click(); await pagina.waitForTimeout(1200); }
  await (await campoNome(pagina)).fill(advogado);
  if (jurisdicao && await temCampo(pagina, 'Jurisdição', 'select')) {
    await depoisDoRotulo(pagina, 'Jurisdição', 'select').selectOption({ label: jurisdicao });
    await pagina.waitForTimeout(1500); // o PJe recarrega os órgãos julgadores
  }
  if (orgao) await depoisDoRotulo(pagina, 'Órgão julgador', 'select').selectOption({ label: orgao });
  if (de) await depoisDoRotulo(pagina, 'Data de Autuação', 'input', 1).fill(de);
  if (ate) await depoisDoRotulo(pagina, 'Data de Autuação', 'input', 2).fill(ate);
  await pagina.getByRole('button', { name: /^pesquisar$/i }).first().click();
  await aguardarResultado(pagina);
  return lerTabela(pagina);
}

/** Lê a tabela de resultados pelo cabeçalho (não pela posição fixa). */
async function lerTabela(pagina) {
  return pagina.evaluate((reSrc) => {
    const re = new RegExp(reSrc);
    const limpo = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const linhas = [...document.querySelectorAll('tr')].filter((tr) => [...tr.querySelectorAll('a')].some((a) => re.test(a.textContent)));
    const tabela = linhas[0]?.closest('table');
    const cab = tabela ? [...tabela.querySelectorAll('thead th, tr th')].map((th) => limpo(th.textContent).toLowerCase()) : [];
    const col = (nome, padrao) => { const i = cab.findIndex((c) => c.startsWith(nome)); return i >= 0 ? i : padrao; };
    const idx = { numero: col('processo', 0), orgao: col('órgão', 2), autuado: col('autuado', 3), classe: col('classe', 4),
      ativo: col('polo ativo', 5), passivo: col('polo passivo', 6), ultima: col('última', 8) };
    const processos = linhas.map((tr) => {
      const td = [...tr.querySelectorAll('td')].map((c) => limpo(c.innerText));
      const numero = (td.join(' ').match(re) || [''])[0];
      const orgao = td[idx.orgao] || '';
      return { numero, orgao, vara: /2ª/.test(orgao) ? '2ª' : /1ª/.test(orgao) ? '1ª' : orgao, autuado: td[idx.autuado] || '',
        classe: td[idx.classe] || '', ativo: td[idx.ativo] || '', passivo: td[idx.passivo] || '', ultima: td[idx.ultima] || '' };
    });
    const texto = document.body.innerText;
    const total = Number((texto.match(/(\d+)\s+resultados? encontrados?/i) || [])[1] ?? processos.length);
    return { processos, cortada: /somente os \d+ primeiros/i.test(texto), total };
  }, RE_CNJ.source);
}

/** Pesquisa uma faixa de datas; se vier cortada, parte ao meio e repete. */
async function porDatas(pagina, base, de, ate, avisos, profundidade = 0) {
  const r = await pesquisar(pagina, { ...base, de: dataBR(de), ate: dataBR(ate) });
  if (!r.cortada) return { processos: r.processos, completo: true };
  const dias = Math.round((ate - de) / 864e5);
  if (dias < 1 || profundidade > 12) {
    avisos.push(`${base.advogado}${base.orgao ? ' / ' + base.orgao : ''}: lista de ${dataBR(de)} ficou cortada pelo limite do PJe.`);
    return { processos: r.processos, completo: false };
  }
  const meio = new Date(de.getTime() + Math.floor(dias / 2) * 864e5);
  const a = await porDatas(pagina, base, de, meio, avisos, profundidade + 1);
  const b = await porDatas(pagina, base, new Date(meio.getTime() + 864e5), ate, avisos, profundidade + 1);
  return { processos: [...a.processos, ...b.processos], completo: a.completo && b.completo };
}

async function abrirTela(contexto, url) {
  const host = new URL(url).host;
  let pagina = contexto.pages().find((p) => p.url().startsWith(url)) || contexto.pages().find((p) => host && p.url().includes(host));
  if (!pagina) pagina = await contexto.newPage();
  if (!pagina.url().startsWith(url)) await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await pagina.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  return (await campoNome(pagina)) ? pagina : null;
}

/** Lê todos os advogados numa tela. Devolve null se a tela não serve (sem a última movimentação). */
async function lerTela(pagina, cfg, so, avisos) {
  const comOrgao = await temCampo(pagina, 'Órgão julgador', 'select');
  const advogados = {};
  for (const adv of cfg.advogados) {
    if (so && adv.nome !== so) continue;
    let processos = [], completo = true;
    for (const orgao of comOrgao ? cfg.orgaos : [null]) {
      const base = { advogado: adv.nome, jurisdicao: cfg.jurisdicao, orgao };
      let r = await pesquisar(pagina, base);
      if (r.cortada) r = await porDatas(pagina, base, new Date(2000, 0, 1), new Date(), avisos);
      else r.completo = true;
      processos.push(...r.processos);
      completo = completo && r.completo;
      console.error(`${adv.nome}${orgao ? ' · ' + orgao : ''}: ${r.processos.length} processo(s)${r.completo ? '' : ' (incompleto)'}`);
    }
    // Sem filtro de órgão na tela: fica só o que é de Ipojuca.
    if (!comOrgao) processos = processos.filter((p) => /ipojuca/i.test(p.orgao));
    const unicos = [...new Map(processos.filter((p) => p.numero).map(({ orgao, ...p }) => [p.numero, p])).values()];
    advogados[adv.nome] = { completo, processos: filtrar(unicos, adv) };
  }
  const todos = Object.values(advogados).flatMap((a) => a.processos);
  if (todos.length && todos.every((p) => !p.ultima)) return null; // lista sem a coluna da última movimentação
  return advogados;
}

async function main() {
  const a = args(process.argv);
  const cfg = JSON.parse(await fs.readFile(a.config, 'utf8'));
  const telas = a.url ? a.url.split(',') : [cfg.url_publica || URL_PUBLICA, cfg.url].filter(Boolean);
  let navegador;
  try { navegador = await chromium.connectOverCDP(`http://localhost:${a.porta}`); }
  catch { sair(2, `não consegui falar com o Chrome na porta ${a.porta}. Abra o Chrome com --remote-debugging-port=${a.porta}.`); }
  const contexto = navegador.contexts()[0] || sair(2, 'o Chrome não tem nenhuma janela aberta.');

  const leitura = { capturado_em: new Date().toISOString().slice(0, 10), fonte: '', advogados: {}, avisos: [] };
  const tentativas = [];
  for (const url of telas) {
    const pagina = await abrirTela(contexto, url);
    if (!pagina) { tentativas.push(`${url}: a tela de pesquisa não apareceu (login pedido ou fora do ar)`); continue; }
    const avisos = [];
    const advogados = await lerTela(pagina, cfg, a.so, avisos);
    const limpar = pagina.getByRole('button', { name: /^limpar$/i });
    if (await limpar.count()) await limpar.first().click().catch(() => {});
    if (!advogados) { tentativas.push(`${url}: a lista não traz a última movimentação`); continue; }
    Object.assign(leitura, { advogados, avisos, fonte: `leitura automática do PJe (${url})` });
    break;
  }
  await navegador.close().catch(() => {}); // só desliga a conexão; o Chrome continua aberto
  if (!leitura.fonte) sair(3, 'nenhuma tela do PJe deu a lista. ' + tentativas.join(' | '));

  await fs.writeFile(a.saida, JSON.stringify(leitura, null, 1), 'utf8');
  const total = Object.values(leitura.advogados).reduce((s, x) => s + x.processos.length, 0);
  console.log(`OK: ${total} processo(s) lidos de ${Object.keys(leitura.advogados).length} advogado(s) -> ${a.saida}`);
  for (const t of tentativas) console.log(`TENTATIVA: ${t}`);
  for (const av of leitura.avisos) console.log(`AVISO: ${av}`);
}

main().catch((e) => sair(2, e.message));
