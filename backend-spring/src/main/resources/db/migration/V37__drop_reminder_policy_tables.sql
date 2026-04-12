-- Replaced by tenant feature flag feeReminderAutomation + FeeReminderAutomationService (no per-tenant JSON policy UI).
-- Drops tables created in V36.

DROP TABLE IF EXISTS scheduled_generic_reminder;
DROP TABLE IF EXISTS reminder_tenant_policy;
