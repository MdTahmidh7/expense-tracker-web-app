import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { ReportService, MonthlySummary, BudgetVsActualRow, TrendPoint } from '../../core/services/report.service';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule, BaseChartDirective],
  template: `
    <div class="reports-container">
      <div class="header">
        <h1>Reports</h1>
        <div class="period-selector">
          <mat-form-field appearance="outline">
            <mat-label>Year</mat-label>
            <mat-select [(ngModel)]="selectedYear" (selectionChange)="loadReports()">
              <mat-option *ngFor="let y of years" [value]="y">{{ y }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Month</mat-label>
            <mat-select [(ngModel)]="selectedMonth" (selectionChange)="loadReports()">
              <mat-option *ngFor="let m of months" [value]="m">{{ m | number:'2.0-0' }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <mat-tab-group>
        <mat-tab label="Budget vs Actual">
          <div class="tab-content">
            <div class="summary-bar" *ngIf="summary">
              <span>Total Spent: <strong>৳{{ summary.totalSpent | number:'1.0-0' }}</strong></span>
              <span>Budget: <strong>৳{{ summary.totalBudget | number:'1.0-0' }}</strong></span>
              <span [class.negative]="summary.budgetRemaining < 0">
                Remaining: <strong>৳{{ summary.budgetRemaining | number:'1.0-0' }}</strong>
              </span>
            </div>
            <table mat-table [dataSource]="budgetRows" class="budget-table">
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let row">{{ row.categoryName }}</td>
              </ng-container>
              <ng-container matColumnDef="budgeted">
                <th mat-header-cell *matHeaderCellDef>Budgeted</th>
                <td mat-cell *matCellDef="let row">৳{{ row.budgeted | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="spent">
                <th mat-header-cell *matHeaderCellDef>Spent</th>
                <td mat-cell *matCellDef="let row">৳{{ row.spent | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="remaining">
                <th mat-header-cell *matHeaderCellDef>Remaining</th>
                <td mat-cell *matCellDef="let row">৳{{ row.remaining | number:'1.0-0' }}</td>
              </ng-container>
              <ng-container matColumnDef="progress">
                <th mat-header-cell *matHeaderCellDef>Progress</th>
                <td mat-cell *matCellDef="let row">
                  <mat-progress-bar mode="determinate" [value]="row.percentUsed"
                    [color]="row.percentUsed >= 100 ? 'warn' : row.percentUsed >= 80 ? 'accent' : 'primary'">
                  </mat-progress-bar>
                  <span class="progress-label" [class.exceeded]="row.percentUsed >= 100">
                    {{ row.percentUsed | number:'1.1-1' }}%
                  </span>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['category','budgeted','spent','remaining','progress']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['category','budgeted','spent','remaining','progress']"></tr>
              <tr *matNoDataRow><td colspan="5">No budget data</td></tr>
            </table>
          </div>
        </mat-tab>

        <mat-tab label="6-Month Trend">
          <div class="tab-content">
            <div class="chart-wrapper" *ngIf="trendData.length">
              <canvas baseChart
                [data]="trendChartData"
                [type]="'line'"
                [options]="trendOptions">
              </canvas>
            </div>
            <p *ngIf="!trendData.length" class="no-data">No trend data available</p>
          </div>
        </mat-tab>

        <mat-tab label="Category Breakdown">
          <div class="tab-content">
            <div class="chart-wrapper" *ngIf="categoryBreakdownKeys.length">
              <canvas baseChart
                [data]="breakdownChartData"
                [type]="'pie'"
                [options]="pieOptions">
              </canvas>
            </div>
            <p *ngIf="!categoryBreakdownKeys.length" class="no-data">No expense data for this period</p>

            <table mat-table [dataSource]="breakdownRows" class="breakdown-table" *ngIf="categoryBreakdownKeys.length">
              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let row">{{ row.category }}</td>
              </ng-container>
              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef>Amount</th>
                <td mat-cell *matCellDef="let row">৳{{ row.amount | number:'1.2-2' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="['category','amount']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['category','amount']"></tr>
            </table>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .reports-container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    h1 { margin: 0; font-size: 24px; font-weight: 400; }
    .period-selector { display: flex; gap: 12px; }
    .tab-content { padding: 24px 0; }
    .summary-bar { display: flex; gap: 24px; margin-bottom: 16px; padding: 16px; background: #f5f5f5; border-radius: 8px; flex-wrap: wrap; }
    .summary-bar span.negative { color: #f44336; }
    .budget-table { width: 100%; }
    .progress-label { font-size: 12px; margin-left: 8px; }
    .progress-label.exceeded { color: #f44336; }
    .chart-wrapper { max-width: 700px; margin: 0 auto 24px; }
    .breakdown-table { width: 100%; max-width: 500px; margin: 0 auto; }
    .no-data { text-align: center; color: #999; padding: 48px; }
  `]
})
export class ReportsComponent implements OnInit {
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  years: number[] = [];
  months: number[] = Array.from({ length: 12 }, (_, i) => i + 1);

  summary: MonthlySummary | null = null;
  budgetRows: BudgetVsActualRow[] = [];
  trendData: TrendPoint[] = [];
  categoryBreakdown: Record<string, number> = {};
  categoryBreakdownKeys: string[] = [];
  breakdownRows: { category: string; amount: number }[] = [];

  trendChartData: any = { labels: [], datasets: [] };
  trendOptions: any = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: any) => '৳' + v } }
    }
  };

  pieOptions: any = {
    responsive: true,
    plugins: {
      legend: { position: 'right', labels: { font: { size: 12 } } }
    }
  };

  constructor(private reportService: ReportService) {
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  }

  ngOnInit(): void {
    this.loadReports();
    this.loadTrend();
  }

  loadReports(): void {
    this.reportService.getMonthlySummary(this.selectedYear, this.selectedMonth).subscribe(res => {
      if (res.success && res.data) this.summary = res.data;
    });

    this.reportService.getBudgetVsActual(this.selectedYear, this.selectedMonth).subscribe(res => {
      if (res.success && res.data) this.budgetRows = res.data;
    });

    this.reportService.getCategoryBreakdown(this.selectedYear, this.selectedMonth).subscribe(res => {
      if (res.success && res.data) {
        this.categoryBreakdown = res.data;
        this.categoryBreakdownKeys = Object.keys(res.data);
        this.breakdownRows = Object.entries(res.data)
          .map(([k, v]) => ({ category: k, amount: v }))
          .sort((a, b) => b.amount - a.amount);
        const colors = ['#3f51b5','#4caf50','#ff9800','#e91e63','#9c27b0','#00bcd4','#f44336','#607d8b','#795548','#cddc39','#673ab7','#009688'];
        this.breakdownChartData = {
          labels: this.categoryBreakdownKeys,
          datasets: [{
            data: this.categoryBreakdownKeys.map(k => res.data![k]),
            backgroundColor: colors.slice(0, this.categoryBreakdownKeys.length),
          }]
        };
      }
    });
  }

  breakdownChartData: any = { labels: [], datasets: [] };

  loadTrend(): void {
    this.reportService.getTrend(6).subscribe(res => {
      if (res.success && res.data) {
        this.trendData = res.data;
        this.trendChartData = {
          labels: res.data.map(t => t.label),
          datasets: [{
            label: 'Spending',
            data: res.data.map(t => t.total),
            borderColor: '#3f51b5',
            backgroundColor: 'rgba(63, 81, 181, 0.1)',
            fill: true,
            tension: 0.4
          }]
        };
      }
    });
  }
}
