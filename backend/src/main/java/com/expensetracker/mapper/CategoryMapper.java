package com.expensetracker.mapper;

import com.expensetracker.dto.response.CategoryDTO;
import com.expensetracker.entity.Category;

import java.math.BigDecimal;

public class CategoryMapper {
    public static CategoryDTO toDto(Category category, BigDecimal spentThisMonth) {
        return new CategoryDTO(
            category.getId(),
            category.getName(),
            category.getIsPredefined(),
            category.getMonthlyBudget(),
            spentThisMonth,
            category.getSortOrder()
        );
    }
}
