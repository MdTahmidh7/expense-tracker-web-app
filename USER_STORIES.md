# User Stories & Acceptance Criteria

## Epic 1: Authentication & Onboarding

### US-1: Google OAuth Login
**As a** new user
**I want to** sign in with my Google account
**So that** I can access the app without creating another account

**Acceptance Criteria:**
- [ ] Login page shows a "Sign in with Google" button
- [ ] Clicking the button redirects to Google's OAuth consent screen
- [ ] After consent, user is redirected back to the app
- [ ] First-time login auto-creates a user profile with name and email from Google
- [ ] Subsequent logins recognize the existing profile
- [ ] A JWT session is created (default 24h expiry)
- [ ] Refreshing the page does not require re-login (token persists in memory)
- [ ] Invalid/expired tokens redirect to login page

### US-2: First-Run Experience
**As a** new user
**I want to** see demo data on my first login
**So that** I immediately understand how the app works

**Acceptance Criteria:**
- [ ] After first-time Google OAuth callback, user lands on dashboard with 10 demo transactions
- [ ] Demo transactions span multiple categories (Food & Dining, Groceries, Housing, etc.)
- [ ] Demo transactions have realistic amounts and dates in the current month
- [ ] A subtle banner appears: "These are demo entries. Start adding your own!"
- [ ] Demo data is deletable individually or all at once via "Clear demo data" button
- [ ] Budgets for demo categories are pre-seeded with reasonable amounts

### US-3: User Logout
**As a** signed-in user
**I want to** log out
**So that** my financial data is not accessible if I leave my computer

**Acceptance Criteria:**
- [ ] User avatar/menu in header has a "Logout" option
- [ ] Clicking logout invalidates the session
- [ ] All in-memory state is cleared
- [ ] User is redirected to login page
- [ ] Back button cannot restore the previous session

---

## Epic 2: Expense Entry

### US-4: Manual Expense Entry
**As a** user
**I want to** enter an expense manually with all details
**So that** I can track my spending immediately without needing a receipt

**Acceptance Criteria:**
- [ ] "+ Add Expense" button is always visible on the dashboard (FAB)
- [ ] Expense form opens with fields: amount, description, date (defaults to today), category (dropdown), payment method (optional), tags (optional), notes (optional)
- [ ] Amount accepts positive (expense) and negative (refund) decimals
- [ ] Category dropdown shows predefined + user-created categories sorted alphabetically
- [ ] User can type in the category dropdown to search/filter categories
- [ ] User can create a new category inline by typing and selecting "+ Create 'New Category'"
- [ ] Date picker defaults to today with quick-select for yesterday
- [ ] Payment method is a dropdown: Cash, Debit Card, Credit Card, Bank Transfer, Other
- [ ] Tags: free-text input with auto-suggest from existing tags
- [ ] All required fields (amount, description, date, category) show validation errors if empty
- [ ] Amount must be a valid number (not zero, max 999,999,999.99)
- [ ] Description max 500 characters
- [ ] Notes max 2000 characters
- [ ] Form has Cancel and Save buttons
- [ ] Save creates the expense and returns to the dashboard
- [ ] New expense appears at the top of the transaction list immediately
- [ ] Unsaved form warns on navigation: "You have unsaved changes. Discard?"

### US-5: OCR Receipt Upload
**As a** user with a paper receipt
**I want to** take a photo of it and have the fields extracted
**So that** I don't have to type the amount, merchant, and date manually

**Acceptance Criteria:**
- [ ] Expense form has a "Scan Receipt" button
- [ ] Clicking offers two options: "Take Photo" (camera) and "Choose from Gallery" (file picker)
- [ ] Accepted file formats: JPG, PNG, HEIC, PDF
- [ ] Max file size: 10MB
- [ ] After upload, a loading indicator shows with "Processing receipt..." text
- [ ] OCR completes within 3 seconds on a modern machine
- [ ] After processing, the form is pre-filled with extracted fields
- [ ] Each extracted field shows a confidence indicator:
  - Green checkmark (≥90% confidence)
  - Yellow warning (70-89% confidence)
  - Red alert (<70% confidence, field left blank)
- [ ] All fields remain editable — user can correct any extraction errors
- [ ] Category is auto-suggested based on merchant name
- [ ] User must explicitly click "Save" to persist — no auto-save
- [ ] If OCR fails entirely, form shows message: "Couldn't read this receipt. Enter details manually."
- [ ] Receipt thumbnail is displayed in the form for reference
- [ ] After save, receipt image is linked to the expense entry

