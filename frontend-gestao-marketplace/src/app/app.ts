import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router'; // OBRIGATÓRIO para o router-outlet funcionar

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet], // OBRIGATÓRIO adicionar aqui
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent { // O nome da classe deve ser AppComponent para o main.ts encontrar
  title = 'vendas-immb';
}
