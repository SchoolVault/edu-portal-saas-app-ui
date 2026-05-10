package com.school.erp.modules.ai.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.academic.dto.AcademicDTOs;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.academic.service.AcademicService;
import com.school.erp.modules.academic.service.CurrentAcademicYearResolver;
import com.school.erp.modules.academic.service.TeacherAssignmentService;
import com.school.erp.modules.attendance.service.AttendanceService;
import com.school.erp.modules.communication.service.CommunicationService;
import com.school.erp.modules.exams.service.ExamService;
import com.school.erp.modules.fees.service.FeeService;
import com.school.erp.modules.hostel.dto.HostelDTOs;
import com.school.erp.modules.hostel.service.HostelService;
import com.school.erp.modules.library.service.LibraryService;
import com.school.erp.modules.operations.dto.OperationsDTOs;
import com.school.erp.modules.operations.service.OperationsService;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.leave.service.LeaveService;
import com.school.erp.modules.audit.service.AuditService;
import com.school.erp.modules.payroll.dto.PayrollDTOs;
import com.school.erp.modules.payroll.service.PayrollService;
import com.school.erp.modules.reports.service.ReportService;
import com.school.erp.modules.settings.service.SettingsService;
import com.school.erp.modules.student.dto.StudentDTOs;
import com.school.erp.modules.student.service.StudentService;
import com.school.erp.modules.teacher.dto.TeacherDTOs;
import com.school.erp.modules.teacher.service.TeacherService;
import com.school.erp.modules.communication.service.InboxTimelineService;
import com.school.erp.modules.timetable.service.TimetableService;
import com.school.erp.modules.transport.service.TransportService;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

@Service
public class AiDomainQueryService {
    private final StudentService studentService;
    private final AcademicService academicService;
    private final TeacherService teacherService;
    private final TeacherAssignmentService teacherAssignmentService;
    private final TimetableService timetableService;
    private final OperationsService operationsService;
    private final GuardianService guardianService;
    private final FeeService feeService;
    private final PayrollService payrollService;
    private final AttendanceService attendanceService;
    private final ReportService reportService;
    private final AuditService auditService;
    private final SettingsService settingsService;
    private final LeaveService leaveService;
    private final InboxTimelineService inboxTimelineService;
    private final TransportService transportService;
    private final LibraryService libraryService;
    private final HostelService hostelService;
    private final CommunicationService communicationService;
    private final ExamService examService;
    private final CurrentAcademicYearResolver currentAcademicYearResolver;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;

    public AiDomainQueryService(
            StudentService studentService,
            AcademicService academicService,
            TeacherService teacherService,
            TeacherAssignmentService teacherAssignmentService,
            TimetableService timetableService,
            OperationsService operationsService,
            GuardianService guardianService,
            FeeService feeService,
            PayrollService payrollService,
            AttendanceService attendanceService,
            ReportService reportService,
            AuditService auditService,
            SettingsService settingsService,
            LeaveService leaveService,
            InboxTimelineService inboxTimelineService,
            TransportService transportService,
            LibraryService libraryService,
            HostelService hostelService,
            CommunicationService communicationService,
            ExamService examService,
            CurrentAcademicYearResolver currentAcademicYearResolver,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository) {
        this.studentService = studentService;
        this.academicService = academicService;
        this.teacherService = teacherService;
        this.teacherAssignmentService = teacherAssignmentService;
        this.timetableService = timetableService;
        this.operationsService = operationsService;
        this.guardianService = guardianService;
        this.feeService = feeService;
        this.payrollService = payrollService;
        this.attendanceService = attendanceService;
        this.reportService = reportService;
        this.auditService = auditService;
        this.settingsService = settingsService;
        this.leaveService = leaveService;
        this.inboxTimelineService = inboxTimelineService;
        this.transportService = transportService;
        this.libraryService = libraryService;
        this.hostelService = hostelService;
        this.communicationService = communicationService;
        this.examService = examService;
        this.currentAcademicYearResolver = currentAcademicYearResolver;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
    }

    public Map<String, Object> searchStudents(String query) {
        var page = studentService.getStudents(0, 10, null, null, null, query, "firstName", "asc");
        List<Map<String, Object>> matches = page.getContent().stream()
                .map(s -> Map.<String, Object>of(
                        "id", s.getId(),
                        "name", ((s.getFirstName() == null ? "" : s.getFirstName()) + " " + (s.getLastName() == null ? "" : s.getLastName())).trim(),
                        "className", (s.getClassName() == null ? "N/A" : s.getClassName())
                                + (s.getSectionName() == null || s.getSectionName().isBlank() ? "" : ("-" + s.getSectionName())),
                        "rollNo", s.getRollNumber() == null ? "N/A" : s.getRollNumber(),
                        "admissionNumber", s.getAdmissionNumber() == null ? "N/A" : s.getAdmissionNumber(),
                        "phone", s.getPhone() == null ? "" : s.getPhone(),
                        "guardianName", s.getParentName() == null ? "" : s.getParentName(),
                        "email", s.getEmail() == null ? "" : s.getEmail()))
                .toList();
        return Map.of(
                "query", query == null ? "" : query,
                "matches", matches,
                "total", page.getTotalElements());
    }

    public Map<String, Object> listStudentsByClassSection(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        ResolvedClassSection resolved = resolveClassSection(input, query);
        if (resolved == null) {
            return Map.of(
                    "query", query,
                    "error", "Class/section not resolved",
                    "matches", List.of(),
                    "total", 0);
        }
        List<StudentDTOs.Response> students = studentService.getStudentsByClassAndSection(resolved.classId(), resolved.sectionId());
        List<Map<String, Object>> matches = students.stream().map(s -> Map.<String, Object>of(
                "id", s.getId(),
                "name", ((s.getFirstName() == null ? "" : s.getFirstName()) + " " + (s.getLastName() == null ? "" : s.getLastName())).trim(),
                "admissionNumber", safeText(s.getAdmissionNumber()),
                "rollNo", safeText(s.getRollNumber()),
                "className", resolved.className(),
                "sectionName", resolved.sectionName(),
                "guardianName", safeText(s.getParentName()),
                "phone", safeText(s.getPhone()),
                "email", safeText(s.getEmail())
        )).toList();
        return Map.of(
                "className", resolved.className(),
                "sectionName", resolved.sectionName(),
                "matches", matches,
                "total", matches.size());
    }

    public Map<String, Object> listGuardianDetailsByClassSection(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        ResolvedClassSection resolved = resolveClassSection(input, query);
        if (resolved == null) {
            return Map.of(
                    "query", query,
                    "error", "Class/section not resolved",
                    "guardians", List.of(),
                    "total", 0);
        }
        List<StudentDTOs.Response> students = studentService.getStudentsByClassAndSection(resolved.classId(), resolved.sectionId());
        List<Map<String, Object>> guardians = students.stream().map(s -> {
            List<com.school.erp.modules.guardian.dto.GuardianDTOs.MappingResponse> mappings =
                    guardianService.listMappingsForStudent(s.getId());
            List<Map<String, Object>> linked = mappings.stream().map(m -> Map.<String, Object>of(
                    "guardianId", m.getGuardianId(),
                    "name", safeText(m.getGuardianName()),
                    "relation", safeText(m.getRelationType()),
                    "isPrimary", Boolean.TRUE.equals(m.getIsPrimary()),
                    "phone", safeText(m.getPrimaryPhone()),
                    "email", safeText(m.getEmail())
            )).toList();
            return Map.<String, Object>of(
                    "studentId", s.getId(),
                    "studentName", ((s.getFirstName() == null ? "" : s.getFirstName()) + " " + (s.getLastName() == null ? "" : s.getLastName())).trim(),
                    "admissionNumber", safeText(s.getAdmissionNumber()),
                    "guardians", linked.isEmpty() ? List.of(Map.of(
                            "name", safeText(s.getParentName()),
                            "relation", "PRIMARY",
                            "phone", "",
                            "email", "")) : linked
            );
        }).toList();
        return Map.of(
                "className", resolved.className(),
                "sectionName", resolved.sectionName(),
                "guardians", guardians,
                "total", guardians.size());
    }

