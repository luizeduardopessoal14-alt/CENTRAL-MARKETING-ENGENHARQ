import React, { useState, useEffect } from 'react';
import { MetaIntegrationConfig } from '../../types/midia';
import { midiaService } from '../../services/midiaService';
import {
  X,
  Key,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Megaphone,
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

interface MetaConfigModalProps {
  isOpen: boolean;
  config: MetaIntegrationConfig | null;
  canEdit: boolean;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export const MetaConfigModal: React.FC<MetaConfigModalProps> = ({
  isOpen,
  config,
  canEdit,
  userId,
  onClose,
  onSaved,
}) => {
  const [adAccountId, setAdAccountId] = useState('');
  const [instagramId, setInstagramId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (config) {
      setAdAccountId(config.ad_account_id || '');
      setInstagramId(config.instagram_business_id || '');
      setError(null);
      setSuccess(false);
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    setIsSubmitting(true);
    try {
      const res = await midiaService.updateConfig({
        ad_account_id: adAccountId.trim() || null,
        instagram_business_id: instagramId.trim() || null,
        updated_by: userId,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1200);
      }
    } catch {
      setError('Falha ao salvar configurações.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Topo do Modal */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-b from-white to-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#373535]">Configuração da Meta (Facebook Ads & Instagram)</h3>
              <p className="text-[11px] text-gray-500">
                Vincule os identificadores da conta de anúncios e perfil
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
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>Identificadores salvos com sucesso!</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900 leading-relaxed space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
              Como funciona a integração:
            </p>
            <p className="text-blue-800 text-[11px]">
              Insira abaixo os IDs que você já obteve da Meta. Assim que o Token de Leitura estiver disponível, ele será conectado para sincronização automática dos dados.
            </p>
          </div>

          <form id="metaConfigForm" onSubmit={handleSubmit} className="space-y-4">
            {/* ID da Conta de Anúncios */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                ID da Conta de Anúncios (Meta Ads)
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={!canEdit}
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  placeholder="Ex: act_123456789012345 ou 123456789012345"
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B21010] transition-all disabled:opacity-70"
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1 block">
                Localizado no topo esquerdo do Gerenciador de Anúncios da Meta.
              </span>
            </div>

            {/* ID do Instagram Business */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <InstagramIcon className="w-3.5 h-3.5 text-pink-600" />
                <span>ID da Conta do Instagram Business</span>
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={instagramId}
                onChange={(e) => setInstagramId(e.target.value)}
                placeholder="Ex: 17841400000000000"
                className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B21010] transition-all disabled:opacity-70"
              />
              <span className="text-[10px] text-gray-400 mt-1 block">
                Identificador da conta profissional do Instagram no Meta Business Suite.
              </span>
            </div>

            {/* Status do Token */}
            <div className="pt-2 border-t border-gray-100">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Token de Acesso da Graph API</span>
              </label>
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center justify-between">
                <span>
                  Status do Token:{' '}
                  <strong className="text-amber-600">Aguardando geração pelo gestor</strong>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                  Pendente
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Por segurança, o token de leitura será mantido exclusivamente nos segredos de backend quando fornecido.
              </p>
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {canEdit ? 'Cancelar' : 'Fechar'}
          </button>
          {canEdit && (
            <button
              type="submit"
              form="metaConfigForm"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-[#B21010] hover:bg-[#8F0D0D] transition-all shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Identificadores'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
