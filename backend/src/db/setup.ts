/**
 * Script de setup inicial:
 * 1. Cria o banco de dados se não existir
 * 2. Roda as migrations
 * 3. Roda o seed
 */
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

const { Client } = pg;

const DB_URL  = process.env.DATABASE_URL ?? '';
const DB_NAME = 'cae_db';

// Extrai a URL sem o banco para conectar ao postgres padrão
const rootUrl = DB_URL.replace(`/${DB_NAME}`, '/postgres');

async function createDatabase() {
  console.log('[SETUP] Conectando ao PostgreSQL...');
  const client = new Client({ connectionString: rootUrl });
  await client.connect();

  const res = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]
  );

  if (res.rowCount === 0) {
    console.log(`[SETUP] Criando banco de dados "${DB_NAME}"...`);
    await client.query(`CREATE DATABASE ${DB_NAME}`);
    console.log(`[SETUP] Banco "${DB_NAME}" criado com sucesso.`);
  } else {
    console.log(`[SETUP] Banco "${DB_NAME}" já existe.`);
  }

  await client.end();
}

async function migrate() {
  console.log('[SETUP] Aplicando migration 001_initial.sql...');
  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  const sql = fs.readFileSync(
    path.resolve(__dirname, 'migrations/001_initial.sql'),
    'utf-8'
  );

  await client.query(sql);
  console.log('[SETUP] Migration aplicada com sucesso.');
  await client.end();
}

async function runSeed() {
  const { default: seed } = await import('./seed.js');
  await seed();
}

async function main() {
  try {
    await createDatabase();
    await migrate();
    await runSeed();
    console.log('\n✅ Setup concluído! Backend pronto para uso.');
    process.exit(0);
  } catch (err) {
    console.error('[SETUP] Erro:', err);
    process.exit(1);
  }
}

main();
