package com.expensetracker.dto.response;

import com.expensetracker.entity.User;
import java.time.Instant;
import java.util.UUID;

public record UserProfileDTO(
    UUID id,
    String email,
    String displayName,
    String timezone,
    String currency,
    String defaultPaymentMethod,
    Integer sessionTimeoutHours,
    Instant createdAt
) {
    public static UserProfileDTO from(User user) {
        return new UserProfileDTO(
            user.getId(),
            user.getEmail(),
            user.getDisplayName(),
            user.getTimezone(),
            user.getCurrency(),
            user.getDefaultPaymentMethod(),
            user.getSessionTimeoutHours(),
            user.getCreatedAt()
        );
    }
}
