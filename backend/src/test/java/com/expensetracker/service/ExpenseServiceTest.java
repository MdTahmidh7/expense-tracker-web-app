package com.expensetracker.service;

import com.expensetracker.dto.response.ExpenseDTO;
import com.expensetracker.entity.Category;
import com.expensetracker.entity.Expense;
import com.expensetracker.entity.User;
import com.expensetracker.mapper.ExpenseMapper;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private StorageService storageService;

    @Mock
    private BudgetService budgetService;

    @InjectMocks
    private ExpenseService expenseService;

    private Expense createExpense(UUID id, String description, BigDecimal amount, LocalDate date) {
        var user = new User();
        user.setId(UUID.randomUUID());

        var category = new Category();
        category.setId(UUID.randomUUID());
        category.setName("Food");

        var expense = new Expense();
        expense.setId(id);
        expense.setUser(user);
        expense.setCategory(category);
        expense.setAmount(amount);
        expense.setCurrency("BDT");
        expense.setDescription(description);
        expense.setDate(date);
        expense.setPaymentMethod("Cash");
        expense.setTags(new String[0]);
        expense.setIsRecurring(false);
        expense.setVersion(0);
        return expense;
    }

    @Test
    void findAll_withoutSearch_returnsAllExpenses() {
        UUID userId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);

        var expense1 = createExpense(UUID.randomUUID(), "Lunch", BigDecimal.valueOf(250), LocalDate.now());
        var expense2 = createExpense(UUID.randomUUID(), "Dinner", BigDecimal.valueOf(500), LocalDate.now());

        Page<Expense> page = new PageImpl<>(List.of(expense1, expense2));

        when(expenseRepository.searchExpenses(eq(userId), isNull(), isNull(), isNull(), isNull(), isNull(), eq(pageable)))
            .thenReturn(page);

        Page<ExpenseDTO> result = expenseService.findAll(userId, null, null, null, null, null, pageable);

        assertThat(result).hasSize(2);
        assertThat(result.getContent().get(0).description()).isEqualTo("Lunch");
        assertThat(result.getContent().get(1).description()).isEqualTo("Dinner");

        verify(expenseRepository).searchExpenses(userId, null, null, null, null, null, pageable);
    }

    @Test
    void findAll_withSearch_filtersExpenses() {
        UUID userId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        String search = "lunch";

        var expense = createExpense(UUID.randomUUID(), "Lunch", BigDecimal.valueOf(250), LocalDate.now());
        Page<Expense> page = new PageImpl<>(List.of(expense));

        when(expenseRepository.searchExpenses(eq(userId), eq(search), isNull(), isNull(), isNull(), isNull(), eq(pageable)))
            .thenReturn(page);

        Page<ExpenseDTO> result = expenseService.findAll(userId, search, null, null, null, null, pageable);

        assertThat(result).hasSize(1);
        assertThat(result.getContent().get(0).description()).isEqualTo("Lunch");

        verify(expenseRepository).searchExpenses(userId, search, null, null, null, null, pageable);
    }

    @Test
    void findAll_withCategoryFilter_filtersByCategory() {
        UUID userId = UUID.randomUUID();
        UUID categoryId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);

        var expense = createExpense(UUID.randomUUID(), "Groceries", BigDecimal.valueOf(1000), LocalDate.now());
        expense.getCategory().setId(categoryId);
        Page<Expense> page = new PageImpl<>(List.of(expense));

        when(expenseRepository.searchExpenses(eq(userId), isNull(), eq(categoryId), isNull(), isNull(), isNull(), eq(pageable)))
            .thenReturn(page);

        Page<ExpenseDTO> result = expenseService.findAll(userId, null, categoryId, null, null, null, pageable);

        assertThat(result).hasSize(1);

        verify(expenseRepository).searchExpenses(userId, null, categoryId, null, null, null, pageable);
    }

    @Test
    void findAll_withDateRange_filtersByDate() {
        UUID userId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        LocalDate startDate = LocalDate.of(2026, 6, 1);
        LocalDate endDate = LocalDate.of(2026, 6, 30);

        var expense = createExpense(UUID.randomUUID(), "Rent", BigDecimal.valueOf(15000), LocalDate.of(2026, 6, 5));
        Page<Expense> page = new PageImpl<>(List.of(expense));

        when(expenseRepository.searchExpenses(eq(userId), isNull(), isNull(), isNull(), eq(startDate), eq(endDate), eq(pageable)))
            .thenReturn(page);

        Page<ExpenseDTO> result = expenseService.findAll(userId, null, null, null, startDate, endDate, pageable);

        assertThat(result).hasSize(1);

        verify(expenseRepository).searchExpenses(userId, null, null, null, startDate, endDate, pageable);
    }

    @Test
    void findAll_withPaymentMethodFilter_filtersByPaymentMethod() {
        UUID userId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);
        String paymentMethod = "Credit Card";

        var expense = createExpense(UUID.randomUUID(), "Shopping", BigDecimal.valueOf(2000), LocalDate.now());
        expense.setPaymentMethod(paymentMethod);
        Page<Expense> page = new PageImpl<>(List.of(expense));

        when(expenseRepository.searchExpenses(eq(userId), isNull(), isNull(), eq(paymentMethod), isNull(), isNull(), eq(pageable)))
            .thenReturn(page);

        Page<ExpenseDTO> result = expenseService.findAll(userId, null, null, paymentMethod, null, null, pageable);

        assertThat(result).hasSize(1);

        verify(expenseRepository).searchExpenses(userId, null, null, paymentMethod, null, null, pageable);
    }

    @Test
    void findAll_whenNoResults_returnsEmptyPage() {
        UUID userId = UUID.randomUUID();
        Pageable pageable = PageRequest.of(0, 20);

        when(expenseRepository.searchExpenses(eq(userId), isNull(), isNull(), isNull(), isNull(), isNull(), eq(pageable)))
            .thenReturn(Page.empty());

        Page<ExpenseDTO> result = expenseService.findAll(userId, null, null, null, null, null, pageable);

        assertThat(result).isEmpty();

        verify(expenseRepository).searchExpenses(userId, null, null, null, null, null, pageable);
    }
}
