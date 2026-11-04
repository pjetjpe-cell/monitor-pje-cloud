---
name: pje-consulta
description: Consulta os processos do escritório no PJe do TJPE (1º grau) para saber se estão atualizados — busca por advogado na Consulta Pública (não precisa de login), filtra por Ipojuca e lê a última movimentação. Use quando o usuário disser "consulta os processos", "vê se o processo está atualizado", "o que andou no PJe", "última movimentação", "confere os processos da Gilzielle / do Weiden / ...", ou pedir o status dos processos contra a GAV.
---

# Consulta processual no PJe/TJPE — "o processo está atualizado?"

Aprendido do vídeo `TELA DE COMO CONSULTA E SABER SE PROCESSO ESTA ATUALIZADO`
(28/10/2026, 85 s, sem áudio) e corrigido em 03/11/2026 pelo usuário:
**a consulta por advogado não exige login.** O que o vídeo não mostra, ou que
só vale na tela logada, está marcado como **não confirmado** — não preencha por
dedução.

## Onde — padrão: Consulta Pública (sem login)

- Endereço: `https://pje.cloud.tjpe.jus.br/1g/ConsultaPublica/listView.seam`
  (no portal do TJPE: PJe 1º Grau → **Consulta Pública de Processos**).
- **Não precisa de login, senha, certificado nem token.** Pesquisando por
  qualquer advogado a consulta já funciona. Nunca peça credencial ao usuário
  para esta tarefa.
- Campos da tela (conferidos em 03/11/2026): Processo · Processo referência ·
  Numeração única · Nome da Parte · **Nome do advogado** · Classe judicial ·
  CPF/CNPJ · OAB (000000 + UF) · Data de Autuação (De/Até).
- Processos em segredo de justiça e dados digitados errados não retornam
  resultado: isso não é falha da consulta.

### Alternativa — tela "Consulta processos" (logada)

`https://pje.cloud.tjpe.jus.br/1g/Processo/ConsultaProcesso/listView.seam`
(`[1g-0xx]` no topo). É a tela do vídeo, aberta na sessão do usuário (LEONARDO
SILVA). Lá o campo se chama **Nome do Representante** e existem os filtros
**Jurisdição** e **Órgão julgador**. Use só se a Consulta Pública não trouxer o
que falta, e com a sessão que o próprio usuário já deixou aberta; sem ela,
volte à Consulta Pública ou entregue o passo a passo.

## Passo a passo

1. Abra a Consulta Pública (endereço acima).
2. Em **Nome do advogado**, digite o nome do advogado.
3. Restrinja a **Ipojuca** (1ª e 2ª Vara Cível da Comarca de Ipojuca).
   *Não confirmado:* se a Consulta Pública tem o filtro **Jurisdição: Ipojuca -
   Varas** como a tela logada. Se tiver, use. Se não tiver, pesquise assim
   mesmo e descarte, pela coluna de órgão julgador / vara, tudo que não for de
   Ipojuca — e diga na entrega que o filtro foi feito à mão.
4. Clique em **PESQUISAR**. (Trocou o advogado ou o filtro? Pesquise de novo —
   a lista só muda depois do clique.)
5. Leia a lista: uma linha por processo. Para cada um anote número, vara,
   partes e a **última movimentação** — é ela que responde "está atualizado?".
6. Repita para o próximo advogado. Ao terminar, limpe a pesquisa.

Advogados do escritório, nesta ordem (os mesmos do vídeo; confirmados pelo
usuário em 03/11/2026): **Gilzielle Veloso, Weiden Dutra, Luan Victor, Raphael
Reis, Diogo Serafim**. Sem nome informado, use esta lista; com nome, consulte
só o informado.

## Colunas da lista (tela logada do vídeo)

