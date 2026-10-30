# Limpeza da procuração

## O caso que originou a etapa

A procuração da cliente 193 (JANICE) foi para os autos como
`01 - PROCURAÇÃO - JANICE.pdf`. Extraindo o texto dela e do original assinado, os
dois são **idênticos**: os 21%, a base de cálculo e o meio salário mínimo
continuam lá. O arquivo "limpo" era uma cópia renomeada. A etapa nunca rodou, e
nada no processo acusou.

Por isso a ferramenta reabre o arquivo que gerou e prova que está limpo, em vez
de confiar que a limpeza funcionou.

## O que sai

| Alvo | Exemplo |
|---|---|
| Destaque do percentual | `VINTE E UM POR CENTO 21%` |
| Base de cálculo | `sobre o valor restituído com as devidas correções` |
| Meio salário mínimo | `Meio salário mínimo (0,5 SM) devido exclusivamente na data da decisão de suspensão das parcelas` |
| Declaração I | `Declaro estar ciente dos honorários de 21%...` |
| Declaração II | `Declaro estar ciente de que o valor equivalente a meio salário mínimo...` |

Cláusula quebrada em duas linhas sai inteira: remover só a primeira deixaria a
cauda (`...devidos ao final do processo.`) pendurada nos autos.

## O que fica — conferido a cada execução

Outorgante, CPF, endereço, outorgados e OAB, **os três blocos de PODERES
CONFERIDOS**, declarações III e IV, data, assinatura.

Atenção ao poder `requerer suspensão das parcelas contratuais` (PODERES III):
é **poder**, não cláusula de pagamento. Tem de ficar. O padrão de remoção exige
`decisão de suspensão das parcelas`, que só aparece na cláusula de honorários.

E `100% online` na declaração III não é percentual de honorário. O padrão
`\b\d{1,2}\s*%` não casa dentro de `100%`.

## Por que não se pinta por cima

`apply_redactions()` apaga os glifos do fluxo de conteúdo. Tarja desenhada por
cima deixa o texto no arquivo: sai num copiar-colar, num `pdftotext` ou na
indexação do PJe.

## Por que `--fundo auto` é o padrão

Removendo só os glifos, o fundo original fica intocado — caixa colorida, papel
timbrado, gradiente, tudo como estava. Casa melhor que qualquer cor amostrada,
porque **é** a cor original. `--fundo amostrar` pinta a cor predominante por
cima; use só se sobrar resíduo visível.

## Por que as declarações não são renumeradas

Sobram `III` e `IV` sem `I` e `II`. É de propósito. Renumerar significa escrever
texto novo num instrumento assinado — suprimir por sigilo é uma coisa, reescrever
é outra. A lacuna visível mostra que houve supressão, o que protege o escritório.

## Nota sobre o uso

O manifesto em `NÃO USAR/manifesto-procuracao.json` registra o que foi removido,
os hashes do original e do limpo, e a data. Guarde-o: é a trilha que demonstra
que a supressão foi de cláusula de honorários — matéria entre advogado e
cliente — e não de conteúdo do mandato.

Se o juízo ou a parte contrária pedir a procuração integral, entregue o original
da `NÃO USAR`. A versão limpa é para instruir a inicial, não para negar que o
contrato de honorários existe.

## Modo do vídeo 05 — cobrir o quadro e imprimir em PDF

O escritório altera a procuração no Firefox: recorta um pedaço **vazio do fundo**
(Ferramenta de Captura), cola como imagem por cima do quadro de honorários
(percentual, "honorário de êxito", salário mínimo, entrada), redimensiona e
**Imprime → Salvar como PDF** sobre `01 PROCURAÇÃO`. Na procuração interativa
Di PALLACIO o alvo é o quadro do percentual (página 1); as declarações seguem
como estão.

Seja qual for o modo, a etapa só fica `ok` com:

```bash
python3 -m gav.procuracao "01 PROCURAÇÃO.pdf" --verificar
```

Lê o texto — ou faz **OCR** quando o PDF é imagem — e reprova se sobrar
percentual (18%, 23 %...), "por cento", salário mínimo, "2/3", "(0,5 SM)";
reprova também se sumir outorgante, CPF/RG, poderes ou OAB. Colar a imagem e
salvar o PDF **sem imprimir** deixa o texto por baixo: a conferência pega.
"100% online" não é honorário e não reprova.
