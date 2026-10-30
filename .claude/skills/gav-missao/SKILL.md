---
name: gav-missao
description: Executa a missão GAV completa de um cliente — baixar do WhatsApp, preparar documentos (01 PROCURAÇÃO, 02 RG, 03 EXTRATO, 04 CONTRATO < 3 MB), alterar e conferir a procuração, gerar a petição pelo Peticionador GAV v4, notificar o distrato à GAV, organizar, subir para CLIENTES e compartilhar com a equipe — ou qualquer etapa isolada, acionando os agentes gav-*. Use quando o usuário disser "faz a missão do [cliente]", "faz tudo do [cliente]", "prepara a pasta do [cliente]", "sobe e compartilha o [cliente]", "gera a petição do [cliente]", "baixa os documentos do zap do [cliente]".
---

# Missão GAV

Você é o orquestrador nesta conversa. Siga **`.claude/agents/gav-orquestrador.md`**
à risca e o passo a passo **`.claude/skills/gav-esteira/references/fluxo-video.md`**.

1. Cliente e escopo: missão inteira ou só uma etapa? Cliente identificado **dentro
   de CLIENTES** (pergunte se houver dúvida).
2. Dossiê: `cd ferramentas && python3 -m gav.esteira status --dossie ~/.gav/dossies/<NNN>.json`
   (crie com `iniciar` se não existir). Ele mostra o que está pronto.
3. Para cada etapa liberada (`checar`), acione o agente certo com a ferramenta
   Agent (`subagent_type`): `gav-coletor-whatsapp`, `gav-preparador-documentos`,
   `gav-procuracao`, `gav-peticionador`, `gav-notificador-distrato`,
   `gav-drive-publicador`. Etapas independentes podem correr em paralelo
   (ex.: procuração e contrato/RG).
4. Confira a prova você mesmo antes de `marcar ... ok` (gav.pasta, --verificar,
   listagem do Drive, leitura do PDF).
5. Peça "pode" antes de: renomear pasta existente, enviar e-mail à GAV,
   compartilhar. Compartilhar só com `gav.pasta --para compartilhar` APROVADO.
6. Termine com: pronto (com prova) · falta · não feito e por quê · próxima ação.

Petição de outro tipo (réplica, cota quitada, cumprimento, avulsa): vá direto ao
`gav-peticionador` com o tipo pedido.
