package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.UserProfileDTO;
import com.expensetracker.entity.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.AuthService;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final UserRepository userRepository;
    private final AuthService authService;

    public record SettingsUpdateRequest(
        @Size(max = 255) String displayName,
        @Size(max = 50) String timezone,
        @Size(max = 3) String currency,
        @Size(max = 50) String defaultPaymentMethod,
        @Min(1) @Max(168) Integer sessionTimeoutHours
    ) {}

    @GetMapping
    public ApiResponse<UserProfileDTO> getSettings(@AuthenticationPrincipal OAuth2User principal) {
        return ApiResponse.success(authService.getProfile(principal));
    }

    @PutMapping
    @Transactional
    public ApiResponse<UserProfileDTO> updateSettings(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestBody SettingsUpdateRequest req) {
        var userId = authService.getUserId(principal);
        var user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        if (req.displayName() != null && !req.displayName().isBlank()) user.setDisplayName(req.displayName().trim());
        if (req.timezone() != null && !req.timezone().isBlank()) user.setTimezone(req.timezone());
        if (req.currency() != null && !req.currency().isBlank()) user.setCurrency(req.currency().toUpperCase());
        if (req.defaultPaymentMethod() != null && !req.defaultPaymentMethod().isBlank()) user.setDefaultPaymentMethod(req.defaultPaymentMethod());
        if (req.sessionTimeoutHours() != null) user.setSessionTimeoutHours(req.sessionTimeoutHours());
        userRepository.save(user);
        return ApiResponse.success(UserProfileDTO.from(user));
    }
}
