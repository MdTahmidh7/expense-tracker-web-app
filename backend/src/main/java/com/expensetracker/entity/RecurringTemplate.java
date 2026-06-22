package com.expensetracker.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recurring_template")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RecurringTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false)
    private String paymentMethod;

    @Column(nullable = false)
    private Integer dayOfMonth;

    @Column(nullable = false)
    private Boolean isActive;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        if (paymentMethod == null) paymentMethod = "Cash";
        if (isActive == null) isActive = true;
    }
}
