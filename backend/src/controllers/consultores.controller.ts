import type { Request, Response } from 'express';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';

export const ConsultoresController = {
  async list(_req: Request, res: Response) {
    const consultores = await UsuariosRepository.listAll();
    res.json({ data: consultores });
  },
};
