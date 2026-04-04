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
  nomeProduto: string;       // was: nome
  quantidadeVendida: number; // was: quantidade
  valorTotalVenda: number;   // was: totalVendido
  lucro: number;             // missing
}

export interface Relatorio {
  id: string;
  dataCaixa: Date;           // was: dataRelatorio
  vendas: any[];             // missing
  totalVendas: number;
  lucroTotal: number;        // was: quantidadeVendas + metodoPagamentoMaisUsado
  resumoProdutos: ResumoProduto[]; // was: produtosMaisVendidos
  dataCriacao: Date;
}

export interface CreateRelatorioDTO {
  dataCaixa: Date;           // was: dataRelatorio
  vendas: any[];             // missing
  totalVendas: number;
  lucroTotal: number;        // was: quantidadeVendas + metodoPagamentoMaisUsado
  resumoProdutos: ResumoProduto[]; // was: produtosMaisVendidos
}

// --- GERAL ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
