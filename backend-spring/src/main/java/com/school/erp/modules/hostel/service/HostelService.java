package com.school.erp.modules.hostel.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.hostel.config.HostelIncidentSlaProperties;
import com.school.erp.modules.hostel.dto.HostelDTOs;
import com.school.erp.modules.hostel.entity.Hostel;
import com.school.erp.modules.hostel.entity.HostelAllocation;
import com.school.erp.modules.hostel.entity.HostelBillingProfile;
import com.school.erp.modules.hostel.entity.HostelGatePassRequest;
import com.school.erp.modules.hostel.entity.HostelIncidentLog;
import com.school.erp.modules.hostel.entity.HostelAuditLog;
import com.school.erp.modules.hostel.entity.HostelBillingRunLedger;
import com.school.erp.modules.hostel.entity.HostelBookingRequest;
import com.school.erp.modules.hostel.entity.HostelRoom;
import com.school.erp.modules.hostel.entity.HostelVisitorEntry;
import com.school.erp.modules.hostel.repository.HostelAuditLogRepository;
import com.school.erp.modules.hostel.repository.HostelBillingRunLedgerRepository;
import com.school.erp.modules.hostel.repository.HostelBookingRequestRepository;
import com.school.erp.modules.hostel.repository.HostelIncidentLogRepository;
import com.school.erp.modules.hostel.repository.HostelAllocationRepository;
import com.school.erp.modules.hostel.repository.HostelBillingProfileRepository;
import com.school.erp.modules.hostel.repository.HostelGatePassRequestRepository;
import com.school.erp.modules.hostel.repository.HostelRepository;
import com.school.erp.modules.hostel.repository.HostelRoomRepository;
import com.school.erp.modules.hostel.repository.HostelVisitorEntryRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.notification.service.NotificationService;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class HostelService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HostelService.class);
    private static final List<String> INCIDENT_RESOLUTION_REASONS = List.of(
            "MEDICAL_HANDLED",
            "DISCIPLINE_COUNSELLED",
            "FALSE_ALARM",
            "PARENT_INFORMED",
            "FACILITY_FIXED",
            "EXTERNAL_SUPPORT_CLOSED",
            "OTHER");
    private final HostelRoomRepository roomRepo;
    private final HostelAllocationRepository allocRepo;
    private final HostelRepository hostelRepo;
    private final HostelBillingProfileRepository billingProfileRepo;
    private final HostelGatePassRequestRepository gatePassRepo;
    private final HostelVisitorEntryRepository visitorEntryRepo;
    private final HostelIncidentLogRepository incidentRepo;
    private final HostelAuditLogRepository auditLogRepository;
    private final HostelBillingRunLedgerRepository billingRunLedgerRepository;
    private final HostelBookingRequestRepository bookingRequestRepository;
    private final StudentRepository studentRepository;
    private final GuardianService guardianService;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final HostelIncidentSlaProperties hostelIncidentSlaProperties;

    @Transactional(readOnly = true)
    public List<HostelDTOs.HostelSummary> listHostels() {
        String t = TenantContext.getTenantId();
        return hostelRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(h -> {
            HostelDTOs.HostelSummary s = new HostelDTOs.HostelSummary();
            s.setId(h.getId());
            s.setName(h.getName());
            s.setCode(h.getCode());
            s.setGenderScope(h.getGenderScope());
            int rooms = roomRepo.findByTenantIdAndHostelIdAndIsDeletedFalse(t, h.getId()).size();
            int freeBeds = roomRepo.findByTenantIdAndHostelIdAndIsDeletedFalse(t, h.getId()).stream()
                    .mapToInt(r -> {
                        int cap = r.getCapacity() != null ? r.getCapacity() : 0;
                        int occ = r.getOccupancy() != null ? r.getOccupancy() : 0;
                        return Math.max(0, cap - occ);
                    }).sum();
            s.setRoomCount(rooms);
            s.setAvailableBeds(freeBeds);
            return s;
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<HostelDTOs.RoomResponse> getRoomsPaged(int page, int size) {
        String t = TenantContext.getTenantId();
        java.util.Map<Long, String> hostelNames = hostelRepo.findByTenantIdAndIsDeletedFalse(t).stream()
                .collect(Collectors.toMap(Hostel::getId, Hostel::getName, (a, b) -> a));
        Pageable p = PageRequest.of(page, size);
        Page<HostelRoom> pg = roomRepo.findByTenantIdAndIsDeletedFalseOrderByHostelIdAscRoomNumberAsc(t, p);
        List<HostelDTOs.RoomResponse> content = pg.getContent().stream().map(r -> toRoomResponse(r, t, hostelNames)).collect(Collectors.toList());
        log.debug("Hostel rooms paged page={} total={}", page, pg.getTotalElements());
        return PageResponse.of(content, page, size, pg.getTotalElements());
    }

    private HostelDTOs.RoomResponse toRoomResponse(HostelRoom r, String t, java.util.Map<Long, String> hostelNames) {
        List<HostelAllocation> allocs = allocRepo.findByTenantIdAndRoomIdAndIsDeletedFalse(t, r.getId()).stream()
                .filter(a -> a.getStatus() == Enums.HostelAllocationStatus.ACTIVE).toList();
        HostelDTOs.RoomResponse resp = HostelDTOs.RoomResponse.builder().id(r.getId()).roomNumber(r.getRoomNumber()).block(r.getBlock()).floor(r.getFloor()).capacity(r.getCapacity()).occupancy(allocs.size()).roomType(r.getRoomType()).residents(allocs.stream().map(a -> HostelDTOs.AllocationDTO.builder().id(a.getId()).studentId(a.getStudentId()).studentName(a.getStudentName()).fromDate(a.getFromDate() != null ? a.getFromDate().toString() : null).toDate(a.getToDate() != null ? a.getToDate().toString() : null).status(a.getStatus().name().toLowerCase()).build()).collect(Collectors.toList())).build();
        resp.setHostelId(r.getHostelId());
        if (r.getHostelId() != null) {
            resp.setHostelName(hostelNames.get(r.getHostelId()));
        }
        return resp;
    }

    @Transactional
    public Hostel createHostel(Hostel hostel) {
        hostel.setTenantId(TenantContext.getTenantId());
        return hostelRepo.save(hostel);
    }

    @Transactional(readOnly = true)
    public List<HostelDTOs.RoomResponse> getRooms() {
        String t = TenantContext.getTenantId();
        java.util.Map<Long, String> hostelNames = hostelRepo.findByTenantIdAndIsDeletedFalse(t).stream()
                .collect(Collectors.toMap(Hostel::getId, Hostel::getName, (a, b) -> a));
        return roomRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(r -> toRoomResponse(r, t, hostelNames)).collect(Collectors.toList());
    }

    @Transactional
    public HostelRoom createRoom(HostelRoom room) {
        room.setTenantId(TenantContext.getTenantId());
        room.setOccupancy(0);
        return roomRepo.save(room);
    }

    private HostelRoom requireRoom(Long roomId) {
        String t = TenantContext.getTenantId();
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return roomRepo.findById(roomId).filter(r -> !Boolean.TRUE.equals(r.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("Room", roomId));
        }
        return roomRepo.findByIdAndTenantIdAndIsDeletedFalse(roomId, t).orElseThrow(() -> new ResourceNotFoundException("Room", roomId));
    }

    private HostelAllocation requireAllocation(Long allocationId) {
        String t = TenantContext.getTenantId();
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return allocRepo.findById(allocationId).filter(a -> !Boolean.TRUE.equals(a.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("Allocation", allocationId));
        }
        return allocRepo.findByIdAndTenantIdAndIsDeletedFalse(allocationId, t).orElseThrow(() -> new ResourceNotFoundException("Allocation", allocationId));
    }

    @Transactional
    public HostelDTOs.AllocationDTO allocateStudent(HostelDTOs.AllocateRequest req) {
        HostelRoom room = requireRoom(req.getRoomId());
        String t = room.getTenantId();
        long currentOccupancy = allocRepo.findByTenantIdAndRoomIdAndIsDeletedFalse(t, req.getRoomId()).stream().filter(a -> a.getStatus() == Enums.HostelAllocationStatus.ACTIVE).count();
        if (currentOccupancy >= room.getCapacity()) throw new BusinessException("Room is full (capacity: " + room.getCapacity() + ")");
        HostelAllocation alloc = HostelAllocation.builder().roomId(req.getRoomId()).roomNumber(room.getRoomNumber()).studentId(req.getStudentId()).studentName(req.getStudentName()).fromDate(req.getFromDate() != null ? req.getFromDate() : LocalDate.now()).toDate(req.getToDate()).status(Enums.HostelAllocationStatus.ACTIVE).build();
        alloc.setTenantId(t);
        allocRepo.save(alloc);
        room.setOccupancy((int) currentOccupancy + 1);
        roomRepo.save(room);
        audit("HOSTEL_ALLOCATION_CREATED", "HOSTEL_ALLOCATION", alloc.getId(),
                "Student allocated to hostel room",
                Map.of("roomId", String.valueOf(req.getRoomId()), "studentId", String.valueOf(req.getStudentId())));
        log.info("Student {} allocated to room {}", req.getStudentId(), room.getRoomNumber());
        return HostelDTOs.AllocationDTO.builder().id(alloc.getId()).studentId(alloc.getStudentId()).studentName(alloc.getStudentName()).fromDate(alloc.getFromDate().toString()).status("active").build();
    }

    @Transactional
    public void vacateStudent(Long allocationId) {
        HostelAllocation alloc = requireAllocation(allocationId);
        String t = alloc.getTenantId();
        alloc.setStatus(Enums.HostelAllocationStatus.VACATED);
        alloc.setToDate(LocalDate.now());
        allocRepo.save(alloc);
        HostelRoom room = roomRepo.findByIdAndTenantIdAndIsDeletedFalse(alloc.getRoomId(), t).orElse(null);
        if (room != null && room.getOccupancy() > 0) {
            room.setOccupancy(room.getOccupancy() - 1);
            roomRepo.save(room);
        }
        audit("HOSTEL_ALLOCATION_VACATED", "HOSTEL_ALLOCATION", alloc.getId(),
                "Student vacated from room", Map.of("roomId", String.valueOf(alloc.getRoomId())));
    }

    @Transactional
    public HostelDTOs.AllocationDTO transferStudent(Long allocationId, HostelDTOs.TransferRequest req) {
        HostelAllocation alloc = requireAllocation(allocationId);
        if (alloc.getStatus() != Enums.HostelAllocationStatus.ACTIVE) {
            throw new BusinessException("Only active allocations can be transferred");
        }
        HostelRoom sourceRoom = requireRoom(alloc.getRoomId());
        HostelRoom targetRoom = requireRoom(req.getTargetRoomId());
        if (sourceRoom.getId().equals(targetRoom.getId())) {
            throw new BusinessException("Target room must be different from source room");
        }
        String t = alloc.getTenantId();
        long targetOccupancy = allocRepo.findByTenantIdAndRoomIdAndIsDeletedFalse(t, targetRoom.getId()).stream()
                .filter(a -> a.getStatus() == Enums.HostelAllocationStatus.ACTIVE).count();
        int targetCap = targetRoom.getCapacity() != null ? targetRoom.getCapacity() : 0;
        if (targetOccupancy >= targetCap) {
            throw new BusinessException("Target room is full (capacity: " + targetCap + ")");
        }
        LocalDate effectiveDate = req.getEffectiveDate() != null ? req.getEffectiveDate() : LocalDate.now();
        alloc.setStatus(Enums.HostelAllocationStatus.VACATED);
        alloc.setToDate(effectiveDate);
        allocRepo.save(alloc);

        HostelAllocation nextAlloc = HostelAllocation.builder()
                .roomId(targetRoom.getId())
                .roomNumber(targetRoom.getRoomNumber())
                .studentId(alloc.getStudentId())
                .studentName(alloc.getStudentName())
                .fromDate(effectiveDate)
                .toDate(null)
                .status(Enums.HostelAllocationStatus.ACTIVE)
                .build();
        nextAlloc.setTenantId(t);
        allocRepo.save(nextAlloc);

        long sourceOccupancy = allocRepo.findByTenantIdAndRoomIdAndIsDeletedFalse(t, sourceRoom.getId()).stream()
                .filter(a -> a.getStatus() == Enums.HostelAllocationStatus.ACTIVE).count();
        sourceRoom.setOccupancy((int) sourceOccupancy);
        targetRoom.setOccupancy((int) (targetOccupancy + 1));
        roomRepo.save(sourceRoom);
        roomRepo.save(targetRoom);
        audit("HOSTEL_ALLOCATION_TRANSFERRED", "HOSTEL_ALLOCATION", nextAlloc.getId(),
                "Student transferred between rooms",
                Map.of("fromRoomId", String.valueOf(sourceRoom.getId()), "toRoomId", String.valueOf(targetRoom.getId())));

        log.info("Transferred student {} from room {} to room {} reason={}",
                alloc.getStudentId(),
                sourceRoom.getRoomNumber(),
                targetRoom.getRoomNumber(),
                req.getReason());
        return HostelDTOs.AllocationDTO.builder()
                .id(nextAlloc.getId())
                .studentId(nextAlloc.getStudentId())
                .studentName(nextAlloc.getStudentName())
                .fromDate(nextAlloc.getFromDate() != null ? nextAlloc.getFromDate().toString() : null)
                .status("active")
                .build();
    }

    @Transactional(readOnly = true)
    public HostelDTOs.HostelStats getStats() {
        String t = TenantContext.getTenantId();
        List<HostelRoom> rooms = roomRepo.findByTenantIdAndIsDeletedFalse(t);
        int totalRooms = rooms.size();
        int totalCapacity = rooms.stream().mapToInt(r -> r.getCapacity() != null ? r.getCapacity() : 0).sum();
        int totalOccupancy = rooms.stream().mapToInt(r -> r.getOccupancy() != null ? r.getOccupancy() : 0).sum();
        long blocks = rooms.stream().map(HostelRoom::getBlock).distinct().count();
        return HostelDTOs.HostelStats.builder().totalRooms(totalRooms).totalCapacity(totalCapacity).totalOccupancy(totalOccupancy).availableBeds(totalCapacity - totalOccupancy).blocks((int) blocks).build();
    }

    @Transactional
    public HostelRoom updateRoom(Long roomId, HostelRoom patch) {
        HostelRoom r = requireRoom(roomId);
        String t = r.getTenantId();
        if (patch.getHostelId() != null) {
            Hostel h = hostelRepo.findByIdAndTenantIdAndIsDeletedFalse(patch.getHostelId(), t).orElseThrow(() -> new ResourceNotFoundException("Hostel", patch.getHostelId()));
            r.setHostelId(h.getId());
        }
        if (patch.getRoomNumber() != null && !patch.getRoomNumber().isBlank()) {
            r.setRoomNumber(patch.getRoomNumber().trim());
        }
        if (patch.getBlock() != null) {
            r.setBlock(patch.getBlock().trim());
        }
        if (patch.getFloor() != null) {
            r.setFloor(patch.getFloor());
        }
        if (patch.getRoomType() != null && !patch.getRoomType().isBlank()) {
            r.setRoomType(patch.getRoomType().trim());
        }
        if (patch.getCapacity() != null) {
            int occ = r.getOccupancy() != null ? r.getOccupancy() : 0;
            if (patch.getCapacity() < occ) {
                throw new BusinessException("Capacity cannot be lower than current occupancy (" + occ + ")");
            }
            r.setCapacity(patch.getCapacity());
        }
        log.info("Updated hostel room id={} number={}", roomId, r.getRoomNumber());
        return roomRepo.save(r);
    }

    @Transactional(readOnly = true)
    public List<HostelDTOs.BillingProfileResponse> listBillingProfiles() {
        String t = TenantContext.getTenantId();
        return billingProfileRepo.findByTenantIdAndIsDeletedFalseOrderByNextDueDateAsc(t).stream()
                .map(this::toBillingProfileResponse)
                .toList();
    }

    @Transactional
    public HostelDTOs.BillingProfileResponse upsertBillingProfile(HostelDTOs.BillingProfileRequest req) {
        String t = TenantContext.getTenantId();
        HostelBillingProfile profile = billingProfileRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(t, req.getStudentId())
                .orElseGet(HostelBillingProfile::new);
        profile.setTenantId(t);
        profile.setStudentId(req.getStudentId());
        profile.setStudentName(req.getStudentName());
        profile.setFeeStructureId(req.getFeeStructureId());
        profile.setBillingCadence((req.getBillingCadence() == null || req.getBillingCadence().isBlank())
                ? "MONTHLY"
                : req.getBillingCadence().trim().toUpperCase(Locale.ROOT));
        profile.setDepositAmount(req.getDepositAmount());
        profile.setMessChargeAmount(req.getMessChargeAmount());
        profile.setAutoInvoiceEnabled(req.getAutoInvoiceEnabled() == null ? Boolean.TRUE : req.getAutoInvoiceEnabled());
        profile.setNextDueDate(req.getNextDueDate());
        return toBillingProfileResponse(billingProfileRepo.save(profile));
    }

    @Transactional
    public HostelDTOs.BillingRunResponse triggerBillingRun(HostelDTOs.BillingRunRequest req) {
        String t = TenantContext.getTenantId();
        LocalDate dueDate = req.getDueDate() != null ? req.getDueDate() : LocalDate.now();
        String idempotencyKey = (req.getIdempotencyKey() == null || req.getIdempotencyKey().isBlank())
                ? "AUTO-" + dueDate
                : req.getIdempotencyKey().trim();
        HostelBillingRunLedger prior = billingRunLedgerRepository
                .findByTenantIdAndIdempotencyKeyAndIsDeletedFalse(t, idempotencyKey)
                .orElse(null);
        if (prior != null) {
            HostelDTOs.BillingRunResponse replay = new HostelDTOs.BillingRunResponse();
            replay.setRunRef(prior.getRunRef());
            replay.setQueuedProfiles(prior.getQueuedProfiles() != null ? prior.getQueuedProfiles() : 0);
            replay.setDueDate(prior.getDueDate() != null ? prior.getDueDate().toString() : dueDate.toString());
            replay.setNote(prior.getNote());
            return replay;
        }
        List<HostelBillingProfile> profiles = billingProfileRepo.findByTenantIdAndAutoInvoiceEnabledTrueAndIsDeletedFalse(t);
        for (HostelBillingProfile p : profiles) {
            p.setLastInvoiceDate(LocalDate.now());
            if (p.getNextDueDate() == null || !p.getNextDueDate().isAfter(dueDate)) {
                p.setNextDueDate(nextDueDate(dueDate, p.getBillingCadence()));
            }
        }
        billingProfileRepo.saveAll(profiles);
        String runRef = "hostel-billing-" + UUID.randomUUID();
        HostelBillingRunLedger ledger = new HostelBillingRunLedger();
        ledger.setTenantId(t);
        ledger.setIdempotencyKey(idempotencyKey);
        ledger.setRunRef(runRef);
        ledger.setDueDate(dueDate);
        ledger.setStatus("COMPLETED");
        ledger.setQueuedProfiles(profiles.size());
        ledger.setNote(req.getNote());
        ledger.setCompletedAt(LocalDateTime.now());
        billingRunLedgerRepository.save(ledger);
        HostelDTOs.BillingRunResponse out = new HostelDTOs.BillingRunResponse();
        out.setRunRef(runRef);
        out.setQueuedProfiles(profiles.size());
        out.setDueDate(dueDate.toString());
        out.setNote(req.getNote());
        audit("HOSTEL_BILLING_RUN_TRIGGERED", "HOSTEL_BILLING_RUN", ledger.getId(),
                "Triggered hostel billing run", Map.of("dueDate", dueDate.toString(), "queuedProfiles", String.valueOf(profiles.size())));
        log.info("Hostel billing run queued tenant={} dueDate={} profiles={}", t, dueDate, profiles.size());
        return out;
    }

    @Transactional(readOnly = true)
    public List<HostelDTOs.GatePassResponse> listGatePasses(String status) {
        String t = TenantContext.getTenantId();
        List<HostelGatePassRequest> rows = (status == null || status.isBlank())
                ? gatePassRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t)
                : gatePassRepo.findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(t, status.trim().toUpperCase(Locale.ROOT));
        return rows.stream().map(this::toGatePassResponse).toList();
    }

    @Transactional
    public HostelDTOs.GatePassResponse createGatePassRequest(HostelDTOs.GatePassRequest req) {
        String t = TenantContext.getTenantId();
        HostelGatePassRequest row = new HostelGatePassRequest();
        row.setTenantId(t);
        row.setStudentId(req.getStudentId());
        row.setStudentName(req.getStudentName());
        row.setRequestType((req.getRequestType() == null || req.getRequestType().isBlank()) ? "LEAVE_OUT" : req.getRequestType().trim().toUpperCase(Locale.ROOT));
        row.setReason(req.getReason());
        row.setOutAt(req.getOutAt());
        row.setExpectedInAt(req.getExpectedInAt());
        row.setStatus("PENDING");
        return toGatePassResponse(gatePassRepo.save(row));
    }

    @Transactional
    public HostelDTOs.GatePassResponse approveGatePass(Long id, HostelDTOs.ApprovalActionRequest req) {
        HostelGatePassRequest row = requireGatePass(id);
        row.setStatus("APPROVED");
        row.setApprovedAt(LocalDateTime.now());
        row.setApprovalNote(req != null ? req.getNote() : null);
        return toGatePassResponse(gatePassRepo.save(row));
    }

    @Transactional
    public HostelDTOs.GatePassResponse rejectGatePass(Long id, HostelDTOs.ApprovalActionRequest req) {
        HostelGatePassRequest row = requireGatePass(id);
        row.setStatus("REJECTED");
        row.setApprovedAt(LocalDateTime.now());
        row.setApprovalNote(req != null ? req.getNote() : null);
        return toGatePassResponse(gatePassRepo.save(row));
    }

    @Transactional
    public HostelDTOs.GatePassResponse markGatePassReturned(Long id) {
        HostelGatePassRequest row = requireGatePass(id);
        row.setStatus("RETURNED");
        row.setActualInAt(LocalDateTime.now());
        return toGatePassResponse(gatePassRepo.save(row));
    }

    @Transactional(readOnly = true)
    public List<HostelDTOs.VisitorEntryResponse> listVisitors(String status) {
        String t = TenantContext.getTenantId();
        List<HostelVisitorEntry> rows = (status == null || status.isBlank())
                ? visitorEntryRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t)
                : visitorEntryRepo.findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(t, status.trim().toUpperCase(Locale.ROOT));
        return rows.stream().map(this::toVisitorEntryResponse).toList();
    }

    @Transactional
    public HostelDTOs.VisitorEntryResponse createVisitor(HostelDTOs.VisitorEntryRequest req) {
        String t = TenantContext.getTenantId();
        HostelVisitorEntry row = new HostelVisitorEntry();
        row.setTenantId(t);
        row.setStudentId(req.getStudentId());
        row.setStudentName(req.getStudentName());
        row.setVisitorName(req.getVisitorName());
        row.setRelationLabel(req.getRelationLabel());
        row.setVisitorPhone(req.getVisitorPhone());
        row.setPurpose(req.getPurpose());
        row.setCheckInAt(req.getCheckInAt() != null ? req.getCheckInAt() : LocalDateTime.now());
        row.setStatus("PENDING");
        return toVisitorEntryResponse(visitorEntryRepo.save(row));
    }

    @Transactional
    public HostelDTOs.VisitorEntryResponse approveVisitor(Long id, HostelDTOs.ApprovalActionRequest req) {
        HostelVisitorEntry row = requireVisitorEntry(id);
        row.setStatus("APPROVED");
        row.setApprovedAt(LocalDateTime.now());
        row.setApprovalNote(req != null ? req.getNote() : null);
        return toVisitorEntryResponse(visitorEntryRepo.save(row));
    }

    @Transactional
    public HostelDTOs.VisitorEntryResponse rejectVisitor(Long id, HostelDTOs.ApprovalActionRequest req) {
        HostelVisitorEntry row = requireVisitorEntry(id);
        row.setStatus("REJECTED");
        row.setApprovedAt(LocalDateTime.now());
        row.setApprovalNote(req != null ? req.getNote() : null);
        return toVisitorEntryResponse(visitorEntryRepo.save(row));
    }

    @Transactional
    public HostelDTOs.VisitorEntryResponse checkOutVisitor(Long id) {
        HostelVisitorEntry row = requireVisitorEntry(id);
        row.setStatus("CHECKED_OUT");
        row.setCheckOutAt(LocalDateTime.now());
        return toVisitorEntryResponse(visitorEntryRepo.save(row));
    }

    @Transactional(readOnly = true)
    public List<HostelDTOs.IncidentResponse> listIncidents(Long studentId) {
        String t = TenantContext.getTenantId();
        List<HostelIncidentLog> rows = studentId == null
                ? incidentRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t)
                : incidentRepo.findByTenantIdAndStudentIdAndIsDeletedFalseOrderByCreatedAtDesc(t, studentId);
        return rows.stream().map(this::toIncidentResponse).toList();
    }

    @Transactional
    public HostelDTOs.IncidentResponse createIncident(HostelDTOs.IncidentRequest req) {
        String t = TenantContext.getTenantId();
        HostelIncidentLog row = new HostelIncidentLog();
        row.setTenantId(t);
        row.setStudentId(req.getStudentId());
        row.setStudentName(req.getStudentName());
        row.setIncidentType((req.getIncidentType() == null || req.getIncidentType().isBlank()) ? "GENERAL" : req.getIncidentType().trim().toUpperCase(Locale.ROOT));
        row.setSeverity((req.getSeverity() == null || req.getSeverity().isBlank()) ? "MEDIUM" : req.getSeverity().trim().toUpperCase(Locale.ROOT));
        row.setSummary(req.getSummary());
        row.setOccurredAt(req.getOccurredAt() != null ? req.getOccurredAt() : LocalDateTime.now());
        int slaMin = req.getSlaMinutes() != null && req.getSlaMinutes() > 0
                ? req.getSlaMinutes()
                : defaultSlaMinutesBySeverity(row.getSeverity());
        row.setSlaDueAt(row.getOccurredAt().plusMinutes(slaMin));
        row.setStatus("OPEN");
        HostelIncidentLog saved = incidentRepo.save(row);
        audit("HOSTEL_INCIDENT_CREATED", "HOSTEL_INCIDENT", saved.getId(), "Incident logged",
                Map.of("severity", saved.getSeverity(), "status", saved.getStatus()));
        if ("CRITICAL".equals(saved.getSeverity()) || "HIGH".equals(saved.getSeverity())) {
            applyIncidentEscalationHooks(saved, "AUTO_SEVERITY", "Auto-escalated by severity");
        }
        return toIncidentResponse(saved);
    }

    @Transactional
    public HostelDTOs.IncidentResponse escalateIncident(Long id, HostelDTOs.IncidentEscalationRequest req) {
        HostelIncidentLog row = requireIncident(id);
        String lvl = (req != null && req.getEscalationLevel() != null && !req.getEscalationLevel().isBlank())
                ? req.getEscalationLevel().trim().toUpperCase(Locale.ROOT)
                : "LEVEL_1";
        row.setStatus("ESCALATED");
        row.setEscalatedAt(LocalDateTime.now());
        row.setEscalationLevel(lvl);
        HostelIncidentLog saved = incidentRepo.save(row);
        applyIncidentEscalationHooks(saved, lvl, req != null ? req.getNote() : null);
        return toIncidentResponse(saved);
    }

    @Transactional
    public HostelDTOs.IncidentResponse resolveIncident(Long id, HostelDTOs.IncidentResolveRequest req) {
        HostelIncidentLog row = requireIncident(id);
        row.setStatus("RESOLVED");
        String reason = sanitizeResolutionReason(req != null ? req.getResolutionReason() : null);
        row.setResolutionReason(reason);
        row.setResolutionNote(req != null ? req.getNote() : null);
        HostelIncidentLog saved = incidentRepo.save(row);
        audit("HOSTEL_INCIDENT_RESOLVED", "HOSTEL_INCIDENT", saved.getId(),
                "Incident marked resolved", Map.of("status", saved.getStatus(), "resolutionReason", reason));
        return toIncidentResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<HostelDTOs.AuditLogResponse> listAuditLogs() {
        String t = TenantContext.getTenantId();
        return auditLogRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t).stream().map(a -> {
            HostelDTOs.AuditLogResponse r = new HostelDTOs.AuditLogResponse();
            r.setId(a.getId());
            r.setActionCode(a.getActionCode());
            r.setEntityType(a.getEntityType());
            r.setEntityId(a.getEntityId());
            r.setActorUserId(a.getActorUserId());
            r.setActorRole(a.getActorRole());
            r.setActorName(a.getActorName());
            r.setChangeSummary(a.getChangeSummary());
            r.setCreatedAt(a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            return r;
        }).toList();
    }

    @Transactional
    public HostelDTOs.BookingResponse createBookingRequestByParent(HostelDTOs.BookingRequestCreate req) {
        Student s = assertParentOwnsStudent(req.getStudentId());
        String t = TenantContext.getTenantId();
        HostelBookingRequest row = new HostelBookingRequest();
        row.setTenantId(t);
        row.setStudentId(s.getId());
        row.setStudentName((s.getFirstName() + " " + s.getLastName()).trim());
        row.setParentUserId(TenantContext.getUserId());
        row.setPreferredHostelId(req.getPreferredHostelId());
        row.setPreferredRoomType(req.getPreferredRoomType());
        row.setRequestNote(req.getRequestNote());
        row.setStatus("PENDING");
        HostelBookingRequest saved = bookingRequestRepository.save(row);
        audit("HOSTEL_BOOKING_REQUEST_CREATED", "HOSTEL_BOOKING_REQUEST", saved.getId(),
                "Parent booking request created", Map.of("studentId", String.valueOf(saved.getStudentId())));
        return toBookingResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<HostelDTOs.BookingResponse> listBookingRequests(String status) {
        String t = TenantContext.getTenantId();
        List<HostelBookingRequest> rows = (status == null || status.isBlank())
                ? bookingRequestRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t)
                : bookingRequestRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(t, status.trim().toUpperCase(Locale.ROOT));
        return rows.stream().map(this::toBookingResponse).toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<HostelDTOs.BookingResponse> listBookingRequestsPaged(
            String status,
            Long studentId,
            String query,
            int page,
            int size) {
        String t = TenantContext.getTenantId();
        int safePage = Math.max(page, 0);
        int safeSize = Math.max(size, 1);
        Pageable pageable = PageRequest.of(safePage, safeSize);
        String normalizedStatus = (status == null || status.isBlank()) ? null : status.trim().toUpperCase(Locale.ROOT);
        String normalizedQuery = (query == null || query.isBlank()) ? null : query.trim();
        Page<HostelBookingRequest> rows = bookingRequestRepository.searchDeskBookings(
                t,
                normalizedStatus,
                studentId,
                normalizedQuery,
                pageable);
        return PageResponse.of(rows.getContent().stream().map(this::toBookingResponse).toList(), safePage, safeSize, rows.getTotalElements());
    }

    @Transactional(readOnly = true)
    public List<String> listIncidentResolutionReasons() {
        return INCIDENT_RESOLUTION_REASONS;
    }

    @Transactional(readOnly = true)
    public List<HostelDTOs.BookingResponse> listMyBookingRequests() {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        return bookingRequestRepository.findByTenantIdAndParentUserIdAndIsDeletedFalseOrderByCreatedAtDesc(t, uid).stream()
                .map(this::toBookingResponse)
                .toList();
    }

    @Transactional
    public HostelDTOs.BookingResponse approveBookingRequest(Long bookingId, HostelDTOs.BookingDecisionRequest req) {
        HostelBookingRequest row = requireBookingRequest(bookingId);
        if (!"PENDING".equalsIgnoreCase(row.getStatus())) {
            throw new BusinessException("Only pending booking requests can be approved");
        }
        HostelDTOs.AllocateRequest ar = new HostelDTOs.AllocateRequest();
        ar.setRoomId(req.getRoomId());
        ar.setStudentId(row.getStudentId());
        ar.setStudentName(row.getStudentName());
        HostelDTOs.AllocationDTO alloc = allocateStudent(ar);
        row.setStatus("APPROVED");
        row.setDecisionNote(req.getDecisionNote());
        row.setApprovedAllocationId(alloc.getId());
        HostelBookingRequest saved = bookingRequestRepository.save(row);
        audit("HOSTEL_BOOKING_REQUEST_APPROVED", "HOSTEL_BOOKING_REQUEST", saved.getId(),
                "Booking request approved", Map.of("allocationId", String.valueOf(alloc.getId())));
        return toBookingResponse(saved);
    }

    @Transactional
    public HostelDTOs.BookingResponse rejectBookingRequest(Long bookingId, String note) {
        HostelBookingRequest row = requireBookingRequest(bookingId);
        row.setStatus("REJECTED");
        row.setDecisionNote(note);
        HostelBookingRequest saved = bookingRequestRepository.save(row);
        audit("HOSTEL_BOOKING_REQUEST_REJECTED", "HOSTEL_BOOKING_REQUEST", saved.getId(),
                "Booking request rejected", Map.of());
        return toBookingResponse(saved);
    }

    @Transactional(readOnly = true)
    public HostelDTOs.HostelPortalProfileResponse getParentPortalHostelProfile(Long studentId) {
        Student s = assertParentOwnsStudent(studentId);
        return buildPortalProfileForStudent(s);
    }

    @Transactional(readOnly = true)
    public HostelDTOs.HostelPortalProfileResponse getStudentPortalHostelProfile() {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        if (uid == null) {
            throw new UnauthorizedException("Missing student principal");
        }
        Student s = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(uid, t)
                .orElseThrow(() -> new ResourceNotFoundException("Student", uid));
        return buildPortalProfileForStudent(s);
    }

    private HostelGatePassRequest requireGatePass(Long id) {
        String t = TenantContext.getTenantId();
        return gatePassRepo.findByIdAndTenantIdAndIsDeletedFalse(id, t)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel gate pass", id));
    }

    private HostelVisitorEntry requireVisitorEntry(Long id) {
        String t = TenantContext.getTenantId();
        return visitorEntryRepo.findByIdAndTenantIdAndIsDeletedFalse(id, t)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel visitor", id));
    }

    private HostelIncidentLog requireIncident(Long id) {
        String t = TenantContext.getTenantId();
        return incidentRepo.findByIdAndTenantIdAndIsDeletedFalse(id, t)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel incident", id));
    }

    private HostelBookingRequest requireBookingRequest(Long id) {
        String t = TenantContext.getTenantId();
        return bookingRequestRepository.findByIdAndTenantIdAndIsDeletedFalse(id, t)
                .orElseThrow(() -> new ResourceNotFoundException("Hostel booking request", id));
    }

    private HostelDTOs.BillingProfileResponse toBillingProfileResponse(HostelBillingProfile p) {
        HostelDTOs.BillingProfileResponse r = new HostelDTOs.BillingProfileResponse();
        r.setId(p.getId());
        r.setStudentId(p.getStudentId());
        r.setStudentName(p.getStudentName());
        r.setFeeStructureId(p.getFeeStructureId());
        r.setBillingCadence(p.getBillingCadence());
        r.setDepositAmount(p.getDepositAmount());
        r.setMessChargeAmount(p.getMessChargeAmount());
        r.setAutoInvoiceEnabled(p.getAutoInvoiceEnabled());
        r.setLastInvoiceDate(p.getLastInvoiceDate() != null ? p.getLastInvoiceDate().toString() : null);
        r.setNextDueDate(p.getNextDueDate() != null ? p.getNextDueDate().toString() : null);
        return r;
    }

    private HostelDTOs.GatePassResponse toGatePassResponse(HostelGatePassRequest row) {
        HostelDTOs.GatePassResponse out = new HostelDTOs.GatePassResponse();
        out.setId(row.getId());
        out.setStudentId(row.getStudentId());
        out.setStudentName(row.getStudentName());
        out.setRequestType(row.getRequestType());
        out.setStatus(row.getStatus());
        out.setReason(row.getReason());
        out.setOutAt(row.getOutAt() != null ? row.getOutAt().toString() : null);
        out.setExpectedInAt(row.getExpectedInAt() != null ? row.getExpectedInAt().toString() : null);
        out.setActualInAt(row.getActualInAt() != null ? row.getActualInAt().toString() : null);
        out.setApprovalNote(row.getApprovalNote());
        return out;
    }

    private HostelDTOs.VisitorEntryResponse toVisitorEntryResponse(HostelVisitorEntry row) {
        HostelDTOs.VisitorEntryResponse out = new HostelDTOs.VisitorEntryResponse();
        out.setId(row.getId());
        out.setStudentId(row.getStudentId());
        out.setStudentName(row.getStudentName());
        out.setVisitorName(row.getVisitorName());
        out.setRelationLabel(row.getRelationLabel());
        out.setVisitorPhone(row.getVisitorPhone());
        out.setPurpose(row.getPurpose());
        out.setStatus(row.getStatus());
        out.setCheckInAt(row.getCheckInAt() != null ? row.getCheckInAt().toString() : null);
        out.setCheckOutAt(row.getCheckOutAt() != null ? row.getCheckOutAt().toString() : null);
        out.setApprovalNote(row.getApprovalNote());
        return out;
    }

    private HostelDTOs.IncidentResponse toIncidentResponse(HostelIncidentLog row) {
        HostelDTOs.IncidentResponse out = new HostelDTOs.IncidentResponse();
        out.setId(row.getId());
        out.setStudentId(row.getStudentId());
        out.setStudentName(row.getStudentName());
        out.setIncidentType(row.getIncidentType());
        out.setSeverity(row.getSeverity());
        out.setStatus(row.getStatus());
        out.setSummary(row.getSummary());
        out.setOccurredAt(row.getOccurredAt() != null ? row.getOccurredAt().toString() : null);
        out.setEscalatedAt(row.getEscalatedAt() != null ? row.getEscalatedAt().toString() : null);
        out.setEscalationLevel(row.getEscalationLevel());
        out.setResolutionNote(row.getResolutionNote());
        out.setResolutionReason(row.getResolutionReason());
        out.setSlaDueAt(row.getSlaDueAt() != null ? row.getSlaDueAt().toString() : null);
        return out;
    }

    private HostelDTOs.BookingResponse toBookingResponse(HostelBookingRequest row) {
        HostelDTOs.BookingResponse out = new HostelDTOs.BookingResponse();
        out.setId(row.getId());
        out.setStudentId(row.getStudentId());
        out.setStudentName(row.getStudentName());
        out.setParentUserId(row.getParentUserId());
        out.setPreferredHostelId(row.getPreferredHostelId());
        out.setPreferredRoomType(row.getPreferredRoomType());
        out.setStatus(row.getStatus());
        out.setRequestNote(row.getRequestNote());
        out.setDecisionNote(row.getDecisionNote());
        out.setApprovedAllocationId(row.getApprovedAllocationId());
        out.setCreatedAt(row.getCreatedAt() != null ? row.getCreatedAt().toString() : null);
        return out;
    }

    private HostelDTOs.HostelPortalProfileResponse buildPortalProfileForStudent(Student s) {
        String t = TenantContext.getTenantId();
        HostelDTOs.HostelPortalProfileResponse out = new HostelDTOs.HostelPortalProfileResponse();
        out.setStudentId(s.getId());
        out.setStudentName((s.getFirstName() + " " + s.getLastName()).trim());
        HostelAllocation active = allocRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(t, s.getId()).stream()
                .filter(a -> a.getStatus() == Enums.HostelAllocationStatus.ACTIVE)
                .findFirst()
                .orElse(null);
        if (active != null) {
            out.setRoomNumber(active.getRoomNumber());
            HostelRoom room = roomRepo.findByIdAndTenantIdAndIsDeletedFalse(active.getRoomId(), t).orElse(null);
            if (room != null) {
                out.setRoomType(room.getRoomType());
                out.setOccupancyLabel((room.getOccupancy() != null ? room.getOccupancy() : 0) + "/" + (room.getCapacity() != null ? room.getCapacity() : 0));
                if (room.getHostelId() != null) {
                    hostelRepo.findByIdAndTenantIdAndIsDeletedFalse(room.getHostelId(), t).ifPresent(h -> out.setHostelName(h.getName()));
                }
            }
        }
        billingProfileRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(t, s.getId()).ifPresent(bp -> {
            out.setBillingCadence(bp.getBillingCadence());
            out.setNextDueDate(bp.getNextDueDate() != null ? bp.getNextDueDate().toString() : null);
        });
        gatePassRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t).stream()
                .filter(g -> g.getStudentId() != null && g.getStudentId().equals(s.getId()))
                .filter(g -> "PENDING".equals(g.getStatus()) || "APPROVED".equals(g.getStatus()))
                .findFirst()
                .ifPresent(g -> out.setActiveGatePassStatus(g.getStatus()));
        return out;
    }

    private Student assertParentOwnsStudent(Long studentId) {
        String t = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        Student s = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        if (uid == null || (!uid.equals(s.getParentId())
                && !guardianService.guardianUserHasAccessToStudent(t, uid, studentId))) {
            throw new UnauthorizedException("You are not allowed to access this student");
        }
        return s;
    }

    private void applyIncidentEscalationHooks(HostelIncidentLog row, String escalationLevel, String note) {
        String tenantId = row.getTenantId();
        String headline = "[Hostel Incident] " + (row.getSeverity() != null ? row.getSeverity() : "NA") + " - " + (row.getIncidentType() != null ? row.getIncidentType() : "GENERAL");
        String body = "Student: " + (row.getStudentName() != null ? row.getStudentName() : ("#" + row.getStudentId()))
                + " | Status: " + row.getStatus()
                + " | Escalation: " + escalationLevel
                + (note != null && !note.isBlank() ? " | Note: " + note : "");
        List<User> opsRecipients = userRepository.findByTenantIdAndRoleInAndIsDeletedFalseOrderByNameAsc(
                tenantId,
                List.of(Enums.Role.ADMIN, Enums.Role.SCHOOL_STAFF));
        for (User u : opsRecipients) {
            notificationService.createNotification(
                    tenantId,
                    u.getId(),
                    headline,
                    body,
                    Enums.NotificationType.WARNING,
                    "/app/hostel");
        }
        if (row.getStudentId() != null) {
            studentRepository.findByIdAndTenantIdAndIsDeletedFalse(row.getStudentId(), tenantId).ifPresent(s -> {
                if (s.getParentId() != null) {
                    notificationService.createNotification(
                            tenantId,
                            s.getParentId(),
                            "Hostel update for " + (s.getFirstName() + " " + s.getLastName()).trim(),
                            "A hostel incident update is available. Please check the hostel section.",
                            Enums.NotificationType.INFO,
                            "/app/hostel");
                }
            });
        }
        audit("HOSTEL_INCIDENT_ESCALATED", "HOSTEL_INCIDENT", row.getId(),
                "Incident escalated", Map.of("escalationLevel", escalationLevel, "status", row.getStatus()));
    }

    private void audit(String actionCode, String entityType, Long entityId, String summary, Map<String, String> diff) {
        try {
            HostelAuditLog a = new HostelAuditLog();
            a.setTenantId(TenantContext.getTenantId());
            a.setActionCode(actionCode);
            a.setEntityType(entityType);
            a.setEntityId(entityId);
            a.setActorUserId(TenantContext.getUserId());
            a.setActorRole(TenantContext.getUserRole());
            a.setActorName(TenantContext.getUserDisplayName());
            a.setChangeSummary(summary);
            a.setDiffJson(diff == null || diff.isEmpty() ? null : String.valueOf(diff));
            a.setRequestIp(TenantContext.getClientIp());
            auditLogRepository.save(a);
        } catch (Exception ex) {
            log.warn("Hostel audit logging failed action={} entity={} id={}: {}", actionCode, entityType, entityId, ex.getMessage());
        }
    }

    @Transactional
    public int runIncidentSlaSweep() {
        String t = TenantContext.getTenantId();
        if (t == null || t.isBlank()) {
            return 0;
        }
        LocalDateTime now = LocalDateTime.now();
        int escalated = 0;
        List<HostelIncidentLog> open = incidentRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t).stream()
                .filter(i -> "OPEN".equalsIgnoreCase(i.getStatus()))
                .filter(i -> i.getSlaDueAt() != null && i.getSlaDueAt().isBefore(now))
                .toList();
        for (HostelIncidentLog row : open) {
            row.setStatus("ESCALATED");
            row.setEscalatedAt(now);
            row.setEscalationLevel("SLA_BREACH");
            HostelIncidentLog saved = incidentRepo.save(row);
            applyIncidentEscalationHooks(saved, "SLA_BREACH", "SLA timer breached");
            escalated++;
        }
        return escalated;
    }

    private LocalDate nextDueDate(LocalDate from, String cadenceRaw) {
        String cadence = (cadenceRaw == null ? "MONTHLY" : cadenceRaw.trim().toUpperCase(Locale.ROOT));
        return switch (cadence) {
            case "ANNUAL" -> from.plusYears(1);
            case "TERM" -> from.plusMonths(4);
            default -> from.plusMonths(1);
        };
    }

    private int defaultSlaMinutesBySeverity(String severityRaw) {
        String severity = (severityRaw == null ? "MEDIUM" : severityRaw.trim().toUpperCase(Locale.ROOT));
        return switch (severity) {
            case "LOW" -> hostelIncidentSlaProperties.getLowSeveritySlaMinutes();
            case "HIGH" -> hostelIncidentSlaProperties.getHighSeveritySlaMinutes();
            case "CRITICAL" -> hostelIncidentSlaProperties.getCriticalSeveritySlaMinutes();
            default -> hostelIncidentSlaProperties.getMediumSeveritySlaMinutes();
        };
    }

    private String sanitizeResolutionReason(String reasonRaw) {
        String candidate = (reasonRaw == null || reasonRaw.isBlank())
                ? "OTHER"
                : reasonRaw.trim().toUpperCase(Locale.ROOT);
        return INCIDENT_RESOLUTION_REASONS.contains(candidate) ? candidate : "OTHER";
    }

    public HostelService(
            final HostelRoomRepository roomRepo,
            final HostelAllocationRepository allocRepo,
            final HostelRepository hostelRepo,
            final HostelBillingProfileRepository billingProfileRepo,
            final HostelGatePassRequestRepository gatePassRepo,
            final HostelVisitorEntryRepository visitorEntryRepo,
            final HostelIncidentLogRepository incidentRepo,
            final HostelAuditLogRepository auditLogRepository,
            final HostelBillingRunLedgerRepository billingRunLedgerRepository,
            final HostelBookingRequestRepository bookingRequestRepository,
            final StudentRepository studentRepository,
            final GuardianService guardianService,
            final UserRepository userRepository,
            final NotificationService notificationService,
            final HostelIncidentSlaProperties hostelIncidentSlaProperties) {
        this.roomRepo = roomRepo;
        this.allocRepo = allocRepo;
        this.hostelRepo = hostelRepo;
        this.billingProfileRepo = billingProfileRepo;
        this.gatePassRepo = gatePassRepo;
        this.visitorEntryRepo = visitorEntryRepo;
        this.incidentRepo = incidentRepo;
        this.auditLogRepository = auditLogRepository;
        this.billingRunLedgerRepository = billingRunLedgerRepository;
        this.bookingRequestRepository = bookingRequestRepository;
        this.studentRepository = studentRepository;
        this.guardianService = guardianService;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.hostelIncidentSlaProperties = hostelIncidentSlaProperties;
    }
}
