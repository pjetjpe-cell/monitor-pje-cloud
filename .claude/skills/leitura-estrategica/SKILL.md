---
name: leitura-estrategica
description: Transforma material de estudo já GRIFADO pelo aluno (PDF com marca-texto em várias cores, traços à mão, X, sublinhados, mnemônicos) em um guia visual de leitura estratégica para prova oral/discursiva — mantendo cada grifo na mesma cor e trecho, separando a resposta ao examinador em passos numerados e montando quadros "diferença entre institutos" lado a lado. Também monta compilados "assuntos separados" (juntar, de várias questões do material de oral, tudo sobre um tema, apontando o que falta). Gera PDF A4 + HTML com botão "Ver só os grifos". Use quando o usuário colar/enviar um PDF de respostas, roteiro de prova oral, resumo ou questões comentadas com grifos e pedir "reorganize mantendo as marcações", "facilitador visual", "leitura estratégica", "numere as partes da resposta ao juiz/examinador", "diferença dos institutos", "ordem de argumentação".
---

# Leitura estratégica de material grifado

O aluno já fez o trabalho mais valioso: **decidiu o que importa** (cada cor e traço é uma decisão
dele). Seu papel é só reorganizar para ler e lembrar melhor — **sem mexer no texto e sem tirar,
trocar ou inventar nenhuma marcação**.

Provado na Meta 22 de Direito Penal (Prescrição, PC-PI): 235 grifos em 5 cores, 3 X, 2 sublinhados
e 1 mnemônico com figura, todos preservados e conferidos por programa. O build completo está em
`exemplo/build_meta22.py` — **leia-o antes de começar**; é o modelo do que você vai escrever.

## Regras inegociáveis

1. **Texto e grifos vêm do PDF, nunca redigitados.** Todo trecho sai de `seg()`; o grifo acompanha o texto.
2. **Não atribua significado às cores.** Você não sabe o que amarelo/rosa/vermelho/verde/azul querem
   dizer para o aluno. A legenda mostra só nome da cor e contagem. Se ele disser o código, aí sim
   coloque na legenda.
3. **Cor de estrutura ≠ cor de grifo.** Números, faixas e etiquetas são azul-marinho. As caixas
   laranja/pêssego só reproduzem as caixas do original. Nunca use amarelo/rosa/vermelho/verde/azul
   para decorar, senão o aluno confunde seu enfeite com a marcação dele.
4. **Diferenças entre institutos = só trechos do material.** Os duelos lado a lado reorganizam o que
   o texto já diz. Lado que o material não trata fica `— não tratado neste material`; não complete
   com conhecimento seu.
5. **Material truncado: avise.** Se o PDF acaba no meio de uma questão (ou o nome diz "Metas 01 a 45"
   e há só 5 páginas), mostre o que veio, marque "o arquivo enviado termina aqui" e diga ao aluno.
6. **Rótulos que você cria** (nomes dos passos, "Duelo A") são navegação. O texto do aluno nunca é
   resumido nem parafraseado dentro dos passos.

## Fluxo

Pasta de trabalho no scratchpad. `S` = pasta desta skill (`.claude/skills/leitura-estrategica`).

### 1. Entender o material (olhando as páginas)
```bash
pdfinfo X.pdf; pdftoppm -r 80 -png X.pdf pg      # e Read nas imagens
```
Veja as páginas de verdade: é aí que você enxerga cores, X, figuras e caixas. Identifique onde estão
(a) a pergunta, (b) a "sugestão de resposta oral" / resposta ao examinador, (c) perguntas de
aprofundamento, (d) quadros comparativos, (e) jurisprudência.

### 2. Extrair as marcações
```bash
python3 -I $S/scripts/extrair.py X.pdf paras.json --imgs imgs [--manter-parcial palavra ...]
```
Gera `paras.json` (1 item por bloco do PDF; cada letra com `hl` cor, `strike`, `u`, negrito, itálico)
e `paras.extras.json` (textos livres e carimbos/figuras do aluno). Leia a saída:

- **Marcas parciais**: o script lista palavras em que o grifo cobria só parte (ex.: só "int" de
  *intercorrente*). A maioria é só ponta de traço (a palavra inteira é o certo). Se for um
  **mnemônico intencional** (conferir na imagem; combina com uma anotação tipo "SU-IN-SAGUI"),
  rode de novo com `--manter-parcial intercorrente superveniente` (palavra inteira, sem pontuação).
- **Tinta colorida** vira marca-texto da cor do traço; **tinta preta** vira X (palavras da linha sob
  o X). **Linhas pretas sob o texto** viram sublinhado. Confira os números impressos com o que você viu.

Para achar os índices de parágrafo dos seus `seg()`:
```bash
python3 -I -c "import json;[print(i,p['page'],p['text'][:80].replace('\n',' ')) for i,p in enumerate(json.load(open('paras.json')))]"
```

