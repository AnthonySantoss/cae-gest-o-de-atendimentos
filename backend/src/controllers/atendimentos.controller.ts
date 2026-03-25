import type { Request, Response } from 'express';
import { z } from 'zod';
import { AtendimentosRepository } from '../repositories/atendimentos.repository.js';

export const CreateAtendimentoSchema = z.object({
  empreendedor_id: z.number().int().positive(),
  servico_id: z.number().int().positive().optional(),
  servico_nome: z.string().min(2).max(100),
  consultor_id: z.number().int().positive().optional(),
  observacoes: z.string().max(1000).optional(),
});

export const UpdateStatusSchema = z.object({
  status: z.enum(['aguardando', 'em_atendimento', 'concluido', 'cancelado', 'atrasado']),
  consultor_id: z.number().int().positive().optional(),
});

export const HistoricoQuerySchema = z.object({
  empreendedor_id: z.coerce.number().int().positive().optional(),
  consultor_id: z.coerce.number().int().positive().optional(),
  status: z.enum(['concluido', 'cancelado']).optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export const AtendimentosController = {
  async getFila(req: Request, res: Response) {
    const fila = await AtendimentosRepository.listFila();
    res.json({ data: fila });
  },

  async getHistorico(req: Request, res: Response) {
    const parsed = HistoricoQuerySchema.parse(req.query);
    const result = await AtendimentosRepository.listHistorico({
      empreendedor_id: parsed.empreendedor_id,
      consultor_id: parsed.consultor_id,
      status: parsed.status,
      page: parsed.page ?? 1,
      per_page: parsed.per_page ?? 20,
    });
    res.json(result);
  },

  async getById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const item = await AtendimentosRepository.findById(id);
    if (!item) {
      res.status(404).json({ error: 'Atendimento não encontrado.' });
      return;
    }
    res.json({ data: item });
  },

  async create(req: Request, res: Response) {
    const data = req.body as Required<Pick<z.infer<typeof CreateAtendimentoSchema>, 'empreendedor_id' | 'servico_nome'>> &
      Partial<z.infer<typeof CreateAtendimentoSchema>>;
    const atendimento = await AtendimentosRepository.create({
      empreendedor_id: data.empreendedor_id,
      servico_nome: data.servico_nome,
      servico_id: data.servico_id,
      consultor_id: data.consultor_id,
      observacoes: data.observacoes,
    });
    res.status(201).json({ data: atendimento });
  },

  async updateStatus(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const { status, consultor_id } = req.body as z.infer<typeof UpdateStatusSchema>;

    const updated = await AtendimentosRepository.updateStatus(id, status, consultor_id);
    if (!updated) {
      res.status(404).json({ error: 'Atendimento não encontrado.' });
      return;
    }
    res.json({ data: updated });
  },
};
