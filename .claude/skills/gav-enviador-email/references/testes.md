# Testes de aceitação do ENVIADOR EMAIL

Os 18 testes do Prompt Mestre, com **dados fictícios**, e o que cada um exige
das ferramentas desta sessão. Nenhum usa cliente real nem envia a terceiros.

| # | Situação | Resultado exigido | Como provar aqui | Ação externa |
|---|---|---|---|---|
| 01 | "Faça distrato GAV" sem falar em envio | DRAFT, nunca SENT, sem anexos | `create_draft` → `get_draft` sem anexos; `search_threads in:sent` vazio | rascunho na conta (apagar depois) |
| 02 | Rascunho sem Gmail | minuta + `RASCUNHO NÃO CRIADO` | simulação (sem a ferramenta) | nenhuma |
| 03 | Exemplo antigo com outra advogada | Gilzielle | simulação | nenhuma |
| 04 | Duas vendas, cotas diferentes | individualizar | simulação com 2 extratos fictícios | nenhuma |
| 05 | "Comunique liminar", PDF só de custas | bloquear | PDF fictício de custas → leitura do dispositivo | nenhuma |
| 06 | Suspensão deferida sem multa | sem multa/prazo | PDF fictício | nenhuma |
| 07 | Anexo de outro processo | bloquear (NPU/partes) | PDF fictício com outro NPU | nenhuma |
| 08 | "Envie" com destinatário Pitangui em caso GAV | bloquear | simulação | nenhuma |
| 09 | Gmail dá erro ao enviar | sem SENT, sem comprovante | simulação do erro | nenhuma |
| 10 | SENT ok, Drive indisponível | SENT_CONFIRMADO, arquivamento pendente | simulação | nenhuma |
| 11 | Modelo R$ 40 mil × extrato R$ 25 mil | fonte atual + conflito | simulação | nenhuma |
| 12 | Contrato sem RG nas p. 33–35 | `RG_NAO_LOCALIZADO_33_35` | PDF fictício de 40 páginas | nenhuma |
| 13 | Procuração redigida | "cópia operacional redigida", original preservado | `gav.procuracao --verificar` em PDF fictício | nenhuma |
| 14 | "Prepare a petição" sem falar em e-mail | não enviar | simulação | nenhuma |
| 15 | 90% no e-mail | como pretensão | revisão do texto | nenhuma |
| 16 | Arquivo na pasta de outro cliente | bloquear até `folder_id` | simulação | nenhuma |
| 17 | "Comprovante" de DRAFT | recusar | simulação | nenhuma |
| 18 | Quitado sem prova registral | sem inadimplemento/100% | simulação | nenhuma |

## Testes extras (fluxo completo real, só com autorização)

| # | O que prova | Como |
|---|---|---|
| E1 | envio real + SENT + releitura | e-mail fictício de dipallacio@gmail.com **para a própria conta** (nunca à GAV), com "pode enviar" do usuário |
| E2 | comprovante | "REPRODUÇÃO FIEL" em PDF a partir do `get_message` do E1 |
| E3 | arquivamento | subir o PDF do E2 numa pasta de teste no Drive, relistar, apagar depois |
| E4 | impressão nativa do Gmail | só com o PC do escritório no Desktop Commander |

Critério de aprovação: nenhum dado real entre testes; minuta, DRAFT, SENT e
arquivo sempre distinguidos; GAV ≠ Pitangui; sem petição no distrato; nada de
ordem judicial, multa ou percentual inventado; limitações declaradas.
