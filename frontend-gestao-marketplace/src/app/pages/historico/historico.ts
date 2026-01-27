import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Venda {
  id: string;
  total: number;
  formaPagamento: string;
  dataVenda: string;
  status: string;
  itens?: any[];
}

@Component({
  selector: 'app-historico',
  imports: [CommonModule, FormsModule],
  templateUrl: './historico.html',
  styleUrl: './historico.css'
})
export class Historico implements OnInit {
  vendas: Venda[] = [];
  dataFiltro: string = '';
  mensagemSucesso: string = '';
  mensagemErro: string = '';
  carregando: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarVendas();
  }

  carregarVendas(): void {
    this.carregando = true;
    this.apiService.obterTodasVendas().subscribe(
      (response: any) => {
        this.carregando = false;
        if (response.success) {
          this.vendas = response.data || [];
        } else {
          this.mensagemErro = 'Erro ao carregar vendas';
        }
      },
      (error: any) => {
        this.carregando = false;
        console.error('Erro ao carregar vendas:', error);
        this.mensagemErro = 'Erro ao carregar vendas';
      }
    );
  }

  get vendasFiltradas(): Venda[] {
    if (!this.dataFiltro) {
      return this.vendas;
    }
    return this.vendas.filter(v => v.dataVenda.split('T')[0] === this.dataFiltro);
  }

  get totalVendido(): number {
    return this.vendasFiltradas.reduce((sum, v) => sum + v.total, 0);
  }

  get vendaNormaisCount(): number {
    return this.vendasFiltradas.filter(v => v.formaPagamento !== 'fiado').length;
  }

  get vendaFiadoCount(): number {
    return this.vendasFiltradas.filter(v => v.formaPagamento === 'fiado').length;
  }

  limparFiltro(): void {
    this.dataFiltro = '';
  }

  desfazerVenda(id: string): void {
    if (confirm('Tem certeza que deseja desfazer esta venda? Os produtos serão devolvidos ao estoque.')) {
      this.carregando = true;

      this.apiService.desfazerVenda(id).subscribe(
        (response: any) => {
          this.carregando = false;
          if (response.success) {
            this.mensagemSucesso = 'Venda desfeita com sucesso!';
            setTimeout(() => {
              this.mensagemSucesso = '';
              this.carregarVendas();
            }, 2000);
          } else {
            this.mensagemErro = response.error || 'Erro ao desfazer venda';
          }
        },
        (error: any) => {
          this.carregando = false;
          console.error('Erro ao desfazer venda:', error);
          this.mensagemErro = 'Erro ao desfazer venda. Tente novamente.';
        }
      );
    }
  }

  deletarVenda(id: string): void {
    if (confirm('Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.')) {
      this.carregando = true;

      this.apiService.deletarVenda(id).subscribe(
        (response: any) => {
          this.carregando = false;
          if (response.success) {
            this.mensagemSucesso = 'Venda excluída com sucesso!';
            setTimeout(() => {
              this.mensagemSucesso = '';
              this.carregarVendas();
            }, 2000);
          } else {
            this.mensagemErro = response.error || 'Erro ao excluir venda';
          }
        },
        (error: any) => {
          this.carregando = false;
          console.error('Erro ao excluir venda:', error);
          this.mensagemErro = 'Erro ao excluir venda. Tente novamente.';
        }
      );
    }
  }
}
