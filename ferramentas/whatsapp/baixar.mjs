#!/usr/bin/env node
/**
 * Baixa os documentos que um cliente mandou no WhatsApp Web.
 *
 * Roda na MÁQUINA DO USUÁRIO, nunca num contêiner remoto: liga-se ao Chrome
 * que já está aberto e logado. Nenhuma credencial passa por aqui — a sessão do
 * WhatsApp é a que o usuário já abriu.
 *
 * Antes de rodar, o Chrome precisa estar aberto com a porta de depuração:
 *
 *   macOS:   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
 *              --remote-debugging-port=9222 --user-data-dir="$HOME/.chrome-whatsapp"
 *   Windows: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" ^
 *              --remote-debugging-port=9222 --user-data-dir="%USERPROFILE%\\.chrome-whatsapp"
 *   Linux:   google-chrome --remote-debugging-port=9222 --user-data-dir=~/.chrome-whatsapp
 *
 * Depois abra web.whatsapp.com nessa janela e leia o QR code uma vez.
 *
 * Uso:
 *   node baixar.mjs --contato "Janice Brutti" --destino "/caminho/NAO USAR"
 *
 * O script é SOMENTE LEITURA: abre conversa e baixa anexo. Não digita, não
 * envia, não encaminha, não apaga. Mexer na conversa de um cliente por engano
 * é dano que não se desfaz.
 */

import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// --------------------------------------------------------------------------

function lerArgumentos(argv) {
  const args = {
    porta: 9222, limite: 60, rolagens: 12, destino: null,
    contato: null, manifesto: null, desde: null, simular: false,
  };
  for (let i = 2; i < argv.length; i++) {
    const [chave, valorJunto] = argv[i].split(/=(.*)/s);
    const proximo = () => valorJunto ?? argv[++i];
    switch (chave) {
      case '--contato': args.contato = proximo(); break;
      case '--destino': args.destino = proximo(); break;
      case '--porta': args.porta = Number(proximo()); break;
      case '--limite': args.limite = Number(proximo()); break;
      case '--rolagens': args.rolagens = Number(proximo()); break;
      case '--desde': args.desde = proximo(); break;
      case '--manifesto': args.manifesto = proximo(); break;
      case '--simular': args.simular = true; break;
      case '--ajuda': case '-h': args.ajuda = true; break;
      default:
        throw new Error(`argumento desconhecido: ${chave}`);
    }
  }
  return args;
}

