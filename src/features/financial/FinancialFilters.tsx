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
    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Barra de Busca */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por fornecedor, descrição, nota ou autorizador..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#DE3A39] focus:bg-white transition-all text-[#373535]"
          />
        </div>

        {/* Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Categoria */}
          <select
            value={filters.category || 'all'}
            onChange={(e) => onFilterChange({ category: e.target.value })}
            className="text-xs bg-gray-50/50 border border-gray-200 rounded-lg px-2.5 py-2 text-[#373535] focus:outline-none focus:ring-2 focus:ring-[#DE3A39] focus:bg-white"
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
            className="text-xs bg-gray-50/50 border border-gray-200 rounded-lg px-2.5 py-2 text-[#373535] focus:outline-none focus:ring-2 focus:ring-[#DE3A39] focus:bg-white disabled:opacity-50"
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
            className="p-2 text-gray-500 hover:text-[#373535] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-gray-100">
          {isSuperadmin && (
            <button
              onClick={onOpenTrashModal}
              title="Abrir Lixeira (Cobranças excluídas)"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-500" />
              <span>Lixeira</span>
            </button>
          )}

          {canEdit && (
            <button
              onClick={onOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#DE3A39] hover:bg-[#C52B2A] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Cobrança</span>
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtro Especial: Consultar com o financeiro */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              onFilterChange({ consultFinanceOnly: !filters.consultFinanceOnly })
            }
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
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
          <span className="text-[11px] text-gray-400 hidden sm:inline">
            Filtra cobranças sem previsão ou com previsão ultrapassada no Sienge.
          </span>
        </div>

        {filters.consultFinanceOnly && (
          <button
            onClick={() => onFilterChange({ consultFinanceOnly: false })}
            className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
          >
            Limpar filtro
          </button>
        )}
      </div>
    </div>
  );
};

