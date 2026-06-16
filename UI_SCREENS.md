# UI Screen List

## Screen Inventory

| # | Screen | Route | Purpose | Auth Required |
|---|--------|-------|---------|---------------|
| 1 | Login | `/login` | Google OAuth sign-in | No |
| 2 | Dashboard | `/dashboard` | Main landing: summary + recent transactions | Yes |
| 3 | Expense List | `/expenses` | Full paginated expense list with filters | Yes |
| 4 | Add Expense | `/expenses/new` | Create new expense (manual or OCR) | Yes |
| 5 | Edit Expense | `/expenses/:id/edit` | Edit existing expense | Yes |
| 6 | Expense Detail | `/expenses/:id` | View single expense with receipt image | Yes |
| 7 | Categories | `/categories` | Manage categories + set budgets | Yes |
| 8 | Reports | `/reports` | Budget vs actual, trends, breakdown | Yes |
| 9 | Recurring | `/recurring` | Manage recurring templates | Yes |
| 10 | Settings | `/settings` | Profile, preferences, export, delete account | Yes |
| 11 | OCR Review | (modal) | Review OCR-extracted fields before saving | Yes |
| 12 | 404 | `/404` | Page not found | No |

---

## Screen Details

### 1. Login Screen (`/login`)

**Layout:** Centered card on a clean background.

```
┌──────────────────────────────────────┐
│                                      │
│        ┌──────────────────┐          │
│        │                  │          │
│        │   [App Logo]     │          │
│        │  ExpenseTracker  │          │
│        │                  │          │
│        │  ┌────────────┐  │          │
│        │  │ Sign in    │  │          │
│        │  │ with Google│  │          │
│        │  └────────────┘  │          │
│        │                  │          │
│        │  No account?     │          │
│        │  Signing in with │          │
│        │  Google auto-    │          │
│        │  creates one.    │          │
│        │                  │          │
│        └──────────────────┘          │
│                                      │
└──────────────────────────────────────┘
```

**Elements:**
- App logo and name
- "Sign in with Google" button (Google-branded)
- Brief text: "Signing in with Google auto-creates your account"
- Footer: version number

**States:**
- **Default:** Button visible
- **Loading:** Button shows spinner during OAuth redirect
- **Error:** If OAuth fails, inline error: "Could not sign in. Please try again."

---

### 2. Dashboard (`/dashboard`)

**Layout:** Sidebar + main content area (default landing after login).

```
┌──────────────────────────────────────────────────────────────┐
│ 🗄 ExpenseTracker        🔍 [Search expenses...]    [👤 John] │
├──────────────┬───────────────────────────────────────────────┤
│              │  June 2026                                    │
│  Dashboard   │  ┌────────┬────────┬────────┬──────────┐     │
│  Expenses    │  │ ৳24,500│ ৳5,500 │  Dining │  -5.2%  │     │
│  Categories  │  │  Total  │ Budget │Top Cat │vs LastMo│     │
│  Reports     │  └────────┴────────┴────────┴──────────┘     │
│  Recurring   │                                               │
│  Settings    │  ┌───── Donut Chart ──────┐  ┌──── Budgets ─┐│
│              │  │                        │  │ Dining  ৳425 ││
│              │  │   🍕 Dining 34.7%      │  │         [██] ││
│              │  │   🏠 Housing 20.4%     │  │ Housing  ৳0  ││
│              │  │   🛒 Groceries 13.1%   │  │         [··] ││
│              │  │   ...                  │  │ Shopping ৳320││
│              │  │                        │  │         [··] ││
│              │  └────────────────────────┘  └──────────────┘│
│              │                                               │
│              │  Recent Transactions                          │
│              │  ┌──────┬─────────────┬────────┬────────┬───┐ │
│              │  │ Date │ Description │ Cat    │ Amount │   │ │
│              │  ├──────┼─────────────┼────────┼────────┼───┤ │
│              │  │Jun16 │ Kacchi Bhai │  Dining│  ৳24.50│📷 │ │
│              │  │Jun15 │ Netflix     │  Sub   │  ৳15.99│   │ │
│              │  │Jun14 │ Fuel Station │Transport│ ৳3,000│   │ │
│              │  │Jun13 │ Grocery Shop │  Groc  │  ৳5,200│📷 │ │
│              │  └──────┴─────────────┴────────┴────────┴───┘ │
│              │                         [View all →]          │
│              │                                               │
│              │                    [+ Add Expense] (FAB)      │
└──────────────┴───────────────────────────────────────────────┘
```

**Elements:**
- **Sidebar:** Navigation links with active state indicator
- **4 Summary Cards:** Total Spent, Budget Remaining, Top Category, vs Last Month
- **Donut Chart:** Category spending breakdown (Chart.js)
- **Budget Cards:** Per-category progress bars (green/yellow/red)
- **Recent Transactions:** Last 5 expenses as a compact table
- **FAB:** Floating action button always visible for quick expense entry

