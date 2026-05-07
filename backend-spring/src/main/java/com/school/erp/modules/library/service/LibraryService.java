package com.school.erp.modules.library.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.library.borrower.BorrowerRegistry;
import com.school.erp.modules.library.borrower.ResolvedBorrower;
import com.school.erp.modules.library.dto.LibraryDTOs;
import com.school.erp.modules.library.entity.*;
import com.school.erp.modules.library.repository.*;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantQueryPolicy;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import com.lowagie.text.Document;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;

import java.math.BigDecimal;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;

@Service
public class LibraryService {
    private static final Logger log = LoggerFactory.getLogger(LibraryService.class);

    private final BookRepository bookRepo;
    private final BookIssueRepository issueRepo;
    private final BorrowerRegistry borrowerRegistry;
    private final LibraryBorrowerPolicyService borrowerPolicyService;
    private final LibraryMemberScopeService memberScopeService;
    private final TenantConfigRepository tenantConfigRepository;
    private final LibraryFinePolicyRepository finePolicyRepository;
    private final LibraryReservationRepository reservationRepository;
    private final LibraryInventoryLedgerRepository inventoryLedgerRepository;
    @Value("${app.library.export.max-rows:10000}")
    private int libraryExportMaxRows;

    public LibraryService(
            BookRepository bookRepo,
            BookIssueRepository issueRepo,
            BorrowerRegistry borrowerRegistry,
            LibraryBorrowerPolicyService borrowerPolicyService,
            LibraryMemberScopeService memberScopeService,
            TenantConfigRepository tenantConfigRepository,
            LibraryFinePolicyRepository finePolicyRepository,
            LibraryReservationRepository reservationRepository,
            LibraryInventoryLedgerRepository inventoryLedgerRepository) {
        this.bookRepo = bookRepo;
        this.issueRepo = issueRepo;
        this.borrowerRegistry = borrowerRegistry;
        this.borrowerPolicyService = borrowerPolicyService;
        this.memberScopeService = memberScopeService;
        this.tenantConfigRepository = tenantConfigRepository;
        this.finePolicyRepository = finePolicyRepository;
        this.reservationRepository = reservationRepository;
        this.inventoryLedgerRepository = inventoryLedgerRepository;
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY_CATALOG, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<Book> getBooks(String search, boolean includeInactive) {
        List<Book> books = bookRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        if (!includeInactive) {
            books = books.stream().filter(b -> !Boolean.FALSE.equals(b.getIsActive())).toList();
        }
        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase();
            return books.stream().filter(b ->
                    b.getTitle().toLowerCase().contains(s) || b.getAuthor().toLowerCase().contains(s) || b.getIsbn().contains(s)
            ).toList();
        }
        return books;
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY_CATALOG, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public PageResponse<Book> getBooksPaged(int page, int size, String search, String category, String catalogScope) {
        String t = TenantContext.getTenantId();
        String s = search == null || search.isBlank() ? "" : search.trim();
        String cat = category == null || category.isBlank() ? "" : category.trim();
        String scope = catalogScope == null || catalogScope.isBlank() ? "ACTIVE" : catalogScope.trim().toUpperCase();
        if (!scope.equals("ALL") && !scope.equals("ACTIVE") && !scope.equals("INACTIVE")) {
            scope = "ACTIVE";
        }
        Pageable p = PageRequest.of(page, size, Sort.by("title"));
        Page<Book> pg = bookRepo.pageBooks(t, s, cat, scope, p);
        log.debug("Books paged page={} total={} scope={}", page, pg.getTotalElements(), scope);
        return PageResponse.of(pg.getContent(), page, size, pg.getTotalElements());
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY_ISSUES, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public PageResponse<LibraryDTOs.BookIssueResponse> getIssuesPaged(int page, int size, Enums.BookIssueStatus status) {
        String t = TenantContext.getTenantId();
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "issueDate"));
        Page<BookIssue> pg;
        if (status == null) {
            pg = issueRepo.findByTenantIdAndIsDeletedFalseOrderByIssueDateDesc(t, p);
        } else if (status == Enums.BookIssueStatus.OVERDUE) {
            pg = issueRepo.pageOverdue(t, LocalDate.now(), p);
        } else {
            pg = issueRepo.findByTenantIdAndStatusAndIsDeletedFalseOrderByIssueDateDesc(t, status, p);
        }
        List<LibraryDTOs.BookIssueResponse> content = pg.getContent().stream().map(this::toIssueResponse).toList();
        return PageResponse.of(content, page, size, pg.getTotalElements());
    }

