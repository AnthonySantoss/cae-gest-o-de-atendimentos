import pg from 'pg';

const client = new pg.Client({ connectionString: "postgresql://postgres:postgres@localhost:5432/cae_db" });

async function run() {
  await client.connect();
  try {
    const { rows } = await client.query(`
      SELECT
        u.id, u.nome, u.email, u.perfil, u.especialidade, u.avatar_url, u.ativo,
        u.criado_em, u.atualizado_em,
        COUNT(a.id)::int               AS total_atendimentos,
        ROUND(AVG(a.avaliacao)::numeric, 1) AS media_avaliacao
      FROM usuarios u
      LEFT JOIN atendimentos a ON a.consultor_id = u.id AND a.status = 'concluido'
      WHERE u.ativo = true AND u.perfil != 'admin'
      GROUP BY u.id
      ORDER BY total_atendimentos DESC
    `);
    console.log("SUCCESS");
    console.log("Rows:", rows.length);
  } catch (err) {
    console.error("SQL ERROR:", err);
  } finally {
    await client.end();
  }
}
run();
