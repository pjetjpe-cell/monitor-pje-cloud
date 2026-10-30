---
description: Só conferência, sem alterar nada — roda gav.pasta e o --verificar da procuração numa pasta pronta e mostra o resultado.
---

# /gav-conferir

Antes: leia `.agent/rules/gav-esteira.md`. **Somente leitura**: não renomeie,
não mova, não apague, não comprima.

1. Na pasta interna indicada, rode a partir de `ferramentas/`:
   - `python -m gav.pasta --dir "<pasta interna>" --para compartilhar`
   - `python -m gav.procuracao "<pasta interna>\01 PROCURAÇÃO.pdf" --verificar`
     (o nome pode vir com hífen e sufixo, como `01 - PROCURAÇÃO - NOME.pdf`)
2. Liste os arquivos com tamanho.
3. Mostre as saídas exatamente como vieram (APROVADO/REPROVADO e motivos). Se
   reprovar, diga qual etapa resolve e **não corrija sem o "pode"**.
