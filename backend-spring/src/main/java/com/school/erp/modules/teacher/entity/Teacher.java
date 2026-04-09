package com.school.erp.modules.teacher.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.math.BigDecimal;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "teachers", indexes = {@Index(name = "idx_teacher_tenant", columnList = "tenant_id")})
public class Teacher extends BaseEntity {
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;
    @Column(nullable = false, length = 150)
    private String email;
    @Column(length = 20)
    private String phone;
    @Column(length = 200)
    private String qualification;
    @Column(length = 100)
    private String specialization;
    @Column(name = "join_date")
    private LocalDate joinDate;
    @Column(precision = 12, scale = 2)
    private BigDecimal salary;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 20)
    private Enums.TeacherStatus status;
    @Column(length = 500)
    private String avatar;
    @Column(name = "user_id")
    private Long userId;
    @Column(name = "bank_account_holder", length = 200)
    private String bankAccountHolder;
    @Column(name = "bank_name", length = 120)
    private String bankName;
    @Column(name = "bank_account_number", length = 64)
    private String bankAccountNumber;
    @Column(name = "bank_ifsc", length = 32)
    private String bankIfsc;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "library_staff_role", length = 32)
    private Enums.LibraryStaffRole libraryStaffRole;
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "teacher_subjects", joinColumns = @JoinColumn(name = "teacher_id"))
    @Column(name = "subject")
    private List<String> subjects;


    public static class TeacherBuilder {
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String qualification;
        private String specialization;
        private LocalDate joinDate;
        private BigDecimal salary;
        private Enums.TeacherStatus status;
        private String avatar;
        private Long userId;
        private List<String> subjects;

        TeacherBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder firstName(final String firstName) {
            this.firstName = firstName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder lastName(final String lastName) {
            this.lastName = lastName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder email(final String email) {
            this.email = email;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder phone(final String phone) {
            this.phone = phone;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder qualification(final String qualification) {
            this.qualification = qualification;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder specialization(final String specialization) {
            this.specialization = specialization;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder joinDate(final LocalDate joinDate) {
            this.joinDate = joinDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder salary(final BigDecimal salary) {
            this.salary = salary;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder status(final Enums.TeacherStatus status) {
            this.status = status;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder avatar(final String avatar) {
            this.avatar = avatar;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder userId(final Long userId) {
            this.userId = userId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Teacher.TeacherBuilder subjects(final List<String> subjects) {
            this.subjects = subjects;
            return this;
        }

        public Teacher build() {
            return new Teacher(this.firstName, this.lastName, this.email, this.phone, this.qualification, this.specialization, this.joinDate, this.salary, this.status, this.avatar, this.userId, this.subjects);
        }

        @Override
        public String toString() {
            return "Teacher.TeacherBuilder(firstName=" + this.firstName + ", lastName=" + this.lastName + ", email=" + this.email + ", phone=" + this.phone + ", qualification=" + this.qualification + ", specialization=" + this.specialization + ", joinDate=" + this.joinDate + ", salary=" + this.salary + ", status=" + this.status + ", avatar=" + this.avatar + ", userId=" + this.userId + ", subjects=" + this.subjects + ")";
        }
    }

    public static Teacher.TeacherBuilder builder() {
        return new Teacher.TeacherBuilder();
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

    public String getQualification() {
        return this.qualification;
    }

    public String getSpecialization() {
        return this.specialization;
    }

    public LocalDate getJoinDate() {
        return this.joinDate;
    }

    public BigDecimal getSalary() {
        return this.salary;
    }

    public Enums.TeacherStatus getStatus() {
        return this.status;
    }

    public String getAvatar() {
        return this.avatar;
    }

    public Long getUserId() {
        return this.userId;
    }

    public String getBankAccountHolder() {
        return bankAccountHolder;
    }

    public void setBankAccountHolder(String bankAccountHolder) {
        this.bankAccountHolder = bankAccountHolder;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getBankAccountNumber() {
        return bankAccountNumber;
    }

    public void setBankAccountNumber(String bankAccountNumber) {
        this.bankAccountNumber = bankAccountNumber;
    }

    public String getBankIfsc() {
        return bankIfsc;
    }

    public void setBankIfsc(String bankIfsc) {
        this.bankIfsc = bankIfsc;
    }

    public List<String> getSubjects() {
        return this.subjects;
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

    public void setQualification(final String qualification) {
        this.qualification = qualification;
    }

    public void setSpecialization(final String specialization) {
        this.specialization = specialization;
    }

    public void setJoinDate(final LocalDate joinDate) {
        this.joinDate = joinDate;
    }

    public void setSalary(final BigDecimal salary) {
        this.salary = salary;
    }

    public void setStatus(final Enums.TeacherStatus status) {
        this.status = status;
    }

    public void setAvatar(final String avatar) {
        this.avatar = avatar;
    }

    public void setUserId(final Long userId) {
        this.userId = userId;
    }

    public void setSubjects(final List<String> subjects) {
        this.subjects = subjects;
    }

    public Enums.LibraryStaffRole getLibraryStaffRole() {
        return libraryStaffRole;
    }

    public void setLibraryStaffRole(final Enums.LibraryStaffRole libraryStaffRole) {
        this.libraryStaffRole = libraryStaffRole;
    }

    public Teacher() {
    }

    public Teacher(final String firstName, final String lastName, final String email, final String phone, final String qualification, final String specialization, final LocalDate joinDate, final BigDecimal salary, final Enums.TeacherStatus status, final String avatar, final Long userId, final List<String> subjects) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.qualification = qualification;
        this.specialization = specialization;
        this.joinDate = joinDate;
        this.salary = salary;
        this.status = status;
        this.avatar = avatar;
        this.userId = userId;
        this.subjects = subjects;
    }
}
