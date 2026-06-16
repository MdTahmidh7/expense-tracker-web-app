import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface RecurringTemplateDTO {
  id: string;
  amount: number;
  description: string;
  notes: string | null;
  paymentMethod: string;
  dayOfMonth: number;
  isActive: boolean;
  category: { id: string; name: string };
  createdAt: string;
}

export interface RecurringTemplateRequest {
  categoryId: string;
  amount: number;
  description: string;
  notes?: string | null;
  paymentMethod?: string;
  dayOfMonth: number;
}

@Injectable({ providedIn: 'root' })
export class RecurringService {

  constructor(private api: ApiService) {}

  getAll(): Observable<ApiResponse<RecurringTemplateDTO[]>> {
    return this.api.get<RecurringTemplateDTO[]>('/recurring-templates');
  }

  getById(id: string): Observable<ApiResponse<RecurringTemplateDTO>> {
    return this.api.get<RecurringTemplateDTO>(`/recurring-templates/${id}`);
  }

  create(req: RecurringTemplateRequest): Observable<ApiResponse<RecurringTemplateDTO>> {
    return this.api.post<RecurringTemplateDTO>('/recurring-templates', req);
  }

  update(id: string, req: RecurringTemplateRequest): Observable<ApiResponse<RecurringTemplateDTO>> {
    return this.api.put<RecurringTemplateDTO>(`/recurring-templates/${id}`, req);
  }

  deactivate(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/recurring-templates/${id}`);
  }
}
