/**
 * Seed inicial com dados realistas para desenvolvimento
 */
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

const { Client } = pg;

export default async function seed() {
  console.log('[SEED] Iniciando seed de dados...');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  // Limpeza inicial para garantir que o seed seja reproduzível
  console.log('[SEED] Limpando todas as tabelas...');
  await client.query('TRUNCATE TABLE encaminhamentos, atendimentos, cursos, servicos, empreendedores, usuarios RESTART IDENTITY CASCADE');

  // ── Usuários (Admin e Consultores) ──────────────────────────
  const passwordHash = await bcrypt.hash('cae2026', 10);
  await client.query(`
    INSERT INTO usuarios (nome, email, senha_hash, perfil, especialidade) VALUES
    ('Administrador CAE', 'admin@cae.gov.br', $1, 'admin', 'Geral'),
    ('Gestor de Atendimento', 'gestao@cae.gov.br', $1, 'gestor', 'Operações'),
    ('Fabiana Silva', 'fabiana@cae.gov.br', $1, 'consultor', 'Finanças'),
    ('Marcos Oliveira', 'marcos@cae.gov.br', $1, 'consultor', 'Marketing'),
    ('Patrícia Lima', 'patricia@cae.gov.br', $1, 'consultor', 'Jurídico')
  `, [passwordHash]);
  console.log('[SEED] Usuários (Admin e Consultores) inseridos.');

  // ── Serviços (Catálogo) ───────────────────────────────────
  await client.query(`
    INSERT INTO servicos (nome, descricao) VALUES
    ('Abertura de MEI', 'Processo completo de formalização do Microempreendedor Individual.'),
    ('Consultoria Financeira', 'Orientações sobre fluxo de caixa, precificação e gestão financeira.'),
    ('Dúvidas sobre Alvará', 'Suporte técnico sobre licenciamento e vigilância sanitária.'),
    ('Crédito Orientado', 'Auxílio na obtenção de microcrédito e linhas de fomento.'),
    ('Alteração Cadastral', 'Atualização de dados no CNPJ e prefeitura.')
  `);
  console.log('[SEED] Serviços inseridos.');

  // ── Empreendedores (Massa Rica) ──────────────────────────────
  await client.query(`
    INSERT INTO empreendedores (nome, cpf_cnpj, telefone, email, tipo_empresa, nome_empresa, segmento, status) VALUES
    ('Maria Oliveira',  '111.222.333-44', '(11) 98888-1111', 'maria@email.com',    'MEI',      'Loja Maria Bonita',      'Varejo',            'Ativo'),
    ('Roberto Carlos',  '22.333.444/0001-55', '(11) 97777-2222', 'roberto@email.com',  'ME',   'RC Manutenções',         'Serviços',          'Ativo'),
    ('Juliana Paes',    '333.444.555-66', '(11) 96666-3333', 'juliana@email.com',  'Autônomo', 'Doces da Ju',            'Alimentação',       'Em formalização'),
    ('Fernando Souza',  '44.555.666/0001-77', '(11) 95555-4444', 'fernando@email.com', 'EPP',  'Tech Solutions',         'Tecnologia',        'Ativo'),
    ('Claudia Lima',    '555.666.777-88', '(11) 94444-5555', 'claudia@email.com',  'MEI',      'Studio Claudia Beauty',  'Beleza',            'Ativo'),
    ('Paulo Mendes',    '666.777.888-99', '(11) 93333-6666', 'paulo@email.com',    'ME',       'Mendes Construções',     'Construção Civil',  'Ativo'),
    ('Ana Costa',       '777.888.999-00', '(11) 92222-7777', 'anacosta@email.com', 'MEI',      'Ana Artesanatos',        'Artesanato',        'Em formalização'),
    ('Carlos Santos',   '888.999.000-11', '(11) 91111-8888', 'carlos@email.com',   'Autônomo', NULL,                     'Transporte',        'Ativo'),
    ('João Pedro',      '999.000.111-22', '(11) 90000-9999', 'joao@email.com',     'MEI',      'JP Logística',           'Transporte',        'Ativo'),
    ('Renata Vieira',   '000.111.222-33', '(11) 91234-5678', 'renata@email.com',   'Autônomo', NULL,                     'Serviços',          'Ativo')
  `);
  console.log('[SEED] Empreendedores inseridos (10 registros).');

  // ── Atendimentos (Histórico Rico) ────────────────────────────
  const servicosRef = [
    { id: 1, nome: 'Abertura de MEI' },
    { id: 2, nome: 'Consultoria Financeira' },
    { id: 3, nome: 'Dúvidas sobre Alvará' },
    { id: 4, nome: 'Crédito Orientado' },
    { id: 5, nome: 'Alteração Cadastral' }
  ];

  const blocks = [];
  // Gera 120 atendimentos passados distribuídos ao longo de 6 meses
  for (let i = 0; i < 120; i++) {
    const empId = Math.floor(Math.random() * 10) + 1; // 1 to 10
    const consId = Math.floor(Math.random() * 3) + 3; // 3, 4, or 5 (Consultores - Fabiana, Marcos, Patrícia)
    const serv = servicosRef[Math.floor(Math.random() * servicosRef.length)];
    const pastDays = Math.floor(Math.random() * 180); // 0 to 6 meses atrás
    const av = Math.random() > 0.85 ? 4 : (Math.random() > 0.95 ? 3 : 5);
    
    blocks.push(`(${empId}, ${consId}, ${serv.id}, '${serv.nome}', 'concluido', 'Orientação gerada para fomentar o projeto e relatórios.', NOW() - INTERVAL '${pastDays} days', NOW() - INTERVAL '${pastDays} days' + INTERVAL '45 min', ${av}, NOW() - INTERVAL '${pastDays} days')`);
  }

  const queryAtend = `INSERT INTO atendimentos (empreendedor_id, consultor_id, servico_id, servico_nome, status, observacoes, iniciado_em, concluido_em, avaliacao, criado_em) VALUES ${blocks.join(', ')}`;
  await client.query(queryAtend);
  console.log('[SEED] 120 Atendimentos históricos inseridos retroativamente.');

  // ── Fila do dia ─────────────────────────────────────────────
  await client.query(`
    INSERT INTO atendimentos (empreendedor_id, consultor_id, servico_id, servico_nome, status, criado_em) VALUES
    (8, NULL, 1, 'Abertura de MEI',        'aguardando', NOW() - INTERVAL '15 min'),
    (7, NULL, 2, 'Consultoria Financeira', 'aguardando', NOW() - INTERVAL '35 min'),
    (3, NULL, 3, 'Dúvidas sobre Alvará',   'atrasado',   NOW() - INTERVAL '50 min'),
    (6, NULL, 4, 'Crédito Orientado',      'aguardando', NOW() - INTERVAL '5 min')
  `);
  console.log('[SEED] Fila do dia inserida (4 aguardando).');

  // ── Cursos e Encaminhamentos ─────────────────────────────────
  await client.query(`
    INSERT INTO cursos (titulo, tipo, descricao, vagas_total, vagas_disponiveis, ativo) VALUES
    ('MEI na Prática', 'Workshop', 'Aprenda a gerir seu negócio individual.', 20, 15, true),
    ('Marketing Digital Basics', 'Curso', 'Como divulgar sua empresa no Instagram e Google.', 30, 10, true),
    ('Gestão de Pequenos Negócios', 'Mentoria', 'Foco em expansão e planejamento.', 5, 2, true),
    ('Vendas de Alto Impacto', 'Palestra', 'Dicas para aumentar conversão.', 50, 45, true)
  `);
  
  await client.query(`
    INSERT INTO encaminhamentos (atendimento_id, empreendedor_id, curso_id, tipo, descricao, status) VALUES
    (1, 1, 1, 'Curso',   'Empreendedora encaminhada para melhorar gestão financeira.', 'concluido'),
    (3, 2, 4, 'Curso',   'Empreendedor encaminhado para curso de vendas digitais.',    'em_andamento'),
    (5, 4, 3, 'Mentoria','Empresa precisa de auxílio no plano de negócios para crescimento.', 'pendente')
  `);
  console.log('[SEED] Cursos e Encaminhamentos inseridos.');

  await client.end();
  console.log('[SEED] ✅ Seed concluído com sucesso!');
  console.log('[SEED] Login padrão: admin@cae.gov.br / Senha: cae2026');
}

// Executa se chamado diretamente
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seed().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
