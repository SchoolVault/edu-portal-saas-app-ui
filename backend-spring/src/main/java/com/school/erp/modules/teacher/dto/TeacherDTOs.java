package com.school.erp.modules.teacher.dto;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class TeacherDTOs {

    public static class CreateRequest {
        @NotBlank
        private String firstName;
        @NotBlank
        private String lastName;
        @NotBlank
        private String email;
        private String phone;
        private String employeeCode;
        private String qualification;
        private String specialization;
        private LocalDate joinDate;
        private BigDecimal salary;
        private List<String> subjects;
        private String bankAccountHolder;
        private String bankName;
        private String bankAccountNumber;
        private String bankIfsc;


        public static class CreateRequestBuilder {
            private String firstName;
            private String lastName;
            private String email;
            private String phone;
            private String qualification;
            private String specialization;
            private LocalDate joinDate;
            private BigDecimal salary;
            private List<String> subjects;

            CreateRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.CreateRequest.CreateRequestBuilder firstName(final String firstName) {
                this.firstName = firstName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.CreateRequest.CreateRequestBuilder lastName(final String lastName) {
                this.lastName = lastName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.CreateRequest.CreateRequestBuilder email(final String email) {
                this.email = email;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.CreateRequest.CreateRequestBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.CreateRequest.CreateRequestBuilder qualification(final String qualification) {
                this.qualification = qualification;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.CreateRequest.CreateRequestBuilder specialization(final String specialization) {
                this.specialization = specialization;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.CreateRequest.CreateRequestBuilder joinDate(final LocalDate joinDate) {
                this.joinDate = joinDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.CreateRequest.CreateRequestBuilder salary(final BigDecimal salary) {
                this.salary = salary;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.CreateRequest.CreateRequestBuilder subjects(final List<String> subjects) {
                this.subjects = subjects;
                return this;
            }

            public TeacherDTOs.CreateRequest build() {
                return new TeacherDTOs.CreateRequest(this.firstName, this.lastName, this.email, this.phone, this.qualification, this.specialization, this.joinDate, this.salary, this.subjects);
            }

            @Override
            public String toString() {
                return "TeacherDTOs.CreateRequest.CreateRequestBuilder(firstName=" + this.firstName + ", lastName=" + this.lastName + ", email=" + this.email + ", phone=" + this.phone + ", qualification=" + this.qualification + ", specialization=" + this.specialization + ", joinDate=" + this.joinDate + ", salary=" + this.salary + ", subjects=" + this.subjects + ")";
            }
        }

        public static TeacherDTOs.CreateRequest.CreateRequestBuilder builder() {
            return new TeacherDTOs.CreateRequest.CreateRequestBuilder();
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

        public String getEmployeeCode() {
            return employeeCode;
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

        public List<String> getSubjects() {
            return this.subjects;
        }

        public String getBankAccountHolder() {
            return bankAccountHolder;
        }

        public String getBankName() {
            return bankName;
        }

        public String getBankAccountNumber() {
            return bankAccountNumber;
        }

        public String getBankIfsc() {
            return bankIfsc;
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

        public void setEmployeeCode(final String employeeCode) {
            this.employeeCode = employeeCode;
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

        public void setSubjects(final List<String> subjects) {
            this.subjects = subjects;
        }

        public void setBankAccountHolder(final String bankAccountHolder) {
            this.bankAccountHolder = bankAccountHolder;
        }

        public void setBankName(final String bankName) {
            this.bankName = bankName;
        }

        public void setBankAccountNumber(final String bankAccountNumber) {
            this.bankAccountNumber = bankAccountNumber;
        }

        public void setBankIfsc(final String bankIfsc) {
            this.bankIfsc = bankIfsc;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof TeacherDTOs.CreateRequest)) return false;
            final TeacherDTOs.CreateRequest other = (TeacherDTOs.CreateRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$firstName = this.getFirstName();
            final Object other$firstName = other.getFirstName();
            if (this$firstName == null ? other$firstName != null : !this$firstName.equals(other$firstName)) return false;
            final Object this$lastName = this.getLastName();
            final Object other$lastName = other.getLastName();
            if (this$lastName == null ? other$lastName != null : !this$lastName.equals(other$lastName)) return false;
            final Object this$email = this.getEmail();
            final Object other$email = other.getEmail();
            if (this$email == null ? other$email != null : !this$email.equals(other$email)) return false;
            final Object this$phone = this.getPhone();
            final Object other$phone = other.getPhone();
            if (this$phone == null ? other$phone != null : !this$phone.equals(other$phone)) return false;
            final Object this$qualification = this.getQualification();
            final Object other$qualification = other.getQualification();
            if (this$qualification == null ? other$qualification != null : !this$qualification.equals(other$qualification)) return false;
            final Object this$specialization = this.getSpecialization();
            final Object other$specialization = other.getSpecialization();
            if (this$specialization == null ? other$specialization != null : !this$specialization.equals(other$specialization)) return false;
            final Object this$joinDate = this.getJoinDate();
            final Object other$joinDate = other.getJoinDate();
            if (this$joinDate == null ? other$joinDate != null : !this$joinDate.equals(other$joinDate)) return false;
            final Object this$salary = this.getSalary();
            final Object other$salary = other.getSalary();
            if (this$salary == null ? other$salary != null : !this$salary.equals(other$salary)) return false;
            final Object this$subjects = this.getSubjects();
            final Object other$subjects = other.getSubjects();
            if (this$subjects == null ? other$subjects != null : !this$subjects.equals(other$subjects)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof TeacherDTOs.CreateRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $firstName = this.getFirstName();
            result = result * PRIME + ($firstName == null ? 43 : $firstName.hashCode());
            final Object $lastName = this.getLastName();
            result = result * PRIME + ($lastName == null ? 43 : $lastName.hashCode());
            final Object $email = this.getEmail();
            result = result * PRIME + ($email == null ? 43 : $email.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $qualification = this.getQualification();
            result = result * PRIME + ($qualification == null ? 43 : $qualification.hashCode());
            final Object $specialization = this.getSpecialization();
            result = result * PRIME + ($specialization == null ? 43 : $specialization.hashCode());
            final Object $joinDate = this.getJoinDate();
            result = result * PRIME + ($joinDate == null ? 43 : $joinDate.hashCode());
            final Object $salary = this.getSalary();
            result = result * PRIME + ($salary == null ? 43 : $salary.hashCode());
            final Object $subjects = this.getSubjects();
            result = result * PRIME + ($subjects == null ? 43 : $subjects.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "TeacherDTOs.CreateRequest(firstName=" + this.getFirstName() + ", lastName=" + this.getLastName() + ", email=" + this.getEmail() + ", phone=" + this.getPhone() + ", qualification=" + this.getQualification() + ", specialization=" + this.getSpecialization() + ", joinDate=" + this.getJoinDate() + ", salary=" + this.getSalary() + ", subjects=" + this.getSubjects() + ")";
        }

        public CreateRequest() {
        }

        public CreateRequest(final String firstName, final String lastName, final String email, final String phone, final String qualification, final String specialization, final LocalDate joinDate, final BigDecimal salary, final List<String> subjects) {
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.phone = phone;
            this.qualification = qualification;
            this.specialization = specialization;
            this.joinDate = joinDate;
            this.salary = salary;
            this.subjects = subjects;
        }
    }


    public static class UpdateRequest {
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String qualification;
        private String specialization;
        private LocalDate joinDate;
        private BigDecimal salary;
        private List<String> subjects;
        private String status;
        private String bankAccountHolder;
        private String bankName;
        private String bankAccountNumber;
        private String bankIfsc;


        public static class UpdateRequestBuilder {
            private String firstName;
            private String lastName;
            private String email;
            private String phone;
            private String qualification;
            private String specialization;
            private BigDecimal salary;
            private List<String> subjects;
            private String status;

            UpdateRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.UpdateRequest.UpdateRequestBuilder firstName(final String firstName) {
                this.firstName = firstName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.UpdateRequest.UpdateRequestBuilder lastName(final String lastName) {
                this.lastName = lastName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.UpdateRequest.UpdateRequestBuilder email(final String email) {
                this.email = email;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.UpdateRequest.UpdateRequestBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.UpdateRequest.UpdateRequestBuilder qualification(final String qualification) {
                this.qualification = qualification;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.UpdateRequest.UpdateRequestBuilder specialization(final String specialization) {
                this.specialization = specialization;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.UpdateRequest.UpdateRequestBuilder salary(final BigDecimal salary) {
                this.salary = salary;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.UpdateRequest.UpdateRequestBuilder subjects(final List<String> subjects) {
                this.subjects = subjects;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.UpdateRequest.UpdateRequestBuilder status(final String status) {
                this.status = status;
                return this;
            }

            public TeacherDTOs.UpdateRequest build() {
                return new TeacherDTOs.UpdateRequest(this.firstName, this.lastName, this.email, this.phone, this.qualification, this.specialization, this.salary, this.subjects, this.status);
            }

            @Override
            public String toString() {
                return "TeacherDTOs.UpdateRequest.UpdateRequestBuilder(firstName=" + this.firstName + ", lastName=" + this.lastName + ", email=" + this.email + ", phone=" + this.phone + ", qualification=" + this.qualification + ", specialization=" + this.specialization + ", salary=" + this.salary + ", subjects=" + this.subjects + ", status=" + this.status + ")";
            }
        }

        public static TeacherDTOs.UpdateRequest.UpdateRequestBuilder builder() {
            return new TeacherDTOs.UpdateRequest.UpdateRequestBuilder();
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

        public List<String> getSubjects() {
            return this.subjects;
        }

        public String getStatus() {
            return this.status;
        }

        public String getBankAccountHolder() {
            return bankAccountHolder;
        }

        public String getBankName() {
            return bankName;
        }

        public String getBankAccountNumber() {
            return bankAccountNumber;
        }

        public String getBankIfsc() {
            return bankIfsc;
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

        public void setSubjects(final List<String> subjects) {
            this.subjects = subjects;
        }

        public void setStatus(final String status) {
            this.status = status;
        }

        public void setBankAccountHolder(final String bankAccountHolder) {
            this.bankAccountHolder = bankAccountHolder;
        }

        public void setBankName(final String bankName) {
            this.bankName = bankName;
        }

        public void setBankAccountNumber(final String bankAccountNumber) {
            this.bankAccountNumber = bankAccountNumber;
        }

        public void setBankIfsc(final String bankIfsc) {
            this.bankIfsc = bankIfsc;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof TeacherDTOs.UpdateRequest)) return false;
            final TeacherDTOs.UpdateRequest other = (TeacherDTOs.UpdateRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$firstName = this.getFirstName();
            final Object other$firstName = other.getFirstName();
            if (this$firstName == null ? other$firstName != null : !this$firstName.equals(other$firstName)) return false;
            final Object this$lastName = this.getLastName();
            final Object other$lastName = other.getLastName();
            if (this$lastName == null ? other$lastName != null : !this$lastName.equals(other$lastName)) return false;
            final Object this$email = this.getEmail();
            final Object other$email = other.getEmail();
            if (this$email == null ? other$email != null : !this$email.equals(other$email)) return false;
            final Object this$phone = this.getPhone();
            final Object other$phone = other.getPhone();
            if (this$phone == null ? other$phone != null : !this$phone.equals(other$phone)) return false;
            final Object this$qualification = this.getQualification();
            final Object other$qualification = other.getQualification();
            if (this$qualification == null ? other$qualification != null : !this$qualification.equals(other$qualification)) return false;
            final Object this$specialization = this.getSpecialization();
            final Object other$specialization = other.getSpecialization();
            if (this$specialization == null ? other$specialization != null : !this$specialization.equals(other$specialization)) return false;
            final Object this$salary = this.getSalary();
            final Object other$salary = other.getSalary();
            if (this$salary == null ? other$salary != null : !this$salary.equals(other$salary)) return false;
            final Object this$subjects = this.getSubjects();
            final Object other$subjects = other.getSubjects();
            if (this$subjects == null ? other$subjects != null : !this$subjects.equals(other$subjects)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof TeacherDTOs.UpdateRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $firstName = this.getFirstName();
            result = result * PRIME + ($firstName == null ? 43 : $firstName.hashCode());
            final Object $lastName = this.getLastName();
            result = result * PRIME + ($lastName == null ? 43 : $lastName.hashCode());
            final Object $email = this.getEmail();
            result = result * PRIME + ($email == null ? 43 : $email.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $qualification = this.getQualification();
            result = result * PRIME + ($qualification == null ? 43 : $qualification.hashCode());
            final Object $specialization = this.getSpecialization();
            result = result * PRIME + ($specialization == null ? 43 : $specialization.hashCode());
            final Object $salary = this.getSalary();
            result = result * PRIME + ($salary == null ? 43 : $salary.hashCode());
            final Object $subjects = this.getSubjects();
            result = result * PRIME + ($subjects == null ? 43 : $subjects.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "TeacherDTOs.UpdateRequest(firstName=" + this.getFirstName() + ", lastName=" + this.getLastName() + ", email=" + this.getEmail() + ", phone=" + this.getPhone() + ", qualification=" + this.getQualification() + ", specialization=" + this.getSpecialization() + ", salary=" + this.getSalary() + ", subjects=" + this.getSubjects() + ", status=" + this.getStatus() + ")";
        }

        public UpdateRequest() {
        }

        public UpdateRequest(final String firstName, final String lastName, final String email, final String phone, final String qualification, final String specialization, final BigDecimal salary, final List<String> subjects, final String status) {
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.phone = phone;
            this.qualification = qualification;
            this.specialization = specialization;
            this.salary = salary;
            this.subjects = subjects;
            this.status = status;
        }
    }


    public static class Response {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String qualification;
        private String specialization;
        private LocalDate joinDate;
        private BigDecimal salary;
        private String status;
        private List<String> subjects;
        private String avatar;
        private String tenantId;
        private Long userId;
        private String libraryStaffRole;
        private String bankAccountHolder;
        private String bankName;
        private String bankAccountNumber;
        private String bankIfsc;
        /** School class names where this teacher is homeroom / class teacher ({@code school_classes.class_teacher_id}). */
        private java.util.List<String> homeroomClassNames;


        public static class ResponseBuilder {
            private Long id;
            private String firstName;
            private String lastName;
            private String email;
            private String phone;
            private String qualification;
            private String specialization;
            private LocalDate joinDate;
            private BigDecimal salary;
            private String status;
            private List<String> subjects;
            private String avatar;
            private String tenantId;

            ResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder firstName(final String firstName) {
                this.firstName = firstName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder lastName(final String lastName) {
                this.lastName = lastName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder email(final String email) {
                this.email = email;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder qualification(final String qualification) {
                this.qualification = qualification;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder specialization(final String specialization) {
                this.specialization = specialization;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder joinDate(final LocalDate joinDate) {
                this.joinDate = joinDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder salary(final BigDecimal salary) {
                this.salary = salary;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder status(final String status) {
                this.status = status;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder subjects(final List<String> subjects) {
                this.subjects = subjects;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder avatar(final String avatar) {
                this.avatar = avatar;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TeacherDTOs.Response.ResponseBuilder tenantId(final String tenantId) {
                this.tenantId = tenantId;
                return this;
            }

            public TeacherDTOs.Response build() {
                return new TeacherDTOs.Response(this.id, this.firstName, this.lastName, this.email, this.phone, this.qualification, this.specialization, this.joinDate, this.salary, this.status, this.subjects, this.avatar, this.tenantId);
            }

            @Override
            public String toString() {
                return "TeacherDTOs.Response.ResponseBuilder(id=" + this.id + ", firstName=" + this.firstName + ", lastName=" + this.lastName + ", email=" + this.email + ", phone=" + this.phone + ", qualification=" + this.qualification + ", specialization=" + this.specialization + ", joinDate=" + this.joinDate + ", salary=" + this.salary + ", status=" + this.status + ", subjects=" + this.subjects + ", avatar=" + this.avatar + ", tenantId=" + this.tenantId + ")";
            }
        }

        public static TeacherDTOs.Response.ResponseBuilder builder() {
            return new TeacherDTOs.Response.ResponseBuilder();
        }

        public Long getId() {
            return this.id;
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

        public String getStatus() {
            return this.status;
        }

        public List<String> getSubjects() {
            return this.subjects;
        }

        public String getAvatar() {
            return this.avatar;
        }

        public String getTenantId() {
            return this.tenantId;
        }

        public void setId(final Long id) {
            this.id = id;
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

        public void setStatus(final String status) {
            this.status = status;
        }

        public void setSubjects(final List<String> subjects) {
            this.subjects = subjects;
        }

        public void setAvatar(final String avatar) {
            this.avatar = avatar;
        }

        public void setTenantId(final String tenantId) {
            this.tenantId = tenantId;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(final Long userId) {
            this.userId = userId;
        }

        public String getLibraryStaffRole() {
            return libraryStaffRole;
        }

        public void setLibraryStaffRole(final String libraryStaffRole) {
            this.libraryStaffRole = libraryStaffRole;
        }

        public String getBankAccountHolder() {
            return bankAccountHolder;
        }

        public void setBankAccountHolder(final String bankAccountHolder) {
            this.bankAccountHolder = bankAccountHolder;
        }

        public String getBankName() {
            return bankName;
        }

        public void setBankName(final String bankName) {
            this.bankName = bankName;
        }

        public String getBankAccountNumber() {
            return bankAccountNumber;
        }

        public void setBankAccountNumber(final String bankAccountNumber) {
            this.bankAccountNumber = bankAccountNumber;
        }

        public String getBankIfsc() {
            return bankIfsc;
        }

        public void setBankIfsc(final String bankIfsc) {
            this.bankIfsc = bankIfsc;
        }

        public java.util.List<String> getHomeroomClassNames() {
            return this.homeroomClassNames;
        }

        public void setHomeroomClassNames(final java.util.List<String> homeroomClassNames) {
            this.homeroomClassNames = homeroomClassNames;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof TeacherDTOs.Response)) return false;
            final TeacherDTOs.Response other = (TeacherDTOs.Response) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$firstName = this.getFirstName();
            final Object other$firstName = other.getFirstName();
            if (this$firstName == null ? other$firstName != null : !this$firstName.equals(other$firstName)) return false;
            final Object this$lastName = this.getLastName();
            final Object other$lastName = other.getLastName();
            if (this$lastName == null ? other$lastName != null : !this$lastName.equals(other$lastName)) return false;
            final Object this$email = this.getEmail();
            final Object other$email = other.getEmail();
            if (this$email == null ? other$email != null : !this$email.equals(other$email)) return false;
            final Object this$phone = this.getPhone();
            final Object other$phone = other.getPhone();
            if (this$phone == null ? other$phone != null : !this$phone.equals(other$phone)) return false;
            final Object this$qualification = this.getQualification();
            final Object other$qualification = other.getQualification();
            if (this$qualification == null ? other$qualification != null : !this$qualification.equals(other$qualification)) return false;
            final Object this$specialization = this.getSpecialization();
            final Object other$specialization = other.getSpecialization();
            if (this$specialization == null ? other$specialization != null : !this$specialization.equals(other$specialization)) return false;
            final Object this$joinDate = this.getJoinDate();
            final Object other$joinDate = other.getJoinDate();
            if (this$joinDate == null ? other$joinDate != null : !this$joinDate.equals(other$joinDate)) return false;
            final Object this$salary = this.getSalary();
            final Object other$salary = other.getSalary();
            if (this$salary == null ? other$salary != null : !this$salary.equals(other$salary)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            final Object this$subjects = this.getSubjects();
            final Object other$subjects = other.getSubjects();
            if (this$subjects == null ? other$subjects != null : !this$subjects.equals(other$subjects)) return false;
            final Object this$avatar = this.getAvatar();
            final Object other$avatar = other.getAvatar();
            if (this$avatar == null ? other$avatar != null : !this$avatar.equals(other$avatar)) return false;
            final Object this$tenantId = this.getTenantId();
            final Object other$tenantId = other.getTenantId();
            if (this$tenantId == null ? other$tenantId != null : !this$tenantId.equals(other$tenantId)) return false;
            final Object this$homeroomClassNames = this.getHomeroomClassNames();
            final Object other$homeroomClassNames = other.getHomeroomClassNames();
            if (this$homeroomClassNames == null ? other$homeroomClassNames != null : !this$homeroomClassNames.equals(other$homeroomClassNames)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof TeacherDTOs.Response;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $firstName = this.getFirstName();
            result = result * PRIME + ($firstName == null ? 43 : $firstName.hashCode());
            final Object $lastName = this.getLastName();
            result = result * PRIME + ($lastName == null ? 43 : $lastName.hashCode());
            final Object $email = this.getEmail();
            result = result * PRIME + ($email == null ? 43 : $email.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $qualification = this.getQualification();
            result = result * PRIME + ($qualification == null ? 43 : $qualification.hashCode());
            final Object $specialization = this.getSpecialization();
            result = result * PRIME + ($specialization == null ? 43 : $specialization.hashCode());
            final Object $joinDate = this.getJoinDate();
            result = result * PRIME + ($joinDate == null ? 43 : $joinDate.hashCode());
            final Object $salary = this.getSalary();
            result = result * PRIME + ($salary == null ? 43 : $salary.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            final Object $subjects = this.getSubjects();
            result = result * PRIME + ($subjects == null ? 43 : $subjects.hashCode());
            final Object $avatar = this.getAvatar();
            result = result * PRIME + ($avatar == null ? 43 : $avatar.hashCode());
            final Object $tenantId = this.getTenantId();
            result = result * PRIME + ($tenantId == null ? 43 : $tenantId.hashCode());
            final Object $homeroomClassNames = this.getHomeroomClassNames();
            result = result * PRIME + ($homeroomClassNames == null ? 43 : $homeroomClassNames.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "TeacherDTOs.Response(id=" + this.getId() + ", firstName=" + this.getFirstName() + ", lastName=" + this.getLastName() + ", email=" + this.getEmail() + ", phone=" + this.getPhone() + ", qualification=" + this.getQualification() + ", specialization=" + this.getSpecialization() + ", joinDate=" + this.getJoinDate() + ", salary=" + this.getSalary() + ", status=" + this.getStatus() + ", subjects=" + this.getSubjects() + ", avatar=" + this.getAvatar() + ", tenantId=" + this.getTenantId() + ", homeroomClassNames=" + this.getHomeroomClassNames() + ")";
        }

        public Response() {
        }

        public Response(final Long id, final String firstName, final String lastName, final String email, final String phone, final String qualification, final String specialization, final LocalDate joinDate, final BigDecimal salary, final String status, final List<String> subjects, final String avatar, final String tenantId) {
            this.id = id;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.phone = phone;
            this.qualification = qualification;
            this.specialization = specialization;
            this.joinDate = joinDate;
            this.salary = salary;
            this.status = status;
            this.subjects = subjects;
            this.avatar = avatar;
            this.tenantId = tenantId;
        }
    }
}
