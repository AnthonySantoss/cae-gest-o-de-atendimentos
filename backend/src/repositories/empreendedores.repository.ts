import pool from '../db/index.js';
import type { Empreendedor } from '../entities/types.js';

type CreateEmpreendedorDto = Omit<Empreendedor, 'id' | 'criado_em' | 'atualizado_em'>;
type UpdateEmpreendedorDto = Partial<CreateEmpreendedorDto>;

export const EmpreendedoresRepository = {
  async list(params: {
    search?: string;
    status?: string;
    tipo?: string;
    page: number;
    per_page: number;
  }) {
    const offset = (params.page - 1) * params.per_page;
    const conditions: string[] = ['1=1'];
    const values: unknown[] = [];
    let i = 1;

    if (params.search) {
      conditions.push(`(lower(e.nome) LIKE $${i} OR e.cpf_cnpj LIKE $${i} OR lower(e.nome_empresa) LIKE $${i})`);
      values.push(`%${params.search.toLowerCase()}%`);
      i++;
    }
    if (params.status) {
      conditions.push(`e.status = $${i}`);
      values.push(params.status);
      i++;
    }
    if (params.tipo) {
      conditions.push(`e.tipo_empresa = $${i}`);
      values.push(params.tipo);
      i++;
    }

    const where = conditions.join(' AND ');

    const countRes = await pool.query(
      `SELECT COUNT(*)::int FROM empreendedores e WHERE ${where}`,
      values
    );
    const total = countRes.rows[0].count;

    const { rows } = await pool.query(
      `SELECT e.*,
              COUNT(a.id)::int AS total_atendimentos
       FROM empreendedores e
       LEFT JOIN atendimentos a ON a.empreendedor_id = e.id
       WHERE ${where}
       GROUP BY e.id
       ORDER BY e.nome ASC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, params.per_page, offset]
    );

    return { data: rows, total, page: params.page, per_page: params.per_page };
  },

  async findById(id: number) {
    const { rows } = await pool.query(
      `SELECT e.*,
              COUNT(a.id)::int AS total_atendimentos,
              ROUND(AVG(a.avaliacao)::numeric, 1) AS media_avaliacao
       FROM empreendedores e
       LEFT JOIN atendimentos a ON a.empreendedor_id = e.id
       WHERE e.id = $1
       GROUP BY e.id`,
      [id]
    );
    return rows[0] ?? null;
  },

  async findByCpfCnpj(cpf_cnpj: string) {
    const { rows } = await pool.query(
      `SELECT * FROM empreendedores WHERE cpf_cnpj = $1 LIMIT 1`,
      [cpf_cnpj]
    );
    return rows[0] ?? null;
  },

  async create(data: CreateEmpreendedorDto): Promise<Empreendedor> {
    const { rows } = await pool.query(
      `INSERT INTO empreendedores
         (nome, cpf_cnpj, telefone, email, tipo_empresa, nome_empresa, segmento, status, endereco, observacoes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        data.nome, data.cpf_cnpj, data.telefone, data.email,
        data.tipo_empresa, data.nome_empresa, data.segmento,
        data.status ?? 'Ativo', data.endereco, data.observacoes,
      ]
    );
    return rows[0];
  },

  async update(id: number, data: UpdateEmpreendedorDto): Promise<Empreendedor | null> {
    const fields = Object.entries(data).filter(([, v]) => v !== undefined);
    if (fields.length === 0) return this.findById(id);

    const sets = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = fields.map(([, v]) => v);

    const { rows } = await pool.query(
      `UPDATE empreendedores SET ${sets} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] ?? null;
  },
};
