"""Teste ponta a ponta da esteira, com PDFs que imitam os documentos reais.

Roda com: python3 -m pytest ferramentas/testes/test_esteira.py
     ou:  python3 ferramentas/testes/test_esteira.py

Cobre o que a esteira promete: não pula, não inventa, não estraga a prova.
"""

import json
import shutil
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))

import pymupdf  # noqa: E402

from gav import compressao, drive_io, identidade, nomes, procuracao  # noqa: E402
from gav.nucleo import (  # noqa: E402
    Dossie, EtapaBloqueada, Fonte, SemFonte, VerificacaoFalhou, preservar_original,
)
from testes.gerar_contrato_exemplo import gerar as gerar_contrato  # noqa: E402
from testes.gerar_procuracao_exemplo import gerar as gerar_procuracao  # noqa: E402


def _verde(msg): print(f"  ok   {msg}")


# --------------------------------------------------------------------------
# Núcleo: as travas
# --------------------------------------------------------------------------

def test_nao_pula_etapa():
    d = Dossie(tempfile.mktemp(suffix=".json"))
    try:
        d.exigir("procuracao")
        raise AssertionError("deixou rodar procuração sem os pré-requisitos")
    except EtapaBloqueada as e:
        assert "nao_usar" in str(e)
    d.registrar("localizar", "ok", evidencias={"pasta": "x"})
    d.registrar("renomear", "ok", evidencias={"nome": "y"})
    d.registrar("nao_usar", "ok", evidencias={"pasta": "NÃO USAR"})
    d.exigir("procuracao")  # agora libera
    _verde("etapa bloqueia sem pré-requisito e libera com ele")


def test_nao_aceita_campo_sem_fonte():
    d = Dossie(tempfile.mktemp(suffix=".json"))
    for ruim in ["inventei", None, 42]:
        try:
            d.definir("cpf", "000.000.000-00", ruim)
            raise AssertionError(f"aceitou fonte inválida: {ruim!r}")
        except SemFonte:
            pass
    d.definir("cpf", "000.000.000-00", Fonte("drive", "1abc", pagina=1))
    assert d.exigir_campo("cpf") == "000.000.000-00"
    try:
        d.exigir_campo("venda")
        raise AssertionError("devolveu campo inexistente em vez de recusar")
    except SemFonte:
        pass
    _verde("campo exige fonte e campo ausente recusa em vez de chutar")


def test_etapa_ok_exige_evidencia():
    d = Dossie(tempfile.mktemp(suffix=".json"))
    try:
        d.registrar("localizar", "ok")
        raise AssertionError("marcou ok sem evidência")
    except VerificacaoFalhou:
        pass
    _verde("etapa não fica 'ok' sem evidência")


def test_dossie_sobrevive_a_queda_de_sessao():
    caminho = tempfile.mktemp(suffix=".json")
    d = Dossie(caminho)
    d.definir("cliente_nome", "MARIA EXEMPLO", Fonte("drive", "1abc"))
    d.registrar("localizar", "ok", evidencias={"id": "1abc"})
    d.salvar()
    recarregado = Dossie(caminho)
    assert recarregado.obter("cliente_nome") == "MARIA EXEMPLO"
    assert recarregado.status_de("localizar") == "ok"
    assert recarregado.status_de("procuracao") == "pendente"
    _verde("dossiê retoma de onde parou")


# --------------------------------------------------------------------------
# Nomes de pasta
# --------------------------------------------------------------------------

def test_le_nomes_reais_do_drive():
    casos = [
        ("92. KAREN CARDOSO VENTURATO - 01 COTA - 18% - R$ 17.418,84",
         dict(cliente="KAREN CARDOSO VENTURATO", cotas=1, percentual=18, processo=None)),
        ("83. JANICE BRUTTI - 01 COTA R$ 29.883,63 - 0003701-68.2026.8.17.2730",
         dict(cliente="JANICE BRUTTI", cotas=1, processo="0003701-68.2026.8.17.2730")),
        ("79. PORTO 2 LIFE - LUIZ PAULO 30% R$ 29.316,28 1 COTA - 0003460-94.2026.8.17.2730",
         dict(cliente="LUIZ PAULO", empreendimento="PORTO 2 LIFE", percentual=30, cotas=1)),
    ]
    for nome, esperado in casos:
        p = nomes.analisar(nome)
        for campo, valor in esperado.items():
            achado = getattr(p, campo)
            assert achado == valor, f"{nome!r}: {campo} deu {achado!r}, esperava {valor!r}"
    # nome interno nunca leva o número do processo
    r = nomes.normalizar(casos[1][0])
    assert "0003701" in r["nome_externo"] and "0003701" not in r["nome_interno"]
    _verde("nomes reais do Drive lidos e normalizados")


