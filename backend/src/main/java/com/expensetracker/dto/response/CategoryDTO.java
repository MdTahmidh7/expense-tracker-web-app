package com.expensetracker.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record CategoryDTO(
    UUID id,
    String name,
    boolean isPredefined,
    BigDecimal monthlyBudget,
    BigDecimal spentThisMonth,
    Integer sortOrder
) {}
