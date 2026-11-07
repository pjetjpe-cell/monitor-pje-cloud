# Padrão de organização de sessões

Regras para nomear, renomear e organizar as sessões do Claude Code deste projeto.

## 1. Formato do título

`{status} {ícone da área} [Área] Tipo: assunto`

- **Status:** use ✅ somente quando a conversa terminar. Em andamento, não use ícone.
- **Ícone da área:** obrigatório.
- **Tipo:** escrito em texto, não como ícone.

Exemplos:

- `⚖️ [PJe] Feat: status por tribunal`
- `🏖️ [GAV] Esteira: organizar pasta do cliente 193`
- `✅ 🧠 [Anki] Doc: revisão do baralho de Direito Civil`

## 2. Ícones por área

| Área | Ícone |
|---|---|
| PJe / processos | ⚖️ |
| GAV / multipropriedade | 🏖️ |
| Petições | 📄 |
| Anki / estudos | 🧠 |
| Honorários | 💰 |
| Monitor / sistema | 📊 |
| Infra / config | ⚙️ |
| Geral / outros | 🗂️ |

Use um ícone por área e não mude os ícones depois, para que a lista seja fácil de escanear.

## 3. Tipos

- **Feat:** nova funcionalidade
- **Fix:** correção
- **Doc:** documentação
- **Petição:** peça processual
- **Pesquisa:** levantamento de informações
- **Dúvida:** pergunta pontual

## 4. Quando nomear

- Na primeira mensagem de tarefa real. Se a primeira mensagem for só uma saudação, nomeie depois da primeira tarefa.
- Não deixe a conversa sem nome por mais de uma tarefa.

## 5. Quando renomear

Renomeie somente nestes casos:

1. **O escopo mudou.** Exemplo: de "status por tribunal" para "status + alertas".
2. **A conversa terminou.** Acrescente ✅ no início e, se couber, o resultado no título.
3. **Surgiu outro assunto.** Não renomeie: abra uma conversa nova.

Não renomeie a cada mensagem, para não perder a referência na lista.

## 6. Tags

- **Status:** `em-andamento`, `aguardando`, `concluido`
- **Área:** o mesmo nome usado no título (`PJe`, `GAV`, `Anki`, `Honorários`, `Monitor`, `Infra`, `Geral`)

Ao concluir, troque `em-andamento` por `concluido`.

## 7. Organização da lista

- Mantenha até 10 conversas ativas.
- Ao concluir uma conversa, arquive-a.
- Se o app oferecer fixar, fixe no máximo 3 conversas recorrentes.
- Quando a lista crescer, filtre por área.

## 8. Uma conversa por tarefa

Quando o assunto muda, abra outra conversa. Conversas longas misturam contexto e ficam mais caras e confusas.

## 9. Resumo ao encerrar

Na última mensagem, escreva três linhas:

1. O que foi feito.
2. O que falta.
3. Onde está o resultado (branch, arquivo ou link).

## 10. Dados sensíveis

Não coloque nome completo, CPF ou número de processo no título. Use o número do cliente, como já é feito no repositório.

## 11. Instruções fixas

Regras que valem para todas as conversas ficam no `CLAUDE.md`, e não repetidas em cada conversa.
