#!/usr/bin/env node
/**
 * Lê no PJe/TJPE (1º grau) a lista de processos de cada advogado do escritório
 * em Ipojuca e grava um JSON com a "Última moviment." de cada um.
 *
 * Roda no COMPUTADOR DO ESCRITÓRIO, ligado ao Chrome já aberto e já logado no
 * PJe (porta de depuração 9222, a mesma do WhatsApp). Nenhuma senha passa por
 * aqui. SOMENTE LEITURA: só preenche os filtros da tela Consulta processos e
 * lê a tabela — não abre autos, não peticiona, não mexe em nada.
 *
 * Contorna o limite de 30 resultados do PJe: pesquisa cada advogado por Órgão
 * julgador (1ª e 2ª Vara) e, se ainda vier a faixa "somente os 30 primeiros",
 * divide pela Data de Autuação até cada parte vir inteira.
 *
 * Uso:
 *   node acervo.mjs --saida leitura.json [--config advogados.json] [--porta 9222]
 *                   [--url <tela de consulta>] [--so "Luan Victor"]
 * Saída 0 = leu tudo; 2 = Chrome/PJe indisponível; 3 = PJe pediu login.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RE_CNJ, filtrar } from './nucleo.mjs';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FAIXA_30 = /somente os 30 primeiros/i;

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
    return /resultados? encontrados?|nenhum (processo|registro|resultado)|somente os 30 primeiros/i.test(t);
  }, null, { timeout: 60000 });
  await pagina.waitForTimeout(800);
}

async function pesquisar(pagina, { advogado, jurisdicao, orgao, de, ate }) {
  const limpar = pagina.getByRole('button', { name: /^limpar$/i });
  if (await limpar.count()) { await limpar.first().click(); await pagina.waitForTimeout(1200); }
  await depoisDoRotulo(pagina, 'Nome do Representante').fill(advogado);
  await depoisDoRotulo(pagina, 'Jurisdição', 'select').selectOption({ label: jurisdicao });
  await pagina.waitForTimeout(1500); // o PJe recarrega os órgãos julgadores
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
      return { numero, vara: /2ª/.test(orgao) ? '2ª' : /1ª/.test(orgao) ? '1ª' : orgao, autuado: td[idx.autuado] || '',
        classe: td[idx.classe] || '', ativo: td[idx.ativo] || '', passivo: td[idx.passivo] || '', ultima: td[idx.ultima] || '' };
    });
    const texto = document.body.innerText;
    const total = Number((texto.match(/(\d+)\s+resultados? encontrados?/i) || [])[1] ?? processos.length);
    return { processos, cortada: /somente os 30 primeiros/i.test(texto), total };
  }, RE_CNJ.source);
}

/** Pesquisa uma faixa de datas; se vier cortada, parte ao meio e repete. */
async function porDatas(pagina, base, de, ate, avisos, profundidade = 0) {
  const r = await pesquisar(pagina, { ...base, de: dataBR(de), ate: dataBR(ate) });
  if (!r.cortada) return { processos: r.processos, completo: true };
  const dias = Math.round((ate - de) / 864e5);
  if (dias < 1 || profundidade > 12) {
    avisos.push(`${base.advogado} / ${base.orgao}: mais de 30 processos autuados em ${dataBR(de)}; lista desse dia ficou cortada.`);
    return { processos: r.processos, completo: false };
  }
  const meio = new Date(de.getTime() + Math.floor(dias / 2) * 864e5);
  const a = await porDatas(pagina, base, de, meio, avisos, profundidade + 1);
  const b = await porDatas(pagina, base, new Date(meio.getTime() + 864e5), ate, avisos, profundidade + 1);
  return { processos: [...a.processos, ...b.processos], completo: a.completo && b.completo };
}

async function main() {
  const a = args(process.argv);
  const cfg = JSON.parse(await fs.readFile(a.config, 'utf8'));
  const url = a.url || cfg.url;
  let navegador;
  try { navegador = await chromium.connectOverCDP(`http://localhost:${a.porta}`); }
  catch { sair(2, `não consegui falar com o Chrome na porta ${a.porta}. Abra o Chrome com --remote-debugging-port=${a.porta} e entre no PJe nele.`); }

  const contexto = navegador.contexts()[0] || sair(2, 'o Chrome não tem nenhuma janela aberta.');
  const host = new URL(url).host;
  let pagina = contexto.pages().find((p) => p.url().includes(host));
  if (!pagina) pagina = await contexto.newPage();
  if (!pagina.url().startsWith(url)) await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await pagina.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
  if (!(await depoisDoRotulo(pagina, 'Nome do Representante').count())) {
    sair(3, `o PJe não mostrou a tela Consulta processos (está em ${pagina.url()}). Faça login no PJe nessa janela do Chrome e rode de novo.`);
  }

  const leitura = { capturado_em: new Date().toISOString().slice(0, 10), fonte: 'leitura automática do PJe (acervo.mjs)', advogados: {}, avisos: [] };
  for (const adv of cfg.advogados) {
    if (a.so && adv.nome !== a.so) continue;
    let processos = [], completo = true;
    for (const orgao of cfg.orgaos) {
      const base = { advogado: adv.nome, jurisdicao: cfg.jurisdicao, orgao };
      let r = await pesquisar(pagina, base);
      if (r.cortada) r = await porDatas(pagina, base, new Date(2000, 0, 1), new Date(), leitura.avisos);
      else r.completo = true;
      processos.push(...r.processos);
      completo = completo && r.completo;
      console.error(`${adv.nome} · ${orgao}: ${r.processos.length} processo(s)${r.completo ? '' : ' (incompleto)'}`);
    }
    const unicos = [...new Map(processos.filter((p) => p.numero).map((p) => [p.numero, p])).values()];
    leitura.advogados[adv.nome] = { completo, processos: filtrar(unicos, adv) };
  }
  const limpar = pagina.getByRole('button', { name: /^limpar$/i });
  if (await limpar.count()) await limpar.first().click().catch(() => {});
  await navegador.close().catch(() => {}); // só desliga a conexão; o Chrome continua aberto

  await fs.writeFile(a.saida, JSON.stringify(leitura, null, 1), 'utf8');
  const total = Object.values(leitura.advogados).reduce((s, x) => s + x.processos.length, 0);
  console.log(`OK: ${total} processo(s) lidos de ${Object.keys(leitura.advogados).length} advogado(s) -> ${a.saida}`);
  for (const av of leitura.avisos) console.log(`AVISO: ${av}`);
}

main().catch((e) => sair(2, e.message));
