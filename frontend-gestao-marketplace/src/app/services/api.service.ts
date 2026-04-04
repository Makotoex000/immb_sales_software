import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Produtos
  criarProduto(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/produtos`, data);
  }

  obterTodosProdutos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/produtos`);
  }

  obterProdutosAtivos(): Observable<any> {
    return this.http.get(`${this.apiUrl}/produtos/ativos`);
  }

  obterProdutoPorId(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/produtos/${id}`);
  }

  atualizarProduto(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/produtos/${id}`, data);
  }

  desativarProduto(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/produtos/${id}/desativar`, {});
  }

  ativarProduto(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/produtos/${id}/ativar`, {});
  }

  deletarProduto(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/produtos/${id}`);
  }

  // Vendas
  criarVenda(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/vendas`, data);
  }

  obterTodasVendas(): Observable<any> {
    return this.http.get(`${this.apiUrl}/vendas`);
  }

  obterVendaPorId(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/vendas/${id}`);
  }

  obterVendasPorData(data: Date | string): Observable<any> {
  let dataStr: string;
  
  if (typeof data === 'string') {
    dataStr = data;
  } else {
    dataStr = data.toISOString().split('T')[0];
  }
  
  console.log('🔗 Requisição: GET /vendas/data?data=' + dataStr);
  
  return this.http.get(`${this.apiUrl}/vendas/data`, { 
    params: { data: dataStr } 
  });
}

  desfazerVenda(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/vendas/${id}/desfazer`, {});
  }

  deletarVenda(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/vendas/${id}`);
  }

  // Fiados
  criarFiado(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fiados`, data);
  }

  obterTodosFiados(): Observable<any> {
    return this.http.get(`${this.apiUrl}/fiados`);
  }

  obterFiadoPorNome(nome: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/fiados/nome`, {
      params: { nome },
    });
  }

  obterFiadoPorId(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/fiados/${id}`);
  }

  adicionarItensAoFiado(id: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/fiados/${id}/itens`, data);
  }

  fecharFiado(id: string, data: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/fiados/${id}/fechar`, data);
  }

  deletarFiado(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/fiados/${id}`);
  }

  // Relatórios
  criarRelatorio(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/relatorios`, data);
  }

  obterTodosRelatorios(): Observable<any> {
    return this.http.get(`${this.apiUrl}/relatorios`);
  }

  obterRelatorioPorId(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/relatorios/${id}`);
  }

  obterRelatorioPorData(data: Date): Observable<any> {
    return this.http.get(`${this.apiUrl}/relatorios/data`, {
      params: { data: data.toISOString() },
    });
  }

  obterRelatorioPorPeriodo(dataInicio: Date, dataFim: Date): Observable<any> {
    return this.http.get(`${this.apiUrl}/relatorios/periodo`, {
      params: {
        dataInicio: dataInicio.toISOString(),
        dataFim: dataFim.toISOString(),
      },
    });
  }

  deletarRelatorios(dataInicio: Date, dataFim: Date): Observable<any> {
    return this.http.delete(`${this.apiUrl}/relatorios`, {
      body: {
        dataInicio,
        dataFim,
      },
    });
  }

  deletarRelatorio(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/relatorios/${id}`);
  }

  // Impressora
  imprimirPedido(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/imprimir-pedido`, data);
  }

  // Totais por método de pagamento
  getTotaisPorMetodo(dataInicio?: string, dataFim?: string): Observable<any> {
    const params: any = {};
    if (dataInicio) params['dataInicio'] = dataInicio;
    if (dataFim) params['dataFim'] = dataFim;
    return this.http.get(`${this.apiUrl}/vendas/totais-por-metodo`, { params });
  }

  // Fiados agrupados por nome
  getFiadosAgrupados(): Observable<any> {
    return this.http.get(`${this.apiUrl}/fiados/agrupados`);
  }
  
}
