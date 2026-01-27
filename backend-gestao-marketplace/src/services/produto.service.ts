import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database';
import { Produto, CreateProdutoDTO, UpdateProdutoDTO } from '../types';

import sql from 'mssql';

class ProdutoServiceClass {
  async criarProduto(dto: CreateProdutoDTO): Promise<Produto> {
    const pool = getPool();
    const id = uuidv4();
    const agora = new Date();

    const result = await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .input('nome', sql.NVarChar(255), dto.nome)
      .input('valorCompra', sql.Decimal(10, 2), dto.valorCompra)
      .input('valorVenda', sql.Decimal(10, 2), dto.valorVenda)
      .input('quantidade', sql.Int, dto.quantidade)
      .input('descricao', sql.NVarChar(sql.MAX), dto.descricao || null)
      .input('imagem', sql.NVarChar(sql.MAX), dto.imagem || null)
      .input('ativo', sql.Bit, 1)
      .input('dataCriacao', sql.DateTime, agora)
      .query(`
        INSERT INTO Produtos (id, nome, valorCompra, valorVenda, quantidade, descricao, imagem, ativo, dataCriacao)
        VALUES (@id, @nome, @valorCompra, @valorVenda, @quantidade, @descricao, @imagem, @ativo, @dataCriacao)
      `);

    return {
      id,
      nome: dto.nome,
      valorCompra: dto.valorCompra,
      valorVenda: dto.valorVenda,
      quantidade: dto.quantidade,
      descricao: dto.descricao,
      imagem: dto.imagem,
      ativo: true,
      dataCriacao: agora,
      dataAtualizacao: agora,
    };
  }

  async obterTodosProdutos(): Promise<Produto[]> {
    const pool = getPool();

    const result = await pool.request().query(`
      SELECT * FROM Produtos ORDER BY dataCriacao DESC
    `);

    return result.recordset.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      valorCompra: row.valorCompra,
      valorVenda: row.valorVenda,
      quantidade: row.quantidade,
      descricao: row.descricao,
      imagem: row.imagem,
      ativo: row.ativo === 1,
      dataCriacao: row.dataCriacao,
      dataAtualizacao: row.dataAtualizacao,
    }));
  }

  async obterProdutosAtivos(): Promise<Produto[]> {
    const pool = getPool();

    const result = await pool.request().query(`
      SELECT * FROM Produtos WHERE ativo = 1 ORDER BY dataCriacao DESC
    `);

    return result.recordset.map((row: any) => ({
      id: row.id,
      nome: row.nome,
      valorCompra: row.valorCompra,
      valorVenda: row.valorVenda,
      quantidade: row.quantidade,
      descricao: row.descricao,
      imagem: row.imagem,
      ativo: row.ativo === 1,
      dataCriacao: row.dataCriacao,
      dataAtualizacao: row.dataAtualizacao,
    }));
  }

  async obterProdutoPorId(id: string): Promise<Produto | null> {
    const pool = getPool();

    const result = await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .query(`
        SELECT * FROM Produtos WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const row = result.recordset[0];

    return {
      id: row.id,
      nome: row.nome,
      valorCompra: row.valorCompra,
      valorVenda: row.valorVenda,
      quantidade: row.quantidade,
      descricao: row.descricao,
      imagem: row.imagem,
      ativo: row.ativo === 1,
      dataCriacao: row.dataCriacao,
      dataAtualizacao: row.dataAtualizacao,
    };
  }

  async atualizarProduto(id: string, dto: UpdateProdutoDTO): Promise<Produto | null> {
    const pool = getPool();

    const produto = await this.obterProdutoPorId(id);
    if (!produto) {
      return null;
    }

    await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .input('nome', sql.NVarChar(255), dto.nome || produto.nome)
      .input('valorCompra', sql.Decimal(10, 2), dto.valorCompra !== undefined ? dto.valorCompra : produto.valorCompra)
      .input('valorVenda', sql.Decimal(10, 2), dto.valorVenda !== undefined ? dto.valorVenda : produto.valorVenda)
      .input('quantidade', sql.Int, dto.quantidade !== undefined ? dto.quantidade : produto.quantidade)
      .input('descricao', sql.NVarChar(sql.MAX), dto.descricao || produto.descricao)
      .input('imagem', sql.NVarChar(sql.MAX), dto.imagem || produto.imagem)
      .input('ativo', sql.Bit, dto.ativo !== undefined ? (dto.ativo ? 1 : 0) : (produto.ativo ? 1 : 0))
      .query(`
        UPDATE Produtos SET nome = @nome, valorCompra = @valorCompra, valorVenda = @valorVenda, quantidade = @quantidade, descricao = @descricao, imagem = @imagem, ativo = @ativo WHERE id = @id
      `);

    return await this.obterProdutoPorId(id);
  }

  async desativarProduto(id: string): Promise<boolean> {
    const pool = getPool();

    const result = await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .query(`
        UPDATE Produtos SET ativo = 0 WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  async ativarProduto(id: string): Promise<boolean> {
    const pool = getPool();

    const result = await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .query(`
        UPDATE Produtos SET ativo = 1 WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  async deletarProduto(id: string): Promise<boolean> {
    const pool = getPool();

    const result = await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .query(`
        DELETE FROM Produtos WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  async decrementarEstoque(produtoId: string, quantidade: number): Promise<void> {
  const pool = getPool();
  
  await pool
    .request()
    .input('produtoId', sql.NVarChar(50), produtoId)
    .input('quantidade', sql.Int, quantidade)
    .query(`
      UPDATE Produtos 
      SET quantidade = quantidade - @quantidade
      WHERE id = @produtoId AND quantidade >= @quantidade
    `);
}

async incrementarEstoque(produtoId: string, quantidade: number): Promise<void> {
  const pool = getPool();
  
  await pool
    .request()
    .input('produtoId', sql.NVarChar(50), produtoId)
    .input('quantidade', sql.Int, quantidade)
    .query(`
      UPDATE Produtos 
      SET quantidade = quantidade + @quantidade
      WHERE id = @produtoId
    `);

}


}

export const produtoService = new ProdutoServiceClass();

