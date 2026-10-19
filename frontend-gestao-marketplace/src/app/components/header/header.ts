import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  // Itens do menu lateral; o destacado é o da rota atual. "icone" são os traços (path) de um SVG 24x24.
  readonly paginas = [
    { rota: '/vendas', nome: 'Vendas', icone: ['M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2', 'M9 19.5a.5.5 0 1 0 0 .01', 'M17 19.5a.5.5 0 1 0 0 .01'] },
    { rota: '/produtos', nome: 'Produtos', icone: ['M21 8 12 3 3 8v8l9 5 9-5z', 'M3 8l9 5 9-5', 'M12 13v8'] },
    { rota: '/fiado', nome: 'Fiado', icone: ['M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z', 'M14 3v5h5', 'M9 13h6', 'M9 17h4'] },
    { rota: '/historico', nome: 'Histórico', icone: ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5', 'M12 7v5l3 2'] },
    { rota: '/fechamento', nome: 'Fechamento', icone: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'] },
    { rota: '/gerenciamento', nome: 'Gerenciamento', icone: ['M4 5h16', 'M4 12h16', 'M4 19h16', 'M8 3v4', 'M16 10v4', 'M10 17v4'] },
  ];

  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
