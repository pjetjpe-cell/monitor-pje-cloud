"""Motor de reorganização que preserva as marcações do aluno.

Uso típico em um build_*.py:

    import sys; sys.path.insert(0, '<pasta scripts>')
    from engine import *
    load('paras.json')
    corpo = step(1, 'Conceito', seg(5, 'Excelência,', 'Apresenta tríplice'))
    open('saida.html', 'w').write(shell(corpo, 'Título curto'))

Ideia central: o texto vive em `paras` (saída do extrair.py). `seg(idx, a, b)` devolve o HTML do trecho do
parágrafo `idx` que começa na âncora `a` e termina ANTES da âncora `b`, já com <mark>, <b>, <i>, <u>, X de
riscado. Nada é redigitado: o que o aluno grifou segue o texto, não a posição.
"""
import json, html, collections, base64, os

HERE = os.path.dirname(os.path.abspath(__file__))
P = []
_cache = {}


def load(path):
    global P, _cache
    P = json.load(open(path))
    _cache = {}
    return P


# ---------------------------------------------------------------- texto e âncoras
def chars_of(idx):
    """Caracteres do parágrafo com espaços colapsados (quebras de linha do PDF viram um espaço)."""
    if idx in _cache:
        return _cache[idx]
    out, prev = [], True
    for c in P[idx]['chars']:
        if c['c'].isspace():
            if prev:
                continue
            out.append(dict(c, c=' ')); prev = True
        else:
            out.append(dict(c)); prev = False
    while out and out[-1]['c'] == ' ':
        out.pop()
    _cache[idx] = out
    return out


def text_of(idx):
    return ''.join(c['c'] for c in chars_of(idx))


def locate(idx, a, b=None, skip_a=False, incl_b=False):
    """[i, j) do trecho entre as âncoras. a=None começa no início; b=None vai até o fim.
    skip_a: começa DEPOIS de `a` (para descartar prefixos como '(II) ' ou 'RESPOSTA:').
    incl_b: inclui `b` no trecho. Falha alto se a âncora não existe (evita corte silencioso errado)."""
    s = text_of(idx)
    if a is None:
        i = 0
    else:
        i = s.find(a)
        assert i >= 0, f'âncora não encontrada no parágrafo {idx}: {a!r}'
        if skip_a:
            i += len(a)
    if b is None:
        j = len(s)
    else:
        j = s.find(b, i + (0 if skip_a or a is None else len(a)))
        assert j >= 0, f'âncora final não encontrada no parágrafo {idx}: {b!r}'
        if incl_b:
            j += len(b)
    return i, j


def sublinhar(idx, a, b, incl_b=True):
    """Força sublinhado num trecho (use só se o extrator não detectou o sublinhado do original)."""
    i, j = locate(idx, a, b, incl_b=incl_b)
    for c in chars_of(idx)[i:j]:
        c['u'] = True


def render(chars):
    """Caracteres -> HTML. Um <mark> contínuo por cor, mesmo atravessando negrito/itálico (sem vãos)."""
    chars = list(chars)
    while chars and chars[0]['c'] == ' ':
        chars.pop(0)
    while chars and chars[-1]['c'] == ' ':
        chars.pop()
    n = len(chars)
    attrs = []
    for k, c in enumerate(chars):
        hl, u = c.get('hl'), c.get('u', False)
        if c['c'] == ' ':   # o espaço entre duas palavras da mesma cor também é grifado
            pk = k - 1
            while pk >= 0 and chars[pk]['c'] == ' ':
                pk -= 1
            nk = k + 1
            while nk < n and chars[nk]['c'] == ' ':
                nk += 1
            if pk >= 0 and nk < n:
                hl = chars[pk]['hl'] if chars[pk].get('hl') and chars[pk].get('hl') == chars[nk].get('hl') else None
                u = chars[pk].get('u', False) and chars[nk].get('u', False)
        attrs.append((hl, c['b'], c['i'], c.get('strike', False) and c['c'] not in '.,;:', u))

    def inner(sub):
        res, k = [], 0
        while k < len(sub):
            key = sub[k][1:]; j = k
            while j < len(sub) and sub[j][1:] == key:
                j += 1
            t = html.escape(''.join(x[0] for x in sub[k:j]))
            b, i, st, u = key
            if u: t = f'<u>{t}</u>'
            if st: t = f'<s class="x">{t}</s>'
            if i: t = f'<i>{t}</i>'
            if b: t = f'<b>{t}</b>'
            res.append(t); k = j
        return ''.join(res)

    out, k = [], 0
    while k < n:
        hl = attrs[k][0]; j = k
        while j < n and attrs[j][0] == hl:
            j += 1
        t = inner([(chars[m]['c'],) + attrs[m][1:] for m in range(k, j)])
        out.append(f'<mark class="{hl}">{t}</mark>' if hl else t)
        k = j
    return ''.join(out)