    @Transactional
    public Book addBook(Book book) {
        book.setTenantId(TenantContext.getTenantId());
        if (book.getIsActive() == null) {
            book.setIsActive(true);
        }
        if (book.getAvailableCopies() == null) book.setAvailableCopies(book.getTotalCopies());
        return bookRepo.save(book);
    }

    private Book requireBook(Long bookId) {
        String t = TenantContext.getTenantId();
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return bookRepo.findById(bookId).filter(b -> !Boolean.TRUE.equals(b.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("Book", bookId));
        }
        return bookRepo.findByIdAndTenantIdAndIsDeletedFalse(bookId, t).orElseThrow(() -> new ResourceNotFoundException("Book", bookId));
    }

    private BookIssue requireIssue(Long issueId) {
        String t = TenantContext.getTenantId();
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return issueRepo.findById(issueId).filter(i -> !Boolean.TRUE.equals(i.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("BookIssue", issueId));
        }
        return issueRepo.findByIdAndTenantIdAndIsDeletedFalse(issueId, t).orElseThrow(() -> new ResourceNotFoundException("BookIssue", issueId));
    }

    @Transactional
    public Book setCatalogActive(Long bookId, boolean active) {
        Book book = requireBook(bookId);
        book.setIsActive(active);
        return bookRepo.save(book);
    }

    @Transactional
    public LibraryDTOs.BookIssueResponse issueBook(LibraryDTOs.IssueBookRequest req) {
        LibraryDTOs.IssueBorrowerRequest normalized = new LibraryDTOs.IssueBorrowerRequest();
        normalized.setBookId(req.getBookId());
        normalized.setBorrowerType(Enums.LibraryBorrowerType.STUDENT);
        normalized.setBorrowerRefId(req.getStudentId());
        normalized.setBorrowerDisplayName(req.getStudentName());
        normalized.setDueDays(req.getDueDays());
        BookIssue issue = issueBookInternal(normalized);
        log.info("Book issued: bookId={} to student {}", req.getBookId(), req.getStudentId());
        return toIssueResponse(issue);
    }

    @Transactional
    public LibraryDTOs.BorrowerIssueResponse issueBookForBorrower(LibraryDTOs.IssueBorrowerRequest req) {
        BookIssue issue = issueBookInternal(req);
        return toBorrowerIssueResponse(issue);
    }

    private BookIssue issueBookInternal(LibraryDTOs.IssueBorrowerRequest req) {
        Book book = requireBook(req.getBookId());
        borrowerPolicyService.assertBorrowerTypeAllowed(req.getBorrowerType());
        String tenantId = book.getTenantId();
        ResolvedBorrower resolved = borrowerRegistry.resolve(
                tenantId,
                req.getBorrowerType(),
                req.getBorrowerRefId(),
                req.getBorrowerUserId(),
                req.getBorrowerDisplayName());
        BookIssue issue = createAndPersistIssue(
                book,
                resolved.borrowerType(),
                resolved.borrowerRefId(),
                resolved.borrowerUserId(),
                resolved.borrowerDisplayName(),
                req.getDueDays());
        if (resolved.legacyStudentId() != null) {
            issue.setStudentId(resolved.legacyStudentId());
            issue.setStudentName(resolved.legacyStudentName());
            issueRepo.save(issue);
        }
        return issue;
    }

