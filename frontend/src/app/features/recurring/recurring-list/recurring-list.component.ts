import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { RecurringService, RecurringTemplateDTO } from '../../../core/services/recurring.service';
import { CategoryService, CategoryDTO } from '../../../core/services/category.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-recurring-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  template: `
    <div class="recurring-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Recurring Templates</mat-card-title>
          <button mat-raised-button color="primary" (click)="openDialog()">
            <mat-icon>add</mat-icon> Add Template
          </button>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="templates" class="recurring-table">
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let row">{{ row.description }}</td>
            </ng-container>
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let row">{{ row.category.name }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let row">৳{{ row.amount | number:'1.2-2' }}</td>
            </ng-container>
            <ng-container matColumnDef="dayOfMonth">
              <th mat-header-cell *matHeaderCellDef>Day of Month</th>
              <td mat-cell *matCellDef="let row">{{ row.dayOfMonth }}</td>
            </ng-container>
            <ng-container matColumnDef="paymentMethod">
              <th mat-header-cell *matHeaderCellDef>Payment</th>
              <td mat-cell *matCellDef="let row">{{ row.paymentMethod }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let row">
                <button mat-icon-button (click)="editTemplate(row)"><mat-icon>edit</mat-icon></button>
                <button mat-icon-button color="warn" (click)="deactivateTemplate(row.id)"><mat-icon>delete</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="['description','category','amount','dayOfMonth','paymentMethod','actions']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['description','category','amount','dayOfMonth','paymentMethod','actions']"></tr>
            <tr *matNoDataRow><td colspan="6">No recurring templates</td></tr>
          </table>
        </mat-card-content>
      </mat-card>

      <div class="info-card">
        <mat-card>
          <mat-card-content>
            <mat-icon>info</mat-icon>
            <span>Recurring entries are auto-generated on the 1st of each month at midnight.</span>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- Dialog -->
    <ng-template #dialogTemplate>
      <h2 mat-dialog-title>{{ editingId ? 'Edit' : 'New' }} Recurring Template</h2>
      <mat-dialog-content>
        <div class="dialog-form">
          <mat-form-field appearance="outline">
            <mat-label>Description</mat-label>
            <input matInput [(ngModel)]="formData.description" required>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="formData.categoryId" required>
              <mat-option *ngFor="let cat of categories" [value]="cat.id">{{ cat.name }}</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Amount</mat-label>
            <input matInput type="number" step="0.01" [(ngModel)]="formData.amount" required>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Day of Month</mat-label>
            <input matInput type="number" min="1" max="31" [(ngModel)]="formData.dayOfMonth" required>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Payment Method</mat-label>
            <mat-select [(ngModel)]="formData.paymentMethod">
              <mat-option value="Cash">Cash</mat-option>
              <mat-option value="Debit Card">Debit Card</mat-option>
              <mat-option value="Credit Card">Credit Card</mat-option>
              <mat-option value="Bank Transfer">Bank Transfer</mat-option>
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Notes</mat-label>
            <textarea matInput [(ngModel)]="formData.notes" rows="3"></textarea>
          </mat-form-field>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button color="primary" [disabled]="!formValid()" (click)="save()">Save</button>
      </mat-dialog-actions>
    </ng-template>
  `,
  styles: [`
    .recurring-container { max-width: 1000px; margin: 0 auto; }
    mat-card-header { display: flex; justify-content: space-between; align-items: center; }
    .recurring-table { width: 100%; }
    .info-card { margin-top: 16px; }
    .info-card mat-card-content { display: flex; align-items: center; gap: 12px; font-size: 13px; color: #666; }
    .dialog-form { display: flex; flex-direction: column; gap: 12px; min-width: 400px; padding-top: 8px; }
  `]
})
export class RecurringListComponent implements OnInit {
  templates: RecurringTemplateDTO[] = [];
  categories: CategoryDTO[] = [];
  editingId: string | null = null;
  formData: any = { description: '', categoryId: '', amount: null, dayOfMonth: 1, paymentMethod: 'Cash', notes: '' };

  @ViewChild('dialogTemplate') dialogTemplate!: TemplateRef<any>;

  constructor(
    private recurringService: RecurringService,
    private categoryService: CategoryService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.categoryService.getAll().subscribe(res => {
      if (res.success) this.categories = res.data;
    });
  }

  private loadTemplates(): void {
    this.recurringService.getAll().subscribe(res => {
      if (res.success) this.templates = res.data;
    });
  }

  openDialog(): void {
    this.editingId = null;
    this.formData = { description: '', categoryId: '', amount: null, dayOfMonth: 1, paymentMethod: 'Cash', notes: '' };
    const ref = this.dialog.open(this.dialogTemplate);
    ref.afterClosed().subscribe(result => {
      if (result) this.loadTemplates();
    });
  }

  editTemplate(template: RecurringTemplateDTO): void {
    this.editingId = template.id;
    this.formData = {
      description: template.description,
      categoryId: template.category.id,
      amount: template.amount,
      dayOfMonth: template.dayOfMonth,
      paymentMethod: template.paymentMethod,
      notes: template.notes || '',
    };
    this.dialog.open(this.dialogTemplate);
  }

  formValid(): boolean {
    return this.formData.description && this.formData.categoryId && this.formData.amount > 0
      && this.formData.dayOfMonth >= 1 && this.formData.dayOfMonth <= 31;
  }

  save(): void {
    if (!this.formValid()) return;
    const req = {
      description: this.formData.description,
      categoryId: this.formData.categoryId,
      amount: this.formData.amount,
      dayOfMonth: this.formData.dayOfMonth,
      paymentMethod: this.formData.paymentMethod || 'Cash',
      notes: this.formData.notes || null,
    };
    const obs = this.editingId
      ? this.recurringService.update(this.editingId, req)
      : this.recurringService.create(req);
    obs.subscribe(() => {
      this.dialog.closeAll();
      this.loadTemplates();
    });
  }

  deactivateTemplate(id: string): void {
    if (confirm('Deactivate this recurring template?')) {
      this.recurringService.deactivate(id).subscribe(() => this.loadTemplates());
    }
  }
}
