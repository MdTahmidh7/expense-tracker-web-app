import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { ApiService, UserProfileDTO } from '../../core/services/api.service';
import { AuthService } from '../../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  template: `
    <div class="settings-container">
      <h1>Settings</h1>

      <mat-card class="settings-card">
        <mat-card-header><mat-card-title>Profile</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="settings-form">
            <mat-form-field appearance="outline">
              <mat-label>Display Name</mat-label>
              <input matInput [(ngModel)]="form.displayName">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput [value]="profile?.email" disabled>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Timezone</mat-label>
              <mat-select [(ngModel)]="form.timezone">
                <mat-option value="Asia/Dhaka">Asia/Dhaka (UTC+6)</mat-option>
                <mat-option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</mat-option>
                <mat-option value="UTC">UTC</mat-option>
                <mat-option value="America/New_York">America/New_York (UTC-5)</mat-option>
                <mat-option value="Europe/London">Europe/London (UTC+0)</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Currency</mat-label>
              <mat-select [(ngModel)]="form.currency">
                <mat-option value="BDT">BDT (৳)</mat-option>
                <mat-option value="USD">USD ($)</mat-option>
                <mat-option value="EUR">EUR (€)</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Default Payment Method</mat-label>
              <mat-select [(ngModel)]="form.defaultPaymentMethod">
                <mat-option value="Cash">Cash</mat-option>
                <mat-option value="Debit Card">Debit Card</mat-option>
                <mat-option value="Credit Card">Credit Card</mat-option>
                <mat-option value="Bank Transfer">Bank Transfer</mat-option>
                <mat-option value="Other">Other</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Session Timeout (hours)</mat-label>
              <mat-select [(ngModel)]="form.sessionTimeoutHours">
                <mat-option [value]="1">1 hour</mat-option>
                <mat-option [value]="4">4 hours</mat-option>
                <mat-option [value]="24">24 hours</mat-option>
                <mat-option [value]="168">7 days</mat-option>
              </mat-select>
            </mat-form-field>
            <div class="actions">
              <button mat-raised-button color="primary" (click)="saveSettings()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save Settings' }}
              </button>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="settings-card">
        <mat-card-header><mat-card-title>Export Data</mat-card-title></mat-card-header>
        <mat-card-content>
          <p>Download all your expenses as a CSV file.</p>
          <div class="export-form">
            <mat-form-field appearance="outline">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" [(ngModel)]="exportStart">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" [(ngModel)]="exportEnd">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="exportCsv()">
              <mat-icon>download</mat-icon> Export CSV
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="settings-card danger-card">
        <mat-card-header><mat-card-title>Delete Account</mat-card-title></mat-card-header>
        <mat-card-content>
          <p class="danger-text">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button mat-raised-button color="warn" (click)="deleteAccount()">
            <mat-icon>delete_forever</mat-icon> Delete My Account
          </button>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container { max-width: 700px; margin: 0 auto; }
    h1 { margin: 0 0 20px; font-size: 24px; font-weight: 400; }
    .settings-card { margin-bottom: 20px; }
    .settings-form { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
    .actions { margin-top: 8px; }
    .export-form { display: flex; gap: 12px; align-items: baseline; flex-wrap: wrap; }
    .danger-card { border-left: 4px solid #f44336; }
    .danger-text { color: #666; font-size: 14px; }
  `]
})
export class SettingsComponent implements OnInit {
  profile: UserProfileDTO | null = null;
  form: any = { displayName: '', timezone: 'Asia/Dhaka', currency: 'BDT', defaultPaymentMethod: 'Cash', sessionTimeoutHours: 24 };
  saving = false;
  exportStart: string = '';
  exportEnd: string = '';

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.api.get<UserProfileDTO>('/settings').subscribe(res => {
      if (res.success && res.data) {
        this.profile = res.data;
        this.form.displayName = res.data.displayName;
        this.form.timezone = res.data.timezone;
        this.form.currency = res.data.currency;
        this.form.defaultPaymentMethod = res.data.defaultPaymentMethod;
        this.form.sessionTimeoutHours = res.data.sessionTimeoutHours;
      }
    });
  }

  saveSettings(): void {
    this.saving = true;
    this.api.put<UserProfileDTO>('/settings', this.form).subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          alert('Settings saved!');
        }
      },
      error: () => { this.saving = false; alert('Failed to save settings'); }
    });
  }

  exportCsv(): void {
    const params = new URLSearchParams();
    if (this.exportStart) params.set('startDate', this.exportStart);
    if (this.exportEnd) params.set('endDate', this.exportEnd);
    window.location.href = `/api/export/csv?${params.toString()}`;
  }

  deleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This cannot be undone!')) {
      this.api.delete<void>('/account').subscribe(() => {
        this.authService.logout();
      });
    }
  }
}
