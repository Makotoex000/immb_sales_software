import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database';
import { Relatorio, CreateRelatorioDTO, ResumoProduto } from '../types';
import sql from 'mssql';

class RelatorioServiceClass {
  async criarRelatorio(dto: CreateRelatorioDTO): Promise<Relatorio> {
    const pool = getPool();
    const id = uuidv4();
    const agora = new Date();

    // Inserir relatório
    await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .input('dataCaixa', sql.DateTime, dto.dataCaixa)  
      .input('totalVendas', sql.Int, dto.totalVendas)
      .input('lucroTotal', sql.Decimal(10, 2), dto.lucroTotal)
      .input('dataCriacao', sql.DateTime, agora)
      .query(`
        INSERT INTO Relatorios (id, dataCaixa, totalVendas, lucroTotal, dataCriacao)
        VALUES (@id, @dataCaixa, @totalVendas, @lucroTotal, @dataCriacao)
      `);

    // Inserir resumo de produtos
    for (const resumo of dto.resumoProdutos) {
      const resumoId = uuidv4();
      await pool
        .request()
        .input('id', sql.NVarChar(50), resumoId)
        .input('relatorioId', sql.NVarChar(50), id)
        .input('produtoId', sql.NVarChar(50), resumo.produtoId)
        .input('nomeProduto', sql.NVarChar(255), resumo.nomeProduto)
        .input('quantidadeVendida', sql.Int, resumo.quantidadeVendida)
        .input('valorTotalVenda', sql.Decimal(10, 2), resumo.valorTotalVenda)
        .input('lucro', sql.Decimal(10, 2), resumo.lucro)
        .query(`
          INSERT INTO ResumoProdutosRelatorio (id, relatorioId, produtoId, nomeProduto, quantidadeVendida, valorTotalVenda, lucro)
          VALUES (@id, @relatorioId, @produtoId, @nomeProduto, @quantidadeVendida, @valorTotalVenda, @lucro)
        `);
    }

    return {
      id,
      dataCaixa: dto.dataCaixa,
      vendas: dto.vendas,
      totalVendas: dto.totalVendas,
      lucroTotal: dto.lucroTotal,
      resumoProdutos: dto.resumoProdutos,
      dataCriacao: agora,
    };
  }

  async obterTodosRelatorios(): Promise<Relatorio[]> {
    const pool = getPool();

    const result = await pool.request().query(`
      SELECT * FROM Relatorios ORDER BY dataCaixa DESC
    `);

    const relatorios: Relatorio[] = [];
    for (const row of result.recordset) {
      const resumoProdutos = await this.obterResumoProdutos(row.id);
      relatorios.push({
        id: row.id,
        dataCaixa: row.dataCaixa,
        vendas: [],
        totalVendas: row.totalVendas,
        lucroTotal: row.lucroTotal,
        resumoProdutos,
        dataCriacao: row.dataCriacao,
      });
    }

    return relatorios;
  }

