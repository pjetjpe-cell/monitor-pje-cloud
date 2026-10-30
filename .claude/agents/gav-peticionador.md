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

## Caminhos alternativos
Plano A = Passos 1-5. Todo plano termina no Passo 5 (ler o PDF com `pdftotext`).
Ação no computador do usuário só com autorização dele. "(não testado)" = não validado.

**Peticionador inacessível** (sem login; o agente da nuvem não opera o chat do claude.ai)
- B: Central de Comandos (`ferramentas/artefato/central-comandos-gav.html`, URL em
  `gav-peticao` Passo 2): extrai por regex e gera os 10 trechos (Inicial / + Justiça
  Gratuita). O usuário cola o extrato e o agente confere cada trecho contra o documento.
- C: o agente gera a peça inteira aqui: `references/molde-peticao-inicial.md` + trechos
  da Parte 3 → DOCX (python-docx, Verdana, A4) e PDF (ReportLab). Use `python3.13`,
  porque o `python3` padrão não importa os dois. Já validado (Márcio Bernardo da Silva).
- D: o usuário abre o Peticionador e manda o HTML baixado → seguir o item abaixo.

**HTML baixado, sem PDF**
- B: o usuário abre no Chrome → Ctrl+P → Salvar como PDF (é o caminho do vídeo 6).
- C: o agente converte aqui: `soffice --headless --convert-to pdf arquivo.html`. Só foi
  testado com HTML simples. Com o HTML do Peticionador não foi testado: compare
  margens, quebras de página e negritos.
- D: Chrome do escritório via CDP 9222 (Desktop Commander), `Page.printToPDF`. Não
  testado em janela não-headless; se falhar, volte ao B.

**Tipo sem aba** (réplica de caso coligado, avulsa fora da aba Petições Avulsas)
- Réplica coligada: o agente gera pela `references/replica.md` (10 seções, nenhuma
  omitida) + `conexao-coligacao.md` (um réu/CNPJ por empreendimento, mérito separado).
  Para réplica, a Central só monta o comando e não gera texto. Quem assina revisa a doutrina.
- Avulsa ou "só parcelamento": não há template verificado. Confirme com o usuário o que
  se pede e só então redija pelo chat. Confira o nº do processo, a vara e o pedido literal.

**Dado faltando no extrato** (extrato em imagem, RECEBIDO ilegível)
- B: `pdftotext -layout`; se vier vazio, `pdftoppm -r 300` + `tesseract -l por`
  (por está instalado). Com extrato GAV não foi testado.
- C: o agente lê a página com Read (visão) e registra a fonte `extrato:p.N (leitura visual)`.
  Um dígito de OCR errado muda o valor da causa: confira o RECEBIDO pelos dois meios.
- D: perguntar ao usuário ou pedir um extrato novo. Campo sem fonte fica `[___]`.

**Conferência reprovada**
- Corrija o campo no Peticionador (sobrescreva o que a IA preencheu ou use "Extração
  local") e baixe de novo. Não edite o PDF. Depois, reconfira tudo, não só o campo corrigido.
- Se falhar 2 vezes, siga o Plano C do primeiro item. Sem PDF aprovado, devolva
  REPROVADO com a lista e não salve o arquivo com o nome final.

**Tese agravante sem prova** (Bloco 6 sem o arquivo de áudio/vídeo; vício não relatado)
- Saia sem a camada 1 do Trecho 7: só o pedido padrão (90% e 75%). Diga ao usuário
  o que falta. Se a prova chegar (`gav-whatsapp`), gere a peça de novo.
- Conferir: `grep -iE "bloco 6|pet care|dog care|100%"` no PDF não acha nada. Se a tese
  entrar, cada arquivo citado deve existir na pasta com esse nome exato.
