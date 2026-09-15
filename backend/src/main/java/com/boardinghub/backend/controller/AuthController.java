package com.boardinghub.backend.controller;

import com.boardinghub.backend.dto.request.LoginRequest;
import com.boardinghub.backend.dto.request.RegisterRequest;
import com.boardinghub.backend.dto.response.AuthResponse;
import com.boardinghub.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(@Valid @RequestBody com.boardinghub.backend.dto.request.ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(java.util.Map.of("message", "If an account with that email exists, an OTP has been sent to your email."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<java.util.Map<String, String>> verifyOtp(@Valid @RequestBody com.boardinghub.backend.dto.request.VerifyOtpRequest request) {
        authService.verifyOtp(request);
        return ResponseEntity.ok(java.util.Map.of("message", "OTP verified successfully."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(@Valid @RequestBody com.boardinghub.backend.dto.request.ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(java.util.Map.of("message", "Password has been successfully reset. You can now log in with your new password."));
    }
}
