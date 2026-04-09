package com.school.erp.bootstrap;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.academic.entity.*;
import com.school.erp.modules.academic.repository.*;
import com.school.erp.modules.attendance.entity.AttendanceRecord;
import com.school.erp.modules.attendance.repository.AttendanceRepository;
import com.school.erp.modules.audit.entity.AuditLog;
import com.school.erp.modules.audit.repository.AuditLogRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.chat.entity.ChatConversation;
import com.school.erp.modules.chat.entity.ChatMessage;
import com.school.erp.modules.chat.entity.ChatParticipant;
import com.school.erp.modules.chat.repository.ChatConversationRepository;
import com.school.erp.modules.chat.repository.ChatMessageRepository;
import com.school.erp.modules.chat.repository.ChatParticipantRepository;
import com.school.erp.modules.communication.entity.Announcement;
import com.school.erp.modules.communication.entity.Message;
import com.school.erp.modules.communication.repository.AnnouncementRepository;
import com.school.erp.modules.communication.repository.MessageRepository;
import com.school.erp.modules.documents.entity.Document;
import com.school.erp.modules.documents.repository.DocumentRepository;
import com.school.erp.modules.exams.entity.*;
import com.school.erp.modules.exams.repository.*;
import com.school.erp.modules.fees.entity.FeeComponent;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.fees.entity.FeePaymentAttempt;
import com.school.erp.modules.fees.entity.FeeStructure;
import com.school.erp.modules.fees.repository.FeeComponentRepository;
import com.school.erp.modules.fees.repository.FeePaymentAttemptRepository;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.fees.repository.FeeStructureRepository;
import com.school.erp.modules.guardian.entity.Guardian;
import com.school.erp.modules.guardian.entity.StudentGuardianMapping;
import com.school.erp.modules.guardian.repository.GuardianRepository;
import com.school.erp.modules.guardian.repository.StudentGuardianMappingRepository;
import com.school.erp.modules.hostel.entity.Hostel;
import com.school.erp.modules.hostel.entity.HostelAllocation;
import com.school.erp.modules.hostel.entity.HostelRoom;
import com.school.erp.modules.hostel.repository.HostelAllocationRepository;
import com.school.erp.modules.hostel.repository.HostelRepository;
import com.school.erp.modules.hostel.repository.HostelRoomRepository;
import com.school.erp.modules.leave.entity.LeaveRequest;
import com.school.erp.modules.leave.repository.LeaveRequestRepository;
import com.school.erp.modules.library.entity.Book;
import com.school.erp.modules.library.entity.BookIssue;
import com.school.erp.modules.library.repository.BookIssueRepository;
import com.school.erp.modules.library.repository.BookRepository;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.modules.payroll.entity.Payslip;
import com.school.erp.modules.payroll.entity.SalaryComponent;
import com.school.erp.modules.payroll.entity.SalaryStructure;
import com.school.erp.modules.payroll.repository.PayslipRepository;
import com.school.erp.modules.payroll.repository.SalaryComponentRepository;
import com.school.erp.modules.payroll.repository.SalaryStructureRepository;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.modules.timetable.repository.TimetableRepository;
import com.school.erp.modules.transport.entity.*;
import com.school.erp.modules.transport.repository.*;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

/**
 * Idempotent demo workspaces with realistic rows across modules. Tenant ids look like production slugs
 * (school + region + short hash), not generic {@code t1}.
 */
