package com.school.erp.modules.library.entity;
import com.school.erp.common.entity.BaseEntity; import com.school.erp.common.enums.Enums;
import jakarta.persistence.*; import lombok.*; import java.math.BigDecimal; import java.time.LocalDate;
@Entity @Table(name = "book_issues", indexes = {@Index(name = "idx_bi_student", columnNames = {"tenant_id", "student_id"})})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class BookIssue extends BaseEntity {
    @Column(name = "book_id", nullable = false) private Long bookId;
    @Column(name = "book_title", length = 200) private String bookTitle;
    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "student_name", length = 200) private String studentName;
    @Column(name = "issue_date") private LocalDate issueDate;
    @Column(name = "due_date") private LocalDate dueDate;
    @Column(name = "return_date") private LocalDate returnDate;
    @Column(precision = 8, scale = 2) private BigDecimal fine;
    @Enumerated(EnumType.STRING) @Column(length = 10) private Enums.BookIssueStatus status;
}
