package com.expensetracker.repository;

import com.expensetracker.entity.RecurringTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecurringTemplateRepository extends JpaRepository<RecurringTemplate, UUID> {
    List<RecurringTemplate> findByUserIdAndIsActiveTrue(UUID userId);
    List<RecurringTemplate> findByIsActiveTrue();
    Optional<RecurringTemplate> findByIdAndUserId(UUID id, UUID userId);
}
