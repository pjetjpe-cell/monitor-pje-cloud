export const metadata = {
  title: 'Política de Privacidade — Di Pallacio Enterprise',
}

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Política de Privacidade</h1>
      <div className="prose prose-slate mt-8 max-w-none text-dipallacio-navy-800/80">
        <p>
          Esta Política de Privacidade descreve como a Di Pallacio Enterprise coleta, usa e protege os
          dados pessoais dos usuários deste site e plataforma, em conformidade com a Lei Geral de
          Proteção de Dados (Lei 13.709/2018 — LGPD).
        </p>

        <h2>1. Quais dados coletamos</h2>
        <ul>
          <li>Dados de cadastro: nome, e-mail, telefone e senha (armazenada de forma criptografada);</li>
          <li>Dados de formulários de contato/lead: nome, contato, empreendimento, valores informados e motivo da consulta;</li>
          <li>Dados de cotas cadastradas na área do cliente: contrato, pagamentos e simulações de cálculo;</li>
          <li>Dados de navegação (cookies técnicos necessários para autenticação).</li>
        </ul>

        <h2>2. Finalidade do tratamento</h2>
        <p>
          Os dados são utilizados exclusivamente para: (i) viabilizar a análise jurídica do seu caso;
          (ii) operar a área do cliente e a calculadora de estimativa de distrato; (iii) mediar contatos
          no marketplace de cotas e no mural de trocas, sem expor diretamente seus dados a terceiros;
          (iv) cumprir obrigações legais e regulatórias aplicáveis à advocacia.
        </p>

        <h2>3. Compartilhamento</h2>
        <p>
          Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing. Dados de
          contato entre usuários do marketplace e do mural de trocas são sempre mediados pela nossa
          equipe — nunca expostos diretamente entre as partes.
        </p>

        <h2>4. Prazo de retenção</h2>
        <p>
          Mantemos os dados pelo tempo necessário ao cumprimento das finalidades descritas acima e das
          obrigações legais aplicáveis, podendo ser mantidos por prazo adicional quando exigido por lei
          ou para exercício regular de direitos em eventual processo.
        </p>

        <h2>5. Segurança</h2>
        <p>
          Adotamos medidas técnicas e organizacionais para proteger os dados pessoais, incluindo
          criptografia de senhas e de dados sensíveis armazenados em repouso, e controle de acesso por
          perfil de usuário (cliente/administrador).
        </p>

        <h2>6. Seus direitos</h2>
        <p>
          Nos termos da LGPD, você pode solicitar a qualquer momento a confirmação da existência de
          tratamento, acesso, correção, anonimização, portabilidade ou eliminação dos seus dados
          pessoais, além de revogar o consentimento dado. Para exercer esses direitos, entre em contato
          pelos canais informados no rodapé deste site.
        </p>

        <h2>7. Alterações</h2>
        <p>
          Esta política pode ser atualizada periodicamente. Recomendamos a revisão deste documento com
          regularidade.
        </p>
      </div>
    </div>
  )
}
