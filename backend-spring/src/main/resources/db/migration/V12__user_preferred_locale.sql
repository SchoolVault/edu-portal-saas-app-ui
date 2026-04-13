-- Per-user UI language (BCP 47 language tag, typically en / hi; extensible).
ALTER TABLE users
    ADD COLUMN preferred_locale VARCHAR(16) NOT NULL DEFAULT 'en' COMMENT 'Interface language (e.g. en, hi)' AFTER avatar;
