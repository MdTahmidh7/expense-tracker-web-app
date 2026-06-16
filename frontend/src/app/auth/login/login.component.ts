import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <mat-icon class="logo-icon">account_balance_wallet</mat-icon>
        <h1>ExpenseTracker</h1>
        <p class="subtitle">Know where your money goes</p>
        <button mat-raised-button color="primary" (click)="login()" class="google-btn">
          <mat-icon>login</mat-icon>
          Sign in with Google
        </button>
        <p class="hint">Signing in with Google auto-creates your account.</p>
      </div>
    </div>
  `,
  styles: [`
    .login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5; }
    .login-card { text-align: center; padding: 48px; background: white; border-radius: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 400px; width: 90%; }
    .logo-icon { font-size: 64px; width: 64px; height: 64px; color: #3f51b5; }
    h1 { margin: 16px 0 8px; font-size: 28px; }
    .subtitle { color: #666; margin-bottom: 32px; }
    .google-btn { width: 100%; padding: 8px; font-size: 16px; }
    .hint { margin-top: 24px; font-size: 13px; color: #999; }
  `]
})
export class LoginComponent {
  constructor(private authService: AuthService, private router: Router) {
    this.authService.isAuthenticated().subscribe(ok => {
      if (ok) this.router.navigate(['/dashboard']);
    });
  }

  login(): void {
    this.authService.loginWithGoogle();
  }
}
