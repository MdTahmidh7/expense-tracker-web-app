import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { CategoryService, CategoryDTO } from '../../../core/services/category.service';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  template: `
    <div class="categories-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Categories</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="add-category">
            <mat-form-field appearance="outline">
              <mat-label>New category name</mat-label>
              <input matInput [(ngModel)]="newCategoryName" (keyup.enter)="addCategory()">
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="addCategory()" [disabled]="!newCategoryName.trim()">
              <mat-icon>add</mat-icon> Add
            </button>
          </div>

          <table mat-table [dataSource]="categories" class="category-table">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let cat">
                <mat-icon *ngIf="cat.isPredefined" matTooltip="Predefined category" class="lock-icon">lock</mat-icon>
                {{ cat.name }}
              </td>
            </ng-container>

            <ng-container matColumnDef="budget">
              <th mat-header-cell *matHeaderCellDef>Monthly Budget (BDT)</th>
              <td mat-cell *matCellDef="let cat">
                <mat-form-field appearance="outline" class="budget-input">
                  <input matInput type="number" [ngModel]="cat.monthlyBudget"
                         (ngModelChange)="onBudgetChange(cat, $event)" placeholder="No budget" min="0">
                  <span matTextSuffix *ngIf="cat.monthlyBudget !== null">.00</span>
                </mat-form-field>
              </td>
            </ng-container>

            <ng-container matColumnDef="spent">
              <th mat-header-cell *matHeaderCellDef>Spent This Month</th>
              <td mat-cell *matCellDef="let cat">৳{{ cat.spentThisMonth | number:'1.2-2' }}</td>
            </ng-container>

            <ng-container matColumnDef="remaining">
              <th mat-header-cell *matHeaderCellDef>Remaining</th>
              <td mat-cell *matCellDef="let cat">
                <span *ngIf="cat.monthlyBudget !== null"
                      [class.over-budget]="cat.spentThisMonth > cat.monthlyBudget"
                      [class.near-limit]="cat.spentThisMonth >= cat.monthlyBudget * 0.8 && cat.spentThisMonth <= cat.monthlyBudget">
                  ৳{{ (cat.monthlyBudget - cat.spentThisMonth) | number:'1.2-2' }}
                </span>
                <span *ngIf="cat.monthlyBudget === null" class="no-budget">—</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let cat">
                <button mat-icon-button color="warn" *ngIf="!cat.isPredefined"
                        matTooltip="Delete category" (click)="deleteCategory(cat)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .categories-container { max-width: 800px; margin: 24px auto; padding: 0 16px; }
    .add-category { display: flex; gap: 12px; align-items: baseline; margin-bottom: 24px; }
    .category-table { width: 100%; }
    .budget-input { width: 140px; }
    .lock-icon { color: #999; margin-right: 8px; font-size: 18px; vertical-align: middle; }
    .over-budget { color: #f44336; font-weight: 500; }
    .near-limit { color: #ff9800; font-weight: 500; }
    .no-budget { color: #999; }
  `]
})
export class CategoryListComponent implements OnInit {
  displayedColumns = ['name', 'budget', 'spent', 'remaining', 'actions'];
  categories: CategoryDTO[] = [];
  newCategoryName = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe(res => {
      if (res.success) this.categories = res.data;
    });
  }

  addCategory(): void {
    const name = this.newCategoryName.trim();
    if (!name) return;
    this.categoryService.create(name).subscribe(res => {
      if (res.success) {
        this.categories = [...this.categories, res.data];
        this.newCategoryName = '';
      }
    });
  }

  onBudgetChange(cat: CategoryDTO, value: number | null): void {
    const budget = value !== null && value >= 0 ? value : null;
    this.categoryService.update(cat.id, { monthlyBudget: budget }).subscribe(res => {
      if (res.success) {
        this.categories = this.categories.map(c => c.id === cat.id ? res.data : c);
      }
    });
  }

  deleteCategory(cat: CategoryDTO): void {
    const msg = `Delete "${cat.name}"? This cannot be undone.`;
    if (confirm(msg)) {
      this.categoryService.delete(cat.id).subscribe(() => {
        this.categories = this.categories.filter(c => c.id !== cat.id);
      });
    }
  }
}