| Coluna | O que traz |
|---|---|
| Processo | número CNJ (link para os autos) |
| Características | ícones (seta para cima, relógio) — **significado não confirmado** |
| Órgão julgador | 1ª ou 2ª Vara Cível da Comarca de Ipojuca |
| Autuado em | data de distribuição |
| Classe judicial | Procedimento Comum Cível, Cumprimento de sentença... |
| Polo ativo / Polo passivo | cliente / ré (em geral GAV MURO ALTO 2 EMPREENDIMENTO IMOBILIÁRIO SPE LTDA) |
| Nó(s) atual(is) | botão VISUALIZAR — mostra em que tarefa o processo está |
| Última moviment. | último andamento |

**Não confirmado:** se a lista da Consulta Pública traz as mesmas colunas, em
especial **Última moviment.** e **Nó(s) atual(is)**. Se a coluna não existir,
abra o processo e leia a movimentação mais recente na aba de movimentos; não
deixe o campo em branco nem o deduza.

## Lendo a "Última movimentação"

Andamentos que apareceram no vídeo, agrupados pelo que significam na prática:

| Grupo | Textos vistos |
|---|---|
| **Com o juiz** | Conclusos para decisão · Conclusos para despacho · Conclusos para julgamento |
| **Petição entrou** | Juntada de Petição de manifestação (outras) · Juntada de Petição de petição (outras) |
| **Prazo** | Decorrido prazo de [PARTE] em [DATA] |
| **Publicação / intimação** | Publicado Decisão em [DATA] · Publicado Despacho\Intimação\Intimação (Outros) em [DATA] · Publicado Intimação (Outros) em [DATA] · Expedição de Publicação ao Diário de Justiça Eletrônico Nacional |
| **Citação / mandado** | Expedição de citação (outras) · Recebido o Mandado para Cumprimento · Mandado devolvido entregue ao destinatário · Expedição de Intimação (Outros) |
| **Movimento interno** | Recebidos os autos · Expedição de Certidão · Remetidos os Autos (Análise) para contadoria |
| **Encerrado** | Arquivado Definitivamente |

## Pontos cegos — conferir sempre

