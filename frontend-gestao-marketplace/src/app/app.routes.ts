import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Products } from './pages/products/products';
import { GerenciarProdutosComponent } from './pages/gerenciar-produtos/gerenciar-produtos';
import { Vendas } from './pages/vendas/vendas';
import { NovoProduto } from './pages/novo-produto/novo-produto';
import { Fiado } from './pages/fiado/fiado';
import { Historico } from './pages/historico/historico';
import { Fechamento } from './pages/fechamento/fechamento';
import { Gerenciamento } from './pages/gerenciamento/gerenciamento';

export const routes: Routes = [
  { path: 'teste-produtos', component: GerenciarProdutosComponent },

  // O Dashboard é o layout (header + conteúdo); cada tela tem sua própria URL
  {
    path: '',
    component: Dashboard,
    children: [
      { path: '', redirectTo: 'vendas', pathMatch: 'full' },
      { path: 'vendas', component: Vendas },
      { path: 'produtos', component: Products },
      { path: 'novo-produto', component: NovoProduto },
      { path: 'fiado', component: Fiado },
      { path: 'historico', component: Historico },
      { path: 'fechamento', component: Fechamento },
      { path: 'gerenciamento', component: Gerenciamento },
    ]
  },

  // Endereço antigo, mantido para links e favoritos que ainda apontem pra ele
  { path: 'dashboard', redirectTo: 'vendas', pathMatch: 'full' },
  { path: '**', redirectTo: 'vendas' }
];
