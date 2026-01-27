import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-novo-produto',
  imports: [CommonModule, FormsModule],
  templateUrl: './novo-produto.html',
  styleUrl: './novo-produto.css'
})
export class NovoProduto {
  @Output() produtoAdicionado = new EventEmitter<any>();
  @Output() cancelado = new EventEmitter<void>();

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

  constructor(private apiService: ApiService) {}

  onImagemSelecionada(event: any): void {
    const arquivo = event.target.files[0];
    if (arquivo) {
      const leitor = new FileReader();
      leitor.onload = (e: any) => {
        this.formulario.imagem = e.target.result;
      };
      leitor.readAsDataURL(arquivo);
    }
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
          this.produtoAdicionado.emit(response.data);

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
    this.cancelado.emit();
  }
}
