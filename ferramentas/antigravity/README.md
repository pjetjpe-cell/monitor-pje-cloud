# Ponte painel → Antigravity

O **painel** (artefato no claude.ai, gerado de `painel.fonte.html`) é onde você
escolhe a tarefa. O **vigia** (`ponte.mjs vigiar`), no PC do escritório, abre o
Antigravity com ela. Os dois se falam pela **área de transferência**, porque o
artefato não pode abrir conexão com o computador.

```
painel ──(copia pedido assinado)──► área de transferência ──► vigia ──► janela do agy / IDE
```

| Arquivo | Papel |
|---|---|
| `tarefas.json` | lista fechada de tarefas e campos (a única coisa que o painel pode pedir) |
| `nucleo.mjs` | monta o texto do pedido — o mesmo código roda no painel e no vigia |
| `ponte.mjs` | `vigiar`, `token`, `executar`, `verificar` |
| `acordar.ps1` | abre o `agy -i "<pedido>"` (ou a IDE + pedido copiado) numa janela própria |
| `acordar.cmd` | atalho "GAV Antigravity" da Área de Trabalho = acorda o vigia |
| `instalar.ps1` | baixa/atualiza a esteira, oferece instalar o `agy`, cria o atalho, mostra o token |
| `montar-painel.mjs` | gera `painel.html` (o que é publicado como artefato) |

## Segurança
- Pedido = `GAV-AGY1.<base64url JSON>.<HMAC-SHA256>` com o token do PC
  (`%USERPROFILE%\.gav\antigravity-token.txt`). Token errado, pedido com mais
  de 10 min, repetido, tarefa fora da lista ou campo obrigatório vazio: recusado.
- O pedido nunca vira comando: só escolhe tarefa e preenche campos. O `agy` abre
  interativo e sem `--dangerously-skip-permissions`; cada ação pede aprovação.
- As travas da esteira valem lá também (`.agent/rules/gav-esteira.md`).

## Testado e não testado
- Testado na nuvem: assinatura do painel conferida pela ponte (Playwright +
  `verificar`), recusas, vigia em modo teste (`--teste`, lê da entrada padrão),
  montagem do pedido. `node ferramentas/testes/test_antigravity.mjs`.
- **Não testado no Windows:** leitura da área de transferência pelo PowerShell,
  janela própria do `agy`, `instalar.ps1`, e se a versão do `agy` aceita `-i`
  (o `acordar.ps1` deixa o pedido copiado para colar se não aceitar).

## Depois de mudar tarefas ou o painel
`node ferramentas/antigravity/montar-painel.mjs` e republicar `painel.html`.
Mudou o `instalar.ps1`? Commit primeiro: o link do painel aponta para o commit.
