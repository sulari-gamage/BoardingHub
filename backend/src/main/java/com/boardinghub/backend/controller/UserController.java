package com.boardinghub.backend.controller;

import com.boardinghub.backend.dto.request.ChangePasswordRequest;
import com.boardinghub.backend.dto.request.UpdateProfileRequest;
import com.boardinghub.backend.dto.response.UserProfileResponse;
import com.boardinghub.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileResponse> getUserProfile(Principal principal) {
        return ResponseEntity.ok(userService.getUserProfile(principal.getName()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileResponse> updateProfile(
            Principal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(userService.updateProfile(principal.getName(), request));
    }

    @PutMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }
}
