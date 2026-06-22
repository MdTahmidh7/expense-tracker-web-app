package com.expensetracker.service;

import com.expensetracker.entity.Expense;
import com.expensetracker.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final ExpenseRepository expenseRepository;

    public byte[] exportExpensesCsv(UUID userId, LocalDate startDate, LocalDate endDate) {
        try (var baos = new ByteArrayOutputStream();
             var writer = new OutputStreamWriter(baos, StandardCharsets.UTF_8);
             var printer = new CSVPrinter(writer, CSVFormat.DEFAULT
                 .withHeader("Date", "Description", "Category", "Amount", "Currency",
                            "Payment Method", "Tags", "Notes", "Receipt"))) {

            var page = expenseRepository.searchExpenses(
                userId, null, null, null, startDate, endDate,
                PageRequest.of(0, 10000)
            );
            for (var expense : page.getContent()) {
                printer.printRecord(
                    expense.getDate(),
                    expense.getDescription(),
                    expense.getCategory().getName(),
                    expense.getAmount(),
                    expense.getCurrency(),
                    expense.getPaymentMethod(),
                    String.join(",", expense.getTags()),
                    expense.getNotes(),
                    expense.getReceiptImagePath()
                );
            }
            printer.flush();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to export CSV", e);
        }
    }
}
