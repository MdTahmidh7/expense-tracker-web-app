import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <mat-icon class="not-found-icon">search_off</mat-icon>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <button mat-raised-button color="primary" routerLink="/dashboard">
        Go to Dashboard
      </button>
    </div>
  `,
  styles: [`
    .not-found-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 16px; text-align: center; }
    .not-found-icon { font-size: 64px; width: 64px; height: 64px; color: #999; }
  `]
})
export class NotFoundComponent {}
