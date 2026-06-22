package com.expensetracker.repository;

import com.expensetracker.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    Page<Expense> findByUserIdOrderByDateDesc(UUID userId, Pageable pageable);

    Optional<Expense> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
SELECT e
FROM Expense e
WHERE e.user.id = :userId
AND (
    :search IS NULL
    OR LOWER(e.description) LIKE CONCAT('%', CAST(:search AS string), '%')
    OR LOWER(COALESCE(e.notes, '')) LIKE CONCAT('%', CAST(:search AS string), '%')
)
AND (:categoryId IS NULL OR e.category.id = :categoryId)
AND (:paymentMethod IS NULL OR e.paymentMethod = :paymentMethod)
AND (:startDate IS NULL OR e.date >= :startDate)
AND (:endDate IS NULL OR e.date <= :endDate)
ORDER BY e.date DESC, e.createdAt DESC
""")
    Page<Expense> searchExpenses(
        @Param("userId") UUID userId,
        @Param("search") String search,
        @Param("categoryId") UUID categoryId,
        @Param("paymentMethod") String paymentMethod,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE " +
           "e.user.id = :userId AND e.category.id = :categoryId AND " +
           "EXTRACT(YEAR FROM e.date) = :year AND EXTRACT(MONTH FROM e.date) = :month AND e.amount > 0")
    BigDecimal totalSpentInCategory(@Param("userId") UUID userId, @Param("categoryId") UUID categoryId,
                                     @Param("year") int year, @Param("month") int month);

    @Query("SELECT e FROM Expense e WHERE e.user.id = :userId AND e.amount > 0 AND " +
           "EXTRACT(YEAR FROM e.date) = :year AND EXTRACT(MONTH FROM e.date) = :month")
    List<Expense> findByUserAndMonth(@Param("userId") UUID userId, @Param("year") int year, @Param("month") int month);

    @Query("SELECT EXTRACT(YEAR FROM e.date) as year, EXTRACT(MONTH FROM e.date) as month, SUM(e.amount) as total " +
           "FROM Expense e WHERE e.user.id = :userId AND e.amount > 0 AND " +
           "e.date >= :since GROUP BY EXTRACT(YEAR FROM e.date), EXTRACT(MONTH FROM e.date) ORDER BY year, month")
    List<Object[]> monthlyTrend(@Param("userId") UUID userId, @Param("since") LocalDate since);

    @Query("SELECT DISTINCT e.tags FROM Expense e WHERE e.user.id = :userId")
    List<String[]> findAllTagsByUserId(@Param("userId") UUID userId);

    boolean existsByCategoryIdAndUserId(UUID categoryId, UUID userId);
}
