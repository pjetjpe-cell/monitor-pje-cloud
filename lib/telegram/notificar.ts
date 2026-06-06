// Envio de alertas via Telegram Bot API
// Sem dependências externas — usa fetch nativo

const TELEGRAM_API = 'https://api.telegram.org'

export async function enviarAlerta(mensagem: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não configurados')
    return false
  }

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: mensagem,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })

  if (!res.ok) {
    console.error('Telegram erro:', await res.text())
    return false
  }

  return true
}

export function formatarMensagemMovimentacao(
  numeroProcesso: string,
  descricao: string,
  dataHora: string,
  orgao?: string
): string {
  const data = new Date(dataHora).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return [
    '⚖️ <b>Nova movimentação no PJe</b>',
    '',
    `📋 <b>Processo:</b> <code>${numeroProcesso}</code>`,
    orgao ? `🏛️ <b>Órgão:</b> ${orgao}` : '',
    `📅 <b>Data:</b> ${data}`,
    `📝 <b>Movimento:</b> ${descricao}`,
    '',
    '<i>Monitor PJe Cloud</i>',
  ].filter(Boolean).join('\n')
}
