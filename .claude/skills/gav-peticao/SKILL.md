---
name: gav-peticao
description: Monta petições GAV (inicial, inicial cota quitada, réplica, petições avulsas, cumprimento de sentença) pelo Peticionador GAV v4 / PREENCHEDOR DE PETIÇÃO INTERATIVO, a partir do dossiê e dos documentos da pasta do cliente. Custas: sempre pedido de parcelamento, nunca justiça gratuita (ordem do usuário, 23/11/2026). Use quando o usuário disser "faz a petição do [cliente]", "monta a inicial", "peticionador", "preenchedor de petição", ou pedir a inicial depois de organizar a pasta.
---

# Petição inicial — distrato GAV

Fecha a esteira: pega o dossiê montado pela `gav-esteira` e produz a inicial.

## Padrão desde 19/11/2026 — Peticionador GAV v5.1 (pedido do usuário)

A inicial **sempre** sai do Peticionador GAV v5.1, que tem a estrutura de
formatação dos advogados, o timbre e o layout do escritório. Não gere a peça
por molde próprio quando o peticionador estiver disponível.

- Arquivo: `peticionador_GAV_v51.html` no Google Drive da conta do conector
  (privado — **nunca** no repositório, que é público).
- Na nuvem/sem tela: `ferramentas/peticionador/gerar.mjs` abre o HTML num
  Chromium headless, roda a "Extração local" sobre o texto do `03 EXTRATO`,
  preenche tipo, nº de parcelas, advogado, data, gênero, 2º autor e a
  qualificação (do contrato), e imprime como o botão **Imprimir / Salvar PDF
  (layout de impressão)** — sem os realces amarelos de edição.
  `node ferramentas/peticionador/gerar.mjs <peticionador.html> <caso.json> "<Petição Inicial — NOME.pdf>"`
  (formato do `caso.json` no cabeçalho do script; o `caso.json` fica fora do repositório).
- O trecho "por intermédio de seu procurador infra-assinado ... vem" é fixo no
  modelo: o script ajusta a concordância (advogada → "sua procuradora
  infra-assinada"; dois autores → "vêm"). Diga isso ao usuário.
- **Custas: SEMPRE pedido de parcelamento (`tipo: "parcelamento"`), JAMAIS
  justiça gratuita** — ordem expressa do usuário em 23/11/2026, para todos os
  clientes. Não pergunte; o `gerar.mjs` recusa `tipo: "gratuita"`. Confira no
  PDF que a peça não traz a seção "Da justiça gratuita" nem o pedido de
  gratuidade (nem como pedido principal com parcelamento subsidiário).
- Conferência do PDF continua obrigatória (lista abaixo).

## Caminho anterior — Peticionador GAV v4 (vídeo 6, 30/10/2026)

claude.ai → projeto **PROCESSOS MULTIPROPRIEDADE** → conversa **"2 PREENCHEDOR
DE PETIÇÃO INTERATIVA"** → artefato **"Peticionador gav v4"**. Abas: Petição
Inicial · Réplica à Contestação · Petições Avulsas · Cumprimento de Sentença ·
**Inicial Cota Quitada** · Réplica Cota Quitada — escolha a aba pelo caso
(cota quitada tem aba própria).

1. **Preencher com IA** → anexar `03 EXTRATO DE PAGAMENTOS` (e contrato/procuração
   se a aba pedir). Ou "Extração local (offline, por regras)".
2. Conferir cada campo com o documento: tipo de petição (ex.: Parcelamento de
   Custas, nº de parcelas), gênero do(a) autor(a), 2º autor(a), advogado
   (padrão **Gilzielle Veloso Pontes**), data da petição, empreendimento(s),
   fundamentos especiais (Bloco 6 inoperante, casos análogos, grupo econômico...),
   preliminares (valor da causa, papel branco, eleição de foro), **preço total
   contratado** e **total pago = valor da causa** (RECEBIDO do extrato).
3. **Baixar HTML (standalone)** → abrir no Chrome → Imprimir → Salvar como PDF →
   **`Petição Inicial — NOME COMPLETO.pdf`** na pasta interna.

**Conferência antes de aceitar** (o agente lê o PDF; não confia na tela):
- nome e CPF iguais aos do contrato — no vídeo o arquivo saiu "VALTER UCINO"
  para VALTEMIR URCINO;
- data com dia, **mês** e ano — saiu "Ipojuca, 30 de 2026";
- valor da causa = RECEBIDO do `03 EXTRATO`; preço contratado = contrato;
- nenhum `[___]`/`⚡` sobrando, exceto o número da vara ("AO JUÍZO DA ___ VARA");
- réu/CNPJ do empreendimento certo (Porto 2 Life: GAV MURO ALTO 2, 39.673.888/0001-69).

Se o Peticionador não estiver acessível (outra sessão, sem login), use o
fluxo abaixo com o PREENCHEDOR e a skill `preenchedor-peticoes-gav`, ou gere a
peça no chat — sempre com a mesma conferência.

## Pré-requisitos — não contorne

A petição depende de duas etapas concluídas (a notificação à GAV pode vir
depois, mas a pasta **não é compartilhada** sem ela — etapa `compartilhar`):

```bash
python3 -m gav.esteira checar --dossie d.json --etapa peticao
```

- **procuração limpa** (etapa 4) — instrui a inicial;
- **documento de identificação** (etapa 6) — qualificação;
- a **notificação à GAV** não trava a geração da petição, mas a peça cita a
  tentativa extrajudicial: confirme que o e-mail foi (ou será) enviado antes de
  protocolar.

Bloqueou? Volte e conclua. Peticionar com a procuração suja entrega o
percentual de honorários à parte contrária.

## Passo 1 — Qual variante

**Pergunte ao usuário**, com `AskUserQuestion`, se ele não disse. As três que ele
usa:

| Variante | Quando |
|---|---|
| **Advogado constituído** | cliente paga custas |
| ~~Justiça gratuita~~ | **proibida desde 23/11/2026** (ordem do usuário): use sempre o pedido de parcelamento |
| **Só parcelamento** | **padrão** — pedido restrito à suspensão/revisão das parcelas, sem rescisão total. ⚡ Não há template verificado nas referências: monte pelo chat, não pelo artefato |

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
- [ ] custas: pedido de **parcelamento**; nenhuma menção a justiça gratuita;
- [ ] a notificação à GAV (`08 - NOTIFICAÇÃO EXTRAJUDICIAL`) está na pasta;
- [ ] **a procuração anexada é a limpa** (`01 - PROCURAÇÃO`), não o original da
      `NÃO USAR`.

O último item é o erro que já aconteceu. Confira o arquivo, não o nome dele:

```bash
python3 -m gav.procuracao "01 PROCURAÇÃO.pdf" --verificar
```

Se **achar** cláusula de honorários, esse arquivo é o original — a etapa 4 não
rodou ou o arquivo errado foi copiado. Pare e resolva antes de peticionar.

## Passo 5 — Salvar e registrar

Salve como `Petição Inicial — {INICIAIS}.pdf` na pasta interna e registre:

```bash
python3 -m gav.esteira marcar --dossie d.json --etapa peticao --status ok \
  --evidencia arquivo="Petição Inicial — J. B.pdf" \
  --evidencia variante="parcelamento de custas"
```

## O que esta skill não faz

Não decide tese, não estima chance de êxito e não escolhe a variante pelo
usuário. Monta a peça com os dados conferidos e aponta o que falta. O juízo é
de quem assina.
