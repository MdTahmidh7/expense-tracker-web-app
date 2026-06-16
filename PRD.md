# Product Requirements Document: Daily Expense Tracker

---

## 1. Executive Summary

**Daily Expense Tracker** is a web-based personal finance application that helps individuals understand where their money goes and stay aware of overspending. Built with Spring Boot, Angular, and PostgreSQL, it provides manual expense entry, OCR-based receipt scanning, and monthly budget tracking with passive alerts.

The core value proposition is **insight through simplicity**: users snap a receipt photo or type an amount, the app categorizes it, and at a glance they see exactly how much they've spent per category versus their budget. No envelope budgeting, no hard caps, no complexity — just awareness and control through data.

**MVP Goal:** Deliver a functional expense tracker where users can authenticate via Google OAuth, enter expenses manually or via OCR receipt scanning, organize spending across 15 predefined categories (plus custom), set per-category monthly budgets with passive alerts at 80% and 100% thresholds, and view spending through budget-vs-actual reports, category donut charts, and 6-month trend lines.

---

## 2. Mission

**Mission Statement:** Empower individuals to understand their spending habits at a glance — no math, no spreadsheets, no surprises.

**Core Principles:**

1. **Insight First** — Every feature exists to answer "Where did my money go?" Reports and budgets are the product; entry is the means.
2. **Frictionless Entry** — Manual entry and OCR both get out of the user's way quickly. Typing a number or snapping a photo should take under 10 seconds.
3. **Passive Control** — Alerts inform, never block. The user is always in charge of their own spending decisions.
4. **Privacy Pragmatic** — Financial data is stored in PostgreSQL with Google OAuth for authentication. No third-party data sharing, no analytics, no telemetry.
5. **Data Portability** — Users can export all their data (CSV + receipt images) at any time. No vendor lock-in.

---

## 3. Target Users

| Persona | Technical Comfort | Primary Needs | Pain Points |
|---------|-------------------|---------------|-------------|
| **Budget-Conscious Professional** | Medium | Track monthly spending, catch overspending early, understand category breakdowns | Spreadsheets are tedious, banking apps show transactions but not categorized totals |
| **Young Adult / First-Time Budgeter** | Medium-High | Simple visualization of spending habits, gentle nudges when approaching limits | Overwhelmed by YNAB/EveryDollar complexity, wants something that "just works" |
| **Receipt Hoarder** | Low-Medium | Snap a photo and forget it, wants receipts digitized without manual typing | Shoebox of crumpled receipts, tax season panic, no digital backup |
| **Side Hustler / Freelancer** | High | Separate personal tracking, export for accountant, category-level reporting | Mixing business and personal expenses, needs clean data for deductions |

**Key User Needs:**
- Enter an expense in under 10 seconds (manual or photo)
- See total monthly spending at a glance
- Know which categories are near their budget limit
- View trends over time without crunching numbers
- Export data for external analysis or record-keeping

**Pain Points to Solve:**
- "I have no idea where my paycheck goes every month"
- "I always discover I overspent at the end of the month, not during it"
- "I have a pile of receipts I never look at again"
- "Budgeting apps are too complicated — I just want a warning, not a lecture"
- "I don't want my financial data on a third-party server"

---

## 4. MVP Scope

### Core Functionality ✅

