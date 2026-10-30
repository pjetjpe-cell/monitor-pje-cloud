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

// A caixa de busca muda entre versões do WhatsApp Web (contenteditable antigo,
// <input> com "Pesquisar ou começar uma nova conversa" no layout de 2026).
const SELETORES_BUSCA = [
  'input[aria-label*="esquisar" i]',
  'input[placeholder*="esquisar" i]',
  'div[contenteditable="true"][aria-label*="esquisar" i]',
  'div[contenteditable="true"][data-tab="3"]',
  'div[contenteditable="true"][title*="esquisar" i]',
  '#side div[contenteditable="true"]',
  '#side input[type="text"]',
  'div[role="textbox"][data-tab="3"]',
  'input[aria-label*="earch" i]',
  'div[contenteditable="true"][aria-label*="earch" i]',
];

async function acharBusca(pagina) {
  for (const seletor of SELETORES_BUSCA) {
    const alvo = pagina.locator(seletor).first();
    if (await alvo.count() && await alvo.isVisible().catch(() => false)) return alvo;
  }
  return null;
}

async function telaDoQrCode(pagina) {
  const qr = pagina.locator('canvas[aria-label*="QR" i], canvas[aria-label*="scan" i], [data-ref] canvas').first();
  if (await qr.count()) return true;
  const texto = await pagina.locator('body').innerText().catch(() => '');
  return /escaneie|scan the qr|use o whatsapp no seu|link with phone|conectar com n[uú]mero/i.test(texto);
}

async function acharPaginaWhatsApp(navegador) {
  const contextos = navegador.contexts();
  if (contextos.length === 0) {
    encerrar('o Chrome respondeu mas não tem nenhuma aba aberta.');
  }
  const abas = [];
  for (const contexto of contextos) {
    for (const pagina of contexto.pages()) {
      if (pagina.url().includes('web.whatsapp.com')) abas.push({ pagina, contexto });
    }
  }
  if (abas.length) {
    // Espera até 30 s a aba carregar; escolhe a que está logada (tem busca).
    let qr = false;
    for (let t = 0; t < 15; t++) {
      for (const aba of abas) {
        if (await acharBusca(aba.pagina)) return aba;
        if (await telaDoQrCode(aba.pagina)) qr = true;
      }
      if (qr) break;
      await abas[0].pagina.waitForTimeout(2000);
    }
    if (qr) {
      encerrar('o WhatsApp desta janela do Chrome NÃO está conectado: aparece o QR code. ' +
        'Leia o QR code com o celular nessa janela (a sem favoritos), espere as conversas e rode de novo.');
    }
    encerrar('a aba do WhatsApp abriu, mas não achei a caixa de busca em 30 s. ' +
      'Confira se as conversas aparecem nessa janela e rode de novo; persistindo, o WhatsApp Web mudou o layout.');
  }
  encerrar(
    'nenhuma aba em web.whatsapp.com. Abra o WhatsApp Web nessa janela do Chrome ' +
    '(a que foi aberta com --remote-debugging-port) e rode de novo.'
  );
}

