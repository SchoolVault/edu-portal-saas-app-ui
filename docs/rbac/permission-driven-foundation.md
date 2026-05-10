# Permission-Driven RBAC Foundation

This project now treats authorization as permission-first:

1. Identity (`User.role`) identifies portal kind/surface.
2. Effective permissions (`AppPermission`) authorize actions.
3. API and UI both check the same permission codes.

## Naming Convention

- Permission codes must follow `MODULE_ACTION[_QUALIFIER]`.
- Codes are uppercase snake-case.
- Guardrail: backend startup validation in `AppPermissionNaming`.

Examples:

- `SCHOOL_IMPORT_EXPORT_READ`
- `SCHOOL_IMPORT_EXPORT_WRITE`
- `SCHOOL_COMMUNICATION_READ`
- `SCHOOL_COMMUNICATION_WRITE`
- `SCHOOL_DIRECTORY_READ`
- `SCHOOL_DIRECTORY_WRITE`
- `SCHOOL_OPERATIONS_READ`
- `SCHOOL_OPERATIONS_WRITE`
- `SCHOOL_ACADEMIC_READ`
- `SCHOOL_ACADEMIC_WRITE`
- `SCHOOL_RBAC_READ`
- `SCHOOL_RBAC_WRITE`
- `SCHOOL_CHAT_READ`
- `SCHOOL_CHAT_WRITE`
- `ACADEMIC_TEACHER`
- `PORTAL_PARENT`

## Single Source Of Truth

- Backend resolver: `EffectivePermissionService`.
- Role templates and custom roles are permission bundles only.
- Tenant seeded templates are defined in `RbacRoleCatalog`.
- Permission groups/custom roles resolve through `SchoolRolePermissionResolver`.

## API Enforcement Standard

- Use `@PreAuthorize` with constants from `RbacSpel`.
- `RbacSpel` expressions are authority-first (`hasAuthority/hasAnyAuthority`) and map to `AppPermission`.
- Do not add new role-only gates for module authorization.

## Frontend Enforcement Standard

- UI visibility checks go through `UiAccessService`.
- `AuthService.getEffectivePermissionCodes()` uses server-supplied permissions (profile/JWT), no local role inference.
- Route guards should use `UiAccessService` permission helpers where possible.

## Seed Role Strategy

- Roles are reusable bundles of permission atoms.
- Templates are system roles in `RbacRoleCatalog`.
- Tenant admins can create custom permission groups and custom roles.
- User access = union of assigned role permissions.

## Module Migration Rule

For each module, execute in one phase:

1. Define/refine permission atoms.
2. Gate backend APIs with `RbacSpel` permissions.
3. Mirror checks in frontend via `UiAccessService`.
4. Map/update seed roles and custom role options.
5. Migrate existing users/assignments.
6. Remove module-specific legacy role shortcuts.
