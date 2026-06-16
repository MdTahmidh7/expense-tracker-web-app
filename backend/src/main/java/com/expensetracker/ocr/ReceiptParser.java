package com.expensetracker.ocr;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class ReceiptParser {

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "[৳$€£]?\\s*\\d{1,10}[.,]\\d{2}\\s*$"
    );
    private static final List<DateTimeFormatter> DATE_FORMATS = List.of(
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("MM/dd/yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("MMM dd, yyyy", Locale.ENGLISH),
        DateTimeFormatter.ofPattern("MMMM dd, yyyy", Locale.ENGLISH)
    );

    public record ParsedReceipt(
        BigDecimal amount, double amountConfidence,
        String merchant, double merchantConfidence,
        LocalDate date, double dateConfidence
    ) {}

    public ParsedReceipt parse(String rawText) {
        if (rawText == null || rawText.isBlank()) {
            return new ParsedReceipt(null, 0, null, 0, null, 0);
        }

        var lines = rawText.lines()
            .map(String::trim)
            .filter(l -> !l.isEmpty())
            .toList();

        BigDecimal amount = null;
        double amountConf = 0;
        LocalDate date = null;
        double dateConf = 0;
        String merchant = null;
        double merchantConf = 0;

        for (String line : lines) {
            var m = AMOUNT_PATTERN.matcher(line);
            if (m.find() && amount == null) {
                try {
                    var clean = line.replaceAll("[^\\d.,]", "");
                    clean = clean.replace(",", "");
                    amount = new BigDecimal(clean);
                    amountConf = 0.85;
                } catch (NumberFormatException ignored) {}
            }

            if (date == null) {
                for (var fmt : DATE_FORMATS) {
                    try {
                        date = LocalDate.parse(line.trim(), fmt);
                        dateConf = 0.8;
                        break;
                    } catch (DateTimeParseException ignored) {}
                }
            }

            if (merchant == null && !line.matches(".*\\d.*") && line.length() > 3
                && !line.toLowerCase().contains("total") && !line.toLowerCase().contains("receipt")) {
                merchant = line;
                merchantConf = 0.75;
            }
        }

        return new ParsedReceipt(amount, amountConf, merchant, merchantConf, date, dateConf);
    }
}
