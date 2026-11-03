import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppArea } from '../../types/auth';

interface HeaderProps {
  currentTab: AppArea | 'admin';
}

const titles: Record<AppArea | 'admin', { title: string; subtitle: string }> = {
  visao_geral: {
    title: 'Visão Geral',
    subtitle: 'Painel central de indicadores de marketing da EngenhArq',
  },
  financeiro: {
    title: 'Financeiro',
    subtitle: 'Acompanhamento de pagamentos, cobranças e previsão com Sienge',
  },
  midia: {
    title: 'Mídia e Campanhas',
    subtitle: 'Indicadores do Instagram e contas de anúncios Meta',
  },
  conteudos: {
    title: 'Conteúdos',
    subtitle: 'Quadro Kanban de produção e aprovação de redes sociais',
  },
  calendario: {
    title: 'Calendário',
    subtitle: 'Agenda geral de reuniões estratégicas e eventos da construtora',
  },
  imobiliarias: {
    title: 'Leads e Imobiliárias',
    subtitle: 'Distribuição de leads e conversões integradas com CVCRM',
  },
  relatorios: {
    title: 'Relatórios Executivos',
    subtitle: 'Exportação padronizada em PDF com gráficos incorporados',
  },
  admin: {
    title: 'Administração de Usuários e Permissões',
    subtitle: 'Gerenciamento de contas, acessos por aba e auditoria do sistema',
  },
};

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const current = titles[currentTab] || { title: 'Central de Marketing', subtitle: '' };

  // Data atual no formato brasileiro (São Paulo)
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Primeira letra maiúscula no dia da semana
  const capitalizedDate =
    todayFormatted.charAt(0).toUpperCase() + todayFormatted.slice(1);

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-8 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-lg font-bold text-[#373535] leading-tight">
          {current.title}
        </h1>
        <p className="text-xs text-gray-500">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-medium text-gray-700">{capitalizedDate}</p>
          <p className="text-[11px] text-gray-400">
            Conectado como <strong className="text-[#373535]">{user?.username}</strong>
          </p>
        </div>
      </div>
    </header>
  );
};

