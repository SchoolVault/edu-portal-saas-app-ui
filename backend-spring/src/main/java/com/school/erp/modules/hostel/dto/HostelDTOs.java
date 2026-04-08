package com.school.erp.modules.hostel.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

public class HostelDTOs {
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RoomResponse {
        private Long id; private String roomNumber; private String block; private Integer floor;
        private Integer capacity; private int occupancy; private String roomType;
        private List<AllocationDTO> residents;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AllocationDTO {
        private Long id; private Long studentId; private String studentName;
        private String fromDate; private String toDate; private String status;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AllocateRequest {
        @NotNull private Long roomId; @NotNull private Long studentId;
        private String studentName; private LocalDate fromDate; private LocalDate toDate;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class HostelStats {
        private int totalRooms; private int totalCapacity; private int totalOccupancy;
        private int availableBeds; private int blocks;
    }
}
