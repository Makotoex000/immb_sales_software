import { Request, Response } from 'express';
import { vendaService } from '../services/venda.service';
import { ApiResponse, CreateVendaDTO } from '../types';

export const criarVenda = async (req: Request, res: Response) => {
  try {
    const dto: CreateVendaDTO = req.body;
    const venda = await vendaService.criarVenda(dto);
    res.status(201).json({
      success: true,
      data: venda,
      message: 'Venda realizada com sucesso'
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar venda'
    } as ApiResponse<null>);
  }
};

export const obterTodasVendas = async (req: Request, res: Response) => {
  try {
    const vendas = await vendaService.obterTodasVendas();
    res.status(200).json({
      success: true,
      data: vendas
    } as ApiResponse<any[]>);
  } catch (error: any) {
    console.error('Erro ao obter vendas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter vendas'
    } as ApiResponse<null>);
  }
};

export const obterVendasPorData = async (req: Request, res: Response) => {
  try {
    const { data } = req.query;
    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data não informada'
      } as ApiResponse<null>);
    }
    const vendas = await vendaService.obterVendasPorData(new Date(data as string));
    res.status(200).json({
      success: true,
      data: vendas
    } as ApiResponse<any[]>);
  } catch (error: any) {
    console.error('Erro ao obter vendas por data:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter vendas por data'
    } as ApiResponse<null>);
  }
};

export const obterVendaPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const venda = await vendaService.obterVendaPorId(id);
    if (!venda) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      } as ApiResponse<null>);
    }
    res.status(200).json({
      success: true,
      data: venda
    } as ApiResponse<any>);
  } catch (error: any) {
    console.error('Erro ao obter venda por id:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter venda'
    } as ApiResponse<null>);
  }
};

export const desfazerVenda = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sucesso = await vendaService.desfazerVenda(id);
    if (!sucesso) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      } as ApiResponse<null>);
    }
    res.status(200).json({
      success: true,
      message: 'Venda desfeita com sucesso e estoque restaurado'
    } as ApiResponse<null>);
  } catch (error: any) {
    console.error('Erro ao desfazer venda:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao desfazer venda'
    } as ApiResponse<null>);
  }
};

export const deletarVenda = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const sucesso = await vendaService.deletarVenda(id);
    if (!sucesso) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      } as ApiResponse<null>);
    }
    res.status(200).json({
      success: true,
      message: 'Venda deletada com sucesso'
    } as ApiResponse<null>);
  } catch (error: any) {
    console.error('Erro ao deletar venda:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao deletar venda'
    } as ApiResponse<null>);
  }
};
