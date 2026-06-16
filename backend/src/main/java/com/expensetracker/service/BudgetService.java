package com.expensetracker.service;

import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;

    public record BudgetAlert(
        UUID categoryId,
        String categoryName,
        BigDecimal budget,
        BigDecimal spent,
        double percentUsed,
        String level
    ) {}

    public List<BudgetAlert> recalculate(UUID userId, LocalDate date) {
        var now = LocalDate.now();
        var categories = categoryRepository.findByUserIdOrPredefined(userId);
        return categories.stream()
            .filter(c -> c.getMonthlyBudget() != null && c.getMonthlyBudget().compareTo(BigDecimal.ZERO) > 0)
            .map(c -> {
                var spent = expenseRepository.totalSpentInCategory(userId, c.getId(), now.getYear(), now.getMonthValue());
                double percent = spent.divide(c.getMonthlyBudget(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
                String level = percent >= 100 ? "EXCEEDED" : percent >= 80 ? "WARNING" : "OK";
                return new BudgetAlert(c.getId(), c.getName(), c.getMonthlyBudget(), spent, percent, level);
            })
            .toList();
    }

    public BudgetAlert calculateSingle(UUID userId, UUID categoryId, BigDecimal budget, LocalDate date) {
        if (budget == null || budget.compareTo(BigDecimal.ZERO) <= 0) return null;
        var now = LocalDate.now();
        var spent = expenseRepository.totalSpentInCategory(userId, categoryId, now.getYear(), now.getMonthValue());
        double percent = spent.divide(budget, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .doubleValue();
        String level = percent >= 100 ? "EXCEEDED" : percent >= 80 ? "WARNING" : "OK";
        var category = categoryRepository.findById(categoryId).orElse(null);
        return new BudgetAlert(
            categoryId,
            category != null ? category.getName() : "Unknown",
            budget, spent, percent, level
        );
    }
}
