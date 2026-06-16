package com.expensetracker.service;

import com.expensetracker.exception.ValidationException;
import com.expensetracker.mapper.ExpenseMapper;
import com.expensetracker.repository.ExpenseRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TagService {

    private final ExpenseRepository expenseRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public List<String> getAllTags(UUID userId) {
        var tags = expenseRepository.findAllTagsByUserId(userId);
        return tags.stream()
            .flatMap(t -> ExpenseMapper.stringToTags(t[0]).stream())
            .distinct()
            .sorted()
            .toList();
    }

    @Transactional
    public void renameTag(UUID userId, String oldName, String newName) {
        if (oldName == null || oldName.isBlank() || newName == null || newName.isBlank()) {
            throw new ValidationException("Tag names must not be empty");
        }
        entityManager.createNativeQuery(
            "UPDATE expense SET tags = array_replace(tags, :oldName, :newName) " +
            "WHERE user_id = :userId AND :oldName = ANY(tags)"
        )
        .setParameter("oldName", oldName)
        .setParameter("newName", newName)
        .setParameter("userId", userId)
        .executeUpdate();
    }

    @Transactional
    public void mergeTags(UUID userId, String sourceTag, String targetTag) {
        if (sourceTag == null || sourceTag.isBlank() || targetTag == null || targetTag.isBlank()) {
            throw new ValidationException("Tag names must not be empty");
        }
        entityManager.createNativeQuery(
            "UPDATE expense SET tags = " +
            "  CASE WHEN NOT (:targetTag = ANY(tags)) " +
            "    THEN array_append(array_remove(tags, :sourceTag), :targetTag) " +
            "    ELSE array_remove(tags, :sourceTag) " +
            "  END " +
            "WHERE user_id = :userId AND :sourceTag = ANY(tags)"
        )
        .setParameter("sourceTag", sourceTag)
        .setParameter("targetTag", targetTag)
        .setParameter("userId", userId)
        .executeUpdate();
    }
}