    private BookIssue createAndPersistIssue(
            Book book,
            Enums.LibraryBorrowerType borrowerType,
            Long borrowerRefId,
            Long borrowerUserId,
            String borrowerDisplayName,
            Integer dueDays) {
        String tenantId = book.getTenantId();
        LibraryFinePolicy borrowerPolicy = finePolicyRepository
                .findByTenantIdAndBorrowerTypeAndIsDeletedFalse(tenantId, borrowerType)
                .orElse(null);
        int borrowerMaxBooks = borrowerPolicy != null && borrowerPolicy.getMaxBooks() != null
                ? Math.max(1, borrowerPolicy.getMaxBooks()) : 3;
        long activeBorrowed = issueRepo.countByTenantIdAndBorrowerTypeAndBorrowerRefIdAndStatusAndIsDeletedFalse(
                tenantId, borrowerType, borrowerRefId, Enums.BookIssueStatus.ISSUED);
        if (activeBorrowed >= borrowerMaxBooks) {
            throw new BusinessException("Borrowing limit reached for this borrower profile");
        }
        if (Boolean.FALSE.equals(book.getIsActive())) {
            throw new BusinessException("This title is inactive in the catalog");
        }
        if (book.getAvailableCopies() <= 0) {
            throw new BusinessException("No copies available for: " + book.getTitle());
        }
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepo.save(book);

        BookIssue issue = new BookIssue();
        issue.setBookId(book.getId());
        issue.setBookTitle(book.getTitle());
        issue.setBorrowerType(borrowerType);
        issue.setBorrowerRefId(borrowerRefId);
        issue.setBorrowerUserId(borrowerUserId);
        issue.setBorrowerDisplayName(borrowerDisplayName);
        issue.setIssueDate(LocalDate.now());
        int policyDueDays = borrowerPolicy != null && borrowerPolicy.getMaxBorrowDays() != null
                ? Math.max(1, borrowerPolicy.getMaxBorrowDays()) : 14;
        issue.setDueDate(dueDays != null ? LocalDate.now().plusDays(dueDays) : LocalDate.now().plusDays(policyDueDays));
        issue.setFine(BigDecimal.ZERO);
        issue.setStatus(Enums.BookIssueStatus.ISSUED);
        issue.setTenantId(tenantId);
        issueRepo.save(issue);
        return issue;
    }

    @Transactional
    public LibraryDTOs.BookIssueResponse returnBook(Long issueId, LibraryDTOs.ReturnBookRequest req) {
        BookIssue issue = requireIssue(issueId);
        String t = issue.getTenantId();
        if (issue.getStatus() == Enums.BookIssueStatus.RETURNED) throw new BusinessException("Book already returned");

        LocalDate returnDate = LocalDate.now();
        if (req != null && req.getReturnDate() != null && !req.getReturnDate().isBlank()) {
            returnDate = LocalDate.parse(req.getReturnDate().trim());
        }

        BigDecimal perDay = resolveFinePerDay(t, req != null ? req.getFinePerDay() : null);

        issue.setReturnDate(returnDate);
        issue.setStatus(Enums.BookIssueStatus.RETURNED);

        if (returnDate.isAfter(issue.getDueDate())) {
            long daysOverdue = ChronoUnit.DAYS.between(issue.getDueDate(), returnDate);
            if (daysOverdue < 0) daysOverdue = 0;
            issue.setFine(perDay.multiply(BigDecimal.valueOf(daysOverdue)));
        } else {
            issue.setFine(BigDecimal.ZERO);
        }

        issueRepo.save(issue);

        Book book = bookRepo.findByIdAndTenantIdAndIsDeletedFalse(issue.getBookId(), t).orElse(null);
        if (book != null) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepo.save(book);
        }

