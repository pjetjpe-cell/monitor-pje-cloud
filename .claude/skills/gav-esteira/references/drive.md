# Estrutura no Google Drive

## Pasta-mãe

`1ws13n0Jc5c2iX_0TSEMLun2xn08EUemD` — contém as pastas numeradas de cliente.
Existe também `PROCESSOS DISTRATO` (`1bCzt8Qi0TDWbTtwQIVN7kHDWrh6lfw68`) e uma
`PENDENCIAS`.

## Padrão do nome

```
NN. [EMPREENDIMENTO -] NOME - XX COTA(S) - PP% - R$ VALOR [- Nº PROCESSO]
```

Nomes reais, com as variações que existem hoje:

| Nome no Drive | Observação |
|---|---|
| `92. KAREN CARDOSO VENTURATO - 01 COTA - 18% - R$ 17.418,84` | forma canônica |
| `91. ARIEL ANTEBI - 06 COTAS - JERIQUIÁ LAGOA - 18% - R$ 152.652,45` | empreendimento fora de ordem |
| `83. JANICE BRUTTI - 01 COTA R$ 29.883,63 - 0003701-68.2026.8.17.2730` | sem hífen antes do R$, sem % |
| `79. PORTO 2 LIFE - LUIZ PAULO 30% R$ 29.316,28 1 COTA - 0003460-94...` | ordem embaralhada |
| `10. PITANGUI - FILLIPE E PAULA - 02 COTAS - 20% - R$ 66.415,56` | dois titulares |

`gav.nomes.analisar()` lê todas por extração de padrão, não por posição. Campo
ausente vira `None` e entra em `observacoes` — nunca é preenchido por palpite.

**Números repetidos existem.** Três pastas começam com `83.` (JANICE, MIRIAN,
DANILO) e duas com `02.`. Buscar por número acha a pasta errada; busque por nome
e, se voltar mais de uma, pergunte.

## Árvore de cada cliente

```
83. JANICE BRUTTI - 01 COTA - R$ 29.883,63 - 0003701-68.2026.8.17.2730/
├── 83. JANICE BRUTTI - 01 COTA - R$ 29.883,63/      ← peticionar
│   ├── 01 - PROCURAÇÃO - JANICE.pdf                  ← LIMPA
│   ├── 02 EXTRATO DE COTA.pdf
│   ├── 03 - DOC - IDENTIFICAÇÃO - JANICE.pdf         ← RG das pp. 33-35
│   ├── 04.1 - CONTRATO PARTE 1-3.pdf                 ← cada parte < 3 MB
│   ├── 04.1 - CONTRATO PARTE 2-3.pdf
│   ├── 04.1 - CONTRATO PARTE 3-3.pdf
│   ├── 06. CARTEIRA DE TRABALHO.pdf                  ← justiça gratuita
│   ├── 07 - COMPROVANTE DE RESIDÊNCIA.pdf
│   ├── 08 - NOTIFICAÇÃO EXTRAJUDICIAL - JANICE.pdf   ← PDF do e-mail à GAV
│   └── Petição Inicial — J. B.pdf
└── NÃO USAR/                                         ← originais, fora dos autos
    ├── Procuracao_Interativa_JANICE_BRUTTI_Cliente_193_2026_assinado.pdf
    ├── extrato-5.pdf
    └── manifesto-*.json                              ← trilha do que foi feito
```

## Duas numerações em uso — confira antes de renomear

Há duas convenções vivas no Drive, e elas **se contradizem**: o 05 é comprovante
de residência numa e o 07 é na outra.

| Nº | Oficial (JANICE, cliente 193) | Outra em uso (AYRES, KAREN) |
|---|---|---|
| 01 | Procuração | Procuração |
| 02 | Extrato de cota | **Doc identificação** |
| 03 | **Doc identificação** | Histórico de pagamentos (03.1, 03.2 por cota) |
| 04 | Contrato (04.1 PARTE 1-N) | Contrato por componente (04.1.1 quadro-resumo, 04.1.2 termo de verificação, 04.1.3 normas gerais, 04.1.4 regulamento) |
| 05 | *(não existe)* | **Comprovante de residência** |
| 06 | Carteira de trabalho | Notificação extrajudicial |
| 07 | **Comprovante de residência** | — |
| 08 | Notificação extrajudicial | — |

**A oficial é a da JANICE** — é a que `gav.nomes.DOCUMENTOS` implementa.

O **05 não existe** nela. Não invente rótulo para tapar o buraco: precisando de
um documento entre o contrato e a carteira de trabalho, pergunte como nomear.
`nome_documento("05", ...)` levanta erro de propósito.

Abrindo uma pasta que segue a outra numeração (Ayres, Karen, Nilton, Sibely,
Camila, Debora, Monique, Roberio, Thiago), **avise o usuário antes de renumerar**.
Renumerar mexe em pasta que pode já estar peticionada, e o 02 de uma é o 03 da
outra — trocar em silêncio embaralha a instrução do processo.

## Divisão do contrato

Por **tamanho**, em `04.1 - CONTRATO PARTE 1-N.pdf`, cada parte abaixo de 3 MB.
A divisão por componente que aparece nas pastas do Pitangui (quadro-resumo,
termo de verificação, normas gerais, regulamento) é feita à mão quando o
contrato já vem separado pela GAV — a esteira não tenta reconhecer seções.

Marcadores soltos como o Google Doc `FALTA E-MAIL` sinalizam pendência. Leia
antes de concluir que a pasta está pronta; não apague sem perguntar.

## Variantes de NÃO USAR

`Não usar ` (com espaço no fim), `NAO USAR`, `não-usar`. `e_pasta_nao_usar()`
reconhece todas. **Reaproveite a que existir** — criar uma segunda espalha os
originais em dois lugares.

## Operações pelo MCP do Drive

| Objetivo | Chamada |
|---|---|
| Achar a pasta | `search_files` com `parentId = '...' and title contains 'NOME'` |
| Listar o conteúdo | `search_files` com `parentId = '<id da pasta>'` |
| Criar pasta | `create_file` com `mimeType: application/vnd.google-apps.folder` |
| Renomear | `update_file` com `title` |
| Mover | `update_file` com `parentId` (substitui o pai — é mover, não copiar) |
| Copiar antes de editar | `copy_file` com `parentId` da NÃO USAR |
| Ler texto de PDF | `read_file_content` (bem mais barato que baixar em base64) |

`update_file` com `parentId` **move**. Para preservar o original na NÃO USAR e
ter uma versão de trabalho, use `copy_file` primeiro.

## Sobre baixar arquivo grande

`download_file_content` devolve base64 no contexto: um contrato de 4 MB vira mais
de um milhão de tokens. Para inspecionar conteúdo, use `read_file_content`. Para
processar PDF de verdade, trabalhe com o arquivo local (Drive para Desktop) ou
rode a esteira na máquina do usuário.
