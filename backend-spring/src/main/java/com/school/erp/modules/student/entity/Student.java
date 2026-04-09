package com.school.erp.modules.student.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.time.LocalDate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "students", uniqueConstraints = {@UniqueConstraint(columnNames = {"tenant_id", "admission_number"}), @UniqueConstraint(columnNames = {"tenant_id", "email"})}, indexes = {@Index(name = "idx_student_tenant", columnList = "tenant_id"), @Index(name = "idx_student_class", columnList = "tenant_id, class_id"), @Index(name = "idx_student_section", columnList = "tenant_id, class_id, section_id")})
public class Student extends BaseEntity {
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;
    @Column(length = 150)
    private String email;
    @Column(length = 20)
    private String phone;
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 10)
    private Enums.Gender gender;
    @Column(name = "class_id")
    private Long classId;
    @Column(name = "section_id")
    private Long sectionId;
    @Column(name = "roll_number", length = 20)
    private String rollNumber;
    @Column(name = "admission_number", nullable = false, length = 50)
    private String admissionNumber;
    @Column(name = "admission_date")
    private LocalDate admissionDate;
    @Column(name = "parent_id")
    private Long parentId;
    @Column(name = "parent_name", length = 200)
    private String parentName;
    @Column(name = "primary_contact_guardian_id")
    private Long primaryContactGuardianId;
    @Column(length = 500)
    private String address;
    @Column(name = "blood_group", length = 5)
    private String bloodGroup;
    @Column(name = "attributes_json", columnDefinition = "json")
    private String attributesJson;
    @Column(length = 500)
    private String avatar;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Enums.StudentStatus status;
    // Transient fields for response enrichment
    @Transient
    private String className;
    @Transient
    private String sectionName;


    public static class StudentBuilder {
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private LocalDate dateOfBirth;
        private Enums.Gender gender;
        private Long classId;
        private Long sectionId;
        private String rollNumber;
        private String admissionNumber;
        private LocalDate admissionDate;
        private Long parentId;
        private String parentName;
        private String address;
        private String bloodGroup;
        private String avatar;
        private Enums.StudentStatus status;
        private String className;
        private String sectionName;

        StudentBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder firstName(final String firstName) {
            this.firstName = firstName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder lastName(final String lastName) {
            this.lastName = lastName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder email(final String email) {
            this.email = email;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder phone(final String phone) {
            this.phone = phone;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder dateOfBirth(final LocalDate dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder gender(final Enums.Gender gender) {
            this.gender = gender;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder classId(final Long classId) {
            this.classId = classId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder sectionId(final Long sectionId) {
            this.sectionId = sectionId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder rollNumber(final String rollNumber) {
            this.rollNumber = rollNumber;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder admissionNumber(final String admissionNumber) {
            this.admissionNumber = admissionNumber;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder admissionDate(final LocalDate admissionDate) {
            this.admissionDate = admissionDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder parentId(final Long parentId) {
            this.parentId = parentId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder parentName(final String parentName) {
            this.parentName = parentName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder address(final String address) {
            this.address = address;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder bloodGroup(final String bloodGroup) {
            this.bloodGroup = bloodGroup;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder avatar(final String avatar) {
            this.avatar = avatar;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder status(final Enums.StudentStatus status) {
            this.status = status;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder className(final String className) {
            this.className = className;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Student.StudentBuilder sectionName(final String sectionName) {
            this.sectionName = sectionName;
            return this;
        }

        public Student build() {
            return new Student(this.firstName, this.lastName, this.email, this.phone, this.dateOfBirth, this.gender, this.classId, this.sectionId, this.rollNumber, this.admissionNumber, this.admissionDate, this.parentId, this.parentName, this.address, this.bloodGroup, this.avatar, this.status, this.className, this.sectionName);
        }

        @Override
        public String toString() {
            return "Student.StudentBuilder(firstName=" + this.firstName + ", lastName=" + this.lastName + ", email=" + this.email + ", phone=" + this.phone + ", dateOfBirth=" + this.dateOfBirth + ", gender=" + this.gender + ", classId=" + this.classId + ", sectionId=" + this.sectionId + ", rollNumber=" + this.rollNumber + ", admissionNumber=" + this.admissionNumber + ", admissionDate=" + this.admissionDate + ", parentId=" + this.parentId + ", parentName=" + this.parentName + ", address=" + this.address + ", bloodGroup=" + this.bloodGroup + ", avatar=" + this.avatar + ", status=" + this.status + ", className=" + this.className + ", sectionName=" + this.sectionName + ")";
        }
    }

    public static Student.StudentBuilder builder() {
        return new Student.StudentBuilder();
    }

    public String getFirstName() {
        return this.firstName;
    }

    public String getLastName() {
        return this.lastName;
    }

    public String getEmail() {
        return this.email;
    }

    public String getPhone() {
        return this.phone;
    }

    public LocalDate getDateOfBirth() {
        return this.dateOfBirth;
    }

    public Enums.Gender getGender() {
        return this.gender;
    }

    public Long getClassId() {
        return this.classId;
    }

    public Long getSectionId() {
        return this.sectionId;
    }

    public String getRollNumber() {
        return this.rollNumber;
    }

    public String getAdmissionNumber() {
        return this.admissionNumber;
    }

    public LocalDate getAdmissionDate() {
        return this.admissionDate;
    }

    public Long getParentId() {
        return this.parentId;
    }

    public String getParentName() {
        return this.parentName;
    }

    public Long getPrimaryContactGuardianId() {
        return this.primaryContactGuardianId;
    }

    public String getAddress() {
        return this.address;
    }

    public String getBloodGroup() {
        return this.bloodGroup;
    }

    public String getAttributesJson() {
        return this.attributesJson;
    }

    public String getAvatar() {
        return this.avatar;
    }

    public Enums.StudentStatus getStatus() {
        return this.status;
    }

    public String getClassName() {
        return this.className;
    }

    public String getSectionName() {
        return this.sectionName;
    }

    public void setFirstName(final String firstName) {
        this.firstName = firstName;
    }

    public void setLastName(final String lastName) {
        this.lastName = lastName;
    }

    public void setEmail(final String email) {
        this.email = email;
    }

    public void setPhone(final String phone) {
        this.phone = phone;
    }

    public void setDateOfBirth(final LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public void setGender(final Enums.Gender gender) {
        this.gender = gender;
    }

    public void setClassId(final Long classId) {
        this.classId = classId;
    }

    public void setSectionId(final Long sectionId) {
        this.sectionId = sectionId;
    }

    public void setRollNumber(final String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public void setAdmissionNumber(final String admissionNumber) {
        this.admissionNumber = admissionNumber;
    }

    public void setAdmissionDate(final LocalDate admissionDate) {
        this.admissionDate = admissionDate;
    }

    public void setParentId(final Long parentId) {
        this.parentId = parentId;
    }

    public void setParentName(final String parentName) {
        this.parentName = parentName;
    }

    public void setPrimaryContactGuardianId(final Long primaryContactGuardianId) {
        this.primaryContactGuardianId = primaryContactGuardianId;
    }

    public void setAddress(final String address) {
        this.address = address;
    }

    public void setBloodGroup(final String bloodGroup) {
        this.bloodGroup = bloodGroup;
    }

    public void setAttributesJson(final String attributesJson) {
        this.attributesJson = attributesJson;
    }

    public void setAvatar(final String avatar) {
        this.avatar = avatar;
    }

    public void setStatus(final Enums.StudentStatus status) {
        this.status = status;
    }

    public void setClassName(final String className) {
        this.className = className;
    }

    public void setSectionName(final String sectionName) {
        this.sectionName = sectionName;
    }

    public Student() {
    }

    public Student(final String firstName, final String lastName, final String email, final String phone, final LocalDate dateOfBirth, final Enums.Gender gender, final Long classId, final Long sectionId, final String rollNumber, final String admissionNumber, final LocalDate admissionDate, final Long parentId, final String parentName, final String address, final String bloodGroup, final String avatar, final Enums.StudentStatus status, final String className, final String sectionName) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.dateOfBirth = dateOfBirth;
        this.gender = gender;
        this.classId = classId;
        this.sectionId = sectionId;
        this.rollNumber = rollNumber;
        this.admissionNumber = admissionNumber;
        this.admissionDate = admissionDate;
        this.parentId = parentId;
        this.parentName = parentName;
        this.address = address;
        this.bloodGroup = bloodGroup;
        this.avatar = avatar;
        this.status = status;
        this.className = className;
        this.sectionName = sectionName;
    }
}
