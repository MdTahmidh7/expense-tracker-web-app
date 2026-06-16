package com.expensetracker.service;

import com.expensetracker.ocr.CategorySuggester;
import com.expensetracker.ocr.ReceiptParser;
import com.expensetracker.ocr.TesseractOcrEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OcrService {

    private final TesseractOcrEngine ocrEngine;
    private final ReceiptParser receiptParser;
    private final CategorySuggester categorySuggester;
    private final StorageService storageService;

    public record OcrResult(
        UUID receiptImageId,
        Double extractedAmount, double amountConfidence,
        String extractedMerchant, double merchantConfidence,
        String extractedDate, double dateConfidence,
        UUID suggestedCategoryId, String suggestedCategoryName, double categoryConfidence,
        String imageUrl
    ) {}

    public OcrResult process(UUID userId, MultipartFile file) {
        var contentType = file.getContentType();
        if (contentType != null && !List.of("image/jpeg", "image/png", "image/heic", "application/pdf").contains(contentType)) {
            throw new IllegalArgumentException("Unsupported file format");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("File too large (max 10MB)");
        }

        var path = storageService.store(userId, file);
        var fullPath = storageService.load(path);
        var rawText = ocrEngine.extractText(fullPath);
        var parsed = receiptParser.parse(rawText);
        var suggestion = categorySuggester.suggest(userId, parsed.merchant());

        return new OcrResult(
            UUID.randomUUID(),
            parsed.amount() != null ? parsed.amount().doubleValue() : null, parsed.amountConfidence(),
            parsed.merchant(), parsed.merchantConfidence(),
            parsed.date() != null ? parsed.date().toString() : null, parsed.dateConfidence(),
            suggestion.categoryId(), suggestion.categoryName(), suggestion.confidence(),
            "/api/receipts/image?path=" + path
        );
    }
}
