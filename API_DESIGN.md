# API Design

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `http://localhost:8080/api` |
| Production | `https://yourdomain.com/api` |

## Authentication

All endpoints except auth endpoints require a Bearer JWT token:

```
Authorization: Bearer <jwt_token>
```

Token is obtained via the OAuth2 callback flow. Spring Security OAuth2 handles token issuance and validation.

---

## Standard Response Envelope

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Response
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { }
  }
}
```

### Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Token valid but not authorized |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Version conflict (optimistic locking) |
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `OCR_FAILED` | 422 | Receipt OCR processing failed |
| `CATEGORY_LOCKED` | 403 | Cannot delete predefined category |
| `BUDGET_EXCEEDED` | 200 | Budget alert (returned with data) |

---

## Pagination

All list endpoints support Spring Data-compatible pagination:

**Request Parameters:**
```
?page=0&size=50&sort=date,desc&sort=amount,asc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 50,
    "totalElements": 342,
    "totalPages": 7,
    "last": false,
    "first": true
  }
}
```

---

## Endpoints

### Authentication

#### POST /api/auth/login
Initiates Google OAuth flow. Redirects to Google consent screen.

**Response:** `302 Redirect` to `https://accounts.google.com/o/oauth2/v2/auth`

---

#### GET /api/auth/callback
OAuth callback endpoint. Google redirects here with authorization code.

**Response:** `302 Redirect` to dashboard with JWT cookie.
- **Success:** Sets `JWT` cookie/session, redirects to `/dashboard`
- **First-time user:** Auto-provisions profile + seeds demo data
- **Error:** Redirects to `/login?error=access_denied`

---

#### POST /api/auth/logout
Invalidates the current session.

**Response:** `204 No Content`

---

#### GET /api/auth/me
Returns the current authenticated user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@gmail.com",
    "displayName": "John Doe",
    "timezone": "Asia/Dhaka",
    "currency": "BDT",
    "defaultPaymentMethod": "Cash",
    "sessionTimeoutHours": 24,
    "createdAt": "2026-01-15T10:30:00Z"
  }
}
```

---

### Categories

#### GET /api/categories
Lists all categories available to the user (predefined + custom).

**Query Parameters:** None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Food & Dining",
      "isPredefined": true,
      "monthlyBudget": 300.00,
      "spentThisMonth": 245.50,
      "sortOrder": 1
    },
    {
      "id": "uuid",
      "name": "Pet Care",
      "isPredefined": false,
      "monthlyBudget": null,
      "spentThisMonth": 50.00,
      "sortOrder": 16
    }
  ]
}
```

---

#### POST /api/categories
Creates a new custom category.

**Request Body:**
```json
{
  "name": "Pet Care"
}
```

