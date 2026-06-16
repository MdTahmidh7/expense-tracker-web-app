import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { ExpenseService, ExpenseCreateRequest } from '../../../core/services/expense.service';
import { CategoryService, CategoryDTO } from '../../../core/services/category.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
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

            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Category</mat-label>
                <input matInput [matAutocomplete]="auto" formControlName="categoryId"
                       (input)="onCategoryInput($any($event.target).value)"
                       [matChipInputFor]="chipGrid">
                <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onCategorySelected($event)">
                  <mat-option *ngFor="let cat of filteredCategories | async" [value]="cat.id">
                    {{ cat.name }}
                  </mat-option>
                  <mat-option *ngIf="showCreateOption()" [value]="newCategoryName">
                    + Create "{{ newCategoryName }}"
                  </mat-option>
                </mat-autocomplete>
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
  `]
})
export class ExpenseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private expenseService = inject(ExpenseService);
  private categoryService = inject(CategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isEditing = false;
  expenseId: string | null = null;
  submitting = false;
  categories: CategoryDTO[] = [];
  tags: string[] = [];
  allTags: string[] = [];
  newCategoryName = '';
  showCreateOption = () => false;
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

  filteredCategories: Observable<CategoryDTO[]>;
  filteredTags: Observable<string[]>;

  constructor() {
    const categoryControl = this.expenseForm.get('categoryId') as FormControl;
    this.filteredCategories = categoryControl.valueChanges.pipe(
      startWith(''),
      map(val => this._filterCategories(val))
    );

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

  onCategoryInput(value: string): void {
    if (!value) { this.showCreateOption = () => false; return; }
    const existing = this.categories.find(
      c => c.name.toLowerCase() === value.toLowerCase()
    );
    this.newCategoryName = value;
    this.showCreateOption = () => !existing && value.length > 0;
  }

  onCategorySelected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;
    const existing = this.categories.find(c => c.id === value);
    if (existing) {
      this.expenseForm.patchValue({ categoryId: existing.id });
      this.showCreateOption = () => false;
      return;
    }
    this.categoryService.create(value).subscribe(res => {
      if (res.success) {
        this.categories = [...this.categories, res.data];
        this.expenseForm.patchValue({ categoryId: res.data.id });
        this.showCreateOption = () => false;
      }
    });
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

  private _filterCategories(value: any): CategoryDTO[] {
    const filterValue = (typeof value === 'string' ? value : '').toLowerCase();
    return this.categories.filter(c => c.name.toLowerCase().includes(filterValue));
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
