---
trigger: always_on
description: Travas da esteira GAV (Di PALLACIO) para qualquer agente do Antigravity neste repositório.
---

# Esteira GAV — regras para o Antigravity

Você está executando tarefas da esteira GAV (distrato de multipropriedade) do
escritório Di PALLACIO, no computador do escritório. A fonte da verdade é a
mesma do Claude Code — leia antes de agir:

- Passo a passo oficial: `.claude/skills/gav-esteira/references/fluxo-video.md`
- Cada tipo de tarefa: `.claude/agents/gav-*.md` (inclusive a seção
  `## Caminhos alternativos` de cada um)
- Ferramentas determinísticas: `ferramentas/README.md` (rode de `ferramentas/`)

## Nunca
- **Pular, modificar ou alucinar.** Todo dado (nome, CPF, venda, cota, %, valor,
  data) vem de documento lido, com a fonte anotada. Não achou: pergunte.
- **Escrever ao cliente no WhatsApp.** Só rascunho; quem envia é o usuário.
- **Enviar o e-mail de distrato à GAV** sem o usuário dizer "pode enviar".
- **Compartilhar a pasta** sem `python -m gav.pasta ... --para compartilhar`
  dar APROVADO e sem o "pode compartilhar".
- **Renomear pasta existente, apagar arquivo, instalar programa** sem "pode".
- **Transplantar assinatura** ou montar procuração com pedaços de outra.
- **Mexer fora de PROCESSOS DISTRATO → CLIENTES** (pastas de processos
  protocolados e clientes antigos não são do organizador).
- **Enviar contrato a site de terceiros** (pdf24 etc.) se `gav.compressao`
  ou o artefato "Contrato para o PJe" estiverem disponíveis.
- Usar `// turbo` ou "Always Proceed" em passo que envia, compartilha,
  renomeia ou apaga.

## Sempre
- Conferir com a ferramenta antes de dizer "pronto":
  - procuração: `python -m gav.procuracao "01 PROCURAÇÃO.pdf" --verificar`
  - pasta: `python -m gav.pasta --dir "<pasta interna>" --para upload|compartilhar`
  - contrato: `python -m gav.compressao ... --dividir-se-nao-couber`
  - RG: `python -m gav.identidade "02 RG.pdf" --contrato "04 CONTRATO.pdf" --de 33 --ate 36`
- Respeitar a ordem do dossiê: `python -m gav.esteira checar --etapa X`.
- Ao terminar, deixar a **prova** (saída das conferências, lista de arquivos com
  tamanho, IDs do Drive, threadId do e-mail) — o orquestrador do Claude confere
  de novo antes de marcar a etapa como `ok`. Relatório sem prova = pendente.
