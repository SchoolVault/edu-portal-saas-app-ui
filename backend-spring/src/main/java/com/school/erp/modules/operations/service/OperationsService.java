package com.school.erp.modules.operations.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.operations.dto.OperationsDTOs;
import com.school.erp.modules.operations.entity.*;
import com.school.erp.modules.operations.repository.*;
import com.school.erp.tenant.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OperationsService {

    private static final DateTimeFormatter ISO_DT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    private final OperationalStaffRepository staffRepo;
    private final VisitorLogRepository visitorRepo;
    private final GatePassRepository gatePassRepo;
    private final InventoryItemRepository inventoryRepo;
    private final FeeReminderQueueRepository feeReminderRepo;

    public OperationsService(
            OperationalStaffRepository staffRepo,
            VisitorLogRepository visitorRepo,
            GatePassRepository gatePassRepo,
            InventoryItemRepository inventoryRepo,
            FeeReminderQueueRepository feeReminderRepo) {
        this.staffRepo = staffRepo;
        this.visitorRepo = visitorRepo;
        this.gatePassRepo = gatePassRepo;
        this.inventoryRepo = inventoryRepo;
        this.feeReminderRepo = feeReminderRepo;
    }

    // --- operational staff ---
    @Transactional(readOnly = true)
    public List<OperationsDTOs.OperationalStaffResponse> listStaff() {
        return staffRepo.findByTenantIdAndIsDeletedFalseOrderByFullNameAsc(TenantContext.getTenantId()).stream()
                .map(this::toStaffResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OperationsDTOs.OperationalStaffResponse createStaff(OperationsDTOs.OperationalStaffCreateRequest req) {
        if (req.getFullName() == null || req.getFullName().isBlank() || req.getStaffRole() == null || req.getStaffRole().isBlank()) {
            throw new BusinessException("fullName and staffRole are required");
        }
        OperationalStaff e = new OperationalStaff();
        e.setTenantId(TenantContext.getTenantId());
        e.setStaffRole(req.getStaffRole().trim().toUpperCase());
        e.setFullName(req.getFullName().trim());
        e.setPhone(canonicalPhoneOptional(req.getPhone()));
        e.setEmail(req.getEmail());
        e.setEmployeeCode(req.getEmployeeCode());
        e.setUserId(req.getUserId());
        e.setTransportRouteId(req.getTransportRouteId());
        e.setNotes(req.getNotes());
        e.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        staffRepo.save(e);
        return toStaffResponse(e);
    }

    /**
     * Remove operational staff.
     * Default behavior is lifecycle-safe deactivate (record remains visible in inactive lists and can be restored).
     * Permanent delete is allowed only when the row has no linked ERP user and no transport route (e.g. ad-hoc driver record).
     */
    @Transactional
    public void deleteStaff(Long id, boolean permanent) {
        String tenantId = TenantContext.getTenantId();
        OperationalStaff e = staffRepo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Operational staff not found"));
        if (permanent) {
            if (e.getUserId() != null || e.getTransportRouteId() != null) {
                throw new BusinessException("Permanent delete blocked: unlink user and transport route first, or use soft delete.");
            }
            staffRepo.delete(e);
            return;
        }
        e.setIsActive(false);
        e.setUpdatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        staffRepo.save(e);
    }

    // --- visitors ---
    @Transactional(readOnly = true)
    public List<OperationsDTOs.VisitorLogResponse> listVisitors() {
        return visitorRepo.findByTenantIdAndIsDeletedFalseOrderByCheckInAtDesc(TenantContext.getTenantId()).stream()
                .map(this::toVisitorResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OperationsDTOs.VisitorLogResponse checkInVisitor(OperationsDTOs.VisitorCheckInRequest req) {
        if (req.getVisitorName() == null || req.getVisitorName().isBlank()) {
            throw new BusinessException("visitorName is required");
        }
        VisitorLog v = new VisitorLog();
        v.setTenantId(TenantContext.getTenantId());
        v.setVisitorName(req.getVisitorName().trim());
        v.setPhone(canonicalPhoneOptional(req.getPhone()));
        v.setPurpose(req.getPurpose());
        v.setHostName(req.getHostName());
        v.setBadgeNo("V-" + System.currentTimeMillis());
        v.setCheckInAt(LocalDateTime.now());
        v.setStatus("ON_PREMISES");
        v.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        visitorRepo.save(v);
        return toVisitorResponse(v);
    }

    @Transactional
    public OperationsDTOs.VisitorLogResponse checkOutVisitor(Long id) {
        VisitorLog v = visitorRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Visitor log", id));
        v.setCheckOutAt(LocalDateTime.now());
        v.setStatus("CHECKED_OUT");
        visitorRepo.save(v);
        return toVisitorResponse(v);
    }

    // --- gate passes ---
    @Transactional(readOnly = true)
    public List<OperationsDTOs.GatePassResponse> listGatePasses() {
        return gatePassRepo.findByTenantIdAndIsDeletedFalseOrderByValidFromDesc(TenantContext.getTenantId()).stream()
                .map(this::toGateResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OperationsDTOs.GatePassResponse createGatePass(OperationsDTOs.GatePassCreateRequest req) {
        if (req.getIssuedToName() == null || req.getIssuedToName().isBlank()) {
            throw new BusinessException("issuedToName is required");
        }
        LocalDate from = LocalDate.parse(req.getValidFrom());
        LocalDate to = LocalDate.parse(req.getValidTo());
        GatePass g = new GatePass();
        g.setTenantId(TenantContext.getTenantId());
        g.setStudentId(req.getStudentId());
        g.setIssuedToName(req.getIssuedToName().trim());
        g.setValidFrom(from);
        g.setValidTo(to);
        g.setPurpose(req.getPurpose());
        g.setIssuedByUserId(TenantContext.getUserId());
        g.setStatus("ACTIVE");
        g.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        gatePassRepo.save(g);
        return toGateResponse(g);
    }

    @Transactional
    public void revokeGatePass(Long id) {
        GatePass g = gatePassRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Gate pass", id));
        g.setStatus("REVOKED");
        gatePassRepo.save(g);
    }

    // --- inventory ---
    @Transactional(readOnly = true)
    public List<OperationsDTOs.InventoryItemResponse> listInventory() {
        return inventoryRepo.findByTenantIdAndIsDeletedFalseOrderByNameAsc(TenantContext.getTenantId()).stream()
                .map(this::toInvResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OperationsDTOs.InventoryItemResponse upsertInventory(OperationsDTOs.InventoryItemCreateRequest req) {
        if (req.getSku() == null || req.getSku().isBlank() || req.getName() == null || req.getName().isBlank()) {
            throw new BusinessException("sku and name are required");
        }
        String t = TenantContext.getTenantId();
        InventoryItem e = inventoryRepo.findByTenantIdAndSkuAndIsDeletedFalse(t, req.getSku().trim())
                .orElseGet(InventoryItem::new);
        if (e.getId() == null) {
            e.setTenantId(t);
            e.setSku(req.getSku().trim());
            e.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        }
        e.setName(req.getName().trim());
        e.setCategory(req.getCategory());
        if (req.getQuantityOnHand() != null) {
            e.setQuantityOnHand(req.getQuantityOnHand());
        }
        if (req.getReorderLevel() != null) {
            e.setReorderLevel(req.getReorderLevel());
        }
        e.setLocation(req.getLocation());
        inventoryRepo.save(e);
        return toInvResponse(e);
    }

    @Transactional
    public void deleteInventory(Long id) {
        InventoryItem e = inventoryRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory item", id));
        e.setIsDeleted(true);
        e.setUpdatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        inventoryRepo.save(e);
    }

    // --- fee reminders ---
    @Transactional(readOnly = true)
    public List<OperationsDTOs.FeeReminderResponse> listFeeReminders(String status) {
        String t = TenantContext.getTenantId();
        String st = status != null && !status.isBlank() ? status.toUpperCase() : "PENDING";
        return feeReminderRepo.findByTenantIdAndStatusAndIsDeletedFalseOrderByScheduledAtAsc(t, st).stream()
                .map(this::toFeeRemResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<OperationsDTOs.OperationalStaffResponse> listStaffPaged(int page, int size) {
        Pageable p = PageRequest.of(page, size);
        return PageResponse.fromSpringPage(
                staffRepo.findByTenantIdAndIsDeletedFalseOrderByFullNameAsc(TenantContext.getTenantId(), p).map(this::toStaffResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<OperationsDTOs.OperationalStaffResponse> listStaffPaged(int page, int size, String search, String status) {
        Pageable p = PageRequest.of(page, size);
        Boolean isActive = null;
        if (status != null && !status.isBlank()) {
            String s = status.trim().toLowerCase();
            if ("active".equals(s)) isActive = true;
            else if ("inactive".equals(s)) isActive = false;
        }
        String q = (search == null || search.isBlank()) ? null : search.trim();
        return PageResponse.fromSpringPage(
                staffRepo.searchStaff(TenantContext.getTenantId(), q, isActive, p).map(this::toStaffResponse));
    }

    @Transactional(readOnly = true)
    public OperationsDTOs.OperationalStaffResponse getStaff(Long id) {
        OperationalStaff e = staffRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Operational staff not found"));
        return toStaffResponse(e);
    }

    @Transactional
    public OperationsDTOs.OperationalStaffResponse updateStaff(Long id, OperationsDTOs.OperationalStaffUpdateRequest req) {
        OperationalStaff e = staffRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Operational staff not found"));
        if (req.getStaffRole() != null && !req.getStaffRole().isBlank()) e.setStaffRole(req.getStaffRole().trim().toUpperCase());
        if (req.getFullName() != null && !req.getFullName().isBlank()) e.setFullName(req.getFullName().trim());
        if (req.getPhone() != null) e.setPhone(canonicalPhoneOptional(req.getPhone()));
        if (req.getEmail() != null) e.setEmail(req.getEmail().trim());
        if (req.getEmployeeCode() != null) e.setEmployeeCode(req.getEmployeeCode().trim());
        if (req.getNotes() != null) e.setNotes(req.getNotes().trim());
        e.setUpdatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        staffRepo.save(e);
        return toStaffResponse(e);
    }

    @Transactional
    public OperationsDTOs.OperationalStaffResponse updateStaffStatus(Long id, boolean active) {
        OperationalStaff e = staffRepo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Operational staff not found"));
        e.setIsActive(active);
        e.setUpdatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        staffRepo.save(e);
        return toStaffResponse(e);
    }

    @Transactional(readOnly = true)
    public PageResponse<OperationsDTOs.VisitorLogResponse> listVisitorsPaged(int page, int size) {
        Pageable p = PageRequest.of(page, size);
        return PageResponse.fromSpringPage(
                visitorRepo.findByTenantIdAndIsDeletedFalseOrderByCheckInAtDesc(TenantContext.getTenantId(), p).map(this::toVisitorResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<OperationsDTOs.GatePassResponse> listGatePassesPaged(int page, int size) {
        Pageable p = PageRequest.of(page, size);
        return PageResponse.fromSpringPage(
                gatePassRepo.findByTenantIdAndIsDeletedFalseOrderByValidFromDesc(TenantContext.getTenantId(), p).map(this::toGateResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<OperationsDTOs.InventoryItemResponse> listInventoryPaged(int page, int size) {
        Pageable p = PageRequest.of(page, size);
        return PageResponse.fromSpringPage(
                inventoryRepo.findByTenantIdAndIsDeletedFalseOrderByNameAsc(TenantContext.getTenantId(), p).map(this::toInvResponse));
    }

    /**
     * When {@code status} is blank, returns all reminder rows for the tenant (paged).
     * When set, filters by status (same as non-paged default of PENDING only does not apply here—pass explicit status).
     */
    @Transactional(readOnly = true)
    public PageResponse<OperationsDTOs.FeeReminderResponse> listFeeRemindersPaged(String status, int page, int size) {
        String t = TenantContext.getTenantId();
        Pageable p = PageRequest.of(page, size);
        if (status == null || status.isBlank()) {
            return PageResponse.fromSpringPage(
                    feeReminderRepo.findByTenantIdAndIsDeletedFalseOrderByScheduledAtAsc(t, p).map(this::toFeeRemResponse));
        }
        return PageResponse.fromSpringPage(
                feeReminderRepo.findByTenantIdAndStatusAndIsDeletedFalseOrderByScheduledAtAsc(t, status.trim().toUpperCase(), p)
                        .map(this::toFeeRemResponse));
    }

    @Transactional
    public OperationsDTOs.FeeReminderResponse enqueueFeeReminder(OperationsDTOs.FeeReminderEnqueueRequest req) {
        if (req.getStudentId() == null) {
            throw new BusinessException("studentId is required");
        }
        LocalDate parsedDueDate = null;
        if (req.getDueDate() != null && !req.getDueDate().trim().isEmpty()) {
            try {
                parsedDueDate = LocalDate.parse(req.getDueDate().trim());
            } catch (DateTimeParseException ex) {
                throw new BusinessException("Invalid due date format. Please refresh and try again.");
            }
        }
        FeeReminderQueue q = new FeeReminderQueue();
        q.setTenantId(TenantContext.getTenantId());
        q.setStudentId(req.getStudentId());
        q.setFeePaymentId(req.getFeePaymentId());
        q.setDueDate(parsedDueDate);
        q.setChannel(req.getChannel() != null && !req.getChannel().trim().isEmpty() ? req.getChannel().trim().toUpperCase() : "EMAIL");
        q.setStatus("PENDING");
        q.setScheduledAt(LocalDateTime.now().plusHours(1));
        q.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);
        feeReminderRepo.save(q);
        return toFeeRemResponse(q);
    }

    /** Stub accrual view until payroll engine posts to ledger. */
    @Transactional(readOnly = true)
    public OperationsDTOs.PayrollAccrualSummaryResponse payrollAccrualSummary(String period) {
        OperationsDTOs.PayrollAccrualSummaryResponse r = new OperationsDTOs.PayrollAccrualSummaryResponse();
        r.setPeriodLabel(period != null ? period : LocalDate.now().toString().substring(0, 7));
        r.setGrossAccrued(BigDecimal.valueOf(0));
        r.setDeductionsAccrued(BigDecimal.valueOf(0));
        r.setNetAccrued(BigDecimal.valueOf(0));
        r.setEmployeeCount(0);
        r.setNotes(List.of(
                "Accrual integration pending: connect to payroll runs and GL posting.",
                "Tenant: " + TenantContext.getTenantId()));
        return r;
    }

    private OperationsDTOs.OperationalStaffResponse toStaffResponse(OperationalStaff e) {
        OperationsDTOs.OperationalStaffResponse r = new OperationsDTOs.OperationalStaffResponse();
        r.setId(e.getId());
        r.setIsActive(Boolean.TRUE.equals(e.getIsActive()));
        r.setStaffRole(e.getStaffRole());
        r.setFullName(e.getFullName());
        r.setPhone(e.getPhone());
        r.setEmail(e.getEmail());
        r.setEmployeeCode(e.getEmployeeCode());
        r.setUserId(e.getUserId());
        r.setTransportRouteId(e.getTransportRouteId());
        r.setNotes(e.getNotes());
        return r;
    }

    private OperationsDTOs.VisitorLogResponse toVisitorResponse(VisitorLog v) {
        OperationsDTOs.VisitorLogResponse r = new OperationsDTOs.VisitorLogResponse();
        r.setId(v.getId());
        r.setVisitorName(v.getVisitorName());
        r.setPhone(v.getPhone());
        r.setPurpose(v.getPurpose());
        r.setHostName(v.getHostName());
        r.setBadgeNo(v.getBadgeNo());
        r.setCheckInAt(v.getCheckInAt() != null ? ISO_DT.format(v.getCheckInAt()) : null);
        r.setCheckOutAt(v.getCheckOutAt() != null ? ISO_DT.format(v.getCheckOutAt()) : null);
        r.setStatus(v.getStatus());
        return r;
    }

    private OperationsDTOs.GatePassResponse toGateResponse(GatePass g) {
        OperationsDTOs.GatePassResponse r = new OperationsDTOs.GatePassResponse();
        r.setId(g.getId());
        r.setStudentId(g.getStudentId());
        r.setIssuedToName(g.getIssuedToName());
        r.setValidFrom(g.getValidFrom() != null ? g.getValidFrom().toString() : null);
        r.setValidTo(g.getValidTo() != null ? g.getValidTo().toString() : null);
        r.setPurpose(g.getPurpose());
        r.setIssuedByUserId(g.getIssuedByUserId());
        r.setStatus(g.getStatus());
        return r;
    }

    private OperationsDTOs.InventoryItemResponse toInvResponse(InventoryItem i) {
        OperationsDTOs.InventoryItemResponse r = new OperationsDTOs.InventoryItemResponse();
        r.setId(i.getId());
        r.setSku(i.getSku());
        r.setName(i.getName());
        r.setCategory(i.getCategory());
        r.setQuantityOnHand(i.getQuantityOnHand() != null ? i.getQuantityOnHand() : 0);
        r.setReorderLevel(i.getReorderLevel() != null ? i.getReorderLevel() : 0);
        r.setLocation(i.getLocation());
        return r;
    }

    private OperationsDTOs.FeeReminderResponse toFeeRemResponse(FeeReminderQueue q) {
        OperationsDTOs.FeeReminderResponse r = new OperationsDTOs.FeeReminderResponse();
        r.setId(q.getId());
        r.setStudentId(q.getStudentId());
        r.setFeePaymentId(q.getFeePaymentId());
        r.setDueDate(q.getDueDate() != null ? q.getDueDate().toString() : null);
        r.setChannel(q.getChannel());
        r.setStatus(q.getStatus());
        r.setScheduledAt(q.getScheduledAt() != null ? ISO_DT.format(q.getScheduledAt()) : null);
        r.setSentAt(q.getSentAt() != null ? ISO_DT.format(q.getSentAt()) : null);
        r.setLastError(q.getLastError());
        return r;
    }

    private String canonicalPhoneOptional(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String canonical = InternationalPhone.canonical(raw);
        if (canonical == null) {
            throw new BusinessException(InternationalPhone.invalidMessage());
        }
        return canonical;
    }
}
