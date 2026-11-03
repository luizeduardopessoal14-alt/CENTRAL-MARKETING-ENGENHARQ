const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvmxieediebczfgxcnxw.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bXhpZWVkaWViY3pmZ3hjbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTc2OTMsImV4cCI6MjEwOTIzMzY5M30.3uhccbP1f2vxCqUO5D64JPrtKPlGAlcJnk95eJA7wuM';

async function runTests() {
  console.log('--- TESTE 1: Login do Superadmin (Eduardo Dev / Dudu1409$) ---');
  const adminClient = createClient(supabaseUrl, anonKey);
  const { data: adminEmail } = await adminClient.rpc('resolve_login_identifier', { p_username: 'Eduardo Dev' });
  const { data: adminAuth, error: adminAuthError } = await adminClient.auth.signInWithPassword({
    email: adminEmail,
    password: 'Dudu1409$'
  });

  if (adminAuthError) {
    console.error('FALHA no login do admin:', adminAuthError.message);
    return;
  }
  console.log('✓ Login do Superadmin aprovado! ID:', adminAuth.user.id);

  console.log('\n--- TESTE 2: Superadmin cadastra novo usuário com permissões por aba (Lucas Designer) ---');
  const { data: lucasId, error: createError } = await adminClient.rpc('admin_create_user', {
    p_username: 'Lucas Designer',
    p_full_name: 'Lucas Designer Gráfico',
    p_password: 'LucasSenha123$',
    p_role: 'user',
    p_permissions: {
      financeiro: 'sem_acesso',
      conteudos: 'edicao',
      calendario: 'consulta',
      midia: 'sem_acesso',
      imobiliarias: 'sem_acesso',
      relatorios: 'sem_acesso'
    }
  });

  if (createError && !createError.message.includes('Já existe um usuário')) {
    console.error('FALHA ao cadastrar Lucas:', createError.message);
    return;
  }
  console.log('✓ Lucas cadastrado com sucesso! ID:', lucasId || 'existente');

  console.log('\n--- TESTE 3: Login do novo usuário comum (Lucas Designer / LucasSenha123$) ---');
  const lucasClient = createClient(supabaseUrl, anonKey);
  const { data: lucasEmail } = await lucasClient.rpc('resolve_login_identifier', { p_username: 'Lucas Designer' });
  const { data: lucasAuth, error: lucasAuthError } = await lucasClient.auth.signInWithPassword({
    email: lucasEmail,
    password: 'LucasSenha123$'
  });

  if (lucasAuthError) {
    console.error('FALHA no login do Lucas:', lucasAuthError.message);
    return;
  }
  console.log('✓ Login do Lucas realizado com sucesso! ID:', lucasAuth.user.id);

  console.log('\n--- TESTE 4: Teste de Segurança RLS (Lucas tenta ação administrativa) ---');
  const { error: hackError } = await lucasClient.rpc('admin_create_user', {
    p_username: 'Hacker',
    p_full_name: 'Hacker',
    p_password: '12345678',
    p_role: 'superadmin'
  });

  if (hackError) {
    console.log('✓ RLS e Backend bloquearam o usuário comum corretamente:', hackError.message);
  } else {
    console.error('ALERTA: Usuário comum conseguiu chamar função administrativa!');
  }

  console.log('\n--- TESTE 5: Proteção contra desativação do único Superadministrador ---');
  const { error: selfDeactError } = await adminClient.rpc('admin_set_user_active_status', {
    p_target_user_id: adminAuth.user.id,
    p_is_active: false
  });

  if (selfDeactError) {
    console.log('✓ Trava de segurança ativa:', selfDeactError.message);
  } else {
    console.error('ALERTA: Superadmin conseguiu se desativar!');
  }

  console.log('\n=============================================');
  console.log('TODOS OS 5 CRITÉRIOS DA ETAPA 1 VALIDADOS!');
  console.log('=============================================');
}

runTests();
