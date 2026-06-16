import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse, PagedResponse } from './api.service';

export interface ExpenseDTO {
  id: string;
  amount: number;
  currency: string;
  description: string;
  notes: string | null;
  date: string;
  time: string | null;
  category: { id: string; name: string };
  paymentMethod: string;
  tags: string[];
  receiptImageUrl: string | null;
  isRecurring: boolean;
  recurringTemplateId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCreateRequest {
  amount: number;
  description: string;
  date: string;
  time?: string | null;
  categoryId: string;
  paymentMethod?: string;
  tags?: string[];
  notes?: string | null;
}

export interface ExpenseFilters {
  page?: number;
  size?: number;
  sort?: string;
  search?: string;
  categoryId?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ExpenseService {

  constructor(private api: ApiService) {}

  getAll(filters: ExpenseFilters = {}): Observable<ApiResponse<PagedResponse<ExpenseDTO>>> {
    return this.api.get<PagedResponse<ExpenseDTO>>('/expenses', filters as Record<string, any>);
  }

  getById(id: string): Observable<ApiResponse<ExpenseDTO>> {
    return this.api.get<ExpenseDTO>(`/expenses/${id}`);
  }

  create(req: ExpenseCreateRequest): Observable<ApiResponse<ExpenseDTO>> {
    return this.api.post<ExpenseDTO>('/expenses', req);
  }

  update(id: string, req: ExpenseCreateRequest): Observable<ApiResponse<ExpenseDTO>> {
    return this.api.put<ExpenseDTO>(`/expenses/${id}`, req);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/expenses/${id}`);
  }
}
