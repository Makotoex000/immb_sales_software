import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-gerenciar-produtos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 20px; border: 5px solid blue; background: white;">
      <h1>🚀 Teste de Gerenciamento de Produtos</h1>
      <p>Status da API: {{ mensagemStatus }}</p>
      <hr>
      <div *ngFor="let p of produtos" style="border: 1px solid #ccc; margin: 10px; padding: 10px;">
        <h3>{{ p.nome }}</h3>
        <p>Preço: R$ {{ p.valorVenda }} | Estoque: {{ p.quantidade }}</p>
      </div>
    </div>
  `
} )
export class GerenciarProdutosComponent implements OnInit {
  produtos: any[] = [];
  mensagemStatus = 'Carregando...';
  private http = inject(HttpClient );

  ngOnInit() {
    console.log('Componente de Teste Inicializado!');
    this.http.get<any>('http://localhost:3000/api/produtos' ).subscribe({
      next: (res) => {
        this.produtos = res.data || res;
        this.mensagemStatus = 'Dados carregados com sucesso!';
        console.log('Dados no Teste:', res);
      },
      error: (err) => {
        this.mensagemStatus = 'Erro ao conectar com o Backend';
        console.error(err);
      }
    });
  }
}
