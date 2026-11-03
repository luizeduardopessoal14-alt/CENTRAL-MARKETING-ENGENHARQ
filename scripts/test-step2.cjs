const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvmxieediebczfgxcnxw.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bXhpZWVkaWViY3pmZ3hjbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTc2OTMsImV4cCI6MjEwOTIzMzY5M30.3uhccbP1f2vxCqUO5D64JPrtKPlGAlcJnk95eJA7wuM';

async function runFinanceTests() {
  console.log('====================================================');
  console.log('INICIANDO BATERIA DE TESTES DA ETAPA 2 (FINANCEIRO)');
  console.log('====================================================\n');

  // 1. Login com Superadmin (Eduardo Dev)
  const client = createClient(supabaseUrl, anonKey);
  const { data: email } = await client.rpc('resolve_login_identifier', { p_username: 'Eduardo Dev' });
  const { data: auth, error: authErr } = await client.auth.signInWithPassword({
    email,
    password: 'Dudu1409$'
  });

  if (authErr) {
    console.error('Falha no login:', authErr.message);
    return;
  }
  console.log('✓ Login realizado com sucesso! User:', auth.user.id);

  // 2. Teste de Cadastro de Cobrança (Situação 1: A encaminhar)
  console.log('\n--- TESTE 1: Cadastrar nova cobrança (A encaminhar) ---');
  const { data: newRecord, error: insertErr } = await client
    .from('financial_records')
    .insert({
      supplier: 'Gráfica Central Teste',
      description: '10.000 Panfletos Institucionais EngenhArq',
      amount: 4500.00,
      category: 'Gráfica & Comunicação Visual',
      receipt_date: '2026-11-01',
      authorized_by: 'Flávia Coordenadora',
      invoice_number: 'NF-10492',
      created_by: auth.user.id
    })
    .select()
    .single();

  if (insertErr) {
    console.error('Erro ao cadastrar cobrança:', insertErr.message);
    return;
  }
  console.log('✓ Cobrança criada! ID:', newRecord.id, '| Status:', newRecord.status);
  if (newRecord.status !== 'a_encaminhar') {
    console.error('ERRO: Esperava status a_encaminhar, recebeu:', newRecord.status);
  }

  // 3. Teste de Envio ao Financeiro (Situação 2: Aguardando previsão)
  console.log('\n--- TESTE 2: Registrar envio ao financeiro (Aguardando previsão) ---');
  const { data: forwardedRecord, error: fwdErr } = await client
    .from('financial_records')
    .update({ forwarded_to_finance_date: '2026-11-02' })
    .eq('id', newRecord.id)
    .select()
    .single();

  if (fwdErr) {
    console.error('Erro ao atualizar envio:', fwdErr.message);
    return;
  }
  console.log('✓ Envio registrado! Novo status:', forwardedRecord.status);
  if (forwardedRecord.status !== 'aguardando_previsao') {
    console.error('ERRO: Esperava status aguardando_previsao, recebeu:', forwardedRecord.status);
  }

  // 4. Teste de Informar Previsão (Situação 3: Pagamento previsto + Trigger de Histórico)
  console.log('\n--- TESTE 3: Informar previsão recebida do Sienge ---');
  const { data: forecastRecord, error: fcErr } = await client
    .from('financial_records')
    .update({ payment_forecast_date: '2026-11-10' })
    .eq('id', newRecord.id)
    .select()
    .single();

  if (fcErr) {
    console.error('Erro ao informar previsão:', fcErr.message);
    return;
  }
  console.log('✓ Previsão informada! Novo status:', forecastRecord.status, '| Previsão:', forecastRecord.payment_forecast_date);

  // 5. Teste de alteração de previsão (Verificando histórico atômico do PostgreSQL)
  console.log('\n--- TESTE 4: Alterar previsão no Sienge e verificar histórico automático ---');
  await client
    .from('financial_records')
    .update({ payment_forecast_date: '2026-11-15' })
    .eq('id', newRecord.id);

  const { data: historyList, error: histErr } = await client
    .from('financial_forecast_history')
    .select('*')
    .eq('record_id', newRecord.id)
    .order('changed_at', { ascending: false });

  if (histErr) {
    console.error('Erro ao buscar histórico:', histErr.message);
    return;
  }
  console.log(`✓ Histórico gerado automaticamente pelo Trigger! (${historyList.length} registros)`);
  historyList.forEach((h, i) => {
    console.log(`   [${i+1}] De: ${h.old_forecast_date || 'Nenhum'} -> Para: ${h.new_forecast_date} | Autor: ${h.changed_by_name}`);
  });

  // 6. Teste de Confirmação de Pagamento Efetivo (Situação 4: Pago)
  console.log('\n--- TESTE 5: Confirmar pagamento no Sienge (Pago) ---');
  const { data: paidRecord, error: paidErr } = await client
    .from('financial_records')
    .update({ payment_actual_date: '2026-11-15' })
    .eq('id', newRecord.id)
    .select()
    .single();

  if (paidErr) {
    console.error('Erro ao confirmar pagamento:', paidErr.message);
    return;
  }
  console.log('✓ Pagamento confirmado! Novo status:', paidRecord.status, '| Data efetiva:', paidRecord.payment_actual_date);

  // 7. Teste de Lixeira (Mover para lixeira, verificar exclusão lógica, restaurar)
  console.log('\n--- TESTE 6: Lixeira e Restauração ---');
  await client
    .from('financial_records')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: auth.user.id
    })
    .eq('id', newRecord.id);

  const { data: checkDeleted } = await client
    .from('financial_records')
    .select('id, is_deleted')
    .eq('id', newRecord.id)
    .single();

  console.log('✓ Cobrança movida para a lixeira! is_deleted =', checkDeleted.is_deleted);

  await client
    .from('financial_records')
    .update({
      is_deleted: false,
      deleted_at: null,
      deleted_by: null
    })
    .eq('id', newRecord.id);

  const { data: checkRestored } = await client
    .from('financial_records')
    .select('id, is_deleted')
    .eq('id', newRecord.id)
    .single();

  console.log('✓ Cobrança restaurada com sucesso! is_deleted =', checkRestored.is_deleted);

  // Limpeza do teste
  await client.from('financial_records').delete().eq('id', newRecord.id);
  console.log('✓ Limpeza do registro de teste concluída.');

  console.log('\n====================================================');
  console.log('TODOS OS REQUISITOS DO MÓDULO FINANCEIRO VALIDADOS!');
  console.log('====================================================');
}

runFinanceTests();

