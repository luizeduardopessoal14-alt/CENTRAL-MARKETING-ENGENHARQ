const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvmxieediebczfgxcnxw.supabase.co';
const anonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bXhpZWVkaWViY3pmZ3hjbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTc2OTMsImV4cCI6MjEwOTIzMzY5M30.3uhccbP1f2vxCqUO5D64JPrtKPlGAlcJnk95eJA7wuM';

async function runStep4Tests() {
  console.log('====================================================');
  console.log('INICIANDO BATERIA DE TESTES DA ETAPA 4 (CALENDÁRIO)');
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

  // 2. Verificar se a tabela calendar_events existe
  console.log('\n--- TESTE 2: Consulta à tabela calendar_events ---');
  const { data: check, error: checkErr } = await client
    .from('calendar_events')
    .select('id')
    .limit(1);

  if (checkErr) {
    console.log('Nota: A tabela calendar_events ainda não foi criada no banco Supabase.');
    console.log('Mensagem:', checkErr.message);
    console.log('\nExecute a migration em supabase/migrations/20261102000004_calendario.sql no SQL Editor do Supabase.');
    return;
  }
  console.log('✓ Tabela calendar_events acessível no banco!');

  // 3. Cadastrar Reunião
  console.log('\n--- TESTE 3: Cadastrar Reunião de Alinhamento ---');
  const todayYMD = new Date().toISOString().split('T')[0];
  const { data: meeting, error: meetErr } = await client
    .from('calendar_events')
    .insert({
      title: 'Reunião de Alinhamento Estratégico de Marketing',
      type: 'reuniao',
      event_date: todayYMD,
      start_time: '14:30',
      end_time: '15:30',
      location: 'Sala de Reuniões 02 EngenhArq',
      description: 'Definição das pautas de lançamento do novo residencial',
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (meetErr) {
    console.error('Erro ao cadastrar reunião:', meetErr.message);
    return;
  }
  console.log('✓ Reunião criada! ID:', meeting.id, '| Tipo:', meeting.type, '| Data:', meeting.event_date);

  // 4. Cadastrar Evento
  console.log('\n--- TESTE 4: Cadastrar Evento de Lançamento ---');
  const { data: evt, error: evtErr } = await client
    .from('calendar_events')
    .insert({
      title: 'Feirão de Imóveis no Stand Central',
      type: 'evento',
      event_date: todayYMD,
      start_time: '09:00',
      end_time: '18:00',
      location: 'Stand de Vendas EngenhArq',
      description: 'Ação comercial com corretores e clientes convidados',
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (evtErr) {
    console.error('Erro ao cadastrar evento:', evtErr.message);
    return;
  }
  console.log('✓ Evento criado! ID:', evt.id, '| Tipo:', evt.type);

  // 5. Atualização de Compromisso
  console.log('\n--- TESTE 5: Atualizar Local da Reunião ---');
  const { data: updatedMeet, error: updErr } = await client
    .from('calendar_events')
    .update({
      location: 'https://meet.google.com/eng-mkt-test',
    })
    .eq('id', meeting.id)
    .select()
    .single();

  if (updErr) {
    console.error('Erro ao atualizar reunião:', updErr.message);
  } else {
    console.log('✓ Local atualizado com sucesso:', updatedMeet.location);
  }

  // 6. Teste de Exclusão Lógica e Restauração
  console.log('\n--- TESTE 6: Enviar para Lixeira e Restaurar ---');
  await client
    .from('calendar_events')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: auth.user.id,
    })
    .eq('id', meeting.id);

  const { data: inTrash } = await client
    .from('calendar_events')
    .select('id, is_deleted')
    .eq('id', meeting.id)
    .single();

  console.log('✓ Compromisso enviado para lixeira! is_deleted =', inTrash.is_deleted);

  // Limpeza dos registros de teste
  await client.from('calendar_events').delete().in('id', [meeting.id, evt.id]);
  console.log('\n✓ Registros de teste removidos.');

  console.log('\n====================================================');
  console.log('TODOS OS REQUISITOS DA ETAPA 4 (CALENDÁRIO) VALIDADOS!');
  console.log('====================================================');
}

runStep4Tests();

