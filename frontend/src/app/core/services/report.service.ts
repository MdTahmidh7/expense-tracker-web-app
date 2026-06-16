import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface MonthlySummary {
  totalSpent: number;
  totalBudget: number;
  budgetRemaining: number;
  topCategory: { name: string; amount: number };
  vsLastMonth: number;
  donutData: DonutSlice[];
}

export interface DonutSlice {
  category: string;
  amount: number;
  percentage: number;
}

export interface BudgetVsActualRow {
  categoryId: string;
  categoryName: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: string;
}

export interface TrendPoint {
  year: number;
  month: number;
  label: string;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {

  constructor(private api: ApiService) {}

  getMonthlySummary(year?: number, month?: number): Observable<ApiResponse<MonthlySummary>> {
    const params: Record<string, any> = {};
    if (year) params['year'] = year;
    if (month) params['month'] = month;
    return this.api.get<MonthlySummary>('/reports/monthly-summary', params);
  }

  getBudgetVsActual(year?: number, month?: number): Observable<ApiResponse<BudgetVsActualRow[]>> {
    const params: Record<string, any> = {};
    if (year) params['year'] = year;
    if (month) params['month'] = month;
    return this.api.get<BudgetVsActualRow[]>('/reports/budget-vs-actual', params);
  }

  getTrend(months: number = 6): Observable<ApiResponse<TrendPoint[]>> {
    return this.api.get<TrendPoint[]>('/reports/trend', { months });
  }

  getCategoryBreakdown(year?: number, month?: number): Observable<ApiResponse<Record<string, number>>> {
    const params: Record<string, any> = {};
    if (year) params['year'] = year;
    if (month) params['month'] = month;
    return this.api.get<Record<string, number>>('/reports/category-breakdown', params);
  }
}
