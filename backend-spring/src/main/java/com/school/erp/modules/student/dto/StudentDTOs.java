package com.school.erp.modules.student.dto;

import com.school.erp.common.enums.Enums;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class StudentDTOs {

    public static class CreateRequest {
        @NotBlank(message = "First name is required")
        private String firstName;
        @NotBlank(message = "Last name is required")
        private String lastName;
        private String email;
        private String phone;
        private LocalDate dateOfBirth;
        private Enums.Gender gender;
        @NotNull(message = "Class is required")
        private Long classId;
        @NotNull(message = "Section is required")
        private Long sectionId;
        private String rollNumber;
        private String admissionNumber;
        private LocalDate admissionDate;
        private Long parentId;
        private String parentName;
        private String address;
        private String bloodGroup;


        public static class CreateRequestBuilder {
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

            CreateRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder firstName(final String firstName) {
                this.firstName = firstName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder lastName(final String lastName) {
                this.lastName = lastName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder email(final String email) {
                this.email = email;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder dateOfBirth(final LocalDate dateOfBirth) {
                this.dateOfBirth = dateOfBirth;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder gender(final Enums.Gender gender) {
                this.gender = gender;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder sectionId(final Long sectionId) {
                this.sectionId = sectionId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder rollNumber(final String rollNumber) {
                this.rollNumber = rollNumber;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder admissionNumber(final String admissionNumber) {
                this.admissionNumber = admissionNumber;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder admissionDate(final LocalDate admissionDate) {
                this.admissionDate = admissionDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder parentId(final Long parentId) {
                this.parentId = parentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder parentName(final String parentName) {
                this.parentName = parentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder address(final String address) {
                this.address = address;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.CreateRequest.CreateRequestBuilder bloodGroup(final String bloodGroup) {
                this.bloodGroup = bloodGroup;
                return this;
            }

            public StudentDTOs.CreateRequest build() {
                return new StudentDTOs.CreateRequest(this.firstName, this.lastName, this.email, this.phone, this.dateOfBirth, this.gender, this.classId, this.sectionId, this.rollNumber, this.admissionNumber, this.admissionDate, this.parentId, this.parentName, this.address, this.bloodGroup);
            }

            @Override
            public String toString() {
                return "StudentDTOs.CreateRequest.CreateRequestBuilder(firstName=" + this.firstName + ", lastName=" + this.lastName + ", email=" + this.email + ", phone=" + this.phone + ", dateOfBirth=" + this.dateOfBirth + ", gender=" + this.gender + ", classId=" + this.classId + ", sectionId=" + this.sectionId + ", rollNumber=" + this.rollNumber + ", admissionNumber=" + this.admissionNumber + ", admissionDate=" + this.admissionDate + ", parentId=" + this.parentId + ", parentName=" + this.parentName + ", address=" + this.address + ", bloodGroup=" + this.bloodGroup + ")";
            }
        }

        public static StudentDTOs.CreateRequest.CreateRequestBuilder builder() {
            return new StudentDTOs.CreateRequest.CreateRequestBuilder();
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

        public String getAddress() {
            return this.address;
        }

        public String getBloodGroup() {
            return this.bloodGroup;
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

        public void setAddress(final String address) {
            this.address = address;
        }

        public void setBloodGroup(final String bloodGroup) {
            this.bloodGroup = bloodGroup;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof StudentDTOs.CreateRequest)) return false;
            final StudentDTOs.CreateRequest other = (StudentDTOs.CreateRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$sectionId = this.getSectionId();
            final Object other$sectionId = other.getSectionId();
            if (this$sectionId == null ? other$sectionId != null : !this$sectionId.equals(other$sectionId)) return false;
            final Object this$parentId = this.getParentId();
            final Object other$parentId = other.getParentId();
            if (this$parentId == null ? other$parentId != null : !this$parentId.equals(other$parentId)) return false;
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
            final Object this$dateOfBirth = this.getDateOfBirth();
            final Object other$dateOfBirth = other.getDateOfBirth();
            if (this$dateOfBirth == null ? other$dateOfBirth != null : !this$dateOfBirth.equals(other$dateOfBirth)) return false;
            final Object this$gender = this.getGender();
            final Object other$gender = other.getGender();
            if (this$gender == null ? other$gender != null : !this$gender.equals(other$gender)) return false;
            final Object this$rollNumber = this.getRollNumber();
            final Object other$rollNumber = other.getRollNumber();
            if (this$rollNumber == null ? other$rollNumber != null : !this$rollNumber.equals(other$rollNumber)) return false;
            final Object this$admissionNumber = this.getAdmissionNumber();
            final Object other$admissionNumber = other.getAdmissionNumber();
            if (this$admissionNumber == null ? other$admissionNumber != null : !this$admissionNumber.equals(other$admissionNumber)) return false;
            final Object this$admissionDate = this.getAdmissionDate();
            final Object other$admissionDate = other.getAdmissionDate();
            if (this$admissionDate == null ? other$admissionDate != null : !this$admissionDate.equals(other$admissionDate)) return false;
            final Object this$parentName = this.getParentName();
            final Object other$parentName = other.getParentName();
            if (this$parentName == null ? other$parentName != null : !this$parentName.equals(other$parentName)) return false;
            final Object this$address = this.getAddress();
            final Object other$address = other.getAddress();
            if (this$address == null ? other$address != null : !this$address.equals(other$address)) return false;
            final Object this$bloodGroup = this.getBloodGroup();
            final Object other$bloodGroup = other.getBloodGroup();
            if (this$bloodGroup == null ? other$bloodGroup != null : !this$bloodGroup.equals(other$bloodGroup)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof StudentDTOs.CreateRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $sectionId = this.getSectionId();
            result = result * PRIME + ($sectionId == null ? 43 : $sectionId.hashCode());
            final Object $parentId = this.getParentId();
            result = result * PRIME + ($parentId == null ? 43 : $parentId.hashCode());
            final Object $firstName = this.getFirstName();
            result = result * PRIME + ($firstName == null ? 43 : $firstName.hashCode());
            final Object $lastName = this.getLastName();
            result = result * PRIME + ($lastName == null ? 43 : $lastName.hashCode());
            final Object $email = this.getEmail();
            result = result * PRIME + ($email == null ? 43 : $email.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $dateOfBirth = this.getDateOfBirth();
            result = result * PRIME + ($dateOfBirth == null ? 43 : $dateOfBirth.hashCode());
            final Object $gender = this.getGender();
            result = result * PRIME + ($gender == null ? 43 : $gender.hashCode());
            final Object $rollNumber = this.getRollNumber();
            result = result * PRIME + ($rollNumber == null ? 43 : $rollNumber.hashCode());
            final Object $admissionNumber = this.getAdmissionNumber();
            result = result * PRIME + ($admissionNumber == null ? 43 : $admissionNumber.hashCode());
            final Object $admissionDate = this.getAdmissionDate();
            result = result * PRIME + ($admissionDate == null ? 43 : $admissionDate.hashCode());
            final Object $parentName = this.getParentName();
            result = result * PRIME + ($parentName == null ? 43 : $parentName.hashCode());
            final Object $address = this.getAddress();
            result = result * PRIME + ($address == null ? 43 : $address.hashCode());
            final Object $bloodGroup = this.getBloodGroup();
            result = result * PRIME + ($bloodGroup == null ? 43 : $bloodGroup.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "StudentDTOs.CreateRequest(firstName=" + this.getFirstName() + ", lastName=" + this.getLastName() + ", email=" + this.getEmail() + ", phone=" + this.getPhone() + ", dateOfBirth=" + this.getDateOfBirth() + ", gender=" + this.getGender() + ", classId=" + this.getClassId() + ", sectionId=" + this.getSectionId() + ", rollNumber=" + this.getRollNumber() + ", admissionNumber=" + this.getAdmissionNumber() + ", admissionDate=" + this.getAdmissionDate() + ", parentId=" + this.getParentId() + ", parentName=" + this.getParentName() + ", address=" + this.getAddress() + ", bloodGroup=" + this.getBloodGroup() + ")";
        }

        public CreateRequest() {
        }

        public CreateRequest(final String firstName, final String lastName, final String email, final String phone, final LocalDate dateOfBirth, final Enums.Gender gender, final Long classId, final Long sectionId, final String rollNumber, final String admissionNumber, final LocalDate admissionDate, final Long parentId, final String parentName, final String address, final String bloodGroup) {
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
        }
    }


    public static class UpdateRequest {
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private LocalDate dateOfBirth;
        private Enums.Gender gender;
        private Long classId;
        private Long sectionId;
        private String rollNumber;
        private Long parentId;
        private String parentName;
        private String address;
        private String bloodGroup;
        private Enums.StudentStatus status;


        public static class UpdateRequestBuilder {
            private String firstName;
            private String lastName;
            private String email;
            private String phone;
            private LocalDate dateOfBirth;
            private Enums.Gender gender;
            private Long classId;
            private Long sectionId;
            private String rollNumber;
            private Long parentId;
            private String parentName;
            private String address;
            private String bloodGroup;
            private Enums.StudentStatus status;

            UpdateRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder firstName(final String firstName) {
                this.firstName = firstName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder lastName(final String lastName) {
                this.lastName = lastName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder email(final String email) {
                this.email = email;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder dateOfBirth(final LocalDate dateOfBirth) {
                this.dateOfBirth = dateOfBirth;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder gender(final Enums.Gender gender) {
                this.gender = gender;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder sectionId(final Long sectionId) {
                this.sectionId = sectionId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder rollNumber(final String rollNumber) {
                this.rollNumber = rollNumber;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder parentId(final Long parentId) {
                this.parentId = parentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder parentName(final String parentName) {
                this.parentName = parentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder address(final String address) {
                this.address = address;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder bloodGroup(final String bloodGroup) {
                this.bloodGroup = bloodGroup;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.UpdateRequest.UpdateRequestBuilder status(final Enums.StudentStatus status) {
                this.status = status;
                return this;
            }

            public StudentDTOs.UpdateRequest build() {
                return new StudentDTOs.UpdateRequest(this.firstName, this.lastName, this.email, this.phone, this.dateOfBirth, this.gender, this.classId, this.sectionId, this.rollNumber, this.parentId, this.parentName, this.address, this.bloodGroup, this.status);
            }

            @Override
            public String toString() {
                return "StudentDTOs.UpdateRequest.UpdateRequestBuilder(firstName=" + this.firstName + ", lastName=" + this.lastName + ", email=" + this.email + ", phone=" + this.phone + ", dateOfBirth=" + this.dateOfBirth + ", gender=" + this.gender + ", classId=" + this.classId + ", sectionId=" + this.sectionId + ", rollNumber=" + this.rollNumber + ", parentId=" + this.parentId + ", parentName=" + this.parentName + ", address=" + this.address + ", bloodGroup=" + this.bloodGroup + ", status=" + this.status + ")";
            }
        }

        public static StudentDTOs.UpdateRequest.UpdateRequestBuilder builder() {
            return new StudentDTOs.UpdateRequest.UpdateRequestBuilder();
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

        public Long getParentId() {
            return this.parentId;
        }

        public String getParentName() {
            return this.parentName;
        }

        public String getAddress() {
            return this.address;
        }

        public String getBloodGroup() {
            return this.bloodGroup;
        }

        public Enums.StudentStatus getStatus() {
            return this.status;
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

        public void setParentId(final Long parentId) {
            this.parentId = parentId;
        }

        public void setParentName(final String parentName) {
            this.parentName = parentName;
        }

        public void setAddress(final String address) {
            this.address = address;
        }

        public void setBloodGroup(final String bloodGroup) {
            this.bloodGroup = bloodGroup;
        }

        public void setStatus(final Enums.StudentStatus status) {
            this.status = status;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof StudentDTOs.UpdateRequest)) return false;
            final StudentDTOs.UpdateRequest other = (StudentDTOs.UpdateRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$sectionId = this.getSectionId();
            final Object other$sectionId = other.getSectionId();
            if (this$sectionId == null ? other$sectionId != null : !this$sectionId.equals(other$sectionId)) return false;
            final Object this$parentId = this.getParentId();
            final Object other$parentId = other.getParentId();
            if (this$parentId == null ? other$parentId != null : !this$parentId.equals(other$parentId)) return false;
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
            final Object this$dateOfBirth = this.getDateOfBirth();
            final Object other$dateOfBirth = other.getDateOfBirth();
            if (this$dateOfBirth == null ? other$dateOfBirth != null : !this$dateOfBirth.equals(other$dateOfBirth)) return false;
            final Object this$gender = this.getGender();
            final Object other$gender = other.getGender();
            if (this$gender == null ? other$gender != null : !this$gender.equals(other$gender)) return false;
            final Object this$rollNumber = this.getRollNumber();
            final Object other$rollNumber = other.getRollNumber();
            if (this$rollNumber == null ? other$rollNumber != null : !this$rollNumber.equals(other$rollNumber)) return false;
            final Object this$parentName = this.getParentName();
            final Object other$parentName = other.getParentName();
            if (this$parentName == null ? other$parentName != null : !this$parentName.equals(other$parentName)) return false;
            final Object this$address = this.getAddress();
            final Object other$address = other.getAddress();
            if (this$address == null ? other$address != null : !this$address.equals(other$address)) return false;
            final Object this$bloodGroup = this.getBloodGroup();
            final Object other$bloodGroup = other.getBloodGroup();
            if (this$bloodGroup == null ? other$bloodGroup != null : !this$bloodGroup.equals(other$bloodGroup)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof StudentDTOs.UpdateRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $sectionId = this.getSectionId();
            result = result * PRIME + ($sectionId == null ? 43 : $sectionId.hashCode());
            final Object $parentId = this.getParentId();
            result = result * PRIME + ($parentId == null ? 43 : $parentId.hashCode());
            final Object $firstName = this.getFirstName();
            result = result * PRIME + ($firstName == null ? 43 : $firstName.hashCode());
            final Object $lastName = this.getLastName();
            result = result * PRIME + ($lastName == null ? 43 : $lastName.hashCode());
            final Object $email = this.getEmail();
            result = result * PRIME + ($email == null ? 43 : $email.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $dateOfBirth = this.getDateOfBirth();
            result = result * PRIME + ($dateOfBirth == null ? 43 : $dateOfBirth.hashCode());
            final Object $gender = this.getGender();
            result = result * PRIME + ($gender == null ? 43 : $gender.hashCode());
            final Object $rollNumber = this.getRollNumber();
            result = result * PRIME + ($rollNumber == null ? 43 : $rollNumber.hashCode());
            final Object $parentName = this.getParentName();
            result = result * PRIME + ($parentName == null ? 43 : $parentName.hashCode());
            final Object $address = this.getAddress();
            result = result * PRIME + ($address == null ? 43 : $address.hashCode());
            final Object $bloodGroup = this.getBloodGroup();
            result = result * PRIME + ($bloodGroup == null ? 43 : $bloodGroup.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "StudentDTOs.UpdateRequest(firstName=" + this.getFirstName() + ", lastName=" + this.getLastName() + ", email=" + this.getEmail() + ", phone=" + this.getPhone() + ", dateOfBirth=" + this.getDateOfBirth() + ", gender=" + this.getGender() + ", classId=" + this.getClassId() + ", sectionId=" + this.getSectionId() + ", rollNumber=" + this.getRollNumber() + ", parentId=" + this.getParentId() + ", parentName=" + this.getParentName() + ", address=" + this.getAddress() + ", bloodGroup=" + this.getBloodGroup() + ", status=" + this.getStatus() + ")";
        }

        public UpdateRequest() {
        }

        public UpdateRequest(final String firstName, final String lastName, final String email, final String phone, final LocalDate dateOfBirth, final Enums.Gender gender, final Long classId, final Long sectionId, final String rollNumber, final Long parentId, final String parentName, final String address, final String bloodGroup, final Enums.StudentStatus status) {
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.phone = phone;
            this.dateOfBirth = dateOfBirth;
            this.gender = gender;
            this.classId = classId;
            this.sectionId = sectionId;
            this.rollNumber = rollNumber;
            this.parentId = parentId;
            this.parentName = parentName;
            this.address = address;
            this.bloodGroup = bloodGroup;
            this.status = status;
        }
    }


    public static class Response {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private LocalDate dateOfBirth;
        private String gender;
        private Long classId;
        private String className;
        private Long sectionId;
        private String sectionName;
        private String rollNumber;
        private String admissionNumber;
        private LocalDate admissionDate;
        private Long parentId;
        private String parentName;
        private String address;
        private String bloodGroup;
        private String avatar;
        private String status;
        private String tenantId;


        public static class ResponseBuilder {
            private Long id;
            private String firstName;
            private String lastName;
            private String email;
            private String phone;
            private LocalDate dateOfBirth;
            private String gender;
            private Long classId;
            private String className;
            private Long sectionId;
            private String sectionName;
            private String rollNumber;
            private String admissionNumber;
            private LocalDate admissionDate;
            private Long parentId;
            private String parentName;
            private String address;
            private String bloodGroup;
            private String avatar;
            private String status;
            private String tenantId;

            ResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder firstName(final String firstName) {
                this.firstName = firstName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder lastName(final String lastName) {
                this.lastName = lastName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder email(final String email) {
                this.email = email;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder phone(final String phone) {
                this.phone = phone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder dateOfBirth(final LocalDate dateOfBirth) {
                this.dateOfBirth = dateOfBirth;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder gender(final String gender) {
                this.gender = gender;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder className(final String className) {
                this.className = className;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder sectionId(final Long sectionId) {
                this.sectionId = sectionId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder sectionName(final String sectionName) {
                this.sectionName = sectionName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder rollNumber(final String rollNumber) {
                this.rollNumber = rollNumber;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder admissionNumber(final String admissionNumber) {
                this.admissionNumber = admissionNumber;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder admissionDate(final LocalDate admissionDate) {
                this.admissionDate = admissionDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder parentId(final Long parentId) {
                this.parentId = parentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder parentName(final String parentName) {
                this.parentName = parentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder address(final String address) {
                this.address = address;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder bloodGroup(final String bloodGroup) {
                this.bloodGroup = bloodGroup;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder avatar(final String avatar) {
                this.avatar = avatar;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder status(final String status) {
                this.status = status;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.Response.ResponseBuilder tenantId(final String tenantId) {
                this.tenantId = tenantId;
                return this;
            }

            public StudentDTOs.Response build() {
                return new StudentDTOs.Response(this.id, this.firstName, this.lastName, this.email, this.phone, this.dateOfBirth, this.gender, this.classId, this.className, this.sectionId, this.sectionName, this.rollNumber, this.admissionNumber, this.admissionDate, this.parentId, this.parentName, this.address, this.bloodGroup, this.avatar, this.status, this.tenantId);
            }

            @Override
            public String toString() {
                return "StudentDTOs.Response.ResponseBuilder(id=" + this.id + ", firstName=" + this.firstName + ", lastName=" + this.lastName + ", email=" + this.email + ", phone=" + this.phone + ", dateOfBirth=" + this.dateOfBirth + ", gender=" + this.gender + ", classId=" + this.classId + ", className=" + this.className + ", sectionId=" + this.sectionId + ", sectionName=" + this.sectionName + ", rollNumber=" + this.rollNumber + ", admissionNumber=" + this.admissionNumber + ", admissionDate=" + this.admissionDate + ", parentId=" + this.parentId + ", parentName=" + this.parentName + ", address=" + this.address + ", bloodGroup=" + this.bloodGroup + ", avatar=" + this.avatar + ", status=" + this.status + ", tenantId=" + this.tenantId + ")";
            }
        }

        public static StudentDTOs.Response.ResponseBuilder builder() {
            return new StudentDTOs.Response.ResponseBuilder();
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

        public LocalDate getDateOfBirth() {
            return this.dateOfBirth;
        }

        public String getGender() {
            return this.gender;
        }

        public Long getClassId() {
            return this.classId;
        }

        public String getClassName() {
            return this.className;
        }

        public Long getSectionId() {
            return this.sectionId;
        }

        public String getSectionName() {
            return this.sectionName;
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

        public String getAddress() {
            return this.address;
        }

        public String getBloodGroup() {
            return this.bloodGroup;
        }

        public String getAvatar() {
            return this.avatar;
        }

        public String getStatus() {
            return this.status;
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

        public void setDateOfBirth(final LocalDate dateOfBirth) {
            this.dateOfBirth = dateOfBirth;
        }

        public void setGender(final String gender) {
            this.gender = gender;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setClassName(final String className) {
            this.className = className;
        }

        public void setSectionId(final Long sectionId) {
            this.sectionId = sectionId;
        }

        public void setSectionName(final String sectionName) {
            this.sectionName = sectionName;
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

        public void setAddress(final String address) {
            this.address = address;
        }

        public void setBloodGroup(final String bloodGroup) {
            this.bloodGroup = bloodGroup;
        }

        public void setAvatar(final String avatar) {
            this.avatar = avatar;
        }

        public void setStatus(final String status) {
            this.status = status;
        }

        public void setTenantId(final String tenantId) {
            this.tenantId = tenantId;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof StudentDTOs.Response)) return false;
            final StudentDTOs.Response other = (StudentDTOs.Response) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$sectionId = this.getSectionId();
            final Object other$sectionId = other.getSectionId();
            if (this$sectionId == null ? other$sectionId != null : !this$sectionId.equals(other$sectionId)) return false;
            final Object this$parentId = this.getParentId();
            final Object other$parentId = other.getParentId();
            if (this$parentId == null ? other$parentId != null : !this$parentId.equals(other$parentId)) return false;
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
            final Object this$dateOfBirth = this.getDateOfBirth();
            final Object other$dateOfBirth = other.getDateOfBirth();
            if (this$dateOfBirth == null ? other$dateOfBirth != null : !this$dateOfBirth.equals(other$dateOfBirth)) return false;
            final Object this$gender = this.getGender();
            final Object other$gender = other.getGender();
            if (this$gender == null ? other$gender != null : !this$gender.equals(other$gender)) return false;
            final Object this$className = this.getClassName();
            final Object other$className = other.getClassName();
            if (this$className == null ? other$className != null : !this$className.equals(other$className)) return false;
            final Object this$sectionName = this.getSectionName();
            final Object other$sectionName = other.getSectionName();
            if (this$sectionName == null ? other$sectionName != null : !this$sectionName.equals(other$sectionName)) return false;
            final Object this$rollNumber = this.getRollNumber();
            final Object other$rollNumber = other.getRollNumber();
            if (this$rollNumber == null ? other$rollNumber != null : !this$rollNumber.equals(other$rollNumber)) return false;
            final Object this$admissionNumber = this.getAdmissionNumber();
            final Object other$admissionNumber = other.getAdmissionNumber();
            if (this$admissionNumber == null ? other$admissionNumber != null : !this$admissionNumber.equals(other$admissionNumber)) return false;
            final Object this$admissionDate = this.getAdmissionDate();
            final Object other$admissionDate = other.getAdmissionDate();
            if (this$admissionDate == null ? other$admissionDate != null : !this$admissionDate.equals(other$admissionDate)) return false;
            final Object this$parentName = this.getParentName();
            final Object other$parentName = other.getParentName();
            if (this$parentName == null ? other$parentName != null : !this$parentName.equals(other$parentName)) return false;
            final Object this$address = this.getAddress();
            final Object other$address = other.getAddress();
            if (this$address == null ? other$address != null : !this$address.equals(other$address)) return false;
            final Object this$bloodGroup = this.getBloodGroup();
            final Object other$bloodGroup = other.getBloodGroup();
            if (this$bloodGroup == null ? other$bloodGroup != null : !this$bloodGroup.equals(other$bloodGroup)) return false;
            final Object this$avatar = this.getAvatar();
            final Object other$avatar = other.getAvatar();
            if (this$avatar == null ? other$avatar != null : !this$avatar.equals(other$avatar)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            final Object this$tenantId = this.getTenantId();
            final Object other$tenantId = other.getTenantId();
            if (this$tenantId == null ? other$tenantId != null : !this$tenantId.equals(other$tenantId)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof StudentDTOs.Response;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $sectionId = this.getSectionId();
            result = result * PRIME + ($sectionId == null ? 43 : $sectionId.hashCode());
            final Object $parentId = this.getParentId();
            result = result * PRIME + ($parentId == null ? 43 : $parentId.hashCode());
            final Object $firstName = this.getFirstName();
            result = result * PRIME + ($firstName == null ? 43 : $firstName.hashCode());
            final Object $lastName = this.getLastName();
            result = result * PRIME + ($lastName == null ? 43 : $lastName.hashCode());
            final Object $email = this.getEmail();
            result = result * PRIME + ($email == null ? 43 : $email.hashCode());
            final Object $phone = this.getPhone();
            result = result * PRIME + ($phone == null ? 43 : $phone.hashCode());
            final Object $dateOfBirth = this.getDateOfBirth();
            result = result * PRIME + ($dateOfBirth == null ? 43 : $dateOfBirth.hashCode());
            final Object $gender = this.getGender();
            result = result * PRIME + ($gender == null ? 43 : $gender.hashCode());
            final Object $className = this.getClassName();
            result = result * PRIME + ($className == null ? 43 : $className.hashCode());
            final Object $sectionName = this.getSectionName();
            result = result * PRIME + ($sectionName == null ? 43 : $sectionName.hashCode());
            final Object $rollNumber = this.getRollNumber();
            result = result * PRIME + ($rollNumber == null ? 43 : $rollNumber.hashCode());
            final Object $admissionNumber = this.getAdmissionNumber();
            result = result * PRIME + ($admissionNumber == null ? 43 : $admissionNumber.hashCode());
            final Object $admissionDate = this.getAdmissionDate();
            result = result * PRIME + ($admissionDate == null ? 43 : $admissionDate.hashCode());
            final Object $parentName = this.getParentName();
            result = result * PRIME + ($parentName == null ? 43 : $parentName.hashCode());
            final Object $address = this.getAddress();
            result = result * PRIME + ($address == null ? 43 : $address.hashCode());
            final Object $bloodGroup = this.getBloodGroup();
            result = result * PRIME + ($bloodGroup == null ? 43 : $bloodGroup.hashCode());
            final Object $avatar = this.getAvatar();
            result = result * PRIME + ($avatar == null ? 43 : $avatar.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            final Object $tenantId = this.getTenantId();
            result = result * PRIME + ($tenantId == null ? 43 : $tenantId.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "StudentDTOs.Response(id=" + this.getId() + ", firstName=" + this.getFirstName() + ", lastName=" + this.getLastName() + ", email=" + this.getEmail() + ", phone=" + this.getPhone() + ", dateOfBirth=" + this.getDateOfBirth() + ", gender=" + this.getGender() + ", classId=" + this.getClassId() + ", className=" + this.getClassName() + ", sectionId=" + this.getSectionId() + ", sectionName=" + this.getSectionName() + ", rollNumber=" + this.getRollNumber() + ", admissionNumber=" + this.getAdmissionNumber() + ", admissionDate=" + this.getAdmissionDate() + ", parentId=" + this.getParentId() + ", parentName=" + this.getParentName() + ", address=" + this.getAddress() + ", bloodGroup=" + this.getBloodGroup() + ", avatar=" + this.getAvatar() + ", status=" + this.getStatus() + ", tenantId=" + this.getTenantId() + ")";
        }

        public Response() {
        }

        public Response(final Long id, final String firstName, final String lastName, final String email, final String phone, final LocalDate dateOfBirth, final String gender, final Long classId, final String className, final Long sectionId, final String sectionName, final String rollNumber, final String admissionNumber, final LocalDate admissionDate, final Long parentId, final String parentName, final String address, final String bloodGroup, final String avatar, final String status, final String tenantId) {
            this.id = id;
            this.firstName = firstName;
            this.lastName = lastName;
            this.email = email;
            this.phone = phone;
            this.dateOfBirth = dateOfBirth;
            this.gender = gender;
            this.classId = classId;
            this.className = className;
            this.sectionId = sectionId;
            this.sectionName = sectionName;
            this.rollNumber = rollNumber;
            this.admissionNumber = admissionNumber;
            this.admissionDate = admissionDate;
            this.parentId = parentId;
            this.parentName = parentName;
            this.address = address;
            this.bloodGroup = bloodGroup;
            this.avatar = avatar;
            this.status = status;
            this.tenantId = tenantId;
        }
    }


    public static class BulkUploadRequest {
        private java.util.List<CreateRequest> students;


        public static class BulkUploadRequestBuilder {
            private java.util.List<CreateRequest> students;

            BulkUploadRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.BulkUploadRequest.BulkUploadRequestBuilder students(final java.util.List<CreateRequest> students) {
                this.students = students;
                return this;
            }

            public StudentDTOs.BulkUploadRequest build() {
                return new StudentDTOs.BulkUploadRequest(this.students);
            }

            @Override
            public String toString() {
                return "StudentDTOs.BulkUploadRequest.BulkUploadRequestBuilder(students=" + this.students + ")";
            }
        }

        public static StudentDTOs.BulkUploadRequest.BulkUploadRequestBuilder builder() {
            return new StudentDTOs.BulkUploadRequest.BulkUploadRequestBuilder();
        }

        public java.util.List<CreateRequest> getStudents() {
            return this.students;
        }

        public void setStudents(final java.util.List<CreateRequest> students) {
            this.students = students;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof StudentDTOs.BulkUploadRequest)) return false;
            final StudentDTOs.BulkUploadRequest other = (StudentDTOs.BulkUploadRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$students = this.getStudents();
            final Object other$students = other.getStudents();
            if (this$students == null ? other$students != null : !this$students.equals(other$students)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof StudentDTOs.BulkUploadRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $students = this.getStudents();
            result = result * PRIME + ($students == null ? 43 : $students.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "StudentDTOs.BulkUploadRequest(students=" + this.getStudents() + ")";
        }

        public BulkUploadRequest() {
        }

        public BulkUploadRequest(final java.util.List<CreateRequest> students) {
            this.students = students;
        }
    }


    public static class PromotionRequest {
        @NotNull
        private Long fromClassId;
        @NotNull
        private Long toClassId;
        private java.util.List<Long> studentIds;


        public static class PromotionRequestBuilder {
            private Long fromClassId;
            private Long toClassId;
            private java.util.List<Long> studentIds;

            PromotionRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.PromotionRequest.PromotionRequestBuilder fromClassId(final Long fromClassId) {
                this.fromClassId = fromClassId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.PromotionRequest.PromotionRequestBuilder toClassId(final Long toClassId) {
                this.toClassId = toClassId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public StudentDTOs.PromotionRequest.PromotionRequestBuilder studentIds(final java.util.List<Long> studentIds) {
                this.studentIds = studentIds;
                return this;
            }

            public StudentDTOs.PromotionRequest build() {
                return new StudentDTOs.PromotionRequest(this.fromClassId, this.toClassId, this.studentIds);
            }

            @Override
            public String toString() {
                return "StudentDTOs.PromotionRequest.PromotionRequestBuilder(fromClassId=" + this.fromClassId + ", toClassId=" + this.toClassId + ", studentIds=" + this.studentIds + ")";
            }
        }

        public static StudentDTOs.PromotionRequest.PromotionRequestBuilder builder() {
            return new StudentDTOs.PromotionRequest.PromotionRequestBuilder();
        }

        public Long getFromClassId() {
            return this.fromClassId;
        }

        public Long getToClassId() {
            return this.toClassId;
        }

        public java.util.List<Long> getStudentIds() {
            return this.studentIds;
        }

        public void setFromClassId(final Long fromClassId) {
            this.fromClassId = fromClassId;
        }

        public void setToClassId(final Long toClassId) {
            this.toClassId = toClassId;
        }

        public void setStudentIds(final java.util.List<Long> studentIds) {
            this.studentIds = studentIds;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof StudentDTOs.PromotionRequest)) return false;
            final StudentDTOs.PromotionRequest other = (StudentDTOs.PromotionRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$fromClassId = this.getFromClassId();
            final Object other$fromClassId = other.getFromClassId();
            if (this$fromClassId == null ? other$fromClassId != null : !this$fromClassId.equals(other$fromClassId)) return false;
            final Object this$toClassId = this.getToClassId();
            final Object other$toClassId = other.getToClassId();
            if (this$toClassId == null ? other$toClassId != null : !this$toClassId.equals(other$toClassId)) return false;
            final Object this$studentIds = this.getStudentIds();
            final Object other$studentIds = other.getStudentIds();
            if (this$studentIds == null ? other$studentIds != null : !this$studentIds.equals(other$studentIds)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof StudentDTOs.PromotionRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $fromClassId = this.getFromClassId();
            result = result * PRIME + ($fromClassId == null ? 43 : $fromClassId.hashCode());
            final Object $toClassId = this.getToClassId();
            result = result * PRIME + ($toClassId == null ? 43 : $toClassId.hashCode());
            final Object $studentIds = this.getStudentIds();
            result = result * PRIME + ($studentIds == null ? 43 : $studentIds.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "StudentDTOs.PromotionRequest(fromClassId=" + this.getFromClassId() + ", toClassId=" + this.getToClassId() + ", studentIds=" + this.getStudentIds() + ")";
        }

        public PromotionRequest() {
        }

        public PromotionRequest(final Long fromClassId, final Long toClassId, final java.util.List<Long> studentIds) {
            this.fromClassId = fromClassId;
            this.toClassId = toClassId;
            this.studentIds = studentIds;
        }
    }
}
