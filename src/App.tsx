import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginView } from './features/auth/LoginView';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewView } from './features/overview/OverviewView';
import { AdminView } from './features/admin/AdminView';
import { FinanceiroView } from './features/financial/FinanceiroView';
import { ConteudosView } from './features/conteudos/ConteudosView';
import { CalendarioView } from './features/calendario/CalendarioView';
import { MidiaView } from './features/midia/MidiaView';
import { ModulePlaceholder } from './features/placeholders/ModulePlaceholder';
import { AppArea } from './types/auth';
import { ShieldAlert } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { user, isLoading, hasAccess } = useAuth();
  const [currentTab, setCurrentTab] = useState<AppArea | 'admin'>('visao_geral');

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA]">
        <img
          src="/Assets/logoENG.svg"
          alt="EngenhArq Logo"
          className="h-10 w-auto mb-4 animate-pulse"
        />
        <div className="w-6 h-6 border-2 border-[#DE3A39]/30 border-t-[#DE3A39] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Verificar permissão da aba atual
  const isSuperadmin = user.role === 'superadmin';
  const isAllowed =
    currentTab === 'visao_geral' ||
    (currentTab === 'admin' ? isSuperadmin : hasAccess(currentTab, 'consulta'));

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA]">
      {/* Barra Lateral Fixa */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header currentTab={currentTab} />

        <main className="flex-1 overflow-y-auto">
          {!isAllowed ? (
            <div className="p-12 max-w-lg mx-auto text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 text-[#DE3A39] flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-[#373535]">Acesso Restrito</h2>
              <p className="text-sm text-gray-500">
                Você não possui permissão para visualizar esta área. Solicite liberação ao Superadministrador.
              </p>
              <button
                onClick={() => setCurrentTab('visao_geral')}
                className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors cursor-pointer"
              >
                Voltar à Visão Geral
              </button>
            </div>
          ) : currentTab === 'visao_geral' ? (
            <OverviewView onNavigate={(tab) => setCurrentTab(tab)} />
          ) : currentTab === 'admin' ? (
            <AdminView />
          ) : currentTab === 'financeiro' ? (
            <FinanceiroView />
          ) : currentTab === 'conteudos' ? (
            <ConteudosView />
          ) : currentTab === 'calendario' ? (
            <CalendarioView />
          ) : currentTab === 'midia' ? (
            <MidiaView />
          ) : currentTab === 'imobiliarias' ? (
            <ModulePlaceholder
              area="imobiliarias"
              stepNumber={6}
              title="Leads e Imobiliárias (CVCRM)"
              description="Indicadores e gráficos de distribuição por imobiliária parceira, visitas e conversão em vendas via CVCRM."
              onBack={() => setCurrentTab('visao_geral')}
            />
          ) : currentTab === 'relatorios' ? (
            <ModulePlaceholder
              area="relatorios"
              stepNumber={8}
              title="Relatórios Executivos em PDF"
              description="Geração padronizada no cliente com gráficos em alta resolução e identidade visual EngenhArq."
              onBack={() => setCurrentTab('visao_geral')}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