1. **Limite de resultados.** A tela logada mostra no máximo 30 processos e avisa
   com uma faixa rosa *"Sua consulta retornou muitos processos e somente os 30
   primeiros serão exibidos"* (aconteceu com Gilzielle Veloso e Raphael Reis).
   Se a lista vier cortada, refine — **Órgão julgador** (1ª Vara, depois 2ª
   Vara) ou **Data de Autuação** (De/Até) — e pesquise por partes até cada uma
   vir sem a faixa. Some o total das partes e confira com o rodapé ("N
   resultados encontrados"). *Não confirmado:* o limite da Consulta Pública
   (a API `pje-tjpe-api` usa até 100); confira o rodapé do mesmo jeito.
2. **Filtro de Ipojuca.** Na primeira busca do vídeo a lista ainda trazia
   processos de Olinda, Limoeiro, Timbaúba e Goiana — o filtro só vale depois
   de clicar PESQUISAR. Confira sempre o órgão julgador / vara de cada linha.
3. **Muitas movimentações não mostram data na lista** ("Conclusos para
   decisão", "Juntada de Petição..."). Para saber **há quanto tempo** está
   parado, abra o processo. Não estime a data pela posição na lista — a lista é
   ordenada por **Autuado em**, não pela última movimentação.
4. **Cor das linhas e ícones.** Linhas laranja e brancas, ícones de seta e
   relógio: o vídeo não explica. Não atribua significado sem confirmar com o
   usuário.
5. **Segredo de justiça.** Processo sigiloso não aparece na Consulta Pública.
   Se o usuário souber de um processo que não veio na lista, diga isso em vez
   de concluir que não existe.

## Quem consegue consultar

A pesquisa exige um navegador de verdade (página JSF: digitar e clicar). Sessão
na nuvem sem acesso ao domínio `pje.cloud.tjpe.jus.br` não consulta — o pedido
é recusado pela rede. Nesse caso:
- diga isso claramente, não finja que consultou;
- use o navegador do PC do escritório (Antigravity ou Claude em Chrome), que
  não precisa de login nesta tela; ou
- entregue o passo a passo acima para o usuário executar.

## Entrega

Uma tabela por advogado: processo · vara · cliente (polo ativo) · última
movimentação · data (se a lista mostrar) · grupo. No fim, destaque:
- processos **com prazo decorrido** ou **publicação recente** (pedem ação);
- processos **arquivados**;
- buscas que bateram no **limite de resultados** e como foram refinadas;
- o que ficou **não confirmado** (filtro de Ipojuca, colunas) e como foi
  contornado.

## Checagem semanal automática (toda quarta, ~9h45 de Recife)

Pedido do usuário (04/11/2026): toda quarta, ler a tela de processos dos
representantes **Gilzielle Veloso, Raphael Reis, Weiden Dutra, Luan Victor e
Diogo Serafim** (Ipojuca - Varas) e mandar para **dipallacio@gmail.com** um
e-mail só com a **tabela dos processos que mudaram** e o que foi.
Diogo Serafim tem **um processo só**; o filtro está no arquivo privado.

**Dados de cliente nunca vão para este repositório (ele é público).** A base
(última movimentação de cada processo) e os filtros por advogado ficam no
Google Drive (conta pjetjpe@gmail.com), no arquivo mais recente com título
`PJe checagem semanal — base AAAA-MM-DD.json` (`{config, base}`). A primeira
base veio das telas de 03/11/2026; listas cortadas estão com `completo: false`
e a primeira leitura completa incorpora o resto sem avisar.

Programas (`ferramentas/pje/`, sem dados):
- `acervo.mjs` — roda **no PC do escritório**, no Chrome da porta 9222. Usa a
  **Consulta Pública** (sem login); se ela não trouxer a última movimentação,
  tenta a tela logada "Consulta processos" (se o usuário a deixou aberta).
  Contorna o limite de resultados (por vara, quando há filtro, e por data de
  autuação). `--config` = o `config` do arquivo privado. Saída 2 = Chrome fora;
  3 = nenhuma das duas telas deu a lista.
- `comparar.mjs` / `nucleo.mjs` — compara com a base e monta o e-mail.
  Testes: `node ferramentas/testes/test_pje.mjs`.

Passo a passo de cada quarta:
1. Desktop Commander online (`list_devices`)? Se não: e-mail curto para
   dipallacio@gmail.com dizendo que a checagem não rodou porque o computador do
   escritório estava sem o Desktop Commander e como religar
   (`npx @wonderwhy-er/desktop-commander@latest remote` no PowerShell). Fim.
2. Ler no Drive o arquivo privado mais recente; gravar o `config` no PC como
   `C:\Users\gigica\gav-whatsapp\pje\config.json`.
3. Baixar `acervo.mjs` e `nucleo.mjs` do commit atual (raw.githubusercontent com
   o SHA, não o nome do ramo) para `C:\Users\gigica\gav-whatsapp\pje\` (a
   pasta-mãe já tem o Playwright) e rodar
   `node acervo.mjs --config config.json --saida leitura.json`.
   Saída 2 ou 3: e-mail dizendo o que impediu. Fim.
4. Trazer `leitura.json` para a nuvem e rodar
   `node ferramentas/pje/comparar.mjs --base <arquivo privado> --leitura <leitura> --data dd/mm/aaaa --email email.json --gravar-base`.
5. Enviar o e-mail (assunto + html; texto como alternativa) para
   dipallacio@gmail.com. Nada mudou: o e-mail curto "nenhuma movimentação nova".
6. Depois do envio, criar no Drive o arquivo privado novo
   (`PJe checagem semanal — base <data>.json`) com a base atualizada.
   Nunca commitar a base.

Nunca inventar movimentação: se a leitura falhou, o e-mail diz que falhou.
