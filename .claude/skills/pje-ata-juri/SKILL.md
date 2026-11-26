---
name: pje-ata-juri
description: Lança a ata da sessão de julgamento do Tribunal do Júri no PJe do TJPE — registra a audiência como realizada, anexa o documento "Ata de Julgamento" pelo editor de texto e SALVA. Use quando o usuário disser "lança a ata do júri", "sobe a ata", "registra a sessão do júri", "ata de julgamento no PJe", ou mandar uma ata pronta (Word) para lançar num processo.
---

# Lançar ata de júri no PJe

Aprendido do vídeo `APRENDENDO A LANÇAR ATA DE JÚRI` (26/11/2026, 68 s, sem
áudio, gravação de tela do usuário no PJe 1º grau do TJPE, painel [1g-073]).
Tudo abaixo foi visto na tela; o que o vídeo **não** mostra está marcado como
**não confirmado** — não preencha por dedução.

## Antes de começar

- A ata já vem pronta no **Word**, a partir do modelo do usuário ("Ata base…").
  Este fluxo **não redige** a ata: só a lança. Se pedirem para redigir, use a
  estrutura no fim deste arquivo e devolva para o usuário conferir antes.
- Precisa do PJe logado na sessão do próprio usuário (Claude no Chrome ou
  Desktop Commander no PC dele). Nunca peça a senha.

## Passo a passo (como no vídeo)

1. **Painel do usuário** → quadro **Tarefas** → abrir **Filtros** → digitar o
   número do processo em **Número do processo** → **PESQUISAR**. Aparecem só
   as tarefas em que o processo está (no vídeo: "Processo com prazo em curso
   [CONTPRAZO]" e "Vindos do gabinete [SEC]").
2. Abrir o processo na tarefa **cri-Vindos do gabinete [SEC][CRI]**.
   (No vídeo ele abriu primeiro o CONTPRAZO, viu que não era ali e voltou.)
3. No ícone **Encaminhar para…** (topo direito da tarefa) → **Adotar
   providências**. O processo vai para **cri-Adotar providências [SEC][CRI]**.
4. De novo em **Encaminhar para…** → escolher **Realizar audiência** (fica logo
   abaixo de "Preparar ato ordinatório" — cuidado para não clicar nele). O
   processo vai para **cri-Realizar audiência [AUD][CRI]**.
5. Rolar até **Últimas audiências do processo** e conferir a linha da
   **Sessão do Tribunal do Júri** com a data de hoje e status **designada**.
6. Bloco **Audiência** → aba **REALIZAR AUDIÊNCIA**:
   - **Audiência\***: *realizada* (já vem marcado).
   - **Realizador\***: abrir a lista, digitar parte do nome do(a) juiz(a)
     presidente e escolher.
   - **Conciliador**: deixar em branco.
   - **Houve acordo?**: *Não* (já vem marcado).
   - **Motivo não acordo**: **Outros**.
   - Clicar **PRÓXIMO** → deve aparecer **"Audiência realizada com sucesso."**
7. Abre a aba **ANEXAR DOCUMENTO A AUDIÊNCIA**:
   - **Tipo de documento\***: digitar `julgament` na busca e escolher
     **Ata de Julgamento**. Atenção: o primeiro da lista é "Ata de Audiência de
     Instrução e Julgamento" — **não é esse**.
   - **Descrição**: preenche sozinha com "Ata de Julgamento".
   - **Número (opcional)**: vazio. **Sigiloso**: desmarcado.
   - **Documento**: marcar **Editor de texto** (não "Arquivo PDF").
8. No **Word**: selecionar a ata inteira (Ctrl+A) e copiar (Ctrl+C). No editor
   do PJe: clicar dentro e colar (Ctrl+V). Rolar até o fim e conferir que as
   assinaturas do rodapé vieram junto.
9. Clicar **SALVAR** (o botão logo abaixo do editor).
10. **Conferir que salvou**: aparece **"Rascunho salvo em DD/MM/AAAA HH:MM:SS"**
    acima do editor e surge **Anexos: ASSINAR DOCUMENTO(S)**. Sem essa
    mensagem, não salvou — salve de novo antes de sair.

O vídeo termina aqui, com a ata **salva e não assinada**. Assinar fica com o
usuário: só clique em **ASSINAR DOCUMENTO(S)** se ele mandar. O que acontece
depois (botão SALVAR de baixo, próxima tarefa do fluxo) é **não confirmado**.

## Regra que não se quebra

**Salvar sempre e conferir o "Rascunho salvo em".** Ata colada e não salva é
trabalho perdido (ver também `/pje-certidoes`, regra nº 1). No relatório,
diga: processo | audiência marcada como realizada? | ata salva (data/hora do
rascunho) | assinada?

## Estrutura da ata (o que se vê no modelo)

Cabeçalho: Poder Judiciário do Estado de Pernambuco · 1ª Vara do Tribunal do
Júri de Jaboatão dos Guararapes · endereço. Corpo em Verdana 10, justificado,
nomes e termos-chave em **negrito**, na ordem:

1. **ATA** da Sessão de Julgamento do 1º Tribunal do Júri da Comarca…, para
   julgamento do(s) acusado(s) …, no processo criminal nº …, tendo como
   vítima ….
2. Data e local; **PRESENTE** juiz(a) presidente, Ministério Público,
   defesa (com OAB), oficial de justiça, secretário do júri.
3. Partes e testemunhas **PRESENTES/AUSENTES** (com ID da intimação quando
   ausente); acusado foragido, se for o caso.
4. Jurados **PRESENTES** e **AUSENTES**; **recusas imotivadas** da defesa e
   do MP; **sorteio do Conselho de Sentença** com os nomes sorteados.
5. *(meio da ata — não aparece no vídeo; não confirmado)*
6. Votação, **soberania dos veredictos**, leitura da sentença (resultado).
7. **Dada a palavra às partes** — manifestação (ex.: apelação, art. 593, III,
   "c", do CPP) e despacho do(a) juiz(a) (recebe o recurso, prazo de razões e
   contrarrazões, remessa ao TJPE).
8. Encerramento: "Nada mais havendo a consignar… vai por todos assinada, às
   HHhMM. Eu, ____, Secretário do Júri, matrícula …, digitei e assino."
9. Assinaturas centralizadas: Juiz(a) Presidente · Promotor(a) de Justiça ·
   Advogado/Defensor.

Nunca copie dados de uma ata para outra sem conferir: nomes de jurados,
partes e horários mudam a cada sessão.
