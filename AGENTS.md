# AGENTS.md

This file provides guidance to AI agents working with code in this repository.

---

## Project Overview

**Daily Expense Tracker** is a web-based personal finance application that helps individuals understand where their money goes and stay aware of overspending. Built with Spring Boot 3.4, Angular 19, and PostgreSQL 16, it provides manual expense entry, OCR-based receipt scanning, and monthly budget tracking with passive alerts.

- **Goal**: Build a production-quality personal expense tracker where users snap a receipt or type an amount, and immediately see where their money went versus their budget
- **Status**: Planning complete, pre-implementation
- **Type**: Full-stack web application (Spring Boot REST API + Angular SPA)

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Spring Boot** | 3.4 | Backend REST API framework |
| **Java** | 21 LTS | Runtime |
| **Maven** | 3.9 | Build tool |
| **Angular** | 19 | Frontend SPA framework |
| **Angular Material** | 19 | UI component library |
| **PostgreSQL** | 16 | Primary database |
| **Spring Data JPA** | 6.x | ORM / database access |
| **Flyway** | 10.x | Database migrations |
| **Spring Security OAuth2** | 6.x | Google OAuth authentication |
| **Chart.js** (ng2-charts) | 5.x | Data visualizations |
| **Tesseract (Tess4J)** | 5.x | OCR receipt processing |
| **Docker Compose** | — | Deployment orchestration |

---

## Commands

```bash
# Backend (from backend/)
./mvnw clean test              # Run all tests
./mvnw spring-boot:run         # Start dev server (port 8080)
./mvnw clean package           # Build JAR
./mvnw verify                  # Full build with integration tests

# Frontend (from frontend/)
npm install                    # Install dependencies
ng serve                       # Start dev server (port 4200)
ng build                       # Production build
ng test                        # Run unit tests (Karma/Jasmine)

# Full stack (from project root)
docker compose up -d --build   # Start all services
docker compose down            # Stop all services
```

---

## Project Structure

```
expense-tracker-web-app/
├── PRD.md                    # Product Requirements Document
├── AGENTS.md                 # This file
├── ARCHITECTURE.md           # Full system architecture
├── API_DESIGN.md             # REST API specification
├── DATABASE_DESIGN.md        # Database schema design
├── UI_SCREENS.md             # UI screen list with wireframes
├── USER_STORIES.md           # User stories + acceptance criteria
├── docker-compose.yml        # Docker Compose for deployment
│
├── backend/                  # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/expensetracker/
│   │   │   │   ├── ExpenseTrackerApplication.java
│   │   │   │   ├── config/          # Security, CORS, scheduling
│   │   │   │   ├── controller/      # REST controllers
│   │   │   │   ├── dto/             # Request/response DTOs
│   │   │   │   │   ├── request/
│   │   │   │   │   └── response/
│   │   │   │   ├── entity/          # JPA entities
│   │   │   │   ├── mapper/          # Entity ↔ DTO mapping
│   │   │   │   ├── repository/      # Spring Data JPA repos
│   │   │   │   ├── service/         # Business logic
│   │   │   │   ├── ocr/             # Tesseract integration
│   │   │   │   └── exception/       # Global error handling
│   │   │   └── resources/
│   │   │       ├── application.yml
│   │   │       └── db/migration/    # Flyway SQL files
│   │   └── test/
│   ├── pom.xml
│   └── Dockerfile
│
└── frontend/                 # Angular application
    ├── src/
    │   ├── app/
    │   │   ├── auth/                # Login, OAuth callback
    │   │   ├── core/                # Services, interceptors, guards
    │   │   ├── features/
    │   │   │   ├── dashboard/       # Summary cards, charts
    │   │   │   ├── expenses/        # List, form, detail
    │   │   │   ├── categories/      # Manage categories
    │   │   │   ├── reports/         # Budget vs actual, trends
    │   │   │   ├── recurring/       # Recurring templates
    │   │   │   └── settings/        # Profile, export, account
    │   │   └── shared/              # Material modules, pipes
    │   ├── assets/
    │   └── index.html
    ├── angular.json
    ├── package.json
    └── proxy.conf.json              # Dev proxy → localhost:8080
```