def test_reconhece_variantes_de_nao_usar():
    for v in ["Não usar ", "NAO USAR", "não-usar", "NÃO USAR"]:
        assert nomes.e_pasta_nao_usar(v), v
    for v in ["Arquivos", "Usar", "Documentos"]:
        assert not nomes.e_pasta_nao_usar(v), v
    _verde("variantes de NÃO USAR reconhecidas, outras pastas não")


# --------------------------------------------------------------------------
# Procuração
# --------------------------------------------------------------------------

def test_procuracao_remove_honorarios_e_preserva_o_resto(tmp: Path):
    origem = gerar_procuracao(str(tmp / "assinada.pdf"))
    rel = procuracao.limpar(origem, tmp / "01 - PROCURACAO.pdf")

    texto = "\n".join(p.get_text() for p in pymupdf.open(tmp / "01 - PROCURACAO.pdf"))
    baixo = procuracao._normalizar(texto)

    for proibido in ["por cento", "honorario", "salario minimo", "valor restituido",
                     "devidos ao final do processo", "devidas correcoes"]:
        assert proibido not in baixo, f"sobrou {proibido!r} na procuração limpa"

    for obrigatorio in ["outorgante", "cpf", "poderes conferidos", "oab",
                        "ad judicia", "maria exemplo da silva"]:
        assert obrigatorio in baixo, f"a limpeza comeu {obrigatorio!r}"

    # Poder de requerer suspensão das parcelas é poder, não cláusula de pagamento.
    assert "requerer suspensao das parcelas contratuais" in baixo
    # 100% online não é percentual de honorários.
    assert "100% online" in texto.lower()
    # Declarações III e IV continuam.
    assert "iii - declaro" in baixo and "iv - declaro" in baixo
    assert rel["conferencia"]["limpo"] is True
    _verde("procuração: honorários fora, mandato e assinatura intactos")


def test_procuracao_remove_do_fluxo_de_conteudo_nao_tarja(tmp: Path):
    import re
    import zlib
    dados = (tmp / "01 - PROCURACAO.pdf").read_bytes()
    for m in re.finditer(rb"stream\r?\n(.*?)endstream", dados, re.S):
        try:
            bruto = zlib.decompress(m.group(1))
        except Exception:
            continue
        for termo in [b"POR CENTO", b"honorarios", b"21%"]:
            assert termo not in bruto, f"{termo!r} ainda está no fluxo de conteúdo"
    _verde("texto apagado do conteúdo, não coberto por tarja")


def test_procuracao_recusa_arquivo_ja_limpo(tmp: Path):
    try:
        procuracao.limpar(tmp / "01 - PROCURACAO.pdf", tmp / "duplo.pdf")
        raise AssertionError("gerou um 'limpo' de um arquivo que já estava limpo")
    except VerificacaoFalhou as e:
        assert "nenhuma cláusula" in str(e)
    _verde("recusa limpar de novo em vez de fingir que limpou")


def test_procuracao_funciona_com_outros_percentuais(tmp: Path):
    for extenso, digitos in [("DEZOITO POR CENTO", "18%"), ("TRINTA POR CENTO", "30%")]:
        src = gerar_procuracao(str(tmp / f"p{digitos[:2]}.pdf"), extenso, digitos)
        saida = tmp / f"limpa{digitos[:2]}.pdf"
        procuracao.limpar(src, saida)
        baixo = procuracao._normalizar("\n".join(p.get_text() for p in pymupdf.open(saida)))
        assert "por cento" not in baixo and digitos not in baixo
    _verde("funciona com 18%, 21% e 30% — não só com o caso que virou exemplo")


# --------------------------------------------------------------------------
# Contrato e RG
# --------------------------------------------------------------------------

def test_compressao_atinge_alvo_sem_perder_prova(tmp: Path):
    origem = gerar_contrato(str(tmp / "contrato.pdf"))
    antes = pymupdf.open(origem)
    paginas_antes = antes.page_count
    antes.close()

    rel = compressao.comprimir(origem, tmp / "04.1 - CONTRATO.pdf", alvo_mb=3.0)
    assert rel["atingiu_alvo"], f"não chegou ao alvo: {rel['mb_depois']} MB"
    assert rel["mb_depois"] < 3.0
    assert rel["paginas"] == paginas_antes, "perdeu página"
    assert rel["conferencia"]["texto_preservado"]
    _verde(f"contrato {rel['mb_antes']:.1f} MB -> {rel['mb_depois']:.1f} MB, "
           f"{paginas_antes} páginas intactas")


