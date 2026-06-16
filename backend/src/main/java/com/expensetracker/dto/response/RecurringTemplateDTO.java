package com.expensetracker.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RecurringTemplateDTO(
    UUID id,
    BigDecimal amount,
    String description,
    String notes,
    String paymentMethod,
    int dayOfMonth,
    boolean isActive,
    CategorySummary category,
    Instant createdAt
) {
    public record CategorySummary(UUID id, String name) {}
}
