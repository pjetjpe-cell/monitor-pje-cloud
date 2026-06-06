// Armazenamento de estado dos processos monitorados
// Usa Vercel KV em produção, arquivo JSON local em desenvolvimento

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

export interface ProcessoMonitorado {
  numeroProcesso: string
  tribunal?: string
  apelido?: string           // ex: "GAV Resorts - João"
  ativo: boolean
  criadoEm: string
  ultimaMovimentacaoVista?: string  // ISO date da última movimentação já notificada
  ultimaChecagem?: string
}

export interface EstadoGlobal {
  processos: ProcessoMonitorado[]
  ultimaExecucaoCron?: string
}

// ------- Adaptador KV (Vercel) --------
async function kvGet<T>(key: string): Promise<T | null> {
  try {
    const { kv } = await import('@vercel/kv')
    return await kv.get<T>(key)
  } catch {
    return null
  }
}

async function kvSet(key: string, value: unknown): Promise<void> {
  try {
    const { kv } = await import('@vercel/kv')
    await kv.set(key, value)
  } catch {
    // silently ignore in dev
  }
}

// ------- Adaptador JSON local (dev) --------
const LOCAL_PATH = path.join(process.cwd(), '.data', 'estado.json')

function localRead(): EstadoGlobal {
  if (!existsSync(LOCAL_PATH)) return { processos: [] }
  return JSON.parse(readFileSync(LOCAL_PATH, 'utf-8')) as EstadoGlobal
}

function localWrite(estado: EstadoGlobal): void {
  mkdirSync(path.dirname(LOCAL_PATH), { recursive: true })
  writeFileSync(LOCAL_PATH, JSON.stringify(estado, null, 2))
}

// ------- API pública --------
const isVercel = process.env.VERCEL === '1'
const KV_KEY = 'monitor-pje:estado'

export async function lerEstado(): Promise<EstadoGlobal> {
  if (isVercel) {
    return (await kvGet<EstadoGlobal>(KV_KEY)) ?? { processos: [] }
  }
  return localRead()
}

export async function salvarEstado(estado: EstadoGlobal): Promise<void> {
  if (isVercel) {
    await kvSet(KV_KEY, estado)
  } else {
    localWrite(estado)
  }
}

export async function listarProcessos(): Promise<ProcessoMonitorado[]> {
  const estado = await lerEstado()
  return estado.processos
}

export async function adicionarProcesso(
  proc: Omit<ProcessoMonitorado, 'criadoEm' | 'ativo'>
): Promise<void> {
  const estado = await lerEstado()
  const jaExiste = estado.processos.some(p => p.numeroProcesso === proc.numeroProcesso)
  if (jaExiste) return

  estado.processos.push({ ...proc, ativo: true, criadoEm: new Date().toISOString() })
  await salvarEstado(estado)
}

export async function removerProcesso(numeroProcesso: string): Promise<void> {
  const estado = await lerEstado()
  estado.processos = estado.processos.filter(p => p.numeroProcesso !== numeroProcesso)
  await salvarEstado(estado)
}

export async function atualizarUltimaMovimentacao(
  numeroProcesso: string,
  dataHoraMovimentacao: string
): Promise<void> {
  const estado = await lerEstado()
  const proc = estado.processos.find(p => p.numeroProcesso === numeroProcesso)
  if (proc) {
    proc.ultimaMovimentacaoVista = dataHoraMovimentacao
    proc.ultimaChecagem = new Date().toISOString()
    await salvarEstado(estado)
  }
}