### US-6: Edit Expense
**As a** user
**I want to** edit an expense I previously entered
**So that** I can fix mistakes or update details

**Acceptance Criteria:**
- [ ] Each expense in the list has an edit icon/button
- [ ] Clicking opens the expense form pre-filled with existing data
- [ ] Receipt image (if any) is displayed
- [ ] All fields are editable
- [ ] Changing the amount triggers budget recalculation
- [ ] Save updates the entry and refreshes the list
- [ ] Cancel discards changes
- [ ] If another session edited the same entry (version conflict), show error: "This entry was modified. Please reload."

### US-7: Delete Expense
**As a** user
**I want to** delete an expense
**So that** I can remove incorrect or duplicate entries

**Acceptance Criteria:**
- [ ] Each expense has a delete icon/button
- [ ] Clicking shows a confirmation dialog: "Delete this expense?"
- [ ] Confirmation deletes the expense and removes it from the list
- [ ] The linked receipt image (if any) is also deleted from disk
- [ ] Budget totals are recalculated after deletion
- [ ] Undo is not supported (deletion is permanent)

---

## Epic 3: Categories

### US-8: View Categories
**As a** user
**I want to** see all available categories with their budgets
**So that** I know how my spending is organized

**Acceptance Criteria:**
- [ ] A Categories page/section lists all 15 predefined categories
- [ ] User-created categories are shown alongside predefined ones
- [ ] Each category shows: name, monthly budget (if set), total spent this month
- [ ] Categories with no budget show "No budget set"
- [ ] Predefined categories have a visual indicator (e.g., small lock icon)
- [ ] Categories are sorted: most-used first

### US-9: Create Custom Category
**As a** user
**I want to** create a new category on the fly
**So that** I can categorize expenses that don't fit predefined categories

**Acceptance Criteria:**
- [ ] During expense entry, user can type a new category name not in the list
- [ ] Dropdown shows "+ Create 'Pet Care'" at the bottom of the list
- [ ] Clicking creates the category and selects it immediately
- [ ] Duplicate category names are not allowed (case-insensitive)
- [ ] Category name max 100 characters
- [ ] Newly created category appears in the dropdown for future entries

### US-10: Set Category Budget
**As a** user
**I want to** set a monthly budget for each category
**So that** I receive alerts when I'm approaching my spending limit

**Acceptance Criteria:**
- [ ] Settings/Categories page has a budget input field per category
- [ ] Budget is a positive decimal number in BDT
- [ ] Empty/null budget = no alerts (unlimited)
- [ ] Budget is monthly, resets on the 1st of each month
- [ ] Setting a budget to 0 disables alerts for that category
- [ ] Budget changes take effect immediately (no waiting for next month)
- [ ] Budget amount is stored per-category in the database

---

## Epic 4: Budget Alerts

### US-11: Passive Budget Alerts
**As a** user
**I want to** receive warnings when I'm near or over my budget
**So that** I can adjust my spending before it's too late

**Acceptance Criteria:**
- [ ] When a category reaches 80% of its budget, the category card turns yellow
- [ ] A toast notification appears: "Dining: 80% used ($240/$300)"
- [ ] When a category exceeds 100% of its budget, the category card turns red
- [ ] A toast notification appears: "Dining: budget exceeded ($325/$300)"
- [ ] Alerts fire on every expense create, update, and delete
- [ ] Alerts are in-app only (toast + color) — no email/SMS
- [ ] Budget alerts consider the full monthly budget (not pro-rated)
- [ ] Multiple categories can be over budget simultaneously — each shows its own alert
- [ ] Dismissing a toast does not clear the category color
- [ ] Category color resets when budget resets on the 1st

---

## Epic 5: Recurring Expenses

### US-12: Create Recurring Template
**As** a user with monthly subscriptions
**I want to** create a recurring expense template
**So that** Netflix, Spotify, and rent are auto-recorded each month

**Acceptance Criteria:**
- [ ] A "Recurring" section in the sidebar/navigation
- [ ] "Add Recurring" button opens a form with: amount, description, category, payment method, day of month (1-31), notes
- [ ] Day of month defaults to the current date
- [ ] Saving creates a recurring template (not an expense entry)
- [ ] Template is marked as active by default

### US-13: Auto-Generate Recurring Entries
**As a** user with active recurring templates
**I want** pending expense entries to be auto-created on the 1st of each month
**So that** I don't forget to record recurring bills

