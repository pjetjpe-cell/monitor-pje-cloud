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

## Modelo A — curto (alternativo)

Registra a intenção de distrato e pede suspensão de cobranças, sem fundamentar.
Use quando o usuário pedir a versão curta, ou para reiterar um pedido já
fundamentado antes.

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

## Modelo B — completo (art. 473 do Código Civil) — **PADRÃO**

É o modelo a usar por omissão. Fundamenta a resilição, afasta retenção abusiva
e já pede a restituição — posição mais forte que o simples registro de intenção.
Só use o Modelo A se o usuário pedir a versão curta.

**Assunto:**
```
NOTIFICAÇÃO EXTRAJUDICIAL – RESILIÇÃO CONTRATUAL (DISTRATO) – {NOME} – VENDA {Nº}
```

**Corpo:**
```
Prezados Senhores,

Na qualidade de procurador{a} d{o|a} Sr{.|a}. {NOME COMPLETO}, inscrit{o|a} no
CPF nº {CPF}, venho, por meio deste, formalizar a presente NOTIFICAÇÃO
EXTRAJUDICIAL DE RESILIÇÃO CONTRATUAL (DISTRATO).

{O|A} Notificante firmou Promessa de Compra e Venda destinada à aquisição de
cota de multipropriedade junto ao empreendimento {EMPREENDIMENTO}, referente à
Venda nº {VENDA}, celebrada em {DATA DE CELEBRAÇÃO}, identificada como
{BLOCO/UNIDADE}, constando no demonstrativo contratual o Contrato nº {Nº}.

O valor originalmente contratado corresponde a R$ {VALOR}, tendo {o|a}
consumidor{a} realizado pagamentos ao longo da relação contratual. Contudo, não
possui mais interesse na manutenção do contrato, em razão de superveniente
inviabilidade financeira, que tornou excessivamente onerosa e insustentável a
continuidade da avença.

Além disso, eventual cláusula penal ou retenção contratual deverá observar os
limites legais e jurisprudenciais aplicáveis, afastando-se retenções excessivas
ou desproporcionais.

Diante desse cenário, {o|a} Notificante manifesta expressamente sua intenção de
promover a rescisão contratual, com restituição substancial dos valores pagos,
em percentual a ser apurado entre 80% e 90%, conforme aplicável ao caso.

Assim, com fundamento no art. 473 do Código Civil, a presente serve para
NOTIFICÁ-LOS FORMALMENTE DA RESILIÇÃO UNILATERAL DO CONTRATO, requerendo que a
Notificada:

1. cesse imediatamente a cobrança de quaisquer parcelas vencidas e vincendas,
suspendendo também a emissão de novos boletos;

2. abstenha-se de promover qualquer inscrição do nome d{o|a} Notificante nos
órgãos de proteção ao crédito, especialmente SPC e SERASA;

3. assuma, a partir desta notificação, as despesas vinculadas ao imóvel,
inclusive taxas condominiais, IPTU e demais encargos correlatos;

4. proceda à formalização administrativa do distrato, apresentando de maneira
clara as condições e o cálculo para restituição dos valores pagos;

5. proceda à liberação da cota para imediata comercialização, evitando a
continuidade de encargos desnecessários;

6. providencie a desfiliação d{o|a} Notificante de eventual clube, programa,
associação ou serviço vinculado ao contrato.

Solicita-se, ainda, confirmação expressa do recebimento desta notificação e
identificação do respectivo protocolo administrativo, para fins de comprovação
da ciência inequívoca da empresa.

Eventuais propostas, tratativas ou comunicações relativas ao presente distrato
deverão ser encaminhadas exclusivamente à patrona constituída.

Atenciosamente,

GILZIELLE VELOSO PONTES
OAB/PE 55.134
GRUPO DI PALLACIO ENTERPRISE
```

**Concordância.** Marcas como `{o|a}` e `procurador{a}` precisam casar com o
gênero d{o|a} cliente. Não deixe `{}` no texto enviado, e não presuma gênero
pelo nome — confirme pela procuração ou pergunte.

**Campos que o Modelo B exige e o A não:** data de celebração, bloco/unidade,
nº do contrato no demonstrativo e valor contratado. Todos saem do contrato ou
do extrato. Faltando qualquer um, ou você busca no documento, ou pergunta —
nunca envie com lacuna nem com valor aproximado.

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

1. Monte o corpo com os campos do dossiê, usando o **Modelo B** salvo pedido
   em contrário.
2. `mcp__Gmail__create_draft` — **rascunho primeiro**.
3. Mostre ao usuário: destinatário, assunto e corpo.
4. Só com o "pode enviar", chame `mcp__Gmail__send_message` com o `draftId`.
5. Salve o PDF do e-mail enviado como `08 - NOTIFICAÇÃO EXTRAJUDICIAL - {NOME}.pdf`
   na pasta interna.
6. Registre a etapa com o `threadId` como evidência.

E-mail para a parte contrária não se desfaz. O rascunho é a última chance de
pegar um CPF trocado.
