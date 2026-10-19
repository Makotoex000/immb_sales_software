import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../environments/environment';

// Endereço do backend sem o "/api" (ex: http://localhost:3000)
const BACKEND_URL = (environment.apiUrl || 'http://localhost:3000/api').replace(/\/api\/?$/, '');

// O banco guarda só o caminho das imagens enviadas (/uploads/abc.jpg).
// Este pipe completa com o endereço do backend; URLs externas e base64 antigos passam direto.
@Pipe({ name: 'imagemUrl' })
export class ImagemUrlPipe implements PipeTransform {
  transform(imagem: string | null | undefined, padrao = ''): string {
    if (!imagem) return padrao;
    return imagem.startsWith('/uploads/') ? `${BACKEND_URL}${imagem}` : imagem;
  }
}
