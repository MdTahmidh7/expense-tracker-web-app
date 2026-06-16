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
CREATE UNIQUE INDEX idx_category_user_name ON category(LOWER(name), user_id)
    WHERE user_id IS NOT NULL;
