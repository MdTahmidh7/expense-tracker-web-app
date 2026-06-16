package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.UserProfileDTO;
import com.expensetracker.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/callback")
    public ApiResponse<UserProfileDTO> callback(@AuthenticationPrincipal OAuth2User principal) {
        var user = authService.getOrCreateUser(principal);
        return ApiResponse.success(UserProfileDTO.from(user));
    }

    @GetMapping("/me")
    public ApiResponse<UserProfileDTO> me(@AuthenticationPrincipal OAuth2User principal) {
        var user = authService.getOrCreateUser(principal);
        return ApiResponse.success(UserProfileDTO.from(user));
    }
}
