-- ============================================================
-- CAE - Gestão de Atendimentos
-- Migration 001: Schema Inicial
-- ============================================================

-- Extensão para UUIDs (não usamos aqui, mas boa prática ter)
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABELA: usuarios (consultores, gestores, admins)
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(150)  NOT NULL,
  email       VARCHAR(150)  UNIQUE NOT NULL,
  senha_hash  VARCHAR(255)  NOT NULL,
  perfil      VARCHAR(20)   NOT NULL DEFAULT 'consultor'
                CHECK (perfil IN ('admin', 'gestor', 'consultor')),
  especialidade VARCHAR(100),
  avatar_url  TEXT,
  ativo       BOOLEAN       NOT NULL DEFAULT true,
  criado_em   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo  ON usuarios(ativo);

-- ============================================================
-- TABELA: empreendedores
-- ============================================================
CREATE TABLE IF NOT EXISTS empreendedores (
  id            SERIAL PRIMARY KEY,
  nome          VARCHAR(150) NOT NULL,
  cpf_cnpj      VARCHAR(20)  UNIQUE NOT NULL,
  telefone      VARCHAR(20),
  email         VARCHAR(150),
  tipo_empresa  VARCHAR(20)  CHECK (tipo_empresa IN ('MEI', 'ME', 'EPP', 'Autônomo', 'Outro')),
  nome_empresa  VARCHAR(200),
  segmento      VARCHAR(100),
  status        VARCHAR(30)  NOT NULL DEFAULT 'Ativo'
                CHECK (status IN ('Ativo', 'Em formalização', 'Inativo')),
  endereco      TEXT,
  observacoes   TEXT,
  criado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empreendedores_cpf_cnpj ON empreendedores(cpf_cnpj);
CREATE INDEX IF NOT EXISTS idx_empreendedores_nome     ON empreendedores(lower(nome));
CREATE INDEX IF NOT EXISTS idx_empreendedores_status   ON empreendedores(status);

-- ============================================================
-- TABELA: servicos (catálogo de serviços oferecidos)
-- ============================================================
CREATE TABLE IF NOT EXISTS servicos (
  id        SERIAL PRIMARY KEY,
  nome      VARCHAR(100) NOT NULL,
  descricao TEXT,
  ativo     BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- TABELA: atendimentos
-- ============================================================
CREATE TABLE IF NOT EXISTS atendimentos (
  id                SERIAL PRIMARY KEY,
  empreendedor_id   INTEGER REFERENCES empreendedores(id) ON DELETE SET NULL,
  consultor_id      INTEGER REFERENCES usuarios(id)       ON DELETE SET NULL,
  servico_id        INTEGER REFERENCES servicos(id)       ON DELETE SET NULL,
  servico_nome      VARCHAR(100), -- desnormalizado para histórico
  status            VARCHAR(20)  NOT NULL DEFAULT 'aguardando'
                    CHECK (status IN ('aguardando', 'em_atendimento', 'concluido', 'cancelado', 'atrasado')),
  observacoes       TEXT,
  avaliacao         SMALLINT     CHECK (avaliacao BETWEEN 1 AND 5),
  iniciado_em       TIMESTAMPTZ,
  concluido_em      TIMESTAMPTZ,
  criado_em         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_atendimentos_empreendedor ON atendimentos(empreendedor_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_consultor    ON atendimentos(consultor_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_status       ON atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_criado_em    ON atendimentos(criado_em DESC);

-- ============================================================
-- TABELA: cursos (encaminhamentos)
-- ============================================================
CREATE TABLE IF NOT EXISTS cursos (
  id                SERIAL PRIMARY KEY,
  titulo            VARCHAR(200) NOT NULL,
  tipo              VARCHAR(30)  CHECK (tipo IN ('Curso', 'Workshop', 'Mentoria', 'Palestra')),
  descricao         TEXT,
  vagas_total       INTEGER      NOT NULL DEFAULT 0,
  vagas_disponiveis INTEGER      NOT NULL DEFAULT 0,
  data_inicio       DATE,
  data_fim          DATE,
  local             TEXT,
  ativo             BOOLEAN      NOT NULL DEFAULT true,
  criado_em         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABELA: encaminhamentos
-- ============================================================
CREATE TABLE IF NOT EXISTS encaminhamentos (
  id                SERIAL PRIMARY KEY,
  atendimento_id    INTEGER REFERENCES atendimentos(id) ON DELETE CASCADE,
  empreendedor_id   INTEGER REFERENCES empreendedores(id) ON DELETE CASCADE,
  curso_id          INTEGER REFERENCES cursos(id) ON DELETE SET NULL,
  tipo              VARCHAR(30),
  descricao         TEXT,
  status            VARCHAR(20)  NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'cancelado')),
  criado_em         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_encaminhamentos_empreendedor ON encaminhamentos(empreendedor_id);

-- ============================================================
-- FUNÇÃO: auto-atualiza atualizado_em
-- ============================================================
CREATE OR REPLACE FUNCTION set_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_usuarios_atualizado_em
  BEFORE UPDATE ON usuarios
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE OR REPLACE TRIGGER trg_empreendedores_atualizado_em
  BEFORE UPDATE ON empreendedores
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE OR REPLACE TRIGGER trg_atendimentos_atualizado_em
  BEFORE UPDATE ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();

CREATE OR REPLACE TRIGGER trg_encaminhamentos_atualizado_em
  BEFORE UPDATE ON encaminhamentos
  FOR EACH ROW EXECUTE FUNCTION set_atualizado_em();
