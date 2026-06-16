package com.expensetracker.mapper;

import com.expensetracker.dto.response.RecurringTemplateDTO;
import com.expensetracker.entity.RecurringTemplate;

public class RecurringMapper {

    public static RecurringTemplateDTO toDto(RecurringTemplate template) {
        return new RecurringTemplateDTO(
            template.getId(),
            template.getAmount(),
            template.getDescription(),
            template.getNotes(),
            template.getPaymentMethod(),
            template.getDayOfMonth(),
            template.getIsActive(),
            new RecurringTemplateDTO.CategorySummary(
                template.getCategory().getId(),
                template.getCategory().getName()
            ),
            template.getCreatedAt()
        );
    }
}