    public Map<String, Object> studentFeeDetails(String query) {
        var page = feeService.getPaymentsPaged(0, 20, null, query, null, null, null);
        List<Map<String, Object>> matches = page.getContent().stream()
                .filter(p -> p.getDueAmount() != null && p.getDueAmount().doubleValue() > 0)
                .limit(10)
                .map(p -> Map.<String, Object>of(
                        "paymentId", p.getId(),
                        "studentId", p.getStudentId(),
                        "studentName", safeText(p.getStudentName()),
                        "status", safeText(p.getStatus()),
                        "dueAmount", safe(p.getDueAmount()),
                        "dueDate", p.getDueDate() == null ? "" : p.getDueDate().toString()
                ))
                .toList();
        BigDecimal pending = page.getContent().stream()
                .map(p -> safe(p.getDueAmount()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of(
                "query", query == null ? "" : query,
                "pendingAmount", pending,
                "currency", "INR",
                "matches", matches,
                "total", matches.size());
    }

    public Map<String, Object> teacherAttendancePending() {
        var page = teacherService.getTeachers(0, 100, null, null, null);
        List<Map<String, Object>> pending = page.getContent().stream()
                .filter(t -> {
                    String status = safeText(t.getStatus()).toUpperCase();
                    return !"ACTIVE".equals(status);
                })
                .limit(20)
                .map(t -> Map.<String, Object>of(
                        "id", t.getId(),
                        "name", ((safeText(t.getFirstName()) + " " + safeText(t.getLastName())).trim()),
                        "subject", safeText(t.getSpecialization()),
                        "status", safeText(t.getStatus()),
                        "phone", safeText(t.getPhone())
                ))
                .toList();
        return Map.of("pendingTeachers", pending, "totalPending", pending.size());
    }

    public Map<String, Object> homeworkSummary() {
        ReportDashboardDTOs.AdminDashboardResponse dashboard = reportService.getAdminDashboard("MONTH_TO_DATE", YearMonth.now().toString());
        long submitted = dashboard.getRecentActivities().stream()
                .filter(a -> containsAnyInFields(safeText(a.getTitle()), safeText(a.getDescription()), safeText(a.getType()), "homework", "assignment", "submission"))
                .count();
        long pending = dashboard.getClassesWithoutHomeroomTeacher() == null ? 0 : dashboard.getClassesWithoutHomeroomTeacher().size();
        String topLateClass = dashboard.getClassesWithoutHomeroomTeacher() == null || dashboard.getClassesWithoutHomeroomTeacher().isEmpty()
                ? "N/A"
                : safeText(dashboard.getClassesWithoutHomeroomTeacher().get(0).getClassName());
        return Map.of(
                "submitted", submitted,
                "pending", pending,
                "topLateClass", topLateClass,
                "source", "reportService.adminDashboard");
    }

    public Map<String, Object> academicManagementSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        String requestedClassFromInput = Objects.toString(input == null ? null : input.get("className"), "");
        String breakdown = Objects.toString(input == null ? null : input.get("breakdown"), "");
        String tenantId = com.school.erp.tenant.TenantContext.getTenantId();
        Long currentAcademicYearId = currentAcademicYearResolver.resolveCurrentAcademicYearId(tenantId);
        List<AcademicDTOs.ClassWithSectionsResponse> classes = academicService.getClassesWithSections("ACTIVE");
        long totalClasses = classes.size();
        long totalSections = classes.stream().mapToLong(c -> c.getSections() == null ? 0 : c.getSections().size()).sum();
        long totalStudentStrength = classes.stream().mapToLong(AcademicDTOs.ClassWithSectionsResponse::getTotalStudents).sum();
        double avgSectionStrength = totalSections == 0 ? 0.0 : (double) totalStudentStrength / totalSections;
        long classesWithoutHomeroom = classes.stream()
                .filter(c -> {
                    if (c.getSections() == null || c.getSections().isEmpty()) {
                        return c.getClassTeacherId() == null;
                    }
                    return c.getSections().stream().anyMatch(s -> s.getClassTeacherId() == null);
                })
                .count();

        Optional<String> requestedClass = requestedClassFromInput.isBlank()
                ? extractClassToken(query)
                : Optional.of(requestedClassFromInput);
        if (requestedClass.isPresent()) {
            Optional<AcademicDTOs.ClassWithSectionsResponse> klass = classes.stream()
                    .filter(c -> matchesClass(c.getName(), requestedClass.get()))
                    .findFirst();
            if (klass.isPresent()) {
                var c = klass.get();
                List<Map<String, Object>> sections = (c.getSections() == null ? List.<AcademicDTOs.SectionDTO>of() : c.getSections()).stream()
                        .map(s -> Map.<String, Object>of(
                                "sectionId", s.getId(),
                                "sectionName", safeText(s.getName()),
                                "studentStrength", s.getStudentCount() == null ? 0 : s.getStudentCount(),
                                "capacity", s.getCapacity() == null ? 0 : s.getCapacity(),
                                "classTeacherName", safeText(s.getClassTeacherName())
                        ))
                        .toList();
                return Map.of(
                        "scope", "class",
                        "classId", c.getId(),
                        "className", c.getName(),
                        "grade", c.getGrade() == null ? 0 : c.getGrade(),
                        "academicYearId", c.getAcademicYearId() == null ? currentAcademicYearId : c.getAcademicYearId(),
                        "totalSections", sections.size(),
                        "studentStrength", c.getTotalStudents(),
                        "classTeacherName", safeText(c.getClassTeacherName()),
                        "sections", sections,
                        "breakdown", breakdown.isBlank() ? "section-wise" : breakdown);
            }
        }

        List<Map<String, Object>> classSummaries = classes.stream()
                .limit(25)
                .map(c -> Map.<String, Object>of(
                        "classId", c.getId(),
                        "className", safeText(c.getName()),
                        "grade", c.getGrade() == null ? 0 : c.getGrade(),
                        "totalSections", c.getSections() == null ? 0 : c.getSections().size(),
                        "studentStrength", c.getTotalStudents(),
                        "classTeacherName", safeText(c.getClassTeacherName())
                ))
                .toList();
        return Map.of(
                "scope", "academic-management",
                "academicYearId", currentAcademicYearId == null ? 0L : currentAcademicYearId,
                "totalClasses", totalClasses,
                "totalSections", totalSections,
                "totalStudentStrength", totalStudentStrength,
                "avgSectionStrength", BigDecimal.valueOf(avgSectionStrength).setScale(1, RoundingMode.HALF_UP),
                "classesWithoutHomeroom", classesWithoutHomeroom,
                "classes", classSummaries,
                "breakdown", breakdown.isBlank() ? "class-wise" : breakdown);
    }

    public Map<String, Object> searchTeachers(String query) {
        var page = teacherService.getTeachers(0, 10, query, null, null);
        List<Map<String, Object>> matches = page.getContent().stream()
                .map(t -> Map.<String, Object>of(
                        "id", t.getId(),
                        "name", ((t.getFirstName() == null ? "" : t.getFirstName()) + " " + (t.getLastName() == null ? "" : t.getLastName())).trim(),
                        "employeeId", t.getId() == null ? "N/A" : ("T-" + t.getId()),
                        "department", t.getSpecialization() == null ? "Academic" : t.getSpecialization(),
                        "designation", t.getQualification() == null ? "Teacher" : t.getQualification(),
                        "classesHandled", t.getHomeroomClassNames() == null ? List.of() : t.getHomeroomClassNames(),
                        "phone", t.getPhone() == null ? "" : t.getPhone(),
                        "email", t.getEmail() == null ? "" : t.getEmail()))
                .toList();
        return Map.of(
                "query", query == null ? "" : query,
                "matches", matches,
                "total", page.getTotalElements());
    }

    public Map<String, Object> teacherDirectory(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        String status = Objects.toString(input == null ? null : input.get("status"), "");
        String subject = Objects.toString(input == null ? null : input.get("subject"), "");
        var page = teacherService.getTeachers(0, 25, query, status.isBlank() ? null : status, subject.isBlank() ? null : subject);
        List<Map<String, Object>> matches = page.getContent().stream()
                .map(t -> Map.<String, Object>of(
                        "id", t.getId(),
                        "name", ((safeText(t.getFirstName()) + " " + safeText(t.getLastName())).trim()),
                        "email", safeText(t.getEmail()),
                        "phone", safeText(t.getPhone()),
                        "status", safeText(t.getStatus()),
                        "specialization", safeText(t.getSpecialization()),
                        "subjects", t.getSubjects() == null ? List.of() : t.getSubjects(),
                        "homeroomClasses", t.getHomeroomClassNames() == null ? List.of() : t.getHomeroomClassNames()
                ))
                .toList();
        return Map.of(
                "query", query,
                "statusFilter", status,
                "subjectFilter", subject,
                "matches", matches,
                "total", page.getTotalElements());
    }

    public Map<String, Object> teacherModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        String tenantId = com.school.erp.tenant.TenantContext.getTenantId();
        Long academicYearId = input != null && input.get("academicYearId") != null
                ? Long.valueOf(String.valueOf(input.get("academicYearId")))
                : currentAcademicYearResolver.resolveCurrentAcademicYearId(tenantId);
        var teacherPage = teacherService.getTeachers(0, 200, null, null, null);
        long totalTeachers = teacherPage.getTotalElements();
        long activeTeachers = teacherPage.getContent().stream().filter(t -> "ACTIVE".equalsIgnoreCase(safeText(t.getStatus()))).count();
        long onLeaveTeachers = teacherPage.getContent().stream().filter(t -> "ON_LEAVE".equalsIgnoreCase(safeText(t.getStatus()))).count();

        List<AcademicDTOs.ClassWithSectionsResponse> classes = academicService.getClassesWithSections("ACTIVE");
        long assignedHomeroomSlots = classes.stream()
                .mapToLong(c -> {
                    if (c.getSections() == null || c.getSections().isEmpty()) {
                        return c.getClassTeacherId() == null ? 0 : 1;
                    }
                    return c.getSections().stream().filter(s -> s.getClassTeacherId() != null).count();
                })
                .sum();

        Optional<String> maybeClass = extractClassToken(query);
        if (maybeClass.isPresent()) {
            Optional<AcademicDTOs.ClassWithSectionsResponse> klass = classes.stream()
                    .filter(c -> matchesClass(c.getName(), maybeClass.get()))
                    .findFirst();
            if (klass.isPresent()) {
                Long classId = klass.get().getId();
                var classAssignments = teacherAssignmentService.listClassAssignments(classId, null);
                var subjectAssignments = teacherAssignmentService.listSubjectAssignments(classId, null);
                return Map.of(
                        "scope", "teacher-class",
                        "academicYearId", academicYearId == null ? 0L : academicYearId,
                        "className", klass.get().getName(),
                        "classTeacherAssignments", classAssignments.size(),
                        "subjectTeacherAssignments", subjectAssignments.size(),
                        "classTeacherRows", classAssignments,
                        "subjectTeacherRows", subjectAssignments);
            }
        }

        List<Map<String, Object>> workloadTop = teacherPage.getContent().stream()
                .limit(10)
                .map(t -> {
                    var workload = teacherAssignmentService.getWorkload(t.getId());
                    return Map.<String, Object>of(
                            "teacherId", t.getId(),
                            "teacherName", ((safeText(t.getFirstName()) + " " + safeText(t.getLastName())).trim()),
                            "classTeacherSlots", workload.getClassTeacherSlots(),
                            "subjectAssignments", workload.getSubjectAssignments(),
                            "status", safeText(t.getStatus()));
                })
                .toList();

        return Map.of(
                "scope", "teacher-module",
                "academicYearId", academicYearId == null ? 0L : academicYearId,
                "totalTeachers", totalTeachers,
                "activeTeachers", activeTeachers,
                "onLeaveTeachers", onLeaveTeachers,
                "assignedHomeroomSlots", assignedHomeroomSlots,
                "workloadTop", workloadTop);
    }

