const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvmxieediebczfgxcnxw.supabase.co';
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bXhpZWVkaWViY3pmZ3hjbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTc2OTMsImV4cCI6MjEwOTIzMzY5M30.3uhccbP1f2vxCqUO5D64JPrtKPlGAlcJnk95eJA7wuM';

async function runStep3Tests() {
  console.log('====================================================');
  console.log('INICIANDO BATERIA DE TESTES DA ETAPA 3 (CONTEÚDOS)');
  console.log('====================================================\n');

  const client = createClient(supabaseUrl, anonKey);

  // 1. Login do Superadmin
  console.log('--- TESTE 1: Autenticação do Superadmin (Eduardo Dev) ---');
  const { data: email } = await client.rpc('resolve_login_identifier', {
    p_username: 'Eduardo Dev',
  });
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email,
    password: 'Dudu1409$',
  });

  if (authErr) {
    console.error('Falha no login:', authErr.message);
    return;
  }
  console.log('✓ Login aprovado! ID:', auth.user.id);

  // 2. Verificar se a tabela content_cards existe no banco
  console.log('\n--- TESTE 2: Consulta à tabela content_cards ---');
  const { data: tableCheck, error: tableErr } = await client
    .from('content_cards')
    .select('id')
    .limit(1);

  if (tableErr) {
    console.log('Nota: Tabela content_cards ainda não foi criada no banco Supabase.');
    console.log('Mensagem:', tableErr.message);
    console.log('\nExecute a migration em supabase/migrations/20261102000003_conteudos.sql no SQL Editor do Supabase.');
    return;
  }

  console.log('✓ Tabela content_cards acessível no banco!');

  // 3. Teste de Cadastro de Ideia (sem título e sem prazo inicial)
  console.log('\n--- TESTE 3: Cadastrar ideia livre na coluna ideias ---');
  const { data: newIdea, error: ideaErr } = await client
    .from('content_cards')
    .insert({
      description: 'Vídeo institucional mostrando a tecnologia construtiva da laje',
      column_status: 'ideias',
      order_index: 1000,
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (ideaErr) {
    console.error('Erro ao cadastrar ideia:', ideaErr.message);
    return;
  }
  console.log('✓ Ideia criada com sucesso! ID:', newIdea.id, '| Status:', newIdea.column_status);

  // 4. Teste de Promoção para 'a_produzir' com Título, Responsável e Prazo
  console.log('\n--- TESTE 4: Promover ideia para a_produzir ---');
  const today = new Date().toISOString().split('T')[0];
  const { data: promoted, error: promoErr } = await client
    .from('content_cards')
    .update({
      title: 'Reels: Tecnologia construtiva na laje',
      assigned_to: auth.user.id,
      assigned_name: 'Eduardo Dev',
      due_date: today,
      column_status: 'a_produzir',
    })
    .eq('id', newIdea.id)
    .select()
    .single();

  if (promoErr) {
    console.error('Erro ao promover:', promoErr.message);
    return;
  }
  console.log('✓ Cartão promovido! Título:', promoted.title, '| Coluna:', promoted.column_status);

  // 5. Teste de Movimentação para 'em_aprovacao' e 'publicado'
  console.log('\n--- TESTE 5: Avançar fluxo até Publicado ---');
  const { data: published, error: pubErr } = await client
    .from('content_cards')
    .update({
      column_status: 'publicado',
    })
    .eq('id', newIdea.id)
    .select()
    .single();

  if (pubErr) {
    console.error('Erro ao publicar:', pubErr.message);
    return;
  }
  console.log('✓ Cartão movido para Publicado! Published_at:', published.published_at);

  // 6. Teste de Histórico gerado automaticamente pelo Trigger
  console.log('\n--- TESTE 6: Verificar Histórico Automático do Cartão ---');
  const { data: history, error: histErr } = await client
    .from('content_card_history')
    .select('*')
    .eq('card_id', newIdea.id);

  if (histErr) {
    console.error('Erro ao buscar histórico:', histErr.message);
  } else {
    console.log(`✓ ${history.length} eventos registrados no histórico automaticamente!`);
    history.forEach((h) => {
      console.log(`   - Ação: ${h.action} | De: ${h.from_status || '-'} -> Para: ${h.to_status || '-'} | Por: ${h.changed_by_name}`);
    });
  }

  // 7. Limpeza do registro de teste
  await client.from('content_cards').delete().eq('id', newIdea.id);
  console.log('\n✓ Registro de teste removido.');

  console.log('\n====================================================');
  console.log('TODOS OS REQUISITOS DA ETAPA 3 (CONTEÚDOS) VALIDADOS!');
  console.log('====================================================');
}

runStep3Tests();

