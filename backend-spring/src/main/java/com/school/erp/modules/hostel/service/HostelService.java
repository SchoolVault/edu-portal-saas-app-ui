package com.school.erp.modules.hostel.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.hostel.dto.HostelDTOs;
import com.school.erp.modules.hostel.entity.Hostel;
import com.school.erp.modules.hostel.entity.HostelAllocation;
import com.school.erp.modules.hostel.entity.HostelRoom;
import com.school.erp.modules.hostel.repository.HostelAllocationRepository;
import com.school.erp.modules.hostel.repository.HostelRepository;
import com.school.erp.modules.hostel.repository.HostelRoomRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HostelService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(HostelService.class);
    private final HostelRoomRepository roomRepo;
    private final HostelAllocationRepository allocRepo;
    private final HostelRepository hostelRepo;

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

    public HostelService(final HostelRoomRepository roomRepo, final HostelAllocationRepository allocRepo, final HostelRepository hostelRepo) {
        this.roomRepo = roomRepo;
        this.allocRepo = allocRepo;
        this.hostelRepo = hostelRepo;
    }
}