| Feature | Status | Description |
|---------|--------|-------------|
| Google OAuth Authentication | ✅ | Login via Google, session management, profile auto-creation |
| Manual Expense Entry | ✅ | Enter amount, merchant, date, category, payment method, tags, notes |
| OCR Receipt Scanning | ✅ | Upload photo (camera/gallery), extract amount/merchant/date, review before save |
| Dynamic Category Suggestions | ✅ | AI suggests category from merchant name during OCR, one-click accept |
| 15 Predefined Categories | ✅ | Cover 90% of personal spending, locked but usable |
| Custom Category Creation | ✅ | User can create new categories on-the-fly during entry |
| Per-Category Monthly Budgets | ✅ | Set budget per category, passive alerts at 80% and 100% |
| Recurring Expenses (Monthly) | ✅ | Recurring templates auto-create pending entries on the 1st |
| Budget vs Actual Report | ✅ | Per-category comparison: budgeted vs spent vs remaining |
| Category Donut Chart | ✅ | Visual % breakdown of monthly spending |
| 6-Month Trend Line | ✅ | Total spending trend over 6 months |
| Expense Search & Filter | ✅ | Free-text search, filter by category/date/payment method |
| Receipt Image Management | ✅ | Upload, view, delete receipt images linked to entries |
| Payment Method Tracking | ✅ | Cash, Debit Card, Credit Card, Bank Transfer, Other |
| Tags (Free-Form) | ✅ | Free-text tags with auto-suggest from existing tags |
| Data Export | ✅ | Download all data as ZIP (CSV + receipt images) |
| Account Deletion | ✅ | Irreversible delete of all user data |

### Core Functionality ❌

- CSV/OFX bank statement import
- Multi-currency support
- Sub-categories / hierarchical categories
- Hard budget caps / envelope blocking
- Budget rollover or debt carry
- Weekly or custom-period budgets
- Email/notification integrations
- Multiple receipts per expense entry
- Async OCR processing with job queue
- Budget pro-ration for mid-month setup

### Technical ✅

- Spring Boot 3.4 (Java 21 LTS)
- Angular 19 with Angular Material
- PostgreSQL (via Spring Data JPA + Flyway migrations)
- Tesseract OCR (Tess4J) for receipt processing
- Chart.js (ng2-charts) for visualizations
- Maven build
- Docker Compose for deployment
- Google OAuth2 for authentication
- RESTful API design with pagination

### Technical ❌

- End-to-end test suite
- CI/CD pipeline
- Dark mode (settings placeholder only)
- Mobile-first responsive design
- Real-time updates / WebSocket
- Caching layer (Redis)
- Monitoring / APM integration
- Auto-update mechanism

### Deployment ✅