**States:**
- **Loaded:** Full dashboard as above
- **Empty (no entries):** "No expenses yet. Add your first one!" with a CTA button
- **Loading:** Skeleton cards and spinners

---

### 3. Expense List (`/expenses`)

**Layout:** Full-screen paginated table with filters.

```
┌──────────────────────────────────────────────────────────────┐
│ 🗄 ExpenseTracker        🔍 [Search expenses...]    [👤 John] │
├──────────────┬───────────────────────────────────────────────┤
│              │  Expenses                                     │
│  Dashboard   │  Filters: [Category ▼] [Payment ▼]           │
│  Expenses    │           [From 📅] [To 📅] [Apply] [Clear]  │
│  Categories  │                                               │
│  Reports     │  ┌──────┬─────────────┬────────┬──────┬─────┐│
│  Recurring   │  │ Date │ Description │ Cat    │Amt   │Tags ││
│  Settings    │  ├──────┼─────────────┼────────┼──────┼─────┤│
│              │  │Jun16 │ Kacchi Bhai │ Dining │24.50 │dinner││
│              │  │Jun15 │ Netflix     │ Sub    │15.99 │     ││
│              │  │Jun14 │ Pet Store   │ Pet    │2,500 │pet  ││
│              │  │...   │ ...         │ ...    │...   │...  ││
│              │  └──────┴─────────────┴────────┴──────┴─────┘│
│              │                                               │
│              │  ← Prev  1 2 3 ... 7  Next →   50 per page   │
│              │                                               │
│              │                    [+ Add Expense] (FAB)      │
└──────────────┴───────────────────────────────────────────────┘
```

**Features:**
- Sortable columns (click header to sort)
- Pagination controls at bottom
- Click row → navigate to expense detail
- Receipt icon indicates entry has an image

---

### 4. Add Expense (`/expenses/new`)

**Layout:** Single-column form, full-width.

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Expenses                                          │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │  Add Expense                                 │            │
│  │                                              │            │
│  │  [📷 Scan Receipt] [🖼 Choose from Gallery]  │            │
│  │                                              │            │
│  │  ─── or enter manually ───                   │            │
│  │                                              │            │
│  │  Amount *                                     │            │
│  │  ┌────────────────────────────────────────┐  │            │
│  │  │ ৳ 24.50                                │  │            │
│  │  └────────────────────────────────────────┘  │            │
│  │                                              │            │
│  │  Description *                               │            │
│  │  ┌────────────────────────────────────────┐  │            │
│  │  │ Kacchi Bhai                            │  │            │
│  │  └────────────────────────────────────────┘  │            │
│  │                                              │            │
│  │  Date *              Time                    │            │
│  │  ┌────────────────┐  ┌──────────────────┐   │            │
│  │  │ 2026-06-16 📅  │  │ 20:30            │   │            │
│  │  └────────────────┘  └──────────────────┘   │            │
│  │                                              │            │
│  │  Category *                                   │            │
│  │  ┌────────────────────────────────────────┐  │            │
│  │  │ Food & Dining                  ▼       │  │            │
│  │  │  ├── Food & Dining                     │  │            │
│  │  │  ├── Groceries                         │  │            │
│  │  │  ├── Pet Care                          │  │            │
│  │  │  └── + Create 'Pet Care'              │  │            │
│  │  └────────────────────────────────────────┘  │            │
│  │                                              │            │
│  │  Payment Method                              │            │
│  │  ┌────────────────────────────────────────┐  │            │
│  │  │ Cash ▼                                 │  │            │
│  │  └────────────────────────────────────────┘  │            │
│  │                                              │            │
│  │  Tags                                        │            │
│  │  ┌────────────────────────────────────────┐  │            │
│  │  │ dinner ✕   weekend ✕   [type here...]  │  │            │
│  │  └────────────────────────────────────────┘  │            │
│  │                                              │            │
│  │  Notes (optional)                            │            │
│  │  ┌────────────────────────────────────────┐  │            │
│  │  │ Delicious biryani with friends         │  │            │
│  │  └────────────────────────────────────────┘  │            │
│  │                                              │            │
│  │         [Cancel]          [💾 Save Expense]  │            │
│  └──────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

**States:**
- **Default:** Empty form, date defaults to today
- **OCR in progress:** Loading spinner on scan buttons, form disabled
- **OCR complete:** Fields pre-filled, confidence indicators visible
- **OCR failed:** "Couldn't read receipt" message, form stays empty
- **Validation errors:** Inline red messages under invalid fields
- **Saving:** Save button shows spinner, form disabled
- **Unsaved changes:** Browser navigation warning

---

### 5. Edit Expense (`/expenses/:id/edit`)

