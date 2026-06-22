package com.expensetracker.service;

import com.expensetracker.dto.request.ExpenseCreateRequest;
import com.expensetracker.dto.response.ExpenseCreateResponse;
import com.expensetracker.dto.response.ExpenseDTO;
import com.expensetracker.dto.response.PagedResponse;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.ExpenseMapper;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.service.BudgetService.BudgetAlert;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final StorageService storageService;
    private final BudgetService budgetService;

    public Page<ExpenseDTO> findAll(UUID userId, String search, UUID categoryId,
                                    String paymentMethod, LocalDate startDate, LocalDate endDate,
                                    Pageable pageable) {
        return expenseRepository.searchExpenses(userId, search, categoryId, paymentMethod, startDate, endDate, pageable)
            .map(ExpenseMapper::toDto);
    }

    public ExpenseDTO findById(UUID userId, UUID expenseId) {
        var expense = expenseRepository.findByIdAndUserId(expenseId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));
        return ExpenseMapper.toDto(expense);
    }

    @Transactional
    public ExpenseCreateResponse create(UUID userId, ExpenseCreateRequest req) {
        var user = userRepository.getReferenceById(userId);
        var category = categoryRepository.findByIdAndUserId(req.categoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", req.categoryId()));

        var expense = Expense.builder()
            .user(user).category(category)
            .amount(req.amount()).currency("BDT")
            .description(req.description().trim())
            .notes(req.notes())
            .date(req.date()).time(req.time())
            .paymentMethod(req.paymentMethod())
            .tags(ExpenseMapper.tagsToString(req.tags()))
            .receiptImagePath(req.receiptImagePath())
            .build();
        expense = expenseRepository.save(expense);

        var alerts = budgetService.recalculate(userId, req.date());
        return new ExpenseCreateResponse(ExpenseMapper.toDto(expense), alerts);
    }

    @Transactional
    public ExpenseCreateResponse update(UUID userId, UUID expenseId, ExpenseCreateRequest req) {
        var expense = expenseRepository.findByIdAndUserId(expenseId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));

        if (req.amount() != null) expense.setAmount(req.amount());
        if (req.description() != null) expense.setDescription(req.description().trim());
        if (req.date() != null) expense.setDate(req.date());
        expense.setTime(req.time());
        if (req.categoryId() != null) {
            var category = categoryRepository.findByIdAndUserId(req.categoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", req.categoryId()));
            expense.setCategory(category);
        }
        if (req.paymentMethod() != null) expense.setPaymentMethod(req.paymentMethod());
        if (req.tags() != null) expense.setTags(ExpenseMapper.tagsToString(req.tags()));
        if (req.notes() != null) expense.setNotes(req.notes());
        if (req.receiptImagePath() != null) expense.setReceiptImagePath(req.receiptImagePath());

        expense = expenseRepository.save(expense);

        var alerts = budgetService.recalculate(userId, req.date() != null ? req.date() : expense.getDate());
        return new ExpenseCreateResponse(ExpenseMapper.toDto(expense), alerts);
    }

    @Transactional
    public void delete(UUID userId, UUID expenseId) {
        var expense = expenseRepository.findByIdAndUserId(expenseId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Expense", "id", expenseId));
        if (expense.getReceiptImagePath() != null) {
            storageService.delete(expense.getReceiptImagePath());
        }
        expenseRepository.delete(expense);
    }
}
