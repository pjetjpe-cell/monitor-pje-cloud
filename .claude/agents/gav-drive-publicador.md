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
