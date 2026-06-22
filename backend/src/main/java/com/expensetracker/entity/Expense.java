package com.expensetracker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(name = "expense")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Expense {

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

    @Column(nullable = false)
    private String currency;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false)
    private LocalDate date;

    private LocalTime time;

    @Column(nullable = false)
    private String paymentMethod;

    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "TEXT[]", nullable = false)
    private String[] tags;

    private String receiptImagePath;

    @Column(nullable = false)
    private Boolean isRecurring;

    private UUID recurringTemplateId;

    @Version
    @Column(nullable = false)
    private Integer version;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
        if (currency == null) currency = "BDT";
        if (paymentMethod == null) paymentMethod = "Cash";
        if (tags == null) tags = new String[0];
        if (isRecurring == null) isRecurring = false;
        if (version == null) version = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
