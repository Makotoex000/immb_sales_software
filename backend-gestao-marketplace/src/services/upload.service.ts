import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Pasta "uploads" na raiz do backend (funciona tanto rodando de src/ quanto de dist/)
export const UPLOADS_DIR = path.resolve(__dirname, '..', '..', 'uploads');
export const UPLOADS_URL = '/uploads';

export const TAMANHO_MAXIMO_IMAGEM = '5mb';

const EXTENSOES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

class UploadServiceClass {
  constructor() {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  tipoSuportado(mimeType: string): boolean {
    return mimeType in EXTENSOES;
  }

  // Salva a imagem em disco e devolve o caminho público (ex: /uploads/abc.jpg)
  async salvarImagem(conteudo: Buffer, mimeType: string): Promise<string> {
    const extensao = EXTENSOES[mimeType];
    if (!extensao) throw new Error('Formato de imagem não suportado. Use JPG, PNG, WEBP ou GIF.');

    const nomeArquivo = `${uuidv4()}${extensao}`;
    await fs.promises.writeFile(path.join(UPLOADS_DIR, nomeArquivo), conteudo);
    return `${UPLOADS_URL}/${nomeArquivo}`;
  }

  // Apaga uma imagem enviada por upload. Ignora URLs externas, base64 e arquivos que já não existem.
  async removerImagem(caminho?: string | null): Promise<void> {
    if (!caminho || !caminho.startsWith(`${UPLOADS_URL}/`)) return;

    const nomeArquivo = path.basename(caminho);
    try {
      await fs.promises.unlink(path.join(UPLOADS_DIR, nomeArquivo));
    } catch (error: any) {
      if (error.code !== 'ENOENT') console.error('Erro ao remover imagem:', error);
    }
  }
}

export const uploadService = new UploadServiceClass();
