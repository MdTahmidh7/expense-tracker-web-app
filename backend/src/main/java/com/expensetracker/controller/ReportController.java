package com.expensetracker.controller;

import com.expensetracker.dto.response.ApiResponse;
import com.expensetracker.service.AuthService;
import com.expensetracker.service.ReportService;
import com.expensetracker.service.ReportService.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final AuthService authService;

    @GetMapping("/monthly-summary")
    public ApiResponse<MonthlySummary> getMonthlySummary(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        var userId = authService.getUserId(principal);
        var y = year != null ? year : LocalDate.now().getYear();
        var m = month != null ? month : LocalDate.now().getMonthValue();
        return ApiResponse.success(reportService.getMonthlySummary(userId, y, m));
    }

    @GetMapping("/budget-vs-actual")
    public ApiResponse<List<BudgetVsActualRow>> getBudgetVsActual(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        var userId = authService.getUserId(principal);
        var y = year != null ? year : LocalDate.now().getYear();
        var m = month != null ? month : LocalDate.now().getMonthValue();
        return ApiResponse.success(reportService.getBudgetVsActual(userId, y, m));
    }

    @GetMapping("/trend")
    public ApiResponse<List<TrendPoint>> getTrend(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam(defaultValue = "6") int months) {
        var userId = authService.getUserId(principal);
        return ApiResponse.success(reportService.getTrend(userId, months));
    }

    @GetMapping("/category-breakdown")
    public ApiResponse<Map<String, BigDecimal>> getCategoryBreakdown(
            @AuthenticationPrincipal OAuth2User principal,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        var userId = authService.getUserId(principal);
        var y = year != null ? year : LocalDate.now().getYear();
        var m = month != null ? month : LocalDate.now().getMonthValue();
        return ApiResponse.success(reportService.getCategoryBreakdown(userId, y, m));
    }
}
