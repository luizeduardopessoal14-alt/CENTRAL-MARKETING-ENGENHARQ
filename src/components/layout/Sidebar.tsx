import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppArea } from '../../types/auth';
import {
  LayoutDashboard,
  DollarSign,
  Megaphone,
  Kanban,
  Calendar,
  Building2,
  FileText,
  ShieldCheck,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  currentTab: AppArea | 'admin';
  onSelectTab: (tab: AppArea | 'admin') => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: AppArea;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'visao_geral', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'midia', label: 'Mídia e Campanhas', icon: Megaphone },
  { id: 'conteudos', label: 'Conteúdos', icon: Kanban },
  { id: 'calendario', label: 'Calendário', icon: Calendar },
  { id: 'imobiliarias', label: 'Leads e Imobiliárias', icon: Building2 },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { user, hasAccess, logout } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  // Iniciais do usuário para o avatar
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col h-screen flex-shrink-0 select-none relative transition-all duration-200 ease-in-out z-20 ${
        isCollapsed ? 'w-[72px]' : 'w-[250px]'
      }`}
    >
      {/* Topo: Logo Oficial e Botão de Retração */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img
            src="/Assets/logoENG.svg"
            alt="EngenhArq Logo"
            className="h-7 w-auto object-contain flex-shrink-0"
          />
          {!isCollapsed && (
            <span className="text-[13px] font-bold text-slate-900 tracking-tight whitespace-nowrap">
              Marketing <span className="text-[#B21010] font-black">Control</span>
            </span>
          )}
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        {!isCollapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Plataforma
          </div>
        )}

        {navItems.map((item) => {
          const allowed = hasAccess(item.id, 'consulta');
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          if (!allowed && !isSuperadmin) {
            return null;
          }

          return (
            <div key={item.id} className="relative group">
              <button
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer relative ${
                  isActive
                    ? 'bg-[#FDF2F2] text-[#B21010] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
              >
                {/* Indicador de barra ativa lateral */}
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-[#B21010]" />
                )}

                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-[#B21010]' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />

                {!isCollapsed && (
                  <span className="truncate text-left flex-1 font-medium">
                    {item.label}
                  </span>
                )}
              </button>

              {/* Tooltip flutuante quando colapsado */}
              {isCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-dropdown z-50 pointer-events-none">
                  {item.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé: Área Administrativa e Perfil */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 space-y-2">
        {/* Acesso à Administração para Superadministrador */}
        {isSuperadmin && (
          <div className="relative group">
            <button
              onClick={() => onSelectTab('admin')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-200/80'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <ShieldCheck className="w-4 h-4 text-[#B21010] flex-shrink-0" />
              {!isCollapsed && <span className="truncate">Administração</span>}
            </button>

            {isCollapsed && (
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-dropdown z-50 pointer-events-none">
                Administração
              </div>
            )}
          </div>
        )}

        {/* Card do Usuário e Logout */}
        <div
          className={`flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/70 shadow-xs ${
            isCollapsed ? 'flex-col gap-2 p-1.5' : ''
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#FDF2F2] border border-red-100 text-[#B21010] font-black text-xs flex items-center justify-center flex-shrink-0">
              {getInitials(user?.username)}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                  {user?.username}
                </p>
                <p className="text-[10px] text-slate-400 capitalize truncate">
                  {user?.role === 'superadmin' ? 'Superadmin' : 'Membro'}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-[#B21010] hover:bg-red-50 transition-colors cursor-pointer"
            title="Encerrar sessão"
            aria-label="Sair da conta"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
