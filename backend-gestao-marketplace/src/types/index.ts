// --- PRODUTOS ---
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
  dataAtualizacao?: Date;
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

// --- VENDAS ---
export interface ItemVenda {
  id: string;
  vendaId: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

export interface Venda {
  id: string;
  itens: ItemVenda[];
  total: number;
  formaPagamento: string;
  dataVenda: Date;
  status: 'concluida' | 'cancelada' | 'fiado';
  nomeCliente?: string;
}

export interface CreateVendaDTO {
  itens: {
    produtoId: string;
    nomeProduto: string;
    quantidade: number;
    valorUnitario: number;
    subtotal: number;
  }[];
  total: number;
  formaPagamento: string;
  status?: string;
  nomeCliente?: string;
}

export interface CreateVendaWithStatusDTO extends CreateVendaDTO {
  status: 'concluida' | 'cancelada' | 'fiado';
}

// --- FIADOS ---
export interface VendaFiado {
  id: string;
  nomeBuyer: string;
  itens: ItemVenda[];
  total: number;
  dataVenda: Date;
  status: 'aberto' | 'fechado';
}

export interface CreateVendaFiadoDTO {
  nomeBuyer: string;
  itens: any[];
  total: number;
}

export interface UpdateVendaFiadoDTO {
  nomeBuyer?: string;
  total?: number;
  status?: 'aberto' | 'fechado';
}

export interface CreateItemVendaDTO {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

// --- RELATÓRIOS ---
export interface ResumoProduto {
  produtoId: string;
  nome: string;
  quantidade: number;
  totalVendido: number;
}

export interface Relatorio {
  id: string;
  dataRelatorio: Date;
  totalVendas: number;
  quantidadeVendas: number;
  metodoPagamentoMaisUsado: string;
  produtosMaisVendidos: ResumoProduto[];
  dataCriacao: Date;
}

export interface CreateRelatorioDTO {
  dataRelatorio: Date;
  totalVendas: number;
  quantidadeVendas: number;
  metodoPagamentoMaisUsado: string;
  produtosMaisVendidos: ResumoProduto[];
}

// --- GERAL ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
