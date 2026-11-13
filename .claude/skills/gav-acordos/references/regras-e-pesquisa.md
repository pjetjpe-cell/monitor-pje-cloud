# Regras e pesquisa: base jurídica e econômica das premissas

Esta pesquisa foi feita em 13/11/2026 e cada item indica a fonte. Antes de citar
qualquer ponto numa peça ou num parecer, confira no texto oficial. Várias
fontes abaixo são secundárias.

## 1. Retenção no distrato (art. 67-A da Lei 4.591/64, incluído pela Lei 13.786/2018)

- **Regra geral:** a multa contratual (pena) é limitada a **25% da quantia
  paga**. Além disso, pode ser descontada a **integral comissão de
  corretagem**. Por isso a corretagem sai da base em todos os nossos cálculos.
- **Patrimônio de afetação (§ 5º):** nesse regime a pena pode chegar a **50%**.
  Os tribunais exigem **prova formal** do regime. Sem ela, aplicam 25%
  (precedentes do TJMT e do TJRJ). Esse é o fundamento da retenção de 50% nos
  empreendimentos não construídos, e também o ponto de ataque quando a GAV não
  comprova a afetação.
- **Prazos de devolução:** 180 dias do desfazimento, ou 30 dias após o
  habite-se no regime de afetação. As fontes secundárias divergem nesse ponto;
  conferir o texto da lei.
- **Irretroatividade:** a lei não se aplica a contratos anteriores à sua
  vigência. Nesses casos vale a jurisprudência anterior, como a Súmula 543 do
  STJ.
- **Multipropriedade:** os tribunais estaduais aplicam esses limites à
  multipropriedade. O TJMG, por exemplo, reduziu a retenção de 50% para 25% num
  caso em que a corretagem já tinha sido aceita como retida. Na corretagem há
  divergência: alguns julgados mandam devolver quando não há prova de efetiva
  intermediação.