### 3. Escrever `build_<material>.py` (a parte de julgamento)
Copie `exemplo/build_meta22.py` e adapte **só a composição**. Ferramentas (`scripts/engine.py`):

| Função | Para quê |
|---|---|
| `seg(i, a, b)` | HTML do parágrafo `i` da âncora `a` até **antes** de `b`; `skip_a=True` descarta o prefixo (`'RESPOSTA:'`, `'(II) '`); `incl_b=True` inclui `b`; `b=None` vai ao fim. Falha se a âncora não existe. |
| `step(n, rótulo, corpo, subs)` | Passo numerado; subitens viram `n.1`, `n.2` (ou tuplas `('(i)', html)`). `alt=True` = círculo vazado, para respostas a perguntas do examinador. |
| `band` / `trilha` | Faixas (a)(b)(c) e mapa de 1 minuto com chips que levam a cada passo. |
| `duel` | Quadro lado a lado, linhas numeradas na ordem do argumento. |
| `caixa`, `pergunta`, `rtag`, `titulo`, `legenda`, `mnemonico`, `imagem_b64` | Caixas pêssego, pergunta, títulos, legenda com contagem, anotação à mão. |
| `shell(corpo, título)` | HTML autônomo (CSS e imagens embutidos) + botão "Ver só os grifos". |

**Como estruturar (nessa ordem):**

1. **Pergunta** na caixa laranja + mapa das partes que ela exige — (a)(b)(c)… cortadas do próprio
   enunciado com `seg`.
2. **Resposta ao examinador em passos numerados** na ordem em que se fala, agrupados em faixas que
   espelham as partes da pergunta. Um passo = uma ideia. Frases longas viram subitens `n.1 n.2 n.3`
   cortando em vírgulas/conectivos ("e desconstitui…", "preservando…"). Meta: 8–14 passos por
   resposta; cada subitem cabe em uma ou duas linhas.
3. **Diferenças entre os institutos** em duelos (PPP × PPE, antes × depois de uma tese, interrupção ×
   suspensão…): linhas na ordem de argumentação — pressuposto/quando → alcance → o que sobra →
   efeito no prazo → exceções. Depois o quadro original (tabela) com as colunas numeradas na ordem de
   recitação.
4. **Roteiro de perguntas** (cada "PERGUNTA n" + "RESPOSTA"): passos `alt=True`, começando por
   **Posição** ("Excelência, não." / "é preciso distinguir") — o juiz ouve a tese primeiro — e
   terminando por consequência prática/jurisprudência, se o texto tiver.
5. **Aprofundamento / observações** em caixa pêssego com marcadores A, B, C… ou i.1, i.2.
6. **Jurisprudência** em cartões, com selo "usar em: passo X" ligando cada súmula ao passo onde entra.
7. **Painel inicial**: legenda das cores com contagem + "3 passadas" (trilha → só os grifos →
   texto completo) — as três funcionam sem saber o que cada cor significa.

Armadilhas já resolvidas:
- Blocos que quebram palavra em hífen entre células/linhas (`'projetando-'` + `'se'`): junte com `+`
  sem espaço, não com `cat`.
- Parágrafo que continua na página seguinte vira dois blocos: `cat(seg(10, …), seg(13))`.
- Célula de tabela espalhada em vários blocos: monte por linha como no exemplo.
- Prefixos que viram etiqueta (`RESPOSTA:`, `1.`, `(I)`) saem do texto com `skip_a`/âncora inicial.
- Âncora repetida no parágrafo: use âncora mais longa (`'(I) recebimento'`) ou `skip_a`.
- Se o extrator não detectou um sublinhado visível no original: `sublinhar(i, a, b)`.

### 4. Gerar, verificar, renderizar
```bash
python3 -I build_X.py paras.json imgs/stamp_p1_1.png saida.html
python3 -I $S/scripts/verificar.py paras.json saida.html --ignorar <nº de página e anotações> --viewport
node $S/scripts/render_pdf.js "$PWD/saida.html" "$PWD/saida.pdf" "Rodapé curto do material"
```
`verificar.py` **precisa** terminar em `OK`: todos os trechos grifados presentes, mesma cor, sem
rolagem horizontal no celular. Nas lacunas de texto listadas, confira que são só fronteiras de
corte/prefixos — qualquer outra é texto perdido: corrija o build.

### 5. Olhar o resultado
```bash
pdftoppm -r 70 -png saida.pdf pg
```
Veja todas as páginas (monte folhas de contato com PIL se forem muitas). Procure: título separado do
conteúdo no fim da página, página quase vazia por `break-inside`, rótulo estourando coluna, X sobre
as palavras certas. Ajuste `scripts/style.css` só se for melhoria geral.

### 6. Entregar
`SendUserFile` com o PDF (imprimir/estudar) e o HTML (tela; botão **Ver só os grifos**). No texto da
resposta diga: quantas páginas veio × o esperado, o que foi preservado (contagens por cor, X,
sublinhados, mnemônicos), a numeração criada e as decisões que você tomou sozinho (ex.: significado
dado a um mnemônico). Se o material veio truncado, peça o restante.

