import type { Request, Response } from 'express';
import { z } from 'zod';
import { EmpreendedoresRepository } from '../repositories/empreendedores.repository.js';
import { AtendimentosRepository } from '../repositories/atendimentos.repository.js';

export const CreateEmpreendedorSchema = z.object({
  nome: z.string().min(3).max(150),
  cpf_cnpj: z.string().min(11).max(20),
  telefone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal('')),
  tipo_empresa: z.enum(['MEI', 'ME', 'EPP', 'Autônomo', 'Outro']).optional(),
  nome_empresa: z.string().max(200).optional(),
  segmento: z.string().max(100).optional(),
  status: z.enum(['Ativo', 'Em formalização', 'Inativo']).default('Ativo'),
  endereco: z.string().max(500).optional(),
  observacoes: z.string().max(2000).optional(),
});

export const ListQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  tipo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

export const EmpreendedoresController = {
  async list(req: Request, res: Response) {
    const parsed = ListQuerySchema.parse(req.query);
    const result = await EmpreendedoresRepository.list({
      search: parsed.search,
      status: parsed.status,
      tipo: parsed.tipo,
      page: parsed.page ?? 1,
      per_page: parsed.per_page ?? 20,
    });
    res.json(result);
  },

  async getById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const emp = await EmpreendedoresRepository.findById(id);
    if (!emp) {
      res.status(404).json({ error: 'Empreendedor não encontrado.' });
      return;
    }
    res.json({ data: emp });
  },

  async create(req: Request, res: Response) {
    const data = req.body as z.infer<typeof CreateEmpreendedorSchema>;

    const existing = await EmpreendedoresRepository.findByCpfCnpj(data.cpf_cnpj);
    if (existing) {
      res.status(409).json({ error: 'CPF/CNPJ já cadastrado.', empreendedor: existing });
      return;
    }

    const emp = await EmpreendedoresRepository.create({
      nome: data.nome,
      cpf_cnpj: data.cpf_cnpj,
      telefone: data.telefone ?? null,
      email: data.email || null,
      tipo_empresa: data.tipo_empresa ?? null,
      nome_empresa: data.nome_empresa ?? null,
      segmento: data.segmento ?? null,
      status: data.status ?? 'Ativo',
      endereco: data.endereco ?? null,
      observacoes: data.observacoes ?? null,
    });
    res.status(201).json({ data: emp });
  },

  async update(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const data = req.body as Partial<z.infer<typeof CreateEmpreendedorSchema>>;
    const emp = await EmpreendedoresRepository.update(id, data);
    if (!emp) {
      res.status(404).json({ error: 'Empreendedor não encontrado.' });
      return;
    }
    res.json({ data: emp });
  },

  async getAtendimentos(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const result = await AtendimentosRepository.listHistorico({
      empreendedor_id: id,
      page: 1,
      per_page: 50,
    });
    res.json(result);
  },
};
