# Ferramentas da esteira GAV

CLIs determinísticos por trás das skills `gav-esteira`, `gav-whatsapp` e
`gav-peticao`. Nenhuma delas pede opinião a um modelo: recebem arquivo, aplicam
uma regra e **conferem o que produziram** antes de dizer que deu certo.

## Instalar

```bash
pip install -r ferramentas/requirements.txt

# OCR do RG escaneado (binário, não pacote Python)
apt-get install tesseract-ocr tesseract-ocr-por     # Debian/Ubuntu
brew install tesseract tesseract-lang               # macOS

# Só para o baixador do WhatsApp
npm install
```

## Comandos

Todos rodam a partir de `ferramentas/`.

### Procuração — remover honorários, percentual e 0,5 SM

```bash
python3 -m gav.procuracao ORIGINAL.pdf LIMPA.pdf --conferir     # o que sairia
python3 -m gav.procuracao ORIGINAL.pdf LIMPA.pdf --manifesto m.json
```

Redação real: os glifos saem do fluxo de conteúdo. Tarja por cima deixaria o
texto recuperável por copiar-colar. Por padrão não pinta nada — removendo só os
glifos, o fundo original (caixa colorida, timbre) fica intacto e casa perfeito.
Reabre o arquivo gerado e reprova se sobrou cláusula ou se sumiu outorgante,
CPF, poderes ou assinatura.

### Contrato — comprimir abaixo de 3 MB

```bash
python3 -m gav.compressao CONTRATO.pdf SAIDA.pdf --alvo-mb 3 --dividir-se-nao-couber
```

Testa degraus do mais leve ao mais agressivo e para no primeiro que couber, em
vez de aplicar uma taxa fixa. Reprova se perder página ou texto. Não coube nem
no máximo: divide em `PARTE 1-N`.

### Documento de identificação — páginas 33-35

```bash
python3 -m gav.identidade SAIDA.pdf --contrato C1.pdf --contrato C2.pdf --avaliar
python3 -m gav.identidade SAIDA.pdf --contrato C1.pdf --renderizar /tmp/paginas
python3 -m gav.identidade SAIDA.pdf --contrato C1.pdf --pagina 34
```

O RG entra escaneado, então roda OCR. Contrato dividido: passe as partes na
ordem — a numeração é contínua (a p.34 do contrato costuma ser a p.6 da PARTE 3).
Empatou ou pontuou baixo, **recusa**: renderize, olhe e indique com `--pagina`.

### Ponte com o Drive (sessão na web)

```bash
python3 -m gav.drive_io cabe   --bytes 3724220        # vale baixar pelo MCP?
python3 -m gav.drive_io gravar SAIDA.pdf --base64-de /tmp/b64.txt --esperado 521917
python3 -m gav.drive_io ler    ENTRADA.pdf --para /tmp/b64.txt
```

O transporte pelo MCP tem teto: cada MB de PDF vira ~1,4 MB de base64 no
contexto. Até ~800 KB tranquilo; acima de 2 MB, inviável.

`gravar` confere três coisas: começa com `%PDF`, termina com `%%EOF` e tem
exatamente os bytes que o Drive informou (`--esperado`). As duas últimas é que
pegam truncamento — o cabeçalho sobrevive ao corte, e abrir o documento também
não prova nada, porque o PyMuPDF reconstrói PDF quebrado e abre um arquivo
mutilado sem reclamar.

### Petição — Central de Comandos GAV

