#!/usr/bin/env python3
"""Gera e revisa procurações interativas da DI PALLACIO ENTERPRISE.

Uso:
    python3 gerar_procuracao_dipallacio.py clientes.json --out <pasta>
    python3 gerar_procuracao_dipallacio.py --revisar arquivo.html [--cliente clientes.json]

Cada procuração é um HTML autocontido: o cliente abre no celular, assina com o
dedo e baixa um PDF que é a captura do próprio documento na tela (#docPreview).

Dois modelos:
  padrao     — layout de referência (procuração do Rodolfo, 28/10/2026):
               100% online, CPF, declarações I–VII conforme opções.
  aprimorado — layout "procuração aprimorada" (Sueli, 29/10/2026): RG,
               endereço, telefone, atendimento prioritariamente online,
               quadro-resumo de 3 condições, declarações I–VI.

Nunca editar o HTML gerado à mão: corrigir aqui e regerar.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

SM_2026 = "1.621,00"
MEIO_SM = "810,50"

EQUIPE = [
    ("Luan Victor de Melo Silva", "OAB/PE 64.995"),
    ("Raphael Carlos Pessoa Reis", "OAB/PE 38.377"),
    ("Diogo Serafim de Araújo", "OAB/PE 51.758"),
    ("José Weiden Dutra de Barros", "OAB/PE 63.351-D"),
    ("Aquiles de Souza Albuquerque", "OAB/PE 15.669"),
    ("Gilzielle Veloso Pontes", "OAB/PE 55.134"),
    ("Juliana Virgínia Ferreira da Silva", "OAB/PE 53.673"),
    ("Guilherme Homero de Melo Bondan", "Assistente Jurídico"),
    ("Adauto Juvêncio Gomes", "Assistente Jurídico"),
    ("Sara Maisa Souza Silva", "Coordenadora"),
    ("Edilson Rodrigues", "Subcoordenador"),
]

MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho",
         "agosto", "setembro", "outubro", "novembro", "dezembro"]

UNIDADES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete",
            "oito", "nove", "dez", "onze", "doze", "treze", "quatorze", "quinze",
            "dezesseis", "dezessete", "dezoito", "dezenove"]
DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta",
           "setenta", "oitenta", "noventa"]

ROMANOS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]

OBRIGATORIOS = ["arquivo", "nome", "cidade", "pct", "taxa", "entrada"]
TAXAS = {"meioSM", "umSM", "valorFixo", "sem"}
ENTRADAS = {"sem", "umSM"}


class ErroCliente(ValueError):
    pass


def por_extenso(n: int) -> str:
    if not 0 < n < 100:
        raise ErroCliente(f"percentual fora de 1–99: {n}")
    if n < 20:
        return UNIDADES[n]
    d, u = divmod(n, 10)
    return DEZENAS[d] + ("" if u == 0 else " e " + UNIDADES[u])


def e(txt: str) -> str:
    return html.escape(str(txt), quote=True)


def data_extenso(d: dt.date) -> str:
    return f"{d.day} de {MESES[d.month - 1]} de {d.year}"


def primeiro_nome(nome: str) -> str:
    return re.sub(r"[^A-Z]", "", nome.split()[0].upper()
                  .translate(str.maketrans("ÁÀÂÃÉÊÍÓÔÕÚÇ", "AAAAEEIOOOUC")))


def nome_pdf(c: dict) -> str:
    """Procuracao_Interativa_<NOME>_Cliente_<num>_de_2026_<Empreend>.pdf — número e
    empreendimento são opcionais (procuração original pede só nome e CPF)."""
    partes = ["Procuracao_Interativa", primeiro_nome(c["nome"])]
    if c.get("num"):
        partes += ["Cliente", str(c["num"])]
    partes += ["de", "2026"]
    if c.get("empreend"):
        partes.append(re.sub(r"[^A-Za-z0-9]+", "_", c["empreend"]).strip("_"))
    return "_".join(partes) + ".pdf"


def validar(c: dict) -> None:
    faltam = [k for k in OBRIGATORIOS if c.get(k) in (None, "")]
    if c.get("modelo", "padrao") == "padrao" and not c.get("cpf"):
        faltam.append("cpf")
    if c.get("modelo") == "aprimorado" and not (c.get("cpf") or c.get("rg")):
        faltam.append("cpf ou rg")
    if faltam:
        raise ErroCliente(f"{c.get('nome', '?')}: faltam {', '.join(faltam)}")
    if c["taxa"] not in TAXAS:
        raise ErroCliente(f"{c['nome']}: taxa inválida {c['taxa']!r}")
    if c["entrada"] not in ENTRADAS:
        raise ErroCliente(f"{c['nome']}: entrada inválida {c['entrada']!r}")
    if c["taxa"] == "valorFixo" and not c.get("valorTaxa"):
        raise ErroCliente(f"{c['nome']}: taxa valorFixo sem valorTaxa")
    if bool(c.get("nome2")) != bool(c.get("cpf2")):
        raise ErroCliente(f"{c['nome']}: 2º outorgante precisa de nome2 e cpf2")
    por_extenso(int(c["pct"]))


# ---------------------------------------------------------------- textos

def flex(c: dict) -> dict:
    """Flexões de número (casal) e gênero."""
    casal = bool(c.get("nome2"))
    fem = c.get("genero") == "f" and not casal
    return {
        "casal": casal,
        "o_out": "os outorgantes" if casal else ("a outorgante" if fem else "o outorgante"),
        "O_OUT": "OS OUTORGANTES" if casal else ("A OUTORGANTE" if fem else "O OUTORGANTE"),
        "declaro": "Declaramos" if casal else "Declaro",
        "minha": "nossa" if casal else "minha",
        "me": "nos" if casal else "me",
        "mim": "nós" if casal else "mim",
        "autorizo": "autorizamos" if casal else "autorizo",
        "terei": "teremos" if casal else "terei",
        "couber": "nos couber" if casal else "me couber",
        "cliente": "aos clientes" if casal else ("à cliente" if fem else "ao cliente"),
    }


def texto_taxa(c: dict) -> str:
    t = c["taxa"]
    if t == "sem":
        return ""
    if t == "meioSM":
        valor = "<b>meio salário mínimo (0,5 SM)</b>"
    elif t == "umSM":
        valor = "<b>um salário mínimo (1 SM)</b>"
    else:
        valor = f"<b>R$ {e(c['valorTaxa'])}</b>"
    pre = "O valor de " if t == "valorFixo" else "O valor equivalente a "
    return (f"{pre}{valor} é devido <b>uma única vez</b>, exclusivamente na data da "
            f"decisão judicial de <b>suspensão das parcelas</b> pelo Juízo. ")


def texto_entrada_curto(c: dict) -> str:
    if c["entrada"] == "sem":
        return "<b>Entrada dispensada.</b>"
    return "<b>Entrada de um salário mínimo (1 SM) por cota.</b>"


def declaracoes_padrao(c: dict) -> list[str]:
    f = flex(c)
    d = [
        f"{f['declaro']} estar ciente{'s' if f['casal'] else ''} de que os <b>honorários de êxito</b> contratados "
        "incidem sobre o valor restituído com as devidas correções, na porcentagem indicada acima, "
        "devidos ao final do processo.",
        f"{f['declaro']} estar ciente{'s' if f['casal'] else ''} de que o levantamento dos valores se dará de "
        f"<b>forma segregada</b>: a parte que {f['couber']} será creditada em <b>conta bancária de "
        f"{f['minha']} titularidade</b>, e a parcela correspondente aos honorários será creditada em "
        "<b>conta bancária de titularidade de qualquer um dos advogados outorgados nesta procuração</b>, "
        "cada qual recebendo diretamente o que lhe cabe, mediante expedição de <b>alvarás ou ordens de "
        "pagamento distintos</b>, nos termos do art. 22, §4º, da Lei nº 8.906/94, o que desde já "
        f"{f['autorizo']} requerer.",
    ]
    if c["entrada"] == "sem":
        d.append(f"{f['declaro']} estar ciente{'s' if f['casal'] else ''} de que a <b>taxa de entrada está "
                 "dispensada</b>, sem qualquer valor devido para o ingresso na ação.")
    else:
        d.append(f"{f['declaro']} estar ciente{'s' if f['casal'] else ''} de que é devida <b>entrada de um "
                 "salário mínimo (1 SM) por cota</b> para o ingresso na ação.")
    if c.get("multa70"):
        d.append(f"{f['declaro']} estar ciente{'s' if f['casal'] else ''} de que sobre eventuais <b>multas "
                 "contratuais</b> obtidas na ação incidirão honorários de <b>70% (setenta por cento)</b>.")
    d += [
        f"{f['declaro']} estar ciente{'s' if f['casal'] else ''} de que, havendo proposta de <b>acordo "
        f"extrajudicial</b>, esta {f['me']} será previamente comunicada, cabendo <b>exclusivamente a "
        f"{f['mim']}</b> a decisão de aceitá-la ou recusá-la, e que, uma vez aceita, incidirá sobre o valor "
        "acordado o <b>mesmo percentual de honorários contratado</b>, com pagamento igualmente "
        f"<b>segregado</b> — {f['minha']} parte em conta de {f['minha']} titularidade e os honorários em "
        "conta de qualquer um dos advogados outorgados.",
        f"{f['declaro']} ter ciência de que o processo e o atendimento são <b>100% online</b>, sem "
        "necessidade de comparecimento ou audiência presencial.",
        f"{f['declaro']} estar ciente{'s' if f['casal'] else ''} de que informações relevantes do processo "
        f"serão repassadas pela <b>Di PALLACIO</b>, e que {f['terei']} acesso via <b>link de consulta</b> "
        "disponibilizado.",
    ]
    return d


def poderes_padrao(c: dict) -> list[tuple[str, str]]:
    f = flex(c)
    negocia = (f"Representar {f['o_out']} perante órgãos públicos e privados; requerer certidões e "
               "documentos; firmar contratos, distratos e rescisões; efetuar e receber pagamentos; "
               "assinar documentos e requerimentos")
    if c.get("comOperacao"):
        negocia += ("; praticar atos de gestão administrativa de cotas com vencimento iminente, "
                    "no prazo de até 3 (três) meses")
    return [
        ("I — JUDICIAIS (AD JUDICIA)",
         f"Representar {f['o_out']} em qualquer juízo, instância ou tribunal; propor, contestar e "
         "acompanhar ações; requerer tutelas de urgência, liminares e antecipações de tutela; produzir "
         "provas; receber citações e intimações; recorrer, transigir e acordar; firmar acordos judiciais e "
         f"extrajudiciais mediante prévia anuência d{f['o_out'][0:2].strip()} outorgante{'s' if f['casal'] else ''}; "
         "requerer o destaque dos honorários contratuais e a expedição de alvarás ou ordens de pagamento "
         "distintos, creditando-se os honorários em conta de qualquer um dos advogados outorgados e o "
         f"saldo em conta de titularidade d{f['o_out'][0:2].strip()} outorgante{'s' if f['casal'] else ''}."),
        ("II — EXTRAJUDICIAIS (AD NEGOTIA)", negocia + "."),
        ("III — ESPECÍFICOS",
         "Propor ação de distrato de multipropriedade; requerer rescisão contratual e restituição de "
         "valores pagos; requerer suspensão das parcelas contratuais; declarar nulidade de cláusulas "
         "abusivas; requerer cessação de cobranças e exclusão de cadastros de inadimplentes; receber "
         "depósitos judiciais; substabelecer no todo ou em parte."),
    ]


# ---------------------------------------------------------------- CSS / JS

CSS = r"""
:root{--papel:#F7F0E0;--navy:#0D1F3C;--ouro:#B8963E;--ouro2:#D4AF6A;--linha:#C9B97A;--tinta:#1d1d1d;--cinza:#5b5b5b}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#e9e3d3}
body{font-family:'Crimson Text',Georgia,serif;color:var(--tinta);-webkit-text-size-adjust:100%;padding-bottom:96px}
#docPreview{max-width:820px;margin:0 auto;background:var(--papel);position:relative;overflow:hidden}
.wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:0}
.wm span{font-family:'Playfair Display',serif;font-size:110px;letter-spacing:12px;color:rgba(184,150,62,.07);transform:rotate(-30deg);white-space:nowrap}
.cab{background:var(--navy);border-top:4px solid var(--ouro);display:flex;align-items:center;justify-content:space-between;padding:18px 22px;position:relative;z-index:1}
.marca small{display:block;font-family:Inter,sans-serif;font-size:10px;letter-spacing:4px;color:var(--ouro2)}
.marca b{font-family:'Playfair Display',serif;font-size:26px;letter-spacing:1.5px;color:#fff;font-weight:700}
.marca i{display:block;font-family:Inter,sans-serif;font-style:normal;font-size:9.5px;color:#9aa6bb;margin-top:4px}
.estrela{color:var(--ouro);font-size:16px}
.cab .dir{font-family:Inter,sans-serif;font-size:11px;letter-spacing:1px;color:#9aa6bb;text-align:right;line-height:1.7}
.cab .dir.ouro{color:var(--ouro2);font-weight:600;letter-spacing:.5px}
.corpo{padding:22px 22px 28px;position:relative;z-index:1}
.titulo{text-align:center;padding:14px 0 12px;border-top:1px solid var(--linha);border-bottom:1px solid var(--linha);margin:0 0 22px}
.titulo h1{font-family:'Playfair Display',serif;color:var(--navy);font-size:24px;letter-spacing:5px}
.titulo p{font-family:Inter,sans-serif;font-size:10.5px;letter-spacing:3px;color:var(--ouro);margin-top:3px}
.info{background:var(--navy);border-left:3px solid var(--ouro);padding:9px 14px;margin-bottom:9px}
.info b{display:block;font-family:Inter,sans-serif;font-size:10.5px;color:var(--ouro2)}
.info span{font-family:Inter,sans-serif;font-size:12px;color:#fff}
.info.centro{text-align:center;border:1px solid var(--ouro);border-left-width:1px}
.rotulo{font-family:Inter,sans-serif;font-size:10.5px;letter-spacing:3px;color:var(--ouro);border-bottom:1px solid var(--linha);padding-bottom:4px;margin:22px 0 10px;font-weight:600}
.campo small{display:block;font-family:Inter,sans-serif;font-size:10px;letter-spacing:1.5px;color:var(--cinza);margin-top:6px}
.campo div{font-family:'Playfair Display',serif;font-size:17px;color:var(--navy);font-weight:600}
.campo p{font-size:15px;margin-top:3px}
.par{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}
.hipo{border:1px solid var(--linha);background:rgba(255,255,255,.35);padding:10px 14px;font-size:14px;line-height:1.55;margin:6px 0 4px}
.equipe{list-style:none;columns:1}
.equipe.duas{columns:2;column-gap:24px}
.equipe li{font-size:15px;padding:3px 0;break-inside:avoid}
.equipe li:before{content:'— ';color:var(--ouro)}
.equipe li small{font-family:Inter,sans-serif;font-size:11px;color:var(--cinza)}
.nota{border:1px solid var(--linha);background:rgba(255,255,255,.3);padding:9px 13px;font-family:Inter,sans-serif;font-size:11px;color:var(--cinza);line-height:1.6;margin-top:12px}
.sep{text-align:center;color:var(--linha);letter-spacing:10px;margin:14px 0 4px;font-size:12px}
.hon{border:1.5px solid var(--ouro);padding:16px 22px;margin:18px 0 16px;background:rgba(255,255,255,.18)}
.hon .pct{font-family:'Playfair Display',serif;font-size:40px;color:var(--navy);font-weight:700;line-height:1}
.hon .ext{font-family:Inter,sans-serif;font-size:11px;letter-spacing:.6px;color:var(--navy);margin-top:4px}
.hon .sobre{font-family:Inter,sans-serif;font-size:11px;color:var(--cinza)}
.hon .cond{border-left:2px solid var(--ouro);padding-left:12px;margin-top:12px;font-style:italic;font-size:15px;line-height:1.55}
.hon .cond b{color:var(--navy)}
.quadro{display:grid;grid-template-columns:1fr 1fr;border:1.5px solid var(--ouro);margin:18px 0 6px}
.quadro>div{padding:16px 18px;border-right:1px solid var(--ouro);border-bottom:1px solid var(--ouro)}
.quadro>div:nth-child(2n){border-right:0}
.quadro>div:nth-child(n+3){border-bottom:0}
.quadro small{font-family:Inter,sans-serif;font-size:10px;letter-spacing:1px;color:var(--cinza)}
.quadro strong{display:block;font-family:'Playfair Display',serif;font-size:24px;color:var(--navy);line-height:1.15;margin:3px 0}
.quadro p{font-size:14px;line-height:1.4}
ol.dec{list-style:none;margin:6px 0}
ol.dec li{display:flex;gap:14px;font-size:15.5px;line-height:1.75;margin-bottom:8px;text-align:justify}
ol.dec li em{font-style:normal;font-family:'Playfair Display',serif;color:var(--ouro);min-width:22px;font-size:15px}
.pod h4{font-family:Inter,sans-serif;font-size:10.5px;letter-spacing:.8px;color:var(--navy);margin:12px 0 4px}
.pod p{border-left:1px solid var(--linha);padding-left:12px;font-size:15.5px;line-height:1.8;text-align:justify}
.local{border-top:1.5px solid var(--linha);margin-top:26px;padding-top:16px;text-align:center;font-family:Inter,sans-serif;font-size:13px;color:#444}
.ass{margin-top:16px}
.ass .rot{font-family:Inter,sans-serif;font-size:10.5px;letter-spacing:2.5px;color:var(--ouro);margin-bottom:6px}
.ass canvas{display:block;width:100%;max-width:560px;height:120px;border:1.5px solid var(--linha);border-radius:4px;background:#FBF7EE;touch-action:none}
.ass button{margin-top:8px;font-family:Inter,sans-serif;font-size:12px;padding:6px 16px;border:1.5px solid var(--linha);border-radius:4px;background:transparent;color:#444;cursor:pointer}
.ass .quem{font-family:Inter,sans-serif;font-size:12px;color:#333;margin-top:6px}
.ass .st{font-family:Inter,sans-serif;font-size:11px;color:#8b8b8b}
.ass .st.ok{color:#2f6b3a}
.rod{background:var(--navy);border-bottom:4px solid var(--ouro);text-align:center;padding:12px;font-family:Inter,sans-serif;font-size:10.5px;letter-spacing:1px;color:#8d97ab;position:relative;z-index:1}
.rod i{font-style:normal;color:var(--ouro2);font-size:8.5px}
.barra{position:fixed;left:0;right:0;bottom:0;background:rgba(13,31,60,.97);padding:12px 16px;display:flex;justify-content:center;z-index:50}
#pdfBtn{font-family:Inter,sans-serif;font-weight:600;font-size:15px;letter-spacing:.5px;background:var(--ouro);color:var(--navy);border:0;border-radius:6px;padding:13px 26px;width:100%;max-width:420px;cursor:pointer}
#pdfBtn[disabled]{opacity:.6}
@media (max-width:560px){.equipe.duas{columns:1}.quadro{grid-template-columns:1fr}.quadro>div{border-right:0!important;border-bottom:1px solid var(--ouro)!important}.quadro>div:last-child{border-bottom:0!important}.par{grid-template-columns:1fr}.hon .pct{font-size:34px}}
"""

JS = r"""
(function(){
  var CFG = __CFG__;
  var assinou = {};
  function setupSig(n){
    var cv = document.getElementById('sigCanvas' + n);
    var ctx = cv.getContext('2d');
    var desenhando = false, ultimo = null;
    function ajustar(){
      var r = cv.getBoundingClientRect();
      var copia = assinou[n] ? cv.toDataURL() : null;
      cv.width = Math.round(r.width * 2); cv.height = Math.round(r.height * 2);
      ctx.setTransform(1,0,0,1,0,0); ctx.scale(2,2);
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#0D1F3C';
      if (copia) { var im = new Image(); im.onload = function(){ ctx.drawImage(im, 0, 0, r.width, r.height); }; im.src = copia; }
    }
    function pos(ev){
      var r = cv.getBoundingClientRect();
      var p = ev.touches && ev.touches.length ? ev.touches[0] : ev;
      return { x: p.clientX - r.left, y: p.clientY - r.top };
    }
    function inicio(ev){ ev.preventDefault(); desenhando = true; ultimo = pos(ev); ctx.beginPath(); ctx.arc(ultimo.x, ultimo.y, 1.1, 0, Math.PI*2); ctx.fillStyle = '#0D1F3C'; ctx.fill(); marcar(true); }
    function mover(ev){ if (!desenhando) return; ev.preventDefault(); var p = pos(ev); ctx.beginPath(); ctx.moveTo(ultimo.x, ultimo.y); ctx.lineTo(p.x, p.y); ctx.stroke(); ultimo = p; }
    function fim(ev){ if (desenhando && ev) ev.preventDefault(); desenhando = false; }
    function marcar(v){
      assinou[n] = v;
      var st = document.getElementById('sigStatus' + n);
      st.textContent = v ? 'Assinado' : 'Assinatura pendente';
      st.className = 'st' + (v ? ' ok' : '');
    }
    cv.addEventListener('mousedown', inicio, {passive:false});
    cv.addEventListener('mousemove', mover, {passive:false});
    window.addEventListener('mouseup', fim, {passive:false});
    cv.addEventListener('touchstart', inicio, {passive:false});
    cv.addEventListener('touchmove', mover, {passive:false});
    cv.addEventListener('touchend', fim, {passive:false});
    cv.addEventListener('touchcancel', fim, {passive:false});
    document.getElementById('sigClear' + n).addEventListener('click', function(){
      var r = cv.getBoundingClientRect(); ctx.clearRect(0, 0, r.width, r.height); marcar(false);
    });
    ajustar(); marcar(false);
    window.addEventListener('resize', ajustar);
  }
  for (var i = 1; i <= CFG.assinaturas; i++) setupSig(i);

  function baixar(blob){
    var nome = CFG.pdf;
    try {
      var arq = new File([blob], nome, {type: 'application/pdf'});
      if (navigator.canShare && navigator.canShare({files: [arq]}) && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        return navigator.share({files: [arq], title: nome}).catch(function(){ salvar(blob, nome); });
      }
    } catch (err) {}
    salvar(blob, nome);
  }
  function salvar(blob, nome){
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nome; a.style.display = 'none';
    document.body.appendChild(a); a.click();
    setTimeout(function(){
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) window.open(url, '_blank');
      document.body.removeChild(a);
    }, 400);
    setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
  }

  async function gerarPDF(){
    for (var i = 1; i <= CFG.assinaturas; i++) {
      if (!assinou[i]) { alert(CFG.assinaturas > 1 ? 'Faltam assinaturas: assine nos ' + CFG.assinaturas + ' quadros antes de baixar.' : 'Assine no quadro antes de baixar o PDF.'); return; }
    }
    var btn = document.getElementById('pdfBtn');
    btn.disabled = true; btn.textContent = 'Gerando PDF...';
    try {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      var orig = document.getElementById('docPreview');
      var clone = orig.cloneNode(true);
      clone.id = 'docPreviewClone';
      clone.style.width = '820px'; clone.style.maxWidth = '820px';
      var caixa = document.createElement('div');
      caixa.style.cssText = 'position:fixed;left:-10000px;top:0;width:820px;background:#F7F0E0';
      caixa.appendChild(clone); document.body.appendChild(caixa);
      clone.querySelectorAll('.ass button').forEach(function(b){ b.style.display = 'none'; });
      var hoje = new Date();
      clone.querySelectorAll('.st').forEach(function(s){ s.textContent = 'Assinado eletronicamente em ' + hoje.toLocaleDateString('pt-BR') + ' às ' + hoje.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}); s.className = 'st ok'; });
      for (var k = 1; k <= CFG.assinaturas; k++) {
        var src = document.getElementById('sigCanvas' + k);
        var dst = clone.querySelector('#sigCanvas' + k);
        dst.id = 'sigCanvasClone' + k;
        var w = 560, h = 120;
        dst.width = w * 2; dst.height = h * 2; dst.style.width = w + 'px'; dst.style.height = h + 'px';
        var c2 = dst.getContext('2d');
        c2.fillStyle = '#FBF7EE'; c2.fillRect(0, 0, dst.width, dst.height);
        var esc = Math.min(dst.width / src.width, dst.height / src.height);
        var dw = src.width * esc, dh = src.height * esc;
        c2.drawImage(src, 0, 0, src.width, src.height, 0, 0, dw, dh);
      }
      // pontos de corte: fim de cada bloco fora de quadro indivisível, medidos na
      // mesma cópia que o html2canvas desenha (onclone), para não haver deriva
      var ATOMICOS = '.hon,.quadro,.ass,.info,.par,.hipo,.titulo,.cab,.campo,.rod';
      var cortesCss = [], alturaCss = 0;
      var canvas = await html2canvas(clone, {scale: 2, useCORS: true, backgroundColor: '#F7F0E0', windowWidth: 820,
        onclone: function(doc){
          var raiz = doc.getElementById('docPreviewClone');
          var rr = raiz.getBoundingClientRect(); alturaCss = rr.height;
          raiz.querySelectorAll('li,p,h4,.info,.rotulo,.ass,.hon,.quadro,.local,.campo,.par,.hipo,.sep,.titulo,.cab,.nota').forEach(function(el){
            if (el.parentElement && el.parentElement.closest(ATOMICOS)) return;
            cortesCss.push(el.getBoundingClientRect().bottom - rr.top);
          });
        }});
      document.body.removeChild(caixa);
      var fator = canvas.height / alturaCss;
      var cortes = cortesCss.map(function(v){ return Math.round(v * fator) + 6; }).sort(function(a, b){ return a - b; });
      var jsPDF = window.jspdf.jsPDF;
      var pdf = new jsPDF({orientation: 'p', unit: 'mm', format: 'a4', compress: true});
      var pw = 210, ph = 297;
      var pxPorPagina = Math.floor(canvas.width * ph / pw);
      var y = 0, pagina = 0;
      while (y < canvas.height) {
        var altura = Math.min(pxPorPagina, canvas.height - y);
        if (y + altura < canvas.height) {
          var melhor = 0;
          cortes.forEach(function(cy){ if (cy > y + pxPorPagina * 0.5 && cy <= y + pxPorPagina) melhor = cy; });
          if (melhor) altura = melhor - y;
        }
        var fatia = document.createElement('canvas');
        fatia.width = canvas.width; fatia.height = altura;
        var fc = fatia.getContext('2d');
        fc.fillStyle = '#F7F0E0'; fc.fillRect(0, 0, fatia.width, fatia.height);
        fc.drawImage(canvas, 0, y, canvas.width, altura, 0, 0, canvas.width, altura);
        if (pagina > 0) pdf.addPage();
        pdf.setFillColor(247, 240, 224); pdf.rect(0, 0, pw, ph, 'F');
        pdf.addImage(fatia.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, altura * pw / canvas.width);
        y += altura; pagina++;
      }
      baixar(pdf.output('blob'));
      btn.textContent = 'PDF gerado — baixar novamente';
    } catch (err) {
      alert('Não foi possível gerar o PDF: ' + (err && err.message ? err.message : err));
      btn.textContent = 'Assinar e baixar PDF';
    } finally {
      btn.disabled = false;
    }
  }
  document.getElementById('pdfBtn').addEventListener('click', gerarPDF);
})();
"""


# ---------------------------------------------------------------- montagem

def bloco_assinatura(n: int, rotulo: str, quem: str) -> str:
    return (f'<div class="ass"><div class="rot">{e(rotulo)}</div>'
            f'<canvas id="sigCanvas{n}" aria-label="Quadro de assinatura"></canvas>'
            f'<button type="button" id="sigClear{n}">Limpar</button>'
            f'<div class="quem">{quem}</div>'
            f'<div class="st" id="sigStatus{n}">Assinatura pendente</div></div>')


def montar_padrao(c: dict, hoje: dt.date) -> str:
    f = flex(c)
    pct = int(c["pct"])
    outorgante = (
        f'<div class="campo"><small>NOME COMPLETO</small><div>{e(c["nome"])}</div>'
        f'<small>CPF</small><div>{e(c["cpf"])}</div></div>')
    if f["casal"]:
        outorgante = (
            '<div class="par">'
            f'<div class="campo"><small>1º OUTORGANTE</small><div>{e(c["nome"])}</div>'
            f'<small>CPF</small><div>{e(c["cpf"])}</div></div>'
            f'<div class="campo"><small>2ª OUTORGANTE</small><div>{e(c["nome2"])}</div>'
            f'<small>CPF</small><div>{e(c["cpf2"])}</div></div></div>')
    hipo = ""
    if c.get("hipo"):
        hipo = (f'<div class="hipo"><b>Declaração de hipossuficiência econômica.</b> {f["declaro"]}, sob as '
                f'penas da lei (art. 299 do Código Penal), não possuir condições de arcar com as custas '
                f'processuais e honorários sem prejuízo do sustento próprio e da família, nos termos dos '
                f'arts. 98 a 102 do Código de Processo Civil e da Lei nº 1.060/50.</div>')
    equipe = "".join(f"<li>{e(n)} <small>{e(q)}</small></li>" for n, q in EQUIPE)
    decl = "".join(f"<li><em>{ROMANOS[i]}</em><span>{t}</span></li>"
                   for i, t in enumerate(declaracoes_padrao(c)))
    pod = "".join(f"<h4>{e(t)}</h4><p>{e(x)}</p>" for t, x in poderes_padrao(c))
    assin = bloco_assinatura(1, "ASSINATURA DO 1º OUTORGANTE" if f["casal"] else "ASSINATURA DO OUTORGANTE"
                             if c.get("genero") != "f" else "ASSINATURA DA OUTORGANTE",
                             f'{e(c["nome"])} — CPF: {e(c["cpf"])}')
    if f["casal"]:
        assin += bloco_assinatura(2, "ASSINATURA DA 2ª OUTORGANTE", f'{e(c["nome2"])} — CPF: {e(c["cpf2"])}')
    return f"""
<div class="cab"><div class="marca"><small>D I</small><b>PALLACIO</b></div><div class="estrela">&#10022;</div>
<div class="dir">Amigos, Família<br>Advogados e Associados</div></div>
<div class="corpo">
<div class="titulo"><h1>PROCURAÇÃO</h1><p>INSTRUMENTO PARTICULAR COM PODERES ESPECÍFICOS</p></div>
<div class="info"><b>100% Online</b><span>Processo e atendimento integralmente digital — sem audiência presencial.</span></div>
<div class="info"><b>Comunicação Direta</b><span>Informações relevantes e decisões serão repassadas de forma clara.</span></div>
<div class="info"><b>Acesso ao Processo</b><span>Link de consulta e acompanhamento disponibilizado ao cliente.</span></div>
<div class="rotulo">{"OUTORGANTES" if f["casal"] else "OUTORGANTE"}</div>
{hipo}{outorgante}
<div class="sep">· · ·</div>
<div class="rotulo">OUTORGADOS — DI PALLACIO ENTERPRISE</div>
<ul class="equipe">{equipe}</ul>
<p class="nota">A outorga é feita à <b>DI PALLACIO</b>, da qual o advogado signatário é membro integrante; os poderes privativos da advocacia cabem exclusivamente aos profissionais inscritos na OAB.</p>
<div class="sep">· · ·</div>
<div class="hon"><div class="pct">{pct}%</div>
<div class="ext">{por_extenso(pct).upper()} POR CENTO · HONORÁRIO DE ÊXITO</div>
<div class="sobre">sobre o valor restituído com correções</div>
<div class="cond">{texto_taxa(c)}{texto_entrada_curto(c)}</div></div>
<ol class="dec">{decl}</ol>
<div class="sep">· · ·</div>
<div class="rotulo">PODERES CONFERIDOS</div>
<div class="pod">{pod}</div>
<div class="local">{e(c["cidade"])} — {data_extenso(hoje)}</div>
{assin}
</div>
<div class="rod">Di PALLACIO Enterprise · <i>Amigos, Família, Advogados e Associados</i></div>"""


def montar_aprimorado(c: dict, hoje: dt.date) -> str:
    """Modelo da procuração aprimorada (Sueli, 29/10/2026), com textos do original."""
    f = flex(c)
    pct = int(c["pct"])
    art = "a" if c.get("genero") == "f" else "o"
    O = f"{art} OUTORGANTE"
    doc = f'CPF {e(c["cpf"])}' if c.get("cpf") else f'RG nº {e(c["rg"])}'
    extras = ""
    if c.get("endereco"):
        extras += f'<p><b>Endereço:</b> {e(c["endereco"])}</p>'
    if c.get("telefone"):
        extras += f'<p><b>Telefone celular:</b> {e(c["telefone"])}</p>'
    equipe = "".join(f"<li><b>{e(n)}</b> <small>{e(q)}</small></li>" for n, q in EQUIPE)
    if c["taxa"] == "meioSM":
        fixa, fixa_txt = "0,5 SALÁRIO MÍNIMO", "devido uma única vez após decisão judicial de suspensão das parcelas"
    elif c["taxa"] == "umSM":
        fixa, fixa_txt = "1 SALÁRIO MÍNIMO", "devido uma única vez após decisão judicial de suspensão das parcelas"
    elif c["taxa"] == "valorFixo":
        fixa, fixa_txt = f"R$ {e(c['valorTaxa'])}", "devido uma única vez após decisão judicial de suspensão das parcelas"
    else:
        fixa, fixa_txt = "NÃO HÁ", "nenhuma parcela fixa nesta contratação"
    if c["entrada"] == "sem":
        ent, ent_txt = "DISPENSADA", "nenhum valor devido para ingresso na ação"
        dec3 = ("A entrada está dispensada, observando-se a condição de exigibilidade e a unicidade de "
                "pagamento previstas no quadro-resumo, sem nova cobrança da mesma parcela fixa no âmbito desta "
                "contratação após sua quitação.")
    else:
        ent, ent_txt = "1 SALÁRIO MÍNIMO", "por cota, para ingresso na ação"
        dec3 = ("É devida entrada de um salário mínimo por cota, observando-se a condição de exigibilidade e a "
                "unicidade de pagamento previstas no quadro-resumo.")
    decl = [
        "Estou ciente das condições econômico-contratuais constantes exclusivamente do quadro financeiro "
        "da primeira página deste instrumento.",
        "O valor principal da restituição que me couber será creditado exclusivamente em conta bancária de "
        "minha titularidade, e os honorários serão pagos separadamente em conta de titularidade de advogado "
        "outorgado, por alvarás ou ordens de pagamento distintos, nos termos do art. 22, § 4º, da Lei nº "
        "8.906/94.",
        dec3,
        "Qualquer proposta de acordo judicial ou extrajudicial será previamente comunicada a mim, cabendo "
        "exclusivamente a mim aceitar ou recusar. Em caso de acordo, o pagamento continuará segregado entre "
        "principal e honorários.",
        "O atendimento e a tramitação documental serão realizados prioritariamente por meios digitais, sem "
        "afastar atos presenciais que venham a ser determinados judicialmente.",
        "As informações relevantes sobre o processo serão repassadas pela Di Pallacio, e poderei acompanhar "
        "sua tramitação pelos meios de consulta disponibilizados.",
    ]
    decl_html = "".join(f"<li><em>{ROMANOS[i]}</em><span>{e(t)}</span></li>" for i, t in enumerate(decl))
    pod = [
        ("I - JUDICIAIS (AD JUDICIA)",
         f"Representar {O} em qualquer juízo, instância ou tribunal; propor, contestar e acompanhar ações; "
         "requerer tutelas de urgência, liminares e antecipações de tutela; produzir provas; receber citações "
         f"e intimações; recorrer; e firmar acordos somente mediante prévia anuência d{O}. Requerer destaque "
         "dos honorários contratuais e alvarás ou ordens de pagamento distintos, destinando-se o principal "
         f"exclusivamente {f['cliente']} e os honorários aos advogados."),
        ("II - EXTRAJUDICIAIS (AD NEGOTIA)",
         f"Representar {O} perante órgãos públicos e privados; requerer certidões e documentos; apresentar "
         "notificações e requerimentos; firmar distratos, rescisões e instrumentos necessários ao "
         "desfazimento contratual, condicionada qualquer disposição sobre o valor principal à anuência prévia "
         f"d{O}, sem poderes para receber em seu nome o principal da restituição."),
        ("III - ESPECÍFICOS",
         "Propor ação de distrato, rescisão ou resolução de contratos de multipropriedade; pleitear "
         "restituição dos valores pagos, suspensão de parcelas e cobranças, nulidade ou abusividade de "
         "cláusulas, retirada de inscrições restritivas e segregação do valor principal; substabelecer a "
         "advogados regularmente inscritos na OAB."),
    ]
    pod_html = "".join(f"<h4>{e(t)}</h4><p>{e(x)}</p>" for t, x in pod)
    rot_ass = "ASSINATURA DA OUTORGANTE" if c.get("genero") == "f" else "ASSINATURA DO OUTORGANTE"
    return f"""
<div class="cab"><div class="marca"><small>DI</small><b>PALLACIO</b><i>Amigos, Família, Advogados e Associados</i></div>
<div class="dir ouro">PROCURAÇÃO - INSTRUMENTO PARTICULAR</div></div>
<div class="corpo">
<div class="info centro"><b>ATENDIMENTO PRIORITARIAMENTE ONLINE</b><span>Atos presenciais quando determinados pela Justiça · Informações relevantes e meios de consulta disponibilizados</span></div>
<div class="rotulo">{"OUTORGANTE"}</div>
<div class="campo"><div>{e(c["nome"])}</div><small>{doc}</small>{extras}</div>
<div class="rotulo">OUTORGADOS - DI PALLACIO ENTERPRISE</div>
<ul class="equipe duas">{equipe}</ul>
<p class="nota">A outorga é feita à DI PALLACIO, da qual o advogado signatário é membro integrante. Os poderes privativos da advocacia cabem exclusivamente aos profissionais inscritos na OAB; os demais integrantes da equipe atuam apenas no apoio administrativo e na comunicação com {"a cliente" if c.get("genero") == "f" else "o cliente"}.</p>
<div class="quadro">
<div><small>HONORÁRIOS</small><strong>{pct}%</strong><p>{por_extenso(pct)} por cento sobre o valor efetivamente restituído, com as devidas correções</p></div>
<div><small>PARCELA FIXA</small><strong>{fixa}</strong><p>{fixa_txt}</p></div>
<div><small>ENTRADA</small><strong>{ent}</strong><p>{ent_txt}</p></div>
<div><p>{art.upper()} OUTORGANTE declara ciência de que as <b>condições econômico-contratuais</b> desta contratação são exclusivamente as constantes deste quadro-resumo.</p></div>
</div>
<div class="rotulo">PODERES CONFERIDOS</div>
<div class="pod">{pod_html}</div>
<div class="rotulo">DECLARAÇÕES {"DA" if c.get("genero") == "f" else "DO"} OUTORGANTE</div>
<ol class="dec">{decl_html}</ol>
<div class="local">{e(c["cidade"])} - {data_extenso(hoje)}</div>
{bloco_assinatura(1, rot_ass, f'{e(c["nome"])} — {doc}')}
</div>
<div class="rod">Di PALLACIO Enterprise · <i>Amigos, Família, Advogados e Associados</i></div>"""


def gerar_html(c: dict, hoje: dt.date) -> str:
    validar(c)
    modelo = c.get("modelo", "padrao")
    corpo = montar_aprimorado(c, hoje) if modelo == "aprimorado" else montar_padrao(c, hoje)
    cfg = {"pdf": nome_pdf(c), "assinaturas": 2 if c.get("nome2") else 1}
    js = JS.replace("__CFG__", json.dumps(cfg, ensure_ascii=False))
    titulo = f"Procuração — {c['nome']}"
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Crimson+Text:ital,wght@0,400;0,600;1,400&family=Inter:wght@400;600&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<style>{CSS}</style>
</head>
<body>
<div id="docPreview"><div class="wm"><span>DI PALLACIO</span></div>{corpo}
</div>
<div class="barra"><button type="button" id="pdfBtn">Assinar e baixar PDF</button></div>
<script>{js}</script>
</body>
</html>
"""


# ---------------------------------------------------------------- revisão

def _texto(html_: str) -> str:
    corpo = re.search(r'<div id="docPreview">(.*)<div class="barra">', html_, re.S)
    t = re.sub(r"<[^>]+>", " ", corpo.group(1) if corpo else "")
    return re.sub(r"\s+", " ", html.unescape(t))


def revisar(caminho: Path, c: dict | None = None) -> list[str]:
    h = caminho.read_text(encoding="utf-8")
    erros: list[str] = []
    if not h.startswith("<!DOCTYPE html>"):
        erros.append("não começa com <!DOCTYPE html>")
    if not h.rstrip().endswith("</html>"):
        erros.append("não termina com </html>")
    for tag in ["<style>", "</style>", "<script>", "</script>", "</body>"]:
        if tag not in h:
            erros.append(f"falta {tag}")
    m = re.search(r"<script>(.*?)</script>\s*</body>", h, re.S)
    if not m:
        erros.append("script inline não encontrado")
    elif shutil.which("node"):
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tmp:
            tmp.write(m.group(1))
        r = subprocess.run(["node", "--check", tmp.name], capture_output=True, text=True)
        Path(tmp.name).unlink(missing_ok=True)
        if r.returncode != 0:
            erros.append("node --check falhou: " + r.stderr.strip()[:300])
    else:
        erros.append("node indisponível para --check")
    aprimorado = "ATENDIMENTO PRIORITARIAMENTE ONLINE" in h
    exigidos = ["jspdf", "html2canvas", 'id="docPreview"', 'id="pdfBtn"', 'id="sigCanvas1"', "setupSig(i)",
                "touchstart", "navigator.canShare", "#F7F0E0", "Edilson Rodrigues", "Subcoordenador",
                "art. 22, §", "Procuracao_Interativa_", "membro integrante"]
    exigidos += (["ATENDIMENTO PRIORITARIAMENTE ONLINE", "meios de consulta"] if aprimorado
                 else ["100% online", "link de consulta"])
    for x in exigidos:
        if x not in h:
            erros.append(f"falta {x!r}")
    texto = _texto(h)
    if re.search(r"GAV\s+RESORTS", texto, re.I) or re.search(r"\bGAV\b", texto):
        erros.append("cita a ré (GAV) no documento")
    if c:
        num = str(c.get("num") or "")
        if num and re.search(rf"(?<![\d.]){re.escape(num)}(?![\d.])", texto):
            erros.append(f"número do cliente {num} aparece no corpo do documento")
        for campo in ["nome", "cpf", "rg", "nome2", "cpf2", "cidade"]:
            if c.get(campo) and str(c[campo]) not in texto:
                erros.append(f"{campo} {c[campo]!r} não aparece no documento")
        if f"{int(c['pct'])}%" not in texto:
            erros.append(f"percentual {c['pct']}% ausente")
        if nome_pdf(c) not in h:
            erros.append("nome do PDF não confere")
        n_canvas = len(re.findall(r'id="sigCanvas\d"', h))
        if n_canvas != (2 if c.get("nome2") else 1):
            erros.append(f"quadros de assinatura: {n_canvas}")
        alvo_taxa = {"meioSM": ["meio salário mínimo", "0,5 SALÁRIO MÍNIMO"],
                     "umSM": ["um salário mínimo (1 SM)", "1 SALÁRIO MÍNIMO"],
                     "valorFixo": [f"R$ {c.get('valorTaxa')}"], "sem": []}[c["taxa"]]
        if alvo_taxa and not any(a in texto for a in alvo_taxa):
            erros.append(f"condição da taxa ({c['taxa']}) não aparece")
        if c["taxa"] == "meioSM" and "um salário mínimo (1 SM) é devido" in texto:
            erros.append("taxa meioSM mas texto fala em 1 SM")
        if c["taxa"] == "umSM" and "meio salário mínimo" in texto:
            erros.append("taxa umSM mas texto fala em meio SM")
        ent_ok = ("dispensada" in texto.lower()) if c["entrada"] == "sem" else ("por cota" in texto)
        if not ent_ok:
            erros.append("condição de entrada não confere")
        if bool(c.get("hipo")) != ("hipossuficiência" in texto):
            erros.append("hipossuficiência não confere com o pedido")
        if bool(c.get("multa70")) != ("70% (setenta por cento)" in texto):
            erros.append("cláusula de 70% não confere com o pedido")
        if bool(c.get("comOperacao")) != ("gestão administrativa de cotas" in texto):
            erros.append("trecho 'com operação' não confere com o pedido")
    return erros


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clientes", nargs="?", help="JSON com a lista de clientes")
    ap.add_argument("--out", default=".", help="pasta de saída")
    ap.add_argument("--revisar", help="revisar um HTML já gerado")
    ap.add_argument("--cliente", help="JSON do cliente para a revisão isolada")
    ap.add_argument("--data", help="data do documento AAAA-MM-DD (padrão: hoje)")
    a = ap.parse_args()
    if a.revisar:
        c = None
        if a.cliente:
            lista = json.loads(Path(a.cliente).read_text(encoding="utf-8"))
            alvo = Path(a.revisar).name
            c = next((x for x in lista if x["arquivo"] == alvo), None)
        erros = revisar(Path(a.revisar), c)
        print(("REPROVADO " if erros else "APROVADO ") + a.revisar)
        for x in erros:
            print("  -", x)
        return 1 if erros else 0
    if not a.clientes:
        ap.error("informe clientes.json ou --revisar")
    hoje = dt.date.fromisoformat(a.data) if a.data else dt.date.today()
    lista = json.loads(Path(a.clientes).read_text(encoding="utf-8"))
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    falhou = False
    for c in lista:
        try:
            h = gerar_html(c, hoje)
        except ErroCliente as err:
            print(f"ERRO {err}")
            falhou = True
            continue
        destino = out / c["arquivo"]
        destino.write_text(h, encoding="utf-8")
        erros = revisar(destino, c)
        if erros:
            falhou = True
            print(f"REPROVADO {destino}")
            for x in erros:
                print("  -", x)
        else:
            print(f"APROVADO  {destino}  ({len(h.encode())} bytes) -> {nome_pdf(c)}")
    return 1 if falhou else 0


if __name__ == "__main__":
    sys.exit(main())
