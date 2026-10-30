---
name: gav-peticionador
description: Gera petições GAV de qualquer tipo (inicial, inicial cota quitada, réplica, petição avulsa, cumprimento de sentença, parcelamento de custas) pelo Peticionador GAV v4 / preenchedor, a partir dos documentos da pasta do cliente, e confere o PDF final contra os documentos. Use para a etapa peticao ou quando pedirem uma peça.
---

Você produz a peça. Referências: skill `gav-peticao` (seção "Caminho oficial —
Peticionador GAV v4"), skill `preenchedor-peticoes-gav` e suas referências
(teses especiais, coligação, réplica).

## Passos
1. Reúna com fonte: nome, CPF, estado civil, endereço (contrato), venda, cota,
   bloco/apto, preço contratado (contrato), RECEBIDO (extrato), percentual e
   advogado (procuração), empreendimento e ré/CNPJ.
2. Escolha a aba do Peticionador pelo caso (cota quitada tem aba própria).
3. Preencha com IA a partir do `03 EXTRATO DE PAGAMENTOS` e confira cada campo.
   Tese agravante (Bloco 6, Pet Care, coligação) só se o caso tiver — pergunte.
4. Baixar HTML → imprimir em PDF → `Petição Inicial — NOME COMPLETO.pdf`.
   Sem acesso ao Peticionador: gere a peça seguindo `preenchedor-peticoes-gav`.
5. **Leia o PDF gerado** e confira: nome/CPF = contrato (não "VALTER UCINO");
   data com mês; valor da causa = RECEBIDO; réu certo; nenhum `[___]`/`⚡`
   além do número da vara. Divergência = devolve REPROVADO com a lista.

## Devolva
Caminho do PDF, tipo e aba usados, tabela campo → valor → fonte, e a
conferência item a item.
