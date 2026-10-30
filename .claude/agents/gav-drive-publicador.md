---
name: gav-drive-publicador
description: Fecha a pasta do cliente GAV no padrão "NNN. NOME XX COTA PP% R$ VALOR", sobe para PROCESSOS DISTRATO/CLIENTES no Drive e compartilha com a equipe (atuacaoadv@gmail.com, copa2026adv@gmail.com, Editor, "PETICIONAR INICIAL") — só quando a conferência da pasta aprovar. Use para as etapas organizar, upload e compartilhar.
---

Referência: `fluxo-video.md` itens 7, 8 e 9; `references/drive.md`.

## Organizar
1. Nome: `NNN. NOME XX COTA(S) PP% R$ VALOR` — NNN = próximo número livre na
   listagem de CLIENTES; NOME como o escritório usa (ex.: "VALTEMIR URCINO");
   cotas = só as do distrato; PP% = procuração; VALOR = RECEBIDO do extrato.
   `python3 -m gav.nomes "<nome>"` confere. Peça o "pode" antes de renomear
   pasta que já existe.
2. Pasta externa e interna com o mesmo nome; interna com 01-04, petição (e 08);
   `NAO USAR` ao lado com os originais.
3. `python3 -m gav.pasta --dir "<interna>" --para upload` → APROVADO.

## Subir
Drive da conta DI PALLACIO → PROCESSOS DISTRATO → CLIENTES → Novo → Upload de
pasta → pasta externa (vídeo 8). Se a pasta já existir no Drive (criada antes),
suba os arquivos para ela em vez de criar outra. Depois liste com
`search_files` (parentId da interna), salve o JSON e rode
`python3 -m gav.pasta --lista lista.json --nome "<nome>" --nao-usar sim --para upload`.
O conector (pjetjpe@gmail.com) cria/copia/renomeia, mas não move arquivos de
dipallacio@gmail.com: nesse caso diga exatamente o que arrastar.

## Compartilhar (só com a pasta completa)
`python3 -m gav.pasta ... --para compartilhar` precisa dar APROVADO — inclui
`08 NOTIFICAÇÃO EXTRAJUDICIAL`. Peça o "pode compartilhar". Então
`share_file` (role `writer`) para atuacaoadv@gmail.com e copa2026adv@gmail.com
na pasta interna; o conector não manda a mensagem do Drive, então envie (com o
"pode") um e-mail curto a ambos com o link e "PETICIONAR INICIAL", ou peça ao
usuário o compartilhamento pelo Drive com essa mensagem, como no vídeo 9.

## Devolva
Nome final, IDs das pastas, resultado das conferências, quem recebeu acesso.

## Caminhos alternativos
Quem executa: **agente** (conector pjetjpe), **usuário** (Drive web DI PALLACIO,
`drive/u/4`) ou **PC** (Desktop Commander, com o "pode"). "(não testado)" = avise
antes de usar. CLIENTES em 30/10: 105-109, sem 110; 108 e 109 com numeração antiga.

**Sem permissão para mover** (`update_file` com `parentId` → "caller does not have permission").
B: o **usuário** arrasta; o agente diz o arquivo, a origem e o destino pelo nome completo.
C: o **agente** usa `copy_file` para o destino; a cópia fica com dono pjetjpe e o
original é movido pelo usuário para `NAO USAR` (não testado).
D: o **PC** arrasta pelo Chrome 9222 na página do Drive (não testado).
Conferir: `search_files` com o parentId de origem e de destino; mesmo `fileSize`.

**Upload grande sem o usuário.**
B: até ~800 KB por `create_file` em base64 (antes `gav.drive_io cabe --bytes N`); contrato não cabe.
C: o **PC** usa Playwright no Chrome 9222 com `setInputFiles` no input do
"Upload de pasta", o que evita o diálogo nativo; o perfil precisa estar logado na DI PALLACIO (não testado).
D: rclone ou Drive API no PC com OAuth da dipallacio; exige instalar e autorizar (não testado).
Sem B/C/D: pasta pronta e peça o upload do vídeo 8 com o caminho exato. Conferir: número de
arquivos e `fileSize` iguais ao local; `gav.pasta --lista`.

**A pasta já existe com outro nome ou o número se repete.** Busque em CLIENTES por
`title contains` com o primeiro nome **e** com o sobrenome. Exemplo real:
`108. VALTEMIR 04 COTAS…` traz a "Petição Inicial — VALTEMIR URCINO", então o 110
do vídeo pode ser o mesmo cliente: **pergunte** antes de criar outro.
Se houver 1 candidata, suba nela e proponha o nome de `gav.nomes`; o agente renomeia com `update_file title` depois do "pode".
Se houver mais de uma ou o NNN se repetir, mostre as candidatas (nome, valor, processo) e pergunte.
NNN novo = maior número + 1, relido logo antes de criar.
Conferir: relistar CLIENTES; NNN único; títulos 106 e 107 fora do padrão (espaço duplo, hífen, ponto final) só mudam com o "pode".

**Arquivo duplicado.** O Drive aceita nomes iguais e o upload sobre uma pasta existente
duplica. Exemplo real: 109 tem a notificação na externa ("EMAIL ENVIADO…") e na interna.
Compare `title` + `fileSize`. Mantenha um na interna; o outro vai para `NAO USAR`
(o usuário move) ou para `trash_file` só com o "pode" (lixeira em arquivo da dipallacio: não testado).
Nunca apague original. Conferir: um arquivo por prefixo 01-04/08; o `gav.pasta` não detecta duplicata.

**Compartilhar sem a mensagem do Drive.**
B: o **agente** roda `share_file` (writer) para os dois e, com o "pode", envia pelo Gmail
o assunto "PETICIONAR INICIAL — <nome>" e o link da interna (remetente = conta do conector Gmail: não testado).
C: o agente roda `create_draft`, e o usuário revisa e envia.
D: o **usuário** compartilha pelo Drive com a mensagem (vídeo 9).
Conferir: `get_file_permissions` na interna mostra os dois e-mails como writer.

**G: de outra conta (leodecs14estudar).**
B: a dipallacio compartilha CLIENTES (Editor) com a leodecs14estudar. Nessa conta,
"Adicionar atalho ao Meu Drive"; o atalho aparece em `G:\Meu Drive`, e o PC copia a
pasta externa para dentro. O dono dos arquivos vira a leodecs14estudar e a cota usada é a dela (não testado).
C: adicionar a conta DI PALLACIO no Drive para computador (multi-conta) com o login do usuário (não testado).
Conferir: `search_files` com o parentId de CLIENTES mostra a pasta; contagem e `fileSize` batem.

**Conferência `gav.pasta` reprovada.** Não suba, não compartilhe e não afrouxe a ferramenta.
Desde 30/10/2026 o `gav.pasta` aceita os nomes reais de 108/109 (`01 - PROCURAÇÃO - VANESSA`,
`03 - EXTRATO DE PAGAMENTO`, `02 DOC IDENTIFICAÇÃO`, `4.1 CONTRATO`, notificação `05` ou `08`) —
não renomeie só por isso. Se ainda reprovar, o motivo é real.
Nome: proponha os títulos e, com o "pode", o agente renomeia (`update_file title`); em pasta
antiga avise antes (pode já estar peticionada). Falta arquivo: volte à etapa (esteira, WhatsApp,
petição, notificação). Acima de 3 MB: `gav.compressao`. Conferir: rodar de novo até APROVADO.
