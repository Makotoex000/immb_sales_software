import sql from 'mssql';
import { getPool } from './database';

export async function initializeDatabase(): Promise<void> {
  try {
    const pool = getPool();

    // Criar tabela de Produtos
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Produtos' AND xtype='U')
      CREATE TABLE Produtos (
        id NVARCHAR(50) PRIMARY KEY,
        nome NVARCHAR(255) NOT NULL,
        valorCompra DECIMAL(10, 2) NOT NULL,
        valorVenda DECIMAL(10, 2) NOT NULL,
        quantidade INT NOT NULL,
        descricao NVARCHAR(MAX),
        imagem NVARCHAR(MAX),
        ativo BIT NOT NULL DEFAULT 1,
        dataCriacao DATETIME NOT NULL DEFAULT GETDATE(),
        dataAtualizacao DATETIME NOT NULL DEFAULT GETDATE()
      );
    `);
    console.log('✅ Tabela Produtos criada/verificada');

    // Criar tabela de Vendas
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Vendas' AND xtype='U')
      CREATE TABLE Vendas (
        id NVARCHAR(50) PRIMARY KEY,
        total DECIMAL(10, 2) NOT NULL,
        formaPagamento NVARCHAR(20) NOT NULL,
        dataVenda DATETIME NOT NULL DEFAULT GETDATE(),
        status NVARCHAR(20) NOT NULL DEFAULT 'concluida'
      );
    `);
    console.log('✅ Tabela Vendas criada/verificada');

    // Criar tabela de Itens de Venda
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ItensVenda' AND xtype='U')
      CREATE TABLE ItensVenda (
        id NVARCHAR(50) PRIMARY KEY,
        vendaId NVARCHAR(50) NOT NULL,
        produtoId NVARCHAR(50) NOT NULL,
        nomeProduto NVARCHAR(255) NOT NULL,
        quantidade INT NOT NULL,
        valorUnitario DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (vendaId) REFERENCES Vendas(id)
      );
    `);
    console.log('✅ Tabela ItensVenda criada/verificada');

    // Criar tabela de Vendas Fiado
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='VendasFiado' AND xtype='U')
      CREATE TABLE VendasFiado (
        id NVARCHAR(50) PRIMARY KEY,
        nomeBuyer NVARCHAR(255) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        dataVenda DATETIME NOT NULL DEFAULT GETDATE(),
        status NVARCHAR(20) NOT NULL DEFAULT 'aberto'
      );
    `);
    console.log('✅ Tabela VendasFiado criada/verificada');

    // Criar tabela de Itens de Venda Fiado
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ItensFiado' AND xtype='U')
      CREATE TABLE ItensFiado (
        id NVARCHAR(50) PRIMARY KEY,
        vendaFiadoId NVARCHAR(50) NOT NULL,
        produtoId NVARCHAR(50) NOT NULL,
        nomeProduto NVARCHAR(255) NOT NULL,
        quantidade INT NOT NULL,
        valorUnitario DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (vendaFiadoId) REFERENCES VendasFiado(id)
      );
    `);
    console.log('✅ Tabela ItensFiado criada/verificada');

    // Criar tabela de Relatórios
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Relatorios' AND xtype='U')
      CREATE TABLE Relatorios (
        id NVARCHAR(50) PRIMARY KEY,
        dataCaixa DATETIME NOT NULL,
        totalVendas INT NOT NULL,
        lucroTotal DECIMAL(10, 2) NOT NULL,
        dataCriacao DATETIME NOT NULL DEFAULT GETDATE()
      );
    `);
    console.log('✅ Tabela Relatorios criada/verificada');

    // Criar tabela de Resumo de Produtos em Relatórios
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ResumoProdutosRelatorio' AND xtype='U')
      CREATE TABLE ResumoProdutosRelatorio (
        id NVARCHAR(50) PRIMARY KEY,
        relatorioId NVARCHAR(50) NOT NULL,
        produtoId NVARCHAR(50) NOT NULL,
        nomeProduto NVARCHAR(255) NOT NULL,
        quantidadeVendida INT NOT NULL,
        valorTotalVenda DECIMAL(10, 2) NOT NULL,
        lucro DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (relatorioId) REFERENCES Relatorios(id)
      );
    `);
    console.log('✅ Tabela ResumoProdutosRelatorio criada/verificada');

    // Colunas adicionadas depois da criação original das tabelas
    await pool.request().query(`
      IF COL_LENGTH('Vendas', 'nomeCliente') IS NULL
        ALTER TABLE Vendas ADD nomeCliente NVARCHAR(255) NULL;
      IF COL_LENGTH('Vendas', 'descontoTipo') IS NULL
        ALTER TABLE Vendas ADD descontoTipo NVARCHAR(20) NULL;
      IF COL_LENGTH('Vendas', 'descontoValor') IS NULL
        ALTER TABLE Vendas ADD descontoValor DECIMAL(10, 2) NOT NULL DEFAULT 0;
      IF COL_LENGTH('Vendas', 'desconto') IS NULL
        ALTER TABLE Vendas ADD desconto DECIMAL(10, 2) NOT NULL DEFAULT 0;
      IF COL_LENGTH('VendasFiado', 'desconto') IS NULL
        ALTER TABLE VendasFiado ADD desconto DECIMAL(10, 2) NOT NULL DEFAULT 0;
    `);
    console.log('✅ Colunas de desconto criadas/verificadas');

    // Itens de venda/fiado e resumos de relatório guardam cópia do nome e do preço do produto,
    // então não precisam de chave estrangeira para Produtos. Sem ela, excluir um produto
    // não é bloqueado e o histórico de vendas continua intacto.
    await pool.request().query(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      SELECT @sql += N'ALTER TABLE ' + QUOTENAME(OBJECT_NAME(parent_object_id))
                   + N' DROP CONSTRAINT ' + QUOTENAME(name) + N'; '
      FROM sys.foreign_keys
      WHERE referenced_object_id = OBJECT_ID('Produtos')
        AND OBJECT_NAME(parent_object_id) IN ('ItensVenda', 'ItensFiado', 'ResumoProdutosRelatorio');
      EXEC sp_executesql @sql;
    `);
    console.log('✅ Vínculos com Produtos removidos do histórico (exclusão de produto liberada)');

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}
