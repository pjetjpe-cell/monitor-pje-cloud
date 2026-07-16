// Rate limiting simples em memória para formulários públicos (lead, cadastro,
// anúncios) — ver seção 9 do briefing. Em produção com múltiplas instâncias
// serverless isso não é global, mas já evita abuso trivial de um mesmo processo;
// para proteção mais forte, trocar por um contador no KV (mesmo padrão de lib/storage/kv.ts).

interface Balde {
  contagem: number
  resetaEm: number
}

const baldes = new Map<string, Balde>()

export function limitarTaxa(chave: string, limite = 5, janelaMs = 60_000): boolean {
  const agora = Date.now()
  const balde = baldes.get(chave)

  if (!balde || balde.resetaEm < agora) {
    baldes.set(chave, { contagem: 1, resetaEm: agora + janelaMs })
    return true
  }

  if (balde.contagem >= limite) {
    return false
  }

  balde.contagem += 1
  return true
}

export function identificarCliente(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || 'desconhecido'
}
