import { relatorioService } from '../services/relatorio.service';

export const criarRelatorio = async (req: any, res: any) => {
  try {
    const { dataCaixa, totalVendas, lucroTotal, resumoProdutos } = req.body;

    if (!dataCaixa) {
      return res.status(400).json({
        success: false,
        error: 'Data do caixa é obrigatória'
      });
    }

    const relatorio = await relatorioService.criarRelatorio({
      dataCaixa,
      vendas: [],
      totalVendas,
      lucroTotal,
      resumoProdutos
    });

    res.status(201).json({
      success: true,
      data: relatorio,
      message: 'Relatório criado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao criar relatório:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar relatório'
    });
  }
};

export const obterRelatorios = async (req: any, res: any) => {
  try {
    const relatorios = await relatorioService.obterTodosRelatorios();

    res.status(200).json({
      success: true,
      data: relatorios,
      message: 'Relatórios obtidos com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter relatórios:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter relatórios'
    });
  }
};

export const obterRelatorioPorId = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const relatorio = await relatorioService.obterRelatorioPorId(id);

    if (!relatorio) {
      return res.status(404).json({
        success: false,
        error: 'Relatório não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: relatorio,
      message: 'Relatório obtido com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter relatório:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter relatório'
    });
  }
};

export const obterRelatorioPorData = async (req: any, res: any) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data é obrigatória'
      });
    }

    const relatorios = await relatorioService.obterRelatorioPorData(new Date(data));

    res.status(200).json({
      success: true,
      data: relatorios,
      message: 'Relatórios obtidos com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter relatórios por data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter relatórios por data'
    });
  }
};

export const obterRelatorioPorPeriodo = async (req: any, res: any) => {
  try {
    const { dataInicio, dataFim } = req.query;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        success: false,
        error: 'Data inicial e final são obrigatórias'
      });
    }

    const relatorios = await relatorioService.obterRelatorioPorPeriodo(
      new Date(dataInicio),
      new Date(dataFim)
    );

    res.status(200).json({
      success: true,
      data: relatorios,
      message: 'Relatórios obtidos com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter relatórios por período:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter relatórios por período'
    });
  }
};

export const deletarRelatorios = async (req: any, res: any) => {
  try {
    const { dataInicio, dataFim } = req.body;

    if (!dataInicio || !dataFim) {
      return res.status(400).json({
        success: false,
        error: 'Data inicial e final são obrigatórias'
      });
    }

    await relatorioService.deletarRelatorios(new Date(dataInicio), new Date(dataFim));

    res.status(200).json({
      success: true,
      message: 'Relatórios deletados com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao deletar relatórios:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao deletar relatórios'
    });
  }
};

export const deletarRelatorio = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    await relatorioService.deletarRelatorio(id);

    res.status(200).json({
      success: true,
      message: 'Relatório deletado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao deletar relatório:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao deletar relatório'
    });
  }
};