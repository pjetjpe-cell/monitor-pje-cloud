// Montagem do pedido ao Antigravity — a MESMA função roda no painel (artefato)
// e na ponte do PC (`montar-painel.mjs` copia o código-fonte dela para o HTML),
// então o texto que você vê no painel é o texto que o agente recebe.
// Sem imports: precisa funcionar colada dentro do navegador.

export function limparCampo(valor, maximo) {
  // Uma linha só, sem aspas duplas (o PowerShell 5.1 as estraga ao repassar
  // argumento para programa) e sem caracteres de controle.
  return String(valor ?? '')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/"/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximo);
}

function validar(catalogo, tarefaId, camposBrutos) {
  const tarefa = catalogo.tarefas.find((t) => t.id === tarefaId);
  if (!tarefa) throw new Error(`tarefa desconhecida: ${tarefaId}`);
  const permitidos = [...tarefa.obrigatorios, ...tarefa.opcionais];
  const campos = {};
  for (const nome of permitidos) {
    const v = limparCampo(camposBrutos?.[nome], nome === 'obs' ? 500 : 200);
    if (v) campos[nome] = v;
  }
  const faltando = tarefa.obrigatorios.filter((n) => !campos[n]);
  if (faltando.length) {
    throw new Error('preencha: ' + faltando.map((n) => catalogo.campos[n]).join(', '));
  }
  if (campos.tipo && !catalogo.tipos_peticao.includes(campos.tipo)) {
    throw new Error(`tipo de petição fora da lista: ${campos.tipo}`);
  }
  return { tarefa, permitidos, campos };
}

function linhasDosCampos(catalogo, permitidos, campos) {
  const linhas = [];
  for (const nome of permitidos) {
    if (nome !== 'obs' && campos[nome]) linhas.push(`${catalogo.campos[nome]}: ${campos[nome]}.`);
  }
  if (campos.obs) linhas.push(`Observação do usuário: ${campos.obs}`);
  return linhas;
}

export function montarPedido(catalogo, tarefaId, camposBrutos) {
  const { tarefa, permitidos, campos } = validar(catalogo, tarefaId, camposBrutos);
  const linhas = [
    'Você está no repositório monitor-pje-cloud (esteira GAV do escritório Di PALLACIO).',
    'Leia primeiro .agent/rules/gav-esteira.md e cumpra todas as travas dele.',
  ];
  if (tarefa.workflow) {
    linhas.push(`Depois siga .agent/workflows/${tarefa.workflow}.md` +
      (tarefa.agente ? ` e o agente .claude/agents/${tarefa.agente}.md, inclusive a seção Caminhos alternativos.` : '.'));
  }
  linhas.push(`Tarefa: ${tarefa.rotulo}.`, ...linhasDosCampos(catalogo, permitidos, campos));
  linhas.push(
    'Não invente dado: o que não estiver em documento, pergunte.',
    'Peça autorização antes de enviar e-mail, compartilhar, renomear pasta existente, apagar ou instalar.',
    'Ao terminar, mostre a prova (saída das conferências, arquivos com tamanho, IDs) e o que ficou pendente.',
  );
  return { tarefa: tarefa.id, rotulo: tarefa.rotulo, campos, prompt: linhas.join('\n') };
}

// O mesmo pedido, escrito para o Claude (sessão na nuvem ou este chat): ele
// tem as skills e os agentes do repositório e chega ao PC pelo Desktop Commander.
export function montarPedidoClaude(catalogo, tarefaId, camposBrutos) {
  const { tarefa, permitidos, campos } = validar(catalogo, tarefaId, camposBrutos);
  const linhas = [
    `Tarefa da esteira GAV: ${tarefa.rotulo}.`,
    `Use ${tarefa.claude}.`,
    ...linhasDosCampos(catalogo, permitidos, campos),
    'Siga o passo a passo oficial (.claude/skills/gav-esteira/references/fluxo-video.md) e a seção Caminhos alternativos do agente.',
    'Não pule etapa, não invente dado, não escreva ao cliente e peça o pode antes de enviar e-mail, compartilhar, renomear pasta existente ou apagar.',
    'O computador do escritório é acessado pelo Desktop Commander; se estiver offline, diga isso e me entregue o comando pronto.',
    'Ao terminar, mostre a prova (conferências, arquivos com tamanho, IDs) e o que ficou pendente.',
  ];
  return { tarefa: tarefa.id, rotulo: tarefa.rotulo, campos, prompt: linhas.join('\n') };
}
