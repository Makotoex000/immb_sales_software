import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email: string = '';
  senha: string = '';
  erroLogin: string = '';
  carregando: boolean = false;

  constructor(private authService: AuthService, private router: Router) {
    // Se já está logado, redireciona para dashboard
    if (this.authService.estaLogado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  fazerLogin(): void {
    if (!this.email || !this.senha) {
      this.erroLogin = 'Por favor, preencha todos os campos';
      return;
    }

    this.carregando = true;
    this.erroLogin = '';

    this.authService.login(this.email, this.senha).subscribe({
      next: (sucesso) => {
        this.carregando = false;
        if (sucesso) {
          this.router.navigate(['/dashboard']);
        } else {
          this.erroLogin = 'E-mail ou senha inválidos';
        }
      },
      error: () => {
        this.carregando = false;
        this.erroLogin = 'Erro ao fazer login. Tente novamente.';
      }
    });
  }
}