---

## Architecture

### Layer Overview

```
Angular (port 4200) ──HTTP REST──▶ Spring Boot (port 8080) ──JDBC──▶ PostgreSQL 16
                                        │
                                        ▼
                                  Tesseract OCR (local)
                                  Receipt images (filesystem)
```

### Key Design Patterns

1. **REST API-First** — All frontend-backend communication through REST API. Controllers are thin; business logic lives in services.

2. **DTO Pattern** — Never expose JPA entities directly. Each endpoint uses separate request/response DTOs (Java records).

3. **Standard Response Envelope** — Every API response follows:
   ```json
   { "success": true, "data": {...}, "error": null }
   // or
   { "success": false, "data": null, "error": { "code": "...", "message": "..." } }
   ```

4. **Data Isolation** — Every repository query includes `WHERE user_id = :userId`. No cross-user data access ever. The `userId` is extracted from the authenticated JWT.

5. **Budget Calculation Service** — Centralized service recalculates budget status on every expense create/update/delete. Returns alerts (WARNING at 80%, EXCEEDED at 100%) in the same response cycle.

6. **OCR Pipeline** — Synchronous: upload → Tesseract parse → return fields with confidence scores → mandatory user review → save. Never auto-saves OCR output.

7. **Optimistic Locking** — `@Version` column on `expense` table for concurrent edit detection.

8. **Recurring Generation** — `@Scheduled(cron = "0 0 0 1 * ?")` runs on the 1st of each month, queries active recurring templates, creates pending expense entries.

### Security Model

- **Authentication**: Google OAuth2 via Spring Security OAuth2 Client
- **Session**: JWT-based, 24h default (configurable: 1h/4h/24h/7d)
- **CSRF**: Disabled (stateless API)
- **CORS**: localhost:4200 in development
- **Sensitive data**: No amounts or descriptions logged; no secrets in logs
- **File validation**: Receipt images validated for type (JPG/PNG/HEIC/PDF) and size (max 10MB)

---

## Code Patterns

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Java packages | `com.expensetracker.<layer>` | `com.expensetracker.service` |
| Java classes | `PascalCase` | `ExpenseService`, `CategoryController` |
| Java methods | `camelCase` | `createExpense()`, `findByUserIdAndDateBetween()` |
| Java constants | `UPPER_SNAKE_CASE` | `MAX_FILE_SIZE`, `BUDGET_WARNING_THRESHOLD` |
| Java DTOs (records) | suffixed with `Request`/`Response` | `ExpenseCreateRequest`, `ExpenseDTO` |
| REST endpoints | kebab-case plurals | `/api/expenses`, `/api/recurring-templates` |
| Angular components | `PascalCase` + `.component.ts` | `ExpenseFormComponent` |
| Angular services | `PascalCase` + `.service.ts` | `ExpenseService` |
| Angular routes | kebab-case | `/expenses/new`, `/recurring` |
| Database tables | `snake_case` | `app_user`, `recurring_template` |
| Database columns | `snake_case` | `google_sub`, `monthly_budget` |
| Flyway migrations | `V{version}__{description}.sql` | `V1__create_app_user.sql` |

### Error Handling

```java
// Custom exceptions extend RuntimeException
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, String field, Object value) {
        super("%s not found with %s: %s".formatted(resource, field, value));
    }
}

// Global handler catches all exceptions
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.error("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(ValidationException ex) {
        return ResponseEntity.badRequest()
            .body(ApiResponse.error("VALIDATION_ERROR", ex.getMessage(), ex.getDetails()));
    }
}
```

### Controller Pattern

```java
@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ExpenseDTO>>> getAll(
            @AuthenticationPrincipal OAuth2User principal,
            @PageableDefault(size = 50, sort = "date,desc") Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId) {
        String userId = principal.getAttribute("sub");
        Page<ExpenseDTO> expenses = expenseService.findByUser(userId, pageable, search, categoryId);
        return ResponseEntity.ok(ApiResponse.success(expenses));
    }
}
```

### Service Pattern

