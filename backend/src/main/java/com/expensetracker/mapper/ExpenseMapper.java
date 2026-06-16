package com.expensetracker.mapper;

import com.expensetracker.dto.response.ExpenseDTO;
import com.expensetracker.entity.Expense;

import java.util.Arrays;
import java.util.List;

public class ExpenseMapper {

    private static final String TAGS_DELIMITER = ",";

    public static String tagsToString(List<String> tags) {
        if (tags == null || tags.isEmpty()) return "{}";
        return "{" + String.join(TAGS_DELIMITER, tags) + "}";
    }

    public static List<String> stringToTags(String tags) {
        if (tags == null || tags.equals("{}") || tags.isBlank()) return List.of();
        String clean = tags.replaceAll("[{}]", "");
        return Arrays.stream(clean.split(TAGS_DELIMITER))
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
