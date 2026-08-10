"""
pje-tjpe-api — raspador educado de dados públicos do PJe/TJPE (1º grau).

Esta API consulta, extrai e devolve dados públicos disponíveis na Consulta
Pública do PJe/TJPE. Ela NÃO interpreta juridicamente os movimentos, NÃO
tenta contornar segredo de justiça, autenticação ou qualquer bloqueio de
segurança, e só acessa a página de consulta pública oficial.

URL consultada: https://pje.cloud.tjpe.jus.br/1g/ConsultaPublica/listView.seam
"""

from __future__ import annotations

import asyncio
import os
import re
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from playwright.async_api import (
    Browser,
    BrowserContext,
    Locator,
    Page,
    Playwright,
    TimeoutError as PlaywrightTimeoutError,
    async_playwright,
)
from pydantic import BaseModel, Field

# --------------------------------------------------------------------------
# Configuração
# --------------------------------------------------------------------------

PJE_CONSULTA_URL = "https://pje.cloud.tjpe.jus.br/1g/ConsultaPublica/listView.seam"

NAV_TIMEOUT_MS = 45_000
ACAO_TIMEOUT_MS = 20_000
AGUARDAR_AJAX_MS = 1_500
REQUEST_TIMEOUT_S = 90

MAX_MOVIMENTACOES = 200
MAX_RESULTADOS = 100

API_KEY_HEADER = "x-api-key"
API_KEY_ENV_VAR = "PJE_API_KEY"

# Rótulos candidatos usados para localizar campos e botões por texto visível.
# Ficam centralizados aqui para facilitar ajuste caso o PJe altere textos/layout,
# sem precisar mexer na lógica de scraping abaixo.
ROTULOS_TIPO_PESQUISA_PROCESSO = ["Número do Processo", "Numeração Única", "Processo"]
ROTULOS_TIPO_PESQUISA_PARTE = ["Nome da Parte", "Parte"]
ROTULOS_TIPO_PESQUISA_ADVOGADO = ["Nome do Advogado", "Advogado"]

ROTULOS_CAMPO_PROCESSO = ["Numeração única", "Numeração Única", "Número do processo"]
ROTULOS_CAMPO_PARTE = ["Nome da Parte", "Nome da parte"]
ROTULOS_CAMPO_ADVOGADO = ["Nome do advogado", "Nome do Advogado"]

ROTULO_BOTAO_PESQUISAR = "Pesquisar"
ROTULO_LINK_DETALHE = "Detalhe do Processo"

# NPU no padrão CNJ: 0000000-00.0000.0.00.0000
NPU_REGEX = re.compile(r"\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}")

# Uma movimentação válida começa com "DD/MM/AAAA HH:MM:SS -"
MOVIMENTACAO_REGEX = re.compile(r"^\d{2}/\d{2}/\d{4}\s+\d{2}:\d{2}:\d{2}\s*-")

SELETOR_TABELA_MOVIMENTACOES = "table[id$='processoEvento'] tbody tr"


# --------------------------------------------------------------------------
# Erros de domínio
# --------------------------------------------------------------------------


class ErroConsulta(Exception):
    """Erro esperado e classificado que ocorre durante a raspagem."""

    def __init__(self, codigo: str, mensagem: str):
        self.codigo = codigo
        self.mensagem = mensagem
        super().__init__(mensagem)


_STATUS_POR_CODIGO_ERRO = {
    "processo_invalido": 422,
    "campo_nao_localizado": 502,
    "botao_pesquisar_nao_localizado": 502,
    "sem_link_detalhe": 502,
    "timeout": 504,
    "layout_alterado": 502,
    "falha_navegacao": 502,
    "erro_interno": 500,
}


# --------------------------------------------------------------------------
# Modelos (Pydantic)
# --------------------------------------------------------------------------


class ConsultarProcessoRequest(BaseModel):
    processo: str = Field(..., description="Número único do processo, padrão CNJ.")


