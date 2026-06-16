import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { ReportService, MonthlySummary } from '../../core/services/report.service';
import { CategoryService, CategoryDTO } from '../../core/services/category.service';
import { ExpenseService, ExpenseDTO } from '../../core/services/expense.service';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule, BaseChartDirective],
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>

      <div class="summary-cards">
        <mat-card class="summary-card">
          <mat-card-content>
            <div class="card-icon total"><mat-icon>account_balance_wallet</mat-icon></div>
            <div class="card-info">
              <span class="card-label">Total Spent</span>
              <span class="card-value">৳{{ summary?.totalSpent | number:'1.0-0' }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-content>
            <div class="card-icon budget"><mat-icon>savings</mat-icon></div>
            <div class="card-info">
              <span class="card-label">Monthly Budget</span>
              <span class="card-value">৳{{ summary?.totalBudget | number:'1.0-0' }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-content>
            <div class="card-icon remaining"><mat-icon>pie_chart</mat-icon></div>
            <div class="card-info">
              <span class="card-label">Remaining</span>
              <span class="card-value" [class.negative]="(summary?.budgetRemaining ?? 0) < 0">
                ৳{{ summary?.budgetRemaining | number:'1.0-0' }}
              </span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="summary-card">
          <mat-card-content>
            <div class="card-icon trend"><mat-icon>trending_up</mat-icon></div>
            <div class="card-info">
              <span class="card-label">vs Last Month</span>
              <span class="card-value" [class.negative]="(summary?.vsLastMonth ?? 0) > 0">
                {{ summary?.vsLastMonth | number:'1.1-1' }}%
              </span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="dashboard-grid">
        <mat-card class="chart-card">
          <mat-card-header><mat-card-title>Spending Breakdown</mat-card-title></mat-card-header>
          <mat-card-content>
            <div class="chart-container" *ngIf="donutData.length">
              <canvas baseChart
                [data]="donutChartData"
                [type]="'doughnut'"
                [options]="donutOptions">
              </canvas>
            </div>
            <p *ngIf="!donutData.length" class="no-data">No expenses this month</p>
          </mat-card-content>
        </mat-card>

        <mat-card class="budget-card">
          <mat-card-header><mat-card-title>Budget Status</mat-card-title></mat-card-header>
          <mat-card-content>
            <div *ngFor="let cat of budgetStatus" class="budget-item">
              <div class="budget-header">
                <span class="budget-cat-name">{{ cat.name }}</span>
                <span class="budget-amount">৳{{ cat.spent | number:'1.0-0' }} / ৳{{ cat.budget | number:'1.0-0' }}</span>
              </div>
              <mat-progress-bar
                [mode]="'determinate'"
                [value]="cat.percentUsed"
                [color]="cat.percentUsed >= 100 ? 'warn' : cat.percentUsed >= 80 ? 'accent' : 'primary'">
              </mat-progress-bar>
              <span class="budget-percent" [class.exceeded]="cat.percentUsed >= 100" [class.warning]="cat.percentUsed >= 80 && cat.percentUsed < 100">
                {{ cat.percentUsed | number:'1.1-1' }}% used
              </span>
            </div>
            <p *ngIf="!budgetStatus.length" class="no-data">Set budgets in Categories</p>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="recent-card">
        <mat-card-header>
          <mat-card-title>Recent Transactions</mat-card-title>
          <a mat-button routerLink="/expenses">View All</a>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="recentExpenses" class="recent-table">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let row">{{ row.date }}</td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let row">{{ row.description }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let row">{{ row.category.name }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let row">৳{{ row.amount | number:'1.2-2' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['date','description','category','amount']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['date','description','category','amount']"></tr>
          </table>
          <p *ngIf="!recentExpenses.length" class="no-data">No recent expenses</p>
        </mat-card-content>
      </mat-card>

      <button mat-fab color="primary" class="fab" routerLink="/expenses/new">
        <mat-icon>add</mat-icon>
      </button>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 1200px; margin: 0 auto; position: relative; }
    h1 { margin: 0 0 20px; font-size: 24px; font-weight: 400; }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .summary-card mat-card-content { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .card-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .card-icon mat-icon { font-size: 28px; width: 28px; height: 28px; color: white; }
    .card-icon.total { background: #3f51b5; }
    .card-icon.budget { background: #4caf50; }
    .card-icon.remaining { background: #ff9800; }
    .card-icon.trend { background: #e91e63; }
    .card-info { display: flex; flex-direction: column; }
    .card-label { font-size: 13px; color: #666; }
    .card-value { font-size: 22px; font-weight: 500; }
    .card-value.negative { color: #f44336; }
    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    @media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
    .chart-container { max-width: 400px; margin: 0 auto; }
    .budget-item { margin-bottom: 16px; }
    .budget-header { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 13px; }
    .budget-cat-name { font-weight: 500; }
    .budget-amount { color: #666; }
    .budget-percent { font-size: 12px; color: #666; }
    .budget-percent.exceeded { color: #f44336; }
    .budget-percent.warning { color: #ff9800; }
    .recent-card { margin-bottom: 24px; }
    .recent-table { width: 100%; }
    .no-data { text-align: center; color: #999; padding: 24px; }
    .fab { position: fixed; bottom: 24px; right: 24px; }
  `]
})
export class DashboardComponent implements OnInit {
  summary: MonthlySummary | null = null;
  recentExpenses: ExpenseDTO[] = [];
  budgetStatus: { name: string; spent: number; budget: number; percentUsed: number }[] = [];
  donutData: { category: string; amount: number; percentage: number }[] = [];

  donutChartData: any = { labels: [], datasets: [] };
  donutOptions: any = {
    responsive: true,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 12 } } }
    }
  };

  constructor(
    private reportService: ReportService,
    private categoryService: CategoryService,
    private expenseService: ExpenseService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.reportService.getMonthlySummary().subscribe(res => {
      if (res.success && res.data) {
        this.summary = res.data;
        this.donutData = res.data.donutData;
        this.donutChartData = {
          labels: res.data.donutData.map(d => d.category),
          datasets: [{
            data: res.data.donutData.map(d => d.amount),
            backgroundColor: ['#3f51b5','#4caf50','#ff9800','#e91e63','#9c27b0','#00bcd4','#f44336','#607d8b','#795548','#cddc39'],
          }]
        };
      }
    });

    this.expenseService.getAll({ page: 0, size: 5 }).subscribe(res => {
      if (res.success && res.data) {
        this.recentExpenses = res.data.content;
      }
    });

    this.categoryService.getAll().subscribe(res => {
      if (res.success && res.data) {
        this.budgetStatus = res.data
          .filter(c => c.monthlyBudget && c.monthlyBudget > 0)
          .map(c => ({
            name: c.name,
            spent: c.spentThisMonth,
            budget: c.monthlyBudget!,
            percentUsed: c.monthlyBudget! > 0
              ? Math.round((c.spentThisMonth / c.monthlyBudget!) * 1000) / 10
              : 0
          }));
      }
    });
  }
}
