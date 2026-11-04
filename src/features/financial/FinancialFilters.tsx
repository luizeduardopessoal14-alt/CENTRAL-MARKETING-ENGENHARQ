import React from 'react';
import { FilterOptions } from '../../services/financialService';
import { FINANCIAL_CATEGORIES } from '../../types/financeiro';
import { Search, Plus, Trash2, RefreshCw, AlertCircle } from 'lucide-react';

interface FinancialFiltersProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: Partial<FilterOptions>) => void;
  countConsultFinance: number;
  canEdit: boolean;
  isSuperadmin: boolean;
  onOpenCreateModal: () => void;
  onOpenTrashModal: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const FinancialFilters: React.FC<FinancialFiltersProps> = ({
  filters,
  onFilterChange,
  countConsultFinance,
  canEdit,
  isSuperadmin,
  onOpenCreateModal,
  onOpenTrashModal,
  onRefresh,
  isLoading,
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Barra de Busca */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por fornecedor, descrição, nota fiscal..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-10 pr-3.5 py-2 text-xs bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B21010] focus:bg-white transition-all text-slate-800 placeholder-slate-400"
          />
        </div>

        {/* Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Categoria */}
          <select
            value={filters.category || 'all'}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#B21010] focus:bg-white"
          >
            <option value="all">Todas as Categorias</option>
            {FINANCIAL_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Situação */}
          <select
            disabled={filters.consultFinanceOnly}
            value={filters.statusFilter || 'all'}
            onChange={(e) => onFilterChange({ statusFilter: e.target.value })}
            className="text-xs bg-slate-50/70 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#B21010] focus:bg-white disabled:opacity-50"
          >
            <option value="all">Todas as Situações</option>
            <option value="a_encaminhar">A encaminhar</option>
            <option value="aguardando_previsao">Aguardando previsão</option>
            <option value="pagamento_previsto">Pagamento previsto</option>
            <option value="ultrapassado">Previsão ultrapassada</option>
            <option value="pago">Pago</option>
          </select>

          {/* Recarregar */}
          <button
            onClick={onRefresh}
            title="Atualizar dados"
            className="p-2 text-slate-500 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#B21010]' : ''}`} />
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          {isSuperadmin && (
            <button
              onClick={onOpenTrashModal}
              title="Abrir Lixeira (Cobranças excluídas)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-[0.98] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Lixeira</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#B21010] hover:bg-[#8F0D0D] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Despesa</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtro Especial: Consultar com o financeiro */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onFilterChange({ consultFinanceOnly: !filters.consultFinanceOnly })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
              filters.consultFinanceOnly
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Consultar com o financeiro</span>
            {countConsultFinance > 0 && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filters.consultFinanceOnly
                    ? 'bg-white text-amber-600'
                    : 'bg-amber-200 text-amber-900'
                }`}
              >
                {countConsultFinance}
              </span>
            )}
          </button>
          <span className="text-[11px] text-slate-400 hidden sm:inline font-medium">
            Filtra cobranças sem previsão ou com previsão ultrapassada no Sienge.
          </span>
        </div>

        {filters.consultFinanceOnly && (
          <button
            onClick={() => onFilterChange({ consultFinanceOnly: false })}
            className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer font-medium"
          >
            Limpar filtro
          </button>
        )}
      </div>
    </div>
  );
};
