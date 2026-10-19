import { uploadService } from '../services/upload.service';

// Recebe o arquivo como corpo binário da requisição (Content-Type: image/...)
export const uploadImagem = async (req: any, res: any) => {
  try {
    const mimeType = (req.headers['content-type'] || '').split(';')[0].trim();

    if (!uploadService.tipoSuportado(mimeType)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.'
      });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ success: false, error: 'Nenhuma imagem enviada' });
    }

    const url = await uploadService.salvarImagem(req.body, mimeType);

    res.status(201).json({
      success: true,
      data: { url },
      message: 'Imagem enviada com sucesso'
    });
  } catch (error: any) {
    console.error('Erro ao enviar imagem:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao enviar imagem'
    });
  }
};
