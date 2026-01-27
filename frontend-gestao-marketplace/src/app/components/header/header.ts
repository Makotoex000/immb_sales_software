import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  @Output() navegacao = new EventEmitter<string>();
  paginaAtual: string = 'vendas';

  constructor(private authService: AuthService, private router: Router) {}

  navegarPara(pagina: string): void {
    this.paginaAtual = pagina;
    this.navegacao.emit(pagina);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
