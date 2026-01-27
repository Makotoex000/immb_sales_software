import { Router } from 'express';
import * as produtoController from '../controllers/produto.controller';
import * as vendaController from '../controllers/venda.controller';
import * as fiadoController from '../controllers/fiado.controller';
import * as relatorioController from '../controllers/relatorio.controller';


const router = Router();


// Rotas de Produtos
router.post('/produtos', produtoController.criarProduto);
router.get('/produtos', produtoController.obterProdutos);
router.get('/produtos/ativos', produtoController.obterProdutosAtivos);
router.get('/produtos/:id', produtoController.obterProdutoPorId);
router.put('/produtos/:id', produtoController.atualizarProduto);
router.patch('/produtos/:id/desativar', produtoController.desativarProduto);
router.patch('/produtos/:id/ativar', produtoController.ativarProduto);
router.delete('/produtos/:id', produtoController.deletarProduto);


// Rotas de Vendas
router.post('/vendas', vendaController.criarVenda);
router.get('/vendas', vendaController.obterTodasVendas);
router.get('/vendas/data', vendaController.obterVendasPorData);      
router.get('/vendas/:id', vendaController.obterVendaPorId);          
router.patch('/vendas/:id/desfazer', vendaController.desfazerVenda);
router.delete('/vendas/:id', vendaController.deletarVenda);


// Rotas de Fiados
router.post('/fiados', fiadoController.criarFiado);
router.get('/fiados', fiadoController.obterFiados);
router.get('/fiados/nome', fiadoController.obterFiadoPorNome);
router.get('/fiados/:id', fiadoController.obterFiadoPorId);
router.post('/fiados/:id/itens', fiadoController.adicionarItensAoFiado);
router.patch('/fiados/:id/fechar', fiadoController.fecharFiado);
router.delete('/fiados/:id', fiadoController.deletarFiado);


// Rotas de Relatórios
router.post('/relatorios', relatorioController.criarRelatorio);
router.get('/relatorios', relatorioController.obterRelatorios);
router.get('/relatorios/:id', relatorioController.obterRelatorioPorId);
router.get('/relatorios/data', relatorioController.obterRelatorioPorData);
router.get('/relatorios/periodo', relatorioController.obterRelatorioPorPeriodo);
router.delete('/relatorios', relatorioController.deletarRelatorios);
router.delete('/relatorios/:id', relatorioController.deletarRelatorio);


export default router;