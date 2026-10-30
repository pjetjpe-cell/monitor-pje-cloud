# Antigravity — executor alternativo no computador do escritório

O Google Antigravity (IDE com agentes, terminal e navegador próprios) é mais uma
forma de executar as tarefas da esteira **no PC do escritório**, ao lado de:

| Executor | Onde roda | Quando usar |
|---|---|---|
| Claude na nuvem + Desktop Commander | nuvem → PC `DESKTOP-TO80D26` | padrão |
| Usuário cola o comando | PowerShell do PC | Desktop Commander offline |
| **Antigravity** | IDE no próprio PC | Desktop Commander offline/instável; tarefa de tela (WhatsApp Web, Drive, Peticionador) que o Claude da nuvem não enxerga; usuário quer só disparar e acompanhar |
| Usuário à mão | navegador | último recurso, seguindo `fluxo-video.md` |

## O que já está pronto no repositório
- `.agent/rules/gav-esteira.md`: as travas (sempre ativas), apontando para as
  mesmas fontes do Claude: `fluxo-video.md` e `.claude/agents/gav-*.md`.
- `.agent/workflows/`: comandos `/gav-missao`, `/gav-coletar`, `/gav-preparar`,
  `/gav-procuracao`, `/gav-peticao`, `/gav-notificar`, `/gav-publicar`. Cada um
  manda ler o agente correspondente e rodar as ferramentas de `ferramentas/`.

Pasta `.agent/` (singular). As versões novas usam `.agents/` como padrão, mas
segundo a documentação do Google ainda leem `.agent/`. **Não testado no PC do
escritório.** Se os comandos não aparecerem ao digitar `/`, copie a pasta para
`.agents/`.

## Montar no PC (uma vez; precisa do "pode" para instalar)
1. Instalar o Antigravity e abrir a pasta do repositório clonado
   (`git clone https://github.com/pjetjpe-cell/monitor-pje-cloud`).
2. Python 3 com `pip install pymupdf`. OCR: Tesseract com o idioma `por`.
   Node para `ferramentas/whatsapp` (`npm install` lá dentro).
3. Configuração do agente: revisão de comandos em **Request review**, não em
   *Always proceed*. JavaScript do navegador também em revisão.
4. Navegador do agente: ele usa um perfil próprio, então é preciso entrar uma
   vez no WhatsApp Web (QR), no Drive com a conta DI PALLACIO e no claude.ai.
   Alternativa: os scripts de `ferramentas/whatsapp` com o Chrome na porta 9222
   (`.claude/skills/gav-whatsapp/SKILL.md`).

## Regras de uso (as mesmas da esteira)
- Envio de e-mail à GAV, compartilhamento, renomear pasta existente e apagar
  continuam exigindo o "pode" do usuário. Nenhum desses passos leva `// turbo`.
- WhatsApp: só leitura e download. Nunca digitar na conversa do cliente.
- Dados de cliente passam pelo modelo do Antigravity (Google). É o mesmo cuidado
  de LGPD de qualquer IA na nuvem. Não mande o contrato a outros sites.

## Como o Claude confere o que o Antigravity fez
O Antigravity não marca etapa sozinho. Ao terminar, ele deixa a prova (saída do
`gav.pasta`, `--verificar`, manifesto do WhatsApp, IDs). O orquestrador do
Claude confere de novo antes de registrar `ok`:
- Drive: `search_files` com `parentId` da pasta → `gav.pasta --lista ... --para upload|compartilhar`.
- Procuração: baixar `01 PROCURAÇÃO.pdf` (≤ ~800 KB pelo MCP) e rodar `--verificar` na nuvem.
- E-mail: `search_threads` em dipallacio@gmail.com (Enviados, para contato@gavresorts.com.br).

Relatório do Antigravity sem essa prova fica como etapa pendente.
