# Technical Architecture

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                Angular 19 Application                      │  │
│  │  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌─────────┐  │  │
│  │  │  Auth    │  │   Core    │  │  Feature │  │ Shared  │  │  │
│  │  │  Module  │  │  Module   │  │  Modules │  │ Module  │  │  │
│  │  └──────────┘  └───────────┘  └──────────┘  └─────────┘  │  │
│  │       │               │              │             │        │  │
│  │       ▼               ▼              ▼             ▼        │  │
│  │  ┌───────────────────────────────────────────────────────┐  │  │
│  │  │           HttpClient Service + Interceptors           │  │  │
│  │  │   (Auth Interceptor · Error Interceptor · Loader)     │  │  │
│  │  └───────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTP (REST JSON)
                           │ Port 4200 → proxy.conf.json → 8080
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Spring Boot 3.4 (Java 21)                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Controller  │  │   Service    │  │     Repository       │   │
│  │    Layer     │──▶    Layer     │──▶       Layer          │   │
│  │  (REST API)  │  │  (Business)  │  │   (Spring Data JPA)  │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                │                       │               │
│         ▼                ▼                       ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │    DTOs      │  │   Mappers    │  │     Entities         │   │
│  │ (Request/    │  │ (Entity ↔    │  │   (JPA @Entity)      │   │
│  │  Response)   │  │  DTO)        │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   OAuth2     │  │  Tesseract   │  │     Flyway           │   │
│  │  Security    │  │  OCR Engine  │  │   Migrations         │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  Exception Handler (@ControllerAdvice)                    │   │
│  │  Global error handling → consistent error envelope        │   │
│  └───────────────────────────────────────────────────────────┘   │
└──────────────────────────┬──────────────────────────────────────┘
                           │ JDBC
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL 16                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   app_user   │  │   category   │  │      expense         │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│  ┌──────────────────────┐  ┌──────────────────────────────────┐  │
│  │  recurring_template  │  │  File System (receipt images)    │  │
│  └──────────────────────┘  │  ~/expense-tracker/receipts/     │  │
│                            └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Architecture (Spring Boot)

### Package Structure

```
com.expensetracker
├── ExpenseTrackerApplication.java       # @SpringBootApplication
│
├── config/
│   ├── SecurityConfig.java              # OAuth2, CORS, CSRF
│   ├── WebConfig.java                   # CORS mapping
│   ├── StorageConfig.java               # File upload config
│   └── SchedulingConfig.java            # @EnableScheduling for recurring
│
├── controller/
│   ├── AuthController.java              # /api/auth/**
│   ├── CategoryController.java          # /api/categories/**
│   ├── ExpenseController.java           # /api/expenses/**
│   ├── ReceiptController.java           # /api/receipts/**
│   ├── RecurringController.java         # /api/recurring-templates/**
│   ├── ReportController.java            # /api/reports/**
│   ├── SettingsController.java          # /api/settings/**
│   ├── TagController.java               # /api/tags/**
│   └── AccountController.java           # /api/account/**
│
├── dto/
│   ├── request/
│   │   ├── ExpenseCreateRequest.java
│   │   ├── ExpenseUpdateRequest.java
│   │   ├── CategoryCreateRequest.java
│   │   ├── CategoryUpdateRequest.java
│   │   ├── RecurringTemplateRequest.java
│   │   ├── SettingsUpdateRequest.java
│   │   └── TagRenameRequest.java
│   ├── response/
│   │   ├── ExpenseDTO.java
│   │   ├── CategoryDTO.java
│   │   ├── RecurringTemplateDTO.java
│   │   ├── OCRResultDTO.java
│   │   ├── MonthlySummaryDTO.java
│   │   ├── BudgetVsActualDTO.java
│   │   ├── TrendDTO.java
│   │   ├── UserSettingsDTO.java
│   │   ├── ApiResponse.java            # Standard envelope
│   │   └── PagedResponse.java          # Pagination wrapper
│   └── mapper/
│       ├── ExpenseMapper.java
│       ├── CategoryMapper.java
│       └── RecurringMapper.java
│
├── entity/
│   ├── User.java
│   ├── Category.java
│   ├── Expense.java
│   └── RecurringTemplate.java
│
├── repository/
│   ├── UserRepository.java
│   ├── CategoryRepository.java
│   ├── ExpenseRepository.java          # Custom @Query methods
│   └── RecurringTemplateRepository.java
│
├── service/
│   ├── AuthService.java                # OAuth + auto-provisioning
│   ├── ExpenseService.java             # CRUD + budget recalculation
│   ├── CategoryService.java            # CRUD + suggestion logic
│   ├── BudgetService.java              # Budget calculation + alerts
│   ├── OcrService.java                 # Tesseract integration
│   ├── ReportService.java              # Aggregation queries
│   ├── RecurringService.java           # Template CRUD + generation
│   ├── TagService.java                 # Tag rename + merge
│   ├── ExportService.java              # ZIP generation
│   ├── AccountService.java             # Delete account cascade
│   └── StorageService.java             # File save/delete for receipts
│
├── ocr/
│   ├── TesseractOcrEngine.java         # Tess4J wrapper
│   ├── ReceiptParser.java              # Extract amount/merchant/date
│   └── CategorySuggester.java          # Merchant → category mapping
│
└── exception/
    ├── GlobalExceptionHandler.java     # @ControllerAdvice
    ├── ResourceNotFoundException.java
    ├── ValidationException.java
    ├── OcrException.java
    ├── CategoryLockedException.java
    └── ConflictException.java
```

### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API Architecture | REST (not GraphQL) | Simpler for CRUD, pagination built into Spring Data |
| Exception Handling | `@ControllerAdvice` | Single point for consistent error envelope |
| Mapping | MapStruct or manual | Avoid heavy frameworks for MVP |
| Security | Spring Security OAuth2 Resource Server | Built-in Google OIDC support |
| Validation | Jakarta Validation (`@Valid`) | Declarative, well-integrated with Spring |
| File Upload | MultipartFile → StorageService | Separe storage logic from controller |
| Scheduling | `@Scheduled(cron = "0 0 0 1 * ?")` | Runs at midnight on the 1st of every month |

### Budget Calculation Flow

```
ExpenseController.create()
  │
  ▼
ExpenseService.create()
  │
  ├── Validate input
  ├── Save expense to DB
  ├── Call BudgetService.recalculate(userId, categoryId, month, year)
  │     │
  │     ▼
  │   BudgetService
  │     ├── Query: SUM(amount) for category in month
  │     ├── Compare against category.monthlyBudget
  │     ├── Return BudgetAlert (OK / WARNING / EXCEEDED)
  │     └── Threshold logic:
  │           < 80%  → OK
  │           80-99% → WARNING
  │           ≥ 100% → EXCEEDED
  │
  └── Return ExpenseDTO + List<BudgetAlert>
```

### OCR Processing Flow

```
ReceiptController.upload(file)
  │
  ▼
StorageService.saveTemp(file)
  │
  ▼
OcrService.process(imagePath)
  │
  ├── TesseractOcrEngine.extractText(imagePath)
  │     └── Tesseract.doOCR(file) → String
  │
  ├── ReceiptParser.parse(rawText)
  │     ├── Amount: regex for currency patterns
  │     ├── Merchant: first non-date line heuristic
  │     ├── Date: date pattern matching (multiple formats)
  │     └── Assign confidence scores
  │
  ├── CategorySuggester.suggest(merchantName)
  │     └── Keyword matching against category names
  │
  └── Return OCRResultDTO
```

---

## 3. Frontend Architecture (Angular 19)

### Module Structure

```
src/app/
├── app.config.ts                     # Application config
├── app.routes.ts                     # Route definitions
├── app.component.ts                  # Root component
│
├── auth/
│   ├── auth.service.ts               # OAuth2 + token management
│   ├── auth.guard.ts                 # Route guard (requires auth)
│   ├── login/
│   │   ├── login.component.ts
│   │   └── login.component.html
│   └── callback/
│       ├── callback.component.ts     # OAuth redirect handler
│       └── callback.component.html
│
├── core/
│   ├── services/
│   │   ├── api.service.ts            # Base HTTP wrapper
│   │   ├── category.service.ts       # Category API calls
│   │   ├── expense.service.ts        # Expense API calls
│   │   ├── receipt.service.ts        # Receipt upload + OCR
│   │   ├── report.service.ts         # Report API calls
│   │   ├── recurring.service.ts      # Recurring template API
│   │   ├── settings.service.ts       # Settings API
│   │   ├── tag.service.ts            # Tag API
│   │   └── account.service.ts        # Account deletion API
│   ├── interceptors/
│   │   ├── auth.interceptor.ts       # Add JWT to requests
│   │   ├── error.interceptor.ts      # Handle HTTP errors
│   │   └── loading.interceptor.ts    # Show/hide spinner
│   └── guards/
│       └── auth.guard.ts            # Route protection
│
├── features/
│   ├── dashboard/
│   │   ├── dashboard.component.ts
│   │   ├── dashboard.component.html
│   │   ├── summary-cards/
│   │   ├── donut-chart/
│   │   └── recent-transactions/
│   │
│   ├── expenses/
│   │   ├── expense-list/
│   │   │   ├── expense-list.component.ts
│   │   │   └── expense-list.component.html
│   │   ├── expense-form/
│   │   │   ├── expense-form.component.ts
│   │   │   └── expense-form.component.html
│   │   ├── expense-detail/
│   │   │   ├── expense-detail.component.ts
│   │   │   └── expense-detail.component.html
│   │   └── ocr-review/
│   │       ├── ocr-review.component.ts
│   │       └── ocr-review.component.html
│   │
│   ├── categories/
│   │   ├── category-list.component.ts
│   │   └── category-list.component.html
│   │
│   ├── reports/
│   │   ├── reports.component.ts      # Tab container
│   │   ├── reports.component.html
│   │   ├── budget-vs-actual/
│   │   ├── trends/
│   │   └── category-breakdown/
│   │
│   ├── recurring/
│   │   ├── recurring-list.component.ts
│   │   ├── recurring-list.component.html
│   │   └── recurring-form/
│   │
│   └── settings/
│       ├── settings.component.ts
│       └── settings.component.html
│
├── shared/
│   ├── components/
│   │   ├── sidebar/
│   │   ├── header/
│   │   ├── fab-button/
│   │   ├── confirm-dialog/
│   │   ├── toast/
│   │   └── loading-spinner/
│   ├── material.module.ts            # All Material imports
│   └── pipes/
│       ├── bdt-currency.pipe.ts      # Format BDT
│       └── date-format.pipe.ts
│
└── models/
    ├── expense.model.ts
    ├── category.model.ts
    ├── recurring.model.ts
    ├── report.model.ts
    └── api-response.model.ts
```