```java
@Service
@RequiredArgsConstructor
@Transactional
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseMapper expenseMapper;
    private final BudgetService budgetService;

    public ExpenseDTO create(String userId, ExpenseCreateRequest request) {
        Expense entity = expenseMapper.toEntity(userId, request);
        entity = expenseRepository.save(entity);
        List<BudgetAlert> alerts = budgetService.recalculate(userId, entity.getCategoryId(), entity.getDate());
        return expenseMapper.toDto(entity, alerts);
    }
}
```

### Budget Alert Thresholds

| Percent Used | Level | Visual |
|-------------|-------|--------|
| 0% - 79% | `OK` | Green |
| 80% - 99% | `WARNING` | Yellow + toast |
| ≥ 100% | `EXCEEDED` | Red + toast |

---

## Database

### Entities (4 tables)

| Table | Key Columns | Notes |
|-------|-------------|-------|
| `app_user` | `id`, `google_sub` (unique), `email`, `display_name`, `timezone`, `default_payment_method` | Auto-provisioned via OAuth |
| `category` | `id`, `user_id` (nullable for predefined), `name`, `is_predefined`, `monthly_budget` | 15 predefined seeded via Flyway |
| `expense` | `id`, `user_id`, `category_id`, `amount` (DECIMAL 12,2), `description`, `date`, `tags` (text[]), `receipt_image_path`, `version` | Core table, optimized locking |
| `recurring_template` | `id`, `user_id`, `category_id`, `amount`, `day_of_month`, `is_active` | Monthly recurring patterns |

### Migrations

Flyway manages schema. Migration files live at `backend/src/main/resources/db/migration/`.

Key indexes:
- `idx_expense_user_date` on `(user_id, date DESC)`
- `idx_expense_category` on `(user_id, category_id)`
- GIN index on `expense.tags` for array queries

---

## Key Files

| File | Purpose |
|------|---------|
| `PRD.md` | Complete product requirements |
| `API_DESIGN.md` | All REST endpoints, request/response formats |
| `DATABASE_DESIGN.md` | Schema, migrations, key queries |
| `ARCHITECTURE.md` | Full system architecture, deployment |
| `UI_SCREENS.md` | 12 screens with wireframe layouts |
| `USER_STORIES.md` | 20 stories with acceptance criteria |
| `backend/src/main/resources/application.yml` | Backend configuration |
| `backend/src/main/resources/db/migration/` | Flyway SQL migrations |
| `frontend/proxy.conf.json` | Dev proxy configuration |

---

## Testing Strategy

- **Unit tests**: JUnit 5 + Mockito for services (budget calculation, OCR parsing, category suggestion)
- **Integration tests**: `@WebMvcTest` for controllers, `@DataJpaTest` for repositories, `@SpringBootTest` for full flows
- **Frontend**: Angular `TestBed` + Jasmine for components
- **No E2E tests for MVP** — manual testing only

---

## On-Demand Context

| Topic | Reference |
|-------|-----------|
| Expense entry data model | `PRD.md` Section 7 (Tools/Features) |
| API endpoints | `API_DESIGN.md` (all endpoints) |
| Database schema | `DATABASE_DESIGN.md` (4 tables) |
| Budget alert logic | `ARCHITECTURE.md` (Key Design Patterns) |
| OCR pipeline | `ARCHITECTURE.md` (OCR Processing Flow) |
| UI screens | `UI_SCREENS.md` (12 screens) |
| User stories | `USER_STORIES.md` (20 stories) |

---

## Notes

- This is a **greenfield project** — no existing code to refactor. All code is written from scratch following the PRD and architecture docs.
- All times stored in UTC. Timezone conversion happens in the frontend display layer.
- Currency is BDT for MVP (single currency).
- Receipt images stored on local filesystem, referenced by path in the database.
- No data is ever sent to third-party services (no telemetry, no analytics).
- Always read the existing design docs (`PRD.md`, `API_DESIGN.md`, `DATABASE_DESIGN.md`) before implementing new features.
- Run `./mvnw clean test` after any backend changes; `ng test` after any frontend changes.
