import { chromium } from 'playwright';
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
const [,, html, projetoJson, saida, inicio = '0', fim = '', amostra = ''] = process.argv;
const proj = JSON.parse(fs.readFileSync(projetoJson, 'utf8')); proj.id = 'render';
const FPS = 30;
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport: { width: 1200, height: 900 } });
// Fontes do Google baixadas pelo curl (que confia no proxy) e servidas ao navegador
await pg.route(/fonts\.(googleapis|gstatic)\.com/, async r => {
  const body = execFileSync('curl', ['-sS', '-A', UA, r.request().url()], { maxBuffer: 1 << 26 });
  await r.fulfill({ status: 200, body, headers: { 'content-type': r.request().url().includes('googleapis') ? 'text/css' : 'font/woff2', 'access-control-allow-origin': '*' } });
});
await pg.addInitScript(p => { localStorage.setItem('estudio-video-v1', JSON.stringify({ projetos: { render: p }, ativo: 'render' })); }, proj);
await pg.goto('file://' + html);
await pg.waitForFunction(() => window.estudioRender);
await pg.evaluate(async () => { await window.estudioRender.fontes(); await document.fonts.ready; });
const ok = await pg.evaluate(() => ['700 40px "Playfair Display"', '800 40px "Work Sans"', '500 40px "Work Sans"'].map(f => document.fonts.check(f)));
console.error('fontes', ok);
const T = await pg.evaluate(() => window.estudioRender.total());
if (amostra) { // quadros soltos para revisão
  for (const t of amostra.split(',').map(Number)) {
    const d = await pg.evaluate(t => { window.estudioRender.desenhar(t); return window.estudioRender.canvas.toDataURL('image/jpeg', 0.9); }, t);
    fs.writeFileSync(`${saida}-${String(t).padStart(6, '0')}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close(); process.exit(0);
}
const f0 = Math.round(Number(inicio) * FPS), f1 = Math.round((fim ? Number(fim) : T) * FPS);
const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', String(FPS), saida], { stdio: ['pipe', 'inherit', 'inherit'] });
const LOTE = 15;
for (let f = f0; f < f1; f += LOTE) {
  const quadros = await pg.evaluate(({ a, z, FPS }) => { const out = []; for (let i = a; i < z; i++) { window.estudioRender.desenhar(i / FPS); out.push(window.estudioRender.canvas.toDataURL('image/jpeg', 0.94).split(',')[1]); } return out; }, { a: f, z: Math.min(f + LOTE, f1), FPS });
  for (const q of quadros) { if (!ff.stdin.write(Buffer.from(q, 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
  if ((f - f0) % (LOTE * 40) === 0) console.error(`quadro ${f}/${f1}`);
}
ff.stdin.end(); await new Promise(r => ff.on('close', r));
await b.close();
