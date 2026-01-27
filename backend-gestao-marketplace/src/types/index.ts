// Tipos para Produtos
export interface Produto {
  id: string;
  nome: string;
  valorCompra: number;
  valorVenda: number;
  quantidade: number;
  descricao?: string;
  imagem?: string;
  ativo: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

export interface CreateProdutoDTO {
  nome: string;
  valorCompra: number;
  valorVenda: number;
  quantidade: number;
  descricao?: string;
  imagem?: string;
}

export interface UpdateProdutoDTO {
  nome?: string;
  valorCompra?: number;
  valorVenda?: number;
  quantidade?: number;
  descricao?: string;
  imagem?: string;
  ativo?: boolean;
}

// Tipos para Itens de Venda
export interface ItemVenda {
  id: string;
  vendaId: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface CreateItemVendaDTO {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

// Tipos para Vendas
export interface Venda {
  id: string;
  itens: ItemVenda[];
  total: number;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'fiado';
  dataVenda: Date;
  status: 'concluida' | 'cancelada' | 'fiado';
  nomeCliente?: string;
}

export interface CreateVendaDTO {
  itens: CreateItemVendaDTO[];
  total: number;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'fiado';
  status?: 'concluida' | 'cancelada' | 'fiado';
  nomeCliente?: string;
}

// Tipos para Vendas Fiado
export interface VendaFiado {
  id: string;
  nomeBuyer: string;
  itens: ItemVenda[];
  total: number;
  dataVenda: Date;
  status: 'aberto' | 'fechado';
}

export interface CreateVendaWithStatusDTO extends CreateVendaDTO {
  status: 'concluida' | 'cancelada' | 'fiado';
  nomeCliente?: string;  // ← Adicionado
}

export interface CreateVendaWithStatusDTO extends CreateVendaDTO {
  status: 'concluida' | 'cancelada' | 'fiado';  // ← Obrigatório
}

export interface CreateVendaFiadoDTO {
  nomeBuyer: string;
  itens: CreateItemVendaDTO[];
  total: number;
}

export interface UpdateVendaFiadoDTO {
  itens?: CreateItemVendaDTO[];
  total?: number;
}

// Tipos para Relatórios
export interface ResumoProduto {
  produtoId: string;
  nomeProduto: string;
  quantidadeVendida: number;
  valorTotalVenda: number;
  lucro: number;
}

export interface Relatorio {
  id: string;
  dataCaixa: Date;
  vendas: Venda[];
  totalVendas: number;
  lucroTotal: number;
  resumoProdutos: ResumoProduto[];
  dataCriacao: Date;
}

export interface CreateRelatorioDTO {
  dataCaixa: Date;
  vendas: Venda[];
  totalVendas: number;
  lucroTotal: number;
  resumoProdutos: ResumoProduto[];
}

// Tipos para Respostas
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
