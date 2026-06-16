package com.expensetracker.controller;

import com.expensetracker.dto.request.RecurringTemplateRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.RecurringTemplateDTO;
import com.expensetracker.service.AuthService;
import com.expensetracker.service.RecurringService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recurring-templates")
@RequiredArgsConstructor
public class RecurringController {

    private final RecurringService recurringService;
    private final AuthService authService;

    @GetMapping
    public ApiResponse<List<RecurringTemplateDTO>> getAll(@AuthenticationPrincipal OAuth2User principal) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(recurringService.findByUser(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<RecurringTemplateDTO> getById(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable UUID id) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(recurringService.findById(userId, id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RecurringTemplateDTO>> create(
            @AuthenticationPrincipal OAuth2User principal,
            @Valid @RequestBody RecurringTemplateRequest req) {
        var userId = authService.getUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(recurringService.create(userId, req)));
    }

    @PutMapping("/{id}")
    public ApiResponse<RecurringTemplateDTO> update(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable UUID id,
            @Valid @RequestBody RecurringTemplateRequest req) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(recurringService.update(userId, id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deactivate(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable UUID id) {
        var userId = authService.getUserId(principal);
        recurringService.deactivate(userId, id);
        return ResponseEntity.noContent().build();
    }
}
