package com.expensetracker.controller;

import com.expensetracker.dto.request.CategoryCreateRequest;
import com.expensetracker.dto.request.CategoryUpdateRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.CategoryDTO;
import com.expensetracker.service.AuthService;
import com.expensetracker.service.CategoryService;
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
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final AuthService authService;

    @GetMapping
    public ApiResponse<List<CategoryDTO>> getAll(@AuthenticationPrincipal OAuth2User principal) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(categoryService.findAll(userId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryDTO>> create(
            @AuthenticationPrincipal OAuth2User principal,
            @Valid @RequestBody CategoryCreateRequest req) {
        var userId = authService.getUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(categoryService.create(userId, req)));
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryDTO> update(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable UUID id,
            @Valid @RequestBody CategoryUpdateRequest req) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(categoryService.update(userId, id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable UUID id) {
        var userId = authService.getUserId(principal);
        categoryService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/suggest")
    public ApiResponse<List<CategoryDTO>> suggest(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam String merchant) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(categoryService.suggest(userId, merchant));
    }
}
