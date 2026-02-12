import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { Products } from './pages/products/products';
import { GerenciarProdutosComponent } from './pages/gerenciar-produtos/gerenciar-produtos'; 


export const routes: Routes = [
  { path: 'teste-produtos', component: GerenciarProdutosComponent },
  { path: 'produtos', component: GerenciarProdutosComponent },
  { path: 'produtos', component: Products },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard },
  { path: '**', redirectTo: '/dashboard' }

];
