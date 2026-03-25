import { Router } from 'express';
import { AuthController, LoginSchema }         from '../controllers/auth.controller.js';
import { AtendimentosController, CreateAtendimentoSchema, UpdateStatusSchema, HistoricoQuerySchema } from '../controllers/atendimentos.controller.js';
import { EmpreendedoresController, CreateEmpreendedorSchema, ListQuerySchema } from '../controllers/empreendedores.controller.js';
import { ConsultoresController }               from '../controllers/consultores.controller.js';
import { CursosController }                    from '../controllers/cursos.controller.js';
import { RelatoriosController }                from '../controllers/relatorios.controller.js';
import { authMiddleware }                      from '../middlewares/auth.middleware.js';
import { validate }                            from '../middlewares/validate.middleware.js';

const router = Router();

// ── Auth ────────────────────────────────────────────────────
router.post('/auth/login', validate(LoginSchema), AuthController.login);
router.get('/auth/me', authMiddleware, AuthController.me);

// ── Atendimentos ────────────────────────────────────────────
router.get('/atendimentos/fila',     authMiddleware, AtendimentosController.getFila);
router.get('/atendimentos/historico', authMiddleware, validate(HistoricoQuerySchema, 'query'), AtendimentosController.getHistorico);
router.get('/atendimentos/:id',      authMiddleware, AtendimentosController.getById);
router.post('/atendimentos',         authMiddleware, validate(CreateAtendimentoSchema), AtendimentosController.create);
router.patch('/atendimentos/:id/status', authMiddleware, validate(UpdateStatusSchema), AtendimentosController.updateStatus);

// ── Empreendedores ──────────────────────────────────────────
router.get('/empreendedores',           authMiddleware, validate(ListQuerySchema, 'query'), EmpreendedoresController.list);
router.get('/empreendedores/:id',       authMiddleware, EmpreendedoresController.getById);
router.get('/empreendedores/:id/atendimentos', authMiddleware, EmpreendedoresController.getAtendimentos);
router.post('/empreendedores',          authMiddleware, validate(CreateEmpreendedorSchema), EmpreendedoresController.create);
router.patch('/empreendedores/:id',     authMiddleware, EmpreendedoresController.update);

// ── Consultores ─────────────────────────────────────────────
router.get('/consultores', authMiddleware, ConsultoresController.list);

// ── Cursos & Encaminhamentos ────────────────────────────────
router.get('/cursos',                authMiddleware, CursosController.listCursos);
router.get('/servicos',              authMiddleware, CursosController.listServicos);
router.get('/encaminhamentos',       authMiddleware, CursosController.listEncaminhamentos);
router.post('/encaminhamentos',      authMiddleware, CursosController.encaminhar);

// ── Relatórios ──────────────────────────────────────────────
router.get('/relatorios/kpis',               authMiddleware, RelatoriosController.getKpis);
router.get('/relatorios/evolucao-semanal',   authMiddleware, RelatoriosController.getEvolucaoSemanal);
router.get('/relatorios/evolucao-mensal',    authMiddleware, RelatoriosController.getEvolucaoMensal);
router.get('/relatorios/servicos',           authMiddleware, RelatoriosController.getDistribuicaoServicos);
router.get('/relatorios/satisfacao',         authMiddleware, RelatoriosController.getSatisfacaoMensal);

export default router;
