package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.service.AccountService;
import com.expensetracker.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;
    private final AuthService authService;

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> deleteAccount(@AuthenticationPrincipal OAuth2User principal) {
        var userId = authService.getUserId(principal);
        accountService.deleteAccount(userId);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
