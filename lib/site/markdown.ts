// Utilitários para derivar título/resumo em texto puro a partir do markdown
// de um Artigo, evitando duplicar conteúdo entre o campo `titulo` e o corpo.

const primeiroTitulo = /^#\s+.+\n+/

export function removerPrimeiroTitulo(markdown: string): string {
  return markdown.replace(primeiroTitulo, '')
}

export function extrairResumo(markdown: string, max = 160): string {
  const semTitulo = removerPrimeiroTitulo(markdown)
  const textoPuro = semTitulo
    .replace(/[#*_`>]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  if (textoPuro.length <= max) return textoPuro
  return `${textoPuro.slice(0, max).trimEnd()}…`
}
