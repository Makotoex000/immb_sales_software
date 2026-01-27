import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Produto {
  id: string;
  nome: string;
  valorCompra: number;
  valorVenda: number;
  quantidade: number;
  descricao?: string;
  imagem?: string;
  ativo: boolean;
}

interface ItemVenda {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  valorUnitario: number;
  subtotal: number;
}

@Component({
  selector: 'app-vendas',
  imports: [CommonModule, FormsModule],
  templateUrl: './vendas.html',
  styleUrl: './vendas.css'
})
export class Vendas implements OnInit {
  produtos: Produto[] = [];
  carrinho: ItemVenda[] = [];
  busca: string = '';
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'fiado' = 'dinheiro';
  nomeCompradorFiado: string = '';
  quantidadesProdutos: { [key: string]: number } = {};
  mensagemSucesso: string = '';
  mensagemErro: string = '';
  carregando: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando = true;
    this.apiService.obterProdutosAtivos().subscribe(
      (response: any) => {
        this.carregando = false;
        if (response.success) {
          this.produtos = response.data || [];
        } else {
          this.mensagemErro = 'Erro ao carregar produtos';
        }
      },
      (error: any) => {
        this.carregando = false;
        console.error('Erro ao carregar produtos:', error);
        this.mensagemErro = 'Erro ao carregar produtos';
      }
    );
  }

  get produtosFiltrados(): Produto[] {
    if (!this.busca.trim()) {
      return this.produtos;
    }
    return this.produtos.filter(p =>
      p.nome.toLowerCase().includes(this.busca.toLowerCase())
    );
  }

  get totalCarrinho(): number {
    return this.carrinho.reduce((sum, item) => sum + item.subtotal, 0);
  }

  adicionarAoCarrinho(produto: Produto): void {
    // Verificar se o produto está sem estoque
    if (produto.quantidade === 0) {
      this.mensagemErro = 'Este produto está sem estoque';
      return;
    }

    const quantidade = this.quantidadesProdutos[produto.id];

    if (!quantidade || quantidade <= 0) {
      this.mensagemErro = 'Quantidade inválida';
      return;
    }

    if (quantidade > produto.quantidade) {
      this.mensagemErro = 'Quantidade maior que o estoque disponível';
      return;
    }

    // Verificar se o produto já está no carrinho
    const itemExistente = this.carrinho.find(item => item.produtoId === produto.id);

    if (itemExistente) {
      itemExistente.quantidade += quantidade;
      itemExistente.subtotal = itemExistente.quantidade * itemExistente.valorUnitario;
    } else {
      this.carrinho.push({
        produtoId: produto.id,
        nomeProduto: produto.nome,
        quantidade,
        valorUnitario: produto.valorVenda,
        subtotal: quantidade * produto.valorVenda
      });
    }

    // Atualizar a quantidade do produto no array (apenas para exibição)
    const produtoIndex = this.produtos.findIndex(p => p.id === produto.id);
    if (produtoIndex !== -1) {
      this.produtos[produtoIndex].quantidade -= quantidade;
    }

    this.quantidadesProdutos[produto.id] = 0;
    this.mensagemErro = '';
    this.mensagemSucesso = `${produto.nome} adicionado ao carrinho`;
    setTimeout(() => this.mensagemSucesso = '', 3000);
  }

  removerDoCarrinho(index: number): void {
    this.carrinho.splice(index, 1);
  }

  finalizarVenda(): void {
    if (this.carrinho.length === 0) {
      this.mensagemErro = 'Carrinho vazio';
      return;
    }

    if (this.formaPagamento === 'fiado' && !this.nomeCompradorFiado.trim()) {
      this.mensagemErro = 'Nome do comprador é obrigatório para fiado';
      return;
    }

    this.carregando = true;

    if (this.formaPagamento === 'fiado') {
      // Criar fiado
      const fiado = {
        nomeBuyer: this.nomeCompradorFiado,
        itens: this.carrinho,
        total: this.totalCarrinho
      };

      this.apiService.criarFiado(fiado).subscribe(
        (response: any) => {
          this.carregando = false;
          if (response.success) {
            this.mensagemSucesso = 'Fiado criado com sucesso!';
            this.limparCarrinho();
          } else {
            this.mensagemErro = response.error || 'Erro ao criar fiado';
          }
        },
        (error: any) => {
          this.carregando = false;
          console.error('Erro ao criar fiado:', error);
          this.mensagemErro = 'Erro ao criar fiado';
        }
      );
    } else {
      // Criar venda normal
      const venda = {
        itens: this.carrinho,
        total: this.totalCarrinho,
        formaPagamento: this.formaPagamento
      };

      this.apiService.criarVenda(venda).subscribe(
        (response: any) => {
          this.carregando = false;
          if (response.success) {
            this.mensagemSucesso = 'Venda finalizada com sucesso!';
            this.limparCarrinho();
            this.carregarProdutos();
          } else {
            this.mensagemErro = response.error || 'Erro ao finalizar venda';
          }
        },
        (error: any) => {
          this.carregando = false;
          console.error('Erro ao finalizar venda:', error);
          this.mensagemErro = 'Erro ao finalizar venda';
        }
      );
    }
  }

  private limparCarrinho(): void {
    setTimeout(() => {
      this.carrinho = [];
      this.nomeCompradorFiado = '';
      this.formaPagamento = 'dinheiro';
      this.mensagemSucesso = '';
      this.carregarProdutos();
    }, 2000);
  }
}