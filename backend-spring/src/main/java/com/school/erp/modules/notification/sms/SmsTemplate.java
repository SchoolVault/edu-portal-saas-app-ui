package com.school.erp.modules.notification.sms;

import java.util.Map;

public final class SmsTemplate {
    private final String templateId;
    private final Map<String, String> variables;

    public SmsTemplate(String templateId, Map<String, String> variables) {
        this.templateId = templateId;
        this.variables = variables;
    }

    public String getTemplateId() {
        return templateId;
    }

    public Map<String, String> getVariables() {
        return variables;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static final class Builder {
        private String templateId;
        private Map<String, String> variables;

        public Builder templateId(String templateId) {
            this.templateId = templateId;
            return this;
        }

        public Builder variables(Map<String, String> variables) {
            this.variables = variables;
            return this;
        }

        public SmsTemplate build() {
            return new SmsTemplate(templateId, variables);
        }
    }
}
