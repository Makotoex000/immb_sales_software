import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { ImagemUrlPipe } from '../../pipes/imagem-url.pipe';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ImagemUrlPipe],
  templateUrl: './products.html',
  styleUrl: './products.css'
} )
export class Products implements OnInit {
  produtos: any[] = [];
  apiUrl = 'http://localhost:3000/api/produtos';
  private http = inject(HttpClient );
  private apiService = inject(ApiService);
  enviandoImagem = false;
  exibirModal = false;
  produtoSelecionado: any = { nome: '', valorVenda: 0, quantidade: 0, imagem: '' };

  ngOnInit() { this.carregarProdutos(); }

  carregarProdutos() {
    this.http.get<any>(this.apiUrl ).subscribe({
      next: (res) => {
        this.produtos = res.data || res;
      },
      error: (err) => console.error(err)
    });
  }

  abrirModalEditar(p: any) {
    this.produtoSelecionado = { ...p };
    this.exibirModal = true;
  }

  fecharModal() { this.exibirModal = false; }

  // Envia a nova imagem; ela só substitui a antiga ao salvar o produto
  onImagemSelecionada(event: any) {
    const arquivo: File = event.target.files[0];
    event.target.value = '';
    if (!arquivo) return;

    this.enviandoImagem = true;
    this.apiService.uploadImagem(arquivo).subscribe({
      next: (res: any) => {
        this.enviandoImagem = false;
        this.produtoSelecionado.imagem = res.data.url;
      },
      error: (err) => {
        this.enviandoImagem = false;
        alert(err.error?.error || 'Erro ao enviar a imagem.');
      }
    });
  }

  salvarProduto() {
    if (this.enviandoImagem) {
      alert('Aguarde o envio da imagem terminar.');
      return;
    }
    this.http.put(`${this.apiUrl}/${this.produtoSelecionado.id}`, this.produtoSelecionado ).subscribe({
      next: () => { this.carregarProdutos(); this.fecharModal(); }
    });
  }

  excluirProduto(id: string) {
  if (confirm('Tem certeza que deseja excluir este produto permanentemente?')) {
    console.log('Tentando excluir produto ID:', id);
    
    // Usando o IP 127.0.0.1 para consistência com o que funcionou antes
    this.http.delete(`http://127.0.0.1:3000/api/produtos/${id}` ).subscribe({
      next: (res: any) => {
        console.log('Produto excluído com sucesso:', res);
        alert('Produto removido!');
        this.carregarProdutos(); // Recarrega a lista
      },
      error: (err) => {
        console.error('Erro ao excluir produto:', err);
        alert('Erro ao excluir: ' + (err.error?.error || 'Erro de conexão'));
      }
    });
  }
}


  reabastecer(p: any) {
    const qtd = prompt(`Adicionar estoque para: ${p.nome}`);
    if (qtd && !isNaN(Number(qtd))) {
      this.http.put(`${this.apiUrl}/${p.id}`, { ...p, quantidade: Number(p.quantidade ) + Number(qtd) }).subscribe({
        next: () => this.carregarProdutos()
      });
    }
  }
}
