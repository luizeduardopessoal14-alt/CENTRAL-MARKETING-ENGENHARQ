import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ContentCard,
  ContentColumnStatus,
  KANBAN_COLUMNS,
  calculateDueDateAlert,
} from '../../types/conteudos';
import { contentService } from '../../services/contentService';
import { ContentCardItem } from './ContentCardItem';
import { ContentQuickIdeaModal } from './ContentQuickIdeaModal';
import { ContentCardModal } from './ContentCardModal';
import { ContentTrashModal } from './ContentTrashModal';
import {
  Plus,
  Search,
  Trash2,
  AlertCircle,
  Clock,
  Layers,
} from 'lucide-react';

export const ConteudosView: React.FC = () => {
  const { user, hasAccess } = useAuth();
  const canEdit = hasAccess('conteudos', 'edicao');
  const isSuperadmin = user?.role === 'superadmin';

  // Estados principais
  const [cards, setCards] = useState<ContentCard[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [onlyOverdueFilter, setOnlyOverdueFilter] = useState(false);

  // Modais
  const [isQuickIdeaOpen, setIsQuickIdeaOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<ContentCard | null>(null);
  const [promotionCard, setPromotionCard] = useState<{
    card: ContentCard;
    targetColumn: ContentColumnStatus;
  } | null>(null);

  // Drag and drop state
  const [dragOverColumn, setDragOverColumn] = useState<ContentColumnStatus | null>(null);

  // Carregar dados
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cardsRes, usersList] = await Promise.all([
        contentService.fetchCards(),
        contentService.fetchUsers(),
      ]);

      if (cardsRes.error) {
        setError(cardsRes.error);
      } else {
        setCards(cardsRes.data || []);
      }
      setUsers(usersList);
    } catch {
      setError('Erro ao carregar o quadro de conteúdos.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Contadores e métricas de cabeçalho
  const metrics = useMemo(() => {
    let totalActive = 0;
    let inProduction = 0;
    let inApproval = 0;
    let overdueCount = 0;

    cards.forEach((card) => {
      totalActive++;
      if (card.column_status === 'em_producao') inProduction++;
      if (card.column_status === 'em_aprovacao') inApproval++;

      const alert = calculateDueDateAlert(card.due_date, card.column_status);
      if (alert.type === 'atrasado') {
        overdueCount++;
      }
    });

    return { totalActive, inProduction, inApproval, overdueCount };
  }, [cards]);

  // Filtragem dos cartões
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      // Filtro de texto (busca em título e descrição)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = card.title?.toLowerCase().includes(query);
        const matchDesc = card.description.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      // Filtro de Responsável
      if (assignedFilter) {
        if (card.assigned_to !== assignedFilter) return false;
      }

      // Filtro Apenas Atrasados
      if (onlyOverdueFilter) {
        const alert = calculateDueDateAlert(card.due_date, card.column_status);
        if (alert.type !== 'atrasado') return false;
      }

      return true;
    });
  }, [cards, searchTerm, assignedFilter, onlyOverdueFilter]);

  // Agrupamento por coluna
  const cardsByColumn = useMemo(() => {
    const map: Record<ContentColumnStatus, ContentCard[]> = {
      ideias: [],
      a_produzir: [],
      em_producao: [],
      em_aprovacao: [],
      pronto_publicar: [],
      publicado: [],
    };

    filteredCards.forEach((card) => {
      if (map[card.column_status]) {
        map[card.column_status].push(card);
      }
    });

    return map;
  }, [filteredCards]);

  // Manipulação de Drag and Drop
  const handleDragStart = (e: React.DragEvent, card: ContentCard) => {
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: ContentColumnStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColumn: ContentColumnStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    const cardId = e.dataTransfer.getData('text/plain');
    if (!cardId) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.column_status === targetColumn) {
      return;
    }

    // Regra Obrigatória: Impedir avanço de Ideias para execução sem Título, Responsável e Prazo
    if (card.column_status === 'ideias' && targetColumn !== 'ideias') {
      const hasTitle = Boolean(card.title?.trim());
      const hasAssigned = Boolean(card.assigned_to || card.assigned_name);
      const hasDueDate = Boolean(card.due_date);

      if (!hasTitle || !hasAssigned || !hasDueDate) {
        // Abre o modal de promoção para preencher os dados obrigatórios
        setPromotionCard({ card, targetColumn });
        return;
      }
    }

    // Movimentação direta otimista
    executeMove(card, targetColumn);
  };

  // Movimentação por menu rápido (teclado/mobile)
  const handleQuickMove = (card: ContentCard, targetColumn: ContentColumnStatus) => {
    if (card.column_status === targetColumn) return;

    // Se estiver em ideias e indo para execução sem os dados obrigatórios
    if (card.column_status === 'ideias' && targetColumn !== 'ideias') {
      const hasTitle = Boolean(card.title?.trim());
      const hasAssigned = Boolean(card.assigned_to || card.assigned_name);
      const hasDueDate = Boolean(card.due_date);

      if (!hasTitle || !hasAssigned || !hasDueDate) {
        setPromotionCard({ card, targetColumn });
        return;
      }
    }

    executeMove(card, targetColumn);
  };

  // Execução da movimentação com reversão em caso de falha
  const executeMove = async (card: ContentCard, targetColumn: ContentColumnStatus) => {
    const previousCards = [...cards];

    // Atualização otimista na tela
    setCards((prev) =>
      prev.map((c) =>
        c.id === card.id
          ? {
              ...c,
              column_status: targetColumn,
              published_at: targetColumn === 'publicado' ? new Date().toISOString() : c.published_at,
            }
          : c
      )
    );

    // Salvar no servidor
    const res = await contentService.moveCard(card.id, targetColumn, card.order_index);
    if (!res.success) {
      alert(res.error || 'Erro ao salvar movimentação no servidor. Revertendo...');
      setCards(previousCards); // Reverte visualmente
    }
  };

  // Criar Ideia Rápida
  const handleCreateIdea = async (desc: string) => {
    const res = await contentService.createIdea(desc, user?.id || '');
    if (res.data) {
      setCards((prev) => [...prev, res.data!]);
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao criar ideia' };
  };

  // Salvar Edição do Cartão
  const handleSaveCard = async (cardId: string, updates: Partial<ContentCard>) => {
    const res = await contentService.updateCard(cardId, updates);
    if (res.data) {
      setCards((prev) => prev.map((c) => (c.id === cardId ? res.data! : c)));
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao atualizar cartão' };
  };

  // Promoção de Ideia com Dados Obrigatórios
  const handlePromoteAndMove = async (
    cardId: string,
    data: { title: string; assigned_to: string; assigned_name: string; due_date: string; column_status: ContentColumnStatus }
  ) => {
    const res = await contentService.updateCard(cardId, {
      title: data.title,
      assigned_to: data.assigned_to,
      assigned_name: data.assigned_name,
      due_date: data.due_date,
      column_status: data.column_status,
      published_at: data.column_status === 'publicado' ? new Date().toISOString() : null,
    });

    if (res.data) {
      setCards((prev) => prev.map((c) => (c.id === cardId ? res.data! : c)));
      setPromotionCard(null);
      return { success: true };
    }
    return { success: false, error: res.error || 'Erro ao promover ideia para produção' };
  };

  // Excluir Cartão (Enviar para Lixeira)
  const handleDeleteCard = async (card: ContentCard) => {
    if (!confirm(`Deseja enviar o cartão "${card.title || card.description.slice(0, 30)}" para a lixeira?`)) {
      return;
    }
    const res = await contentService.softDeleteCard(card.id, user?.id || '');
    if (res.success) {
      setCards((prev) => prev.filter((c) => c.id !== card.id));
    } else {
      alert(res.error || 'Erro ao enviar para lixeira');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#F8F9FA]">
      {/* 1. Header do Módulo com Título, Métricas e Ações */}
      <div className="bg-white border-b border-gray-200/80 px-6 py-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#DE3A39] flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h1 className="text-lg font-bold text-[#373535]">
                Quadro de Conteúdos
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Produção de redes sociais &bull; Fluxo contínuo com alertas automáticos de prazo
            </p>
          </div>

          {/* Cards de Métricas Compactos */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200/60 text-xs">
              <span className="text-gray-400 block text-[10px] font-medium uppercase">
                Total Ativo
              </span>
              <span className="font-bold text-[#373535]">{metrics.totalActive}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs">
              <span className="text-amber-700 block text-[10px] font-medium uppercase">
                Em Produção
              </span>
              <span className="font-bold text-amber-900">{metrics.inProduction}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-purple-50/70 border border-purple-200/60 text-xs">
              <span className="text-purple-700 block text-[10px] font-medium uppercase">
                Em Aprovação (Flávia)
              </span>
              <span className="font-bold text-purple-900">{metrics.inApproval}</span>
            </div>

            <div
              onClick={() => setOnlyOverdueFilter(!onlyOverdueFilter)}
              className={`px-3 py-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                metrics.overdueCount > 0
                  ? onlyOverdueFilter
                    ? 'bg-red-600 text-white border-red-600 shadow-xs'
                    : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                  : 'bg-gray-50 border-gray-200/60 text-gray-400 opacity-60'
              }`}
              title="Clique para filtrar apenas atrasados"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase">Atrasados</span>
                {metrics.overdueCount > 0 && <AlertCircle className="w-3 h-3" />}
              </div>
              <span className="font-bold text-sm leading-tight block">
                {metrics.overdueCount}
              </span>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTrashOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200 transition-colors cursor-pointer"
              title="Lixeira de conteúdos"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsQuickIdeaOpen(true)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-[#DE3A39] hover:bg-[#C52B2A] transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Ideia</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Barra de Filtros e Busca */}
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
            {/* Campo de Busca */}
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título ou descrição..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all"
              />
            </div>

            {/* Filtro por Responsável */}
            <select
              value={assignedFilter}
              onChange={(e) => setAssignedFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg text-[#373535] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#DE3A39] transition-all"
            >
              <option value="">Todos os responsáveis</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {/* Toggle de Atrasados */}
            <button
              type="button"
              onClick={() => setOnlyOverdueFilter(!onlyOverdueFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                onlyOverdueFilter
                  ? 'bg-red-50 text-red-700 border-red-300 font-semibold'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Clock className="w-3 h-3 text-red-500" />
              <span>Apenas Atrasados</span>
              {onlyOverdueFilter && <span className="ml-1 text-[10px]">&times;</span>}
            </button>

            {(searchTerm || assignedFilter || onlyOverdueFilter) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setAssignedFilter('');
                  setOnlyOverdueFilter(false);
                }}
                className="text-xs text-gray-400 hover:text-gray-600 underline cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="text-xs text-gray-400">
            Mostrando <strong>{filteredCards.length}</strong> de {cards.length} conteúdos
          </div>
        </div>
      </div>

      {/* 3. Área do Kanban com Scroll Horizontal Suave */}
      <div className="flex-1 overflow-x-auto p-6">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
            <div className="w-8 h-8 border-2 border-[#DE3A39]/30 border-t-[#DE3A39] rounded-full animate-spin" />
            <p className="text-xs">Carregando quadro de conteúdos...</p>
          </div>
        ) : error ? (
          <div className="max-w-md mx-auto p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2.5 mt-8">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="font-semibold">Não foi possível carregar os conteúdos:</p>
              <p className="mt-1">{error}</p>
              <button
                onClick={loadData}
                className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-4.5 h-full items-start min-w-[1380px]">
            {KANBAN_COLUMNS.map((column) => {
              const columnCards = cardsByColumn[column.id] || [];
              const isDropTarget = dragOverColumn === column.id;

              return (
                <div
                  key={column.id}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, column.id)}
                  className={`flex-1 flex flex-col max-h-full bg-gray-100/70 rounded-2xl border transition-all ${
                    isDropTarget
                      ? 'border-[#DE3A39] ring-2 ring-[#DE3A39]/20 bg-red-50/20'
                      : 'border-gray-200/70'
                  }`}
                  style={{ minWidth: '220px', maxWidth: '280px' }}
                >
                  {/* Cabeçalho da Coluna */}
                  <div className="p-3.5 flex items-center justify-between border-b border-gray-200/50 bg-white/50 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: column.color }}
                      />
                      <h3 className="text-xs font-bold text-[#373535] tracking-tight">
                        {column.title}
                      </h3>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-200/80 text-gray-700">
                        {columnCards.length}
                      </span>
                    </div>

                    {column.id === 'ideias' && canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsQuickIdeaOpen(true)}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 transition-colors cursor-pointer"
                        title="Nova ideia rápida"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Lista de Cartões com Scroll Vertical na Coluna */}
                  <div className="p-2.5 flex-1 overflow-y-auto space-y-2.5">
                    {columnCards.length === 0 ? (
                      <div className="h-28 rounded-xl border-2 border-dashed border-gray-200/80 flex flex-col items-center justify-center text-gray-400 p-3 text-center">
                        <span className="text-[11px] leading-tight font-medium">
                          Nenhum conteúdo
                        </span>
                        <span className="text-[9px] text-gray-300 mt-0.5">
                          {column.id === 'ideias' ? 'Adicione uma ideia' : 'Arraste cartões aqui'}
                        </span>
                      </div>
                    ) : (
                      columnCards.map((card) => (
                        <ContentCardItem
                          key={card.id}
                          card={card}
                          canEdit={canEdit}
                          onCardClick={(c) => setSelectedCardForEdit(c)}
                          onQuickMove={handleQuickMove}
                          onDeleteClick={handleDeleteCard}
                          onDragStart={handleDragStart}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Modais Integrados */}
      {/* Modal de Ideia Rápida */}
      <ContentQuickIdeaModal
        isOpen={isQuickIdeaOpen}
        onClose={() => setIsQuickIdeaOpen(false)}
        onSubmit={handleCreateIdea}
      />

      {/* Modal de Detalhes / Edição */}
      <ContentCardModal
        isOpen={Boolean(selectedCardForEdit)}
        card={selectedCardForEdit}
        canEdit={canEdit}
        users={users}
        onClose={() => setSelectedCardForEdit(null)}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
      />

      {/* Modal de Promoção Obrigatória (Ideia -> Produção) */}
      {promotionCard && (
        <ContentCardModal
          isOpen={true}
          card={promotionCard.card}
          targetColumnForPromotion={promotionCard.targetColumn}
          canEdit={canEdit}
          users={users}
          onClose={() => setPromotionCard(null)}
          onSave={handleSaveCard}
          onPromoteAndMove={handlePromoteAndMove}
        />
      )}

      {/* Modal de Lixeira */}
      <ContentTrashModal
        isOpen={isTrashOpen}
        isSuperadmin={isSuperadmin}
        onClose={() => setIsTrashOpen(false)}
        onCardRestored={loadData}
      />
    </div>
  );
};