- Development: Angular (port 4200) + Spring Boot (port 8080) separately
- Production: Docker Compose (PostgreSQL + Spring Boot JAR + Angular static build)
- Single-currency locale (BDT)
- HTTPS enforced on server deployment (Let's Encrypt)

---

## 5. User Stories

### Primary User Stories

1. **As a new user**, I want to log in with my Google account, so that I can start tracking expenses without creating yet another account.
   - *Example:* User clicks "Sign in with Google", authorizes, and lands on the dashboard with demo data visible.
   - *Technical:* Spring Security OAuth2 → auto-create `app_user` row → load demo transactions → redirect to dashboard.

2. **As a user who just ate out**, I want to snap a photo of my restaurant receipt, so that the amount, merchant, and date are extracted automatically.
   - *Example:* User taps [+ Add], selects camera, takes photo of a $24.50 receipt from "Kacchi Bhai". OCR extracts `24.50`, `Kacchi Bhai`, `2026-06-16`. Category is suggested as "Food & Dining". User confirms and saves.
   - *Technical:* POST `/api/receipts/upload` → Tesseract OCR → return extracted fields → user edits → POST `/api/expenses`.

3. **As a user checking mid-month spending**, I want to see a donut chart of my expenses by category, so that I know where my money is going without manual math.
   - *Example:* On the 15th of June, user opens the dashboard. Donut shows "Food & Dining: 35%, Housing: 25%, Transport: 12%..." with total at the top.
   - *Technical:* GET `/api/reports/monthly-summary?year=2026&month=6` → aggregate by category → return chart data.

4. **As a user approaching a budget limit**, I want a yellow alert when I've spent 80% of my Dining budget, so that I can decide to cut back before overspending.
   - *Example:* User has a $300 Dining budget. After entering a $50 meal, total Dining spend hits $240 (80%). Category card turns yellow, toast: "Dining: you've used 80% of your budget ($240/$300)."
   - *Technical:* On expense create/update, recalculate category total, compare to budget threshold, return alert in response.

5. **As a user with subscriptions**, I want to set up recurring expenses, so that Netflix and Spotify are auto-recorded each month without manual entry.
   - *Example:* User creates a recurring template: $15.99 for "Netflix" in "Subscriptions", day 17. On the 1st of July, a pending entry auto-creates. On July 17, user confirms it.
   - *Technical:* Scheduled task on 1st of each month → query `recurring_template` (active) → create `expense` entries with `is_recurring=true` and `status=PENDING`.

6. **As a user reviewing June spending**, I want a budget-vs-actual table, so that I see exactly which categories I overspent on.
   - *Example:* User navigates to Reports. Table shows 15 rows: "Dining: Budget $300, Spent $325, Remaining -$25 (overspent)". Red for negative, green for positive.
   - *Technical:* GET `/api/reports/budget-vs-actual?year=2026&month=6` → join expense aggregates with category budgets.

7. **As a user with many entries**, I want to search and filter my transaction list, so that I can find a specific expense from weeks ago.
   - *Example:* User types "kacchi" in search bar. List filters to show all entries containing "kacchi" in merchant or notes. User can also filter by date range and category.
   - *Technical:* GET `/api/expenses?search=kacchi&categoryId=&startDate=&endDate=&page=0&size=50`.

8. **As a user who wants to leave**, I want to download all my data and delete my account, so that I have full control over my financial information.
   - *Example:* User goes to Settings → "Export My Data" → downloads ZIP with CSV + images. Then "Delete Account" → types "DELETE" → all data wiped.
   - *Technical:* POST `/api/export` → async create ZIP → download. DELETE `/api/account` → cascade delete user + expenses + images + categories.

### Technical User Stories

9. **As a developer**, I want the OCR pipeline to include a mandatory review step, so that incorrectly parsed fields are caught before they enter the database.
   - *Acceptance:* OCR result is returned to the UI as a DTO with `confidence` fields. User must explicitly click "Save" to persist.

10. **As a system architect**, I want all API responses to follow a consistent envelope, so that error handling is uniform across the frontend.
    - *Pattern:* `{ "success": true, "data": {...}, "error": null }` or `{ "success": false, "data": null, "error": { "code": "CATEGORY_NOT_FOUND", "message": "..." } }`.

---

## 6. Core Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                  Angular 19                       │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ AuthModule │  │   Core   │  │  SharedModule │ │
│  │ (OAuth)    │  │  Module  │  │ (Material)    │ │
│  └────────────┘  └──────────┘  └──────────────┘ │
│        │               │               │          │
│        ▼               ▼               ▼          │
│  ┌──────────────────────────────────────────┐    │
│  │         HttpClient + Interceptors         │    │
│  │  (Auth token, error handling, loading)    │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────┘
                       │ HTTP (REST)
                       ▼
┌─────────────────────────────────────────────────┐
│               Spring Boot 3.4                    │
│  ┌────────────┐  ┌──────────┐  ┌──────────────┐ │
│  │ Controllers│  │ Services │  │  Repositories │ │
│  │ (REST API) │  │ (Logic)  │  │ (JPA)         │ │
│  └────────────┘  └──────────┘  └──────────────┘ │
│        │               │               │          │
│        ▼               ▼               ▼          │
│  ┌──────────────────────────────────────────┐    │
│  │  Security (OAuth2)  │  Flyway Migrations │    │
│  │  Tesseract OCR      │  File Storage      │    │
│  └──────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────┐
│              PostgreSQL 16                        │
│  ┌──────────────┐  ┌──────────┐  ┌──────────┐  │
│  │   app_user   │  │ category │  │ expense  │  │
│  │ recurring_tmpl│  │   tags   │  │  (files) │  │
│  └──────────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **API-First Design** — All frontend-backend communication through REST API. Controllers are thin, business logic lives in services.

2. **DTO Pattern** — Never expose entities directly. Each endpoint has request/response DTOs to decouple API contract from internal model.

3. **Budget Calculation Service** — Centralized service that recalculates budget status on any expense create/update/delete. Fires alert thresholds as part of response, not asynchronously.

4. **OCR Pipeline Pattern** — Upload → Tesseract parse → return fields with confidence scores → user review → save. All in the same request cycle (sync).

5. **Repository Pattern** — Spring Data JPA repositories for all database access. Custom queries via `@Query` for aggregated reports.

6. **Optimistic Locking** — `@Version` column on `expense` table for concurrent edit detection.

---

## 7. Features — Detailed Specification

### Authentication System

| Feature | Flow | Notes |
|---------|------|-------|
| Google OAuth Login | 1. User clicks "Sign in with Google"<br>2. Redirect to Google consent screen<br>3. Callback → create/retrieve user<br>4. JWT session token issued | Session: 24h default (configurable to 7d). Refresh token rotation. |
| Logout | 1. Invalidate session<br>2. Clear client-side token<br>3. Redirect to login | No global session management (single-user-per-machine for now). |
| Auto-provisioning | First login creates `app_user` with default settings. Demo data inserted. | Demo data: 10 sample transactions across categories. |

### Expense Entry System

**Entry Data Model:**

```typescript
interface ExpenseCreateRequest {
  amount: number;           // Required, positive (negative = refund)
  description: string;      // Required, merchant name
  date: string;             // Required, ISO date
  time?: string;            // Optional, ISO time
  categoryId: string;       // Required, UUID
  paymentMethod: string;    // Optional: Cash/Debit/Credit/Transfer/Other
  notes?: string;           // Optional
  tags?: string[];          // Optional
  receiptImage?: File;      // Optional (or uploaded separately)
  isRecurring?: boolean;    // Optional, if created from template
}
```

**Flow:**
1. User taps [+ Add Expense] → Expense form opens
2. Options: (a) Fill manually, (b) Upload receipt for OCR
3. OCR flow: upload → review extracted fields → edit if needed → save
4. Manual flow: fill fields → save
5. On save: budget recalculated, alerts returned in response

### OCR Receipt Processing

| Step | Description |
|------|-------------|
| 1. Upload | User selects image (camera/gallery) → POST `/api/receipts/upload` → file saved to temp |
| 2. OCR | Tesseract processes image → extract text blocks |
| 3. Parse | Extract amount (regex for currency patterns), merchant name (first line heuristic), date (date pattern matching) |
| 4. Suggest Category | Merchant name matched against known patterns → suggest best category |
| 5. Return | Response includes extracted fields with confidence scores (0.0 - 1.0) |
| 6. Review | User sees pre-filled form with confidence indicators (yellow = low confidence) |
| 7. Edit | User corrects any wrong fields |
| 8. Save | POST `/api/expenses` → create entry + link receipt image |

**Confidence Indicators:**
- `≥ 0.9`: Green checkmark, auto-filled
- `0.7 - 0.9`: Yellow warning, auto-filled but highlighted
- `< 0.7`: Red alert, field left blank for manual entry

### Budget Alerts

| Threshold | Visual | Toast |
|-----------|--------|-------|
| 0-79% | Normal (green) | None |
| 80-99% | Category card turns yellow | "Dining: 80% used ($240/$300)" |
| 100%+ | Category card turns red | "Dining: budget exceeded ($325/$300)" |

- Alerts fire **on every expense create/update/delete**
- Alerts are **in-app only** (no email/SMS)
- Budget is always **full month** regardless of when set

### Recurring Expenses

| Property | Value |
|----------|-------|
| Frequency | Monthly only |
| Creation | Auto-create pending entries on 1st of month |
| Day of month | Configurable per template (1-31) |
| Status after create | "Pending" — user must confirm to mark as completed |
| Cancel | Delete template entirely, or delete single instance |
| Overshoot handling | If day > days in month, use last day (e.g., day 31 in February → Feb 28) |

### Reports

| Report | Type | Description |
|--------|------|-------------|
| Monthly Summary | Cards + Donut | Total spent, budget remaining, top category, vs last month. Donut: % by category |
| Budget vs Actual | Table | 15 rows: category name, budgeted, spent, remaining, % used. Color-coded. |
| 6-Month Trend | Line chart | Total spending per month over last 6 months. Optional: per-category overlay. |
| Category Breakdown | Table/Chart | Drill-down: pick a category, see all expenses in it for the month |

---

## 8. Technology Stack

### Backend (Spring Boot)

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| Runtime | Spring Boot | 3.4 | Application framework |
| Language | Java | 21 LTS | Latest LTS with virtual threads |
| Build | Maven | 3.9 | Dependency management |
| Database Access | Spring Data JPA / Hibernate | 6.x | ORM, repositories |
| Migrations | Flyway | 10.x | Versioned SQL migrations |
| Auth | Spring Security + OAuth2 Client | 6.x | Google OAuth integration |
| OCR | Tess4J (Tesseract JNI wrapper) | 5.x | Local OCR processing |
| File Upload | Apache Commons FileUpload | 2.x | Receipt image handling |
| CSV Export | Apache Commons CSV | 1.x | Data export |
| Validation | Jakarta Validation | 3.x | Input validation |
| Utility | Lombok | 1.18 | Boilerplate reduction |
| Testing | JUnit 5 + Mockito | 5.x | Unit + integration tests |

### Frontend (Angular)

| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| Runtime | Angular | 19 | UI framework |
| UI Components | Angular Material | 19 | Tables, dialogs, datepicker, inputs |
| Charts | Chart.js (ng2-charts) | 5.x | Donut, bar, line charts |
| HTTP | Angular HttpClient | 19 | API communication |
| State | Angular Services + RxJS Signals | 19 | State management |
| Forms | Reactive Forms | 19 | Form handling with validation |
| Auth | angular-oauth2-oidc | 17.x | Google OAuth integration |
| Styling | Angular Material Themes | 19 | Pre-built theming |

### Infrastructure

| Component | Technology | Notes |
|-----------|------------|-------|
| Database | PostgreSQL 16 | Primary data store |
| Image Storage | Local filesystem | `~/expense-tracker/receipts/{userId}/` |
| Containerization | Docker + Docker Compose | PostgreSQL + App |
| SSL (prod) | Let's Encrypt + Certbot | On server deployment |

---

## 9. Security & Configuration

### Authentication

- **Provider:** Google OAuth2 (OpenID Connect)
- **Session:** JWT-based, 24h default (configurable: 1h / 4h / 24h / 7d / Never)
- **Refresh:** Automatic token refresh via OAuth2 refresh token
- **Auto-provisioning:** First login creates user profile automatically

### Data Protection

| Concern | Approach |
|---------|----------|
| Data at rest | Plaintext in PostgreSQL (personal finance tool, not enterprise) |
| Data in transit | HTTP for local dev, HTTPS enforced on deployment |
| Receipt images | Stored on local filesystem, not publicly accessible |
| Secrets | OAuth credentials via environment variables / `application.yml` |
| Logging | No sensitive data (amounts, descriptions) logged |

### Configuration

**Environment Variables:**
```bash
# OAuth
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Database
DATABASE_URL=jdbc:postgresql://localhost:5432/expense_tracker
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# Storage
RECEIPT_STORAGE_PATH=~/expense-tracker/receipts

# Session
SESSION_TIMEOUT_HOURS=24
```

### Security Scope

**In Scope:**
- Google OAuth2 authentication
- Session management with configurable timeout
- Input validation on all API endpoints
- SQL injection protection (JPA parameterized queries)
- File upload validation (type, size limits)
- No secrets in logs

**Out of Scope:**
- Column-level encryption
- Audit logging
- Rate limiting
- IP-based access control
- Penetration testing (Phase 2)

---

## 10. API Specification

### Base URL

- **Development:** `http://localhost:8080/api`
- **Production:** `https://yourdomain.com/api`

### Authentication

All endpoints except `/auth/**` require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

### Response Envelope

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error response:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Amount must be positive",
    "details": { "field": "amount", "rejectedValue": -50 }
  }
}
```

### Endpoints

#### Auth
```
POST   /api/auth/login              → 302 redirect to Google
GET    /api/auth/callback            → OAuth callback
POST   /api/auth/logout              → 204 No Content
GET    /api/auth/me                  → UserProfileDTO
```

#### Categories
```
GET    /api/categories               → List<CategoryDTO>
POST   /api/categories               → CategoryDTO  (body: {name})
PUT    /api/categories/{id}          → CategoryDTO  (body: {name, monthlyBudget})
DELETE /api/categories/{id}          → 204 (custom only)
GET    /api/categories/suggest?merchant=Kacchi Bhai  → SuggestionDTO
```

#### Expenses
```
GET    /api/expenses?page=0&size=50&sort=date,desc&search=&categoryId=&paymentMethod=&startDate=&endDate=
       → PagedResponse<ExpenseDTO>