class ConsultarParteRequest(BaseModel):
    termo: str = Field(..., min_length=2, description="Nome da parte a pesquisar.")


class ConsultarAdvogadoRequest(BaseModel):
    termo: str = Field(..., min_length=2, description="Nome do advogado a pesquisar.")


class DadosProcesso(BaseModel):
    processo: str
    orgao_julgador: Optional[str] = None
    ultima_movimentacao: Optional[str] = None
    movimentacoes: list[str] = Field(default_factory=list)


class ConsultarProcessoResponse(BaseModel):
    ok: bool
    encontrado: bool
    dados: Optional[DadosProcesso] = None


class ResultadoBusca(BaseModel):
    processo: str
    texto_resultado: str


class ConsultarListaResponse(BaseModel):
    ok: bool
    resultados: list[ResultadoBusca]


# --------------------------------------------------------------------------
# Ciclo de vida do navegador (um Chromium compartilhado, um contexto por request)
# --------------------------------------------------------------------------

_playwright: Optional[Playwright] = None
_browser: Optional[Browser] = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _playwright, _browser
    _playwright = await async_playwright().start()
    _browser = await _playwright.chromium.launch(
        headless=True,
        executable_path=os.environ.get("PLAYWRIGHT_CHROMIUM_PATH"),
        args=["--no-sandbox", "--disable-dev-shm-usage"],
    )
    try:
        yield
    finally:
        if _browser is not None:
            await _browser.close()
        if _playwright is not None:
            await _playwright.stop()


app = FastAPI(
    title="pje-tjpe-api",
    description="Raspador educado de dados públicos do PJe/TJPE (Consulta Pública, 1º grau).",
    lifespan=lifespan,
)


def _obter_browser() -> Browser:
    if _browser is None:
        raise ErroConsulta("erro_interno", "Navegador não inicializado.")
    return _browser


# --------------------------------------------------------------------------
# Autenticação
# --------------------------------------------------------------------------


def verificar_api_key(x_api_key: Optional[str] = Header(default=None, alias=API_KEY_HEADER)) -> None:
    chave_esperada = os.environ.get(API_KEY_ENV_VAR)
    if not chave_esperada:
        raise HTTPException(status_code=500, detail=f"{API_KEY_ENV_VAR} não configurada no servidor.")
    if not x_api_key or x_api_key != chave_esperada:
        raise HTTPException(status_code=401, detail="x-api-key ausente ou inválida.")


# --------------------------------------------------------------------------
# Helpers de scraping — todos operam apenas sobre a página pública de consulta
# --------------------------------------------------------------------------


async def _novo_contexto() -> BrowserContext:
    return await _obter_browser().new_context()


async def abrir_consulta(page: Page) -> None:
    try:
        await page.goto(PJE_CONSULTA_URL, wait_until="domcontentloaded", timeout=NAV_TIMEOUT_MS)
    except PlaywrightTimeoutError as exc:
        raise ErroConsulta("timeout", "Timeout ao carregar a página de Consulta Pública do PJe/TJPE.") from exc
    except Exception as exc:  # falha de rede, DNS, etc.
        raise ErroConsulta("falha_navegacao", f"Falha ao navegar até a Consulta Pública: {exc}") from exc


async def _tentar_selecionar_tipo_pesquisa(page: Page, rotulos: list[str]) -> None:
    """
    Melhor esforço: seleciona a aba/rádio/opção de tipo de pesquisa (ex.: "Nome
    da Parte") quando o formulário do PJe exige essa escolha antes de exibir o
    campo de texto correspondente. Não levanta erro se não encontrar nada —
    alguns layouts já exibem o campo certo por padrão, e a falha real (campo
    de texto ausente) é detectada depois, de forma explícita, em
    `localizar_campo`.
    """
    for rotulo in rotulos:
        for role in ("tab", "radio", "link", "button"):
            candidato = page.get_by_role(role, name=re.compile(re.escape(rotulo), re.IGNORECASE))
            try:
                if await candidato.count() > 0:
                    await candidato.first.click(timeout=3_000)
                    await page.wait_for_timeout(500)
                    return
            except Exception:
                continue

        candidato_select = page.locator("select")
        try:
            if await candidato_select.count() > 0:
                await candidato_select.first.select_option(label=rotulo, timeout=3_000)
                await page.wait_for_timeout(500)
                return
        except Exception:
            continue


