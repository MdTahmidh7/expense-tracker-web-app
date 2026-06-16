import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OcrResult } from '../../../core/services/receipt.service';

export interface OcrReviewData {
  ocrResult: OcrResult;
  categories: { id: string; name: string }[];
}

export interface OcrReviewResult {
  amount: number;
  merchant: string;
  date: string;
  categoryId: string;
}

@Component({
  selector: 'app-ocr-review',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  template: `
    <h2 mat-dialog-title>Review Receipt</h2>
    <mat-dialog-content class="review-content">
      <div class="review-layout">
        <div class="receipt-image" *ngIf="data.ocrResult.imageUrl">
          <img [src]="data.ocrResult.imageUrl" alt="Receipt" class="receipt-img">
        </div>

        <div class="extracted-fields">
          <div class="field-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Amount (BDT)</mat-label>
              <input matInput type="number" [(ngModel)]="amount" step="0.01" required>
              <span matSuffix>
                <mat-icon [class.confidence-high]="data.ocrResult.amountConfidence >= 0.9"
                          [class.confidence-medium]="data.ocrResult.amountConfidence >= 0.7 && data.ocrResult.amountConfidence < 0.9"
                          [class.confidence-low]="data.ocrResult.amountConfidence < 0.7"
                          matTooltip="Confidence: {{ data.ocrResult.amountConfidence | percent }}">
                  {{ data.ocrResult.amountConfidence >= 0.9 ? 'check_circle' :
                     data.ocrResult.amountConfidence >= 0.7 ? 'warning' : 'error' }}
                </mat-icon>
              </span>
            </mat-form-field>
          </div>

          <div class="field-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Merchant</mat-label>
              <input matInput [(ngModel)]="merchant" required>
              <span matSuffix>
                <mat-icon [class.confidence-high]="data.ocrResult.merchantConfidence >= 0.9"
                          [class.confidence-medium]="data.ocrResult.merchantConfidence >= 0.7 && data.ocrResult.merchantConfidence < 0.9"
                          [class.confidence-low]="data.ocrResult.merchantConfidence < 0.7"
                          matTooltip="Confidence: {{ data.ocrResult.merchantConfidence | percent }}">
                  {{ data.ocrResult.merchantConfidence >= 0.9 ? 'check_circle' :
                     data.ocrResult.merchantConfidence >= 0.7 ? 'warning' : 'error' }}
                </mat-icon>
              </span>
            </mat-form-field>
          </div>

          <div class="field-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Date</mat-label>
              <input matInput [(ngModel)]="date" required>
              <span matSuffix>
                <mat-icon [class.confidence-high]="data.ocrResult.dateConfidence >= 0.9"
                          [class.confidence-medium]="data.ocrResult.dateConfidence >= 0.7 && data.ocrResult.dateConfidence < 0.9"
                          [class.confidence-low]="data.ocrResult.dateConfidence < 0.7"
                          matTooltip="Confidence: {{ data.ocrResult.dateConfidence | percent }}">
                  {{ data.ocrResult.dateConfidence >= 0.9 ? 'check_circle' :
                     data.ocrResult.dateConfidence >= 0.7 ? 'warning' : 'error' }}
                </mat-icon>
              </span>
            </mat-form-field>
          </div>

          <div class="field-row">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Category</mat-label>
              <mat-select [(ngModel)]="categoryId" required>
                <mat-option *ngFor="let cat of data.categories" [value]="cat.id">
                  {{ cat.name }}
                  <span *ngIf="cat.id === data.ocrResult.suggestedCategoryId" class="suggested-badge">
                    suggested
                  </span>
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-raised-button color="primary" [disabled]="!amount || !merchant || !date || !categoryId"
              (click)="save()">Save Entry</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .review-layout { display: flex; gap: 24px; min-width: 600px; }
    .receipt-image { flex: 1; max-width: 300px; }
    .receipt-img { width: 100%; border-radius: 8px; border: 1px solid #ddd; }
    .extracted-fields { flex: 1; display: flex; flex-direction: column; gap: 16px; }
    .field-row { width: 100%; }
    .full-width { width: 100%; }
    .confidence-high { color: #4caf50; }
    .confidence-medium { color: #ff9800; }
    .confidence-low { color: #f44336; }
    .suggested-badge { font-size: 11px; color: #999; font-style: italic; }
    .review-content { max-height: 80vh; }
  `]
})
export class OcrReviewComponent {
  private dialogRef = inject(MatDialogRef<OcrReviewComponent, OcrReviewResult>);
  data: OcrReviewData = inject(MAT_DIALOG_DATA);

  amount: number | null = this.data.ocrResult.extractedAmount;
  merchant: string = this.data.ocrResult.extractedMerchant || '';
  date: string = this.data.ocrResult.extractedDate || '';
  categoryId: string = this.data.ocrResult.suggestedCategoryId || '';

  save(): void {
    if (!this.amount || !this.merchant || !this.date || !this.categoryId) return;
    this.dialogRef.close({
      amount: this.amount,
      merchant: this.merchant,
      date: this.date,
      categoryId: this.categoryId,
    });
  }
}
