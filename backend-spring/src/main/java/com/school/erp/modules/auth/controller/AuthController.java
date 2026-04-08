package com.school.erp.modules.auth.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.auth.dto.AuthDTOs;
import com.school.erp.modules.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/auth") @RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, Register, Profile, Password Management")
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login") @Operation(summary = "Login", description = "Authenticate with email, password, school code. Returns JWT + refresh token.")
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> login(@Valid @RequestBody AuthDTOs.LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    @PostMapping("/register") @Operation(summary = "Register new user (Admin only)")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> register(@Valid @RequestBody AuthDTOs.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(authService.register(request)));
    }

    @GetMapping("/profile") @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> getProfile() {
        return ResponseEntity.ok(ApiResponse.ok(authService.getProfile()));
    }

    @PutMapping("/profile") @Operation(summary = "Update profile (name, phone, avatar)")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> updateProfile(@Valid @RequestBody AuthDTOs.UpdateProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.updateProfile(request), "Profile updated"));
    }

    @PostMapping("/change-password") @Operation(summary = "Change password", description = "Requires current password verification")
    public ResponseEntity<ApiResponse<Void>> changePassword(@Valid @RequestBody AuthDTOs.ChangePasswordRequest request) {
        authService.changePassword(request);
        return ResponseEntity.ok(ApiResponse.ok(null, "Password changed successfully"));
    }

    @PostMapping("/refresh-token") @Operation(summary = "Refresh JWT token")
    public ResponseEntity<ApiResponse<AuthDTOs.TokenResponse>> refreshToken(@Valid @RequestBody AuthDTOs.RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.refreshToken(request)));
    }
}
