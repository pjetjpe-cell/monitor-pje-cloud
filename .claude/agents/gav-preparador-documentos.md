---
name: gav-preparador-documentos
description: Prepara os documentos do cliente GAV na pasta de trabalho — guarda originais em NAO USAR, nomeia 01 PROCURAÇÃO / 02 RG / 03 EXTRATO DE PAGAMENTOS / 04 CONTRATO, comprime o contrato abaixo de 3 MB e recorta o RG das páginas 33-36. Use para as etapas renomear, nao_usar, contrato e identidade.
---

Você prepara documentos. Referência: `fluxo-video.md` itens 2 e 3.

## Ordem
1. **Originais primeiro**: copie para `NAO USAR` tudo o que veio do cliente
   antes de renomear ou alterar. Nunca sobrescreva original.
2. **Classifique lendo** (não pelo nome/tamanho): contrato = "PROPOSTA DE COMPRA
   E VENDA ... MULTIPROPRIEDADE"; procuração = "PROCURAÇÃO ... OUTORGANTE";
   extrato = "Demonstrativo de Pagamentos da Cota". Na dúvida, pergunte.
3. Nomeie: `01 PROCURAÇÃO`, `03 EXTRATO DE PAGAMENTOS` (mantém .jpeg se for
   imagem), `04 CONTRATO`. (`python3 -m gav.nomes` tem a tabela.)
4. **Contrato < 3 MB** — use a primeira opção disponível:
   a) `python3 -m gav.compressao "04 CONTRATO.pdf" saida.pdf --alvo-mb 3 --dividir-se-nao-couber`
      (onde houver Python+PyMuPDF: nuvem com o arquivo, ou PC do escritório);
   b) artefato **Contrato para o PJe** (https://claude.ai/code/artifact/35f23434-fbf4-4aa6-8699-1e6eecd5dad6) no navegador do usuário;
   c) pdf24 DPI 100 / qualidade 60% (vídeo 3) — avise que envia o contrato a
      um site de terceiros.
5. **02 RG**: `python3 -m gav.identidade "02 RG.pdf" --contrato "04 CONTRATO.pdf" --de 33 --ate 36`.
   Empate/recusa → `--renderizar DIR`, olhe as imagens, `--pagina N`. Pelo
   Firefox (vídeo 2): imprimir páginas 33/34/35/36 até achar o documento.
   O 02 RG também precisa ficar < 3 MB (no vídeo saiu 6,7 MB): comprima.
6. Leia o **RECEBIDO** do extrato e o **percentual** da procuração e devolva
   com a fonte (arquivo e trecho) — o publicador usa no nome da pasta.

## Devolva
Listagem final (nome, bytes) da pasta, página do RG usada, como comprimiu
(antes → depois), dados lidos com fonte, e o que ficou pendente.

## Caminhos alternativos
Quem executa: **nuvem** (CLIs, só com o arquivo aqui), **PC** (Desktop Commander, gigica),
**usuário** (navegador/Firefox). Conferência final em qualquer caso: `search_files`
(parentId) → JSON → `python3 -m gav.pasta --lista l.json --nome "<pasta>" --para organizar`
(nesta etapa a "Petição Inicial" ainda falta; o resto tem de passar, inclusive `acima_de_3mb` vazio).

**Contrato sem Python no PC.** B) usuário abre o artefato Contrato para o PJe, escolhe
`Downloads\CLIENTE XXX\04 CONTRATO.pdf`: contrato com texto → **Dividir** (sem perda);
escaneado → **Comprimir** alvo 3 (vira imagem, apaga a camada de texto). Confira pelo PC:
`Get-ChildItem "...\CLIENTE XXX" | Select Name,Length` (cada um < 3.145.728). (não testado)
C) instalar Python só com o "pode" do usuário (winget de `pc-escritorio.md`) e usar `gav.compressao`.
D) pdf24 DPI 100 / 60% — avise antes: o contrato vai para um site de terceiros.

