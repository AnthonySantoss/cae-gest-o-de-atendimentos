import pool from '../db/index.js';

export const CursosRepository = {
  async listAtivos() {
    const { rows } = await pool.query(`
      SELECT c.*,
             COUNT(enc.id)::int AS total_encaminhados
      FROM cursos c
      LEFT JOIN encaminhamentos enc ON enc.curso_id = c.id
      WHERE c.ativo = true
      GROUP BY c.id
      ORDER BY c.data_inicio ASC NULLS LAST
    `);
    return rows;
  },

  async findById(id: number) {
    const { rows } = await pool.query(`SELECT * FROM cursos WHERE id = $1`, [id]);
    return rows[0] ?? null;
  },

  async create(data: {
    titulo: string;
    tipo?: string;
    descricao?: string;
    vagas_total?: number;
    data_inicio?: string;
    local?: string;
  }) {
    const { rows } = await pool.query(`
      INSERT INTO cursos (titulo, tipo, descricao, vagas_total, vagas_disponiveis, data_inicio, local)
      VALUES ($1, $2, $3, $4, $4, $5, $6)
      RETURNING *
    `, [data.titulo, data.tipo ?? null, data.descricao ?? null, data.vagas_total ?? 0, data.data_inicio ?? null, data.local ?? null]);
    return rows[0];
  },

  async encaminhar(data: {
    empreendedor_id: number;
    curso_id?: number;
    atendimento_id?: number;
    tipo?: string;
    descricao?: string;
  }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const { rows } = await client.query(`
        INSERT INTO encaminhamentos (empreendedor_id, curso_id, atendimento_id, tipo, descricao)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [data.empreendedor_id, data.curso_id ?? null, data.atendimento_id ?? null, data.tipo ?? null, data.descricao ?? null]);

      if (data.curso_id) {
        await client.query(
          `UPDATE cursos SET vagas_disponiveis = GREATEST(0, vagas_disponiveis - 1) WHERE id = $1`,
          [data.curso_id]
        );
      }

      await client.query('COMMIT');
      return rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async listEncaminhamentos(empreendedor_id?: number) {
    const where = empreendedor_id ? `WHERE enc.empreendedor_id = ${empreendedor_id}` : '';
    const { rows } = await pool.query(`
      SELECT enc.*,
             c.titulo AS curso_titulo, c.tipo AS curso_tipo,
             e.nome   AS empreendedor_nome
      FROM encaminhamentos enc
      LEFT JOIN cursos        c ON c.id = enc.curso_id
      LEFT JOIN empreendedores e ON e.id = enc.empreendedor_id
      ${where}
      ORDER BY enc.criado_em DESC
    `);
    return rows;
  },

  async listServicos() {
    const { rows } = await pool.query(`SELECT * FROM servicos WHERE ativo = true ORDER BY nome`);
    return rows;
  },
};