        log.info("Book returned: {} fine={}", issue.getBookTitle(), issue.getFine());
        return toIssueResponse(issue);
    }

    private BigDecimal resolveFinePerDay(String tenantId, BigDecimal override) {
        if (override != null && override.compareTo(BigDecimal.ZERO) > 0) {
            return override;
        }
        String borrowerTypeRaw = "STUDENT";
        LibraryFinePolicy policy = finePolicyRepository.findByTenantIdAndBorrowerTypeAndIsDeletedFalse(
                tenantId, Enums.LibraryBorrowerType.valueOf(borrowerTypeRaw)).orElse(null);
        if (policy != null && policy.getFinePerDay() != null && policy.getFinePerDay().compareTo(BigDecimal.ZERO) > 0) {
            return policy.getFinePerDay();
        }
        return tenantConfigRepository.findByTenantId(tenantId)
                .map(c -> c.getLibraryFinePerDay() != null ? c.getLibraryFinePerDay() : BigDecimal.TEN)
                .orElse(BigDecimal.TEN);
    }

    @Transactional(readOnly = true)
    public List<LibraryDTOs.LibraryFinePolicyResponse> listFinePolicies() {
        return finePolicyRepository.findByTenantIdAndIsDeletedFalseOrderByBorrowerTypeAsc(TenantContext.getTenantId())
                .stream().map(this::toFinePolicyResponse).toList();
    }

    @Transactional
    public LibraryDTOs.LibraryFinePolicyResponse upsertFinePolicy(LibraryDTOs.LibraryFinePolicyRequest req) {
        String t = TenantContext.getTenantId();
        LibraryFinePolicy row = finePolicyRepository.findByTenantIdAndBorrowerTypeAndIsDeletedFalse(t, req.getBorrowerType())
                .orElseGet(LibraryFinePolicy::new);
        row.setTenantId(t);
        row.setBorrowerType(req.getBorrowerType());
        row.setFinePerDay(req.getFinePerDay() != null && req.getFinePerDay().compareTo(BigDecimal.ZERO) > 0 ? req.getFinePerDay() : BigDecimal.TEN);
        row.setGraceDays(req.getGraceDays() != null ? Math.max(0, req.getGraceDays()) : 0);
        row.setMaxBooks(req.getMaxBooks() != null ? Math.max(1, req.getMaxBooks()) : 3);
        row.setMaxBorrowDays(req.getMaxBorrowDays() != null ? Math.max(1, req.getMaxBorrowDays()) : 14);
        return toFinePolicyResponse(finePolicyRepository.save(row));
    }

    @Transactional(readOnly = true)
    public List<LibraryDTOs.LibraryReservationResponse> listReservations(String status) {
        String t = TenantContext.getTenantId();
        List<LibraryReservation> rows = (status == null || status.isBlank())
                ? reservationRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(t)
                : reservationRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(t, status.trim().toUpperCase(Locale.ROOT));
        return rows.stream().map(this::toReservationResponse).toList();
    }

    @Transactional
    public LibraryDTOs.LibraryReservationResponse createReservation(LibraryDTOs.LibraryReservationRequest req) {
        Book book = requireBook(req.getBookId());
        LibraryReservation row = new LibraryReservation();
        row.setTenantId(TenantContext.getTenantId());
        row.setBookId(book.getId());
        row.setBookTitle(book.getTitle());
        row.setBorrowerType(req.getBorrowerType());
        row.setBorrowerRefId(req.getBorrowerRefId());
        row.setBorrowerUserId(req.getBorrowerUserId());
        row.setBorrowerDisplayName(req.getBorrowerDisplayName());
        row.setStatus("PENDING");
        row.setRequestedAt(LocalDateTime.now());
        row.setExpiresAt(LocalDateTime.now().plusHours(req.getHoldHours() != null ? Math.max(2, req.getHoldHours()) : 48));
        row.setNote(req.getNote());
        return toReservationResponse(reservationRepository.save(row));
    }

    @Transactional
    public LibraryDTOs.LibraryReservationResponse cancelReservation(Long id) {
        LibraryReservation row = requireReservation(id);
        row.setStatus("CANCELLED");
        return toReservationResponse(reservationRepository.save(row));
    }

    @Transactional
    public LibraryDTOs.LibraryReservationResponse fulfillReservation(Long id, Integer dueDays) {
        LibraryReservation row = requireReservation(id);
        if (!"PENDING".equalsIgnoreCase(row.getStatus())) {
            throw new BusinessException("Only pending reservations can be fulfilled");
        }
        LibraryDTOs.IssueBorrowerRequest req = new LibraryDTOs.IssueBorrowerRequest();
        req.setBookId(row.getBookId());
        req.setBorrowerType(row.getBorrowerType());
        req.setBorrowerRefId(row.getBorrowerRefId());
        req.setBorrowerUserId(row.getBorrowerUserId());
        req.setBorrowerDisplayName(row.getBorrowerDisplayName());
        req.setDueDays(dueDays);
        BookIssue issue = issueBookInternal(req);
        row.setStatus("FULFILLED");
        row.setFulfilledIssueId(issue.getId());
        return toReservationResponse(reservationRepository.save(row));
    }

    @Transactional
    public LibraryDTOs.LibraryInventoryLedgerResponse adjustInventory(LibraryDTOs.LibraryInventoryAdjustRequest req) {
        Book book = requireBook(req.getBookId());
        int qty = Math.max(1, req.getQuantity() != null ? req.getQuantity() : 1);
        String action = req.getAction() == null ? "ACCESSION" : req.getAction().trim().toUpperCase(Locale.ROOT);
        int total = book.getTotalCopies() != null ? book.getTotalCopies() : 0;
        int available = book.getAvailableCopies() != null ? book.getAvailableCopies() : 0;
        if ("ACCESSION".equals(action) || "ADJUSTMENT_PLUS".equals(action)) {
            total += qty;
            available += qty;
        } else if ("LOSS".equals(action)) {
            total = Math.max(0, total - qty);
            available = Math.max(0, available - qty);
            book.setLostCopies((book.getLostCopies() != null ? book.getLostCopies() : 0) + qty);
        } else if ("WRITE_OFF".equals(action) || "ADJUSTMENT_MINUS".equals(action)) {
            total = Math.max(0, total - qty);
            available = Math.max(0, available - qty);
            book.setWrittenOffCopies((book.getWrittenOffCopies() != null ? book.getWrittenOffCopies() : 0) + qty);
        } else {
            throw new BusinessException("Unsupported inventory action");
        }
        book.setTotalCopies(total);
        book.setAvailableCopies(Math.min(available, total));
        Book saved = bookRepo.save(book);

        LibraryInventoryLedger ledger = new LibraryInventoryLedger();
        ledger.setTenantId(saved.getTenantId());
        ledger.setBookId(saved.getId());
        ledger.setBookTitle(saved.getTitle());
        ledger.setAction(action);
        ledger.setQuantity(qty);
        ledger.setTotalCopiesAfter(saved.getTotalCopies());
        ledger.setAvailableCopiesAfter(saved.getAvailableCopies());
        ledger.setNote(req.getNote());
        return toInventoryResponse(inventoryLedgerRepository.save(ledger));
    }

    @Transactional(readOnly = true)
    public List<LibraryDTOs.LibraryInventoryLedgerResponse> listInventoryLedger() {
        return inventoryLedgerRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(TenantContext.getTenantId())
                .stream().map(this::toInventoryResponse).toList();
    }

    @Transactional(readOnly = true)
    public LibraryDTOs.LibraryAnalyticsSnapshot getAnalyticsSnapshot() {
        String t = TenantContext.getTenantId();
        List<Book> books = bookRepo.findByTenantIdAndIsDeletedFalse(t);
        List<BookIssue> issues = issueRepo.findByTenantIdAndIsDeletedFalse(t);
        List<LibraryReservation> reservations = reservationRepository.findByTenantIdAndStatusAndIsDeletedFalseOrderByCreatedAtDesc(t, "PENDING");
        LibraryDTOs.LibraryAnalyticsSnapshot out = new LibraryDTOs.LibraryAnalyticsSnapshot();
        out.setTotalTitles(books.size());
        out.setTotalCopies(books.stream().mapToInt(b -> b.getTotalCopies() != null ? b.getTotalCopies() : 0).sum());
        out.setCopiesAvailable(books.stream().mapToInt(b -> b.getAvailableCopies() != null ? b.getAvailableCopies() : 0).sum());
        out.setIssuedCount((int) issues.stream().filter(i -> effectiveIssueStatus(i) == Enums.BookIssueStatus.ISSUED).count());
        out.setOverdueCount((int) issues.stream().filter(i -> effectiveIssueStatus(i) == Enums.BookIssueStatus.OVERDUE).count());
        out.setReservedCount(reservations.size());
        out.setOutstandingFine(issues.stream()
                .filter(i -> effectiveIssueStatus(i) != Enums.BookIssueStatus.RETURNED)
                .map(i -> i.getFine() != null ? i.getFine() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add));
        return out;
    }

    @Transactional(readOnly = true)
    public List<LibraryDTOs.BookIssueResponse> listDueReminders(int dueInDays) {
        LocalDate target = LocalDate.now().plusDays(Math.max(0, dueInDays));
        return issueRepo.findIssueReminders(TenantContext.getTenantId(), target).stream()
                .map(this::toIssueResponse).toList();
    }

    @Transactional(readOnly = true)
    public byte[] exportAnalyticsCsv() {
        List<LibraryDTOs.BookIssueResponse> reminders = listDueReminders(7);
        if (reminders.size() > libraryExportMaxRows) {
            throw new BusinessException("Too many rows to export. Narrow the filter.");
        }
        LibraryDTOs.LibraryAnalyticsSnapshot snap = getAnalyticsSnapshot();
        StringBuilder sb = new StringBuilder("metric,value\n");
        sb.append("total_titles,").append(snap.getTotalTitles()).append('\n');
        sb.append("total_copies,").append(snap.getTotalCopies()).append('\n');
        sb.append("copies_available,").append(snap.getCopiesAvailable()).append('\n');
        sb.append("issued_count,").append(snap.getIssuedCount()).append('\n');
        sb.append("overdue_count,").append(snap.getOverdueCount()).append('\n');
        sb.append("reserved_count,").append(snap.getReservedCount()).append('\n');
        sb.append("outstanding_fine,").append(snap.getOutstandingFine()).append('\n');
        sb.append("\nbook,student,due_date,status,fine\n");
        for (LibraryDTOs.BookIssueResponse r : reminders) {
            sb.append(csv(r.getBookTitle())).append(',').append(csv(r.getStudentName())).append(',')
                    .append(csv(r.getDueDate())).append(',').append(csv(r.getStatus())).append(',')
                    .append(r.getFine() != null ? r.getFine() : BigDecimal.ZERO).append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public byte[] exportAnalyticsPdf() {
        LibraryDTOs.LibraryAnalyticsSnapshot snap = getAnalyticsSnapshot();
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();
            doc.add(new Paragraph("Library Analytics Snapshot"));
            doc.add(new Paragraph("Total titles: " + snap.getTotalTitles()));
            doc.add(new Paragraph("Total copies: " + snap.getTotalCopies()));
            doc.add(new Paragraph("Copies available: " + snap.getCopiesAvailable()));
            doc.add(new Paragraph("Issued count: " + snap.getIssuedCount()));
            doc.add(new Paragraph("Overdue count: " + snap.getOverdueCount()));
            doc.add(new Paragraph("Reserved count: " + snap.getReservedCount()));
            doc.add(new Paragraph("Outstanding fine: " + snap.getOutstandingFine()));
            doc.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new BusinessException("Unable to generate library analytics PDF");
        }
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY_ISSUES, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<LibraryDTOs.BookIssueResponse> getIssues(Enums.BookIssueStatus status) {
        List<BookIssue> issues = issueRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        return issues.stream()
                .filter(i -> status == null || effectiveIssueStatus(i) == status)
                .map(this::toIssueResponse)
                .toList();
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY_ISSUES, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<LibraryDTOs.BookIssueResponse> getMemberIssues(Enums.BookIssueStatus status) {
        return getMemberIssuesPaged(0, 5000, status).getContent();
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY_ISSUES, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public PageResponse<LibraryDTOs.BookIssueResponse> getMemberIssuesPaged(int page, int size, Enums.BookIssueStatus status) {
        String tenantId = TenantContext.getTenantId();
        LibraryMemberScopeService.MemberBorrowerScope scope = memberScopeService.resolveCurrentMemberBorrowerScope();
        Long userId = scope.userId();
        List<Long> memberStudentIds = scope.studentBorrowerRefs();
        if ((userId == null) && memberStudentIds.isEmpty()) {
            return PageResponse.of(List.of(), page, size, 0);
        }
        List<Long> queryStudentRefs = memberStudentIds.isEmpty() ? List.of(-1L) : memberStudentIds;
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "issueDate"));
        Page<BookIssue> pg;
        if (status == null) {
            pg = issueRepo.pageMemberVisibleIssues(tenantId, userId, queryStudentRefs, p);
        } else if (status == Enums.BookIssueStatus.OVERDUE) {
            pg = issueRepo.pageMemberVisibleOverdueIssues(tenantId, userId, queryStudentRefs, LocalDate.now(), p);
        } else {
            pg = issueRepo.pageMemberVisibleIssuesByStatus(tenantId, userId, queryStudentRefs, status, p);
        }
        List<LibraryDTOs.BookIssueResponse> content = pg.getContent().stream().map(this::toIssueResponse).toList();
        return PageResponse.of(content, page, size, pg.getTotalElements());
    }

    private static Enums.BookIssueStatus effectiveIssueStatus(BookIssue i) {
        Enums.BookIssueStatus st = i.getStatus();
        if (st == Enums.BookIssueStatus.ISSUED && i.getDueDate() != null && LocalDate.now().isAfter(i.getDueDate())) {
            return Enums.BookIssueStatus.OVERDUE;
        }
        return st;
    }

    private LibraryDTOs.BookIssueResponse toIssueResponse(BookIssue i) {
        Enums.BookIssueStatus st = effectiveIssueStatus(i);
        Long studentId = i.getStudentId();
        String studentName = i.getStudentName();
        if (studentId == null && i.getBorrowerType() == Enums.LibraryBorrowerType.STUDENT) {
            studentId = i.getBorrowerRefId();
        }
        if ((studentName == null || studentName.isBlank()) && i.getBorrowerType() == Enums.LibraryBorrowerType.STUDENT) {
            studentName = i.getBorrowerDisplayName();
        }
        return LibraryDTOs.BookIssueResponse.builder()
                .id(i.getId()).bookId(i.getBookId()).bookTitle(i.getBookTitle())
                .studentId(studentId).studentName(studentName)
                .issueDate(i.getIssueDate() != null ? i.getIssueDate().toString() : null)
                .dueDate(i.getDueDate() != null ? i.getDueDate().toString() : null)
                .returnDate(i.getReturnDate() != null ? i.getReturnDate().toString() : null)
                .fine(i.getFine()).status(st != null ? st.name().toLowerCase() : null)
                .build();
    }

    private LibraryDTOs.BorrowerIssueResponse toBorrowerIssueResponse(BookIssue i) {
        Enums.BookIssueStatus st = effectiveIssueStatus(i);
        return LibraryDTOs.BorrowerIssueResponse.builder()
                .id(i.getId())
                .bookId(i.getBookId())
                .bookTitle(i.getBookTitle())
                .borrowerType(i.getBorrowerType())
                .borrowerRefId(i.getBorrowerRefId())
                .borrowerUserId(i.getBorrowerUserId())
                .borrowerDisplayName(i.getBorrowerDisplayName())
                .issueDate(i.getIssueDate() != null ? i.getIssueDate().toString() : null)
                .dueDate(i.getDueDate() != null ? i.getDueDate().toString() : null)
                .returnDate(i.getReturnDate() != null ? i.getReturnDate().toString() : null)
                .fine(i.getFine())
                .status(st != null ? st.name().toLowerCase() : null)
                .build();
    }

    private LibraryReservation requireReservation(Long id) {
        String t = TenantContext.getTenantId();
        return reservationRepository.findByIdAndTenantIdAndIsDeletedFalse(id, t)
                .orElseThrow(() -> new ResourceNotFoundException("Library reservation", id));
    }

    private LibraryDTOs.LibraryFinePolicyResponse toFinePolicyResponse(LibraryFinePolicy row) {
        LibraryDTOs.LibraryFinePolicyResponse out = new LibraryDTOs.LibraryFinePolicyResponse();
        out.setId(row.getId());
        out.setBorrowerType(row.getBorrowerType());
        out.setFinePerDay(row.getFinePerDay());
        out.setGraceDays(row.getGraceDays());
        out.setMaxBooks(row.getMaxBooks());
        out.setMaxBorrowDays(row.getMaxBorrowDays());
        return out;
    }

    private LibraryDTOs.LibraryReservationResponse toReservationResponse(LibraryReservation row) {
        LibraryDTOs.LibraryReservationResponse out = new LibraryDTOs.LibraryReservationResponse();
        out.setId(row.getId());
        out.setBookId(row.getBookId());
        out.setBookTitle(row.getBookTitle());
        out.setBorrowerType(row.getBorrowerType());
        out.setBorrowerRefId(row.getBorrowerRefId());
        out.setBorrowerUserId(row.getBorrowerUserId());
        out.setBorrowerDisplayName(row.getBorrowerDisplayName());
        out.setStatus(row.getStatus());
        out.setRequestedAt(row.getRequestedAt() != null ? row.getRequestedAt().toString() : null);
        out.setExpiresAt(row.getExpiresAt() != null ? row.getExpiresAt().toString() : null);
        out.setFulfilledIssueId(row.getFulfilledIssueId());
        out.setNote(row.getNote());
        return out;
    }

    private LibraryDTOs.LibraryInventoryLedgerResponse toInventoryResponse(LibraryInventoryLedger row) {
        LibraryDTOs.LibraryInventoryLedgerResponse out = new LibraryDTOs.LibraryInventoryLedgerResponse();
        out.setId(row.getId());
        out.setBookId(row.getBookId());
        out.setBookTitle(row.getBookTitle());
        out.setAction(row.getAction());
        out.setQuantity(row.getQuantity());
        out.setTotalCopiesAfter(row.getTotalCopiesAfter());
        out.setAvailableCopiesAfter(row.getAvailableCopiesAfter());
        out.setNote(row.getNote());
        out.setCreatedAt(row.getCreatedAt() != null ? row.getCreatedAt().toString() : null);
        return out;
    }

    private String csv(String raw) {
        String v = raw == null ? "" : raw;
        if (v.contains(",") || v.contains("\"") || v.contains("\n")) {
            return "\"" + v.replace("\"", "\"\"") + "\"";
        }
        return v;
    }
}
