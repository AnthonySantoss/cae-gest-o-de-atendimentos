import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

async function clear() {
  await client.connect();
  await client.query(`
    TRUNCATE TABLE encaminhamentos, cursos, atendimentos, empreendedores, servicos, usuarios RESTART IDENTITY CASCADE;
  `);
  console.log('Tables truncated cleanly.');
  await client.end();
}
clear();
