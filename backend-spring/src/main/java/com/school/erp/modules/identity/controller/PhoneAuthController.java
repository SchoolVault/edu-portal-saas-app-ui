package com.school.erp.modules.identity.controller;

import com.school.erp.common.dto.ApiResponse;
import com.school.erp.modules.auth.dto.AuthDTOs;
import com.school.erp.modules.identity.dto.PhoneAuthDTOs;
import com.school.erp.modules.identity.service.OtpService;
import com.school.erp.modules.identity.service.PhoneAuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth/phone")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Phone Authentication", description = "OTP and phone-based session exchange")
public class PhoneAuthController {

    private final OtpService otpService;
    private final PhoneAuthService phoneAuthService;

    @PostMapping("/send-otp")
    @Operation(summary = "Send OTP to phone")
    public ResponseEntity<ApiResponse<PhoneAuthDTOs.SendOtpResponse>> sendOtp(@Valid @RequestBody PhoneAuthDTOs.SendOtpRequest request) {
        log.debug("send-otp phone={} schoolCode={}", request.getPhone(), request.getSchoolCode());
        return ResponseEntity.ok(ApiResponse.ok(otpService.sendOtp(request)));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP")
    public ResponseEntity<ApiResponse<PhoneAuthDTOs.VerifyOtpResponse>> verifyOtp(@Valid @RequestBody PhoneAuthDTOs.VerifyOtpRequest request) {
        log.debug("verify-otp phone={}", request.getPhone());
        return ResponseEntity.ok(ApiResponse.ok(otpService.verifyOtp(request)));
    }

    @PostMapping("/login")
    @Operation(summary = "Exchange verified OTP for JWT (same payload as email/password login)")
    public ResponseEntity<ApiResponse<AuthDTOs.LoginResponse>> phoneLogin(@Valid @RequestBody PhoneAuthDTOs.PhoneLoginRequest request) {
        log.debug("phone-login phone={} schoolCode={}", request.getPhone(), request.getSchoolCode());
        return ResponseEntity.ok(ApiResponse.ok(phoneAuthService.loginWithOtpExchange(request)));
    }

    @PostMapping("/resend-otp")
    @Operation(summary = "Resend OTP")
    public ResponseEntity<ApiResponse<PhoneAuthDTOs.SendOtpResponse>> resendOtp(@Valid @RequestBody PhoneAuthDTOs.ResendOtpRequest request) {
        PhoneAuthDTOs.SendOtpRequest sendRequest = PhoneAuthDTOs.SendOtpRequest.builder()
                .phone(request.getPhone())
                .schoolCode(request.getSchoolCode())
                .purpose(request.getPurpose())
                .channel(request.getChannel())
                .build();
        return ResponseEntity.ok(ApiResponse.ok(otpService.sendOtp(sendRequest)));
    }
}
