import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

@Injectable({ providedIn: 'root' })
export class TagService {

  constructor(private api: ApiService) {}

  getAll(): Observable<ApiResponse<string[]>> {
    return this.api.get<string[]>('/tags');
  }

  rename(oldName: string, newName: string): Observable<ApiResponse<void>> {
    return this.api.put<void>('/tags/rename', { oldName, newName });
  }

  merge(sourceTag: string, targetTag: string): Observable<ApiResponse<void>> {
    return this.api.post<void>('/tags/merge', { sourceTag, targetTag });
  }
}
