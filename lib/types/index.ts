export type UserRole = 'admin' | 'member'
export type ClientType = 'mensal' | 'freela'
export type ClientStatus = 'ativo' | 'inativo'
export type DemandPriority = 'baixa' | 'media' | 'alta'
export type FinancialType = 'receita' | 'despesa'
export type PaymentStatus = 'pago' | 'pendente' | 'cancelado'
export type ProposalStatus = 'rascunho' | 'enviada' | 'aprovada' | 'recusada'
export type ContractStatus = 'ativo' | 'encerrado' | 'aguardando'

export interface Workspace {
  id: string
  name: string
  logo_url?: string
  created_at: string
}

export interface Profile {
  id: string
  workspace_id: string
  name: string
  email: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Client {
  id: string
  workspace_id: string
  name: string
  email?: string
  phone?: string
  type: ClientType
  status: ClientStatus
  avatar?: string
  notes?: string
  monthly_value?: number
  created_at: string
  updated_at: string
}

export interface ClientFolder {
  id: string
  workspace_id: string
  client_id: string
  name: string
  description?: string
  created_at: string
  client?: Client
}

export interface DemandColumn {
  id: string
  workspace_id: string
  title: string
  color: string
  position: number
  created_at: string
}

export interface Demand {
  id: string
  workspace_id: string
  column_id: string
  client_id?: string
  title: string
  description?: string
  cover_image?: string
  priority: DemandPriority
  due_date?: string
  tags: string[]
  position: number
  created_at: string
  updated_at: string
  client?: Client
  column?: DemandColumn
}

export interface Financial {
  id: string
  workspace_id: string
  client_id?: string
  type: FinancialType
  description: string
  amount: number
  date: string
  status: PaymentStatus
  category?: string
  created_at: string
  client?: Client
}

export interface Proposal {
  id: string
  workspace_id: string
  client_id?: string
  title: string
  content?: string
  value?: number
  status: ProposalStatus
  created_at: string
  client?: Client
}

export interface Briefing {
  id: string
  workspace_id: string
  client_id?: string
  title: string
  answers: Record<string, string>
  created_at: string
  client?: Client
}

export interface Contract {
  id: string
  workspace_id: string
  client_id?: string
  title: string
  content?: string
  value?: number
  status: ContractStatus
  signed_at?: string
  created_at: string
  client?: Client
}

export interface PortfolioItem {
  id: string
  workspace_id: string
  title: string
  description?: string
  image_url?: string
  tags: string[]
  client_name?: string
  created_at: string
}

export interface CrmContact {
  id: string
  workspace_id: string
  name: string
  email?: string
  phone?: string
  company?: string
  stage: string
  notes?: string
  value?: number
  created_at: string
}

export interface Activity {
  id: string
  workspace_id: string
  user_id?: string
  icon: string
  section: string
  action: string
  detail?: string
  created_at: string
  profile?: Profile
}
