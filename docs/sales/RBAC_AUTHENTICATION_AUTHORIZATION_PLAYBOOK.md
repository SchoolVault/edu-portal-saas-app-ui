# SchoolVault Security & Access Playbook

This document explains authentication and authorization in simple language.

Use it for:
- Sales conversations with schools
- Customer success onboarding
- Internal developer alignment

---

## 1) Simple Terms (Non-Technical)

- **Authentication** = "Who are you?"  
  Example: user logs in with phone/email + password/OTP.

- **Authorization** = "What are you allowed to do?"  
  Example: teacher can view attendance but cannot change fee settings.

- **Permission** = one atomic action (smallest access unit).  
  Example: `SCHOOL_FEES_READ`, `SCHOOL_FEES_WRITE`.

- **Role** = bundle of permissions.  
  Example: "Fee Office" role may contain both fee read and fee write permissions.

---

## 2) How Login & Access Works (End-to-End)

1. User logs in successfully (identity verified).
2. System loads user's effective permissions from assigned school roles.
3. Permissions are added to session/JWT.
4. UI checks those permissions to show/hide modules and buttons.
5. Backend API checks the same permissions before allowing any action.

Important:
- Even if someone manipulates the UI, backend still blocks unauthorized actions.
- UI and API are permission-aligned by design.

---

## 3) Permission-Driven Model (Current Standard)

We use **permission-first RBAC**:

- Modules are split into atomic permissions, usually:
  - `MODULE_READ`
  - `MODULE_WRITE`
- `WRITE` means mutation actions like create/update/delete/approve/retry.
- Roles are only permission bundles; no hidden "magic admin shortcuts" for module access.

Examples:
- `SCHOOL_EXAMS_READ` -> view exams data
- `SCHOOL_EXAMS_WRITE` -> create/update/publish exams
- `SCHOOL_CHAT_READ` -> open chat inbox/history
- `SCHOOL_CHAT_WRITE` -> send messages/create conversation
- `SCHOOL_RBAC_READ` -> view role catalog and assignment pages
- `SCHOOL_RBAC_WRITE` -> assign roles, edit custom roles/packs

---

## 4) Who Can Access What? (Business View)

### Platform Super Admin
- Cross-tenant control-plane access
- Can manage platform-level operations

### School Admin / Tenant Admin
- School-wide administration
- Can carry broad module permissions (read/write) based on role bundles

### Teacher
- Academic and teaching scope permissions (for assigned use cases)
- Usually has `ACADEMIC_TEACHER` + selected desk permissions

### Library/School Staff
- Baseline employee portal access
- Gets module visibility only when additional desk permissions are assigned

### Parent / Student
- Portal personas with dedicated parent/student permissions
- Not given internal staff desks by default

---

## 5) How to Assign Access to a New User

Recommended onboarding flow:

1. Create/select user (teacher, staff, etc.).
2. Open Settings -> Roles & Access (RBAC panel).
3. Select one or more system/custom roles.
4. Save assignments.
5. User re-login/refresh -> new permission set applies.

Best practice:
- Start with minimum required access.
- Add only necessary desk roles.
- Avoid giving full admin unless truly needed.

---

## 6) Module Visibility Rule (Very Important)

A module appears in UI only if:
- Tenant feature is enabled (if feature-gated), and
- User has at least one required permission for that module.

Action buttons (create/edit/delete) appear only if user has corresponding write permission.

Backend always enforces final authorization.

---

## 7) Read vs Write Clarification

- **READ**: user can view lists/details/reports.
- **WRITE**: user can perform state-changing actions:
  - create
  - update
  - delete
  - approve/reject/publish
  - retries/reconciliation operations (where applicable)

So yes: in SchoolVault, write generally means "can take action", not only "edit text".

---

## 8) Example School Scenarios

### Scenario A: Accountant
- Role bundle: fee + payroll + reports read/write
- Result: sees finance modules and can process operations
- Does not see academic management screens unless explicitly assigned

### Scenario B: Front Desk Staff
- Role bundle: directory read/write + communication read
- Result: can search people and manage directory operations, can view communication dashboards
- Cannot alter fee or exam settings

### Scenario C: Chat-Only Non-Teaching Staff
- Role bundle: staff messaging with `SCHOOL_CHAT_READ` + `SCHOOL_CHAT_WRITE`
- Result: can use chat inbox and send messages
- No access to unrelated modules

---

## 9) FAQs (Sales + Dev)

### Q1) Can schools create custom roles?
Yes. They can create custom roles and permission packs, then assign them to users.

### Q2) Can one user have multiple roles?
Yes. Effective access is union of all assigned role permissions.

### Q3) Can we hide modules for specific users?
Yes. If permission is not assigned, module/action is hidden in UI and blocked by API.

### Q4) Is this scalable for large ERP environments?
Yes. Permission-first design is the enterprise standard: atomic permissions + role bundles + strict API enforcement.

### Q5) If a user has UI access but API denies, what happens?
This should be rare after alignment, but API is always final authority and returns authorization error.

### Q6) What happens when access is changed?
After role update, new effective permissions apply on refresh/re-login and are enforced across UI + API.

### Q7) Can we support temporary/special access?
Yes. Create a temporary custom role, assign it, then remove assignment later.

### Q8) Does parent/student get staff desks automatically?
No. Parent and student use their own portal permissions; staff desks are separate.

### Q9) Is "admin role name" enough to grant module access?
No. Module access is permission-driven. Role names are just bundles.

### Q10) Why split read/write?
It gives better control, safer compliance posture, and clearer accountability.

---

## 10) Developer Implementation Reference (Quick)

- Permission source of truth: backend `AppPermission`
- API guard source of truth: backend `RbacSpel` + `@PreAuthorize`
- Effective permission resolver: backend `EffectivePermissionService`
- Seed role bundles: backend `RbacRoleCatalog`
- UI access checks: frontend `UiAccessService`
- Route/nav visibility: frontend guards + app constants with permission checks

Rule:
- Any new feature must ship with:
  1. permission atom(s)
  2. backend API guard
  3. frontend visibility/action checks
  4. role bundle mapping
  5. docs/i18n updates

---

## 11) One-Line Sales Pitch

SchoolVault gives schools **bank-grade access control for education workflows**: every user sees only the right modules and can do only the right actions, with full admin flexibility through role and permission bundles.

