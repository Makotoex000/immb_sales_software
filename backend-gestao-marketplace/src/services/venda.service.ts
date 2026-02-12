import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../config/database';
import { Venda, CreateVendaDTO, ItemVenda, CreateItemVendaDTO } from '../types';
import { produtoService } from './produto.service';
import sql from 'mssql';

class VendaServiceClass {
  async criarVenda(dto: CreateVendaDTO): Promise<Venda> {
    const pool = getPool();
    const id = uuidv4();
    const agora = new Date();
    const status = dto.status || 'concluida';
    const nomeCliente = dto.nomeCliente || null;

    await pool.request()
      .input('id', sql.NVarChar(50), id)
      .input('total', sql.Decimal(10, 2), dto.total)
      .input('formaPagamento', sql.NVarChar(20), dto.formaPagamento)
      .input('dataVenda', sql.DateTime, agora)
      .input('status', sql.NVarChar(20), status)
      .input('nomeCliente', sql.NVarChar(255), nomeCliente)
      .query(`INSERT INTO Vendas (id, total, formaPagamento, dataVenda, status, nomeCliente) VALUES (@id, @total, @formaPagamento, @dataVenda, @status, @nomeCliente)`);

    const itens: ItemVenda[] = [];
    for (const item of dto.itens) {
      const itemId = uuidv4();
      await pool.request()
        .input('id', sql.NVarChar(50), itemId)
        .input('vendaId', sql.NVarChar(50), id)
        .input('produtoId', sql.NVarChar(50), item.produtoId)
        .input('nomeProduto', sql.NVarChar(255), item.nomeProduto)
        .input('quantidade', sql.Int, item.quantidade)
        .input('valorUnitario', sql.Decimal(10, 2), item.valorUnitario)
        .input('subtotal', sql.Decimal(10, 2), item.subtotal)
        .query(`INSERT INTO ItensVenda (id, vendaId, produtoId, nomeProduto, quantidade, valorUnitario, subtotal) VALUES (@id, @vendaId, @produtoId, @nomeProduto, @quantidade, @valorUnitario, @subtotal)`);

      itens.push({ id: itemId, vendaId: id, produtoId: item.produtoId, nomeProduto: item.nomeProduto, quantidade: item.quantidade, valorUnitario: item.valorUnitario, subtotal: item.subtotal });
    }

    // ✅ SÓ BAIXA O ESTOQUE SE NÃO FOR FIADO (Pois o fiado já baixou ao ser aberto)
    if (status !== 'fiado') {
      for (const item of dto.itens) {
        await produtoService.decrementarEstoque(item.produtoId, item.quantidade);
      }
    }

    return { id, itens, total: dto.total, formaPagamento: dto.formaPagamento, dataVenda: agora, status: status as any, nomeCliente: nomeCliente || undefined };
  }

  async obterTodasVendas(): Promise<Venda[]> {
    const pool = getPool();
    const result = await pool.request().query(`SELECT * FROM Vendas ORDER BY dataVenda DESC`);
    const vendas: Venda[] = [];
    for (const row of result.recordset) {
      const itens = await this.obterItensPorVendaId(row.id);
      vendas.push({ id: row.id, itens, total: row.total, formaPagamento: row.formaPagamento, dataVenda: row.dataVenda, status: row.status, nomeCliente: row.nomeCliente || undefined });
    }
    return vendas;
  }

  async obterVendaPorId(id: string): Promise<Venda | null> {
    const pool = getPool();
    const result = await pool.request().input('id', sql.NVarChar(50), id).query(`SELECT * FROM Vendas WHERE id = @id`);
    if (result.recordset.length === 0) return null;
    const row = result.recordset[0];
    const itens = await this.obterItensPorVendaId(id);
    return { id: row.id, itens, total: row.total, formaPagamento: row.formaPagamento, dataVenda: row.dataVenda, status: row.status, nomeCliente: row.nomeCliente || undefined };
  }

  async obterVendasPorData(data: Date): Promise<Venda[]> {
    const pool = getPool();
    const dataInicio = new Date(data); dataInicio.setHours(0, 0, 0, 0);
    const dataFim = new Date(data); dataFim.setHours(23, 59, 59, 999);
    const result = await pool.request().input('dataInicio', sql.DateTime, dataInicio).input('dataFim', sql.DateTime, dataFim).query(`SELECT * FROM Vendas WHERE dataVenda >= @dataInicio AND dataVenda <= @dataFim ORDER BY dataVenda DESC`);
    const vendas: Venda[] = [];
    for (const row of result.recordset) {
      const itens = await this.obterItensPorVendaId(row.id);
      vendas.push({ id: row.id, itens, total: row.total, formaPagamento: row.formaPagamento, dataVenda: row.dataVenda, status: row.status, nomeCliente: row.nomeCliente || undefined });
    }
    return vendas;
  }

  async desfazerVenda(id: string): Promise<boolean> {
    const venda = await this.obterVendaPorId(id);
    if (!venda) throw new Error('Venda não encontrada');
    for (const item of venda.itens) {
      await produtoService.incrementarEstoque(item.produtoId, item.quantidade);
    }
    return await this.deletarVenda(id);
  }

  async deletarVenda(id: string): Promise<boolean> {
    const pool = getPool();
    await pool.request().input('vendaId', sql.NVarChar(50), id).query(`DELETE FROM ItensVenda WHERE vendaId = @vendaId`);
    const result = await pool.request().input('id', sql.NVarChar(50), id).query(`DELETE FROM Vendas WHERE id = @id`);
    return result.rowsAffected[0] > 0;
  }

  private async obterItensPorVendaId(vendaId: string): Promise<ItemVenda[]> {
    const pool = getPool();
    const result = await pool.request().input('vendaId', sql.NVarChar(50), vendaId).query(`SELECT * FROM ItensVenda WHERE vendaId = @vendaId`);
    return result.recordset.map((row: any) => ({ id: row.id, vendaId: row.vendaId, produtoId: row.produtoId, nomeProduto: row.nomeProduto, quantidade: row.quantidade, valorUnitario: row.valorUnitario, subtotal: row.subtotal }));
  }
}

export const vendaService = new VendaServiceClass();