    public Map<String, Object> searchOperationalStaff(String query) {
        var page = operationsService.listStaffPaged(0, 10, query, null);
        List<Map<String, Object>> matches = page.getContent().stream()
                .map(s -> Map.<String, Object>of(
                        "id", s.getId(),
                        "name", s.getFullName() == null ? "" : s.getFullName(),
                        "employeeId", s.getEmployeeCode() == null ? "N/A" : s.getEmployeeCode(),
                        "department", s.getStaffRole() == null ? "Operations" : s.getStaffRole(),
                        "designation", s.getStaffRole() == null ? "Staff" : s.getStaffRole(),
                        "shift", "Operational shift",
                        "phone", s.getPhone() == null ? "" : s.getPhone(),
                        "email", s.getEmail() == null ? "" : s.getEmail()))
                .toList();
        return Map.of(
                "query", query == null ? "" : query,
                "matches", matches,
                "total", page.getTotalElements());
    }

    public Map<String, Object> countStudents(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        String requestedClass = Objects.toString(input == null ? null : input.get("className"), "");
        String requestedSection = Objects.toString(input == null ? null : input.get("sectionName"), "");
        if (requestedClass.isBlank()) {
            requestedClass = extractClassToken(query).orElse("");
        }
        if (requestedSection.isBlank()) {
            requestedSection = extractSectionToken(query).orElse("");
        }

        if (requestedClass.isBlank()) {
            return Map.of(
                    "studentCount", studentService.countStudents(),
                    "asOf", LocalDate.now().toString(),
                    "scope", "tenant");
        }

        List<AcademicDTOs.ClassWithSectionsResponse> classes = academicService.getClassesWithSections("ACTIVE");
        final String classToken = requestedClass;
        Optional<AcademicDTOs.ClassWithSectionsResponse> klass = classes.stream()
                .filter(c -> matchesClass(c.getName(), classToken))
                .findFirst();

        if (klass.isEmpty()) {
            return Map.of(
                    "studentCount", studentService.countStudents(),
                    "asOf", LocalDate.now().toString(),
                    "scope", "tenant",
                    "note", "Requested class not found; returned tenant total.");
        }

        if (requestedSection.isBlank()) {
            long count = studentService.getStudentsByClass(klass.get().getId()).size();
            return Map.of(
                    "studentCount", count,
                    "className", klass.get().getName(),
                    "asOf", LocalDate.now().toString(),
                    "scope", "class");
        }

        final String sectionToken = requestedSection;
        Optional<AcademicDTOs.SectionDTO> section = klass.get().getSections().stream()
                .filter(s -> matchesSection(s.getName(), sectionToken))
                .findFirst();

        if (section.isEmpty()) {
            long count = studentService.getStudentsByClass(klass.get().getId()).size();
            return Map.of(
                    "studentCount", count,
                    "className", klass.get().getName(),
                    "asOf", LocalDate.now().toString(),
                    "scope", "class",
                    "note", "Requested section not found; returned class total.");
        }

        long count = studentService.getStudentsByClassAndSection(klass.get().getId(), section.get().getId()).size();
        return Map.of(
                "studentCount", count,
                "className", klass.get().getName(),
                "sectionName", section.get().getName(),
                "asOf", LocalDate.now().toString(),
                "scope", "class-section");
    }