async function abrirConversa(pagina, contato) {
  const busca = await acharBusca(pagina);
  if (!busca) {
    encerrar('não achei a caixa de busca do WhatsApp. A tela está carregada e destravada?');
  }

  await busca.click();
  await pagina.keyboard.press('Control+A').catch(() => {});
  await busca.fill('').catch(() => {});
  await pagina.keyboard.type(contato, { delay: 40 });
  await pagina.waitForTimeout(1400);

  // Prefere o item cujo título é exatamente o nome pedido; senão, o primeiro da lista.
  const exato = pagina.locator(`span[title="${contato.replace(/"/g, '\\"')}"]`).first();
  const resultado = (await exato.count()) ? exato : pagina.locator(
    '#pane-side [role="listitem"], #pane-side [role="row"], [aria-label*="conversas" i] [role="listitem"], [aria-label*="conversas" i] [role="row"]'
  ).first();
  if (!(await resultado.count())) {
    encerrar(`nenhuma conversa encontrada para "${contato}". Confira o nome exato na sua lista.`);
  }
  await resultado.click();
  await pagina.waitForTimeout(1600);

  // Confirma que abriu a conversa CERTA. Baixar documento do cliente errado e
  // arquivá-lo na pasta de outro é exatamente o erro que não pode acontecer.
  const cabMain = pagina.locator('#main header').first();
  const cabecalho = (await cabMain.count()) ? cabMain : pagina.locator('header').last();
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

// Seletores do item clicável de cada anexo (layouts antigo e de 2026).
const SELETOR_ANEXO = [
  '[data-testid="document-thumb"]',
  '[data-icon="document"]',
  '[data-icon="audio-download"]',
  '[data-testid="media-download"]',
  '[data-icon="media-download"]',
  'div[role="button"][title*="aixar" i]',
  'span[data-icon="download"]',
].join(', ');

function painelMensagens(pagina) {
  return pagina.locator('#main [data-testid="conversation-panel-messages"], #main div[role="application"]').first();
}

// A lista de mensagens é virtualizada: o que sai da tela sai do DOM. Por isso
// coleta-se ENQUANTO se rola — primeiro o fim da conversa (onde ficam os
// documentos recém-enviados), depois subindo aos poucos — e cada anexo é
// guardado pelo data-id da mensagem, não por um localizador vivo.
async function varrerConversa(pagina, vezes, limite) {
  const painel = painelMensagens(pagina);
  const anexos = [];
  const vistos = new Set();
  const coletar = async () => {
    const achados = await pagina.evaluate((sel) => {
      return [...document.querySelectorAll('#main [data-id]')]
        .filter((linha) => linha.querySelector(sel))
        .map((linha) => ({ chave: linha.getAttribute('data-id'), rotulo: (linha.innerText || '').slice(0, 160) }));
    }, SELETOR_ANEXO).catch(() => []);
    for (const a of achados) {
      if (!a.chave || vistos.has(a.chave) || anexos.length >= limite) continue;
      vistos.add(a.chave);
      anexos.push(a);
    }
  };
  await painel.evaluate((el) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
  await pagina.waitForTimeout(1500);
  await coletar();
  for (let i = 0; i < vezes && anexos.length < limite; i++) {
    const noTopo = await painel.evaluate((el) => {
      el.scrollTop = Math.max(0, el.scrollTop - el.clientHeight * 0.85);
      return el.scrollTop === 0;
    }).catch(() => true);
    await pagina.waitForTimeout(900);
    await coletar();
    if (noTopo) break;
  }
  await painel.evaluate((el) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
  await pagina.waitForTimeout(800);
  // Mais antigo primeiro, na ordem em que o cliente mandou.
  return anexos.reverse();
}

// Reencontra o anexo pelo data-id, rolando a partir do fim se ele saiu do DOM.
async function localizarAnexo(pagina, chave) {
  const painel = painelMensagens(pagina);
  const alvo = pagina.locator(`#main [data-id="${chave}"]`).locator(SELETOR_ANEXO).first();
  if (await alvo.count()) return alvo;
  await painel.evaluate((el) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
  await pagina.waitForTimeout(900);
  for (let i = 0; i < 40; i++) {
    if (await alvo.count()) return alvo;
    const noTopo = await painel.evaluate((el) => {
      el.scrollTop = Math.max(0, el.scrollTop - el.clientHeight * 0.85);
      return el.scrollTop === 0;
    }).catch(() => true);
    await pagina.waitForTimeout(700);
    if (noTopo) break;
  }
  return (await alvo.count()) ? alvo : null;
}

function nomeSeguro(nome, indice) {
  const limpo = (nome || '').replace(/[\\/:*?"<>|\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!limpo) return `anexo-${String(indice).padStart(3, '0')}`;
  return limpo.slice(0, 120);
}

// Conectado por CDP a um Chrome já aberto, o Playwright não recebe o evento de
// download. Pede-se ao próprio Chrome que grave na pasta de destino e avise
// (Browser.setDownloadBehavior); no fim, devolve-se o comportamento padrão.
async function prepararDownloads(navegador, destino) {
  const cdp = await navegador.newBrowserCDPSession();
  const inicios = new Map();
  const concluidos = new Map();
  cdp.on('Browser.downloadWillBegin', (ev) => inicios.set(ev.guid, ev.suggestedFilename));
  cdp.on('Browser.downloadProgress', (ev) => {
    if (ev.state === 'completed' || ev.state === 'canceled') concluidos.set(ev.guid, ev.state);
  });
  await cdp.send('Browser.setDownloadBehavior', {
    behavior: 'allowAndName', downloadPath: path.resolve(destino), eventsEnabled: true,
  });
  return {
    async esperar(antes, ms) {
      const fim = Date.now() + ms;
      let guid = null;
      while (Date.now() < fim) {
        if (!guid) guid = [...inicios.keys()].find((g) => !antes.has(g)) || null;
        if (guid && concluidos.has(guid)) {
          return concluidos.get(guid) === 'completed' ? { guid, sugerido: inicios.get(guid) } : null;
        }
        await new Promise((r) => setTimeout(r, 300));
      }
      return null;
    },
    vistos() { return new Set(inicios.keys()); },
    async restaurar() {
      await cdp.send('Browser.setDownloadBehavior', { behavior: 'default' }).catch(() => {});
    },
  };
}

// O WhatsApp Web de 2026 abre PDF num visualizador (iframe pdf-viewer) com
// botões "Baixar" e "Fechar"; o Esc não fecha. Fecha o que estiver aberto.
async function fecharVisualizador(pagina) {
  const fechar = pagina.locator('button[aria-label="Fechar"]').first();
  if (await pagina.locator('[data-testid="pdf-viewer-iframe"]').count() && await fechar.count()) {
    await fechar.click({ timeout: 4000 }).catch(() => {});
    await pagina.waitForTimeout(700);
  }
}

async function baixarAnexo(pagina, anexo, destino, indice, downloads) {
  const antes = downloads.vistos();
  await fecharVisualizador(pagina);
  const item = await localizarAnexo(pagina, anexo.chave);
  if (!item) return null;
  await item.scrollIntoViewIfNeeded().catch(() => {});
  await item.click({ timeout: 8000 }).catch(() => null);
  // Visualizador aberto? então o download sai pelo botão "Baixar" dele.
  const baixar = pagina.locator('button[aria-label="Baixar"]').first();
  for (let t = 0; t < 16; t++) {
    if (await baixar.count() && await baixar.isVisible().catch(() => false)) {
      await baixar.click({ timeout: 6000 }).catch(() => null);
      break;
    }
    if (downloads.vistos().size > antes.size) break;   // baixou direto, sem visualizador
    await pagina.waitForTimeout(500);
  }
  const feito = await downloads.esperar(antes, 180000);
  await fecharVisualizador(pagina);
  if (!feito) return null;

  const nome = nomeSeguro(feito.sugerido, indice);
  let caminho = path.join(destino, nome);
  let n = 1;
  while (await fs.access(caminho).then(() => true).catch(() => false)) {
    const ext = path.extname(nome);
    caminho = path.join(destino, `${path.basename(nome, ext)} (${n++})${ext}`);
  }
  await fs.rename(path.join(path.resolve(destino), feito.guid), caminho);
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
  await fecharVisualizador(pagina);
  const conversa = await abrirConversa(pagina, args.contato);
  console.log(`Conversa aberta: ${conversa}`);

  const anexos = await varrerConversa(pagina, args.rolagens, args.limite);

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
  const downloads = await prepararDownloads(navegador, args.destino);
  const baixados = [];
  const falhas = [];
  for (let i = 0; i < anexos.length; i++) {
    const resultado = await baixarAnexo(pagina, anexos[i], args.destino, i + 1, downloads)
      .catch((e) => { console.log(`  erro no anexo ${i + 1}: ${e.message.split('\n')[0]}`); return null; });
    if (resultado) {
      baixados.push(resultado);
      console.log(`  [${i + 1}/${anexos.length}] ${resultado.nome} (${(resultado.bytes / 1024).toFixed(0)} KB)`);
    } else {
      falhas.push({ indice: i + 1, rotulo: anexos[i].rotulo.slice(0, 120) });
      console.log(`  [${i + 1}/${anexos.length}] nao baixou`);
    }
    await pagina.waitForTimeout(600);
  }
  await downloads.restaurar();   // Chrome volta a baixar na pasta de sempre
  await fecharVisualizador(pagina);

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
