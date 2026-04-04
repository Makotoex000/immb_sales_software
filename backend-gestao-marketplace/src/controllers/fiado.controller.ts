import { fiadoService } from '../services/fiado.service';
import { vendaService } from '../services/venda.service';
import { CreateVendaWithStatusDTO } from '../types';

export const criarFiado = async (req: any, res: any) => {
  try {
    const { nomeBuyer, itens, total } = req.body;

    if (!nomeBuyer || !itens || itens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nome do comprador e itens são obrigatórios'
      });
    }

    const fiado = await fiadoService.criarFiado({
      nomeBuyer,
      itens,
      total
    });

    res.status(201).json({
      success: true,
      data: fiado,
      message: 'Fiado criado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao criar fiado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar fiado'
    });
  }
};

export const obterFiados = async (req: any, res: any) => {
  try {
    const fiados = await fiadoService.obterTodosFiados();

    res.status(200).json({
      success: true,
      data: fiados,
      message: 'Fiados obtidos com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter fiados:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter fiados'
    });
  }
};

export const obterFiadoPorNome = async (req: any, res: any) => {
  try {
    const { nome } = req.query;

    if (!nome) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório'
      });
    }

    const fiados = await fiadoService.obterFiadosPorNome(nome);

    res.status(200).json({
      success: true,
      data: fiados,
      message: 'Fiados obtidos com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter fiados por nome:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter fiados por nome'
    });
  }
};

export const obterFiadoPorId = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const fiado = await fiadoService.obterFiadoPorId(id);

    if (fiado === null) {
      return res.status(404).json({
        success: false,
        error: 'Fiado não encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: fiado,
      message: 'Fiado obtido com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao obter fiado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao obter fiado'
    });
  }
};

export const adicionarItensAoFiado = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { itens } = req.body;

    if (!itens || itens.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Itens são obrigatórios'
      });
    }

    const fiado = await fiadoService.adicionarItensAoFiado(id, itens);

    res.status(200).json({
      success: true,
      data: fiado,
      message: 'Itens adicionados com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao adicionar itens ao fiado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao adicionar itens ao fiado'
    });
  }
};

export const fecharFiado = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { formaPagamento } = req.body;

    if (!formaPagamento) {
      return res.status(400).json({
        success: false,
        error: 'Forma de pagamento é obrigatória'
      });
    }

    // Obter fiado antes de fechar
    const fiadoAberto = await fiadoService.obterFiadoPorId(id);
    
    if (!fiadoAberto) {
      return res.status(404).json({
        success: false,
        error: 'Fiado não encontrado'
      });
    }

    // 🔍 LOG: Dados do fiado aberto
    console.log('Fiado Aberto:', {
      id: fiadoAberto.id,
      nomeBuyer: fiadoAberto.nomeBuyer,
      total: fiadoAberto.total,
      itensCount: fiadoAberto.itens?.length || 0,
      itens: fiadoAberto.itens
    });

    // Fechar fiado
    const fiado = await fiadoService.fecharFiado(id, formaPagamento);

    // 🔍 LOG: Fiado fechado
    console.log('Fiado Fechado:', {
      id: fiado?.id,
      status: fiado?.status
    });

    // ✅ Criar venda correspondente no histórico com status 'fiado'
    if (fiado && fiadoAberto && fiadoAberto.itens && fiadoAberto.itens.length > 0) {
      try {
        // 🔍 LOG: Dados que serão enviados para criar venda
        console.log('Criando Venda com dados:', {
          status: 'fiado',
          nomeCliente: fiadoAberto.nomeBuyer,
          total: fiadoAberto.total,
          formaPagamento: formaPagamento,
          itensCount: fiadoAberto.itens.length
        });

        const vendaData: CreateVendaWithStatusDTO = {
          itens: fiadoAberto.itens,
          total: fiadoAberto.total,
          formaPagamento: formaPagamento,
          status: 'fiado',
          nomeCliente: fiadoAberto.nomeBuyer || 'Cliente'
        };

        const vendaCriada = await vendaService.criarVenda(vendaData);

        // 🔍 LOG: Venda criada com sucesso
        console.log('Venda Criada com Sucesso:', {
          id: vendaCriada.id,
          status: vendaCriada.status,
          nomeCliente: vendaCriada.nomeCliente || 'N/A'
        });
      } catch (vendaError: any) {
        console.error('ERRO ao registrar venda no histórico:', vendaError);
        console.error('Stack:', vendaError.stack);
        // Não falha a operação de fechar fiado se houver erro ao registrar venda
      }
    } else {
      // 🔍 LOG: Condição não foi atendida
      console.warn('Venda NÃO foi criada. Condição não atendida:', {
        fiado: !!fiado,
        fiadoAberto: !!fiadoAberto,
        itens: fiadoAberto?.itens,
        itensLength: fiadoAberto?.itens?.length
      });
    }

    res.status(200).json({
      success: true,
      data: fiado,
      message: 'Fiado fechado com sucesso e registrado no histórico'
    });
  } catch (error: any) {
    console.error('Erro ao fechar fiado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao fechar fiado'
    });
  }
};

export const deletarFiado = async (req: any, res: any) => {
  try {
    const { id } = req.params;

    await fiadoService.deletarFiado(id);

    res.status(200).json({
      success: true,
      message: 'Fiado deletado com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao deletar fiado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao deletar fiado'
    });
  }
};

export const obterFiadosAgrupados = async (req: any, res: any) => {
  try {
    const fiados = await fiadoService.obterFiadosAgrupados();
    res.json({ success: true, data: fiados });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};