import type { Request, Response } from 'express';
import { RelatoriosRepository } from '../repositories/relatorios.repository.js';

export const RelatoriosController = {
  async getKpis(_req: Request, res: Response) {
    const kpis = await RelatoriosRepository.getKpis();
    res.json({ data: kpis });
  },

  async getEvolucaoSemanal(_req: Request, res: Response) {
    const data = await RelatoriosRepository.getEvolucaoSemanal();
    res.json({ data });
  },

  async getEvolucaoMensal(req: Request, res: Response) {
    const meses = parseInt((req.query.meses as string) ?? '6');
    const data = await RelatoriosRepository.getEvolucaoMensal(meses);
    res.json({ data });
  },

  async getDistribuicaoServicos(_req: Request, res: Response) {
    const data = await RelatoriosRepository.getDistribuicaoServicos();
    res.json({ data });
  },

  async getSatisfacaoMensal(_req: Request, res: Response) {
    const data = await RelatoriosRepository.getSatisfacaoMensal();
    res.json({ data });
  },
};
