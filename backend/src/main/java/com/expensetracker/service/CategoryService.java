package com.expensetracker.service;

import com.expensetracker.dto.request.CategoryCreateRequest;
import com.expensetracker.dto.request.CategoryUpdateRequest;
import com.expensetracker.dto.response.CategoryDTO;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.CategoryMapper;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    public List<CategoryDTO> findAll(UUID userId) {
        var categories = categoryRepository.findByUserIdOrPredefined(userId);
        var now = LocalDate.now();
        return categories.stream().map(cat -> {
            var spent = expenseRepository.totalSpentInCategory(userId, cat.getId(), now.getYear(), now.getMonthValue());
            return CategoryMapper.toDto(cat, spent);
        }).toList();
    }

    @Transactional
    public CategoryDTO create(UUID userId, CategoryCreateRequest req) {
        var user = new User();
        user.setId(userId);
        var category = Category.builder()
            .user(user).name(req.name().trim())
            .isPredefined(false).sortOrder(99)
            .build();
        category = categoryRepository.save(category);
        return CategoryMapper.toDto(category, BigDecimal.ZERO);
    }

    @Transactional
    public CategoryDTO update(UUID userId, UUID categoryId, CategoryUpdateRequest req) {
        var category = categoryRepository.findByIdAndUserId(categoryId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        if (req.name() != null && !req.name().isBlank() && !category.getIsPredefined()) {
            category.setName(req.name().trim());
        }
        if (req.monthlyBudget() != null) {
            category.setMonthlyBudget(req.monthlyBudget());
        }
        category = categoryRepository.save(category);
        var spent = expenseRepository.totalSpentInCategory(userId, categoryId, LocalDate.now().getYear(), LocalDate.now().getMonthValue());
        return CategoryMapper.toDto(category, spent);
    }

    @Transactional
    public void delete(UUID userId, UUID categoryId) {
        var category = categoryRepository.findByIdAndUserId(categoryId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));
        if (category.getIsPredefined()) {
            throw new IllegalStateException("Cannot delete predefined category");
        }
        if (expenseRepository.existsByCategoryIdAndUserId(categoryId, userId)) {
            throw new IllegalStateException("Category has associated expenses. Move them first.");
        }
        categoryRepository.delete(category);
    }

    public List<CategoryDTO> suggest(UUID userId, String merchant) {
        var categories = categoryRepository.suggestByMerchant(merchant, userId);
        return categories.stream().limit(3).map(cat ->
            CategoryMapper.toDto(cat, BigDecimal.ZERO)
        ).toList();
    }
}
