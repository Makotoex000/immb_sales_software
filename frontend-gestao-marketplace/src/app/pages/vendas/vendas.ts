import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-vendas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendas.html',
  styleUrl: './vendas.css'
} )
export class Vendas implements OnInit {
  // Variáveis de estado da tela
  produtos: any[] = [];
  produtosFiltrados: any[] = [];
  carrinho: any[] = [];
  filtro: string = '';
  total: number = 0;
  formaPagamento: string = 'dinheiro';
  nomeCliente: string = '';
  
  // URLs da API (Usando IP para evitar erro de resolução de nome)
  private readonly baseUrl = 'http://127.0.0.1:3000/api';
  apiUrl = `${this.baseUrl}/produtos/ativos`;
  vendasUrl = `${this.baseUrl}/vendas`;
  fiadosUrl = `${this.baseUrl}/fiados`;

  private http = inject(HttpClient );

  ngOnInit() {
    this.carregarProdutos();
  }

  // Busca produtos ativos no backend
  carregarProdutos() {
    console.log('Buscando produtos em:', this.apiUrl);
    this.http.get<any>(this.apiUrl ).subscribe({
      next: (res) => {
        console.log('Resposta recebida:', res);
        const dados = res.data || res;
        this.produtos = Array.isArray(dados) ? dados : [];
        this.produtosFiltrados = [...this.produtos];
      },
      error: (err) => {
        console.error('Erro ao carregar produtos:', err);
      }
    });
  }

  // Filtra a lista de produtos conforme o usuário digita
  filtrarProdutos() {
    const termo = this.filtro.toLowerCase().trim();
    if (!termo) {
      this.produtosFiltrados = [...this.produtos];
      return;
    }
    this.produtosFiltrados = this.produtos.filter(p => 
      p.nome.toLowerCase().includes(termo)
    );
  }

  // Adiciona um item ao carrinho de compras
  adicionarAoCarrinho(produto: any) {
    if (produto.quantidade <= 0) {
      alert('Produto sem estoque disponível!');
      return;
    }

    const itemNoCarrinho = this.carrinho.find(item => item.produtoId === produto.id);

    if (itemNoCarrinho) {
      if (itemNoCarrinho.quantidade < produto.quantidade) {
        itemNoCarrinho.quantidade++;
        itemNoCarrinho.subtotal = itemNoCarrinho.quantidade * itemNoCarrinho.valorUnitario;
      } else {
        alert('Limite de estoque atingido para este item no carrinho.');
      }
    } else {
      this.carrinho.push({
        produtoId: produto.id,
        nomeProduto: produto.nome,
        quantidade: 1,
        valorUnitario: produto.valorVenda,
        subtotal: produto.valorVenda
      });
    }
    this.calcularTotal();
  }

  // Remove um item específico do carrinho
  removerDoCarrinho(index: number) {
    this.carrinho.splice(index, 1);
    this.calcularTotal();
  }

  // Atualiza a quantidade de um item no carrinho com validação de estoque
  atualizarQuantidade(index: number, novaQtd: number) {
    const item = this.carrinho[index];
    const produtoOriginal = this.produtos.find(p => p.id === item.produtoId);

    if (novaQtd <= 0) {
      this.removerDoCarrinho(index);
      return;
    }

    if (produtoOriginal && novaQtd <= produtoOriginal.quantidade) {
      item.quantidade = novaQtd;
      item.subtotal = item.quantidade * item.valorUnitario;
      this.calcularTotal();
    } else {
      alert('Quantidade solicitada excede o estoque disponível.');
    }
  }

  // Calcula o valor total da venda
  calcularTotal() {
    this.total = this.carrinho.reduce((acc, item) => acc + item.subtotal, 0);
  }

  // Req 3 — chama impressão após venda
  private imprimirPedido(venda: any, vendaId: string) {
    const payload = {
      numeroPedido: vendaId.substring(0, 8).toUpperCase(),
      nomeCliente: this.nomeCliente || undefined,
      itens: this.carrinho,
      total: this.total,
      formaPagamento: this.formaPagamento,
      qrCodePix: '00020101021126330014br.gov.bcb.pix0111489915878525204000053039865802BR5922GABRIELLE ANTUNES DANA6009SAO PAULO622905251KMRPAKZA4R6M86GX5R2CZ6X16304417B'
    };

    this.http.post(`${this.baseUrl}/imprimir-pedido`, payload).subscribe({
      next: () => console.log('✅ Impresso com sucesso'),
      error: (err) => console.warn('⚠️ Impressão falhou:', err.message)
    });
  }


  // Finaliza a venda (Normal ou Fiado)
   // Req 1 + 2 + 3 — finaliza venda normal
  finalizarVenda() {
    if (this.carrinho.length === 0) {
      alert('Adicione pelo menos um produto ao carrinho.');
      return;
    }

    if (this.formaPagamento === 'fiado') {
      this.finalizarFiado();
      return;
    }

    // Req 1 — nome do cliente opcional para venda normal
    const venda = {
      itens: this.carrinho,
      total: this.total,
      formaPagamento: this.formaPagamento,
      nomeCliente: this.nomeCliente || undefined
    };

    this.http.post<any>(this.vendasUrl, venda).subscribe({
      next: (res) => {
        // Req 3 — imprime ao finalizar
        this.imprimirPedido(venda, res.data?.id || 'SN');
        alert('Venda finalizada com sucesso!');
        this.limparVenda();
        this.carregarProdutos();
      },
      error: (err) => {
        console.error('Erro na venda:', err);
        alert('Erro ao processar venda. Verifique a conexão.');
      }
    });
  }

  // Lógica específica para registrar venda fiado
  finalizarFiado() {
    if (!this.nomeCliente || this.nomeCliente.trim() === '') {
      alert('Para vendas fiado, o nome do cliente é obrigatório.');
      return;
    }

    const fiado = {
      nomeBuyer: this.nomeCliente,
      itens: this.carrinho,
      total: this.total
    };

    this.http.post<any>(this.fiadosUrl, fiado).subscribe({
      next: (res) => {
        // Req 3 — imprime ao registrar fiado também
        this.imprimirPedido(fiado, res.data?.id || 'SN');
        alert('Venda fiado registrada com sucesso!');
        this.limparVenda();
        this.carregarProdutos();
      },
      error: (err) => {
        console.error('Erro no fiado:', err);
        alert('Erro ao registrar fiado.');
      }
    });
  }

  // Reseta os campos da tela após uma operação
  limparVenda() {
    this.carrinho = [];
    this.total = 0;
    this.nomeCliente = '';
    this.formaPagamento = 'dinheiro';
    this.filtro = '';
    this.produtosFiltrados = [...this.produtos];
  }
}