async def localizar_campo(page: Page, rotulos: list[str]) -> Locator:
    for rotulo in rotulos:
        loc = page.get_by_label(rotulo, exact=False)
        try:
            if await loc.count() > 0:
                return loc.first
        except Exception:
            continue

    for rotulo in rotulos:
        chave = rotulo.lower().replace(" ", "")
        loc = page.locator(f"input[id*='{chave}' i], input[name*='{chave}' i]")
        try:
            if await loc.count() > 0:
                return loc.first
        except Exception:
            continue

    raise ErroConsulta("campo_nao_localizado", f"Não foi possível localizar o campo: {rotulos[0]!r}.")


async def clicar_pesquisar(page: Page) -> None:
    padrao = re.compile(ROTULO_BOTAO_PESQUISAR, re.IGNORECASE)
    candidatos = [
        page.get_by_role("button", name=padrao),
        page.get_by_role("link", name=padrao),
        page.locator("input[type='submit'][value*='Pesquisar' i]"),
        page.locator("button:has-text('Pesquisar')"),
    ]
    for candidato in candidatos:
        try:
            if await candidato.count() > 0:
                await candidato.first.click(timeout=ACAO_TIMEOUT_MS)
                return
        except Exception:
            continue

    raise ErroConsulta("botao_pesquisar_nao_localizado", "Botão 'PESQUISAR' não foi localizado na página.")


async def aguardar_resultado(page: Page) -> None:
    try:
        await page.wait_for_load_state("networkidle", timeout=NAV_TIMEOUT_MS)
    except PlaywrightTimeoutError:
        # Algumas telas do PJe mantêm conexões abertas (long-poll); a ausência
        # de "networkidle" não significa necessariamente que o resultado não
        # chegou, por isso não é tratado como erro fatal aqui.
        pass
    await page.wait_for_timeout(AGUARDAR_AJAX_MS)


async def localizar_linha_processo(page: Page, processo: str) -> Optional[Locator]:
    linha = page.locator("table tbody tr", has_text=processo)
    try:
        if await linha.count() > 0:
            return linha.first
    except Exception:
        pass
    return None


async def abrir_detalhe(page: Page, linha: Locator, context: BrowserContext) -> Page:
    """
    Abre o detalhe do processo a partir da linha de resultado. O PJe pode
    abrir o detalhe na mesma aba ou em um popup — os dois casos são tratados.
    """
    link = linha.get_by_role("link", name=re.compile(ROTULO_LINK_DETALHE, re.IGNORECASE))
    try:
        if await link.count() == 0:
            link = linha.locator("a")
    except Exception:
        link = linha.locator("a")

    try:
        if await link.count() == 0:
            raise ErroConsulta("sem_link_detalhe", "A linha do processo não contém link para o detalhe.")
    except ErroConsulta:
        raise
    except Exception as exc:
        raise ErroConsulta("sem_link_detalhe", "Não foi possível localizar o link de detalhe do processo.") from exc

    link = link.first

    try:
        async with context.expect_page(timeout=5_000) as popup_info:
            await link.click(timeout=ACAO_TIMEOUT_MS)
        popup = await popup_info.value
        await popup.wait_for_load_state("domcontentloaded", timeout=NAV_TIMEOUT_MS)
        return popup
    except PlaywrightTimeoutError:
        # Nenhum popup apareceu: assume-se navegação na mesma aba.
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=NAV_TIMEOUT_MS)
        except PlaywrightTimeoutError as exc:
            raise ErroConsulta("timeout", "Timeout aguardando o detalhe do processo carregar.") from exc
        return page


