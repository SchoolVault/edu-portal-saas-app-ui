package com.school.erp.modules.operations.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/** Request/response shapes for school operations (staff, visitors, inventory, reminders, payroll accrual stub). */
public class OperationsDTOs {

    /** Scoped global search row for operations workspace. */
    public static class GlobalSearchResultRow {
        private String scope;
        private String recordId;
        private String title;
        private String subtitle;
        private String status;
        private String routeHint;
        private Map<String, Object> metadata;

        public String getScope() { return scope; }
        public void setScope(String scope) { this.scope = scope; }
        public String getRecordId() { return recordId; }
        public void setRecordId(String recordId) { this.recordId = recordId; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getSubtitle() { return subtitle; }
        public void setSubtitle(String subtitle) { this.subtitle = subtitle; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
        public String getRouteHint() { return routeHint; }
        public void setRouteHint(String routeHint) { this.routeHint = routeHint; }
        public Map<String, Object> getMetadata() { return metadata; }
        public void setMetadata(Map<String, Object> metadata) { this.metadata = metadata; }
    }

    public static class GlobalSearchResponse {
        private String query;
        private List<String> scopes;
        private int total;
        private Map<String, Long> totalsByScope;
        private List<GlobalSearchResultRow> rows;

        public String getQuery() { return query; }
        public void setQuery(String query) { this.query = query; }
        public List<String> getScopes() { return scopes; }
        public void setScopes(List<String> scopes) { this.scopes = scopes; }
        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }
        public Map<String, Long> getTotalsByScope() { return totalsByScope; }
        public void setTotalsByScope(Map<String, Long> totalsByScope) { this.totalsByScope = totalsByScope; }
        public List<GlobalSearchResultRow> getRows() { return rows; }
        public void setRows(List<GlobalSearchResultRow> rows) { this.rows = rows; }
    }

    public static class GlobalSearchActivityRow {
        private String at;
        private Long actorUserId;
        private String actorName;
        private String description;

        public String getAt() { return at; }
        public void setAt(String at) { this.at = at; }
        public Long getActorUserId() { return actorUserId; }
        public void setActorUserId(Long actorUserId) { this.actorUserId = actorUserId; }
        public String getActorName() { return actorName; }
        public void setActorName(String actorName) { this.actorName = actorName; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }

    public static class OperationalStaffResponse {
        private Long id;
        private Boolean isActive;
        private String staffRole;
        private String fullName;
        private String phone;
        private String email;
        private String employeeCode;
        private Long userId;
        private Long transportRouteId;
        private String notes;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Boolean getIsActive() {
            return isActive;
        }

        public void setIsActive(Boolean isActive) {
            this.isActive = isActive;
        }

        public String getStaffRole() {
            return staffRole;
        }

