import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Venda {
  id: string;
  total: number;
  formaPagamento: string;
  dataVenda: string;
  itens: any[];
}

interface ResumoProduto {
  produtoId: string;
  nomeProduto: string;
  quantidadeVendida: number;
  valorUnitario: number;
  valorTotalVenda: number;
  totalCusto: number;
  lucro: number;
}

@Component({
  selector: 'app-fechamento',
  imports: [CommonModule, FormsModule],
  templateUrl: './fechamento.html',
  styleUrl: './fechamento.css'
})
export class Fechamento implements OnInit {
  dataFechamento: string = new Date().toISOString().split('T')[0];
  vendasDoDia: Venda[] = [];
  resumoProdutos: ResumoProduto[] = [];
  modalConfirmacao: boolean = false;
  mensagemSucesso: string = '';
  mensagemErro: string = '';
  carregando: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarVendas();
  }

  carregarVendas(): void {
    this.carregando = true;
    this.mensagemErro = '';
    
    // Carregar TODAS as vendas (sem filtro de data)
    this.apiService.obterTodasVendas().subscribe(
      (response: any) => {
        this.carregando = false;
        console.log('✅ Resposta recebida:', response);
        
        if (response.success) {
          this.vendasDoDia = response.data || [];
          console.log('📊 Total de vendas:', this.vendasDoDia.length);
          this.calcularResumo();
        } else {
          console.error('❌ Erro na resposta:', response.error);
          this.mensagemErro = response.error || 'Erro ao carregar vendas';
        }
      },
      (error: any) => {
        this.carregando = false;
        console.error('❌ Erro HTTP ao carregar vendas:', error);
        this.mensagemErro = 'Erro ao carregar vendas';
      }
    );
  }

  calcularResumo(): void {
    this.resumoProdutos = [];
    const mapaResumo: { [key: string]: ResumoProduto } = {};

    this.vendasDoDia.forEach(venda => {
      if (venda.itens) {
        venda.itens.forEach((item: any) => {
          if (!mapaResumo[item.produtoId]) {
            mapaResumo[item.produtoId] = {
              produtoId: item.produtoId,
              nomeProduto: item.nomeProduto,
              quantidadeVendida: 0,
              valorUnitario: item.valorUnitario,
              valorTotalVenda: 0,
              totalCusto: 0,
              lucro: 0
            };
          }

          mapaResumo[item.produtoId].quantidadeVendida += item.quantidade;
          mapaResumo[item.produtoId].valorTotalVenda += item.subtotal;
          mapaResumo[item.produtoId].totalCusto += item.valorUnitario * item.quantidade * 0.5;
          mapaResumo[item.produtoId].lucro = mapaResumo[item.produtoId].valorTotalVenda - mapaResumo[item.produtoId].totalCusto;
        });
      }
    });

    this.resumoProdutos = Object.values(mapaResumo);
  }

  get totalVendido(): number {
    return this.resumoProdutos.reduce((sum, r) => sum + r.valorTotalVenda, 0);
  }

  get totalCusto(): number {
    return this.resumoProdutos.reduce((sum, r) => sum + r.totalCusto, 0);
  }

  get lucroTotal(): number {
    return this.totalVendido - this.totalCusto;
  }

  confirmarFechamento(): void {
    if (this.vendasDoDia.length === 0) {
      this.mensagemErro = 'Não há vendas para fechar';
      return;
    }
    this.modalConfirmacao = true;
  }

  cancelarFechamento(): void {
    this.modalConfirmacao = false;
  }

  executarFechamento(): void {
    this.carregando = true;

    const relatorio = {
      dataCaixa: this.dataFechamento,
      totalVendas: this.vendasDoDia.length,
      lucroTotal: this.lucroTotal,
      resumoProdutos: this.resumoProdutos
    };

    // Passo 1: Criar relatório
    this.apiService.criarRelatorio(relatorio).subscribe(
      (response: any) => {
        if (response.success) {
          console.log('✅ Relatório criado com sucesso');
          
          // Passo 2: Deletar todas as vendas
          this.deletarTodasVendas();
        } else {
          this.carregando = false;
          this.mensagemErro = response.error || 'Erro ao fechar caixa';
        }
      },
      (error: any) => {
        this.carregando = false;
        console.error('Erro ao criar relatório:', error);
        this.mensagemErro = 'Erro ao fechar caixa';
      }
    );
  }

  deletarTodasVendas(): void {
    // Deletar cada venda uma por uma
    let deletadas = 0;
    const totalVendas = this.vendasDoDia.length;

    this.vendasDoDia.forEach(venda => {
      this.apiService.deletarVenda(venda.id).subscribe(
        (response: any) => {
          deletadas++;
          console.log(`🗑️  Venda ${deletadas}/${totalVendas} deletada`);

          // Quando todas as vendas forem deletadas
          if (deletadas === totalVendas) {
            this.carregando = false;
            this.mensagemSucesso = 'Caixa fechado com sucesso!';
            this.modalConfirmacao = false;

            setTimeout(() => {
              this.mensagemSucesso = '';
              this.dataFechamento = new Date().toISOString().split('T')[0];
              this.carregarVendas();
            }, 2000);
          }
        },
        (error: any) => {
          console.error('Erro ao deletar venda:', error);
          deletadas++;

          if (deletadas === totalVendas) {
            this.carregando = false;
            this.mensagemErro = 'Caixa fechado, mas houve erro ao deletar algumas vendas';
          }
        }
      );
    });
  }
}