_ORGAO_JULGADOR_REGEX = re.compile(r"Órgão Julgador\s*:?\s*(.+)", re.IGNORECASE)


async def _extrair_orgao_julgador(page: Page) -> Optional[str]:
    """
    Busca "Órgão Julgador" no texto renderizado da página (em vez de tentar
    subir a árvore do DOM a partir do rótulo) para não depender de como o
    PJe estrutura o HTML ao redor do campo — mais resiliente a mudanças de
    layout do que casar por elemento pai.
    """
    try:
        texto_pagina = await page.locator("body").inner_text(timeout=3_000)
    except Exception:
        return None

    match = _ORGAO_JULGADOR_REGEX.search(texto_pagina)
    if not match:
        return None

    linha = match.group(1).splitlines()[0].strip()
    return linha or None


async def extrair_dados_processo(page: Page, processo: str) -> DadosProcesso:
    tabela = page.locator(SELETOR_TABELA_MOVIMENTACOES)
    try:
        total_linhas = await tabela.count()
    except Exception as exc:
        raise ErroConsulta(
            "layout_alterado",
            "Não foi possível ler a tabela de movimentações. O layout do PJe pode ter mudado.",
        ) from exc

    if total_linhas == 0:
        raise ErroConsulta(
            "layout_alterado",
            "Tabela de movimentações (table[id$='processoEvento']) não foi encontrada no detalhe do processo.",
        )

    movimentacoes: list[str] = []
    for indice in range(total_linhas):
        if len(movimentacoes) >= MAX_MOVIMENTACOES:
            break
        try:
            texto_linha = (await tabela.nth(indice).inner_text(timeout=3_000)).strip()
        except Exception:
            continue
        texto_linha = re.sub(r"\s+", " ", texto_linha).strip()
        if MOVIMENTACAO_REGEX.match(texto_linha):
            movimentacoes.append(texto_linha)

    orgao_julgador = await _extrair_orgao_julgador(page)

    return DadosProcesso(
        processo=processo,
        orgao_julgador=orgao_julgador,
        ultima_movimentacao=movimentacoes[0] if movimentacoes else None,
        movimentacoes=movimentacoes,
    )


async def extrair_resultados_lista(page: Page) -> list[ResultadoBusca]:
    linhas = page.locator("table tbody tr")
    try:
        total_linhas = await linhas.count()
    except Exception as exc:
        raise ErroConsulta(
            "layout_alterado",
            "Não foi possível ler a tabela de resultados. O layout do PJe pode ter mudado.",
        ) from exc

    resultados: list[ResultadoBusca] = []
    for indice in range(total_linhas):
        if len(resultados) >= MAX_RESULTADOS:
            break
        try:
            texto_linha = (await linhas.nth(indice).inner_text(timeout=3_000)).strip()
        except Exception:
            continue
        texto_limpo = re.sub(r"\s+", " ", texto_linha).strip()
        if not texto_limpo:
            continue
        match_npu = NPU_REGEX.search(texto_limpo)
        if not match_npu:
            continue
        resultados.append(ResultadoBusca(processo=match_npu.group(0), texto_resultado=texto_limpo))

    return resultados


# --------------------------------------------------------------------------
# Fluxos de consulta
# --------------------------------------------------------------------------


