package com.school.erp.modules.attendance.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class AttendanceDTOs {

    public static class BulkMarkRequest {
        @NotNull
        private Long classId;
        @NotNull
        private Long sectionId;
        @NotNull
        private String date; // yyyy-MM-dd
        @NotNull
        private List<MarkEntry> records;


        public static class BulkMarkRequestBuilder {
            private Long classId;
            private Long sectionId;
            private String date;
            private List<MarkEntry> records;

            BulkMarkRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.BulkMarkRequest.BulkMarkRequestBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.BulkMarkRequest.BulkMarkRequestBuilder sectionId(final Long sectionId) {
                this.sectionId = sectionId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.BulkMarkRequest.BulkMarkRequestBuilder date(final String date) {
                this.date = date;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.BulkMarkRequest.BulkMarkRequestBuilder records(final List<MarkEntry> records) {
                this.records = records;
                return this;
            }

            public AttendanceDTOs.BulkMarkRequest build() {
                return new AttendanceDTOs.BulkMarkRequest(this.classId, this.sectionId, this.date, this.records);
            }

            @Override
            public String toString() {
                return "AttendanceDTOs.BulkMarkRequest.BulkMarkRequestBuilder(classId=" + this.classId + ", sectionId=" + this.sectionId + ", date=" + this.date + ", records=" + this.records + ")";
            }
        }

        public static AttendanceDTOs.BulkMarkRequest.BulkMarkRequestBuilder builder() {
            return new AttendanceDTOs.BulkMarkRequest.BulkMarkRequestBuilder();
        }

        public Long getClassId() {
            return this.classId;
        }

        public Long getSectionId() {
            return this.sectionId;
        }

        public String getDate() {
            return this.date;
        }

        public List<MarkEntry> getRecords() {
            return this.records;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setSectionId(final Long sectionId) {
            this.sectionId = sectionId;
        }

        public void setDate(final String date) {
            this.date = date;
        }

        public void setRecords(final List<MarkEntry> records) {
            this.records = records;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AttendanceDTOs.BulkMarkRequest)) return false;
            final AttendanceDTOs.BulkMarkRequest other = (AttendanceDTOs.BulkMarkRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$sectionId = this.getSectionId();
            final Object other$sectionId = other.getSectionId();
            if (this$sectionId == null ? other$sectionId != null : !this$sectionId.equals(other$sectionId)) return false;
            final Object this$date = this.getDate();
            final Object other$date = other.getDate();
            if (this$date == null ? other$date != null : !this$date.equals(other$date)) return false;
            final Object this$records = this.getRecords();
            final Object other$records = other.getRecords();
            if (this$records == null ? other$records != null : !this$records.equals(other$records)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AttendanceDTOs.BulkMarkRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $sectionId = this.getSectionId();
            result = result * PRIME + ($sectionId == null ? 43 : $sectionId.hashCode());
            final Object $date = this.getDate();
            result = result * PRIME + ($date == null ? 43 : $date.hashCode());
            final Object $records = this.getRecords();
            result = result * PRIME + ($records == null ? 43 : $records.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AttendanceDTOs.BulkMarkRequest(classId=" + this.getClassId() + ", sectionId=" + this.getSectionId() + ", date=" + this.getDate() + ", records=" + this.getRecords() + ")";
        }

        public BulkMarkRequest() {
        }

        public BulkMarkRequest(final Long classId, final Long sectionId, final String date, final List<MarkEntry> records) {
            this.classId = classId;
            this.sectionId = sectionId;
            this.date = date;
            this.records = records;
        }
    }


    public static class MarkEntry {
        @NotNull
        private Long studentId;
        private String studentName;
        @NotNull
        private String status; // PRESENT, ABSENT, LATE, EXCUSED
        private String remarks;


        public static class MarkEntryBuilder {
            private Long studentId;
            private String studentName;
            private String status;
            private String remarks;

            MarkEntryBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MarkEntry.MarkEntryBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MarkEntry.MarkEntryBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MarkEntry.MarkEntryBuilder status(final String status) {
                this.status = status;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MarkEntry.MarkEntryBuilder remarks(final String remarks) {
                this.remarks = remarks;
                return this;
            }

            public AttendanceDTOs.MarkEntry build() {
                return new AttendanceDTOs.MarkEntry(this.studentId, this.studentName, this.status, this.remarks);
            }

            @Override
            public String toString() {
                return "AttendanceDTOs.MarkEntry.MarkEntryBuilder(studentId=" + this.studentId + ", studentName=" + this.studentName + ", status=" + this.status + ", remarks=" + this.remarks + ")";
            }
        }

        public static AttendanceDTOs.MarkEntry.MarkEntryBuilder builder() {
            return new AttendanceDTOs.MarkEntry.MarkEntryBuilder();
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public String getStatus() {
            return this.status;
        }

        public String getRemarks() {
            return this.remarks;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setStatus(final String status) {
            this.status = status;
        }

        public void setRemarks(final String remarks) {
            this.remarks = remarks;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AttendanceDTOs.MarkEntry)) return false;
            final AttendanceDTOs.MarkEntry other = (AttendanceDTOs.MarkEntry) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            final Object this$remarks = this.getRemarks();
            final Object other$remarks = other.getRemarks();
            if (this$remarks == null ? other$remarks != null : !this$remarks.equals(other$remarks)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AttendanceDTOs.MarkEntry;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            final Object $remarks = this.getRemarks();
            result = result * PRIME + ($remarks == null ? 43 : $remarks.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AttendanceDTOs.MarkEntry(studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", status=" + this.getStatus() + ", remarks=" + this.getRemarks() + ")";
        }

        public MarkEntry() {
        }

        public MarkEntry(final Long studentId, final String studentName, final String status, final String remarks) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.status = status;
            this.remarks = remarks;
        }
    }


    public static class AttendanceResponse {
        private Long id;
        private Long studentId;
        private String studentName;
        private Long classId;
        private Long sectionId;
        private String date;
        private String status;
        private Long markedBy;
        private String remarks;


        public static class AttendanceResponseBuilder {
            private Long id;
            private Long studentId;
            private String studentName;
            private Long classId;
            private Long sectionId;
            private String date;
            private String status;
            private Long markedBy;
            private String remarks;

            AttendanceResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder sectionId(final Long sectionId) {
                this.sectionId = sectionId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder date(final String date) {
                this.date = date;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder status(final String status) {
                this.status = status;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder markedBy(final Long markedBy) {
                this.markedBy = markedBy;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder remarks(final String remarks) {
                this.remarks = remarks;
                return this;
            }

            public AttendanceDTOs.AttendanceResponse build() {
                return new AttendanceDTOs.AttendanceResponse(this.id, this.studentId, this.studentName, this.classId, this.sectionId, this.date, this.status, this.markedBy, this.remarks);
            }

            @Override
            public String toString() {
                return "AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder(id=" + this.id + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", classId=" + this.classId + ", sectionId=" + this.sectionId + ", date=" + this.date + ", status=" + this.status + ", markedBy=" + this.markedBy + ", remarks=" + this.remarks + ")";
            }
        }

        public static AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder builder() {
            return new AttendanceDTOs.AttendanceResponse.AttendanceResponseBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public Long getClassId() {
            return this.classId;
        }

        public Long getSectionId() {
            return this.sectionId;
        }

        public String getDate() {
            return this.date;
        }

        public String getStatus() {
            return this.status;
        }

        public Long getMarkedBy() {
            return this.markedBy;
        }

        public String getRemarks() {
            return this.remarks;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setSectionId(final Long sectionId) {
            this.sectionId = sectionId;
        }

        public void setDate(final String date) {
            this.date = date;
        }

        public void setStatus(final String status) {
            this.status = status;
        }

        public void setMarkedBy(final Long markedBy) {
            this.markedBy = markedBy;
        }

        public void setRemarks(final String remarks) {
            this.remarks = remarks;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AttendanceDTOs.AttendanceResponse)) return false;
            final AttendanceDTOs.AttendanceResponse other = (AttendanceDTOs.AttendanceResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$sectionId = this.getSectionId();
            final Object other$sectionId = other.getSectionId();
            if (this$sectionId == null ? other$sectionId != null : !this$sectionId.equals(other$sectionId)) return false;
            final Object this$markedBy = this.getMarkedBy();
            final Object other$markedBy = other.getMarkedBy();
            if (this$markedBy == null ? other$markedBy != null : !this$markedBy.equals(other$markedBy)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$date = this.getDate();
            final Object other$date = other.getDate();
            if (this$date == null ? other$date != null : !this$date.equals(other$date)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            final Object this$remarks = this.getRemarks();
            final Object other$remarks = other.getRemarks();
            if (this$remarks == null ? other$remarks != null : !this$remarks.equals(other$remarks)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AttendanceDTOs.AttendanceResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $sectionId = this.getSectionId();
            result = result * PRIME + ($sectionId == null ? 43 : $sectionId.hashCode());
            final Object $markedBy = this.getMarkedBy();
            result = result * PRIME + ($markedBy == null ? 43 : $markedBy.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $date = this.getDate();
            result = result * PRIME + ($date == null ? 43 : $date.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            final Object $remarks = this.getRemarks();
            result = result * PRIME + ($remarks == null ? 43 : $remarks.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AttendanceDTOs.AttendanceResponse(id=" + this.getId() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", classId=" + this.getClassId() + ", sectionId=" + this.getSectionId() + ", date=" + this.getDate() + ", status=" + this.getStatus() + ", markedBy=" + this.getMarkedBy() + ", remarks=" + this.getRemarks() + ")";
        }

        public AttendanceResponse() {
        }

        public AttendanceResponse(final Long id, final Long studentId, final String studentName, final Long classId, final Long sectionId, final String date, final String status, final Long markedBy, final String remarks) {
            this.id = id;
            this.studentId = studentId;
            this.studentName = studentName;
            this.classId = classId;
            this.sectionId = sectionId;
            this.date = date;
            this.status = status;
            this.markedBy = markedBy;
            this.remarks = remarks;
        }
    }


    public static class AttendanceStatsResponse {
        private Long studentId;
        private long totalDays;
        private long present;
        private long absent;
        private long late;
        private long excused;
        private double attendancePercentage;


        public static class AttendanceStatsResponseBuilder {
            private Long studentId;
            private long totalDays;
            private long present;
            private long absent;
            private long late;
            private long excused;
            private double attendancePercentage;

            AttendanceStatsResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder totalDays(final long totalDays) {
                this.totalDays = totalDays;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder present(final long present) {
                this.present = present;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder absent(final long absent) {
                this.absent = absent;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder late(final long late) {
                this.late = late;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder excused(final long excused) {
                this.excused = excused;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder attendancePercentage(final double attendancePercentage) {
                this.attendancePercentage = attendancePercentage;
                return this;
            }

            public AttendanceDTOs.AttendanceStatsResponse build() {
                return new AttendanceDTOs.AttendanceStatsResponse(this.studentId, this.totalDays, this.present, this.absent, this.late, this.excused, this.attendancePercentage);
            }

            @Override
            public String toString() {
                return "AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder(studentId=" + this.studentId + ", totalDays=" + this.totalDays + ", present=" + this.present + ", absent=" + this.absent + ", late=" + this.late + ", excused=" + this.excused + ", attendancePercentage=" + this.attendancePercentage + ")";
            }
        }

        public static AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder builder() {
            return new AttendanceDTOs.AttendanceStatsResponse.AttendanceStatsResponseBuilder();
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public long getTotalDays() {
            return this.totalDays;
        }

        public long getPresent() {
            return this.present;
        }

        public long getAbsent() {
            return this.absent;
        }

        public long getLate() {
            return this.late;
        }

        public long getExcused() {
            return this.excused;
        }

        public double getAttendancePercentage() {
            return this.attendancePercentage;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setTotalDays(final long totalDays) {
            this.totalDays = totalDays;
        }

        public void setPresent(final long present) {
            this.present = present;
        }

        public void setAbsent(final long absent) {
            this.absent = absent;
        }

        public void setLate(final long late) {
            this.late = late;
        }

        public void setExcused(final long excused) {
            this.excused = excused;
        }

        public void setAttendancePercentage(final double attendancePercentage) {
            this.attendancePercentage = attendancePercentage;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AttendanceDTOs.AttendanceStatsResponse)) return false;
            final AttendanceDTOs.AttendanceStatsResponse other = (AttendanceDTOs.AttendanceStatsResponse) o;
            if (!other.canEqual((Object) this)) return false;
            if (this.getTotalDays() != other.getTotalDays()) return false;
            if (this.getPresent() != other.getPresent()) return false;
            if (this.getAbsent() != other.getAbsent()) return false;
            if (this.getLate() != other.getLate()) return false;
            if (this.getExcused() != other.getExcused()) return false;
            if (Double.compare(this.getAttendancePercentage(), other.getAttendancePercentage()) != 0) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AttendanceDTOs.AttendanceStatsResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final long $totalDays = this.getTotalDays();
            result = result * PRIME + (int) ($totalDays >>> 32 ^ $totalDays);
            final long $present = this.getPresent();
            result = result * PRIME + (int) ($present >>> 32 ^ $present);
            final long $absent = this.getAbsent();
            result = result * PRIME + (int) ($absent >>> 32 ^ $absent);
            final long $late = this.getLate();
            result = result * PRIME + (int) ($late >>> 32 ^ $late);
            final long $excused = this.getExcused();
            result = result * PRIME + (int) ($excused >>> 32 ^ $excused);
            final long $attendancePercentage = Double.doubleToLongBits(this.getAttendancePercentage());
            result = result * PRIME + (int) ($attendancePercentage >>> 32 ^ $attendancePercentage);
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AttendanceDTOs.AttendanceStatsResponse(studentId=" + this.getStudentId() + ", totalDays=" + this.getTotalDays() + ", present=" + this.getPresent() + ", absent=" + this.getAbsent() + ", late=" + this.getLate() + ", excused=" + this.getExcused() + ", attendancePercentage=" + this.getAttendancePercentage() + ")";
        }

        public AttendanceStatsResponse() {
        }

        public AttendanceStatsResponse(final Long studentId, final long totalDays, final long present, final long absent, final long late, final long excused, final double attendancePercentage) {
            this.studentId = studentId;
            this.totalDays = totalDays;
            this.present = present;
            this.absent = absent;
            this.late = late;
            this.excused = excused;
            this.attendancePercentage = attendancePercentage;
        }
    }


    public static class ClassAttendanceStatsResponse {
        private Long classId;
        private Long sectionId;
        private String date;
        private long totalStudents;
        private long present;
        private long absent;
        private long late;
        private double attendancePercentage;


        public static class ClassAttendanceStatsResponseBuilder {
            private Long classId;
            private Long sectionId;
            private String date;
            private long totalStudents;
            private long present;
            private long absent;
            private long late;
            private double attendancePercentage;

            ClassAttendanceStatsResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder sectionId(final Long sectionId) {
                this.sectionId = sectionId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder date(final String date) {
                this.date = date;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder totalStudents(final long totalStudents) {
                this.totalStudents = totalStudents;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder present(final long present) {
                this.present = present;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder absent(final long absent) {
                this.absent = absent;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder late(final long late) {
                this.late = late;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder attendancePercentage(final double attendancePercentage) {
                this.attendancePercentage = attendancePercentage;
                return this;
            }

            public AttendanceDTOs.ClassAttendanceStatsResponse build() {
                return new AttendanceDTOs.ClassAttendanceStatsResponse(this.classId, this.sectionId, this.date, this.totalStudents, this.present, this.absent, this.late, this.attendancePercentage);
            }

            @Override
            public String toString() {
                return "AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder(classId=" + this.classId + ", sectionId=" + this.sectionId + ", date=" + this.date + ", totalStudents=" + this.totalStudents + ", present=" + this.present + ", absent=" + this.absent + ", late=" + this.late + ", attendancePercentage=" + this.attendancePercentage + ")";
            }
        }

        public static AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder builder() {
            return new AttendanceDTOs.ClassAttendanceStatsResponse.ClassAttendanceStatsResponseBuilder();
        }

        public Long getClassId() {
            return this.classId;
        }

        public Long getSectionId() {
            return this.sectionId;
        }

        public String getDate() {
            return this.date;
        }

        public long getTotalStudents() {
            return this.totalStudents;
        }

        public long getPresent() {
            return this.present;
        }

        public long getAbsent() {
            return this.absent;
        }

        public long getLate() {
            return this.late;
        }

        public double getAttendancePercentage() {
            return this.attendancePercentage;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setSectionId(final Long sectionId) {
            this.sectionId = sectionId;
        }

        public void setDate(final String date) {
            this.date = date;
        }

        public void setTotalStudents(final long totalStudents) {
            this.totalStudents = totalStudents;
        }

        public void setPresent(final long present) {
            this.present = present;
        }

        public void setAbsent(final long absent) {
            this.absent = absent;
        }

        public void setLate(final long late) {
            this.late = late;
        }

        public void setAttendancePercentage(final double attendancePercentage) {
            this.attendancePercentage = attendancePercentage;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AttendanceDTOs.ClassAttendanceStatsResponse)) return false;
            final AttendanceDTOs.ClassAttendanceStatsResponse other = (AttendanceDTOs.ClassAttendanceStatsResponse) o;
            if (!other.canEqual((Object) this)) return false;
            if (this.getTotalStudents() != other.getTotalStudents()) return false;
            if (this.getPresent() != other.getPresent()) return false;
            if (this.getAbsent() != other.getAbsent()) return false;
            if (this.getLate() != other.getLate()) return false;
            if (Double.compare(this.getAttendancePercentage(), other.getAttendancePercentage()) != 0) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$sectionId = this.getSectionId();
            final Object other$sectionId = other.getSectionId();
            if (this$sectionId == null ? other$sectionId != null : !this$sectionId.equals(other$sectionId)) return false;
            final Object this$date = this.getDate();
            final Object other$date = other.getDate();
            if (this$date == null ? other$date != null : !this$date.equals(other$date)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AttendanceDTOs.ClassAttendanceStatsResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final long $totalStudents = this.getTotalStudents();
            result = result * PRIME + (int) ($totalStudents >>> 32 ^ $totalStudents);
            final long $present = this.getPresent();
            result = result * PRIME + (int) ($present >>> 32 ^ $present);
            final long $absent = this.getAbsent();
            result = result * PRIME + (int) ($absent >>> 32 ^ $absent);
            final long $late = this.getLate();
            result = result * PRIME + (int) ($late >>> 32 ^ $late);
            final long $attendancePercentage = Double.doubleToLongBits(this.getAttendancePercentage());
            result = result * PRIME + (int) ($attendancePercentage >>> 32 ^ $attendancePercentage);
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $sectionId = this.getSectionId();
            result = result * PRIME + ($sectionId == null ? 43 : $sectionId.hashCode());
            final Object $date = this.getDate();
            result = result * PRIME + ($date == null ? 43 : $date.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AttendanceDTOs.ClassAttendanceStatsResponse(classId=" + this.getClassId() + ", sectionId=" + this.getSectionId() + ", date=" + this.getDate() + ", totalStudents=" + this.getTotalStudents() + ", present=" + this.getPresent() + ", absent=" + this.getAbsent() + ", late=" + this.getLate() + ", attendancePercentage=" + this.getAttendancePercentage() + ")";
        }

        public ClassAttendanceStatsResponse() {
        }

        public ClassAttendanceStatsResponse(final Long classId, final Long sectionId, final String date, final long totalStudents, final long present, final long absent, final long late, final double attendancePercentage) {
            this.classId = classId;
            this.sectionId = sectionId;
            this.date = date;
            this.totalStudents = totalStudents;
            this.present = present;
            this.absent = absent;
            this.late = late;
            this.attendancePercentage = attendancePercentage;
        }
    }


    public static class MonthlyAttendanceRow {
        private Long studentId;
        private String studentName;
        private long present;
        private long absent;
        private long late;
        private long totalDays;
        private double attendancePercentage;


        public static class MonthlyAttendanceRowBuilder {
            private Long studentId;
            private String studentName;
            private long present;
            private long absent;
            private long late;
            private long totalDays;
            private double attendancePercentage;

            MonthlyAttendanceRowBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder present(final long present) {
                this.present = present;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder absent(final long absent) {
                this.absent = absent;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder late(final long late) {
                this.late = late;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder totalDays(final long totalDays) {
                this.totalDays = totalDays;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder attendancePercentage(final double attendancePercentage) {
                this.attendancePercentage = attendancePercentage;
                return this;
            }

            public AttendanceDTOs.MonthlyAttendanceRow build() {
                return new AttendanceDTOs.MonthlyAttendanceRow(this.studentId, this.studentName, this.present, this.absent, this.late, this.totalDays, this.attendancePercentage);
            }

            @Override
            public String toString() {
                return "AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder(studentId=" + this.studentId + ", studentName=" + this.studentName + ", present=" + this.present + ", absent=" + this.absent + ", late=" + this.late + ", totalDays=" + this.totalDays + ", attendancePercentage=" + this.attendancePercentage + ")";
            }
        }

        public static AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder builder() {
            return new AttendanceDTOs.MonthlyAttendanceRow.MonthlyAttendanceRowBuilder();
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public long getPresent() {
            return this.present;
        }

        public long getAbsent() {
            return this.absent;
        }

        public long getLate() {
            return this.late;
        }

        public long getTotalDays() {
            return this.totalDays;
        }

        public double getAttendancePercentage() {
            return this.attendancePercentage;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setPresent(final long present) {
            this.present = present;
        }

        public void setAbsent(final long absent) {
            this.absent = absent;
        }

        public void setLate(final long late) {
            this.late = late;
        }

        public void setTotalDays(final long totalDays) {
            this.totalDays = totalDays;
        }

        public void setAttendancePercentage(final double attendancePercentage) {
            this.attendancePercentage = attendancePercentage;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AttendanceDTOs.MonthlyAttendanceRow)) return false;
            final AttendanceDTOs.MonthlyAttendanceRow other = (AttendanceDTOs.MonthlyAttendanceRow) o;
            if (!other.canEqual((Object) this)) return false;
            if (this.getPresent() != other.getPresent()) return false;
            if (this.getAbsent() != other.getAbsent()) return false;
            if (this.getLate() != other.getLate()) return false;
            if (this.getTotalDays() != other.getTotalDays()) return false;
            if (Double.compare(this.getAttendancePercentage(), other.getAttendancePercentage()) != 0) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AttendanceDTOs.MonthlyAttendanceRow;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final long $present = this.getPresent();
            result = result * PRIME + (int) ($present >>> 32 ^ $present);
            final long $absent = this.getAbsent();
            result = result * PRIME + (int) ($absent >>> 32 ^ $absent);
            final long $late = this.getLate();
            result = result * PRIME + (int) ($late >>> 32 ^ $late);
            final long $totalDays = this.getTotalDays();
            result = result * PRIME + (int) ($totalDays >>> 32 ^ $totalDays);
            final long $attendancePercentage = Double.doubleToLongBits(this.getAttendancePercentage());
            result = result * PRIME + (int) ($attendancePercentage >>> 32 ^ $attendancePercentage);
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AttendanceDTOs.MonthlyAttendanceRow(studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", present=" + this.getPresent() + ", absent=" + this.getAbsent() + ", late=" + this.getLate() + ", totalDays=" + this.getTotalDays() + ", attendancePercentage=" + this.getAttendancePercentage() + ")";
        }

        public MonthlyAttendanceRow() {
        }

        public MonthlyAttendanceRow(final Long studentId, final String studentName, final long present, final long absent, final long late, final long totalDays, final double attendancePercentage) {
            this.studentId = studentId;
            this.studentName = studentName;
            this.present = present;
            this.absent = absent;
            this.late = late;
            this.totalDays = totalDays;
            this.attendancePercentage = attendancePercentage;
        }
    }
}
