import { NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { limitarTaxa, identificarCliente } from '@/lib/rateLimit'

// Upload direto do cliente para o Blob (contorna o limite de payload das
// funções serverless da Vercel) — usado apenas para o contrato em PDF
// opcional do formulário de distrato. Exige a variável BLOB_READ_WRITE_TOKEN
// (criada automaticamente ao habilitar Vercel Blob Storage no projeto).
export async function POST(request: Request): Promise<NextResponse> {
  const cliente = identificarCliente(request)
  if (!limitarTaxa(`upload:${cliente}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em instantes.' }, { status: 429 })
  }

  try {
    const body = (await request.json()) as HandleUploadBody

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['application/pdf'],
        maximumSizeInBytes: 10 * 1024 * 1024,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // Nenhuma ação adicional necessária: a URL do blob já é capturada
        // pelo cliente ao final do upload e enviada junto com o Lead.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 })
  }
}
