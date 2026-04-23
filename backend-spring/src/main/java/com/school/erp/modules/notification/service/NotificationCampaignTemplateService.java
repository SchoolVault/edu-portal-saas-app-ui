package com.school.erp.modules.notification.service;

import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.communication.dto.CampaignDTOs;
import com.school.erp.modules.notification.entity.NotificationCampaignTemplate;
import com.school.erp.modules.notification.repository.NotificationCampaignTemplateRepository;
import com.school.erp.tenant.TenantContext;
import java.util.ArrayList;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationCampaignTemplateService {
    private final NotificationTemplateRegistry templateRegistry;
    private final NotificationCampaignTemplateRepository templateRepository;

    public NotificationCampaignTemplateService(
            NotificationTemplateRegistry templateRegistry,
            NotificationCampaignTemplateRepository templateRepository) {
        this.templateRegistry = templateRegistry;
        this.templateRepository = templateRepository;
        // Seed sensible defaults; can be overridden by runtime registration later.
        this.templateRegistry.registerTemplate("SMS", "ANNOUNCEMENT_PUBLISHED", "en", "{{title}}: {{message}}");
        this.templateRegistry.registerTemplate("SMS", "PTM_SCHEDULED", "en", "PTM update: {{message}}");
        this.templateRegistry.registerTemplate("SMS", "EXAM_PUBLISHED", "en", "Exam update: {{message}}");
        this.templateRegistry.registerTemplate("SMS", "EXAM_RESULT_PUBLISHED", "en", "Result update: {{message}}");
        this.templateRegistry.registerTemplate("SMS", "EVENT_REMINDER_1D", "en", "Reminder: {{message}}");
        this.templateRegistry.registerTemplate("SMS", "EVENT_REMINDER_1H", "en", "Starts soon: {{message}}");
        this.templateRegistry.registerTemplate("SMS", "EVENT_REMINDER_1D", "hi", "स्मरण: {{message}}");
        this.templateRegistry.registerTemplate("SMS", "EVENT_REMINDER_1H", "hi", "कार्यक्रम शीघ्र शुरू होगा: {{message}}");
    }

    public String render(String channel, String eventType, String locale, Map<String, String> variables, String fallback) {
        String template = resolveTemplateFromDb(channel, eventType, locale)
                .orElse(templateRegistry.resolveTemplate(channel, eventType, locale));
        String output = template != null ? template : fallback;
        if (output == null) {
            return "";
        }
        if (variables == null || variables.isEmpty()) {
            return output;
        }
        String rendered = output;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
            String key = entry.getKey() == null ? "" : entry.getKey().trim();
            if (key.isEmpty()) {
                continue;
            }
            String value = entry.getValue() == null ? "" : entry.getValue();
            rendered = rendered.replace("{{" + key + "}}", value);
        }
        return rendered;
    }

    public String normalizeEventType(String raw) {
        return raw == null ? "ANNOUNCEMENT_PUBLISHED" : raw.trim().toUpperCase(Locale.ROOT);
    }

    public boolean hasActiveSmsTemplateWithDlt(String eventType, String locale) {
        Optional<NotificationCampaignTemplate> t = resolveTemplateEntityFromDb("SMS", eventType, locale);
        return t.isPresent() && t.get().getDltTemplateId() != null && !t.get().getDltTemplateId().isBlank();
    }

    @Transactional(readOnly = true)
    public java.util.List<CampaignDTOs.CampaignTemplateResponse> listTemplates() {
        String tenantId = TenantContext.getTenantId();
        java.util.List<CampaignDTOs.CampaignTemplateResponse> out = new ArrayList<>();
        for (NotificationCampaignTemplate t : templateRepository.findByTenantIdAndIsDeletedFalseOrderByUpdatedAtDesc(tenantId)) {
            out.add(toResponse(t));
        }
        return out;
    }

    @Transactional
    public CampaignDTOs.CampaignTemplateResponse upsertTemplate(Long id, CampaignDTOs.CampaignTemplateUpsertRequest req) {
        String tenantId = TenantContext.getTenantId();
        NotificationCampaignTemplate row = (id == null)
                ? new NotificationCampaignTemplate()
                : templateRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                        .orElseThrow(() -> new BusinessException("Template not found."));
        row.setTenantId(tenantId);
        row.setEventType(normalizeEventType(req.getEventType()));
        row.setChannel(normalizeChannel(req.getChannel()));
        row.setLocaleCode(normalizeLocale(req.getLocale()));
        row.setTemplateBody(req.getTemplateBody().trim());
        row.setDltTemplateId(req.getDltTemplateId() != null ? req.getDltTemplateId().trim() : null);
        row.setStatus(req.getStatus() == null || req.getStatus().isBlank() ? "ACTIVE" : req.getStatus().trim().toUpperCase(Locale.ROOT));
        if ("SMS".equals(row.getChannel()) && "ACTIVE".equals(row.getStatus()) && (row.getDltTemplateId() == null || row.getDltTemplateId().isBlank())) {
            throw new BusinessException("Active SMS templates require DLT template id.");
        }
        NotificationCampaignTemplate saved = templateRepository.save(row);
        return toResponse(saved);
    }

    private CampaignDTOs.CampaignTemplateResponse toResponse(NotificationCampaignTemplate row) {
        CampaignDTOs.CampaignTemplateResponse out = new CampaignDTOs.CampaignTemplateResponse();
        out.setId(row.getId());
        out.setEventType(row.getEventType());
        out.setChannel(row.getChannel());
        out.setLocale(row.getLocaleCode());
        out.setTemplateBody(row.getTemplateBody());
        out.setDltTemplateId(row.getDltTemplateId());
        out.setStatus(row.getStatus());
        out.setUpdatedAt(row.getUpdatedAt() != null ? row.getUpdatedAt().toString() : null);
        return out;
    }

    private Optional<String> resolveTemplateFromDb(String channel, String eventType, String locale) {
        return resolveTemplateEntityFromDb(channel, eventType, locale).map(NotificationCampaignTemplate::getTemplateBody);
    }

    private Optional<NotificationCampaignTemplate> resolveTemplateEntityFromDb(String channel, String eventType, String locale) {
        return templateRepository.findByTenantIdAndEventTypeAndChannelAndLocaleCodeAndStatusAndIsDeletedFalse(
                TenantContext.getTenantId(),
                normalizeEventType(eventType),
                normalizeChannel(channel),
                normalizeLocale(locale),
                "ACTIVE");
    }

    private String normalizeChannel(String channel) {
        return channel == null ? "SMS" : channel.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeLocale(String locale) {
        return locale == null || locale.isBlank() ? "en" : locale.trim().toLowerCase(Locale.ROOT);
    }
}
