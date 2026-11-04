import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  MetaIntegrationConfig,
  MetaCampaignInsight,
  InstagramInsight,
  MetaPeriodFilter,
  CampaignObjectiveFilter,
  CAMPAIGN_OBJECTIVES,
} from '../../types/midia';
import { midiaService } from '../../services/midiaService';
import { MetaConfigModal } from './MetaConfigModal';
import {
  Megaphone,
  Settings,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  DollarSign,
  Key,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const MidiaView: React.FC = () => {
  const { user, hasAccess } = useAuth();
  const canEdit = hasAccess('midia', 'edicao');

  // Estados principais
  const [config, setConfig] = useState<MetaIntegrationConfig | null>(null);
  const [campaigns, setCampaigns] = useState<MetaCampaignInsight[]>([]);
  const [prevCampaigns, setPrevCampaigns] = useState<MetaCampaignInsight[]>([]);
  const [instagramData, setInstagramData] = useState<InstagramInsight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [periodFilter, setPeriodFilter] = useState<MetaPeriodFilter>('este_mes');
  const [objectiveFilter, setObjectiveFilter] = useState<CampaignObjectiveFilter>('todos');
  const [activeTab, setActiveTab] = useState<'ads' | 'instagram'>('ads');

  // Modal
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Carregar dados
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [configRes, campaignsRes, instaRes] = await Promise.all([
        midiaService.getConfig(),
        midiaService.getCampaignInsights(periodFilter, objectiveFilter),
        midiaService.getInstagramInsights(periodFilter),
      ]);

      if (configRes.error) {
        setError(configRes.error);
      } else {
        setConfig(configRes.data);
      }

      setCampaigns(campaignsRes.data);
      setPrevCampaigns(campaignsRes.prevData);
      setInstagramData(instaRes.latest);
    } catch {
      setError('Erro ao carregar dados de mídia e campanhas.');
    } finally {
      setIsLoading(false);
    }
  }, [periodFilter, objectiveFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Totais agregados calculados pelo serviço
  const totals = useMemo(() => {
    return midiaService.calculateTotals(campaigns, prevCampaigns);
  }, [campaigns, prevCampaigns]);

  // Formatação em Real (BRL)
  const formatCurrency = (val: number | null) => {
    if (val === null || isNaN(val)) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatNumber = (val: number | null) => {
    if (val === null || isNaN(val)) return '-';
    return new Intl.NumberFormat('pt-BR').format(val);
  };

  const isConnected = config?.status === 'conectado';
  const hasConfiguredIds = Boolean(config?.ad_account_id || config?.instagram_business_id);

  // Calcular variações percentuais
  const spendDiffPercent = totals.prevPeriodSpend > 0
    ? ((totals.totalSpend - totals.prevPeriodSpend) / totals.prevPeriodSpend) * 100
    : null;

  const leadsDiffPercent = totals.prevPeriodLeads > 0
    ? ((totals.totalLeads - totals.prevPeriodLeads) / totals.prevPeriodLeads) * 100
    : null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#F8F9FA]">
      {/* 1. Header do Módulo */}
      <div className="bg-white border-b border-gray-200/80 px-6 py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#B21010] flex items-center justify-center">
                <Megaphone className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-[#373535]">Mídia & Campanhas</h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Acompanhamento de investimento em anúncios Meta e métricas de desempenho do Instagram
            </p>
          </div>

          {/* Status da Integração e Botão de Configuração */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs bg-gray-50 border-gray-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? 'bg-emerald-500'
                    : hasConfiguredIds
                    ? 'bg-amber-500'
                    : 'bg-gray-400'
                }`}
              />
              <span className="text-gray-700 font-medium">
                {isConnected
                  ? 'Meta API Conectada'
                  : hasConfiguredIds
                  ? 'IDs Salvos (Token Pendente)'
                  : 'Desconectado'}
              </span>
            </div>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-gray-500" />
                <span>Configurar IDs / Conexão</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Barra de Filtros e Abas */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          {/* Abas Meta Ads vs Instagram */}
          <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('ads')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'ads'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5 text-blue-600" />
              <span>Anúncios (Meta Ads)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('instagram')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'instagram'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
              <span>Perfil do Instagram</span>
            </button>
          </div>

          {/* Filtros de Período e Objetivo */}
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'ads' && (
              <select
                value={objectiveFilter}
                onChange={(e) => setObjectiveFilter(e.target.value as CampaignObjectiveFilter)}
                className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B21010] transition-all"
              >
                {CAMPAIGN_OBJECTIVES.map((obj) => (
                  <option key={obj.id} value={obj.id}>
                    {obj.label}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as MetaPeriodFilter)}
                className="bg-transparent border-none text-[#373535] font-medium focus:outline-none cursor-pointer"
              >
                <option value="este_mes">Este Mês</option>
                <option value="mes_anterior">Mês Anterior</option>
                <option value="ultimos_30_dias">Últimos 30 dias</option>
                <option value="ultimos_90_dias">Últimos 90 dias</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Área de Conteúdo */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <div className="w-8 h-8 border-2 border-[#B21010]/30 border-t-[#B21010] rounded-full animate-spin" />
            <p className="text-xs">Carregando métricas de mídia...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
                <div>
                  <p className="font-semibold">Erro ao carregar dados:</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}

        {/* Banner Informativo se não estiver conectado à API */}
        {!isConnected && (
          <div className="bg-gradient-to-r from-blue-50/80 via-white to-gray-50 border border-blue-200/80 rounded-2xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                    {hasConfiguredIds
                      ? 'Identificadores da Meta salvos no sistema'
                      : 'Aguardando Configuração dos IDs da Meta'}
                  </h3>
                  <p className="text-xs text-blue-800/80 mt-1 max-w-2xl leading-relaxed">
                    {hasConfiguredIds ? (
                      <>
                        Conta de Anúncios:{' '}
                        <strong>{config?.ad_account_id || 'Não informado'}</strong> &bull;
                        Instagram ID:{' '}
                        <strong>{config?.instagram_business_id || 'Não informado'}</strong>.
                        A estrutura de relatórios está pronta e começará a receber os dados automáticos assim que o token for conectado.
                      </>
                    ) : (
                      'Para acompanhar seus anúncios e Instagram, clique em "Configurar IDs / Conexão" e salve o ID da Conta de Anúncios e do Instagram Business.'
                    )}
                  </p>
                </div>
              </div>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsConfigModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors cursor-pointer flex-shrink-0"
                >
                  {hasConfiguredIds ? 'Gerenciar IDs da Meta' : 'Vincular IDs da Meta'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 4. Grid de Indicadores Principais (KPIs) */}
        {activeTab === 'ads' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Investimento Total */}
              <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Investimento Total
                  </span>
                  <div className="p-1.5 rounded-lg bg-gray-50 text-gray-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-[#373535]">
                  {formatCurrency(totals.totalSpend)}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] mt-2">
                  {spendDiffPercent !== null ? (
                    <span
                      className={`flex items-center gap-0.5 font-semibold ${
                        spendDiffPercent > 0 ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      {spendDiffPercent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(spendDiffPercent).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-400 font-medium">-</span>
                  )}
                  <span className="text-gray-400">vs período anterior</span>
                </div>
              </div>

              {/* Card 2: Cadastros Gerados (Leads) */}
              <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Cadastros Gerados (Leads)
                  </span>
                  <div className="p-1.5 rounded-lg bg-red-50 text-[#B21010]">
                    <Target className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-[#373535]">
                  {formatNumber(totals.totalLeads)}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] mt-2">
                  {leadsDiffPercent !== null ? (
                    <span
                      className={`flex items-center gap-0.5 font-semibold ${
                        leadsDiffPercent >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {leadsDiffPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(leadsDiffPercent).toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-gray-400 font-medium">-</span>
                  )}
                  <span className="text-gray-400">Formulários nativos Meta</span>
                </div>
              </div>

              {/* Card 3: Custo Médio por Cadastro (CPL) */}
              <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Custo por Cadastro (CPL)
                  </span>
                  <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-[#373535]">
                  {formatCurrency(totals.avgCostPerLead)}
                </div>
                <div className="text-[11px] text-gray-400 mt-2">
                  {totals.prevPeriodCpl !== null
                    ? `Anterior: ${formatCurrency(totals.prevPeriodCpl)}`
                    : 'Custo unitário do lead'}
                </div>
              </div>

              {/* Card 4: Alcance & CPM */}
              <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Alcance Único
                  </span>
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xl font-bold text-[#373535]">
                  {formatNumber(totals.totalReach)}
                </div>
                <div className="text-[11px] text-gray-400 mt-2 flex items-center justify-between">
                  <span>{formatNumber(totals.totalImpressions)} impressões</span>
                  <span>CPM: {formatCurrency(totals.avgCpm)}</span>
                </div>
              </div>
            </div>

            {/* Tabela de Campanhas */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#373535]">Campanhas de Anúncios</h3>
                  <p className="text-[11px] text-gray-500">
                    Desempenho individual por objetivo e investimento
                  </p>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {campaigns.length} campanha(s) listada(s)
                </span>
              </div>

              {campaigns.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Megaphone className="w-8 h-8 text-gray-300 mx-auto" />
                  <h4 className="text-xs font-bold text-[#373535]">Nenhum dado sincronizado no período</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    {isConnected
                      ? 'Nenhuma campanha veiculada encontrada para os filtros selecionados.'
                      : 'Os dados das campanhas serão apresentados aqui assim que a conexão da Meta for concluída com o token.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/70 border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-6">Campanha</th>
                        <th className="py-3 px-4">Objetivo</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Investimento</th>
                        <th className="py-3 px-4 text-right">Cadastros</th>
                        <th className="py-3 px-4 text-right">CPL</th>
                        <th className="py-3 px-4 text-right">Alcance</th>
                        <th className="py-3 px-4 text-right">Impressões</th>
                        <th className="py-3 px-6 text-right">CPM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {campaigns.map((camp) => (
                        <tr key={camp.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-6 font-semibold text-[#373535] max-w-xs truncate">
                            {camp.campaign_name}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 capitalize">
                            {camp.objective}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                camp.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {camp.status === 'ACTIVE' ? 'Ativa' : 'Pausada'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-[#373535]">
                            {formatCurrency(camp.spend)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-semibold text-red-600">
                            {formatNumber(camp.leads)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-gray-700">
                            {formatCurrency(camp.cost_per_lead)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-600">
                            {formatNumber(camp.reach)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-gray-600">
                            {formatNumber(camp.impressions)}
                          </td>
                          <td className="py-3.5 px-6 text-right text-gray-600">
                            {formatCurrency(camp.cpm)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          /* =================== ABA DO INSTAGRAM =================== */
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Seguidores */}
              <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Seguidores Totais
                </span>
                <span className="text-xl font-bold text-[#373535]">
                  {formatNumber(instagramData?.followers_count ?? null)}
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">Perfil Oficial</span>
              </div>

              {/* Alcance da Conta */}
              <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Contas Alcançadas
                </span>
                <span className="text-xl font-bold text-[#373535]">
                  {formatNumber(instagramData?.reach ?? null)}
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">No período</span>
              </div>

              {/* Impressões */}
              <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Impressões
                </span>
                <span className="text-xl font-bold text-[#373535]">
                  {formatNumber(instagramData?.impressions ?? null)}
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">Posts e Stories</span>
              </div>

              {/* Visitas ao Perfil */}
              <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Visitas ao Perfil
                </span>
                <span className="text-xl font-bold text-pink-600">
                  {formatNumber(instagramData?.profile_views ?? null)}
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">Tráfego direcionado</span>
              </div>

              {/* Interações */}
              <div className="bg-white rounded-xl p-4.5 border border-gray-200 shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                  Interações
                </span>
                <span className="text-xl font-bold text-[#373535]">
                  {formatNumber(instagramData?.interactions ?? null)}
                </span>
                <span className="text-[11px] text-gray-400 block mt-1">Curtidas e Comentários</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3 shadow-xs">
              <InstagramIcon className="w-10 h-10 text-pink-500 mx-auto" />
              <h4 className="text-sm font-bold text-[#373535]">Métricas Orgânicas do Instagram EngenhArq</h4>
              <p className="text-xs text-gray-500 max-w-lg mx-auto leading-relaxed">
                As métricas do perfil comercial do Instagram (alcance de reels, novos seguidores e visitas ao perfil) são atualizadas a partir da Graph API quando o token estiver ativo.
              </p>
            </div>
          </div>
        )}
          </>
        )}
      </div>

      {/* 5. Modal de Configuração de IDs */}
      <MetaConfigModal
        isOpen={isConfigModalOpen}
        config={config}
        canEdit={canEdit}
        userId={user?.id || ''}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
};
