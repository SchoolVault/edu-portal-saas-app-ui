package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "hostels", indexes = @Index(name = "idx_hostel_tenant", columnList = "tenant_id"))
public class Hostel extends BaseEntity {
    @Column(nullable = false, length = 160)
    private String name;
    @Column(length = 40)
    private String code;
    /** MALE, FEMALE, MIXED — informational for UI filtering */
    @Column(name = "gender_scope", length = 20)
    private String genderScope;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getGenderScope() {
        return genderScope;
    }

    public void setGenderScope(String genderScope) {
        this.genderScope = genderScope;
    }
}
