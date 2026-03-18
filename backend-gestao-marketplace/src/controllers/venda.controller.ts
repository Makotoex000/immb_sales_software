import { vendaService } from '../services/venda.service';

export const criarVenda = async (req: any, res: any) => {
  try {
    const { itens, total, formaPagamento } = req.body;

    if (!itens || itens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Itens da venda são obrigatórios'
      });
    }

    const venda = await vendaService.criarVenda({
      itens,
      total,
      formaPagamento
    });

    res.status(201).json({
      success: true,
      data: venda,
      message: 'Venda criada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao criar venda:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar venda'
    });
  }
};

export const obterTodasVendas = async (req: any, res: any) => {
  try {
    const vendas = await vendaService.obterTodasVendas();

    res.status(200).json({
      success: true,
      data: vendas,
      message: 'Vendas obtidas com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter vendas:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter vendas'
    });
  }
};

export const obterVendaPorId = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const venda = await vendaService.obterVendaPorId(id);

    if (!venda) {
      return res.status(404).json({
        success: false,
        error: 'Venda não encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: venda,
      message: 'Venda obtida com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter venda:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter venda'
    });
  }
};

export const obterVendasPorData = async (req: any, res: any) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res.status(400).json({
        success: false,
        error: 'Data é obrigatória'
      });
    }

    const vendas = await vendaService.obterVendasPorData(new Date(data));

    res.status(200).json({
      success: true,
      data: vendas,
      message: 'Vendas obtidas com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter vendas por data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter vendas por data'
    });
  }
};

export const desfazerVenda = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const venda = await vendaService.desfazerVenda(id);

    res.status(200).json({
      success: true,
      data: venda,
      message: 'Venda desfeita com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao desfazer venda:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao desfazer venda'
    });
  }
};

export const deletarVenda = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    await vendaService.deletarVenda(id);

    res.status(200).json({
      success: true,
      message: 'Venda deletada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao deletar venda:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao deletar venda'
    });
  }
};