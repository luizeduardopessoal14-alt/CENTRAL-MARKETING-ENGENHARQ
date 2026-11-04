import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { UserProfile, UserPermission, AppArea, AccessLevel } from '../../types/auth';
import {
  UserPlus,
  KeyRound,
  UserCheck,
  UserX,
  Shield,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
} from 'lucide-react';

const areasList: { id: Exclude<AppArea, 'visao_geral'>; label: string }[] = [
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'conteudos', label: 'Conteúdos' },
  { id: 'calendario', label: 'Calendário' },
  { id: 'midia', label: 'Mídia e campanhas' },
  { id: 'imobiliarias', label: 'Leads e imobiliárias' },
  { id: 'relatorios', label: 'Relatórios' },
];

export const AdminView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userPermissions, setUserPermissions] = useState<Record<string, Record<AppArea, AccessLevel>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modais
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetPwModalOpen, setIsResetPwModalOpen] = useState(false);
  const [selectedUserForPw, setSelectedUserForPw] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Formulário de Criação de Usuário
  const [createForm, setCreateForm] = useState({
    username: '',
    full_name: '',
    password: '',
    role: 'user' as 'user' | 'superadmin',
    permissions: {
      financeiro: 'sem_acesso' as AccessLevel,
      conteudos: 'sem_acesso' as AccessLevel,
      calendario: 'sem_acesso' as AccessLevel,
      midia: 'sem_acesso' as AccessLevel,
      imobiliarias: 'sem_acesso' as AccessLevel,
      relatorios: 'sem_acesso' as AccessLevel,
    },
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Carregar todos os perfis
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (profilesError) throw profilesError;
      setUsers(profilesData || []);

      // 2. Carregar todas as permissões
      const { data: permsData, error: permsError } = await supabase
        .from('user_permissions')
        .select('*');

      if (permsError) throw permsError;

      const permsMap: Record<string, Record<AppArea, AccessLevel>> = {};
      if (permsData) {
        permsData.forEach((p: UserPermission) => {
          if (!permsMap[p.user_id]) permsMap[p.user_id] = {} as Record<AppArea, AccessLevel>;
          permsMap[p.user_id][p.area] = p.access_level;
        });
      }
      setUserPermissions(permsMap);
    } catch (err: unknown) {
      console.error('Erro ao carregar dados administrativos:', err);
      const message = err instanceof Error ? err.message : 'Falha ao buscar dados.';
      setFeedbackMessage({ type: 'error', text: message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Limpar alerta após 4 segundos
  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);

  // Alterar permissão individual em tempo real
  const handleUpdatePermission = async (userId: string, area: AppArea, level: AccessLevel) => {
    try {
      const { error } = await supabase.rpc('admin_update_user_permission', {
        p_target_user_id: userId,
        p_area: area,
        p_access_level: level,
      });

      if (error) throw error;

      // Atualização otimista local
      setUserPermissions((prev) => ({
        ...prev,
        [userId]: {
          ...(prev[userId] || {}),
          [area]: level,
        },
      }));

      setFeedbackMessage({ type: 'success', text: `Permissão de ${area} atualizada.` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao atualizar permissão.';
      setFeedbackMessage({ type: 'error', text: message });
    }
  };

  // Ativar / Desativar usuário
  const handleToggleActive = async (targetUser: UserProfile) => {
    const newStatus = !targetUser.is_active;
    const confirmText = newStatus
      ? `Deseja reativar o acesso de ${targetUser.full_name}?`
      : `Deseja desativar ${targetUser.full_name}? O usuário será desconectado e impedido de realizar operações imediatamente.`;

    if (!window.confirm(confirmText)) return;

    try {
      const { error } = await supabase.rpc('admin_set_user_active_status', {
        p_target_user_id: targetUser.id,
        p_is_active: newStatus,
      });

      if (error) throw error;

      setFeedbackMessage({
        type: 'success',
        text: `Usuário ${targetUser.username} foi ${newStatus ? 'reativado' : 'desativado'}.`,
      });
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao alterar status do usuário.';
      setFeedbackMessage({ type: 'error', text: message });
    }
  };

  // Redefinir Senha
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPw || !newPassword) return;

    if (newPassword.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      const { error } = await supabase.rpc('admin_reset_user_password', {
        p_target_user_id: selectedUserForPw.id,
        p_new_password: newPassword,
      });

      if (error) throw error;

      setFeedbackMessage({
        type: 'success',
        text: `Senha de ${selectedUserForPw.username} alterada com sucesso.`,
      });
      setIsResetPwModalOpen(false);
      setSelectedUserForPw(null);
      setNewPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao redefinir senha.';
      setFeedbackMessage({ type: 'error', text: message });
    }
  };

  // Criar Usuário
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.rpc('admin_create_user', {
        p_username: createForm.username.trim(),
        p_full_name: createForm.full_name.trim(),
        p_password: createForm.password,
        p_role: createForm.role,
        p_permissions: createForm.permissions,
      });

      if (error) throw error;

      setFeedbackMessage({
        type: 'success',
        text: `Usuário ${createForm.username} cadastrado com sucesso!`,
      });

      setIsCreateModalOpen(false);
      setCreateForm({
        username: '',
        full_name: '',
        password: '',
        role: 'user',
        permissions: {
          financeiro: 'sem_acesso',
          conteudos: 'sem_acesso',
          calendario: 'sem_acesso',
          midia: 'sem_acesso',
          imobiliarias: 'sem_acesso',
          relatorios: 'sem_acesso',
        },
      });

      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar usuário.';
      setFeedbackMessage({ type: 'error', text: message });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Alerta de Feedback */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-fade-in ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#B21010]" />
            )}
            <span className="text-sm font-medium">{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="p-1 hover:opacity-70 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Topo: Título da Seção e Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-base font-bold text-[#373535]">Gerenciamento de Equipe e Permissões</h2>
          <p className="text-xs text-gray-500">Defina o nível de acesso individual por aba para cada usuário do marketing.</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#B21010] hover:bg-[#8F0D0D] text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Usuário</span>
        </button>
      </div>

      <div className="space-y-4">
          {/* Barra de Busca e Filtro */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome ou usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010] focus:border-transparent"
              />
            </div>
            <button
              onClick={loadData}
              title="Recarregar"
              className="p-2 text-gray-500 hover:text-[#373535] bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tabela de Usuários e Permissões por Aba */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="py-3 px-4">Usuário</th>
                    <th className="py-3 px-4">Papel</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-3 text-center">Financeiro</th>
                    <th className="py-3 px-3 text-center">Conteúdos</th>
                    <th className="py-3 px-3 text-center">Calendário</th>
                    <th className="py-3 px-3 text-center">Mídia</th>
                    <th className="py-3 px-3 text-center">Imobiliárias</th>
                    <th className="py-3 px-3 text-center">Relatórios</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredUsers.map((u) => {
                    const isSuper = u.role === 'superadmin';
                    const perms = userPermissions[u.id] || {};

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-gray-50/50 transition-colors ${
                          !u.is_active ? 'bg-gray-50/70 opacity-60' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-medium text-[#373535]">
                          <div>
                            <span className="font-semibold block">{u.full_name}</span>
                            <span className="text-xs text-gray-400 font-mono">@{u.username}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#B21010] border border-red-200">
                              <Shield className="w-3 h-3" />
                              Superadmin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              Marketing
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {u.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Desativado
                            </span>
                          )}
                        </td>

                        {/* Colunas de Permissão por Aba */}
                        {areasList.map((area) => {
                          const currentLevel = isSuper ? 'edicao' : perms[area.id] || 'sem_acesso';

                          return (
                            <td key={area.id} className="py-3.5 px-3 text-center">
                              {isSuper ? (
                                <span className="text-[11px] font-semibold text-gray-400" title="Superadmin tem acesso total">
                                  Total
                                </span>
                              ) : (
                                <select
                                  disabled={!u.is_active}
                                  value={currentLevel}
                                  onChange={(e) =>
                                    handleUpdatePermission(u.id, area.id, e.target.value as AccessLevel)
                                  }
                                  className={`text-xs font-medium rounded-md px-2 py-1 border transition-colors cursor-pointer ${
                                    currentLevel === 'edicao'
                                      ? 'bg-red-50 text-[#B21010] border-red-200'
                                      : currentLevel === 'consulta'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-gray-50 text-gray-400 border-gray-200'
                                  }`}
                                >
                                  <option value="sem_acesso">Sem acesso</option>
                                  <option value="consulta">Consulta</option>
                                  <option value="edicao">Edição</option>
                                </select>
                              )}
                            </td>
                          );
                        })}

                        {/* Ações Rápidas */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setSelectedUserForPw(u);
                                setIsResetPwModalOpen(true);
                              }}
                              title="Redefinir senha"
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleActive(u)}
                              title={u.is_active ? 'Desativar usuário' : 'Reativar usuário'}
                              className={`p-1.5 rounded-md transition-colors ${
                                u.is_active
                                  ? 'text-gray-400 hover:text-[#B21010] hover:bg-red-50'
                                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Modal: Cadastrar Novo Usuário */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#373535]">Novo Usuário</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Flávia Coordenadora"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Nome de Usuário
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Flavia Mkt"
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                    Senha Inicial Fixa
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 dígitos"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Papel no Sistema
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'user' | 'superadmin' })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
                >
                  <option value="user">Usuário Comum (Permissões por aba)</option>
                  <option value="superadmin">Superadministrador (Acesso total)</option>
                </select>
              </div>

              {createForm.role === 'user' && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2">
                    Permissões Iniciais por Aba
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {areasList.map((area) => (
                      <div
                        key={area.id}
                        className="p-2 border border-gray-200 rounded-lg flex items-center justify-between text-xs bg-gray-50/50"
                      >
                        <span className="font-medium text-gray-700">{area.label}</span>
                        <select
                          value={createForm.permissions[area.id]}
                          onChange={(e) =>
                            setCreateForm({
                              ...createForm,
                              permissions: {
                                ...createForm.permissions,
                                [area.id]: e.target.value as AccessLevel,
                              },
                            })
                          }
                          className="text-xs border border-gray-300 rounded px-1.5 py-0.5 bg-white font-medium"
                        >
                          <option value="sem_acesso">Sem acesso</option>
                          <option value="consulta">Consulta</option>
                          <option value="edicao">Edição</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B21010] hover:bg-[#8F0D0D] text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                >
                  Criar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Redefinir Senha */}
      {isResetPwModalOpen && selectedUserForPw && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#373535]">Redefinir Senha</h3>
              <button
                onClick={() => setIsResetPwModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <p className="text-xs text-gray-500">
                Definindo nova senha para <strong>{selectedUserForPw.full_name}</strong> (
                <code>@{selectedUserForPw.username}</code>).
              </p>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                  Nova Senha Fixa
                </label>
                <input
                  type="password"
                  required
                  placeholder="Mínimo 6 dígitos"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#B21010]"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsResetPwModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B21010] hover:bg-[#8F0D0D] text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
                >
                  Confirmar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
