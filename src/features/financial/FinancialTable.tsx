import React from 'react';
import {
  FinancialRecord,
  isForecastOverdue,
  getOverdueDays,
} from '../../types/financeiro';
import {
  FileText,
  Paperclip,
  History,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  ArrowRightCircle,
  AlertTriangle,
} from 'lucide-react';

interface FinancialTableProps {
  records: FinancialRecord[];
  isLoading: boolean;
  canEdit: boolean;
  onOpenStatusModal: (record: FinancialRecord) => void;
  onOpenEditModal: (record: FinancialRecord) => void;
  onOpenHistoryModal: (record: FinancialRecord) => void;
  onDeleteRecord: (record: FinancialRecord) => void;
  onViewAttachment: (path: string) => void;
}

export const FinancialTable: React.FC<FinancialTableProps> = ({
  records,
  isLoading,
  canEdit,
  onOpenStatusModal,
  onOpenEditModal,
  onOpenHistoryModal,
  onDeleteRecord,
  onViewAttachment,
}) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-6 h-6 border-2 border-[#DE3A39]/30 border-t-[#DE3A39] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-gray-500">Carregando cobranças financeiras...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mx-auto mb-3">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-[#373535]">Nenhuma cobrança encontrada</h3>
        <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
          Não há registros correspondentes aos filtros selecionados.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
              <th className="py-3 px-4">Fornecedor / Descrição</th>
              <th className="py-3 px-3">Categoria</th>
              <th className="py-3 px-3">Valor</th>
              <th className="py-3 px-3">Recebido em</th>
              <th className="py-3 px-4">Situação & Jornada</th>
              <th className="py-3 px-2 text-center">Anexo</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r) => {
              const overdue = isForecastOverdue(r);
              const overdueDays = getOverdueDays(r);

              return (
                <tr
                  key={r.id}
                  className={`hover:bg-gray-50/60 transition-colors ${
                    overdue ? 'bg-red-50/30' : ''
                  }`}
                >
                  {/* Fornecedor / Descrição */}
                  <td className="py-3.5 px-4 font-medium text-[#373535] max-w-[280px]">
                    <div className="truncate font-semibold text-gray-900">{r.supplier}</div>
                    <div className="text-xs text-gray-500 truncate" title={r.description}>
                      {r.description}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      {r.invoice_number && <span>NF: {r.invoice_number}</span>}
                      {r.authorized_by && <span>Autorizado: {r.authorized_by}</span>}
                    </div>
                  </td>

                  {/* Categoria */}
                  <td className="py-3.5 px-3">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700 whitespace-nowrap">
                      {r.category}
                    </span>
                  </td>

                  {/* Valor */}
                  <td className="py-3.5 px-3 font-semibold text-[#373535] whitespace-nowrap">
                    {formatCurrency(Number(r.amount))}
                  </td>

                  {/* Data de Recebimento */}
                  <td className="py-3.5 px-3 text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(r.receipt_date)}
                  </td>

                  {/* Situação e Jornada */}
                  <td className="py-3.5 px-4">
                    {r.status === 'pago' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          Pago
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Data: {formatDate(r.payment_actual_date)}
                        </p>
                      </div>
                    ) : overdue ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-300 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          Previsão ultrapassada há {overdueDays} dia{overdueDays !== 1 ? 's' : ''}
                        </span>
                        <p className="text-[10px] text-red-500 mt-0.5">
                          Previsão era: {formatDate(r.payment_forecast_date)}
                        </p>
                      </div>
                    ) : r.status === 'pagamento_previsto' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3 h-3" />
                          Pagamento previsto
                        </span>
                        <p className="text-[10px] text-blue-600 mt-0.5 font-medium">
                          Previsão Sienge: {formatDate(r.payment_forecast_date)}
                        </p>
                      </div>
                    ) : r.status === 'aguardando_previsao' ? (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          Aguardando previsão
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Enviado em: {formatDate(r.forwarded_to_finance_date)}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          A encaminhar
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Ainda não enviado ao financeiro
                        </p>
                      </div>
                    )}
                  </td>

                  {/* Anexo */}
                  <td className="py-3.5 px-2 text-center">
                    {r.attachment_path ? (
                      <button
                        onClick={() => onViewAttachment(r.attachment_path!)}
                        title={`Ver anexo: ${r.attachment_name || 'Documento'}`}
                        className="p-1.5 text-gray-500 hover:text-[#DE3A39] hover:bg-gray-100 rounded-md transition-colors inline-block"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">-</span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Botão de Avançar Jornada */}
                      {canEdit && (
                        <button
                          onClick={() => onOpenStatusModal(r)}
                          title="Avançar etapa / Atualizar previsão ou pagamento"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-[#DE3A39] hover:text-white rounded-md transition-colors"
                        >
                          <ArrowRightCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Status</span>
                        </button>
                      )}

                      {/* Ver Histórico de Previsão */}
                      <button
                        onClick={() => onOpenHistoryModal(r)}
                        title="Ver histórico de alterações de previsão"
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <History className="w-4 h-4" />
                      </button>

                      {/* Editar */}
                      {canEdit && (
                        <button
                          onClick={() => onOpenEditModal(r)}
                          title="Editar dados da cobrança"
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Excluir (Mover para Lixeira) */}
                      {canEdit && (
                        <button
                          onClick={() => onDeleteRecord(r)}
                          title="Enviar para a lixeira"
                          className="p-1.5 text-gray-400 hover:text-[#DE3A39] hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

