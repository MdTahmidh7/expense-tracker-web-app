import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { ExpenseService, ExpenseCreateRequest } from '../../../core/services/expense.service';
import { CategoryService, CategoryDTO } from '../../../core/services/category.service';
import { ReceiptService } from '../../../core/services/receipt.service';
import { OcrReviewComponent, OcrReviewResult } from '../ocr-review/ocr-review.component';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map, Observable, startWith } from 'rxjs';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isEditing ? 'Edit Expense' : 'Add Expense' }}</mat-card-title>
          <div class="scan-section" *ngIf="!isEditing">
            <input #fileInput type="file" accept="image/jpeg,image/png,image/heic,application/pdf"
                   (change)="onFileSelected($event)" hidden>
            <button mat-stroked-button color="primary" (click)="fileInput.click()" [disabled]="scanning">
              <mat-icon>camera_alt</mat-icon>
              {{ scanning ? 'Scanning...' : 'Scan Receipt' }}
            </button>
          </div>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()" class="expense-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Amount (BDT)</mat-label>
                <input matInput type="number" formControlName="amount" placeholder="0.00" step="0.01">
                <mat-error *ngIf="expenseForm.get('amount')?.hasError('required')">Amount is required</mat-error>
                <mat-error *ngIf="expenseForm.get('amount')?.hasError('min')">Amount must be positive</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description / Merchant</mat-label>
                <input matInput formControlName="description" placeholder="e.g., Kacchi Bhai">
                <mat-error *ngIf="expenseForm.get('description')?.hasError('required')">Description is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Date</mat-label>
                <input matInput [matDatepicker]="picker" formControlName="date">
                <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                <mat-datepicker #picker></mat-datepicker>
                <mat-error *ngIf="expenseForm.get('date')?.hasError('required')">Date is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Time</mat-label>
                <input matInput type="time" formControlName="time">
              </mat-form-field>
            </div>

            <div class="form-row full-width">
              <mat-form-field appearance="outline">
                <mat-label>Category</mat-label>
                <mat-select formControlName="categoryId">
                  <mat-option [value]="''">Select a category</mat-option>
                  <mat-option *ngFor="let cat of categories" [value]="cat.id">
                    {{ cat.name }}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="expenseForm.get('categoryId')?.hasError('required')">Category is required</mat-error>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Payment Method</mat-label>
                <mat-select formControlName="paymentMethod">
                  <mat-option value="Cash">Cash</mat-option>
                  <mat-option value="Debit Card">Debit Card</mat-option>
                  <mat-option value="Credit Card">Credit Card</mat-option>
                  <mat-option value="Bank Transfer">Bank Transfer</mat-option>
                  <mat-option value="Other">Other</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tags</mat-label>
                <mat-chip-grid #chipGrid>
                  <mat-chip-row *ngFor="let tag of tags" (removed)="removeTag(tag)">
                    {{ tag }}
                    <button matChipRemove><mat-icon>close</mat-icon></button>
                  </mat-chip-row>
                  <input [matChipInputFor]="chipGrid"
                         [matChipInputSeparatorKeyCodes]="separatorKeysCodes"
                         [matAutocomplete]="tagAuto"
                         (matChipInputTokenEnd)="addTag($event)">
                </mat-chip-grid>
                <mat-autocomplete #tagAuto="matAutocomplete" (optionSelected)="onTagSelected($event)">
                  <mat-option *ngFor="let tag of filteredTags | async" [value]="tag">{{ tag }}</mat-option>
                </mat-autocomplete>
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Notes</mat-label>
                <textarea matInput formControlName="notes" rows="3" placeholder="Optional notes..."></textarea>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-button type="button" (click)="onCancel()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="expenseForm.invalid || submitting">
                {{ submitting ? 'Saving...' : (isEditing ? 'Update' : 'Save Expense') }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container { max-width: 640px; margin: 24px auto; padding: 0 16px; }
    .expense-form { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }
    .form-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .full-width { width: 100%; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 16px; }
    .scan-section { display: flex; gap: 12px; }
    mat-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
  `]
})
export class ExpenseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private categoryService = inject(CategoryService);
  private receiptService = inject(ReceiptService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  isEditing = false;
  expenseId: string | null = null;
  submitting = false;
  scanning = false;
  receiptImagePath: string | null = null;
  categories: CategoryDTO[] = [];
  tags: string[] = [];
  allTags: string[] = [];
  separatorKeysCodes = [ENTER, COMMA];

  expenseForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    date: [new Date().toISOString().split('T')[0], Validators.required],
    time: [''],
    categoryId: ['', Validators.required],
    paymentMethod: ['Cash'],
    tags: [[] as string[]],
    notes: ['', Validators.maxLength(2000)],
  });

  filteredTags: Observable<string[]>;

  constructor() {
    const tagInput = new FormControl('');
    this.filteredTags = tagInput.valueChanges.pipe(
      startWith(''),
      map(val => this._filterTags(val))
    );
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadTags();
    this.expenseId = this.route.snapshot.paramMap.get('id');
    if (this.expenseId) {
      this.isEditing = true;
      this.expenseService.getById(this.expenseId).subscribe(res => {
        if (res.success && res.data) {
          const e = res.data;
          this.expenseForm.patchValue({
            amount: e.amount,
            description: e.description,
            date: e.date,
            time: e.time || '',
            categoryId: e.category.id,
            paymentMethod: e.paymentMethod,
            notes: e.notes,
          });
          this.tags = e.tags || [];
        }
      });
    }
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe(res => {
      if (res.success) {
        this.categories = res.data;
      }
    });
  }

  private loadTags(): void {
    // Tags loaded from tag service when available
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files.length) return;
    const file = input.files[0];
    this.scanning = true;

    this.receiptService.upload(file).subscribe({
      next: res => {
        this.scanning = false;
        if (res.success && res.data) {
          const ocr = res.data;
          const catData = this.categories.map(c => ({ id: c.id, name: c.name }));
          const dialogRef = this.dialog.open(OcrReviewComponent, {
            width: '800px',
            data: { ocrResult: ocr, categories: catData },
          });
          dialogRef.afterClosed().subscribe((result: OcrReviewResult | undefined) => {
            if (result) {
              this.expenseForm.patchValue({
                amount: result.amount,
                description: result.merchant,
                date: result.date,
                categoryId: result.categoryId,
              });
              this.receiptImagePath = ocr.imageUrl;
            }
          });
        } else {
          this.snackBar.open('Could not read receipt. Please enter details manually.', 'OK', { duration: 5000 });
        }
      },
      error: () => {
        this.scanning = false;
        this.snackBar.open('Receipt scan failed. Please try again or enter manually.', 'OK', { duration: 5000 });
      }
    });

    input.value = '';
  }

  addTag(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value && !this.tags.includes(value)) {
      this.tags = [...this.tags, value];
    }
    event.chipInput!.clear();
  }

  removeTag(tag: string): void {
    this.tags = this.tags.filter(t => t !== tag);
  }

  onTagSelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;
    if (!this.tags.includes(value)) {
      this.tags = [...this.tags, value];
    }
  }

  private _filterTags(value: any): string[] {
    const filterValue = (typeof value === 'string' ? value : '').toLowerCase();
    return this.allTags.filter(t => t.toLowerCase().includes(filterValue));
  }

  onSubmit(): void {
    if (this.expenseForm.invalid) return;
    this.submitting = true;
    const formVal = this.expenseForm.value;
    const req: ExpenseCreateRequest = {
      amount: formVal.amount!,
      description: formVal.description!,
      date: formVal.date!,
      time: formVal.time || null,
      categoryId: formVal.categoryId!,
      paymentMethod: formVal.paymentMethod || 'Cash',
      tags: this.tags,
      notes: formVal.notes || null,
      receiptImagePath: this.receiptImagePath || undefined,
    };

    const obs = this.isEditing
      ? this.expenseService.update(this.expenseId!, req)
      : this.expenseService.create(req);

    obs.subscribe(res => {
      this.submitting = false;
      if (res.success) {
        this.router.navigate(['/expenses']);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/expenses']);
  }
}
