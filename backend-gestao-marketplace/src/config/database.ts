import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config();

const config: sql.config = {
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
    connectTimeout: 15000,
    requestTimeout: 15000,
  },
};

let pool: sql.ConnectionPool;

export async function connectDatabase(): Promise<sql.ConnectionPool> {
  try {
    if (!pool) {
      console.log(`🔄 Tentando conectar ao SQL Server em ${config.server}...`);
      pool = new sql.ConnectionPool(config);
      
      // Conectar com timeout
      const connectionPromise = pool.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout na conexão com SQL Server')), 20000)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      // Testar conexão com query simples
      const result = await pool.request().query('SELECT 1 as test');
      if (result.recordset && result.recordset.length > 0) {
        console.log('✅ Conectado ao SQL Server com sucesso!');
        console.log(`📊 Servidor: ${config.server}`);
        console.log(`📁 Banco de dados: ${config.database}`);
        return pool;
      } else {
        throw new Error('Query de teste falhou');
      }
    }
    return pool;
  } catch (error: any) {
    console.error('❌ Erro ao conectar ao SQL Server:', error.message);
    console.error('⚠️  Verifique se:');
    console.error('   1. SQL Server está rodando');
    console.error('   2. Credenciais estão corretas no .env');
    console.error('   3. Servidor está acessível na rede');
    if (pool) {
      try {
        await pool.close();
      } catch (e) {
        // Ignorar erro ao fechar
      }
      pool = undefined as any;
    }
    throw error;
  }
}

export function getPool(): sql.ConnectionPool {
  if (!pool) {
    throw new Error('Pool de conexão não foi inicializado. Certifique-se de que connectDatabase() foi chamado com sucesso.');
  }
  return pool;
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      console.log('✅ Conexão com SQL Server fechada');
    } catch (error) {
      console.error('❌ Erro ao fechar conexão:', error);
    }
  }
}

export default { connectDatabase, getPool, closeDatabase };