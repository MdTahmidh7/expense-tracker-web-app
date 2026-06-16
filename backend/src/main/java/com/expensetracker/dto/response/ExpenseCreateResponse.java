package com.expensetracker.dto.response;

import com.expensetracker.service.BudgetService;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ExpenseCreateResponse(
    ExpenseDTO expense,
    List<BudgetService.BudgetAlert> budgetAlerts
) {}
