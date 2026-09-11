---
name: gav-esteira
description: Organizador de pastas de cliente GAV/multipropriedade no Drive, ponta a ponta — localiza o cliente, normaliza a pasta, cria NÃO USAR, limpa a procuração assinada (honorários/percentual/0,5 SM), comprime o contrato para menos de 3 MB, extrai o RG das páginas 33-35, envia a notificação de distrato à GAV e deixa tudo pronto para peticionar. Use quando o usuário disser "organiza a pasta do [cliente]", "prepara o [cliente] para peticionar", "limpa a procuração de", "roda a esteira", ou citar um cliente da pasta PROCESSOS DISTRATO.
---

# Esteira GAV — organizador de pastas de cliente

Oito etapas, em ordem, com trava entre elas. A esteira existe porque o processo
manual pulava etapa: a procuração da cliente 193 foi para os autos com os 21% e
o meio salário mínimo ainda visíveis — o arquivo "01 - PROCURAÇÃO" era cópia
renomeada do original, não uma versão limpa. Cada trava aqui corresponde a um
erro que já aconteceu.

## As três regras

**Não pule.** Cada etapa declara de quais depende. O `dossie.json` guarda o
estado; `python3 -m gav.esteira status` mostra o que falta. Etapa só fica `ok`
com evidência anexada — sem evidência a ferramenta recusa a marcação.

**Não invente.** Todo campo do dossiê carrega a fonte (arquivo, página, trecho).
Não existe dado "de cabeça": nome, CPF, venda, empreendimento, percentual e
valor saem de documento lido ou de resposta explícita do usuário. Faltou dado,
**pergunte** — não deduza do nome da pasta, não complete com o cliente anterior.

**Não altere o que é prova.** O original assinado nunca é sobrescrito: vai para
`NÃO USAR` antes de qualquer edição. Contrato não perde página. Procuração não
perde outorgante, CPF, poderes, data nem assinatura. As ferramentas conferem
isso sozinhas e reprovam o arquivo em vez de entregar algo quebrado.

## Antes de começar

```bash
cd ferramentas && pip install -r requirements.txt   # PyMuPDF
```

Pergunte ao usuário **qual cliente** se ele não disse. Nunca escolha um.

## Etapa 1 — Localizar o cliente no Drive

A pasta-mãe dos processos é `1ws13n0Jc5c2iX_0TSEMLun2xn08EUemD`. Busque:

```
mcp__Google_Drive__search_files
  query: parentId = '1ws13n0Jc5c2iX_0TSEMLun2xn08EUemD' and title contains 'SOBRENOME'
```

- **Nenhum resultado** → busque sem o `parentId` (a pasta pode estar fora).
  Continuou vazio: pergunte. Não crie pasta nova presumindo cliente novo.
- **Mais de um resultado** → mostre os candidatos e **pergunte qual**. Há números
  repetidos no Drive (três pastas "83.", duas "02.") — escolher sozinho erra.

Grave `cliente_nome`, `pasta_id`, `pasta_nome` com fonte `drive:<fileId>`.

## Etapa 2 — Normalizar o nome e criar a subpasta

```bash
python3 -m gav.nomes "83. JANICE BRUTTI - 01 COTA R$ 29.883,63 - 0003701-68.2026.8.17.2730"
```

Devolve o nome canônico externo (com processo) e o interno (sem). Veja
`references/drive.md` para o padrão.

**Mostre a proposta de renome ao usuário e espere o "pode"** antes de aplicar.
Renomear quebra link salvo e atalho — não é reversível de graça.

Estrutura a produzir:

```
NN. [EMPREENDIMENTO -] NOME - XX COTAS - PP% - R$ VALOR - Nº PROCESSO/   ← externa
├── NN. [EMPREENDIMENTO -] NOME - XX COTAS - PP% - R$ VALOR/             ← peticionar
└── NÃO USAR/                                                            ← originais
```

A subpasta interna já existe com outro nome? Renomeie. Não crie uma segunda.

## Etapa 3 — Pasta NÃO USAR

Já existe em variantes (`Não usar `, `NAO USAR`). `gav.nomes.e_pasta_nao_usar()`
reconhece todas. Reaproveite a que existir; crie só se não houver nenhuma.

Para lá vão, **por cópia antes de qualquer edição**: a procuração assinada
original (`Procuracao_Interativa_*_assinado.pdf`), extratos crus (`extrato-N.pdf`)
e o contrato original grande.

