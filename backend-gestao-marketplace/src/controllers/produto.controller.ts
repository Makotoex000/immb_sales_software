import { Request, Response } from 'express';
import { produtoService } from '../services/produto.service';
import { ApiResponse } from '../types';

export const criarProduto = async (req: Request, res: Response) => {
  try {
    const { nome, valorCompra, valorVenda, quantidade, descricao, imagem } = req.body;

    if (!nome || valorCompra === undefined || valorVenda === undefined || quantidade === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Nome, valorCompra, valorVenda e quantidade são obrigatórios',
      } as ApiResponse<null>);
    }

    const produto = await produtoService.criarProduto({
      nome,
      valorCompra,
      valorVenda,
      quantidade,
      descricao,
      imagem,
    });

    res.status(201).json({
      success: true,
      data: produto,
      message: 'Produto criado com sucesso',
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar produto',
    } as ApiResponse<null>);
  }
};

export const obterProdutos = async (req: Request, res: Response) => {
  try {
    const produtos = await produtoService.obterTodosProdutos();

    res.status(200).json({
      success: true,
      data: produtos,
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Erro ao obter produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter produtos',
    } as ApiResponse<null>);
  }
};

export const obterProdutosAtivos = async (req: Request, res: Response) => {
  try {
    const produtos = await produtoService.obterProdutosAtivos();

    res.status(200).json({
      success: true,
      data: produtos,
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Erro ao obter produtos ativos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter produtos ativos',
    } as ApiResponse<null>);
  }
};

export const obterProdutoPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const produto = await produtoService.obterProdutoPorId(id);

    if (!produto) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      } as ApiResponse<null>);
    }

    res.status(200).json({
      success: true,
      data: produto,
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Erro ao obter produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter produto',
    } as ApiResponse<null>);
  }
};

export const atualizarProduto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const produto = await produtoService.atualizarProduto(id, req.body);

    if (!produto) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      } as ApiResponse<null>);
    }

    res.status(200).json({
      success: true,
      data: produto,
      message: 'Produto atualizado com sucesso',
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar produto',
    } as ApiResponse<null>);
  }
};

export const desativarProduto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sucesso = await produtoService.desativarProduto(id);

    if (!sucesso) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      } as ApiResponse<null>);
    }

    res.status(200).json({
      success: true,
      message: 'Produto desativado com sucesso',
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Erro ao desativar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao desativar produto',
    } as ApiResponse<null>);
  }
};

export const ativarProduto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sucesso = await produtoService.ativarProduto(id);

    if (!sucesso) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      } as ApiResponse<null>);
    }

    res.status(200).json({
      success: true,
      message: 'Produto ativado com sucesso',
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Erro ao ativar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao ativar produto',
    } as ApiResponse<null>);
  }
};

export const deletarProduto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sucesso = await produtoService.deletarProduto(id);

    if (!sucesso) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado',
      } as ApiResponse<null>);
    }

    res.status(200).json({
      success: true,
      message: 'Produto deletado com sucesso',
    } as ApiResponse<null>);
  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar produto',
    } as ApiResponse<null>);
  }
};