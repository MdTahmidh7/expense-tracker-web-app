package com.expensetracker.ocr;

import com.expensetracker.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CategorySuggester {

    private final CategoryService categoryService;

    public record Suggestion(UUID categoryId, String categoryName, double confidence) {}

    public Suggestion suggest(UUID userId, String merchant) {
        if (merchant == null || merchant.isBlank()) {
            return new Suggestion(null, null, 0);
        }
        var suggestions = categoryService.suggest(userId, merchant);
        if (suggestions.isEmpty()) {
            return new Suggestion(null, null, 0);
        }
        var best = suggestions.get(0);
        double confidence = best.name().toLowerCase().contains(merchant.toLowerCase().split(" ")[0])
            ? 0.85 : 0.6;
        return new Suggestion(best.id(), best.name(), confidence);
    }
}
