#!/usr/bin/env node
/**
 * Preenche uma aba do PETICIONADOR GAV (v41+) num navegador headless, usando as
 * funções do próprio peticionador (switchTab, qiaAplicar, renderQuitada,
 * downloadHTML), e exporta HTML + PDF fiéis ao que o peticionador gera.
 *
 *   node ferramentas/peticionador/preencher.mjs \
 *        --peticionador /caminho/peticionador_GAV_v41.html \
 *        --dados /caminho/cliente.dados.json \
 *        --saida /caminho/saida [--permitir-pendencias] [--sem-png]
 *
 * O HTML do peticionador e o dados.json do cliente ficam FORA do repositório
 * (o repo é público e os dois carregam dados pessoais). Ver exemplo.dados.json.
 *
 * O que este executor faz além de chamar o peticionador:
 *  1. Resolve [Nº]/[DATA]/[__] pelo CONTEXTO LOCAL (texto imediatamente antes
 *     ou depois do marcador). A regra do peticionador olha a frase inteira e,
 *     numa frase com "parcelas pagas", põe o nº de parcelas na venda e na
 *     data-base — erro real, visto numa inicial de 04/11/2026. Os marcadores que este
 *     passo não resolver seguem para o qiaAplicar.
 *  2. Concordância: plural quando há dois autores; gênero na qualificação.
 *  3. Ajustes do caso (trocar/inserir/remover parágrafos, inserir prints).
 *  4. Trava: marcador amarelo visível que sobrar reprova (código 2), salvo
 *     --permitir-pendencias, para placeholders deixados de propósito.
 *  5. Gera relatorio.json e, com Python + PyMuPDF, um PNG por página do PDF
 *     (gav.imagens paginas) para conferência visual.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const FERRAMENTAS = path.resolve(AQUI, '..');

function args(argv) {
  const o = { permitirPendencias: false, png: true };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--peticionador') o.peticionador = argv[++i];
    else if (a === '--dados') o.dados = argv[++i];
    else if (a === '--saida') o.saida = argv[++i];
    else if (a === '--permitir-pendencias') o.permitirPendencias = true;
    else if (a === '--sem-png') o.png = false;
    else throw new Error('argumento desconhecido: ' + a);
  }
  for (const k of ['peticionador', 'dados', 'saida']) if (!o[k]) throw new Error('falta --' + k);
  return o;
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

/** Lê as imagens dos ajustes no Node e entrega ao navegador já em data URI. */
function embutirImagens(ajustes, baseDir) {
  return (ajustes || []).map(aj => {
    if (aj.op !== 'imagens') return aj;
    const figs = (aj.imagens || []).map(item => {
      const f = typeof item === 'string' ? { arquivo: item } : item;
      const p = path.resolve(baseDir, f.arquivo);
      const mime = MIME[path.extname(p).toLowerCase()];
      if (!mime) throw new Error('formato de imagem não suportado: ' + p);
      const b64 = fs.readFileSync(p).toString('base64');
      return { src: `data:${mime};base64,${b64}`, legenda: f.legenda || '' };
    });
    return { ...aj, figs };
  });
}

