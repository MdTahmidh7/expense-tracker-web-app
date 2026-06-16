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
    recurring_template_id UUID,
    version               INTEGER NOT NULL DEFAULT 0,
    created_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_expense_user_date ON expense(user_id, date DESC);
CREATE INDEX idx_expense_category ON expense(user_id, category_id);
CREATE INDEX idx_expense_payment ON expense(user_id, payment_method);
CREATE INDEX idx_expense_tags ON expense USING gin(tags);
CREATE INDEX idx_expense_search ON expense USING gin(
    to_tsvector('english', coalesce(description, '') || ' ' || coalesce(notes, ''))
);
