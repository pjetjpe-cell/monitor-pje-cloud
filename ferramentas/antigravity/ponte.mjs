#!/usr/bin/env node
/**
 * Ponte painel → Antigravity no computador do escritório.
 *
 * O painel (artefato no claude.ai) não pode abrir conexão com o PC — a página
 * roda isolada. Então ele COPIA um pedido assinado para a área de transferência
 * e o vigia, rodando aqui, reconhece o pedido, confere a assinatura e abre uma
 * janela do Antigravity (CLI `agy`, ou a IDE) já com a tarefa.
 *
 *   node ponte.mjs vigiar                     # acorda o vigia (deixe a janela aberta)
 *   node ponte.mjs token                      # mostra o token para colar no painel
 *   node ponte.mjs executar --tarefa missao --cliente "110. VALTEMIR URCINO" [--modo ide]
 *   node ponte.mjs verificar "GAV-AGY1.…"     # só confere um pedido, não abre nada
 *
 * Pedido: GAV-AGY1.<base64url(JSON)>.<hmac-sha256 hex do trecho base64 com o token>.
 * Sem token certo, pedido velho (> 10 min), repetido, tarefa fora da lista ou
 * campo obrigatório vazio: recusa e diz por quê. Nunca roda texto como comando —
 * o pedido só escolhe uma tarefa da lista (tarefas.json) e preenche campos.
 * O `agy` abre interativo: cada ação dele continua pedindo a sua aprovação.
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { montarPedido } from './nucleo.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(AQUI, '..', '..');
const CATALOGO = JSON.parse(readFileSync(join(AQUI, 'tarefas.json'), 'utf8'));
const PREFIXO = 'GAV-AGY1';
const VALIDADE_MS = 10 * 60 * 1000;
const ARQ_TOKEN = process.env.GAV_TOKEN_ARQUIVO || join(homedir(), '.gav', 'antigravity-token.txt');
const MODOS = ['cli', 'ide'];

export function lerToken({ criar = true } = {}) {
  if (existsSync(ARQ_TOKEN)) return readFileSync(ARQ_TOKEN, 'utf8').trim();
  if (!criar) throw new Error(`sem token em ${ARQ_TOKEN}`);
  mkdirSync(dirname(ARQ_TOKEN), { recursive: true });
  const token = randomBytes(18).toString('base64url');
  writeFileSync(ARQ_TOKEN, token + '\n', { mode: 0o600 });
  return token;
}

export function assinar(token, corpo) {
  const b64 = Buffer.from(JSON.stringify(corpo), 'utf8').toString('base64url');
  const sig = createHmac('sha256', token).update(b64).digest('hex');
  return `${PREFIXO}.${b64}.${sig}`;
}

/** Confere o texto copiado pelo painel e devolve o pedido pronto (com prompt). */
export function verificar(texto, token, { agora = Date.now(), vistos = new Set() } = {}) {
  const partes = String(texto).trim().split('.');
  if (partes.length !== 3 || partes[0] !== PREFIXO) throw new Error('não é um pedido do painel');
  const [, b64, sig] = partes;
  const esperado = createHmac('sha256', token).update(b64).digest();
  const recebido = Buffer.from(sig, 'hex');
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) {
    throw new Error('assinatura não confere: o token do painel é diferente do deste PC (rode "node ponte.mjs token")');
  }
  const corpo = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
  if (corpo.v !== 1) throw new Error(`versão de pedido desconhecida: ${corpo.v}`);
  if (typeof corpo.ts !== 'number' || Math.abs(agora - corpo.ts) > VALIDADE_MS) {
    throw new Error('pedido vencido (mais de 10 min): clique de novo no painel');
  }
  if (!corpo.nonce || vistos.has(corpo.nonce)) throw new Error('pedido repetido: já foi executado');
  vistos.add(corpo.nonce);
  const modo = MODOS.includes(corpo.modo) ? corpo.modo : 'cli';
  return { ...montarPedido(CATALOGO, corpo.tarefa, corpo.campos), modo };
}

