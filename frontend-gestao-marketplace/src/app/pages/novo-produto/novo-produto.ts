import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ImagemUrlPipe } from '../../pipes/imagem-url.pipe';

@Component({
  selector: 'app-novo-produto',
  imports: [CommonModule, FormsModule, ImagemUrlPipe],
  templateUrl: './novo-produto.html',
  styleUrl: './novo-produto.css'
})
export class NovoProduto {
  formulario = {
    nome: '',
    valorCompra: 0,
    valorVenda: 0,
    quantidade: 0,
    descricao: '',
    imagem: ''
  };

  mensagemSucesso: string = '';
  mensagemErro: string = '';
  carregando: boolean = false;
  enviandoImagem: boolean = false;

  constructor(private apiService: ApiService, private router: Router) {}

  onImagemSelecionada(event: any): void {
    const arquivo = event.target.files[0];
    event.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (arquivo) this.enviarImagem(arquivo);
  }

  onImagemArrastada(event: DragEvent): void {
    event.preventDefault();
    const arquivo = event.dataTransfer?.files[0];
    if (arquivo) this.enviarImagem(arquivo);
  }

  // Envia o arquivo ao backend; o produto guarda só o caminho devolvido (/uploads/...)
  private enviarImagem(arquivo: File): void {
    if (!arquivo.type.startsWith('image/')) {
      this.mensagemErro = 'Selecione um arquivo de imagem (JPG, PNG, WEBP ou GIF).';
      return;
    }

    this.mensagemErro = '';
    this.enviandoImagem = true;
    this.apiService.uploadImagem(arquivo).subscribe({
      next: (response: any) => {
        this.enviandoImagem = false;
        this.formulario.imagem = response.data.url;
      },
      error: (err: any) => {
        this.enviandoImagem = false;
        this.mensagemErro = err.error?.error || 'Erro ao enviar a imagem. Tente novamente.';
      }
    });
  }

  removerImagem(): void {
    this.formulario.imagem = '';
  }

  salvarProduto(): void {
    // Validações
    if (!this.formulario.nome.trim()) {
      this.mensagemErro = 'Nome do produto é obrigatório';
      return;
    }

    if (this.formulario.valorCompra <= 0) {
      this.mensagemErro = 'Valor de compra deve ser maior que 0';
      return;
    }

    if (this.formulario.valorVenda <= 0) {
      this.mensagemErro = 'Valor de venda deve ser maior que 0';
      return;
    }

    if (this.formulario.quantidade < 0) {
      this.mensagemErro = 'Quantidade não pode ser negativa';
      return;
    }

    if (this.enviandoImagem) {
      this.mensagemErro = 'Aguarde o envio da imagem terminar.';
      return;
    }

    this.mensagemErro = '';
    this.carregando = true;

    const novoProduto = {
      nome: this.formulario.nome,
      valorCompra: this.formulario.valorCompra,
      valorVenda: this.formulario.valorVenda,
      quantidade: this.formulario.quantidade,
      descricao: this.formulario.descricao || undefined,
      imagem: this.formulario.imagem || undefined
    };

    this.apiService.criarProduto(novoProduto).subscribe(
      (response: any) => {
        this.carregando = false;
        if (response.success) {
          this.mensagemSucesso = 'Produto adicionado com sucesso!';
          this.router.navigate(['/vendas']);

          // Limpar formulário
          setTimeout(() => {
            this.formulario = {
              nome: '',
              valorCompra: 0,
              valorVenda: 0,
              quantidade: 0,
              descricao: '',
              imagem: ''
            };
            this.mensagemSucesso = '';
          }, 2000);
        } else {
          this.mensagemErro = response.error || 'Erro ao adicionar produto';
        }
      },
      (error: any) => {
        this.carregando = false;
        console.error('Erro ao criar produto:', error);
        this.mensagemErro = 'Erro ao adicionar produto. Tente novamente.';
      }
    );
  }

  cancelar(): void {
    this.formulario = {
      nome: '',
      valorCompra: 0,
      valorVenda: 0,
      quantidade: 0,
      descricao: '',
      imagem: ''
    };
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.router.navigate(['/vendas']);
  }
}
