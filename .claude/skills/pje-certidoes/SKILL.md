---
name: pje-certidoes
description: Redige e lança certidões e atos ordinatórios do cartório criminal (Vara do Júri) no PJe do TJPE — tramitação regular, conclusão, vista à Defensoria/MP, art. 422, razões recursais, resposta à acusação, alegações finais. Use quando o usuário listar números de processo com a providência de cada um ("faz a certidão", "concluso", "vista à defensoria", "descarte", "não mexa"), pedir para "ativar o estagiário", ou pedir para olhar um agrupador do PJe.
---

# Certidões no PJe — cartório do Júri

O usuário é servidor do cartório. Ele dita, processo a processo, a providência;
o trabalho é transformar cada uma em certidão no modelo da casa e **deixá-la
salva no PJe**.

## Regra nº 1 — SALVAR SEMPRE

Certidão redigida e não salva é trabalho perdido. Em 10/11/2026 uma certidão
ficou sem salvar e o usuário chamou de "erro grotesco". Por isso:

1. Depois de colar o texto no editor do PJe, clique em **Salvar**.
2. **Confira** que salvou: o documento aparece salvo/pendente de assinatura na
   tarefa. Se não apareceu, não siga para o próximo processo.
3. No relatório final, marque cada processo como **salvo**, **salvo e
   assinado** ou **NÃO salvo (motivo)**. Nunca diga "feito" sem ter visto o
   documento salvo.
4. Sem acesso ao PJe (PC offline, sem navegador), diga isso logo e entregue os
   textos prontos para colar — mas lembre o usuário de **salvar** cada um.

## Regra nº 2 — o que pode ser assinado

- **Certidão de tramitação regular** ("feito regular", "aguarda audiência",
  "aguarda júri", "audiência já designada"): pode **salvar e assinar**. O
  usuário autorizou; não traz prejuízo possível.
- **Todo o resto** (conclusão, vista, art. 422, razões recursais, resposta à
  acusação, alegações finais): **salvar e deixar pendente de assinatura** dele.

## Regra nº 3 — obedecer à lista do dia, ao pé da letra

- **"Descarte"** → não lança nada; se houver rascunho de rodada anterior, não
  usa. "Todos os outros descarte" vale para tudo que não foi citado.
- **"Não mexa"** → não abre, não lança, não move o processo.
- Processo novo citado ("não estava na lista") entra normalmente.
- Nunca reaproveite a lista de um dia anterior: a lista vale só para a rodada.

## Modelos (use só estes; não invente texto)

| Situação | Texto |
|---|---|
| Tramitação regular | CERTIFICO que o processo encontra-se com a tramitação regular, em conformidade com a fase processual em curso. |
| Regular, audiência designada | CERTIFICO que o processo encontra-se com a tramitação regular, em conformidade com a fase processual em curso, com audiência já designada nos autos. |
| Regular, aguarda audiência (deliberação cumprida) | CERTIFICO que foi cumprida a última deliberação judicial proferida nos autos e que o processo encontra-se com a tramitação regular, em conformidade com a fase processual em curso, aguardando designação de audiência. |
| Regular, aguarda júri | CERTIFICO que o processo encontra-se com a tramitação regular, em conformidade com a fase processual em curso, aguardando designação de sessão de julgamento pelo Tribunal do Júri. |
| Genérico após MP | Ante a manifestação do Ministério Público, faço os autos conclusos para apreciação. |
| Genérico após manifestação | Tendo em vista a recente manifestação, faço os autos conclusos para apreciação. |
| Resposta à acusação | Certifico que foi apresentada Resposta à Acusação. Desta feita, faço os autos conclusos para apreciação. |
| Razões recursais | Certifico que houve apresentação de razões recursais. Desta feita, faço os autos conclusos. |
| Vista à Defensoria — art. 422 | Nesta data, abro vista dos autos à Defensoria Pública para manifestação na fase do art. 422 do CPP. |
| Vista à Defensoria — alegações finais (MP já apresentou) | Tendo em vista a apresentação de alegações finais pelo Ministério Público (ID ____), abre-se vista à Defensoria Pública para fins de apresentação de alegações finais por memoriais, nos termos do art. 403, § 3º, do CPP. |
| Alegações finais das duas partes | Tendo em vista as apresentações de Alegações Finais, faço os autos conclusos. |
| Defesa inerte nas alegações finais | CERTIFICO que acusação e defesa foram devidamente intimadas para apresentação das alegações finais, tendo o Ministério Público ofertado seus memoriais. A defesa, por sua vez, embora devidamente intimada para apresentação da peça, que é discricionária, quedou-se inerte, transcorrendo o prazo in albis. Desta feita, faço os autos conclusos. |
| Preclusão art. 422 | Certifico a preclusão da fase prevista no art. 422 do CPP, tendo os sujeitos da relação processual já se manifestado. Autos conclusos. |

Quando o usuário ditar o texto ("tendo em vista a informação trazida pela
defesa faço concluso"), use o que ele ditou, só corrigindo a grafia.

Não certifique o que não viu: tempestividade, data de audiência e IDs só
entram se estiverem no processo. Sem o dado, deixe de fora e avise.

## Onde isto roda

O PJe abre só com o login do usuário, no computador dele. Caminhos, nesta ordem:

1. **Claude no Chrome** no PC dele, com o PJe já logado — entregue o pedido
   abaixo para ele colar no painel do Claude.
2. **Desktop Commander** no PC (confira com `list_devices`; offline = não
   alcança).
3. Sem nenhum dos dois: textos prontos no chat + lembrete de salvar.

Nunca peça a senha do PJe no chat.

### Pedido pronto para o Claude no Chrome

Monte um bloco por processo, nesta forma:

```
Estou logado no PJe do TJPE. Para CADA processo abaixo: abra o processo pela
tarefa em que ele está, crie a certidão (ato ordinatório) com o texto indicado,
clique em SALVAR e confira que o documento ficou salvo antes de passar ao
próximo. Não assine nada, salvo onde estiver escrito "SALVAR E ASSINAR". Não
abra nem altere processos fora desta lista. No fim, me devolva uma tabela:
processo | salvo? | assinado? | observação.

1) <número> — SALVAR (pendente de assinatura)
Texto: <certidão>
```

## Agrupador — achar alegações finais / memoriais

Para "veja nas duas últimas páginas do agrupador": abrir o agrupador indicado
(ex.: Documentos não lidos), ir à última e à penúltima página e listar
processo | ID | tipo do documento | quem apresentou. Só leitura; a certidão de
cada um sai pela tabela de modelos acima.
