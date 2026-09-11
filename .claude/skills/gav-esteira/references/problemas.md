# Quando a esteira trava

Regra geral: **pare e pergunte**. Nenhum item abaixo se resolve por dedução.

## "nenhuma cláusula de honorários encontrada"

A ferramenta recusou gerar o arquivo limpo. Causas, em ordem de probabilidade:

1. **O arquivo já é a versão limpa.** Confira se pegou o original de `NÃO USAR`,
   não o `01 - PROCURAÇÃO` da pasta interna.
2. **A procuração é digitalizada.** Sem camada de texto não há o que casar.
   Confirme com `read_file_content` do Drive: veio texto? Se não, a procuração
   precisa de OCR antes — avise o usuário, não gere um "limpo" que não limpou.
3. **O modelo mudou.** Uma redação nova de cláusula pede padrão novo em
   `ALVOS` (`ferramentas/gav/procuracao.py`). Mostre o texto ao usuário e
   confirme antes de mexer.

## "a limpeza removeu conteúdo essencial"

O padrão pegou demais e apagou outorgante, CPF, poderes ou OAB. Rode com
`--conferir`, veja qual linha foi arrastada indevidamente e ajuste. **Não force**
com margem menor sem entender o que foi pego.

## "sobrou cláusula de honorários no arquivo gerado"

Um alvo escapou — quase sempre cauda de linha quebrada. Mostre ao usuário o
trecho residual apontado. O arquivo **não** vai para os autos assim.

## "empate de N pontos entre p.33, p.34"

O OCR não distinguiu as páginas. Nessa ordem:

1. Tesseract instalado? `tesseract --version`. Se não:
   `apt-get install tesseract-ocr tesseract-ocr-por`.
2. `--renderizar /tmp/paginas`, abra os PNG com a ferramenta Read e **olhe**.
3. Achou o RG: repita com `--pagina N`.

Nunca resolva empate escolhendo a primeira.

## "o contrato tem N páginas, menos que a página inicial da faixa"

Passou só uma parte de um contrato dividido. Liste a pasta, ordene as partes e
passe **todas** com `--contrato` repetido, na ordem. A página 33 do contrato
costuma cair na PARTE 2 ou 3.

## "não coube em 3 MB nem no degrau máximo"

Contrato muito escaneado. Use `--dividir-se-nao-couber`: gera
`04.1 - CONTRATO PARTE 1-N.pdf`. Não baixe o alvo abaixo de 3 MB para forçar —
o contrato é prova e precisa continuar legível.

## Dois clientes com o mesmo número de pasta

Existem três pastas `83.` e duas `02.`. Mostre as candidatas com nome completo,
valor e nº do processo, e **pergunte qual**.

## Cliente não está no Drive

Pode ser cliente novo cujos documentos ainda estão no WhatsApp. Use a skill
`gav-whatsapp` para trazer os documentos, depois volte à etapa 1. Não crie pasta
de cliente sem confirmar com o usuário.

## Falta e-mail / falta documento

Pastas trazem marcadores (`FALTA E-MAIL`). Registre a etapa como `pendente` com
o que falta no detalhe, siga com as etapas independentes e **diga ao usuário no
fim o que ficou faltando**. Não marque `ok` para não travar a esteira.

## A sessão caiu no meio

O `dossie.json` guarda o estado. `python3 -m gav.esteira status --dossie <arquivo>`
mostra o que já ficou pronto. Retome da primeira pendente — não recomece do zero
nem refaça etapa concluída.