def seg(idx, a=None, b=None, **kw):
    i, j = locate(idx, a, b, **kw)
    return render(chars_of(idx)[i:j])


def cat(*parts, sep=' '):
    """Junta trechos. Cuidado: blocos que quebram palavra com hífen ('projetando-' | 'se') use sep=''."""
    return sep.join(parts)


def esc(s):
    return html.escape(s)


def contar_grifos(ignorar=()):
    """Nº de trechos contínuos grifados por cor (para a legenda; confere com verificar.py)."""
    cnt = collections.Counter()
    for idx in range(len(P)):
        if idx in ignorar:
            continue
        prev = None
        for c in chars_of(idx):
            if c['c'] == ' ' and prev:
                continue
            if c.get('hl') != prev:
                if c.get('hl'):
                    cnt[c['hl']] += 1
                prev = c.get('hl')
    return cnt


# ---------------------------------------------------------------- componentes visuais
# Regra de design: azul-marinho (estrutura/numeração) NUNCA se mistura às 5 cores de grifo do aluno;
# laranja/pêssego reproduz as caixas do material original (pergunta, aprofundamento, jurisprudência).
def step(n, label, body='', subs=None, extra='', sid=None, alt=False):
    """Passo numerado. `subs`: lista de HTML (vira n.1, n.2...) ou de tuplas (rótulo, HTML).
    alt=True: círculo vazado — use nas respostas a perguntas do examinador para não confundir
    com a numeração do roteiro principal."""
    sid = sid or f's{n}'
    h = f'<section class="step{" alt" if alt else ""}" id="{sid}"><div class="num">{n}</div><div class="sbody">'
    h += f'<div class="slabel">{esc(label)}</div>'
    if body:
        h += f'<p class="stext">{body}</p>'
    if subs:
        h += '<div class="subs">'
        for k, s in enumerate(subs, 1):
            tag, txt = (s if isinstance(s, tuple) else (f'{n}.{k}', s))
            h += f'<div class="sub"><span class="sn">{tag}</span><span class="stext">{txt}</span></div>'
        h += '</div>'
    return h + extra + '</div></section>'


def band(letra, titulo, sub=''):
    return (f'<div class="band"><span class="bl">{letra}</span><span class="bt">{esc(titulo)}</span>'
            f'<span class="bs">{esc(sub)}</span></div>')


def titulo(texto, quebra=False, pequeno=False):
    cls = 'stitle' + (' pb' if quebra else '') + (' sm' if pequeno else '')
    return f'<div class="{cls}">{texto}</div>'


def pergunta(tag, html_pergunta, grande=False):
    rot = f'<span class="qtag">{esc(tag)}</span>' if tag else ''
    return f'<div class="qbox{" big" if grande else ""}">{rot}<p class="qtext">{html_pergunta}</p></div>'


def rtag(texto='RESPOSTA AO EXAMINADOR · ordem de argumentação'):
    return f'<div class="rtag">{esc(texto)}</div>'


