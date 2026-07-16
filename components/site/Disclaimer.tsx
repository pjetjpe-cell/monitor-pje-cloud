export default function Disclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      className={`rounded-lg border border-dipallacio-gold/50 bg-dipallacio-gold/10 text-dipallacio-navy-900 ${
        compact ? 'p-3 text-xs' : 'p-4 text-sm'
      }`}
    >
      <p className="font-semibold mb-1">Aviso importante</p>
      <p>
        Esta é uma estimativa educacional baseada em parâmetros gerais e no histórico de decisões
        semelhantes. Não constitui garantia de resultado, consultoria jurídica individualizada, nem
        promessa de valor ou prazo. Cada processo depende das provas e circunstâncias do caso concreto
        e da análise de um advogado.
      </p>
    </div>
  )
}