def test_compressao_reprova_se_a_conferencia_nao_bater(tmp: Path):
    """Exigindo mais texto do que o original tem, a conferência precisa reprovar.

    Usa o contrato grande de propósito: com arquivo já sob o alvo a função só
    copia, e o caminho da conferência nem roda."""
    try:
        compressao.comprimir(tmp / "contrato.pdf", tmp / "x.pdf",
                             alvo_mb=3.0, tolerancia_texto=2.0)  # exige 200% do texto
        raise AssertionError("aceitou saída que não passou na conferência")
    except VerificacaoFalhou as e:
        assert "texto" in str(e), str(e)
    _verde("compressão reprova quando a conferência não bate")


def test_copia_quando_ja_cabe_e_verificada(tmp: Path):
    """Arquivo já sob o alvo é copiado — e a cópia é conferida byte a byte."""
    rel = compressao.comprimir(tmp / "03 - DOC.pdf", tmp / "copia.pdf", alvo_mb=3.0)
    assert rel["degrau"] == "nenhum" and rel["atingiu_alvo"]
    assert rel["conferencia"]["copia_identica"] is True
    assert rel["sha256_entrada"] == rel["sha256_saida"]
    assert (tmp / "copia.pdf").read_bytes() == (tmp / "03 - DOC.pdf").read_bytes()
    _verde("arquivo que já cabe é copiado e a cópia é conferida, não presumida")


def test_rg_encontrado_por_ocr_na_pagina_34(tmp: Path):
    candidatas = identidade.avaliar([tmp / "04.1 - CONTRATO.pdf"], (33, 35))
    vencedora = max(candidatas, key=lambda c: c.pontos)
    assert vencedora.pagina == 34, f"escolheu p.{vencedora.pagina}, o RG está na 34"
    assert vencedora.pontos >= 10, f"pontuação fraca demais: {vencedora.pontos}"
    outras = [c.pontos for c in candidatas if c.pagina != 34]
    assert all(p < vencedora.pontos for p in outras), "empatou com página sem RG"

    rel = identidade.extrair([tmp / "04.1 - CONTRATO.pdf"], tmp / "03 - DOC.pdf", (33, 35))
    assert rel["pagina_escolhida"] == 34
    assert pymupdf.open(tmp / "03 - DOC.pdf").page_count == 1
    _verde(f"RG achado na p.34 por OCR ({vencedora.pontos} pontos contra {outras})")


def test_rg_recusa_quando_nao_ha_documento(tmp: Path):
    try:
        identidade.extrair([tmp / "04.1 - CONTRATO.pdf"], tmp / "x.pdf", (10, 12))
        raise AssertionError("extraiu uma página qualquer como se fosse o RG")
    except VerificacaoFalhou as e:
        assert "nenhuma página" in str(e)
    _verde("recusa extrair RG de faixa que não tem documento de identidade")


def test_rg_numera_paginas_atraves_das_partes(tmp: Path):
    partes = compressao.dividir(tmp / "04.1 - CONTRATO.pdf", tmp / "partes", alvo_mb=1.0)
    assert len(partes) >= 3
    arquivos = [p["arquivo"] for p in partes]
    rel = identidade.extrair(arquivos, tmp / "rg-partes.pdf", (33, 35))
    assert rel["pagina_escolhida"] == 34, "numeração contínua quebrou entre as partes"
    assert "PARTE 3" in rel["arquivo_de_origem"], rel["arquivo_de_origem"]
    assert rel["pagina_no_arquivo"] != 34, "usou a página 34 do arquivo, não do contrato"
    _verde(f"p.34 do contrato = p.{rel['pagina_no_arquivo']} da "
           f"{Path(rel['arquivo_de_origem']).name}")


def test_divisao_nao_perde_pagina(tmp: Path):
    doc = pymupdf.open(tmp / "04.1 - CONTRATO.pdf")
    total = doc.page_count
    doc.close()
    partes = compressao.dividir(tmp / "04.1 - CONTRATO.pdf", tmp / "partes2", alvo_mb=1.0)
    somadas = sum(pymupdf.open(p["arquivo"]).page_count for p in partes)
    assert somadas == total, f"{total} páginas viraram {somadas}"
    _verde(f"divisão preserva as {total} páginas")


# --------------------------------------------------------------------------
# Ponte com o Drive
# --------------------------------------------------------------------------

