import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../components/header/header';

// Layout das telas principais: header fixo e a tela da rota atual embaixo (ver app.routes.ts)
@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet, Header],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {}
