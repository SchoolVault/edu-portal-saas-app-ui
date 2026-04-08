package com.school.erp.modules.library.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.library.dto.LibraryDTOs;
import com.school.erp.modules.library.entity.*;
import com.school.erp.modules.library.repository.*;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LibraryService {

    private final BookRepository bookRepo;
    private final BookIssueRepository issueRepo;

    private static final BigDecimal FINE_PER_DAY = BigDecimal.valueOf(2); // $2 per day overdue

    @Transactional(readOnly = true)
    public List<Book> getBooks(String search) {
        List<Book> books = bookRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase();
            return books.stream().filter(b ->
                    b.getTitle().toLowerCase().contains(s) || b.getAuthor().toLowerCase().contains(s) || b.getIsbn().contains(s)
            ).toList();
        }
        return books;
    }

    @Transactional
    public Book addBook(Book book) {
        book.setTenantId(TenantContext.getTenantId());
        if (book.getAvailableCopies() == null) book.setAvailableCopies(book.getTotalCopies());
        return bookRepo.save(book);
    }

    @Transactional
    public LibraryDTOs.BookIssueResponse issueBook(LibraryDTOs.IssueBookRequest req) {
        String t = TenantContext.getTenantId();
        Book book = bookRepo.findById(req.getBookId()).orElseThrow(() -> new ResourceNotFoundException("Book", req.getBookId()));
        if (!book.getTenantId().equals(t)) throw new BusinessException("Book not found");
        if (book.getAvailableCopies() <= 0) throw new BusinessException("No copies available for: " + book.getTitle());

        // Decrease available copies
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepo.save(book);

        BookIssue issue = BookIssue.builder()
                .bookId(req.getBookId()).bookTitle(book.getTitle())
                .studentId(req.getStudentId()).studentName(req.getStudentName())
                .issueDate(LocalDate.now())
                .dueDate(req.getDueDays() != null ? LocalDate.now().plusDays(req.getDueDays()) : LocalDate.now().plusDays(14))
                .fine(BigDecimal.ZERO).status(Enums.BookIssueStatus.ISSUED).build();
        issue.setTenantId(t);
        issueRepo.save(issue);

        log.info("Book issued: {} to student {}", book.getTitle(), req.getStudentId());
        return toIssueResponse(issue);
    }

    @Transactional
    public LibraryDTOs.BookIssueResponse returnBook(Long issueId) {
        String t = TenantContext.getTenantId();
        BookIssue issue = issueRepo.findById(issueId).orElseThrow(() -> new ResourceNotFoundException("BookIssue", issueId));
        if (!issue.getTenantId().equals(t)) throw new BusinessException("Issue not found");
        if (issue.getStatus() == Enums.BookIssueStatus.RETURNED) throw new BusinessException("Book already returned");

        issue.setReturnDate(LocalDate.now());
        issue.setStatus(Enums.BookIssueStatus.RETURNED);

        // Calculate fine if overdue
        if (LocalDate.now().isAfter(issue.getDueDate())) {
            long daysOverdue = ChronoUnit.DAYS.between(issue.getDueDate(), LocalDate.now());
            issue.setFine(FINE_PER_DAY.multiply(BigDecimal.valueOf(daysOverdue)));
        }

        issueRepo.save(issue);

        // Increase available copies
        Book book = bookRepo.findById(issue.getBookId()).orElse(null);
        if (book != null) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepo.save(book);
        }

        log.info("Book returned: {} fine={}", issue.getBookTitle(), issue.getFine());
        return toIssueResponse(issue);
    }

    @Transactional(readOnly = true)
    public List<LibraryDTOs.BookIssueResponse> getIssues(Enums.BookIssueStatus status) {
        List<BookIssue> issues = issueRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        if (status != null) issues = issues.stream().filter(i -> i.getStatus() == status).toList();
        // Auto-mark overdue
        issues.forEach(i -> {
            if (i.getStatus() == Enums.BookIssueStatus.ISSUED && i.getDueDate() != null && LocalDate.now().isAfter(i.getDueDate())) {
                i.setStatus(Enums.BookIssueStatus.OVERDUE);
            }
        });
        return issues.stream().map(this::toIssueResponse).toList();
    }

    private LibraryDTOs.BookIssueResponse toIssueResponse(BookIssue i) {
        return LibraryDTOs.BookIssueResponse.builder()
                .id(i.getId()).bookId(i.getBookId()).bookTitle(i.getBookTitle())
                .studentId(i.getStudentId()).studentName(i.getStudentName())
                .issueDate(i.getIssueDate() != null ? i.getIssueDate().toString() : null)
                .dueDate(i.getDueDate() != null ? i.getDueDate().toString() : null)
                .returnDate(i.getReturnDate() != null ? i.getReturnDate().toString() : null)
                .fine(i.getFine()).status(i.getStatus() != null ? i.getStatus().name().toLowerCase() : null)
                .build();
    }
}
