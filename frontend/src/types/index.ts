export interface Usuario {
  id: string;
  username: string;
  email: string;
  nome_completo: string;
  nivel_acesso: 'COORDENADOR' | 'DIPLAN' | 'DIQUALI' | 'DIPLI' | 'VISITANTE';
  ativo: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PCA {
  id: string;
  numero_contratacao: string;
  status_contratacao?: string;
  situacao_execucao?: string;
  titulo_contratacao?: string;
  categoria_contratacao?: string;
  valor_total?: number;
  area_requisitante?: string;
  numero_dfd?: string;
  data_estimada_inicio?: string;
  data_estimada_conclusao?: string;
  atrasada: boolean;
  vencida: boolean;
  created_at: string;
  updated_at?: string;
  created_by: string;
}

export interface Qualificacao {
  id: string;
  nup: string;
  numero_contratacao: string;
  ano: number; // Ano de execução da contratação
  area_demandante?: string;
  responsavel_instrucao?: string;
  modalidade?: string;
  objeto?: string;
  palavra_chave?: string;
  valor_estimado?: number;
  status: 'EM ANALISE' | 'CONCLUIDO';
  observacoes?: string;
  created_at: string;
  updated_at?: string;
  created_by: string;
}

export interface Licitacao {
  id: string;
  nup: string;
  numero_contratacao?: string;
  ano: number; // Herdado da qualificação
  area_demandante?: string;
  responsavel_instrucao?: string;
  modalidade?: string;
  objeto?: string;
  palavra_chave?: string;
  valor_estimado?: number;
  observacoes?: string;
  pregoeiro?: string;
  valor_homologado?: number;
  data_homologacao?: string;
  link?: string;
  status: 'HOMOLOGADA' | 'FRACASSADA' | 'EM ANDAMENTO' | 'REVOGADA';
  economia?: number;
  created_at: string;
  updated_at?: string;
  created_by: string;
}

export interface AuthContextType {
  user: Usuario | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface DashboardStats {
  total_pcas: number;
  pcas_atrasadas: number;
  pcas_vencidas: number;
  pcas_no_prazo: number;
}

export interface LicitacaoStats {
  total_licitacoes: number;
  homologadas: number;
  em_andamento: number;
  fracassadas: number;
  total_economia: number;
}