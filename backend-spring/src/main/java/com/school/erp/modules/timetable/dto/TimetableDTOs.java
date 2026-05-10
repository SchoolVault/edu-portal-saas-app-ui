package com.school.erp.modules.timetable.dto;

import java.util.List;
import java.util.Map;

public class TimetableDTOs {

    public static class TimetableGridResponse {
        private Long classId;
        private Long sectionId;
        private List<String> days;
        private List<Integer> periods;
        private Map<String, Map<Integer, SlotDTO>> grid; // day -> period -> slot


        public static class TimetableGridResponseBuilder {
            private Long classId;
            private Long sectionId;
            private List<String> days;
            private List<Integer> periods;
            private Map<String, Map<Integer, SlotDTO>> grid;

            TimetableGridResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.TimetableGridResponse.TimetableGridResponseBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.TimetableGridResponse.TimetableGridResponseBuilder sectionId(final Long sectionId) {
                this.sectionId = sectionId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.TimetableGridResponse.TimetableGridResponseBuilder days(final List<String> days) {
                this.days = days;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.TimetableGridResponse.TimetableGridResponseBuilder periods(final List<Integer> periods) {
                this.periods = periods;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.TimetableGridResponse.TimetableGridResponseBuilder grid(final Map<String, Map<Integer, SlotDTO>> grid) {
                this.grid = grid;
                return this;
            }

            public TimetableDTOs.TimetableGridResponse build() {
                return new TimetableDTOs.TimetableGridResponse(this.classId, this.sectionId, this.days, this.periods, this.grid);
            }

            @Override
            public String toString() {
                return "TimetableDTOs.TimetableGridResponse.TimetableGridResponseBuilder(classId=" + this.classId + ", sectionId=" + this.sectionId + ", days=" + this.days + ", periods=" + this.periods + ", grid=" + this.grid + ")";
            }
        }

        public static TimetableDTOs.TimetableGridResponse.TimetableGridResponseBuilder builder() {
            return new TimetableDTOs.TimetableGridResponse.TimetableGridResponseBuilder();
        }

        public Long getClassId() {
            return this.classId;
        }

        public Long getSectionId() {
            return this.sectionId;
        }

        public List<String> getDays() {
            return this.days;
        }

        public List<Integer> getPeriods() {
            return this.periods;
        }

        public Map<String, Map<Integer, SlotDTO>> getGrid() {
            return this.grid;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setSectionId(final Long sectionId) {
            this.sectionId = sectionId;
        }

        public void setDays(final List<String> days) {
            this.days = days;
        }

        public void setPeriods(final List<Integer> periods) {
            this.periods = periods;
        }

        public void setGrid(final Map<String, Map<Integer, SlotDTO>> grid) {
            this.grid = grid;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof TimetableDTOs.TimetableGridResponse)) return false;
            final TimetableDTOs.TimetableGridResponse other = (TimetableDTOs.TimetableGridResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$sectionId = this.getSectionId();
            final Object other$sectionId = other.getSectionId();
            if (this$sectionId == null ? other$sectionId != null : !this$sectionId.equals(other$sectionId)) return false;
            final Object this$days = this.getDays();
            final Object other$days = other.getDays();
            if (this$days == null ? other$days != null : !this$days.equals(other$days)) return false;
            final Object this$periods = this.getPeriods();
            final Object other$periods = other.getPeriods();
            if (this$periods == null ? other$periods != null : !this$periods.equals(other$periods)) return false;
            final Object this$grid = this.getGrid();
            final Object other$grid = other.getGrid();
            if (this$grid == null ? other$grid != null : !this$grid.equals(other$grid)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof TimetableDTOs.TimetableGridResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $sectionId = this.getSectionId();
            result = result * PRIME + ($sectionId == null ? 43 : $sectionId.hashCode());
            final Object $days = this.getDays();
            result = result * PRIME + ($days == null ? 43 : $days.hashCode());
            final Object $periods = this.getPeriods();
            result = result * PRIME + ($periods == null ? 43 : $periods.hashCode());
            final Object $grid = this.getGrid();
            result = result * PRIME + ($grid == null ? 43 : $grid.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "TimetableDTOs.TimetableGridResponse(classId=" + this.getClassId() + ", sectionId=" + this.getSectionId() + ", days=" + this.getDays() + ", periods=" + this.getPeriods() + ", grid=" + this.getGrid() + ")";
        }

        public TimetableGridResponse() {
        }

        public TimetableGridResponse(final Long classId, final Long sectionId, final List<String> days, final List<Integer> periods, final Map<String, Map<Integer, SlotDTO>> grid) {
            this.classId = classId;
            this.sectionId = sectionId;
            this.days = days;
            this.periods = periods;
            this.grid = grid;
        }
    }


    public static class SlotDTO {
        private String subject;
        private String teacher;
        private String room;
        private String startTime;
        private String endTime;


        public static class SlotDTOBuilder {
            private String subject;
            private String teacher;
            private String room;
            private String startTime;
            private String endTime;

            SlotDTOBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.SlotDTO.SlotDTOBuilder subject(final String subject) {
                this.subject = subject;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.SlotDTO.SlotDTOBuilder teacher(final String teacher) {
                this.teacher = teacher;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.SlotDTO.SlotDTOBuilder room(final String room) {
                this.room = room;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.SlotDTO.SlotDTOBuilder startTime(final String startTime) {
                this.startTime = startTime;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TimetableDTOs.SlotDTO.SlotDTOBuilder endTime(final String endTime) {
                this.endTime = endTime;
                return this;
            }

            public TimetableDTOs.SlotDTO build() {
                return new TimetableDTOs.SlotDTO(this.subject, this.teacher, this.room, this.startTime, this.endTime);
            }

            @Override
            public String toString() {
                return "TimetableDTOs.SlotDTO.SlotDTOBuilder(subject=" + this.subject + ", teacher=" + this.teacher + ", room=" + this.room + ", startTime=" + this.startTime + ", endTime=" + this.endTime + ")";
            }
        }

        public static TimetableDTOs.SlotDTO.SlotDTOBuilder builder() {
            return new TimetableDTOs.SlotDTO.SlotDTOBuilder();
        }

        public String getSubject() {
            return this.subject;
        }

        public String getTeacher() {
            return this.teacher;
        }

        public String getRoom() {
            return this.room;
        }

        public String getStartTime() {
            return this.startTime;
        }

        public String getEndTime() {
            return this.endTime;
        }

        public void setSubject(final String subject) {
            this.subject = subject;
        }

        public void setTeacher(final String teacher) {
            this.teacher = teacher;
        }

        public void setRoom(final String room) {
            this.room = room;
        }

        public void setStartTime(final String startTime) {
            this.startTime = startTime;
        }

        public void setEndTime(final String endTime) {
            this.endTime = endTime;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof TimetableDTOs.SlotDTO)) return false;
            final TimetableDTOs.SlotDTO other = (TimetableDTOs.SlotDTO) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$subject = this.getSubject();
            final Object other$subject = other.getSubject();
            if (this$subject == null ? other$subject != null : !this$subject.equals(other$subject)) return false;
            final Object this$teacher = this.getTeacher();
            final Object other$teacher = other.getTeacher();
            if (this$teacher == null ? other$teacher != null : !this$teacher.equals(other$teacher)) return false;
            final Object this$room = this.getRoom();
            final Object other$room = other.getRoom();
            if (this$room == null ? other$room != null : !this$room.equals(other$room)) return false;
            final Object this$startTime = this.getStartTime();
            final Object other$startTime = other.getStartTime();
            if (this$startTime == null ? other$startTime != null : !this$startTime.equals(other$startTime)) return false;
            final Object this$endTime = this.getEndTime();
            final Object other$endTime = other.getEndTime();
            if (this$endTime == null ? other$endTime != null : !this$endTime.equals(other$endTime)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof TimetableDTOs.SlotDTO;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $subject = this.getSubject();
            result = result * PRIME + ($subject == null ? 43 : $subject.hashCode());
            final Object $teacher = this.getTeacher();
            result = result * PRIME + ($teacher == null ? 43 : $teacher.hashCode());
            final Object $room = this.getRoom();
            result = result * PRIME + ($room == null ? 43 : $room.hashCode());
            final Object $startTime = this.getStartTime();
            result = result * PRIME + ($startTime == null ? 43 : $startTime.hashCode());
            final Object $endTime = this.getEndTime();
            result = result * PRIME + ($endTime == null ? 43 : $endTime.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "TimetableDTOs.SlotDTO(subject=" + this.getSubject() + ", teacher=" + this.getTeacher() + ", room=" + this.getRoom() + ", startTime=" + this.getStartTime() + ", endTime=" + this.getEndTime() + ")";
        }

        public SlotDTO() {
        }

        public SlotDTO(final String subject, final String teacher, final String room, final String startTime, final String endTime) {
            this.subject = subject;
            this.teacher = teacher;
            this.room = room;
            this.startTime = startTime;
            this.endTime = endTime;
        }
    }

    /**
     * Returned with HTTP 409 when a new or updated slot collides with an existing non-deleted row.
     */
    public static class TimetableConflictPayload {
        /** {@code CLASS_PERIOD_OCCUPIED}, {@code TEACHER_DOUBLE_BOOKED}, or {@code ROOM_DOUBLE_BOOKED}. */
        private String conflictType;
        private Long existingEntryId;
        private String day;
        private Integer period;
        private String subjectName;
        private String teacherName;
        private String room;
        private Long classId;
        private Long sectionId;
        /** For {@code TEACHER_DOUBLE_BOOKED}: where the teacher is already booked. */
        private Long conflictingClassId;
        private Long conflictingSectionId;

        public String getConflictType() {
            return conflictType;
        }

        public void setConflictType(String conflictType) {
            this.conflictType = conflictType;
        }

        public Long getExistingEntryId() {
            return existingEntryId;
        }

        public void setExistingEntryId(Long existingEntryId) {
            this.existingEntryId = existingEntryId;
        }

        public String getDay() {
            return day;
        }

        public void setDay(String day) {
            this.day = day;
        }

        public Integer getPeriod() {
            return period;
        }

        public void setPeriod(Integer period) {
            this.period = period;
        }

        public String getSubjectName() {
            return subjectName;
        }

        public void setSubjectName(String subjectName) {
            this.subjectName = subjectName;
        }

        public String getTeacherName() {
            return teacherName;
        }

        public void setTeacherName(String teacherName) {
            this.teacherName = teacherName;
        }

        public String getRoom() {
            return room;
        }

        public void setRoom(String room) {
            this.room = room;
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

        public Long getConflictingClassId() {
            return conflictingClassId;
        }

        public void setConflictingClassId(Long conflictingClassId) {
            this.conflictingClassId = conflictingClassId;
        }

        public Long getConflictingSectionId() {
            return conflictingSectionId;
        }

        public void setConflictingSectionId(Long conflictingSectionId) {
            this.conflictingSectionId = conflictingSectionId;
        }
    }
}
