import type { Request, Response } from 'express';
import { z } from 'zod';
import { CursosRepository } from '../repositories/cursos.repository.js';

const EncaminharSchema = z.object({
  empreendedor_id: z.number().int().positive(),
  curso_id: z.number().int().positive().optional(),
  atendimento_id: z.number().int().positive().optional(),
  tipo: z.string().max(30).optional(),
  descricao: z.string().max(1000).optional(),
});

export const CursosController = {
  async listCursos(_req: Request, res: Response) {
    const cursos = await CursosRepository.listAtivos();
    res.json({ data: cursos });
  },

  async listServicos(_req: Request, res: Response) {
    const servicos = await CursosRepository.listServicos();
    res.json({ data: servicos });
  },

  async listEncaminhamentos(req: Request, res: Response) {
    const empId = req.query.empreendedor_id
      ? parseInt(req.query.empreendedor_id as string)
      : undefined;
    const data = await CursosRepository.listEncaminhamentos(empId);
    res.json({ data });
  },

  async encaminhar(req: Request, res: Response) {
    const data = req.body as z.infer<typeof EncaminharSchema>;
    if (!data.empreendedor_id) {
      res.status(422).json({ error: 'empreendedor_id é obrigatório.' });
      return;
    }
    const enc = await CursosRepository.encaminhar({
      empreendedor_id: data.empreendedor_id,
      curso_id: data.curso_id,
      atendimento_id: data.atendimento_id,
      tipo: data.tipo,
      descricao: data.descricao,
    });
    res.status(201).json({ data: enc });
  },
};
