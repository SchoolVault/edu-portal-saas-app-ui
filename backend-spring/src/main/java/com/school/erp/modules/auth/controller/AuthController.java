package com.school.erp.modules.auth.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.auth.dto.AuthDTOs;
import com.school.erp.modules.auth.dto.AuthIdentityDTOs;
import com.school.erp.modules.auth.dto.AuthManagementDTOs;
import com.school.erp.modules.auth.dto.AuthPersonalProfileDTOs;
import com.school.erp.modules.auth.dto.AuthProfileDTOs;
import com.school.erp.modules.auth.dto.UserPreferencesRequest;
import com.school.erp.modules.auth.service.AuthService;
import com.school.erp.modules.auth.service.EmailVerificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "Login, Register, Profile, Password Management")
public class AuthController {
    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate with school code + password and either email or phone. Returns JWT + refresh token.")
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> login(@Valid @RequestBody AuthDTOs.LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    @PostMapping("/register")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Register new user (Admin only)")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> register(@Valid @RequestBody AuthDTOs.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(authService.register(request)));
    }

    @PostMapping("/onboard-tenant")
    @Operation(summary = "Create a new school tenant with its first admin account")
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> onboardTenant(@Valid @RequestBody AuthManagementDTOs.OnboardTenantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(authService.onboardTenant(request)));
    }

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> getProfile() {
        return ResponseEntity.ok(ApiResponse.ok(authService.getProfile()));
    }

    @GetMapping("/profile-summary")
    @Operation(summary = "Get current user profile summary for app shell")
    public ResponseEntity<ApiResponse<AuthProfileDTOs.ProfileSummaryResponse>> getProfileSummary() {
        return ResponseEntity.ok(ApiResponse.ok(authService.getProfileSummary()));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update profile (name, phone, avatar)")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> updateProfile(@Valid @RequestBody AuthDTOs.UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.updateProfile(request), "Profile updated"));
    }

    @GetMapping("/profile-details")
    @Operation(summary = "Get role-scoped personal profile details")
    public ResponseEntity<ApiResponse<AuthPersonalProfileDTOs.PersonalProfileResponse>> getProfileDetails() {
        return ResponseEntity.ok(ApiResponse.ok(authService.getPersonalProfileDetails()));
    }

    @PutMapping("/profile-details")
    @Operation(summary = "Update role-scoped personal profile details")
    public ResponseEntity<ApiResponse<AuthPersonalProfileDTOs.PersonalProfileResponse>> updateProfileDetails(
            @Valid @RequestBody AuthPersonalProfileDTOs.UpdatePersonalProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.updatePersonalProfileDetails(request), "Profile updated"));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update user preferences", description = "Interface language and future per-user settings. Persists to the user row.")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> updatePreferences(@Valid @RequestBody UserPreferencesRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.updatePreferences(request), "Preferences saved"));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password", description = "Requires current password verification")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody AuthDTOs.ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password changed successfully"));
    }

    @PostMapping("/set-password")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @Operation(summary = "Set password after verified identity", description = "Allows setting password when email or phone has been verified.")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> setPassword(@Valid @RequestBody AuthIdentityDTOs.SetPasswordRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.setPasswordAfterVerifiedIdentity(request), "Password set successfully"));
    }

    @PutMapping("/profile/email")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change login email", description = "Marks email as unverified and sends new verification link.")
    public ResponseEntity<ApiResponse<AuthIdentityDTOs.IdentityUpdateResponse>> changeEmail(
            @Valid @RequestBody AuthIdentityDTOs.ChangeEmailRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.updateLoginEmail(request), "Email updated"));
    }

    @PutMapping("/profile/phone")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change login phone", description = "Marks phone as unverified; OTP verification required on next login.")
    public ResponseEntity<ApiResponse<AuthIdentityDTOs.IdentityUpdateResponse>> changePhone(
            @Valid @RequestBody AuthIdentityDTOs.ChangePhoneRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.updateLoginPhone(request), "Phone updated"));
    }

    @PostMapping("/email-verification/request")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    @Operation(summary = "Request email verification (sends or prepares one-time token; mock-friendly)")
    public ResponseEntity<ApiResponse<AuthDTOs.EmailVerificationRequestResponse>> requestEmailVerification() {
        return ResponseEntity.ok(ApiResponse.ok(emailVerificationService.requestVerificationForCurrentUser()));
    }

    @PostMapping("/email-verification/confirm")
    @Operation(summary = "Confirm email with one-time token (link flow)")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> confirmEmailVerification(
            @Valid @RequestBody AuthDTOs.EmailVerificationConfirmRequest request) {
        return ResponseEntity.ok(
                ApiResponse.ok(emailVerificationService.confirmToken(request.getToken()), "Email verified"));
    }

    @PostMapping("/refresh-token")
    @Operation(summary = "Refresh JWT token")
    public ResponseEntity<ApiResponse<AuthDTOs.TokenResponse>> refreshToken(@Valid @RequestBody AuthDTOs.RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.refreshToken(request)));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke refresh token and logout")
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody AuthManagementDTOs.LogoutRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok(null, "Logged out successfully"));
    }

    public AuthController(final AuthService authService, final EmailVerificationService emailVerificationService) {
        this.authService = authService;
        this.emailVerificationService = emailVerificationService;
    }
}
