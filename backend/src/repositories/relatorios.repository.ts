import pool from '../db/index.js';

export const RelatoriosRepository = {
  async getKpis() {
    const { rows } = await pool.query(`
      SELECT
        -- Atendimentos do mês corrente
        (SELECT COUNT(*)::int FROM atendimentos
         WHERE EXTRACT(MONTH FROM criado_em) = EXTRACT(MONTH FROM NOW())
           AND EXTRACT(YEAR  FROM criado_em) = EXTRACT(YEAR  FROM NOW())
        ) AS total_atendimentos_mes,

        -- Total empreendedores
        (SELECT COUNT(*)::int FROM empreendedores WHERE status != 'Inativo') AS total_empreendedores,

        -- Concluídos no mês
        (SELECT COUNT(*)::int FROM atendimentos
         WHERE status = 'concluido'
           AND EXTRACT(MONTH FROM criado_em) = EXTRACT(MONTH FROM NOW())
           AND EXTRACT(YEAR  FROM criado_em) = EXTRACT(YEAR  FROM NOW())
        ) AS total_concluidos_mes,

        -- Média de avaliação
        (SELECT ROUND(AVG(avaliacao)::numeric, 1) FROM atendimentos WHERE avaliacao IS NOT NULL) AS media_avaliacao,

        -- Serviço mais solicitado no mês
        (SELECT servico_nome FROM atendimentos
         WHERE EXTRACT(MONTH FROM criado_em) = EXTRACT(MONTH FROM NOW())
           AND EXTRACT(YEAR  FROM criado_em) = EXTRACT(YEAR  FROM NOW())
           AND servico_nome IS NOT NULL
         GROUP BY servico_nome ORDER BY COUNT(*) DESC LIMIT 1
        ) AS servico_mais_solicitado,

        -- Consultor destaque (mais atendimentos concluídos)
        (SELECT u.nome FROM atendimentos a
         JOIN usuarios u ON u.id = a.consultor_id
         WHERE a.status = 'concluido'
           AND EXTRACT(MONTH FROM a.criado_em) = EXTRACT(MONTH FROM NOW())
           AND EXTRACT(YEAR  FROM a.criado_em) = EXTRACT(YEAR  FROM NOW())
         GROUP BY u.id, u.nome ORDER BY COUNT(*) DESC LIMIT 1
        ) AS consultor_destaque,

        -- Em acompanhamento (tiveram mais de 1 atendimento)
        (SELECT COUNT(*)::int FROM (
           SELECT empreendedor_id FROM atendimentos 
           WHERE status = 'concluido' 
           GROUP BY empreendedor_id HAVING COUNT(*) > 1
         ) AS sub
        ) AS atendimentos_acompanhamento,

        -- Matriculados em cursos
        (SELECT COUNT(*)::int FROM encaminhamentos WHERE status IN ('pendente','em_andamento')) AS matriculados_cursos
    `);
    return rows[0];
  },

  async getEvolucaoSemanal() {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(criado_em, 'Dy') AS dia,
        EXTRACT(DOW FROM criado_em)::int AS dow,
        COUNT(*)::int AS atendimentos
      FROM atendimentos
      WHERE criado_em >= NOW() - INTERVAL '7 days'
      GROUP BY dia, dow
      ORDER BY dow
    `);
    return rows;
  },

  async getEvolucaoMensal(meses: number = 6) {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', criado_em), 'Mon') AS mes,
        DATE_TRUNC('month', criado_em) AS periodo,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE servico_nome ILIKE '%MEI%')::int AS aberturas_mei,
        COUNT(*) FILTER (WHERE servico_nome ILIKE '%Financeira%')::int AS consultorias,
        COUNT(*) FILTER (WHERE servico_nome ILIKE '%Crédito%')::int AS credito
      FROM atendimentos
      WHERE criado_em >= NOW() - INTERVAL '${meses} months'
      GROUP BY periodo
      ORDER BY periodo
    `);
    return rows;
  },

  async getDistribuicaoServicos() {
    const { rows } = await pool.query(`
      SELECT
        servico_nome AS name,
        COUNT(*)::int AS value
      FROM atendimentos
      WHERE servico_nome IS NOT NULL
        AND criado_em >= NOW() - INTERVAL '6 months'
      GROUP BY servico_nome
      ORDER BY value DESC
      LIMIT 6
    `);
    return rows;
  },

  async getSatisfacaoMensal() {
    const { rows } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', criado_em), 'Mon') AS mes,
        ROUND(AVG(avaliacao)::numeric, 2) AS nota
      FROM atendimentos
      WHERE avaliacao IS NOT NULL
        AND criado_em >= NOW() - INTERVAL '6 months'
      GROUP BY DATE_TRUNC('month', criado_em)
      ORDER BY DATE_TRUNC('month', criado_em)
    `);
    return rows;
  },
};
