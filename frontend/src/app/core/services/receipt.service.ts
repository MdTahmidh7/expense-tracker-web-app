import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService, ApiResponse } from './api.service';

export interface OcrResult {
  receiptImageId: string;
  extractedAmount: number | null;
  amountConfidence: number;
  extractedMerchant: string | null;
  merchantConfidence: number;
  extractedDate: string | null;
  dateConfidence: number;
  suggestedCategoryId: string | null;
  suggestedCategoryName: string | null;
  categoryConfidence: number;
  imageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {

  constructor(private api: ApiService) {}

  upload(file: File): Observable<ApiResponse<OcrResult>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<OcrResult>('/receipts/upload', formData);
  }
}
