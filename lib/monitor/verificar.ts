// Lógica central de monitoramento
// Chamada pelo cron job — verifica todos os processos e envia alertas

import { consultarProcesso } from '@/lib/datajud/client'
import { enviarAlerta, formatarMensagemMovimentacao } from '@/lib/telegram/notificar'
import {
  listarProcessos,
  atualizarUltimaMovimentacao,
  lerEstado,
  salvarEstado,
} from '@/lib/storage/kv'

export interface ResultadoVerificacao {
  numeroProcesso: string
  status: 'nova_movimentacao' | 'sem_novidade' | 'erro' | 'inativo'
  mensagem?: string
}

export async function verificarTodosProcessos(): Promise<ResultadoVerificacao[]> {
  const processos = await listarProcessos()
  const resultados: ResultadoVerificacao[] = []

  for (const proc of processos) {
    if (!proc.ativo) {
      resultados.push({ numeroProcesso: proc.numeroProcesso, status: 'inativo' })
      continue
    }

    try {
      const dados = await consultarProcesso(proc.numeroProcesso, proc.tribunal)

      if (!dados || !dados.ultimaMovimentacao) {
        resultados.push({
          numeroProcesso: proc.numeroProcesso,
          status: 'sem_novidade',
          mensagem: 'Processo não encontrado no DataJud',
        })
        continue
      }

      const ultimaDataJud = dados.ultimaMovimentacao.dataHora
      const ultimaVista = proc.ultimaMovimentacaoVista

      // Primeira vez ou movimentação mais recente que a última notificada
      const isNova = !ultimaVista || new Date(ultimaDataJud) > new Date(ultimaVista)

      if (isNova) {
        const descricao =
          dados.ultimaMovimentacao.tipoMovimento?.nome ??
          dados.ultimaMovimentacao.complemento ??
          'Movimentação sem descrição'

        const mensagem = formatarMensagemMovimentacao(
          dados.numeroProcesso,
          descricao,
          ultimaDataJud,
          dados.orgaoJulgador?.nome
        )

        const enviado = await enviarAlerta(mensagem)

        await atualizarUltimaMovimentacao(proc.numeroProcesso, ultimaDataJud)

        resultados.push({
          numeroProcesso: proc.numeroProcesso,
          status: 'nova_movimentacao',
          mensagem: enviado ? 'Alerta enviado' : 'Alerta falhou (Telegram)',
        })
      } else {
        resultados.push({ numeroProcesso: proc.numeroProcesso, status: 'sem_novidade' })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`Erro ao verificar ${proc.numeroProcesso}:`, msg)
      resultados.push({
        numeroProcesso: proc.numeroProcesso,
        status: 'erro',
        mensagem: msg,
      })
    }

    // Pausa entre consultas para não sobrecarregar a API
    await new Promise(r => setTimeout(r, 1000))
  }

  // Registra última execução do cron
  const estado = await lerEstado()
  estado.ultimaExecucaoCron = new Date().toISOString()
  await salvarEstado(estado)

  return resultados
}