def test_teto_de_transporte_pelo_mcp():
    """Arquivo grande demais tem de ser recusado ANTES de alguém baixá-lo."""
    cabe_pequeno, _ = drive_io.verificar_tamanho(254_551)      # RG
    cabe_medio, _ = drive_io.verificar_tamanho(1_780_888)      # contrato parte 2
    cabe_grande, msg = drive_io.verificar_tamanho(3_724_220)   # contrato parte 3
    assert cabe_pequeno and cabe_medio and not cabe_grande
    assert "navegador" in msg, "a recusa precisa dizer para onde ir"
    _verde("teto de transporte recusa o contrato e libera os documentos pequenos")


def test_base64_truncado_e_reprovado(tmp: Path):
    """Base64 cortado ainda começa com %PDF — conferir só o cabeçalho passaria."""
    origem = tmp / "01 - PROCURACAO.pdf"
    tamanho = origem.stat().st_size
    completo = drive_io.ler(origem)
    info = drive_io.gravar(tmp / "volta.pdf", completo, esperado=tamanho)
    assert info["paginas"] == 1 and info["conferido_contra_drive"]
    assert (tmp / "volta.pdf").read_bytes() == origem.read_bytes()

    import base64
    truncado = completo[: len(completo) // 3]
    bruto = base64.b64decode(truncado + "=" * (-len(truncado) % 4), validate=False)
    assert bruto.startswith(b"%PDF"), "o teste precisa de um truncado que engane o cabeçalho"

    # Sem o tamanho do Drive: o %%EOF ausente tem de bastar.
    try:
        drive_io.gravar(tmp / "ruim.pdf", truncado)
        raise AssertionError("aceitou base64 truncado sem o tamanho de referência")
    except ValueError as e:
        assert "%%EOF" in str(e), str(e)

    # Com o tamanho do Drive: a recusa é exata.
    try:
        drive_io.gravar(tmp / "ruim2.pdf", truncado, esperado=tamanho)
        raise AssertionError("aceitou base64 truncado contra o tamanho do Drive")
    except ValueError as e:
        assert "truncado" in str(e) and str(tamanho) in str(e), str(e)
    _verde("truncado reprova pelo %%EOF ausente e pelo tamanho do Drive")


# --------------------------------------------------------------------------
# Original preservado
# --------------------------------------------------------------------------

def test_original_nunca_e_sobrescrito(tmp: Path):
    nao_usar = tmp / "NÃO USAR"
    origem = tmp / "assinada.pdf"
    a = preservar_original(origem, nao_usar)
    b = preservar_original(origem, nao_usar)
    assert a.exists() and b.exists() and a != b, "a segunda cópia sobrescreveu a primeira"
    assert a.read_bytes() == origem.read_bytes(), "a cópia difere do original"
    _verde("original preservado sem sobrescrever")


# --------------------------------------------------------------------------

def principal() -> int:
    tmp = Path(tempfile.mkdtemp(prefix="esteira-"))
    falhas = []
    testes = [
        ("núcleo", [test_nao_pula_etapa, test_nao_aceita_campo_sem_fonte,
                    test_etapa_ok_exige_evidencia, test_dossie_sobrevive_a_queda_de_sessao]),
        ("nomes", [test_le_nomes_reais_do_drive, test_reconhece_variantes_de_nao_usar]),
        ("procuração", [test_procuracao_remove_honorarios_e_preserva_o_resto,
                        test_procuracao_remove_do_fluxo_de_conteudo_nao_tarja,
                        test_procuracao_recusa_arquivo_ja_limpo,
                        test_procuracao_funciona_com_outros_percentuais]),
        ("contrato e RG", [test_compressao_atinge_alvo_sem_perder_prova,
                           test_compressao_reprova_se_a_conferencia_nao_bater,
                           test_rg_encontrado_por_ocr_na_pagina_34,
                           test_rg_recusa_quando_nao_ha_documento,
                           test_rg_numera_paginas_atraves_das_partes,
                           test_divisao_nao_perde_pagina,
                           test_copia_quando_ja_cabe_e_verificada]),
        ("ponte com o Drive", [test_teto_de_transporte_pelo_mcp,
                               test_base64_truncado_e_reprovado]),
        ("originais", [test_original_nunca_e_sobrescrito]),
    ]
    try:
        for grupo, funcoes in testes:
            print(f"\n{grupo}")
            for f in funcoes:
                try:
                    f(tmp) if f.__code__.co_argcount else f()
                except Exception as e:
                    falhas.append((f.__name__, e))
                    print(f"  FALHA {f.__name__}: {e}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)

    print()
    if falhas:
        print(f"{len(falhas)} teste(s) falharam.")
        return 1
    total = sum(len(f) for _, f in testes)
    print(f"{total} testes passaram.")
    return 0


if __name__ == "__main__":
    raise SystemExit(principal())
