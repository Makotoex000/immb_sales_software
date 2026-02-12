import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database';
import sql from 'mssql';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ProdutoServiceClass {
  // Auxiliar para mapear o que vem do Banco para o que o Angular espera
  private mapearParaFrontend(row: any) {
    if (!row) return null;
    return {
      ...row,
      preco: row.valorVenda, // Traduz valorVenda -> preco
      estoque: row.quantidade // Traduz quantidade -> estoque
    };
  }

  async obterProdutos(): Promise<any[]> {
    return this.obterTodosProdutos();
  }

  async obterTodosProdutos(): Promise<any[]> {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Produtos ORDER BY nome');
    return result.recordset.map(row => this.mapearParaFrontend(row));
  }

  async obterProdutosAtivos(): Promise<any[]> {
    const pool = getPool();
    const result = await pool.request().query('SELECT * FROM Produtos WHERE ativo = 1 AND quantidade > 0 ORDER BY nome');
    return result.recordset.map(row => this.mapearParaFrontend(row));
  }

  async obterProdutoPorId(id: string): Promise<any | null> {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar(50), id)
      .query('SELECT * FROM Produtos WHERE id = @id');
    return this.mapearParaFrontend(result.recordset[0]);
  }

  async criarProduto(dto: any): Promise<any> {
    const pool = getPool();
    const id = uuidv4();
    const agora = new Date();
    
    // TRADUÇÃO: Pega o que vem do Angular e prepara para o Banco
    const nome = dto.nome || 'Novo Produto';
    const valorVenda = dto.preco || dto.valorVenda || 0;
    const valorCompra = dto.valorCompra || (valorVenda * 0.7);
    const quantidade = dto.estoque || dto.quantidade || 0;
    const categoria = dto.categoria || 'Geral';
    const descricao = dto.descricao || '';

    await pool.request()
      .input('id', sql.NVarChar(50), id)
      .input('nome', sql.NVarChar(100), nome)
      .input('valorCompra', sql.Decimal(10, 2), valorCompra)
      .input('valorVenda', sql.Decimal(10, 2), valorVenda)
      .input('quantidade', sql.Int, quantidade)
      .input('descricao', sql.NVarChar(sql.MAX), descricao)
      .input('categoria', sql.NVarChar(50), categoria)
      .input('ativo', sql.Bit, 1)
      .input('dataCriacao', sql.DateTime, agora)
      .input('dataAtualizacao', sql.DateTime, agora)
      .query(`INSERT INTO Produtos (id, nome, valorCompra, valorVenda, quantidade, descricao, categoria, ativo, dataCriacao, dataAtualizacao) 
              VALUES (@id, @nome, @valorCompra, @valorVenda, @quantidade, @descricao, @categoria, @ativo, @dataCriacao, @dataAtualizacao)`);
    
    return this.obterProdutoPorId(id);
  }

      async atualizarProduto(id: string, dto: any): Promise<any | null> {
    const pool = getPool();
    
    console.log('--- DADOS RECEBIDOS DO ANGULAR ---');
    console.log(JSON.stringify(dto, null, 2));
    console.log('----------------------------------');

    const produtoAtual = await this.obterProdutoPorId(id);
    if (!produtoAtual) return null;

    // Usamos nomes diferentes para as variáveis locais para evitar o erro de "redeclare"
    const novoNome = dto.nome ?? produtoAtual.nome;
    const novoValorVenda = dto.valorVenda ?? dto.preco ?? produtoAtual.preco;
    const novaQuantidade = dto.quantidade ?? dto.estoque ?? produtoAtual.estoque;
    const novoValorCompra = dto.valorCompra ?? produtoAtual.valorCompra;
    const novaCategoria = dto.categoria ?? produtoAtual.categoria;
    const novaDescricao = dto.descricao ?? produtoAtual.descricao;
    const novoAtivo = dto.ativo !== undefined ? dto.ativo : produtoAtual.ativo;

    try {
      await pool.request()
        .input('id', sql.NVarChar(50), id)
        .input('nome', sql.NVarChar(100), novoNome)
        .input('valorCompra', sql.Decimal(10, 2), novoValorCompra)
        .input('valorVenda', sql.Decimal(10, 2), novoValorVenda)
        .input('quantidade', sql.Int, novaQuantidade)
        .input('descricao', sql.NVarChar(sql.MAX), novaDescricao)
        .input('categoria', sql.NVarChar(50), novaCategoria)
        .input('ativo', sql.Bit, novoAtivo)
        .input('dataAtualizacao', sql.DateTime, new Date())
        .query(`UPDATE Produtos SET 
                  nome = @nome, 
                  valorCompra = @valorCompra, 
                  valorVenda = @valorVenda, 
                  quantidade = @quantidade, 
                  descricao = @descricao, 
                  categoria = @categoria, 
                  ativo = @ativo, 
                  dataAtualizacao = @dataAtualizacao 
                WHERE id = @id`);
      
      console.log('Produto atualizado com sucesso!');
      return this.obterProdutoPorId(id);
    } catch (error: any) {
      console.error('ERRO NO SQL AO ATUALIZAR:', error.message);
      throw error;
    }
  }


  async decrementarEstoque(id: string, qtd: number): Promise<void> {
    const pool = getPool();
    await pool.request().input('id', sql.NVarChar(50), id).input('qtd', sql.Int, qtd)
      .query('UPDATE Produtos SET quantidade = quantidade - @qtd WHERE id = @id');
  }

  async incrementarEstoque(id: string, qtd: number): Promise<void> {
    const pool = getPool();
    await pool.request().input('id', sql.NVarChar(50), id).input('qtd', sql.Int, qtd)
      .query('UPDATE Produtos SET quantidade = quantidade + @qtd WHERE id = @id');
  }

  async ativarProduto(id: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request().input('id', sql.NVarChar(50), id).query('UPDATE Produtos SET ativo = 1 WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }

  async desativarProduto(id: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request().input('id', sql.NVarChar(50), id).query('UPDATE Produtos SET ativo = 0 WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }

  async deletarProduto(id: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request().input('id', sql.NVarChar(50), id).query('DELETE FROM Produtos WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }
}

export const produtoService = new ProdutoServiceClass();
