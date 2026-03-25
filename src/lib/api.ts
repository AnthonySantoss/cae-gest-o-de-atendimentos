/**
 * Cliente HTTP centralizado para comunicação com o backend.
 * Injeta o token JWT automaticamente em todas as requisições.
 */

const BASE_URL = '/api';

/** Constrói query string filtrando campos undefined/null */
function buildQs(params: Record<string, unknown>): string {
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) clean[k] = String(v);
  }
  return new URLSearchParams(clean).toString();
}

function getToken(): string | null {
  return localStorage.getItem('cae_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    localStorage.removeItem('cae_token');
    localStorage.removeItem('cae_user');
    window.location.href = '/';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error ?? `Erro ${res.status}`);
  }

  return body as T;
}

// ── Auth ────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, senha: string) =>
    request<{ token: string; usuario: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),
  me: () => request<{ usuario: AuthUser }>('/auth/me'),
};

// ── Atendimentos ────────────────────────────────────────────
export const atendimentosApi = {
  getFila: () => request<{ data: FilaItem[] }>('/atendimentos/fila'),

  getHistorico: (params: HistoricoParams = {}) => {
    const qs = buildQs(params as Record<string, unknown>);
    return request<PaginatedResult<HistoricoItem>>(`/atendimentos/historico?${qs}`);
  },

  create: (data: CreateAtendimentoPayload) =>
    request<{ data: unknown }>('/atendimentos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: number, status: string, consultor_id?: number) =>
    request<{ data: unknown }>(`/atendimentos/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, consultor_id }),
    }),
};

// ── Empreendedores ──────────────────────────────────────────
export const empreendedoresApi = {
  list: (params: ListParams = {}) => {
    const qs = buildQs(params as Record<string, unknown>);
    return request<PaginatedResult<Empreendedor>>(`/empreendedores?${qs}`);
  },

  getById: (id: number) =>
    request<{ data: Empreendedor }>(`/empreendedores/${id}`),

  getAtendimentos: (id: number) =>
    request<PaginatedResult<HistoricoItem>>(`/empreendedores/${id}/atendimentos`),

  create: (data: CreateEmpreendedorPayload) =>
    request<{ data: Empreendedor }>('/empreendedores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateEmpreendedorPayload>) =>
    request<{ data: Empreendedor }>(`/empreendedores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ── Consultores ─────────────────────────────────────────────
export const consultoresApi = {
  list: () => request<{ data: Consultor[] }>('/consultores'),

  create: (data: { nome: string; email: string; perfil: string; especialidade?: string }) =>
    request<{ data: Consultor; tempPassword?: string }>('/consultores', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: { nome?: string; email?: string; perfil?: string; especialidade?: string; reset_senha?: boolean }) =>
    request<{ data: Consultor; tempPassword?: string }>(`/consultores/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// ── Cursos & Encaminhamentos ────────────────────────────────
export const cursosApi = {
  listCursos: () => request<{ data: Curso[] }>('/cursos'),
  listServicos: () => request<{ data: Servico[] }>('/servicos'),
  listEncaminhamentos: (empreendedor_id?: number) => {
    const qs = empreendedor_id ? `?empreendedor_id=${empreendedor_id}` : '';
    return request<{ data: Encaminhamento[] }>(`/encaminhamentos${qs}`);
  },
  encaminhar: (data: EncaminharPayload) =>
    request<{ data: unknown }>('/encaminhamentos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Relatórios ──────────────────────────────────────────────
export const relatoriosApi = {
  getKpis: () => request<{ data: Kpis }>('/relatorios/kpis'),
  getEvolucaoSemanal: () => request<{ data: EvolucaoSemanalItem[] }>('/relatorios/evolucao-semanal'),
 getEvolucaoMensal: (meses = 6) => request<{ data: EvolucaoMensalItem[] }>(`/relatorios/evolucao-mensal?meses=${meses}`),
  getDistribuicaoServicos: () => request<{ data: DistribuicaoItem[] }>('/relatorios/servicos'),
  getSatisfacao: () => request<{ data: SatisfacaoItem[] }>('/relatorios/satisfacao'),
};

// ── Types ───────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  nome: string;
  email: string;
  perfil: 'admin' | 'gestor' | 'consultor';
  especialidade: string | null;
  avatar_url: string | null;
}

export interface FilaItem {
  id: number;
  empreendedor_id: number;
  empreendedor_nome: string;
  cpf_cnpj: string;
  telefone: string | null;
  servico_nome: string;
  status: 'aguardando' | 'em_atendimento' | 'atrasado' | 'concluido';
  consultor_nome: string | null;
  criado_em: string;
  iniciado_em: string | null;
}

export interface HistoricoItem {
  id: number;
  empreendedor_nome: string;
  empreendedor_id: number;
  cpf_cnpj: string;
  servico_nome: string;
  consultor_nome: string | null;
  status: string;
  avaliacao: number | null;
  criado_em: string;
  concluido_em: string | null;
  observacoes: string | null;
}

export interface Empreendedor {
  id: number;
  nome: string;
  cpf_cnpj: string;
  telefone: string | null;
  email: string | null;
  tipo_empresa: string | null;
  nome_empresa: string | null;
  segmento: string | null;
  status: 'Ativo' | 'Em formalização' | 'Inativo';
  total_atendimentos?: number;
  criado_em: string;
}

export interface Consultor {
  id: number;
  nome: string;
  email: string;
  perfil: string;
  especialidade: string | null;
  total_atendimentos: number;
  media_avaliacao: number | null;
}

export interface Curso {
  id: number;
  titulo: string;
  tipo: string | null;
  descricao: string | null;
  vagas_total: number;
  vagas_disponiveis: number;
  data_inicio: string | null;
  local: string | null;
  total_encaminhados: number;
}

export interface Servico { id: number; nome: string; descricao: string | null; }
export interface Encaminhamento {
  id: number;
  empreendedor_nome: string;
  curso_titulo: string | null;
  curso_tipo: string | null;
  tipo: string | null;
  descricao: string | null;
  status: string;
  criado_em: string;
}

export interface Kpis {
  total_atendimentos_mes: number;
  total_empreendedores: number;
  total_concluidos_mes: number;
  media_avaliacao: number | null;
  servico_mais_solicitado: string | null;
  consultor_destaque: string | null;
  atendimentos_acompanhamento: number;
  matriculados_cursos: number;
}

export interface EvolucaoSemanalItem { dia: string; atendimentos: number; }
export interface EvolucaoMensalItem { mes: string; total: number; aberturas_mei: number; consultorias: number; credito: number; }
export interface DistribuicaoItem { name: string; value: number; }
export interface SatisfacaoItem { mes: string; nota: number; }

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}

export interface ListParams {
  search?: string;
  status?: string;
  tipo?: string;
  page?: number;
  per_page?: number;
}

export interface HistoricoParams {
  empreendedor_id?: number;
  page?: number;
  per_page?: number;
}

export interface CreateAtendimentoPayload {
  empreendedor_id: number;
  servico_id?: number;
  servico_nome: string;
  consultor_id?: number;
  observacoes?: string;
}

export interface CreateEmpreendedorPayload {
  nome: string;
  cpf_cnpj: string;
  telefone?: string;
  email?: string;
  tipo_empresa?: string;
  nome_empresa?: string;
  segmento?: string;
  status?: string;
}

export interface EncaminharPayload {
  empreendedor_id: number;
  curso_id?: number;
  atendimento_id?: number;
  tipo?: string;
  descricao?: string;
}