**Acceptance Criteria:**
- [ ] On the 1st of each month, a scheduled task runs
- [ ] For each active recurring template, a pending expense entry is created
- [ ] Pending entries have a clock/pending icon and are labeled "Upcoming"
- [ ] Entries whose day-of-month ≤ current date are marked as "due soon"
- [ ] User can confirm a pending entry (updates its status to completed)
- [ ] User can delete a pending entry (single instance only)
- [ ] If day-of-month > days in month (e.g., 31 in Feb), use last day of month

### US-14: Stop Recurring Template
**As** a user who cancelled a subscription
**I want** to stop a recurring template
**So that** no more entries are auto-created

**Acceptance Criteria:**
- [ ] Each recurring template has an "Deactivate" toggle
- [ ] Deactivating a template prevents future auto-generation
- [ ] Deactivated templates are grayed out but not deleted (user can reactivate)
- [ ] Deleting a template is permanent and asks for confirmation
- [ ] Deleting a pending entry shows option: "Delete this instance only" or "Stop this recurring series"

---

## Epic 6: Reports & Visualization

### US-15: Monthly Summary Dashboard
**As a** user
**I want to** see a high-level summary of my current month's spending
**So that** I know at a glance how I'm doing financially

**Acceptance Criteria:**
- [ ] Dashboard shows 4 summary cards: Total Spent, Budget Remaining, Top Category, vs Last Month
- [ ] Total Spent: sum of all expenses this month (formatted in BDT)
- [ ] Budget Remaining: total budget minus total spent (green if positive, red if negative)
- [ ] Top Category: name and amount of the category with highest spending
- [ ] vs Last Month: percentage change from previous month (green if down, red if up)
- [ ] Donut chart shows % breakdown by category
- [ ] Hovering on a donut segment shows category name and amount
- [ ] All data is for the current month by default

### US-16: Budget vs Actual Report
**As a** user
**I want to** see a table comparing my budget to actual spending per category
**So that** I know which categories I'm overspending on

**Acceptance Criteria:**
- [ ] Report page has a "Budget vs Actual" tab
- [ ] Month/Year selector to navigate between months
- [ ] Table columns: Category, Budgeted, Spent, Remaining, % Used
- [ ] Rows are color-coded: green ≥0 remaining, yellow 0 to -20%, red < -20%
- [ ] Categories with no budget show "—" in the Budgeted column
- [ ] Row for "Total" at the bottom sums all categories
- [ ] Sorting by any column is supported

### US-17: 6-Month Trend
**As a** user
**I want to** see a line chart of my total spending over the last 6 months
**So that** I can identify seasonal or long-term spending patterns

**Acceptance Criteria:**
- [ ] Report page has a "Trends" tab
- [ ] Line chart shows total spending per month over the last 6 months
- [ ] Y-axis is amount in BDT
- [ ] X-axis is month labels (e.g., Jan 2026, Feb 2026...)
- [ ] Optional: overlay a specific category's trend line
- [ ] Hovering on a data point shows exact amount and month

### US-18: Data Export
**As a** user
**I want to** download all my data
**So that** I have a backup or can analyze it externally

**Acceptance Criteria:**
- [ ] Settings page has "Export My Data" button
- [ ] Clicking generates a ZIP file containing:
  - `expenses.csv` — all expenses with all fields
  - `categories.csv` — all categories with budgets
  - `recurring.csv` — all recurring templates
  - `receipts/` — folder with all receipt images
- [ ] Export completes and downloads automatically
- [ ] Large exports show a progress indicator
- [ ] Export includes all data up to the moment of download

---

## Epic 7: Account Management

### US-19: Account Deletion
**As a** user who no longer wants to use the app
**I want to** delete my account and all associated data
**So that** my financial information is permanently removed

**Acceptance Criteria:**
- [ ] Settings page has "Delete Account" in a danger zone section
- [ ] Clicking shows a confirmation dialog with a text input: type "DELETE" to confirm
- [ ] Confirmation permanently deletes: user profile, all expenses, all categories (custom), all tags, all receipt images, all recurring templates
- [ ] Deletion is irreversible and warns the user
- [ ] After deletion, user is redirected to login page
- [ ] Attempting to log in again with the same Google account creates a fresh profile

### US-20: Settings Management
**As a** user
**I want to** configure my preferences
**So that** the app works the way I want

**Acceptance Criteria:**
- [ ] Settings page has sections: Profile, Preferences, Budgets, Data
- [ ] Profile section shows: name (read-only from Google), email (read-only)
- [ ] Preferences section: default payment method, session timeout (dropdown)
- [ ] Budgets section: per-category budget inputs
- [ ] Data section: Export and Delete Account buttons
- [ ] Changes save automatically or via explicit "Save" button
- [ ] Validation on all inputs