Same form as Add Expense, pre-filled with existing data. Receipt image (if any) shown as thumbnail.

---

### 6. Expense Detail (`/expenses/:id`)

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back to Expenses                                          │
│                                                              │
│  ┌──────────────────────────────────────────────┐            │
│  │  Kacchi Bhai                      [✏ Edit]  │            │
│  │                                  [🗑 Delete]  │            │
│  │                                              │            │
│  │  Amount:             ৳ 24.50                 │            │
│  │  Date:               June 16, 2026           │            │
│  │  Time:               8:30 PM                 │            │
│  │  Category:           Food & Dining           │            │
│  │  Payment Method:     Cash                    │            │
│  │  Tags:               dinner, weekend         │            │
│  │  Notes:              Delicious biryani       │            │
│  │                        with friends          │            │
│  │                                              │            │
│  │  ┌── Receipt ──┐                             │            │
│  │  │             │                             │            │
│  │  │ [Image]     │                             │            │
│  │  │             │                             │            │
│  │  └─────────────┘                             │            │
│  │                                              │            │
│  │  Created: June 16, 2026 8:30 PM              │            │
│  │  Updated: June 16, 2026 8:35 PM              │            │
│  └──────────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────────┘
```

---

### 7. Categories (`/categories`)

```
┌──────────────────────────────────────────────────────────────┐
│ 🗄 ExpenseTracker              🔍 [Search...]      [👤 John]  │
├──────────────┬───────────────────────────────────────────────┤
│              │  Categories                    [+ Add Category]│
│  Dashboard   │                                               │
│  Expenses    │  ┌──────┬─────────────┬──────────┬──────────┐ │
│  Categories  │  │      │ Category    │ Budget   │ Spent    │ │
│  Reports     │  ├──────┼─────────────┼──────────┼──────────┤ │
│  Recurring   │  │ 🔒   │ Food & Dine │ ৳500.00  │ ৳425.00 │ │
│  Settings    │  │      │             │ [████████]│  [85%]  │ │
│              │  ├──────┼─────────────┼──────────┼──────────┤ │
│              │  │ 🔒   │ Groceries   │ ৳300.00  │ ৳200.00 │ │
│              │  │      │             │ [█████···]│  [67%]  │ │
│              │  ├──────┼─────────────┼──────────┼──────────┤ │
│              │  │      │ Pet Care    │ —        │ ৳50.00  │ │
│              │  │      │             │ [No budget set]     │ │
│              │  └──────┴─────────────┴──────────┴──────────┘ │
│              │                                               │
│              │  Click a category to edit budget/name.        │
│              │  Custom categories also have a delete button. │
└──────────────┴───────────────────────────────────────────────┘
```

---

### 8. Reports (`/reports`)

```
┌──────────────────────────────────────────────────────────────┐
│ 🗄 ExpenseTracker              🔍 [Search...]      [👤 John]  │
├──────────────┬───────────────────────────────────────────────┤
│              │  Reports           [June 2026 ▼] [↻ Refresh] │
│  Dashboard   │                                               │
│  Expenses    │  ┌──── Budget vs Actual ────────────────────┐ │
│  Categories  │  │ Category      Budget  Spent  Rem  %Used │ │
│  Reports     │  │ Food & Dine   ৳500  ৳425  ৳75  85% 🟡│ │
│  Recurring   │  │ Groceries     ৳300  ৳200  ৳100 67% 🟢│ │
│  Settings    │  │ Housing       ৳1,200 ৳1,200 ৳0  100%🔴│ │
│              │  │ ...            ...    ...   ...  ...   │ │
│              │  │ Total         ৳2,500 ৳2,425 ৳75  97%  │ │
│              │  └──────────────────────────────────────────┘ │
│              │                                               │
│              │  ┌── 6-Month Trend ─────────────────────────┐ │
│              │  │         📈                               │ │
│              │  │   ৳32k ─┬───┬───┬───┬───┬───┬───        │ │
│              │  │   ৳30k   │   │   │   │   │   │           │ │
│              │  │   ৳28k   │   │   │   │   │   │           │ │
│              │  │          Jan Feb Mar Apr May Jun          │ │
│              │  └──────────────────────────────────────────┘ │
│              │                                               │
│              │  [Export as CSV]                              │
└──────────────┴───────────────────────────────────────────────┘
```

**Tabs:** Budget vs Actual | Trends | Category Breakdown

---

### 9. Recurring (`/recurring`)

```
┌──────────────────────────────────────────────────────────────┐
│ 🗄 ExpenseTracker              🔍 [Search...]      [👤 John]  │
├──────────────┬───────────────────────────────────────────────┤
│              │  Recurring Expenses    [+ Add Recurring]      │
│  Dashboard   │                                               │
│  Expenses    │  ┌──────┬────────────┬─────────┬──────┬────┐ │
│  Categories  │  │ Day  │ Description│ Amount  │ Cat  │ 🟢 │ │
│  Reports     │  ├──────┼────────────┼─────────┼──────┼────┤ │
│  Recurring   │  │ 1st  │ Rent       │ ৳12,000 │Housing│🟢 │ │
│  Settings    │  │ 17th │ Netflix    │ ৳15.99  │Subs  │🟢 │ │
│              │  │ 10th │ Spotify    │ ৳9.99   │Subs  │🔴 │ │
│              │  └──────┴────────────┴─────────┴──────┴────┘ │
│              │                                               │
│              │  🔴 = inactive (stopped by user)              │
│              │  Click to edit or toggle active status.       │
└──────────────┴───────────────────────────────────────────────┘
```

---

### 10. Settings (`/settings`)

```
┌──────────────────────────────────────────────────────────────┐
│ 🗄 ExpenseTracker              🔍 [Search...]      [👤 John]  │
├──────────────┬───────────────────────────────────────────────┤
│              │  Settings                                      │
│  Dashboard   │                                               │
│  Expenses    │  ┌── Profile ──────────────────────────────┐ │
│  Categories  │  │ Name: John Doe                   (from  │ │
│  Reports     │  │ Email: john@gmail.com             Google)│ │
│  Recurring   │  └──────────────────────────────────────────┘ │
│  Settings    │                                               │
│              │  ┌── Preferences ──────────────────────────┐ │
│              │  │ Default Payment: [Cash ▼]               │ │
│              │  │ Session Timeout: [24 hours ▼]           │ │
│              │  └──────────────────────────────────────────┘ │
│              │                                               │
│              │  ┌── Danger Zone ──────────────────────────┐ │
│              │  │ [📦 Export My Data]                     │ │
│              │  │                                         │ │
│              │  │ [🗑 Delete Account]                     │ │
│              │  │ Permanently deletes all your data.      │ │
│              │  │ This action is irreversible.            │ │
│              │  └──────────────────────────────────────────┘ │
└──────────────┴───────────────────────────────────────────────┘
```

**Delete Account Confirmation Dialog:**
```
┌──────────────────────────────────────────┐
│  🗑 Delete Account                        │
│                                          │
│  This will permanently delete all your   │
│  expenses, categories, receipt images,   │
│  and recurring templates.                │
│                                          │
│  This action cannot be undone.           │
│                                          │
│  Type "DELETE" to confirm:               │
│  ┌──────────────────────────────────┐    │
│  │ [                         ]      │    │
│  └──────────────────────────────────┘    │
│                                          │
│        [Cancel]    [Confirm Delete]      │
└──────────────────────────────────────────┘
```

---

### 11. OCR Review Modal

Appears as a modal overlay after receipt upload, before expense form.

```
┌──────────────────────────────────────────────┐
│  📋 Review Receipt                           │
│                                              │
│  ┌──────────────┐  ┌──────────────────────┐  │
│  │              │  │ Amount:  ৳ [24.50]🟢 │  │
│  │  [Receipt    │  │ Merchant:[Kacchi Bhai]│  │
│  │   Photo]     │  │               🟡 88%  │  │
│  │              │  │ Date:    [2026-06-16] │  │
│  │              │  │               🟢 92%  │  │
│  │              │  │ Category: [Food & Din]│  │
│  │              │  │               🟢 85%  │  │
│  │              │  │                       │  │
│  │              │  │ All fields editable.  │  │
│  └──────────────┘  └──────────────────────┘  │
│                                              │
│       [Retake Photo]        [✅ Save Entry]  │
└──────────────────────────────────────────────┘
```

**Confidence Indicators:**
- 🟢 Green background = ≥90% confidence
- 🟡 Yellow background = 70-89% confidence
- 🔴 Red background = <70% confidence (field blank, user must fill)

---

### 12. 404 Page

```
┌──────────────────────────────────────────────┐
│                                              │
│                    🤷                        │
│              Page Not Found                   │
│                                              │
│         The page you're looking for           │
│             doesn't exist.                    │
│                                              │
│           [← Go to Dashboard]                │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Navigation Map

```
Login (/login)
  │
  ▼ (Google OAuth)
Dashboard (/dashboard)
  │
  ├── Expenses (/expenses)
  │     ├── Add Expense (/expenses/new) ── OCR Review (modal)
  │     ├── Edit Expense (/expenses/:id/edit)
  │     └── Expense Detail (/expenses/:id)
  │
  ├── Categories (/categories)
  │
  ├── Reports (/reports)
  │
  ├── Recurring (/recurring)
  │
  └── Settings (/settings)
```

**Global Elements (visible on all authenticated screens):**
- Top header bar with app name, search, user avatar
- Sidebar navigation
- FAB button: "+ Add Expense"

**User Menu (click avatar):**
- User name + email
- Settings link
- Logout button
