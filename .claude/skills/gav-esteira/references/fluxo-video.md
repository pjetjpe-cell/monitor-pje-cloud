# Fluxo oficial — aprendido dos vídeos de 30/10/2026

Fonte: gravações do escritório (vídeos 1, 2, 3, 6, 7, 8, 9 e o "Gravador de
Passos" 05), caso real **110. VALTEMIR URCINO 01 COTA 18% R$ 13.507,38**. É o
jeito que o escritório faz hoje; a esteira e os agentes seguem esta ordem. Onde
o vídeo deixa um risco aberto, a ferramenta da esteira fecha — anotado em
**Conferência**.

Computador do escritório: Windows, usuário `gigica`, Chrome (WhatsApp Web e
Drive), Firefox (PDFs), pasta de trabalho `C:\Users\gigica\Downloads\CLIENTE XXX`.
Os agentes chegam lá pelo **Desktop Commander** (`DESKTOP-TO80D26`); sem ele,
entregam o comando pronto para o usuário colar — nunca fingem que fizeram.

---

## 1. Baixar do WhatsApp (vídeo 1)

Na conversa do cliente ("GAV <NOME> ..."), baixar: **contrato** da(s) cota(s)
do distrato, **procuração assinada** (`Procuracao_...cliente_NNN_..._assinado.pdf`)
e **extrato/print de pagamentos** (às vezes é imagem `.jpeg`). Criar
`Downloads\CLIENTE XXX` e mover os três para lá.

Como o agente faz: `ferramentas/whatsapp/baixar.mjs` (skill `gav-whatsapp`),
com `--destino "C:\Users\gigica\Downloads\CLIENTE XXX\NAO USAR"`.
- Conversas mudam de nome: rode antes `node conversas.mjs "<termo>"` e use o
  título exato. O script recusa baixar se abrir outra conversa.
- Cliente que desistiu de cotas: baixe só o contrato das cotas do distrato
  (no vídeo, de 4 contratos só o "cota 49").
- "Documento indisponível" = mídia antiga que saiu do celular; o script pula e
  avisa. Peça reenvio ao cliente.

## 2. Pasta, NÃO USAR, nomes e RG (vídeo 2)

Dentro de `CLIENTE XXX`: criar **`NAO USAR`** e renomear:

| Arquivo | Nome |
|---|---|
| procuração assinada | `01 PROCURAÇÃO` |
| documento de identidade (recortado do contrato) | `02 RG` |
| extrato / print de pagamentos | `03 EXTRATO DE PAGAMENTOS` (pode ser .jpeg) |
| contrato | `04 CONTRATO` |

**RG:** abrir `04 CONTRATO` no Firefox → Imprimir → Destino *Salvar como PDF* →
Páginas *Personalizado* → testar **33, 34, 35, 36** até achar a página do
documento (no caso do Valtemir era a **CNH na p. 36**) → salvar como `02 RG`.

Como o agente faz: `python3 -m gav.identidade "02 RG.pdf" --contrato "04 CONTRATO.pdf" --de 33 --ate 36`
(OCR; recusa empate — então `--renderizar`, olhar e `--pagina N`).
**Conferência:** no vídeo o `02 RG` saiu com **6,7 MB** (impressão do Firefox
vira imagem pesada) — acima do limite. O agente comprime o RG também.

Originais: **copiar** procuração, contrato e extrato para `NAO USAR` **antes**
de renomear/alterar (o vídeo renomeia direto; a esteira guarda o original).

## 3. Comprimir o contrato (vídeo 3 — "modo alternativo")

No vídeo: `tools.pdf24.org/pt/comprimir-pdf` → escolher `04 CONTRATO` → **DPI 100,
Qualidade de imagem 60%** → Comprimir → baixar → substituir `04 CONTRATO`
(5,7 MB → 1,45 MB).

Opções que a esteira faz, em ordem de preferência:
1. **`gav.compressao`** (local, PyMuPDF): busca o degrau mais leve que caiba em
   3 MB, preserva texto, confere página a página; `--dividir-se-nao-couber` gera
   `04 CONTRATO PARTE 1-N` sem perda. Roda onde o arquivo estiver (nuvem ou PC
   com Python+PyMuPDF).
2. **Artefato "Contrato para o PJe"** (navegador do usuário): dividir, comprimir,
   recortar páginas 33-36. Nada sai do computador.
3. **pdf24 com DPI 100 / 60%** — o "modo alternativo" do vídeo. Funciona, mas
   **envia o contrato do cliente a um site de terceiros** (dados pessoais, LGPD):
   usar só se 1 e 2 não estiverem disponíveis, e avisar.

Alvo: cada arquivo **< 3 MB** (`gav.pasta` reprova acima disso).

## 5. Alterar a procuração (Gravador de Passos 05)

No vídeo: abrir `01 PROCURAÇÃO.pdf` no Firefox → Ferramenta de Captura recorta
um pedaço **vazio do fundo** da própria procuração → no editor de PDF do Firefox,
*Adicionar imagem* (Ctrl+V) → arrastar/redimensionar o recorte **por cima do
quadro de honorários** (no caso: "18% · honorário de êxito" e "2/3 de salário
mínimo ... Entrada dispensada") → Imprimir → *Salvar como PDF* → sobrescrever
`01 PROCURAÇÃO`.

**Conferência obrigatória** (venha de onde vier):
`python3 -m gav.procuracao "01 PROCURAÇÃO.pdf" --verificar` — lê o texto ou, se
o PDF for imagem, faz OCR; reprova se sobrar percentual, "por cento", salário
mínimo, "2/3", "(0,5 SM)"; reprova se sumir outorgante, CPF/RG, poderes ou OAB.
Cobrir com imagem sem "imprimir em PDF" deixa o texto embaixo — a conferência pega.
Alternativa automática para PDF com texto: `python3 -m gav.procuracao original.pdf "01 PROCURAÇÃO.pdf"`
(redação real). Para procuração interativa Di PALLACIO (gerada por
`claude/gerar_procuracao_dipallacio.py`): o quadro é o bloco `.hon`.

## 6. Gerar a petição inicial (vídeo 6)

claude.ai → projeto **PROCESSOS MULTIPROPRIEDADE** → conversa **"2 PREENCHEDOR DE
PETIÇÃO INTERATIVA"** → artefato **"Peticionador gav v4"** (Petição Inicial
Interativa v3 — GAV Resorts). Abas: Petição Inicial · Réplica à Contestação ·
Petições Avulsas · Cumprimento de Sentença · Inicial Cota Quitada · Réplica Cota
Quitada.
1. **Preencher com IA**: anexar `03 EXTRATO DE PAGAMENTOS` (e o que mais tiver).
2. Conferir os campos: tipo (ex.: *Parcelamento de Custas*, 6 parcelas), gênero
   do autor, 2º autor, advogado (**Gilzielle Veloso Pontes**), data, empreendimento,
   fundamentos especiais (Bloco 6, casos análogos...), preliminares, **preço total
   contratado** e **total pago = valor da causa** (= RECEBIDO do extrato).
3. **Baixar HTML (standalone)** → abrir no Chrome → Imprimir → *Salvar como PDF*
   → nome **`Petição Inicial — NOME DO CLIENTE`**.

**Conferência** (o agente lê o PDF antes de aceitar): nome e CPF iguais aos do
contrato (no vídeo o arquivo saiu "VALTER UCINO" — o cliente é VALTEMIR URCINO);
data completa (apareceu "Ipojuca, 30 de 2026", **sem o mês**); valor da causa =
RECEBIDO; nenhum "[___]" além do número da vara.

## 7. Organizar a pasta (vídeo 7)

1. Abrir `03 EXTRATO DE PAGAMENTOS` e ler o **RECEBIDO** (R$ 13.507,38).
2. Criar a pasta interna **`NNN. NOME XX COTA PP% R$ VALOR`**
   (ex.: `110. VALTEMIR URCINO 01 COTA 18% R$ 13.507,38`).
3. Mover para ela: `Petição Inicial — ...`, `01 PROCURAÇÃO`, `02 RG`,
   `03 EXTRATO DE PAGAMENTOS`, `04 CONTRATO`.
4. Renomear `CLIENTE XXX` com o **mesmo nome**. Fica:
   ```
   110. VALTEMIR URCINO 01 COTA 18% R$ 13.507,38/
   ├── 110. VALTEMIR URCINO 01 COTA 18% R$ 13.507,38/   (01-04, petição, 08)
   └── NAO USAR/                                         (originais)
   ```
NNN = próximo número livre em CLIENTES (conferir a lista; não repetir).
Percentual = o da procuração. Cotas = só as do distrato.
`python3 -m gav.nomes "<nome>"` mostra o canônico.
**Conferência:** `python3 -m gav.pasta --dir "<pasta interna>" --para upload`.

## Notificação de distrato (antes de compartilhar)

Rascunho no Gmail (dipallacio@gmail.com) → `contato@gavresorts.com.br`
(+ `controladoria@` se cota quitada), Modelo B — `references/email-gav.md`.
Só envia com o "pode enviar" do usuário. Depois: Gmail → Enviados → abrir →
Imprimir tudo → Salvar como PDF → **`08 NOTIFICAÇÃO EXTRAJUDICIAL`** na pasta
interna.
As pastas 108 e 109 (feitas à mão) usam **`05 - NOTIFICAÇÃO ...`**; o `gav.pasta`
aceita 05 ou 08 até o escritório fixar um número.

## 8. Subir a pasta (vídeo 8)

Chrome com a conta **DI PALLACIO** (`drive.google.com/drive/u/4`) → PROCESSOS
DISTRATO → **CLIENTES** → Novo → **Upload de pasta** → escolher a pasta externa
em Downloads → confirmar "Fazer upload de N arquivos". O agente confere depois:
lista a pasta no Drive (search_files parentId) e roda `gav.pasta --lista`.

## 9. Compartilhar com a equipe (vídeo 9)

Só quando `python3 -m gav.pasta ... --para compartilhar` der **APROVADO**
(inclui o `08 NOTIFICAÇÃO EXTRAJUDICIAL`). Na pasta interna → Compartilhar →
adicionar **atuacaoadv@gmail.com** e **copa2026adv@gmail.com** como **Editor**,
"Notificar pessoas" marcado, mensagem **PETICIONAR INICIAL** → Enviar.
Compartilhar avisa terceiros: o agente prepara e pede o "pode compartilhar".
