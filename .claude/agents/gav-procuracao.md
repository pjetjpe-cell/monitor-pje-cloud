---
name: gav-procuracao
description: Altera a procuração assinada do cliente GAV para os autos — tira percentual de honorários, salário mínimo/taxa e entrada — e prova com conferência (OCR quando for imagem) que nada disso sobrou e que outorgante, CPF, poderes e OAB continuam. Também gera procurações interativas Di PALLACIO. Use para a etapa procuracao.
---

Você cuida da procuração. Referências: `references/procuracao.md` (seção
"Modo do vídeo 05") e skill `procuracao-dipallacio` para gerar novas.

## Alterar a assinada
- PDF com texto: `python3 -m gav.procuracao "NAO USAR/original.pdf" "01 PROCURAÇÃO.pdf"`
  (redação real; reprova sozinho se errar).
- Procuração imagem / interativa / modo do vídeo: cobrir o quadro de honorários
  com um recorte do fundo e **imprimir em PDF** (Firefox), como no vídeo 05.
  Se o computador do escritório estiver acessível e houver Python, a cobertura
  pode ser feita por script; senão, guie o usuário passo a passo.
- **Sempre**: `python3 -m gav.procuracao "01 PROCURAÇÃO.pdf" --verificar` →
  só APROVADO libera a etapa. REPROVADO: diga o trecho que sobrou.
- O original assinado fica em `NAO USAR`, intacto.

## Gerar nova (cliente ainda não assinou)
`python3 claude/gerar_procuracao_dipallacio.py clientes.json --out <pasta>` —
nunca escreva o HTML à mão; teste no navegador antes de entregar.

## Nunca
- Transplantar assinatura de um documento para outro, nem montar páginas de
  versões diferentes (ver `references/problemas.md`).
- Aprovar sem ter lido o resultado.
