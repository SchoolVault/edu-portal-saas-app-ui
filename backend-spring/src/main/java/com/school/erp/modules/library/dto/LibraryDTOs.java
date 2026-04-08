package com.school.erp.modules.library.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

public class LibraryDTOs {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class IssueBookRequest {
        @NotNull private Long bookId;
        @NotNull private Long studentId;
        private String studentName;
        private Integer dueDays; // default 14
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BookIssueResponse {
        private Long id;
        private Long bookId;
        private String bookTitle;
        private Long studentId;
        private String studentName;
        private String issueDate;
        private String dueDate;
        private String returnDate;
        private BigDecimal fine;
        private String status;
    }
}