    public Map<String, Object> attendanceTodaySummary() {
        return attendanceTodaySummary(Map.of());
    }

    public Map<String, Object> attendanceTodaySummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        ResolvedClassSection resolved = resolveClassSection(input, query);
        if (resolved != null) {
            List<com.school.erp.modules.attendance.dto.AttendanceDTOs.AttendanceResponse> records =
                    attendanceService.getByClassSectionDate(resolved.classId(), resolved.sectionId(), LocalDate.now());
            List<StudentDTOs.Response> students = studentService.getStudentsByClassAndSection(resolved.classId(), resolved.sectionId());
            Map<Long, StudentDTOs.Response> studentById = students.stream()
                    .collect(java.util.stream.Collectors.toMap(StudentDTOs.Response::getId, s -> s, (a, b) -> a));
            List<Map<String, Object>> absentStudents = records.stream()
                    .filter(r -> "absent".equalsIgnoreCase(safeText(r.getStatus())))
                    .map(r -> {
                        StudentDTOs.Response s = studentById.get(r.getStudentId());
                        return Map.<String, Object>of(
                                "studentId", r.getStudentId(),
                                "studentName", safeText(r.getStudentName()),
                                "admissionNumber", s == null ? "" : safeText(s.getAdmissionNumber()),
                                "guardianName", s == null ? "" : safeText(s.getParentName()),
                                "guardianContact", s == null ? "" : safeText(s.getPhone()));
                    })
                    .toList();
            long present = records.stream().filter(r -> "present".equalsIgnoreCase(safeText(r.getStatus()))).count();
            long late = records.stream().filter(r -> "late".equalsIgnoreCase(safeText(r.getStatus()))).count();
            return Map.of(
                    "date", LocalDate.now().toString(),
                    "scope", "class-section",
                    "className", resolved.className(),
                    "sectionName", resolved.sectionName(),
                    "presentCount", present,
                    "lateCount", late,
                    "absentCount", absentStudents.size(),
                    "absentStudents", absentStudents);
        }
        if (containsAnyInText(query.toLowerCase(), "class", "section")) {
            return Map.of(
                    "date", LocalDate.now().toString(),
                    "scope", "needs-clarification",
                    "error", "Class/section not resolved",
                    "requires", List.of("className", "sectionName"),
                    "clarificationQuestion", "Could not resolve Class/Section, please confirm class and section.");
        }
        List<Map<String, Object>> rows = reportService.getAttendanceSummary(null, YearMonth.now().toString(), null);
        long absent = sumLong(rows, "absent", "absentCount", "total_absent");
        long below75 = countBelowThreshold(rows, "attendancePercentage", 75.0);
        return Map.of(
                "date", LocalDate.now().toString(),
                "scope", "tenant",
                "absentCount", absent,
                "below75Count", below75);
    }

    public Map<String, Object> attendanceModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        String month = Objects.toString(input == null ? null : input.get("month"), YearMonth.now().toString());
        List<Map<String, Object>> rows = reportService.getAttendanceSummary(null, month, null);
        long absent = sumLong(rows, "absent", "absentCount", "total_absent");
        long present = sumLong(rows, "present", "presentCount", "total_present");
        long total = Math.max(1L, absent + present);
        double presentPct = (present * 100.0) / total;
        List<Map<String, Object>> classWise = rows.stream().limit(12).map(r -> Map.<String, Object>of(
                "className", stringOf(r, "className", "class", "name"),
                "present", longOf(r, "present", "presentCount"),
                "absent", longOf(r, "absent", "absentCount"),
                "attendancePct", BigDecimal.valueOf(toDouble(r.getOrDefault("attendancePercentage", 0.0))).setScale(1, RoundingMode.HALF_UP)
        )).toList();
        return Map.of(
                "scope", "attendance-module",
                "query", query,
                "month", month,
                "presentCount", present,
                "absentCount", absent,
                "presentPct", BigDecimal.valueOf(presentPct).setScale(1, RoundingMode.HALF_UP),
                "below75Count", countBelowThreshold(rows, "attendancePercentage", 75.0),
                "classWise", classWise);
    }

    public Map<String, Object> timetableModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        boolean todayOnly = containsAnyInText(query, "today", "todays", "for today");
        ResolvedClassSection resolved = resolveClassSection(input, query);
        if (resolved == null) {
            Map<String, Object> teacherView = teacherTimetableSummary(input, query, todayOnly);
            if (teacherView != null) {
                return teacherView;
            }
        }
        if (resolved == null) {
            return Map.of(
                    "query", query,
                    "error", "Class/section not resolved",
                    "requires", List.of("className", "sectionName"),
                    "matches", List.of(),
                    "total", 0);
        }
        var grid = timetableService.getGrid(resolved.classId(), resolved.sectionId());
        List<Map<String, Object>> slots = new java.util.ArrayList<>();
        String todayName = LocalDate.now().getDayOfWeek().name();
        if (grid.getGrid() != null) {
            grid.getGrid().forEach((day, daySlots) -> {
                if (todayOnly && !todayName.equalsIgnoreCase(day)) {
                    return;
                }
                if (daySlots != null) {
                    daySlots.forEach((period, slot) -> slots.add(Map.of(
                            "day", day,
                            "period", period,
                            "subject", slot.getSubject() == null ? "" : slot.getSubject(),
                            "teacher", slot.getTeacher() == null ? "" : slot.getTeacher(),
                            "room", slot.getRoom() == null ? "" : slot.getRoom(),
                            "startTime", slot.getStartTime() == null ? "" : slot.getStartTime(),
                            "endTime", slot.getEndTime() == null ? "" : slot.getEndTime())));
                }
            });
        }
        return Map.of(
                "scope", todayOnly ? "class-today" : "class-weekly",
                "className", resolved.className(),
                "sectionName", resolved.sectionName(),
                "mode", todayOnly ? "today" : "week",
                "todayDay", todayName,
                "days", grid.getDays() == null ? List.of() : grid.getDays(),
                "periods", grid.getPeriods() == null ? List.of() : grid.getPeriods(),
                "slots", slots,
                "totalSlots", slots.size());
    }

    private Map<String, Object> teacherTimetableSummary(Map<String, Object> input, String query, boolean todayOnly) {
        String teacherName = Objects.toString(input == null ? null : input.get("teacherName"), "").trim();
        String lookup = teacherName.isBlank() ? query : teacherName;
        if (lookup == null || lookup.isBlank() || !containsAnyInText(lookup, "teacher", "timetable", "schedule")) {
            return null;
        }
        var page = teacherService.getTeachers(0, 10, lookup, null, null);
        if (page.getContent().isEmpty()) {
            return Map.of(
                    "scope", "needs-clarification",
                    "error", "Teacher not resolved",
                    "requires", List.of("teacherName"),
                    "clarificationQuestion", "Could not resolve teacher name. Please share full teacher name.");
        }
        TeacherDTOs.Response teacher = page.getContent().get(0);
        List<com.school.erp.modules.timetable.dto.TeacherScheduleSlot> recurring =
                timetableService.getTeacherSchedule(teacher.getId(), todayOnly ? LocalDate.now() : null);
        String todayName = LocalDate.now().getDayOfWeek().name();
        List<Map<String, Object>> slots = recurring.stream()
                .filter(s -> !todayOnly || todayName.equalsIgnoreCase(safeText(s.getDay())))
                .sorted(java.util.Comparator.comparing(com.school.erp.modules.timetable.dto.TeacherScheduleSlot::getDay)
                        .thenComparing(com.school.erp.modules.timetable.dto.TeacherScheduleSlot::getPeriod))
                .map(s -> Map.<String, Object>of(
                        "day", safeText(s.getDay()),
                        "period", s.getPeriod() == null ? 0 : s.getPeriod(),
                        "subject", safeText(s.getSubjectName()),
                        "className", classNameById(s.getClassId()),
                        "sectionName", sectionNameById(s.getSectionId()),
                        "startTime", safeText(s.getStartTime()),
                        "endTime", safeText(s.getEndTime()),
                        "room", safeText(s.getRoom())))
                .toList();
        return Map.of(
                "scope", todayOnly ? "teacher-today" : "teacher-weekly",
                "teacherId", teacher.getId(),
                "teacherName", ((safeText(teacher.getFirstName()) + " " + safeText(teacher.getLastName())).trim()),
                "teacherPhone", safeText(teacher.getPhone()),
                "teacherEmail", safeText(teacher.getEmail()),
                "mode", todayOnly ? "today" : "week",
                "todayDay", todayName,
                "slots", slots,
                "totalSlots", slots.size());
    }

    private String classNameById(Long classId) {
        if (classId == null) return "";
        return schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(classId, com.school.erp.tenant.TenantContext.getTenantId())
                .map(c -> c.getName())
                .orElse("");
    }

    private String sectionNameById(Long sectionId) {
        if (sectionId == null) return "";
        return sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(sectionId, com.school.erp.tenant.TenantContext.getTenantId())
                .map(s -> s.getName())
                .orElse("");
    }

    public Map<String, Object> transportDueSummary(String className) {
        int dues = feeService.getPayments(Enums.FeeStatus.OVERDUE).size();
        return Map.of(
                "className", className == null || className.isBlank() ? "All classes" : className,
                "dues", dues);
    }

    public Map<String, Object> transportModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        List<com.school.erp.modules.transport.dto.TransportDTOs.RouteResponse> routes = transportService.getRoutes();
        List<com.school.erp.modules.transport.entity.TransportVehicle> vehicles = transportService.listVehicles();
        List<com.school.erp.modules.transport.entity.TransportDriver> drivers = transportService.listDrivers();
        long activeRoutes = routes.size();
        long assignedStudents = routes.stream().mapToLong(r -> r.getAssignedStudents()).sum();
        long liveTracked = routes.stream().filter(r -> r.getLiveLatitude() != null && r.getLiveLongitude() != null).count();
        return Map.ofEntries(
                Map.entry("scope", "transport-module"),
                Map.entry("query", query),
                Map.entry("activeRoutes", activeRoutes),
                Map.entry("activeVehicles", vehicles.size()),
                Map.entry("drivers", drivers.size()),
                Map.entry("assignedStudents", assignedStudents),
                Map.entry("liveTrackedRoutes", liveTracked),
                Map.entry("routes", routes.stream().limit(10).toList()),
                Map.entry("transportDue", transportDueSummary("All classes").getOrDefault("dues", 0)));
    }

    public Map<String, Object> feeCollectionSummary(String month) {
        var summary = feeService.getCollectionSummary(null, null, month);
        return Map.of(
                "month", month == null || month.isBlank() ? YearMonth.now().toString() : month,
                "totalCollected", safe(summary.getTotalCollected()),
                "totalPending", safe(summary.getTotalPending()),
                "overdueCount", summary.getOverdueCount(),
                "collectionRate", summary.getCollectionRate(),
                "deltaVsLastMonthPct", summary.getCollectionRate());
    }

    public Map<String, Object> feesDefaultersByClass() {
        List<Map<String, Object>> classRows = reportService.getClassSummary();
        List<Map<String, Object>> classes = classRows.stream().limit(10).map(r -> Map.<String, Object>of(
                "className", stringOf(r, "className", "class", "name"),
                "defaulterCount", longOf(r, "overdueCount", "defaulters", "overdueStudents"),
                "pendingAmountInr", longOf(r, "pendingAmountInr", "pendingAmount", "totalPending")
        )).toList();
        return Map.of("asOf", LocalDate.now().toString(), "classes", classes);
    }

    public Map<String, Object> feesModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        String month = Objects.toString(input == null ? null : input.get("month"), YearMonth.now().toString());
        var collection = feeCollectionSummary(month);
        var defaulters = feesDefaultersByClass();
        List<Map<String, Object>> classes = (List<Map<String, Object>>) defaulters.getOrDefault("classes", List.of());
        long totalDefaulters = classes.stream().mapToLong(c -> longOf(c, "defaulterCount")).sum();
        long topPending = classes.stream().mapToLong(c -> longOf(c, "pendingAmountInr")).max().orElse(0L);
        return Map.of(
                "scope", "fees-module",
                "query", query,
                "month", collection.getOrDefault("month", month),
                "totalCollected", collection.getOrDefault("totalCollected", BigDecimal.ZERO),
                "totalPending", collection.getOrDefault("totalPending", BigDecimal.ZERO),
                "collectionRate", collection.getOrDefault("collectionRate", 0),
                "overdueCount", collection.getOrDefault("overdueCount", 0),
                "totalDefaulters", totalDefaulters,
                "topPendingAmountInr", topPending,
                "classDefaulters", classes.stream().limit(10).toList());
    }

    public Map<String, Object> teacherWorkload() {
        var page = reportService.getTeacherWorkloadPaged(0, 25);
        List<Map<String, Object>> rows = page.getContent();
        double avg = rows.isEmpty() ? 0D : rows.stream()
                .mapToLong(r -> longOf(r, "periodsPerWeek", "weeklyPeriods", "workload"))
                .average()
                .orElse(0D);
        List<Map<String, Object>> overloaded = rows.stream()
                .filter(r -> longOf(r, "periodsPerWeek", "weeklyPeriods", "workload") >= Math.max(24, Math.round(avg + 5)))
                .limit(5)
                .toList();
        return Map.of(
                "weeklyTeachingPeriods", rows.stream().mapToLong(r -> longOf(r, "periodsPerWeek", "weeklyPeriods", "workload")).sum(),
                "teachers", teacherService.count(),
                "avgPeriodsPerTeacher", BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP),
                "overloadedTeachers", overloaded.size(),
                "topOverloaded", overloaded);
    }

    public Map<String, Object> examPassRate(String term) {
        var exams = examService.getExamsPaged(0, 1, null, "COMPLETED");
        if (exams.getTotalElements() == 0 || exams.getContent().isEmpty()) {
            return Map.of("examTerm", term == null ? "latest" : term, "overallPassPct", 0.0, "classWise", List.of());
        }
        Long examId = exams.getContent().get(0).getId();
        List<Map<String, Object>> rows = reportService.getStudentPerformanceReport(null, examId, null);
        long total = rows.size();
        long pass = rows.stream().filter(this::isPassRow).count();
        double pct = total == 0 ? 0 : (pass * 100.0 / total);
        return Map.of(
                "examTerm", term == null || term.isBlank() ? "latest" : term,
                "overallPassPct", BigDecimal.valueOf(pct).setScale(1, RoundingMode.HALF_UP),
                "classWise", reportService.getClassSummary().stream().limit(10).toList());
    }

    public Map<String, Object> examsModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        String term = Objects.toString(input == null ? null : input.get("term"), "Term 1");
        var examsPage = examService.getExamsPaged(0, 25, null, null);
        long totalExams = examsPage.getTotalElements();
        long completedExams = examsPage.getContent().stream()
                .filter(e -> "COMPLETED".equalsIgnoreCase(safeText(e.getStatus())))
                .count();
        long publishedResults = examsPage.getContent().stream()
                .filter(e -> Boolean.TRUE.equals(e.getResultsPublished()))
                .count();
        Map<String, Object> passRate = examPassRate(term);
        return Map.ofEntries(
                Map.entry("scope", "exams-module"),
                Map.entry("query", query),
                Map.entry("term", term),
                Map.entry("totalExams", totalExams),
                Map.entry("completedExams", completedExams),
                Map.entry("publishedResults", publishedResults),
                Map.entry("overallPassPct", passRate.getOrDefault("overallPassPct", BigDecimal.ZERO)),
                Map.entry("classWise", passRate.getOrDefault("classWise", List.of())),
                Map.entry("recentExams", examsPage.getContent().stream().limit(10).toList()));
    }

    public Map<String, Object> payrollPendingApprovals(String month) {
        PayrollDTOs.DisbursementQueueSummaryResponse summary = payrollService.getDisbursementSummary();
        var submitted = payrollService.getDisbursementAttemptsPaged(0, 100, "SUBMITTED").getContent();
        Map<String, Long> byDept = submitted.stream().collect(java.util.stream.Collectors.groupingBy(
                a -> normalizeDepartment(a.getTeacherName()), java.util.stream.Collectors.counting()));
        List<Map<String, Object>> departmentWise = byDept.entrySet().stream()
                .map(e -> Map.<String, Object>of("department", e.getKey(), "pending", e.getValue()))
                .toList();
        return Map.of(
                "month", month == null || month.isBlank() ? YearMonth.now().toString() : month,
                "totalPendingApprovals", summary.getSubmittedCount(),
                "departmentWise", departmentWise);
    }

    public Map<String, Object> payrollModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        String month = Objects.toString(input == null ? null : input.get("month"), YearMonth.now().toString());
        PayrollDTOs.DisbursementQueueSummaryResponse summary = payrollService.getDisbursementSummary();
        List<PayrollDTOs.DisbursementAttemptResponse> submitted =
                payrollService.getDisbursementAttemptsPaged(0, 100, "SUBMITTED").getContent();
        List<PayrollDTOs.DisbursementAttemptResponse> completed =
                payrollService.getDisbursementAttemptsPaged(0, 100, "COMPLETED").getContent();
        Map<String, Long> byDept = submitted.stream().collect(java.util.stream.Collectors.groupingBy(
                a -> normalizeDepartment(a.getTeacherName()),
                java.util.stream.Collectors.counting()));
        List<Map<String, Object>> departmentPending = byDept.entrySet().stream()
                .map(e -> Map.<String, Object>of("department", e.getKey(), "pending", e.getValue()))
                .toList();
        return Map.ofEntries(
                Map.entry("scope", "payroll-module"),
                Map.entry("query", query),
                Map.entry("month", month),
                Map.entry("submittedCount", summary.getSubmittedCount()),
                Map.entry("completedCount", summary.getCompletedCount()),
                Map.entry("failedCount", summary.getFailedCount()),
                Map.entry("submittedAmount", safe(summary.getSubmittedAmount())),
                Map.entry("completedAmount", safe(summary.getCompletedAmount())),
                Map.entry("pendingApprovals", summary.getSubmittedCount()),
                Map.entry("recentSubmitted", submitted.stream().limit(10).toList()),
                Map.entry("recentCompleted", completed.stream().limit(10).toList()),
                Map.entry("departmentPending", departmentPending));
    }

    public Map<String, Object> schoolOverview() {
        var fee = feeService.getCollectionSummary(null, null, YearMonth.now().toString());
        var payroll = payrollService.getDisbursementSummary();
        var routes = transportService.getRoutes();
        var vehicles = transportService.listVehicles();
        var books = libraryService.getBooksPaged(0, 1, null, null, "ALL");
        var overdue = libraryService.getIssuesPaged(0, 1, Enums.BookIssueStatus.OVERDUE);
        HostelDTOs.HostelStats hostelStats = hostelService.getStats();
        var commAnn = communicationService.getAnnouncementsPaged(0, 1, null);
        var reports = reportService.listGeneratedReports(0, 1);
        var classRows = reportService.getClassSummary();
        var sectionRows = reportService.getSectionSummary();
        long staffCount = operationsService.listStaffPaged(0, 1, null, null).getTotalElements();
        return Map.ofEntries(
                Map.entry("schoolName", "Current School Workspace"),
                Map.entry("asOf", LocalDate.now().toString()),
                Map.entry("students", Map.of("total", studentService.countStudents())),
                Map.entry("teachers", Map.of("total", teacherService.count(), "staffCount", staffCount)),
                Map.entry("classes", Map.of("totalClasses", classRows.size(), "totalSections", sectionRows.size())),
                Map.entry("attendance", attendanceTodaySummary()),
                Map.entry("fees", Map.of(
                        "pendingAmountInr", safe(fee.getTotalPending()),
                        "collectedMonthInr", safe(fee.getTotalCollected()),
                        "collectionDeltaPct", fee.getCollectionRate(),
                        "overdueStudents", fee.getOverdueCount())),
                Map.entry("payroll", Map.of(
                        "monthlyGrossInr", safe(payroll.getSubmittedAmount()).add(safe(payroll.getCompletedAmount())),
                        "processedEmployees", payroll.getCompletedCount(),
                        "pendingApprovals", payroll.getSubmittedCount())),
                Map.entry("transport", Map.of("activeRoutes", routes.size(), "activeVehicles", vehicles.size(), "transportDues", fee.getOverdueCount())),
                Map.entry("library", Map.of("activeMembers", books.getTotalElements(), "booksIssuedToday", books.getContent().size(), "overdueBooks", overdue.getTotalElements())),
                Map.entry("hostel", Map.of("residents", hostelStats.getTotalOccupancy(), "occupiedBeds", hostelStats.getTotalOccupancy(), "vacantBeds", hostelStats.getAvailableBeds())),
                Map.entry("communication", Map.of("messagesSentToday", communicationService.getUnreadMessageCount(), "campaignsRunning", commAnn.getContent().size(), "deliveryRatePct", 95.0)),
                Map.entry("reports", Map.of("scheduledReports", reports.getTotalElements(), "failedJobs24h", 0, "lastPublished", reports.getContent().isEmpty() ? "N/A" : "Latest generated report")));
    }

    public Map<String, Object> settingsModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        var cfg = settingsService.getSettings();
        Map<String, Boolean> features = settingsService.getFeatureFlags();
        var branches = settingsService.listBranchesBySchoolCode(cfg.getSchoolCode());
        return Map.ofEntries(
                Map.entry("scope", "settings-module"),
                Map.entry("query", query),
                Map.entry("schoolName", safeText(cfg.getSchoolName())),
                Map.entry("schoolCode", safeText(cfg.getSchoolCode())),
                Map.entry("address", safeText(cfg.getAddress())),
                Map.entry("phone", safeText(cfg.getPhone())),
                Map.entry("email", safeText(cfg.getEmail())),
                Map.entry("branding", Map.of(
                        "primaryColor", safeText(cfg.getPrimaryColor()),
                        "secondaryColor", safeText(cfg.getSecondaryColor()),
                        "logo", safeText(cfg.getLogo()))),
                Map.entry("features", features),
                Map.entry("branches", branches),
                Map.entry("branchCount", branches.size()));
    }

    public Map<String, Object> leaveModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        var mineBalance = leaveService.balanceForCurrentUser();
        var policy = leaveService.getLeavePolicy();
        var all = leaveService.listAllPaged(0, 100, "").getContent();
        long pending = all.stream().filter(r -> "PENDING".equalsIgnoreCase(String.valueOf(r.getStatus()))).count();
        long approved = all.stream().filter(r -> "APPROVED".equalsIgnoreCase(String.valueOf(r.getStatus()))).count();
        long rejected = all.stream().filter(r -> "REJECTED".equalsIgnoreCase(String.valueOf(r.getStatus()))).count();
        return Map.ofEntries(
                Map.entry("scope", "leave-module"),
                Map.entry("query", query),
                Map.entry("pendingCount", pending),
                Map.entry("approvedCount", approved),
                Map.entry("rejectedCount", rejected),
                Map.entry("totalRequests", all.size()),
                Map.entry("policy", Map.of(
                        "annualEntitled", policy.getAnnualEntitled(),
                        "sickEntitled", policy.getSickEntitled(),
                        "casualEntitled", policy.getCasualEntitled(),
                        "policyYearLabel", safeText(policy.getPolicyYearLabel()))),
                Map.entry("myBalance", Map.of(
                        "annualRemaining", mineBalance.getAnnualRemaining(),
                        "sickRemaining", mineBalance.getSickRemaining(),
                        "casualRemaining", mineBalance.getCasualRemaining())),
                Map.entry("recentRequests", all.stream().limit(10).toList()));
    }

    public Map<String, Object> hostelModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        var stats = hostelService.getStats();
        var hostels = hostelService.listHostels();
        var incidents = hostelService.listIncidents(null);
        var gatePasses = hostelService.listGatePasses(null);
        long pendingGate = gatePasses.stream().filter(g -> "PENDING".equalsIgnoreCase(safeText(g.getStatus()))).count();
        return Map.ofEntries(
                Map.entry("scope", "hostel-module"),
                Map.entry("query", query),
                Map.entry("hostels", hostels.stream().limit(10).toList()),
                Map.entry("hostelCount", hostels.size()),
                Map.entry("residents", stats.getTotalOccupancy()),
                Map.entry("vacantBeds", stats.getAvailableBeds()),
                Map.entry("incidents", incidents.stream().limit(10).toList()),
                Map.entry("incidentCount", incidents.size()),
                Map.entry("pendingGatePasses", pendingGate));
    }

    public Map<String, Object> libraryModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        var books = libraryService.getBooksPaged(0, 20, null, null, "ALL");
        var overdue = libraryService.getIssuesPaged(0, 20, Enums.BookIssueStatus.OVERDUE);
        var issued = libraryService.getIssuesPaged(0, 20, Enums.BookIssueStatus.ISSUED);
        return Map.ofEntries(
                Map.entry("scope", "library-module"),
                Map.entry("query", query),
                Map.entry("bookCount", books.getTotalElements()),
                Map.entry("issuedCount", issued.getTotalElements()),
                Map.entry("overdueCount", overdue.getTotalElements()),
                Map.entry("recentBooks", books.getContent().stream().limit(10).toList()),
                Map.entry("recentOverdue", overdue.getContent().stream().limit(10).toList()));
    }

    public Map<String, Object> auditModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        int limit = 20;
        Object rawLimit = input == null ? null : input.get("limit");
        if (rawLimit != null) {
            try {
                limit = Math.min(100, Math.max(1, Integer.parseInt(String.valueOf(rawLimit))));
            } catch (Exception ignored) {}
        }
        var page = auditService.getAuditLogs(0, limit, null, null, "", null, null);
        List<Map<String, Object>> logs = page.getContent().stream().map(l -> Map.<String, Object>of(
                "id", l.getId(),
                "action", String.valueOf(l.getAction()),
                "module", safeText(l.getModule()),
                "description", safeText(l.getDescription()),
                "userId", l.getUserId() == null ? 0L : l.getUserId(),
                "userName", safeText(l.getUserName()),
                "entityType", safeText(l.getEntityType()),
                "entityId", l.getEntityId() == null ? 0L : l.getEntityId(),
                "createdAt", l.getCreatedAt() == null ? "" : l.getCreatedAt().toString()
        )).toList();
        return Map.of("scope", "audit-module", "query", query, "limit", limit, "total", page.getTotalElements(), "logs", logs);
    }

    public Map<String, Object> reportsModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        String month = Objects.toString(input == null ? null : input.get("month"), YearMonth.now().toString());
        var dashboard = reportService.getAdminDashboard("MONTH_TO_DATE", month);
        var generated = reportService.listGeneratedReports(0, 20);
        return Map.ofEntries(
                Map.entry("scope", "reports-module"),
                Map.entry("query", query),
                Map.entry("month", month),
                Map.entry("kpis", Map.of(
                        "totalStudents", dashboard.getTotalStudents(),
                        "totalTeachers", dashboard.getTotalTeachers(),
                        "feesCollected", dashboard.getFeesCollected(),
                        "feesPending", dashboard.getFeesPending(),
                        "collectionRate", dashboard.getCollectionRate())),
                Map.entry("recentActivities", dashboard.getRecentActivities().stream().limit(10).toList()),
                Map.entry("generatedReports", generated.getContent().stream().limit(10).toList()),
                Map.entry("generatedCount", generated.getTotalElements()),
                Map.entry("classesWithoutHomeroom", dashboard.getClassesWithoutHomeroomTeacher().size()));
    }

    public Map<String, Object> inboxModuleSummary(Map<String, Object> input) {
        String query = Objects.toString(input == null ? null : input.get("query"), "");
        var timeline = inboxTimelineService.getTimeline(0, 20, null, null, null, null);
        var announcements = communicationService.getAnnouncementsPaged(0, 20, null);
        long unread = communicationService.getUnreadMessageCount();
        return Map.ofEntries(
                Map.entry("scope", "inbox-module"),
                Map.entry("query", query),
                Map.entry("unreadMessages", unread),
                Map.entry("timelineCount", timeline.getTotalElements()),
                Map.entry("timeline", timeline.getContent().stream().limit(20).toList()),
                Map.entry("announcements", announcements.getContent().stream().limit(20).toList()),
                Map.entry("announcementCount", announcements.getTotalElements()));
    }

    private BigDecimal safe(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private long countBelowThreshold(List<Map<String, Object>> rows, String key, double threshold) {
        return rows.stream().filter(r -> toDouble(r.get(key)) < threshold).count();
    }

    private long sumLong(List<Map<String, Object>> rows, String... keys) {
        return rows.stream().mapToLong(r -> longOf(r, keys)).sum();
    }

    private long longOf(Map<String, Object> row, String... keys) {
        for (String k : keys) {
            Object v = row.get(k);
            if (v instanceof Number n) {
                return n.longValue();
            }
            if (v != null) {
                try {
                    return Long.parseLong(v.toString());
                } catch (Exception ignored) {}
            }
        }
        return 0;
    }

    private String stringOf(Map<String, Object> row, String... keys) {
        for (String k : keys) {
            Object v = row.get(k);
            if (v != null && !v.toString().isBlank()) return v.toString();
        }
        return "N/A";
    }

    private double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        if (v == null) return 0;
        try {
            return Double.parseDouble(v.toString());
        } catch (Exception ignored) {
            return 0;
        }
    }

    private boolean isPassRow(Map<String, Object> row) {
        String status = Objects.toString(row.getOrDefault("status", row.getOrDefault("resultStatus", "")), "");
        if ("PASS".equalsIgnoreCase(status)) {
            return true;
        }
        double pct = toDouble(row.getOrDefault("percentage", row.getOrDefault("scorePct", 0)));
        return pct >= 40;
    }

    private String normalizeDepartment(String teacherName) {
        if (teacherName == null || teacherName.isBlank()) return "General";
        String t = teacherName.toLowerCase();
        if (t.contains("math")) return "Mathematics";
        if (t.contains("science")) return "Science";
        if (t.contains("admin")) return "Administration";
        return "Academic";
    }

    private Optional<String> extractClassToken(String query) {
        Matcher m = Pattern.compile("\\bclass\\s*([a-z0-9-]+)\\b", Pattern.CASE_INSENSITIVE).matcher(query == null ? "" : query);
        if (m.find()) {
            return Optional.of("Class " + m.group(1).toUpperCase());
        }
        return Optional.empty();
    }

    private Optional<String> extractSectionToken(String query) {
        Matcher m = Pattern.compile("\\bsection\\s*([a-z0-9-]+)\\b", Pattern.CASE_INSENSITIVE).matcher(query == null ? "" : query);
        if (m.find()) {
            return Optional.of(m.group(1).toUpperCase());
        }
        return Optional.empty();
    }

    private boolean matchesClass(String actualName, String requested) {
        String a = normalizeClass(actualName);
        String r = normalizeClass(requested);
        return a.equals(r) || a.endsWith(" " + r) || a.contains(r);
    }

    private boolean matchesSection(String actualName, String requested) {
        return normalizeSection(actualName).equals(normalizeSection(requested));
    }

    private String normalizeClass(String value) {
        String v = value == null ? "" : value.trim().toLowerCase();
        v = v.replaceAll("[^a-z0-9]+", " ").trim();
        if (v.startsWith("class ")) {
            return v;
        }
        return "class " + v;
    }

    private String normalizeSection(String value) {
        String v = value == null ? "" : value.trim().toLowerCase();
        return v.replaceAll("^section\\s+", "").replaceAll("[^a-z0-9]+", "");
    }

    private ResolvedClassSection resolveClassSection(Map<String, Object> input, String query) {
        String requestedClass = Objects.toString(input == null ? null : input.get("className"), "");
        String requestedSection = Objects.toString(input == null ? null : input.get("sectionName"), "");
        if (requestedClass.isBlank()) {
            requestedClass = extractClassToken(query).orElse("");
        }
        if (requestedSection.isBlank()) {
            requestedSection = extractSectionToken(query).orElse("");
        }
        CompactClassSection compact = parseCompactClassSection(requestedClass);
        if (compact != null) {
            requestedClass = compact.className();
            if (requestedSection.isBlank()) {
                requestedSection = compact.sectionName();
            }
        }
        if (requestedClass.isBlank() || requestedSection.isBlank()) {
            return null;
        }
        List<AcademicDTOs.ClassWithSectionsResponse> classes = academicService.getClassesWithSections("ACTIVE");
        final String classToken = requestedClass;
        Optional<AcademicDTOs.ClassWithSectionsResponse> klass = classes.stream()
                .filter(c -> matchesClass(c.getName(), classToken))
                .findFirst();
        if (klass.isEmpty()) {
            return null;
        }
        final String sectionToken = requestedSection;
        Optional<AcademicDTOs.SectionDTO> section = klass.get().getSections().stream()
                .filter(s -> matchesSection(s.getName(), sectionToken))
                .findFirst();
        if (section.isEmpty()) {
            return null;
        }
        return new ResolvedClassSection(klass.get().getId(), klass.get().getName(), section.get().getId(), section.get().getName());
    }

    private CompactClassSection parseCompactClassSection(String rawClassName) {
        if (rawClassName == null) {
            return null;
        }
        String raw = rawClassName.trim().replaceAll("\\s+", " ");
        if (raw.isBlank()) {
            return null;
        }
        String withoutPrefix = raw.replaceFirst("(?i)^class\\s*", "").trim();
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("^([0-9]{1,2})\\s*[-/]\\s*([a-zA-Z])$").matcher(withoutPrefix);
        if (!m.matches()) {
            return null;
        }
        return new CompactClassSection("Class " + m.group(1), m.group(2).toUpperCase());
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }

    private boolean containsAnyInFields(String title, String description, String type, String... keywords) {
        String combined = (safeText(title) + " " + safeText(description) + " " + safeText(type)).toLowerCase();
        for (String keyword : keywords) {
            if (combined.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private boolean containsAnyInText(String text, String... keywords) {
        String source = text == null ? "" : text.toLowerCase();
        for (String keyword : keywords) {
            if (source.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private record ResolvedClassSection(Long classId, String className, Long sectionId, String sectionName) {}
    private record CompactClassSection(String className, String sectionName) {}
}
