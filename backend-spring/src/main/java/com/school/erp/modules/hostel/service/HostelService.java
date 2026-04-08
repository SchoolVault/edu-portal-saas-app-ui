package com.school.erp.modules.hostel.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.hostel.dto.HostelDTOs;
import com.school.erp.modules.hostel.entity.*;
import com.school.erp.modules.hostel.repository.*;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j @Service @RequiredArgsConstructor
public class HostelService {
    private final HostelRoomRepository roomRepo;
    private final HostelAllocationRepository allocRepo;

    @Transactional(readOnly = true)
    public List<HostelDTOs.RoomResponse> getRooms() {
        String t = TenantContext.getTenantId();
        return roomRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(r -> {
            List<HostelAllocation> allocs = allocRepo.findByTenantIdAndRoomIdAndIsDeletedFalse(t, r.getId())
                    .stream().filter(a -> a.getStatus() == Enums.HostelAllocationStatus.ACTIVE).toList();
            return HostelDTOs.RoomResponse.builder()
                    .id(r.getId()).roomNumber(r.getRoomNumber()).block(r.getBlock()).floor(r.getFloor())
                    .capacity(r.getCapacity()).occupancy(allocs.size()).roomType(r.getRoomType())
                    .residents(allocs.stream().map(a -> HostelDTOs.AllocationDTO.builder()
                            .id(a.getId()).studentId(a.getStudentId()).studentName(a.getStudentName())
                            .fromDate(a.getFromDate() != null ? a.getFromDate().toString() : null)
                            .toDate(a.getToDate() != null ? a.getToDate().toString() : null)
                            .status(a.getStatus().name().toLowerCase()).build()
                    ).collect(Collectors.toList()))
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public HostelRoom createRoom(HostelRoom room) {
        room.setTenantId(TenantContext.getTenantId());
        room.setOccupancy(0);
        return roomRepo.save(room);
    }

    @Transactional
    public HostelDTOs.AllocationDTO allocateStudent(HostelDTOs.AllocateRequest req) {
        String t = TenantContext.getTenantId();
        HostelRoom room = roomRepo.findById(req.getRoomId()).orElseThrow(() -> new ResourceNotFoundException("Room", req.getRoomId()));
        if (!room.getTenantId().equals(t)) throw new BusinessException("Room not found");

        long currentOccupancy = allocRepo.findByTenantIdAndRoomIdAndIsDeletedFalse(t, req.getRoomId())
                .stream().filter(a -> a.getStatus() == Enums.HostelAllocationStatus.ACTIVE).count();
        if (currentOccupancy >= room.getCapacity()) throw new BusinessException("Room is full (capacity: " + room.getCapacity() + ")");

        HostelAllocation alloc = HostelAllocation.builder()
                .roomId(req.getRoomId()).roomNumber(room.getRoomNumber())
                .studentId(req.getStudentId()).studentName(req.getStudentName())
                .fromDate(req.getFromDate() != null ? req.getFromDate() : LocalDate.now())
                .toDate(req.getToDate()).status(Enums.HostelAllocationStatus.ACTIVE).build();
        alloc.setTenantId(t);
        allocRepo.save(alloc);

        room.setOccupancy((int) currentOccupancy + 1);
        roomRepo.save(room);

        log.info("Student {} allocated to room {}", req.getStudentId(), room.getRoomNumber());
        return HostelDTOs.AllocationDTO.builder().id(alloc.getId()).studentId(alloc.getStudentId())
                .studentName(alloc.getStudentName()).fromDate(alloc.getFromDate().toString())
                .status("active").build();
    }

    @Transactional
    public void vacateStudent(Long allocationId) {
        String t = TenantContext.getTenantId();
        HostelAllocation alloc = allocRepo.findById(allocationId).orElseThrow(() -> new ResourceNotFoundException("Allocation", allocationId));
        if (!alloc.getTenantId().equals(t)) throw new BusinessException("Not found");
        alloc.setStatus(Enums.HostelAllocationStatus.VACATED);
        alloc.setToDate(LocalDate.now());
        allocRepo.save(alloc);

        HostelRoom room = roomRepo.findById(alloc.getRoomId()).orElse(null);
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
        return HostelDTOs.HostelStats.builder()
                .totalRooms(totalRooms).totalCapacity(totalCapacity).totalOccupancy(totalOccupancy)
                .availableBeds(totalCapacity - totalOccupancy).blocks((int) blocks).build();
    }
}
