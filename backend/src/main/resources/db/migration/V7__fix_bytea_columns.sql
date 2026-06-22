DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'expense' AND column_name = 'notes'
        AND udt_name = 'bytea'
    ) THEN
        EXECUTE 'ALTER TABLE expense ALTER COLUMN notes TYPE TEXT USING convert_from(notes, ''UTF8'')';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'recurring_template' AND column_name = 'notes'
        AND udt_name = 'bytea'
    ) THEN
        EXECUTE 'ALTER TABLE recurring_template ALTER COLUMN notes TYPE TEXT USING convert_from(notes, ''UTF8'')';
    END IF;
END $$;
