package com.school.erp.modules.guardian.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.time.LocalDate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(
        name = "student_guardian_mappings",
        indexes = {
                @Index(name = "idx_sgm_student", columnList = "tenant_id, student_id"),
                @Index(name = "idx_sgm_guardian", columnList = "tenant_id, guardian_id")
        })
public class StudentGuardianMapping extends BaseEntity {

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "guardian_id", nullable = false)
    private Long guardianId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "relation_type", nullable = false, length = 30)
    private Enums.GuardianRelationType relationType;

    @Column(name = "is_primary")
    private Boolean isPrimary = false;

    @Column(name = "is_emergency_contact")
    private Boolean isEmergencyContact = false;

    @Column(name = "custody_type", length = 30)
    private String custodyType;

    @Column(name = "effective_from")
    private LocalDate effectiveFrom;

    @Column(name = "effective_to")
    private LocalDate effectiveTo;

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getGuardianId() {
        return guardianId;
    }

    public void setGuardianId(Long guardianId) {
        this.guardianId = guardianId;
    }

    public Enums.GuardianRelationType getRelationType() {
        return relationType;
    }

    public void setRelationType(Enums.GuardianRelationType relationType) {
        this.relationType = relationType;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean primary) {
        isPrimary = primary;
    }

    public Boolean getIsEmergencyContact() {
        return isEmergencyContact;
    }

    public void setIsEmergencyContact(Boolean emergencyContact) {
        isEmergencyContact = emergencyContact;
    }

    public String getCustodyType() {
        return custodyType;
    }

    public void setCustodyType(String custodyType) {
        this.custodyType = custodyType;
    }

    public LocalDate getEffectiveFrom() {
        return effectiveFrom;
    }

    public void setEffectiveFrom(LocalDate effectiveFrom) {
        this.effectiveFrom = effectiveFrom;
    }

    public LocalDate getEffectiveTo() {
        return effectiveTo;
    }

    public void setEffectiveTo(LocalDate effectiveTo) {
        this.effectiveTo = effectiveTo;
    }
}
