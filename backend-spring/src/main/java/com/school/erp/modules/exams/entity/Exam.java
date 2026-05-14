package com.school.erp.modules.exams.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.Filter;
import org.hibernate.type.SqlTypes;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;
import java.util.ArrayList;
import java.util.List;

@Entity
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
@Table(name = "exams", indexes = {@Index(name = "idx_exam_tenant", columnList = "tenant_id")})
public class Exam extends BaseEntity implements AcademicYearScopedEntity {
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Column(name = "start_date")
    private LocalDate startDate;
    @Column(name = "end_date")
    private LocalDate endDate;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "exam_classes", joinColumns = @JoinColumn(name = "exam_id"))
    @Column(name = "class_id")
    private List<Long> classIds = new ArrayList<>();
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 20)
    private Enums.ExamStatus status;
    @Column(name = "results_published")
    private Boolean resultsPublished = false;
    @Column(name = "grading_config_json", columnDefinition = "json")
    private String gradingConfigJson;
    @Column(name = "board_code", length = 30)
    private String boardCode;
    @Column(name = "session_type", length = 30)
    private String sessionType;
    @Column(name = "term_code", length = 30)
    private String termCode;
    @Column(name = "assessment_kind", length = 30)
    private String assessmentKind;
    @Column(name = "workflow_state", length = 40)
    private String workflowState;
    @Column(name = "workflow_note", length = 500)
    private String workflowNote;
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
    @Column(name = "frozen_at")
    private LocalDateTime frozenAt;


    public static class ExamBuilder {
        private String name;
        private Long academicYearId;
        private LocalDate startDate;
        private LocalDate endDate;
        private List<Long> classIds;
        private Enums.ExamStatus status;

        ExamBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder academicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder startDate(final LocalDate startDate) {
            this.startDate = startDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder endDate(final LocalDate endDate) {
            this.endDate = endDate;
            return this;
        }

        public Exam.ExamBuilder classIds(final List<Long> classIds) {
            this.classIds = classIds;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Exam.ExamBuilder status(final Enums.ExamStatus status) {
            this.status = status;
            return this;
        }

        public Exam build() {
            return new Exam(this.name, this.academicYearId, this.startDate, this.endDate, this.classIds, this.status);
        }

        @Override
        public String toString() {
            return "Exam.ExamBuilder(name=" + this.name + ", academicYearId=" + this.academicYearId + ", startDate=" + this.startDate + ", endDate=" + this.endDate + ", status=" + this.status + ")";
        }
    }

    public static Exam.ExamBuilder builder() {
        return new Exam.ExamBuilder();
    }

    public String getName() {
        return this.name;
    }

    public Long getAcademicYearId() {
        return this.academicYearId;
    }

    public LocalDate getStartDate() {
        return this.startDate;
    }

    public LocalDate getEndDate() {
        return this.endDate;
    }

    public List<Long> getClassIds() {
        return this.classIds;
    }

    public Enums.ExamStatus getStatus() {
        return this.status;
    }

    public Boolean getResultsPublished() {
        return resultsPublished;
    }

    public void setResultsPublished(Boolean resultsPublished) {
        this.resultsPublished = resultsPublished;
    }

    public String getGradingConfigJson() {
        return gradingConfigJson;
    }

    public void setGradingConfigJson(String gradingConfigJson) {
        this.gradingConfigJson = gradingConfigJson;
    }

    public String getBoardCode() {
        return boardCode;
    }

    public void setBoardCode(String boardCode) {
        this.boardCode = boardCode;
    }

    public String getSessionType() {
        return sessionType;
    }

    public void setSessionType(String sessionType) {
        this.sessionType = sessionType;
    }

    public String getTermCode() {
        return termCode;
    }

    public void setTermCode(String termCode) {
        this.termCode = termCode;
    }

    public String getAssessmentKind() {
        return assessmentKind;
    }

    public void setAssessmentKind(String assessmentKind) {
        this.assessmentKind = assessmentKind;
    }

    public String getWorkflowState() {
        return workflowState;
    }

    public void setWorkflowState(String workflowState) {
        this.workflowState = workflowState;
    }

    public String getWorkflowNote() {
        return workflowNote;
    }

    public void setWorkflowNote(String workflowNote) {
        this.workflowNote = workflowNote;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
    }

    public LocalDateTime getFrozenAt() {
        return frozenAt;
    }

    public void setFrozenAt(LocalDateTime frozenAt) {
        this.frozenAt = frozenAt;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setAcademicYearId(final Long academicYearId) {
        this.academicYearId = academicYearId;
    }

    public void setStartDate(final LocalDate startDate) {
        this.startDate = startDate;
    }

    public void setEndDate(final LocalDate endDate) {
        this.endDate = endDate;
    }

    public void setClassIds(final List<Long> classIds) {
        this.classIds = classIds;
    }

    public void setStatus(final Enums.ExamStatus status) {
        this.status = status;
    }

    public Exam() {
    }

    public Exam(final String name, final Long academicYearId, final LocalDate startDate, final LocalDate endDate, final List<Long> classIds, final Enums.ExamStatus status) {
        this.name = name;
        this.academicYearId = academicYearId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.classIds = classIds != null ? classIds : new ArrayList<>();
        this.status = status;
    }
}