## Etapa 4 — Limpar a procuração

O que sai e o que fica está em `references/procuracao.md`. Sempre confira antes:

```bash
python3 -m gav.procuracao "NÃO USAR/Procuracao_..._assinado.pdf" /dev/null --conferir
```

Leia a lista. Ela deve conter o destaque do percentual, a base de cálculo, o
meio salário mínimo e as declarações I e II — e **nada além disso**. Se aparecer
linha dos PODERES CONFERIDOS ou a assinatura, pare e avise: o padrão pegou
demais.

```bash
python3 -m gav.procuracao "NÃO USAR/Procuracao_..._assinado.pdf" \
  "PASTA_INTERNA/01 - PROCURAÇÃO - PRIMEIRONOME.pdf" \
  --manifesto "NÃO USAR/manifesto-procuracao.json"
```

A ferramenta reabre o arquivo gerado e prova que ficou limpo. Se imprimir
`REPROVADO`, **não suba o arquivo** — resolva ou avise o usuário.

## Etapa 5 — Comprimir o contrato

Alvo: menos de 3 MB (o limite prático é 4 MB por arquivo no PJe).

```bash
python3 -m gav.compressao "NÃO USAR/contrato-original.pdf" \
  "PASTA_INTERNA/04.1 - CONTRATO.pdf" --alvo-mb 3 --dividir-se-nao-couber \
  --manifesto "NÃO USAR/manifesto-contrato.json"
```

Busca o degrau mais leve que couber, em vez de aplicar uma taxa fixa. Se nem o
máximo couber, divide em `04.1 - CONTRATO PARTE 1-3.pdf` etc., como já se faz.
Confere página e texto: reprova se perder qualquer um.

## Etapa 6 — Extrair o documento de identificação

O RG fica por volta da página 33, às vezes 34 ou 35. Entra escaneado — o texto
está nos pixels, então a ferramenta roda OCR.

```bash
python3 -m gav.identidade "PASTA_INTERNA/03 - DOC - IDENTIFICAÇÃO - NOME.pdf" \
  --contrato "PASTA_INTERNA/04.1 - CONTRATO PARTE 1-3.pdf" \
  --contrato "PASTA_INTERNA/04.1 - CONTRATO PARTE 2-3.pdf" \
  --contrato "PASTA_INTERNA/04.1 - CONTRATO PARTE 3-3.pdf" \
  --manifesto "NÃO USAR/manifesto-rg.json"
```

**Contrato dividido: passe todas as partes, na ordem.** A numeração é contínua —
a página 33 do contrato costuma cair no meio da PARTE 2 ou 3.

Deu empate ou pontuação baixa, a ferramenta **recusa**. Aí:

```bash
python3 -m gav.identidade x.pdf --contrato ... --renderizar /tmp/paginas
```

Abra os PNG com a ferramenta Read, **olhe** qual é o documento e repita com
`--pagina N`. Nunca chute a página.

## Etapa 7 — Notificação de distrato à GAV

Modelos, destinatários e campos obrigatórios em `references/email-gav.md`.

Vai para `contato@gavresorts.com.br`. **Sem anexar a petição** — a notificação é
extrajudicial e antecede o processo; anexar inicial entrega a estratégia.

Todo campo do corpo (nome, CPF, empreendimento, venda, bloco, apartamento, cota)
sai do dossiê, com fonte. Falta algum: pergunte. Não escreva "Venda 00000".

**Crie como rascunho e mostre ao usuário antes de enviar.** E-mail para a parte
contrária não se desfaz.

Depois de enviado, salve o PDF do e-mail como `08 - NOTIFICAÇÃO EXTRAJUDICIAL -
NOME.pdf` na pasta interna.

## Etapa 8 — Petição

Use a skill `gav-peticao`. Ela depende das etapas 4, 6 e 7 concluídas.

## Ao terminar

```bash
python3 -m gav.esteira status --dossie "caminho/dossie.json"
```

Relate ao usuário: o que ficou pronto, o que falta, e **o que você não fez e por
quê**. Etapa pulada que passa em silêncio é o defeito que esta esteira existe
para corrigir.

## Quando travar

Consulte `references/problemas.md`. A regra geral: **pare e pergunte**. Uma
pergunta custa um minuto; uma procuração com honorários nos autos, ou o RG de
outro cliente na pasta, custa muito mais.
