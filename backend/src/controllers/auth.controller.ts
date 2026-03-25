import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { UsuariosRepository } from '../repositories/usuarios.repository.js';
import { signToken } from '../middlewares/auth.middleware.js';

export const LoginSchema = z.object({
  email: z.string().email('Email inválido.'),
  senha: z.string().min(4, 'Senha muito curta.'),
});

export const AuthController = {
  async login(req: Request, res: Response) {
    const { email, senha } = req.body as z.infer<typeof LoginSchema>;

    const usuario = await UsuariosRepository.findByEmail(email);
    if (!usuario) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaOk) {
      res.status(401).json({ error: 'Credenciais inválidas.' });
      return;
    }

    const token = signToken({
      id: usuario.id,
      email: usuario.email,
      perfil: usuario.perfil,
      nome: usuario.nome,
    });

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        especialidade: usuario.especialidade,
        avatar_url: usuario.avatar_url,
      },
    });
  },

  async me(req: Request, res: Response) {
    const usuario = await UsuariosRepository.findById(req.user!.id);
    if (!usuario) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    res.json({ usuario });
  },
};
