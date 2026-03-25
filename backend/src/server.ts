import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import router from './routes/index.js';
import pool from './db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../..', '.env') });

const app  = express();
const PORT = Number(process.env.PORT ?? 3333);

// ── Middlewares globais ──────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Rotas da API ─────────────────────────────────────────────
app.use('/api', router);

// ── Error handler ────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Erro interno no servidor.', detail: err.message });
});

// ── Start ───────────────────────────────────────────────────
async function start() {
  // Testa conexão com o banco
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Conexão PostgreSQL estabelecida.');
  } catch (err) {
    console.error('[DB] Falha ao conectar ao PostgreSQL:', err);
    console.error('[DB] Verifique se o banco está rodando e se DATABASE_URL está correto no .env');
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[SERVER] CAE Backend rodando em http://localhost:${PORT}`);
    console.log(`[SERVER] API disponível em http://localhost:${PORT}/api`);
  });
}

start();
