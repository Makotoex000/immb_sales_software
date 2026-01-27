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
        FOREIGN KEY (vendaId) REFERENCES Vendas(id),
        FOREIGN KEY (produtoId) REFERENCES Produtos(id)
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
        FOREIGN KEY (vendaFiadoId) REFERENCES VendasFiado(id),
        FOREIGN KEY (produtoId) REFERENCES Produtos(id)
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
        FOREIGN KEY (relatorioId) REFERENCES Relatorios(id),
        FOREIGN KEY (produtoId) REFERENCES Produtos(id)
      );
    `);
    console.log('✅ Tabela ResumoProdutosRelatorio criada/verificada');

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}
