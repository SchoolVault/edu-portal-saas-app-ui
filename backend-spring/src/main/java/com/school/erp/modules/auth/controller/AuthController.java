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

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, Register, Profile APIs")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticate with email, password and school code. Returns JWT token.")
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> login(@Valid @RequestBody AuthDTOs.LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(authService.login(request)));
    }

    @PostMapping("/register")
    @Operation(summary = "Register user", description = "Register a new user (Admin only)")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> register(@Valid @RequestBody AuthDTOs.RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(authService.register(request)));
    }

    @GetMapping("/profile")
    @Operation(summary = "Get profile", description = "Get current authenticated user profile")
    public ResponseEntity<ApiResponse<AuthDTOs.UserProfile>> getProfile() {
        return ResponseEntity.ok(ApiResponse.ok(authService.getProfile()));
    }
}
