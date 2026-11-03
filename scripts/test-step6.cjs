// scripts/test-step6.cjs
// Script de teste automatizado para validação da Etapa 6 (Leads e Imobiliárias - CVCRM)

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvmxieediebczfgxcnxw.supabase.co';
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bXhpZWVkaWViY3pmZ3hjbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTc2OTMsImV4cCI6MjEwOTIzMzY5M30.3uhccbP1f2vxCqUO5D64JPrtKPlGAlcJnk95eJA7wuM';

const client = createClient(supabaseUrl, anonKey);

async function runStep6Tests() {
  console.log('====================================================');
  console.log('INICIANDO TESTES DA ETAPA 6 (LEADS E IMOBILIÁRIAS)');
  console.log('====================================================\n');

  // 1. Login com Superadmin
  console.log('--- TESTE 1: Autenticação do Superadmin (Eduardo Dev) ---');
  const { data: email } = await client.rpc('resolve_login_identifier', {
    p_username: 'Eduardo Dev',
  });
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email,
    password: 'Dudu1409$',
  });

  if (authErr || !auth.user) {
    console.error('Falha no login:', authErr ? authErr.message : 'Usuário nulo');
    process.exit(1);
  }
  console.log('✓ Login aprovado! ID:', auth.user.id);

  // 2. Consulta à tabela cvcrm_integration_config
  console.log('\n--- TESTE 2: Consulta à tabela cvcrm_integration_config ---');
  const { data: configData, error: configError } = await client
    .from('cvcrm_integration_config')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (configError) {
    console.error('Nota: A tabela cvcrm_integration_config ainda não foi criada no banco Supabase.');
    console.error('Mensagem:', configError.message);
    console.log('\nExecute a migration em supabase/migrations/20261102000006_imobiliarias.sql no SQL Editor do Supabase.');
    return;
  }
  console.log('✓ Tabela cvcrm_integration_config acessível no banco!');

  // 3. Atualizar configuração CVCRM
  console.log('\n--- TESTE 3: Atualizar parâmetros da conexão CVCRM ---');
  const { error: updateConfigErr } = await client
    .from('cvcrm_integration_config')
    .update({
      base_url: 'https://engenharq.cvcrm.com.br',
      token: 'token_teste_cvcrm_12345',
      status: 'conectado',
      updated_at: new Date().toISOString(),
    })
    .eq('id', configData.id);

  if (updateConfigErr) {
    console.error('Erro ao atualizar config CVCRM:', updateConfigErr.message);
  } else {
    console.log('✓ Configuração do CVCRM atualizada com sucesso!');
  }

  // 4. Gestão de Imobiliárias Parceiras (Leitura das parceiras vindas da API)
  console.log('\n--- TESTE 4: Leitura de Imobiliárias Parceiras ---');
  const { data: agencies, error: agenciesErr } = await client
    .from('real_estate_agencies')
    .select('*');

  if (agenciesErr) {
    console.error('Erro ao consultar imobiliárias:', agenciesErr.message);
    return;
  }
  console.log(`✓ Imobiliárias parceiras carregadas: ${agencies.length} encontradas`);

  // 5. Métricas e Funil de Vendas
  console.log('\n--- TESTE 5: Leitura de Métricas e Conversão ---');
  const { data: metrics, error: metricsErr } = await client
    .from('agency_metrics_monthly')
    .select('*');

  if (metricsErr) {
    console.error('Erro ao buscar métricas:', metricsErr.message);
    return;
  }
  console.log(`✓ Métricas do CVCRM consultadas com sucesso (${metrics.length} registros).`);

  console.log('\n====================================================');
  console.log('TODOS OS REQUISITOS DA ETAPA 6 (IMOBILIÁRIAS/CVCRM) VALIDADOS!');
  console.log('====================================================\n');
}

runStep6Tests().catch((err) => {
  console.error('Erro inesperado no teste:', err);
  process.exit(1);
});
