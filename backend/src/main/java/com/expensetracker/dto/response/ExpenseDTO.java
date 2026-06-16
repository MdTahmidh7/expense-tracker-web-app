package com.expensetracker.dto.response;

import java.math.BigDecimal;
import java.time.*;
import java.util.List;
import java.util.UUID;

public record ExpenseDTO(
    UUID id,
    BigDecimal amount,
    String currency,
    String description,
    String notes,
    LocalDate date,
    LocalTime time,
    CategorySummaryDTO category,
    String paymentMethod,
    List<String> tags,
    String receiptImageUrl,
    boolean isRecurring,
    UUID recurringTemplateId,
    Instant createdAt,
    Instant updatedAt
) {
    public record CategorySummaryDTO(UUID id, String name) {}
}
