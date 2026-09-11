"""Núcleo da esteira GAV: dossiê rastreável e máquina de etapas.

Duas regras estruturais sustentam todo o resto:

1. NÃO ALUCINAR — todo campo do dossiê carrega uma `fonte`. Gravar um campo
   sem dizer de onde ele veio levanta `SemFonte`. Não existe campo "de cabeça".
2. NÃO PULAR — cada etapa declara de quais etapas depende. Rodar uma etapa
   cujo pré-requisito não está `ok` levanta `EtapaBloqueada`.

O dossiê é um JSON em disco, então a esteira é retomável: se a sessão cair no
meio, a próxima execução lê o que já foi feito e continua de onde parou.
"""

from __future__ import annotations

import json
import os
import subprocess
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


class ErroEsteira(Exception):
    """Base de todos os erros previstos da esteira."""


class SemFonte(ErroEsteira):
    """Tentativa de gravar um campo sem declarar de onde o valor veio."""


class EtapaBloqueada(ErroEsteira):
    """Tentativa de rodar uma etapa com pré-requisito pendente ou falho."""


class VerificacaoFalhou(ErroEsteira):
    """A etapa rodou mas o resultado não passou na conferência pós-escrita."""


# --------------------------------------------------------------------------
# Etapas da esteira, em ordem. `depende` é o que impede pular.
# --------------------------------------------------------------------------

ETAPAS: dict[str, dict[str, Any]] = {
    "localizar": {
        "titulo": "Localizar o cliente no Drive",
        "depende": [],
    },
    "renomear": {
        "titulo": "Normalizar o nome da pasta e criar a subpasta de peticionamento",
        "depende": ["localizar"],
    },
    "nao_usar": {
        "titulo": "Criar/normalizar a pasta NÃO USAR e recolher os originais",
        "depende": ["renomear"],
    },
    "procuracao": {
        "titulo": "Limpar a procuração assinada (honorários / percentual / 0,5 SM)",
        "depende": ["nao_usar"],
    },
    "contrato": {
        "titulo": "Comprimir o contrato para menos de 3 MB",
        "depende": ["renomear"],
    },
    "identidade": {
        "titulo": "Extrair o documento de identificação (pp. 33-35 do contrato)",
        "depende": ["contrato"],
    },
    "email_gav": {
        "titulo": "Enviar a notificação extrajudicial de distrato à GAV",
        "depende": ["procuracao"],
    },
    "peticao": {
        "titulo": "Montar a petição inicial",
        "depende": ["procuracao", "identidade", "email_gav"],
    },
}

ORDEM_ETAPAS = list(ETAPAS)


# --------------------------------------------------------------------------
# Fontes
# --------------------------------------------------------------------------

@dataclass
class Fonte:
    """De onde um valor veio. Sem isto, o valor não entra no dossiê."""

    tipo: str  # arquivo | drive | gmail | whatsapp | usuario
    referencia: str  # caminho, fileId do Drive, threadId do Gmail...
    pagina: int | None = None
    trecho: str | None = None

    TIPOS = ("arquivo", "drive", "gmail", "whatsapp", "usuario")

    def __post_init__(self) -> None:
        if self.tipo not in self.TIPOS:
            raise SemFonte(f"tipo de fonte desconhecido: {self.tipo!r} (use um de {self.TIPOS})")
        if not str(self.referencia).strip():
            raise SemFonte("fonte sem referência: diga qual arquivo/ID originou o valor")
        if self.trecho and len(self.trecho) > 400:
            self.trecho = self.trecho[:397] + "..."


@dataclass
class Campo:
    valor: Any
    fonte: Fonte
    registrado_em: str


@dataclass
class Registro:
    """Resultado de uma etapa: status + as evidências que o comprovam."""

    status: str  # ok | falhou | pendente
    detalhe: str = ""
    evidencias: dict[str, Any] = field(default_factory=dict)
    registrado_em: str = ""

    STATUS = ("ok", "falhou", "pendente")


def _agora() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


# --------------------------------------------------------------------------
# Dossiê
# --------------------------------------------------------------------------

