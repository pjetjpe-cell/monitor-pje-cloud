---
name: reducao-questoes
description: Redução das questões erradas no padrão aprovado pelo usuário — para cada questão, só o enunciado original (com as marcações em vermelho), a caixa "⚡ CORREÇÃO TURBO" (palavra errada tachada em vermelho + a certa em negrito azul) e o quadro LEI SECA, duas questões por página. Use quando o usuário pedir "redução das questões erradas", "reduzir as questões", "correção turbo", "reduzir o material" ou mandar um caderno de questões marcadas/circuladas (ENAMZEIRO) para enxugar.
---

# Redução das questões erradas (padrão aprovado)

Padrão aprovado pelo usuário em 26/11/2026 sobre o caderno ENAMZEIRO de
Direito Administrativo da PC-MA. Exemplo pronto: `exemplo_correcoes.json`
(questões Q69 e Q74).

## O que entra no PDF reduzido

Para cada questão, nesta ordem e nada mais:

1. **Enunciado original**: o recorte da página do caderno, com o número, o
   gabarito, a banca e as marcações vermelhas do usuário preservadas.
2. **⚡ CORREÇÃO TURBO**: a frase do enunciado reescrita com a menor
   alteração possível para ficar correta.
3. **LEI SECA / PRECEDENTE QUE RESOLVE**: o quadro original, também com as
   marcações.

Saem: "Por que o gabarito é o gabarito", comentário original, atualização,
pegadinha e imagem mental. O conteúdo original vai a 80% (duas questões por
página); a caixa da correção fica em tamanho normal.

## Regras da correção turbo

- Mudança mínima. Nunca parafrasear; o resto da frase fica idêntico.
- Palavra errada: tachado vermelho. Palavra certa: logo depois, em negrito
  azul. Só apagar: só o tachado. Só acrescentar: só o negrito azul.
  No JSON: `~~errada~~ **certa**`.
- A troca tem que se apoiar no comentário ou na lei seca da própria questão.
  Se o material não sustentar a troca com segurança, escreva "⚠ conferir"
  na linha de fonte e não invente.
- Lei revogada ou alterada: corrija pela base da questão e avise na linha de
  fonte qual é o regime atual (ex.: Lei 10.520/02 → Lei 14.133/21).
- Gabarito CERTO: a caixa traz só "✔ Assertiva correta". Múltipla escolha:
  uma linha corrigida por alternativa errada.
- A linha de fonte diz de onde veio a correção (comentário, artigo, súmula).

## Como fazer

1. Leia o caderno (índice + texto de cada questão com `pdftotext -layout`) e
   anote, para cada questão: página inicial, páginas onde está a lei seca,
   enunciado, gabarito e o trecho do comentário que justifica a troca.
2. Monte o `correcoes.json` no formato de `exemplo_correcoes.json`.
3. Gere o PDF:

   ```bash
   python3 -I .claude/skills/reducao-questoes/reduzir.py caderno.pdf correcoes.json saida.pdf
   ```

   O script avisa se não achou a lei seca de alguma questão.
4. Renderize uma página (`pdftoppm -r 80 -png`) e olhe antes de entregar.
5. Entregue o PDF e, na resposta, uma tabela de conferência:
   questão | trecho original → corrigido | fonte.

## Limites do script

Feito para o layout do caderno ENAMZEIRO (enunciado em caixa cinza, cartão
creme, títulos "LEI SECA / PRECEDENTE"). Em outro layout, ajuste
`STMT_FILL`, `HEADS` e a largura útil (`X0`, `X1`) e confira o resultado.
Depende de `pymupdf`.