POST   /api/expenses                 → ExpenseDTO  (body: ExpenseCreateRequest)
GET    /api/expenses/{id}            → ExpenseDTO
PUT    /api/expenses/{id}            → ExpenseDTO  (body: ExpenseUpdateRequest)
DELETE /api/expenses/{id}            → 204
```

#### Receipts
```
POST   /api/receipts/upload          → OCRResultDTO  (multipart: file)
         Response: {
           "extractedAmount": 24.50,
           "extractedMerchant": "Kacchi Bhai",
           "extractedDate": "2026-06-16",
           "suggestedCategoryId": "uuid",
           "confidences": { "amount": 0.95, "merchant": 0.88, "date": 0.92 },
           "receiptImageId": "uuid"
         }
```

#### Recurring Templates
```
GET    /api/recurring-templates           → List<RecurringTemplateDTO>
POST   /api/recurring-templates           → RecurringTemplateDTO
PUT    /api/recurring-templates/{id}      → RecurringTemplateDTO
DELETE /api/recurring-templates/{id}      → 204
POST   /api/recurring-templates/generate  → List<ExpenseDTO> (manual trigger)
```

#### Reports
```
GET    /api/reports/monthly-summary?year=2026&month=6
       → { totalSpent, totalBudget, remaining, topCategory, vsLastMonth, donutData }