/* ------------------------------------------------------------------------ */
/* Tudo abaixo roda DENTRO da página do peticionador.                        */
/* ------------------------------------------------------------------------ */
function noNavegador(D) {
  const log = [];
  const ABA = D.aba || 'quitada';
  const CORPO = { quitada: 'petBodyQuitada', repquitada: 'petBodyReplicaQuitada' }[ABA] || D.corpo;
  if (typeof switchTab !== 'function') throw new Error('isto não parece o peticionador GAV (sem switchTab)');
  switchTab(ABA);
  const body = document.getElementById(CORPO);
  if (!body) throw new Error('corpo da peça não encontrado: ' + CORPO);

  // 1) controles do painel (advogado, danos, custas, blocos condicionais)
  for (const [id, v] of Object.entries(D.controles || {})) {
    const e = document.getElementById(id);
    if (!e) { log.push('controle inexistente: ' + id); continue; }
    if (e.type === 'checkbox') e.checked = !!v; else e.value = String(v);
    e.dispatchEvent(new Event(e.type === 'checkbox' ? 'change' : 'input', { bubbles: true }));
    e.dispatchEvent(new Event('change', { bubbles: true }));
  }
  if (typeof renderQuitada === 'function') renderQuitada();

  const visivel = e => { for (let x = e; x && x !== body.parentElement; x = x.parentElement) if (x.style && x.style.display === 'none') return false; return true; };
  const bloco = e => e.closest('p,td,li,h2,h3,h4') || e.parentElement;
  const textoAntes = sp => { const b = bloco(sp); const r = document.createRange(); r.setStart(b, 0); r.setEndBefore(sp); return r.toString(); };
  const textoDepois = sp => { const b = bloco(sp); const r = document.createRange(); r.setStartAfter(sp); r.setEnd(b, b.childNodes.length); return r.toString(); };

  // 2) pré-resolução por contexto LOCAL dos marcadores genéricos
  const C = D.campos || {};
  const REGRAS = [
    { antes: /venda n[ºo°]\s*$/i, chave: 'venda' },
    { antes: /(contrato\/proposta|proposta|contrato) n[ºo°]\s*$/i, chave: 'contrato' },
    { antes: /\bCota\s*$/i, chave: 'cotaDescricao', alt: 'cota' },
    { antes: /data-base( de)?\s*$/i, chave: 'dataBase' },
    { antes: /quitad[oa] desde\s*$/i, chave: 'dataQuitacao' },
    { antes: /(firmado|firmada) em\s*$/i, chave: 'dataContrato' },
    { antes: /com a ré, em\s*$/i, chave: 'dataContrato' },
    { antes: /custas iniciais em\s*$/i, chave: 'nparcCustas' },
    { depois: /^\s*parcelas (pagas|quitadas)/i, chave: 'parcelasPagas' },
  ];
  const GENERICO = /^\[(Nº|DATA|__|VALOR)\]$/;
  let resolvidos = 0;
  body.querySelectorAll('span.B').forEach(sp => {
    if (!GENERICO.test(sp.textContent.trim())) return;
    const a = textoAntes(sp), d = textoDepois(sp);
    for (const r of REGRAS) {
      if ((r.antes && r.antes.test(a)) || (r.depois && r.depois.test(d))) {
        const v = C[r.chave] || (r.alt && C[r.alt]);
        if (v) { sp.textContent = v; resolvidos++; }
        return;
      }
    }
  });
  log.push('marcadores resolvidos pelo contexto local: ' + resolvidos);

  // 3) o restante vai para a função do próprio peticionador
  if (typeof qiaAplicar === 'function') qiaAplicar(JSON.parse(JSON.stringify(C)));
  else log.push('qiaAplicar ausente — só a pré-resolução foi aplicada');
  if (typeof renderQuitada === 'function') renderQuitada();

  // 4) ajustes do caso
  const P = s => s;
  const achar = (sel, txt) => [...body.querySelectorAll(sel || 'p')].find(e => visivel(e) && e.textContent.includes(txt));
  for (const aj of (D.ajustes || [])) {
    const alvo = aj.contem ? achar(aj.sel, aj.contem) : null;
    if (aj.contem && !alvo) { log.push('AJUSTE SEM ALVO (' + aj.op + '): ' + aj.contem); continue; }
    switch (aj.op) {
      case 'trocar': alvo.outerHTML = P(aj.html); break;
      case 'antes': alvo.insertAdjacentHTML('beforebegin', aj.html); break;
      case 'depois': alvo.insertAdjacentHTML('afterend', aj.html); break;
      case 'fim': alvo.insertAdjacentHTML('beforeend', aj.html); break;
      case 'remover': alvo.remove(); break;
      case 'substituir': {
        const h0 = alvo.innerHTML, h1 = h0.split(aj.de).join(aj.para);
        if (h0 === h1) log.push('SUBSTITUIÇÃO SEM EFEITO: ' + aj.de); else alvo.innerHTML = h1;
        break;
      }
      case 'remover-trecho': {
        const sp = [...body.querySelectorAll(aj.sel || 'span')].find(e => e.textContent.includes(aj.trecho));
        if (sp) sp.remove(); else log.push('TRECHO NÃO ACHADO: ' + aj.trecho);
        break;
      }
      case 'marcador': {
        const sp = [...body.querySelectorAll('span.B')].filter(e => visivel(e) && e.textContent === aj.de && bloco(e).textContent.includes(aj.contem || ''));
        const n = aj.ocorrencia || 0;
        if (sp[n]) sp[n].textContent = aj.para; else log.push('MARCADOR NÃO ACHADO: ' + aj.de + ' em ' + aj.contem);
        break;
      }
      case 'imagens': {
        const figs = (aj.figs || []).map(f =>
          '<figure style="text-align:center;margin:12px 0;break-inside:avoid;page-break-inside:avoid">' +
          '<img src="' + f.src + '" style="max-width:' + (aj.largura || '62%') + ';max-height:20cm;border:1px solid #888">' +
          (f.legenda ? '<figcaption style="font-size:9pt;text-indent:0;margin-top:4px">' + f.legenda + '</figcaption>' : '') +
          '</figure>').join('');
        // âncora: <div id="..."></div> deixado por um ajuste anterior — a figura entra no lugar dela
        const anc = aj.ancora ? body.querySelector('#' + CSS.escape(aj.ancora)) : null;
        if (aj.ancora && !anc) { log.push('ÂNCORA NÃO ACHADA: ' + aj.ancora); break; }
        if (anc) { anc.insertAdjacentHTML('afterend', figs); anc.remove(); }
        else (alvo || body).insertAdjacentHTML(alvo ? (aj.onde === 'antes' ? 'beforebegin' : 'afterend') : 'beforeend', figs);
        break;
      }
      default: log.push('op desconhecida: ' + aj.op);
    }
  }

  // 5) concordância
  const autores = D.autores || [];
  const g = autores.map(a => (a.genero || 'm').toLowerCase()[0]);
  const qual = [...body.querySelectorAll('p')].find(e => visivel(e) && /portador\(a\)|inscrito\(a\)/.test(e.textContent));
  if (qual && g.length) {
    const tw = document.createTreeWalker(qual, NodeFilter.SHOW_TEXT); let n, k = 0, j = 0;
    while ((n = tw.nextNode())) {
      if (n.textContent.includes('portador(a)')) n.textContent = n.textContent.replace('portador(a)', (g[k++] || g[0]) === 'f' ? 'portadora' : 'portador');
      if (n.textContent.includes('inscrito(a)')) n.textContent = n.textContent.replace('inscrito(a)', (g[j++] || g[0]) === 'f' ? 'inscrita' : 'inscrito');
    }
  }
  const PLURAL = [
    ['O(A) autor(a) é destinatário(a) final', 'Os autores são destinatários finais'],
    ['o(a) autor(a) requer, desde logo', 'os autores requerem, desde logo'],
    ['O(A) autor(a) manifesta', 'Os autores manifestam'], ['e requer que', 'e requerem que'],
    ['O(A) autor(a) celebrou com a ré', 'Os autores celebraram com a ré'],
    ['O(A) autor(a) não pede devolução', 'Os autores não pedem devolução'],
    ['inadimplemento do(a) consumidor(a)', 'inadimplemento dos consumidores'],
    ['O(A) consumidor(a) cumpriu cada parcela', 'Os consumidores cumpriram cada parcela'],
    ['O(A) autor(a) cumpriu integralmente a prestação econômica e não recebeu', 'Os autores cumpriram integralmente a prestação econômica e não receberam'],
    ['O(A) autor(a) pagou integralmente o preço', 'Os autores pagaram integralmente o preço'],
    ['O que o(a) consumidor(a) cumpriu', 'O que os consumidores cumpriram'],
    ['O(a) consumidor(a)', 'Os consumidores'],
    ['que o(a) autor(a) já quitou', 'que os autores já quitaram'],
    ['e o(a) autor(a) manifestar interesse', 'e os autores manifestarem interesse'],
    ['nome do(a) autor(a)', 'nome dos autores'], ['fração do(a) autor(a)', 'fração dos autores'],
    ['pelo(a) autor(a)', 'pelos autores'], ['o(a) autor(a)', 'os autores'],
    ['Diante do exposto, requer:', 'Diante do exposto, requerem:'], ['Requer, por fim,', 'Requerem, por fim,'],
  ];
  const um = g[0] === 'f';
  const SINGULAR = [
    ['O(A) autor(a) é destinatário(a) final', um ? 'A autora é destinatária final' : 'O autor é destinatário final'],
    ['O(A) autor(a)', um ? 'A autora' : 'O autor'], ['o(a) autor(a)', um ? 'a autora' : 'o autor'],
    ['do(a) autor(a)', um ? 'da autora' : 'do autor'], ['pelo(a) autor(a)', um ? 'pela autora' : 'pelo autor'],
    ['O(a) consumidor(a)', um ? 'A consumidora' : 'O consumidor'], ['O(A) consumidor(a)', um ? 'A consumidora' : 'O consumidor'],
    ['o(a) consumidor(a)', um ? 'a consumidora' : 'o consumidor'], ['do(a) consumidor(a)', um ? 'da consumidora' : 'do consumidor'],
    ['orientado(a)', um ? 'orientada' : 'orientado'], ['orientá-lo(a)', um ? 'orientá-la' : 'orientá-lo'],
  ];
  const tabela = autores.length >= 2 ? PLURAL : (autores.length === 1 ? SINGULAR : []);
  if (tabela.length) [...body.querySelectorAll('p, li, td')].forEach(el => {
    let h = el.innerHTML; const h0 = h;
    tabela.forEach(([a, z]) => { h = h.split(a).join(z); });
    if (h !== h0) el.innerHTML = h;
  });
  for (const [a, z] of (D.substituicoesGlobais || [])) [...body.querySelectorAll('p, li, td')].forEach(el => {
    if (el.innerHTML.includes(a)) el.innerHTML = el.innerHTML.split(a).join(z);
  });

  // 6) valor da causa
  if (D.valorCausa) {
    const vc = [...body.querySelectorAll('span.B')].find(e => /^R\$/.test(e.textContent) && bloco(e).textContent.includes('Atribui-se à causa'));
    if (vc) vc.textContent = D.valorCausa; else log.push('valor da causa: marcador não encontrado');
  }

  // 7) conferência
  const pendencias = [...body.querySelectorAll('span.B')].filter(e => visivel(e) && /\[.*\]/.test(e.textContent))
    .map(e => { const t = bloco(e).textContent.replace(/\s+/g, ' '); const i = t.indexOf(e.textContent); return e.textContent + '  …' + t.slice(Math.max(0, i - 60), i) + '…'; });
  const preenchidos = [...body.querySelectorAll('span.B')].filter(e => visivel(e) && !/\[.*\]/.test(e.textContent))
    .map(e => { const t = bloco(e).textContent.replace(/\s+/g, ' '); const i = t.indexOf(e.textContent); return '«' + e.textContent + '» …' + t.slice(Math.max(0, i - 50), i) + '…'; });
  // só o texto VISÍVEL (innerText ignora display:none, como os trechos qa1-only)
  const neutros = [...body.querySelectorAll('p,li,td')].filter(e => visivel(e) && !e.classList.contains('no-print'))
    .map(e => e.innerText.replace(/\s+/g, ' '))
    .filter(t => /\w\([aA]\)|\(A\)|\(sua\)|\(s\)\b/.test(t))
    .map(t => { const i = t.search(/\w\([aA]\)|\(A\)|\(sua\)|\(s\)\b/); return '…' + t.slice(Math.max(0, i - 50), i + 60) + '…'; });
  const capitulos = [...body.querySelectorAll('h3')].filter(visivel).map(h => h.textContent.trim());
  return { log, pendencias, preenchidos, neutros, capitulos };
}

