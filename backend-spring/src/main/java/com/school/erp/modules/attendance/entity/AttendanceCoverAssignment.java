package com.school.erp.modules.attendance.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "attendance_cover_assignments",
        indexes = {
                @Index(name = "idx_aca_tenant_date_covering", columnList = "tenant_id, cover_date, covering_teacher_id"),
                @Index(name = "idx_aca_tenant_class_date", columnList = "tenant_id, class_id, cover_date")
        })
public class AttendanceCoverAssignment extends BaseEntity {

    @Column(name = "cover_date", nullable = false)
    private LocalDate coverDate;

    @Column(name = "period_number")
    private Integer periodNumber;

    @Column(name = "class_id", nullable = false)
    private Long classId;

    @Column(name = "section_id")
    private Long sectionId;

    @Column(name = "regular_teacher_id")
    private Long regularTeacherId;

    @Column(name = "covering_teacher_id", nullable = false)
    private Long coveringTeacherId;

    @Column(length = 500)
    private String reason;

    @Column(nullable = false, length = 20)
    private String status = "ACTIVE";

    @Column(name = "timetable_entry_id")
    private Long timetableEntryId;

    public LocalDate getCoverDate() {
        return coverDate;
    }

    public void setCoverDate(LocalDate coverDate) {
        this.coverDate = coverDate;
    }

    public Integer getPeriodNumber() {
        return periodNumber;
    }

    public void setPeriodNumber(Integer periodNumber) {
        this.periodNumber = periodNumber;
    }

    public Long getClassId() {
        return classId;
    }

    public void setClassId(Long classId) {
        this.classId = classId;
    }

    public Long getSectionId() {
        return sectionId;
    }

    public void setSectionId(Long sectionId) {
        this.sectionId = sectionId;
    }

    public Long getRegularTeacherId() {
        return regularTeacherId;
    }

    public void setRegularTeacherId(Long regularTeacherId) {
        this.regularTeacherId = regularTeacherId;
    }

    public Long getCoveringTeacherId() {
        return coveringTeacherId;
    }

    public void setCoveringTeacherId(Long coveringTeacherId) {
        this.coveringTeacherId = coveringTeacherId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getTimetableEntryId() {
        return timetableEntryId;
    }

    public void setTimetableEntryId(Long timetableEntryId) {
        this.timetableEntryId = timetableEntryId;
    }
}
