---
name: gav-peticao
description: Monta a petição inicial de distrato de multipropriedade GAV a partir do dossiê do cliente, usando o artefato PREENCHEDOR DE PETIÇÃO INTERATIVO. Escolhe a variante conforme o caso — advogado constituído, justiça gratuita ou só o pedido de suspensão/parcelamento. Use quando o usuário disser "faz a petição do [cliente]", "monta a inicial", "peticionador", "preenchedor de petição", ou pedir a inicial depois de organizar a pasta.
---

# Petição inicial — distrato GAV

Fecha a esteira: pega o dossiê montado pela `gav-esteira` e produz a inicial.

## Pré-requisitos — não contorne

A petição depende de três etapas concluídas:

```bash
python3 -m gav.esteira checar --dossie d.json --etapa peticao
```

- **procuração limpa** (etapa 4) — instrui a inicial;
- **documento de identificação** (etapa 6) — qualificação;
- **notificação à GAV** (etapa 7) — prova da tentativa extrajudicial, que
  sustenta o interesse de agir e a mora.

Bloqueou? Volte e conclua. Peticionar sem a notificação enfraquece o pedido;
peticionar com a procuração suja entrega o percentual de honorários à parte
contrária.

## Passo 1 — Qual variante

**Pergunte ao usuário**, com `AskUserQuestion`, se ele não disse. As três que ele
usa:

| Variante | Quando |
|---|---|
| **Advogado constituído** | padrão — cliente paga custas |
| **Justiça gratuita** | cliente hipossuficiente; exige `06. CARTEIRA DE TRABALHO` e declaração de hipossuficiência na pasta |
| **Só parcelamento** | pedido restrito à suspensão/revisão das parcelas, sem rescisão total |

Não escolha por dedução. "Tem carteira de trabalho na pasta" não significa que
o pedido é de gratuidade. E a terceira variante muda o **pedido**, não só a
redação: confirme com o usuário o que exatamente se está pedindo antes de
redigir.

## Passo 2 — Abrir o preenchedor

Há dois artefatos com papéis diferentes — não confunda um pelo outro:

- **🤖 2 PREENCHEDOR DE ⚖️PETIÇÃO INTERATIVO** — o `.jsx` original do usuário
  (3 abas: Petição Inicial / Parcelamento Avulso / Réplica). **Chama a API da
  Anthropic direto do navegador com uma chave embutida no código** — exposta a
  quem abrir o arquivo ou inspecionar a rede. Se for reabrir ou editar esse
  artefato, avise sobre isso antes de redistribuir e recomende rotacionar a
  chave. Não é deste repositório: `Artifact action: "list" scope: "all"` para
  achar a URL, ou peça ao usuário.

- **[Central de Comandos GAV](https://claude.ai/code/artifact/af6ab875-3839-4bbb-ac3c-c41c8ee139a3)** — front-end desta esteira
  (`ferramentas/artefato/central-comandos-gav.html`). Extrai os campos do
  extrato por regex (sem API, sem chave), gera os 10 trechos verbatim da Parte 3
  da skill `preenchedor-peticoes-gav` para o caso simples (Petição Inicial /
  + Justiça Gratuita), e para Parcelamento Avulso / Réplica / coligação / tese
  agravante compõe o comando certo para o chat em vez de inventar estrutura que
  não está documentada nela. Use-a primeiro — é mais rápida para o caso comum e
  não tem o problema de segurança do `.jsx`.

Para republicar a Central de Comandos depois de editar o arquivo, publique com
a URL acima como `url` — sem ela cria um artefato novo e separado.

## Passo 3 — Preencher a partir do dossiê

Todo campo sai do `dossie.json`, com fonte. Ordem de confiança:

1. **Documento lido** — procuração, extrato da cota, contrato;
2. **Resposta do usuário** no chat;
3. **Nada.** Não existe terceiro nível.

```bash
python3 -m gav.esteira status --dossie d.json
```

mostra cada campo e de onde veio. Campo ausente → pergunte. Nunca:

- deduza o empreendimento pelo nome da pasta;
- reaproveite bloco/apartamento/cota do cliente anterior;
- arredonde valor ou "corrija" CPF que pareça errado;
- invente data de celebração a partir do número da venda.

Extrato colado no chat em vez de dossiê? A skill **`preenchedor-peticoes-gav`**
já converte extrato GAV em campos da inicial — use-a para essa parte e traga o
resultado de volta para cá, registrando a fonte como `usuario:extrato-colado`.

## Passo 4 — Conferir antes de fechar

Antes de dar a inicial por pronta:

- [ ] nome e CPF batem com a **procuração**, não com o nome da pasta;
- [ ] empreendimento, venda, bloco, apartamento e cota batem com o **extrato**;
- [ ] valores conferem com o contrato e com o `lib/calculadora` do projeto,
      quando houver cálculo;
- [ ] a variante escolhida é a que o usuário pediu;
- [ ] justiça gratuita: a declaração de hipossuficiência e a carteira de
      trabalho estão **na pasta**, não só mencionadas;
- [ ] a notificação à GAV (`08 - NOTIFICAÇÃO EXTRAJUDICIAL`) está na pasta;
- [ ] **a procuração anexada é a limpa** (`01 - PROCURAÇÃO`), não o original da
      `NÃO USAR`.

O último item é o erro que já aconteceu. Confira o arquivo, não o nome dele:

```bash
python3 -m gav.procuracao "01 - PROCURAÇÃO - NOME.pdf" /dev/null --conferir
```

Se **achar** cláusula de honorários, esse arquivo é o original — a etapa 4 não
rodou ou o arquivo errado foi copiado. Pare e resolva antes de peticionar.

## Passo 5 — Salvar e registrar

Salve como `Petição Inicial — {INICIAIS}.pdf` na pasta interna e registre:

```bash
python3 -m gav.esteira marcar --dossie d.json --etapa peticao --status ok \
  --evidencia arquivo="Petição Inicial — J. B.pdf" \
  --evidencia variante="justiça gratuita"
```

## O que esta skill não faz

Não decide tese, não estima chance de êxito e não escolhe a variante pelo
usuário. Monta a peça com os dados conferidos e aponta o que falta. O juízo é
de quem assina.
