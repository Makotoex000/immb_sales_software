import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface VendaFiadoAgrupado {
  nomeBuyer: string;
  ids: string[];
  total: number;
  dataUltimaVenda: Date;
  itens?: any[];
}

@Component({
  selector: 'app-fiado',
  imports: [CommonModule, FormsModule],
  templateUrl: './fiado.html',
  styleUrl: './fiado.css'
})
export class Fiado implements OnInit {
  fiados: VendaFiadoAgrupado[] = [];
  busca: string = '';
  modalAberto: boolean = false;
  fiadoSelecionado: VendaFiadoAgrupado | null = null;
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
    this.apiService.getFiadosAgrupados().subscribe(
      (response: any) => {
        this.carregando = false;
        if (response.success) {
          this.fiados = response.data || [];
        } else {
          this.mensagemErro = 'Erro ao carregar fiados';
        }
      },
      (error: any) => {
        this.carregando = false;
        this.mensagemErro = 'Erro ao carregar fiados';
      }
    );
  }

  get fiadosFiltrados(): VendaFiadoAgrupado[] {
    if (!this.busca.trim()) return this.fiados;
    return this.fiados.filter(f =>
      f.nomeBuyer.toLowerCase().includes(this.busca.toLowerCase())
    );
  }

  abrirModalFecharConta(fiado: VendaFiadoAgrupado): void {
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
    const ids = this.fiadoSelecionado.ids;

    const fecharProximo = (index: number) => {
      if (index >= ids.length) {
        this.carregando = false;
        this.mensagemSucesso = 'Conta fechada com sucesso!';
        this.fecharModal();
        setTimeout(() => {
          this.mensagemSucesso = '';
          this.carregarFiados();
        }, 2000);
        return;
      }

      this.apiService.fecharFiado(ids[index], {
        formaPagamento: this.formaPagamentoFiado
      }).subscribe(
        () => fecharProximo(index + 1),
        (error: any) => {
          this.carregando = false;
          this.mensagemErro = 'Erro ao fechar conta. Tente novamente.';
        }
      );
    };

    fecharProximo(0);
  }
}