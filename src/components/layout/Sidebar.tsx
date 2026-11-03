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
} from 'lucide-react';

interface SidebarProps {
  currentTab: AppArea | 'admin';
  onSelectTab: (tab: AppArea | 'admin') => void;
}

interface NavItem {
  id: AppArea;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'visao_geral', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'midia', label: 'Mídia e campanhas', icon: Megaphone },
  { id: 'conteudos', label: 'Conteúdos', icon: Kanban },
  { id: 'calendario', label: 'Calendário', icon: Calendar },
  { id: 'imobiliarias', label: 'Leads e imobiliárias', icon: Building2 },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user, hasAccess, logout } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen flex-shrink-0 select-none">
      {/* Topo: Logo Oficial */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100">
        <img
          src="/Assets/logoENG.svg"
          alt="EngenhArq Logo"
          className="h-8 w-auto max-w-[170px] object-contain"
        />
      </div>

      {/* Navegação Principal */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
          Módulos
        </div>

        {navItems.map((item) => {
          const allowed = hasAccess(item.id, 'consulta');
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          if (!allowed && !isSuperadmin) {
            return null;
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#DE3A39] text-white shadow-sm'
                  : 'text-[#373535] hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-gray-500'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Rodapé: Área Administrativa e Perfil */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/70 space-y-1.5">
        {/* Acesso compacto à Administração apenas para Superadministrador */}
        {isSuperadmin && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'admin'
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#DE3A39]" />
            <span className="truncate">Administração e Acessos</span>
          </button>
        )}

        {/* Card do Usuário Logado */}
        <div className="flex items-center justify-between px-2.5 py-2 rounded-lg bg-white border border-gray-200/80 shadow-xs">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-[#373535] truncate">
              {user?.full_name || user?.username}
            </p>
            <span className="inline-flex items-center text-[10px] font-medium text-gray-500">
              {isSuperadmin ? (
                <span className="text-[#DE3A39] font-semibold">Superadministrador</span>
              ) : (
                'Equipe Marketing'
              )}
            </span>
          </div>
          <button
            onClick={logout}
            title="Sair do sistema"
            className="p-1.5 text-gray-400 hover:text-[#DE3A39] hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

