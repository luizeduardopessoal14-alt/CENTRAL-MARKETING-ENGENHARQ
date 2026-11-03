import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Users,
  CheckCircle2,
  TrendingUp,
  Settings,
  RefreshCw,
  AlertCircle,
  Calendar,
  Layers,
  Filter,
} from 'lucide-react';
import { imobiliariaService } from '../../services/imobiliariaService';
import {
  CVCRMIntegrationConfig,
  RealEstateAgency,
  CVCRMLeadItem,
  EsteiraMetric,
  AgencyEsteiraRow,
  PeriodFilterMode,
} from '../../types/imobiliarias';
import { CVCRMConfigModal } from './CVCRMConfigModal';

export const ImobiliariasView: React.FC = () => {
  const [config, setConfig] = useState<CVCRMIntegrationConfig | null>(null);
  const [agencies, setAgencies] = useState<RealEstateAgency[]>([]);
  const [leads, setLeads] = useState<CVCRMLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filtros de Período
  const [periodMode, setPeriodMode] = useState<PeriodFilterMode>('este_mes');
  const today = new Date();
  const formatIsoDate = (d: Date) => d.toISOString().split('T')[0];

  // Datas A e B
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date(today.getFullYear(), today.getMonth(), 1);
    return formatIsoDate(d);
  });
  const [endDate, setEndDate] = useState<string>(() => formatIsoDate(today));

  // Filtro de Imobiliária
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('all');

  // Modal de Configuração
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Atualizar datas com base no modo selecionado
  const handlePeriodModeChange = (mode: PeriodFilterMode) => {
    setPeriodMode(mode);
    const now = new Date();

    if (mode === 'este_mes') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(formatIsoDate(first));
      setEndDate(formatIsoDate(now));
    } else if (mode === 'mes_passado') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(formatIsoDate(first));
      setEndDate(formatIsoDate(last));
    } else if (mode === 'ultimos_30') {
      const past = new Date(now);
      past.setDate(now.getDate() - 30);
      setStartDate(formatIsoDate(past));
      setEndDate(formatIsoDate(now));
    } else if (mode === 'ultimos_90') {
      const past = new Date(now);
      past.setDate(now.getDate() - 90);
      setStartDate(formatIsoDate(past));
      setEndDate(formatIsoDate(now));
    } else if (mode === 'todo_periodo') {
      setStartDate('');
      setEndDate('');
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedAgencyId, periodMode]);

  const loadData = async () => {
    setLoading(true);
    const [cfg, ags] = await Promise.all([
      imobiliariaService.getConfig(),
      imobiliariaService.getAgencies(),
    ]);
    setConfig(cfg);
    setAgencies(ags);

    // Buscar leads com o filtro de datas
    const leadData = await imobiliariaService.getFilteredLeads({
      startDate: periodMode === 'todo_periodo' ? undefined : startDate,
      endDate: periodMode === 'todo_periodo' ? undefined : endDate,
      agencyId: selectedAgencyId,
    });
    setLeads(leadData);
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    await imobiliariaService.syncCVCRMData();
    await loadData();
    setSyncing(false);
  };

  // 1. Identificar todas as esteiras reais presentes nos leads
  const esteirasDisponiveis: EsteiraMetric[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of leads) {
      const nome = l.situacao_nome || 'Sem Esteira';
      map.set(nome, (map.get(nome) || 0) + 1);
    }

    const total = leads.length;
    const list: EsteiraMetric[] = [];

    // Ordem lógica prioritária comum do funil
    const priorityOrder = [
      'Aguardando Atendimento',
      'Aguardando Atendimento Corretor',
      'Tentativa de Contato',
      'Em Atendimento',
      'Atendimento Imobiliária',
      'Visita Agendada',
      'Com Reserva',
      'Congela',
    ];

    const sortedKeys = Array.from(map.keys()).sort((a, b) => {
      const idxA = priorityOrder.indexOf(a);
      const idxB = priorityOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    for (const nome of sortedKeys) {
      const count = map.get(nome) || 0;
      const lower = nome.toLowerCase();
      list.push({
        nome,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        isWonStage: lower.includes('reserva') || lower.includes('venda'),
        isLostStage: lower.includes('congela') || lower.includes('descarte'),
      });
    }

    return list;
  }, [leads]);

  // 2. Linhas comparativas por Imobiliária com contagem em cada esteira
  const agencyRows: AgencyEsteiraRow[] = useMemo(() => {
    const list = selectedAgencyId === 'all'
      ? agencies
      : agencies.filter((a) => a.id === selectedAgencyId);

    return list.map((agency) => {
      const agencyLeads = leads.filter((l) => l.agency_id === agency.id);
      const esteiras: Record<string, number> = {};

      let reservas = 0;
      for (const l of agencyLeads) {
        const nome = l.situacao_nome || 'Sem Esteira';
        esteiras[nome] = (esteiras[nome] || 0) + 1;

        const lower = nome.toLowerCase();
        if (lower.includes('reserva') || lower.includes('venda') || l.qtde_reservas > 0) {
          reservas++;
        }
      }

      const total_leads = agencyLeads.length;
      const conversion_rate = total_leads > 0 ? (reservas / total_leads) * 100 : 0;

      return {
        agency,
        total_leads,
        esteiras,
        reservas_vendas: reservas,
        conversion_rate,
      };
    });
  }, [agencies, leads, selectedAgencyId]);

  // 3. Totais consolidados
  const totalLeads = leads.length;
  const totalReservas = useMemo(() => {
    return leads.filter((l) => {
      const sit = (l.situacao_nome || '').toLowerCase();
      return sit.includes('reserva') || sit.includes('venda') || l.qtde_reservas > 0;
    }).length;
  }, [leads]);

  const totalAtendimento = useMemo(() => {
    return leads.filter((l) => {
      const sit = (l.situacao_nome || '').toLowerCase();
      return sit.includes('atendimento') || sit.includes('contato');
    }).length;
  }, [leads]);

  const totalVisitas = useMemo(() => {
    return leads.filter((l) => (l.situacao_nome || '').toLowerCase().includes('visita')).length;
  }, [leads]);

  const overallConversion = totalLeads > 0 ? ((totalReservas / totalLeads) * 100).toFixed(1) : '0.0';
  const overallVisitRate = totalLeads > 0 ? ((totalVisitas / totalLeads) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
              Fila: DISTRIBUIÇÃO DE LEAS FACEBOOK - TOP 5 IMOB
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Painel Analítico de Esteiras: Leads de <strong>Facebook e Instagram</strong> distribuídos para as imobiliárias participantes
          </p>
        </div>

        {/* Action Buttons */}
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
                Insira o Token no botão <strong>"Configurar API CVCRM"</strong> para sincronizar os dados da fila oficial.
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

      {/* Barra de Filtros Avançados: Período Flexível (Data A à B, Todo o Período) & Imobiliária */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-red-600" />
            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Filtro de Período & Imobiliária
            </span>
          </div>

          {/* Atalhos de Período */}
          <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
            {(
              [
                ['este_mes', 'Este Mês'],
                ['mes_passado', 'Mês Passado'],
                ['ultimos_30', 'Últimos 30 dias'],
                ['ultimos_90', 'Últimos 90 dias'],
                ['todo_periodo', 'Todo o Período'],
                ['personalizado', 'Personalizado'],
              ] as const
            ).map(([modeKey, label]) => (
              <button
                key={modeKey}
                onClick={() => handlePeriodModeChange(modeKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  periodMode === modeKey
                    ? 'bg-white text-red-600 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs de Data A à B e Seletor de Imobiliária */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Data Início (Data A)</span>
              <input
                type="date"
                value={startDate}
                disabled={periodMode === 'todo_periodo'}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPeriodMode('personalizado');
                }}
                className="bg-transparent text-xs font-bold text-gray-800 outline-hidden cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Data Fim (Data B)</span>
              <input
                type="date"
                value={endDate}
                disabled={periodMode === 'todo_periodo'}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPeriodMode('personalizado');
                }}
                className="bg-transparent text-xs font-bold text-gray-800 outline-hidden cursor-pointer disabled:opacity-40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">Filtrar Imobiliária da Fila</span>
              <select
                value={selectedAgencyId}
                onChange={(e) => setSelectedAgencyId(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 outline-hidden cursor-pointer"
              >
                <option value="all">Todas da Fila TOP 5 ({agencies.length})</option>
                {agencies.map((agency) => (
                  <option key={agency.id} value={agency.id}>
                    {agency.name} {agency.notes ? `(${agency.notes})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Consolidados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase">Leads Filtrados</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tight">{totalLeads}</p>
          <p className="text-[11px] text-gray-400 mt-1">Facebook / Instagram na fila</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase">Em Atendimento</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 tracking-tight">{totalAtendimento}</p>
          <p className="text-[11px] text-gray-400 mt-1">
            {totalLeads > 0 ? `${((totalAtendimento / totalLeads) * 100).toFixed(0)}% do volume` : '0%'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase">Visitas Agendadas</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-700 tracking-tight">{totalVisitas}</p>
          <p className="text-[11px] text-purple-600 font-medium mt-1">{overallVisitRate}% tx. visita</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-gray-500 uppercase">Com Reserva (Vendas)</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 tracking-tight">{totalReservas}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">{overallConversion}% conversão final</p>
        </div>
      </div>

      {/* PAINEL DE TODAS AS ESTEIRAS REAIS DO CVCRM COM TAXA DE CONVERSÃO */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-600" />
              Mapeamento de Todas as Esteiras do CVCRM
            </h3>
            <p className="text-xs text-gray-500">
              Distribuição e taxa de conversão em cada etapa do andamento dos leads no período selecionado
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {esteirasDisponiveis.length} esteiras ativas
          </span>
        </div>

        {esteirasDisponiveis.length === 0 ? (
          <p className="text-xs text-gray-400 py-6 text-center">
            Nenhum lead encontrado para os filtros selecionados.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {esteirasDisponiveis.map((est) => (
                <div
                  key={est.nome}
                  className={`p-4 rounded-xl border transition-all ${
                    est.isWonStage
                      ? 'bg-emerald-50/80 border-emerald-200'
                      : est.isLostStage
                      ? 'bg-gray-50 border-gray-200 opacity-75'
                      : est.nome.toLowerCase().includes('visita')
                      ? 'bg-purple-50/80 border-purple-200'
                      : 'bg-blue-50/60 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 truncate" title={est.nome}>
                      {est.nome}
                    </span>
                    {est.isWonStage && (
                      <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        Conversão
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-gray-900">{est.count}</span>
                    <span className="text-xs text-gray-500">leads</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-gray-200/70 flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">% do Total:</span>
                    <span className="font-bold text-gray-800">{est.percentage.toFixed(1)}%</span>
                  </div>

                  <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        est.isWonStage ? 'bg-emerald-600' : est.isLostStage ? 'bg-gray-400' : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(100, est.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* TABELA COMPARATIVA POR IMOBILIÁRIA COM DETALHE DE CADA ESTEIRA */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              Desempenho por Imobiliária em Cada Esteira
            </h3>
            <p className="text-xs text-gray-500">
              Acompanhamento detalhado da fila "DISTRIBUIÇÃO DE LEAS FACEBOOK - TOP 5 IMOB"
            </p>
          </div>
          <span className="text-xs font-bold text-gray-500">
            {agencyRows.length} imobiliárias participantes
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-red-600" />
            <p className="text-xs">Carregando dados das esteiras...</p>
          </div>
        ) : agencyRows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">Nenhum dado encontrado para o período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Imobiliária Parceira</th>
                  <th className="py-3 px-3 text-center">Total Leads</th>
                  {esteirasDisponiveis.map((est) => (
                    <th key={est.nome} className="py-3 px-2 text-center font-bold text-gray-600">
                      {est.nome}
                    </th>
                  ))}
                  <th className="py-3 px-3 text-center bg-emerald-50 text-emerald-800">Com Reserva</th>
                  <th className="py-3 px-4 text-center bg-red-50 text-red-800">Conversão (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {agencyRows.map((row) => (
                  <tr key={row.agency.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span>{row.agency.name}</span>
                            {row.agency.notes && (
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                                  row.agency.notes.includes('Próximo')
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {row.agency.notes}
                              </span>
                            )}
                          </div>
                          {row.agency.cvcrm_id && (
                            <span className="block text-[10px] text-gray-400 font-mono">
                              ID CVCRM: {row.agency.cvcrm_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-black text-gray-900 bg-gray-50/50">
                      {row.total_leads}
                    </td>

                    {esteirasDisponiveis.map((est) => {
                      const count = row.esteiras[est.nome] || 0;
                      return (
                        <td key={est.nome} className="py-3.5 px-2 text-center font-semibold text-gray-700">
                          {count > 0 ? (
                            <span className="font-bold text-gray-900">{count}</span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3.5 px-3 text-center font-extrabold text-emerald-700 bg-emerald-50/40">
                      {row.reservas_vendas}
                    </td>

                    <td className="py-3.5 px-4 text-center bg-red-50/30">
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
