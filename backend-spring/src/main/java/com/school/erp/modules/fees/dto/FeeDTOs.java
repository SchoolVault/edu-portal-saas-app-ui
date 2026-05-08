package com.school.erp.modules.fees.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class FeeDTOs {

    public static class CreateFeeStructureRequest {
        @NotBlank
        private String name;
        @NotNull
        private Long classId;
        private String className;
        private Long academicYearId;
        @NotNull
        private List<FeeComponentDTO> components;


        public static class CreateFeeStructureRequestBuilder {
            private String name;
            private Long classId;
            private String className;
            private Long academicYearId;
            private List<FeeComponentDTO> components;

            CreateFeeStructureRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.CreateFeeStructureRequest.CreateFeeStructureRequestBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.CreateFeeStructureRequest.CreateFeeStructureRequestBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.CreateFeeStructureRequest.CreateFeeStructureRequestBuilder className(final String className) {
                this.className = className;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.CreateFeeStructureRequest.CreateFeeStructureRequestBuilder academicYearId(final Long academicYearId) {
                this.academicYearId = academicYearId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.CreateFeeStructureRequest.CreateFeeStructureRequestBuilder components(final List<FeeComponentDTO> components) {
                this.components = components;
                return this;
            }

            public FeeDTOs.CreateFeeStructureRequest build() {
                return new FeeDTOs.CreateFeeStructureRequest(this.name, this.classId, this.className, this.academicYearId, this.components);
            }

            @Override
            public String toString() {
                return "FeeDTOs.CreateFeeStructureRequest.CreateFeeStructureRequestBuilder(name=" + this.name + ", classId=" + this.classId + ", className=" + this.className + ", academicYearId=" + this.academicYearId + ", components=" + this.components + ")";
            }
        }

        public static FeeDTOs.CreateFeeStructureRequest.CreateFeeStructureRequestBuilder builder() {
            return new FeeDTOs.CreateFeeStructureRequest.CreateFeeStructureRequestBuilder();
        }

        public String getName() {
            return this.name;
        }

        public Long getClassId() {
            return this.classId;
        }

        public String getClassName() {
            return this.className;
        }

        public Long getAcademicYearId() {
            return this.academicYearId;
        }

        public List<FeeComponentDTO> getComponents() {
            return this.components;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setClassId(final Long classId) {
            this.classId = classId;
        }

        public void setClassName(final String className) {
            this.className = className;
        }

        public void setAcademicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public void setComponents(final List<FeeComponentDTO> components) {
            this.components = components;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof FeeDTOs.CreateFeeStructureRequest)) return false;
            final FeeDTOs.CreateFeeStructureRequest other = (FeeDTOs.CreateFeeStructureRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$academicYearId = this.getAcademicYearId();
            final Object other$academicYearId = other.getAcademicYearId();
            if (this$academicYearId == null ? other$academicYearId != null : !this$academicYearId.equals(other$academicYearId)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$className = this.getClassName();
            final Object other$className = other.getClassName();
            if (this$className == null ? other$className != null : !this$className.equals(other$className)) return false;
            final Object this$components = this.getComponents();
            final Object other$components = other.getComponents();
            if (this$components == null ? other$components != null : !this$components.equals(other$components)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof FeeDTOs.CreateFeeStructureRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $academicYearId = this.getAcademicYearId();
            result = result * PRIME + ($academicYearId == null ? 43 : $academicYearId.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $className = this.getClassName();
            result = result * PRIME + ($className == null ? 43 : $className.hashCode());
            final Object $components = this.getComponents();
            result = result * PRIME + ($components == null ? 43 : $components.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "FeeDTOs.CreateFeeStructureRequest(name=" + this.getName() + ", classId=" + this.getClassId() + ", className=" + this.getClassName() + ", academicYearId=" + this.getAcademicYearId() + ", components=" + this.getComponents() + ")";
        }

        public CreateFeeStructureRequest() {
        }

        public CreateFeeStructureRequest(final String name, final Long classId, final String className, final Long academicYearId, final List<FeeComponentDTO> components) {
            this.name = name;
            this.classId = classId;
            this.className = className;
            this.academicYearId = academicYearId;
            this.components = components;
        }
    }


    public static class FeeComponentDTO {
        private Long id;
        @NotBlank
        private String name;
        @NotNull
        private BigDecimal amount;
        private String type; // TUITION, TRANSPORT, LIBRARY, LAB, SPORTS, MISC


        public static class FeeComponentDTOBuilder {
            private Long id;
            private String name;
            private BigDecimal amount;
            private String type;

            FeeComponentDTOBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeComponentDTO.FeeComponentDTOBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeComponentDTO.FeeComponentDTOBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeComponentDTO.FeeComponentDTOBuilder amount(final BigDecimal amount) {
                this.amount = amount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeComponentDTO.FeeComponentDTOBuilder type(final String type) {
                this.type = type;
                return this;
            }

            public FeeDTOs.FeeComponentDTO build() {
                return new FeeDTOs.FeeComponentDTO(this.id, this.name, this.amount, this.type);
            }

            @Override
            public String toString() {
                return "FeeDTOs.FeeComponentDTO.FeeComponentDTOBuilder(id=" + this.id + ", name=" + this.name + ", amount=" + this.amount + ", type=" + this.type + ")";
            }
        }

        public static FeeDTOs.FeeComponentDTO.FeeComponentDTOBuilder builder() {
            return new FeeDTOs.FeeComponentDTO.FeeComponentDTOBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public String getName() {
            return this.name;
        }

        public BigDecimal getAmount() {
            return this.amount;
        }

        public String getType() {
            return this.type;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setAmount(final BigDecimal amount) {
            this.amount = amount;
        }

        public void setType(final String type) {
            this.type = type;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof FeeDTOs.FeeComponentDTO)) return false;
            final FeeDTOs.FeeComponentDTO other = (FeeDTOs.FeeComponentDTO) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$amount = this.getAmount();
            final Object other$amount = other.getAmount();
            if (this$amount == null ? other$amount != null : !this$amount.equals(other$amount)) return false;
            final Object this$type = this.getType();
            final Object other$type = other.getType();
            if (this$type == null ? other$type != null : !this$type.equals(other$type)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof FeeDTOs.FeeComponentDTO;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $amount = this.getAmount();
            result = result * PRIME + ($amount == null ? 43 : $amount.hashCode());
            final Object $type = this.getType();
            result = result * PRIME + ($type == null ? 43 : $type.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "FeeDTOs.FeeComponentDTO(id=" + this.getId() + ", name=" + this.getName() + ", amount=" + this.getAmount() + ", type=" + this.getType() + ")";
        }

        public FeeComponentDTO() {
        }

        public FeeComponentDTO(final Long id, final String name, final BigDecimal amount, final String type) {
            this.id = id;
            this.name = name;
            this.amount = amount;
            this.type = type;
        }
    }


    public static class FeeStructureResponse {
        private Long id;
        private String name;
        private Long classId;
        private String className;
        private Long academicYearId;
        private BigDecimal totalAmount;
        private List<FeeComponentDTO> components;


        public static class FeeStructureResponseBuilder {
            private Long id;
            private String name;
            private Long classId;
            private String className;
            private Long academicYearId;
            private BigDecimal totalAmount;
            private List<FeeComponentDTO> components;

            FeeStructureResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder classId(final Long classId) {
                this.classId = classId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder className(final String className) {
                this.className = className;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder academicYearId(final Long academicYearId) {
                this.academicYearId = academicYearId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder totalAmount(final BigDecimal totalAmount) {
                this.totalAmount = totalAmount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder components(final List<FeeComponentDTO> components) {
                this.components = components;
                return this;
            }

            public FeeDTOs.FeeStructureResponse build() {
                return new FeeDTOs.FeeStructureResponse(this.id, this.name, this.classId, this.className, this.academicYearId, this.totalAmount, this.components);
            }

            @Override
            public String toString() {
                return "FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder(id=" + this.id + ", name=" + this.name + ", classId=" + this.classId + ", className=" + this.className + ", academicYearId=" + this.academicYearId + ", totalAmount=" + this.totalAmount + ", components=" + this.components + ")";
            }
        }

        public static FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder builder() {
            return new FeeDTOs.FeeStructureResponse.FeeStructureResponseBuilder();
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

        public String getClassName() {
            return this.className;
        }

        public Long getAcademicYearId() {
            return this.academicYearId;
        }

        public BigDecimal getTotalAmount() {
            return this.totalAmount;
        }

        public List<FeeComponentDTO> getComponents() {
            return this.components;
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

        public void setClassName(final String className) {
            this.className = className;
        }

        public void setAcademicYearId(final Long academicYearId) {
            this.academicYearId = academicYearId;
        }

        public void setTotalAmount(final BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
        }

        public void setComponents(final List<FeeComponentDTO> components) {
            this.components = components;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof FeeDTOs.FeeStructureResponse)) return false;
            final FeeDTOs.FeeStructureResponse other = (FeeDTOs.FeeStructureResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$classId = this.getClassId();
            final Object other$classId = other.getClassId();
            if (this$classId == null ? other$classId != null : !this$classId.equals(other$classId)) return false;
            final Object this$academicYearId = this.getAcademicYearId();
            final Object other$academicYearId = other.getAcademicYearId();
            if (this$academicYearId == null ? other$academicYearId != null : !this$academicYearId.equals(other$academicYearId)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$className = this.getClassName();
            final Object other$className = other.getClassName();
            if (this$className == null ? other$className != null : !this$className.equals(other$className)) return false;
            final Object this$totalAmount = this.getTotalAmount();
            final Object other$totalAmount = other.getTotalAmount();
            if (this$totalAmount == null ? other$totalAmount != null : !this$totalAmount.equals(other$totalAmount)) return false;
            final Object this$components = this.getComponents();
            final Object other$components = other.getComponents();
            if (this$components == null ? other$components != null : !this$components.equals(other$components)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof FeeDTOs.FeeStructureResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $classId = this.getClassId();
            result = result * PRIME + ($classId == null ? 43 : $classId.hashCode());
            final Object $academicYearId = this.getAcademicYearId();
            result = result * PRIME + ($academicYearId == null ? 43 : $academicYearId.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $className = this.getClassName();
            result = result * PRIME + ($className == null ? 43 : $className.hashCode());
            final Object $totalAmount = this.getTotalAmount();
            result = result * PRIME + ($totalAmount == null ? 43 : $totalAmount.hashCode());
            final Object $components = this.getComponents();
            result = result * PRIME + ($components == null ? 43 : $components.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "FeeDTOs.FeeStructureResponse(id=" + this.getId() + ", name=" + this.getName() + ", classId=" + this.getClassId() + ", className=" + this.getClassName() + ", academicYearId=" + this.getAcademicYearId() + ", totalAmount=" + this.getTotalAmount() + ", components=" + this.getComponents() + ")";
        }

        public FeeStructureResponse() {
        }

        public FeeStructureResponse(final Long id, final String name, final Long classId, final String className, final Long academicYearId, final BigDecimal totalAmount, final List<FeeComponentDTO> components) {
            this.id = id;
            this.name = name;
            this.classId = classId;
            this.className = className;
            this.academicYearId = academicYearId;
            this.totalAmount = totalAmount;
            this.components = components;
        }
    }


    public static class RecordPaymentRequest {
        private Long paymentId; // null for new payment
        @NotNull
        private Long studentId;
        private String studentName;
        private Long feeStructureId;
        private BigDecimal totalAmount; // required for new payment
        @NotNull
        private BigDecimal paymentAmount;
        private LocalDate dueDate;
        private BigDecimal discount;
        private String paymentMethod; // CASH, ONLINE, CHEQUE, UPI


        public static class RecordPaymentRequestBuilder {
            private Long paymentId;
            private Long studentId;
            private String studentName;
            private Long feeStructureId;
            private BigDecimal totalAmount;
            private BigDecimal paymentAmount;
            private LocalDate dueDate;
            private BigDecimal discount;
            private String paymentMethod;

            RecordPaymentRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder paymentId(final Long paymentId) {
                this.paymentId = paymentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder feeStructureId(final Long feeStructureId) {
                this.feeStructureId = feeStructureId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder totalAmount(final BigDecimal totalAmount) {
                this.totalAmount = totalAmount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder paymentAmount(final BigDecimal paymentAmount) {
                this.paymentAmount = paymentAmount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder dueDate(final LocalDate dueDate) {
                this.dueDate = dueDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder discount(final BigDecimal discount) {
                this.discount = discount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder paymentMethod(final String paymentMethod) {
                this.paymentMethod = paymentMethod;
                return this;
            }

            public FeeDTOs.RecordPaymentRequest build() {
                return new FeeDTOs.RecordPaymentRequest(this.paymentId, this.studentId, this.studentName, this.feeStructureId, this.totalAmount, this.paymentAmount, this.dueDate, this.discount, this.paymentMethod);
            }

            @Override
            public String toString() {
                return "FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder(paymentId=" + this.paymentId + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", feeStructureId=" + this.feeStructureId + ", totalAmount=" + this.totalAmount + ", paymentAmount=" + this.paymentAmount + ", dueDate=" + this.dueDate + ", discount=" + this.discount + ", paymentMethod=" + this.paymentMethod + ")";
            }
        }

        public static FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder builder() {
            return new FeeDTOs.RecordPaymentRequest.RecordPaymentRequestBuilder();
        }

        public Long getPaymentId() {
            return this.paymentId;
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public Long getFeeStructureId() {
            return this.feeStructureId;
        }

        public BigDecimal getTotalAmount() {
            return this.totalAmount;
        }

        public BigDecimal getPaymentAmount() {
            return this.paymentAmount;
        }

        public LocalDate getDueDate() {
            return this.dueDate;
        }

        public BigDecimal getDiscount() {
            return this.discount;
        }

        public String getPaymentMethod() {
            return this.paymentMethod;
        }

        public void setPaymentId(final Long paymentId) {
            this.paymentId = paymentId;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setFeeStructureId(final Long feeStructureId) {
            this.feeStructureId = feeStructureId;
        }

        public void setTotalAmount(final BigDecimal totalAmount) {
            this.totalAmount = totalAmount;
        }

        public void setPaymentAmount(final BigDecimal paymentAmount) {
            this.paymentAmount = paymentAmount;
        }

        public void setDueDate(final LocalDate dueDate) {
            this.dueDate = dueDate;
        }

        public void setDiscount(final BigDecimal discount) {
            this.discount = discount;
        }

        public void setPaymentMethod(final String paymentMethod) {
            this.paymentMethod = paymentMethod;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof FeeDTOs.RecordPaymentRequest)) return false;
            final FeeDTOs.RecordPaymentRequest other = (FeeDTOs.RecordPaymentRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$paymentId = this.getPaymentId();
            final Object other$paymentId = other.getPaymentId();
            if (this$paymentId == null ? other$paymentId != null : !this$paymentId.equals(other$paymentId)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$feeStructureId = this.getFeeStructureId();
            final Object other$feeStructureId = other.getFeeStructureId();
            if (this$feeStructureId == null ? other$feeStructureId != null : !this$feeStructureId.equals(other$feeStructureId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$totalAmount = this.getTotalAmount();
            final Object other$totalAmount = other.getTotalAmount();
            if (this$totalAmount == null ? other$totalAmount != null : !this$totalAmount.equals(other$totalAmount)) return false;
            final Object this$paymentAmount = this.getPaymentAmount();
            final Object other$paymentAmount = other.getPaymentAmount();
            if (this$paymentAmount == null ? other$paymentAmount != null : !this$paymentAmount.equals(other$paymentAmount)) return false;
            final Object this$dueDate = this.getDueDate();
            final Object other$dueDate = other.getDueDate();
            if (this$dueDate == null ? other$dueDate != null : !this$dueDate.equals(other$dueDate)) return false;
            final Object this$discount = this.getDiscount();
            final Object other$discount = other.getDiscount();
            if (this$discount == null ? other$discount != null : !this$discount.equals(other$discount)) return false;
            final Object this$paymentMethod = this.getPaymentMethod();
            final Object other$paymentMethod = other.getPaymentMethod();
            if (this$paymentMethod == null ? other$paymentMethod != null : !this$paymentMethod.equals(other$paymentMethod)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof FeeDTOs.RecordPaymentRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $paymentId = this.getPaymentId();
            result = result * PRIME + ($paymentId == null ? 43 : $paymentId.hashCode());
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $feeStructureId = this.getFeeStructureId();
            result = result * PRIME + ($feeStructureId == null ? 43 : $feeStructureId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $totalAmount = this.getTotalAmount();
            result = result * PRIME + ($totalAmount == null ? 43 : $totalAmount.hashCode());
            final Object $paymentAmount = this.getPaymentAmount();
            result = result * PRIME + ($paymentAmount == null ? 43 : $paymentAmount.hashCode());
            final Object $dueDate = this.getDueDate();
            result = result * PRIME + ($dueDate == null ? 43 : $dueDate.hashCode());
            final Object $discount = this.getDiscount();
            result = result * PRIME + ($discount == null ? 43 : $discount.hashCode());
            final Object $paymentMethod = this.getPaymentMethod();
            result = result * PRIME + ($paymentMethod == null ? 43 : $paymentMethod.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "FeeDTOs.RecordPaymentRequest(paymentId=" + this.getPaymentId() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", feeStructureId=" + this.getFeeStructureId() + ", totalAmount=" + this.getTotalAmount() + ", paymentAmount=" + this.getPaymentAmount() + ", dueDate=" + this.getDueDate() + ", discount=" + this.getDiscount() + ", paymentMethod=" + this.getPaymentMethod() + ")";
        }

        public RecordPaymentRequest() {
        }

        public RecordPaymentRequest(final Long paymentId, final Long studentId, final String studentName, final Long feeStructureId, final BigDecimal totalAmount, final BigDecimal paymentAmount, final LocalDate dueDate, final BigDecimal discount, final String paymentMethod) {
            this.paymentId = paymentId;
            this.studentId = studentId;
            this.studentName = studentName;
            this.feeStructureId = feeStructureId;
            this.totalAmount = totalAmount;
            this.paymentAmount = paymentAmount;
            this.dueDate = dueDate;
            this.discount = discount;
            this.paymentMethod = paymentMethod;
        }
    }


    public static class FeePaymentResponse {
        private Long id;
        private Long studentId;
        private String studentName;
        private Long feeStructureId;
        private BigDecimal amount;
        private BigDecimal paidAmount;
        private BigDecimal dueAmount;
        private String status;
        private LocalDate paymentDate;
        private LocalDate dueDate;
        private BigDecimal discount;
        private BigDecimal lateFee;
        private String receiptNumber;
        private String paymentMethod;


        public static class FeePaymentResponseBuilder {
            private Long id;
            private Long studentId;
            private String studentName;
            private Long feeStructureId;
            private BigDecimal amount;
            private BigDecimal paidAmount;
            private BigDecimal dueAmount;
            private String status;
            private LocalDate paymentDate;
            private LocalDate dueDate;
            private BigDecimal discount;
            private BigDecimal lateFee;
            private String receiptNumber;
            private String paymentMethod;

            FeePaymentResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder feeStructureId(final Long feeStructureId) {
                this.feeStructureId = feeStructureId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder amount(final BigDecimal amount) {
                this.amount = amount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder paidAmount(final BigDecimal paidAmount) {
                this.paidAmount = paidAmount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder dueAmount(final BigDecimal dueAmount) {
                this.dueAmount = dueAmount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder status(final String status) {
                this.status = status;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder paymentDate(final LocalDate paymentDate) {
                this.paymentDate = paymentDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder dueDate(final LocalDate dueDate) {
                this.dueDate = dueDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder discount(final BigDecimal discount) {
                this.discount = discount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder lateFee(final BigDecimal lateFee) {
                this.lateFee = lateFee;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder receiptNumber(final String receiptNumber) {
                this.receiptNumber = receiptNumber;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder paymentMethod(final String paymentMethod) {
                this.paymentMethod = paymentMethod;
                return this;
            }

            public FeeDTOs.FeePaymentResponse build() {
                return new FeeDTOs.FeePaymentResponse(this.id, this.studentId, this.studentName, this.feeStructureId, this.amount, this.paidAmount, this.dueAmount, this.status, this.paymentDate, this.dueDate, this.discount, this.lateFee, this.receiptNumber, this.paymentMethod);
            }

            @Override
            public String toString() {
                return "FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder(id=" + this.id + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", feeStructureId=" + this.feeStructureId + ", amount=" + this.amount + ", paidAmount=" + this.paidAmount + ", dueAmount=" + this.dueAmount + ", status=" + this.status + ", paymentDate=" + this.paymentDate + ", dueDate=" + this.dueDate + ", discount=" + this.discount + ", lateFee=" + this.lateFee + ", receiptNumber=" + this.receiptNumber + ", paymentMethod=" + this.paymentMethod + ")";
            }
        }

        public static FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder builder() {
            return new FeeDTOs.FeePaymentResponse.FeePaymentResponseBuilder();
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

        public Long getFeeStructureId() {
            return this.feeStructureId;
        }

        public BigDecimal getAmount() {
            return this.amount;
        }

        public BigDecimal getPaidAmount() {
            return this.paidAmount;
        }

        public BigDecimal getDueAmount() {
            return this.dueAmount;
        }

        public String getStatus() {
            return this.status;
        }

        public LocalDate getPaymentDate() {
            return this.paymentDate;
        }

        public LocalDate getDueDate() {
            return this.dueDate;
        }

        public BigDecimal getDiscount() {
            return this.discount;
        }

        public BigDecimal getLateFee() {
            return this.lateFee;
        }

        public String getReceiptNumber() {
            return this.receiptNumber;
        }

        public String getPaymentMethod() {
            return this.paymentMethod;
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

        public void setFeeStructureId(final Long feeStructureId) {
            this.feeStructureId = feeStructureId;
        }

        public void setAmount(final BigDecimal amount) {
            this.amount = amount;
        }

        public void setPaidAmount(final BigDecimal paidAmount) {
            this.paidAmount = paidAmount;
        }

        public void setDueAmount(final BigDecimal dueAmount) {
            this.dueAmount = dueAmount;
        }

        public void setStatus(final String status) {
            this.status = status;
        }

        public void setPaymentDate(final LocalDate paymentDate) {
            this.paymentDate = paymentDate;
        }

        public void setDueDate(final LocalDate dueDate) {
            this.dueDate = dueDate;
        }

        public void setDiscount(final BigDecimal discount) {
            this.discount = discount;
        }

        public void setLateFee(final BigDecimal lateFee) {
            this.lateFee = lateFee;
        }

        public void setReceiptNumber(final String receiptNumber) {
            this.receiptNumber = receiptNumber;
        }

        public void setPaymentMethod(final String paymentMethod) {
            this.paymentMethod = paymentMethod;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof FeeDTOs.FeePaymentResponse)) return false;
            final FeeDTOs.FeePaymentResponse other = (FeeDTOs.FeePaymentResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$feeStructureId = this.getFeeStructureId();
            final Object other$feeStructureId = other.getFeeStructureId();
            if (this$feeStructureId == null ? other$feeStructureId != null : !this$feeStructureId.equals(other$feeStructureId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$amount = this.getAmount();
            final Object other$amount = other.getAmount();
            if (this$amount == null ? other$amount != null : !this$amount.equals(other$amount)) return false;
            final Object this$paidAmount = this.getPaidAmount();
            final Object other$paidAmount = other.getPaidAmount();
            if (this$paidAmount == null ? other$paidAmount != null : !this$paidAmount.equals(other$paidAmount)) return false;
            final Object this$dueAmount = this.getDueAmount();
            final Object other$dueAmount = other.getDueAmount();
            if (this$dueAmount == null ? other$dueAmount != null : !this$dueAmount.equals(other$dueAmount)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            final Object this$paymentDate = this.getPaymentDate();
            final Object other$paymentDate = other.getPaymentDate();
            if (this$paymentDate == null ? other$paymentDate != null : !this$paymentDate.equals(other$paymentDate)) return false;
            final Object this$dueDate = this.getDueDate();
            final Object other$dueDate = other.getDueDate();
            if (this$dueDate == null ? other$dueDate != null : !this$dueDate.equals(other$dueDate)) return false;
            final Object this$discount = this.getDiscount();
            final Object other$discount = other.getDiscount();
            if (this$discount == null ? other$discount != null : !this$discount.equals(other$discount)) return false;
            final Object this$lateFee = this.getLateFee();
            final Object other$lateFee = other.getLateFee();
            if (this$lateFee == null ? other$lateFee != null : !this$lateFee.equals(other$lateFee)) return false;
            final Object this$receiptNumber = this.getReceiptNumber();
            final Object other$receiptNumber = other.getReceiptNumber();
            if (this$receiptNumber == null ? other$receiptNumber != null : !this$receiptNumber.equals(other$receiptNumber)) return false;
            final Object this$paymentMethod = this.getPaymentMethod();
            final Object other$paymentMethod = other.getPaymentMethod();
            if (this$paymentMethod == null ? other$paymentMethod != null : !this$paymentMethod.equals(other$paymentMethod)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof FeeDTOs.FeePaymentResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $feeStructureId = this.getFeeStructureId();
            result = result * PRIME + ($feeStructureId == null ? 43 : $feeStructureId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $amount = this.getAmount();
            result = result * PRIME + ($amount == null ? 43 : $amount.hashCode());
            final Object $paidAmount = this.getPaidAmount();
            result = result * PRIME + ($paidAmount == null ? 43 : $paidAmount.hashCode());
            final Object $dueAmount = this.getDueAmount();
            result = result * PRIME + ($dueAmount == null ? 43 : $dueAmount.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            final Object $paymentDate = this.getPaymentDate();
            result = result * PRIME + ($paymentDate == null ? 43 : $paymentDate.hashCode());
            final Object $dueDate = this.getDueDate();
            result = result * PRIME + ($dueDate == null ? 43 : $dueDate.hashCode());
            final Object $discount = this.getDiscount();
            result = result * PRIME + ($discount == null ? 43 : $discount.hashCode());
            final Object $lateFee = this.getLateFee();
            result = result * PRIME + ($lateFee == null ? 43 : $lateFee.hashCode());
            final Object $receiptNumber = this.getReceiptNumber();
            result = result * PRIME + ($receiptNumber == null ? 43 : $receiptNumber.hashCode());
            final Object $paymentMethod = this.getPaymentMethod();
            result = result * PRIME + ($paymentMethod == null ? 43 : $paymentMethod.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "FeeDTOs.FeePaymentResponse(id=" + this.getId() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", feeStructureId=" + this.getFeeStructureId() + ", amount=" + this.getAmount() + ", paidAmount=" + this.getPaidAmount() + ", dueAmount=" + this.getDueAmount() + ", status=" + this.getStatus() + ", paymentDate=" + this.getPaymentDate() + ", dueDate=" + this.getDueDate() + ", discount=" + this.getDiscount() + ", lateFee=" + this.getLateFee() + ", receiptNumber=" + this.getReceiptNumber() + ", paymentMethod=" + this.getPaymentMethod() + ")";
        }

        public FeePaymentResponse() {
        }

        public FeePaymentResponse(final Long id, final Long studentId, final String studentName, final Long feeStructureId, final BigDecimal amount, final BigDecimal paidAmount, final BigDecimal dueAmount, final String status, final LocalDate paymentDate, final LocalDate dueDate, final BigDecimal discount, final BigDecimal lateFee, final String receiptNumber, final String paymentMethod) {
            this.id = id;
            this.studentId = studentId;
            this.studentName = studentName;
            this.feeStructureId = feeStructureId;
            this.amount = amount;
            this.paidAmount = paidAmount;
            this.dueAmount = dueAmount;
            this.status = status;
            this.paymentDate = paymentDate;
            this.dueDate = dueDate;
            this.discount = discount;
            this.lateFee = lateFee;
            this.receiptNumber = receiptNumber;
            this.paymentMethod = paymentMethod;
        }
    }


    public static class FeeCollectionSummary {
        private BigDecimal totalCollected;
        private BigDecimal totalPending;
        private long totalStudents;
        private long overdueCount;
        private double collectionRate;


        public static class FeeCollectionSummaryBuilder {
            private BigDecimal totalCollected;
            private BigDecimal totalPending;
            private long totalStudents;
            private long overdueCount;
            private double collectionRate;

            FeeCollectionSummaryBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeCollectionSummary.FeeCollectionSummaryBuilder totalCollected(final BigDecimal totalCollected) {
                this.totalCollected = totalCollected;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeCollectionSummary.FeeCollectionSummaryBuilder totalPending(final BigDecimal totalPending) {
                this.totalPending = totalPending;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeCollectionSummary.FeeCollectionSummaryBuilder totalStudents(final long totalStudents) {
                this.totalStudents = totalStudents;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeCollectionSummary.FeeCollectionSummaryBuilder overdueCount(final long overdueCount) {
                this.overdueCount = overdueCount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public FeeDTOs.FeeCollectionSummary.FeeCollectionSummaryBuilder collectionRate(final double collectionRate) {
                this.collectionRate = collectionRate;
                return this;
            }

            public FeeDTOs.FeeCollectionSummary build() {
                return new FeeDTOs.FeeCollectionSummary(this.totalCollected, this.totalPending, this.totalStudents, this.overdueCount, this.collectionRate);
            }

            @Override
            public String toString() {
                return "FeeDTOs.FeeCollectionSummary.FeeCollectionSummaryBuilder(totalCollected=" + this.totalCollected + ", totalPending=" + this.totalPending + ", totalStudents=" + this.totalStudents + ", overdueCount=" + this.overdueCount + ", collectionRate=" + this.collectionRate + ")";
            }
        }

        public static FeeDTOs.FeeCollectionSummary.FeeCollectionSummaryBuilder builder() {
            return new FeeDTOs.FeeCollectionSummary.FeeCollectionSummaryBuilder();
        }

        public BigDecimal getTotalCollected() {
            return this.totalCollected;
        }

        public BigDecimal getTotalPending() {
            return this.totalPending;
        }

        public long getTotalStudents() {
            return this.totalStudents;
        }

        public long getOverdueCount() {
            return this.overdueCount;
        }

        public double getCollectionRate() {
            return this.collectionRate;
        }

        public void setTotalCollected(final BigDecimal totalCollected) {
            this.totalCollected = totalCollected;
        }

        public void setTotalPending(final BigDecimal totalPending) {
            this.totalPending = totalPending;
        }

        public void setTotalStudents(final long totalStudents) {
            this.totalStudents = totalStudents;
        }

        public void setOverdueCount(final long overdueCount) {
            this.overdueCount = overdueCount;
        }

        public void setCollectionRate(final double collectionRate) {
            this.collectionRate = collectionRate;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof FeeDTOs.FeeCollectionSummary)) return false;
            final FeeDTOs.FeeCollectionSummary other = (FeeDTOs.FeeCollectionSummary) o;
            if (!other.canEqual((Object) this)) return false;
            if (this.getTotalStudents() != other.getTotalStudents()) return false;
            if (this.getOverdueCount() != other.getOverdueCount()) return false;
            if (Double.compare(this.getCollectionRate(), other.getCollectionRate()) != 0) return false;
            final Object this$totalCollected = this.getTotalCollected();
            final Object other$totalCollected = other.getTotalCollected();
            if (this$totalCollected == null ? other$totalCollected != null : !this$totalCollected.equals(other$totalCollected)) return false;
            final Object this$totalPending = this.getTotalPending();
            final Object other$totalPending = other.getTotalPending();
            if (this$totalPending == null ? other$totalPending != null : !this$totalPending.equals(other$totalPending)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof FeeDTOs.FeeCollectionSummary;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final long $totalStudents = this.getTotalStudents();
            result = result * PRIME + (int) ($totalStudents >>> 32 ^ $totalStudents);
            final long $overdueCount = this.getOverdueCount();
            result = result * PRIME + (int) ($overdueCount >>> 32 ^ $overdueCount);
            final long $collectionRate = Double.doubleToLongBits(this.getCollectionRate());
            result = result * PRIME + (int) ($collectionRate >>> 32 ^ $collectionRate);
            final Object $totalCollected = this.getTotalCollected();
            result = result * PRIME + ($totalCollected == null ? 43 : $totalCollected.hashCode());
            final Object $totalPending = this.getTotalPending();
            result = result * PRIME + ($totalPending == null ? 43 : $totalPending.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "FeeDTOs.FeeCollectionSummary(totalCollected=" + this.getTotalCollected() + ", totalPending=" + this.getTotalPending() + ", totalStudents=" + this.getTotalStudents() + ", overdueCount=" + this.getOverdueCount() + ", collectionRate=" + this.getCollectionRate() + ")";
        }

        public FeeCollectionSummary() {
        }

        public FeeCollectionSummary(final BigDecimal totalCollected, final BigDecimal totalPending, final long totalStudents, final long overdueCount, final double collectionRate) {
            this.totalCollected = totalCollected;
            this.totalPending = totalPending;
            this.totalStudents = totalStudents;
            this.overdueCount = overdueCount;
            this.collectionRate = collectionRate;
        }
    }

    public static class ParentFeeLineItem {
        private String name;
        private BigDecimal amount;
        private String type;

        public ParentFeeLineItem() {}
        public ParentFeeLineItem(String name, BigDecimal amount, String type) {
            this.name = name;
            this.amount = amount;
            this.type = type;
        }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
    }

    /** Frontend mirror: {@code frontend/src/app/core/models/parent-fee.dto.ts} ({@code ParentFeeDtos}). */
    public static class ParentFeeObligationResponse {
        private Long paymentId;
        private Long studentId;
        private String studentName;
        private Long feeStructureId;
        private String feeStructureName;
        private String className;
        private String dueDate;
        private String status;
        private String currency;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private BigDecimal dueAmount;
        private BigDecimal discount;
        private BigDecimal lateFee;
        private BigDecimal payableNow;
        private List<ParentFeeLineItem> lineItems;
        /** Days from today until due date; negative when overdue. Null when paid or no due date. */
        private Integer daysUntilDue;
        /**
         * Same value on every row for a student: copied from {@code tenant_finance_profiles.parent_online_fee_checkout_enabled}.
         * Parent UI uses this to swap Pay Now vs pay-at-school without a second round-trip.
         */
        private boolean parentOnlineFeeCheckoutEnabled = true;

        public Long getPaymentId() { return paymentId; }
        public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public Long getFeeStructureId() { return feeStructureId; }
        public void setFeeStructureId(Long feeStructureId) { this.feeStructureId = feeStructureId; }
        public String getFeeStructureName() { return feeStructureName; }
        public void setFeeStructureName(String feeStructureName) { this.feeStructureName = feeStructureName; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public String getDueDate() { return dueDate; }
        public void setDueDate(String dueDate) { this.dueDate = dueDate; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public BigDecimal getPaidAmount() { return paidAmount; }
        public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
        public BigDecimal getDueAmount() { return dueAmount; }
        public void setDueAmount(BigDecimal dueAmount) { this.dueAmount = dueAmount; }
        public BigDecimal getDiscount() { return discount; }
        public void setDiscount(BigDecimal discount) { this.discount = discount; }
        public BigDecimal getLateFee() { return lateFee; }
        public void setLateFee(BigDecimal lateFee) { this.lateFee = lateFee; }
        public BigDecimal getPayableNow() { return payableNow; }
        public void setPayableNow(BigDecimal payableNow) { this.payableNow = payableNow; }
        public List<ParentFeeLineItem> getLineItems() { return lineItems; }
        public void setLineItems(List<ParentFeeLineItem> lineItems) { this.lineItems = lineItems; }
        public Integer getDaysUntilDue() { return daysUntilDue; }
        public void setDaysUntilDue(Integer daysUntilDue) { this.daysUntilDue = daysUntilDue; }
        public boolean isParentOnlineFeeCheckoutEnabled() { return parentOnlineFeeCheckoutEnabled; }
        public void setParentOnlineFeeCheckoutEnabled(boolean parentOnlineFeeCheckoutEnabled) {
            this.parentOnlineFeeCheckoutEnabled = parentOnlineFeeCheckoutEnabled;
        }
    }

    public static class CreateCheckoutSessionRequest {
        @NotNull
        private Long paymentId;
        @NotNull
        private Long studentId;
        @NotNull
        private BigDecimal amount;
        @NotBlank
        private String provider;
        private String returnUrl;

        public Long getPaymentId() { return paymentId; }
        public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getReturnUrl() { return returnUrl; }
        public void setReturnUrl(String returnUrl) { this.returnUrl = returnUrl; }
    }

    public static class CheckoutSessionResponse {
        private Long attemptId;
        private String provider;
        private String providerOrderId;
        private String checkoutToken;
        private String currency;
        private BigDecimal amount;
        private String checkoutUrl;
        private String status;
        /** Razorpay key_id for browser Checkout.js (safe to expose; secret stays server-side). */
        private String publicKeyId;

        public Long getAttemptId() { return attemptId; }
        public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getProviderOrderId() { return providerOrderId; }
        public void setProviderOrderId(String providerOrderId) { this.providerOrderId = providerOrderId; }
        public String getCheckoutToken() { return checkoutToken; }
        public void setCheckoutToken(String checkoutToken) { this.checkoutToken = checkoutToken; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCheckoutUrl() { return checkoutUrl; }
        public void setCheckoutUrl(String checkoutUrl) { this.checkoutUrl = checkoutUrl; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getPublicKeyId() { return publicKeyId; }
        public void setPublicKeyId(String publicKeyId) { this.publicKeyId = publicKeyId; }
    }

    public static class ConfirmCheckoutRequest {
        @NotBlank
        private String checkoutToken;
        private String providerPaymentId;
        private String providerSignature;

        public String getCheckoutToken() { return checkoutToken; }
        public void setCheckoutToken(String checkoutToken) { this.checkoutToken = checkoutToken; }
        public String getProviderPaymentId() { return providerPaymentId; }
        public void setProviderPaymentId(String providerPaymentId) { this.providerPaymentId = providerPaymentId; }
        public String getProviderSignature() { return providerSignature; }
        public void setProviderSignature(String providerSignature) { this.providerSignature = providerSignature; }
    }

    public static class PaymentReceiptResponse {
        public static class PaymentReceiptEntry {
            private String eventType;
            private String label;
            private String occurredAt;
            private BigDecimal amount;
            private BigDecimal runningPaidAmount;
            private BigDecimal runningDueAmount;
            private String note;

            public String getEventType() { return eventType; }
            public void setEventType(String eventType) { this.eventType = eventType; }
            public String getLabel() { return label; }
            public void setLabel(String label) { this.label = label; }
            public String getOccurredAt() { return occurredAt; }
            public void setOccurredAt(String occurredAt) { this.occurredAt = occurredAt; }
            public BigDecimal getAmount() { return amount; }
            public void setAmount(BigDecimal amount) { this.amount = amount; }
            public BigDecimal getRunningPaidAmount() { return runningPaidAmount; }
            public void setRunningPaidAmount(BigDecimal runningPaidAmount) { this.runningPaidAmount = runningPaidAmount; }
            public BigDecimal getRunningDueAmount() { return runningDueAmount; }
            public void setRunningDueAmount(BigDecimal runningDueAmount) { this.runningDueAmount = runningDueAmount; }
            public String getNote() { return note; }
            public void setNote(String note) { this.note = note; }
        }

        private String receiptNumber;
        private String schoolName;
        private String schoolCode;
        private String schoolAddress;
        private String schoolPhone;
        private String schoolEmail;
        private Long paymentId;
        private Long studentId;
        private String studentName;
        private String feeStructureName;
        private String className;
        private String provider;
        private String providerPaymentId;
        private String paymentMethod;
        private String paymentDate;
        private String dueDate;
        private String currency;
        private BigDecimal amountPaid;
        private BigDecimal totalAmount;
        private BigDecimal paidAmount;
        private BigDecimal dueAmount;
        private BigDecimal discount;
        private BigDecimal lateFee;
        private List<ParentFeeLineItem> lineItems;
        private List<PaymentReceiptEntry> entries;

        public String getReceiptNumber() { return receiptNumber; }
        public void setReceiptNumber(String receiptNumber) { this.receiptNumber = receiptNumber; }
        public String getSchoolName() { return schoolName; }
        public void setSchoolName(String schoolName) { this.schoolName = schoolName; }
        public String getSchoolCode() { return schoolCode; }
        public void setSchoolCode(String schoolCode) { this.schoolCode = schoolCode; }
        public String getSchoolAddress() { return schoolAddress; }
        public void setSchoolAddress(String schoolAddress) { this.schoolAddress = schoolAddress; }
        public String getSchoolPhone() { return schoolPhone; }
        public void setSchoolPhone(String schoolPhone) { this.schoolPhone = schoolPhone; }
        public String getSchoolEmail() { return schoolEmail; }
        public void setSchoolEmail(String schoolEmail) { this.schoolEmail = schoolEmail; }
        public Long getPaymentId() { return paymentId; }
        public void setPaymentId(Long paymentId) { this.paymentId = paymentId; }
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public String getFeeStructureName() { return feeStructureName; }
        public void setFeeStructureName(String feeStructureName) { this.feeStructureName = feeStructureName; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getProviderPaymentId() { return providerPaymentId; }
        public void setProviderPaymentId(String providerPaymentId) { this.providerPaymentId = providerPaymentId; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
        public String getPaymentDate() { return paymentDate; }
        public void setPaymentDate(String paymentDate) { this.paymentDate = paymentDate; }
        public String getDueDate() { return dueDate; }
        public void setDueDate(String dueDate) { this.dueDate = dueDate; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public BigDecimal getAmountPaid() { return amountPaid; }
        public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public BigDecimal getPaidAmount() { return paidAmount; }
        public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
        public BigDecimal getDueAmount() { return dueAmount; }
        public void setDueAmount(BigDecimal dueAmount) { this.dueAmount = dueAmount; }
        public BigDecimal getDiscount() { return discount; }
        public void setDiscount(BigDecimal discount) { this.discount = discount; }
        public BigDecimal getLateFee() { return lateFee; }
        public void setLateFee(BigDecimal lateFee) { this.lateFee = lateFee; }
        public List<ParentFeeLineItem> getLineItems() { return lineItems; }
        public void setLineItems(List<ParentFeeLineItem> lineItems) { this.lineItems = lineItems; }
        public List<PaymentReceiptEntry> getEntries() { return entries; }
        public void setEntries(List<PaymentReceiptEntry> entries) { this.entries = entries; }
    }

    /** Assign one fee structure to all active students in a class (optional section). */
    public static class BulkAssignFeesRequest {
        @NotNull
        private Long feeStructureId;
        @NotNull
        private Long classId;
        /** When null, all sections in the class are included. */
        private Long sectionId;
        @NotNull
        private LocalDate dueDate;
        private BigDecimal discount;
        /** When true (default), students who already have any fee obligation in same class + due month are skipped. */
        private Boolean skipIfDuplicate = Boolean.TRUE;
        /** Optional client correlation for logs and future idempotency. */
        private String correlationId;

        public Long getFeeStructureId() {
            return feeStructureId;
        }

        public void setFeeStructureId(Long feeStructureId) {
            this.feeStructureId = feeStructureId;
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

        public LocalDate getDueDate() {
            return dueDate;
        }

        public void setDueDate(LocalDate dueDate) {
            this.dueDate = dueDate;
        }

        public BigDecimal getDiscount() {
            return discount;
        }

        public void setDiscount(BigDecimal discount) {
            this.discount = discount;
        }

        public Boolean getSkipIfDuplicate() {
            return skipIfDuplicate;
        }

        public void setSkipIfDuplicate(Boolean skipIfDuplicate) {
            this.skipIfDuplicate = skipIfDuplicate;
        }

        public String getCorrelationId() {
            return correlationId;
        }

        public void setCorrelationId(String correlationId) {
            this.correlationId = correlationId;
        }
    }

    public static class BulkAssignFeesSkipEntry {
        private Long studentId;
        /** e.g. INACTIVE, DUPLICATE_OBLIGATION */
        private String code;
        private String detail;

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getDetail() {
            return detail;
        }

        public void setDetail(String detail) {
            this.detail = detail;
        }
    }

    public static class BulkAssignFeesResponse {
        private int createdCount;
        private int skippedCount;
        private List<BulkAssignFeesSkipEntry> skipped;
        /** First rows for UI preview; full ledger remains on GET /fees/payments. */
        private List<FeePaymentResponse> createdSample;

        public int getCreatedCount() {
            return createdCount;
        }

        public void setCreatedCount(int createdCount) {
            this.createdCount = createdCount;
        }

        public int getSkippedCount() {
            return skippedCount;
        }

        public void setSkippedCount(int skippedCount) {
            this.skippedCount = skippedCount;
        }

        public List<BulkAssignFeesSkipEntry> getSkipped() {
            return skipped;
        }

        public void setSkipped(List<BulkAssignFeesSkipEntry> skipped) {
            this.skipped = skipped;
        }

        public List<FeePaymentResponse> getCreatedSample() {
            return createdSample;
        }

        public void setCreatedSample(List<FeePaymentResponse> createdSample) {
            this.createdSample = createdSample;
        }
    }

    public static class FeeTransactionResponse {
        private Long id;
        private Long feePaymentId;
        private Long attemptId;
        private String eventType;
        private String eventStatus;
        private BigDecimal amount;
        private String currency;
        private String provider;
        private String providerPaymentId;
        private String referenceId;
        private String operationKey;
        private String note;
        private String occurredAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getFeePaymentId() { return feePaymentId; }
        public void setFeePaymentId(Long feePaymentId) { this.feePaymentId = feePaymentId; }
        public Long getAttemptId() { return attemptId; }
        public void setAttemptId(Long attemptId) { this.attemptId = attemptId; }
        public String getEventType() { return eventType; }
        public void setEventType(String eventType) { this.eventType = eventType; }
        public String getEventStatus() { return eventStatus; }
        public void setEventStatus(String eventStatus) { this.eventStatus = eventStatus; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getProviderPaymentId() { return providerPaymentId; }
        public void setProviderPaymentId(String providerPaymentId) { this.providerPaymentId = providerPaymentId; }
        public String getReferenceId() { return referenceId; }
        public void setReferenceId(String referenceId) { this.referenceId = referenceId; }
        public String getOperationKey() { return operationKey; }
        public void setOperationKey(String operationKey) { this.operationKey = operationKey; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getOccurredAt() { return occurredAt; }
        public void setOccurredAt(String occurredAt) { this.occurredAt = occurredAt; }
    }

    public static class FeeRefundRequest {
        @NotNull
        private BigDecimal amount;
        private String reason;
        private String operationKey;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getOperationKey() { return operationKey; }
        public void setOperationKey(String operationKey) { this.operationKey = operationKey; }
    }

    public static class FeeRefundDecisionRequest {
        private String note;
        private String operationKey;

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getOperationKey() { return operationKey; }
        public void setOperationKey(String operationKey) { this.operationKey = operationKey; }
    }

    public static class FeeRefundExecuteRequest {
        private String providerRefundId;
        private String note;
        private String operationKey;

        public String getProviderRefundId() { return providerRefundId; }
        public void setProviderRefundId(String providerRefundId) { this.providerRefundId = providerRefundId; }
        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
        public String getOperationKey() { return operationKey; }
        public void setOperationKey(String operationKey) { this.operationKey = operationKey; }
    }
}
