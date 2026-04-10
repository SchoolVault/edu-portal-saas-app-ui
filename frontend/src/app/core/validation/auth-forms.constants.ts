/**
 * Mirrors backend Jakarta validation on auth DTOs so UI and API stay aligned.
 * @see backend AuthManagementDTOs.OnboardTenantRequest
 * @see backend AuthDTOs.LoginRequest
 */
export const ONBOARD_SCHOOL_CODE_MIN = 3;
export const ONBOARD_SCHOOL_CODE_MAX = 20;
export const ONBOARD_ADMIN_PASSWORD_MIN = 8;
export const ONBOARD_ADMIN_PASSWORD_MAX = 128;
