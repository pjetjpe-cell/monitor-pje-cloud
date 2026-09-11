---
name: gav-whatsapp
description: Baixa os documentos que um cliente mandou no WhatsApp Web e arquiva na pasta dele no Drive. Use quando o usuário disser "baixa os documentos do [cliente] no WhatsApp", "pega o que o [cliente] mandou", "cliente novo, os documentos estão no zap", ou indicar uma conversa aberta para trazer anexos. Roda na máquina do usuário, conectando ao Chrome já logado.
---

# Entrada de documentos pelo WhatsApp Web

Traz contrato, extrato, RG e comprovantes que o cliente mandou no WhatsApp para
a pasta dele no Drive, sem o usuário ter que baixar um por um.

## Onde isto roda

**Na máquina do usuário.** O script liga-se ao Chrome que ele já tem aberto e
logado no WhatsApp Web. Numa sessão remota (Claude Code na web) não há esse
Chrome — nesse caso, entregue o comando pronto para ele colar no terminal dele e
peça o manifesto de volta. Não finja que baixou.

Nenhuma credencial passa pelo script: a sessão é a que o usuário já abriu.

## Preparo, uma vez só

O Chrome precisa estar aberto com a porta de depuração. **Feche o Chrome antes**
— se já houver instância rodando, o parâmetro é ignorado em silêncio.

```bash
# macOS
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 --user-data-dir="$HOME/.chrome-whatsapp"

# Windows (PowerShell)
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --remote-debugging-port=9222 --user-data-dir="$env:USERPROFILE\.chrome-whatsapp"

# Linux
google-chrome --remote-debugging-port=9222 --user-data-dir=~/.chrome-whatsapp
```

Nessa janela, abra `web.whatsapp.com` e leia o QR code. O `--user-data-dir`
separado mantém essa sessão independente do Chrome do dia a dia.

## Procedimento

**1. Confirme o nome da conversa.** Como aparece na lista do WhatsApp, não como
está no Drive. "Janice" e "Janice Brutti - Porto 2" são conversas diferentes.

**2. Simule primeiro.** Sempre.

```bash
node ferramentas/whatsapp/baixar.mjs --contato "Janice Brutti" --simular
```

Lista o que encontrou sem baixar nada. Mostre ao usuário e confirme que é a
conversa certa antes de seguir.

**3. Baixe para a pasta NÃO USAR.**

```bash
node ferramentas/whatsapp/baixar.mjs \
  --contato "Janice Brutti" \
  --destino "/caminho/83. JANICE BRUTTI .../NÃO USAR" \
  --manifesto "/caminho/.../NÃO USAR/manifesto-whatsapp.json"
```

Documento vindo do cliente é **original**: entra na `NÃO USAR` e de lá sai a
versão de trabalho, já renomeada, para a pasta de peticionamento. Nunca baixe
direto na pasta que vai instruir a inicial.

**4. Classifique com o usuário.** O WhatsApp entrega `documento-1.pdf`,
`IMG-20260805.jpg`. Qual é contrato, qual é extrato, qual é RG — **abra e
confira** (Read nos PDFs/imagens) ou pergunte. Não deduza pelo tamanho nem pela
ordem.

Numeração de destino em `gav-esteira/references/drive.md`.

**5. Registre no dossiê**, com fonte `whatsapp:<nome da conversa>`:

```bash
python3 -m gav.esteira campo --dossie d.json --nome contrato_origem \
  --valor "documento-3.pdf" --fonte "whatsapp:Janice Brutti"
```

## Cliente novo

Cliente que ainda não tem pasta: crie a pasta na pasta-mãe
`1ws13n0Jc5c2iX_0TSEMLun2xn08EUemD`, no padrão de nome de
`gav-esteira/references/drive.md`.

**Confirme com o usuário o número e os dados antes de criar** — número de pasta
já tem repetição no Drive (três "83.", dois "02."), e criar mais um duplicado
piora. O nome precisa de cliente, cotas, percentual e valor: falta algum,
pergunte em vez de deixar buraco ou inventar.

Feita a pasta, siga para a skill `gav-esteira` a partir da etapa 2.

## Limites que o script respeita

**Somente leitura.** Abre conversa e baixa anexo. Não digita, não envia, não
encaminha, não apaga. Escrever por engano na conversa de um cliente não se
desfaz.

**Confere a conversa aberta.** Se o cabeçalho não bater com o nome pedido, o
script para em vez de baixar do cliente errado.

**Não relata sucesso vazio.** Zero anexos encontrados é erro, não "pronto, nada a
fazer" — pode ser o WhatsApp Web tendo mudado os seletores. Abra e confira a
olho antes de concluir que não há documentos.

## Quando falhar

| Mensagem | O que fazer |
|---|---|
| `não consegui falar com o Chrome` | Chrome não foi aberto com `--remote-debugging-port`, ou já havia instância rodando. Feche tudo e reabra. |
| `nenhuma aba em web.whatsapp.com` | Abra o WhatsApp Web **naquela** janela. |
| `não achei a caixa de busca` | Tela travada/carregando, ou o WhatsApp Web mudou. Confira a olho. |
| `abriu "X" mas você pediu "Y"` | Nome ambíguo. Use o nome exato da lista. |
| `nenhum anexo encontrado` | Role a conversa a olho. Havendo anexo visível, os seletores mudaram — avise o usuário, não invente. |
