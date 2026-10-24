import { NextResponse } from 'next/server'

export function json(corpo: unknown, status = 200) {
  return NextResponse.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function erro(mensagem: string, status: number, extra: Record<string, unknown> = {}) {
  return json({ error: mensagem, ...extra }, status)
}
