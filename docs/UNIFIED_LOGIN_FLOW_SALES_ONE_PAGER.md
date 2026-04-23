# Unified Login Flow - Sales One Pager

This page is for Sales and customer-facing teams.
It explains login and verification in simple, non-technical language.

For engineering details, see:
- `docs/UNIFIED_IDENTITY_FLOW_HANDOVER.md`

---

## What this means for schools

Schools can now offer two safe login options:
- **Phone + OTP** (quick access)
- **Email + Password** (for users who verify their email)

This gives flexibility to parents and teachers while keeping accounts secure.

---

## Simple flow to explain in demos

### 1) During onboarding

- School creates teacher/parent account.
- If email is available, user can verify email from the link sent.
- User can always use **phone OTP** login if phone is registered.

### 2) First-time access options

- Option A: Login with phone OTP (fastest path).
- Option B: Verify email and login with email/password.

### 3) If password is not set yet

- User can still login with phone OTP.
- Then from profile, they can set password.
- After password is set and email is verified, email/password login works.

---

## Profile update behavior (very important)

### If user changes phone number

- New phone becomes the next OTP login number.
- System asks for OTP verification on next login.

### If user changes email

- Email status becomes "verification pending".
- Email/password login stays blocked until new email is verified.

This prevents wrong or fake contact details from being trusted.

---

## How to explain "verification" to schools

Use this line in meetings:

> "We allow easy access, but we only allow trusted access. Phone is trusted through OTP, and email is trusted through verification."

---

## Why schools will like this

- Parents/teachers can choose how they want to login.
- Schools reduce support tickets like "I forgot password" because OTP path always exists.
- Login identity stays clean and reliable even when contact details change.
- Better safety for sensitive student and fee-related information.

---

## Demo script (2 minutes)

1. Show login screen with both options: phone OTP and email/password.
2. Login once with phone OTP.
3. Open profile and update email.
4. Show "email verification pending" state.
5. Explain: email/password stays blocked until email is verified.
6. Set password from profile.
7. Explain: now user can use email/password after verification.

---

## Common questions and simple answers

**Q: Can users login if they forget password?**  
Yes. They can still use phone OTP.

**Q: Can users keep both options?**  
Yes. Phone OTP and email/password can both be used.

**Q: What if they enter wrong email?**  
Email login is not allowed until that email is verified.

**Q: What if they change phone number?**  
Next OTP login verifies the new number.

**Q: Is this suitable for large schools?**  
Yes. It is designed for ERP-scale user management.

---

## One-line value statement for sales

**"Simple for users, safe for schools: dual login with verified identity control."**