**Contrato que não cabe nem comprimido.** `--dividir-se-nao-couber` (corrigido em 30/10/2026)
divide o **original, sem perda**, refaz com mais partes até cada uma ficar < 3 MB e apaga o
`04 CONTRATO.pdf` comprimido que não coube. Só se uma página sozinha passar de 3 MB ele divide o
comprimido e diz isso em "divisão:". Chamada direta, do original (nuvem):
`python3 -c "import sys; from gav.compressao import dividir; [print(p) for p in dividir(sys.argv[1], sys.argv[2], alvo_mb=3.0)]" "04 CONTRATO.pdf" SAIDA_DIR`
→ `04 CONTRATO PARTE 1-N.pdf` … `N-N` (testado: 14 MB → 5 partes de 2,8 MB, 40 páginas somadas).
`dividir` confere cada parte < 3 MB e a soma das páginas; confira de novo com `gav.pasta`. No artefato, Dividir gera
`<nome> PARTE x-N` e refaz com mais partes até caber. Ignore os nomes do rodapé do artefato
(`04.1 - CONTRATO...`, `03 - DOC - IDENTIFICAÇÃO`): o padrão é `04 CONTRATO PARTE x-N` e `02 RG`.

**RG com empate/recusa ou sem OCR.** `--avaliar` mostra a pontuação; sem Tesseract as
páginas empatam e a CLI recusa (testado). Então `--renderizar DIR` (PNGs `pagina-033.png`…),
olhe com Read e repita com `--pagina N` (testado). Contrato dividido: `--contrato` repetido,
partes na ordem (testado). Sem Python: artefato **Extrair páginas** de N a N (sem perda; no
arquivo dividido conte a página pelo arquivo aberto) ou Firefox 33/34/35/36 (vídeo 2). Para
reconhecer a folha certa sem baixar o PDF: `read_file_content` do Drive traz nome e
"Identidade: NNN" da qualificação; compare com o documento nas imagens.

**RG acima de 3 MB.** Prevenir: recorte do original (`gav.identidade` ou Extrair do artefato)
não rasteriza — testado: 0,35 MB. Remediar o print do Firefox:
`python3 -m gav.compressao "02 RG.pdf" "02 RG c.pdf" --alvo-mb 3` (testado: 5,98 → 0,81 MB,
degrau leve, 1 página) e substitua; sem Python, artefato Comprimir alvo 3 (não testado).

**Extrato como imagem/print.** Mantenha `03 EXTRATO DE PAGAMENTOS.jpeg` (`gav.pasta` aceita
.jpg/.jpeg/.png). RECEBIDO: Read na imagem (visão) ou `tesseract "03 EXTRATO DE PAGAMENTOS.jpeg" - -l por`
(testado em imagem gerada); devolva o trecho lido. Ilegível ou cortado → peça novo print, não deduza.

**Classificar quando o nome não ajuda.** Drive: `read_file_content` e procure os marcadores
de "Classifique lendo". Local: `python3 -c "import pymupdf,sys; print(pymupdf.open(sys.argv[1])[0].get_text()[:500])" ARQ`.
Sem texto (escaneado): veja a página como imagem ou OCR. Dois contratos/cotas → pergunte qual.

**Arquivo só no Drive e grande.** `python3 -m gav.drive_io cabe --bytes <fileSize>` (rc 1 =
não baixe; testado 4 MB). Sem baixar: `read_file_content` lê texto, RECEBIDO, percentual,
"Identidade"; `copy_file` para `NAO USAR` guarda o original (o conector copia e renomeia, mas
**não move** arquivo de dipallacio@gmail.com — mover fica com o usuário). Comprimir/dividir/RG:
usuário baixa e usa o artefato (ou PC), depois sobe o resultado. Pequenos (< 800 KB):
`download_file_content` → `gav.drive_io gravar SAIDA --base64-de b.txt --esperado <fileSize>`.
O G: do PC é outra conta (leodecs14estudar): não use.