        public void setStaffRole(String staffRole) {
            this.staffRole = staffRole;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getEmployeeCode() {
            return employeeCode;
        }

        public void setEmployeeCode(String employeeCode) {
            this.employeeCode = employeeCode;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public Long getTransportRouteId() {
            return transportRouteId;
        }

        public void setTransportRouteId(Long transportRouteId) {
            this.transportRouteId = transportRouteId;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }
    }

    public static class OperationalStaffCreateRequest {
        private String staffRole;
        private String fullName;
        private String phone;
        private String email;
        private String employeeCode;
        private Long userId;
        private Long transportRouteId;
        private String notes;
        /** When true, creates/links a portal {@code User} (same pathway as CSV import {@code create_portal}). Requires valid India mobile. */
        private Boolean createPortal;
        /** Optional initial password when {@link #createPortal} is true; if omitted the system assigns one (OTP login remains available). Min 8 characters when provided. */
        private String portalPassword;

        public String getStaffRole() {
            return staffRole;
        }

        public void setStaffRole(String staffRole) {
            this.staffRole = staffRole;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getEmployeeCode() {
            return employeeCode;
        }

        public void setEmployeeCode(String employeeCode) {
            this.employeeCode = employeeCode;
        }

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public Long getTransportRouteId() {
            return transportRouteId;
        }

        public void setTransportRouteId(Long transportRouteId) {
            this.transportRouteId = transportRouteId;
        }

        public String getNotes() {
            return notes;
        }

        public void setNotes(String notes) {
            this.notes = notes;
        }

        public Boolean getCreatePortal() {
            return createPortal;
        }

        public void setCreatePortal(Boolean createPortal) {
            this.createPortal = createPortal;
        }

        public String getPortalPassword() {
            return portalPassword;
        }

        public void setPortalPassword(String portalPassword) {
            this.portalPassword = portalPassword;
        }
    }

    public static class OperationalStaffUpdateRequest {
        private String staffRole;
        private String fullName;
        private String phone;
        private String email;
        private String employeeCode;
        private String notes;
        /** Provision a portal user when absent; ignored if operational staff row already links {@code userId}. */
        private Boolean createPortal;
        /** Optional password when provisioning; min 8 characters when provided. */
        private String portalPassword;

        public String getStaffRole() { return staffRole; }
        public void setStaffRole(String staffRole) { this.staffRole = staffRole; }
        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getEmployeeCode() { return employeeCode; }
        public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
        public Boolean getCreatePortal() { return createPortal; }
        public void setCreatePortal(Boolean createPortal) { this.createPortal = createPortal; }
        public String getPortalPassword() { return portalPassword; }
        public void setPortalPassword(String portalPassword) { this.portalPassword = portalPassword; }
    }

    public static class VisitorLogResponse {
        private Long id;
        private String visitorName;
        private String phone;
        private String purpose;
        private String hostName;
        private String badgeNo;
        private String checkInAt;
        private String checkOutAt;
        private String status;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getVisitorName() {
            return visitorName;
        }

        public void setVisitorName(String visitorName) {
            this.visitorName = visitorName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getPurpose() {
            return purpose;
        }

        public void setPurpose(String purpose) {
            this.purpose = purpose;
        }

        public String getHostName() {
            return hostName;
        }

        public void setHostName(String hostName) {
            this.hostName = hostName;
        }

        public String getBadgeNo() {
            return badgeNo;
        }

        public void setBadgeNo(String badgeNo) {
            this.badgeNo = badgeNo;
        }

        public String getCheckInAt() {
            return checkInAt;
        }

        public void setCheckInAt(String checkInAt) {
            this.checkInAt = checkInAt;
        }

        public String getCheckOutAt() {
            return checkOutAt;
        }

        public void setCheckOutAt(String checkOutAt) {
            this.checkOutAt = checkOutAt;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public static class VisitorCheckInRequest {
        private String visitorName;
        private String phone;
        private String purpose;
        private String hostName;

        public String getVisitorName() {
            return visitorName;
        }

        public void setVisitorName(String visitorName) {
            this.visitorName = visitorName;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getPurpose() {
            return purpose;
        }

        public void setPurpose(String purpose) {
            this.purpose = purpose;
        }

        public String getHostName() {
            return hostName;
        }

        public void setHostName(String hostName) {
            this.hostName = hostName;
        }
    }

    public static class GatePassResponse {
        private Long id;
        private Long studentId;
        private String issuedToName;
        private String validFrom;
        private String validTo;
        private String purpose;
        private Long issuedByUserId;
        private String status;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public String getIssuedToName() {
            return issuedToName;
        }

        public void setIssuedToName(String issuedToName) {
            this.issuedToName = issuedToName;
        }

        public String getValidFrom() {
            return validFrom;
        }

        public void setValidFrom(String validFrom) {
            this.validFrom = validFrom;
        }

        public String getValidTo() {
            return validTo;
        }

        public void setValidTo(String validTo) {
            this.validTo = validTo;
        }

        public String getPurpose() {
            return purpose;
        }

        public void setPurpose(String purpose) {
            this.purpose = purpose;
        }

        public Long getIssuedByUserId() {
            return issuedByUserId;
        }

        public void setIssuedByUserId(Long issuedByUserId) {
            this.issuedByUserId = issuedByUserId;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    public static class GatePassCreateRequest {
        private Long studentId;
        private String issuedToName;
        private String validFrom;
        private String validTo;
        private String purpose;

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public String getIssuedToName() {
            return issuedToName;
        }

        public void setIssuedToName(String issuedToName) {
            this.issuedToName = issuedToName;
        }

        public String getValidFrom() {
            return validFrom;
        }

        public void setValidFrom(String validFrom) {
            this.validFrom = validFrom;
        }

        public String getValidTo() {
            return validTo;
        }

        public void setValidTo(String validTo) {
            this.validTo = validTo;
        }

        public String getPurpose() {
            return purpose;
        }

        public void setPurpose(String purpose) {
            this.purpose = purpose;
        }
    }

    public static class InventoryItemResponse {
        private Long id;
        private String sku;
        private String name;
        private String category;
        private int quantityOnHand;
        private int reorderLevel;
        private String location;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getSku() {
            return sku;
        }

        public void setSku(String sku) {
            this.sku = sku;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public int getQuantityOnHand() {
            return quantityOnHand;
        }

        public void setQuantityOnHand(int quantityOnHand) {
            this.quantityOnHand = quantityOnHand;
        }

        public int getReorderLevel() {
            return reorderLevel;
        }

        public void setReorderLevel(int reorderLevel) {
            this.reorderLevel = reorderLevel;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }
    }

    public static class InventoryItemCreateRequest {
        private String sku;
        private String name;
        private String category;
        private Integer quantityOnHand;
        private Integer reorderLevel;
        private String location;

        public String getSku() {
            return sku;
        }

        public void setSku(String sku) {
            this.sku = sku;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }

        public Integer getQuantityOnHand() {
            return quantityOnHand;
        }

        public void setQuantityOnHand(Integer quantityOnHand) {
            this.quantityOnHand = quantityOnHand;
        }

        public Integer getReorderLevel() {
            return reorderLevel;
        }

        public void setReorderLevel(Integer reorderLevel) {
            this.reorderLevel = reorderLevel;
        }

        public String getLocation() {
            return location;
        }

        public void setLocation(String location) {
            this.location = location;
        }
    }

    public static class FeeReminderResponse {
        private Long id;
        private Long studentId;
        private Long feePaymentId;
        private String dueDate;
        private String channel;
        private String status;
        private String scheduledAt;
        private String sentAt;
        private String lastError;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public Long getFeePaymentId() {
            return feePaymentId;
        }

        public void setFeePaymentId(Long feePaymentId) {
            this.feePaymentId = feePaymentId;
        }

        public String getDueDate() {
            return dueDate;
        }

        public void setDueDate(String dueDate) {
            this.dueDate = dueDate;
        }

        public String getChannel() {
            return channel;
        }

        public void setChannel(String channel) {
            this.channel = channel;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getScheduledAt() {
            return scheduledAt;
        }

        public void setScheduledAt(String scheduledAt) {
            this.scheduledAt = scheduledAt;
        }

        public String getSentAt() {
            return sentAt;
        }

        public void setSentAt(String sentAt) {
            this.sentAt = sentAt;
        }

        public String getLastError() {
            return lastError;
        }

        public void setLastError(String lastError) {
            this.lastError = lastError;
        }
    }

    public static class FeeReminderEnqueueRequest {
        private Long studentId;
        private Long feePaymentId;
        private String dueDate;
        private String channel;

        public Long getStudentId() {
            return studentId;
        }

        public void setStudentId(Long studentId) {
            this.studentId = studentId;
        }

        public Long getFeePaymentId() {
            return feePaymentId;
        }

        public void setFeePaymentId(Long feePaymentId) {
            this.feePaymentId = feePaymentId;
        }

        public String getDueDate() {
            return dueDate;
        }

        public void setDueDate(String dueDate) {
            this.dueDate = dueDate;
        }

        public String getChannel() {
            return channel;
        }

        public void setChannel(String channel) {
            this.channel = channel;
        }
    }

    /** Period summary for payroll accrual (integrate with payroll module later). */
    public static class PayrollAccrualSummaryResponse {
        private String periodLabel;
        private BigDecimal grossAccrued;
        private BigDecimal deductionsAccrued;
        private BigDecimal netAccrued;
        private int employeeCount;
        private List<String> notes;

        public String getPeriodLabel() {
            return periodLabel;
        }

        public void setPeriodLabel(String periodLabel) {
            this.periodLabel = periodLabel;
        }

        public BigDecimal getGrossAccrued() {
            return grossAccrued;
        }

        public void setGrossAccrued(BigDecimal grossAccrued) {
            this.grossAccrued = grossAccrued;
        }

        public BigDecimal getDeductionsAccrued() {
            return deductionsAccrued;
        }

        public void setDeductionsAccrued(BigDecimal deductionsAccrued) {
            this.deductionsAccrued = deductionsAccrued;
        }

        public BigDecimal getNetAccrued() {
            return netAccrued;
        }

        public void setNetAccrued(BigDecimal netAccrued) {
            this.netAccrued = netAccrued;
        }

        public int getEmployeeCount() {
            return employeeCount;
        }

        public void setEmployeeCount(int employeeCount) {
            this.employeeCount = employeeCount;
        }

        public List<String> getNotes() {
            return notes;
        }

        public void setNotes(List<String> notes) {
            this.notes = notes;
        }
    }
}
