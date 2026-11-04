import React, { useState, useEffect } from 'react';
import {
  FinancialRecord,
  FINANCIAL_CATEGORIES,
  getTodaySaoPaulo,
} from '../../types/financeiro';
import { financialService } from '../../services/financialService';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';

interface FinancialRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  recordToEdit?: FinancialRecord | null;
  currentUserId?: string;
}

export const FinancialRecordModal: React.FC<FinancialRecordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  recordToEdit,
  currentUserId,
}) => {
  const [supplier, setSupplier] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(FINANCIAL_CATEGORIES[0]);
  const [receiptDate, setReceiptDate] = useState(getTodaySaoPaulo());
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');

  // Upload de Anexo
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (recordToEdit) {
      setSupplier(recordToEdit.supplier);
      setDescription(recordToEdit.description);
      setAmount(String(recordToEdit.amount));
      setCategory(recordToEdit.category);
      setReceiptDate(recordToEdit.receipt_date);
      setAuthorizedBy(recordToEdit.authorized_by || '');
      setInvoiceNumber(recordToEdit.invoice_number || '');
      setNotes(recordToEdit.notes || '');
      setAttachmentPath(recordToEdit.attachment_path || null);
      setAttachmentName(recordToEdit.attachment_name || null);
    } else {
      setSupplier('');
      setDescription('');
      setAmount('');
      setCategory(FINANCIAL_CATEGORIES[0]);
      setReceiptDate(getTodaySaoPaulo());
      setAuthorizedBy('');
      setInvoiceNumber('');
      setNotes('');
      setAttachmentPath(null);
      setAttachmentName(null);
      setSelectedFile(null);
    }
    setErrorMessage(null);
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Informe um valor válido e positivo.');
      return;
    }

    if (!supplier.trim()) {
      setErrorMessage('Informe o fornecedor ou credor.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Informe a descrição do gasto.');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalAttachmentPath = attachmentPath;
      let finalAttachmentName = attachmentName;

      // Upload do arquivo caso o usuário tenha selecionado um novo
      if (selectedFile) {
        const uploadResult = await financialService.uploadAttachment(selectedFile);
        finalAttachmentPath = uploadResult.path;
        finalAttachmentName = uploadResult.name;
      }

      if (recordToEdit) {
        await financialService.updateRecord(recordToEdit.id, {
          supplier: supplier.trim(),
          description: description.trim(),
          amount: numAmount,
          category,
          receipt_date: receiptDate,
          authorized_by: authorizedBy.trim() || null,
          invoice_number: invoiceNumber.trim() || null,
          notes: notes.trim() || null,
          attachment_path: finalAttachmentPath,
          attachment_name: finalAttachmentName,
        });
        onSuccess('Cobrança atualizada com sucesso!');
      } else {
        await financialService.createRecord(
          {
            supplier: supplier.trim(),
            description: description.trim(),
            amount: numAmount,
            category,
            receipt_date: receiptDate,
            authorized_by: authorizedBy.trim() || null,
            invoice_number: invoiceNumber.trim() || null,
            notes: notes.trim() || null,
            attachment_path: finalAttachmentPath,
            attachment_name: finalAttachmentName,
            forwarded_to_finance_date: null,
            payment_forecast_date: null,
            payment_actual_date: null,
          },
          currentUserId
        );
        onSuccess('Nova cobrança cadastrada com sucesso!');
      }

      onClose();
    } catch (err: unknown) {
      console.error('Erro ao salvar cobrança:', err);
      const msg = err instanceof Error ? err.message : 'Falha ao salvar cobrança.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 my-8">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-bold text-[#373535]">
            {recordToEdit ? 'Editar Cobrança' : 'Cadastrar Nova Cobrança'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-md cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Fornecedor e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Fornecedor / Credor *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Gráfica Express"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Valor Total (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Descrição do Gasto *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: 5.000 Panfletos A5 - Lançamento Coqueirais"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
            />
          </div>

          {/* Categoria e Data de Recebimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Categoria *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010] bg-white"
              >
                {FINANCIAL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Data de Recebimento *
              </label>
              <input
                type="date"
                required
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
              />
            </div>
          </div>

          {/* Número da Nota */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Número da Nota / Documento (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: NF-e 10425"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
            />
          </div>

          {/* Upload de Anexo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Comprovante / Anexo (PDF ou Imagem até 10MB)
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer text-xs text-gray-700 transition-colors">
                <Upload className="w-4 h-4 text-gray-500" />
                <span>{selectedFile ? 'Trocar arquivo' : 'Selecionar anexo'}</span>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      if (file.size > 10 * 1024 * 1024) {
                        alert('O arquivo selecionado ultrapassa o limite de 10MB.');
                        return;
                      }
                      setSelectedFile(file);
                    }
                  }}
                />
              </label>

              {(selectedFile || attachmentName) && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 truncate">
                  <FileText className="w-3.5 h-3.5 text-[#B21010]" />
                  <span className="truncate max-w-[250px]">
                    {selectedFile ? selectedFile.name : attachmentName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
              Observações
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Condição de pagamento combinada, detalhes adicionais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
            />
          </div>

          {/* Botões */}
          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#B21010] hover:bg-[#8F0D0D] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? 'Salvando...' : recordToEdit ? 'Atualizar Cobrança' : 'Cadastrar Cobrança'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