async def _consultar_processo(processo: str) -> ConsultarProcessoResponse:
    processo = processo.strip()
    if not NPU_REGEX.fullmatch(processo):
        raise ErroConsulta(
            "processo_invalido",
            "Número do processo fora do padrão CNJ (0000000-00.0000.0.00.0000).",
        )

    context = await _novo_contexto()
    try:
        page = await context.new_page()
        page.set_default_timeout(ACAO_TIMEOUT_MS)

        await abrir_consulta(page)
        await _tentar_selecionar_tipo_pesquisa(page, ROTULOS_TIPO_PESQUISA_PROCESSO)

        campo = await localizar_campo(page, ROTULOS_CAMPO_PROCESSO)
        await campo.fill(processo)

        await clicar_pesquisar(page)
        await aguardar_resultado(page)

        linha = await localizar_linha_processo(page, processo)
        if linha is None:
            return ConsultarProcessoResponse(ok=True, encontrado=False, dados=None)

        pagina_detalhe = await abrir_detalhe(page, linha, context)
        try:
            dados = await extrair_dados_processo(pagina_detalhe, processo)
        finally:
            if pagina_detalhe is not page:
                await pagina_detalhe.close()

        return ConsultarProcessoResponse(ok=True, encontrado=True, dados=dados)
    finally:
        await context.close()


async def _buscar_por_termo(
    termo: str,
    rotulos_tipo_pesquisa: list[str],
    rotulos_campo: list[str],
) -> ConsultarListaResponse:
    context = await _novo_contexto()
    try:
        page = await context.new_page()
        page.set_default_timeout(ACAO_TIMEOUT_MS)

        await abrir_consulta(page)
        await _tentar_selecionar_tipo_pesquisa(page, rotulos_tipo_pesquisa)

        campo = await localizar_campo(page, rotulos_campo)
        await campo.fill(termo)

        await clicar_pesquisar(page)
        await aguardar_resultado(page)

        resultados = await extrair_resultados_lista(page)
        return ConsultarListaResponse(ok=True, resultados=resultados)
    finally:
        await context.close()


async def _com_timeout(corrotina):
    try:
        return await asyncio.wait_for(corrotina, timeout=REQUEST_TIMEOUT_S)
    except asyncio.TimeoutError as exc:
        raise ErroConsulta("timeout", "Timeout geral da consulta ao PJe/TJPE.") from exc


# --------------------------------------------------------------------------
# Rotas
# --------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict:
    return {"ok": True, "servico": "pje-tjpe-api"}


@app.post(
    "/consultar-processo",
    response_model=ConsultarProcessoResponse,
    dependencies=[Depends(verificar_api_key)],
)
async def rota_consultar_processo(body: ConsultarProcessoRequest) -> ConsultarProcessoResponse:
    return await _com_timeout(_consultar_processo(body.processo))


@app.post(
    "/consultar-parte",
    response_model=ConsultarListaResponse,
    dependencies=[Depends(verificar_api_key)],
)
async def rota_consultar_parte(body: ConsultarParteRequest) -> ConsultarListaResponse:
    return await _com_timeout(
        _buscar_por_termo(body.termo, ROTULOS_TIPO_PESQUISA_PARTE, ROTULOS_CAMPO_PARTE)
    )


@app.post(
    "/consultar-advogado",
    response_model=ConsultarListaResponse,
    dependencies=[Depends(verificar_api_key)],
)
async def rota_consultar_advogado(body: ConsultarAdvogadoRequest) -> ConsultarListaResponse:
    return await _com_timeout(
        _buscar_por_termo(body.termo, ROTULOS_TIPO_PESQUISA_ADVOGADO, ROTULOS_CAMPO_ADVOGADO)
    )


# --------------------------------------------------------------------------
# Tratamento de erros
# --------------------------------------------------------------------------


@app.exception_handler(ErroConsulta)
async def tratar_erro_consulta(_request, exc: ErroConsulta) -> JSONResponse:
    status = _STATUS_POR_CODIGO_ERRO.get(exc.codigo, 502)
    return JSONResponse(
        status_code=status,
        content={"ok": False, "erro": {"codigo": exc.codigo, "mensagem": exc.mensagem}},
    )


@app.exception_handler(Exception)
async def tratar_erro_inesperado(_request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"ok": False, "erro": {"codigo": "erro_interno", "mensagem": str(exc)}},
    )
