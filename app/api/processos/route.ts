// CRUD de processos monitorados

import { NextRequest, NextResponse } from 'next/server'
import { listarProcessos, adicionarProcesso, removerProcesso } from '@/lib/storage/kv'
import { consultarProcesso } from '@/lib/datajud/client'

export async function GET() {
  const processos = await listarProcessos()
  return NextResponse.json(processos)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    numeroProcesso: string
    tribunal?: string
    apelido?: string
  }

  const { numeroProcesso, tribunal, apelido } = body

  if (!numeroProcesso) {
    return NextResponse.json({ error: 'numeroProcesso obrigatório' }, { status: 400 })
  }

  // Valida se o processo existe no DataJud antes de cadastrar
  try {
    const dados = await consultarProcesso(numeroProcesso, tribunal)
    if (!dados) {
      return NextResponse.json(
        { error: 'Processo não encontrado no DataJud/CNJ' },
        { status: 404 }
      )
    }

    await adicionarProcesso({
      numeroProcesso: dados.numeroProcesso,
      tribunal: dados.tribunal ?? tribunal,
      apelido,
      ultimaMovimentacaoVista: dados.ultimaMovimentacao?.dataHora,
    })

    return NextResponse.json({
      ok: true,
      processo: {
        numeroProcesso: dados.numeroProcesso,
        tribunal: dados.tribunal,
        classe: dados.classe?.nome,
        orgao: dados.orgaoJulgador?.nome,
        ultimaMovimentacao: dados.ultimaMovimentacao?.dataHora,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const numeroProcesso = searchParams.get('numeroProcesso')

  if (!numeroProcesso) {
    return NextResponse.json({ error: 'numeroProcesso obrigatório' }, { status: 400 })
  }

  await removerProcesso(numeroProcesso)
  return NextResponse.json({ ok: true })
}
