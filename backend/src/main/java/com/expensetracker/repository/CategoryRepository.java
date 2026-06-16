package com.expensetracker.repository;

import com.expensetracker.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId OR c.isPredefined = true ORDER BY c.sortOrder")
    List<Category> findByUserIdOrPredefined(@Param("userId") UUID userId);

    @Query("SELECT c FROM Category c WHERE (c.user.id = :userId OR c.isPredefined = true) AND c.id = :id")
    Optional<Category> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId")
    List<Category> findByUserId(@Param("userId") UUID userId);

    boolean existsByNameIgnoreCaseAndUserId(String name, UUID userId);

    @Query("SELECT c FROM Category c WHERE c.user.id = :userId OR c.isPredefined = true ORDER BY " +
           "CASE WHEN LOWER(:merchant) LIKE '%' || LOWER(c.name) || '%' THEN 0 ELSE 1 END, c.sortOrder")
    List<Category> suggestByMerchant(@Param("merchant") String merchant, @Param("userId") UUID userId);
}