class Dossie:
    """Estado completo de um cliente na esteira, persistido em JSON."""

    def __init__(self, caminho: str | os.PathLike[str]):
        self.caminho = Path(caminho)
        self.campos: dict[str, Campo] = {}
        self.etapas: dict[str, Registro] = {}
        self.historico: list[dict[str, Any]] = []
        if self.caminho.exists():
            self._carregar()

    # -- persistência ------------------------------------------------------

    def _carregar(self) -> None:
        dados = json.loads(self.caminho.read_text(encoding="utf-8"))
        for nome, bruto in dados.get("campos", {}).items():
            self.campos[nome] = Campo(
                valor=bruto["valor"],
                fonte=Fonte(**bruto["fonte"]),
                registrado_em=bruto.get("registrado_em", ""),
            )
        for nome, bruto in dados.get("etapas", {}).items():
            self.etapas[nome] = Registro(**bruto)
        self.historico = dados.get("historico", [])

    def salvar(self) -> None:
        self.caminho.parent.mkdir(parents=True, exist_ok=True)
        saida = {
            "campos": {
                nome: {
                    "valor": c.valor,
                    "fonte": asdict(c.fonte),
                    "registrado_em": c.registrado_em,
                }
                for nome, c in self.campos.items()
            },
            "etapas": {nome: asdict(r) for nome, r in self.etapas.items()},
            "historico": self.historico,
        }
        tmp = self.caminho.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(saida, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(self.caminho)

    # -- campos ------------------------------------------------------------

    def definir(self, nome: str, valor: Any, fonte: Fonte) -> None:
        """Grava um campo. `fonte` é obrigatória — é o freio contra alucinação."""
        if not isinstance(fonte, Fonte):
            raise SemFonte(f"campo {nome!r}: fonte precisa ser um objeto Fonte, veio {type(fonte).__name__}")
        anterior = self.campos.get(nome)
        if anterior is not None and anterior.valor != valor:
            self.historico.append({
                "quando": _agora(),
                "acao": "campo_alterado",
                "campo": nome,
                "de": anterior.valor,
                "para": valor,
                "fonte_nova": asdict(fonte),
            })
        self.campos[nome] = Campo(valor=valor, fonte=fonte, registrado_em=_agora())

    def obter(self, nome: str, padrao: Any = None) -> Any:
        campo = self.campos.get(nome)
        return campo.valor if campo else padrao

    def exigir_campo(self, nome: str) -> Any:
        """Lê um campo obrigatório. Ausente = erro, nunca um chute."""
        if nome not in self.campos:
            raise SemFonte(
                f"campo obrigatório {nome!r} não está no dossiê. "
                "Extraia do documento ou pergunte ao usuário — não presuma."
            )
        return self.campos[nome].valor

    # -- etapas ------------------------------------------------------------

    def status_de(self, etapa: str) -> str:
        reg = self.etapas.get(etapa)
        return reg.status if reg else "pendente"

    def exigir(self, etapa: str) -> None:
        """Barra a etapa se algum pré-requisito não estiver `ok`."""
        if etapa not in ETAPAS:
            raise ErroEsteira(f"etapa desconhecida: {etapa!r}")
        pendentes = [
            f"{dep} ({self.status_de(dep)})"
            for dep in ETAPAS[etapa]["depende"]
            if self.status_de(dep) != "ok"
        ]
        if pendentes:
            raise EtapaBloqueada(
                f"etapa {etapa!r} depende de etapa(s) não concluída(s): {', '.join(pendentes)}. "
                "Conclua-as antes — não siga adiante."
            )

    def registrar(
        self,
        etapa: str,
        status: str,
        detalhe: str = "",
        evidencias: dict[str, Any] | None = None,
    ) -> None:
        if etapa not in ETAPAS:
            raise ErroEsteira(f"etapa desconhecida: {etapa!r}")
        if status not in Registro.STATUS:
            raise ErroEsteira(f"status inválido: {status!r} (use um de {Registro.STATUS})")
        if status == "ok" and not (evidencias or {}):
            raise VerificacaoFalhou(
                f"etapa {etapa!r} não pode ser marcada 'ok' sem evidências. "
                "Anexe o que comprova o resultado (caminhos, tamanhos, conferências)."
            )
        self.etapas[etapa] = Registro(
            status=status, detalhe=detalhe,
            evidencias=evidencias or {}, registrado_em=_agora(),
        )
        self.historico.append({
            "quando": _agora(), "acao": "etapa", "etapa": etapa, "status": status, "detalhe": detalhe,
        })

    def pendencias(self) -> list[str]:
        return [e for e in ORDEM_ETAPAS if self.status_de(e) != "ok"]

    def concluido(self) -> bool:
        return not self.pendencias()

    # -- relatório ---------------------------------------------------------

    def relatorio(self) -> str:
        linhas = [f"Dossiê: {self.caminho}", ""]
        cliente = self.obter("cliente_nome", "(cliente não identificado)")
        linhas.append(f"Cliente: {cliente}")
        linhas.append("")
        linhas.append("ETAPAS")
        for nome in ORDEM_ETAPAS:
            reg = self.etapas.get(nome)
            marca = {"ok": "[x]", "falhou": "[!]", "pendente": "[ ]"}[self.status_de(nome)]
            titulo = ETAPAS[nome]["titulo"]
            linhas.append(f"  {marca} {nome:<11} {titulo}")
            if reg and reg.detalhe:
                linhas.append(f"      -> {reg.detalhe}")
        linhas.append("")
        linhas.append("CAMPOS")
        if not self.campos:
            linhas.append("  (vazio)")
        for nome, campo in sorted(self.campos.items()):
            origem = f"{campo.fonte.tipo}:{campo.fonte.referencia}"
            if campo.fonte.pagina is not None:
                origem += f" p.{campo.fonte.pagina}"
            linhas.append(f"  {nome:<22} = {campo.valor!r}")
            linhas.append(f"  {'':<22}   fonte: {origem}")
        faltam = self.pendencias()
        linhas.append("")
        linhas.append("PENDENTE: " + (", ".join(faltam) if faltam else "nada — esteira completa"))
        return "\n".join(linhas)


# --------------------------------------------------------------------------
# Utilidades compartilhadas
# --------------------------------------------------------------------------

def sha256(caminho: str | os.PathLike[str]) -> str:
    import hashlib
    h = hashlib.sha256()
    with open(caminho, "rb") as fh:
        for bloco in iter(lambda: fh.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def tamanho_mb(caminho: str | os.PathLike[str]) -> float:
    return os.path.getsize(caminho) / (1024 * 1024)


def preservar_original(origem: str | os.PathLike[str], destino_dir: str | os.PathLike[str]) -> Path:
    """Copia o original para a pasta NÃO USAR antes de qualquer modificação.

    Nunca sobrescreve: se já existir, acrescenta um sufixo numérico.
    """
    import shutil
    origem = Path(origem)
    destino_dir = Path(destino_dir)
    destino_dir.mkdir(parents=True, exist_ok=True)
    destino = destino_dir / origem.name
    n = 1
    while destino.exists():
        destino = destino_dir / f"{origem.stem} ({n}){origem.suffix}"
        n += 1
    shutil.copy2(origem, destino)
    return destino
