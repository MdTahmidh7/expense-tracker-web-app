import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../material.module';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <button mat-icon-button (click)="sidenav.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="brand" routerLink="/dashboard">ExpenseTracker</span>
      <span class="spacer"></span>
      <button mat-icon-button [matMenuTriggerFor]="menu">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item routerLink="/settings">
          <mat-icon>settings</mat-icon> Settings
        </button>
        <mat-divider></mat-divider>
        <button mat-menu-item (click)="logout()">
          <mat-icon>logout</mat-icon> Logout
        </button>
      </mat-menu>
    </mat-toolbar>

    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav mode="side" opened class="app-sidenav">
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
            <mat-icon>dashboard</mat-icon> Dashboard
          </a>
          <a mat-list-item routerLink="/expenses" routerLinkActive="active-link">
            <mat-icon>receipt</mat-icon> Expenses
          </a>
          <a mat-list-item routerLink="/categories" routerLinkActive="active-link">
            <mat-icon>category</mat-icon> Categories
          </a>
          <a mat-list-item routerLink="/reports" routerLinkActive="active-link">
            <mat-icon>bar_chart</mat-icon> Reports
          </a>
          <a mat-list-item routerLink="/recurring" routerLinkActive="active-link">
            <mat-icon>repeat</mat-icon> Recurring
          </a>
          <a mat-list-item routerLink="/settings" routerLinkActive="active-link">
            <mat-icon>settings</mat-icon> Settings
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="sidenav-content">
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-toolbar { position: fixed; top: 0; left: 0; right: 0; z-index: 100; }
    .brand { cursor: pointer; font-weight: 500; margin-left: 8px; }
    .spacer { flex: 1 1 auto; }
    .sidenav-container { margin-top: 64px; height: calc(100vh - 64px); }
    .app-sidenav { width: 240px; border-right: 1px solid #e0e0e0; }
    .app-sidenav mat-nav-list a { display: flex; align-items: center; gap: 12px; }
    .app-sidenav mat-icon { margin-right: 8px; }
    .active-link { background: rgba(63, 81, 181, 0.1); color: #3f51b5; font-weight: 500; }
    .sidenav-content { min-height: 100%; }
    .content-wrapper { padding: 16px; }
  `]
})
export class MainLayoutComponent {
  constructor(private authService: AuthService) {}

  logout(): void {
    this.authService.logout();
  }
}
