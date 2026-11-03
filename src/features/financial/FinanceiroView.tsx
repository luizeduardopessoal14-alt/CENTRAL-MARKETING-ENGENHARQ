import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FinancialRecord,
  FinancialTotals,
} from '../../types/financeiro';
import {
  financialService,
  FilterOptions,
} from '../../services/financialService';
import { FinancialMetrics } from './FinancialMetrics';
import { FinancialFilters } from './FinancialFilters';
import { FinancialTable } from './FinancialTable';
import { FinancialRecordModal } from './FinancialRecordModal';
import { FinancialStatusModal } from './FinancialStatusModal';
import { FinancialForecastHistoryModal } from './FinancialForecastHistoryModal';
import { FinancialTrashModal } from './FinancialTrashModal';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export const FinanceiroView: React.FC = () => {
  const { user, hasAccess } = useAuth();
  const canEdit = hasAccess('financeiro', 'edicao');
  const isSuperadmin = user?.role === 'superadmin';

  // Estados de Dados
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [totals, setTotals] = useState<FinancialTotals>({
    totalOpen: 0,
    totalNoForecast: 0,
    totalWeekForecast: 0,
    totalPaidMonth: 0,
    countConsultFinance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Filtro
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'all',
    statusFilter: 'all',
    consultFinanceOnly: false,
  });

  // Alerta de Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modais
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<FinancialRecord | null>(null);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [recordForStatus, setRecordForStatus] = useState<FinancialRecord | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [recordForHistory, setRecordForHistory] = useState<FinancialRecord | null>(null);

  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);

  // Carregar dados
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedRecords, fetchedTotals] = await Promise.all([
        financialService.getRecords(filters),
        financialService.getTotals(),
      ]);
      setRecords(fetchedRecords);
      setTotals(fetchedTotals);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados do financeiro:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao buscar cobranças.';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Limpar alerta de feedback automaticamente após 4 segundos
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handler de Sucesso
  const handleSuccess = (message: string) => {
    setFeedback({ type: 'success', text: message });
    loadData();
  };

  // Handler de Exclusão (Mover para Lixeira)
  const handleDeleteRecord = async (record: FinancialRecord) => {
    if (
      !window.confirm(
        `Deseja mover a cobrança de "${record.supplier}" para a lixeira? O Superadministrador poderá restaurá-la a qualquer momento.`
      )
    ) {
      return;
    }

    try {
      await financialService.softDeleteRecord(record.id, user?.id || '');
      handleSuccess('Cobrança enviada para a lixeira.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao excluir cobrança.';
      setFeedback({ type: 'error', text: msg });
    }
  };

  // Visualizar Anexo
  const handleViewAttachment = async (path: string) => {
    try {
      const url = await financialService.getAttachmentUrl(path);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Erro ao abrir anexo.');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-xs animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#DE3A39]" />
            )}
            <span className="text-sm font-medium">{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-70 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cards de Métricas e Totais Oficiais */}
      <FinancialMetrics totals={totals} isLoading={isLoading} />

      {/* Filtros e Ações */}
      <FinancialFilters
        filters={filters}
        onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
        countConsultFinance={totals.countConsultFinance}
        canEdit={canEdit}
        isSuperadmin={isSuperadmin}
        onOpenCreateModal={() => {
          setRecordToEdit(null);
          setIsRecordModalOpen(true);
        }}
        onOpenTrashModal={() => setIsTrashModalOpen(true)}
        onRefresh={loadData}
        isLoading={isLoading}
      />

      {/* Listagem de Cobranças */}
      <FinancialTable
        records={records}
        isLoading={isLoading}
        canEdit={canEdit}
        onOpenStatusModal={(record) => {
          setRecordForStatus(record);
          setIsStatusModalOpen(true);
        }}
        onOpenEditModal={(record) => {
          setRecordToEdit(record);
          setIsRecordModalOpen(true);
        }}
        onOpenHistoryModal={(record) => {
          setRecordForHistory(record);
          setIsHistoryModalOpen(true);
        }}
        onDeleteRecord={handleDeleteRecord}
        onViewAttachment={handleViewAttachment}
      />

      {/* Modais */}
      <FinancialRecordModal
        isOpen={isRecordModalOpen}
        onClose={() => {
          setIsRecordModalOpen(false);
          setRecordToEdit(null);
        }}
        onSuccess={handleSuccess}
        recordToEdit={recordToEdit}
        currentUserId={user?.id}
      />

      <FinancialStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setRecordForStatus(null);
        }}
        onSuccess={handleSuccess}
        record={recordForStatus}
      />

      <FinancialForecastHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => {
          setIsHistoryModalOpen(false);
          setRecordForHistory(null);
        }}
        record={recordForHistory}
      />

      <FinancialTrashModal
        isOpen={isTrashModalOpen}
        onClose={() => {
          setIsTrashModalOpen(false);
          loadData();
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