### Component Tree

```
AppComponent
├── LoginComponent          (route: /login)
├── CallbackComponent       (route: /auth/callback)
├── AppLayoutComponent      (auth guard wrapper)
│   ├── HeaderComponent     (search bar, avatar)
│   ├── SidebarComponent    (navigation)
│   ├── FABButtonComponent  (always visible)
│   └── <router-outlet>     (main content)
│       ├── DashboardComponent      (route: /dashboard)
│       ├── ExpenseListComponent    (route: /expenses)
│       ├── ExpenseFormComponent    (route: /expenses/new, /:id/edit)
│       ├── ExpenseDetailComponent  (route: /expenses/:id)
│       ├── CategoryListComponent   (route: /categories)
│       ├── ReportsComponent        (route: /reports)
│       ├── RecurringListComponent  (route: /recurring)
│       └── SettingsComponent       (route: /settings)
├── OCRReviewComponent     (modal, no route)
└── ConfirmDialogComponent  (modal, no route)
```

### State Management

Using Angular services with RxJS Signals for state:

```typescript
// Example: Expense state service
@Injectable({ providedIn: 'root' })
export class ExpenseStateService {
  private expensesSignal = signal<ExpenseDTO[]>([]);
  private loadingSignal = signal<boolean>(false);
  private totalElementsSignal = signal<number>(0);
  private currentPageSignal = signal<number>(0);

  readonly expenses = this.expensesSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly totalElements = this.totalElementsSignal.asReadonly();

  constructor(private expenseService: ExpenseService) {}

  loadExpenses(filters: ExpenseFilters): void {
    this.loadingSignal.set(true);
    this.expenseService.getAll(filters).subscribe({
      next: (response) => {
        this.expensesSignal.set(response.data.content);
        this.totalElementsSignal.set(response.data.totalElements);
        this.currentPageSignal.set(response.data.page);
        this.loadingSignal.set(false);
      },
      error: () => this.loadingSignal.set(false)
    });
  }
}
```

### Reactive Forms Design

```typescript
// expense-form.component.ts
export class ExpenseFormComponent implements OnInit {
  expenseForm = this.fb.group({
    amount: [null, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.required, Validators.maxLength(500)]],
    date: [new Date(), Validators.required],
    time: [''],
    categoryId: ['', Validators.required],
    paymentMethod: ['Cash'],
    tags: [[] as string[]],
    notes: ['', Validators.maxLength(2000)],
    receiptImageId: [null]
  });

  // Dynamic category creation
  onCategoryInput(value: string): void {
    const existing = this.categories().find(
      c => c.name.toLowerCase() === value.toLowerCase()
    );
    if (!existing && value.length > 0) {
      this.showCreateOption.set(true);  // Show "+ Create 'value'"
    }
  }

  createNewCategory(name: string): void {
    this.categoryService.create({ name }).subscribe(category => {
      this.categories.update(list => [...list, category]);
      this.expenseForm.patchValue({ categoryId: category.id });
    });
  }
}
```

---

## 4. Deployment Architecture

### Development Mode

```
┌─────────────┐     Port 4200     ┌──────────────┐     Port 5432
│  Angular    │ ─────────────────▶ │  Spring Boot │ ───────────────▶ PostgreSQL
│  Dev Server │    proxy.conf.json │  (8080)      │      JDBC
│  (ng serve) │     /api/* → 8080  │              │
└─────────────┘                    └──────────────┘
        │                                │
        │ Hot Reload                     │ Hot Reload
        │ (live-server)                  │ (spring-devtools)
        ▼                                ▼
  Source changes                   Source changes
```

