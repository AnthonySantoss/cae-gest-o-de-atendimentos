import pool from '../db/index.js';
import type { Atendimento, StatusAtendimento } from '../entities/types.js';

type CreateAtendimentoDto = {
  empreendedor_id: number;
  servico_id?: number;
  servico_nome: string;
  consultor_id?: number;
  observacoes?: string;
};

export const AtendimentosRepository = {
  /** Fila do dia: status aguardando | em_atendimento | atrasado */
  async listFila() {
    const { rows } = await pool.query(`
      SELECT
        a.*,
        e.nome  AS empreendedor_nome,
        e.cpf_cnpj,
        e.telefone,
        u.nome  AS consultor_nome
      FROM atendimentos a
      LEFT JOIN empreendedores e ON e.id = a.empreendedor_id
      LEFT JOIN usuarios u       ON u.id = a.consultor_id
      WHERE a.status IN ('aguardando', 'em_atendimento', 'atrasado')
        AND a.criado_em::date = CURRENT_DATE
      ORDER BY a.criado_em ASC
    `);
    return rows;
  },

  /** Histórico com paginação e filtros */
  async listHistorico(params: {
    empreendedor_id?: number;
    consultor_id?: number;
    status?: StatusAtendimento;
    page: number;
    per_page: number;
  }) {
    const offset = (params.page - 1) * params.per_page;
    const conditions: string[] = [`a.status IN ('concluido', 'cancelado')`];
    const values: unknown[] = [];
    let i = 1;

    if (params.empreendedor_id) {
      conditions.push(`a.empreendedor_id = $${i++}`);
      values.push(params.empreendedor_id);
    }
    if (params.consultor_id) {
      conditions.push(`a.consultor_id = $${i++}`);
      values.push(params.consultor_id);
    }
    if (params.status) {
      conditions.push(`a.status = $${i++}`);
      values.push(params.status);
    }

    const where = conditions.join(' AND ');

    const countRes = await pool.query(
      `SELECT COUNT(*)::int FROM atendimentos a WHERE ${where}`, values
    );

    const { rows } = await pool.query(`
      SELECT
        a.*,
        e.nome   AS empreendedor_nome,
        e.cpf_cnpj,
        u.nome   AS consultor_nome
      FROM atendimentos a
      LEFT JOIN empreendedores e ON e.id = a.empreendedor_id
      LEFT JOIN usuarios u       ON u.id = a.consultor_id
      WHERE ${where}
      ORDER BY a.criado_em DESC
      LIMIT $${i} OFFSET $${i + 1}
    `, [...values, params.per_page, offset]);

    return {
      data: rows,
      total: countRes.rows[0].count,
      page: params.page,
      per_page: params.per_page,
    };
  },

  async findById(id: number) {
    const { rows } = await pool.query(`
      SELECT a.*, e.nome AS empreendedor_nome, e.cpf_cnpj, e.telefone, u.nome AS consultor_nome
      FROM atendimentos a
      LEFT JOIN empreendedores e ON e.id = a.empreendedor_id
      LEFT JOIN usuarios u       ON u.id = a.consultor_id
      WHERE a.id = $1
    `, [id]);
    return rows[0] ?? null;
  },

  async create(data: CreateAtendimentoDto): Promise<Atendimento> {
    const { rows } = await pool.query(`
      INSERT INTO atendimentos (empreendedor_id, servico_id, servico_nome, consultor_id, observacoes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [data.empreendedor_id, data.servico_id ?? null, data.servico_nome, data.consultor_id ?? null, data.observacoes ?? null]);
    return rows[0];
  },

  async updateStatus(id: number, status: StatusAtendimento, consultorId?: number): Promise<Atendimento | null> {
    const extra = status === 'em_atendimento'
      ? ', iniciado_em = NOW()'
      : status === 'concluido' || status === 'cancelado'
        ? ', concluido_em = NOW()'
        : '';

    const consultorSet = consultorId ? `, consultor_id = ${consultorId}` : '';

    const { rows } = await pool.query(
      `UPDATE atendimentos SET status = $1${extra}${consultorSet} WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return rows[0] ?? null;
  },

  async addObservacao(id: number, observacoes: string): Promise<Atendimento | null> {
    const { rows } = await pool.query(
      `UPDATE atendimentos SET observacoes = $1 WHERE id = $2 RETURNING *`,
      [observacoes, id]
    );
    return rows[0] ?? null;
  },

  async avaliar(id: number, avaliacao: number): Promise<Atendimento | null> {
    const { rows } = await pool.query(
      `UPDATE atendimentos SET avaliacao = $1 WHERE id = $2 RETURNING *`,
      [avaliacao, id]
    );
    return rows[0] ?? null;
  },
};
