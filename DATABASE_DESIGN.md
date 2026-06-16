# Database Design

## Schema Overview

PostgreSQL 16 database with 5 tables + 1 Flyway migration management.

---

## Entity Relationship Diagram

```
┌──────────────────────┐
│      app_user        │
├──────────────────────┤
│ id (UUID PK)         │──────┐
│ google_sub (UQ)      │      │
│ email (UQ)           │      │
│ display_name         │      │
│ timezone             │      │
│ currency             │      │
│ default_payment_     │      │
│   method             │      │
│ session_timeout_hours│      │
│ created_at           │      │
│ updated_at           │      │
└──────────────────────┘      │
                              │
                              ▼
┌──────────────────────┐     ┌──────────────────────────┐
│      category        │     │        expense           │
├──────────────────────┤     ├──────────────────────────┤
│ id (UUID PK)         │◄────│ user_id (FK)             │
│ user_id (FK, NULL)   │────►│ category_id (FK)         │
│ name                 │     │ id (UUID PK)             │
│ is_predefined        │     │ amount (DECIMAL 12,2)    │
│ monthly_budget (NULL)│     │ currency (VARCHAR 3)     │
│ sort_order           │     │ description (VARCHAR 500)│
│ created_at           │     │ notes (TEXT)             │
│                      │     │ date (DATE)              │
│                      │     │ time (TIME, NULL)        │
│                      │     │ payment_method (VARCHAR) │
│                      │     │ tags (TEXT[])            │
│                      │     │ receipt_image_path (NULL)│
│                      │     │ is_recurring (BOOLEAN)   │
│                      │     │ recurring_template_id FK │
│                      │     │ version (INTEGER)        │
│                      │     │ status (VARCHAR)         │
│                      │     │ created_at               │
│                      │     │ updated_at               │
└──────────────────────┘     └──────────────────────────┘
                                       │
                                       │
                              ┌────────┴──────────┐
                              │  recurring_template│
                              ├────────────────────┤
                              │ id (UUID PK)       │
                              │ user_id (FK)       │
                              │ category_id (FK)   │
                              │ amount             │
                              │ description        │
                              │ notes              │
                              │ payment_method     │
                              │ day_of_month       │
                              │ is_active          │
                              │ created_at         │
                              └────────────────────┘
```

---

## Table Definitions

### Table: `app_user`

Stores authenticated user profiles provisioned via Google OAuth.

