package com.school.erp.modules.guardian.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(
        name = "guardians",
        indexes = {
                @Index(name = "idx_guardian_tenant", columnList = "tenant_id"),
                @Index(name = "idx_guardian_primary_phone", columnList = "tenant_id, primary_phone"),
                @Index(name = "idx_guardian_user", columnList = "tenant_id, user_id")
        })
public class Guardian extends BaseEntity {

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(length = 200)
    private String occupation;

    /** Normalized phone for search and indexing; additional phones in phones_json. */
    @Column(name = "primary_phone", length = 30)
    private String primaryPhone;

    @Column(name = "phones_json", columnDefinition = "json")
    private String phonesJson;

    @Column(name = "emails_json", columnDefinition = "json")
    private String emailsJson;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "attributes_json", columnDefinition = "json")
    private String attributesJson;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getOccupation() {
        return occupation;
    }

    public void setOccupation(String occupation) {
        this.occupation = occupation;
    }

    public String getPrimaryPhone() {
        return primaryPhone;
    }

    public void setPrimaryPhone(String primaryPhone) {
        this.primaryPhone = primaryPhone;
    }

    public String getPhonesJson() {
        return phonesJson;
    }

    public void setPhonesJson(String phonesJson) {
        this.phonesJson = phonesJson;
    }

    public String getEmailsJson() {
        return emailsJson;
    }

    public void setEmailsJson(String emailsJson) {
        this.emailsJson = emailsJson;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getAttributesJson() {
        return attributesJson;
    }

    public void setAttributesJson(String attributesJson) {
        this.attributesJson = attributesJson;
    }
}
