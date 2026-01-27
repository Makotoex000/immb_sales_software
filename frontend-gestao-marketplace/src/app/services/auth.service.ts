import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usuarioLogado = new BehaviorSubject<Usuario | null>(null);
  public usuarioLogado$ = this.usuarioLogado.asObservable();

  constructor(private storageService: StorageService) {
    const usuario = this.storageService.obterUsuarioLogado();
    if (usuario) {
      this.usuarioLogado.next(usuario);
    }
  }

  login(email: string, senha: string): Observable<boolean> {
    return new Observable(observer => {
      // Simulação de login - em produção seria chamada a API
      setTimeout(() => {
        if (email && senha) {
          const usuario: Usuario = {
            id: `user-${Date.now()}`,
            email,
            nome: email.split('@')[0]
          };
          this.storageService.setUsuarioLogado(usuario);
          this.usuarioLogado.next(usuario);
          observer.next(true);
        } else {
          observer.next(false);
        }
        observer.complete();
      }, 500);
    });
  }

  logout(): void {
    this.storageService.limparUsuarioLogado();
    this.usuarioLogado.next(null);
  }

  estaLogado(): boolean {
    return this.usuarioLogado.value !== null;
  }

  obterUsuarioAtual(): Usuario | null {
    return this.usuarioLogado.value;
  }
}
