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
```

## Contexto PJe

O PJe é o sistema de processo judicial eletrônico do CNJ. Os principais endpoints a monitorar são os dos tribunais que utilizam a plataforma. O monitoramento verifica disponibilidade, tempo de resposta e integridade das funcionalidades críticas.
