import type { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';

export const CreateConsultorSchema = z.object({
  nome: z.string().min(3).max(100),
  email: z.string().email(),
  perfil: z.enum(['admin', 'gestor', 'consultor']).default('consultor'),
  especialidade: z.string().max(100).optional(),
});

export const UpdateConsultorSchema = z.object({
  nome: z.string().min(3).max(100).optional(),
  email: z.string().email().optional(),
  perfil: z.enum(['admin', 'gestor', 'consultor']).optional(),
  especialidade: z.string().max(100).optional(),
  reset_senha: z.boolean().optional(),
  ativo: z.boolean().optional(),
});

function gerarSenha() {
  return Math.random().toString(36).slice(-8);
}

export const ConsultoresController = {
  async list(_req: Request, res: Response) {
    const consultores = await UsuariosRepository.listAll();
    res.json({ data: consultores });
  },

  async create(req: Request, res: Response) {
    const data = req.body as z.infer<typeof CreateConsultorSchema>;

    const exists = await UsuariosRepository.findByEmail(data.email);
    if (exists) {
      res.status(409).json({ error: 'Email já cadastrado.' });
      return;
    }

    const tempPassword = gerarSenha();
    const senha_hash = await bcrypt.hash(tempPassword, 10);

    const usuario = await UsuariosRepository.create({
      nome: data.nome,
      email: data.email,
      perfil: data.perfil,
      especialidade: data.especialidade,
      senha_hash,
    });

    res.status(201).json({ data: usuario, tempPassword });
  },

  async update(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const data = req.body as z.infer<typeof UpdateConsultorSchema>;

    let senha_hash: string | undefined = undefined;
    let tempPassword = undefined;

    if (data.reset_senha) {
      tempPassword = gerarSenha();
      senha_hash = await bcrypt.hash(tempPassword, 10);
    }

    // prevent modifying fields we didn't specify
    const { reset_senha, ...updateData } = data;

    const usuario = await UsuariosRepository.update(id, {
      ...updateData,
      ...(senha_hash ? { senha_hash } : {})
    });

    if (!usuario) {
      res.status(404).json({ error: 'Consultor não encontrado.' });
      return;
    }

    res.json({ data: usuario, tempPassword });
  },
};
