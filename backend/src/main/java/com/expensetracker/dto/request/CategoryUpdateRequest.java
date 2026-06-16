package com.expensetracker.dto.request;

import java.math.BigDecimal;

public record CategoryUpdateRequest(
    String name,
    BigDecimal monthlyBudget
) {}
