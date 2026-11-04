import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  ArrowUpDown, 
  Search, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight,
  TrendingUp,
  Percent
} from 'lucide-react';
import { AgencyPerformanceRow } from '../../types/dashboard';

interface AgencyPerformanceMatrixProps {
  agencies: AgencyPerformanceRow[];
  onNavigateToAgencies: () => void;
}

type SortField = 'leadsCount' | 'inServiceCount' | 'qualifiedCount' | 'reservasCount' | 'vendasCount' | 'conversionRate';
type SortDirection = 'asc' | 'desc';

export const AgencyPerformanceMatrix: React.FC<AgencyPerformanceMatrixProps> = ({
  agencies,
  onNavigateToAgencies,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('vendasCount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedAgencies = useMemo(() => {
    return [...agencies]
      .filter((a) =>
        a.agencyName.toLowerCase().includes(searchTerm.toLowerCase().trim())
      )
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (sortDirection === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [agencies, searchTerm, sortField, sortDirection]);

  // Estatísticas de Resumo
  const totalLeads = useMemo(() => agencies.reduce((acc, a) => acc + a.leadsCount, 0), [agencies]);
  const totalVendas = useMemo(() => agencies.reduce((acc, a) => acc + a.vendasCount, 0), [agencies]);
  const maxLeads = useMemo(() => Math.max(...agencies.map((a) => a.leadsCount), 1), [agencies]);

  const topAgency = useMemo(() => {
    if (!agencies.length) return null;
    return [...agencies].sort((a, b) => b.vendasCount - a.vendasCount || b.conversionRate - a.conversionRate)[0];
  }, [agencies]);

  const renderStatusBadge = (status: AgencyPerformanceRow['statusBadge']) => {
    switch (status) {
      case 'top':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Top Performer
          </span>
        );
      case 'atencao':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Gargalo / Atenção
          </span>
        );
      case 'regular':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-200">
            Fila Ativa
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Cabeçalho */}
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-50 text-[#B21010]">
              <Building2 className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B21010]">
              Seção 05 • Matriz Comercial
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-1">
            Performance das Imobiliárias Parceiras
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Distribuição de oportunidades e conversão da fila oficial TOP 5 no CVCRM em tempo real.
          </p>
        </div>

        {/* Resumos rápidos */}
        <div className="flex flex-wrap items-center gap-2">
          {topAgency && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/80 border border-amber-200/60 text-xs">
              <Award className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-600">Líder:</span>
              <strong className="text-slate-900">{topAgency.agencyName}</strong>
              <span className="text-emerald-700 font-bold">({topAgency.vendasCount} vendas)</span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span>Volume Fila:</span>
            <strong className="text-slate-900 tabular-nums">{totalLeads.toLocaleString('pt-BR')}</strong>
            <span className="text-slate-400">|</span>
            <span>Vendas:</span>
            <strong className="text-emerald-700 tabular-nums">{totalVendas}</strong>
          </div>

          <button
            onClick={onNavigateToAgencies}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <span>Ver Esteira CVCRM</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtro */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filtrar imobiliária..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#B21010] focus:border-[#B21010] transition-colors"
          />
        </div>
        <div className="text-[11px] text-slate-500 hidden sm:block">
          Exibindo <strong>{filteredAndSortedAgencies.length}</strong> de <strong>{agencies.length}</strong> imobiliárias
        </div>
      </div>

      {/* Tabela de Performance */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200 font-semibold select-none">
              <th className="py-3 px-4 sm:px-6">Imobiliária</th>
              <th 
                onClick={() => handleSort('leadsCount')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Leads</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('inServiceCount')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors hidden md:table-cell"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Em Atendimento</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('qualifiedCount')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Qualificados</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('reservasCount')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors hidden sm:table-cell"
              >
                <div className="inline-flex items-center gap-1">
                  <span>Reservas</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('vendasCount')}
                className="py-3 px-3 text-right cursor-pointer hover:text-[#B21010] transition-colors"
              >
                <div className="inline-flex items-center gap-1 text-[#B21010] font-bold">
                  <span>Vendas</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('conversionRate')}
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-900 transition-colors"
              >
                <div className="inline-flex items-center gap-1">
                  <Percent className="w-3 h-3 text-slate-400" />
                  <span>Conv. %</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSortedAgencies.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                  Nenhuma imobiliária encontrada para o filtro atual.
                </td>
              </tr>
            ) : (
              filteredAndSortedAgencies.map((agency, idx) => {
                const relativeVolumePercent = Math.round((agency.leadsCount / maxLeads) * 100);
                const isHighlight = agency.vendasCount > 0;

                return (
                  <motion.tr
                    key={agency.agencyId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isHighlight ? 'bg-emerald-50/20' : ''
                    }`}
                  >
                    {/* Nome + Barra de Volume */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {agency.agencyName}
                          </span>
                          {agency.vendasCount > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              🏆 {agency.vendasCount} {agency.vendasCount === 1 ? 'Venda' : 'Vendas'}
                            </span>
                          )}
                        </div>
                        {/* Mini Barra de Volume Relativo */}
                        <div className="flex items-center gap-2 max-w-[140px]">
                          <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isHighlight ? 'bg-emerald-500' : 'bg-[#B21010]'
                              }`}
                              style={{ width: `${relativeVolumePercent}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {agency.shareOfLeads}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Leads Totais */}
                    <td className="py-3.5 px-3 text-right font-medium text-slate-800 tabular-nums">
                      {agency.leadsCount.toLocaleString('pt-BR')}
                    </td>

                    {/* Em Atendimento */}
                    <td className="py-3.5 px-3 text-right text-slate-600 tabular-nums hidden md:table-cell">
                      {agency.inServiceCount}
                    </td>

                    {/* Qualificados */}
                    <td className="py-3.5 px-3 text-right text-slate-700 font-medium tabular-nums">
                      {agency.qualifiedCount}
                    </td>

                    {/* Reservas */}
                    <td className="py-3.5 px-3 text-right text-slate-700 tabular-nums hidden sm:table-cell">
                      {agency.reservasCount > 0 ? (
                        <span className="font-semibold text-slate-900">{agency.reservasCount}</span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Vendas */}
                    <td className="py-3.5 px-3 text-right tabular-nums">
                      {agency.vendasCount > 0 ? (
                        <span className="inline-block px-2 py-0.5 rounded-md font-bold text-emerald-800 bg-emerald-100/80">
                          {agency.vendasCount}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* Taxa de Conversão */}
                    <td className="py-3.5 px-3 text-right font-semibold tabular-nums">
                      {agency.conversionRate > 0 ? (
                        <span className="text-emerald-700 inline-flex items-center gap-0.5 justify-end">
                          <TrendingUp className="w-3 h-3" />
                          {agency.conversionRate.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">0.0%</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center">
                      {renderStatusBadge(agency.statusBadge)}
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Rodapé explicativo */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Venda convertida
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Fila operacional regular
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Requer alinhamento de conversão
          </span>
        </div>
        <span className="text-slate-400">
          Dados sincronizados automaticamente da Esteira CVCRM
        </span>
      </div>
    </div>
  );
};