```sql
CREATE TABLE app_user (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_sub          VARCHAR(255) NOT NULL UNIQUE,
    email               VARCHAR(255) NOT NULL UNIQUE,
    display_name        VARCHAR(255) NOT NULL,
    timezone            VARCHAR(50) NOT NULL DEFAULT 'Asia/Dhaka',
    currency            VARCHAR(3) NOT NULL DEFAULT 'BDT',
    default_payment_method VARCHAR(50) NOT NULL DEFAULT 'Cash',
    session_timeout_hours INTEGER NOT NULL DEFAULT 24,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_user_google_sub ON app_user(google_sub);
CREATE INDEX idx_app_user_email ON app_user(email);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, default `gen_random_uuid()` | |
| google_sub | VARCHAR(255) | NOT NULL, UNIQUE | Google's unique subject identifier |
| email | VARCHAR(255) | NOT NULL, UNIQUE | From Google profile |
| display_name | VARCHAR(255) | NOT NULL | From Google profile |
| timezone | VARCHAR(50) | NOT NULL, default 'Asia/Dhaka' | IANA timezone identifier |
| currency | VARCHAR(3) | NOT NULL, default 'BDT' | ISO 4217 currency code |
| default_payment_method | VARCHAR(50) | NOT NULL, default 'Cash' | One of: Cash, Debit Card, Credit Card, Bank Transfer, Other |
| session_timeout_hours | INTEGER | NOT NULL, default 24 | 1, 4, 24, 168 (7d), or -1 (never) |
| created_at | TIMESTAMPTZ | NOT NULL | UTC |
| updated_at | TIMESTAMPTZ | NOT NULL | UTC, updated via trigger |

---

### Table: `category`

Predefined (global, shared across users) and custom (user-specific) categories.

```sql
CREATE TABLE category (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES app_user(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    is_predefined   BOOLEAN NOT NULL DEFAULT FALSE,
    monthly_budget  DECIMAL(12, 2),
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_category_user_id ON category(user_id);
CREATE UNIQUE INDEX idx_category_user_name ON category(user_id, name) WHERE user_id IS NOT NULL;

-- Predfined categories are seeded by Flyway migration V2
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK → app_user(id), NULLABLE | NULL = predefined (global), NOT NULL = user-created |
| name | VARCHAR(100) | NOT NULL | Unique per user (case-insensitive) |
| is_predefined | BOOLEAN | NOT NULL, default FALSE | TRUE for the 15 seed categories |
| monthly_budget | DECIMAL(12,2) | NULLABLE | NULL = no budget set, resets on 1st of month |
| sort_order | INTEGER | NOT NULL, default 0 | Display ordering |
| created_at | TIMESTAMPTZ | NOT NULL | |

**Seed Data (Flyway V2):**

```sql
INSERT INTO category (name, is_predefined, sort_order) VALUES
('Food & Dining', TRUE, 1),
('Groceries', TRUE, 2),
('Housing', TRUE, 3),
('Utilities', TRUE, 4),
('Transportation', TRUE, 5),
('Entertainment', TRUE, 6),
('Shopping', TRUE, 7),
('Health & Medical', TRUE, 8),
('Insurance', TRUE, 9),
('Education', TRUE, 10),
('Travel', TRUE, 11),
('Subscriptions', TRUE, 12),
('Personal Care', TRUE, 13),
('Gifts & Donations', TRUE, 14),
('Other', TRUE, 15);
```

---

### Table: `expense`

The core data table — one row per expense entry.

```sql
CREATE TABLE expense (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    category_id           UUID NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
    amount                DECIMAL(12, 2) NOT NULL CHECK (amount != 0),
    currency              VARCHAR(3) NOT NULL DEFAULT 'BDT',
    description           VARCHAR(500) NOT NULL,
    notes                 TEXT,
    date                  DATE NOT NULL,
    time                  TIME WITHOUT TIME ZONE,
    payment_method        VARCHAR(50) NOT NULL DEFAULT 'Cash',
    tags                  TEXT[] NOT NULL DEFAULT '{}',
    receipt_image_path    VARCHAR(1000),
    is_recurring          BOOLEAN NOT NULL DEFAULT FALSE,
    recurring_template_id UUID REFERENCES recurring_template(id) ON DELETE SET NULL,
    version               INTEGER NOT NULL DEFAULT 0,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX idx_expense_user_date ON expense(user_id, date DESC);
CREATE INDEX idx_expense_category ON expense(user_id, category_id);
CREATE INDEX idx_expense_payment_method ON expense(user_id, payment_method);
CREATE INDEX idx_expense_search ON expense USING gin(to_tsvector('english', description || ' ' || COALESCE(notes, '')));
CREATE INDEX idx_expense_tags ON expense USING gin(tags);
CREATE INDEX idx_expense_recurring ON expense(user_id, is_recurring);
CREATE INDEX idx_expense_monthly ON expense(user_id, date_trunc('month', date));
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK, NOT NULL, CASCADE delete | Data isolation |
| category_id | UUID | FK, NOT NULL, RESTRICT on delete | Cannot delete category if expenses exist |
| amount | DECIMAL(12,2) | NOT NULL, CHECK != 0 | Positive = expense, negative = refund |
| currency | VARCHAR(3) | NOT NULL, default 'BDT' | Single currency for MVP |
| description | VARCHAR(500) | NOT NULL | Merchant name / description |
| notes | TEXT | NULLABLE | Optional user notes |
| date | DATE | NOT NULL | Date of expense |
| time | TIME | NULLABLE | Optional time |
| payment_method | VARCHAR(50) | NOT NULL, default 'Cash' | Cash, Debit Card, Credit Card, Bank Transfer, Other |
| tags | TEXT[] | NOT NULL, default '{}' | PostgreSQL array for flexible tagging |
| receipt_image_path | VARCHAR(1000) | NULLABLE | Relative path to receipt file |
| is_recurring | BOOLEAN | NOT NULL, default FALSE | TRUE if generated from recurring template |
| recurring_template_id | UUID | FK, NULLABLE, SET NULL on delete | Links back to template |
| version | INTEGER | NOT NULL, default 0 | Optimistic locking concurrency |
| created_at | TIMESTAMPTZ | NOT NULL | |
| updated_at | TIMESTAMPTZ | NOT NULL | |

---

### Table: `recurring_template`

Defines recurring expense patterns. Processed on the 1st of each month.

```sql
CREATE TABLE recurring_template (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    category_id     UUID NOT NULL REFERENCES category(id) ON DELETE RESTRICT,
    amount          DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    description     VARCHAR(500) NOT NULL,
    notes           TEXT,
    payment_method  VARCHAR(50) NOT NULL DEFAULT 'Cash',
    day_of_month    INTEGER NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recurring_template_user ON recurring_template(user_id);
CREATE INDEX idx_recurring_template_active ON recurring_template(user_id, is_active);
```

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| user_id | UUID | FK, NOT NULL, CASCADE | |
| category_id | UUID | FK, NOT NULL, RESTRICT | Cannot delete category used by active template |
| amount | DECIMAL(12,2) | NOT NULL, CHECK > 0 | |
| description | VARCHAR(500) | NOT NULL | |
| notes | TEXT | NULLABLE | |
| payment_method | VARCHAR(50) | NOT NULL, default 'Cash' | |
| day_of_month | INTEGER | NOT NULL, CHECK 1-31 | Day of month to mark as due |
| is_active | BOOLEAN | NOT NULL, default TRUE | FALSE = stopped by user |
| created_at | TIMESTAMPTZ | NOT NULL | |

---

## Flyway Migrations

```yml
# V1__create_app_user.sql
# V2__seed_predefined_categories.sql
# V3__create_category.sql
# V4__create_expense.sql
# V5__create_recurring_template.sql
# V6__create_indexes.sql
# V7__add_updated_at_trigger.sql
```

### Trigger for `updated_at`

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_user_updated_at
    BEFORE UPDATE ON app_user
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_expense_updated_at
    BEFORE UPDATE ON expense
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Key Query Patterns

### Monthly Summary (Budget vs Actual)

```sql
SELECT
    c.id AS category_id,
    c.name AS category_name,
    c.monthly_budget,
    COALESCE(SUM(e.amount), 0) AS total_spent,
    CASE
        WHEN c.monthly_budget IS NULL THEN NULL
        ELSE c.monthly_budget - COALESCE(SUM(e.amount), 0)
    END AS remaining,
    CASE
        WHEN c.monthly_budget IS NULL OR c.monthly_budget = 0 THEN NULL
        ELSE (COALESCE(SUM(e.amount), 0) / c.monthly_budget) * 100
    END AS percent_used
FROM category c
LEFT JOIN expense e
    ON e.category_id = c.id
    AND e.user_id = :userId
    AND EXTRACT(YEAR FROM e.date) = :year
    AND EXTRACT(MONTH FROM e.date) = :month
    AND e.amount > 0  -- exclude refunds from budget calculation
WHERE (c.user_id = :userId OR c.is_predefined = TRUE)
GROUP BY c.id, c.name, c.monthly_budget
ORDER BY c.name;
```

### 6-Month Trend

```sql
SELECT
    EXTRACT(YEAR FROM e.date) AS year,
    EXTRACT(MONTH FROM e.date) AS month,
    SUM(e.amount) AS total_spent
FROM expense e
WHERE e.user_id = :userId
    AND e.date >= (CURRENT_DATE - INTERVAL '6 months')
    AND e.amount > 0
GROUP BY year, month
ORDER BY year, month;
```

### Category Suggestion (Merchant Match)

```sql
-- Simple keyword-based suggestion
SELECT c.id, c.name
FROM category c
WHERE (c.user_id = :userId OR c.is_predefined = TRUE)
ORDER BY
    CASE
        WHEN :merchant ILIKE '%' || c.name || '%' THEN 1
        ELSE 2
    END,
    c.sort_order
LIMIT 3;
```

### Search Expenses

```sql
SELECT e.*
FROM expense e
WHERE e.user_id = :userId
    AND (:search IS NULL
        OR e.description ILIKE '%' || :search || '%'
        OR COALESCE(e.notes, '') ILIKE '%' || :search || '%'
        OR :search = ANY(e.tags)
        OR EXISTS (SELECT 1 FROM category c WHERE c.id = e.category_id AND c.name ILIKE '%' || :search || '%')
    )
    AND (:categoryId IS NULL OR e.category_id = :categoryId)
    AND (:paymentMethod IS NULL OR e.payment_method = :paymentMethod)
    AND (:startDate IS NULL OR e.date >= :startDate::DATE)
    AND (:endDate IS NULL OR e.date <= :endDate::DATE)
ORDER BY e.date DESC, e.created_at DESC
LIMIT :size OFFSET :page * :size;
```