**Validation:**
- `name`: Required, 1-100 chars, unique per user (case-insensitive)
- Cannot create a category with the same name as a predefined category

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Pet Care",
    "isPredefined": false,
    "monthlyBudget": null,
    "spentThisMonth": 0,
    "sortOrder": 16
  }
}
```

---

#### PUT /api/categories/{id}
Updates a category's name and/or monthly budget.

**Request Body:**
```json
{
  "name": "Pet Supplies",
  "monthlyBudget": 100.00
}
```

**Validation:**
- Predefined categories: `name` cannot be changed, only `monthlyBudget`
- Custom categories: both fields mutable
- `monthlyBudget`: Must be ≥ 0, or null to clear budget

**Response:** `200 OK`

---

#### DELETE /api/categories/{id}
Deletes a custom category.

**Validation:**
- Cannot delete predefined categories (returns `CATEGORY_LOCKED`)
- If category has expenses, returns `409 CONFLICT` with message: "Move entries to another category first"

**Response:** `204 No Content`

---

#### GET /api/categories/suggest
Suggests a category based on merchant name.

**Query Parameters:**
```
?merchant=Kacchi%20Bhai
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "Food & Dining", "confidence": 0.92 },
    { "id": "uuid", "name": "Groceries", "confidence": 0.15 }
  ]
}
```

---

### Expenses

#### GET /api/expenses
Paginated, filterable list of expenses.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | int | No | Default 0 |
| size | int | No | Default 50, max 100 |
| sort | string | No | e.g., `date,desc` or `amount,asc` |
| search | string | No | Free-text search on description, notes, tags, category |
| categoryId | UUID | No | Filter by category |
| paymentMethod | string | No | Filter by payment method |
| startDate | string (ISO date) | No | Filter by date range start |
| endDate | string (ISO date) | No | Filter by date range end |
| isRecurring | boolean | No | Filter recurring entries |

**Response:** Paginated response with `ExpenseDTO[]`

**ExpenseDTO:**
```json
{
  "id": "uuid",
  "amount": 24.50,
  "currency": "BDT",
  "description": "Kacchi Bhai",
  "notes": null,
  "date": "2026-06-16",
  "time": "20:30:00",
  "category": {
    "id": "uuid",
    "name": "Food & Dining"
  },
  "paymentMethod": "Cash",
  "tags": ["dinner", "weekend"],
  "receiptImageUrl": "/api/receipts/uuid/image",
  "isRecurring": false,
  "recurringTemplateId": null,
  "createdAt": "2026-06-16T20:30:00Z",
  "updatedAt": "2026-06-16T20:30:00Z"
}
```

---

#### POST /api/expenses
Creates a new expense entry.

**Request Body:**
```json
{
  "amount": 24.50,
  "description": "Kacchi Bhai",
  "date": "2026-06-16",
  "time": "20:30:00",
  "categoryId": "uuid",
  "paymentMethod": "Cash",
  "notes": "Delicious biryani",
  "tags": ["dinner", "weekend"],
  "receiptImageId": "uuid"
}
```

**Validation:**
| Field | Rule |
|-------|------|
| amount | Required, non-zero decimal (max 999,999,999.99). Positive = expense, negative = refund |
| description | Required, 1-500 chars |
| date | Required, valid ISO date |
| categoryId | Required, must exist and belong to user or be predefined |
| paymentMethod | Optional, must be one of: Cash, Debit Card, Credit Card, Bank Transfer, Other |
| tags | Optional, array of strings, each 1-50 chars |
| receiptImageId | Optional, must reference a previously uploaded receipt |
| notes | Optional, max 2000 chars |

**Budget Alerts in Response:**
```json
{
  "success": true,
  "data": {
    "expense": { ... },
    "alerts": [
      {
        "categoryId": "uuid",
        "categoryName": "Food & Dining",
        "budget": 300.00,
        "spent": 240.00,
        "percentUsed": 80.0,
        "level": "WARNING"
      }
    ]
  }
}
```

**Alert Levels:**
- `OK`: 0-79%
- `WARNING`: 80-99%
- `EXCEEDED`: 100%+

The frontend uses these alerts to show toasts and update category card colors.

---

#### GET /api/expenses/{id}
Returns a single expense by ID.

**Response:** `ExpenseDTO`

---

#### PUT /api/expenses/{id}
Updates an existing expense.

**Request Body:** Same as POST, all fields optional (partial update)

```json
{
  "amount": 30.00,
  "description": "Kacchi Bhai - Updated"
}
```

**Validation:**
- Same field rules as POST
- `version` conflict → `409 CONFLICT`

**Response:** Updated `ExpenseDTO` with budget alerts

---

#### DELETE /api/expenses/{id}
Deletes an expense.

**Response:** `204 No Content`

Linked receipt image is also deleted from disk.

---

### Receipts

#### POST /api/receipts/upload
Uploads a receipt image for OCR processing. File is saved temporarily and OCR is run synchronously.

**Request:** `multipart/form-data`
```
file: (binary image file)
```

**Accepted Formats:** JPG, PNG, HEIC, PDF
**Max File Size:** 10MB

**Response:**
```json
{
  "success": true,
  "data": {
    "receiptImageId": "uuid",
    "extractedAmount": 24.50,
    "extractedMerchant": "Kacchi Bhai",
    "extractedDate": "2026-06-16",
    "suggestedCategoryId": "uuid",
    "suggestedCategoryName": "Food & Dining",
    "confidences": {
      "amount": 0.95,
      "merchant": 0.88,
      "date": 0.92,
      "category": 0.85
    },
    "imageUrl": "/api/receipts/uuid/image"
  }
}
```

**Error Response (OCR failure):**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "OCR_FAILED",
    "message": "Could not extract any fields from this receipt. Please enter the details manually.",
    "details": { "reason": "No text detected" }
  }
}
```

---

#### GET /api/receipts/{receiptImageId}/image
Returns the receipt image file.

**Response:** `image/jpeg` or `image/png` binary stream

---

### Recurring Templates

#### GET /api/recurring-templates
Lists all recurring templates for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 15.99,
      "description": "Netflix",
      "category": { "id": "uuid", "name": "Subscriptions" },
      "paymentMethod": "Credit Card",
      "dayOfMonth": 17,
      "isActive": true,
      "createdAt": "2026-01-10T12:00:00Z"
    }
  ]
}
```

---

#### POST /api/recurring-templates
Creates a new recurring template.

**Request Body:**
```json
{
  "amount": 15.99,
  "description": "Netflix",
  "categoryId": "uuid",
  "paymentMethod": "Credit Card",
  "dayOfMonth": 17,
  "notes": null
}
```

**Validation:**
- `amount`: Required, positive
- `dayOfMonth`: Required, 1-31
- If day > days in month (e.g., 31 in Feb), system uses last day

**Response:** `201 Created`

---

#### PUT /api/recurring-templates/{id}
Updates a recurring template.

**Request Body:** Same as POST, partial update supported

---

#### DELETE /api/recurring-templates/{id}
Deletes a recurring template.

**Response:** `204 No Content`

— Does not delete existing generated expense entries (orphaned entries keep `recurring_template_id = NULL`)

---

#### POST /api/recurring-templates/generate
Manually triggers recurring entry generation (for testing or on-demand).

**Response:** List of generated `ExpenseDTO` entries

---

### Reports

#### GET /api/reports/monthly-summary
Returns the high-level summary for a given month.

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| year | int | No | Current year |
| month | int | No | Current month |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalSpent": 24500.00,
    "totalBudget": 30000.00,
    "budgetRemaining": 5500.00,
    "topCategory": { "name": "Food & Dining", "amount": 8500.00 },
    "vsLastMonth": { "change": -5.2, "direction": "down" },
    "donutData": [
      { "category": "Food & Dining", "amount": 8500.00, "percentage": 34.7 },
      { "category": "Housing", "amount": 5000.00, "percentage": 20.4 },
      { "category": "Groceries", "amount": 3200.00, "percentage": 13.1 }
    ]
  }
}
```

