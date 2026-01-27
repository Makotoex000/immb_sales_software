import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface VendaFiado {
  id: string;
  nomeBuyer: string;
  total: number;
  dataVenda: Date;
  status: 'aberto' | 'fechado';
  itens?: any[];
}

@Component({
  selector: 'app-fiado',
  imports: [CommonModule, FormsModule],
  templateUrl: './fiado.html',
  styleUrl: './fiado.css'
})
export class Fiado implements OnInit {
  fiados: VendaFiado[] = [];
  busca: string = '';
  modalAberto: boolean = false;
  fiadoSelecionado: VendaFiado | null = null;
  formaPagamentoFiado: 'dinheiro' | 'cartao' | 'pix' = 'dinheiro';
  mensagemSucesso: string = '';
  mensagemErro: string = '';
  carregando: boolean = false;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.carregarFiados();
  }

  carregarFiados(): void {
    this.carregando = true;
    this.apiService.obterTodosFiados().subscribe(
      (response: any) => {
        this.carregando = false;
        if (response.success) {
          this.fiados = (response.data || []).filter((f: any) => f.status === 'aberto');
        } else {
          this.mensagemErro = 'Erro ao carregar fiados';
        }
      },
      (error: any) => {
        this.carregando = false;
        console.error('Erro ao carregar fiados:', error);
        this.mensagemErro = 'Erro ao carregar fiados';
      }
    );
  }

  get fiadosFiltrados(): VendaFiado[] {
    if (!this.busca.trim()) {
      return this.fiados;
    }
    return this.fiados.filter(f =>
      f.nomeBuyer.toLowerCase().includes(this.busca.toLowerCase())
    );
  }

  abrirModalFecharConta(fiado: VendaFiado): void {
    this.fiadoSelecionado = fiado;
    this.formaPagamentoFiado = 'dinheiro';
    this.modalAberto = true;
  }

  fecharModal(): void {
    this.modalAberto = false;
    this.fiadoSelecionado = null;
  }

  confirmarFecharConta(): void {
    if (!this.fiadoSelecionado) {
      this.mensagemErro = 'Erro ao fechar conta';
      return;
    }

    this.carregando = true;

    this.apiService.fecharFiado(this.fiadoSelecionado.id, {
      formaPagamento: this.formaPagamentoFiado
    }).subscribe(
      (response: any) => {
        this.carregando = false;
        if (response.success) {
          this.mensagemSucesso = 'Conta fechada com sucesso!';
          this.fecharModal();

          setTimeout(() => {
            this.mensagemSucesso = '';
            this.carregarFiados();
          }, 2000);
        } else {
          this.mensagemErro = response.error || 'Erro ao fechar conta';
        }
      },
      (error: any) => {
        this.carregando = false;
        console.error('Erro ao fechar conta:', error);
        this.mensagemErro = 'Erro ao fechar conta. Tente novamente.';
      }
    );
  }
}
