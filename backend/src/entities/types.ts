// ============================================================
// Entidades de domínio (contratos de dados)
// ============================================================

export type Perfil = 'admin' | 'gestor' | 'consultor';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  especialidade: string | null;
  avatar_url: string | null;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}

export type TipoEmpresa = 'MEI' | 'ME' | 'EPP' | 'Autônomo' | 'Outro';
export type StatusEmpreendedor = 'Ativo' | 'Em formalização' | 'Inativo';

export interface Empreendedor {
  id: number;
  nome: string;
  cpf_cnpj: string;
  telefone: string | null;
  email: string | null;
  tipo_empresa: TipoEmpresa | null;
  nome_empresa: string | null;
  segmento: string | null;
  status: StatusEmpreendedor;
  endereco: string | null;
  observacoes: string | null;
  criado_em: Date;
  atualizado_em: Date;
}

export type StatusAtendimento =
  | 'aguardando'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado'
  | 'atrasado';

export interface Atendimento {
  id: number;
  empreendedor_id: number | null;
  consultor_id: number | null;
  servico_id: number | null;
  servico_nome: string | null;
  status: StatusAtendimento;
  observacoes: string | null;
  avaliacao: number | null;
  iniciado_em: Date | null;
  concluido_em: Date | null;
  criado_em: Date;
  atualizado_em: Date;
  // Joins opcionais
  empreendedor?: Pick<Empreendedor, 'id' | 'nome' | 'cpf_cnpj' | 'telefone'>;
  consultor?: Pick<Usuario, 'id' | 'nome' | 'perfil'>;
}

export interface Servico {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
}

export type TipoCurso = 'Curso' | 'Workshop' | 'Mentoria' | 'Palestra';

export interface Curso {
  id: number;
  titulo: string;
  tipo: TipoCurso | null;
  descricao: string | null;
  vagas_total: number;
  vagas_disponiveis: number;
  data_inicio: Date | null;
  data_fim: Date | null;
  local: string | null;
  ativo: boolean;
  criado_em: Date;
}

export type StatusEncaminhamento = 'pendente' | 'em_andamento' | 'concluido' | 'cancelado';

export interface Encaminhamento {
  id: number;
  atendimento_id: number | null;
  empreendedor_id: number | null;
  curso_id: number | null;
  tipo: string | null;
  descricao: string | null;
  status: StatusEncaminhamento;
  criado_em: Date;
  atualizado_em: Date;
  curso?: Pick<Curso, 'id' | 'titulo' | 'tipo'>;
  empreendedor?: Pick<Empreendedor, 'id' | 'nome'>;
}

// ── DTOs / Payloads ──────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface KpisRelatorio {
  total_atendimentos_mes: number;
  total_empreendedores: number;
  total_concluidos_mes: number;
  media_avaliacao: number | null;
  servico_mais_solicitado: string | null;
  consultor_destaque: string | null;
  atendimentos_acompanhamento: number;
  matriculados_cursos: number;
}
