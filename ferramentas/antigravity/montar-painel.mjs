// Gera painel.html (o artefato) a partir de painel.fonte.html, colando o
// catálogo de tarefas e o MESMO código de nucleo.mjs que a ponte usa.
// O link do instalador fica preso ao último commit que mexeu no instalar.ps1
// (o raw do GitHub guarda cache do nome do ramo).
//   node ferramentas/antigravity/montar-painel.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const aqui = dirname(fileURLToPath(import.meta.url));
const sha = execFileSync('git', ['log', '-1', '--format=%H', '--', 'instalar.ps1'], { cwd: aqui, encoding: 'utf8' }).trim();
if (!sha) throw new Error('faça commit do instalar.ps1 antes de montar o painel');
const sujo = execFileSync('git', ['status', '--porcelain', '--', 'instalar.ps1'], { cwd: aqui, encoding: 'utf8' }).trim();
if (sujo) throw new Error('instalar.ps1 tem mudança sem commit: o link do painel apontaria para a versão velha');

const url = `https://raw.githubusercontent.com/pjetjpe-cell/monitor-pje-cloud/${sha}/ferramentas/antigravity/instalar.ps1`;
const catalogo = readFileSync(join(aqui, 'tarefas.json'), 'utf8').trim();
const nucleo = readFileSync(join(aqui, 'nucleo.mjs'), 'utf8').replace(/^export /gm, '');
const preencher = (h) => h.replace('/*CATALOGO*/null', () => catalogo)
  .replace('/*NUCLEO*/', () => nucleo).replaceAll('__INSTALADOR__', url);
const fonte = readFileSync(join(aqui, 'painel.fonte.html'), 'utf8');
writeFileSync(join(aqui, 'painel.html'), preencher(fonte));

// Central (metade Antigravity, metade Claude): mesma cabeça e mesmo CSS base
// do painel, mais o corpo próprio.
const cabeca = fonte.slice(0, fonte.indexOf('<div class="wrap">'))
  .replace('<title>Painel Antigravity GAV</title>', '<title>Central Antigravity e Claude</title>');
const corpo = readFileSync(join(aqui, 'central.corpo.html'), 'utf8');
writeFileSync(join(aqui, 'central.html'), preencher(cabeca + corpo));
console.log(`painel.html e central.html gerados (instalador ${sha.slice(0, 7)})`);
