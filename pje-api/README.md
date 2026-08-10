# pje-tjpe-api

Raspador educado de dados públicos do **PJe/TJPE (1º grau)**, usado pelo
agente da Di Pallacio para consultar processos públicos sob demanda e, no
futuro, fazer varredura semanal.

Esta API só consulta, extrai e devolve dados que já são públicos na
Consulta Pública do PJe/TJPE:

```
https://pje.cloud.tjpe.jus.br/1g/ConsultaPublica/listView.seam
```

Ela **não** interpreta juridicamente os movimentos, **não** tenta contornar
segredo de justiça, autenticação ou qualquer bloqueio/verificação de
segurança. É um serviço independente do projeto Next.js deste repositório —
vive inteiramente dentro desta pasta (`pje-api/`) e não altera nada fora
dela.

> **Nota de implementação:** os seletores usados para localizar campos e
> botões do PJe são baseados em texto visível (rótulos, nomes de botões e
> links), para serem resilientes a mudanças nos IDs gerados internamente
> pelo JSF/Seam. Os textos candidatos ficam centralizados no topo de
> `app.py` (`ROTULOS_*`) — se o PJe alterar algum rótulo, ajuste ali. A
> tabela de movimentações é localizada especificamente por
> `table[id$='processoEvento']`, conforme observado na estrutura real do
> PJe/TJPE.

## Stack

- Python 3.12
- FastAPI
- Playwright (Chromium headless)
- Pydantic
- Uvicorn
- Docker

## Rotas

### `GET /health`

Sem autenticação. Usada como health check.

```json
{
  "ok": true,
  "servico": "pje-tjpe-api"
}
```

### `POST /consultar-processo`

Requer header `x-api-key`.

```json
{
  "processo": "0000727-58.2026.8.17.2730"
}
```

Resposta (encontrado):

```json
{
  "ok": true,
  "encontrado": true,
  "dados": {
    "processo": "0000727-58.2026.8.17.2730",
    "orgao_julgador": "1ª Vara Cível da Comarca de Ipojuca",
    "ultima_movimentacao": "07/08/2026 03:04:00 - Decorrido prazo...",
    "movimentacoes": [
      "07/08/2026 03:04:00 - Decorrido prazo...",
      "04/08/2026 23:20:00 - Juntada de Petição..."
    ]
  }
}
```

Resposta (não encontrado):

```json
{ "ok": true, "encontrado": false, "dados": null }
```

Retorna no máximo 200 movimentações, priorizando a tabela cujo `id` termina
em `processoEvento`.

### `POST /consultar-parte`

Requer header `x-api-key`.

```json
{ "termo": "BARBARA CHAVES" }
```

```json
{
  "ok": true,
  "resultados": [
    {
      "processo": "0000727-58.2026.8.17.2730",
      "texto_resultado": "texto público exibido na linha do PJe"
    }
  ]
}
```

Retorna no máximo 100 processos.

### `POST /consultar-advogado`

Requer header `x-api-key`. Mesmo formato de `/consultar-parte`, buscando
pelo campo "Nome do advogado".

```json
{ "termo": "RAPHAEL REIS" }
```

## Autenticação

Todas as rotas `POST` exigem o header `x-api-key`, comparado contra a
variável de ambiente `PJE_API_KEY`. Se a chave estiver ausente ou errada, a
API responde `401`. A chave real nunca deve ser commitada — configure-a
apenas como variável de ambiente (veja `.env.example`).

## Erros

Erros de scraping voltam no formato:

```json
{ "ok": false, "erro": { "codigo": "...", "mensagem": "..." } }
```

| Código                          | Situação                                                       | HTTP |
| -------------------------------- | ---------------------------------------------------------------| ---- |
| `processo_invalido`              | Número de processo fora do padrão CNJ                          | 422  |
| `campo_nao_localizado`           | Campo de busca não encontrado na página                        | 502  |
| `botao_pesquisar_nao_localizado` | Botão "PESQUISAR" não encontrado                                | 502  |
| `sem_link_detalhe`               | Resultado sem link para o detalhe do processo                  | 502  |
| `timeout`                        | Timeout no carregamento da página/AJAX do PJe                  | 504  |
| `layout_alterado`                | Estrutura esperada (ex.: tabela de movimentações) não encontrada | 502  |
| `falha_navegacao`                | Falha ao navegar até a Consulta Pública                        | 502  |
| `erro_interno`                   | Erro inesperado no servidor                                    | 500  |

Processo/parte/advogado não encontrado **não** é um erro: a API responde
`200` com `"encontrado": false` (processo) ou `"resultados": []` (parte/
advogado).

## Rodando localmente

```bash
cd pje-api
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
playwright install --with-deps chromium
export PJE_API_KEY="uma-chave-qualquer-para-teste-local"
uvicorn app:app --host 0.0.0.0 --port 10000 --reload
```

## Deploy no Render

1. No Render, crie um **New Web Service** a partir do repositório:
   - **Repository:** `pjetjpe-cell/monitor-pje-cloud`
   - **Branch:** `pje-tjpe-api`
   - **Root Directory:** `pje-api`
   - **Runtime:** `Docker`
   - **Plan:** `Free`
2. O Render vai detectar `render.yaml` e `Dockerfile` automaticamente dentro
   de `pje-api/`. Se preferir configurar manualmente em vez de usar o
   `render.yaml`, use exatamente os valores acima.
3. Em **Environment**, adicione a variável:
   - `PJE_API_KEY` = (gere uma chave forte, ex.: `openssl rand -hex 32`) —
     **nunca** reaproveite uma chave que já apareceu em algum commit.
4. **Health Check Path:** `/health`
5. Faça o deploy. O serviço vai subir em `https://<nome-do-serviço>.onrender.com`.

## Exemplos de uso (curl)

```bash
export PJE_API_URL="https://pje-tjpe-api.onrender.com"
export PJE_API_KEY="sua-chave-aqui"

# Health check
curl -s "$PJE_API_URL/health"

# Consultar processo
curl -s -X POST "$PJE_API_URL/consultar-processo" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PJE_API_KEY" \
  -d '{"processo": "0000727-58.2026.8.17.2730"}'

# Consultar parte
curl -s -X POST "$PJE_API_URL/consultar-parte" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PJE_API_KEY" \
  -d '{"termo": "BARBARA CHAVES"}'

# Consultar advogado
curl -s -X POST "$PJE_API_URL/consultar-advogado" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $PJE_API_KEY" \
  -d '{"termo": "RAPHAEL REIS"}'
```

## Limites e responsabilidade de uso

- Apenas dados **públicos** da Consulta Pública são acessados.
- Nenhuma tentativa de login, contorno de segredo de justiça ou de
  bloqueios de segurança é feita.
- Uso pretendido: consultas pontuais sob demanda e varredura periódica
  (ex.: semanal) de processos já acompanhados — não para varredura em massa
  ou alta frequência, que pode sobrecarregar o serviço público do TJPE.
