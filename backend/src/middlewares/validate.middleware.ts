import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type Target = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, target: Target = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const errors = (result.error as ZodError).errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      res.status(422).json({ error: 'Dados inválidos.', errors });
      return;
    }
    // Substitui o alvo pelo valor parseado (sanitizado + tipado)
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
