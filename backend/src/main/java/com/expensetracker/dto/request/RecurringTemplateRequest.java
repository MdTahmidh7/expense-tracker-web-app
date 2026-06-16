package com.expensetracker.dto.request;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.UUID;

public record RecurringTemplateRequest(
    @NotNull UUID categoryId,
    @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal amount,
    @NotBlank @Size(max = 500) String description,
    @Size(max = 2000) String notes,
    String paymentMethod,
    @NotNull @Min(1) @Max(31) Integer dayOfMonth
) {
    public RecurringTemplateRequest {
        if (paymentMethod == null) paymentMethod = "Cash";
    }
}
