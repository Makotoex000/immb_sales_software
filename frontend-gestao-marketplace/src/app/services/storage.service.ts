import { Injectable } from '@angular/core';

export interface Produto {
  id: string;
  nome: string;
  valorCompra: number;
  valorVenda: number;
  quantidade: number;
  descricao?: string;
  imagem?: string;
  ativo: boolean;
  dataCriacao: string;
}

export interface ItemVenda {
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
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'fiado';
  dataVenda: string;
  status: 'concluida' | 'cancelada';
}

export interface VendaFiado {
  id: string;
  nomeBuyer: string;
  itens: ItemVenda[];
  total: number;
  dataVenda: string;
  status: 'aberto' | 'fechado';
}

export interface Relatorio {
  id: string;
  dataCaixa: string;
  vendas: Venda[];
  totalVendas: number;
  lucroTotal: number;
  resumoProdutos: {
    produtoId: string;
    nomeProduto: string;
    quantidadeVendida: number;
    valorTotalVenda: number;
    lucro: number;
  }[];
  dataCriacao: string;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly PRODUTOS_KEY = 'immb_produtos';
  private readonly VENDAS_KEY = 'immb_vendas';
  private readonly FIADOS_KEY = 'immb_fiados';
  private readonly RELATORIOS_KEY = 'immb_relatorios';
  private readonly USUARIO_KEY = 'immb_usuario_logado';

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    if (!localStorage.getItem(this.PRODUTOS_KEY)) {
      localStorage.setItem(this.PRODUTOS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.VENDAS_KEY)) {
      localStorage.setItem(this.VENDAS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.FIADOS_KEY)) {
      localStorage.setItem(this.FIADOS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.RELATORIOS_KEY)) {
      localStorage.setItem(this.RELATORIOS_KEY, JSON.stringify([]));
    }
  }

  // ===== PRODUTOS =====
  adicionarProduto(produto: Omit<Produto, 'id' | 'dataCriacao' | 'ativo'>): Produto {
    const produtos = this.obterProdutos();
    const novoProduto: Produto = {
      ...produto,
      id: this.gerarId(),
      ativo: true,
      dataCriacao: new Date().toISOString()
    };
    produtos.push(novoProduto);
    localStorage.setItem(this.PRODUTOS_KEY, JSON.stringify(produtos));
    return novoProduto;
  }

  obterProdutos(): Produto[] {
    const dados = localStorage.getItem(this.PRODUTOS_KEY);
    return dados ? JSON.parse(dados) : [];
  }

  obterProdutoAtivo(): Produto[] {
    return this.obterProdutos().filter(p => p.ativo);
  }

  atualizarProduto(id: string, updates: Partial<Produto>): Produto | null {
    const produtos = this.obterProdutos();
    const index = produtos.findIndex(p => p.id === id);
    if (index !== -1) {
      produtos[index] = { ...produtos[index], ...updates };
      localStorage.setItem(this.PRODUTOS_KEY, JSON.stringify(produtos));
      return produtos[index];
    }
    return null;
  }

  desativarProduto(id: string): boolean {
    return this.atualizarProduto(id, { ativo: false }) !== null;
  }

  ativarProduto(id: string): boolean {
    return this.atualizarProduto(id, { ativo: true }) !== null;
  }

  deletarProduto(id: string): boolean {
    const produtos = this.obterProdutos().filter(p => p.id !== id);
    localStorage.setItem(this.PRODUTOS_KEY, JSON.stringify(produtos));
    return true;
  }

  // ===== VENDAS =====
  adicionarVenda(venda: Omit<Venda, 'id' | 'dataVenda' | 'status'>): Venda {
    const vendas = this.obterVendas();
    const novaVenda: Venda = {
      ...venda,
      id: this.gerarId(),
      dataVenda: new Date().toISOString(),
      status: 'concluida'
    };
    vendas.push(novaVenda);
    localStorage.setItem(this.VENDAS_KEY, JSON.stringify(vendas));
    return novaVenda;
  }

  obterVendas(): Venda[] {
    const dados = localStorage.getItem(this.VENDAS_KEY);
    return dados ? JSON.parse(dados) : [];
  }

  obterVendasPorData(data: string): Venda[] {
    return this.obterVendas().filter(v => v.dataVenda.split('T')[0] === data);
  }

  deletarVenda(id: string): boolean {
    const vendas = this.obterVendas().filter(v => v.id !== id);
    localStorage.setItem(this.VENDAS_KEY, JSON.stringify(vendas));
    return true;
  }

  desfazerVenda(id: string): boolean {
    const vendas = this.obterVendas();
    const venda = vendas.find(v => v.id === id);
    if (!venda) return false;

    // Devolver produtos ao estoque
    venda.itens.forEach(item => {
      const produto = this.obterProdutos().find(p => p.id === item.produtoId);
      if (produto) {
        this.atualizarProduto(item.produtoId, {
          quantidade: produto.quantidade + item.quantidade
        });
      }
    });

    this.deletarVenda(id);
    return true;
  }

  // ===== FIADOS =====
  adicionarFiado(fiado: Omit<VendaFiado, 'id' | 'dataVenda' | 'status'>): VendaFiado {
    const fiados = this.obterFiados();
    const novoFiado: VendaFiado = {
      ...fiado,
      id: this.gerarId(),
      dataVenda: new Date().toISOString(),
      status: 'aberto'
    };
    fiados.push(novoFiado);
    localStorage.setItem(this.FIADOS_KEY, JSON.stringify(fiados));
    return novoFiado;
  }

  obterFiados(): VendaFiado[] {
    const dados = localStorage.getItem(this.FIADOS_KEY);
    return dados ? JSON.parse(dados) : [];
  }

  obterFiadosPorNome(nome: string): VendaFiado[] {
    return this.obterFiados().filter(f => f.nomeBuyer.toLowerCase().includes(nome.toLowerCase()));
  }

  adicionarItemFiado(nomeBuyer: string, itens: ItemVenda[]): boolean {
    const fiados = this.obterFiados();
    const fiado = fiados.find(f => f.nomeBuyer === nomeBuyer && f.status === 'aberto');
    
    if (fiado) {
      fiado.itens.push(...itens);
      fiado.total += itens.reduce((sum, item) => sum + item.subtotal, 0);
    } else {
      this.adicionarFiado({
        nomeBuyer,
        itens,
        total: itens.reduce((sum, item) => sum + item.subtotal, 0)
      });
    }
    
    localStorage.setItem(this.FIADOS_KEY, JSON.stringify(fiados));
    return true;
  }

  fecharFiado(id: string, formaPagamento: 'dinheiro' | 'cartao' | 'pix'): Venda | null {
    const fiados = this.obterFiados();
    const fiado = fiados.find(f => f.id === id);
    
    if (!fiado) return null;

    // Criar venda a partir do fiado
    const venda = this.adicionarVenda({
      itens: fiado.itens,
      total: fiado.total,
      formaPagamento
    });

    // Remover fiado
    const novosFiados = fiados.filter(f => f.id !== id);
    localStorage.setItem(this.FIADOS_KEY, JSON.stringify(novosFiados));

    return venda;
  }

  deletarFiado(id: string): boolean {
    const fiados = this.obterFiados().filter(f => f.id !== id);
    localStorage.setItem(this.FIADOS_KEY, JSON.stringify(fiados));
    return true;
  }

  // ===== RELATORIOS =====
  adicionarRelatorio(relatorio: Omit<Relatorio, 'id' | 'dataCriacao'>): Relatorio {
    const relatorios = this.obterRelatorios();
    const novoRelatorio: Relatorio = {
      ...relatorio,
      id: this.gerarId(),
      dataCriacao: new Date().toISOString()
    };
    relatorios.push(novoRelatorio);
    localStorage.setItem(this.RELATORIOS_KEY, JSON.stringify(relatorios));
    return novoRelatorio;
  }

  obterRelatorios(): Relatorio[] {
    const dados = localStorage.getItem(this.RELATORIOS_KEY);
    return dados ? JSON.parse(dados) : [];
  }

  obterRelatoriosPorData(data: string): Relatorio[] {
    return this.obterRelatorios().filter(r => r.dataCaixa === data);
  }

  deletarRelatorios(dataInicio: string, dataFim: string): boolean {
    const relatorios = this.obterRelatorios();
    const novoRelatorios = relatorios.filter(r => {
      return r.dataCaixa < dataInicio || r.dataCaixa > dataFim;
    });
    localStorage.setItem(this.RELATORIOS_KEY, JSON.stringify(novoRelatorios));
    return true;
  }

  // ===== USUARIO =====
  setUsuarioLogado(usuario: any): void {
    localStorage.setItem(this.USUARIO_KEY, JSON.stringify(usuario));
  }

  obterUsuarioLogado(): any {
    const dados = localStorage.getItem(this.USUARIO_KEY);
    return dados ? JSON.parse(dados) : null;
  }

  limparUsuarioLogado(): void {
    localStorage.removeItem(this.USUARIO_KEY);
  }

  // ===== UTILITARIOS =====
  private gerarId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  exportarDados(): string {
    return JSON.stringify({
      produtos: this.obterProdutos(),
      vendas: this.obterVendas(),
      fiados: this.obterFiados(),
      relatorios: this.obterRelatorios(),
      dataExportacao: new Date().toISOString()
    }, null, 2);
  }

  importarDados(dados: string): boolean {
    try {
      const parsed = JSON.parse(dados);
      if (parsed.produtos) localStorage.setItem(this.PRODUTOS_KEY, JSON.stringify(parsed.produtos));
      if (parsed.vendas) localStorage.setItem(this.VENDAS_KEY, JSON.stringify(parsed.vendas));
      if (parsed.fiados) localStorage.setItem(this.FIADOS_KEY, JSON.stringify(parsed.fiados));
      if (parsed.relatorios) localStorage.setItem(this.RELATORIOS_KEY, JSON.stringify(parsed.relatorios));
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }

  limparTodosDados(): void {
    localStorage.removeItem(this.PRODUTOS_KEY);
    localStorage.removeItem(this.VENDAS_KEY);
    localStorage.removeItem(this.FIADOS_KEY);
    localStorage.removeItem(this.RELATORIOS_KEY);
    this.initializeStorage();
  }
}