async function main() {
  const o = args(process.argv);
  const D = JSON.parse(fs.readFileSync(o.dados, 'utf8'));
  D.ajustes = embutirImagens(D.ajustes, path.dirname(path.resolve(o.dados)));
  fs.mkdirSync(o.saida, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  const errosPagina = [];
  page.on('pageerror', e => errosPagina.push(e.message));
  page.on('dialog', d => { errosPagina.push('diálogo: ' + d.message()); d.dismiss(); });
  await page.goto('file://' + path.resolve(o.peticionador), { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(800);

  const rel = await page.evaluate(noNavegador, D);
  rel.errosPagina = errosPagina;

  const nome = (D.nomeArquivo || 'Peticao').replace(/[^\w.-]/g, '_') + '.html';
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 30000 }), page.evaluate(() => downloadHTML())]);
  const html = path.join(o.saida, nome);
  await dl.saveAs(html);
  const pdf = html.replace(/\.html$/, '.pdf');
  const pg = await ctx.newPage();
  await pg.goto('file://' + html, { waitUntil: 'load' });
  await pg.waitForTimeout(500);
  await pg.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await browser.close();
  rel.arquivos = { html, pdf };

  if (o.png) {
    try {
      const out = execFileSync('python3', ['-m', 'gav.imagens', 'paginas', pdf, '--saida', path.join(o.saida, 'paginas')], { cwd: FERRAMENTAS, encoding: 'utf8' });
      rel.arquivos.paginas = out.trim().split('\n').filter(Boolean);
    } catch (e) { rel.log.push('PNG das páginas não gerado: ' + (e.stderr || e.message).toString().slice(0, 200)); }
  }
  fs.writeFileSync(path.join(o.saida, 'relatorio.json'), JSON.stringify(rel, null, 2));

  const falhas = rel.log.filter(l => /SEM ALVO|SEM EFEITO|NÃO ACHAD|inexistente|desconhecida/.test(l));
  console.log('capítulos:', rel.capitulos.length, '| preenchidos:', rel.preenchidos.length, '| pendências:', rel.pendencias.length);
  rel.pendencias.forEach(p => console.log('  PENDENTE', p));
  falhas.forEach(f => console.log('  FALHA', f));
  rel.neutros.forEach(n => console.log('  NEUTRO', n));
  errosPagina.forEach(e => console.log('  ERRO NA PÁGINA', e));
  console.log('HTML', html); console.log('PDF ', pdf);
  if (falhas.length || errosPagina.length) process.exit(3);
  if (rel.pendencias.length && !o.permitirPendencias) process.exit(2);
}

main().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
