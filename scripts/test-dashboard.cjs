// scripts/test-dashboard.cjs
// Script de teste automatizado para validação do Dashboard Analítico Executivo

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvmxieediebczfgxcnxw.supabase.co';
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bXhpZWVkaWViY3pmZ3hjbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTc2OTMsImV4cCI6MjEwOTIzMzY5M30.3uhccbP1f2vxCqUO5D64JPrtKPlGAlcJnk95eJA7wuM';

const client = createClient(supabaseUrl, anonKey);

async function runDashboardTests() {
  console.log('====================================================');
  console.log('INICIANDO TESTES DO DASHBOARD ANALÍTICO (POWER BI)');
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

  // 2. Consulta de Dados Financeiros Consolidados
  console.log('\n--- TESTE 2: Consulta e Agregações Financeiras ---');
  const { data: finRecords, error: finErr } = await client
    .from('financial_records')
    .select('*')
    .eq('is_deleted', false);

  if (finErr) {
    console.error('Erro ao consultar financial_records:', finErr.message);
    process.exit(1);
  }
  console.log(`✓ Registros financeiros ativos carregados: ${finRecords.length}`);

  let totalPago = 0;
  let totalComprometido = 0;
  const catMap = {};
  const supplierMap = {};

  finRecords.forEach((r) => {
    const amt = Number(r.amount) || 0;
    if (r.status === 'pago') {
      totalPago += amt;
    } else {
      totalComprometido += amt;
    }
    catMap[r.category] = (catMap[r.category] || 0) + amt;
    supplierMap[r.supplier] = (supplierMap[r.supplier] || 0) + amt;
  });

  console.log(`  - Total Pago (Realizado): R$ ${totalPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  - Total Comprometido: R$ ${totalComprometido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  - Categorias mapeadas: ${Object.keys(catMap).length}`);
  console.log(`  - Fornecedores mapeados: ${Object.keys(supplierMap).length}`);

  // 3. Consulta de Leads do CVCRM e Funil
  console.log('\n--- TESTE 3: Consulta da Fila TOP 5 e Funil Comercial ---');
  const { data: leads, error: leadsErr } = await client
    .from('cvcrm_leads_cache')
    .select('*');

  if (leadsErr) {
    console.error('Erro ao consultar cvcrm_leads_cache:', leadsErr.message);
    process.exit(1);
  }
  console.log(`✓ Leads em cache carregados: ${leads.length}`);

  let totalVendas = 0;
  let totalReservas = 0;
  const imobMap = {};

  leads.forEach((l) => {
    const sit = (l.situacao_nome || '').toLowerCase();
    if (sit.includes('venda')) totalVendas++;
    if (sit.includes('reserva') || (l.qtde_reservas || 0) > 0) totalReservas++;
    imobMap[l.agency_name] = (imobMap[l.agency_name] || 0) + 1;
  });

  console.log(`  - Total Leads no período: ${leads.length}`);
  console.log(`  - Pastas com Reserva: ${totalReservas}`);
  console.log(`  - Vendas Concretizadas: ${totalVendas}`);
  console.log(`  - Conversão Geral: ${((totalVendas / leads.length) * 100).toFixed(2)}%`);
  console.log(`  - Imobiliárias da Fila TOP 5 ativas: ${Object.keys(imobMap).length}`);

  // 4. Cruzamento Mídia x CVCRM
  console.log('\n--- TESTE 4: Métricas Cruzadas de Eficiência de Mídia ---');
  const mediaSpend = catMap['Mídia Paga & Anúncios'] || 0;
  console.log(`  - Verba Mídia Paga: R$ ${mediaSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  if (leads.length > 0 && mediaSpend > 0) {
    const cpl = mediaSpend / leads.length;
    console.log(`  - CPL Real Calculado: R$ ${cpl.toFixed(2)}`);
  }
  if (totalReservas > 0 && mediaSpend > 0) {
    const costPerRes = mediaSpend / totalReservas;
    console.log(`  - Custo por Reserva: R$ ${costPerRes.toFixed(2)}`);
  }
  if (totalVendas > 0 && mediaSpend > 0) {
    const cac = mediaSpend / totalVendas;
    console.log(`  - CAC por Venda: R$ ${cac.toFixed(2)}`);
  }

  console.log('\n====================================================');
  console.log('TODAS AS MÉTRICAS DO DASHBOARD ANALÍTICO INTEGRADAS!');
  console.log('====================================================\n');
}

runDashboardTests();

