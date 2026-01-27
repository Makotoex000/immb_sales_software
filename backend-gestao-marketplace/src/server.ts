import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database';
import { initializeDatabase } from './config/init-db';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Servidor rodando' });
});

// Rotas da API
app.use('/api', routes);

// Inicializar servidor
async function startServer() {
  try {
    // Conectar ao banco de dados
    await connectDatabase();
    console.log('Conectado ao banco de dados');

    // Inicializar banco de dados
    await initializeDatabase();
    console.log('Banco de dados inicializado');

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Promise rejection não tratada:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Exceção não capturada:', error);
  process.exit(1);
});

export default app;