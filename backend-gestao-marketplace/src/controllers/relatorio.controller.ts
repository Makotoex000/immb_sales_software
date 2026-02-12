import { Request, Response } from 'express';
import { relatorioService } from '../services/relatorio.service';
import { ApiResponse } from '../types';

export const criarRelatorio = async (req: Request, res: Response) => {
  try {
    const relatorio = await relatorioService.criarRelatorio(req.body);
    res.status(201).json({ success: true, data: relatorio });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obterRelatorios = async (req: Request, res: Response) => {
  try {
    const relatorios = await relatorioService.obterRelatorios();
    res.status(200).json({ success: true, data: relatorios });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obterRelatorioPorId = async (req: Request, res: Response) => {
  try {
    const relatorio = await relatorioService.obterRelatorioPorId(req.params.id);
    if (!relatorio) return res.status(404).json({ success: false, error: 'Relatório não encontrado' });
    res.status(200).json({ success: true, data: relatorio });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obterRelatorioPorData = async (req: Request, res: Response) => {
  try {
    const { data } = req.query;
    const relatorio = await relatorioService.obterRelatorioPorData(new Date(data as string));
    res.status(200).json({ success: true, data: relatorio });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const obterRelatorioPorPeriodo = async (req: Request, res: Response) => {
  try {
    const { inicio, fim } = req.query;
    const relatorios = await relatorioService.obterRelatorioPorPeriodo(new Date(inicio as string), new Date(fim as string));
    res.status(200).json({ success: true, data: relatorios });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletarRelatorios = async (req: Request, res: Response) => {
  try {
    await relatorioService.deletarRelatorios();
    res.status(200).json({ success: true, message: 'Todos os relatórios foram deletados' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deletarRelatorio = async (req: Request, res: Response) => {
  try {
    await relatorioService.deletarRelatorio(req.params.id);
    res.status(200).json({ success: true, message: 'Relatório deletado com sucesso' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
