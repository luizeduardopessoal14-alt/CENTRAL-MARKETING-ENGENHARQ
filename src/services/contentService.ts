import { supabase } from '../lib/supabase';
import { ContentCard, ContentCardHistoryItem, ContentColumnStatus } from '../types/conteudos';

export const contentService = {
  /**
   * Busca todos os cartões ativos (não excluídos)
   */
  async fetchCards(): Promise<{ data: ContentCard[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('content_cards')
        .select('*')
        .eq('is_deleted', false)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Erro ao buscar cartões de conteúdo:', error);
        return { data: null, error: error.message };
      }

      return { data: (data as ContentCard[]) || [], error: null };
    } catch (err) {
      console.error('Exceção ao buscar cartões:', err);
      return { data: null, error: 'Falha de conexão ao carregar conteúdos.' };
    }
  },

  /**
   * Busca cartões na lixeira (excluídos)
   */
  async fetchDeletedCards(): Promise<{ data: ContentCard[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('content_cards')
        .select('*')
        .eq('is_deleted', true)
        .order('deleted_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: (data as ContentCard[]) || [], error: null };
    } catch (err) {
      return { data: null, error: 'Falha ao buscar itens da lixeira.' };
    }
  },

  /**
   * Cadastro rápido de ideia (somente descrição livre, sem exigir título nem prazo)
   */
  async createIdea(description: string, createdBy: string): Promise<{ data: ContentCard | null; error: string | null }> {
    try {
      const cleanDesc = description.trim();
      if (!cleanDesc) {
        return { data: null, error: 'A descrição da ideia não pode estar vazia.' };
      }

      // Ordem: coloca no final da coluna de ideias
      const { data: lastCard } = await supabase
        .from('content_cards')
        .select('order_index')
        .eq('column_status', 'ideias')
        .eq('is_deleted', false)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (lastCard?.order_index || 0) + 1000;

      const { data, error } = await supabase
        .from('content_cards')
        .insert({
          description: cleanDesc,
          column_status: 'ideias',
          order_index: nextOrder,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as ContentCard, error: null };
    } catch (err) {
      return { data: null, error: 'Erro ao cadastrar ideia de conteúdo.' };
    }
  },

  /**
   * Cadastro completo de cartão (para colunas de execução ou criação direta)
   */
  async createCard(payload: {
    title: string;
    description: string;
    column_status: ContentColumnStatus;
    assigned_to: string | null;
    assigned_name: string | null;
    due_date: string | null;
    created_by: string;
  }): Promise<{ data: ContentCard | null; error: string | null }> {
    try {
      const cleanTitle = payload.title?.trim();
      const cleanDesc = payload.description?.trim();

      if (payload.column_status !== 'ideias') {
        if (!cleanTitle) {
          return { data: null, error: 'Título é obrigatório para avançar à produção.' };
        }
        if (!payload.assigned_name) {
          return { data: null, error: 'Responsável é obrigatório para demandas em produção.' };
        }
        if (!payload.due_date) {
          return { data: null, error: 'Data de entrega é obrigatória para demandas em produção.' };
        }
      }

      // Próximo order_index
      const { data: lastCard } = await supabase
        .from('content_cards')
        .select('order_index')
        .eq('column_status', payload.column_status)
        .eq('is_deleted', false)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextOrder = (lastCard?.order_index || 0) + 1000;

      const { data, error } = await supabase
        .from('content_cards')
        .insert({
          title: cleanTitle || null,
          description: cleanDesc || '',
          column_status: payload.column_status,
          order_index: nextOrder,
          assigned_to: payload.assigned_to,
          assigned_name: payload.assigned_name,
          due_date: payload.due_date,
          created_by: payload.created_by,
        })
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as ContentCard, error: null };
    } catch (err) {
      return { data: null, error: 'Erro ao criar cartão de conteúdo.' };
    }
  },

  /**
   * Atualização de dados de um cartão
   */
  async updateCard(
    id: string,
    updates: Partial<ContentCard>
  ): Promise<{ data: ContentCard | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('content_cards')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: data as ContentCard, error: null };
    } catch (err) {
      return { data: null, error: 'Erro ao atualizar dados do conteúdo.' };
    }
  },

  /**
   * Movimentação de coluna e/ou reordenação no Kanban
   */
  async moveCard(
    id: string,
    newStatus: ContentColumnStatus,
    newOrderIndex: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: Record<string, unknown> = {
        column_status: newStatus,
        order_index: newOrderIndex,
        updated_at: new Date().toISOString(),
      };

      if (newStatus === 'publicado') {
        updates.published_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('content_cards')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Falha ao salvar movimentação no servidor.' };
    }
  },

  /**
   * Exclusão lógica (envio para lixeira)
   */
  async softDeleteCard(id: string, deletedBy: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('content_cards')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: deletedBy,
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao enviar cartão para a lixeira.' };
    }
  },

  /**
   * Restauração da lixeira
   */
  async restoreCard(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('content_cards')
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao restaurar cartão.' };
    }
  },

  /**
   * Exclusão permanente (apenas Superadmin)
   */
  async permanentDeleteCard(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('content_cards')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erro ao excluir definitivamente o cartão.' };
    }
  },

  /**
   * Busca o histórico de alterações e movimentações de um cartão
   */
  async fetchCardHistory(cardId: string): Promise<{ data: ContentCardHistoryItem[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('content_card_history')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: false });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data: (data as ContentCardHistoryItem[]) || [], error: null };
    } catch (err) {
      return { data: null, error: 'Erro ao carregar histórico do cartão.' };
    }
  },

  /**
   * Busca lista de usuários ativos para atribuição de responsável
   */
  async fetchUsers(): Promise<{ id: string; name: string }[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error || !data) return [];

      return data.map((u) => ({
        id: u.id,
        name: u.full_name || u.username,
      }));
    } catch {
      return [];
    }
  },
};

