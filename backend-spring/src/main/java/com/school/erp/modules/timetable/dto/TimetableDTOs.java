package com.school.erp.modules.timetable.dto;

import lombok.*;
import java.util.List;
import java.util.Map;

public class TimetableDTOs {
    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TimetableGridResponse {
        private Long classId;
        private Long sectionId;
        private List<String> days;
        private List<Integer> periods;
        private Map<String, Map<Integer, SlotDTO>> grid; // day -> period -> slot
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class SlotDTO {
        private String subject;
        private String teacher;
        private String room;
        private String startTime;
        private String endTime;
    }
}
