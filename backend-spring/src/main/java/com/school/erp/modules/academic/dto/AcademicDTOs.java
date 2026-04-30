package com.school.erp.modules.academic.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class AcademicDTOs {

    public static class CreateClassRequest {
        @NotBlank
        private String name;
        private Integer grade;
        private Long classTeacherId;
        private String classTeacherName;
        @NotNull
        private Long academicYearId;
        private List<String> sectionNames; // e.g. ["A", "B", "C"]
        private Integer sectionCapacity;


        public static class CreateClassRequestBuilder {
            private String name;
            private Integer grade;
            private Long classTeacherId;
            private String classTeacherName;
            private Long academicYearId;
            private List<String> sectionNames;
            private Integer sectionCapacity;

            CreateClassRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder grade(final Integer grade) {
                this.grade = grade;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder classTeacherId(final Long classTeacherId) {
                this.classTeacherId = classTeacherId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder classTeacherName(final String classTeacherName) {
                this.classTeacherName = classTeacherName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder academicYearId(final Long academicYearId) {
                this.academicYearId = academicYearId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder sectionNames(final List<String> sectionNames) {
                this.sectionNames = sectionNames;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder sectionCapacity(final Integer sectionCapacity) {
                this.sectionCapacity = sectionCapacity;
                return this;
            }

            public AcademicDTOs.CreateClassRequest build() {
                return new AcademicDTOs.CreateClassRequest(this.name, this.grade, this.classTeacherId, this.classTeacherName, this.academicYearId, this.sectionNames, this.sectionCapacity);
            }

            @Override
            public String toString() {
                return "AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder(name=" + this.name + ", grade=" + this.grade + ", classTeacherId=" + this.classTeacherId + ", classTeacherName=" + this.classTeacherName + ", academicYearId=" + this.academicYearId + ", sectionNames=" + this.sectionNames + ", sectionCapacity=" + this.sectionCapacity + ")";
            }
        }

        public static AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder builder() {
            return new AcademicDTOs.CreateClassRequest.CreateClassRequestBuilder();
        }

        public String getName() {
            return this.name;
        }

        public Integer getGrade() {
            return this.grade;
        }

        public Long getClassTeacherId() {
            return this.classTeacherId;
        }

        public String getClassTeacherName() {
            return this.classTeacherName;
        }

        public Long getAcademicYearId() {
            return this.academicYearId;
        }

        public List<String> getSectionNames() {
            return this.sectionNames;
        }

        public Integer getSectionCapacity() {
            return this.sectionCapacity;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setGrade(final Integer grade) {
            this.grade = grade;
        }

        public void setClassTeacherId(final Long classTeacherId) {
            this.classTeacherId = classTeacherId;
        }

        public void setClassTeacherName(final String classTeacherName) {
            this.classTeacherName = classTeacherName;
        }

        public void setAcademicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public void setSectionNames(final List<String> sectionNames) {
            this.sectionNames = sectionNames;
        }

        public void setSectionCapacity(final Integer sectionCapacity) {
            this.sectionCapacity = sectionCapacity;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AcademicDTOs.CreateClassRequest)) return false;
            final AcademicDTOs.CreateClassRequest other = (AcademicDTOs.CreateClassRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$grade = this.getGrade();
            final Object other$grade = other.getGrade();
            if (this$grade == null ? other$grade != null : !this$grade.equals(other$grade)) return false;
            final Object this$classTeacherId = this.getClassTeacherId();
            final Object other$classTeacherId = other.getClassTeacherId();
            if (this$classTeacherId == null ? other$classTeacherId != null : !this$classTeacherId.equals(other$classTeacherId)) return false;
            final Object this$academicYearId = this.getAcademicYearId();
            final Object other$academicYearId = other.getAcademicYearId();
            if (this$academicYearId == null ? other$academicYearId != null : !this$academicYearId.equals(other$academicYearId)) return false;
            final Object this$sectionCapacity = this.getSectionCapacity();
            final Object other$sectionCapacity = other.getSectionCapacity();
            if (this$sectionCapacity == null ? other$sectionCapacity != null : !this$sectionCapacity.equals(other$sectionCapacity)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$classTeacherName = this.getClassTeacherName();
            final Object other$classTeacherName = other.getClassTeacherName();
            if (this$classTeacherName == null ? other$classTeacherName != null : !this$classTeacherName.equals(other$classTeacherName)) return false;
            final Object this$sectionNames = this.getSectionNames();
            final Object other$sectionNames = other.getSectionNames();
            if (this$sectionNames == null ? other$sectionNames != null : !this$sectionNames.equals(other$sectionNames)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AcademicDTOs.CreateClassRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $grade = this.getGrade();
            result = result * PRIME + ($grade == null ? 43 : $grade.hashCode());
            final Object $classTeacherId = this.getClassTeacherId();
            result = result * PRIME + ($classTeacherId == null ? 43 : $classTeacherId.hashCode());
            final Object $academicYearId = this.getAcademicYearId();
            result = result * PRIME + ($academicYearId == null ? 43 : $academicYearId.hashCode());
            final Object $sectionCapacity = this.getSectionCapacity();
            result = result * PRIME + ($sectionCapacity == null ? 43 : $sectionCapacity.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $classTeacherName = this.getClassTeacherName();
            result = result * PRIME + ($classTeacherName == null ? 43 : $classTeacherName.hashCode());
            final Object $sectionNames = this.getSectionNames();
            result = result * PRIME + ($sectionNames == null ? 43 : $sectionNames.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AcademicDTOs.CreateClassRequest(name=" + this.getName() + ", grade=" + this.getGrade() + ", classTeacherId=" + this.getClassTeacherId() + ", classTeacherName=" + this.getClassTeacherName() + ", academicYearId=" + this.getAcademicYearId() + ", sectionNames=" + this.getSectionNames() + ", sectionCapacity=" + this.getSectionCapacity() + ")";
        }

        public CreateClassRequest() {
        }

        public CreateClassRequest(final String name, final Integer grade, final Long classTeacherId, final String classTeacherName, final Long academicYearId, final List<String> sectionNames, final Integer sectionCapacity) {
            this.name = name;
            this.grade = grade;
            this.classTeacherId = classTeacherId;
            this.classTeacherName = classTeacherName;
            this.academicYearId = academicYearId;
            this.sectionNames = sectionNames;
            this.sectionCapacity = sectionCapacity;
        }
    }


    public static class ClassWithSectionsResponse {
        private Long id;
        private String name;
        private Integer grade;
        private Boolean isActive;
        private Long classTeacherId;
        private String classTeacherName;
        private Long academicYearId;
        private int totalStudents;
        private List<SectionDTO> sections;


        public static class ClassWithSectionsResponseBuilder {
            private Long id;
            private String name;
            private Integer grade;
            private Boolean isActive;
            private Long classTeacherId;
            private String classTeacherName;
            private Long academicYearId;
            private int totalStudents;
            private List<SectionDTO> sections;

            ClassWithSectionsResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder grade(final Integer grade) {
                this.grade = grade;
                return this;
            }

            public AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder isActive(final Boolean isActive) {
                this.isActive = isActive;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder classTeacherId(final Long classTeacherId) {
                this.classTeacherId = classTeacherId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder classTeacherName(final String classTeacherName) {
                this.classTeacherName = classTeacherName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder academicYearId(final Long academicYearId) {
                this.academicYearId = academicYearId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder totalStudents(final int totalStudents) {
                this.totalStudents = totalStudents;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder sections(final List<SectionDTO> sections) {
                this.sections = sections;
                return this;
            }

            public AcademicDTOs.ClassWithSectionsResponse build() {
                return new AcademicDTOs.ClassWithSectionsResponse(this.id, this.name, this.grade, this.isActive, this.classTeacherId, this.classTeacherName, this.academicYearId, this.totalStudents, this.sections);
            }

            @Override
            public String toString() {
                return "AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder(id=" + this.id + ", name=" + this.name + ", grade=" + this.grade + ", classTeacherId=" + this.classTeacherId + ", classTeacherName=" + this.classTeacherName + ", academicYearId=" + this.academicYearId + ", totalStudents=" + this.totalStudents + ", sections=" + this.sections + ")";
            }
        }

        public static AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder builder() {
            return new AcademicDTOs.ClassWithSectionsResponse.ClassWithSectionsResponseBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public String getName() {
            return this.name;
        }

        public Integer getGrade() {
            return this.grade;
        }

        public Boolean getIsActive() {
            return this.isActive;
        }

        public Long getClassTeacherId() {
            return this.classTeacherId;
        }

        public String getClassTeacherName() {
            return this.classTeacherName;
        }

        public Long getAcademicYearId() {
            return this.academicYearId;
        }

        public int getTotalStudents() {
            return this.totalStudents;
        }

        public List<SectionDTO> getSections() {
            return this.sections;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setGrade(final Integer grade) {
            this.grade = grade;
        }

        public void setIsActive(final Boolean isActive) {
            this.isActive = isActive;
        }

        public void setClassTeacherId(final Long classTeacherId) {
            this.classTeacherId = classTeacherId;
        }

        public void setClassTeacherName(final String classTeacherName) {
            this.classTeacherName = classTeacherName;
        }

        public void setAcademicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public void setTotalStudents(final int totalStudents) {
            this.totalStudents = totalStudents;
        }

        public void setSections(final List<SectionDTO> sections) {
            this.sections = sections;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AcademicDTOs.ClassWithSectionsResponse)) return false;
            final AcademicDTOs.ClassWithSectionsResponse other = (AcademicDTOs.ClassWithSectionsResponse) o;
            if (!other.canEqual((Object) this)) return false;
            if (this.getTotalStudents() != other.getTotalStudents()) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$grade = this.getGrade();
            final Object other$grade = other.getGrade();
            if (this$grade == null ? other$grade != null : !this$grade.equals(other$grade)) return false;
            final Object this$classTeacherId = this.getClassTeacherId();
            final Object other$classTeacherId = other.getClassTeacherId();
            if (this$classTeacherId == null ? other$classTeacherId != null : !this$classTeacherId.equals(other$classTeacherId)) return false;
            final Object this$academicYearId = this.getAcademicYearId();
            final Object other$academicYearId = other.getAcademicYearId();
            if (this$academicYearId == null ? other$academicYearId != null : !this$academicYearId.equals(other$academicYearId)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$classTeacherName = this.getClassTeacherName();
            final Object other$classTeacherName = other.getClassTeacherName();
            if (this$classTeacherName == null ? other$classTeacherName != null : !this$classTeacherName.equals(other$classTeacherName)) return false;
            final Object this$sections = this.getSections();
            final Object other$sections = other.getSections();
            if (this$sections == null ? other$sections != null : !this$sections.equals(other$sections)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AcademicDTOs.ClassWithSectionsResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            result = result * PRIME + this.getTotalStudents();
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $grade = this.getGrade();
            result = result * PRIME + ($grade == null ? 43 : $grade.hashCode());
            final Object $classTeacherId = this.getClassTeacherId();
            result = result * PRIME + ($classTeacherId == null ? 43 : $classTeacherId.hashCode());
            final Object $academicYearId = this.getAcademicYearId();
            result = result * PRIME + ($academicYearId == null ? 43 : $academicYearId.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $classTeacherName = this.getClassTeacherName();
            result = result * PRIME + ($classTeacherName == null ? 43 : $classTeacherName.hashCode());
            final Object $sections = this.getSections();
            result = result * PRIME + ($sections == null ? 43 : $sections.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AcademicDTOs.ClassWithSectionsResponse(id=" + this.getId() + ", name=" + this.getName() + ", grade=" + this.getGrade() + ", classTeacherId=" + this.getClassTeacherId() + ", classTeacherName=" + this.getClassTeacherName() + ", academicYearId=" + this.getAcademicYearId() + ", totalStudents=" + this.getTotalStudents() + ", sections=" + this.getSections() + ")";
        }

        public ClassWithSectionsResponse() {
        }

        public ClassWithSectionsResponse(final Long id, final String name, final Integer grade, final Boolean isActive, final Long classTeacherId, final String classTeacherName, final Long academicYearId, final int totalStudents, final List<SectionDTO> sections) {
            this.id = id;
            this.name = name;
            this.grade = grade;
            this.isActive = isActive;
            this.classTeacherId = classTeacherId;
            this.classTeacherName = classTeacherName;
            this.academicYearId = academicYearId;
            this.totalStudents = totalStudents;
            this.sections = sections;
        }
    }


    public static class SectionDTO {
        private Long id;
        private String name;
        private Long classId;
        private Boolean isActive;
        private Integer capacity;
        private Integer studentCount;
        private Long classTeacherId;
        private String classTeacherName;


        public static class SectionDTOBuilder {
            private Long id;
            private String name;
            private Long classId;
            private Boolean isActive;
            private Integer capacity;
            private Integer studentCount;
            private Long classTeacherId;
            private String classTeacherName;

            SectionDTOBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.SectionDTO.SectionDTOBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.SectionDTO.SectionDTOBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.SectionDTO.SectionDTOBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            public AcademicDTOs.SectionDTO.SectionDTOBuilder isActive(final Boolean isActive) {
                this.isActive = isActive;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.SectionDTO.SectionDTOBuilder capacity(final Integer capacity) {
                this.capacity = capacity;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.SectionDTO.SectionDTOBuilder studentCount(final Integer studentCount) {
                this.studentCount = studentCount;
                return this;
            }

            public AcademicDTOs.SectionDTO.SectionDTOBuilder classTeacherId(final Long classTeacherId) {
                this.classTeacherId = classTeacherId;
                return this;
            }

            public AcademicDTOs.SectionDTO.SectionDTOBuilder classTeacherName(final String classTeacherName) {
                this.classTeacherName = classTeacherName;
                return this;
            }

            public AcademicDTOs.SectionDTO build() {
                return new AcademicDTOs.SectionDTO(
                        this.id, this.name, this.classId, this.isActive, this.capacity, this.studentCount, this.classTeacherId, this.classTeacherName);
            }

            @Override
            public String toString() {
                return "AcademicDTOs.SectionDTO.SectionDTOBuilder(id=" + this.id + ", name=" + this.name + ", classId=" + this.classId + ", capacity=" + this.capacity + ", studentCount=" + this.studentCount + ", classTeacherId=" + this.classTeacherId + ", classTeacherName=" + this.classTeacherName + ")";
            }
        }

        public static AcademicDTOs.SectionDTO.SectionDTOBuilder builder() {
            return new AcademicDTOs.SectionDTO.SectionDTOBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public String getName() {
            return this.name;
        }

        public Long getClassId() {
            return this.classId;
        }

        public Boolean getIsActive() {
            return this.isActive;
        }

        public Integer getCapacity() {
            return this.capacity;
        }

        public Integer getStudentCount() {
            return this.studentCount;
        }

        public Long getClassTeacherId() {
            return this.classTeacherId;
        }

        public String getClassTeacherName() {
            return this.classTeacherName;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setIsActive(final Boolean isActive) {
            this.isActive = isActive;
        }

        public void setCapacity(final Integer capacity) {
            this.capacity = capacity;
        }

        public void setStudentCount(final Integer studentCount) {
            this.studentCount = studentCount;
        }

        public void setClassTeacherId(final Long classTeacherId) {
            this.classTeacherId = classTeacherId;
        }

        public void setClassTeacherName(final String classTeacherName) {
            this.classTeacherName = classTeacherName;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AcademicDTOs.SectionDTO)) return false;
            final AcademicDTOs.SectionDTO other = (AcademicDTOs.SectionDTO) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$capacity = this.getCapacity();
            final Object other$capacity = other.getCapacity();
            if (this$capacity == null ? other$capacity != null : !this$capacity.equals(other$capacity)) return false;
            final Object this$studentCount = this.getStudentCount();
            final Object other$studentCount = other.getStudentCount();
            if (this$studentCount == null ? other$studentCount != null : !this$studentCount.equals(other$studentCount)) return false;
            final Object this$classTeacherId = this.getClassTeacherId();
            final Object other$classTeacherId = other.getClassTeacherId();
            if (this$classTeacherId == null ? other$classTeacherId != null : !this$classTeacherId.equals(other$classTeacherId)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$classTeacherName = this.getClassTeacherName();
            final Object other$classTeacherName = other.getClassTeacherName();
            if (this$classTeacherName == null ? other$classTeacherName != null : !this$classTeacherName.equals(other$classTeacherName)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AcademicDTOs.SectionDTO;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $capacity = this.getCapacity();
            result = result * PRIME + ($capacity == null ? 43 : $capacity.hashCode());
            final Object $studentCount = this.getStudentCount();
            result = result * PRIME + ($studentCount == null ? 43 : $studentCount.hashCode());
            final Object $classTeacherId = this.getClassTeacherId();
            result = result * PRIME + ($classTeacherId == null ? 43 : $classTeacherId.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $classTeacherName = this.getClassTeacherName();
            result = result * PRIME + ($classTeacherName == null ? 43 : $classTeacherName.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AcademicDTOs.SectionDTO(id=" + this.getId() + ", name=" + this.getName() + ", classId=" + this.getClassId() + ", capacity=" + this.getCapacity() + ", studentCount=" + this.getStudentCount() + ", classTeacherId=" + this.getClassTeacherId() + ", classTeacherName=" + this.getClassTeacherName() + ")";
        }

        public SectionDTO() {
        }

        public SectionDTO(final Long id, final String name, final Long classId, final Integer capacity, final Integer studentCount) {
            this.id = id;
            this.name = name;
            this.classId = classId;
            this.capacity = capacity;
            this.studentCount = studentCount;
        }

        public SectionDTO(
                final Long id,
                final String name,
                final Long classId,
                final Boolean isActive,
                final Integer capacity,
                final Integer studentCount,
                final Long classTeacherId,
                final String classTeacherName) {
            this.id = id;
            this.name = name;
            this.classId = classId;
            this.isActive = isActive;
            this.capacity = capacity;
            this.studentCount = studentCount;
            this.classTeacherId = classTeacherId;
            this.classTeacherName = classTeacherName;
        }
    }


    public static class AddSectionRequest {
        @NotNull
        private Long classId;
        @NotBlank
        private String name;
        private Integer capacity;


        public static class AddSectionRequestBuilder {
            private Long classId;
            private String name;
            private Integer capacity;

            AddSectionRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.AddSectionRequest.AddSectionRequestBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.AddSectionRequest.AddSectionRequestBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.AddSectionRequest.AddSectionRequestBuilder capacity(final Integer capacity) {
                this.capacity = capacity;
                return this;
            }

            public AcademicDTOs.AddSectionRequest build() {
                return new AcademicDTOs.AddSectionRequest(this.classId, this.name, this.capacity);
            }

            @Override
            public String toString() {
                return "AcademicDTOs.AddSectionRequest.AddSectionRequestBuilder(classId=" + this.classId + ", name=" + this.name + ", capacity=" + this.capacity + ")";
            }
        }

        public static AcademicDTOs.AddSectionRequest.AddSectionRequestBuilder builder() {
            return new AcademicDTOs.AddSectionRequest.AddSectionRequestBuilder();
        }

        public Long getClassId() {
            return this.classId;
        }

        public String getName() {
            return this.name;
        }

        public Integer getCapacity() {
            return this.capacity;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setCapacity(final Integer capacity) {
            this.capacity = capacity;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AcademicDTOs.AddSectionRequest)) return false;
            final AcademicDTOs.AddSectionRequest other = (AcademicDTOs.AddSectionRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$capacity = this.getCapacity();
            final Object other$capacity = other.getCapacity();
            if (this$capacity == null ? other$capacity != null : !this$capacity.equals(other$capacity)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AcademicDTOs.AddSectionRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $capacity = this.getCapacity();
            result = result * PRIME + ($capacity == null ? 43 : $capacity.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AcademicDTOs.AddSectionRequest(classId=" + this.getClassId() + ", name=" + this.getName() + ", capacity=" + this.getCapacity() + ")";
        }

        public AddSectionRequest() {
        }

        public AddSectionRequest(final Long classId, final String name, final Integer capacity) {
            this.classId = classId;
            this.name = name;
            this.capacity = capacity;
        }
    }


    public static class AssignTeacherRequest {
        /** Optional in JSON; class is taken from path variable on {@code PUT /classes/{classId}/teacher}. */
        private Long classId;
        /** Null clears class teacher assignment. */
        private Long teacherId;
        private String teacherName;
        /**
         * Required when the class has section rows — identifies which section’s homeroom to set.
         * Omit or null for whole-class (no sections) homeroom on {@code school_classes}.
         */
        private Long sectionId;


        public static class AssignTeacherRequestBuilder {
            private Long classId;
            private Long teacherId;
            private String teacherName;
            private Long sectionId;

            AssignTeacherRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.AssignTeacherRequest.AssignTeacherRequestBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.AssignTeacherRequest.AssignTeacherRequestBuilder teacherId(final Long teacherId) {
                this.teacherId = teacherId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public AcademicDTOs.AssignTeacherRequest.AssignTeacherRequestBuilder teacherName(final String teacherName) {
                this.teacherName = teacherName;
                return this;
            }

            public AcademicDTOs.AssignTeacherRequest.AssignTeacherRequestBuilder sectionId(final Long sectionId) {
                this.sectionId = sectionId;
                return this;
            }

            public AcademicDTOs.AssignTeacherRequest build() {
                return new AcademicDTOs.AssignTeacherRequest(this.classId, this.teacherId, this.teacherName, this.sectionId);
            }

            @Override
            public String toString() {
                return "AcademicDTOs.AssignTeacherRequest.AssignTeacherRequestBuilder(classId=" + this.classId + ", teacherId=" + this.teacherId + ", teacherName=" + this.teacherName + ", sectionId=" + this.sectionId + ")";
            }
        }

        public static AcademicDTOs.AssignTeacherRequest.AssignTeacherRequestBuilder builder() {
            return new AcademicDTOs.AssignTeacherRequest.AssignTeacherRequestBuilder();
        }

        public Long getClassId() {
            return this.classId;
        }

        public Long getTeacherId() {
            return this.teacherId;
        }

        public String getTeacherName() {
            return this.teacherName;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setTeacherId(final Long teacherId) {
            this.teacherId = teacherId;
        }

        public void setTeacherName(final String teacherName) {
            this.teacherName = teacherName;
        }

        public Long getSectionId() {
            return this.sectionId;
        }

        public void setSectionId(final Long sectionId) {
            this.sectionId = sectionId;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof AcademicDTOs.AssignTeacherRequest)) return false;
            final AcademicDTOs.AssignTeacherRequest other = (AcademicDTOs.AssignTeacherRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$teacherId = this.getTeacherId();
            final Object other$teacherId = other.getTeacherId();
            if (this$teacherId == null ? other$teacherId != null : !this$teacherId.equals(other$teacherId)) return false;
            final Object this$teacherName = this.getTeacherName();
            final Object other$teacherName = other.getTeacherName();
            if (this$teacherName == null ? other$teacherName != null : !this$teacherName.equals(other$teacherName)) return false;
            final Object this$sectionId = this.getSectionId();
            final Object other$sectionId = other.getSectionId();
            if (this$sectionId == null ? other$sectionId != null : !this$sectionId.equals(other$sectionId)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof AcademicDTOs.AssignTeacherRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $teacherId = this.getTeacherId();
            result = result * PRIME + ($teacherId == null ? 43 : $teacherId.hashCode());
            final Object $teacherName = this.getTeacherName();
            result = result * PRIME + ($teacherName == null ? 43 : $teacherName.hashCode());
            final Object $sectionId = this.getSectionId();
            result = result * PRIME + ($sectionId == null ? 43 : $sectionId.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "AcademicDTOs.AssignTeacherRequest(classId=" + this.getClassId() + ", teacherId=" + this.getTeacherId() + ", teacherName=" + this.getTeacherName() + ", sectionId=" + this.getSectionId() + ")";
        }

        public AssignTeacherRequest() {
        }

        public AssignTeacherRequest(final Long classId, final Long teacherId, final String teacherName, final Long sectionId) {
            this.classId = classId;
            this.teacherId = teacherId;
            this.teacherName = teacherName;
            this.sectionId = sectionId;
        }
    }

    /** Subject pick-list for forms (timetable, teacher profile, exams). {@code id} null = platform default when DB has no rows for tenant. */
    public static class SubjectCatalogItem {
        private Long id;
        private String code;
        private String name;
        private String category;

        public SubjectCatalogItem() {
        }

        public SubjectCatalogItem(final Long id, final String code, final String name, final String category) {
            this.id = id;
            this.code = code;
            this.name = name;
            this.category = category;
        }

        public Long getId() {
            return this.id;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public String getCode() {
            return this.code;
        }

        public void setCode(final String code) {
            this.code = code;
        }

        public String getName() {
            return this.name;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public String getCategory() {
            return this.category;
        }

        public void setCategory(final String category) {
            this.category = category;
        }
    }
}