---

#### GET /api/reports/budget-vs-actual
Per-category budget comparison table.

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| year | int | No | Current year |
| month | int | No | Current month |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "categoryId": "uuid",
      "categoryName": "Food & Dining",
      "budgeted": 500.00,
      "spent": 425.00,
      "remaining": 75.00,
      "percentUsed": 85.0,
      "status": "WARNING"
    },
    {
      "categoryId": "uuid",
      "categoryName": "Shopping",
      "budgeted": null,
      "spent": 320.00,
      "remaining": null,
      "percentUsed": null,
      "status": "NO_BUDGET"
    }
  ]
}
```

**Status values:** `OK`, `WARNING`, `EXCEEDED`, `NO_BUDGET`

---

#### GET /api/reports/trend
Monthly spending trend over a configurable number of months.

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| months | int | No | 6 |

**Response:**
```json
{
  "success": true,
  "data": [
    { "year": 2026, "month": 1, "label": "Jan 2026", "total": 32000.00 },
    { "year": 2026, "month": 2, "label": "Feb 2026", "total": 28500.00 },
    { "year": 2026, "month": 3, "label": "Mar 2026", "total": 31000.00 },
    { "year": 2026, "month": 4, "label": "Apr 2026", "total": 29800.00 },
    { "year": 2026, "month": 5, "label": "May 2026", "total": 33500.00 },
    { "year": 2026, "month": 6, "label": "Jun 2026", "total": 24500.00 }
  ]
}
```

---

#### GET /api/reports/category-breakdown
Drill-down: list all expenses for a specific category in a date range.

**Query Parameters:**
| Parameter | Type | Required | Default |
|-----------|------|----------|---------|
| categoryId | UUID | Yes | — |
| startDate | string (ISO) | No | First of current month |
| endDate | string (ISO) | No | Last of current month |

**Response:** Paginated `ExpenseDTO[]`

---

### Settings

#### GET /api/settings
Returns current user settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "timezone": "Asia/Dhaka",
    "currency": "BDT",
    "defaultPaymentMethod": "Cash",
    "sessionTimeoutHours": 24
  }
}
```

---

#### PUT /api/settings
Updates user settings.

**Request Body:**
```json
{
  "defaultPaymentMethod": "Credit Card",
  "sessionTimeoutHours": 168
}
```

**Response:** Updated settings

---

#### POST /api/export
Generates a ZIP file with all user data. Returns the file for download.

**Response:** `application/zip` binary download containing:
- `expenses.csv`
- `categories.csv`
- `recurring.csv`
- `receipts/{id}.{ext}`

**CSV Format (expenses.csv):**
```csv
id,date,description,amount,currency,category,payment_method,tags,notes,is_recurring,created_at
uuid,2026-06-16,Kacchi Bhai,24.50,BDT,Food & Dining,Cash,"dinner;weekend",Delicious biryani,false,2026-06-16T20:30:00Z
```

---

### Account

#### DELETE /api/account
Permanently deletes the user's account and all associated data.

**Request Body:**
```json
{
  "confirmation": "DELETE"
}
```

**Validation:** Must contain exactly `"DELETE"` as confirmation string.

**Response:** `204 No Content`

---

### Tags

#### GET /api/tags
Returns all unique tags used by the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": ["dinner", "weekend", "groceries", "office", "gift"]
}
```

---

#### PUT /api/tags/rename
Renames a tag across all expenses.

**Request Body:**
```json
{
  "oldName": "grocery",
  "newName": "groceries"
}
```

**Response:** `204 No Content`

**Behavior:** Updates all expenses that have `oldName` in their tags array.

---

#### POST /api/tags/merge
Merges one tag into another. Source tag is removed from all expenses.

**Request Body:**
```json
{
  "sourceTag": "groceries",
  "targetTag": "Food"
}
```

**Response:** `204 No Content`

**Behavior:** All expenses with `sourceTag` get `targetTag` added (if not already present) and `sourceTag` removed.
