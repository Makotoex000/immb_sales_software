import sql from 'mssql';
import dotenv from 'dotenv';

// Configuração de tipos
interface SqlConfig {
  server: string;
  database: string;
  authentication: {
    type: string;
    options: {
      userName: string;
      password: string;
    };
  };
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    connectTimeout: number;
    requestTimeout: number;
  };
}

dotenv.config();

const config: any = {
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'vendas_immb',
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || 'Password123!',
    },
  },
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true' || false,
    trustServerCertificate: true,
    connectTimeout: 10000,
    requestTimeout: 10000,
  },
};

async function testConnection() {
  console.log('🔍 Testando conexão com SQL Server...\n');
  console.log('📋 Configurações:');
  console.log(`   Servidor: ${config.server}`);
  console.log(`   Banco: ${config.database}`);
  console.log(`   Usuário: ${config.authentication.options.userName}`);
  console.log(`   Timeout: ${config.options.connectTimeout}ms\n`);

  try {
    console.log('⏳ Conectando...');
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log('✅ Conexão estabelecida!\n');

    // Testar query
    console.log('⏳ Testando query...');
    const result = await pool.request().query('SELECT GETDATE() as data, @@VERSION as versao');
    
    if (result.recordset && result.recordset.length > 0) {
      console.log('✅ Query executada com sucesso!\n');
      console.log('📊 Informações do Servidor:');
      console.log(`   Data/Hora: ${result.recordset[0].data}`);
      console.log(`   Versão: ${result.recordset[0].versao}\n`);
      
      // Verificar se banco existe
      console.log('⏳ Verificando banco de dados...');
      const dbCheck = await pool.request().query(`
        SELECT name FROM sys.databases WHERE name = '${config.database}'
      `);
      
      if (dbCheck.recordset.length > 0) {
        console.log(`✅ Banco de dados '${config.database}' existe!\n`);
      } else {
        console.log(`⚠️  Banco de dados '${config.database}' NÃO existe!\n`);
      }

      // Listar tabelas
      console.log('⏳ Listando tabelas...');
      const tables = await pool.request().query(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = 'dbo' 
        ORDER BY TABLE_NAME
      `);
      
      if (tables.recordset.length > 0) {
        console.log(`✅ Encontradas ${tables.recordset.length} tabelas:\n`);
        tables.recordset.forEach((table: any, index: number) => {
          console.log(`   ${index + 1}. ${table.TABLE_NAME}`);
        });
      } else {
        console.log('⚠️  Nenhuma tabela encontrada no banco!\n');
      }

      await pool.close();
      console.log('\n✅ Teste concluído com sucesso!');
      console.log('🚀 Você pode rodar: npm run dev\n');
      process.exit(0);
    }
  } catch (error: any) {
    console.error('\n❌ ERRO NA CONEXÃO:\n');
    console.error(`   ${error.message}\n`);
    
    if (error.code === 'ESOCKET') {
      console.error('⚠️  Possíveis causas:');
      console.error('   1. SQL Server não está rodando');
      console.error('   2. Servidor não está acessível em KUROI');
      console.error('   3. Firewall está bloqueando a conexão');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR' || error.message.includes('login')) {
      console.error('⚠️  Possíveis causas:');
      console.error('   1. Usuário/senha incorretos');
      console.error('   2. Usuário não tem permissão');
      console.error('   3. Autenticação incorreta');
    }
    
    console.error('\n📝 Verificar:');
    console.error('   1. Arquivo .env com credenciais corretas');
    console.error('   2. SQL Server está rodando');
    console.error('   3. Servidor KUROI está acessível\n');
    
    process.exit(1);
  }
}

testConnection();