function normalizar(texto) {
  return (texto || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}

function encerrar(mensagem) {
  console.error(`ERRO: ${mensagem}`);
  process.exit(2);
}

// --------------------------------------------------------------------------

async function acharPaginaWhatsApp(navegador) {
  const contextos = navegador.contexts();
  if (contextos.length === 0) {
    encerrar('o Chrome respondeu mas não tem nenhuma aba aberta.');
  }
  for (const contexto of contextos) {
    for (const pagina of contexto.pages()) {
      if (pagina.url().includes('web.whatsapp.com')) return { pagina, contexto };
    }
  }
  encerrar(
    'nenhuma aba em web.whatsapp.com. Abra o WhatsApp Web nessa janela do Chrome ' +
    '(a que foi aberta com --remote-debugging-port) e rode de novo.'
  );
}

async function abrirConversa(pagina, contato) {
  // A caixa de busca muda de rótulo entre versões; tenta as formas conhecidas.
  const seletoresBusca = [
    'div[contenteditable="true"][data-tab="3"]',
    'div[contenteditable="true"][title*="esquisar" i]',
    '#side div[contenteditable="true"]',
    'div[role="textbox"][data-tab="3"]',
  ];
  let busca = null;
  for (const seletor of seletoresBusca) {
    const alvo = pagina.locator(seletor).first();
    if (await alvo.count() && await alvo.isVisible().catch(() => false)) { busca = alvo; break; }
  }
  if (!busca) {
    encerrar('não achei a caixa de busca do WhatsApp. A tela está carregada e destravada?');
  }

  await busca.click();
  await pagina.keyboard.press('Control+A').catch(() => {});
  await busca.fill('').catch(() => {});
  await pagina.keyboard.type(contato, { delay: 40 });
  await pagina.waitForTimeout(1400);

  const resultado = pagina.locator('#pane-side [role="listitem"]').first();
  if (!(await resultado.count())) {
    encerrar(`nenhuma conversa encontrada para "${contato}". Confira o nome exato na sua lista.`);
  }
  await resultado.click();
  await pagina.waitForTimeout(1600);

  // Confirma que abriu a conversa CERTA. Baixar documento do cliente errado e
  // arquivá-lo na pasta de outro é exatamente o erro que não pode acontecer.
  const cabecalho = pagina.locator('header').first();
  const titulo = (await cabecalho.innerText().catch(() => '')).split('\n')[0] || '';
  const pedido = normalizar(contato);
  const aberto = normalizar(titulo);
  if (!aberto.includes(pedido) && !pedido.includes(aberto)) {
    encerrar(
      `abriu "${titulo}" mas você pediu "${contato}". Não vou baixar da conversa errada. ` +
      'Use o nome como aparece na lista de conversas.'
    );
  }
  return titulo.trim();
}

async function rolarHistorico(pagina, vezes) {
  const painel = pagina.locator('#main [data-testid="conversation-panel-messages"], #main div[role="application"]').first();
  const alvo = (await painel.count()) ? painel : pagina.locator('#main').first();
  for (let i = 0; i < vezes; i++) {
    await alvo.evaluate((el) => { el.scrollTop = 0; }).catch(() => {});
    await pagina.waitForTimeout(700);
  }
  await alvo.evaluate((el) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
  await pagina.waitForTimeout(500);
}

async function coletarAnexos(pagina, limite) {
  const seletores = [
    '#main [data-testid="document-thumb"]',
    '#main [data-icon="document"]',
    '#main [data-icon="audio-download"]',
    '#main [data-testid="media-download"]',
    '#main [data-icon="media-download"]',
    '#main div[role="button"][title*="aixar" i]',
    '#main span[data-icon="download"]',
  ];
  const vistos = new Set();
  const anexos = [];
  for (const seletor of seletores) {
    const itens = pagina.locator(seletor);
    const total = await itens.count();
    for (let i = 0; i < total && anexos.length < limite; i++) {
      const item = itens.nth(i);
      const chave = await item.evaluate((el) => {
        const linha = el.closest('[data-id]');
        return linha ? linha.getAttribute('data-id') : null;
      }).catch(() => null);
      if (chave && vistos.has(chave)) continue;
      if (chave) vistos.add(chave);
      const rotulo = await item.evaluate((el) => {
        const linha = el.closest('[data-id]') || el.parentElement;
        return linha ? (linha.innerText || '').slice(0, 160) : '';
      }).catch(() => '');
      anexos.push({ localizador: item, chave: chave || `sem-id-${anexos.length}`, rotulo });
    }
  }
  return anexos;
}

function nomeSeguro(nome, indice) {
  const limpo = (nome || '').replace(/[\\/:*?"<>|\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!limpo) return `anexo-${String(indice).padStart(3, '0')}`;
  return limpo.slice(0, 120);
}

async function baixarAnexo(pagina, anexo, destino, indice) {
  const espera = pagina.waitForEvent('download', { timeout: 20000 }).catch(() => null);
  await anexo.localizador.click({ timeout: 8000 }).catch(() => null);
  const download = await espera;
  if (!download) return null;

  const sugerido = download.suggestedFilename() || '';
  const nome = nomeSeguro(sugerido, indice);
  let caminho = path.join(destino, nome);
  let n = 1;
  while (await fs.access(caminho).then(() => true).catch(() => false)) {
    const ext = path.extname(nome);
    caminho = path.join(destino, `${path.basename(nome, ext)} (${n++})${ext}`);
  }
  await download.saveAs(caminho);
  const bytes = await fs.readFile(caminho);
  return {
    arquivo: caminho,
    nome: path.basename(caminho),
    bytes: bytes.length,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    rotulo_na_conversa: anexo.rotulo,
  };
}

// --------------------------------------------------------------------------

async function principal() {
  let args;
  try { args = lerArgumentos(process.argv); }
  catch (e) { encerrar(e.message); }

  if (args.ajuda || !args.contato || (!args.destino && !args.simular)) {
    console.log(`
Baixa os documentos de um cliente no WhatsApp Web (somente leitura).

  --contato "Nome"    conversa a abrir, como aparece na sua lista   (obrigatório)
  --destino "/pasta"  onde gravar                                   (obrigatório)
  --porta 9222        porta de depuração do Chrome
  --limite 60         máximo de anexos
  --rolagens 12       quantas vezes rolar para carregar histórico
  --manifesto a.json  grava o relatório do que foi baixado
  --simular           lista o que acharia, sem baixar nada
`);
    process.exit(args.ajuda ? 0 : 2);
  }

  let navegador;
  try {
    navegador = await chromium.connectOverCDP(`http://localhost:${args.porta}`);
  } catch (e) {
    encerrar(
      `não consegui falar com o Chrome na porta ${args.porta}. ` +
      'Abra o Chrome com --remote-debugging-port=' + args.porta +
      ' e deixe o WhatsApp Web logado nessa janela.'
    );
  }

  const { pagina } = await acharPaginaWhatsApp(navegador);
  const conversa = await abrirConversa(pagina, args.contato);
  console.log(`Conversa aberta: ${conversa}`);

  await rolarHistorico(pagina, args.rolagens);
  const anexos = await coletarAnexos(pagina, args.limite);

  if (anexos.length === 0) {
    encerrar(
      'nenhum anexo encontrado na conversa. Ou o cliente não mandou documento, ' +
      'ou o WhatsApp Web mudou os seletores — confira a olho antes de concluir ' +
      'que não há documentos.'
    );
  }
  console.log(`${anexos.length} anexo(s) encontrado(s).`);

  if (args.simular) {
    anexos.forEach((a, i) => console.log(`  ${i + 1}. ${a.rotulo.replace(/\n/g, ' | ').slice(0, 110)}`));
    await navegador.close().catch(() => {});
    return;
  }

  await fs.mkdir(args.destino, { recursive: true });
  const baixados = [];
  const falhas = [];
  for (let i = 0; i < anexos.length; i++) {
    const resultado = await baixarAnexo(pagina, anexos[i], args.destino, i + 1);
    if (resultado) {
      baixados.push(resultado);
      console.log(`  [${i + 1}/${anexos.length}] ${resultado.nome} (${(resultado.bytes / 1024).toFixed(0)} KB)`);
    } else {
      falhas.push({ indice: i + 1, rotulo: anexos[i].rotulo.slice(0, 120) });
      console.log(`  [${i + 1}/${anexos.length}] nao baixou`);
    }
    await pagina.waitForTimeout(600);
  }

  const relatorio = {
    contato_pedido: args.contato,
    conversa_aberta: conversa,
    destino: args.destino,
    quando: new Date().toISOString(),
    baixados,
    falhas,
    total_encontrados: anexos.length,
  };
  if (args.manifesto) {
    await fs.writeFile(args.manifesto, JSON.stringify(relatorio, null, 2), 'utf8');
  }

  console.log(`\n${baixados.length} de ${anexos.length} anexo(s) salvos em ${args.destino}`);
  if (falhas.length) {
    console.log(`${falhas.length} nao baixaram — confira a olho na conversa antes de seguir.`);
  }
  await navegador.close().catch(() => {});
  process.exit(falhas.length && baixados.length === 0 ? 1 : 0);
}

principal().catch((e) => encerrar(e.stack || e.message));