  async obterRelatorioPorId(id: string): Promise<Relatorio | null> {
    const pool = getPool();

    const result = await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .query(`
        SELECT * FROM Relatorios WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const row = result.recordset[0];
    const resumoProdutos = await this.obterResumoProdutos(id);

    return {
      id: row.id,
      dataCaixa: row.dataCaixa,
      vendas: [],
      totalVendas: row.totalVendas,
      lucroTotal: row.lucroTotal,
      resumoProdutos,
      dataCriacao: row.dataCriacao,
    };
  }

  async obterRelatorioPorData(data: Date): Promise<Relatorio[]> {
    const pool = getPool();
    const dataInicio = new Date(data);
    dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(data);
    dataFim.setHours(23, 59, 59, 999);

    const result = await pool
      .request()
      .input('dataInicio', sql.DateTime, dataInicio)
      .input('dataFim', sql.DateTime, dataFim)
      .query(`
        SELECT * FROM Relatorios WHERE dataCaixa >= @dataInicio AND dataCaixa <= @dataFim ORDER BY dataCaixa DESC
      `);

    const relatorios: Relatorio[] = [];
    for (const row of result.recordset) {
      const resumoProdutos = await this.obterResumoProdutos(row.id);
      relatorios.push({
        id: row.id,
        dataCaixa: row.dataCaixa,
        vendas: [],
        totalVendas: row.totalVendas,
        lucroTotal: row.lucroTotal,
        resumoProdutos,
        dataCriacao: row.dataCriacao,
      });
    }

    return relatorios;
  }

  async obterRelatorioPorPeriodo(dataInicio: Date, dataFim: Date): Promise<Relatorio[]> {
    const pool = getPool();
    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    const result = await pool
      .request()
      .input('dataInicio', sql.DateTime, inicio)
      .input('dataFim', sql.DateTime, fim)
      .query(`
        SELECT * FROM Relatorios WHERE dataCaixa >= @dataInicio AND dataCaixa <= @dataFim ORDER BY dataCaixa DESC
      `);

    const relatorios: Relatorio[] = [];
    for (const row of result.recordset) {
      const resumoProdutos = await this.obterResumoProdutos(row.id);
      relatorios.push({
        id: row.id,
        dataCaixa: row.dataCaixa,
        vendas: [],
        totalVendas: row.totalVendas,
        lucroTotal: row.lucroTotal,
        resumoProdutos,
        dataCriacao: row.dataCriacao,
      });
    }

    return relatorios;
  }

  async deletarRelatorios(dataInicio: Date, dataFim: Date): Promise<number> {
    const pool = getPool();
    const inicio = new Date(dataInicio);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(dataFim);
    fim.setHours(23, 59, 59, 999);

    // Obter IDs dos relatórios a deletar
    const selectResult = await pool
      .request()
      .input('dataInicio', sql.DateTime, inicio)
      .input('dataFim', sql.DateTime, fim)
      .query(`
        SELECT id FROM Relatorios WHERE dataCaixa >= @dataInicio AND dataCaixa <= @dataFim
      `);

    const ids = selectResult.recordset.map((row: any) => row.id);

    if (ids.length === 0) {
      return 0;
    }

    // Deletar resumos de produtos
    for (const id of ids) {
      await pool
        .request()
        .input('relatorioId', sql.NVarChar(50), id)
        .query(`
          DELETE FROM ResumoProdutosRelatorio WHERE relatorioId = @relatorioId
        `);
    }

    // Deletar relatórios
    const result = await pool
      .request()
      .input('dataInicio', sql.DateTime, inicio)
      .input('dataFim', sql.DateTime, fim)
      .query(`
        DELETE FROM Relatorios WHERE dataCaixa >= @dataInicio AND dataCaixa <= @dataFim
      `);

    return result.rowsAffected[0];
  }

  async deletarRelatorio(id: string): Promise<boolean> {
    const pool = getPool();

    // Deletar resumos de produtos
    await pool
      .request()
      .input('relatorioId', sql.NVarChar(50), id)
      .query(`
        DELETE FROM ResumoProdutosRelatorio WHERE relatorioId = @relatorioId
      `);

    // Deletar relatório
    const result = await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .query(`
        DELETE FROM Relatorios WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  private async obterResumoProdutos(relatorioId: string): Promise<ResumoProduto[]> {
    const pool = getPool();

    const result = await pool
      .request()
      .input('relatorioId', sql.NVarChar(50), relatorioId)
      .query(`
        SELECT * FROM ResumoProdutosRelatorio WHERE relatorioId = @relatorioId
      `);

    return result.recordset.map((row: any) => ({
      produtoId: row.produtoId,
      nomeProduto: row.nomeProduto,
      quantidadeVendida: row.quantidadeVendida,
      valorTotalVenda: row.valorTotalVenda,
      lucro: row.lucro,
    }));
  }
}

export const relatorioService = new RelatorioServiceClass();