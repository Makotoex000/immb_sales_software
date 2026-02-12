import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database';
import { VendaFiado, CreateVendaFiadoDTO, UpdateVendaFiadoDTO, ItemVenda, CreateItemVendaDTO } from '../types';
import { produtoService } from './produto.service';
import sql from 'mssql';

class FiadoServiceClass {
  async criarFiado(dto: CreateVendaFiadoDTO): Promise<VendaFiado> {
    const pool = getPool();
    const id = uuidv4();
    const agora = new Date();

    await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .input('nomeBuyer', sql.NVarChar(255), dto.nomeBuyer)
      .input('total', sql.Decimal(10, 2), dto.total)
      .input('dataVenda', sql.DateTime, agora)
      .query(`
        INSERT INTO VendasFiado (id, nomeBuyer, total, dataVenda, status)
        VALUES (@id, @nomeBuyer, @total, @dataVenda, 'aberto')
      `);

    const itens: ItemVenda[] = [];
    for (const item of dto.itens) {
      const itemId = uuidv4();
      await pool
        .request()
        .input('id', sql.NVarChar(50), itemId)
        .input('vendaFiadoId', sql.NVarChar(50), id)
        .input('produtoId', sql.NVarChar(50), item.produtoId)
        .input('nomeProduto', sql.NVarChar(255), item.nomeProduto)
        .input('quantidade', sql.Int, item.quantidade)
        .input('valorUnitario', sql.Decimal(10, 2), item.valorUnitario)
        .input('subtotal', sql.Decimal(10, 2), item.subtotal)
        .query(`
          INSERT INTO ItensFiado (id, vendaFiadoId, produtoId, nomeProduto, quantidade, valorUnitario, subtotal)
          VALUES (@id, @vendaFiadoId, @produtoId, @nomeProduto, @quantidade, @valorUnitario, @subtotal)
        `);

      itens.push({
        id: itemId,
        vendaId: id,
        produtoId: item.produtoId,
        nomeProduto: item.nomeProduto,
        quantidade: item.quantidade,
        valorUnitario: item.valorUnitario,
        subtotal: item.subtotal,
      });
    }

    // ✅ Decrementar estoque ao criar fiado
    for (const item of dto.itens) {
      await produtoService.decrementarEstoque(item.produtoId, item.quantidade);
    }

    return {
      id,
      nomeBuyer: dto.nomeBuyer,
      itens,
      total: dto.total,
      dataVenda: agora,
      status: 'aberto',
    };
  }

  async obterTodosFiados(): Promise<VendaFiado[]> {
    const pool = getPool();

    const result = await pool.request().query(`
      SELECT * FROM VendasFiado WHERE status = 'aberto' ORDER BY dataVenda DESC
    `);

    const fiados: VendaFiado[] = [];
    for (const row of result.recordset) {
      const itens = await this.obterItensPorFiadoId(row.id);
      fiados.push({
        id: row.id,
        nomeBuyer: row.nomeBuyer,
        itens,
        total: row.total,
        dataVenda: row.dataVenda,
        status: row.status,
      });
    }

    return fiados;
  }

  async obterFiadosPorNome(nome: string): Promise<VendaFiado[]> {
    const pool = getPool();

    const result = await pool
      .request()
      .input('nomeBuyer', sql.NVarChar(255), `%${nome}%`)
      .query(`
        SELECT * FROM VendasFiado WHERE nomeBuyer LIKE @nomeBuyer AND status = 'aberto'
      `);

    const fiados: VendaFiado[] = [];
    for (const row of result.recordset) {
      const itens = await this.obterItensPorFiadoId(row.id);
      fiados.push({
        id: row.id,
        nomeBuyer: row.nomeBuyer,
        itens,
        total: row.total,
        dataVenda: row.dataVenda,
        status: row.status,
      });
    }

    return fiados;
  }

  async obterFiadoPorId(id: string): Promise<VendaFiado | null> {
    const pool = getPool();

    const result = await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .query(`
        SELECT * FROM VendasFiado WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return null;
    }

    const row = result.recordset[0];
    const itens = await this.obterItensPorFiadoId(id);

    return {
      id: row.id,
      nomeBuyer: row.nomeBuyer,
      itens,
      total: row.total,
      dataVenda: row.dataVenda,
      status: row.status,
    };
  }

  async adicionarItensAoFiado(id: string, itens: CreateItemVendaDTO[]): Promise<VendaFiado | null> {
    const pool = getPool();

    const fiado = await this.obterFiadoPorId(id);
    if (!fiado) {
      return null;
    }

    let novoTotal = fiado.total;

    for (const item of itens) {
      const itemId = uuidv4();
      await pool
        .request()
        .input('id', sql.NVarChar(50), itemId)
        .input('vendaFiadoId', sql.NVarChar(50), id)
        .input('produtoId', sql.NVarChar(50), item.produtoId)
        .input('nomeProduto', sql.NVarChar(255), item.nomeProduto)
        .input('quantidade', sql.Int, item.quantidade)
        .input('valorUnitario', sql.Decimal(10, 2), item.valorUnitario)
        .input('subtotal', sql.Decimal(10, 2), item.subtotal)
        .query(`
          INSERT INTO ItensFiado (id, vendaFiadoId, produtoId, nomeProduto, quantidade, valorUnitario, subtotal)
          VALUES (@id, @vendaFiadoId, @produtoId, @nomeProduto, @quantidade, @valorUnitario, @subtotal)
        `);

      novoTotal += item.subtotal;
      
      // ✅ Decrementar estoque ao adicionar itens ao fiado
      await produtoService.decrementarEstoque(item.produtoId, item.quantidade);
    }

    await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .input('total', sql.Decimal(10, 2), novoTotal)
      .query(`
        UPDATE VendasFiado SET total = @total WHERE id = @id
      `);

    return await this.obterFiadoPorId(id);
  }

  async fecharFiado(id: string, formaPagamento: string): Promise<VendaFiado | null> {
    const pool = getPool();

    const fiado = await this.obterFiadoPorId(id);
    if (!fiado) {
      return null;
    }

    await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .input('status', sql.NVarChar(20), 'fechado')
      .query(`
        UPDATE VendasFiado SET status = @status WHERE id = @id
      `);

    return await this.obterFiadoPorId(id);
  }

  async deletarFiado(id: string): Promise<boolean> {
    const pool = getPool();

    await pool
      .request()
      .input('vendaFiadoId', sql.NVarChar(50), id)
      .query(`
        DELETE FROM ItensFiado WHERE vendaFiadoId = @vendaFiadoId
      `);

    const result = await pool
      .request()
      .input('id', sql.NVarChar(50), id)
      .query(`
        DELETE FROM VendasFiado WHERE id = @id
      `);

    return result.rowsAffected[0] > 0;
  }

  private async obterItensPorFiadoId(vendaFiadoId: string): Promise<ItemVenda[]> {
    const pool = getPool();

    const result = await pool
      .request()
      .input('vendaFiadoId', sql.NVarChar(50), vendaFiadoId)
      .query(`
        SELECT * FROM ItensFiado WHERE vendaFiadoId = @vendaFiadoId
      `);

    // ✅ Correção do mapeamento para evitar erro de tipo
    return result.recordset.map((row: any) => ({
      id: row.id,
      vendaId: row.vendaFiadoId, // Mapeia vendaFiadoId do banco para vendaId da interface
      produtoId: row.produtoId,
      nomeProduto: row.nomeProduto,
      quantidade: row.quantidade,
      valorUnitario: row.valorUnitario,
      subtotal: row.subtotal,
    }));
  }
}

export const fiadoService = new FiadoServiceClass();
