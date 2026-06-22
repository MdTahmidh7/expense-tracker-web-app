package com.expensetracker.controller;

import com.expensetracker.dto.request.ExpenseCreateRequest;
import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.dto.response.ExpenseCreateResponse;
import com.expensetracker.dto.response.ExpenseDTO;
import com.expensetracker.dto.response.PagedResponse;
import com.expensetracker.service.AuthService;
import com.expensetracker.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;
    private final AuthService authService;

    @GetMapping
    public ApiResponse<PagedResponse<ExpenseDTO>> getAll(
            @AuthenticationPrincipal OAuth2User principal,
            @PageableDefault(size = 50, sort = "date", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        var userId = authService.getUserId(principal);
        var page = expenseService.findAll(
                userId,
                search,
                categoryId,
                paymentMethod,
                startDate,
                endDate,
                pageable
        );
        return ApiResponse.success(PagedResponse.from(page));
    }

    @GetMapping("/{id}")
    public ApiResponse<ExpenseDTO> getById(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable UUID id) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(expenseService.findById(userId, id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ExpenseCreateResponse>> create(
            @AuthenticationPrincipal OAuth2User principal,
            @Valid @RequestBody ExpenseCreateRequest req) {
        var userId = authService.getUserId(principal);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(expenseService.create(userId, req)));
    }

    @PutMapping("/{id}")
    public ApiResponse<ExpenseCreateResponse> update(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable UUID id,
            @Valid @RequestBody ExpenseCreateRequest req) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(expenseService.update(userId, id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal OAuth2User principal,
            @PathVariable UUID id) {
        var userId = authService.getUserId(principal);
        expenseService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
}
