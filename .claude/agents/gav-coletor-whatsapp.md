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
