import { Request, Response } from 'express';
import { impressoraService } from '../services/impressora.service';

export const imprimirPedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const { numeroPedido, nomeCliente, itens, total, formaPagamento, qrCodePix } = req.body;

    if (!itens || !total || !formaPagamento || !qrCodePix) {
      res.status(400).json({ success: false, error: 'Campos obrigatórios: itens, total, formaPagamento, qrCodePix' });
      return;
    }

    await impressoraService.imprimir({
      numeroPedido: numeroPedido || 'S/N',
      nomeCliente,
      itens,
      total,
      formaPagamento,
      qrCodePix,
    });

    res.json({ success: true, message: 'Impresso com sucesso!' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};