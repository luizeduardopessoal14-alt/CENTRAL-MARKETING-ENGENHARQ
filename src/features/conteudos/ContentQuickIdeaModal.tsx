import React, { useState } from 'react';
import { X, Lightbulb, Sparkles } from 'lucide-react';

interface ContentQuickIdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string) => Promise<{ success: boolean; error?: string }>;
}

export const ContentQuickIdeaModal: React.FC<ContentQuickIdeaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const clean = description.trim();
    if (!clean) {
      setError('Descreva brevemente a ideia antes de salvar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onSubmit(clean);
      if (result.success) {
        setDescription('');
        onClose();
      } else {
        setError(result.error || 'Erro ao cadastrar ideia.');
      }
    } catch {
      setError('Falha de conexão. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Topo */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-white to-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#373535]">Anotar Nova Ideia</h3>
              <p className="text-[11px] text-gray-500">
                Cadastro rápido sem exigência de título ou prazo inicial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Descrição da Ideia de Conteúdo <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Vídeo mostrando os bastidores da concretagem da laje do Residencial Horizonte com depoimento do engenheiro..."
              className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] focus:border-transparent transition-all resize-none"
              autoFocus
            />
            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Título, responsável e prazo serão definidos quando a ideia for movida para produção.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#DE3A39] hover:bg-[#C52B2A] transition-all shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Ideia'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

