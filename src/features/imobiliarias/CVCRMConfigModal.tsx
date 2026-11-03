import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Shield, RefreshCw } from 'lucide-react';
import { imobiliariaService } from '../../services/imobiliariaService';
import { CVCRMIntegrationConfig } from '../../types/imobiliarias';

interface CVCRMConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const CVCRMConfigModal: React.FC<CVCRMConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [config, setConfig] = useState<CVCRMIntegrationConfig | null>(null);
  const [baseUrl, setBaseUrl] = useState('https://engenharq.cvcrm.com.br');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    setLoading(true);
    const data = await imobiliariaService.getConfig();
    if (data) {
      setConfig(data);
      setBaseUrl(data.base_url || 'https://engenharq.cvcrm.com.br');
      setEmail(data.email || '');
      setToken(data.token || '');
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const hasCredentials = baseUrl.trim() && token.trim();
    const newStatus = hasCredentials ? 'conectado' : 'desconectado';

    const res = await imobiliariaService.updateConfig({
      base_url: baseUrl.trim(),
      email: email.trim() || null,
      token: token.trim() || null,
      status: newStatus,
    });

    setSaving(false);
    if (res.success) {
      setMessage({
        text: hasCredentials
          ? 'Configuração do CVCRM salva com sucesso!'
          : 'Configuração atualizada no modo desconectado.',
        type: 'success',
      });
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1000);
    } else {
      setMessage({
        text: `Erro ao salvar: ${res.error}`,
        type: 'error',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Conexão com CVCRM</h2>
              <p className="text-xs text-red-100">Sincronização de Leads, Visitas e Vendas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Status atual */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                Status da Integração
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    config?.status === 'conectado'
                      ? 'bg-emerald-500 ring-4 ring-emerald-100'
                      : 'bg-amber-500 ring-4 ring-amber-100'
                  }`}
                />
                <span className="text-sm font-bold text-gray-800 capitalize">
                  {config?.status === 'conectado' ? 'Conectado' : 'Aguardando Token / Desconectado'}
                </span>
              </div>
            </div>
            {config?.last_sync_at && (
              <div className="text-right">
                <span className="text-[11px] text-gray-400 block">Última Sincronização</span>
                <span className="text-xs font-medium text-gray-700">
                  {new Date(config.last_sync_at).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                URL da Plataforma CVCRM
              </label>
              <input
                type="text"
                required
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="Ex: https://engenharq.cvcrm.com.br"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white outline-hidden transition-all text-gray-800 font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                O endereço do subdomínio da EngenhArq no sistema CVCRM.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                E-mail ou Usuário de Acesso à API
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: marketing@engenharq.com.br"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white outline-hidden transition-all text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Token da API do CVCRM
              </label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole o token de API gerado no CVCRM"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white outline-hidden transition-all text-gray-800 font-mono"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Obtido no menu <strong>Configurações &gt; Integrações &gt; API</strong> dentro do CVCRM.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || loading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-xl text-sm font-bold shadow-md shadow-red-200 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Configurações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

