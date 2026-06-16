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

CREATE INDEX idx_recurring_user ON recurring_template(user_id);
CREATE INDEX idx_recurring_active ON recurring_template(is_active);
