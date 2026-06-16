package com.expensetracker.service;

import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;

    public record MonthlySummary(
        BigDecimal totalSpent,
        BigDecimal totalBudget,
        BigDecimal budgetRemaining,
        TopCategory topCategory,
        Double vsLastMonth,
        List<DonutSlice> donutData
    ) {
        public record TopCategory(String name, BigDecimal amount) {}
        public record DonutSlice(String category, BigDecimal amount, double percentage) {}
    }

    public record BudgetVsActualRow(
        UUID categoryId,
        String categoryName,
        BigDecimal budgeted,
        BigDecimal spent,
        BigDecimal remaining,
        Double percentUsed,
        String status
    ) {}

    public record TrendPoint(int year, int month, String label, BigDecimal total) {}

    public MonthlySummary getMonthlySummary(UUID userId, int year, int month) {
        var expenses = expenseRepository.findByUserAndMonth(userId, year, month);
        var totalSpent = expenses.stream()
            .filter(e -> e.getAmount().compareTo(BigDecimal.ZERO) > 0)
            .map(Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        var categories = categoryRepository.findByUserIdOrPredefined(userId);
        var totalBudget = categories.stream()
            .map(Category::getMonthlyBudget)
            .filter(Objects::nonNull)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        var categoryTotals = new HashMap<UUID, BigDecimal>();
        for (var e : expenses) {
            if (e.getAmount().compareTo(BigDecimal.ZERO) > 0) {
                categoryTotals.merge(e.getCategory().getId(), e.getAmount(), BigDecimal::add);
            }
        }

        var topCat = categoryTotals.entrySet().stream()
            .max(Map.Entry.comparingByValue())
            .map(e -> {
                var cat = categories.stream().filter(c -> c.getId().equals(e.getKey())).findFirst().orElse(null);
                return new MonthlySummary.TopCategory(cat != null ? cat.getName() : "Unknown", e.getValue());
            })
            .orElse(new MonthlySummary.TopCategory("None", BigDecimal.ZERO));

        var donut = categoryTotals.entrySet().stream().map(e -> {
            var cat = categories.stream().filter(c -> c.getId().equals(e.getKey())).findFirst().orElse(null);
            return new MonthlySummary.DonutSlice(
                cat != null ? cat.getName() : "Unknown",
                e.getValue(),
                totalSpent.compareTo(BigDecimal.ZERO) > 0
                    ? e.getValue().divide(totalSpent, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
                    : 0
            );
        }).sorted((a, b) -> b.amount().compareTo(a.amount())).toList();

        // Vs last month
        var lastMonth = month == 1 ? 12 : month - 1;
        var lastYear = month == 1 ? year - 1 : year;
        var lastMonthExpenses = expenseRepository.findByUserAndMonth(userId, lastYear, lastMonth);
        var lastTotal = lastMonthExpenses.stream()
            .filter(e -> e.getAmount().compareTo(BigDecimal.ZERO) > 0)
            .map(Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        double vsLastMonth = lastTotal.compareTo(BigDecimal.ZERO) > 0
            ? totalSpent.subtract(lastTotal).divide(lastTotal, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100)).doubleValue()
            : 0.0;

        return new MonthlySummary(
            totalSpent, totalBudget, totalBudget.subtract(totalSpent),
            topCat, vsLastMonth, donut
        );
    }

    public List<BudgetVsActualRow> getBudgetVsActual(UUID userId, int year, int month) {
        var categories = categoryRepository.findByUserIdOrPredefined(userId);
        return categories.stream()
            .filter(c -> c.getMonthlyBudget() != null && c.getMonthlyBudget().compareTo(BigDecimal.ZERO) > 0)
            .map(c -> {
                var spent = expenseRepository.totalSpentInCategory(userId, c.getId(), year, month);
                var remaining = c.getMonthlyBudget().subtract(spent);
                double percent = spent.divide(c.getMonthlyBudget(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue();
                String status = percent >= 100 ? "EXCEEDED" : percent >= 80 ? "WARNING" : "OK";
                return new BudgetVsActualRow(
                    c.getId(), c.getName(), c.getMonthlyBudget(), spent, remaining, percent, status
                );
            })
            .toList();
    }

    public List<TrendPoint> getTrend(UUID userId, int months) {
        var since = LocalDate.now().minusMonths(months - 1).withDayOfMonth(1);
        var raw = expenseRepository.monthlyTrend(userId, since);
        return raw.stream().map(row -> {
            var year = ((Number) row[0]).intValue();
            var month = ((Number) row[1]).intValue();
            var total = (BigDecimal) row[2];
            var label = String.format("%d-%02d", year, month);
            return new TrendPoint(year, month, label, total);
        }).toList();
    }

    public Map<String, BigDecimal> getCategoryBreakdown(UUID userId, int year, int month) {
        var expenses = expenseRepository.findByUserAndMonth(userId, year, month);
        return expenses.stream()
            .filter(e -> e.getAmount().compareTo(BigDecimal.ZERO) > 0)
            .collect(Collectors.groupingBy(
                e -> e.getCategory().getName(),
                Collectors.mapping(Expense::getAmount, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
            ));
    }
}
