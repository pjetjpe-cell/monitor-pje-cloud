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
