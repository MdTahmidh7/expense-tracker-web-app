CREATE TABLE app_user (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_sub              VARCHAR(255) NOT NULL UNIQUE,
    email                   VARCHAR(255) NOT NULL UNIQUE,
    display_name            VARCHAR(255) NOT NULL,
    timezone                VARCHAR(50) NOT NULL DEFAULT 'Asia/Dhaka',
    currency                VARCHAR(3) NOT NULL DEFAULT 'BDT',
    default_payment_method  VARCHAR(50) NOT NULL DEFAULT 'Cash',
    session_timeout_hours   INTEGER NOT NULL DEFAULT 24,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_user_google_sub ON app_user(google_sub);
CREATE INDEX idx_app_user_email ON app_user(email);
