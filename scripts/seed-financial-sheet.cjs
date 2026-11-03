const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uvmxieediebczfgxcnxw.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2bXhpZWVkaWViY3pmZ3hjbnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2NTc2OTMsImV4cCI6MjEwOTIzMzY5M30.3uhccbP1f2vxCqUO5D64JPrtKPlGAlcJnk95eJA7wuM';

function categorize(desc) {
  const d = desc.toLowerCase();
  if (d.includes('meta') || d.includes('patrocinado') || d.includes('impulsionamento')) {
    return 'Mídia Paga & Anúncios';
  }
  if (
    d.includes('book') ||
    d.includes('panfleto') ||
    d.includes('banner') ||
    d.includes('lona') ||
    d.includes('adesiv') ||
    d.includes('revista') ||
    d.includes('quadro') ||
    d.includes('cavalete')
  ) {
    return 'Gráfica & Comunicação Visual';
  }
  if (
    d.includes('tenda') ||
    d.includes('mesa') ||
    d.includes('cadeira') ||
    d.includes('feirão') ||
    d.includes('feirao') ||
    d.includes('lançamento') ||
    d.includes('lancamento') ||
    d.includes('buffet') ||
    d.includes('hotel') ||
    d.includes('lanche') ||
    d.includes('som') ||
    d.includes('evento')
  ) {
    return 'Eventos & Feirões';
  }
  if (
    d.includes('blusa') ||
    d.includes('camisa') ||
    d.includes('chaveiro') ||
    d.includes('caixa') ||
    d.includes('troféu') ||
    d.includes('trofeu')
  ) {
    return 'Brindes, Camisas & Uniformes';
  }
  if (d.includes('vídeo') || d.includes('video') || d.includes('maquete') || d.includes('3d')) {
    return 'Produção Audiovisual & 3D';
  }
  if (d.includes('a.r.t') || d.includes('cópia') || d.includes('copia')) {
    return 'Taxas & Serviços Técnicos';
  }
  return 'Outros';
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function runSeed() {
  console.log('Baixando dados da aba MARKETING ENGENHARQ...');
  const csvData = await fetchUrl('https://docs.google.com/spreadsheets/d/1XbtkFyAHhnl0j4jmW5nvnw5kLBAcdon6QwGlLUs40so/export?format=csv');
  const lines = csvData.split('\n');

  // Login como Eduardo Dev
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

  const recordsToInsert = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(',,,,') || line.includes('TOTAL =')) continue;

    const cols = parseCSVLine(line);
    const desc = cols[0];
    const authorized = cols[1];
    const dateStr = cols[2];
    const valStr = cols[3];

    if (!desc || !valStr || !dateStr || !dateStr.includes('/')) continue;

    // Converte data DD/MM/YYYY para YYYY-MM-DD
    const [d, m, y] = dateStr.split('/');
    if (!d || !m || !y) continue;
    const isoDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;

    // Converte valor "R$ 6.000,00" para número 6000.00
    const cleanVal = valStr.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const amount = parseFloat(cleanVal);
    if (isNaN(amount) || amount <= 0) continue;

    const category = categorize(desc);

    recordsToInsert.push({
      supplier: 'Marketing Geral EngenhArq',
      description: desc,
      amount,
      category,
      receipt_date: isoDate,
      authorized_by: authorized || null,
      forwarded_to_finance_date: isoDate,
      payment_forecast_date: isoDate,
      payment_actual_date: isoDate, // Histórico pago
      created_by: auth.user.id,
      notes: 'Importado da planilha histórica de Marketing'
    });
  }

  console.log(`Encontrados ${recordsToInsert.length} lançamentos válidos. Inserindo no Supabase...`);

  const { data, error } = await client
    .from('financial_records')
    .insert(recordsToInsert)
    .select();

  if (error) {
    console.error('Erro na inserção em massa:', error.message);
  } else {
    console.log(`✓ ${data.length} registros financeiros importados com sucesso para o banco de dados!`);
    const totalAmount = recordsToInsert.reduce((acc, r) => acc + r.amount, 0);
    console.log(`✓ Total importado: R$ ${totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  }
}

runSeed();

