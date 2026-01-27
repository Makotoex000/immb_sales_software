import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../components/header/header';
import { Vendas } from '../vendas/vendas';
import { NovoProduto } from '../novo-produto/novo-produto';
import { Fiado } from '../fiado/fiado';
import { Historico } from '../historico/historico';
import { Fechamento } from '../fechamento/fechamento';
import { Gerenciamento } from '../gerenciamento/gerenciamento';

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    Header,
    Vendas,
    NovoProduto,
    Fiado,
    Historico,
    Fechamento,
    Gerenciamento
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  paginaAtual: string = 'vendas';

  mudarPagina(pagina: string): void {
    this.paginaAtual = pagina;
  }

  onProdutoAdicionado(): void {
    this.paginaAtual = 'vendas';
  }
}
