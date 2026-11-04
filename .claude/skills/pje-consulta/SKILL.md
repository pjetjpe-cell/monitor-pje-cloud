---
name: pje-consulta
description: Consulta os processos do escritório no PJe do TJPE (1º grau) para saber se estão atualizados — busca por advogado, filtra por Ipojuca e lê a coluna "Última movimentação". Use quando o usuário disser "consulta os processos", "vê se o processo está atualizado", "o que andou no PJe", "última movimentação", "confere os processos da Gilzielle / do Weiden / ...", ou pedir o status dos processos contra a GAV.
---

# Consulta processual no PJe/TJPE — "o processo está atualizado?"

Aprendido do vídeo `TELA DE COMO CONSULTA E SABER SE PROCESSO ESTA ATUALIZADO`
(28/10/2026, 85 s, sem áudio). Tudo abaixo foi visto na tela; o que o vídeo não
mostra está marcado como **não confirmado** — não preencha por dedução.

## Onde

- Endereço: `https://pje.cloud.tjpe.jus.br/1g/Processo/ConsultaProcesso/listView.seam`
- Tela: **Consulta processos**, 1º grau (`[1g-058]` no topo).
- Login: sessão do usuário (no vídeo, **LEONARDO SILVA**). O PJe exige login
  do próprio usuário; nunca peça senha nem certificado no chat. Sem a sessão
  aberta no navegador dele, entregue o passo a passo em vez de fingir que
  consultou.

## Passo a passo (como no vídeo)

1. Em **Nome do Representante**, digite o nome do advogado.
2. Em **Jurisdição**, escolha **Ipojuca - Varas**.
3. Clique em **PESQUISAR**. (Trocou o advogado ou o filtro? Pesquise de novo —
   a lista só muda depois do clique.)
4. Leia a tabela: uma linha por processo, mais recente primeiro (**Autuado em**).
5. Para cada processo, a coluna **Última moviment.** diz o que aconteceu por
   último. É ela que responde "está atualizado?".
6. Repita para o próximo advogado. Ao terminar, clique em **LIMPAR**.

Advogados consultados no vídeo, nesta ordem: **Gilzielle Veloso, Weiden Dutra,
Luan Victor, Raphael Reis, Diogo Serafim**.

## Colunas da lista

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

1. **Limite de 30 resultados.** Se aparecer a faixa rosa *"Sua consulta retornou
   muitos processos e somente os 30 primeiros serão exibidos"*, a lista está
   **incompleta**. Aconteceu com Gilzielle Veloso e Raphael Reis. Refine e
   pesquise de novo por partes — **Órgão julgador** (1ª Vara, depois 2ª Vara) ou
   **Data de Autuação** (De/Até) — até cada parte vir sem a faixa. Some o total
   de cada parte e confira contra o rodapé ("N resultados encontrados").
2. **Filtro de jurisdição.** Na primeira busca do vídeo a lista ainda trazia
   processos de Olinda, Limoeiro, Timbaúba e Goiana — o filtro **Ipojuca -
   Varas** só vale depois de clicar PESQUISAR. Confira a coluna Órgão julgador.
3. **Muitas movimentações não mostram data na lista** ("Conclusos para
   decisão", "Juntada de Petição..."). Para saber **há quanto tempo** está
   parado, abra o processo. Não estime a data pela posição na lista — a lista é
   ordenada por **Autuado em**, não pela última movimentação.
4. **Cor das linhas e ícones.** Linhas laranja e brancas, ícones de seta e
   relógio: o vídeo não explica. Não atribua significado sem confirmar com o
   usuário.

## Entrega

Uma tabela por advogado: processo · vara · cliente (polo ativo) · última
movimentação · data (se a lista mostrar) · grupo. No fim, destaque:
- processos **com prazo decorrido** ou **publicação recente** (pedem ação);
- processos **arquivados**;
- buscas que bateram no **limite de 30** e como foram refinadas.

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
- `acervo.mjs` — roda **no PC do escritório**, no Chrome da porta 9222 já logado
  no PJe; contorna o limite de 30 (por vara e depois por data de autuação).
  `--config` = o `config` do arquivo privado. Saída 2 = Chrome/PJe fora;
  3 = PJe pediu login.
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