/** Abre a janela do Antigravity com o pedido. `simular` só devolve o que faria. */
export function abrir(pedido, { simular = false } = {}) {
  const arquivo = join(tmpdir(), `gav-pedido-${randomBytes(6).toString('hex')}.json`);
  const dados = { ...pedido, repo: REPO };
  const args = ['-NoExit', '-NoProfile', '-ExecutionPolicy', 'Bypass',
    '-File', join(AQUI, 'acordar.ps1'), '-Pedido', arquivo];
  if (simular || process.platform !== 'win32') {
    return { simulado: true, arquivo, comando: ['powershell.exe', ...args], pedido: dados };
  }
  writeFileSync(arquivo, JSON.stringify(dados), 'utf8');
  // detached no Windows = janela de console própria, que continua aberta.
  const filho = spawn('powershell.exe', args, { cwd: REPO, detached: true, stdio: 'ignore' });
  filho.unref();
  return { simulado: false, arquivo, pid: filho.pid };
}

// Lê a área de transferência por um PowerShell que fica rodando e só repassa
// textos que começam com o prefixo do painel (o resto do que você copia fica
// onde está).
const VIGIA_PS = `
$ultimo = ''
while ($true) {
  try { $t = Get-Clipboard -Raw } catch { $t = $null }
  if ($t -and $t -ne $ultimo) {
    $ultimo = $t
    $l = $t.Trim()
    if ($l.StartsWith('${PREFIXO}.')) { [Console]::Out.WriteLine($l); [Console]::Out.Flush() }
  }
  Start-Sleep -Milliseconds 700
}`;

function hora() { return new Date().toLocaleTimeString('pt-BR'); }

function vigiar({ teste = false } = {}) {
  const token = lerToken();
  const vistos = new Set();
  console.log('GAV · vigia do Antigravity acordado.');
  console.log(`Repositório: ${REPO}`);
  console.log(`Token do painel (cole uma vez no painel): ${token}`);
  console.log('Deixe esta janela aberta. Clique "Enviar ao Antigravity" no painel.\n');

  let fonte;
  if (teste || process.platform !== 'win32') {
    console.log('(modo teste: lendo pedidos da entrada padrão)');
    fonte = process.stdin;
  } else {
    const ps = spawn('powershell.exe', ['-NoProfile', '-STA', '-Command', VIGIA_PS],
      { stdio: ['ignore', 'pipe', 'inherit'], windowsHide: true });
    ps.on('exit', (c) => { console.error(`leitor da área de transferência parou (código ${c})`); process.exit(1); });
    fonte = ps.stdout;
  }
  createInterface({ input: fonte }).on('line', (linha) => {
    if (!linha.trim()) return;
    try {
      const pedido = verificar(linha, token, { vistos });
      const r = abrir(pedido, { simular: teste });
      console.log(`[${hora()}] ${pedido.rotulo} (${pedido.modo}) → ${r.simulado ? 'simulado' : 'janela aberta'}`);
      if (r.simulado) console.log(JSON.stringify(r.pedido));
    } catch (e) {
      console.log(`[${hora()}] RECUSADO: ${e.message}`);
    }
  });
}

function opcoes(argv) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const nome = argv[i].slice(2);
      const prox = argv[i + 1];
      if (prox === undefined || prox.startsWith('--')) o[nome] = true; else { o[nome] = prox; i++; }
    }
  }
  return o;
}

function main(argv) {
  const [cmd, ...resto] = argv;
  const o = opcoes(resto);
  switch (cmd) {
    case 'vigiar': return vigiar({ teste: !!o.teste });
    case 'token': console.log(lerToken()); return;
    case 'verificar': {
      const p = verificar(resto[0], lerToken({ criar: false }));
      console.log(JSON.stringify(p, null, 2));
      return;
    }
    case 'executar': {
      const { tarefa, modo, simular, ...campos } = o;
      const pedido = { ...montarPedido(CATALOGO, tarefa, campos), modo: MODOS.includes(modo) ? modo : 'cli' };
      console.log(pedido.prompt + '\n');
      console.log(JSON.stringify(abrir(pedido, { simular: !!simular }), null, 2));
      return;
    }
    default:
      console.log('uso: node ponte.mjs vigiar | token | executar --tarefa <id> [--cliente ..] [--pasta ..] [--tipo ..] [--modo cli|ide] | verificar "<pedido>"');
      console.log('tarefas: ' + CATALOGO.tarefas.map((t) => t.id).join(', '));
      process.exitCode = cmd ? 1 : 0;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); } catch (e) { console.error(`ERRO: ${e.message}`); process.exitCode = 1; }
}
