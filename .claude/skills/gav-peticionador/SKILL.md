---
name: gav-peticionador
description: Gera a petição inicial (ou réplica) de COTA QUITADA da GAV pelo próprio PETICIONADOR GAV v41 — roda o HTML do peticionador num navegador headless, aplica os dados do cliente pela função dele (qiaAplicar), liga os blocos condicionais, insere prints do WhatsApp como figura, exporta HTML/PDF com timbre e "printa" cada página para conferência. Use quando o usuário disser "usa o peticionador", "peticionador v41", "inicial de cota quitada", "faz a inicial do [cliente] quitado", ou mandar o arquivo peticionador_GAV_v41.html.
---

# Peticionador GAV — inicial de cota quitada

O escritório já tem o modelo pronto: a aba **"✅ Inicial — Cota Quitada"** do
`peticionador_GAV_v41.html`. Não redija a peça do zero — preencha o peticionador.
Redigir à mão foi o erro de 04/11/2026: o usuário cobrou
"você deveria ter usado o peticionador".

## Onde está cada coisa

| O quê | Onde | Por quê |
|---|---|---|
| `peticionador_GAV_v41.html` | upload do usuário ou Drive — **nunca no repo** | traz CPF e dados de cliente real; o repo é público |
| `cliente.dados.json` | scratchpad da sessão | dados pessoais do cliente |
| executor | `ferramentas/peticionador/preencher.mjs` | versionado, sem dado de cliente |
| imagens | `ferramentas/gav/imagens.py` | printar páginas, anexo de prints, OCR |
| exemplo | `ferramentas/peticionador/exemplo.dados.json` | fictício |

## Passo a passo

1. **Pré-requisitos da esteira** (skill `gav-esteira`): procuração limpa,
   identidade, notificação. Faltou a notificação → deixe o bloco D desligado e
   um marcador `[PREENCHER APÓS O ENVIO]`; avise o usuário.
2. **Colete os fatos dos documentos**, nunca do nome da pasta: demonstrativo da
   ré (venda, parcelas, valor recebido, data-base, **data da última parcela =
   quitação**), contrato (nº da proposta, data, bloco/apto/cota, cláusulas 5.7,
   8.1, 9.4, G.1), prints e áudios do atendimento.
   - Prints: baixe pelo Drive (o resultado grande é salvo em arquivo — decodifique
     com `jq -r .content … | base64 -d`) e **olhe a imagem** com o Read antes de
     citar: o OCR do Drive corta mensagens recolhidas ("Ler mais").
   - Áudio: `faster-whisper` (modelo `medium`, `language='pt'`), passando o áudio
     decodificado por `ffmpeg` para float32 (o `av` do pip pode não abrir mp3).
3. **Calcule o prazo do item 5.7**: a data mais tardia entre 18/12/2025 (R-13) e
   a quitação, + 180 dias. Se ainda **não venceu** na data do ajuizamento, troque o
   parágrafo "Os dois marcos do item 5.7" pela tese de **inadimplemento antecipado**
   (Enunciado 437 CJF) + condição potestativa — nunca afirme "o prazo venceu em
   16/06/2026" para quitação posterior a 18/12/2025.
4. **Blocos condicionais — só com prova na pasta**: A (parcelamento de custas),
   B (print com "ligue para o cartório"), C (demonstrativo condominial),
   D (notificação enviada), E (danos morais com fato concreto), segundo autor.
5. **Monte o `dados.json`** no scratchpad (modelo: `exemplo.dados.json`) e rode:

   ```bash
   node ferramentas/peticionador/preencher.mjs \
     --peticionador /caminho/peticionador_GAV_v41.html \
     --dados $SCRATCH/cliente.dados.json --saida $SCRATCH/saida [--permitir-pendencias]
   ```

   Códigos de saída: `0` ok · `2` sobrou marcador amarelo · `3` ajuste sem alvo ou
   erro na página. Só use `--permitir-pendencias` para marcadores deixados de
   propósito (ex.: data da notificação ainda não enviada).
6. **Confira olhando**: o executor grava `saida/paginas/pagina-NN.png`. Abra com o
   Read pelo menos a 1ª página (timbre, qualificação, quadro-resumo) e as páginas
   com prints. Confira em `relatorio.json` a lista `preenchidos` — cada marcador
   com o texto que o antecede.
7. **Entregue** HTML + PDF (SendUserFile) e, se pedido, salve na pasta interna do
   cliente no Drive. Registre na esteira (`gav.esteira marcar --etapa peticao`).

## Armadilhas conhecidas do v41 (o executor já corrige)

- A regra de contexto do `qiaAplicar` lê a **frase inteira**: numa frase com
  "parcelas pagas" ele põe o nº de parcelas na **venda** e na **data-base**, e a
  venda na **Cota**. O executor resolve `[Nº]`/`[DATA]`/`[__]` antes, pelo texto
  imediatamente anterior ao marcador. Use o campo `cotaDescricao` para "à Cota".
- O texto do modelo é neutro ("o(a) autor(a)"). Com `autores` no dados.json o
  executor faz plural (dois autores) ou gênero (um autor) e o gênero de
  portador/inscrito na qualificação. O relatório lista o que restar de neutro.
- `downloadHTML` nomeia o arquivo pela aba de distrato ("NOME_DO_AUTOR") — o
  executor usa `nomeArquivo` do dados.json.
- O modo IA do peticionador chama a API da Anthropic do navegador; fora do
  artefato ele falha. O executor não usa a IA: você extrai os dados e passa pronto.

## Imagens ("printar" e usar prints como prova)

```bash
python3 -m gav.imagens paginas PETICAO.pdf --saida /tmp/paginas      # PNG por página
python3 -m gav.imagens anexo p1.jpg p2.jpg --saida "06 - PRINTS.pdf" \
        --titulo "Doc. 06 – WhatsApp da ré" --legenda "..." --legenda "..."
python3 -m gav.imagens ocr print.jpg                                 # exige tesseract
python3 -m gav.imagens figura print.jpg --legenda "Print 1"          # <figure> p/ a peça
```

Dentro da peça, use o ajuste `{"op":"imagens","ancora":"id","imagens":[...]}`
depois de criar a âncora `<div id="id"></div>` com outro ajuste.

## Skills da conta que complementam esta

Sincronizadas na conta (não versionadas aqui por conterem dados de clientes):
`preenchedor-peticoes-gav` (extrato colado → trechos; réplica), `procuracao-dipallacio`,
`taxa-operacional-gav`, `honorarios`, e as genéricas `pdf` e `docx`.

## O que esta skill não faz

Não escolhe tese nem variante pelo usuário, não inventa fato que não esteja em
documento e não protocola. Precedentes herdados do modelo (REsp 1.770.095/DF,
REsp 2.196.855/RJ, processos de Ipojuca) seguem "a conferir" até alguém checar.
