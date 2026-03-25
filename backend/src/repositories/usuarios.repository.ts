import pool from '../db/index.js';
import type { Usuario } from '../entities/types.js';

export const UsuariosRepository = {
  async findByEmail(email: string): Promise<(Usuario & { senha_hash: string }) | null> {
    const { rows } = await pool.query(
      `SELECT * FROM usuarios WHERE email = $1 AND ativo = true LIMIT 1`,
      [email]
    );
    return rows[0] ?? null;
  },

  async findById(id: number): Promise<Usuario | null> {
    const { rows } = await pool.query(
      `SELECT id, nome, email, perfil, especialidade, avatar_url, ativo, criado_em, atualizado_em
       FROM usuarios WHERE id = $1`,
      [id]
    );
    return rows[0] ?? null;
  },

  async listAll(): Promise<(Usuario & { total_atendimentos: number; media_avaliacao: number | null })[]> {
    const { rows } = await pool.query(`
      SELECT
        u.id, u.nome, u.email, u.perfil, u.especialidade, u.avatar_url, u.ativo,
        u.criado_em, u.atualizado_em,
        COUNT(a.id)::int               AS total_atendimentos,
        ROUND(AVG(a.avaliacao)::numeric, 1)::float AS media_avaliacao
      FROM usuarios u
      LEFT JOIN atendimentos a ON a.consultor_id = u.id AND a.status = 'concluido'
      WHERE u.ativo = true AND u.perfil != 'admin'
      GROUP BY u.id
      ORDER BY total_atendimentos DESC
    `);
    return rows;
  },

  async create(data: { nome: string; email: string; perfil: string; especialidade?: string; senha_hash: string }): Promise<Usuario> {
    const { rows } = await pool.query(`
      INSERT INTO usuarios (nome, email, perfil, especialidade, senha_hash, ativo)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING *
    `, [data.nome, data.email, data.perfil, data.especialidade ?? null, data.senha_hash]);
    return rows[0];
  },

  async update(id: number, data: Partial<Omit<Usuario, 'id' | 'criado_em' | 'atualizado_em'>> & { senha_hash?: string }): Promise<Usuario | null> {
    const fields = Object.entries(data).filter(([, v]) => v !== undefined);
    if (fields.length === 0) return this.findById(id);

    const sets = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = fields.map(([, v]) => v);

    const { rows } = await pool.query(
      `UPDATE usuarios SET ${sets} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] ?? null;
  },
};
