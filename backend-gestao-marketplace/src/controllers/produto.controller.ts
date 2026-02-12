import { Request, Response } from 'express';
import { produtoService, ApiResponse } from '../services/produto.service';

// Como removemos as interfaces específicas para simplificar, 
// vamos usar 'any' ou definir localmente se necessário.


export const criarProduto = async (req: Request, res: Response) => {
  try {
    const dto: any = req.body;
    const produto = await produtoService.criarProduto(dto);
    res.status(201).json({
      success: true,
      data: produto,
      message: 'Produto criado com sucesso'
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar produto'
    } as ApiResponse<null>);
  }
};

export const obterProdutos = async (req: Request, res: Response) => {
  try {
    const produtos = await produtoService.obterProdutos();
    res.status(200).json({
      success: true,
      data: produtos
    } as ApiResponse<any[]>);
  } catch (error: any) {
    console.error('Erro ao obter produtos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter produtos'
    } as ApiResponse<null>);
  }
};

export const obterProdutosAtivos = async (req: Request, res: Response) => {
  try {
    const produtos = await produtoService.obterProdutosAtivos();
    res.status(200).json({
      success: true,
      data: produtos
    } as ApiResponse<any[]>);
  } catch (error: any) {
    console.error('Erro ao obter produtos ativos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter produtos ativos'
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
        error: 'Produto não encontrado'
      } as ApiResponse<null>);
    }
    res.status(200).json({
      success: true,
      data: produto
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error('Erro ao obter produto por id:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter produto'
    } as ApiResponse<null>);
  }
};

export const atualizarProduto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const dto: any = req.body;
    const sucesso = await produtoService.atualizarProduto(id, dto);
    if (!sucesso) {
      return res.status(404).json({
        success: false,
        error: 'Produto não encontrado'
      } as ApiResponse<null>);
    }
    res.status(200).json({
      success: true,
      message: 'Produto atualizado com sucesso'
    } as ApiResponse<null>);
  } catch (error: any) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar produto'
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
        error: 'Produto não encontrado'
      } as ApiResponse<null>);
    }
    res.status(200).json({
      success: true,
      message: 'Produto desativado com sucesso'
    } as ApiResponse<null>);
  } catch (error: any) {
    console.error('Erro ao desativar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao desativar produto'
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
        error: 'Produto não encontrado'
      } as ApiResponse<null>);
    }
    res.status(200).json({
      success: true,
      message: 'Produto ativado com sucesso'
    } as ApiResponse<null>);
  } catch (error: any) {
    console.error('Erro ao ativar produto:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao ativar produto'
    } as ApiResponse<null>);
  }
};

export const deletarProduto = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sucesso = await produtoService.deletarProduto(id);
    res.status(200).json({ success: true, message: 'Produto deletado com sucesso' });
  } catch (error: any) {
    console.error('Erro detalhado no backend:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message // Isso vai nos mostrar o nome da tabela que falta!
    });
  }
};

