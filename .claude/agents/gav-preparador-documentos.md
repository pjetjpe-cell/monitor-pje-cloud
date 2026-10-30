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