def duel(titulo_duelo, cab_esq, cab_dir, linhas, nota=''):
    """Quadro comparativo lado a lado. linhas = [(rótulo, html_esq, html_dir)], numeradas na ordem do argumento.
    Use SÓ trechos do material (seg), nunca texto novo; se um lado não existe, escreva
    '<span class="dash">— não tratado neste material</span>'."""
    h = f'<div class="duel"><div class="dtitle">{titulo_duelo}</div>'
    h += f'<div class="dgrid"><div class="dh dh0"></div><div class="dh dl">{cab_esq}</div><div class="dh dr">{cab_dir}</div>'
    for k, (lab, l, r) in enumerate(linhas, 1):
        h += f'<div class="dn"><span class="num s">{k}</span><span class="dlab">{esc(lab)}</span></div>'
        h += f'<div class="dc dl txt">{l}</div><div class="dc dr txt">{r}</div>'
    h += '</div>'
    if nota:
        h += f'<div class="dnote">{nota}</div>'
    return h + '</div>'


def caixa(tag, itens, marcadores=None):
    """Caixa pêssego (aprofundamento/observação). itens = [html]; marcadores padrão A, B, C..."""
    h = f'<div class="obox"><div class="otag">{esc(tag)}</div>'
    for k, t in enumerate(itens):
        m = marcadores[k] if marcadores else chr(65 + k)
        h += f'<div class="osub"><span class="sn">{m}</span><span class="stext">{t}</span></div>'
    return h + '</div>'


def legenda(ignorar=()):
    cnt = contar_grifos(ignorar)
    nomes = [('y', 'Amarelo'), ('p', 'Rosa'), ('r', 'Vermelho'), ('g', 'Verde'), ('b', 'Azul')]
    return '<div class="legend">' + ''.join(
        f'<div class="lg"><mark class="{c}">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</mark><span class="lname">{n}</span>'
        f'<span class="lcount">{cnt[c]} trechos</span></div>' for c, n in nomes if cnt[c]) + '</div>'


def trilha(grupos):
    """Mapa de 1 minuto. grupos = [('(a)', 'Natureza e fundamento', [(1, 'Conceito'), (2, 'Fundamento')])]
    Cada chip leva ao passo `s{n}`."""
    h = '<div class="trail">'
    for letra, nome, itens in grupos:
        h += f'<div class="tgroup"><div class="thead"><b>{esc(letra)}</b> {esc(nome)}</div><div class="tchips">'
        h += ''.join(f'<a class="chip" href="#s{n}"><span class="num s">{n}</span>{esc(l)}</a>' for n, l in itens)
        h += '</div></div>'
    return h + '</div>'


def imagem_b64(path, largura=None):
    """Embute imagem (ex.: carimbo do aluno) no HTML. Reduz com PIL se largura for dada."""
    if largura:
        from PIL import Image
        import io
        im = Image.open(path).convert('RGB')
        im = im.resize((largura, round(im.height * largura / im.width)))
        buf = io.BytesIO(); im.save(buf, 'JPEG', quality=85)
        return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()
    return 'data:image/png;base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def mnemonico(texto, img_uri=None, nota=''):
    """Caixa tracejada para anotação à mão do aluno (FreeText/Stamp do PDF)."""
    im = f'<img src="{img_uri}" alt="">' if img_uri else ''
    return (f'<div class="mnemo">{im}<div><div class="hand">{esc(texto)}</div>'
            f'<div class="mnote">{nota}</div></div></div>')


JS_FOCO = """
const b=document.getElementById('focus');
if(b){b.addEventListener('click',()=>{const on=document.body.classList.toggle('focus');b.setAttribute('aria-pressed',on);b.textContent=on?'Mostrar texto completo':'Ver só os grifos';});}
"""


def shell(corpo, titulo_curto):
    """Documento HTML completo e autônomo (CSS e imagens embutidos), com o botão 'Ver só os grifos'."""
    css = open(os.path.join(HERE, 'style.css')).read()
    return f"""<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(titulo_curto)}</title>
<style>{css}</style></head><body>
<button id="focus" class="noprint" aria-pressed="false" type="button">Ver só os grifos</button>
{corpo}
<script>{JS_FOCO}</script>
</body></html>
"""
