---
name: gav-procuracao
description: Altera a procuração assinada do cliente GAV para os autos — tira percentual de honorários, salário mínimo/taxa e entrada — e prova com conferência (OCR quando for imagem) que nada disso sobrou e que outorgante, CPF, poderes e OAB continuam. Também gera procurações interativas Di PALLACIO. Use para a etapa procuracao.
---

Você cuida da procuração. Referências: `references/procuracao.md` (seção
"Modo do vídeo 05") e skill `procuracao-dipallacio` para gerar novas.

## Alterar a assinada
- PDF com texto: `python3 -m gav.procuracao "NAO USAR/original.pdf" "01 PROCURAÇÃO.pdf"`
  (redação real; reprova sozinho se errar).
- Procuração imagem / interativa / modo do vídeo: cobrir o quadro de honorários
  com um recorte do fundo e **imprimir em PDF** (Firefox), como no vídeo 05.
  Se o computador do escritório estiver acessível e houver Python, a cobertura
  pode ser feita por script; senão, guie o usuário passo a passo.
- **Sempre**: `python3 -m gav.procuracao "01 PROCURAÇÃO.pdf" --verificar` →
  só APROVADO libera a etapa. REPROVADO: diga o trecho que sobrou.
- O original assinado fica em `NAO USAR`, intacto.

## Gerar nova (cliente ainda não assinou)
`python3 claude/gerar_procuracao_dipallacio.py clientes.json --out <pasta>` —
nunca escreva o HTML à mão; teste no navegador antes de entregar.

## Nunca
- Transplantar assinatura de um documento para outro, nem montar páginas de
  versões diferentes (ver `references/problemas.md`).
- Aprovar sem ter lido o resultado.

## Caminhos alternativos
Testes de 30/10/2026 (nuvem, clientes fictícios, gerador + Chromium/html2canvas real): a interativa
sai como PDF só-imagem de ~1 MB, 2–3 páginas.

**PDF com texto** — A: redação (acima). B: recusou ("nenhuma cláusula", "removeu essencial") →
`problemas.md`, pare e pergunte; nunca afrouxe padrão. C: modo do vídeo + `--verificar`.

**PDF imagem** — A (script, nuvem ou PC com Python+Tesseract; ad hoc, não versionado): renderizar
cada página a 200 dpi, achar por OCR os blocos com termos de `PROIBIDOS_ALTERADA`, estender a
cobertura até os blocos limpos vizinhos, pintar com a cor do papel e gravar um PDF **novo** só com
a imagem pintada. Testado: padrão e aprimorado → APROVADO, 0 texto, 1 imagem/página; o remendo fica
levemente visível, como no vídeo. B: vídeo 05 guiado no Firefox. Onde cobrir:
- padrão: `.hon` inteiro **e** a declaração "entrada de um salário mínimo (1 SM) por cota" e a de
  "70% (setenta por cento)", se houver — só o `.hon` REPROVA (testado). Não renumerar.
- aprimorada: no `.quadro`, HONORÁRIOS e PARCELA FIXA (+ ENTRADA e decl. III se entrada 1 SM).

**Pontos cegos do `--verificar` — achados e corrigidos em 30/10/2026** (mesmo assim, renderize e **olhe** cada página):
1. O OCR em 200 dpi não lia o "18%" grande do `.hon`. Agora há uma 2ª leitura em 100 dpi:
   a procuração coberta só nas linhas pequenas passou a dar REPROVADO (testado).
2. Imagem colada por cima **sem imprimir** deixava a página original (com o %) dentro do arquivo.
   Agora imagens sobrepostas ou anotação na página dão REPROVADO "remendo em camada" (testado com
   `colada2.pdf`). Solução: Imprimir → Salvar como PDF e conferir de novo.

**Sem Python/OCR no PC** — A: arquivo < ~800 KB vem do Drive pelo MCP e confere-se aqui (os PDFs
interativos de teste tinham 0,95–1,0 MB: provavelmente não cabem). B: instalar no PC (comandos em
`pc-escritorio.md`) só com o "pode". C: nenhum dos dois → etapa `pendente` ("alterada, conferência
não executada"); nunca `ok` só de olho.

**REPROVADO** — leia o trecho. Do quadro coberto: ficou texto/imagem por baixo → imprimir de novo.
De declaração: cobrir também. "perdeu conteúdo essencial (ou o OCR não leu)": renderize e olhe; se
está legível, mostre ao usuário e não aprove sozinho; se cobriu demais, refaça. Refaça sempre do
original da `NAO USAR`, nunca por cima da reprovada; não mexa nos padrões para passar.

**Cliente não gerou o PDF** — A: reenviar a interativa e guiar por vídeo-chamada até "Assinar e
baixar PDF" (Android: compartilhar → WhatsApp; iPhone: abre em nova aba → compartilhar). B: outro
aparelho, com o próprio cliente assinando. C: outro meio (Gov.br, papel) só por decisão do
escritório. O print vai para `NAO USAR` como comprovante; nunca vira `01 PROCURAÇÃO`.

**Co-titular sem assinatura** — com `nome2`/`cpf2` a interativa só baixa com os dois quadros
assinados: PDF com uma assinatura não é saída normal → não use. Pergunte se o co-titular é autor;
se for, regere com `nome2`/`cpf2` e colha as duas assinaturas; procuração separada só se o
escritório decidir. Assinatura nunca se copia.

**Outro modelo** — aprimorada (`"modelo": "aprimorado"`): quadro é `.quadro`, não `.hon`; com só RG o
`--verificar` aceita (testado: APROVADO). Modelo desconhecido: mostre ao usuário onde estão as
condições econômicas antes de cobrir; texto sem achado na redação = "modelo mudou" (`problemas.md`).
