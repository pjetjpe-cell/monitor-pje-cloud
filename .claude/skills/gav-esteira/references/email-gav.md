# Notificação extrajudicial de distrato à GAV

## Destinatários

- **Sempre:** `contato@gavresorts.com.br`
- **Quando houver cotas quitadas ou muitas cotas:** acrescente
  `controladoria@gavresorts.com.br`

Remetente: `dipallacio@gmail.com`. Assinatura conforme quem subscreve.

## Regra: sem anexar a petição

A notificação é extrajudicial e antecede o processo. Anexar a inicial entrega a
tese antes da citação. Anexa-se procuração quando se pede documento; não se
anexa petição.

## Modelo A — curto (padrão atual)

Para o fluxo normal: registrar a intenção de distrato e suspender cobranças.
É o que se usa desde setembro/2026.

**Assunto:**
```
NOTIFICAÇÃO EXTRAJUDICIAL – DISTRATO / SUSPENSÃO DE COBRANÇAS – {NOME} – VENDA {Nº}
```

**Corpo:**
```
Prezados,

Na qualidade de representantes d{o|a} Sr{.|a}. {NOME COMPLETO}, CPF {CPF},
solicitamos o registro da intenção de resolução/distrato do contrato referente
ao empreendimento {EMPREENDIMENTO}, Venda {Nº}, Bloco {BLOCO}, apartamento
{APTO}, cota {COTA}.

Requer-se:

1. a suspensão imediata das cobranças relativas à cota não quitada;
2. a interrupção da emissão de novos boletos;
3. a abstenção de qualquer negativação relacionada ao contrato discutido;
4. a confirmação expressa do recebimento desta comunicação;
5. o encaminhamento do extrato/histórico financeiro atualizado da respectiva cota;
6. quando pertinente, a apresentação dos valores e condições administrativas
propostas para resolução.

Favor confirmar o recebimento desta comunicação.

Atenciosamente,

DI PALLACIO
Dra. Gilzielle Veloso Pontes
OAB/PE 55.134
```

## Modelo B — completo (art. 473 do Código Civil)

Para caso litigioso, cota quitada, valor alto ou quando já houve recusa
administrativa. Acrescenta fundamento legal e o pedido de restituição.

**Assunto:**
```
NOTIFICAÇÃO EXTRAJUDICIAL – RESILIÇÃO CONTRATUAL (DISTRATO) – {NOME} – VENDA {Nº}
```

Estrutura do corpo (o texto integral está no e-mail de 10/09/2026 a
`contato@gavresorts.com.br`, assunto `... – TATIANE FERREIRA RUSSO – VENDA 1469`):

1. Qualificação: nome, CPF, condição de procurador.
2. Contrato: empreendimento, venda, data de celebração, bloco/unidade, nº do
   contrato no demonstrativo.
3. Valor contratado e motivo (inviabilidade financeira superveniente).
4. Limite legal de retenção — afastar cláusula penal desproporcional.
5. Intenção de rescisão com restituição entre 80% e 90%.
6. Os seis requerimentos: cessar cobranças; não negativar; assumir despesas do
   imóvel; formalizar o distrato com memória de cálculo; liberar a cota para
   comercialização; desfiliar de clube/programa vinculado.
7. Pedido de confirmação e protocolo.
8. Tratativas exclusivamente com a patrona constituída.

## Campos obrigatórios — todos do dossiê, com fonte

| Campo | Onde costuma estar |
|---|---|
| Nome completo | procuração (OUTORGANTE) |
| CPF | procuração |
| Empreendimento | extrato da cota / contrato |
| Nº da venda | extrato da cota |
| Bloco, apartamento, cota | extrato da cota |
| Valor contratado | contrato / extrato |
| Data de celebração | contrato |

Falta algum? **Pergunte.** Não escreva `Venda 00000`, não deduza o
empreendimento pelo nome da pasta, não reaproveite o dado do cliente anterior.

## Procedimento

1. Monte o corpo com os campos do dossiê.
2. `mcp__Gmail__create_draft` — **rascunho primeiro**.
3. Mostre ao usuário: destinatário, assunto e corpo.
4. Só com o "pode enviar", chame `mcp__Gmail__send_message` com o `draftId`.
5. Salve o PDF do e-mail enviado como `08 - NOTIFICAÇÃO EXTRAJUDICIAL - {NOME}.pdf`
   na pasta interna.
6. Registre a etapa com o `threadId` como evidência.

E-mail para a parte contrária não se desfaz. O rascunho é a última chance de
pegar um CPF trocado.
