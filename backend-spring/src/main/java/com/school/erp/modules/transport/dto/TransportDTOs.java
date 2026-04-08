package com.school.erp.modules.transport.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;

public class TransportDTOs {
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RouteResponse {
        private Long id; private String name; private String vehicleNumber;
        private String driverName; private String driverPhone; private int assignedStudents;
        private List<StopDTO> stops; private List<StudentMappingDTO> students;
    }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StopDTO { private Long id; private String name; private String time; private Integer order; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class StudentMappingDTO { private Long id; private Long studentId; private String studentName; private String pickupStop; private String dropStop; }
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AssignStudentRequest {
        @NotNull private Long routeId; @NotNull private Long studentId;
        private String studentName; private String pickupStop; private String dropStop;
    }
}
