import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppArea } from '../../types/auth';
import { ChevronRight, Clock, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentTab: AppArea | 'admin';
}

const titles: Record<AppArea | 'admin', { title: string; subtitle: string }> = {
  visao_geral: {
    title: 'Visão Geral',
    subtitle: 'Painel analítico executivo e inteligência de marketing',
  },
  financeiro: {
    title: 'Financeiro',
    subtitle: 'Gestão de despesas, fluxo de caixa e integração com Sienge',
  },
  midia: {
    title: 'Mídia e Campanhas',
    subtitle: 'Métricas de tráfego pago, Meta Ads e Instagram Insights',
  },
  conteudos: {
    title: 'Conteúdos',
    subtitle: 'Quadro Kanban de produção e aprovação para redes sociais',
  },
  calendario: {
    title: 'Calendário',
    subtitle: 'Agenda geral de reuniões estratégicas e eventos da construtora',
  },
  imobiliarias: {
    title: 'Leads e Imobiliárias',
    subtitle: 'Distribuição da fila TOP 5 e esteiras comerciais integradas ao CVCRM',
  },
  relatorios: {
    title: 'Relatórios Executivos',
    subtitle: 'Exportação executiva em PDF com identidade corporativa',
  },
  admin: {
    title: 'Administração do Sistema',
    subtitle: 'Gestão de contas, permissões por aba e controle de acessos',
  },
};

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
  const { user } = useAuth();
  const current = titles[currentTab] || { title: 'Marketing Control', subtitle: '' };

  // Data atual no formato brasileiro (São Paulo)
  const todayFormatted = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(new Date());

  return (
    <header className="h-[60px] bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between flex-shrink-0 z-10">
      {/* Lado Esquerdo: Breadcrumb & Título */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <span className="hidden sm:inline">Marketing Control</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 hidden sm:inline" />
          <span className="font-bold text-slate-900 text-sm truncate">
            {current.title}
          </span>
        </div>
      </div>

      {/* Lado Direito: Horário, Fuso e Perfil */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Data & Fuso */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200/70 rounded-lg text-[11px] font-medium text-slate-600">
          <Clock className="w-3 h-3 text-slate-400" />
          <span className="capitalize">{todayFormatted}</span>
          <span className="text-slate-300">•</span>
          <span>BRT</span>
        </div>

        {/* Badge do Usuário */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-100">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800 leading-tight">
              {user?.username}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-medium">
              {user?.role === 'superadmin' ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-[#B21010]" />
                  <span>Superadmin</span>
                </>
              ) : (
                'Membro'
              )}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
