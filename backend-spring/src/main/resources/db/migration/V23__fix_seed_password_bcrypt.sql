-- Replace incorrect legacy bcrypt (documented as admin123 but never matched Spring BCryptPasswordEncoder).
UPDATE users
SET password = '$2a$10$OF9wtmX3lDzBIYsrZlAe8Ou2829Ih6l6WTe2TxSVRacFh1fAr2mBy'
WHERE password = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
