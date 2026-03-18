import { Request, Response } from 'express';
import { produtoService } from '../services/produto.service';

export const criarProduto = async (req: Request, res: Response) => {
  try {
    const produto = await produtoService.criarProduto(req.body);
    res.status(201).json({ success: true, data: produto, message: 'Produto criado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ success: false, error: 'Erro ao criar produto' });
  }
};

export const obterProdutos = async (req: Request, res: Response) => {
  try {
    const produtos = await produtoService.obterTodosProdutos();
    res.status(200).json({ success: true, data: produtos, message: 'Produtos obtidos com sucesso' });
  } catch (error: any) {
    console.error('Erro ao obter produtos:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter produtos' });
  }
};

export const obterProdutosAtivos = async (req: Request, res: Response) => {
  try {
    const produtos = await produtoService.obterProdutosAtivos();
    res.status(200).json({ success: true, data: produtos, message: 'Produtos ativos obtidos com sucesso' });
  } catch (error: any) {
    console.error('Erro ao obter produtos ativos:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter produtos ativos' });
  }
};

export const obterProdutoPorId = async (req: Request, res: Response) => {
  try {
    const produto = await produtoService.obterProdutoPorId(req.params.id);
    if (!produto) return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    res.status(200).json({ success: true, data: produto, message: 'Produto obtido com sucesso' });
  } catch (error: any) {
    console.error('Erro ao obter produto por ID:', error);
    res.status(500).json({ success: false, error: 'Erro ao obter produto' });
  }
};

export const atualizarProduto = async (req: Request, res: Response) => {
  try {
    const produto = await produtoService.atualizarProduto(req.params.id, req.body);
    if (!produto) return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    res.status(200).json({ success: true, data: produto, message: 'Produto atualizado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ success: false, error: 'Erro ao atualizar produto' });
  }
};

export const desativarProduto = async (req: Request, res: Response) => {
  try {
    const sucesso = await produtoService.desativarProduto(req.params.id);
    if (!sucesso) return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    res.status(200).json({ success: true, message: 'Produto desativado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao desativar produto:', error);
    res.status(500).json({ success: false, error: 'Erro ao desativar produto' });
  }
};

export const ativarProduto = async (req: Request, res: Response) => {
  try {
    const sucesso = await produtoService.ativarProduto(req.params.id);
    if (!sucesso) return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    res.status(200).json({ success: true, message: 'Produto ativado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao ativar produto:', error);
    res.status(500).json({ success: false, error: 'Erro ao ativar produto' });
  }
};

export const deletarProduto = async (req: Request, res: Response) => {
  try {
    const sucesso = await produtoService.deletarProduto(req.params.id);
    if (!sucesso) return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    res.status(200).json({ success: true, message: 'Produto deletado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ success: false, error: 'Erro ao deletar produto' });
  }
};
