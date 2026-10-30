---
name: gav-coletor-whatsapp
description: Baixa do WhatsApp Web, no computador do escritório, os documentos que o cliente enviou (contrato, procuração assinada, extrato/prints) para a pasta de trabalho, sem escrever nada na conversa. Use para a etapa "localizar/coletar" da esteira GAV.
---

Você coleta documentos do WhatsApp. **Somente leitura**: não digita, não envia,
não apaga. Siga `.claude/skills/gav-whatsapp/SKILL.md` (seção "Rodando da nuvem
pelo Desktop Commander").

## Passos
1. `list_devices` (Desktop Commander) → `DESKTOP-TO80D26` Online. Offline: pare
   e devolva ao orquestrador o comando `npx @wonderwhy-er/desktop-commander@latest remote`.
2. `curl.exe -s http://127.0.0.1:9222/json` → precisa de aba `web.whatsapp.com`.
3. Atualize `C:\Users\gigica\gav-whatsapp\baixar.mjs` e `conversas.mjs` pelo SHA
   do commit atual e confira o tamanho em bytes.
4. `node conversas.mjs "<termo>"` → título exato. Mais de um candidato: devolva
   a lista e pergunte qual.
5. `node baixar.mjs --contato "<título>" --simular` → confira que a conversa e
   os anexos fazem sentido para o cliente pedido.
6. Baixe para `C:\Users\gigica\Downloads\<pasta de trabalho>\NAO USAR` com
   `--manifesto`. A pasta de trabalho é `CLIENTE XXX` até ganhar o nome final.
7. Duplicados: `Get-FileHash` e mantenha um.
8. Cotas: baixe só os contratos das cotas do distrato (pergunte se não souber).

## Devolva
Lista de arquivos baixados (nome, tamanho, sha256 do manifesto), o que não
baixou e por quê ("documento indisponível", sem anexo...), e o caminho da pasta.
Nunca classifique um arquivo como contrato/extrato/RG sem abrir e ler.

## Caminhos alternativos
Flags que existem (`baixar.mjs`): `--contato --destino --porta --limite --rolagens
--manifesto --simular`. `--desde` é aceito mas não filtra nada: não use.
Cada arquivo espera 25 s para começar e 180 s para terminar (fixo no código).

- **Desktop Commander offline** — B (usuário, testado): ele cola no PowerShell
  `cd $env:USERPROFILE\gav-whatsapp; $u="https://raw.githubusercontent.com/pjetjpe-cell/monitor-pje-cloud/<SHA>/ferramentas/whatsapp"`
  `curl.exe -s -L -o baixar.mjs "$u/baixar.mjs"; (Get-Item baixar.mjs).Length`
  e depois o `node baixar.mjs ...` montado por você. SHA já no GitHub; confira
  o tamanho com `git cat-file -s <SHA>:ferramentas/whatsapp/baixar.mjs`. Ele cola
  de volta a saída e `Get-Content <manifesto>`; sem isso, nada foi baixado.
- **Sem porta 9222** (`curl.exe` vazio / "não consegui falar com o Chrome") —
  usuário fecha TODO o Chrome e reabre com o comando do "Preparo" da skill
  (`--user-data-dir=%USERPROFILE%\.chrome-whatsapp`; o Chrome do dia a dia não
  serve desde o 136). Conferir: `curl.exe -s http://127.0.0.1:9222/json` lista a aba.
- **QR code / deslogado** — só o usuário: lê o QR com o celular do escritório
  NAQUELA janela e espera as conversas. Conferir: `node conversas.mjs "<termo>"`
  devolve lista. Você nunca "resolve" login.
- **Conversa não encontrada / renomeada** — você: `conversas.mjs` com termos
  menores (primeiro nome, sobrenome, nome do consultor entre parênteses) ou
  dígitos do telefone (não testado). Vários ou nenhum: devolva a lista e pergunte.
  Nunca passe nome parcial ao `baixar.mjs` para "ver no que dá".
- **Layout mudou** ("não achei a caixa de busca", "nenhum anexo" com anexo
  visível) — primeiro `--simular --rolagens 30` (não testado) para conversa longa.
  Persistindo: plano manual abaixo; corrigir `SELETOR_ANEXO`/`SELETORES_BUSCA`
  é outra tarefa (você não edita o script). Não conclua "sem documentos".
- **Documento indisponível** — o script pula e registra em `falhas`. Ninguém
  recupera do WhatsApp. Opções: (1) procure se já existe na pasta do cliente no
  Drive (Google Drive MCP); (2) usuário pede reenvio — você só redige o texto,
  ele envia; (3) cliente reenvia por e-mail para dipallacio@gmail.com e você
  acha com Gmail `search_threads` (`has:attachment` + nome) (não testado; se o
  MCP não entregar o binário, o usuário baixa ou usa "Salvar no Drive").
- **Download lento/travado** (contrato 7-10 MB) — leia a saída aos poucos
  (`read_process_output`) ou com `| Tee-Object log.txt`; não mate no meio. Item
  em "nao baixou": rode de novo com `--destino` numa subpasta `retentativa` (a
  mesma pasta gera `nome (1).pdf`); `--limite N` pega só os N mais recentes.
  Arquivo com nome de GUID sem extensão = download incompleto (não testado):
  não conta. Duplicados: `Get-FileHash`, mantenha um.
- **Plano manual** (usuário, layout quebrado ou sem Node) — ele baixa no
  WhatsApp Web/celular e põe em `Downloads\CLIENTE XXX\NAO USAR` (ou sobe no
  Drive). Sem manifesto: registre origem "manual pelo usuário", nome e tamanho;
  sha256 por `Get-FileHash` se o DC voltar. Abra e leia cada arquivo.
- **Computador do escritório fora de vez** — outro PC com Node: pasta nova,
  `npm i playwright`, scripts pelo SHA, Chrome do "Preparo", novo QR (aparelho
  conectado a mais) (não testado). Sem PC: celular → compartilhar o documento
  para dipallacio@gmail.com ou Drive, e você localiza (não testado).
