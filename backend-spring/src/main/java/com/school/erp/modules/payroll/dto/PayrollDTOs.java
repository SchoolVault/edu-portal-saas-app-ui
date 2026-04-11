package com.school.erp.modules.payroll.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public class PayrollDTOs {

    public static class CreateSalaryStructureRequest {
        @NotNull
        private Long teacherId;
        private String teacherName;
        @NotNull
        private BigDecimal basicSalary;
        private List<SalaryComponentDTO> allowances;
        private List<SalaryComponentDTO> deductions;


        public static class CreateSalaryStructureRequestBuilder {
            private Long teacherId;
            private String teacherName;
            private BigDecimal basicSalary;
            private List<SalaryComponentDTO> allowances;
            private List<SalaryComponentDTO> deductions;

            CreateSalaryStructureRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.CreateSalaryStructureRequest.CreateSalaryStructureRequestBuilder teacherId(final Long teacherId) {
                this.teacherId = teacherId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.CreateSalaryStructureRequest.CreateSalaryStructureRequestBuilder teacherName(final String teacherName) {
                this.teacherName = teacherName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.CreateSalaryStructureRequest.CreateSalaryStructureRequestBuilder basicSalary(final BigDecimal basicSalary) {
                this.basicSalary = basicSalary;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.CreateSalaryStructureRequest.CreateSalaryStructureRequestBuilder allowances(final List<SalaryComponentDTO> allowances) {
                this.allowances = allowances;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.CreateSalaryStructureRequest.CreateSalaryStructureRequestBuilder deductions(final List<SalaryComponentDTO> deductions) {
                this.deductions = deductions;
                return this;
            }

            public PayrollDTOs.CreateSalaryStructureRequest build() {
                return new PayrollDTOs.CreateSalaryStructureRequest(this.teacherId, this.teacherName, this.basicSalary, this.allowances, this.deductions);
            }

            @Override
            public String toString() {
                return "PayrollDTOs.CreateSalaryStructureRequest.CreateSalaryStructureRequestBuilder(teacherId=" + this.teacherId + ", teacherName=" + this.teacherName + ", basicSalary=" + this.basicSalary + ", allowances=" + this.allowances + ", deductions=" + this.deductions + ")";
            }
        }

        public static PayrollDTOs.CreateSalaryStructureRequest.CreateSalaryStructureRequestBuilder builder() {
            return new PayrollDTOs.CreateSalaryStructureRequest.CreateSalaryStructureRequestBuilder();
        }

        public Long getTeacherId() {
            return this.teacherId;
        }

        public String getTeacherName() {
            return this.teacherName;
        }

        public BigDecimal getBasicSalary() {
            return this.basicSalary;
        }

        public List<SalaryComponentDTO> getAllowances() {
            return this.allowances;
        }

        public List<SalaryComponentDTO> getDeductions() {
            return this.deductions;
        }

        public void setTeacherId(final Long teacherId) {
            this.teacherId = teacherId;
        }

        public void setTeacherName(final String teacherName) {
            this.teacherName = teacherName;
        }

        public void setBasicSalary(final BigDecimal basicSalary) {
            this.basicSalary = basicSalary;
        }

        public void setAllowances(final List<SalaryComponentDTO> allowances) {
            this.allowances = allowances;
        }

        public void setDeductions(final List<SalaryComponentDTO> deductions) {
            this.deductions = deductions;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof PayrollDTOs.CreateSalaryStructureRequest)) return false;
            final PayrollDTOs.CreateSalaryStructureRequest other = (PayrollDTOs.CreateSalaryStructureRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$teacherId = this.getTeacherId();
            final Object other$teacherId = other.getTeacherId();
            if (this$teacherId == null ? other$teacherId != null : !this$teacherId.equals(other$teacherId)) return false;
            final Object this$teacherName = this.getTeacherName();
            final Object other$teacherName = other.getTeacherName();
            if (this$teacherName == null ? other$teacherName != null : !this$teacherName.equals(other$teacherName)) return false;
            final Object this$basicSalary = this.getBasicSalary();
            final Object other$basicSalary = other.getBasicSalary();
            if (this$basicSalary == null ? other$basicSalary != null : !this$basicSalary.equals(other$basicSalary)) return false;
            final Object this$allowances = this.getAllowances();
            final Object other$allowances = other.getAllowances();
            if (this$allowances == null ? other$allowances != null : !this$allowances.equals(other$allowances)) return false;
            final Object this$deductions = this.getDeductions();
            final Object other$deductions = other.getDeductions();
            if (this$deductions == null ? other$deductions != null : !this$deductions.equals(other$deductions)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof PayrollDTOs.CreateSalaryStructureRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $teacherId = this.getTeacherId();
            result = result * PRIME + ($teacherId == null ? 43 : $teacherId.hashCode());
            final Object $teacherName = this.getTeacherName();
            result = result * PRIME + ($teacherName == null ? 43 : $teacherName.hashCode());
            final Object $basicSalary = this.getBasicSalary();
            result = result * PRIME + ($basicSalary == null ? 43 : $basicSalary.hashCode());
            final Object $allowances = this.getAllowances();
            result = result * PRIME + ($allowances == null ? 43 : $allowances.hashCode());
            final Object $deductions = this.getDeductions();
            result = result * PRIME + ($deductions == null ? 43 : $deductions.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "PayrollDTOs.CreateSalaryStructureRequest(teacherId=" + this.getTeacherId() + ", teacherName=" + this.getTeacherName() + ", basicSalary=" + this.getBasicSalary() + ", allowances=" + this.getAllowances() + ", deductions=" + this.getDeductions() + ")";
        }

        public CreateSalaryStructureRequest() {
        }

        public CreateSalaryStructureRequest(final Long teacherId, final String teacherName, final BigDecimal basicSalary, final List<SalaryComponentDTO> allowances, final List<SalaryComponentDTO> deductions) {
            this.teacherId = teacherId;
            this.teacherName = teacherName;
            this.basicSalary = basicSalary;
            this.allowances = allowances;
            this.deductions = deductions;
        }
    }


    public static class SalaryComponentDTO {
        private Long id;
        private String name;
        private BigDecimal amount;
        private String type;


        public static class SalaryComponentDTOBuilder {
            private Long id;
            private String name;
            private BigDecimal amount;
            private String type;

            SalaryComponentDTOBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryComponentDTO.SalaryComponentDTOBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryComponentDTO.SalaryComponentDTOBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryComponentDTO.SalaryComponentDTOBuilder amount(final BigDecimal amount) {
                this.amount = amount;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryComponentDTO.SalaryComponentDTOBuilder type(final String type) {
                this.type = type;
                return this;
            }

            public PayrollDTOs.SalaryComponentDTO build() {
                return new PayrollDTOs.SalaryComponentDTO(this.id, this.name, this.amount, this.type);
            }

            @Override
            public String toString() {
                return "PayrollDTOs.SalaryComponentDTO.SalaryComponentDTOBuilder(id=" + this.id + ", name=" + this.name + ", amount=" + this.amount + ", type=" + this.type + ")";
            }
        }

        public static PayrollDTOs.SalaryComponentDTO.SalaryComponentDTOBuilder builder() {
            return new PayrollDTOs.SalaryComponentDTO.SalaryComponentDTOBuilder();
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
            if (!(o instanceof PayrollDTOs.SalaryComponentDTO)) return false;
            final PayrollDTOs.SalaryComponentDTO other = (PayrollDTOs.SalaryComponentDTO) o;
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
            return other instanceof PayrollDTOs.SalaryComponentDTO;
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
            return "PayrollDTOs.SalaryComponentDTO(id=" + this.getId() + ", name=" + this.getName() + ", amount=" + this.getAmount() + ", type=" + this.getType() + ")";
        }

        public SalaryComponentDTO() {
        }

        public SalaryComponentDTO(final Long id, final String name, final BigDecimal amount, final String type) {
            this.id = id;
            this.name = name;
            this.amount = amount;
            this.type = type;
        }
    }


    public static class SalaryStructureResponse {
        private Long id;
        private Long teacherId;
        private String teacherName;
        private BigDecimal basicSalary;
        private BigDecimal netSalary;
        private BigDecimal totalAllowances;
        private BigDecimal totalDeductions;
        private List<SalaryComponentDTO> components;


        public static class SalaryStructureResponseBuilder {
            private Long id;
            private Long teacherId;
            private String teacherName;
            private BigDecimal basicSalary;
            private BigDecimal netSalary;
            private BigDecimal totalAllowances;
            private BigDecimal totalDeductions;
            private List<SalaryComponentDTO> components;

            SalaryStructureResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder teacherId(final Long teacherId) {
                this.teacherId = teacherId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder teacherName(final String teacherName) {
                this.teacherName = teacherName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder basicSalary(final BigDecimal basicSalary) {
                this.basicSalary = basicSalary;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder netSalary(final BigDecimal netSalary) {
                this.netSalary = netSalary;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder totalAllowances(final BigDecimal totalAllowances) {
                this.totalAllowances = totalAllowances;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder totalDeductions(final BigDecimal totalDeductions) {
                this.totalDeductions = totalDeductions;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder components(final List<SalaryComponentDTO> components) {
                this.components = components;
                return this;
            }

            public PayrollDTOs.SalaryStructureResponse build() {
                return new PayrollDTOs.SalaryStructureResponse(this.id, this.teacherId, this.teacherName, this.basicSalary, this.netSalary, this.totalAllowances, this.totalDeductions, this.components);
            }

            @Override
            public String toString() {
                return "PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder(id=" + this.id + ", teacherId=" + this.teacherId + ", teacherName=" + this.teacherName + ", basicSalary=" + this.basicSalary + ", netSalary=" + this.netSalary + ", totalAllowances=" + this.totalAllowances + ", totalDeductions=" + this.totalDeductions + ", components=" + this.components + ")";
            }
        }

        public static PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder builder() {
            return new PayrollDTOs.SalaryStructureResponse.SalaryStructureResponseBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public Long getTeacherId() {
            return this.teacherId;
        }

        public String getTeacherName() {
            return this.teacherName;
        }

        public BigDecimal getBasicSalary() {
            return this.basicSalary;
        }

        public BigDecimal getNetSalary() {
            return this.netSalary;
        }

        public BigDecimal getTotalAllowances() {
            return this.totalAllowances;
        }

        public BigDecimal getTotalDeductions() {
            return this.totalDeductions;
        }

        public List<SalaryComponentDTO> getComponents() {
            return this.components;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setTeacherId(final Long teacherId) {
            this.teacherId = teacherId;
        }

        public void setTeacherName(final String teacherName) {
            this.teacherName = teacherName;
        }

        public void setBasicSalary(final BigDecimal basicSalary) {
            this.basicSalary = basicSalary;
        }

        public void setNetSalary(final BigDecimal netSalary) {
            this.netSalary = netSalary;
        }

        public void setTotalAllowances(final BigDecimal totalAllowances) {
            this.totalAllowances = totalAllowances;
        }

        public void setTotalDeductions(final BigDecimal totalDeductions) {
            this.totalDeductions = totalDeductions;
        }

        public void setComponents(final List<SalaryComponentDTO> components) {
            this.components = components;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof PayrollDTOs.SalaryStructureResponse)) return false;
            final PayrollDTOs.SalaryStructureResponse other = (PayrollDTOs.SalaryStructureResponse) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$teacherId = this.getTeacherId();
            final Object other$teacherId = other.getTeacherId();
            if (this$teacherId == null ? other$teacherId != null : !this$teacherId.equals(other$teacherId)) return false;
            final Object this$teacherName = this.getTeacherName();
            final Object other$teacherName = other.getTeacherName();
            if (this$teacherName == null ? other$teacherName != null : !this$teacherName.equals(other$teacherName)) return false;
            final Object this$basicSalary = this.getBasicSalary();
            final Object other$basicSalary = other.getBasicSalary();
            if (this$basicSalary == null ? other$basicSalary != null : !this$basicSalary.equals(other$basicSalary)) return false;
            final Object this$netSalary = this.getNetSalary();
            final Object other$netSalary = other.getNetSalary();
            if (this$netSalary == null ? other$netSalary != null : !this$netSalary.equals(other$netSalary)) return false;
            final Object this$totalAllowances = this.getTotalAllowances();
            final Object other$totalAllowances = other.getTotalAllowances();
            if (this$totalAllowances == null ? other$totalAllowances != null : !this$totalAllowances.equals(other$totalAllowances)) return false;
            final Object this$totalDeductions = this.getTotalDeductions();
            final Object other$totalDeductions = other.getTotalDeductions();
            if (this$totalDeductions == null ? other$totalDeductions != null : !this$totalDeductions.equals(other$totalDeductions)) return false;
            final Object this$components = this.getComponents();
            final Object other$components = other.getComponents();
            if (this$components == null ? other$components != null : !this$components.equals(other$components)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof PayrollDTOs.SalaryStructureResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $teacherId = this.getTeacherId();
            result = result * PRIME + ($teacherId == null ? 43 : $teacherId.hashCode());
            final Object $teacherName = this.getTeacherName();
            result = result * PRIME + ($teacherName == null ? 43 : $teacherName.hashCode());
            final Object $basicSalary = this.getBasicSalary();
            result = result * PRIME + ($basicSalary == null ? 43 : $basicSalary.hashCode());
            final Object $netSalary = this.getNetSalary();
            result = result * PRIME + ($netSalary == null ? 43 : $netSalary.hashCode());
            final Object $totalAllowances = this.getTotalAllowances();
            result = result * PRIME + ($totalAllowances == null ? 43 : $totalAllowances.hashCode());
            final Object $totalDeductions = this.getTotalDeductions();
            result = result * PRIME + ($totalDeductions == null ? 43 : $totalDeductions.hashCode());
            final Object $components = this.getComponents();
            result = result * PRIME + ($components == null ? 43 : $components.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "PayrollDTOs.SalaryStructureResponse(id=" + this.getId() + ", teacherId=" + this.getTeacherId() + ", teacherName=" + this.getTeacherName() + ", basicSalary=" + this.getBasicSalary() + ", netSalary=" + this.getNetSalary() + ", totalAllowances=" + this.getTotalAllowances() + ", totalDeductions=" + this.getTotalDeductions() + ", components=" + this.getComponents() + ")";
        }

        public SalaryStructureResponse() {
        }

        public SalaryStructureResponse(final Long id, final Long teacherId, final String teacherName, final BigDecimal basicSalary, final BigDecimal netSalary, final BigDecimal totalAllowances, final BigDecimal totalDeductions, final List<SalaryComponentDTO> components) {
            this.id = id;
            this.teacherId = teacherId;
            this.teacherName = teacherName;
            this.basicSalary = basicSalary;
            this.netSalary = netSalary;
            this.totalAllowances = totalAllowances;
            this.totalDeductions = totalDeductions;
            this.components = components;
        }
    }


    public static class GeneratePayslipRequest {
        @NotNull
        private String month;
        @NotNull
        private Integer year;


        public static class GeneratePayslipRequestBuilder {
            private String month;
            private Integer year;

            GeneratePayslipRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.GeneratePayslipRequest.GeneratePayslipRequestBuilder month(final String month) {
                this.month = month;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public PayrollDTOs.GeneratePayslipRequest.GeneratePayslipRequestBuilder year(final Integer year) {
                this.year = year;
                return this;
            }

            public PayrollDTOs.GeneratePayslipRequest build() {
                return new PayrollDTOs.GeneratePayslipRequest(this.month, this.year);
            }

            @Override
            public String toString() {
                return "PayrollDTOs.GeneratePayslipRequest.GeneratePayslipRequestBuilder(month=" + this.month + ", year=" + this.year + ")";
            }
        }

        public static PayrollDTOs.GeneratePayslipRequest.GeneratePayslipRequestBuilder builder() {
            return new PayrollDTOs.GeneratePayslipRequest.GeneratePayslipRequestBuilder();
        }

        public String getMonth() {
            return this.month;
        }

        public Integer getYear() {
            return this.year;
        }

        public void setMonth(final String month) {
            this.month = month;
        }

        public void setYear(final Integer year) {
            this.year = year;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof PayrollDTOs.GeneratePayslipRequest)) return false;
            final PayrollDTOs.GeneratePayslipRequest other = (PayrollDTOs.GeneratePayslipRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$year = this.getYear();
            final Object other$year = other.getYear();
            if (this$year == null ? other$year != null : !this$year.equals(other$year)) return false;
            final Object this$month = this.getMonth();
            final Object other$month = other.getMonth();
            if (this$month == null ? other$month != null : !this$month.equals(other$month)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof PayrollDTOs.GeneratePayslipRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $year = this.getYear();
            result = result * PRIME + ($year == null ? 43 : $year.hashCode());
            final Object $month = this.getMonth();
            result = result * PRIME + ($month == null ? 43 : $month.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "PayrollDTOs.GeneratePayslipRequest(month=" + this.getMonth() + ", year=" + this.getYear() + ")";
        }

        public GeneratePayslipRequest() {
        }

        public GeneratePayslipRequest(final String month, final Integer year) {
            this.month = month;
            this.year = year;
        }
    }

    /** Admin: teachers on payroll with masked bank details for disbursement. */
    public static class TeacherPaymentDetailsResponse {
        private Long teacherId;
        private String teacherName;
        private BigDecimal monthlyNetSalary;
        private String bankAccountHolder;
        private String bankName;
        private String bankAccountMasked;
        private String bankIfsc;
        private boolean bankDetailsComplete;

        public Long getTeacherId() {
            return teacherId;
        }

        public void setTeacherId(Long teacherId) {
            this.teacherId = teacherId;
        }

        public String getTeacherName() {
            return teacherName;
        }

        public void setTeacherName(String teacherName) {
            this.teacherName = teacherName;
        }

        public BigDecimal getMonthlyNetSalary() {
            return monthlyNetSalary;
        }

        public void setMonthlyNetSalary(BigDecimal monthlyNetSalary) {
            this.monthlyNetSalary = monthlyNetSalary;
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

        public String getBankAccountMasked() {
            return bankAccountMasked;
        }

        public void setBankAccountMasked(String bankAccountMasked) {
            this.bankAccountMasked = bankAccountMasked;
        }

        public String getBankIfsc() {
            return bankIfsc;
        }

        public void setBankIfsc(String bankIfsc) {
            this.bankIfsc = bankIfsc;
        }

        public boolean isBankDetailsComplete() {
            return bankDetailsComplete;
        }

        public void setBankDetailsComplete(boolean bankDetailsComplete) {
            this.bankDetailsComplete = bankDetailsComplete;
        }
    }

    /** Admin: submit net salary to bank using teacher profile & generated payslip for the period. */
    public static class DisburseSalaryRequest {
        @jakarta.validation.constraints.NotNull
        private Long teacherId;
        @jakarta.validation.constraints.NotNull
        private String month;
        @jakarta.validation.constraints.NotNull
        private Integer year;
        /** NETBANKING, UPI, NEFT, IMPS — drives reference prefix and audit row. */
        private String paymentMethod;

        public Long getTeacherId() {
            return teacherId;
        }

        public void setTeacherId(Long teacherId) {
            this.teacherId = teacherId;
        }

        public String getMonth() {
            return month;
        }

        public void setMonth(String month) {
            this.month = month;
        }

        public Integer getYear() {
            return year;
        }

        public void setYear(Integer year) {
            this.year = year;
        }

        public String getPaymentMethod() {
            return paymentMethod;
        }

        public void setPaymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
        }
    }

    public static class DisburseSalaryResponse {
        private String referenceId;
        private java.math.BigDecimal amount;
        private String teacherName;
        private String message;
        private String paymentMethod;

        public String getReferenceId() {
            return referenceId;
        }

        public void setReferenceId(String referenceId) {
            this.referenceId = referenceId;
        }

        public java.math.BigDecimal getAmount() {
            return amount;
        }

        public void setAmount(java.math.BigDecimal amount) {
            this.amount = amount;
        }

        public String getTeacherName() {
            return teacherName;
        }

        public void setTeacherName(String teacherName) {
            this.teacherName = teacherName;
        }

        public String getMessage() {
            return message;
        }

        public void setMessage(String message) {
            this.message = message;
        }

        public String getPaymentMethod() {
            return paymentMethod;
        }

        public void setPaymentMethod(String paymentMethod) {
            this.paymentMethod = paymentMethod;
        }
    }
}
