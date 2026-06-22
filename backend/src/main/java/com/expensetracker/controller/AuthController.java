package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.UserProfileDTO;
import com.expensetracker.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/callback")
    public ResponseEntity<ApiResponse<UserProfileDTO>> callback(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        var user = authService.getOrCreateUser(principal);
        return ResponseEntity.ok(ApiResponse.success(UserProfileDTO.from(user)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserProfileDTO>> me(@AuthenticationPrincipal OAuth2User principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Not authenticated"));
        }
        var user = authService.getOrCreateUser(principal);
        return ResponseEntity.ok(ApiResponse.success(UserProfileDTO.from(user)));
    }
}
