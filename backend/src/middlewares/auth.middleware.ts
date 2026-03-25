import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'cae_secret_dev_2026';

export interface JwtPayload {
  id: number;
  email: string;
  perfil: string;
  nome: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token não informado.' });
    return;
  }

  try {
    const token = auth.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

export function requirePerfil(...perfis: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !perfis.includes(req.user.perfil)) {
      res.status(403).json({ error: 'Acesso não autorizado.' });
      return;
    }
    next();
  };
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}
