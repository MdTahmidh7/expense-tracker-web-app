package com.expensetracker.mapper;

import com.expensetracker.dto.response.ExpenseDTO;
import com.expensetracker.entity.Expense;

import java.util.Arrays;
import java.util.List;

public class ExpenseMapper {

    public static String[] tagsToString(List<String> tags) {
        if (tags == null) return new String[0];
        return tags.toArray(new String[0]);
    }

    public static List<String> stringToTags(String[] tags) {
        if (tags == null || tags.length == 0) return List.of();
        return Arrays.stream(tags)
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }

    public static ExpenseDTO toDto(Expense expense) {
        return new ExpenseDTO(
            expense.getId(),
            expense.getAmount(),
            expense.getCurrency(),
            expense.getDescription(),
            expense.getNotes(),
            expense.getDate(),
            expense.getTime(),
            new ExpenseDTO.CategorySummaryDTO(
                expense.getCategory().getId(),
                expense.getCategory().getName()
            ),
            expense.getPaymentMethod(),
            stringToTags(expense.getTags()),
            expense.getReceiptImagePath() != null
                ? "/api/receipts/image?path=" + expense.getReceiptImagePath() : null,
            expense.getIsRecurring(),
            expense.getRecurringTemplateId(),
            expense.getCreatedAt(),
            expense.getUpdatedAt()
        );
    }
}