@Service
@Profile("dev")
public class DemoDataSeedService {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeedService.class);
    /**
     * BCrypt for {@code admin123} (verified with Spring {@code BCryptPasswordEncoder}).
     */
    private static final String BCRYPT_ADMIN123 = "$2a$10$OF9wtmX3lDzBIYsrZlAe8Ou2829Ih6l6WTe2TxSVRacFh1fAr2mBy";
    private static final String FEATURES_JSON = "{\"transport\":true,\"library\":true,\"hostel\":true,\"payroll\":true,"
            + "\"documents\":true,\"audit\":true,\"communication\":true,\"reports\":true,\"student\":true,\"teacher\":true,"
            + "\"attendance\":true,\"fees\":true}";

    private final TenantConfigRepository tenantConfigRepository;
    private final UserRepository userRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    private final TimetableRepository timetableRepository;
    private final ExamRepository examRepository;
    private final ExamClassScopeRepository examClassScopeRepository;
    private final ExamScheduleSlotRepository examScheduleSlotRepository;
    private final MarkRecordRepository markRecordRepository;
    private final FeeStructureRepository feeStructureRepository;
    private final FeeComponentRepository feeComponentRepository;
    private final FeePaymentRepository feePaymentRepository;
    private final FeePaymentAttemptRepository feePaymentAttemptRepository;
    private final AnnouncementRepository announcementRepository;
    private final NotificationRepository notificationRepository;
    private final MessageRepository messageRepository;
    private final TransportVehicleRepository transportVehicleRepository;
    private final TransportDriverRepository transportDriverRepository;
    private final TransportRouteRepository transportRouteRepository;
    private final RouteStopRepository routeStopRepository;
    private final StudentTransportMappingRepository studentTransportMappingRepository;
    private final VehicleLiveLocationRepository vehicleLiveLocationRepository;
    private final BookRepository bookRepository;
    private final BookIssueRepository bookIssueRepository;
    private final HostelRepository hostelRepository;
    private final HostelRoomRepository hostelRoomRepository;
    private final HostelAllocationRepository hostelAllocationRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final SalaryComponentRepository salaryComponentRepository;
    private final PayslipRepository payslipRepository;
    private final DocumentRepository documentRepository;
    private final AuditLogRepository auditLogRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final GuardianRepository guardianRepository;
    private final StudentGuardianMappingRepository studentGuardianMappingRepository;
    private final ClassTeacherAssignmentRepository classTeacherAssignmentRepository;
    private final SubjectTeacherAssignmentRepository subjectTeacherAssignmentRepository;
    private final ChatConversationRepository chatConversationRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final EntityManager entityManager;

    public DemoDataSeedService(
            TenantConfigRepository tenantConfigRepository,
            UserRepository userRepository,
            AcademicYearRepository academicYearRepository,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository,
            TeacherRepository teacherRepository,
            StudentRepository studentRepository,
            AttendanceRepository attendanceRepository,
            TimetableRepository timetableRepository,
            ExamRepository examRepository,
            ExamClassScopeRepository examClassScopeRepository,
            ExamScheduleSlotRepository examScheduleSlotRepository,
            MarkRecordRepository markRecordRepository,
            FeeStructureRepository feeStructureRepository,
            FeeComponentRepository feeComponentRepository,
            FeePaymentRepository feePaymentRepository,
            FeePaymentAttemptRepository feePaymentAttemptRepository,
            AnnouncementRepository announcementRepository,
            NotificationRepository notificationRepository,
            MessageRepository messageRepository,
            TransportVehicleRepository transportVehicleRepository,
            TransportDriverRepository transportDriverRepository,
            TransportRouteRepository transportRouteRepository,
            RouteStopRepository routeStopRepository,
            StudentTransportMappingRepository studentTransportMappingRepository,
            VehicleLiveLocationRepository vehicleLiveLocationRepository,
            BookRepository bookRepository,
            BookIssueRepository bookIssueRepository,
            HostelRepository hostelRepository,
            HostelRoomRepository hostelRoomRepository,
            HostelAllocationRepository hostelAllocationRepository,
            SalaryStructureRepository salaryStructureRepository,
            SalaryComponentRepository salaryComponentRepository,
            PayslipRepository payslipRepository,
            DocumentRepository documentRepository,
            AuditLogRepository auditLogRepository,
            LeaveRequestRepository leaveRequestRepository,
            GuardianRepository guardianRepository,
            StudentGuardianMappingRepository studentGuardianMappingRepository,
            ClassTeacherAssignmentRepository classTeacherAssignmentRepository,
            SubjectTeacherAssignmentRepository subjectTeacherAssignmentRepository,
            ChatConversationRepository chatConversationRepository,
            ChatParticipantRepository chatParticipantRepository,
            ChatMessageRepository chatMessageRepository,
            EntityManager entityManager) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.userRepository = userRepository;
        this.academicYearRepository = academicYearRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.attendanceRepository = attendanceRepository;
        this.timetableRepository = timetableRepository;
        this.examRepository = examRepository;
        this.examClassScopeRepository = examClassScopeRepository;
        this.examScheduleSlotRepository = examScheduleSlotRepository;
        this.markRecordRepository = markRecordRepository;
        this.feeStructureRepository = feeStructureRepository;
        this.feeComponentRepository = feeComponentRepository;
        this.feePaymentRepository = feePaymentRepository;
        this.feePaymentAttemptRepository = feePaymentAttemptRepository;
        this.announcementRepository = announcementRepository;
        this.notificationRepository = notificationRepository;
        this.messageRepository = messageRepository;
        this.transportVehicleRepository = transportVehicleRepository;
        this.transportDriverRepository = transportDriverRepository;
        this.transportRouteRepository = transportRouteRepository;
        this.routeStopRepository = routeStopRepository;
        this.studentTransportMappingRepository = studentTransportMappingRepository;
        this.vehicleLiveLocationRepository = vehicleLiveLocationRepository;
        this.bookRepository = bookRepository;
        this.bookIssueRepository = bookIssueRepository;
        this.hostelRepository = hostelRepository;
        this.hostelRoomRepository = hostelRoomRepository;
        this.hostelAllocationRepository = hostelAllocationRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.salaryComponentRepository = salaryComponentRepository;
        this.payslipRepository = payslipRepository;
        this.documentRepository = documentRepository;
        this.auditLogRepository = auditLogRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.guardianRepository = guardianRepository;
        this.studentGuardianMappingRepository = studentGuardianMappingRepository;
        this.classTeacherAssignmentRepository = classTeacherAssignmentRepository;
        this.subjectTeacherAssignmentRepository = subjectTeacherAssignmentRepository;
        this.chatConversationRepository = chatConversationRepository;
        this.chatParticipantRepository = chatParticipantRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public void seedIfNeeded() {
        seedPlatformSuperAdminIfMissing();
        if (!tenantConfigRepository.existsBySchoolCode("STXHER-KOL")) {
            seedStXaviersHeritage();
        }
        if (!tenantConfigRepository.existsBySchoolCode("MRIDGE-PN")) {
            seedMeridianRidge();
        }
        tenantConfigRepository.findBySchoolCode("STXHER-KOL")
                .ifPresent(c -> expandStXaviersBulkSeed(c.getTenantId(), "STXHER-KOL"));
        tenantConfigRepository.findBySchoolCode("MRIDGE-PN")
                .ifPresent(c -> expandMeridianBulkSeed(c.getTenantId(), "MRIDGE-PN"));
        log.info("Demo data seed complete (baseline tenants + idempotent bulk extension for STXHER-KOL / MRIDGE-PN).");
    }

    private void seedPlatformSuperAdminIfMissing() {
        if (userRepository.findByEmailAndSchoolCodeAndIsDeletedFalse("super.ops@schoolvault.edu", "PLATFORM").isPresent()) {
            return;
        }
        User u = User.builder()
                .name("Rahul Mehta")
                .email("super.ops@schoolvault.edu")
                .password(BCRYPT_ADMIN123)
                .phone("+91-98000-11223")
                .role(Enums.Role.SUPER_ADMIN)
                .schoolCode("PLATFORM")
                .build();
        u.setTenantId("sv_platform_ops_9d4e2a8f");
        u.setIsActive(true);
        u.setIsDeleted(false);
        userRepository.save(u);
        log.info("Seeded platform SUPER_ADMIN (login: super.ops@schoolvault.edu / school code PLATFORM / password admin123)");
    }

    private void seedStXaviersHeritage() {
        final String tenantId = "tenant_stxaviers_heritage_k7m2n9p4";
        final String schoolCode = "STXHER-KOL";
        TenantConfig cfg = tenant("St. Xavier's Heritage School", schoolCode,
                "42 Park Street, Kolkata 700016, West Bengal", "+91-33-2288-4400", "office@stxheritage.edu");
        cfg.setTenantId(tenantId);
        cfg.setFeaturesJson(FEATURES_JSON);
        cfg.setLibraryFinePerDay(new BigDecimal("12.00"));
        tenantConfigRepository.save(cfg);

        User admin = user(tenantId, schoolCode, "Dr. Ananya Dutta", "principal@stxheritage.edu", Enums.Role.ADMIN);
        User tUser1 = user(tenantId, schoolCode, "Debjyoti Sen", "d.sen@stxheritage.edu", Enums.Role.TEACHER);
        User tUser2 = user(tenantId, schoolCode, "Meera Iyer", "m.iyer@stxheritage.edu", Enums.Role.TEACHER);
        User tUser3 = user(tenantId, schoolCode, "Kunal Bose", "k.bose@stxheritage.edu", Enums.Role.TEACHER);
        User pUser1 = user(tenantId, schoolCode, "Sujata Banerjee", "s.banerjee.parent@stxheritage.edu", Enums.Role.PARENT);
        User pUser2 = user(tenantId, schoolCode, "Arvind Khanna", "a.khanna.parent@stxheritage.edu", Enums.Role.PARENT);
        User lib = user(tenantId, schoolCode, "Priyanka Ghosh", "library@stxheritage.edu", Enums.Role.LIBRARY_STAFF);
        userRepository.saveAll(List.of(admin, tUser1, tUser2, tUser3, pUser1, pUser2, lib));
        flush();

        AcademicYear ay = AcademicYear.builder()
                .name("2025-2026")
                .startDate(LocalDate.of(2025, 4, 1))
                .endDate(LocalDate.of(2026, 3, 31))
                .isCurrent(true)
                .build();
        ay.setTenantId(tenantId);
        academicYearRepository.save(ay);
        flush();

        Teacher t1 = teacher(tenantId, "Debjyoti", "Sen", "d.sen@stxheritage.edu", tUser1.getId(), List.of("Mathematics", "Physics"));
        Teacher t2 = teacher(tenantId, "Meera", "Iyer", "m.iyer@stxheritage.edu", tUser2.getId(), List.of("English", "History"));
        Teacher t3 = teacher(tenantId, "Kunal", "Bose", "k.bose@stxheritage.edu", tUser3.getId(), List.of("Chemistry", "Biology"));
        t3.setLibraryStaffRole(Enums.LibraryStaffRole.ASSISTANT);
        teacherRepository.saveAll(List.of(t1, t2, t3));
        flush();

        SchoolClass c9 = clazz(tenantId, "Class IX", 9, ay.getId(), t1.getId(), "Debjyoti Sen");
        SchoolClass c10 = clazz(tenantId, "Class X", 10, ay.getId(), t2.getId(), "Meera Iyer");
        schoolClassRepository.saveAll(List.of(c9, c10));
        flush();

        Section c9a = section(tenantId, "A", c9.getId(), 40, 4);
        Section c9b = section(tenantId, "B", c9.getId(), 40, 4);
        Section c10a = section(tenantId, "A", c10.getId(), 40, 4);
        Section c10b = section(tenantId, "B", c10.getId(), 40, 4);
        sectionRepository.saveAll(List.of(c9a, c9b, c10a, c10b));
        flush();

        List<Student> studs = new ArrayList<>();
        studs.add(student(tenantId, "Riya", "Banerjee", "SX-2025-014", c9.getId(), c9a.getId(), pUser1.getId(), "Sujata Banerjee",
                "riya.b@stxheritage.edu", Enums.Gender.FEMALE));
        studs.add(student(tenantId, "Ayan", "Banerjee", "SX-2025-015", c9.getId(), c9a.getId(), pUser1.getId(), "Sujata Banerjee",
                "ayan.b@stxheritage.edu", Enums.Gender.MALE));
        studs.add(student(tenantId, "Ishaan", "Khanna", "SX-2025-028", c9.getId(), c9b.getId(), pUser2.getId(), "Arvind Khanna",
                "ishaan.k@stxheritage.edu", Enums.Gender.MALE));
        studs.add(student(tenantId, "Neha", "Khanna", "SX-2025-029", c10.getId(), c10a.getId(), pUser2.getId(), "Arvind Khanna",
                "neha.k@stxheritage.edu", Enums.Gender.FEMALE));
        studs.add(student(tenantId, "Vikram", "Das", "SX-2025-031", c10.getId(), c10b.getId(), null, "—",
                "vikram.d@stxheritage.edu", Enums.Gender.MALE));
        studs.add(student(tenantId, "Ananya", "Ghosh", "SX-2025-032", c10.getId(), c10b.getId(), null, "—",
                "ananya.g@stxheritage.edu", Enums.Gender.FEMALE));
        studentRepository.saveAll(studs);
        flush();

        Guardian g1 = guardian(tenantId, "Sujata Banerjee", "+91-98300-22114", pUser1.getId());
        guardianRepository.save(g1);
        mapGuardian(tenantId, studs.get(0).getId(), g1.getId(), Enums.GuardianRelationType.MOTHER, true);
        mapGuardian(tenantId, studs.get(1).getId(), g1.getId(), Enums.GuardianRelationType.MOTHER, true);
        flush();

        classTeacherRow(tenantId, ay.getId(), c9.getId(), c9a.getId(), t1.getId());
        classTeacherRow(tenantId, ay.getId(), c10.getId(), c10b.getId(), t3.getId());
        subjectRow(tenantId, ay.getId(), c9.getId(), c9a.getId(), "Mathematics", t1.getId());
        subjectRow(tenantId, ay.getId(), c9.getId(), c9a.getId(), "English", t2.getId());
        subjectRow(tenantId, ay.getId(), c10.getId(), null, "Science", t3.getId());
        flush();

        LocalDate attDay = LocalDate.now().minusDays(1);
        for (Student s : studs.subList(0, 4)) {
            attendanceRepository.save(att(tenantId, s, attDay, Enums.AttendanceStatus.PRESENT, t1.getId()));
        }
        attendanceRepository.save(att(tenantId, studs.get(4), attDay, Enums.AttendanceStatus.LATE, t1.getId()));

        timetableRepository.save(tt(tenantId, ay.getId(), c9.getId(), c9a.getId(), Enums.DayOfWeek.MONDAY, 1,
                LocalTime.of(8, 30), LocalTime.of(9, 15), "Mathematics", t1.getId(), "Debjyoti Sen", "Room 201"));
        timetableRepository.save(tt(tenantId, ay.getId(), c9.getId(), c9a.getId(), Enums.DayOfWeek.MONDAY, 2,
                LocalTime.of(9, 20), LocalTime.of(10, 5), "English", t2.getId(), "Meera Iyer", "Room 201"));
        timetableRepository.save(tt(tenantId, ay.getId(), c10.getId(), c10b.getId(), Enums.DayOfWeek.TUESDAY, 1,
                LocalTime.of(8, 30), LocalTime.of(9, 15), "Chemistry", t3.getId(), "Kunal Bose", "Lab 1"));

        Exam exam = Exam.builder()
                .name("Half-Yearly Assessment 2025")
                .academicYearId(ay.getId())
                .startDate(LocalDate.now().plusWeeks(2))
                .endDate(LocalDate.now().plusWeeks(3))
                .classIds(List.of(c9.getId(), c10.getId()))
                .status(Enums.ExamStatus.UPCOMING)
                .build();
        exam.setTenantId(tenantId);
        exam.setResultsPublished(false);
        examRepository.save(exam);
        flush();

        ExamScope(tenantId, exam.getId(), c9.getId(), null);
        ExamScope(tenantId, exam.getId(), c10.getId(), c10b.getId());
        examSlot(tenantId, exam.getId(), c9.getId(), c9a.getId(), "Mathematics", LocalDate.now().plusWeeks(2), LocalTime.of(9, 0), LocalTime.of(11, 0), "Hall A");
        examSlot(tenantId, exam.getId(), c10.getId(), c10b.getId(), "Science", LocalDate.now().plusWeeks(2), LocalTime.of(13, 0), LocalTime.of(15, 0), "Lab 1");

        markRecord(tenantId, exam.getId(), studs.get(0), "Mathematics", 82, 100, "B+", c9.getId());
        markRecord(tenantId, exam.getId(), studs.get(0), "English", 76, 100, "B", c9.getId());
        markRecord(tenantId, exam.getId(), studs.get(3), "English", 91, 100, "A+", c10.getId());

        FeeStructure fs = feeStructure(tenantId, "Annual Fee — IX", c9.getId(), "Class IX", ay.getId(), new BigDecimal("48500.00"));
        feeStructureRepository.save(fs);
        feeComponentRepository.save(comp(tenantId, fs.getId(), "Tuition", new BigDecimal("38000"), Enums.FeeComponentType.TUITION));
        feeComponentRepository.save(comp(tenantId, fs.getId(), "Lab & IT", new BigDecimal("6500"), Enums.FeeComponentType.LAB));
        feeComponentRepository.save(comp(tenantId, fs.getId(), "Sports", new BigDecimal("4000"), Enums.FeeComponentType.SPORTS));
        flush();

        FeePayment fp1 = payment(tenantId, studs.get(0), fs.getId(), new BigDecimal("48500"), new BigDecimal("25000"),
                new BigDecimal("23500"), Enums.FeeStatus.PARTIAL, "SX-REC-001");
        FeePayment fp2 = payment(tenantId, studs.get(3), fs.getId(), new BigDecimal("48500"), new BigDecimal("48500"),
                BigDecimal.ZERO, Enums.FeeStatus.PAID, "SX-REC-002");
        feePaymentRepository.saveAll(List.of(fp1, fp2));
        flush();

        FeePaymentAttempt att = new FeePaymentAttempt();
        att.setTenantId(tenantId);
        att.setFeePaymentId(fp1.getId());
        att.setStudentId(studs.get(0).getId());
        att.setParentUserId(pUser1.getId());
        att.setProvider("razorpay");
        att.setProviderOrderId("ord_demo_sx_88421");
        att.setCheckoutToken("tok_demo_sx_99102");
        att.setCurrency("INR");
        att.setAmount(new BigDecimal("12000.00"));
        att.setStatus("success");
        att.setInitiatedAt(LocalDateTime.now().minusDays(2));
        att.setCompletedAt(LocalDateTime.now().minusDays(2));
        att.setIsDeleted(false);
        feePaymentAttemptRepository.save(att);

        saveAnnouncements(tenantId, c9.getId(), c9a.getId(), c10.getId(), c10b.getId());
        notificationRepository.save(notif(tenantId, admin.getId(), "Welcome to the new academic session", "Term calendars are published under Documents.", Enums.NotificationType.INFO));
        notificationRepository.save(notif(tenantId, lib.getId(), "Library: new arrivals", "STEM reading list updated for Class IX–X.", Enums.NotificationType.SUCCESS));

        messageRepository.save(tap(Message.builder().senderId(admin.getId()).senderName("Dr. Ananya Dutta").senderRole("ADMIN")
                .receiverId(tUser1.getId()).receiverName("Debjyoti Sen").content("Please submit the IX-A assessment grid by Friday.")
                .isRead(false).build(), m -> m.setTenantId(tenantId)));

        TransportVehicle veh = vehicle(tenantId, "WB-04-K-9921", Enums.VehicleType.BUS, 42, "Tata Starbus");
        transportVehicleRepository.save(veh);
        TransportDriver drv = driver(tenantId, "Haradhan Mondal", "+91-98765-44102", "WB-DRV-88421");
        transportDriverRepository.save(drv);
        TransportRoute route = TransportRoute.builder().name("South Kolkata — Garia to Park Street")
                .vehicleNumber("WB-04-K-9921").driverName("Haradhan Mondal").driverPhone("+91-98765-44102")
                .assignedStudents(2).vehicleId(veh.getId()).driverId(drv.getId()).build();
        route.setTenantId(tenantId);
        transportRouteRepository.save(route);
        flush();
        RouteStop rs1 = RouteStop.builder().name("Garia Hat").stopTime(LocalTime.of(7, 10)).stopOrder(1).build();
        rs1.setTenantId(tenantId);
        rs1.setRouteId(route.getId());
        RouteStop rs2 = RouteStop.builder().name("Rash Behari Crossing").stopTime(LocalTime.of(7, 35)).stopOrder(2).build();
        rs2.setTenantId(tenantId);
        rs2.setRouteId(route.getId());
        routeStopRepository.saveAll(List.of(rs1, rs2));

        studentTransportMappingRepository.save(tap(StudentTransportMapping.builder().routeId(route.getId())
                .studentId(studs.get(0).getId()).studentName(studs.get(0).getFirstName() + " " + studs.get(0).getLastName())
                .pickupStop("Garia Hat").dropStop("School").build(), m -> m.setTenantId(tenantId)));

        VehicleLiveLocation vll = new VehicleLiveLocation();
        vll.setTenantId(tenantId);
        vll.setVehicleId(veh.getId());
        vll.setRouteId(route.getId());
        vll.setLatitude(new BigDecimal("22.5180"));
        vll.setLongitude(new BigDecimal("88.3832"));
        vll.setRecordedAt(Instant.now().minusSeconds(120));
        vehicleLiveLocationRepository.save(vll);

        Hostel h = new Hostel();
        h.setTenantId(tenantId);
        h.setName("St. Xavier's Residency — Boys");
        h.setCode("SX-RES-B");
        h.setGenderScope("MALE");
        hostelRepository.save(h);
        HostelRoom r1 = HostelRoom.builder().roomNumber("B-204").block("B").floor(2).capacity(4).occupancy(1)
                .roomType(Enums.HostelRoomType.DOUBLE.name()).build();
        r1.setTenantId(tenantId);
        r1.setHostelId(h.getId());
        hostelRoomRepository.save(r1);
        hostelAllocationRepository.save(tap(HostelAllocation.builder().roomId(r1.getId()).roomNumber("B-204")
                        .studentId(studs.get(2).getId()).studentName(studs.get(2).getFirstName() + " " + studs.get(2).getLastName())
                        .fromDate(LocalDate.now().minusMonths(2)).status(Enums.HostelAllocationStatus.ACTIVE).build(),
                a -> a.setTenantId(tenantId)));
        r1.setOccupancy(1);
        hostelRoomRepository.save(r1);

        Book b1 = new Book("Ignited Minds", "A.P.J. Abdul Kalam", "978-0143031635", "Biography", 6, 5, "A-12");
        b1.setTenantId(tenantId);
        Book b2 = new Book("Concepts of Physics Vol.1", "H.C. Verma", "978-8177091878", "Textbook", 10, 9, "B-04");
        b2.setTenantId(tenantId);
        bookRepository.saveAll(List.of(b1, b2));
        BookIssue bi = new BookIssue();
        bi.setTenantId(tenantId);
        bi.setBookId(b1.getId());
        bi.setBookTitle(b1.getTitle());
        bi.setStudentId(studs.get(0).getId());
        bi.setStudentName(studs.get(0).getFirstName() + " " + studs.get(0).getLastName());
        bi.setIssueDate(LocalDate.now().minusDays(5));
        bi.setDueDate(LocalDate.now().plusDays(9));
        bi.setFine(BigDecimal.ZERO);
        bi.setStatus(Enums.BookIssueStatus.ISSUED);
        bookIssueRepository.save(bi);

        SalaryStructure ss = SalaryStructure.builder().teacherId(t1.getId()).teacherName("Debjyoti Sen")
                .basicSalary(new BigDecimal("52000")).netSalary(new BigDecimal("46800")).build();
        ss.setTenantId(tenantId);
        salaryStructureRepository.save(ss);
        salaryComponentRepository.save(tap(SalaryComponent.builder().salaryStructureId(ss.getId()).name("HRA")
                .amount(new BigDecimal("8000")).type(Enums.SalaryComponentType.ALLOWANCE).build(), c -> c.setTenantId(tenantId)));
        salaryComponentRepository.save(tap(SalaryComponent.builder().salaryStructureId(ss.getId()).name("PF")
                .amount(new BigDecimal("5200")).type(Enums.SalaryComponentType.DEDUCTION).build(), c -> c.setTenantId(tenantId)));
        payslipRepository.save(tap(Payslip.builder().teacherId(t1.getId()).teacherName("Debjyoti Sen").month("March").year(2025)
                .basicSalary(new BigDecimal("52000")).totalAllowances(new BigDecimal("8000")).totalDeductions(new BigDecimal("13200"))
                .netSalary(new BigDecimal("46800")).status(Enums.PayslipStatus.PAID).paymentDate(LocalDate.of(2025, 3, 28))
                .build(), p -> p.setTenantId(tenantId)));

        documentRepository.save(tap(Document.builder().name("Academic Calendar 2025-26.pdf").fileType("pdf")
                        .category(Enums.DocumentCategory.ADMIN).uploadedBy("Dr. Ananya Dutta").fileSize("420 KB")
                        .fileUrl("/demo/calendar-2025-26.pdf").relatedEntityId(ay.getId()).relatedEntityType("ACADEMIC_YEAR").build(),
                d -> d.setTenantId(tenantId)));
        documentRepository.save(tap(Document.builder().name("Transport route consent — Garia.pdf").fileType("pdf")
                        .category(Enums.DocumentCategory.GENERAL).uploadedBy("Office").fileSize("88 KB")
                        .fileUrl("/demo/transport-consent.pdf").relatedEntityId(route.getId()).relatedEntityType("TRANSPORT_ROUTE").build(),
                d -> d.setTenantId(tenantId)));

        auditLogRepository.save(tap(AuditLog.builder().action(Enums.AuditAction.LOGIN).module("AUTH")
                .description("Principal logged in from trusted workstation").userId(admin.getId()).userName(admin.getName())
                .ipAddress("192.168.1.44").build(), a -> a.setTenantId(tenantId)));

        LeaveRequest lr = new LeaveRequest();
        lr.setTenantId(tenantId);
        lr.setApplicantUserId(tUser2.getId());
        lr.setApplicantRole("TEACHER");
        lr.setLeaveType("SICK");
        lr.setStartDate(LocalDate.now().plusDays(3));
        lr.setEndDate(LocalDate.now().plusDays(3));
        lr.setDayUnit(Enums.LeaveDayUnit.FULL_DAY);
        lr.setReason("Medical appointment — will share prescription with HR.");
        lr.setStatus(Enums.LeaveStatus.PENDING);
        leaveRequestRepository.save(lr);

        ChatConversation conv = new ChatConversation();
        conv.setTenantId(tenantId);
        conv.setType("direct");
        conv.setSubject("IX-A — PT meeting follow-up");
        conv.setLastMessageAt(LocalDateTime.now().minusHours(2));
        conv.setLastMessagePreview("Thank you for the update on Riya's progress.");
        chatConversationRepository.save(conv);
        flush();
        ChatParticipant part1 = new ChatParticipant();
        part1.setTenantId(tenantId);
        part1.setConversationId(conv.getId());
        part1.setUserId(admin.getId());
        part1.setUserRole("ADMIN");
        part1.setDisplayName("Dr. Ananya Dutta");
        ChatParticipant part2 = new ChatParticipant();
        part2.setTenantId(tenantId);
        part2.setConversationId(conv.getId());
        part2.setUserId(pUser1.getId());
        part2.setUserRole("PARENT");
        part2.setDisplayName("Sujata Banerjee");
        chatParticipantRepository.saveAll(List.of(part1, part2));
        ChatMessage cm1 = new ChatMessage();
        cm1.setTenantId(tenantId);
        cm1.setConversationId(conv.getId());
        cm1.setSenderUserId(admin.getId());
        cm1.setSenderRole("ADMIN");
        cm1.setSenderName("Dr. Ananya Dutta");
        cm1.setBody("Riya is doing well in Mathematics; we suggest extra practice on geometry proofs.");
        cm1.setBodyType("text");
        ChatMessage cm2 = new ChatMessage();
        cm2.setTenantId(tenantId);
        cm2.setConversationId(conv.getId());
        cm2.setSenderUserId(pUser1.getId());
        cm2.setSenderRole("PARENT");
        cm2.setSenderName("Sujata Banerjee");
        cm2.setBody("Thank you for the update on Riya's progress.");
        cm2.setBodyType("text");
        chatMessageRepository.saveAll(List.of(cm1, cm2));

        log.info("Seeded demo workspace St. Xavier's (tenant_id={}, school_code={}, login principal@stxheritage.edu / admin123)",
                tenantId, schoolCode);
    }

    private void seedMeridianRidge() {
        final String tenantId = "tenant_meridian_ridge_pn_3q8w5r1x";
        final String schoolCode = "MRIDGE-PN";
        TenantConfig cfg = tenant("Meridian Ridge International School", schoolCode,
                "Baner Road, Pune 411045, Maharashtra", "+91-20-6688-1200", "admissions@meridianridge.edu");
        cfg.setTenantId(tenantId);
        cfg.setFeaturesJson(FEATURES_JSON);
        cfg.setLibraryFinePerDay(new BigDecimal("15.00"));
        tenantConfigRepository.save(cfg);

        User admin = user(tenantId, schoolCode, "Col. Vikram Rathore", "principal@meridianridge.edu", Enums.Role.ADMIN);
        User tu1 = user(tenantId, schoolCode, "Sneha Patil", "s.patil@meridianridge.edu", Enums.Role.TEACHER);
        User tu2 = user(tenantId, schoolCode, "Daniel Fernandes", "d.fernandes@meridianridge.edu", Enums.Role.TEACHER);
        User pu1 = user(tenantId, schoolCode, "Kavita Deshmukh", "k.deshmukh.parent@meridianridge.edu", Enums.Role.PARENT);
        userRepository.saveAll(List.of(admin, tu1, tu2, pu1));
        flush();

        AcademicYear ay = AcademicYear.builder()
                .name("2025-2026")
                .startDate(LocalDate.of(2025, 4, 1))
                .endDate(LocalDate.of(2026, 3, 31))
                .isCurrent(true)
                .build();
        ay.setTenantId(tenantId);
        academicYearRepository.save(ay);
        flush();

        Teacher tr1 = teacher(tenantId, "Sneha", "Patil", "s.patil@meridianridge.edu", tu1.getId(), List.of("Mathematics"));
        Teacher tr2 = teacher(tenantId, "Daniel", "Fernandes", "d.fernandes@meridianridge.edu", tu2.getId(), List.of("Computer Science"));
        teacherRepository.saveAll(List.of(tr1, tr2));
        flush();

        SchoolClass c8 = clazz(tenantId, "Class VIII", 8, ay.getId(), tr1.getId(), "Sneha Patil");
        schoolClassRepository.save(c8);
        flush();
        Section s8a = section(tenantId, "A", c8.getId(), 36, 3);
        Section s8b = section(tenantId, "B", c8.getId(), 36, 2);
        sectionRepository.saveAll(List.of(s8a, s8b));
        flush();

        List<Student> studs = new ArrayList<>();
        studs.add(student(tenantId, "Advik", "Deshmukh", "MR-2025-101", c8.getId(), s8a.getId(), pu1.getId(), "Kavita Deshmukh",
                "advik.d@meridianridge.edu", Enums.Gender.MALE));
        studs.add(student(tenantId, "Myra", "Deshmukh", "MR-2025-102", c8.getId(), s8a.getId(), pu1.getId(), "Kavita Deshmukh",
                "myra.d@meridianridge.edu", Enums.Gender.FEMALE));
        studs.add(student(tenantId, "Kabir", "Shah", "MR-2025-115", c8.getId(), s8b.getId(), null, "—",
                "kabir.s@meridianridge.edu", Enums.Gender.MALE));
        studentRepository.saveAll(studs);
        flush();

        classTeacherRow(tenantId, ay.getId(), c8.getId(), s8a.getId(), tr1.getId());
        subjectRow(tenantId, ay.getId(), c8.getId(), s8a.getId(), "Mathematics", tr1.getId());
        subjectRow(tenantId, ay.getId(), c8.getId(), s8b.getId(), "Computer Science", tr2.getId());

        attendanceRepository.save(att(tenantId, studs.get(0), LocalDate.now().minusDays(1), Enums.AttendanceStatus.PRESENT, tr1.getId()));
        attendanceRepository.save(att(tenantId, studs.get(1), LocalDate.now().minusDays(1), Enums.AttendanceStatus.EXCUSED, tr1.getId()));

        timetableRepository.save(tt(tenantId, ay.getId(), c8.getId(), s8a.getId(), Enums.DayOfWeek.WEDNESDAY, 1,
                LocalTime.of(9, 0), LocalTime.of(9, 45), "Mathematics", tr1.getId(), "Sneha Patil", "Room 105"));

        Exam ex = Exam.builder().name("Unit Test 1 — Term I").academicYearId(ay.getId())
                .startDate(LocalDate.now().plusWeeks(1)).endDate(LocalDate.now().plusWeeks(1))
                .classIds(List.of(c8.getId())).status(Enums.ExamStatus.ONGOING).build();
        ex.setTenantId(tenantId);
        examRepository.save(ex);
        flush();
        ExamScope(tenantId, ex.getId(), c8.getId(), null);
        examSlot(tenantId, ex.getId(), c8.getId(), s8a.getId(), "Mathematics", LocalDate.now().plusWeeks(1), LocalTime.of(10, 0), LocalTime.of(11, 30), "Room 105");
        markRecord(tenantId, ex.getId(), studs.get(0), "Mathematics", 68, 80, "B", c8.getId());

        FeeStructure fs = feeStructure(tenantId, "Composite Fee — VIII", c8.getId(), "Class VIII", ay.getId(), new BigDecimal("41200.00"));
        feeStructureRepository.save(fs);
        feeComponentRepository.save(comp(tenantId, fs.getId(), "Tuition", new BigDecimal("32000"), Enums.FeeComponentType.TUITION));
        feeComponentRepository.save(comp(tenantId, fs.getId(), "Technology", new BigDecimal("9200"), Enums.FeeComponentType.MISC));
        flush();
        feePaymentRepository.save(payment(tenantId, studs.get(0), fs.getId(), new BigDecimal("41200"), new BigDecimal("20000"),
                new BigDecimal("21200"), Enums.FeeStatus.PARTIAL, "MR-REC-4401"));

        Announcement a1 = new Announcement();
        a1.setTenantId(tenantId);
        a1.setTitle("Pune monsoon — safety advisory");
        a1.setContent("Students using school transport should carry rain gear this week.");
        a1.setAuthor("Col. Vikram Rathore");
        a1.setAuthorRole("ADMIN");
        a1.setTargetAudience(Enums.TargetAudience.ALL);
        announcementRepository.save(a1);

        notificationRepository.save(notif(tenantId, admin.getId(), "Fee reminder", "Term I balance due for some VIII-A students.", Enums.NotificationType.WARNING));

        TransportVehicle v = vehicle(tenantId, "MH-12-AB-7711", Enums.VehicleType.VAN, 14, "Force Traveller");
        transportVehicleRepository.save(v);
        TransportDriver d = driver(tenantId, "Suresh Jadhav", "+91-98220-55190", "MH-DRV-22109");
        transportDriverRepository.save(d);
        TransportRoute rt = TransportRoute.builder().name("Hinjewadi Phase 2 — School")
                .vehicleNumber("MH-12-AB-7711").driverName("Suresh Jadhav").driverPhone("+91-98220-55190")
                .assignedStudents(1).vehicleId(v.getId()).driverId(d.getId()).build();
        rt.setTenantId(tenantId);
        transportRouteRepository.save(rt);
        flush();
        RouteStop st = RouteStop.builder().name("Infosys Circle").stopTime(LocalTime.of(7, 45)).stopOrder(1).build();
        st.setTenantId(tenantId);
        st.setRouteId(rt.getId());
        routeStopRepository.save(st);
        studentTransportMappingRepository.save(tap(StudentTransportMapping.builder().routeId(rt.getId())
                        .studentId(studs.get(2).getId()).studentName("Kabir Shah").pickupStop("Infosys Circle").dropStop("School").build(),
                m -> m.setTenantId(tenantId)));

        Hostel hx = new Hostel();
        hx.setTenantId(tenantId);
        hx.setName("Meridian Scholars Hostel");
        hx.setCode("MR-H1");
        hx.setGenderScope("MIXED");
        hostelRepository.save(hx);
        HostelRoom rx = HostelRoom.builder().roomNumber("H-112").block("H").floor(1).capacity(3).occupancy(0)
                .roomType(Enums.HostelRoomType.TRIPLE.name()).build();
        rx.setTenantId(tenantId);
        rx.setHostelId(hx.getId());
        hostelRoomRepository.save(rx);

        Book bk = new Book("Python for Young Learners", "Natasha Singh", "978-9355512345", "Computing", 5, 5, "C-07");
        bk.setTenantId(tenantId);
        bookRepository.save(bk);

        SalaryStructure sx = SalaryStructure.builder().teacherId(tr1.getId()).teacherName("Sneha Patil")
                .basicSalary(new BigDecimal("48000")).netSalary(new BigDecimal("43200")).build();
        sx.setTenantId(tenantId);
        salaryStructureRepository.save(sx);
        salaryComponentRepository.save(tap(SalaryComponent.builder().salaryStructureId(sx.getId()).name("Transport allowance")
                .amount(new BigDecimal("3000")).type(Enums.SalaryComponentType.ALLOWANCE).build(), c -> c.setTenantId(tenantId)));

        documentRepository.save(tap(Document.builder().name("Meridian — Parent handbook.pdf").fileType("pdf")
                .category(Enums.DocumentCategory.GENERAL).uploadedBy("Admissions").fileSize("1.2 MB")
                .fileUrl("/demo/meridian-handbook.pdf").build(), doc -> doc.setTenantId(tenantId)));

        auditLogRepository.save(tap(AuditLog.builder().action(Enums.AuditAction.CREATE).module("STUDENT")
                .description("Bulk import: 3 new admissions for Class VIII").userId(admin.getId()).userName(admin.getName())
                .build(), a -> a.setTenantId(tenantId)));

        log.info("Seeded demo workspace Meridian Ridge (tenant_id={}, school_code={}, login principal@meridianridge.edu / admin123)",
                tenantId, schoolCode);
    }

    /**
     * Idempotent bulk rows for St. Xavier's only (school_code STXHER-KOL). Safe to run every dev startup.
     */
    private void expandStXaviersBulkSeed(String tenantId, String schoolCode) {
        List<AcademicYear> years = academicYearRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        Optional<AcademicYear> current = years.stream().filter(y -> Boolean.TRUE.equals(y.getIsCurrent())).findFirst();
        AcademicYear ay = current.orElse(years.isEmpty() ? null : years.get(0));
        if (ay == null) {
            return;
        }
        List<SchoolClass> classes = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId);
        if (classes.isEmpty()) {
            return;
        }
        List<long[]> classSectionPairs = new ArrayList<>();
        for (SchoolClass sc : classes) {
            for (Section sec : sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, sc.getId())) {
                classSectionPairs.add(new long[]{sc.getId(), sec.getId()});
            }
        }
        if (classSectionPairs.isEmpty()) {
            return;
        }
        Long parentA = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("s.banerjee.parent@stxheritage.edu", tenantId).map(User::getId).orElse(null);
        Long parentB = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("a.khanna.parent@stxheritage.edu", tenantId).map(User::getId).orElse(null);
        User admin = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("principal@stxheritage.edu", tenantId).orElse(null);
        List<Teacher> teachers = teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        Long markerTid = teachers.isEmpty() ? null : teachers.get(0).getId();

        String[] bf = {"Aditya", "Kavya", "Sohan", "Diya", "Rohan", "Ira", "Dev", "Mira", "Kabir", "Tara", "Rehan", "Anvi", "Vihaan", "Myra", "Neil", "Pari", "Yash", "Zara", "Krish", "Lavanya"};
        String[] bl = {"Sen", "Roy", "Basu", "Dutta", "Mukherjee", "Iyer", "Ghosh", "Nair", "Bose", "Chatterjee", "Malik", "Kapoor", "Ahuja", "Das", "Joshi", "Seth", "Varma", "Oberoi", "Desai", "Khan"};
        List<Student> bulkStudents = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            String adm = String.format("SX-BULK-%03d", i + 1);
            if (studentRepository.existsByTenantIdAndAdmissionNumber(tenantId, adm)) {
                continue;
            }
            long[] cs = classSectionPairs.get(i % classSectionPairs.size());
            Long pid;
            String pnm;
            switch (i % 3) {
                case 0 -> {
                    pid = parentA;
                    pnm = "Sujata Banerjee";
                }
                case 1 -> {
                    pid = parentB;
                    pnm = "Arvind Khanna";
                }
                default -> {
                    pid = null;
                    pnm = "—";
                }
            }
            Student s = student(tenantId, bf[i], bl[i], adm, cs[0], cs[1], pid, pnm,
                    "sx.bulk" + (i + 1) + "@stxheritage.stu", i % 2 == 0 ? Enums.Gender.MALE : Enums.Gender.FEMALE);
            YearMonth admYm = YearMonth.now().minusMonths(i % 6);
            s.setAdmissionDate(admYm.atDay(Math.min(28, 5 + (i % 23))));
            studentRepository.save(s);
            bulkStudents.add(s);
        }
        flush();

        if (!userRepository.existsByEmailAndTenantIdAndIsDeletedFalse("t.mehra@stxheritage.edu", tenantId)) {
            User u1 = user(tenantId, schoolCode, "Tanya Mehra", "t.mehra@stxheritage.edu", Enums.Role.TEACHER);
            userRepository.save(u1);
            Teacher t1 = teacher(tenantId, "Tanya", "Mehra", "t.mehra@stxheritage.edu", u1.getId(), List.of("Geography", "Economics"));
            teacherRepository.save(t1);
            SchoolClass c0 = classes.get(0);
            List<Section> secs0 = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c0.getId());
            if (!secs0.isEmpty()) {
                subjectRow(tenantId, ay.getId(), c0.getId(), secs0.get(0).getId(), "Geography", t1.getId());
            }
        }
        if (!userRepository.existsByEmailAndTenantIdAndIsDeletedFalse("r.ghosh@stxheritage.edu", tenantId)) {
            User u2 = user(tenantId, schoolCode, "Rupak Ghosh", "r.ghosh@stxheritage.edu", Enums.Role.TEACHER);
            userRepository.save(u2);
            Teacher t2 = teacher(tenantId, "Rupak", "Ghosh", "r.ghosh@stxheritage.edu", u2.getId(), List.of("Civics", "EVS"));
            teacherRepository.save(t2);
            if (classes.size() > 1) {
                SchoolClass c1 = classes.get(1);
                List<Section> secs1 = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c1.getId());
                if (!secs1.isEmpty()) {
                    subjectRow(tenantId, ay.getId(), c1.getId(), secs1.get(secs1.size() - 1).getId(), "Civics", t2.getId());
                }
            }
        }
        flush();
        teachers = teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        markerTid = teachers.isEmpty() ? null : teachers.get(0).getId();
        Enums.AttendanceStatus[] rot = {Enums.AttendanceStatus.PRESENT, Enums.AttendanceStatus.PRESENT, Enums.AttendanceStatus.LATE,
                Enums.AttendanceStatus.ABSENT, Enums.AttendanceStatus.PRESENT};
        if (markerTid != null) {
            for (Student s : studentRepository.findByTenantIdAndIsDeletedFalse(tenantId)) {
                for (int d = 1; d <= 8; d++) {
                    LocalDate day = LocalDate.now().minusDays(d);
                    if (!attendanceRepository.existsByTenantIdAndStudentIdAndDateAndIsDeletedFalse(tenantId, s.getId(), day)) {
                        attendanceRepository.save(att(tenantId, s, day, rot[d % rot.length], markerTid));
                    }
                }
            }
        }

        String[][] bookRows = {
                {"The Story of My Experiments with Truth", "M.K. Gandhi", "978-STXB-2001", "Memoir", "A-01"},
                {"Wings of Fire", "A.P.J. Abdul Kalam", "978-STXB-2002", "Biography", "A-02"},
                {"Brief History of Time", "Stephen Hawking", "978-STXB-2003", "Science", "A-03"},
                {"Pride and Prejudice", "Jane Austen", "978-STXB-2004", "Fiction", "A-04"},
                {"India After Gandhi", "Ramachandra Guha", "978-STXB-2005", "History", "A-05"},
                {"NCERT Mathematics X", "NCERT", "978-STXB-2006", "Textbook", "B-01"},
                {"NCERT Science IX", "NCERT", "978-STXB-2007", "Textbook", "B-02"},
                {"Computer Science with Python", "Sumita Arora", "978-STXB-2008", "Computing", "B-03"},
                {"Wren & Martin High School", "P.C. Wren", "978-STXB-2009", "Grammar", "B-04"},
                {"Atlas of India", "Oxford", "978-STXB-2010", "Reference", "C-01"},
                {"Periodic Table Poster Book", "DK", "978-STXB-2011", "Science", "C-02"},
                {"Bengali Sahityer Itihas", "Various", "978-STXB-2012", "Regional", "C-03"}
        };
        for (String[] br : bookRows) {
            if (bookRepository.existsByTenantIdAndIsbnAndIsDeletedFalse(tenantId, br[2])) {
                continue;
            }
            Book b = new Book(br[0], br[1], br[2], br[3], 12, 10, br[4]);
            b.setTenantId(tenantId);
            bookRepository.save(b);
        }
        flush();

        boolean hasBulkExam = examRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .anyMatch(e -> "Demo bulk — Periodic Test 1".equals(e.getName()));
        if (!hasBulkExam && !classes.isEmpty()) {
            SchoolClass c0 = classes.get(0);
            List<Section> sx = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c0.getId());
            Exam ex = Exam.builder().name("Demo bulk — Periodic Test 1").academicYearId(ay.getId())
                    .startDate(LocalDate.now().minusWeeks(1)).endDate(LocalDate.now().minusDays(1))
                    .classIds(List.of(c0.getId()))
                    .status(Enums.ExamStatus.COMPLETED).build();
            ex.setTenantId(tenantId);
            ex.setResultsPublished(true);
            examRepository.save(ex);
            flush();
            ExamScope(tenantId, ex.getId(), c0.getId(), sx.isEmpty() ? null : sx.get(0).getId());
            examSlot(tenantId, ex.getId(), c0.getId(), sx.isEmpty() ? null : sx.get(0).getId(), "Mathematics",
                    LocalDate.now().minusDays(5), LocalTime.of(9, 0), LocalTime.of(11, 0), "Hall B");
            List<Student> markPool = studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c0.getId());
            int lim = Math.min(12, markPool.size());
            for (int i = 0; i < lim; i++) {
                Student st = markPool.get(i);
                markRecord(tenantId, ex.getId(), st, "Mathematics", 55 + (i * 3) % 40, 100,
                        i % 4 == 0 ? "A" : "B", c0.getId());
            }
        }

        String[] annTitles = {"[Bulk demo] Sports day — heats schedule", "[Bulk demo] Lab safety refresher", "[Bulk demo] PTA snack roster",
                "[Bulk demo] Winter uniform window", "[Bulk demo] Debate club auditions"};
        long annCount = announcementRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream()
                .filter(a -> a.getTitle() != null && a.getTitle().startsWith("[Bulk demo]")).count();
        if (annCount < annTitles.length && admin != null) {
            for (String title : annTitles) {
                if (announcementRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream()
                        .anyMatch(a -> title.equals(a.getTitle()))) {
                    continue;
                }
                Announcement a = new Announcement();
                a.setTenantId(tenantId);
                a.setTitle(title);
                a.setContent("Automated demo copy for UI lists and filters. No action required.");
                a.setAuthor(admin.getName());
                a.setAuthorRole("ADMIN");
                a.setTargetAudience(Enums.TargetAudience.ALL);
                announcementRepository.save(a);
            }
        }

        if (admin != null) {
            String[] nTitles = {"Bulk demo: fee window extended", "Bulk demo: transport delay drill", "Bulk demo: library fine amnesty hour"};
            List<Notification> existingN = notificationRepository.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, admin.getId());
            for (String nt : nTitles) {
                boolean exists = existingN.stream().anyMatch(n -> nt.equals(n.getTitle()));
                if (!exists) {
                    notificationRepository.save(notif(tenantId, admin.getId(), nt, "Seeded notification for dashboard density.", Enums.NotificationType.INFO));
                }
            }
        }

        SchoolClass c9 = classes.stream().filter(c -> c.getGrade() == 9).findFirst().orElse(classes.get(0));
        List<Section> c9secs = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c9.getId());
        if (!c9secs.isEmpty() && markerTid != null) {
            Long c9sec0 = c9secs.get(0).getId();
            List<TimetableEntry> tt9 = timetableRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, c9.getId(), c9sec0);
            if (tt9.size() < 12) {
                Teacher tMath = teachers.stream().filter(t -> t.getEmail() != null && t.getEmail().contains("sen")).findFirst().orElse(teachers.get(0));
                String tn = tMath.getFirstName() + " " + tMath.getLastName();
                timetableRepository.save(tt(tenantId, ay.getId(), c9.getId(), c9sec0, Enums.DayOfWeek.WEDNESDAY, 3,
                        LocalTime.of(10, 10), LocalTime.of(10, 55), "Physics", tMath.getId(), tn, "Lab 2"));
                timetableRepository.save(tt(tenantId, ay.getId(), c9.getId(), c9sec0, Enums.DayOfWeek.THURSDAY, 1,
                        LocalTime.of(8, 30), LocalTime.of(9, 15), "Geography", tMath.getId(), tn, "Room 105"));
                timetableRepository.save(tt(tenantId, ay.getId(), c9.getId(), c9sec0, Enums.DayOfWeek.FRIDAY, 2,
                        LocalTime.of(9, 20), LocalTime.of(10, 5), "English", tMath.getId(), tn, "Room 201"));
            }
        }

        boolean hasBulkVehicle = transportVehicleRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .anyMatch(v -> "WB-BULK-STX-01".equals(v.getRegistrationNumber()));
        if (!hasBulkVehicle) {
            TransportVehicle v2 = vehicle(tenantId, "WB-BULK-STX-01", Enums.VehicleType.VAN, 24, "Ashok Leyland MiTR");
            transportVehicleRepository.save(v2);
            TransportDriver d2 = driver(tenantId, "Pranab Halder", "+91-98333-22100", "WB-BULK-DRV-01");
            transportDriverRepository.save(d2);
            TransportRoute r2 = TransportRoute.builder().name("Salt Lake — VIP Road loop")
                    .vehicleNumber("WB-BULK-STX-01").driverName("Pranab Halder").driverPhone("+91-98333-22100")
                    .assignedStudents(4).vehicleId(v2.getId()).driverId(d2.getId()).build();
            r2.setTenantId(tenantId);
            transportRouteRepository.save(r2);
            flush();
            RouteStop s1 = RouteStop.builder().name("City Centre 1").stopTime(LocalTime.of(7, 20)).stopOrder(1).build();
            s1.setTenantId(tenantId);
            s1.setRouteId(r2.getId());
            RouteStop s2 = RouteStop.builder().name("Ultadanga").stopTime(LocalTime.of(7, 40)).stopOrder(2).build();
            s2.setTenantId(tenantId);
            s2.setRouteId(r2.getId());
            routeStopRepository.saveAll(List.of(s1, s2));
            List<Student> pool = studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c9.getId());
            for (int i = 0; i < Math.min(4, pool.size()); i++) {
                Student st = pool.get(i);
                studentTransportMappingRepository.save(tap(StudentTransportMapping.builder().routeId(r2.getId())
                        .studentId(st.getId()).studentName(st.getFirstName() + " " + st.getLastName())
                        .pickupStop("City Centre 1").dropStop("School").build(), m -> m.setTenantId(tenantId)));
            }
        }

        List<Hostel> hostels = hostelRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        if (!hostels.isEmpty()) {
            boolean hasB205 = hostelRoomRepository.findByTenantIdAndHostelIdAndIsDeletedFalse(tenantId, hostels.get(0).getId()).stream()
                    .anyMatch(r -> "B-205".equals(r.getRoomNumber()));
            if (!hasB205) {
                HostelRoom r205 = HostelRoom.builder().roomNumber("B-205").block("B").floor(2).capacity(4).occupancy(0)
                        .roomType(Enums.HostelRoomType.DOUBLE.name()).build();
                r205.setTenantId(tenantId);
                r205.setHostelId(hostels.get(0).getId());
                hostelRoomRepository.save(r205);
            }
        }

        boolean hasBulkFee = feeStructureRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .anyMatch(f -> "Bulk demo — Activity fee".equals(f.getName()));
        if (!hasBulkFee && !classes.isEmpty()) {
            FeeStructure fs = feeStructure(tenantId, "Bulk demo — Activity fee", classes.get(0).getId(), classes.get(0).getName(), ay.getId(), new BigDecimal("6200.00"));
            feeStructureRepository.save(fs);
            feeComponentRepository.save(comp(tenantId, fs.getId(), "Clubs", new BigDecimal("3200"), Enums.FeeComponentType.MISC));
            feeComponentRepository.save(comp(tenantId, fs.getId(), "Events", new BigDecimal("3000"), Enums.FeeComponentType.MISC));
            flush();
            List<Student> payers = studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classes.get(0).getId());
            for (int i = 0; i < Math.min(6, payers.size()); i++) {
                String rec = "SX-BULK-FEE-" + (100 + i);
                if (feePaymentRepository.findByReceiptNumberAndTenantIdAndIsDeletedFalse(rec, tenantId).isEmpty()) {
                    feePaymentRepository.save(payment(tenantId, payers.get(i), fs.getId(), new BigDecimal("6200"),
                            new BigDecimal(i % 2 == 0 ? 6200 : 3100), new BigDecimal(i % 2 == 0 ? 0 : 3100),
                            i % 2 == 0 ? Enums.FeeStatus.PAID : Enums.FeeStatus.PARTIAL, rec));
                }
            }
        }

        feeStructureRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(f -> "Bulk demo — Activity fee".equals(f.getName()))
                .findFirst()
                .ifPresent(dashFs -> {
                    List<Student> pool = studentRepository.findByTenantIdAndIsDeletedFalse(tenantId);
                    if (!pool.isEmpty()) {
                        for (int mi = 0; mi < 6; mi++) {
                            YearMonth ym = YearMonth.now().minusMonths(5 - mi);
                            String rec = "SX-DASH-CHART-" + ym;
                            if (feePaymentRepository.findByReceiptNumberAndTenantIdAndIsDeletedFalse(rec, tenantId).isEmpty()) {
                                Student st = pool.get(mi % pool.size());
                                BigDecimal amt = new BigDecimal(4800 + mi * 820);
                                feePaymentRepository.save(payment(tenantId, st, dashFs.getId(), amt, amt, BigDecimal.ZERO,
                                        Enums.FeeStatus.PAID, rec, ym.atDay(14)));
                            }
                        }
                    }
                });

        if (bookIssueRepository.countByTenantIdAndIsDeletedFalse(tenantId) <= 1) {
            List<Book> shelf = bookRepository.findByTenantIdAndIsDeletedFalse(tenantId);
            List<Student> issuePool = studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classes.get(0).getId());
            int issues = 0;
            for (Book bk : shelf) {
                if (issues >= 8) {
                    break;
                }
                if (bk.getAvailableCopies() != null && bk.getAvailableCopies() > 0 && !issuePool.isEmpty()) {
                    Student st = issuePool.get(issues % issuePool.size());
                    BookIssue bi = new BookIssue();
                    bi.setTenantId(tenantId);
                    bi.setBookId(bk.getId());
                    bi.setBookTitle(bk.getTitle());
                    bi.setStudentId(st.getId());
                    bi.setStudentName(st.getFirstName() + " " + st.getLastName());
                    bi.setIssueDate(LocalDate.now().minusDays(2 + issues));
                    bi.setDueDate(LocalDate.now().plusDays(7 + issues));
                    bi.setFine(BigDecimal.ZERO);
                    bi.setStatus(issues % 3 == 0 ? Enums.BookIssueStatus.ISSUED : Enums.BookIssueStatus.RETURNED);
                    bookIssueRepository.save(bi);
                    issues++;
                }
            }
        }

        long bulkLeave = leaveRequestRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream()
                .filter(lr -> lr.getReason() != null && lr.getReason().startsWith("Bulk demo leave")).count();
        if (bulkLeave < 5) {
            List<User> tusers = userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.TEACHER);
            for (int i = 0; i < Math.min(5, tusers.size()); i++) {
                LeaveRequest lr = new LeaveRequest();
                lr.setTenantId(tenantId);
                lr.setApplicantUserId(tusers.get(i).getId());
                lr.setApplicantRole("TEACHER");
                lr.setLeaveType(i % 2 == 0 ? "CASUAL" : "SICK");
                lr.setStartDate(LocalDate.now().plusDays(5 + i));
                lr.setEndDate(LocalDate.now().plusDays(5 + i));
                lr.setDayUnit(Enums.LeaveDayUnit.FULL_DAY);
                lr.setReason("Bulk demo leave row " + i);
                lr.setStatus(i % 3 == 0 ? Enums.LeaveStatus.APPROVED : Enums.LeaveStatus.PENDING);
                leaveRequestRepository.save(lr);
            }
        }

        List<User> teacherUsers = userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.TEACHER);
        if (admin != null && !teacherUsers.isEmpty()) {
            boolean hasBulkMsg = messageRepository.findUserMessages(tenantId, admin.getId()).stream()
                    .anyMatch(m -> m.getContent() != null && m.getContent().contains("lab inventory"));
            if (!hasBulkMsg) {
                messageRepository.save(tap(Message.builder().senderId(admin.getId()).senderName(admin.getName()).senderRole("ADMIN")
                        .receiverId(teacherUsers.get(0).getId()).receiverName("Staff").content("[Bulk demo] Please confirm lab inventory before Friday.")
                        .isRead(false).build(), m -> m.setTenantId(tenantId)));
            }
        }

        LocalDate todayDash = LocalDate.now();
        Enums.AttendanceStatus[] todayMix = {
                Enums.AttendanceStatus.PRESENT, Enums.AttendanceStatus.PRESENT, Enums.AttendanceStatus.PRESENT, Enums.AttendanceStatus.PRESENT,
                Enums.AttendanceStatus.LATE, Enums.AttendanceStatus.LATE,
                Enums.AttendanceStatus.ABSENT, Enums.AttendanceStatus.EXCUSED
        };
        if (markerTid != null) {
            int ti = 0;
            for (Student s : studentRepository.findByTenantIdAndIsDeletedFalse(tenantId)) {
                if (!attendanceRepository.existsByTenantIdAndStudentIdAndDateAndIsDeletedFalse(tenantId, s.getId(), todayDash)) {
                    attendanceRepository.save(att(tenantId, s, todayDash, todayMix[ti % todayMix.length], markerTid));
                }
                ti++;
            }
            List<AttendanceRecord> todayRows = attendanceRepository.findByTenantIdAndDateAndIsDeletedFalseOrderByStudentIdAsc(tenantId, todayDash);
            for (int j = 0; j < todayRows.size(); j++) {
                AttendanceRecord row = todayRows.get(j);
                row.setStatus(todayMix[j % todayMix.length]);
                attendanceRepository.save(row);
            }
        }

        Optional<User> tSenOpt = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("d.sen@stxheritage.edu", tenantId);
        Optional<User> parSx = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("s.banerjee.parent@stxheritage.edu", tenantId);
        if (tSenOpt.isPresent() && parSx.isPresent()) {
            User tSen = tSenOpt.get();
            User pBan = parSx.get();
            boolean hasTeacherInboxDemo = chatConversationRepository.findInbox(tenantId, tSen.getId()).stream()
                    .anyMatch(c -> c.getSubject() != null && c.getSubject().contains("Teacher inbox demo"));
            if (!hasTeacherInboxDemo) {
                ChatConversation cc = new ChatConversation();
                cc.setTenantId(tenantId);
                cc.setType("direct");
                cc.setSubject("Riya Banerjee — Teacher inbox demo");
                cc.setLastMessageAt(LocalDateTime.now().minusHours(1));
                cc.setLastMessagePreview("Could you share the worksheet for Chapter 4?");
                chatConversationRepository.save(cc);
                flush();
                ChatParticipant pTeach = new ChatParticipant();
                pTeach.setTenantId(tenantId);
                pTeach.setConversationId(cc.getId());
                pTeach.setUserId(tSen.getId());
                pTeach.setUserRole("TEACHER");
                pTeach.setDisplayName("Debjyoti Sen");
                ChatParticipant pPar = new ChatParticipant();
                pPar.setTenantId(tenantId);
                pPar.setConversationId(cc.getId());
                pPar.setUserId(pBan.getId());
                pPar.setUserRole("PARENT");
                pPar.setDisplayName("Sujata Banerjee");
                chatParticipantRepository.saveAll(List.of(pTeach, pPar));
            }
            long unreadTeach = notificationRepository.countByTenantIdAndUserIdAndIsReadFalse(tenantId, tSen.getId());
            for (long n = unreadTeach; n < 4; n++) {
                notificationRepository.save(notif(tenantId, tSen.getId(), "Class IX-A: dashboard demo notice " + (n + 1),
                        "Please review attendance or marks when convenient.", Enums.NotificationType.WARNING));
            }
        }

        log.info("Bulk demo extension applied for St. Xavier's (tenant_id={})", tenantId);
    }

    /**
     * Idempotent bulk rows for Meridian Ridge only (school_code MRIDGE-PN).
     */
    private void expandMeridianBulkSeed(String tenantId, String schoolCode) {
        List<AcademicYear> years = academicYearRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        AcademicYear ay = years.stream().filter(y -> Boolean.TRUE.equals(y.getIsCurrent())).findFirst().orElse(years.isEmpty() ? null : years.get(0));
        if (ay == null) {
            return;
        }
        List<SchoolClass> classes = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId);
        if (classes.isEmpty()) {
            return;
        }
        SchoolClass c8 = classes.get(0);
        List<Section> secs = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c8.getId());
        if (secs.isEmpty()) {
            return;
        }
        Long parent1 = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("k.deshmukh.parent@meridianridge.edu", tenantId).map(User::getId).orElse(null);
        User admin = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("principal@meridianridge.edu", tenantId).orElse(null);
        List<Teacher> teachers = teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        Long markerTid = teachers.isEmpty() ? null : teachers.get(0).getId();

        String[] mf = {"Aarav", "Sara", "Vihaan", "Kiara", "Reyansh", "Anika", "Shaurya", "Misha", "Arjun", "Navya", "Dhruv", "Ishita", "Om", "Riya", "Ved"};
        String[] ml = {"Kulkarni", "Patil", "Joshi", "Shah", "Desai", "Reddy", "Menon", "Pillai", "Rao", "Iyer", "Nayar", "Bose", "Singh", "Mehta", "Verma"};
        for (int i = 0; i < 15; i++) {
            String adm = String.format("MR-BULK-%03d", i + 1);
            if (studentRepository.existsByTenantIdAndAdmissionNumber(tenantId, adm)) {
                continue;
            }
            Section sec = secs.get(i % secs.size());
            Long pid = (i % 2 == 0) ? parent1 : null;
            String pnm = pid != null ? "Kavita Deshmukh" : "—";
            Student s = student(tenantId, mf[i], ml[i], adm, c8.getId(), sec.getId(), pid, pnm,
                    "mr.bulk" + (i + 1) + "@meridianridge.stu", i % 2 == 0 ? Enums.Gender.MALE : Enums.Gender.FEMALE);
            studentRepository.save(s);
        }
        flush();

        if (!userRepository.existsByEmailAndTenantIdAndIsDeletedFalse("a.mehta@meridianridge.edu", tenantId)) {
            User u = user(tenantId, schoolCode, "Anaya Mehta", "a.mehta@meridianridge.edu", Enums.Role.TEACHER);
            userRepository.save(u);
            Teacher t = teacher(tenantId, "Anaya", "Mehta", "a.mehta@meridianridge.edu", u.getId(), List.of("English", "Drama"));
            teacherRepository.save(t);
            subjectRow(tenantId, ay.getId(), c8.getId(), secs.get(0).getId(), "English", t.getId());
        }
        flush();
        teachers = teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        markerTid = teachers.isEmpty() ? null : teachers.get(0).getId();
        if (markerTid != null) {
            for (Student s : studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c8.getId())) {
                for (int d = 1; d <= 6; d++) {
                    LocalDate day = LocalDate.now().minusDays(d);
                    if (!attendanceRepository.existsByTenantIdAndStudentIdAndDateAndIsDeletedFalse(tenantId, s.getId(), day)) {
                        attendanceRepository.save(att(tenantId, s, day, Enums.AttendanceStatus.PRESENT, markerTid));
                    }
                }
            }
        }

        String[][] mbooks = {
                {"Matilda", "Roald Dahl", "978-MRB-3001", "Fiction", "D-01"},
                {"Charlotte's Web", "E.B. White", "978-MRB-3002", "Fiction", "D-02"},
                {"Number the Stars", "Lois Lowry", "978-MRB-3003", "Fiction", "D-03"},
                {"NCERT Honeydew VIII", "NCERT", "978-MRB-3004", "Textbook", "E-01"},
                {"India: Physical Env.", "NCERT", "978-MRB-3005", "Textbook", "E-02"},
                {"Coding Projects Python", "No Starch", "978-MRB-3006", "Computing", "E-03"},
                {"Art of Problem Solving", "AoPS", "978-MRB-3007", "Math", "E-04"},
                {"Pune Heritage Walks", "INTACH", "978-MRB-3008", "Guide", "F-01"}
        };
        for (String[] br : mbooks) {
            if (!bookRepository.existsByTenantIdAndIsbnAndIsDeletedFalse(tenantId, br[2])) {
                Book b = new Book(br[0], br[1], br[2], br[3], 8, 7, br[4]);
                b.setTenantId(tenantId);
                bookRepository.save(b);
            }
        }

        boolean hasBulkEx = examRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .anyMatch(e -> "Demo bulk — MR diagnostic".equals(e.getName()));
        if (!hasBulkEx) {
            Exam ex = Exam.builder().name("Demo bulk — MR diagnostic").academicYearId(ay.getId())
                    .startDate(LocalDate.now().minusDays(10)).endDate(LocalDate.now().minusDays(8))
                    .classIds(List.of(c8.getId())).status(Enums.ExamStatus.COMPLETED).build();
            ex.setTenantId(tenantId);
            ex.setResultsPublished(true);
            examRepository.save(ex);
            flush();
            ExamScope(tenantId, ex.getId(), c8.getId(), null);
            examSlot(tenantId, ex.getId(), c8.getId(), secs.get(0).getId(), "Mathematics", LocalDate.now().minusDays(9), LocalTime.of(10, 0), LocalTime.of(11, 30), "Room 105");
            List<Student> pool = studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c8.getId());
            for (int i = 0; i < Math.min(10, pool.size()); i++) {
                markRecord(tenantId, ex.getId(), pool.get(i), "Mathematics", 52 + i * 2, 80, i > 5 ? "B" : "A", c8.getId());
            }
        }

        String[] mtitles = {"[Bulk demo] Monsoon bus timings", "[Bulk demo] Science fair booths", "[Bulk demo] Inter-house quiz"};
        for (String title : mtitles) {
            if (announcementRepository.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream().noneMatch(a -> title.equals(a.getTitle())) && admin != null) {
                Announcement a = new Announcement();
                a.setTenantId(tenantId);
                a.setTitle(title);
                a.setContent("Meridian Ridge demo content for list views.");
                a.setAuthor(admin.getName());
                a.setAuthorRole("ADMIN");
                a.setTargetAudience(Enums.TargetAudience.ALL);
                announcementRepository.save(a);
            }
        }

        if (!transportVehicleRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream().anyMatch(v -> "MH-BULK-MR-02".equals(v.getRegistrationNumber()))) {
            TransportVehicle v = vehicle(tenantId, "MH-BULK-MR-02", Enums.VehicleType.BUS, 35, "Tata Marcopolo");
            transportVehicleRepository.save(v);
            TransportDriver d = driver(tenantId, "Ganesh Pawar", "+91-98220-77881", "MH-BULK-DRV-02");
            transportDriverRepository.save(d);
            TransportRoute rt = TransportRoute.builder().name("Kothrud — School express")
                    .vehicleNumber("MH-BULK-MR-02").driverName("Ganesh Pawar").driverPhone("+91-98220-77881")
                    .assignedStudents(3).vehicleId(v.getId()).driverId(d.getId()).build();
            rt.setTenantId(tenantId);
            transportRouteRepository.save(rt);
            flush();
            RouteStop st = RouteStop.builder().name("Karve Road").stopTime(LocalTime.of(7, 30)).stopOrder(1).build();
            st.setTenantId(tenantId);
            st.setRouteId(rt.getId());
            routeStopRepository.save(st);
        }

        boolean hasMrFee = feeStructureRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .anyMatch(f -> "Bulk demo — VIII enrichment".equals(f.getName()));
        if (!hasMrFee) {
            FeeStructure fs = feeStructure(tenantId, "Bulk demo — VIII enrichment", c8.getId(), c8.getName(), ay.getId(), new BigDecimal("8400.00"));
            feeStructureRepository.save(fs);
            feeComponentRepository.save(comp(tenantId, fs.getId(), "Workshops", new BigDecimal("5400"), Enums.FeeComponentType.MISC));
            feeComponentRepository.save(comp(tenantId, fs.getId(), "Materials", new BigDecimal("3000"), Enums.FeeComponentType.MISC));
            flush();
            List<Student> pool = studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c8.getId());
            for (int i = 0; i < Math.min(5, pool.size()); i++) {
                String rec = "MR-BULK-FEE-" + i;
                if (feePaymentRepository.findByReceiptNumberAndTenantIdAndIsDeletedFalse(rec, tenantId).isEmpty()) {
                    feePaymentRepository.save(payment(tenantId, pool.get(i), fs.getId(), new BigDecimal("8400"), new BigDecimal("4200"), new BigDecimal("4200"),
                            Enums.FeeStatus.PARTIAL, rec));
                }
            }
        }

        Section secLast = secs.get(secs.size() - 1);
        if (!teachers.isEmpty()) {
            List<TimetableEntry> ttMr = timetableRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, c8.getId(), secLast.getId());
            boolean hasThuP2 = ttMr.stream().anyMatch(e -> e.getDay() == Enums.DayOfWeek.THURSDAY && e.getPeriod() == 2);
            if (!hasThuP2) {
                Teacher tLast = teachers.get(teachers.size() - 1);
                String tnm = tLast.getFirstName() + " " + tLast.getLastName();
                timetableRepository.save(tt(tenantId, ay.getId(), c8.getId(), secLast.getId(), Enums.DayOfWeek.THURSDAY, 2,
                        LocalTime.of(10, 0), LocalTime.of(10, 45), "Computer Science", tLast.getId(), tnm, "Lab 2"));
            }
        }

        if (bookIssueRepository.countByTenantIdAndIsDeletedFalse(tenantId) == 0) {
            List<Book> shelf = bookRepository.findByTenantIdAndIsDeletedFalse(tenantId);
            List<Student> pool = studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c8.getId());
            int k = 0;
            for (Book bk : shelf) {
                if (k >= 5 || pool.isEmpty()) {
                    break;
                }
                BookIssue bi = new BookIssue();
                bi.setTenantId(tenantId);
                bi.setBookId(bk.getId());
                bi.setBookTitle(bk.getTitle());
                Student st = pool.get(k % pool.size());
                bi.setStudentId(st.getId());
                bi.setStudentName(st.getFirstName() + " " + st.getLastName());
                bi.setIssueDate(LocalDate.now().minusDays(1 + k));
                bi.setDueDate(LocalDate.now().plusDays(10));
                bi.setFine(BigDecimal.ZERO);
                bi.setStatus(Enums.BookIssueStatus.ISSUED);
                bookIssueRepository.save(bi);
                k++;
            }
        }

        LocalDate todayMr = LocalDate.now();
        if (markerTid != null) {
            for (Student s : studentRepository.findByTenantIdAndIsDeletedFalse(tenantId)) {
                if (!attendanceRepository.existsByTenantIdAndStudentIdAndDateAndIsDeletedFalse(tenantId, s.getId(), todayMr)) {
                    attendanceRepository.save(att(tenantId, s, todayMr, Enums.AttendanceStatus.PRESENT, markerTid));
                }
            }
        }

        Optional<User> tPatilOpt = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("s.patil@meridianridge.edu", tenantId);
        Optional<User> parMr = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("k.deshmukh.parent@meridianridge.edu", tenantId);
        if (tPatilOpt.isPresent() && parMr.isPresent()) {
            User tPat = tPatilOpt.get();
            User pKav = parMr.get();
            boolean hasMrInboxDemo = chatConversationRepository.findInbox(tenantId, tPat.getId()).stream()
                    .anyMatch(c -> c.getSubject() != null && c.getSubject().contains("Teacher inbox demo"));
            if (!hasMrInboxDemo) {
                ChatConversation cc = new ChatConversation();
                cc.setTenantId(tenantId);
                cc.setType("direct");
                cc.setSubject("Advik Deshmukh — Teacher inbox demo");
                cc.setLastMessageAt(LocalDateTime.now().minusMinutes(45));
                cc.setLastMessagePreview("Can we meet briefly about the math assessment?");
                chatConversationRepository.save(cc);
                flush();
                ChatParticipant pTeach = new ChatParticipant();
                pTeach.setTenantId(tenantId);
                pTeach.setConversationId(cc.getId());
                pTeach.setUserId(tPat.getId());
                pTeach.setUserRole("TEACHER");
                pTeach.setDisplayName("Sneha Patil");
                ChatParticipant pPar = new ChatParticipant();
                pPar.setTenantId(tenantId);
                pPar.setConversationId(cc.getId());
                pPar.setUserId(pKav.getId());
                pPar.setUserRole("PARENT");
                pPar.setDisplayName("Kavita Deshmukh");
                chatParticipantRepository.saveAll(List.of(pTeach, pPar));
            }
            long unreadPatil = notificationRepository.countByTenantIdAndUserIdAndIsReadFalse(tenantId, tPat.getId());
            for (long n = unreadPatil; n < 4; n++) {
                notificationRepository.save(notif(tenantId, tPat.getId(), "Meridian demo notice " + (n + 1),
                        "Please check timetable updates or leave approvals.", Enums.NotificationType.INFO));
            }
        }

        log.info("Bulk demo extension applied for Meridian Ridge (tenant_id={})", tenantId);
    }

    private void flush() {
        entityManager.flush();
    }

    private TenantConfig tenant(String schoolName, String schoolCode, String address, String phone, String email) {
        TenantConfig c = new TenantConfig();
        c.setSchoolName(schoolName);
        c.setSchoolCode(schoolCode);
        c.setAddress(address);
        c.setPhone(phone);
        c.setEmail(email);
        c.setPrimaryColor("#1B3A30");
        c.setSecondaryColor("#C05C3D");
        c.setIsActive(true);
        c.setIsDeleted(false);
        return c;
    }

    private User user(String tenantId, String schoolCode, String name, String email, Enums.Role role) {
        User u = User.builder().name(name).email(email).password(BCRYPT_ADMIN123).phone("+91-90000-00000")
                .role(role).schoolCode(schoolCode).build();
        u.setTenantId(tenantId);
        u.setIsActive(true);
        u.setIsDeleted(false);
        return u;
    }

    private Teacher teacher(String tenantId, String fn, String ln, String email, Long userId, List<String> subjects) {
        Teacher t = Teacher.builder().firstName(fn).lastName(ln).email(email).phone("+91-98100-00000")
                .qualification("M.Ed, B.Sc").specialization(subjects.get(0)).joinDate(LocalDate.of(2019, 6, 1))
                .salary(new BigDecimal("50000")).status(Enums.TeacherStatus.ACTIVE).userId(userId).subjects(subjects).build();
        t.setTenantId(tenantId);
        t.setIsDeleted(false);
        return t;
    }

    private SchoolClass clazz(String tenantId, String name, int grade, Long ayId, Long ctId, String ctName) {
        SchoolClass c = SchoolClass.builder().name(name).grade(grade).academicYearId(ayId).classTeacherId(ctId).classTeacherName(ctName).build();
        c.setTenantId(tenantId);
        c.setIsDeleted(false);
        return c;
    }

    private Section section(String tenantId, String name, Long classId, int cap, int count) {
        Section s = Section.builder().name(name).classId(classId).capacity(cap).studentCount(count).build();
        s.setTenantId(tenantId);
        s.setIsDeleted(false);
        return s;
    }

    private Student student(String tenantId, String fn, String ln, String adm, Long classId, Long secId, Long parentId,
                            String parentName, String email, Enums.Gender gender) {
        Student s = Student.builder().firstName(fn).lastName(ln).email(email).phone("+91-99000-00000")
                .dateOfBirth(LocalDate.of(2011, 5, 15)).gender(gender).classId(classId).sectionId(secId)
                .rollNumber(adm.substring(adm.length() - 3)).admissionNumber(adm).admissionDate(LocalDate.of(2025, 4, 8))
                .parentId(parentId).parentName(parentName).address("India").bloodGroup("O+").status(Enums.StudentStatus.ACTIVE).build();
        s.setTenantId(tenantId);
        s.setIsDeleted(false);
        return s;
    }

    private Guardian guardian(String tenantId, String name, String phone, Long userId) {
        Guardian g = new Guardian();
        g.setTenantId(tenantId);
        g.setFullName(name);
        g.setPrimaryPhone(phone);
        g.setOccupation("Professional");
        g.setUserId(userId);
        g.setIsDeleted(false);
        return g;
    }

    private void mapGuardian(String tenantId, Long studentId, Long gid, Enums.GuardianRelationType rel, boolean primary) {
        StudentGuardianMapping m = new StudentGuardianMapping();
        m.setTenantId(tenantId);
        m.setStudentId(studentId);
        m.setGuardianId(gid);
        m.setRelationType(rel);
        m.setIsPrimary(primary);
        m.setEffectiveFrom(LocalDate.of(2025, 4, 1));
        m.setIsDeleted(false);
        studentGuardianMappingRepository.save(m);
    }

    private void classTeacherRow(String tenantId, Long ay, Long classId, Long secId, Long teacherId) {
        ClassTeacherAssignment a = new ClassTeacherAssignment();
        a.setTenantId(tenantId);
        a.setAcademicYearId(ay);
        a.setClassId(classId);
        a.setSectionId(secId);
        a.setTeacherId(teacherId);
        a.setEffectiveFrom(LocalDate.of(2025, 4, 1));
        a.setIsDeleted(false);
        classTeacherAssignmentRepository.save(a);
    }

    private void subjectRow(String tenantId, Long ay, Long classId, Long secId, String subject, Long teacherId) {
        SubjectTeacherAssignment a = new SubjectTeacherAssignment();
        a.setTenantId(tenantId);
        a.setAcademicYearId(ay);
        a.setClassId(classId);
        a.setSectionId(secId);
        a.setSubjectName(subject);
        a.setTeacherId(teacherId);
        a.setEffectiveFrom(LocalDate.of(2025, 4, 1));
        a.setIsDeleted(false);
        subjectTeacherAssignmentRepository.save(a);
    }

    private AttendanceRecord att(String tenantId, Student s, LocalDate d, Enums.AttendanceStatus st, Long markedBy) {
        AttendanceRecord a = AttendanceRecord.builder().studentId(s.getId()).studentName(s.getFirstName() + " " + s.getLastName())
                .classId(s.getClassId()).sectionId(s.getSectionId()).date(d).status(st).markedBy(markedBy).build();
        a.setTenantId(tenantId);
        a.setIsDeleted(false);
        return a;
    }

    private TimetableEntry tt(String tenantId, Long ayId, Long classId, Long secId, Enums.DayOfWeek day, int period,
                              LocalTime st, LocalTime et, String subject, Long tid, String tname, String room) {
        TimetableEntry e = TimetableEntry.builder().classId(classId).sectionId(secId).day(day).period(period)
                .startTime(st).endTime(et).subjectName(subject).teacherId(tid).teacherName(tname).room(room).build();
        e.setTenantId(tenantId);
        e.setAcademicYearId(ayId);
        e.setIsDeleted(false);
        return e;
    }

    private void ExamScope(String tenantId, Long examId, Long classId, Long sectionId) {
        ExamClassScope s = new ExamClassScope();
        s.setTenantId(tenantId);
        s.setExamId(examId);
        s.setClassId(classId);
        s.setSectionId(sectionId);
        s.setIsDeleted(false);
        examClassScopeRepository.save(s);
    }

    private void examSlot(String tenantId, Long examId, Long classId, Long secId, String subject, LocalDate date,
                          LocalTime st, LocalTime et, String room) {
        ExamScheduleSlot sl = new ExamScheduleSlot();
        sl.setTenantId(tenantId);
        sl.setExamId(examId);
        sl.setClassId(classId);
        sl.setSectionId(secId);
        sl.setSubjectName(subject);
        sl.setExamDate(date);
        sl.setStartTime(st);
        sl.setEndTime(et);
        sl.setRoom(room);
        sl.setIsDeleted(false);
        examScheduleSlotRepository.save(sl);
    }

    private void markRecord(String tenantId, Long examId, Student s, String sub, double got, double max, String grade, Long classId) {
        MarkRecord m = MarkRecord.builder().examId(examId).studentId(s.getId()).studentName(s.getFirstName() + " " + s.getLastName())
                .subjectName(sub).marksObtained(got).maxMarks(max).grade(grade).classId(classId).build();
        m.setTenantId(tenantId);
        m.setIsDeleted(false);
        markRecordRepository.save(m);
    }

    private FeeStructure feeStructure(String tenantId, String name, Long classId, String className, Long ay, BigDecimal total) {
        FeeStructure f = FeeStructure.builder().name(name).classId(classId).className(className).academicYearId(ay).totalAmount(total).build();
        f.setTenantId(tenantId);
        f.setIsDeleted(false);
        return f;
    }

    private FeeComponent comp(String tenantId, Long fsId, String name, BigDecimal amt, Enums.FeeComponentType type) {
        FeeComponent c = FeeComponent.builder().feeStructureId(fsId).name(name).amount(amt).type(type).build();
        c.setTenantId(tenantId);
        c.setIsDeleted(false);
        return c;
    }

    private FeePayment payment(String tenantId, Student s, Long fsId, BigDecimal amt, BigDecimal paid, BigDecimal due,
                               Enums.FeeStatus st, String receipt) {
        return payment(tenantId, s, fsId, amt, paid, due, st, receipt, LocalDate.now().minusDays(7));
    }

    private FeePayment payment(String tenantId, Student s, Long fsId, BigDecimal amt, BigDecimal paid, BigDecimal due,
                               Enums.FeeStatus st, String receipt, LocalDate paymentDate) {
        FeePayment p = FeePayment.builder().studentId(s.getId()).studentName(s.getFirstName() + " " + s.getLastName())
                .feeStructureId(fsId).amount(amt).paidAmount(paid).dueAmount(due).status(st).paymentDate(paymentDate)
                .dueDate(LocalDate.now().plusMonths(2)).discount(BigDecimal.ZERO).lateFee(BigDecimal.ZERO)
                .receiptNumber(receipt).paymentMethod("UPI").build();
        p.setTenantId(tenantId);
        p.setIsDeleted(false);
        return p;
    }

    private Notification notif(String tenantId, Long uid, String title, String msg, Enums.NotificationType type) {
        Notification n = Notification.builder().title(title).message(msg).type(type).userId(uid).isRead(false).link("/app/dashboard").build();
        n.setTenantId(tenantId);
        n.setIsDeleted(false);
        return n;
    }

    private void saveAnnouncements(String tenantId, Long class9, Long sec9a, Long class10, Long class10SectionId) {
        Announcement a1 = new Announcement();
        a1.setTenantId(tenantId);
        a1.setTitle("Independence Day rehearsal — IX & X");
        a1.setContent("March-past practice during zero period on Thursday. White uniform mandatory.");
        a1.setAuthor("Dr. Ananya Dutta");
        a1.setAuthorRole("ADMIN");
        a1.setTargetAudience(Enums.TargetAudience.CLASS);
        a1.setTargetClassId(class9);
        announcementRepository.save(a1);

        Announcement a2 = new Announcement();
        a2.setTenantId(tenantId);
        a2.setTitle("PTA — mid-term open house");
        a2.setContent("Slots available 4–7 PM next Friday; RSVP via the parent portal.");
        a2.setAuthor("Dr. Ananya Dutta");
        a2.setAuthorRole("ADMIN");
        a2.setTargetAudience(Enums.TargetAudience.PARENTS);
        announcementRepository.save(a2);

        Announcement a3 = new Announcement();
        a3.setTenantId(tenantId);
        a3.setTitle("Class X — career counselling");
        a3.setContent("Science stream orientation with alumni panel this Saturday.");
        a3.setAuthor("Counselling Cell");
        a3.setAuthorRole("ADMIN");
        a3.setTargetAudience(Enums.TargetAudience.SECTION);
        a3.setTargetClassId(class10);
        a3.setTargetSectionId(class10SectionId);
        announcementRepository.save(a3);
    }

    private TransportVehicle vehicle(String tenantId, String reg, Enums.VehicleType type, int cap, String model) {
        TransportVehicle v = new TransportVehicle();
        v.setTenantId(tenantId);
        v.setRegistrationNumber(reg);
        v.setVehicleType(type);
        v.setCapacity(cap);
        v.setModel(model);
        v.setIsDeleted(false);
        return v;
    }

    private TransportDriver driver(String tenantId, String name, String phone, String license) {
        TransportDriver d = new TransportDriver();
        d.setTenantId(tenantId);
        d.setFullName(name);
        d.setPhone(phone);
        d.setLicenseNumber(license);
        d.setIsDeleted(false);
        return d;
    }

    private static <T> T tap(T target, Consumer<T> fn) {
        fn.accept(target);
        return target;
    }
}
