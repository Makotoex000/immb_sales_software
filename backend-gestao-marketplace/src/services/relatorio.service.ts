import { getPool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import sql from 'mssql';

class RelatorioServiceClass {
         private mapearParaFrontend(row: any) {
    if (!row) return null;
    
    // 1. Garante que a data seja válida (usa dataCriacao se dataCaixa estiver zerada)
    const dataValida = row.dataCaixa && row.dataCaixa.toISOString().includes('00:00:00') 
      ? row.dataCriacao 
      : (row.dataCaixa || row.dataCriacao || new Date());

    // 2. Garante que produtosMaisVendidos NUNCA seja null (isso trava o Excel e a Tabela)
    let produtos = [];
    try {
      if (row.produtosMaisVendidos) {
        produtos = typeof row.produtosMaisVendidos === 'string' 
          ? JSON.parse(row.produtosMaisVendidos) 
          : row.produtosMaisVendidos;
      }
    } catch (e) {
      produtos = [];
    }

    // 3. Objeto final com mapeamento duplo (Banco <-> Frontend)
    return {
      ...row,
      id: row.id,
      // Campos de Data
      dataRelatorio: dataValida,
      dataCaixa: dataValida,
      data: dataValida,
      
      // Campos de Valores (Garante que não sejam null para o Excel não quebrar)
      totalVendas: row.totalVendas || 0,
      total: row.totalVendas || 0,
      lucroTotal: row.lucroTotal || 0,
      lucro: row.lucroTotal || 0,
      
      // Campos de Resumo e Exportação
      quantidadeVendas: row.quantidadeVendas || (Array.isArray(produtos) ? produtos.length : 0),
      metodoPagamentoMaisUsado: row.metodoPagamentoMaisUsado || 'N/A',
      produtosMaisVendidos: produtos,
      resumoProdutos: produtos
    };
  }




  async criarRelatorio(dto: any): Promise<any> {
    const pool = getPool();
    const id = uuidv4();
    const agora = new Date();

    const dataCaixa = dto.dataRelatorio || dto.dataCaixa || agora;
    const totalVendas = dto.totalVendas || 0;
    const lucroTotal = dto.lucroTotal || 0;
    const produtosJSON = JSON.stringify(dto.produtosMaisVendidos || dto.resumoProdutos || []);

    await pool.request()
      .input('id', sql.NVarChar(50), id)
      .input('dataCaixa', sql.DateTime, dataCaixa)
      .input('totalVendas', sql.Decimal(10, 2), totalVendas)
      .input('lucroTotal', sql.Decimal(10, 2), lucroTotal)
      .input('produtosMaisVendidos', sql.NVarChar(sql.MAX), produtosJSON)
      .input('dataCriacao', sql.DateTime, agora)
      .query(`
        INSERT INTO Relatorios (id, dataCaixa, totalVendas, lucroTotal, produtosMaisVendidos, dataCriacao)
        VALUES (@id, @dataCaixa, @totalVendas, @lucroTotal, @produtosMaisVendidos, @dataCriacao)
      `);

    return this.obterRelatorioPorId(id);
  }

    async obterRelatorios(): Promise<any[]> {
    const pool = getPool();
    const result = await pool.request().query(`SELECT * FROM Relatorios ORDER BY dataCaixa DESC`);
    
    // LOG PARA INVESTIGAÇÃO
    console.log('--- DADOS BRUTOS DO BANCO (RELATORIOS) ---');
    if (result.recordset.length > 0) {
      console.log(JSON.stringify(result.recordset[0], null, 2));
    } else {
      console.log('Nenhum relatório encontrado no banco.');
    }
    console.log('------------------------------------------');

    return result.recordset.map(row => this.mapearParaFrontend(row));
  }

  async obterRelatorioPorId(id: string): Promise<any | null> {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar(50), id)
      .query(`SELECT * FROM Relatorios WHERE id = @id`);
    return this.mapearParaFrontend(result.recordset[0]);
  }

  async obterRelatorioPorData(data: Date): Promise<any | null> {
    const pool = getPool();
    const inicioDia = new Date(data);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(data);
    fimDia.setHours(23, 59, 59, 999);

    const result = await pool.request()
      .input('inicio', sql.DateTime, inicioDia)
      .input('fim', sql.DateTime, fimDia)
      .query(`SELECT * FROM Relatorios WHERE dataCaixa BETWEEN @inicio AND @fim`);

    return this.mapearParaFrontend(result.recordset[0]);
  }

  async obterRelatorioPorPeriodo(inicio: Date, fim: Date): Promise<any[]> {
    const pool = getPool();
    const result = await pool.request()
      .input('inicio', sql.DateTime, inicio)
      .input('fim', sql.DateTime, fim)
      .query(`SELECT * FROM Relatorios WHERE dataCaixa BETWEEN @inicio AND @fim ORDER BY dataCaixa DESC`);

    return result.recordset.map(row => this.mapearParaFrontend(row));
  }

  async deletarRelatorios(): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request().query(`DELETE FROM Relatorios`);
    return result.rowsAffected[0] > 0;
  }

  async deletarRelatorio(id: string): Promise<boolean> {
    const pool = getPool();
    const result = await pool.request()
      .input('id', sql.NVarChar(50), id)
      .query(`DELETE FROM Relatorios WHERE id = @id`);
    return result.rowsAffected[0] > 0;
  }
}

export const relatorioService = new RelatorioServiceClass();
