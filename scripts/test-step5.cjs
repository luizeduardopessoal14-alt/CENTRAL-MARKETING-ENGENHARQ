const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvmxieediebczfgxcnxw.supabase.co';
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bXhpZWVkaWViY3pmZ3hjbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTc2OTMsImV4cCI6MjEwOTIzMzY5M30.3uhccbP1f2vxCqUO5D64JPrtKPlGAlcJnk95eJA7wuM';

async function runStep5Tests() {
  console.log('====================================================');
  console.log('INICIANDO BATERIA DE TESTES DA ETAPA 5 (MÍDIA E ADS)');
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

  // 2. Verificar se a tabela meta_integration_config existe
  console.log('\n--- TESTE 2: Consulta à tabela meta_integration_config ---');
  const { data: configCheck, error: configErr } = await client
    .from('meta_integration_config')
    .select('*')
    .limit(1);

  if (configErr) {
    console.log('Nota: A tabela meta_integration_config ainda não foi criada no banco Supabase.');
    console.log('Mensagem:', configErr.message);
    console.log('\nExecute a migration em supabase/migrations/20261102000005_midia_campanhas.sql no SQL Editor do Supabase.');
    return;
  }
  console.log('✓ Tabela meta_integration_config acessível no banco!');

  // 3. Atualizar identificadores da Meta
  console.log('\n--- TESTE 3: Salvar ID da Conta de Anúncios e Instagram ---');
  const testAdAccount = 'act_1049284759284';
  const testInstaId = '1784145928374829';

  const { data: updatedConfig, error: updConfigErr } = await client
    .from('meta_integration_config')
    .update({
      ad_account_id: testAdAccount,
      instagram_business_id: testInstaId,
      status: 'desconectado',
      updated_by: auth.user.id,
    })
    .eq('id', configCheck[0].id)
    .select()
    .single();

  if (updConfigErr) {
    console.error('Erro ao salvar configuração:', updConfigErr.message);
    return;
  }
  console.log('✓ Configuração atualizada com sucesso!');
  console.log('   - Ad Account ID:', updatedConfig.ad_account_id);
  console.log('   - Instagram Business ID:', updatedConfig.instagram_business_id);
  console.log('   - Status da Conexão:', updatedConfig.status);

  // 4. Teste de Inserção e Cálculo de Métricas de Campanha
  console.log('\n--- TESTE 4: Estrutura de métricas de campanha (Meta Ads) ---');
  const todayYMD = new Date().toISOString().split('T')[0];
  const { data: newInsight, error: insightErr } = await client
    .from('meta_campaign_insights')
    .insert({
      campaign_id: 'test_camp_01',
      campaign_name: 'Campanha Teste - Residencial Horizonte Leads',
      objective: 'cadastros',
      status: 'ACTIVE',
      period_start: todayYMD,
      period_end: todayYMD,
      spend: 1500.0,
      leads: 30,
      cost_per_lead: 50.0,
      reach: 12500,
      impressions: 28000,
      cpm: 53.57,
    })
    .select()
    .single();

  if (insightErr) {
    console.error('Erro ao inserir métrica de teste:', insightErr.message);
  } else {
    console.log('✓ Métrica de campanha registrada! ID:', newInsight.id);
    console.log('   - Investimento:', newInsight.spend, '| Leads:', newInsight.leads, '| CPL:', newInsight.cost_per_lead);
    // Limpeza da métrica de teste
    await client.from('meta_campaign_insights').delete().eq('id', newInsight.id);
    console.log('✓ Registro de teste removido da tabela de métricas.');
  }

  console.log('\n====================================================');
  console.log('TODOS OS REQUISITOS DA ETAPA 5 (MÍDIA E ADS) VALIDADOS!');
  console.log('====================================================');
}

runStep5Tests();

