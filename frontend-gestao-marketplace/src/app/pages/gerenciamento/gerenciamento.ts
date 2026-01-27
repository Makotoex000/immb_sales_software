import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Relatorio {
  id: string;
  dataCaixa: string;
  totalVendas: number;
  lucroTotal: number;
  resumoProdutos: any[];
}

@Component({
  selector: 'app-gerenciamento',
  imports: [CommonModule, FormsModule],
  templateUrl: './gerenciamento.html',
  styleUrl: './gerenciamento.css'
})
export class Gerenciamento implements OnInit {
  dataSelecionada: string = new Date().toISOString().split('T')[0];
  relatorioAtual: Relatorio | null = null;
  todosRelatorios: Relatorio[] = [];
  modalDeletarAberto: boolean = false;
  dataInicioDeletar: string = '';
  dataFimDeletar: string = '';
  mensagemSucesso: string = '';
  mensagemErro: string = '';
  carregando: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarRelatorios();
  }

  carregarRelatorios(): void {
    this.carregando = true;
    
    // Carregar TODOS os relatórios (sem filtro de data)
    this.apiService.obterTodosRelatorios().subscribe(
      (response: any) => {
        this.carregando = false;
        if (response.success) {
          this.todosRelatorios = response.data || [];
          console.log('📊 Total de relatórios:', this.todosRelatorios.length);
          this.filtrarRelatorioPorData();
        } else {
          this.relatorioAtual = null;
          this.mensagemErro = 'Erro ao carregar relatórios';
        }
      },
      (error: any) => {
        this.carregando = false;
        console.error('Erro ao carregar relatórios:', error);
        this.relatorioAtual = null;
      }
    );
  }

  filtrarRelatorioPorData(): void {
    // Filtrar relatório pela data selecionada (mesmo método do histórico e fechamento)
    const relatoriosFiltrados = this.todosRelatorios.filter((r: any) => {
      const dataRelatorio = r.dataCaixa.split('T')[0];
      return dataRelatorio === this.dataSelecionada;
    });

    this.relatorioAtual = relatoriosFiltrados.length > 0 ? relatoriosFiltrados[0] : null;
    console.log('🔍 Relatórios para a data', this.dataSelecionada, ':', relatoriosFiltrados.length);
  }

  get totalVendido(): number {
    if (!this.relatorioAtual) return 0;
    return this.relatorioAtual.resumoProdutos.reduce((sum: number, r: any) => sum + r.valorTotalVenda, 0);
  }

  get totalCusto(): number {
    if (!this.relatorioAtual) return 0;
    return this.relatorioAtual.resumoProdutos.reduce((sum: number, r: any) => {
      return sum + (r.valorTotalVenda - r.lucro);
    }, 0);
  }

  exportarParaExcel(): void {
    if (!this.relatorioAtual) {
      this.mensagemErro = 'Nenhum relatório para exportar';
      return;
    }

    try {
      // Criar CSV
      let csv = 'RELATÓRIO DE VENDAS\n';
      csv += `Data: ${this.dataSelecionada}\n`;
      csv += `Total de Vendas: ${this.relatorioAtual.totalVendas}\n`;
      csv += `Total Vendido: R$ ${this.totalVendido.toFixed(2)}\n`;
      csv += `Total de Custo: R$ ${this.totalCusto.toFixed(2)}\n`;
      csv += `Lucro Total: R$ ${this.relatorioAtual.lucroTotal.toFixed(2)}\n\n`;

      csv += 'Produto,Quantidade Vendida,Total de Venda,Lucro\n';
      this.relatorioAtual.resumoProdutos.forEach((resumo: any) => {
        csv += `"${resumo.nomeProduto}",${resumo.quantidadeVendida},"R$ ${resumo.valorTotalVenda.toFixed(2)}","R$ ${resumo.lucro.toFixed(2)}"\n`;
      });

      // Criar blob e download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `relatorio_vendas_${this.dataSelecionada}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.mensagemSucesso = 'Relatório exportado com sucesso!';
      setTimeout(() => {
        this.mensagemSucesso = '';
      }, 2000);
    } catch (error) {
      this.mensagemErro = 'Erro ao exportar relatório. Tente novamente.';
    }
  }

  abrirModalDeletar(): void {
    this.modalDeletarAberto = true;
  }

  fecharModalDeletar(): void {
    this.modalDeletarAberto = false;
    this.dataInicioDeletar = '';
    this.dataFimDeletar = '';
  }

  executarDeletarRelatorios(): void {
    if (!this.dataInicioDeletar || !this.dataFimDeletar) {
      this.mensagemErro = 'Selecione ambas as datas';
      return;
    }

    if (this.dataInicioDeletar > this.dataFimDeletar) {
      this.mensagemErro = 'Data inicial não pode ser maior que data final';
      return;
    }

    if (confirm('Tem certeza que deseja deletar todos os relatórios neste período? Esta ação não pode ser desfeita.')) {
      this.carregando = true;

      this.apiService.deletarRelatorios(
        new Date(this.dataInicioDeletar),
        new Date(this.dataFimDeletar)
      ).subscribe(
        (response: any) => {
          this.carregando = false;
          if (response.success) {
            this.mensagemSucesso = 'Relatórios deletados com sucesso!';
            this.fecharModalDeletar();

            setTimeout(() => {
              this.mensagemSucesso = '';
              this.carregarRelatorios();
            }, 2000);
          } else {
            this.mensagemErro = response.error || 'Erro ao deletar relatórios';
          }
        },
        (error: any) => {
          this.carregando = false;
          console.error('Erro ao deletar relatórios:', error);
          this.mensagemErro = 'Erro ao deletar relatórios. Tente novamente.';
        }
      );
    }
  }
}