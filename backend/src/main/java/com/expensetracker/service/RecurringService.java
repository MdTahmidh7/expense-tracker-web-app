package com.expensetracker.service;

import com.expensetracker.dto.request.RecurringTemplateRequest;
import com.expensetracker.dto.response.RecurringTemplateDTO;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.RecurringTemplate;
import com.expensetracker.entity.User;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mapper.RecurringMapper;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.RecurringTemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RecurringService {

    private final RecurringTemplateRepository templateRepository;
    private final ExpenseRepository expenseRepository;
    private final CategoryRepository categoryRepository;

    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    public void generateRecurringEntries() {
        var templates = templateRepository.findByIsActiveTrue();
        var now = LocalDate.now();
        for (var t : templates) {
            var expense = Expense.builder()
                .user(t.getUser())
                .category(t.getCategory())
                .amount(t.getAmount())
                .currency("BDT")
                .description(t.getDescription())
                .notes(t.getNotes())
                .date(now.withDayOfMonth(Math.min(t.getDayOfMonth(), now.lengthOfMonth())))
                .paymentMethod(t.getPaymentMethod())
                .tags("{}")
                .isRecurring(true)
                .recurringTemplateId(t.getId())
                .build();
            expenseRepository.save(expense);
        }
    }

    public List<RecurringTemplateDTO> findByUser(UUID userId) {
        return templateRepository.findByUserIdAndIsActiveTrue(userId).stream()
            .map(RecurringMapper::toDto)
            .toList();
    }

    public RecurringTemplateDTO findById(UUID userId, UUID templateId) {
        var template = templateRepository.findByIdAndUserId(templateId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("RecurringTemplate", "id", templateId));
        return RecurringMapper.toDto(template);
    }

    @Transactional
    public RecurringTemplateDTO create(UUID userId, RecurringTemplateRequest req) {
        var user = new User();
        user.setId(userId);
        var category = categoryRepository.findByIdAndUserId(req.categoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", req.categoryId()));
        var template = RecurringTemplate.builder()
            .user(user)
            .category(category)
            .amount(req.amount())
            .description(req.description())
            .notes(req.notes())
            .paymentMethod(req.paymentMethod())
            .dayOfMonth(req.dayOfMonth())
            .isActive(true)
            .build();
        return RecurringMapper.toDto(templateRepository.save(template));
    }

    @Transactional
    public void deactivate(UUID userId, UUID templateId) {
        var template = templateRepository.findByIdAndUserId(templateId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("RecurringTemplate", "id", templateId));
        template.setIsActive(false);
        templateRepository.save(template);
    }

    @Transactional
    public RecurringTemplateDTO update(UUID userId, UUID templateId, RecurringTemplateRequest req) {
        var template = templateRepository.findByIdAndUserId(templateId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("RecurringTemplate", "id", templateId));
        template.setAmount(req.amount());
        template.setDescription(req.description());
        template.setNotes(req.notes());
        template.setPaymentMethod(req.paymentMethod());
        template.setDayOfMonth(req.dayOfMonth());
        var category = categoryRepository.findByIdAndUserId(req.categoryId(), userId)
            .orElseThrow(() -> new ResourceNotFoundException("Category", "id", req.categoryId()));
        template.setCategory(category);
        return RecurringMapper.toDto(templateRepository.save(template));
    }
}