Fontes:
- [ABRAINC/Migalhas — distratos imobiliários](https://www.abrainc.org.br/distrato/2023/02/24/artigo-portal-migalhas-distratos-imobiliarios-a-lei-a-jurisprudencia-atual-e-os-reais-impactos-do-desfazimento-contratual)
- [ABRAINC — Distrato no Patrimônio de Afetação](https://abrainc.org.br/uploads/2021/05/Distrato-nos-empreendimentos-em-regime-de-Patrimonio-de-Afetacao.pdf)
- [CBIC — slides Melhim](https://cbic.org.br/wp-content/uploads/2019/05/2-MELHIM.pdf)
- [TJMT — afetação não comprovada, 25%](https://www.legjur.com/jurisprudencia/eme/191.1982.7772.1594)
- [TJRJ](https://www.legjur.com/jurisprudencia/eme/274.8806.8743.7536)
- [Cálculo Jurídico — TJMG limita a 25%](https://calculojuridico.com.br/tjmg-retencao-distrato-multipropriedade-25/)
- [TJSC — rescisão sem provar vício](https://www.sedep.com.br/?p=167749)
- [Migalhas — multipropriedade, devolução de 90%](https://www.migalhas.com.br/quentes/454220/multipropriedade-juiz-rescinde-contrato-e-determina-devolucao-de-90)

## 2. Correção da condenação (Lei 14.905/2024)

- Desde 30/08/2024, a **correção monetária é pelo IPCA** e os **juros de mora
  são a taxa legal**, que é a Selic menos o IPCA (Resolução CMN 5.171/2024). Se
  a taxa legal der negativa, conta como zero.
- **Efeito econômico:** IPCA mais (Selic − IPCA) dá aproximadamente a
  **Selic**. Em valor presente descontado pela Selic, esperar a sentença quase
  não perde dinheiro pelo tempo, porque a condenação cresce no mesmo ritmo. O
  custo real da espera está em três lugares:
  1. no **risco** de perder ou de a sentença sair menor;
  2. no **custo de capital do escritório**, quando ele é maior que a Selic;
  3. no fato de que **o acordo antes da sentença é nominal** e não tem correção.

  Por isso as regras têm duas taxas separadas: `taxa_desconto_anual` (o custo
  do escritório) e `taxa_atualizacao_judicial_anual` (a correção da
  condenação).
- **Para contratos pagos há muito tempo**, a correção desde cada desembolso
  pode tornar a sentença bem maior que os 80% nominais. Use `fator_correcao` no
  processo quando houver o extrato com as datas de pagamento.

Fontes:
- [Barbieri — juros legais e a Lei 14.905](https://www.barbieriadvogados.com/en/?p=4949)
- [Migalhas — aplicação no Judiciário do Paraná](https://www.migalhas.com.br/depeso/439890/lei-14-905-24-e-sua-aplicacao-no-judiciario-do-parana)
- [Damásio — Selic na omissão do título](https://juris.damasio.com.br/jurisprudencia/julgado/842/aplicacao-exclusiva-da-taxa-selic-como-juros-de-mora-na-omissao-do-titulo-judicial)

## 3. Tempo de tramitação

- No Justiça em Números 2025 do CNJ, a Justiça Estadual tem fase de
  conhecimento de cerca de **2 anos e 11 meses** e tempo total de 4 anos e
  1 mês. Esses números são de pendentes ou baixados e precisam ser conferidos
  no PDF.
- Um resumo secundário do Justiça em Números 2026 informa **1 ano e 3 meses**
  para a fase de conhecimento no 1º grau. A premissa de 15 meses saiu daqui.
- O número exato do TJPE está no painel Justiça em Números do CNJ, filtrando
  pelo TJPE, 1º grau, fase de conhecimento. O melhor dado, porém, é o nosso: a
  planilha PAINEL GERAL tem a data de ajuizamento e a fase de cada processo nas
  duas varas de Ipojuca. Quando as sentenças saírem, recalibre
  `protocolo_ate_sentenca_meses` com a mediana real.

Fontes:
- [CNJ — sumário executivo JN 2025](https://www.cnj.jus.br/wp-content/uploads/2025/10/sumario-executivo-2025.pdf)
- [Projuris — Justiça em Números 2026](https://www.projuris.com.br/blog/justica-em-numeros-2026/)
- [CNJ — TJPE supera metas 2025](https://www.cnj.jus.br/tjpe-supera-todas-as-metas-nacionais-do-cnj-em-2025/)

## 4. Risco de crédito da GAV

- Em 13/11/2026 não foi encontrada notícia de recuperação judicial da GAV. A
  empresa aparece em expansão e mudou o nome para GAV Hotéis e Resorts.
- Se surgir sinal de dificuldade (atraso em acordo, pedido de recuperação),
  **o acordo com pagamento em 15 dias ganha muito valor**, porque uma sentença
  contra uma empresa em recuperação vira crédito sujeito ao plano. Reavalie a
  carteira inteira nesse caso.
- O grupo de resorts que está em recuperação judicial é outro: o Gramado Parks,
  desde 2023.

Fontes:
- [Diário de Pernambuco — GAV aposta R$ 392 mi no Nordeste](https://www.diariodepernambuco.com.br/economia/2026/08/11722512-gav-aposta-rs-392-milhoes-no-nordeste-e-enfrenta-desafio-de-crescer-sem-esgotar-destinos.html)
- [Bloomberg Línea — grupo de Goiás quer liderar multipropriedade](https://www.bloomberglinea.com.br/negocios/grupo-de-goias-quer-liderar-multipropriedade-no-pais-e-lancar-r-1-bi-em-vgv-por-ano/)
- [Diário do Rio — GAV redesenha estratégia](https://diariodorio.com/turismo-e-viagem/2026/08/25/gav-redesenha-estrategia-mira-novo-ciclo-de-crescimento-na-hotelaria-e-nao-descarta-atuacao-no-rio.html)

## 5. Honorários: conduta na proposta ao cliente

- Mudar o percentual contratual exige **concordância expressa e por escrito do
  cliente**, por meio de um aditivo ao contrato de honorários.
- O cliente precisa receber a informação completa sobre as duas opções: valor,
  prazo e risco de cada uma.
- A recomendação deve ser a melhor **para o cliente**, e o ganho do escritório
  deve ser declarado. Nunca apresente o acordo como obrigatório nem omita que a
  sentença pode render mais em valor nominal.
- Os honorários sucumbenciais pertencem ao advogado (art. 23 da Lei
  8.906/94). Num acordo antes da sentença eles não existem, e é exatamente isso
  que a proposta de +7 pontos procura compensar.