**[Central de Comandos GAV](https://claude.ai/code/artifact/af6ab875-3839-4bbb-ac3c-c41c8ee139a3)** — https://claude.ai/code/artifact/af6ab875-3839-4bbb-ac3c-c41c8ee139a3

Fonte em `ferramentas/artefato/central-comandos-gav.html`. Três abas, uma por
skill já pronta — nenhuma delas muda o comportamento das skills/CLIs, só monta
comando ou trecho:

- **Organizador** (`gav-esteira`): as 7 etapas como cards informativos (marcar
  aqui é só acompanhamento visual desta sessão do navegador, não é o
  `dossie.json` real), campo de cliente compartilhado, comando `/gav-esteira`
  pronto, e a busca no Drive (somente leitura, via `mcp` capability).
- **WhatsApp** (`gav-whatsapp`): monta os comandos do
  `ferramentas/whatsapp/baixar.mjs` (sempre `--simular` primeiro) e o
  `/gav-whatsapp`, com o lembrete de como abrir o Chrome com depuração remota.
- **Petição** (`gav-peticao` / `preenchedor-peticoes-gav`): cola o extrato →
  extrai por regex (sem chamada de API, sem chave exposta) → gera os 10
  trechos verbatim da petição padrão para Petição Inicial e + Justiça
  Gratuita → para Parcelamento Avulso, Réplica, coligação ou tese agravante,
  monta o comando certo para o chat em vez de inventar estrutura não
  documentada.

Substitui o uso do `preenchedor_peticao_interativo.jsx` original para o caso
comum — aquele chama a API da Anthropic direto do navegador com uma chave
embutida no código, exposta a quem abrir o arquivo ou inspecionar a rede.
Recomendado rotacionar essa chave.

### Contrato grande na web: o artefato

Acima do teto, o contrato é processado no navegador do usuário:

**Contrato para o PJe** — https://claude.ai/code/artifact/35f23434-fbf4-4aa6-8699-1e6eecd5dad6

Fonte versionada em `ferramentas/artefato/contrato-pje.html`. Divide (sem perda,
no padrão `PARTE 1-3`), comprime (com perda, avisando que apaga a camada de
texto) e extrai faixa de páginas (sem perda, para o RG). Nada sai do navegador.

Para republicar depois de editar o arquivo, passe a URL acima como `url` na
ferramenta Artifact — publicar sem ela cria um artefato separado.

### Nomes de pasta

```bash
python3 -m gav.nomes "83. JANICE BRUTTI - 01 COTA R$ 29.883,63 - 0003701-68.2026.8.17.2730"
```

### Dossiê — o estado da esteira

```bash
python3 -m gav.esteira iniciar --dossie d.json --cliente "NOME" --pasta-id 1abc
python3 -m gav.esteira campo   --dossie d.json --nome cpf --valor "..." --fonte drive:1abc
python3 -m gav.esteira marcar  --dossie d.json --etapa procuracao --status ok --evidencia k=v
python3 -m gav.esteira status  --dossie d.json
python3 -m gav.esteira proxima --dossie d.json
```

### WhatsApp Web

```bash
node ferramentas/whatsapp/baixar.mjs --contato "Janice Brutti" --simular
node ferramentas/whatsapp/baixar.mjs --contato "Janice Brutti" --destino "/.../NÃO USAR"
```

Roda na máquina do usuário, ligando-se ao Chrome já logado. Somente leitura.

## As travas

O núcleo (`gav/nucleo.py`) implementa duas garantias:

**Não pular** — cada etapa declara suas dependências; rodar fora de ordem levanta
`EtapaBloqueada`. Etapa só fica `ok` com evidência anexada.

**Não inventar** — todo campo carrega uma `Fonte` (arquivo, drive, gmail,
whatsapp, usuario) com referência e, quando cabe, página e trecho. Gravar sem
fonte levanta `SemFonte`. Ler campo ausente levanta `SemFonte` em vez de devolver
`None` — quem chamou tem de perguntar, não preencher.

## Testes

```bash
cd ferramentas && python3 testes/test_esteira.py
```

18 testes contra PDFs gerados que imitam a procuração e o contrato reais
(40 páginas, 14 MB, RG escaneado na p.34). Dados fictícios: nenhum documento de
cliente entra no repositório.

Os testes cobrem principalmente as recusas — limpar duas vezes, RG em faixa sem
documento, compressão que não passa na conferência, etapa fora de ordem, campo
sem fonte. É onde a esteira ganha o seu valor: falhar alto em vez de entregar
errado em silêncio.
