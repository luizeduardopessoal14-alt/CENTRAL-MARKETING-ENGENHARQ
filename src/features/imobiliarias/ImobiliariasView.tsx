import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  Eye,
  CheckCircle2,
  TrendingUp,
  Settings,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
} from 'lucide-react';
import { imobiliariaService } from '../../services/imobiliariaService';
import {
  CVCRMIntegrationConfig,
  RealEstateAgency,
  AgencyMetricsMonthly,
  AgencySummaryRow,
} from '../../types/imobiliarias';
import { CVCRMConfigModal } from './CVCRMConfigModal';

export const ImobiliariasView: React.FC = () => {
  const [config, setConfig] = useState<CVCRMIntegrationConfig | null>(null);
  const [agencies, setAgencies] = useState<RealEstateAgency[]>([]);
  const [metrics, setMetrics] = useState<AgencyMetricsMonthly[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filtros
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('all');

  // Modal de Configuração da API do CVCRM
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    const [cfg, ags, mets] = await Promise.all([
      imobiliariaService.getConfig(),
      imobiliariaService.getAgencies(),
      imobiliariaService.getMonthlyMetrics(selectedMonth),
    ]);
    setConfig(cfg);
    setAgencies(ags);
    setMetrics(mets);
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    // Simula sincronização com a API do CVCRM e recarrega os dados
    await new Promise((r) => setTimeout(r, 600));
    await loadData();
    setSyncing(false);
  };

  // Calcular linhas analíticas consolidadas por imobiliária
  const agencyRows: AgencySummaryRow[] = useMemo(() => {
    const list = selectedAgencyId === 'all'
      ? agencies
      : agencies.filter((a) => a.id === selectedAgencyId);

    return list.map((agency) => {
      const metric = metrics.find((m) => m.agency_id === agency.id);
      const leads = metric?.leads_received || 0;
      const inAttendance = metric?.in_attendance || 0;
      const visits = metric?.visits || 0;
      const proposals = metric?.proposals || 0;
      const sales = metric?.sales || 0;
      const conversion_rate = leads > 0 ? (sales / leads) * 100 : 0;
      const visits_rate = leads > 0 ? (visits / leads) * 100 : 0;

      return {
        agency,
        leads_received: leads,
        in_attendance: inAttendance,
        visits,
        proposals,
        sales,
        conversion_rate,
        visits_rate,
      };
    });
  }, [agencies, metrics, selectedAgencyId]);

  // Totais consolidados
  const totals = useMemo(() => {
    return agencyRows.reduce(
      (acc, row) => {
        acc.leads += row.leads_received;
        acc.attendance += row.in_attendance;
        acc.visits += row.visits;
        acc.proposals += row.proposals;
        acc.sales += row.sales;
        return acc;
      },
      { leads: 0, attendance: 0, visits: 0, proposals: 0, sales: 0 }
    );
  }, [agencyRows]);

  const overallConversion = totals.leads > 0 ? ((totals.sales / totals.leads) * 100).toFixed(1) : '0.0';
  const overallVisitRate = totals.leads > 0 ? ((totals.visits / totals.leads) * 100).toFixed(1) : '0.0';

  const formatMonthLabel = (dateStr: string) => {
    const [year, month] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Leads & Imobiliárias</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              <span
                className={`w-2 h-2 rounded-full ${
                  config?.status === 'conectado' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
              <span className="capitalize">
                {config?.status === 'conectado' ? 'CVCRM Conectado' : 'Aguardando Token CVCRM'}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Painel analítico de distribuição de leads, funil de atendimento e conversão em vendas (via API CVCRM)
          </p>
        </div>

        {/* Action Buttons: apenas Conexão e Sincronização */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all flex items-center gap-2 border border-gray-200"
          >
            <Settings className="w-3.5 h-3.5 text-gray-600" />
            Configurar API CVCRM
          </button>

          <button
            onClick={handleSync}
            disabled={syncing || config?.status !== 'conectado'}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 disabled:bg-gray-400 rounded-xl transition-all flex items-center gap-2 shadow-sm shadow-red-200"
            title={config?.status !== 'conectado' ? 'Conecte o token para sincronizar' : 'Sincronizar dados'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar CVCRM'}
          </button>
        </div>
      </div>

      {/* Disconnected Notice */}
      {config?.status !== 'conectado' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Aguardando Conexão com a API do CVCRM</h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Esta tela opera em modo de somente leitura analítica consumindo a API da sua base CVCRM. Insira o Token no botão <strong>"Configurar API CVCRM"</strong> para habilitar a leitura automatizada de leads e vendas.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors shadow-xs"
          >
            Inserir Token
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Mês:</span>
            <input
              type="month"
              value={selectedMonth.substring(0, 7)}
              onChange={(e) => setSelectedMonth(`${e.target.value}-01`)}
              className="bg-transparent text-xs font-bold text-gray-800 outline-hidden cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Imobiliária:</span>
            <select
              value={selectedAgencyId}
              onChange={(e) => setSelectedAgencyId(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 outline-hidden cursor-pointer"
            >
              <option value="all">Todas as Imobiliárias ({agencies.length})</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <span className="text-xs font-medium text-gray-400 capitalize">
          Período em Análise: <strong>{formatMonthLabel(selectedMonth)}</strong>
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Leads Recebidos</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{totals.leads}</p>
          <p className="text-[11px] text-gray-400 mt-1">Encaminhados no período</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Em Atendimento</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 tracking-tight">{totals.attendance}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {totals.leads > 0 ? `${((totals.attendance / totals.leads) * 100).toFixed(0)}% do volume` : '0%'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Visitas Feitas</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 tracking-tight">{totals.visits}</p>
          <p className="text-[11px] text-purple-600 font-medium mt-1">{overallVisitRate}% tx. visita</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Vendas CVCRM</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 tracking-tight">{totals.sales}</p>
          <p className="text-[11px] text-gray-400 mt-1">Contratos fechados</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Conversão Vendas</span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-600 tracking-tight">{overallConversion}%</p>
          <p className="text-[11px] text-gray-400 mt-1">Leads convertidos em venda</p>
        </div>
      </div>

      {/* Visual Funnel Representation */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-red-600" />
          Funil de Conversão Comercial EngenhArq ({formatMonthLabel(selectedMonth)})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-bold text-blue-800 uppercase tracking-wider">1. Leads Recebidos</div>
            <div className="text-2xl font-black text-blue-900 mt-1">{totals.leads}</div>
            <div className="text-[11px] text-blue-600 mt-1">100% da base no período</div>
            <div className="w-full bg-blue-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full w-full" />
            </div>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">2. Em Atendimento</div>
            <div className="text-2xl font-black text-amber-900 mt-1">{totals.attendance}</div>
            <div className="text-[11px] text-amber-700 mt-1">
              {totals.leads > 0 ? `${((totals.attendance / totals.leads) * 100).toFixed(1)}% dos leads` : '0%'}
            </div>
            <div className="w-full bg-amber-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full"
                style={{ width: `${totals.leads > 0 ? Math.min(100, (totals.attendance / totals.leads) * 100) : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-bold text-purple-800 uppercase tracking-wider">3. Visitas Feitas</div>
            <div className="text-2xl font-black text-purple-900 mt-1">{totals.visits}</div>
            <div className="text-[11px] text-purple-700 mt-1">
              {totals.leads > 0 ? `${overallVisitRate}% de agendamento` : '0%'}
            </div>
            <div className="w-full bg-purple-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full"
                style={{ width: `${totals.leads > 0 ? Math.min(100, (totals.visits / totals.leads) * 100) : 0}%` }}
              />
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 relative overflow-hidden">
            <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">4. Vendas Fechadas</div>
            <div className="text-2xl font-black text-emerald-900 mt-1">{totals.sales}</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-bold">
              {overallConversion}% conversão final
            </div>
            <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${totals.leads > 0 ? Math.min(100, (totals.sales / totals.leads) * 100) : 0}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comparative Performance Table - Puramente Analítica */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">Desempenho Comparativo por Imobiliária</h3>
            <p className="text-xs text-gray-500">
              Métricas e taxas de conversão consolidadas da API do CVCRM
            </p>
          </div>
          <span className="text-xs font-semibold text-gray-500">
            {agencyRows.length} {agencyRows.length === 1 ? 'imobiliária' : 'imobiliárias'}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
            <p className="text-xs">Carregando dados da API do CVCRM...</p>
          </div>
        ) : agencyRows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Nenhum dado de imobiliária disponível para o período.</p>
            <p className="text-xs text-gray-400 mt-1">
              Conecte a API do CVCRM para sincronizar os dados automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Imobiliária Parceira</th>
                  <th className="py-3 px-3 text-center">Leads Recebidos</th>
                  <th className="py-3 px-3 text-center">Em Atendimento</th>
                  <th className="py-3 px-3 text-center">Visitas Feitas</th>
                  <th className="py-3 px-3 text-center">Propostas</th>
                  <th className="py-3 px-3 text-center">Vendas Fechadas</th>
                  <th className="py-3 px-3 text-center">Tx. Visita</th>
                  <th className="py-3 px-4 text-center">Conversão Venda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {agencyRows.map((row) => (
                  <tr key={row.agency.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <span>{row.agency.name}</span>
                          {row.agency.cvcrm_id && (
                            <span className="block text-[10px] text-gray-400 font-mono">
                              ID CVCRM: {row.agency.cvcrm_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-gray-900">
                      {row.leads_received}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-amber-600">
                      {row.in_attendance}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-purple-600">
                      {row.visits}
                    </td>
                    <td className="py-3.5 px-3 text-center font-semibold text-blue-600">
                      {row.proposals}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-600">
                      {row.sales}
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-gray-600">
                      {row.visits_rate.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md font-bold text-[11px] ${
                          row.conversion_rate > 5
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.conversion_rate > 0
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {row.conversion_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Conexão com CVCRM */}
      <CVCRMConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
};
