// Núcleo da checagem semanal do PJe (Ipojuca): compara a leitura nova com a
// base guardada e monta o e-mail só com o que mudou. Funções puras — o
// `acervo.mjs` (no PC do escritório) lê o PJe; isto aqui roda em qualquer lugar.

export const RE_CNJ = /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/;

export const normalizar = (s) => String(s ?? '')
  .replace(/\s+/g, ' ').replace(/\s*\.\s*$/, '').trim().toUpperCase();

/** Aplica o filtro por advogado (ex.: advogado com um processo só). */
export function filtrar(processos, advogado) {
  if (!advogado?.apenas?.length) return processos;
  const ok = new Set(advogado.apenas);
  return processos.filter((p) => ok.has(p.numero));
}

/**
 * base/leitura: { advogados: { [nome]: { completo, processos: [{numero, vara, autuado, classe, ativo, passivo, ultima}] } } }
 * Devolve { movimentados, novos, sairam, absorvidos, novaBase }.
 *  - movimentados: a "Última moviment." mudou.
 *  - novos: processo que não estava na base, para advogado cuja base já era completa.
 *  - absorvidos: idem, mas a base daquele advogado vinha incompleta (telas cortadas) — entra sem aviso.
 *  - sairam: estava na base e não veio numa leitura completa (arquivado, redistribuído, descadastrado).
 */
export function comparar(base, leitura, { capturadoEm } = {}) {
  const movimentados = [], novos = [], sairam = [];
  let absorvidos = 0;
  const novaBase = { capturado_em: capturadoEm || leitura.capturado_em, fonte: leitura.fonte || 'leitura automática do PJe', advogados: {} };
  const visto = new Set(); // um processo de dois advogados aparece uma vez só no e-mail

  for (const [nome, lido] of Object.entries(leitura.advogados || {})) {
    const antes = base.advogados?.[nome] || { completo: false, processos: [] };
    const mapaAntes = new Map(antes.processos.map((p) => [p.numero, p]));
    const mapaAgora = new Map(lido.processos.map((p) => [p.numero, p]));

    for (const p of lido.processos) {
      const a = mapaAntes.get(p.numero);
      if (!a) {
        if (antes.completo) { if (!visto.has('n' + p.numero)) novos.push({ advogado: nome, ...p }); visto.add('n' + p.numero); }
        else absorvidos++;
        continue;
      }
      if (normalizar(a.ultima) !== normalizar(p.ultima) && !visto.has('m' + p.numero)) {
        visto.add('m' + p.numero);
        movimentados.push({ advogado: nome, numero: p.numero, ativo: p.ativo, vara: p.vara, antes: a.ultima, agora: p.ultima });
      }
    }
    if (lido.completo) {
      for (const a of antes.processos) {
        if (!mapaAgora.has(a.numero) && !visto.has('s' + a.numero)) { visto.add('s' + a.numero); sairam.push({ advogado: nome, ...a }); }
      }
    }
    // Leitura completa substitui; incompleta só acrescenta/atualiza o que veio.
    const processos = lido.completo ? lido.processos
      : [...lido.processos, ...antes.processos.filter((a) => !mapaAgora.has(a.numero))];
    novaBase.advogados[nome] = { completo: Boolean(lido.completo || antes.completo), processos };
  }
  // Advogado que não foi lido desta vez continua como estava.
  for (const [nome, antes] of Object.entries(base.advogados || {})) {
    if (!novaBase.advogados[nome]) novaBase.advogados[nome] = antes;
  }
  return { movimentados, novos, sairam, absorvidos, novaBase };
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** Assunto e corpo (HTML e texto) do e-mail semanal. */
export function montarEmail(r, { data, avisos = [] } = {}) {
  const n = r.movimentados.length + r.novos.length + r.sairam.length;
  const assunto = n
    ? `PJe Ipojuca — ${n} processo${n > 1 ? 's' : ''} com novidade (checagem de ${data})`
    : `PJe Ipojuca — nenhuma movimentação nova (checagem de ${data})`;
  const td = 'style="border:1px solid #d0d5dd;padding:6px 8px;vertical-align:top"';
  const th = 'style="border:1px solid #d0d5dd;padding:6px 8px;background:#eef2f7;text-align:left"';
  const tabela = (titulo, cab, linhas) => !linhas.length ? '' :
    `<h3 style="font-family:Arial,sans-serif;font-size:15px;margin:18px 0 6px">${esc(titulo)}</h3>
<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px">
<tr>${cab.map((c) => `<th ${th}>${esc(c)}</th>`).join('')}</tr>
${linhas.map((l) => `<tr>${l.map((c) => `<td ${td}>${esc(c)}</td>`).join('')}</tr>`).join('\n')}
</table>`;
  const html = [
    `<p style="font-family:Arial,sans-serif;font-size:14px">Checagem semanal do PJe (Ipojuca - Varas) dos advogados Gilzielle Veloso, Raphael Reis, Weiden Dutra, Luan Victor e Diogo Serafim — ${esc(data)}.</p>`,
    n ? '' : '<p style="font-family:Arial,sans-serif;font-size:14px">Nenhum processo mudou a última movimentação desde a checagem anterior.</p>',
    tabela('Processos com movimentação nova', ['Processo', 'Cliente (polo ativo)', 'Vara', 'Advogado', 'Antes', 'Agora'],
      r.movimentados.map((m) => [m.numero, m.ativo, m.vara, m.advogado, m.antes, m.agora])),
    tabela('Processos novos na lista', ['Processo', 'Cliente (polo ativo)', 'Vara', 'Advogado', 'Autuado em', 'Última movimentação'],
      r.novos.map((p) => [p.numero, p.ativo, p.vara, p.advogado, p.autuado, p.ultima])),
    tabela('Saíram da lista (conferir: arquivado ou redistribuído)', ['Processo', 'Cliente (polo ativo)', 'Vara', 'Advogado', 'Última movimentação conhecida'],
      r.sairam.map((p) => [p.numero, p.ativo, p.vara, p.advogado, p.ultima])),
    r.absorvidos ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#555">${r.absorvidos} processo(s) que não estavam nas telas de 03/11 entraram na base nesta leitura (listas que vieram cortadas); não aparecem como novidade.</p>` : '',
    avisos.length ? `<p style="font-family:Arial,sans-serif;font-size:12px;color:#8a4b00">${avisos.map(esc).join('<br>')}</p>` : '',
  ].filter(Boolean).join('\n');
  const texto = [
    `Checagem semanal do PJe (Ipojuca) — ${data}`,
    ...r.movimentados.map((m) => `${m.numero} | ${m.ativo} | ${m.vara} | ${m.advogado} | ${m.antes} -> ${m.agora}`),
    ...r.novos.map((p) => `NOVO ${p.numero} | ${p.ativo} | ${p.advogado} | ${p.ultima}`),
    ...r.sairam.map((p) => `SAIU ${p.numero} | ${p.ativo} | ${p.advogado}`),
    n ? '' : 'Nenhuma movimentação nova.',
    ...avisos,
  ].filter(Boolean).join('\n');
  return { assunto, html, texto, total: n };
}
