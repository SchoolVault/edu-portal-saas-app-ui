package com.school.erp.modules.reports.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "report_notification_templates", indexes = {
        @Index(name = "idx_report_notification_template", columnList = "tenant_id, template_code, target_role, locale_code, is_deleted")
})
public class ReportNotificationTemplate extends BaseEntity {
    @Column(name = "template_code", nullable = false, length = 80)
    private String templateCode;
    @Column(nullable = false, length = 20)
    private String channel;
    @Column(name = "target_role", nullable = false, length = 40)
    private String targetRole;
    @Column(name = "locale_code", nullable = false, length = 10)
    private String localeCode;
    @Column(name = "title_template", nullable = false, length = 200)
    private String titleTemplate;
    @Column(name = "message_template", nullable = false, length = 800)
    private String messageTemplate;

    public String getTemplateCode() { return templateCode; }
    public void setTemplateCode(String templateCode) { this.templateCode = templateCode; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public String getLocaleCode() { return localeCode; }
    public void setLocaleCode(String localeCode) { this.localeCode = localeCode; }
    public String getTitleTemplate() { return titleTemplate; }
    public void setTitleTemplate(String titleTemplate) { this.titleTemplate = titleTemplate; }
    public String getMessageTemplate() { return messageTemplate; }
    public void setMessageTemplate(String messageTemplate) { this.messageTemplate = messageTemplate; }
}
