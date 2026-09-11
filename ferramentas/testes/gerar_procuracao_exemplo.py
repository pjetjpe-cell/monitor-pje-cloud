"""Gera uma procuração de exemplo com o mesmo layout da real.

Reproduz o que importa para o teste: faixa colorida com o percentual em
destaque, corpo em fundo branco e as declarações I-IV. Nomes e CPF são
fictícios — nenhum dado de cliente real entra no repositório.
"""
import sys
from pathlib import Path

import pymupdf

AZUL = (0.09, 0.16, 0.32)
DOURADO = (0.78, 0.65, 0.36)
CINZA = (0.95, 0.95, 0.93)


def gerar(caminho: str, percentual: str = "VINTE E UM POR CENTO", digitos: str = "21%") -> str:
    doc = pymupdf.open()
    page = doc.new_page(width=595, height=842)  # A4

    # Cabeçalho em faixa escura
    page.draw_rect(pymupdf.Rect(0, 0, 595, 90), color=None, fill=AZUL)
    page.insert_text((40, 45), "DI PALLACIO", fontsize=22, color=(1, 1, 1), fontname="hebo")
    page.insert_text((40, 68), "Amigos, Familia, Advogados e Associados",
                     fontsize=9, color=DOURADO)

    y = 120
    page.insert_text((40, y), "PROCURACAO - INSTRUMENTO PARTICULAR", fontsize=14, fontname="hebo")
    y += 18
    page.insert_text((40, y), "Cliente 999 - 2026", fontsize=9, color=(0.4, 0.4, 0.4))

    y += 32
    page.insert_text((40, y), "OUTORGANTE", fontsize=10, fontname="hebo", color=AZUL)
    y += 16
    page.insert_text((40, y), "MARIA EXEMPLO DA SILVA  CPF: 000.000.000-00", fontsize=9)
    y += 13
    page.insert_text((40, y), "Rua Ficticia, 123, Bairro Teste, Cidade/UF - CEP: 00000-000", fontsize=9)

    y += 28
    page.insert_text((40, y), "OUTORGADOS - DI PALLACIO ENTERPRISE", fontsize=10,
                     fontname="hebo", color=AZUL)
    y += 16
    page.insert_text((40, y), "- Luan Victor de Melo Silva - OAB/PE 64.995", fontsize=9)
    y += 13
    page.insert_text((40, y), "- Gilzielle Veloso Pontes - OAB/PE 55.134", fontsize=9)

    # Faixa colorida com o percentual — o "destaque" a ser removido
    y += 26
    faixa = pymupdf.Rect(30, y, 565, y + 62)
    page.draw_rect(faixa, color=None, fill=CINZA)
    page.insert_text((45, y + 24), f"{percentual} {digitos}", fontsize=15,
                     fontname="hebo", color=AZUL)
    page.insert_text((45, y + 42), "sobre o valor restituido com as devidas correcoes", fontsize=9)
    page.insert_text((45, y + 55),
                     "Meio salario minimo (0,5 SM) devido exclusivamente na data da decisao de "
                     "suspensao das parcelas pelo Juizo.", fontsize=8)
    y += 84

    page.insert_text((40, y), "PODERES CONFERIDOS", fontsize=10, fontname="hebo", color=AZUL)
    y += 16
    for titulo, corpo in [
        ("I - JUDICIAIS (AD JUDICIA)",
         "Representar a outorgante em qualquer juizo, instancia ou tribunal; propor, contestar e"),
        ("II - EXTRAJUDICIAIS (AD NEGOTIA)",
         "Representar a outorgante perante orgaos publicos e privados; requerer certidoes."),
        ("III - ESPECIFICOS",
         "Propor acao de distrato de multipropriedade; requerer suspensao das parcelas contratuais."),
    ]:
        page.insert_text((40, y), titulo, fontsize=9, fontname="hebo")
        y += 12
        page.insert_text((40, y), corpo, fontsize=8.5)
        y += 18

    y += 10
    page.insert_text((40, y), "DECLARACOES DA OUTORGANTE", fontsize=10, fontname="hebo", color=AZUL)
    y += 18
    declaracoes = [
        f"I - Declaro estar ciente dos honorarios de {digitos} ({percentual.lower()}) sobre o valor",
        "restituido com as devidas correcoes, devidos ao final do processo.",
        "II - Declaro estar ciente de que o valor equivalente a meio salario minimo (0,5 SM) sera",
        "devido exclusivamente na data da decisao judicial de suspensao das parcelas pelo Juizo.",
        "III - Declaro ter ciencia de que o processo e o atendimento sao 100% online, sem",
        "necessidade de comparecimento ou audiencia presencial.",
        "IV - Declaro estar ciente de que informacoes relevantes do processo serao repassadas",
        "pela Di PALLACIO, e que terei acesso via link de consulta disponibilizado.",
    ]
    for linha in declaracoes:
        page.insert_text((40, y), linha, fontsize=8.5)
        y += 13

    y += 24
    page.insert_text((40, y), "Cidade/UF, 05 de agosto de 2026", fontsize=9)
    y += 34
    page.draw_line(pymupdf.Point(40, y), pymupdf.Point(260, y), color=(0, 0, 0))
    y += 13
    page.insert_text((40, y), "MARIA EXEMPLO DA SILVA  CPF: 000.000.000-00", fontsize=8.5)

    Path(caminho).parent.mkdir(parents=True, exist_ok=True)
    doc.save(caminho)
    doc.close()
    return caminho


if __name__ == "__main__":
    destino = sys.argv[1] if len(sys.argv) > 1 else "/tmp/procuracao_exemplo.pdf"
    pct = sys.argv[2] if len(sys.argv) > 2 else "VINTE E UM POR CENTO"
    dig = sys.argv[3] if len(sys.argv) > 3 else "21%"
    print(gerar(destino, pct, dig))
