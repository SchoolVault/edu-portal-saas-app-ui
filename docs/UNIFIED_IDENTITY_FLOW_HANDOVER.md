# Unified Identity Flow Handover (Production Grade)

## Goal

This rollout aligns authentication and profile identity management to a single ERP-grade model:

- `phone + otp` for verified mobile identity
- `email + password` only for verified, non-synthetic email identity
- deterministic verification state transitions on profile edits
- explicit password setup flow for verified users

## Previous Behavior (Before)

- Email/password login could be attempted even when email was not verified.
- Accounts with missing password could fail with inconsistent user experience.
- Profile phone updates did not always reset `phoneVerified`.
- Email updates from personal profile were not first-class verification transitions.
- Email verification requests had no cooldown guardrail.
- Recent activity did not reliably combine all operational milestones (events, fees, exams) in one timeline.

## Current Behavior (After)

### 1) Login Gatekeeping

- Email login now enforces:
  - email is verified
  - email is not synthetic (`@phone.schoolvault.local`)
  - password is set
- If password is not set, user gets explicit guidance to use OTP-first flow and set password later.

### 2) Unified Password Setup

- New endpoint: `POST /api/v1/auth/set-password`
- Allows authenticated user to set password when either:
  - phone is verified, or
  - email is verified
- Writes `passwordChangedAt` for auditability.

### 3) Profile Identity Transitions

- New endpoint: `PUT /api/v1/auth/profile/email`
  - updates login email
  - marks `emailVerified=false`
  - triggers verification request immediately
  - blocks email/password login until verification completes
- New endpoint: `PUT /api/v1/auth/profile/phone`
  - updates login phone
  - marks `phoneVerified=false`
  - OTP verification required for next trusted usage
- Existing profile update flows now reset `phoneVerified=false` on phone change.
- Personal profile (`profile-details`) now supports email edits with verification reset semantics.

### 4) Email Verification Controls

- Added request cooldown (`app.auth.email-verification.request-cooldown-seconds`, default `60s`)
- Prevents verification-link spam and improves safety.
- Added audit trail entries for:
  - verification request
  - verification confirmation
  - identity changes (email/phone/password set)

### 5) Recent Activity Timeline Reliability

- Admin recent activity now includes:
  - communication events (published/completed/cancelled, with fallback timestamps)
  - fee payment submissions
  - exam publish/result publish/completion milestones
  - announcements
- Ensures passed/completed events appear correctly in recent feed windows.

## APIs Added

- `POST /api/v1/auth/set-password`
- `PUT /api/v1/auth/profile/email`
- `PUT /api/v1/auth/profile/phone`

## Config Added

- `app.auth.email-verification.request-cooldown-seconds`
  - env: `AUTH_EMAIL_VER_COOLDOWN_SECONDS`
  - default: `60`

## UI Integration Notes (Simple and Consistent UX)

For profile page consistency with existing app theme:

1. **Identity block**
   - show Email, Phone, Email Verified, Phone Verified chips
2. **Edit email flow**
   - user updates email -> call `PUT /auth/profile/email`
   - show "verification sent" state and resend action
3. **Edit phone flow**
   - confirm dialog before save
   - on save, show "verify by OTP on next login"
4. **Set password CTA**
   - show when password unset or user chooses to enable email login
   - call `POST /auth/set-password`
5. **Login screen helper text**
   - if email login blocked, explain "verify email or use phone OTP"

## Security and Consistency Guarantees

- No synthetic/unverified email-password login.
- No silent trust carry-over after phone/email mutation.
- Verification state is explicit and deterministic.
- Password setup is gated by verified identity.
- Audit records exist for critical identity transitions.

## Future Extensions (Open for Scale)

- Dual-phone staged switch (old phone valid until new phone verified) via pending-phone columns.
- Signed email links with explicit callback URL + front-end state token.
- Per-tenant policy toggles:
  - strict immediate phone switch (current)
  - staged switch mode
- Risk-based step-up auth for sensitive operations.
