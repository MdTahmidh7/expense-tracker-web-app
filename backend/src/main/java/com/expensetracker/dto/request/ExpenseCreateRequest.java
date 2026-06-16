package com.expensetracker.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record ExpenseCreateRequest(
    @NotNull @DecimalMin(value = "0.01", message = "Amount must be positive")
    @Digits(integer = 10, fraction = 2) BigDecimal amount,

    @NotBlank @Size(max = 500) String description,

    @NotNull LocalDate date,

    LocalTime time,

    @NotNull UUID categoryId,

    String paymentMethod,

    List<@Size(max = 50) String> tags,

    @Size(max = 2000) String notes,

    UUID receiptImageId
) {
    public ExpenseCreateRequest {
        if (paymentMethod == null) paymentMethod = "Cash";
        if (tags == null) tags = List.of();
    }
}
