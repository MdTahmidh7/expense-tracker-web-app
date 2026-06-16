import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface CategoryDTO {
  id: string;
  name: string;
  isPredefined: boolean;
  monthlyBudget: number | null;
  spentThisMonth: number;
  sortOrder: number;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {

  constructor(private api: ApiService) {}

  getAll(): Observable<ApiResponse<CategoryDTO[]>> {
    return this.api.get<CategoryDTO[]>('/categories');
  }

  create(name: string): Observable<ApiResponse<CategoryDTO>> {
    return this.api.post<CategoryDTO>('/categories', { name });
  }

  update(id: string, body: { name?: string; monthlyBudget?: number | null }): Observable<ApiResponse<CategoryDTO>> {
    return this.api.put<CategoryDTO>(`/categories/${id}`, body);
  }

  delete(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/categories/${id}`);
  }

  suggest(merchant: string): Observable<ApiResponse<CategoryDTO[]>> {
    return this.api.get<CategoryDTO[]>('/categories/suggest', { merchant });
  }
}