**proxy.conf.json:**
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

### Production / Deployment Mode

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Compose                            │
│                                                               │
│  ┌──────────────────┐     ┌──────────────────┐               │
│  │   Nginx / Caddy   │     │   Spring Boot    │  ┌─────────┐  │
│  │   (Angular static │────▶│    JAR + OCR     │──▶│PostgreSQL│ │
│  │    build served)  │     │                  │  └─────────┘  │
│  └──────────────────┘     │  Receipt storage  │               │
│          Port 80/443      │  (mounted volume) │               │
│                           └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: expense_tracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/expense_tracker
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: ${DB_PASSWORD}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      RECEIPT_STORAGE_PATH: /data/receipts
    volumes:
      - receipt-data:/data/receipts
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - app

volumes:
  pgdata:
  receipt-data:
```

---

## 5. Technology Decisions & Rationale

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Backend Framework | Spring Boot 3.4 | Quarkus, Micronaut | User preference, maturity, OAuth2 support |
| Language | Java 21 | Java 17, Kotlin | Latest LTS, virtual threads for OCR |
| Frontend | Angular 19 | React, Vue | User preference, strong typing, Material |
| Database | PostgreSQL 16 | MySQL, H2 | Advanced array type (tags), JSON functions, full-text search |
| ORM | Spring Data JPA | jOOQ, MyBatis | Productivity, pagination built-in |
| Migrations | Flyway | Liquibase, manual | Simple, SQL-first, Spring integration |
| OCR | Tesseract (Tess4J) | Google Cloud Vision, AWS Textract | Free, local, no API key. Acceptable MVP accuracy with review step |
| Charts | Chart.js (ng2-charts) | D3.js, ECharts, ApexCharts | Lightweight, sufficient for donut/bar/line |
| Auth | Spring Security OAuth2 | Auth0, Keycloak, Firebase Auth | Built into Spring, free, Google provider |
| State Management | Services + Signals | NgRx, Elf | Simpler than NgRx for this scope |
| Container Runtime | Docker Compose | Kubernetes, Podman | Simplest multi-service orchestration |
| Build | Maven | Gradle | User preference, wider CI support |

---

## 6. Security Architecture

```
┌─────────────────────────────────────────────┐
│              Angular Frontend                │
│  ┌──────────────────────────────────────┐   │
│  │  OAuth2 Code Flow + PKCE             │   │
│  │  Token stored in memory (not localStorage)│
│  │  Auth interceptor adds Bearer token   │   │
│  └──────────────────────────────────────┘   │
└──────────────────────┬──────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────┐
│           Spring Boot Backend                │
│  ┌──────────────────────────────────────┐   │
│  │  SecurityConfig:                     │   │
│  │  - OAuth2 resource server            │   │
│  │  - Stateless sessions (JWT)          │   │
│  │  - CORS: localhost:4200 only (dev)   │   │
│  │  - CSRF: disabled (stateless API)    │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Data Isolation:                    │   │
│  │  - All queries include user_id      │   │
│  │  - Repository methods filter by user│   │
│  │  - No cross-user data access        │   │
│  └──────────────────────────────────────┘   │
│  ┌──────────────────────────────────────┐   │
│  │  Input Validation:                  │   │
│  │  - @Valid on all request bodies     │   │
│  │  - File type + size validation      │   │
│  │  - SQL injection: JPA handles it    │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 7. Performance Considerations

| Bottleneck | Mitigation | Implementation |
|------------|------------|----------------|
| **Dashboard query** (aggregation) | Database indexes + materialized view | Index on `(user_id, date)`, index on `(user_id, category_id)` |
| **OCR processing** | Sync with timeout | 3-second timeout per receipt. Fall back to manual entry. |
| **Expense list pagination** | Spring Data Pageable | `?page=0&size=50&sort=date,desc` |
| **Budget recalculation** | Single aggregate query per category | `SELECT SUM(amount) FROM expense WHERE user_id=? AND category_id=? AND date BETWEEN ? AND ? AND amount > 0` |
| **Receipt image serving** | Direct file access via controller | `StreamingResponseBody` for image download |
| **Large tag arrays** | PostgreSQL GIN index | `CREATE INDEX idx_expense_tags ON expense USING gin(tags)` |

---

## 8. Monitoring & Logging (MVP)

| Concern | Approach |
|---------|----------|
| Application logs | SLF4J + Logback → console + file |
| Log level | INFO in production, DEBUG in dev |
| Sensitive data in logs | Filter out: amount, description, full file paths |
| Error tracking | Sentry (optional, Phase 2) |
| Health check | Spring Boot Actuator `/actuator/health` |
| Metrics | Micrometer (optional, Phase 2) |
