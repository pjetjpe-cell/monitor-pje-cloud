# Monitor PJe Cloud

Sistema de monitoramento do PJe (Processo Judicial Eletrônico) na nuvem.

## Sobre o Projeto

Monitor de disponibilidade e performance dos sistemas PJe do CNJ, permitindo acompanhamento em tempo real do status dos tribunais e instâncias.

## Skills Disponíveis

Este projeto inclui 10 skills especializadas. Use `/nome-da-skill` para invocar:

| Skill | Descrição |
|-------|-----------|
| `/superpowers` | Fluxo estruturado: spec → plan → TDD → review → merge |
| `/frontend-design` | UI com identidade visual forte, não genérica |
| `/webapp-testing` | Testes E2E com Playwright |
| `/firecrawl` | Web scraping e monitoramento de páginas |
| `/web-design-guidelines` | Auditoria de acessibilidade e qualidade visual |
| `/vercel-react-best-practices` | Padrões React/Next.js de performance |
| `/composition-patterns` | APIs de componentes composáveis |
| `/document-skills` | PDF, DOCX, XLSX, PPTX — leitura e geração |
| `/code-reviewer` | Code review sistemático com severidade |
| `/deep-research` | Pesquisa multi-fonte com verificação adversarial |

### Esteira GAV (distrato de multipropriedade)

| Skill | Descrição |
|-------|-----------|
| `/gav-esteira` | Organizador de pastas no Drive, ponta a ponta: localiza o cliente, normaliza a pasta, cria NÃO USAR, limpa a procuração, comprime o contrato, extrai o RG, notifica a GAV |
| `/gav-whatsapp` | Baixa os documentos do cliente no WhatsApp Web e arquiva no Drive |
| `/gav-peticao` | Monta a inicial pelo PREENCHEDOR DE PETIÇÃO INTERATIVO |
| `python3 -m gav.painel` | (CLI, ver `ferramentas/README.md`) Painel geral de processos de Ipojuca: números do Drive → DataJud → vara/fase → planilha |
| `/gav-peticionador` | Inicial/réplica de **cota quitada** pelo PETICIONADOR GAV v41, em navegador headless: dados do cliente, blocos condicionais, prints como figura, HTML/PDF com timbre e PNG de cada página |

**Agente:** `peticionador-gav` (`.claude/agents/`) executa a `gav-peticionador`
isolado: lê a pasta do cliente no Drive, olha prints, gera a peça e confere as
páginas renderizadas.

**Skills da conta** (sincronizadas no claude.ai, não versionadas aqui porque
trazem dados de clientes e o repositório é público): `preenchedor-peticoes-gav`,
`procuracao-dipallacio`, `taxa-operacional-gav`, `honorarios`, além das genéricas
`pdf`, `docx`, `xlsx`, `pptx`. Nada de dado de cliente (dados.json, prints,
peticionador v41, peças geradas) entra no git — fica no scratchpad ou no Drive.

As três se apoiam nos CLIs de `ferramentas/` (ver `ferramentas/README.md`), que
fazem o trabalho mecânico de forma determinística e **conferem o resultado**
antes de aprovar. Duas travas estruturais: etapa não roda fora de ordem e campo
não entra no dossiê sem fonte.

## Stack Técnica

- **Runtime:** Node.js / TypeScript
- **Framework:** Next.js (App Router)
- **UI:** React + Tailwind CSS + shadcn/ui
- **Testes:** Playwright (E2E), Vitest (unit)
- **Deploy:** Cloud (a definir)

## Comandos Úteis

```bash
npm install        # Instalar dependências
npm run dev        # Servidor de desenvolvimento
npm run build      # Build de produção
npm test           # Testes unitários
npx playwright test # Testes E2E
npm run lint       # Linter

cd ferramentas && python3 testes/test_esteira.py   # Testes da esteira GAV
python3 ferramentas/testes/test_imagens.py          # Printar páginas / anexo de prints
python3 ferramentas/testes/test_painel.py           # Painel de processos: DV do CNJ, fases
node --test ferramentas/testes/peticionador.test.mjs  # Executor do peticionador v41
```

## Contexto PJe

O PJe é o sistema de processo judicial eletrônico do CNJ. Os principais endpoints a monitorar são os dos tribunais que utilizam a plataforma. O monitoramento verifica disponibilidade, tempo de resposta e integridade das funcionalidades críticas.