GET    /api/reports/budget-vs-actual?year=2026&month=6
       → List<{ categoryId, categoryName, budgeted, spent, remaining, percentUsed }>

GET    /api/reports/trend?months=6
       → List<{ month, year, totalSpent }>

GET    /api/reports/category-breakdown?categoryId=&startDate=&endDate=
       → List<ExpenseDTO>
```

#### Settings
```
GET    /api/settings              → UserSettingsDTO
PUT    /api/settings              → UserSettingsDTO
POST   /api/export                → download ZIP
DELETE /api/account               → 204
```

#### Tags
```
GET    /api/tags                  → List<string>
PUT    /api/tags/rename           → 204 (body: {oldName, newName})
POST   /api/tags/merge            → 204 (body: {sourceTag, targetTag})
```

---

## 11. Success Criteria

### MVP Success Definition

**Functionality:**
- ✅ User can log in with Google OAuth and see the dashboard
- ✅ User can enter an expense manually in under 15 seconds
- ✅ User can upload a receipt photo and OCR extracts amount, merchant, date
- ✅ User can review and correct OCR results before saving
- ✅ User can create custom categories during entry
- ✅ User can set per-category monthly budgets
- ✅ User receives visual alerts at 80% and 100% budget usage
- ✅ User sees monthly donut chart, budget-vs-actual table, and 6-month trend
- ✅ User can search/filter expenses by text, category, date, payment method
- ✅ User can set up recurring expenses that auto-create monthly
- ✅ User can export all data as ZIP
- ✅ User can delete their account permanently

**Performance:**
- ✅ Dashboard loads in <2 seconds for a month with 500 entries
- ✅ OCR processes a single receipt in <3 seconds
- ✅ Search returns results in <500ms for 10,000 entries
- ✅ Budget calculation completes in <200ms per expense save

**User Experience:**
- ✅ Registration/login requires 2 clicks (Sign in with Google → Authorize)
- ✅ First-run user sees demo data immediately (no empty state confusion)
- ✅ All error messages are human-readable, not stack traces

### Quality Indicators

| Metric | Target |
|--------|--------|
| Unit test coverage | >70% (services, OCR parsing, budget calculation) |
| API response time (p95) | <500ms |
| Receipt OCR accuracy (clean receipt) | >80% on amount, merchant, date |
| Bundle size (gzip) | <2MB |
| Database query time (aggregations) | <200ms for 10k entries |

---

## 12. Implementation Phases

### Phase 1: Foundation & Auth (Weeks 1-2)

**Goal:** Establish Spring Boot + Angular project, database schema, and authentication.

**Deliverables:**
- ✅ Spring Boot 3.4 project with Maven
- ✅ Angular 19 project with Material theme
- ✅ PostgreSQL schema via Flyway migrations
- ✅ Google OAuth2 authentication (login/logout/session)
- ✅ User auto-provisioning on first login
- ✅ Demo data seeding for new users
- ✅ Settings endpoint (profile, timezone, defaults)

**Validation:**
- User can log in with Google and see dashboard
- User session persists across page refreshes
- New users get demo data on first login

---

### Phase 2: Core Entry & Categories (Weeks 3-4)

**Goal:** Implement manual expense entry, category system, tags, payment methods.

**Deliverables:**
- ✅ Category CRUD (predefined + custom creation)
- ✅ Category suggestion endpoint
- ✅ Expense CRUD (create, read, update, delete)
- ✅ Reactive expense form with validation
- ✅ Payment method field
- ✅ Tags (free-text, auto-suggest, manage)
- ✅ Expense list with pagination, search, filter, sort
- ✅ Receipt image upload (no OCR yet)

**Validation:**
- User can create an expense in under 15 seconds
- Category suggestions appear when typing merchant
- Tags auto-complete from existing tags
- Expense list paginates, filters, and sorts correctly

---

### Phase 3: OCR & Receipts (Weeks 5-6)

**Goal:** Implement OCR receipt scanning with review-before-save flow.

**Deliverables:**
- ✅ Tess4J Tesseract integration
- ✅ Receipt upload endpoint (camera + gallery)
- ✅ OCR text extraction → field parsing
- ✅ Category suggestion from merchant name
- ✅ Confidence scoring for extracted fields
- ✅ Review screen with editable fields
- ✅ Receipt image linking to expense entry
- ✅ Receipt image deletion with entry deletion

**Validation:**
- OCR correctly extracts amount, merchant, date from clean receipt
- Low-confidence fields are visually flagged
- User can edit any field before saving
- Receipt image displays in expense detail

---

### Phase 4: Budgets, Recurring & Reports (Weeks 7-8)

**Goal:** Implement budget alerts, recurring expenses, and full reporting suite.

**Deliverables:**
- ✅ Per-category monthly budget setting
- ✅ Budget calculation on expense create/update/delete
- ✅ 80%/100% passive alerts (toast + color change)
- ✅ Recurring template CRUD
- ✅ Monthly recurring auto-generation (1st of month)
- ✅ Pending expense confirmation flow
- ✅ Monthly summary (cards + donut chart)
- ✅ Budget vs actual table (color-coded)
- ✅ 6-month trend line chart
- ✅ Category breakdown drill-down
- ✅ Data export (CSV + ZIP)
- ✅ Account deletion

**Validation:**
- Setting budget triggers correct alerts at thresholds
- Recurring entries appear on the 1st of month
- Donut chart matches manual calculation
- Export ZIP contains all data correctly

---

## 13. Future Considerations

### Phase 2 Features

**Data & Import:**
- CSV/OFX bank statement import with column mapping
- Multi-currency support with daily exchange rate lookup
- Bulk edit (select multiple entries → update category/tags)

**Advanced Budgeting:**
- Budget rollover (unused carries to next month)
- Weekly and custom-period budgets
- Hard cap mode (optional, user opt-in)
- Yearly budget (e.g., vacation fund, insurance)

**Receipts & OCR:**
- Multiple receipts per expense entry
- Async OCR processing with WebSocket progress
- Google Cloud Vision / AWS Textract integration (higher accuracy)
- Receipt archival and auto-cleanup

**UX & Visualization:**
- Dark mode
- Mobile-responsive layout
- Keyboard shortcuts
- Custom date-range picker in reports
- Spending forecast (project month-end total based on current rate)

**Integration:**
- Email monthly summary report
- PWA support (installable, offline-capable)
- Browser extension (quick-add expense from any page)

**Security:**
- Column-level encryption for sensitive fields
- Audit log of all expense changes
- IP-based access restrictions

---

## 14. Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **OCR accuracy too low** | Medium — users frustrated, abandon feature | Medium | Mandatory review screen catches errors. Set expectations: "Review before save." Support seamless manual fallback. |
| **Google OAuth dependency** | High — no login if Google is down | Low | Session tokens survive temporary outages. Design auth layer so alternative providers can be added. |
| **PostgreSQL performance degrades at scale** | Medium — slow reports with 50k+ entries | Low | Indexes on `user_id + date`, paginated queries, materialized view for monthly aggregates. |
| **Receipt image storage fills disk** | Medium — app breaks with no disk space | Low | Validate image size (max 10MB), add clean-up for orphaned images, warn user when storage >80% full. |
| **User forgets Google account** | Medium — can't access data | Low | Data export is available at any time. User can create new Google account and import. No data lock-in. |

---

## 15. Appendix

### Project Structure

```
expense-tracker/
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/expensetracker/
│   │   │   │   ├── ExpenseTrackerApplication.java
│   │   │   │   ├── config/          # Security, CORS, Flyway
│   │   │   │   ├── controller/      # REST controllers
│   │   │   │   ├── dto/             # Request/Response DTOs
│   │   │   │   ├── entity/          # JPA entities
│   │   │   │   ├── mapper/          # Entity ↔ DTO mapping
│   │   │   │   ├── repository/      # Spring Data JPA repos
│   │   │   │   ├── service/         # Business logic
│   │   │   │   ├── ocr/             # Tesseract integration
│   │   │   │   └── exception/       # Custom exceptions + handler
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       ├── application-dev.yml
│   │   │       └── db/migration/    # Flyway SQL files
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── auth/               # Login, OAuth callback
│   │   │   ├── core/               # Services, interceptors, guards
│   │   │   ├── features/
│   │   │   │   ├── dashboard/      # Summary cards, charts
│   │   │   │   ├── expenses/       # List, form, detail
│   │   │   │   ├── categories/     # Manage categories
│   │   │   │   ├── reports/        # Budget vs actual, trends
│   │   │   │   ├── recurring/      # Manage recurring templates
│   │   │   │   └── settings/       # Profile, export, account
│   │   │   └── shared/             # Material modules, pipes, utils
│   │   ├── assets/
│   │   └── index.html
│   ├── angular.json
│   ├── package.json
│   ├── proxy.conf.json             # Dev proxy → localhost:8080
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

### Directory Conventions

| Pattern | Rule |
|---------|------|
| Controllers | `@RestController`, thin, delegate to services |
| Services | `@Service`, stateless, inject repositories |
| DTOs | Java records for request/response, never expose entities |
| Entities | JPA `@Entity`, `@Table`, Flyway-managed schema |
| Frontend Feature Modules | Each feature has its own module with components + routing |
| Frontend Services | Angular `@Injectable` services, one per domain |

### Document Status

- **Version:** 1.0.0
- **Status:** Draft — derived from Product Owner interview
- **Last Updated:** 2026-06-16
- **Next Review:** Before Phase 1 implementation begins
