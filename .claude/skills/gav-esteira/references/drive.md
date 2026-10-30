# Estrutura no Google Drive

## Pasta de trabalho do organizador

`CLIENTES` (`1bDtqIX13hy3_apk2yDeOjy_4yB2f7s02`), dentro de `PROCESSOS DISTRATO`
(`1bCzt8Qi0TDWbTtwQIVN7kHDWrh6lfw68`). É aqui que chegam os clientes novos
(105, 106, 107...) e é **só aqui** que o organizador atua.

Fora do escopo: `1ws13n0Jc5c2iX_0TSEMLun2xn08EUemD` e as demais pastas de
processos já protocolados ou antigos. Não buscar, não ler, não mexer — nome
parecido lá é outro cliente/caso.

## Padrão do nome (vídeos de 30/10/2026)

```
NNN. NOME XX COTA(S) PP% R$ VALOR [- Nº PROCESSO]
```

Exemplos do padrão atual em CLIENTES: `110. VALTEMIR URCINO 01 COTA 18% R$ 13.507,38`,
`109. VANESSA 01 COTA 18% R$ 34.733,81`, `108. VALTEMIR 04 COTAS 18% R$ 54.029,52`.
Empreendimento **não** entra no nome (vai na descrição da pasta). VALOR = RECEBIDO
do extrato (soma das cotas do distrato). Pastas mais antigas usam outras formas
(com hífens, com empreendimento); `gav.nomes.analisar()` lê todas e
`formatar()` devolve o padrão atual. Campo ausente vira `None` e entra em
`observacoes` — nunca é preenchido por palpite.

**Números repetidos existem** (três `83.`, duas `02.`). Busque por nome dentro
de CLIENTES e, se voltar mais de uma, pergunte. Número novo = próximo livre na
listagem de CLIENTES.

## Árvore de cada cliente

```
110. VALTEMIR URCINO 01 COTA 18% R$ 13.507,38/               ← externa
├── 110. VALTEMIR URCINO 01 COTA 18% R$ 13.507,38/           ← interna (peticionar)
│   ├── 01 PROCURAÇÃO.pdf              ← já alterada e conferida (--verificar)
│   ├── 02 RG.pdf                      ← pp. 33-36 do contrato, < 3 MB
│   ├── 03 EXTRATO DE PAGAMENTOS.jpeg  ← ou .pdf
│   ├── 04 CONTRATO.pdf                ← < 3 MB (ou 04 CONTRATO PARTE 1-N)
│   ├── Petição Inicial — NOME.pdf
│   └── 08 NOTIFICAÇÃO EXTRAJUDICIAL.pdf   ← impressão do e-mail enviado
└── NAO USAR/                                                ← originais
```

`06 CARTEIRA DE TRABALHO` e `07 COMPROVANTE DE RESIDÊNCIA` quando houver.
**05 não existe** — precisando de outro documento, pergunte como nomear.

## Numeração anterior (não usar em pasta nova)

Pastas antigas seguem a numeração da JANICE (02 extrato, 03 doc. identificação,
04.1 contrato) ou a do AYRES/KAREN (02 identificação, 03 histórico, 05
comprovante). Ao reorganizar uma delas, **avise antes de renumerar** — pode já
estar peticionada.

## Divisão do contrato

Por **tamanho**, em `04 CONTRATO PARTE 1-N.pdf`, cada parte abaixo de 3 MB.
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
