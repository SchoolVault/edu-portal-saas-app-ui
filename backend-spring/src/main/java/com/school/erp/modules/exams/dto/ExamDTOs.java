package com.school.erp.modules.exams.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.AssertTrue;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class ExamDTOs {

    public static class CreateExamRequest {
        @NotBlank
        private String name;
        private String examType;
        private String boardCode;
        private String sessionType;
        private String termCode;
        private String assessmentKind;
        private String markingScheme;
        private Map<String, Object> gradingConfig;
        private Long academicYearId;
        private LocalDate startDate;
        private LocalDate endDate;
        private List<Long> classIds;
        /** When set, defines class/section audience; null/empty falls back to {@code classIds} as whole-class scope. */
        private List<ExamScopeDtos.ClassScopeIn> classScopes;


        public static class CreateExamRequestBuilder {
            private String name;
            private Long academicYearId;
            private LocalDate startDate;
            private LocalDate endDate;
            private List<Long> classIds;

            CreateExamRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.CreateExamRequest.CreateExamRequestBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.CreateExamRequest.CreateExamRequestBuilder academicYearId(final Long academicYearId) {
                this.academicYearId = academicYearId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.CreateExamRequest.CreateExamRequestBuilder startDate(final LocalDate startDate) {
                this.startDate = startDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.CreateExamRequest.CreateExamRequestBuilder endDate(final LocalDate endDate) {
                this.endDate = endDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.CreateExamRequest.CreateExamRequestBuilder classIds(final List<Long> classIds) {
                this.classIds = classIds;
                return this;
            }

            public ExamDTOs.CreateExamRequest build() {
                return new ExamDTOs.CreateExamRequest(this.name, this.academicYearId, this.startDate, this.endDate, this.classIds);
            }

            @Override
            public String toString() {
                return "ExamDTOs.CreateExamRequest.CreateExamRequestBuilder(name=" + this.name + ", academicYearId=" + this.academicYearId + ", startDate=" + this.startDate + ", endDate=" + this.endDate + ", classIds=" + this.classIds + ")";
            }
        }

        public static ExamDTOs.CreateExamRequest.CreateExamRequestBuilder builder() {
            return new ExamDTOs.CreateExamRequest.CreateExamRequestBuilder();
        }

        public String getName() {
            return this.name;
        }

        public String getExamType() {
            return examType;
        }

        public void setExamType(String examType) {
            this.examType = examType;
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

        public String getMarkingScheme() {
            return markingScheme;
        }

        public void setMarkingScheme(String markingScheme) {
            this.markingScheme = markingScheme;
        }

        public Map<String, Object> getGradingConfig() {
            return gradingConfig;
        }

        public void setGradingConfig(Map<String, Object> gradingConfig) {
            this.gradingConfig = gradingConfig;
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

        @AssertTrue(message = "End date must be the same as or after start date")
        public boolean isDateRangeValid() {
            if (startDate == null || endDate == null) {
                return true;
            }
            return !endDate.isBefore(startDate);
        }

        public List<Long> getClassIds() {
            return this.classIds;
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

        public List<ExamScopeDtos.ClassScopeIn> getClassScopes() {
            return classScopes;
        }

        public void setClassScopes(List<ExamScopeDtos.ClassScopeIn> classScopes) {
            this.classScopes = classScopes;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof ExamDTOs.CreateExamRequest)) return false;
            final ExamDTOs.CreateExamRequest other = (ExamDTOs.CreateExamRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$academicYearId = this.getAcademicYearId();
            final Object other$academicYearId = other.getAcademicYearId();
            if (this$academicYearId == null ? other$academicYearId != null : !this$academicYearId.equals(other$academicYearId)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$startDate = this.getStartDate();
            final Object other$startDate = other.getStartDate();
            if (this$startDate == null ? other$startDate != null : !this$startDate.equals(other$startDate)) return false;
            final Object this$endDate = this.getEndDate();
            final Object other$endDate = other.getEndDate();
            if (this$endDate == null ? other$endDate != null : !this$endDate.equals(other$endDate)) return false;
            final Object this$classIds = this.getClassIds();
            final Object other$classIds = other.getClassIds();
            if (this$classIds == null ? other$classIds != null : !this$classIds.equals(other$classIds)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof ExamDTOs.CreateExamRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $academicYearId = this.getAcademicYearId();
            result = result * PRIME + ($academicYearId == null ? 43 : $academicYearId.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $startDate = this.getStartDate();
            result = result * PRIME + ($startDate == null ? 43 : $startDate.hashCode());
            final Object $endDate = this.getEndDate();
            result = result * PRIME + ($endDate == null ? 43 : $endDate.hashCode());
            final Object $classIds = this.getClassIds();
            result = result * PRIME + ($classIds == null ? 43 : $classIds.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "ExamDTOs.CreateExamRequest(name=" + this.getName() + ", academicYearId=" + this.getAcademicYearId() + ", startDate=" + this.getStartDate() + ", endDate=" + this.getEndDate() + ", classIds=" + this.getClassIds() + ")";
        }

        public CreateExamRequest() {
        }

        public CreateExamRequest(final String name, final Long academicYearId, final LocalDate startDate, final LocalDate endDate, final List<Long> classIds) {
            this.name = name;
            this.academicYearId = academicYearId;
            this.startDate = startDate;
            this.endDate = endDate;
            this.classIds = classIds;
        }
    }


    public static class ExamResponse {
        private Long id;
        private String name;
        private String examType;
        private String boardCode;
        private String sessionType;
        private String termCode;
        private String assessmentKind;
        private String markingScheme;
        private Map<String, Object> gradingConfig;
        private Long academicYearId;
        private String startDate;
        private String endDate;
        private List<Long> classIds;
        private String status;
        private Boolean resultsPublished;
        private List<ExamScopeDtos.ClassScopeOut> classScopes;
        private List<ExamScopeDtos.ScheduleSlotOut> scheduleSlots;
        private String workflowState;
        private String workflowNote;


        public static class ExamResponseBuilder {
            private Long id;
            private String name;
            private Long academicYearId;
            private String startDate;
            private String endDate;
            private List<Long> classIds;
            private String status;

            ExamResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ExamResponse.ExamResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ExamResponse.ExamResponseBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ExamResponse.ExamResponseBuilder academicYearId(final Long academicYearId) {
                this.academicYearId = academicYearId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ExamResponse.ExamResponseBuilder startDate(final String startDate) {
                this.startDate = startDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ExamResponse.ExamResponseBuilder endDate(final String endDate) {
                this.endDate = endDate;
                return this;
            }

            public ExamDTOs.ExamResponse.ExamResponseBuilder classIds(final List<Long> classIds) {
                this.classIds = classIds;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ExamResponse.ExamResponseBuilder status(final String status) {
                this.status = status;
                return this;
            }

            public ExamDTOs.ExamResponse build() {
                return new ExamDTOs.ExamResponse(this.id, this.name, this.academicYearId, this.startDate, this.endDate, this.classIds, this.status);
            }

            @Override
            public String toString() {
                return "ExamDTOs.ExamResponse.ExamResponseBuilder(id=" + this.id + ", name=" + this.name + ", academicYearId=" + this.academicYearId + ", startDate=" + this.startDate + ", endDate=" + this.endDate + ", status=" + this.status + ")";
            }
        }

        public static ExamDTOs.ExamResponse.ExamResponseBuilder builder() {
            return new ExamDTOs.ExamResponse.ExamResponseBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public String getName() {
            return this.name;
        }

        public String getExamType() {
            return examType;
        }

        public void setExamType(String examType) {
            this.examType = examType;
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

        public String getMarkingScheme() {
            return markingScheme;
        }

        public void setMarkingScheme(String markingScheme) {
            this.markingScheme = markingScheme;
        }

        public Map<String, Object> getGradingConfig() {
            return gradingConfig;
        }

        public void setGradingConfig(Map<String, Object> gradingConfig) {
            this.gradingConfig = gradingConfig;
        }

        public Long getAcademicYearId() {
            return this.academicYearId;
        }

        public String getStartDate() {
            return this.startDate;
        }

        public String getEndDate() {
            return this.endDate;
        }

        public List<Long> getClassIds() {
            return this.classIds;
        }

        public String getStatus() {
            return this.status;
        }

        public Boolean getResultsPublished() {
            return resultsPublished;
        }

        public void setResultsPublished(Boolean resultsPublished) {
            this.resultsPublished = resultsPublished;
        }

        public List<ExamScopeDtos.ClassScopeOut> getClassScopes() {
            return classScopes;
        }

        public void setClassScopes(List<ExamScopeDtos.ClassScopeOut> classScopes) {
            this.classScopes = classScopes;
        }

        public List<ExamScopeDtos.ScheduleSlotOut> getScheduleSlots() {
            return scheduleSlots;
        }

        public void setScheduleSlots(List<ExamScopeDtos.ScheduleSlotOut> scheduleSlots) {
            this.scheduleSlots = scheduleSlots;
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

        public void setId(final Long id) {
            this.id = id;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setAcademicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public void setStartDate(final String startDate) {
            this.startDate = startDate;
        }

        public void setEndDate(final String endDate) {
            this.endDate = endDate;
        }

        public void setClassIds(final List<Long> classIds) {
            this.classIds = classIds;
        }

        public void setStatus(final String status) {
            this.status = status;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof ExamDTOs.ExamResponse)) return false;
            final ExamDTOs.ExamResponse other = (ExamDTOs.ExamResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$academicYearId = this.getAcademicYearId();
            final Object other$academicYearId = other.getAcademicYearId();
            if (this$academicYearId == null ? other$academicYearId != null : !this$academicYearId.equals(other$academicYearId)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$startDate = this.getStartDate();
            final Object other$startDate = other.getStartDate();
            if (this$startDate == null ? other$startDate != null : !this$startDate.equals(other$startDate)) return false;
            final Object this$endDate = this.getEndDate();
            final Object other$endDate = other.getEndDate();
            if (this$endDate == null ? other$endDate != null : !this$endDate.equals(other$endDate)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof ExamDTOs.ExamResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $academicYearId = this.getAcademicYearId();
            result = result * PRIME + ($academicYearId == null ? 43 : $academicYearId.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $startDate = this.getStartDate();
            result = result * PRIME + ($startDate == null ? 43 : $startDate.hashCode());
            final Object $endDate = this.getEndDate();
            result = result * PRIME + ($endDate == null ? 43 : $endDate.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "ExamDTOs.ExamResponse(id=" + this.getId() + ", name=" + this.getName() + ", academicYearId=" + this.getAcademicYearId() + ", startDate=" + this.getStartDate() + ", endDate=" + this.getEndDate() + ", status=" + this.getStatus() + ")";
        }

        public ExamResponse() {
        }

        public ExamResponse(final Long id, final String name, final Long academicYearId, final String startDate, final String endDate, final List<Long> classIds, final String status) {
            this.id = id;
            this.name = name;
            this.academicYearId = academicYearId;
            this.startDate = startDate;
            this.endDate = endDate;
            this.classIds = classIds;
            this.status = status;
        }
    }

    public static class WorkflowActionRequest {
        private String note;
        private Boolean publishNow;

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }

        public Boolean getPublishNow() {
            return publishNow;
        }

        public void setPublishNow(Boolean publishNow) {
            this.publishNow = publishNow;
        }
    }


    public static class BulkMarksRequest {
        @NotNull
        private Long examId;
        private String requestId;
        @NotNull
        private List<MarkEntry> marks;


        public static class BulkMarksRequestBuilder {
            private Long examId;
            private List<MarkEntry> marks;

            BulkMarksRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.BulkMarksRequest.BulkMarksRequestBuilder examId(final Long examId) {
                this.examId = examId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.BulkMarksRequest.BulkMarksRequestBuilder marks(final List<MarkEntry> marks) {
                this.marks = marks;
                return this;
            }

            public ExamDTOs.BulkMarksRequest build() {
                return new ExamDTOs.BulkMarksRequest(this.examId, this.marks);
            }

            @Override
            public String toString() {
                return "ExamDTOs.BulkMarksRequest.BulkMarksRequestBuilder(examId=" + this.examId + ", marks=" + this.marks + ")";
            }
        }

        public static ExamDTOs.BulkMarksRequest.BulkMarksRequestBuilder builder() {
            return new ExamDTOs.BulkMarksRequest.BulkMarksRequestBuilder();
        }

        public Long getExamId() {
            return this.examId;
        }

        public String getRequestId() {
            return requestId;
        }

        public void setRequestId(String requestId) {
            this.requestId = requestId;
        }

        public List<MarkEntry> getMarks() {
            return this.marks;
        }

        public void setExamId(final Long examId) {
            this.examId = examId;
        }

        public void setMarks(final List<MarkEntry> marks) {
            this.marks = marks;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof ExamDTOs.BulkMarksRequest)) return false;
            final ExamDTOs.BulkMarksRequest other = (ExamDTOs.BulkMarksRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$examId = this.getExamId();
            final Object other$examId = other.getExamId();
            if (this$examId == null ? other$examId != null : !this$examId.equals(other$examId)) return false;
            final Object this$marks = this.getMarks();
            final Object other$marks = other.getMarks();
            if (this$marks == null ? other$marks != null : !this$marks.equals(other$marks)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof ExamDTOs.BulkMarksRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $examId = this.getExamId();
            result = result * PRIME + ($examId == null ? 43 : $examId.hashCode());
            final Object $marks = this.getMarks();
            result = result * PRIME + ($marks == null ? 43 : $marks.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "ExamDTOs.BulkMarksRequest(examId=" + this.getExamId() + ", marks=" + this.getMarks() + ")";
        }

        public BulkMarksRequest() {
        }

        public BulkMarksRequest(final Long examId, final List<MarkEntry> marks) {
            this.examId = examId;
            this.marks = marks;
        }
    }


    public static class MarkEntry {
        @NotNull
        private Long studentId;
        private String studentName;
        @NotBlank
        private String subjectName;
        @NotNull
        private Double marksObtained;
        @NotNull
        private Double maxMarks;
        private Long classId;


        public static class MarkEntryBuilder {
            private Long studentId;
            private String studentName;
            private String subjectName;
            private Double marksObtained;
            private Double maxMarks;
            private Long classId;

            MarkEntryBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkEntry.MarkEntryBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkEntry.MarkEntryBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkEntry.MarkEntryBuilder subjectName(final String subjectName) {
                this.subjectName = subjectName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkEntry.MarkEntryBuilder marksObtained(final Double marksObtained) {
                this.marksObtained = marksObtained;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkEntry.MarkEntryBuilder maxMarks(final Double maxMarks) {
                this.maxMarks = maxMarks;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkEntry.MarkEntryBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            public ExamDTOs.MarkEntry build() {
                return new ExamDTOs.MarkEntry(this.studentId, this.studentName, this.subjectName, this.marksObtained, this.maxMarks, this.classId);
            }

            @Override
            public String toString() {
                return "ExamDTOs.MarkEntry.MarkEntryBuilder(studentId=" + this.studentId + ", studentName=" + this.studentName + ", subjectName=" + this.subjectName + ", marksObtained=" + this.marksObtained + ", maxMarks=" + this.maxMarks + ", classId=" + this.classId + ")";
            }
        }

        public static ExamDTOs.MarkEntry.MarkEntryBuilder builder() {
            return new ExamDTOs.MarkEntry.MarkEntryBuilder();
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public String getSubjectName() {
            return this.subjectName;
        }

        public Double getMarksObtained() {
            return this.marksObtained;
        }

        public Double getMaxMarks() {
            return this.maxMarks;
        }

        public Long getClassId() {
            return this.classId;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setSubjectName(final String subjectName) {
            this.subjectName = subjectName;
        }

        public void setMarksObtained(final Double marksObtained) {
            this.marksObtained = marksObtained;
        }

        public void setMaxMarks(final Double maxMarks) {
            this.maxMarks = maxMarks;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof ExamDTOs.MarkEntry)) return false;
            final ExamDTOs.MarkEntry other = (ExamDTOs.MarkEntry) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$marksObtained = this.getMarksObtained();
            final Object other$marksObtained = other.getMarksObtained();
            if (this$marksObtained == null ? other$marksObtained != null : !this$marksObtained.equals(other$marksObtained)) return false;
            final Object this$maxMarks = this.getMaxMarks();
            final Object other$maxMarks = other.getMaxMarks();
            if (this$maxMarks == null ? other$maxMarks != null : !this$maxMarks.equals(other$maxMarks)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$subjectName = this.getSubjectName();
            final Object other$subjectName = other.getSubjectName();
            if (this$subjectName == null ? other$subjectName != null : !this$subjectName.equals(other$subjectName)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof ExamDTOs.MarkEntry;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $marksObtained = this.getMarksObtained();
            result = result * PRIME + ($marksObtained == null ? 43 : $marksObtained.hashCode());
            final Object $maxMarks = this.getMaxMarks();
            result = result * PRIME + ($maxMarks == null ? 43 : $maxMarks.hashCode());
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $subjectName = this.getSubjectName();
            result = result * PRIME + ($subjectName == null ? 43 : $subjectName.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "ExamDTOs.MarkEntry(studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", subjectName=" + this.getSubjectName() + ", marksObtained=" + this.getMarksObtained() + ", maxMarks=" + this.getMaxMarks() + ", classId=" + this.getClassId() + ")";
        }

        public MarkEntry() {
        }

        public MarkEntry(final Long studentId, final String studentName, final String subjectName, final Double marksObtained, final Double maxMarks, final Long classId) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.subjectName = subjectName;
            this.marksObtained = marksObtained;
            this.maxMarks = maxMarks;
            this.classId = classId;
        }
    }


    public static class MarkResponse {
        private Long id;
        private Long examId;
        private Long studentId;
        private String studentName;
        private String subjectName;
        private Double marksObtained;
        private Double maxMarks;
        private String grade;
        private Long classId;
        private double percentage;


        public static class MarkResponseBuilder {
            private Long id;
            private Long examId;
            private Long studentId;
            private String studentName;
            private String subjectName;
            private Double marksObtained;
            private Double maxMarks;
            private String grade;
            private Long classId;
            private double percentage;

            MarkResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder examId(final Long examId) {
                this.examId = examId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder subjectName(final String subjectName) {
                this.subjectName = subjectName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder marksObtained(final Double marksObtained) {
                this.marksObtained = marksObtained;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder maxMarks(final Double maxMarks) {
                this.maxMarks = maxMarks;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder grade(final String grade) {
                this.grade = grade;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.MarkResponse.MarkResponseBuilder percentage(final double percentage) {
                this.percentage = percentage;
                return this;
            }

            public ExamDTOs.MarkResponse build() {
                return new ExamDTOs.MarkResponse(this.id, this.examId, this.studentId, this.studentName, this.subjectName, this.marksObtained, this.maxMarks, this.grade, this.classId, this.percentage);
            }

            @Override
            public String toString() {
                return "ExamDTOs.MarkResponse.MarkResponseBuilder(id=" + this.id + ", examId=" + this.examId + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", subjectName=" + this.subjectName + ", marksObtained=" + this.marksObtained + ", maxMarks=" + this.maxMarks + ", grade=" + this.grade + ", classId=" + this.classId + ", percentage=" + this.percentage + ")";
            }
        }

        public static ExamDTOs.MarkResponse.MarkResponseBuilder builder() {
            return new ExamDTOs.MarkResponse.MarkResponseBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public Long getExamId() {
            return this.examId;
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public String getSubjectName() {
            return this.subjectName;
        }

        public Double getMarksObtained() {
            return this.marksObtained;
        }

        public Double getMaxMarks() {
            return this.maxMarks;
        }

        public String getGrade() {
            return this.grade;
        }

        public Long getClassId() {
            return this.classId;
        }

        public double getPercentage() {
            return this.percentage;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setExamId(final Long examId) {
            this.examId = examId;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setSubjectName(final String subjectName) {
            this.subjectName = subjectName;
        }

        public void setMarksObtained(final Double marksObtained) {
            this.marksObtained = marksObtained;
        }

        public void setMaxMarks(final Double maxMarks) {
            this.maxMarks = maxMarks;
        }

        public void setGrade(final String grade) {
            this.grade = grade;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setPercentage(final double percentage) {
            this.percentage = percentage;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof ExamDTOs.MarkResponse)) return false;
            final ExamDTOs.MarkResponse other = (ExamDTOs.MarkResponse) o;
            if (!other.canEqual((Object) this)) return false;
            if (Double.compare(this.getPercentage(), other.getPercentage()) != 0) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$examId = this.getExamId();
            final Object other$examId = other.getExamId();
            if (this$examId == null ? other$examId != null : !this$examId.equals(other$examId)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$marksObtained = this.getMarksObtained();
            final Object other$marksObtained = other.getMarksObtained();
            if (this$marksObtained == null ? other$marksObtained != null : !this$marksObtained.equals(other$marksObtained)) return false;
            final Object this$maxMarks = this.getMaxMarks();
            final Object other$maxMarks = other.getMaxMarks();
            if (this$maxMarks == null ? other$maxMarks != null : !this$maxMarks.equals(other$maxMarks)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$subjectName = this.getSubjectName();
            final Object other$subjectName = other.getSubjectName();
            if (this$subjectName == null ? other$subjectName != null : !this$subjectName.equals(other$subjectName)) return false;
            final Object this$grade = this.getGrade();
            final Object other$grade = other.getGrade();
            if (this$grade == null ? other$grade != null : !this$grade.equals(other$grade)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof ExamDTOs.MarkResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final long $percentage = Double.doubleToLongBits(this.getPercentage());
            result = result * PRIME + (int) ($percentage >>> 32 ^ $percentage);
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $examId = this.getExamId();
            result = result * PRIME + ($examId == null ? 43 : $examId.hashCode());
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $marksObtained = this.getMarksObtained();
            result = result * PRIME + ($marksObtained == null ? 43 : $marksObtained.hashCode());
            final Object $maxMarks = this.getMaxMarks();
            result = result * PRIME + ($maxMarks == null ? 43 : $maxMarks.hashCode());
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $subjectName = this.getSubjectName();
            result = result * PRIME + ($subjectName == null ? 43 : $subjectName.hashCode());
            final Object $grade = this.getGrade();
            result = result * PRIME + ($grade == null ? 43 : $grade.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "ExamDTOs.MarkResponse(id=" + this.getId() + ", examId=" + this.getExamId() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", subjectName=" + this.getSubjectName() + ", marksObtained=" + this.getMarksObtained() + ", maxMarks=" + this.getMaxMarks() + ", grade=" + this.getGrade() + ", classId=" + this.getClassId() + ", percentage=" + this.getPercentage() + ")";
        }

        public MarkResponse() {
        }

        public MarkResponse(final Long id, final Long examId, final Long studentId, final String studentName, final String subjectName, final Double marksObtained, final Double maxMarks, final String grade, final Long classId, final double percentage) {
            this.id = id;
            this.examId = examId;
            this.studentId = studentId;
            this.studentName = studentName;
            this.subjectName = subjectName;
            this.marksObtained = marksObtained;
            this.maxMarks = maxMarks;
            this.grade = grade;
            this.classId = classId;
            this.percentage = percentage;
        }
    }


    public static class ReportCardResponse {
        private Long studentId;
        private String studentName;
        private String localeCode;
        private String boardCode;
        private String termCode;
        private List<MarkResponse> subjects;
        private List<ReportCardSection> sections;
        private double totalMarks;
        private double totalMaxMarks;
        private double overallPercentage;
        private String overallGrade;


        public static class ReportCardResponseBuilder {
            private Long studentId;
            private String studentName;
            private List<MarkResponse> subjects;
            private double totalMarks;
            private double totalMaxMarks;
            private double overallPercentage;
            private String overallGrade;

            ReportCardResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ReportCardResponse.ReportCardResponseBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ReportCardResponse.ReportCardResponseBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ReportCardResponse.ReportCardResponseBuilder subjects(final List<MarkResponse> subjects) {
                this.subjects = subjects;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ReportCardResponse.ReportCardResponseBuilder totalMarks(final double totalMarks) {
                this.totalMarks = totalMarks;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ReportCardResponse.ReportCardResponseBuilder totalMaxMarks(final double totalMaxMarks) {
                this.totalMaxMarks = totalMaxMarks;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ReportCardResponse.ReportCardResponseBuilder overallPercentage(final double overallPercentage) {
                this.overallPercentage = overallPercentage;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public ExamDTOs.ReportCardResponse.ReportCardResponseBuilder overallGrade(final String overallGrade) {
                this.overallGrade = overallGrade;
                return this;
            }

            public ExamDTOs.ReportCardResponse build() {
                return new ExamDTOs.ReportCardResponse(this.studentId, this.studentName, this.subjects, this.totalMarks, this.totalMaxMarks, this.overallPercentage, this.overallGrade);
            }

            @Override
            public String toString() {
                return "ExamDTOs.ReportCardResponse.ReportCardResponseBuilder(studentId=" + this.studentId + ", studentName=" + this.studentName + ", subjects=" + this.subjects + ", totalMarks=" + this.totalMarks + ", totalMaxMarks=" + this.totalMaxMarks + ", overallPercentage=" + this.overallPercentage + ", overallGrade=" + this.overallGrade + ")";
            }
        }

        public static ExamDTOs.ReportCardResponse.ReportCardResponseBuilder builder() {
            return new ExamDTOs.ReportCardResponse.ReportCardResponseBuilder();
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public List<MarkResponse> getSubjects() {
            return this.subjects;
        }

        public String getLocaleCode() {
            return localeCode;
        }

        public void setLocaleCode(String localeCode) {
            this.localeCode = localeCode;
        }

        public String getBoardCode() {
            return boardCode;
        }

        public void setBoardCode(String boardCode) {
            this.boardCode = boardCode;
        }

        public String getTermCode() {
            return termCode;
        }

        public void setTermCode(String termCode) {
            this.termCode = termCode;
        }

        public List<ReportCardSection> getSections() {
            return sections;
        }

        public void setSections(List<ReportCardSection> sections) {
            this.sections = sections;
        }

        public double getTotalMarks() {
            return this.totalMarks;
        }

        public double getTotalMaxMarks() {
            return this.totalMaxMarks;
        }

        public double getOverallPercentage() {
            return this.overallPercentage;
        }

        public String getOverallGrade() {
            return this.overallGrade;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setSubjects(final List<MarkResponse> subjects) {
            this.subjects = subjects;
        }

        public void setTotalMarks(final double totalMarks) {
            this.totalMarks = totalMarks;
        }

        public void setTotalMaxMarks(final double totalMaxMarks) {
            this.totalMaxMarks = totalMaxMarks;
        }

        public void setOverallPercentage(final double overallPercentage) {
            this.overallPercentage = overallPercentage;
        }

        public void setOverallGrade(final String overallGrade) {
            this.overallGrade = overallGrade;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof ExamDTOs.ReportCardResponse)) return false;
            final ExamDTOs.ReportCardResponse other = (ExamDTOs.ReportCardResponse) o;
            if (!other.canEqual((Object) this)) return false;
            if (Double.compare(this.getTotalMarks(), other.getTotalMarks()) != 0) return false;
            if (Double.compare(this.getTotalMaxMarks(), other.getTotalMaxMarks()) != 0) return false;
            if (Double.compare(this.getOverallPercentage(), other.getOverallPercentage()) != 0) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$subjects = this.getSubjects();
            final Object other$subjects = other.getSubjects();
            if (this$subjects == null ? other$subjects != null : !this$subjects.equals(other$subjects)) return false;
            final Object this$overallGrade = this.getOverallGrade();
            final Object other$overallGrade = other.getOverallGrade();
            if (this$overallGrade == null ? other$overallGrade != null : !this$overallGrade.equals(other$overallGrade)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof ExamDTOs.ReportCardResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final long $totalMarks = Double.doubleToLongBits(this.getTotalMarks());
            result = result * PRIME + (int) ($totalMarks >>> 32 ^ $totalMarks);
            final long $totalMaxMarks = Double.doubleToLongBits(this.getTotalMaxMarks());
            result = result * PRIME + (int) ($totalMaxMarks >>> 32 ^ $totalMaxMarks);
            final long $overallPercentage = Double.doubleToLongBits(this.getOverallPercentage());
            result = result * PRIME + (int) ($overallPercentage >>> 32 ^ $overallPercentage);
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $subjects = this.getSubjects();
            result = result * PRIME + ($subjects == null ? 43 : $subjects.hashCode());
            final Object $overallGrade = this.getOverallGrade();
            result = result * PRIME + ($overallGrade == null ? 43 : $overallGrade.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "ExamDTOs.ReportCardResponse(studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", subjects=" + this.getSubjects() + ", totalMarks=" + this.getTotalMarks() + ", totalMaxMarks=" + this.getTotalMaxMarks() + ", overallPercentage=" + this.getOverallPercentage() + ", overallGrade=" + this.getOverallGrade() + ")";
        }

        public ReportCardResponse() {
        }

        public ReportCardResponse(final Long studentId, final String studentName, final List<MarkResponse> subjects, final double totalMarks, final double totalMaxMarks, final double overallPercentage, final String overallGrade) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.subjects = subjects;
            this.totalMarks = totalMarks;
            this.totalMaxMarks = totalMaxMarks;
            this.overallPercentage = overallPercentage;
            this.overallGrade = overallGrade;
        }
    }

    public static class ReportCardSection {
        private String key;
        private String title;
        private Map<String, Object> data;

        public String getKey() {
            return key;
        }

        public void setKey(String key) {
            this.key = key;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public Map<String, Object> getData() {
            return data;
        }

        public void setData(Map<String, Object> data) {
            this.data = data;
        }
    }

    /** Parent portal: exams visible for the child’s class/section (no full schedule embedded). */
    public static class ParentExamSummaryResponse {
        private Long id;
        private String name;
        private Long academicYearId;
        private String startDate;
        private String endDate;
        private String status;
        private boolean resultsPublished;

        public Long getId() {
            return id;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public Long getAcademicYearId() {
            return academicYearId;
        }

        public void setAcademicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public String getStartDate() {
            return startDate;
        }

        public void setStartDate(final String startDate) {
            this.startDate = startDate;
        }

        public String getEndDate() {
            return endDate;
        }

        public void setEndDate(final String endDate) {
            this.endDate = endDate;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(final String status) {
            this.status = status;
        }

        public boolean isResultsPublished() {
            return resultsPublished;
        }

        public void setResultsPublished(final boolean resultsPublished) {
            this.resultsPublished = resultsPublished;
        }
    }

    public static class TemplateComponentIn {
        private String componentCode;
        private String componentLabel;
        private Double maxMarks;
        private Double weightagePct;
        private Boolean optional;
        private Map<String, Object> rule;

        public String getComponentCode() { return componentCode; }
        public void setComponentCode(String componentCode) { this.componentCode = componentCode; }
        public String getComponentLabel() { return componentLabel; }
        public void setComponentLabel(String componentLabel) { this.componentLabel = componentLabel; }
        public Double getMaxMarks() { return maxMarks; }
        public void setMaxMarks(Double maxMarks) { this.maxMarks = maxMarks; }
        public Double getWeightagePct() { return weightagePct; }
        public void setWeightagePct(Double weightagePct) { this.weightagePct = weightagePct; }
        public Boolean getOptional() { return optional; }
        public void setOptional(Boolean optional) { this.optional = optional; }
        public Map<String, Object> getRule() { return rule; }
        public void setRule(Map<String, Object> rule) { this.rule = rule; }
    }

    public static class UpsertTemplateRequest {
        private Long id;
        private String name;
        private String boardType;
        private String classBand;
        private String defaultMarkingScheme;
        private Map<String, Object> rules;
        private List<TemplateComponentIn> components;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getBoardType() { return boardType; }
        public void setBoardType(String boardType) { this.boardType = boardType; }
        public String getClassBand() { return classBand; }
        public void setClassBand(String classBand) { this.classBand = classBand; }
        public String getDefaultMarkingScheme() { return defaultMarkingScheme; }
        public void setDefaultMarkingScheme(String defaultMarkingScheme) { this.defaultMarkingScheme = defaultMarkingScheme; }
        public Map<String, Object> getRules() { return rules; }
        public void setRules(Map<String, Object> rules) { this.rules = rules; }
        public List<TemplateComponentIn> getComponents() { return components; }
        public void setComponents(List<TemplateComponentIn> components) { this.components = components; }
    }

    public static class TemplateComponentOut {
        private Long id;
        private String componentCode;
        private String componentLabel;
        private Double maxMarks;
        private Double weightagePct;
        private Boolean optional;
        private Map<String, Object> rule;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getComponentCode() { return componentCode; }
        public void setComponentCode(String componentCode) { this.componentCode = componentCode; }
        public String getComponentLabel() { return componentLabel; }
        public void setComponentLabel(String componentLabel) { this.componentLabel = componentLabel; }
        public Double getMaxMarks() { return maxMarks; }
        public void setMaxMarks(Double maxMarks) { this.maxMarks = maxMarks; }
        public Double getWeightagePct() { return weightagePct; }
        public void setWeightagePct(Double weightagePct) { this.weightagePct = weightagePct; }
        public Boolean getOptional() { return optional; }
        public void setOptional(Boolean optional) { this.optional = optional; }
        public Map<String, Object> getRule() { return rule; }
        public void setRule(Map<String, Object> rule) { this.rule = rule; }
    }

    public static class TemplateResponse {
        private Long id;
        private String name;
        private String boardType;
        private String classBand;
        private String defaultMarkingScheme;
        private Map<String, Object> rules;
        private List<TemplateComponentOut> components;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getBoardType() { return boardType; }
        public void setBoardType(String boardType) { this.boardType = boardType; }
        public String getClassBand() { return classBand; }
        public void setClassBand(String classBand) { this.classBand = classBand; }
        public String getDefaultMarkingScheme() { return defaultMarkingScheme; }
        public void setDefaultMarkingScheme(String defaultMarkingScheme) { this.defaultMarkingScheme = defaultMarkingScheme; }
        public Map<String, Object> getRules() { return rules; }
        public void setRules(Map<String, Object> rules) { this.rules = rules; }
        public List<TemplateComponentOut> getComponents() { return components; }
        public void setComponents(List<TemplateComponentOut> components) { this.components = components; }
    }

    public static class PublicationSnapshotResponse {
        private Long id;
        private Integer versionNo;
        private String snapshotType;
        private String note;
        private String publishedAt;
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Integer getVersionNo() { return versionNo; }
        public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }
        public String getSnapshotType() { return snapshotType; }
        public void setSnapshotType(String snapshotType) { this.snapshotType = snapshotType; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getPublishedAt() { return publishedAt; }
        public void setPublishedAt(String publishedAt) { this.publishedAt = publishedAt; }
    }

    public static class ExamEventLogResponse {
        private Long id;
        private String eventType;
        private Long actorUserId;
        private String actorRole;
        private String payloadJson;
        private String createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public Long getActorUserId() { return actorUserId; }
        public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
        public String getActorRole() { return actorRole; }
        public void setActorRole(String actorRole) { this.actorRole = actorRole; }
        public String getPayloadJson() { return payloadJson; }
        public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }

    public static class NotificationJobResponse {
        private Long id;
        private Long examId;
        private String eventType;
        private String targetRole;
        private String localeCode;
        private String status;
        private Integer attempts;
        private Integer maxAttempts;
        private String nextRetryAt;
        private String lastError;
        private String payloadJson;
        private String createdAt;
        private String updatedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getExamId() { return examId; }
        public void setExamId(Long examId) { this.examId = examId; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getTargetRole() { return targetRole; }
        public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
        public String getLocaleCode() { return localeCode; }
        public void setLocaleCode(String localeCode) { this.localeCode = localeCode; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public Integer getAttempts() { return attempts; }
        public void setAttempts(Integer attempts) { this.attempts = attempts; }
        public Integer getMaxAttempts() { return maxAttempts; }
        public void setMaxAttempts(Integer maxAttempts) { this.maxAttempts = maxAttempts; }
        public String getNextRetryAt() { return nextRetryAt; }
        public void setNextRetryAt(String nextRetryAt) { this.nextRetryAt = nextRetryAt; }
        public String getLastError() { return lastError; }
        public void setLastError(String lastError) { this.lastError = lastError; }
        public String getPayloadJson() { return payloadJson; }
        public void setPayloadJson(String payloadJson) { this.payloadJson = payloadJson; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
        public String getUpdatedAt() { return updatedAt; }
        public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
    }

    public static class BulkOperationLogResponse {
        private Long id;
        private String operationType;
        private String requestId;
        private Long examId;
        private String status;
        private String createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getOperationType() { return operationType; }
        public void setOperationType(String operationType) { this.operationType = operationType; }
        public String getRequestId() { return requestId; }
        public void setRequestId(String requestId) { this.requestId = requestId; }
        public Long getExamId() { return examId; }
        public void setExamId(Long examId) { this.examId = examId; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getCreatedAt() { return createdAt; }
        public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }
    }

    public static class RollbackToVersionRequest {
        @NotNull
        private Integer versionNo;
        private String note;
        public Integer getVersionNo() { return versionNo; }
        public void setVersionNo(Integer versionNo) { this.versionNo = versionNo; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }
}
