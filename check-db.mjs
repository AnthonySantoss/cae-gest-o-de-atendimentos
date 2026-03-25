#!/usr/bin/env node
/**
 * Script de diagnóstico da conexão PostgreSQL.
 * Testa diferentes connection strings comuns no Linux.
 */
import pg from 'pg';

const { Client } = pg;

const CANDIDATES = [
  'postgresql://postgres:postgres@localhost:5432/postgres',
  `postgresql://${process.env.USER}@localhost:5432/postgres`,
  `postgresql://${process.env.USER}:${process.env.USER}@localhost:5432/postgres`,
  'postgresql://postgres@localhost:5432/postgres',
  'postgresql://postgres:@localhost:5432/postgres',
  `postgresql://${process.env.USER}@/postgres`,           // Unix socket
  `postgresql://postgres@/postgres`,                       // Unix socket root
];

async function tryConnect(url) {
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 3000 });
  try {
    await client.connect();
    const res = await client.query('SELECT current_user, current_database()');
    console.log(`✅ OK: ${url}`);
    console.log(`   user=${res.rows[0].current_user} db=${res.rows[0].current_database}`);
    await client.end();
    return url;
  } catch (e) {
    console.log(`❌ FALHOU: ${url}`);
    console.log(`   Erro: ${e.message}`);
    return null;
  }
}

const results = [];
for (const url of CANDIDATES) {
  const r = await tryConnect(url);
  if (r) results.push(r);
}

if (results.length > 0) {
  console.log(`\n📌 Use essa string no .env: DATABASE_URL="${results[0].replace('/postgres', '/cae_db')}"`);
} else {
  console.log('\n⚠️  Nenhuma conexão funcionou. Verifique se o PostgreSQL está rodando.');
  console.log('   Tente: sudo service postgresql start');
}
