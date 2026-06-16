import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../../shared/material.module';
import { ExpenseService, ExpenseDTO, ExpenseFilters } from '../../../core/services/expense.service';
import { CategoryService, CategoryDTO } from '../../../core/services/category.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MaterialModule],
  template: `
    <div class="list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Expenses</mat-card-title>
          <button mat-raised-button color="primary" (click)="addExpense()">
            <mat-icon>add</mat-icon> Add Expense
          </button>
        </mat-card-header>
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search</mat-label>
              <input matInput [formControl]="searchCtrl" placeholder="Search expenses...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select [formControl]="categoryCtrl">
                <mat-option value="">All</mat-option>
                <mat-option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Payment</mat-label>
              <mat-select [formControl]="paymentCtrl">
                <mat-option value="">All</mat-option>
                <mat-option value="Cash">Cash</mat-option>
                <mat-option value="Debit Card">Debit Card</mat-option>
                <mat-option value="Credit Card">Credit Card</mat-option>
                <mat-option value="Bank Transfer">Bank Transfer</mat-option>
                <mat-option value="Other">Other</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" [formControl]="startDateCtrl">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" [formControl]="endDateCtrl">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="table-wrapper">
            <table mat-table [dataSource]="dataSource" matSort class="expense-table">
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
                <td mat-cell *matCellDef="let row">{{ row.date }}</td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Description</th>
                <td mat-cell *matCellDef="let row">{{ row.description }}</td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Category</th>
                <td mat-cell *matCellDef="let row">{{ row.category.name }}</td>
              </ng-container>

              <ng-container matColumnDef="paymentMethod">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Payment</th>
                <td mat-cell *matCellDef="let row">{{ row.paymentMethod }}</td>
              </ng-container>

              <ng-container matColumnDef="amount">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Amount</th>
                <td mat-cell *matCellDef="let row" class="amount-cell">
                  ৳{{ row.amount | number:'1.2-2' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="receipt">
                <th mat-header-cell *matHeaderCellDef>Receipt</th>
                <td mat-cell *matCellDef="let row">
                  <mat-icon *ngIf="row.receiptImageUrl" color="primary">receipt</mat-icon>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row">
                  <button mat-icon-button (click)="editExpense(row.id); $event.stopPropagation()">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button color="warn" (click)="deleteExpense(row.id); $event.stopPropagation()">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                  class="clickable-row" (click)="viewExpense(row.id)"></tr>

              <tr class="mat-row" *matNoDataRow>
                <td class="mat-cell" [attr.colspan]="displayedColumns.length">No expenses found</td>
              </tr>
            </table>
          </div>

          <mat-paginator [pageSize]="50" [pageSizeOptions]="[20, 50, 100]"
                         showFirstLastButtons></mat-paginator>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .list-container { max-width: 1200px; margin: 24px auto; padding: 0 16px; }
    .filters { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; align-items: baseline; }
    .search-field { flex: 1; min-width: 200px; }
    .table-wrapper { overflow-x: auto; }
    .expense-table { width: 100%; }
    .amount-cell { font-weight: 500; text-align: right; }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: #f5f5f5; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; }
  `]
})
export class ExpenseListComponent implements OnInit {
  displayedColumns = ['date', 'description', 'category', 'paymentMethod', 'amount', 'receipt', 'actions'];
  dataSource = new MatTableDataSource<ExpenseDTO>([]);
  categories: CategoryDTO[] = [];
  totalElements = 0;

  searchCtrl = new FormControl('');
  categoryCtrl = new FormControl('');
  paymentCtrl = new FormControl('');
  startDateCtrl = new FormControl('');
  endDateCtrl = new FormControl('');

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadExpenses();

    this.searchCtrl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => this.loadExpenses());
    this.categoryCtrl.valueChanges.subscribe(() => this.loadExpenses());
    this.paymentCtrl.valueChanges.subscribe(() => this.loadExpenses());
    this.startDateCtrl.valueChanges.subscribe(() => this.loadExpenses());
    this.endDateCtrl.valueChanges.subscribe(() => this.loadExpenses());
  }

  private loadCategories(): void {
    this.categoryService.getAll().subscribe(res => {
      if (res.success) this.categories = res.data;
    });
  }

  loadExpenses(): void {
    const filters: ExpenseFilters = {
      page: this.paginator?.pageIndex || 0,
      size: this.paginator?.pageSize || 50,
      search: this.searchCtrl.value || undefined,
      categoryId: this.categoryCtrl.value || undefined,
      paymentMethod: this.paymentCtrl.value || undefined,
      startDate: this.startDateCtrl.value || undefined,
      endDate: this.endDateCtrl.value || undefined,
    };

    this.expenseService.getAll(filters).subscribe(res => {
      if (res.success && res.data) {
        this.dataSource.data = res.data.content;
        this.totalElements = res.data.totalElements;
        if (this.paginator) {
          this.paginator.length = res.data.totalElements;
          this.paginator.pageIndex = res.data.page;
        }
      }
    });
  }

  addExpense(): void {
    this.router.navigate(['/expenses/new']);
  }

  viewExpense(id: string): void {
    this.router.navigate(['/expenses', id]);
  }

  editExpense(id: string): void {
    this.router.navigate(['/expenses', id, 'edit']);
  }

  deleteExpense(id: string): void {
    if (confirm('Delete this expense?')) {
      this.expenseService.delete(id).subscribe(() => this.loadExpenses());
    }
  }
}