## Modo "assuntos separados" (compilado por tema)

> **REGRA DO USUÁRIO (2026-11-22): primeiro só RECORTAR, sem reformatar.**
> Pedido de "material separado de X" = **baixar do Drive o PDF e extrair as páginas originais** onde o tema aparece,
> exatamente como estão (Etapa 1). **Só se reorganiza (Etapa 2) depois que o aluno grifar essas páginas e mandar.**
> Mexer no formato antes disso foi rejeitado. Não gere HTML/PDF reformatado por conta própria.

**Etapa 1 — recorte (padrão):** mapeie os temas (itens 1–2 abaixo), depois
`python3 -I scripts/recortar.py ORIGINAL.pdf "Penal - INDULTO.pdf" 218-222 262-265`
(um PDF por tema, páginas originais, na ordem). Regra de páginas: **a questão inteira** quando o tema é o assunto dela
ou tem pergunta do roteiro sobre ele (inclua a última página mesmo que a próxima questão comece nela, como no
`PRESCRIÇÃO.pdf` do aluno); **só a página** quando a menção é incidental. Diga ao aluno o que é ausente. Entregue os
PDFs; não suba ao Drive sem pedido.

**Etapa 2 — reorganização (só com grifos enviados pelo aluno):** o restante desta seção.


Quando o pedido é "traga um material separado de X, Y e Z" (e não "reorganize este PDF"), o texto-fonte é o PDF
completo das Metas (ver `references/fontes-drive.md`: IDs das pastas, arquivos e onde cada tema já foi achado).

1. **Mapeie antes de prometer.** Baixe o PDF, extraia o texto por página (`pymupdf`) e procure cada tema
   (`indulto`, `abolitio`, ...). Quase nunca há uma questão com o nome do tema: ele aparece dentro de outras. Liste
   Meta/Questão/página e classifique a cobertura (forte, parcial, mínima, ausente).
2. **Dúvida de escopo? Pergunte antes** (ex.: artigos que não existem, como "350-A"). Diga o que achou e o que não.
3. **Recorte e extraia.** Monte um PDF só com as páginas relevantes (`pymupdf`: `insert_pdf`) e rode `extrair.py` nele.
   Os blocos costumam ser linhas, não parágrafos: use `merge_range(a, b)` (ignora nº de página) para costurar a
   fala inteira de uma questão e depois `seg()` com âncoras. Tabelas viram dezenas de blocos pequenos: monte linha a
   linha com `merge_range` + âncoras.
4. **Estrutura por tema:** faixa `band` + `fonte(...)` (Meta, questão, páginas) → perguntas do roteiro e a fala de
   abertura em passos numerados → duelos entre institutos (só com trechos do material) → jurisprudência em cartões.
5. **Lacunas são resultado, não falha.** Se o material não traz algo (agravantes ambientais, art. 320, lista do
   319...), faça um quadro pontilhado `gap` dizendo isso e apontando onde há complemento no Drive (roteiros de aula).
   **Não preencha com conhecimento próprio.** Se citar um dispositivo que não está no material, marque como
   "referência minha, fora do material". Abra o documento com uma tabela de cobertura por tema.
6. **Sem grifos do aluno nessas páginas?** Diga isso no topo ("sem grifos seus nestas páginas"); não invente cor.
7. **Verifique com `--inverso`:**
   `python3 -I scripts/verificar.py recorte.json saida.html --inverso --viewport`
   Confere que tudo que aparece no HTML, fora dos seus rótulos, existe no PDF (a checagem normal do documento
   inteiro não serve aqui, porque você usa só trechos). Termina em `OK`.
8. **Entrega:** PDF + HTML por matéria. Não envie ao Drive sem o usuário pedir (as pastas são de outra conta);
   ofereça o destino (`Assuntos separados`).

Exemplos prontos de build: `exemplo/` tem a Meta 22 (documento inteiro). Os dois compilados da Meta de oral
(Penal: indulto, abolitio, detração, progressão e ambiental; Processo Penal: cautelares, 319/320/350) seguem
exatamente este modo e podem ser refeitos pelo mesmo caminho.

Detalhes do motor úteis aqui: `merge(*idx)` costura blocos; `merge_range(a,b)` costura faixa; hífen de quebra de
linha ("apresentar- se") é juntado automaticamente; `*itálico*` de markdown residual deve ser removido no build
(`c['c'] != '*'` nos caracteres) e o verificador já o ignora.

## Requisitos
`pymupdf` (import `pymupdf`), `Pillow`, Node + `playwright` (Chromium) — já presentes no ambiente de
nuvem. Fontes Carlito (corpo) e Inter (rótulos); fora delas o CSS cai em Calibri/system-ui.
Rode Python com `-I` ao ler arquivos baixados.
