package com.school.erp.bootstrap;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.academic.entity.*;
import com.school.erp.modules.academic.repository.*;
import com.school.erp.modules.attendance.entity.AttendanceRecord;
import com.school.erp.modules.attendance.repository.AttendanceRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
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
import com.school.erp.modules.fees.entity.FeeStructure;
import com.school.erp.modules.fees.repository.FeeComponentRepository;
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
import com.school.erp.modules.leave.entity.LeaveEntitlementPolicy;
import com.school.erp.modules.leave.entity.LeaveRequest;
import com.school.erp.modules.leave.repository.LeaveEntitlementPolicyRepository;
import com.school.erp.modules.leave.repository.LeaveRequestRepository;
import com.school.erp.modules.library.entity.Book;
import com.school.erp.modules.library.entity.BookIssue;
import com.school.erp.modules.library.repository.BookIssueRepository;
import com.school.erp.modules.library.repository.BookRepository;
import com.school.erp.bootstrap.demo.DemoExtendedTablesSeed;
import com.school.erp.modules.chat.repository.ChatConversationRepository;
import com.school.erp.modules.chat.repository.ChatMessageRepository;
import com.school.erp.modules.chat.repository.ChatParticipantRepository;
import com.school.erp.modules.audit.entity.AuditLog;
import com.school.erp.modules.audit.repository.AuditLogRepository;
import com.school.erp.modules.fees.entity.PaymentWebhookEvent;
import com.school.erp.modules.fees.repository.PaymentWebhookEventRepository;
import com.school.erp.modules.importexport.ImportJobConstants;
import com.school.erp.modules.importexport.entity.ImportJob;
import com.school.erp.modules.importexport.entity.ImportJobLine;
import com.school.erp.modules.importexport.repository.ImportJobLineRepository;
import com.school.erp.modules.importexport.repository.ImportJobRepository;
import com.school.erp.modules.notification.entity.Notification;
import com.school.erp.modules.notification.entity.NotificationOutbox;
import com.school.erp.modules.notification.repository.NotificationOutboxRepository;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.modules.payroll.repository.SalaryDisbursementAttemptRepository;
import com.school.erp.platform.port.NotificationDispatchPort;
import com.school.erp.modules.payroll.entity.SalaryDisbursementAttempt;
import com.school.erp.modules.payroll.entity.Payslip;
import com.school.erp.modules.payroll.entity.SalaryComponent;
import com.school.erp.modules.payroll.entity.SalaryStructure;
import com.school.erp.modules.payroll.repository.PayslipRepository;
import com.school.erp.modules.payroll.repository.SalaryComponentRepository;
import com.school.erp.modules.payroll.repository.SalaryStructureRepository;
import com.school.erp.modules.reports.entity.ReportAnalyticsPackConfig;
import com.school.erp.modules.reports.entity.ReportGenerationJob;
import com.school.erp.modules.reports.entity.ReportNotificationTemplate;
import com.school.erp.modules.reports.entity.ReportPublicationSnapshot;
import com.school.erp.modules.reports.entity.ReportShareDispatch;
import com.school.erp.modules.reports.entity.ReportTemplate;
import com.school.erp.modules.reports.entity.ReportWorkflowEventLog;
import com.school.erp.modules.reports.repository.ReportAnalyticsPackConfigRepository;
import com.school.erp.modules.reports.repository.ReportGenerationJobRepository;
import com.school.erp.modules.reports.repository.ReportNotificationTemplateRepository;
import com.school.erp.modules.reports.repository.ReportPublicationSnapshotRepository;
import com.school.erp.modules.reports.repository.ReportShareDispatchRepository;
import com.school.erp.modules.reports.repository.ReportTemplateRepository;
import com.school.erp.modules.reports.repository.ReportWorkflowEventLogRepository;
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
import com.school.erp.common.util.InternationalPhone;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.Locale;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 * COMPREHENSIVE DEMO DATA SEED SERVICE FOR SCHOOL ERP
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 *
 * Seeds TWO realistic Indian schools with COMPLETE data for classes 6-12 for comprehensive
 * end-to-end testing across ALL roles and modules.
 *
 * ⚠️  OPTIMIZED FOR RENDER FREE TIER (0.1 CPU, 512MB RAM)
 * - Reduced data volume by ~90%
 * - Added 1-second pauses between major steps to avoid overwhelming CPU
 * - Batch processing with memory flushes every 20 entities
 * - EntityManager flush/clear after each major operation
 *
 * SCHOOL 1: Delhi Public School (DPS-DLH) - New Delhi
 * SCHOOL 2: Kendriya Vidyalaya (KV-MUM) - Mumbai
 *
 * Each school includes:
 * ├── Classes: 6, 7, 8, 9, 10, 11, 12 (7 classes)
 * ├── Sections: A, B per class (2 sections × 7 classes = 14 sections)
 * ├── Students: 15 per section (14 sections → ~210 students total per school)
 * ├── Teachers: 36 teachers (enough breadth for demo timetables without teacher double-booking per slot)
 * ├── Guardians: Father + Mother for each student (proper mapping)
 * ├── QA parent: one dedicated {@code qa.multichild.parent@parent.<schoolCode>.edu.in} with four linked
 * │   active students (different classes where possible) for multi-child E2E / parent-portal QA
 * ├── Users: ADMIN, TEACHERS, PARENTS, LIBRARY_STAFF with login credentials
 * ├── Academic: Subjects, Teacher Assignments (Class + Subject)
 * ├── Fees: Fee structures, components, payments (PAID, PARTIAL, UNPAID examples)
 * ├── Exams: Multiple exams with schedules, mark records
 * ├── Attendance: Last 5 days of attendance for all students
 * ├── Timetable: Complete weekly schedule for all classes
 * ├── Transport: 2 routes, vehicles, drivers, stops, student mappings
 * ├── Library: 30 books, 10 book issues
 * ├── Hostel: 2 hostels, 8 rooms per hostel, student allocations
 * ├── Payroll: Teacher salary structures, components, payslips (last 3 months)
 * ├── Communication: audience-scoped announcements (ALL / PARENTS / TEACHERS / CLASS / SECTION), homeroom-only
 * │   direct messages, and [DEMO] in-app notifications on QA parent + one homeroom teacher
 * ├── Documents: 5 sample documents for testing
 * └── Leave: Leave requests (5 teacher + 10 student examples)
 *
 * PASSWORD FOR ALL USERS: admin123
 *
 * See {@code docs/DEMO_QA_MULTI_CHILD_PARENT.md} for QA multi-child logins; other patterns in repo docs.
 * ═══════════════════════════════════════════════════════════════════════════════════════════════
 */
@Service
@Profile({"demo-seed"})
public class DemoDataSeedService {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeedService.class);

    /** BCrypt hash for "admin123" - all demo users use this password */
    private static final String BCRYPT_ADMIN123 = "$2a$10$OF9wtmX3lDzBIYsrZlAe8Ou2829Ih6l6WTe2TxSVRacFh1fAr2mBy";

    /** Minimum linked students for QA multi-child scenarios (QA requested &gt;2; we use 4 for breadth). */
    private static final int QA_MULTICHILD_STUDENT_COUNT = 4;

    private static final String QA_MULTICHILD_EMAIL_LOCAL = "qa.multichild.parent";

    private static final String FEATURES_JSON = "{\"chat\":false,\"transport\":false,\"library\":false,\"hostel\":false,"
            + "\"operationsHub\":false,\"importExport\":false,\"directory\":true,"
            + "\"payroll\":true,\"documents\":false,\"audit\":true,\"communication\":true,\"reports\":false,\"student\":true,\"teacher\":true,"
            + "\"attendance\":true,\"fees\":true,\"leave\":false}";

    // Realistic Indian name pools for data generation
    private static final String[] MALE_FIRST_NAMES = {
        "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Arnav", "Ayaan", "Krishna", "Ishaan",
        "Shaurya", "Atharv", "Advaith", "Pranav", "Aaradhya", "Darsh", "Dhruv", "Kabir", "Kiaan", "Reyansh",
        "Rohan", "Rudra", "Shivansh", "Veer", "Yash", "Aarush", "Ansh", "Dev", "Karthik", "Lakshya",
        "Mihir", "Naveen", "Parth", "Rahul", "Rishi", "Samarth", "Tanish", "Utkarsh", "Varun", "Yug",
        "Aaryan", "Abhinav", "Amar", "Anirudh", "Aryan", "Ashwin", "Bhavya", "Deepak", "Gaurav", "Harsh"
    };

    private static final String[] FEMALE_FIRST_NAMES = {
        "Aadhya", "Ananya", "Diya", "Pari", "Aaradhya", "Anika", "Saanvi", "Sara", "Prisha", "Myra",
        "Navya", "Avni", "Kiara", "Riya", "Tanya", "Ishita", "Jiya", "Anvi", "Ira", "Pihu",
        "Aanya", "Shanaya", "Zara", "Aditi", "Kavya", "Meera", "Nitya", "Pooja", "Shreya", "Siya",
        "Tanvi", "Vani", "Aisha", "Anushka", "Diya", "Gauri", "Hriday", "Isha", "Janvi", "Khushi",
        "Mahika", "Naina", "Palak", "Radhika", "Sakshi", "Tara", "Vanshi", "Yamini", "Zoya", "Divya"
    };

    private static final String[] LAST_NAMES = {
        "Sharma", "Verma", "Singh", "Kumar", "Gupta", "Agarwal", "Reddy", "Patel", "Mehta", "Joshi",
        "Desai", "Rao", "Pillai", "Nair", "Iyer", "Menon", "Chopra", "Malhotra", "Kapoor", "Khanna",
        "Bhatia", "Sethi", "Banerjee", "Chatterjee", "Mukherjee", "Ghosh", "Das", "Sen", "Bose", "Roy",
        "Saxena", "Srivastava", "Pandey", "Mishra", "Jain", "Shah", "Modi", "Thakur", "Chauhan", "Rajput",
        "Khan", "Ali", "Rahman", "Ahmed", "Siddiqui", "Ansari", "Fernandes", "D'Souza", "Rodrigues", "Pereira"
    };

    private static final String[] FATHER_NAMES = {
        "Rajesh", "Amit", "Suresh", "Prakash", "Vijay", "Manoj", "Anil", "Sanjay", "Deepak", "Ashok",
        "Ramesh", "Mukesh", "Santosh", "Dinesh", "Mahesh", "Naresh", "Rajendra", "Sunil", "Vinod", "Ajay",
        "Vikram", "Rajeev", "Sandeep", "Pradeep", "Manish", "Ankit", "Nitin", "Rohit", "Sachin", "Rahul"
    };

    private static final String[] MOTHER_NAMES = {
        "Sunita", "Rekha", "Kavita", "Meena", "Neeta", "Seema", "Rita", "Geeta", "Anita", "Sangita",
        "Priya", "Pooja", "Divya", "Anju", "Ritu", "Suman", "Nisha", "Reena", "Sapna", "Komal",
        "Swati", "Anjali", "Preeti", "Shikha", "Shweta", "Sonia", "Varsha", "Rashmi", "Archana", "Usha"
    };

    // All repositories - injected via constructor
    private final TenantConfigRepository tenantConfigRepository;
    private final UserRepository userRepository;
    private final AcademicYearRepository academicYearRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final AcademicSubjectRepository academicSubjectRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final GuardianRepository guardianRepository;
    private final StudentGuardianMappingRepository studentGuardianMappingRepository;
    private final ClassTeacherAssignmentRepository classTeacherAssignmentRepository;
    private final SubjectTeacherAssignmentRepository subjectTeacherAssignmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final TimetableRepository timetableRepository;
    private final ExamRepository examRepository;
    private final ExamClassScopeRepository examClassScopeRepository;
    private final ExamScheduleSlotRepository examScheduleSlotRepository;
    private final MarkRecordRepository markRecordRepository;
    private final FeeStructureRepository feeStructureRepository;
    private final FeeComponentRepository feeComponentRepository;
    private final FeePaymentRepository feePaymentRepository;
    private final TransportVehicleRepository transportVehicleRepository;
    private final TransportDriverRepository transportDriverRepository;
    private final TransportRouteRepository transportRouteRepository;
    private final RouteStopRepository routeStopRepository;
    private final StudentTransportMappingRepository studentTransportMappingRepository;
    private final BookRepository bookRepository;
    private final BookIssueRepository bookIssueRepository;
    private final HostelRepository hostelRepository;
    private final HostelRoomRepository hostelRoomRepository;
    private final HostelAllocationRepository hostelAllocationRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final SalaryComponentRepository salaryComponentRepository;
    private final PayslipRepository payslipRepository;
    private final AnnouncementRepository announcementRepository;
    private final MessageRepository messageRepository;
    private final DocumentRepository documentRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveEntitlementPolicyRepository leaveEntitlementPolicyRepository;
    private final NotificationRepository notificationRepository;
    private final ChatConversationRepository chatConversationRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ImportJobRepository importJobRepository;
    private final ImportJobLineRepository importJobLineRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationOutboxRepository notificationOutboxRepository;
    private final NotificationDispatchPort notificationDispatchPort;
    private final SalaryDisbursementAttemptRepository salaryDisbursementAttemptRepository;
    private final PaymentWebhookEventRepository paymentWebhookEventRepository;
    private final ExamTemplateRepository examTemplateRepository;
    private final ExamTemplateComponentRepository examTemplateComponentRepository;
    private final ExamNotificationJobRepository examNotificationJobRepository;
    private final ExamEventLogRepository examEventLogRepository;
    private final ExamBulkOperationLogRepository examBulkOperationLogRepository;
    private final ReportTemplateRepository reportTemplateRepository;
    private final ReportGenerationJobRepository reportGenerationJobRepository;
    private final ReportNotificationTemplateRepository reportNotificationTemplateRepository;
    private final ReportShareDispatchRepository reportShareDispatchRepository;
    private final ReportPublicationSnapshotRepository reportPublicationSnapshotRepository;
    private final ReportWorkflowEventLogRepository reportWorkflowEventLogRepository;
    private final ReportAnalyticsPackConfigRepository reportAnalyticsPackConfigRepository;
    private final DemoExtendedTablesSeed demoExtendedTablesSeed;
    private final EntityManager entityManager;

    /** Pause duration between major steps to avoid CPU spikes on free tier. */
    @Value("${app.demo-seed.step-pause-ms:800}")
    private long stepPauseMs;

    /** Batch size for entity manager flush/clear operations. */
    @Value("${app.demo-seed.batch-size:20}")
    private int batchSize;

    /** Teacher count per school; keep enough for timetable + homeroom coverage. */
    @Value("${app.demo-seed.teacher-count:36}")
    private int teacherCount;

    /** Students per section for demo roster density. */
    @Value("${app.demo-seed.students-per-section:15}")
    private int studentsPerSection;

    public DemoDataSeedService(
            TenantConfigRepository tenantConfigRepository,
            UserRepository userRepository,
            AcademicYearRepository academicYearRepository,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository,
            AcademicSubjectRepository academicSubjectRepository,
            TeacherRepository teacherRepository,
            StudentRepository studentRepository,
            GuardianRepository guardianRepository,
            StudentGuardianMappingRepository studentGuardianMappingRepository,
            ClassTeacherAssignmentRepository classTeacherAssignmentRepository,
            SubjectTeacherAssignmentRepository subjectTeacherAssignmentRepository,
            AttendanceRepository attendanceRepository,
            TimetableRepository timetableRepository,
            ExamRepository examRepository,
            ExamClassScopeRepository examClassScopeRepository,
            ExamScheduleSlotRepository examScheduleSlotRepository,
            MarkRecordRepository markRecordRepository,
            FeeStructureRepository feeStructureRepository,
            FeeComponentRepository feeComponentRepository,
            FeePaymentRepository feePaymentRepository,
            TransportVehicleRepository transportVehicleRepository,
            TransportDriverRepository transportDriverRepository,
            TransportRouteRepository transportRouteRepository,
            RouteStopRepository routeStopRepository,
            StudentTransportMappingRepository studentTransportMappingRepository,
            BookRepository bookRepository,
            BookIssueRepository bookIssueRepository,
            HostelRepository hostelRepository,
            HostelRoomRepository hostelRoomRepository,
            HostelAllocationRepository hostelAllocationRepository,
            SalaryStructureRepository salaryStructureRepository,
            SalaryComponentRepository salaryComponentRepository,
            PayslipRepository payslipRepository,
            AnnouncementRepository announcementRepository,
            MessageRepository messageRepository,
            DocumentRepository documentRepository,
            LeaveRequestRepository leaveRequestRepository,
            LeaveEntitlementPolicyRepository leaveEntitlementPolicyRepository,
            NotificationRepository notificationRepository,
            ChatConversationRepository chatConversationRepository,
            ChatParticipantRepository chatParticipantRepository,
            ChatMessageRepository chatMessageRepository,
            ImportJobRepository importJobRepository,
            ImportJobLineRepository importJobLineRepository,
            AuditLogRepository auditLogRepository,
            NotificationOutboxRepository notificationOutboxRepository,
            NotificationDispatchPort notificationDispatchPort,
            SalaryDisbursementAttemptRepository salaryDisbursementAttemptRepository,
            PaymentWebhookEventRepository paymentWebhookEventRepository,
            ExamTemplateRepository examTemplateRepository,
            ExamTemplateComponentRepository examTemplateComponentRepository,
            ExamNotificationJobRepository examNotificationJobRepository,
            ExamEventLogRepository examEventLogRepository,
            ExamBulkOperationLogRepository examBulkOperationLogRepository,
            ReportTemplateRepository reportTemplateRepository,
            ReportGenerationJobRepository reportGenerationJobRepository,
            ReportNotificationTemplateRepository reportNotificationTemplateRepository,
            ReportShareDispatchRepository reportShareDispatchRepository,
            ReportPublicationSnapshotRepository reportPublicationSnapshotRepository,
            ReportWorkflowEventLogRepository reportWorkflowEventLogRepository,
            ReportAnalyticsPackConfigRepository reportAnalyticsPackConfigRepository,
            EntityManager entityManager,
            DemoExtendedTablesSeed demoExtendedTablesSeed) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.userRepository = userRepository;
        this.academicYearRepository = academicYearRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.academicSubjectRepository = academicSubjectRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.guardianRepository = guardianRepository;
        this.studentGuardianMappingRepository = studentGuardianMappingRepository;
        this.classTeacherAssignmentRepository = classTeacherAssignmentRepository;
        this.subjectTeacherAssignmentRepository = subjectTeacherAssignmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.timetableRepository = timetableRepository;
        this.examRepository = examRepository;
        this.examClassScopeRepository = examClassScopeRepository;
        this.examScheduleSlotRepository = examScheduleSlotRepository;
        this.markRecordRepository = markRecordRepository;
        this.feeStructureRepository = feeStructureRepository;
        this.feeComponentRepository = feeComponentRepository;
        this.feePaymentRepository = feePaymentRepository;
        this.transportVehicleRepository = transportVehicleRepository;
        this.transportDriverRepository = transportDriverRepository;
        this.transportRouteRepository = transportRouteRepository;
        this.routeStopRepository = routeStopRepository;
        this.studentTransportMappingRepository = studentTransportMappingRepository;
        this.bookRepository = bookRepository;
        this.bookIssueRepository = bookIssueRepository;
        this.hostelRepository = hostelRepository;
        this.hostelRoomRepository = hostelRoomRepository;
        this.hostelAllocationRepository = hostelAllocationRepository;
        this.salaryStructureRepository = salaryStructureRepository;
        this.salaryComponentRepository = salaryComponentRepository;
        this.payslipRepository = payslipRepository;
        this.announcementRepository = announcementRepository;
        this.messageRepository = messageRepository;
        this.documentRepository = documentRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.leaveEntitlementPolicyRepository = leaveEntitlementPolicyRepository;
        this.notificationRepository = notificationRepository;
        this.chatConversationRepository = chatConversationRepository;
        this.chatParticipantRepository = chatParticipantRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.importJobRepository = importJobRepository;
        this.importJobLineRepository = importJobLineRepository;
        this.auditLogRepository = auditLogRepository;
        this.notificationOutboxRepository = notificationOutboxRepository;
        this.notificationDispatchPort = notificationDispatchPort;
        this.salaryDisbursementAttemptRepository = salaryDisbursementAttemptRepository;
        this.paymentWebhookEventRepository = paymentWebhookEventRepository;
        this.examTemplateRepository = examTemplateRepository;
        this.examTemplateComponentRepository = examTemplateComponentRepository;
        this.examNotificationJobRepository = examNotificationJobRepository;
        this.examEventLogRepository = examEventLogRepository;
        this.examBulkOperationLogRepository = examBulkOperationLogRepository;
        this.reportTemplateRepository = reportTemplateRepository;
        this.reportGenerationJobRepository = reportGenerationJobRepository;
        this.reportNotificationTemplateRepository = reportNotificationTemplateRepository;
        this.reportShareDispatchRepository = reportShareDispatchRepository;
        this.reportPublicationSnapshotRepository = reportPublicationSnapshotRepository;
        this.reportWorkflowEventLogRepository = reportWorkflowEventLogRepository;
        this.reportAnalyticsPackConfigRepository = reportAnalyticsPackConfigRepository;
        this.demoExtendedTablesSeed = demoExtendedTablesSeed;
        this.entityManager = entityManager;
    }

    /**
     * Main seeding entry point - idempotent
     */
    @Transactional
    public void seedIfNeeded() {
        log.info("══════════════════════════════════════════════════════════════");
        log.info("  COMPREHENSIVE DEMO DATA SEED - SCHOOL ERP");
        log.info("══════════════════════════════════════════════════════════════");

        try {
            // 1. Platform Super Admin (global)
            seedPlatformSuperAdmin();

            // 2. School 1: Delhi Public School
            if (!tenantConfigRepository.existsBySchoolCode("DPS-DLH")) {
                log.info("→ Seeding School 1: Delhi Public School (DPS-DLH)");
                seedSchool("DPS-DLH",
                          "tenant_dps_delhi_9x4k7m2p",
                          "Delhi Public School",
                          "A-Block, Defence Colony, New Delhi 110024, Delhi",
                          "+91-11-2433-5050",
                          "office@dpsdel.edu.in");
            } else {
                log.info("→ School 1 (DPS-DLH) already exists");
            }

            // 3. School 2: Kendriya Vidyalaya
            if (!tenantConfigRepository.existsBySchoolCode("KV-MUM")) {
                log.info("→ Seeding School 2: Kendriya Vidyalaya (KV-MUM)");
                seedSchool("KV-MUM",
                          "tenant_kv_mumbai_7p5n3x8q",
                          "Kendriya Vidyalaya No. 1",
                          "INS Hamla, Marve Road, Malad West, Mumbai 400095, Maharashtra",
                          "+91-22-2844-6633",
                          "kvmumbai1@gmail.com");
            } else {
                log.info("→ School 2 (KV-MUM) already exists");
            }

            log.info("══════════════════════════════════════════════════════════════");
            log.info("  ✅ DEMO DATA SEED COMPLETE");
            log.info("  All users password: admin123");
            log.info("  See credentials summary below or check DEMO_CREDENTIALS.md");
            log.info("══════════════════════════════════════════════════════════════");

            // Print credentials summary
            printCredentialsSummary();

            // Operations / inventory / gate / covers — idempotent per tenant (inventory marker SKU)
            applyExtendedDemoSeedsForConfiguredSchools();

        } catch (Exception e) {
            log.error("══════════════════════════════════════════════════════════════");
            log.error("❌ DEMO DATA SEED FAILED!");
            log.error("Error: {}", e.getMessage());
            log.error("══════════════════════════════════════════════════════════════");
            log.error("Troubleshooting tips:");
            log.error("1. Check if database is accessible");
            log.error("2. If you see duplicate key errors, data might already exist");
            log.error("3. To re-seed, use a fresh database or manually delete existing data");
            log.error("4. Check application logs for detailed error information");
            log.error("══════════════════════════════════════════════════════════════");
            throw new RuntimeException("Demo data seeding failed", e);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // PLATFORM SUPER ADMIN
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    private void applyExtendedDemoSeedsForConfiguredSchools() {
        List<TenantConfig> demoTenants = tenantConfigRepository.findAll().stream()
                .filter(tc -> !Boolean.TRUE.equals(tc.getIsDeleted()))
                .filter(tc -> tc.getTenantId() != null && !"SUPER_ADMIN_PLATFORM".equals(tc.getTenantId()))
                .toList();
        for (TenantConfig tc : demoTenants) {
            try {
                demoExtendedTablesSeed.seedExtendedModuleRows(tc.getTenantId(), tc.getSchoolCode());
            } catch (Exception e) {
                log.warn("Extended demo seed for {} skipped or failed: {}", tc.getSchoolCode(), e.getMessage());
            }
        }
    }

    private void seedPlatformSuperAdmin() {
        String email = "superadmin@schoolerp.com";
        String platformTenant = "SUPER_ADMIN_PLATFORM";
        if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(email, platformTenant)) {
            return;
        }
        log.info("→ Seeding Platform Super Admin...");
        String schoolCode = "PLATFORM";
        User superAdmin = new User();
        superAdmin.setTenantId(platformTenant);
        superAdmin.setName("Platform Super Admin");
        superAdmin.setEmail(email);
        superAdmin.setPassword(BCRYPT_ADMIN123);
        superAdmin.setPhone("+91-11-2800-0000");
        superAdmin.setRole(Enums.Role.SUPER_ADMIN);
        superAdmin.setSchoolCode(schoolCode);
        superAdmin.setIsActive(true);
        superAdmin.setIsDeleted(false);
        userRepository.save(superAdmin);

        log.info("✓ Created SUPER_ADMIN: {}", email);
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // COMPREHENSIVE SCHOOL SEEDING (Works for any school)
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    private void seedSchool(String schoolCode, String tenantId, String schoolName,
                           String address, String phone, String email) {
        // Check if school already has data - if yes, skip to avoid duplicates
        long existingStudents = studentRepository.countByTenantIdAndIsDeletedFalse(tenantId);
        if (existingStudents > 0) {
            log.info("  ⚠️  School {} already has {} students - SKIPPING to avoid duplicates",
                     schoolCode, existingStudents);
            log.info("  To re-seed, manually delete existing data or use a fresh database");
            return;
        }

        log.info("  🏫 Starting seed for {} (tenant: {})", schoolName, tenantId);
        Random random = new Random(schoolCode.hashCode()); // Deterministic randomness per school

        // STEP 1: Tenant Config
        log.info("  [1/15] Tenant Config...");
        TenantConfig config = createTenantConfig(tenantId, schoolCode, schoolName, address, phone, email);
        createLeaveEntitlementPolicy(tenantId);
        pauseForResourceManagement();

        // STEP 2: Admin User
        log.info("  [2/15] Admin User...");
        User adminUser = createUser(tenantId, schoolCode, "School Admin", "admin@" + email.split("@")[1],
                                    Enums.Role.ADMIN, "+91-" + phone.substring(4, 14));
        pauseForResourceManagement();

        // STEP 3: Academic Year
        log.info("  [3/15] Academic Year...");
        AcademicYear academicYear = createAcademicYear(tenantId, "2026-2027",
                                                       LocalDate.of(2026, 4, 1),
                                                       LocalDate.of(2027, 3, 31),
                                                       true);
        pauseForResourceManagement();

        // STEP 4: Academic Subjects (common across all classes)
        log.info("  [4/15] Academic Subjects...");
        createAcademicSubjects(tenantId);
        flushAndClear(); // Clear memory after creating subjects
        pauseForResourceManagement();

        // STEP 5: Teachers — 36 so Mon–Sat × 6 periods can assign distinct teachers across ~14 sections
        // (one teacher per (day,period) tenant-wide while teacher_id is set; see uq_tt_active_teacher_slot / V20).
        log.info("  [5/15] Teachers...");
        List<Teacher> teachers = createTeachers(tenantId, schoolCode, normalizedTeacherCount(), random);
        flushAndClear(); // Clear memory after creating teachers
        pauseForResourceManagement();

        // STEP 6: Classes & Sections (Classes 6-12, Sections A, B - optimized for Render)
        log.info("  [6/15] Classes & Sections...");
        Map<Integer, List<ClassSectionPair>> classesMap = createClassesAndSections(tenantId, academicYear.getId(), teachers, random);
        flushAndClear(); // Clear memory after creating classes
        pauseForResourceManagement();

        // STEP 7: Students with Guardians (8 per section — full section rosters for directory / module QA)
        log.info("  [7/15] Students & Guardians...");
        List<Student> allStudents = createStudentsWithGuardians(tenantId, schoolCode, classesMap, random);
        log.info("  [7/15] ✓ Created {} students with guardians", allStudents.size());
        attachQaMultiChildDemoParent(tenantId, schoolCode, allStudents);
        flushAndClear(); // Critical: Clear memory after large student creation
        pauseForResourceManagement();

        // STEP 8: Teacher Assignments (Class Teachers + Subject Teachers)
        log.info("  [8/15] Teacher Assignments...");
        assignTeachersToClasses(tenantId, academicYear.getId(), classesMap, teachers, random);
        flushAndClear();
        pauseForResourceManagement();

        // STEP 9: Fee Structures & Payments
        log.info("  [9/15] Fees & Payments...");
        createFeesAndPayments(tenantId, academicYear.getId(), classesMap, allStudents, random);
        log.info("  [9/15] ✓ Created fee structures and payments");
        flushAndClear(); // Critical: Clear memory after fee payments
        pauseForResourceManagement();

        // STEP 10: Exams & Mark Records
        log.info("  [10/15] Exams & Marks...");
        List<Exam> seededExams = createExamsAndMarks(tenantId, academicYear.getId(), classesMap, allStudents, random);
        createExamAndReportModuleSeedData(tenantId, academicYear.getId(), classesMap, allStudents, teachers, seededExams, random);
        log.info("  [10/15] ✓ Created exams and mark records");
        flushAndClear(); // Critical: Clear memory after marks
        pauseForResourceManagement();

        // STEP 11: Attendance (last 5 days)
        log.info("  [11/15] Attendance...");
        createAttendance(tenantId, allStudents, teachers, random);
        log.info("  [11/15] ✓ Created attendance records");
        flushAndClear(); // Critical: Clear memory after attendance
        pauseForResourceManagement();

        // STEP 12: Timetables
        log.info("  [12/15] Timetables...");
        createTimetables(tenantId, academicYear.getId(), classesMap, teachers, random);
        log.info("  [12/15] ✓ Created timetables");
        flushAndClear(); // Critical: Clear memory after timetables
        pauseForResourceManagement();

        // STEP 13: Transport
        log.info("  [13/15] Transport...");
        createTransport(tenantId, allStudents, random);
        flushAndClear();
        pauseForResourceManagement();

        // STEP 14: Library
        log.info("  [14/15] Library...");
        createLibrary(tenantId, allStudents, teachers, random);
        flushAndClear();
        pauseForResourceManagement();

        // STEP 15: Hostel & Payroll & Communication & Documents & Leave
        log.info("  [15/15] Hostel, Payroll, Communication, Documents, Leave...");
        createHostel(tenantId, allStudents, random);
        flushAndClear();
        pauseForResourceManagement();

        createPayroll(tenantId, teachers, random);
        flushAndClear();
        pauseForResourceManagement();

        createCommunication(tenantId, schoolCode, adminUser, teachers, random);
        flushAndClear();
        pauseForResourceManagement();

        createDocuments(tenantId, allStudents, teachers, random);
        flushAndClear();
        pauseForResourceManagement();

        createLeaveRequests(tenantId, teachers, allStudents, random);
        flushAndClear();
        pauseForResourceManagement();

        seedShowcaseSupplementaryRows(tenantId, schoolCode);
        createMeaningfulAuditTrailSeed(tenantId, schoolCode, adminUser, teachers, allStudents);
        flushAndClear();

        log.info("══════════════════════════════════════════════════════════════");
        log.info("✅ School {} SEEDED SUCCESSFULLY!", schoolCode);
        log.info("   Students: {}", allStudents.size());
        log.info("   Teachers: {}", teachers.size());
        log.info("   Classes: 7 (grades 6-12)");
        log.info("   Sections: 14 (A, B per class)");
        log.info("══════════════════════════════════════════════════════════════");
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // HELPER METHODS FOR RESOURCE MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    /**
     * Pauses execution to avoid overwhelming Render's limited resources (0.1 CPU, 512MB RAM)
     */
    private void pauseForResourceManagement() {
        try {
            if (stepPauseMs > 0) {
                Thread.sleep(stepPauseMs);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Pause interrupted: {}", e.getMessage());
        }
    }

    /**
     * Flushes and clears entity manager to free up memory
     */
    private void seedShowcaseSupplementaryRows(String tenantId, String schoolCode) {
        seedAcademicSubjectCatalogIfMissing(tenantId);
        seedNotificationOutboxShowcase(tenantId, schoolCode);
        seedPayslipAndSalaryDisbursementDemo(tenantId, schoolCode);
        seedPaymentWebhookDemoRow(tenantId, schoolCode);
    }

    private void createMeaningfulAuditTrailSeed(String tenantId, String schoolCode, User adminUser,
                                                List<Teacher> teachers, List<Student> students) {
        if (auditLogRepository.findByTenantIdAndIsDeletedFalse(tenantId, org.springframework.data.domain.Pageable.ofSize(1))
                .getTotalElements() > 0) {
            return;
        }
        Student sampleStudent = students.isEmpty() ? null : students.get(0);
        Teacher classTeacher = teachers.isEmpty() ? null : teachers.get(0);
        Teacher coveringTeacher = teachers.size() > 1 ? teachers.get(1) : classTeacher;
        Long classTeacherUserId = classTeacher != null ? classTeacher.getUserId() : null;
        Long coveringTeacherUserId = coveringTeacher != null ? coveringTeacher.getUserId() : null;
        String classScope = sampleStudent == null
                ? "Class 7-A"
                : ("Class " + sampleStudent.getClassId() + (sampleStudent.getSectionId() != null ? ", Section " + sampleStudent.getSectionId() : ""));
        String adminName = adminUser != null && adminUser.getName() != null ? adminUser.getName() : "School Admin";
        String classTeacherName = classTeacher != null ? (classTeacher.getFirstName() + " " + classTeacher.getLastName()).trim() : "Class Teacher";
        String coveringName = coveringTeacher != null ? (coveringTeacher.getFirstName() + " " + coveringTeacher.getLastName()).trim() : "Cover Teacher";
        String studentName = sampleStudent != null ? (sampleStudent.getFirstName() + " " + sampleStudent.getLastName()).trim() : "Student";
        Long studentId = sampleStudent != null ? sampleStudent.getId() : null;
        Long teacherId = classTeacher != null ? classTeacher.getId() : null;

        List<AuditLog> rows = new ArrayList<>();
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.LOGIN, "Auth",
                adminName + " logged in to " + schoolCode + " workspace.", adminUser != null ? adminUser.getId() : null, adminName, null, "User"));
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.UPDATE, "Attendance",
                classTeacherName + " marked attendance for " + classScope + " (today).", classTeacherUserId, classTeacherName, teacherId, "AttendanceRecord"));
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.UPDATE, "Attendance",
                coveringName + " marked attendance for " + classScope + " on behalf of class teacher " + classTeacherName + ".", coveringTeacherUserId, coveringName, teacherId, "AttendanceCoverAssignment"));
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.UPDATE, "Fees",
                adminName + " recorded a partial fee payment for " + studentName + ".", adminUser != null ? adminUser.getId() : null, adminName, studentId, "FeePayment"));
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.CREATE, "Exams",
                adminName + " published Mid-Term exam timetable for " + classScope + ".", adminUser != null ? adminUser.getId() : null, adminName, null, "Exam"));
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.UPDATE, "Reports",
                adminName + " approved and published report cards for " + classScope + ".", adminUser != null ? adminUser.getId() : null, adminName, null, "ReportGenerationJob"));
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.CREATE, "Communication",
                adminName + " broadcast an announcement to parents about PTM timing changes.", adminUser != null ? adminUser.getId() : null, adminName, null, "Announcement"));
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.UPDATE, "Timetable",
                adminName + " adjusted timetable slot for " + classScope + " to resolve a period conflict.", adminUser != null ? adminUser.getId() : null, adminName, teacherId, "TimetableEntry"));
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.CREATE, "Operations",
                adminName + " issued a gate pass for " + studentName + " (medical appointment).", adminUser != null ? adminUser.getId() : null, adminName, studentId, "GatePass"));
        rows.add(buildAuditRow(tenantId, Enums.AuditAction.UPDATE, "Payroll",
                adminName + " completed monthly payroll disbursement for teaching staff.", adminUser != null ? adminUser.getId() : null, adminName, teacherId, "Payslip"));
        auditLogRepository.saveAll(rows);
    }

    private AuditLog buildAuditRow(String tenantId, Enums.AuditAction action, String module,
                                   String description, Long userId, String userName,
                                   Long entityId, String entityType) {
        AuditLog row = AuditLog.builder()
                .action(action)
                .module(module)
                .description(description)
                .userId(userId)
                .userName(userName)
                .ipAddress("system")
                .entityId(entityId)
                .entityType(entityType)
                .build();
        row.setTenantId(tenantId);
        return row;
    }

    private void seedAcademicSubjectCatalogIfMissing(String tenantId) {
        record SubRow(String code, String name, String category, int sort) {}
        List<SubRow> rows = List.of(
                new SubRow("MATH", "Mathematics", "STEM", 10),
                new SubRow("PHY", "Physics", "STEM", 20),
                new SubRow("CHEM", "Chemistry", "STEM", 30),
                new SubRow("BIO", "Biology", "STEM", 35),
                new SubRow("CS", "Computer Science", "STEM", 50),
                new SubRow("ENG", "English", "Languages", 60),
                new SubRow("HIN", "Hindi", "Languages", 65),
                new SubRow("HIST", "History", "Social", 70),
                new SubRow("PE", "Physical Education", "Arts", 80));
        for (SubRow s : rows) {
            if (academicSubjectRepository.existsByTenantIdAndNameAndIsDeletedFalse(tenantId, s.name())) {
                continue;
            }
            AcademicSubject a = new AcademicSubject();
            a.setTenantId(tenantId);
            a.setCode(s.code());
            a.setName(s.name());
            a.setCategory(s.category());
            a.setSortOrder(s.sort());
            a.setIsDeleted(false);
            academicSubjectRepository.save(a);
        }
    }

    private void seedNotificationOutboxShowcase(String tenantId, String schoolCode) {
        String parentEmail =
                "STXHER-KOL".equals(schoolCode) ? "s.banerjee.parent@stxheritage.edu" : "k.deshmukh.parent@meridianridge.edu";
        User parent = userRepository.findByEmailAndTenantIdAndIsDeletedFalse(parentEmail, tenantId).orElse(null);
        if (parent == null) {
            return;
        }
        notificationDispatchPort.enqueue(
                tenantId,
                "FEE_REMINDER",
                "EMAIL",
                parent.getId(),
                null,
                "Fee balance — gentle reminder",
                "Demo: term fee balance can be cleared via the parent portal.",
                "demo:v3:fee_email:" + schoolCode,
                "seed-fee-email");
        notificationDispatchPort.enqueue(
                tenantId,
                "FEE_REMINDER",
                "WHATSAPP",
                parent.getId(),
                null,
                "Fee reminder",
                "Demo: pay online or visit the accounts office.",
                "demo:v3:fee_wa:" + schoolCode,
                "seed-fee-wa");
        notificationDispatchPort.enqueue(
                tenantId,
                "FEE_REMINDER",
                "IN_APP",
                parent.getId(),
                null,
                "In-app: fee due",
                "Demo notification delivered via outbox (IN_APP channel).",
                "demo:v3:fee_inapp:" + schoolCode,
                "seed-fee-inapp");

        String dedupeSent = "demo:v3:sent_sms:" + schoolCode;
        if (!notificationOutboxRepository.existsByTenantIdAndDedupeKeyAndIsDeletedFalse(tenantId, dedupeSent)) {
            NotificationOutbox row = new NotificationOutbox();
            row.setTenantId(tenantId);
            row.setEventType("ANNOUNCEMENT_SMS");
            row.setChannel("SMS");
            row.setRecipientUserId(parent.getId());
            row.setRecipientPhoneE164(parent.getPhone() != null ? parent.getPhone().trim() : null);
            row.setSubject("Holiday — Republic Day");
            row.setBodyText("Demo: school closed 26 Jan; transport runs per circular.");
            row.setDedupeKey(dedupeSent);
            row.setStatus("SENT");
            row.setAttempts(1);
            row.setProcessedAt(LocalDateTime.now().minusHours(2));
            row.setCorrelationId("seed-holiday-sms");
            row.setIsDeleted(false);
            notificationOutboxRepository.save(row);
        }
    }

    private void seedPayslipAndSalaryDisbursementDemo(String tenantId, String schoolCode) {
        if ("MRIDGE-PN".equals(schoolCode)) {
            if (!payslipRepository.existsByTenantIdAndPayrollMonthAndIsDeletedFalse(tenantId, "2026-10")) {
                teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                        .filter(t -> "s.patil@meridianridge.edu".equalsIgnoreCase(t.getEmail()))
                        .findFirst()
                        .ifPresent(tr -> {
                            Payslip p = Payslip.builder()
                                    .teacherId(tr.getId())
                                    .teacherName(tr.getFirstName() + " " + tr.getLastName())
                                    .month("October")
                                    .year(2026)
                                    .basicSalary(new BigDecimal("48000"))
                                    .totalAllowances(new BigDecimal("3000"))
                                    .totalDeductions(new BigDecimal("7800"))
                                    .netSalary(new BigDecimal("43200"))
                                    .status(Enums.PayslipStatus.GENERATED)
                                    .build();
                            p.setTenantId(tenantId);
                            p.setPayrollMonth("2026-10");
                            p.setIsDeleted(false);
                            payslipRepository.save(p);
                            flushAndClear();
                        });
            }
            payslipRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                    .filter(ps -> "2026-10".equals(ps.getPayrollMonth()))
                    .findFirst()
                    .ifPresent(ps -> {
                        if (!salaryDisbursementAttemptRepository.existsByTenantIdAndReferenceIdAndIsDeletedFalse(
                                tenantId, "DEMO-MR-SAL-PENDING")) {
                            SalaryDisbursementAttempt a = new SalaryDisbursementAttempt();
                            a.setTenantId(tenantId);
                            a.setPayslipId(ps.getId());
                            a.setTeacherId(ps.getTeacherId());
                            a.setAmount(ps.getNetSalary());
                            a.setPaymentMethod("NEFT");
                            a.setReferenceId("DEMO-MR-SAL-PENDING");
                            a.setStatus("SUBMITTED");
                            a.setGatewayPayload("{\"demo\":true,\"seed\":\"meridian\"}");
                            a.setIsDeleted(false);
                            salaryDisbursementAttemptRepository.save(a);
                        }
                    });
        }
        if ("STXHER-KOL".equals(schoolCode)) {
            payslipRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                    .filter(ps -> ps.getTeacherId() != null && Enums.PayslipStatus.PAID.equals(ps.getStatus()))
                    .findFirst()
                    .ifPresent(ps -> {
                        if (!salaryDisbursementAttemptRepository.existsByTenantIdAndReferenceIdAndIsDeletedFalse(
                                tenantId, "DEMO-STX-SAL-COMPLETE")) {
                            SalaryDisbursementAttempt a = new SalaryDisbursementAttempt();
                            a.setTenantId(tenantId);
                            a.setPayslipId(ps.getId());
                            a.setTeacherId(ps.getTeacherId());
                            a.setAmount(ps.getNetSalary());
                            a.setPaymentMethod("NEFT");
                            a.setReferenceId("DEMO-STX-SAL-COMPLETE");
                            a.setStatus("COMPLETED");
                            a.setCompletedAt(LocalDateTime.now().minusDays(14));
                            a.setGatewayPayload("{\"demo\":true,\"seed\":\"stx-archived\"}");
                            a.setIsDeleted(false);
                            salaryDisbursementAttemptRepository.save(a);
                        }
                    });
        }
    }

    private void seedPaymentWebhookDemoRow(String tenantId, String schoolCode) {
        String shaHex = "STXHER-KOL".equals(schoolCode)
                ? "1".repeat(64)
                : "2".repeat(64);
        if (paymentWebhookEventRepository.findByProviderAndPayloadSha256("razorpay", shaHex).isPresent()) {
            return;
        }
        PaymentWebhookEvent e = new PaymentWebhookEvent();
        e.setTenantId(tenantId);
        e.setProvider("razorpay");
        e.setPayloadSha256(shaHex);
        e.setExternalEventId("evt_demo_" + schoolCode.replace('-', '_'));
        e.setStatus("PROCESSED");
        e.setHttpStatus(200);
        e.setDetail("Demo webhook ingested (Java seed)");
        e.setProcessedAt(Instant.now().minusSeconds(7200));
        paymentWebhookEventRepository.save(e);
    }

    /**
     * Sample {@code import_jobs} rows for Java-seeded showcase schools. Flyway {@code t1} tenant is covered by
     * {@code V7__demo_academic_outbox_import_jobs.sql};
     * St. Xavier / Meridian are created after migrations, so the same UI data is applied here idempotently.
     */
    private void ensureImportExportDemoJobsForShowcaseTenants() {
        tenantConfigRepository.findBySchoolCode("STXHER-KOL").ifPresent(c -> seedStXImportExportDemo(c.getTenantId()));
        tenantConfigRepository.findBySchoolCode("MRIDGE-PN").ifPresent(c -> seedMeridianImportExportDemo(c.getTenantId()));
    }

    private void seedStXImportExportDemo(String tenantId) {
        if (importJobRepository.existsByTenantIdAndOriginalFilenameAndIsDeletedFalse(tenantId, "admissions-batch-2026-demo.zip")) {
            return;
        }
        User admin = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("principal@stxheritage.edu", tenantId).orElse(null);
        long classId = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .findFirst()
                .map(SchoolClass::getId)
                .orElse(1L);
        String cid = String.valueOf(classId);

        ImportJob job = new ImportJob();
        job.setTenantId(tenantId);
        if (admin != null) {
            job.setCreatedByUserId(admin.getId());
            job.setCreatedBy(String.valueOf(admin.getId()));
        }
        job.setJobType("STUDENTS");
        job.setStatus(ImportJobConstants.JOB_COMPLETED);
        job.setOriginalFilename("admissions-batch-2026-demo.zip");
        job.setTotalRows(3);
        job.setSuccessCount(2);
        job.setFailCount(1);
        job.setStartedAt(LocalDateTime.now().minusHours(2));
        job.setFinishedAt(LocalDateTime.now().minusHours(2).plusMinutes(3));
        job.setSummaryMessage("Processed 3 row(s): 2 succeeded, 1 failed.");
        importJobRepository.save(job);

        ImportJobLine l0 = importDemoLine(tenantId, job.getId(), 0, ImportJobConstants.LINE_SUCCESS,
                String.format(Locale.ROOT,
                        "{\"firstname\":\"Aarav\",\"lastname\":\"Mehta\",\"classid\":\"%s\",\"sectionid\":\"\",\"admissionnumber\":\"DEMO-IMP-001\",\"parentemail\":\"demo.parent1@example.com\"}",
                        cid),
                null, "STUDENT", null);
        ImportJobLine l1 = importDemoLine(tenantId, job.getId(), 1, ImportJobConstants.LINE_FAILED,
                String.format(Locale.ROOT, "{\"firstname\":\"\",\"lastname\":\"BrokenRow\",\"classid\":\"%s\"}", cid),
                "Missing required column: firstname", null, null);
        ImportJobLine l2 = importDemoLine(tenantId, job.getId(), 2, ImportJobConstants.LINE_SUCCESS,
                String.format(Locale.ROOT,
                        "{\"firstname\":\"Diya\",\"lastname\":\"Ghosh\",\"classid\":\"%s\",\"admissionnumber\":\"DEMO-IMP-002\",\"parentemail\":\"demo.parent2@example.com\"}",
                        cid),
                null, "STUDENT", null);
        importJobLineRepository.saveAll(List.of(l0, l1, l2));
        log.info("Seeded import/export demo job (students) for tenant {}", tenantId);
    }

    private void seedMeridianImportExportDemo(String tenantId) {
        if (importJobRepository.existsByTenantIdAndOriginalFilenameAndIsDeletedFalse(tenantId, "mridge-faculty-import-demo.zip")) {
            return;
        }
        User admin = userRepository.findByEmailAndTenantIdAndIsDeletedFalse("principal@meridianridge.edu", tenantId).orElse(null);
        ImportJob job = new ImportJob();
        job.setTenantId(tenantId);
        if (admin != null) {
            job.setCreatedByUserId(admin.getId());
            job.setCreatedBy(String.valueOf(admin.getId()));
        }
        job.setJobType("TEACHERS");
        job.setStatus(ImportJobConstants.JOB_COMPLETED);
        job.setOriginalFilename("mridge-faculty-import-demo.zip");
        job.setTotalRows(2);
        job.setSuccessCount(2);
        job.setFailCount(0);
        job.setStartedAt(LocalDateTime.now().minusDays(1));
        job.setFinishedAt(LocalDateTime.now().minusDays(1).plusMinutes(2));
        job.setSummaryMessage("Processed 2 row(s): 2 succeeded, 0 failed.");
        importJobRepository.save(job);

        ImportJobLine a = importDemoLine(tenantId, job.getId(), 0, ImportJobConstants.LINE_SUCCESS,
                "{\"firstname\":\"Neha\",\"lastname\":\"Kapoor\",\"email\":\"n.kapoor.demo@meridianridge.edu\",\"createportal\":\"Y\",\"portalrole\":\"TEACHER\"}",
                null, "TEACHER", null);
        ImportJobLine b = importDemoLine(tenantId, job.getId(), 1, ImportJobConstants.LINE_SUCCESS,
                "{\"firstname\":\"Rahul\",\"lastname\":\"Menon\",\"email\":\"r.menon.demo@meridianridge.edu\",\"createportal\":\"N\",\"portalrole\":\"TEACHER\"}",
                null, "TEACHER", null);
        importJobLineRepository.saveAll(List.of(a, b));
        log.info("Seeded import/export demo job (teachers) for tenant {}", tenantId);
    }

    private static ImportJobLine importDemoLine(String tenantId, Long jobId, int lineIndex, String status, String payloadJson,
                                                String errorMessage, String entityType, Long entityId) {
        ImportJobLine line = new ImportJobLine();
        line.setTenantId(tenantId);
        line.setJobId(jobId);
        line.setLineIndex(lineIndex);
        line.setStatus(status);
        line.setPayloadJson(payloadJson);
        line.setErrorMessage(errorMessage);
        line.setEntityType(entityType);
        line.setEntityId(entityId);
        return line;
    }


    private void flushAndClear() {
        entityManager.flush();
        entityManager.clear();
    }


    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // HELPER CLASSES
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    private static class ClassSectionPair {
        SchoolClass schoolClass;
        Section section;

        ClassSectionPair(SchoolClass sc, Section sec) {
            this.schoolClass = sc;
            this.section = sec;
        }
    }

    private static class StudentGuardianPair {
        Student student;
        Guardian father;
        Guardian mother;

        StudentGuardianPair(Student s, Guardian f, Guardian m) {
            this.student = s;
            this.father = f;
            this.mother = m;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // ENTITY CREATION METHODS
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    private TenantConfig createTenantConfig(String tenantId, String schoolCode, String name,
                                           String address, String phone, String email) {
        TenantConfig cfg = new TenantConfig();
        cfg.setTenantId(tenantId);
        cfg.setSchoolName(name);
        cfg.setSchoolCode(schoolCode);
        cfg.setAddress(address);
        cfg.setPhone(phone);
        cfg.setEmail(email);
        cfg.setLogo("https://via.placeholder.com/200x200?text=" + schoolCode);
        cfg.setPrimaryColor("#1E40AF");
        cfg.setSecondaryColor("#10B981");
        cfg.setFeaturesJson(FEATURES_JSON);
        cfg.setLibraryFinePerDay(new BigDecimal("10.00"));
        cfg.setIsActive(true);
        cfg.setIsDeleted(false);
        return tenantConfigRepository.save(cfg);
    }

    private void createLeaveEntitlementPolicy(String tenantId) {
        if (leaveEntitlementPolicyRepository.findByTenantIdAndIsDeletedFalse(tenantId).isPresent()) {
            return;
        }
        LeaveEntitlementPolicy p = new LeaveEntitlementPolicy();
        p.setTenantId(tenantId);
        p.setAnnualEntitled(24);
        p.setSickEntitled(12);
        p.setCasualEntitled(12);
        p.setPolicyYearLabel("2026-2027");
        p.setIsActive(true);
        p.setIsDeleted(false);
        leaveEntitlementPolicyRepository.save(p);
    }

    private User createUser(String tenantId, String schoolCode, String name, String email,
                           Enums.Role role, String phone) {
        if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(email, tenantId)) {
            return userRepository.findByEmailAndTenantIdAndIsDeletedFalse(email, tenantId).get();
        }

        String uniquePhone = allocateUniquePhoneForTenant(tenantId, phone, email);

        User u = new User();
        u.setTenantId(tenantId);
        u.setName(name);
        u.setEmail(email);
        u.setPassword(BCRYPT_ADMIN123);
        u.setPhone(uniquePhone);
        u.setRole(role);
        u.setSchoolCode(schoolCode);
        u.setIsActive(true);
        u.setIsDeleted(false);
        return userRepository.save(u);
    }

    /**
     * Enforces {@code uk_users_tenant_phone_active}: at most one active user per tenant + trimmed phone.
     * Teachers use +91-8… and parents +91-9… in this seeder to avoid cross-role collisions; this still
     * allocates a free number if a collision exists (re-runs, imports, or RNG overlap).
     */
    private String allocateUniquePhoneForTenant(String tenantId, String preferredPhone, String uniquenessSalt) {
        if (preferredPhone == null || preferredPhone.isBlank()) {
            return null;
        }
        String candidate = InternationalPhone.canonical(preferredPhone.trim());
        if (candidate == null) {
            throw new IllegalStateException("Demo seed generated invalid phone: " + preferredPhone);
        }
        if (!phoneExistsForTenant(tenantId, candidate)) {
            return candidate;
        }
        long h = Objects.hash(tenantId, uniquenessSalt);
        for (int i = 0; i < 2000; i++) {
            String next = InternationalPhone.canonical(
                    "+91-9" + String.format("%09d", Math.floorMod(h + (long) i * 7919L, 1_000_000_000L))
            );
            if (next != null && !phoneExistsForTenant(tenantId, next)) {
                return next;
            }
        }
        throw new IllegalStateException("Could not allocate unique phone for tenant " + tenantId);
    }

    private boolean phoneExistsForTenant(String tenantId, String canonicalPhone) {
        for (String key : InternationalPhone.compatibleLookupKeys(canonicalPhone)) {
            if (userRepository.existsByPhoneAndTenantIdAndIsDeletedFalse(key, tenantId)) {
                return true;
            }
        }
        return false;
    }

    private int normalizedTeacherCount() {
        return Math.max(20, teacherCount);
    }

    /**
     * Reuses an existing guardian row when {@link #createUser} returns the same portal user again
     * (e.g. duplicate email), satisfying {@code uk_guardians_tenant_user_active}.
     */
    private Guardian ensureGuardianProfile(String tenantId, User portalUser, String fullName, String occupation) {
        return guardianRepository.findFirstByTenantIdAndUserIdAndIsDeletedFalse(tenantId, portalUser.getId())
                .orElseGet(() -> {
                    Guardian g = new Guardian();
                    g.setTenantId(tenantId);
                    g.setFullName(fullName);
                    g.setPrimaryPhone(portalUser.getPhone());
                    g.setOccupation(occupation);
                    g.setUserId(portalUser.getId());
                    g.setIsDeleted(false);
                    if (portalUser.getEmail() != null && !portalUser.getEmail().isBlank()) {
                        g.setEmailsJson("[" + jsonStringLiteral(portalUser.getEmail()) + "]");
                    }
                    String altLine = alternateDemoPhoneLine(portalUser.getPhone());
                    if (altLine != null) {
                        g.setPhonesJson("[" + jsonStringLiteral(altLine) + "]");
                    }
                    return guardianRepository.save(g);
                });
    }

    /** JSON string literal content (quoted) for simple one-field arrays in demo JSON columns. */
    private static String jsonStringLiteral(String raw) {
        if (raw == null) {
            return "\"\"";
        }
        String esc = raw.replace("\\", "\\\\").replace("\"", "\\\"");
        return "\"" + esc + "\"";
    }

    /** Second contact line for seed data — distinct from {@code primary_phone} so UI can show “alternate” numbers. */
    private static String alternateDemoPhoneLine(String primary) {
        if (primary == null || primary.length() < 2) {
            return null;
        }
        char last = primary.charAt(primary.length() - 1);
        if (Character.isDigit(last)) {
            int d = Character.digit(last, 10);
            char next = Character.forDigit((d + 1) % 10, 10);
            return primary.substring(0, primary.length() - 1) + next;
        }
        return primary + "0";
    }

    /** Deterministic +91 mobile per student so {@code uk_users_tenant_phone_active} is not violated by RNG. */
    private static String stableDemoParentPhone(String tenantId, String admissionNumber, String slot) {
        long h = Objects.hash(tenantId, admissionNumber, slot);
        long suffix = Math.floorMod(h, 1_000_000_000L);
        return "+91-9" + String.format("%09d", suffix);
    }

    private AcademicYear createAcademicYear(String tenantId, String name, LocalDate start,
                                           LocalDate end, boolean isCurrent) {
        AcademicYear ay = new AcademicYear();
        ay.setTenantId(tenantId);
        ay.setName(name);
        ay.setStartDate(start);
        ay.setEndDate(end);
        ay.setIsCurrent(isCurrent);
        ay.setIsActive(true);
        ay.setIsDeleted(false);
        return academicYearRepository.save(ay);
    }

    private void createAcademicSubjects(String tenantId) {
        String[][] subjects = {
            {"MATH", "Mathematics", "STEM", "10"},
            {"SCI", "Science", "STEM", "20"},
            {"PHY", "Physics", "STEM", "25"},
            {"CHEM", "Chemistry", "STEM", "30"},
            {"BIO", "Biology", "STEM", "35"},
            {"CS", "Computer Science", "STEM", "40"},
            {"ENG", "English", "Languages", "50"},
            {"HIN", "Hindi", "Languages", "60"},
            {"SANS", "Sanskrit", "Languages", "65"},
            {"HIST", "History", "Social Studies", "70"},
            {"GEO", "Geography", "Social Studies", "75"},
            {"CIV", "Civics", "Social Studies", "80"},
            {"ECO", "Economics", "Social Studies", "85"},
            {"PE", "Physical Education", "Sports", "90"},
            {"ART", "Art & Craft", "Arts", "95"}
        };

        for (String[] sub : subjects) {
            if (!academicSubjectRepository.existsByTenantIdAndNameAndIsDeletedFalse(tenantId, sub[1])) {
                AcademicSubject as = new AcademicSubject();
                as.setTenantId(tenantId);
                as.setCode(sub[0]);
                as.setName(sub[1]);
                as.setCategory(sub[2]);
                as.setSortOrder(Integer.parseInt(sub[3]));
                as.setIsDeleted(false);
                academicSubjectRepository.save(as);
            }
        }
    }

    private List<Teacher> createTeachers(String tenantId, String schoolCode, int count, Random random) {
        List<Teacher> teachers = new ArrayList<>();
        String[] teacherSubjects = {"Mathematics", "Science", "English", "Hindi", "Social Studies",
                                    "Physics", "Chemistry", "Biology", "Computer Science", "Physical Education", "Art"};

        for (int i = 0; i < count; i++) {
            String firstName = (i % 2 == 0) ? MALE_FIRST_NAMES[i % MALE_FIRST_NAMES.length]
                                            : FEMALE_FIRST_NAMES[i % FEMALE_FIRST_NAMES.length];
            String lastName = LAST_NAMES[i % LAST_NAMES.length];
            String email = firstName.toLowerCase() + "." + lastName.toLowerCase() + "@" + schoolCode.toLowerCase() + ".edu.in";
            // +91-8… space: avoids clashing with parent phones (+91-9…) used in stableDemoParentPhone / V15 index
            String phone = "+91-8" + String.format("%09d", Math.floorMod(Objects.hash(tenantId, email), 1_000_000_000L));

            // One teaching subject per classroom teacher (Indian school); library staff teach Library only.
            List<String> subjects = new ArrayList<>();
            if (i == count - 2 || i == count - 1) {
                subjects.add("Library");
            } else {
                subjects.add(teacherSubjects[i % teacherSubjects.length]);
            }

            // Create user for teacher
            User teacherUser = createUser(tenantId, schoolCode, firstName + " " + lastName,
                                         email, Enums.Role.TEACHER, phone);

            // Create teacher
            Teacher t = new Teacher();
            t.setTenantId(tenantId);
            t.setFirstName(firstName);
            t.setLastName(lastName);
            t.setEmail(email);
            t.setPhone(phone);
            t.setQualification(random.nextBoolean() ? "M.Ed, B.Sc" : "B.Ed, M.A");
            t.setSpecialization(subjects.get(0));
            t.setJoinDate(LocalDate.of(2015 + random.nextInt(10), 1 + random.nextInt(12), 1 + random.nextInt(28)));
            t.setSalary(new BigDecimal(35000 + random.nextInt(40000))); // 35k-75k
            t.setStatus(Enums.TeacherStatus.ACTIVE);
            t.setUserId(teacherUser.getId());
            t.setSubjects(subjects);
            t.setBankAccountHolder(firstName + " " + lastName);
            t.setBankName(random.nextBoolean() ? "HDFC Bank" : "ICICI Bank");
            t.setBankAccountNumber("ACC" + (100000000000L + random.nextLong(900000000000L)));
            t.setBankIfsc(random.nextBoolean() ? "HDFC0001234" : "ICIC0005678");
            t.setIsDeleted(false);

            // Library duty: attach to late-index teachers only. Early rows use predictable name pools
            // (e.g. i==1 → "Ananya Verma"); those accounts must stay ordinary classroom teachers for UX demos.
            if (i == count - 2) {
                t.setLibraryStaffRole(Enums.LibraryStaffRole.LIBRARIAN);
            }
            if (i == count - 1) {
                t.setLibraryStaffRole(Enums.LibraryStaffRole.ASSISTANT);
            }

            teachers.add(teacherRepository.save(t));
        }

        return teachers;
    }

    private Map<Integer, List<ClassSectionPair>> createClassesAndSections(String tenantId, Long academicYearId,
                                                                          List<Teacher> teachers, Random random) {
        Map<Integer, List<ClassSectionPair>> classesMap = new HashMap<>();

        // Create classes 6-12 (optimized for Render free tier - 7 classes instead of 9)
        /** One distinct homeroom teacher per section (matches product rule: one class-teacher slot per teacher). */
        int homeroomOrdinal = 0;
        for (int grade = 6; grade <= 12; grade++) {
            List<ClassSectionPair> sectionsForGrade = new ArrayList<>();

            SchoolClass schoolClass = new SchoolClass();
            schoolClass.setTenantId(tenantId);
            schoolClass.setName("Class " + grade);
            schoolClass.setGrade(grade);
            schoolClass.setAcademicYearId(academicYearId);
            schoolClass.setIsDeleted(false);
            schoolClass = schoolClassRepository.save(schoolClass);

            // Create sections A, B — homeroom per section (Indian school model); distinct teachers per section.
            String[] sectionLetters = new String[]{"A", "B"};
            for (int si = 0; si < sectionLetters.length; si++) {
                String sectionName = sectionLetters[si];
                if (homeroomOrdinal >= teachers.size()) {
                    throw new IllegalStateException("Demo seed: not enough teachers for unique homeroom per section");
                }
                Teacher sectionTeacher = teachers.get(homeroomOrdinal++);
                Section section = new Section();
                section.setTenantId(tenantId);
                section.setName(sectionName);
                section.setClassId(schoolClass.getId());
                section.setCapacity(30);
                section.setStudentCount(Math.max(6, studentsPerSection));
                section.setClassTeacherId(sectionTeacher.getId());
                section.setClassTeacherName(sectionTeacher.getFirstName() + " " + sectionTeacher.getLastName());
                section.setIsDeleted(false);
                section = sectionRepository.save(section);

                sectionsForGrade.add(new ClassSectionPair(schoolClass, section));
            }

            classesMap.put(grade, sectionsForGrade);
        }

        return classesMap;
    }

    private List<Student> createStudentsWithGuardians(String tenantId, String schoolCode,
                                                      Map<Integer, List<ClassSectionPair>> classesMap,
                                                      Random random) {
        List<Student> allStudents = new ArrayList<>();
        int admissionCounter = 1000;
        int entityCounter = 0; // For batch processing

        for (int grade = 6; grade <= 12; grade++) {
            List<ClassSectionPair> sections = classesMap.get(grade);

            for (ClassSectionPair pair : sections) {
                int studentsInSection = pair.section.getStudentCount();

                for (int i = 0; i < studentsInSection; i++) {
                    boolean isMale = random.nextBoolean();
                    String firstName = isMale ? MALE_FIRST_NAMES[random.nextInt(MALE_FIRST_NAMES.length)]
                                              : FEMALE_FIRST_NAMES[random.nextInt(FEMALE_FIRST_NAMES.length)];
                    String lastName = LAST_NAMES[random.nextInt(LAST_NAMES.length)];
                    String admissionNumber = schoolCode + "-2025-" + String.format("%04d", admissionCounter++);
                    String email = firstName.toLowerCase() + "." + lastName.toLowerCase() +
                                   "@student." + schoolCode.toLowerCase() + ".edu.in";
                    String schoolCodeLower = schoolCode.toLowerCase();
                    String admToken = admissionNumber.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "");

                    // Calculate age-appropriate birth year
                    int birthYear = 2026 - grade - 6; // Rough age calculation
                    LocalDate dob = LocalDate.of(birthYear, 1 + random.nextInt(12), 1 + random.nextInt(28));

                    // Create guardians (Father + Mother)
                    String fatherFirstName = FATHER_NAMES[random.nextInt(FATHER_NAMES.length)];
                    String motherFirstName = MOTHER_NAMES[random.nextInt(MOTHER_NAMES.length)];
                    // Unique per student so createUser() does not return a shared parent user across unrelated rows
                    // (would violate uk_guardians_tenant_user_active when inserting a second guardian for same user_id).
                    String fatherEmail = fatherFirstName.toLowerCase(Locale.ROOT) + "." + lastName.toLowerCase(Locale.ROOT)
                            + ".father." + admToken + "@parent." + schoolCodeLower + ".edu.in";
                    String motherEmail = motherFirstName.toLowerCase(Locale.ROOT) + "." + lastName.toLowerCase(Locale.ROOT)
                            + ".mother." + admToken + "@parent." + schoolCodeLower + ".edu.in";
                    String fatherPhone = stableDemoParentPhone(tenantId, admissionNumber, "father");
                    String motherPhone = stableDemoParentPhone(tenantId, admissionNumber, "mother");

                    // Father user
                    User fatherUser = createUser(tenantId, schoolCode,
                                                fatherFirstName + " " + lastName,
                                                fatherEmail,
                                                Enums.Role.PARENT,
                                                fatherPhone);

                    Guardian father = ensureGuardianProfile(tenantId, fatherUser,
                            fatherFirstName + " " + lastName,
                            random.nextBoolean() ? "Business" : "Professional");

                    // Mother user
                    User motherUser = createUser(tenantId, schoolCode,
                                                motherFirstName + " " + lastName,
                                                motherEmail,
                                                Enums.Role.PARENT,
                                                motherPhone);

                    Guardian mother = ensureGuardianProfile(tenantId, motherUser,
                            motherFirstName + " " + lastName,
                            random.nextBoolean() ? "Homemaker" : "Professional");

                    // Create student
                    Student student = new Student();
                    student.setTenantId(tenantId);
                    student.setFirstName(firstName);
                    student.setLastName(lastName);
                    student.setEmail(email);
                    student.setPhone(fatherUser.getPhone()); // Use father's phone
                    student.setDateOfBirth(dob);
                    student.setGender(isMale ? Enums.Gender.MALE : Enums.Gender.FEMALE);
                    student.setClassId(pair.schoolClass.getId());
                    student.setSectionId(pair.section.getId());
                    student.setRollNumber(String.format("%02d", i + 1));
                    student.setAdmissionNumber(admissionNumber);
                    student.setAdmissionDate(LocalDate.of(2025, 4, 8));
                    student.setParentId(fatherUser.getId());
                    student.setParentName(father.getFullName());
                    student.setPrimaryContactGuardianId(father.getId());
                    student.setAddress(grade + " Sample Street, " + (schoolCode.contains("DLH") ? "Delhi" : "Mumbai"));
                    student.setBloodGroup(random.nextBoolean() ? "O+" : (random.nextBoolean() ? "A+" : "B+"));
                    student.setStatus(Enums.StudentStatus.ACTIVE);
                    student.setIsDeleted(false);
                    student = studentRepository.save(student);

                    // Map guardians to student
                    mapGuardianToStudent(tenantId, student.getId(), father.getId(),
                                        Enums.GuardianRelationType.FATHER, true);
                    mapGuardianToStudent(tenantId, student.getId(), mother.getId(),
                                        Enums.GuardianRelationType.MOTHER, false);

                    allStudents.add(student);

                    // Batch processing: flush and clear every batchSize students to manage memory
                    entityCounter++;
                    if (entityCounter % batchSize == 0) {
                        flushAndClear();
                        log.debug("  Processed {} students, flushed memory", entityCounter);
                    }
                }
            }
        }

        return allStudents;
    }

    private void mapGuardianToStudent(String tenantId, Long studentId, Long guardianId,
                                     Enums.GuardianRelationType relationType, boolean isPrimary) {
        if (studentGuardianMappingRepository.existsByTenantIdAndStudentIdAndGuardianIdAndIsDeletedFalse(tenantId, studentId, guardianId)) {
            return;
        }
        StudentGuardianMapping mapping = new StudentGuardianMapping();
        mapping.setTenantId(tenantId);
        mapping.setStudentId(studentId);
        mapping.setGuardianId(guardianId);
        mapping.setRelationType(relationType);
        mapping.setIsPrimary(isPrimary);
        mapping.setIsEmergencyContact(true);
        mapping.setEffectiveFrom(LocalDate.of(2025, 4, 1));
        mapping.setIsDeleted(false);
        studentGuardianMappingRepository.save(mapping);
    }

    /**
     * One stable PARENT login per school with {@value #QA_MULTICHILD_STUDENT_COUNT} active students linked via
     * {@code students.parent_id} and a primary {@link StudentGuardianMapping} so {@link com.school.erp.modules.guardian.service.GuardianService#findStudentsForParentUser} returns a list larger than two (QA requirement).
     * Idempotent: skips if the QA email already exists for the tenant.
     */
    private void attachQaMultiChildDemoParent(String tenantId, String schoolCode, List<Student> allStudents) {
        String schoolLower = schoolCode.toLowerCase(Locale.ROOT);
        String email = QA_MULTICHILD_EMAIL_LOCAL + "@parent." + schoolLower + ".edu.in";
        if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(email, tenantId)) {
            log.info("  [QA] Multi-child parent already present ({}), skipping re-link", email);
            return;
        }
        List<Student> picks = pickStudentsForQaMultiChildParent(allStudents, QA_MULTICHILD_STUDENT_COUNT);
        if (picks.size() < 3) {
            log.warn("  [QA] Not enough students to attach multi-child parent (need >=3, got {})", picks.size());
            return;
        }
        String phoneHint = stableDemoParentPhone(tenantId, schoolCode, "qa-multichild");
        User qaUser = createUser(
                tenantId,
                schoolCode,
                "QA Multi-Child Parent",
                email,
                Enums.Role.PARENT,
                phoneHint);
        Guardian qaGuardian = ensureGuardianProfile(tenantId, qaUser, "QA Multi-Child Parent", "QA / Testing");

        StringBuilder detail = new StringBuilder();
        for (Student st : picks) {
            softDeleteGuardianMappingsForStudent(tenantId, st.getId());
            st.setParentId(qaUser.getId());
            st.setParentName(qaGuardian.getFullName());
            studentRepository.save(st);
            mapGuardianToStudent(tenantId, st.getId(), qaGuardian.getId(), Enums.GuardianRelationType.GUARDIAN, true);
            if (detail.length() > 0) {
                detail.append("; ");
            }
            detail.append(st.getFirstName()).append(' ').append(st.getLastName())
                    .append(" (id=").append(st.getId()).append(", classId=").append(st.getClassId()).append(')');
        }
        log.info("  [QA] Multi-child parent {} → {} students: {}", email, picks.size(), detail);
    }

    /**
     * Prefer distinct {@code classId} values (breadth across timetable/fees), then fill up to {@code n}.
     */
    private static List<Student> pickStudentsForQaMultiChildParent(List<Student> allStudents, int n) {
        List<Student> sorted = allStudents.stream()
                .sorted(Comparator.comparing(Student::getId))
                .collect(Collectors.toList());
        List<Student> out = new ArrayList<>();
        Set<Long> seenClasses = new LinkedHashSet<>();
        for (Student s : sorted) {
            if (out.size() >= n) {
                break;
            }
            if (seenClasses.add(s.getClassId())) {
                out.add(s);
            }
        }
        for (Student s : sorted) {
            if (out.size() >= n) {
                break;
            }
            if (!out.contains(s)) {
                out.add(s);
            }
        }
        return out;
    }

    private void softDeleteGuardianMappingsForStudent(String tenantId, Long studentId) {
        List<StudentGuardianMapping> rows = studentGuardianMappingRepository.findByTenantIdAndStudentIdAndIsDeletedFalse(tenantId, studentId);
        for (StudentGuardianMapping m : rows) {
            m.setIsDeleted(true);
            studentGuardianMappingRepository.save(m);
        }
    }

    private void assignTeachersToClasses(String tenantId, Long academicYearId,
                                        Map<Integer, List<ClassSectionPair>> classesMap,
                                        List<Teacher> teachers, Random random) {
        String[] subjectNames = {"Mathematics", "Science", "English", "Hindi", "Social Studies",
                                "Physics", "Chemistry", "Biology", "Computer Science"};

        int teacherIdx = 0;

        for (int grade = 6; grade <= 12; grade++) {
            List<ClassSectionPair> sections = classesMap.get(grade);

            for (ClassSectionPair pair : sections) {
                // Class teacher assignment
                ClassTeacherAssignment cta = new ClassTeacherAssignment();
                cta.setTenantId(tenantId);
                cta.setAcademicYearId(academicYearId);
                cta.setClassId(pair.schoolClass.getId());
                cta.setSectionId(pair.section.getId());
                cta.setTeacherId(pair.section.getClassTeacherId());
                cta.setEffectiveFrom(LocalDate.of(2025, 4, 1));
                cta.setIsDeleted(false);
                classTeacherAssignmentRepository.save(cta);

                // Subject teacher assignments (5-7 subjects per class)
                int subjectsCount = 5 + random.nextInt(3);
                for (int s = 0; s < subjectsCount; s++) {
                    String subject = subjectNames[s % subjectNames.length];
                    Teacher teacher = teachers.get((teacherIdx++) % teachers.size());

                    SubjectTeacherAssignment sta = new SubjectTeacherAssignment();
                    sta.setTenantId(tenantId);
                    sta.setAcademicYearId(academicYearId);
                    sta.setClassId(pair.schoolClass.getId());
                    sta.setSectionId(pair.section.getId());
                    sta.setSubjectName(subject);
                    sta.setTeacherId(teacher.getId());
                    sta.setEffectiveFrom(LocalDate.of(2025, 4, 1));
                    sta.setIsDeleted(false);
                    subjectTeacherAssignmentRepository.save(sta);
                }
            }
        }
    }

    private void createFeesAndPayments(String tenantId, Long academicYearId,
                                      Map<Integer, List<ClassSectionPair>> classesMap,
                                      List<Student> allStudents, Random random) {
        Map<Long, FeeStructure> feeStructureMap = new HashMap<>();

        // Create fee structures for each class
        for (int grade = 6; grade <= 12; grade++) {
            List<ClassSectionPair> sections = classesMap.get(grade);
            SchoolClass schoolClass = sections.get(0).schoolClass;

            // Fee varies by grade (higher grades = higher fees)
            BigDecimal tuitionFee = new BigDecimal((25000 + (grade - 4) * 2000));
            BigDecimal transportFee = new BigDecimal(8000);
            BigDecimal libraryFee = new BigDecimal(1500);
            BigDecimal examFee = new BigDecimal(2500);
            BigDecimal sportsFee = new BigDecimal(2000);
            BigDecimal totalFee = tuitionFee.add(transportFee).add(libraryFee).add(examFee).add(sportsFee);

            FeeStructure fs = new FeeStructure();
            fs.setTenantId(tenantId);
            fs.setName("Annual Fee - Class " + grade);
            fs.setClassId(schoolClass.getId());
            fs.setClassName(schoolClass.getName());
            fs.setAcademicYearId(academicYearId);
            fs.setTotalAmount(totalFee);
            fs.setIsDeleted(false);
            fs = feeStructureRepository.save(fs);

            // Fee components
            saveFeeComponent(tenantId, fs.getId(), "Tuition Fee", tuitionFee, Enums.FeeComponentType.TUITION);
            saveFeeComponent(tenantId, fs.getId(), "Transport Fee", transportFee, Enums.FeeComponentType.TRANSPORT);
            saveFeeComponent(tenantId, fs.getId(), "Library Fee", libraryFee, Enums.FeeComponentType.LIBRARY);
            saveFeeComponent(tenantId, fs.getId(), "Exam Fee", examFee, Enums.FeeComponentType.MISC);
            saveFeeComponent(tenantId, fs.getId(), "Sports Fee", sportsFee, Enums.FeeComponentType.SPORTS);

            feeStructureMap.put(schoolClass.getId(), fs);
        }

        // Create fee payments for all students
        long receiptCounter = System.currentTimeMillis(); // Start counter with current timestamp
        int paymentCounter = 0; // For batch processing
        for (Student student : allStudents) {
            FeeStructure fs = feeStructureMap.get(student.getClassId());
            if (fs == null) continue;

            // Random payment status: 60% PAID, 25% PARTIAL, 15% UNPAID
            int statusRoll = random.nextInt(100);
            Enums.FeeStatus feeStatus;
            BigDecimal paidAmount;
            BigDecimal dueAmount;

            if (statusRoll < 60) {
                // PAID
                feeStatus = Enums.FeeStatus.PAID;
                paidAmount = fs.getTotalAmount();
                dueAmount = BigDecimal.ZERO;
            } else if (statusRoll < 85) {
                // PARTIAL
                feeStatus = Enums.FeeStatus.PARTIAL;
                paidAmount = fs.getTotalAmount().multiply(new BigDecimal("0.5"));
                dueAmount = fs.getTotalAmount().subtract(paidAmount);
            } else {
                // UNPAID
                feeStatus = Enums.FeeStatus.UNPAID;
                paidAmount = BigDecimal.ZERO;
                dueAmount = fs.getTotalAmount();
            }

            FeePayment payment = new FeePayment();
            payment.setTenantId(tenantId);
            payment.setStudentId(student.getId());
            payment.setStudentName(student.getFirstName() + " " + student.getLastName());
            payment.setFeeStructureId(fs.getId());
            payment.setAmount(fs.getTotalAmount());
            payment.setPaidAmount(paidAmount);
            payment.setDueAmount(dueAmount);
            payment.setStatus(feeStatus);
            payment.setPaymentDate(feeStatus == Enums.FeeStatus.UNPAID ? null : LocalDate.now().minusDays(random.nextInt(30)));
            payment.setDueDate(LocalDate.of(2025, 8, 31));
            payment.setPaymentMethod(feeStatus != Enums.FeeStatus.UNPAID ?
                                    (random.nextBoolean() ? "Online" : "Cash") : null);
            // Generate unique receipt number using counter - guaranteed unique per execution
            payment.setReceiptNumber(feeStatus != Enums.FeeStatus.UNPAID ?
                                    "RCP" + (receiptCounter++) : null);
            payment.setDiscount(BigDecimal.ZERO);
            payment.setLateFee(BigDecimal.ZERO);
            payment.setIsDeleted(false);
            feePaymentRepository.save(payment);

            // Batch processing: flush and clear every batchSize payments to manage memory
            paymentCounter++;
            if (paymentCounter % batchSize == 0) {
                flushAndClear();
                log.debug("  Processed {} fee payments, flushed memory", paymentCounter);
            }
        }
    }

    private void saveFeeComponent(String tenantId, Long feeStructureId, String name,
                                 BigDecimal amount, Enums.FeeComponentType type) {
        FeeComponent fc = new FeeComponent();
        fc.setTenantId(tenantId);
        fc.setFeeStructureId(feeStructureId);
        fc.setName(name);
        fc.setAmount(amount);
        fc.setType(type);
        fc.setIsDeleted(false);
        feeComponentRepository.save(fc);
    }

    private List<Exam> createExamsAndMarks(String tenantId, Long academicYearId,
                                           Map<Integer, List<ClassSectionPair>> classesMap,
                                           List<Student> allStudents, Random random) {
        String[] examNames = {"Unit Test 1", "Mid-Term Exam", "Unit Test 2", "Final Exam"};
        LocalDate[] examDates = {
            LocalDate.of(2025, 6, 15),
            LocalDate.of(2025, 8, 20),
            LocalDate.of(2025, 11, 10),
            LocalDate.of(2026, 2, 25)
        };
        String[] subjects = {"Mathematics", "Science", "English", "Hindi", "Social Studies"};

        List<Exam> seededExams = new ArrayList<>();
        for (int examIdx = 0; examIdx < examNames.length; examIdx++) {
            Exam exam = new Exam();
            exam.setTenantId(tenantId);
            exam.setName(examNames[examIdx]);
            exam.setAcademicYearId(academicYearId);
            exam.setStartDate(examDates[examIdx]);
            exam.setEndDate(examDates[examIdx].plusDays(7));
            exam.setStatus(examIdx <= 1 ? Enums.ExamStatus.COMPLETED : Enums.ExamStatus.UPCOMING);
            exam.setResultsPublished(examIdx == 0); // Only first exam results published
            exam.setWorkflowState(examIdx == 0 ? "PUBLISHED" : "APPROVED");
            exam.setWorkflowNote("Demo seeded exam lifecycle");
            exam.setIsDeleted(false);
            exam = examRepository.save(exam);
            seededExams.add(exam);

            // Add all classes to exam scope
            for (int grade = 6; grade <= 12; grade++) {
                List<ClassSectionPair> sections = classesMap.get(grade);
                for (ClassSectionPair pair : sections) {
                    ExamClassScope scope = new ExamClassScope();
                    scope.setTenantId(tenantId);
                    scope.setExamId(exam.getId());
                    scope.setClassId(pair.schoolClass.getId());
                    scope.setSectionId(pair.section.getId());
                    scope.setIsDeleted(false);
                    examClassScopeRepository.save(scope);

                    // Create exam schedule slots for each subject
                    for (int subIdx = 0; subIdx < subjects.length; subIdx++) {
                        ExamScheduleSlot slot = new ExamScheduleSlot();
                        slot.setTenantId(tenantId);
                        slot.setExamId(exam.getId());
                        slot.setClassId(pair.schoolClass.getId());
                        slot.setSectionId(pair.section.getId());
                        slot.setSubjectName(subjects[subIdx]);
                        slot.setExamDate(examDates[examIdx].plusDays(subIdx));
                        slot.setStartTime(LocalTime.of(9, 0));
                        slot.setEndTime(LocalTime.of(12, 0));
                        slot.setRoom("Hall " + (1 + (grade % 3)));
                        slot.setIsDeleted(false);
                        examScheduleSlotRepository.save(slot);
                    }
                }
            }

            // Create mark records for completed exams (only first exam)
            if (examIdx == 0) {
                int markCounter = 0; // For batch processing
                for (Student student : allStudents) {
                    for (String subject : subjects) {
                        double maxMarks = 100;
                        double obtained = 40 + random.nextInt(60); // 40-100 marks
                        String grade = obtained >= 90 ? "A+" :
                                      obtained >= 80 ? "A" :
                                      obtained >= 70 ? "B+" :
                                      obtained >= 60 ? "B" :
                                      obtained >= 50 ? "C" : "D";

                        MarkRecord mr = new MarkRecord();
                        mr.setTenantId(tenantId);
                        mr.setExamId(exam.getId());
                        mr.setStudentId(student.getId());
                        mr.setStudentName(student.getFirstName() + " " + student.getLastName());
                        mr.setClassId(student.getClassId());
                        mr.setSubjectName(subject);
                        mr.setMarksObtained(obtained);
                        mr.setMaxMarks(maxMarks);
                        mr.setGrade(grade);
                        mr.setIsDeleted(false);
                        markRecordRepository.save(mr);

                        // Batch processing: flush and clear every batchSize marks to manage memory
                        markCounter++;
                        if (markCounter % batchSize == 0) {
                            flushAndClear();
                            log.debug("  Processed {} mark records, flushed memory", markCounter);
                        }
                    }
                }
            }
        }
        return seededExams;
    }

    private void createExamAndReportModuleSeedData(
            String tenantId,
            Long academicYearId,
            Map<Integer, List<ClassSectionPair>> classesMap,
            List<Student> allStudents,
            List<Teacher> teachers,
            List<Exam> seededExams,
            Random random) {
        List<User> adminUsers = userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN);
        User creator = adminUsers.isEmpty() ? null : adminUsers.get(0);
        User approver = adminUsers.size() > 1 ? adminUsers.get(1) : creator;
        User publisher = creator;
        if (!teachers.isEmpty()) {
            publisher = userRepository.findByEmailAndTenantIdAndIsDeletedFalse(teachers.get(0).getEmail(), tenantId).orElse(creator);
        }
        if (!seededExams.isEmpty()) {
            seedExamOperationalData(tenantId, academicYearId, classesMap, seededExams.get(0), creator);
        }
        seedReportOperationalData(tenantId, allStudents, seededExams, creator, approver, publisher, random);
    }

    private void seedExamOperationalData(
            String tenantId,
            Long academicYearId,
            Map<Integer, List<ClassSectionPair>> classesMap,
            Exam anchorExam,
            User actor) {
        List<ExamTemplate> templates = examTemplateRepository.findByTenantIdAndIsDeletedFalseOrderByNameAsc(tenantId);
        if (templates.isEmpty()) {
            ExamTemplate template = new ExamTemplate();
            template.setTenantId(tenantId);
            template.setName("CBSE Term Pattern Template");
            template.setBoardType("CBSE");
            template.setClassBand("6-10");
            template.setDefaultMarkingScheme("THEORY_PRACTICAL");
            template.setRulesJson("{\"maxPapersPerDay\":1,\"requiresRoom\":true,\"requiresInvigilator\":true}");
            template.setIsDeleted(false);
            template = examTemplateRepository.save(template);

            ExamTemplateComponent theory = new ExamTemplateComponent();
            theory.setTenantId(tenantId);
            theory.setTemplateId(template.getId());
            theory.setComponentCode("THEORY");
            theory.setComponentLabel("Theory");
            theory.setMaxMarks(BigDecimal.valueOf(80d));
            theory.setWeightagePct(BigDecimal.valueOf(80d));
            theory.setOptional(false);
            theory.setRuleJson("{\"minPassMarks\":26}");
            theory.setIsDeleted(false);
            examTemplateComponentRepository.save(theory);

            ExamTemplateComponent practical = new ExamTemplateComponent();
            practical.setTenantId(tenantId);
            practical.setTemplateId(template.getId());
            practical.setComponentCode("PRACTICAL");
            practical.setComponentLabel("Practical");
            practical.setMaxMarks(BigDecimal.valueOf(20d));
            practical.setWeightagePct(BigDecimal.valueOf(20d));
            practical.setOptional(false);
            practical.setRuleJson("{\"minPassMarks\":7}");
            practical.setIsDeleted(false);
            examTemplateComponentRepository.save(practical);
        }

        if (examNotificationJobRepository
                .findByTenantIdAndExamIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId, anchorExam.getId(), org.springframework.data.domain.PageRequest.of(0, 1))
                .isEmpty()) {
            ExamNotificationJob job = new ExamNotificationJob();
            job.setTenantId(tenantId);
            job.setExamId(anchorExam.getId());
            job.setEventType("RESULT_PUBLISH_READY");
            job.setTargetRole("PARENT");
            job.setLocaleCode("en");
            job.setStatus("PENDING");
            job.setAttempts(0);
            job.setMaxAttempts(5);
            job.setPayloadJson("{\"examName\":\"" + anchorExam.getName() + "\",\"academicYearId\":" + academicYearId + "}");
            job.setIsDeleted(false);
            examNotificationJobRepository.save(job);
        }

        ExamEventLog eventLog = new ExamEventLog();
        eventLog.setTenantId(tenantId);
        eventLog.setExamId(anchorExam.getId());
        eventLog.setEventType("SEED_EXAM_WORKFLOW_INITIALIZED");
        eventLog.setActorUserId(actor != null ? actor.getId() : null);
        eventLog.setActorRole(actor != null && actor.getRole() != null ? actor.getRole().name() : "ADMIN");
        eventLog.setPayloadJson("{\"source\":\"demo-seed\",\"classBands\":" + classesMap.size() + "}");
        eventLog.setIsDeleted(false);
        examEventLogRepository.save(eventLog);

        ExamBulkOperationLog bulk = examBulkOperationLogRepository
                .findByTenantIdAndOperationTypeAndRequestIdAndIsDeletedFalse(tenantId, "SAVE_MARKS", "seed-marks-" + anchorExam.getId())
                .orElseGet(ExamBulkOperationLog::new);
        bulk.setTenantId(tenantId);
        bulk.setOperationType("SAVE_MARKS");
        bulk.setRequestId("seed-marks-" + anchorExam.getId());
        bulk.setExamId(anchorExam.getId());
        bulk.setStatus("COMPLETED");
        bulk.setResponseJson("{\"saved\":true,\"rows\":true}");
        bulk.setIsDeleted(false);
        examBulkOperationLogRepository.save(bulk);
    }

    private void seedReportOperationalData(
            String tenantId,
            List<Student> allStudents,
            List<Exam> seededExams,
            User creator,
            User approver,
            User publisher,
            Random random) {
        ReportTemplate template = reportTemplateRepository.findByTenantIdAndTemplateCodeAndIsDeletedFalse(tenantId, "DEMO_ACADEMIC_PERFORMANCE_V1")
                .orElseGet(() -> {
                    ReportTemplate t = new ReportTemplate();
                    t.setTenantId(tenantId);
                    t.setTemplateCode("DEMO_ACADEMIC_PERFORMANCE_V1");
                    t.setName("Demo Academic Performance Report");
                    t.setReportType("STUDENT_PERFORMANCE");
                    t.setDefaultFormat("PDF");
                    t.setPackCode("CBSE");
                    t.setLayoutConfigJson("{\"columns\":[\"studentName\",\"totalMarks\",\"percentage\",\"grade\"]}");
                    t.setFilterSchemaJson("{\"required\":[\"classId\",\"examId\"]}");
                    t.setSystemTemplate(true);
                    t.setIsDeleted(false);
                    return reportTemplateRepository.save(t);
                });

        ensureReportNotificationTemplate(tenantId, "REPORT_SHARED_DEFAULT", "IN_APP", "PARENT", "en",
                "Report available: {{reportType}}", "Your school shared {{reportType}}. Download from reports.");
        ensureReportNotificationTemplate(tenantId, "REPORT_SHARED_DEFAULT", "IN_APP", "PARENT", "hi",
                "रिपोर्ट उपलब्ध: {{reportType}}", "स्कूल ने {{reportType}} साझा किया है। रिपोर्ट अनुभाग से डाउनलोड करें।");

        Long classId = allStudents.isEmpty() ? 0L : allStudents.get(0).getClassId();
        Long examId = seededExams.isEmpty() ? 0L : seededExams.get(0).getId();

        ReportGenerationJob published = createReportJob(tenantId, template.getId(), "seed-report-published-" + tenantId,
                "COMPLETED", "PUBLISHED", creator, approver, publisher, classId, examId, true, random);
        ReportGenerationJob approved = createReportJob(tenantId, template.getId(), "seed-report-approved-" + tenantId,
                "COMPLETED", "APPROVED", creator, approver, null, classId, examId, false, random);
        createReportJob(tenantId, template.getId(), "seed-report-draft-" + tenantId,
                "COMPLETED", "DRAFT", creator, null, null, classId, examId, false, random);
        ReportGenerationJob failed = createReportJob(tenantId, template.getId(), "seed-report-failed-" + tenantId,
                "FAILED", "DRAFT", creator, null, null, classId, examId, false, random);
        failed.setAttempts(3);
        failed.setMaxAttempts(3);
        failed.setLastError("Seeded demo failure for retry test.");
        failed.setNextRetryAt(null);
        reportGenerationJobRepository.save(failed);

        createWorkflowLog(tenantId, published.getId(), "JOB_CREATED", null, "DRAFT", creator, "Seeded published flow.");
        createWorkflowLog(tenantId, approved.getId(), "JOB_APPROVED", "DRAFT", "APPROVED", approver, "Seeded approval flow.");
        createWorkflowLog(tenantId, published.getId(), "JOB_PUBLISHED", "APPROVED", "PUBLISHED", publisher, "Seeded publication flow.");
        createWorkflowLog(tenantId, failed.getId(), "JOB_FAILED", "RUNNING", "DRAFT", creator, "Seeded failure flow.");

        if (reportPublicationSnapshotRepository.findByTenantIdAndReportJobIdAndIsDeletedFalseOrderByVersionNoDesc(tenantId, published.getId()).isEmpty()) {
            ReportPublicationSnapshot v1 = new ReportPublicationSnapshot();
            v1.setTenantId(tenantId);
            v1.setReportJobId(published.getId());
            v1.setVersionNo(1);
            v1.setSnapshotType("PUBLISH");
            v1.setSnapshotJson("{\"workflowState\":\"PUBLISHED\",\"note\":\"v1\"}");
            v1.setNote("Initial publication snapshot");
            v1.setPublishedAt(LocalDateTime.now().minusDays(1));
            v1.setIsDeleted(false);
            reportPublicationSnapshotRepository.save(v1);

            ReportPublicationSnapshot v2 = new ReportPublicationSnapshot();
            v2.setTenantId(tenantId);
            v2.setReportJobId(published.getId());
            v2.setVersionNo(2);
            v2.setSnapshotType("ROLLBACK");
            v2.setSnapshotJson("{\"workflowState\":\"PUBLISHED\",\"note\":\"rollback-ready\"}");
            v2.setNote("Rollback candidate snapshot");
            v2.setPublishedAt(LocalDateTime.now());
            v2.setIsDeleted(false);
            reportPublicationSnapshotRepository.save(v2);
        }

        ReportShareDispatch dispatch = new ReportShareDispatch();
        dispatch.setTenantId(tenantId);
        dispatch.setReportJobId(published.getId());
        dispatch.setChannel("IN_APP");
        dispatch.setTargetRole("PARENT");
        dispatch.setLocaleCode("en");
        dispatch.setTemplateCode("REPORT_SHARED_DEFAULT");
        dispatch.setStatus("SENT");
        dispatch.setAttempts(1);
        dispatch.setMaxAttempts(5);
        dispatch.setDeliveredCount(Math.max(1, allStudents.size() / 2));
        dispatch.setIsDeleted(false);
        reportShareDispatchRepository.save(dispatch);

        seedAnalyticsPackConfig(tenantId, "CBSE", 85d, 60d, 75d);
        seedAnalyticsPackConfig(tenantId, "ICSE", 80d, 55d, 75d);
        seedAnalyticsPackConfig(tenantId, "STATE", 75d, 50d, 70d);
        seedAnalyticsPackConfig(tenantId, "CUSTOM", 82d, 57d, 74d);
    }

    private ReportGenerationJob createReportJob(
            String tenantId,
            Long templateId,
            String requestId,
            String status,
            String workflowState,
            User creator,
            User approver,
            User publisher,
            Long classId,
            Long examId,
            boolean includeFile,
            Random random) {
        ReportGenerationJob existing = reportGenerationJobRepository.findByTenantIdAndRequestIdAndIsDeletedFalse(tenantId, requestId).orElse(null);
        if (existing != null) {
            return existing;
        }
        ReportGenerationJob job = new ReportGenerationJob();
        job.setTenantId(tenantId);
        job.setRequestId(requestId);
        job.setTemplateId(templateId);
        job.setReportType("STUDENT_PERFORMANCE");
        job.setFormat("PDF");
        job.setFilterJson("{\"classId\":" + classId + ",\"examId\":" + examId + "}");
        job.setShareConfigJson("{\"channels\":[\"IN_APP\"],\"targetRoles\":[\"PARENT\"],\"locales\":[\"en\"],\"templateCode\":\"REPORT_SHARED_DEFAULT\"}");
        job.setStatus(status);
        job.setWorkflowState(workflowState);
        job.setWorkflowNote("Demo seeded state " + workflowState);
        job.setAttempts(0);
        job.setMaxAttempts(3);
        job.setCreatorUserId(creator != null ? creator.getId() : null);
        job.setApproverUserId(approver != null ? approver.getId() : null);
        job.setPublisherUserId(publisher != null ? publisher.getId() : null);
        job.setGeneratedAt(LocalDateTime.now().minusHours(8 + random.nextInt(18)));
        if ("APPROVED".equals(workflowState) || "PUBLISHED".equals(workflowState)) {
            job.setApprovedAt(LocalDateTime.now().minusHours(2));
        }
        if ("PUBLISHED".equals(workflowState)) {
            job.setPublishedAt(LocalDateTime.now().minusHours(1));
            job.setLastPublishIdempotencyKey("seed-publish-" + requestId);
        }
        if ("APPROVED".equals(workflowState)) {
            job.setLastApproveIdempotencyKey("seed-approve-" + requestId);
        }
        if (includeFile) {
            byte[] content = ("Demo report payload for " + requestId).getBytes(java.nio.charset.StandardCharsets.UTF_8);
            job.setFileName("report-" + requestId + ".pdf");
            job.setContentType("application/pdf");
            job.setFileContent(content);
            job.setContentSizeBytes((long) content.length);
        }
        job.setIsDeleted(false);
        return reportGenerationJobRepository.save(job);
    }

    private void createWorkflowLog(String tenantId, Long jobId, String eventCode, String fromState, String toState, User actor, String note) {
        ReportWorkflowEventLog row = new ReportWorkflowEventLog();
        row.setTenantId(tenantId);
        row.setReportJobId(jobId);
        row.setActorUserId(actor != null ? actor.getId() : null);
        row.setActorRole(actor != null && actor.getRole() != null ? actor.getRole().name() : "ADMIN");
        row.setEventCode(eventCode);
        row.setFromState(fromState);
        row.setToState(toState);
        row.setNote(note);
        row.setEventMetaJson("{\"source\":\"demo-seed\"}");
        row.setOccurredAt(LocalDateTime.now().minusMinutes(20));
        row.setIsDeleted(false);
        reportWorkflowEventLogRepository.save(row);
    }

    private void ensureReportNotificationTemplate(
            String tenantId,
            String templateCode,
            String channel,
            String role,
            String locale,
            String title,
            String message) {
        if (reportNotificationTemplateRepository
                .findByTenantIdAndTemplateCodeAndTargetRoleAndLocaleCodeAndChannelAndIsDeletedFalse(tenantId, templateCode, role, locale, channel)
                .isPresent()) {
            return;
        }
        ReportNotificationTemplate template = new ReportNotificationTemplate();
        template.setTenantId(tenantId);
        template.setTemplateCode(templateCode);
        template.setChannel(channel);
        template.setTargetRole(role);
        template.setLocaleCode(locale);
        template.setTitleTemplate(title);
        template.setMessageTemplate(message);
        template.setIsDeleted(false);
        reportNotificationTemplateRepository.save(template);
    }

    private void seedAnalyticsPackConfig(String tenantId, String packCode, double excellentPct, double laggingPct, double minAttendancePct) {
        ReportAnalyticsPackConfig config = reportAnalyticsPackConfigRepository
                .findByTenantIdAndPackCodeAndIsDeletedFalse(tenantId, packCode)
                .orElseGet(ReportAnalyticsPackConfig::new);
        config.setTenantId(tenantId);
        config.setPackCode(packCode);
        config.setConfigJson("{\"excellentPct\":" + excellentPct + ",\"laggingPct\":" + laggingPct + ",\"promotionMinAttendance\":" + minAttendancePct + "}");
        config.setFormulaJson("{\"promotionFormula\":\"performancePct >= 33 && attendancePct >= promotionMinAttendance\"}");
        config.setIsDeleted(false);
        reportAnalyticsPackConfigRepository.save(config);
    }

    private void createAttendance(String tenantId, List<Student> allStudents,
                                 List<Teacher> teachers, Random random) {
        // Last 5 days of attendance (optimized for Render free tier)
        int attendanceCounter = 0; // For batch processing
        for (int day = 5; day >= 1; day--) {
            LocalDate date = LocalDate.now().minusDays(day);

            // Skip Sundays
            if (date.getDayOfWeek().getValue() == 7) continue;

            for (Student student : allStudents) {
                // 85% present, 10% absent, 5% late
                int attendanceRoll = random.nextInt(100);
                Enums.AttendanceStatus status = attendanceRoll < 85 ? Enums.AttendanceStatus.PRESENT :
                                                attendanceRoll < 95 ? Enums.AttendanceStatus.ABSENT :
                                                Enums.AttendanceStatus.LATE;

                AttendanceRecord ar = new AttendanceRecord();
                ar.setTenantId(tenantId);
                ar.setStudentId(student.getId());
                ar.setStudentName(student.getFirstName() + " " + student.getLastName());
                ar.setClassId(student.getClassId());
                ar.setSectionId(student.getSectionId());
                ar.setDate(date);
                ar.setStatus(status);
                ar.setMarkedBy(teachers.get(random.nextInt(teachers.size())).getId());
                ar.setRemarks(status == Enums.AttendanceStatus.ABSENT ? "Absent without notice" : null);
                ar.setIsDeleted(false);
                attendanceRepository.save(ar);

                // Batch processing: flush and clear every batchSize records to manage memory
                attendanceCounter++;
                if (attendanceCounter % batchSize == 0) {
                    flushAndClear();
                    log.debug("  Processed {} attendance records, flushed memory", attendanceCounter);
                }
            }
        }
    }

    /**
     * Seeds a full Mon–Sat timetable (Indian school week) with eight periods per day.
     * <p>Iteration is <strong>slot-major</strong> (day → period → all class/sections): for each (day, period) we assign
     * distinct teachers across sections, so with 36 teachers and 14 demo sections every slot stays fully staffed
     * (no “Unassigned” rows from teacher pool exhaustion — the previous section-major loop starved later sections).</p>
     */
    private static final int DEMO_TIMETABLE_PERIODS_PER_DAY = 8;

    /**
     * Rotating subject labels — must match {@link #createTeachers} specialization pool (one subject per teacher).
     * Excludes Library (assigned only on the dedicated library slot).
     */
    private static final String[] DEMO_TIMETABLE_SUBJECTS = {
            "Mathematics", "Science", "English", "Hindi", "Social Studies",
            "Physics", "Chemistry", "Biology", "Computer Science", "Physical Education", "Art"
    };

    private void createTimetables(String tenantId, Long academicYearId,
                                 Map<Integer, List<ClassSectionPair>> classesMap,
                                 List<Teacher> teachers, Random random) {
        Enums.DayOfWeek[] days = {
                Enums.DayOfWeek.MONDAY, Enums.DayOfWeek.TUESDAY, Enums.DayOfWeek.WEDNESDAY,
                Enums.DayOfWeek.THURSDAY, Enums.DayOfWeek.FRIDAY, Enums.DayOfWeek.SATURDAY
        };

        List<ClassSectionPair> allPairs = new ArrayList<>();
        for (int grade = 6; grade <= 12; grade++) {
            List<ClassSectionPair> sections = classesMap.get(grade);
            if (sections != null) {
                allPairs.addAll(sections);
            }
        }

        int libraryPairIndex = 0;
        for (int si = 0; si < allPairs.size(); si++) {
            ClassSectionPair p = allPairs.get(si);
            int g = p.schoolClass.getGrade() != null ? p.schoolClass.getGrade() : 0;
            if (g == 8 && p.section.getName() != null && "A".equalsIgnoreCase(p.section.getName().trim())) {
                libraryPairIndex = si;
                break;
            }
        }

        /** One teacher at most per (weekday, period) tenant-wide — matches {@code uq_tt_active_teacher_slot}. */
        Map<String, Set<Long>> teacherBusyBySlotKey = new HashMap<>();
        int timetableCounter = 0;
        int globalCellOrdinal = 0;

        for (Enums.DayOfWeek day : days) {
            for (int period = 1; period <= DEMO_TIMETABLE_PERIODS_PER_DAY; period++) {
                String slotKey = day.name() + "|" + period;
                Set<Long> busyThisSlot = teacherBusyBySlotKey.computeIfAbsent(slotKey, k -> new HashSet<>());
                int sectionOrdinal = 0;
                for (ClassSectionPair pair : allPairs) {
                    int grade = pair.schoolClass.getGrade() != null ? pair.schoolClass.getGrade() : 6;
                    LocalTime startTime = LocalTime.of(8, 0).plusMinutes((long) (period - 1) * 45);
                    LocalTime endTime = startTime.plusMinutes(45);

                    boolean librarySlot =
                            period == DEMO_TIMETABLE_PERIODS_PER_DAY && sectionOrdinal == libraryPairIndex;
                    String subject;
                    Teacher teacher;
                    if (librarySlot) {
                        subject = "Library";
                        teacher = pickTeacherForTimetableSubject(teachers, subject, busyThisSlot, random);
                    } else if (day == Enums.DayOfWeek.MONDAY
                            && period == 1
                            && pair.section.getClassTeacherId() != null) {
                        Teacher hm = teachers.stream()
                                .filter(t -> pair.section.getClassTeacherId().equals(t.getId()))
                                .findFirst()
                                .orElse(null);
                        if (hm != null && !busyThisSlot.contains(hm.getId())) {
                            teacher = hm;
                            subject = primaryTimetableSubjectForHomeroom(hm);
                        } else {
                            subject = DEMO_TIMETABLE_SUBJECTS[
                                    Math.floorMod(globalCellOrdinal + sectionOrdinal, DEMO_TIMETABLE_SUBJECTS.length)];
                            teacher = pickTeacherForTimetableSubject(teachers, subject, busyThisSlot, random);
                        }
                    } else {
                        subject = DEMO_TIMETABLE_SUBJECTS[
                                Math.floorMod(globalCellOrdinal + sectionOrdinal, DEMO_TIMETABLE_SUBJECTS.length)];
                        teacher = pickTeacherForTimetableSubject(teachers, subject, busyThisSlot, random);
                    }

                    TimetableEntry tte = new TimetableEntry();
                    tte.setTenantId(tenantId);
                    tte.setAcademicYearId(academicYearId);
                    tte.setClassId(pair.schoolClass.getId());
                    tte.setSectionId(pair.section.getId());
                    tte.setDay(day);
                    tte.setPeriod(period);
                    tte.setStartTime(startTime);
                    tte.setEndTime(endTime);
                    tte.setSubjectName(subject);
                    if (teacher != null) {
                        busyThisSlot.add(teacher.getId());
                        tte.setTeacherId(teacher.getId());
                        tte.setTeacherName(teacher.getFirstName() + " " + teacher.getLastName());
                    } else {
                        tte.setTeacherId(null);
                        tte.setTeacherName("Unassigned (no free teacher for slot)");
                        log.warn(
                                "Demo seed: no matching free teacher for subject {} slot {} (class {} section {}); "
                                        + "left teacher unset to satisfy uq_tt_active_teacher_slot",
                                subject,
                                slotKey,
                                pair.schoolClass.getId(),
                                pair.section.getId());
                    }
                    if (librarySlot) {
                        tte.setRoom("Library");
                    } else {
                        tte.setRoom("Room " + (100 + grade * 10 + period));
                    }
                    tte.setIsDeleted(false);
                    timetableRepository.save(tte);

                    timetableCounter++;
                    sectionOrdinal++;
                    if (timetableCounter % batchSize == 0) {
                        flushAndClear();
                        log.debug("  Processed {} timetable entries, flushed memory", timetableCounter);
                    }
                }
                globalCellOrdinal += allPairs.size();
            }
        }
        log.info("  Timetable seed: {} rows ({} sections × {} days × {} periods), Mon–Sat, 08:00 start; "
                        + "Mon P1 uses each section's homeroom teacher where possible",
                timetableCounter, allPairs.size(), days.length, DEMO_TIMETABLE_PERIODS_PER_DAY);
    }

    /**
     * First-period Monday anchor for class-teacher sections: subject label for demo timetables.
     */
    private String primaryTimetableSubjectForHomeroom(Teacher hm) {
        String spec = Optional.ofNullable(hm.getSpecialization()).orElse("").trim();
        if (!spec.isEmpty()) {
            return spec;
        }
        if (hm.getSubjects() != null) {
            for (String s : hm.getSubjects()) {
                if (s != null && !s.isBlank()) {
                    return s.trim();
                }
            }
        }
        return "Value Education";
    }

    /**
     * Picks a teacher who can teach {@code subjectName}, not yet used for the same (day, period) — matches
     * {@code uq_tt_active_teacher_slot}. Library staff only appear on Library; classroom teachers never on Library.
     */
    private Teacher pickTeacherForTimetableSubject(
            List<Teacher> teachers, String subjectName, Set<Long> busyThisSlot, Random random) {
        List<Teacher> eligible = teachers.stream()
                .filter(t -> !busyThisSlot.contains(t.getId()))
                .filter(t -> teacherMatchesTimetableSubject(t, subjectName))
                .collect(Collectors.toList());
        if (!eligible.isEmpty()) {
            return eligible.get(random.nextInt(eligible.size()));
        }
        return null;
    }

    /**
     * Strict match: classroom teachers are assigned only to slots whose label equals their {@link Teacher#getSpecialization()}.
     * Library staff only for Library. No fallback to random teachers — avoids wrong subject on a teacher’s row.
     */
    private boolean teacherMatchesTimetableSubject(Teacher t, String subjectName) {
        if (subjectName == null || subjectName.isBlank()) {
            return false;
        }
        if ("Library".equalsIgnoreCase(subjectName.trim())) {
            return t.getLibraryStaffRole() != null;
        }
        if (t.getLibraryStaffRole() != null) {
            return false;
        }
        String want = subjectName.trim();
        String spec = Optional.ofNullable(t.getSpecialization()).orElse("").trim();
        return spec.equalsIgnoreCase(want);
    }

    private void createTransport(String tenantId, List<Student> allStudents, Random random) {
        // Create 2 routes (optimized for Render free tier)
        for (int routeNum = 1; routeNum <= 2; routeNum++) {
            // Create vehicle
            TransportVehicle vehicle = new TransportVehicle();
            vehicle.setTenantId(tenantId);
            vehicle.setRegistrationNumber("DL-01-AB-" + (1000 + routeNum));
            vehicle.setVehicleType(Enums.VehicleType.BUS);
            vehicle.setCapacity(50);
            vehicle.setModel("Ashok Leyland Bus");
            vehicle.setIsDeleted(false);
            vehicle = transportVehicleRepository.save(vehicle);

            // Create driver
            TransportDriver driver = new TransportDriver();
            driver.setTenantId(tenantId);
            driver.setFullName("Driver Name " + routeNum);
            driver.setPhone("+91-9100000" + routeNum + "00");
            driver.setLicenseNumber("DL" + routeNum + "234567890");
            driver.setIsDeleted(false);
            driver = transportDriverRepository.save(driver);

            // Create route
            TransportRoute route = new TransportRoute();
            route.setTenantId(tenantId);
            route.setName("Route " + routeNum);
            route.setVehicleNumber(vehicle.getRegistrationNumber());
            route.setVehicleId(vehicle.getId());
            route.setDriverId(driver.getId());
            route.setDriverName(driver.getFullName());
            route.setDriverPhone(driver.getPhone());
            route.setAssignedStudents(0);
            route.setIsDeleted(false);
            route = transportRouteRepository.save(route);

            // Create stops
            String[] stopNames = {"Main Gate", "Park Street", "Market Road", "Temple Junction",
                                 "School Junction", "School Gate"};
            for (int stopIdx = 0; stopIdx < stopNames.length; stopIdx++) {
                RouteStop stop = new RouteStop();
                stop.setTenantId(tenantId);
                stop.setRouteId(route.getId());
                stop.setName(stopNames[stopIdx]);
                stop.setStopOrder(stopIdx + 1);
                stop.setStopTime(LocalTime.of(7, 0).plusMinutes(stopIdx * 10));
                stop.setLatitude(BigDecimal.valueOf(28.6 + random.nextDouble() * 0.1));
                stop.setLongitude(BigDecimal.valueOf(77.2 + random.nextDouble() * 0.1));
                stop.setEstimatedTravelMinutes(stopIdx == 0 ? 0 : 10);
                stop.setIsDeleted(false);
                routeStopRepository.save(stop);
            }

            // Assign ~8 students per route (optimized for Render free tier)
            List<Student> routeStudents = allStudents.stream()
                .filter(s -> s.getId() != null)
                .filter(s -> s.getClassId() >= 6 && s.getClassId() <= 12) // Classes 6-12
                .limit(8)
                .toList();

            for (Student student : routeStudents) {
                StudentTransportMapping mapping = new StudentTransportMapping();
                mapping.setTenantId(tenantId);
                mapping.setRouteId(route.getId());
                mapping.setStudentId(student.getId());
                mapping.setStudentName(student.getFirstName() + " " + student.getLastName());
                mapping.setPickupStop(stopNames[random.nextInt(stopNames.length - 1)]);
                mapping.setDropStop(stopNames[random.nextInt(stopNames.length - 1)]);
                mapping.setIsDeleted(false);
                studentTransportMappingRepository.save(mapping);
            }

            // Update route assigned students count
            route.setAssignedStudents(routeStudents.size());
            transportRouteRepository.save(route);
        }
    }

    private void createLibrary(String tenantId, List<Student> allStudents,
                              List<Teacher> teachers, Random random) {
        // Create 30 books (optimized for Render free tier)
        String[][] bookData = {
            {"To Kill a Mockingbird", "Harper Lee", "978-0061120084", "Fiction"},
            {"1984", "George Orwell", "978-0451524935", "Fiction"},
            {"The Great Gatsby", "F. Scott Fitzgerald", "978-0743273565", "Fiction"},
            {"Harry Potter and the Philosopher's Stone", "J.K. Rowling", "978-0439708180", "Fiction"},
            {"The Hobbit", "J.R.R. Tolkien", "978-0547928227", "Fiction"},
            {"Pride and Prejudice", "Jane Austen", "978-0141439518", "Fiction"},
            {"The Catcher in the Rye", "J.D. Salinger", "978-0316769488", "Fiction"},
            {"Animal Farm", "George Orwell", "978-0452284244", "Fiction"},
            {"Lord of the Flies", "William Golding", "978-0399501487", "Fiction"},
            {"The Chronicles of Narnia", "C.S. Lewis", "978-0060598242", "Fiction"},
            {"Introduction to Algorithms", "Cormen, Leiserson, Rivest, Stein", "978-0262033848", "Computer Science"},
            {"Clean Code", "Robert C. Martin", "978-0132350884", "Computer Science"},
            {"Design Patterns", "Gang of Four", "978-0201633612", "Computer Science"},
            {"The Pragmatic Programmer", "Hunt & Thomas", "978-0135957059", "Computer Science"},
            {"Code Complete", "Steve McConnell", "978-0735619678", "Computer Science"},
            {"A Brief History of Time", "Stephen Hawking", "978-0553380163", "Science"},
            {"The Selfish Gene", "Richard Dawkins", "978-0199291151", "Science"},
            {"Cosmos", "Carl Sagan", "978-0345539434", "Science"},
            {"The Origin of Species", "Charles Darwin", "978-0451529060", "Science"},
            {"Sapiens", "Yuval Noah Harari", "978-0062316097", "History"}
        };

        List<Book> books = new ArrayList<>();

        for (int i = 0; i < 30; i++) {
            String[] data = bookData[i % bookData.length];

            Book book = new Book();
            book.setTenantId(tenantId);
            book.setTitle(data[0] + (i >= bookData.length ? " (Copy " + (i / bookData.length + 1) + ")" : ""));
            book.setAuthor(data[1]);
            book.setIsbn(data[2]);
            book.setCategory(data[3]);
            book.setTotalCopies(2 + random.nextInt(3)); // 2-4 copies per book (reduced)
            book.setAvailableCopies(book.getTotalCopies() - random.nextInt(2)); // 0-1 issued
            book.setShelfLocation("Shelf " + ((i % 10) + 1) + "-" + (char)('A' + (i % 5)));
            book.setIsDeleted(false);
            books.add(bookRepository.save(book));
        }

        // Issue 10 books to random students (optimized for Render)
        for (int i = 0; i < 10; i++) {
            Student student = allStudents.get(random.nextInt(allStudents.size()));
            Book book = books.get(random.nextInt(books.size()));

            if (book.getAvailableCopies() <= 0) continue;

            LocalDate issueDate = LocalDate.now().minusDays(random.nextInt(20));
            LocalDate dueDate = issueDate.plusDays(14);
            boolean isReturned = random.nextInt(100) < 60; // 60% returned
            LocalDate returnDate = isReturned ? issueDate.plusDays(7 + random.nextInt(10)) : null;

            Enums.BookIssueStatus status = isReturned ? Enums.BookIssueStatus.RETURNED :
                                          dueDate.isBefore(LocalDate.now()) ? Enums.BookIssueStatus.OVERDUE :
                                          Enums.BookIssueStatus.ISSUED;

            BigDecimal fine = BigDecimal.ZERO;
            if (status == Enums.BookIssueStatus.OVERDUE) {
                long daysOverdue = LocalDate.now().toEpochDay() - dueDate.toEpochDay();
                fine = new BigDecimal(daysOverdue * 10); // Rs.10 per day
            }

            BookIssue issue = new BookIssue();
            issue.setTenantId(tenantId);
            issue.setBookId(book.getId());
            issue.setBookTitle(book.getTitle());
            issue.setStudentId(student.getId());
            issue.setStudentName(student.getFirstName() + " " + student.getLastName());
            issue.setIssueDate(issueDate);
            issue.setDueDate(dueDate);
            issue.setReturnDate(returnDate);
            issue.setFine(fine);
            issue.setStatus(status);
            issue.setIsDeleted(false);
            bookIssueRepository.save(issue);

            // Update book available copies
            if (!isReturned) {
                book.setAvailableCopies(book.getAvailableCopies() - 1);
                bookRepository.save(book);
            }
        }
    }

    private void createHostel(String tenantId, List<Student> allStudents, Random random) {
        // Create 2 hostels (Boys & Girls)
        String[] hostelNames = {"Boys Hostel", "Girls Hostel"};
        String[] genderScopes = {"MALE", "FEMALE"};
        Enums.Gender[] genders = {Enums.Gender.MALE, Enums.Gender.FEMALE};

        for (int hostelIdx = 0; hostelIdx < 2; hostelIdx++) {
            Hostel hostel = new Hostel();
            hostel.setTenantId(tenantId);
            hostel.setName(hostelNames[hostelIdx]);
            hostel.setCode("H" + (hostelIdx + 1));
            hostel.setGenderScope(genderScopes[hostelIdx]);
            hostel.setIsDeleted(false);
            hostel = hostelRepository.save(hostel);

            // Create 8 rooms per hostel (optimized for Render free tier)
            for (int roomNum = 1; roomNum <= 8; roomNum++) {
                String roomType = roomNum <= 3 ? "DOUBLE" :
                                 roomNum <= 7 ? "TRIPLE" : "DORMITORY";
                int capacity = "DOUBLE".equals(roomType) ? 2 :
                              "TRIPLE".equals(roomType) ? 3 : 6;

                HostelRoom room = new HostelRoom();
                room.setTenantId(tenantId);
                room.setHostelId(hostel.getId());
                room.setRoomNumber(String.format("%03d", roomNum));
                room.setBlock(hostelIdx == 0 ? "A" : "B");
                room.setFloor(((roomNum - 1) / 5) + 1);
                room.setCapacity(capacity);
                room.setOccupancy(0);
                room.setRoomType(roomType);
                room.setOccupancyStatus(Enums.HostelOccupancyStatus.AVAILABLE);
                room.setIsDeleted(false);
                room = hostelRoomRepository.save(room);

                // Allocate students to rooms (50% occupancy)
                int allocations = capacity / 2;
                final Enums.Gender targetGender = genders[hostelIdx];
                final int targetHostelIdx = hostelIdx;
                List<Student> eligibleStudents = allStudents.stream()
                    .filter(s -> s.getGender() == targetGender)
                    .filter(s -> s.getClassId() % 2 == targetHostelIdx) // Simple filter
                    .limit(allocations)
                    .collect(Collectors.toList());

                for (Student student : eligibleStudents) {
                    HostelAllocation allocation = new HostelAllocation();
                    allocation.setTenantId(tenantId);
                    allocation.setRoomId(room.getId());
                    allocation.setRoomNumber(room.getRoomNumber());
                    allocation.setStudentId(student.getId());
                    allocation.setStudentName(student.getFirstName() + " " + student.getLastName());
                    allocation.setFromDate(LocalDate.of(2025, 4, 1));
                    allocation.setToDate(LocalDate.of(2026, 3, 31));
                    allocation.setStatus(Enums.HostelAllocationStatus.ACTIVE);
                    allocation.setIsDeleted(false);
                    hostelAllocationRepository.save(allocation);

                    room.setOccupancy(room.getOccupancy() + 1);
                }

                room.setOccupancyStatus(room.getOccupancy() >= capacity ? Enums.HostelOccupancyStatus.FULL :
                                       Enums.HostelOccupancyStatus.AVAILABLE);
                hostelRoomRepository.save(room);
            }
        }
    }

    private void createPayroll(String tenantId, List<Teacher> teachers, Random random) {
        YearMonth currentMonth = YearMonth.now();

        for (Teacher teacher : teachers) {
            // Salary structure
            BigDecimal basic = teacher.getSalary();
            BigDecimal da = basic.multiply(new BigDecimal("0.12")); // 12% DA
            BigDecimal hra = basic.multiply(new BigDecimal("0.20")); // 20% HRA
            BigDecimal ta = new BigDecimal("2000"); // Transport allowance
            BigDecimal tds = basic.multiply(new BigDecimal("0.10")); // 10% TDS
            BigDecimal pf = basic.multiply(new BigDecimal("0.12")); // 12% PF

            BigDecimal totalAllowances = da.add(hra).add(ta);
            BigDecimal totalDeductions = tds.add(pf);
            BigDecimal netSalary = basic.add(totalAllowances).subtract(totalDeductions);

            SalaryStructure ss = new SalaryStructure();
            ss.setTenantId(tenantId);
            ss.setTeacherId(teacher.getId());
            ss.setTeacherName(teacher.getFirstName() + " " + teacher.getLastName());
            ss.setBasicSalary(basic);
            ss.setNetSalary(netSalary);
            ss.setIsDeleted(false);
            ss = salaryStructureRepository.save(ss);

            // Salary components
            saveSalaryComponent(tenantId, ss.getId(), "Dearness Allowance", da, Enums.SalaryComponentType.ALLOWANCE);
            saveSalaryComponent(tenantId, ss.getId(), "House Rent Allowance", hra, Enums.SalaryComponentType.ALLOWANCE);
            saveSalaryComponent(tenantId, ss.getId(), "Transport Allowance", ta, Enums.SalaryComponentType.ALLOWANCE);
            saveSalaryComponent(tenantId, ss.getId(), "TDS", tds, Enums.SalaryComponentType.DEDUCTION);
            saveSalaryComponent(tenantId, ss.getId(), "Provident Fund", pf, Enums.SalaryComponentType.DEDUCTION);

            // Create payslips for last 3 months
            for (int monthBack = 2; monthBack >= 0; monthBack--) {
                YearMonth payrollMonth = currentMonth.minusMonths(monthBack);

                Payslip payslip = new Payslip();
                payslip.setTenantId(tenantId);
                payslip.setTeacherId(teacher.getId());
                payslip.setTeacherName(teacher.getFirstName() + " " + teacher.getLastName());
                payslip.setPayrollMonth(payrollMonth.toString());
                payslip.setMonth(String.valueOf(payrollMonth.getMonthValue()));
                payslip.setYear(payrollMonth.getYear());
                payslip.setBasicSalary(basic);
                payslip.setTotalAllowances(totalAllowances);
                payslip.setTotalDeductions(totalDeductions);
                payslip.setNetSalary(netSalary);
                payslip.setStatus(monthBack == 0 ? Enums.PayslipStatus.GENERATED : Enums.PayslipStatus.PAID);
                payslip.setPaymentDate(monthBack == 0 ? null : payrollMonth.atEndOfMonth());
                payslip.setIsDeleted(false);
                payslipRepository.save(payslip);
            }
        }
    }

    private void saveSalaryComponent(String tenantId, Long salaryStructureId, String name,
                                    BigDecimal amount, Enums.SalaryComponentType type) {
        SalaryComponent sc = new SalaryComponent();
        sc.setTenantId(tenantId);
        sc.setSalaryStructureId(salaryStructureId);
        sc.setName(name);
        sc.setAmount(amount);
        sc.setType(type);
        sc.setIsDeleted(false);
        salaryComponentRepository.save(sc);
    }

    private void createCommunication(String tenantId, String schoolCode, User adminUser, List<Teacher> teachers,
                                    Random random) {
        /*
         * Announcements: match production audience rules (see CommunicationService / findForAudience).
         * - ALL / TEACHERS / PARENTS / CLASS / SECTION rows so teacher vs parent regression sees correct boards.
         * Repository save does not run CommunicationService fan-out — no stray in-app rows from seed.
         */
        saveSeedAnnouncement(tenantId, adminUser,
                "School reopening — April 2026",
                "School reopens Monday 6 April 2026. All students must report by 8:00 AM. Transport routes are unchanged unless notified separately.",
                Enums.TargetAudience.ALL, null, null);
        saveSeedAnnouncement(tenantId, adminUser,
                "Parent–Teacher Meeting — May 2026",
                "Quarterly PTM is scheduled for Saturday 16 May 2026. Slots will open in the parent portal two weeks prior.",
                Enums.TargetAudience.ALL, null, null);
        saveSeedAnnouncement(tenantId, adminUser,
                "Mid-term examination schedule",
                "Mid-term examinations for the current academic year begin 18 August 2026. Detailed timetables are published under Exams.",
                Enums.TargetAudience.ALL, null, null);

        saveSeedAnnouncement(tenantId, adminUser,
                "[Parents] Term fee — payment window",
                "This notice is for parents and guardians only: the online fee window for Term II opens 1 May 2026. Staff do not need to take action.",
                Enums.TargetAudience.PARENTS, null, null);
        saveSeedAnnouncement(tenantId, adminUser,
                "[Parents] Student well-being survey",
                "Parents only: please complete the anonymous well-being survey linked from the parent portal by 30 June 2026.",
                Enums.TargetAudience.PARENTS, null, null);

        saveSeedAnnouncement(tenantId, adminUser,
                "[Faculty] Fire drill briefing — mandatory",
                "All teaching staff: mandatory 20-minute briefing on updated evacuation routes. Attendance will be recorded.",
                Enums.TargetAudience.TEACHERS, null, null);
        saveSeedAnnouncement(tenantId, adminUser,
                "[Faculty] Exam invigilation — sign-up",
                "Teachers: invigilation slots for mid-terms are open. Please confirm at least two slots via the academic office.",
                Enums.TargetAudience.TEACHERS, null, null);

        List<SchoolClass> classes = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId);
        SchoolClass classForBroadcast = classes.stream()
                .filter(c -> c.getGrade() != null && c.getGrade() == 9)
                .findFirst()
                .orElseGet(() -> classes.stream().findFirst().orElse(null));
        if (classForBroadcast != null) {
            saveSeedAnnouncement(tenantId, adminUser,
                    "[Class " + classForBroadcast.getGrade() + "] Field trip — consent required",
                    "This announcement targets one class only. Parents of students in this class should submit consent in the portal by the date stated in the circular.",
                    Enums.TargetAudience.CLASS, classForBroadcast.getId(), null);
            List<Section> secs = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classForBroadcast.getId());
            if (!secs.isEmpty()) {
                Section sec = secs.get(0);
                saveSeedAnnouncement(tenantId, adminUser,
                        "[Section " + sec.getName() + "] Lab safety reminder",
                        "Students in this section: lab coats are mandatory from next week. Class teachers please reinforce before practicals.",
                        Enums.TargetAudience.SECTION, classForBroadcast.getId(), sec.getId());
            }
        } else {
            log.warn("  [Communication] No school class rows — skipping CLASS/SECTION demo announcements");
        }

        seedDemoInAppNotifications(tenantId, schoolCode);

        /*
         * Direct messages: only homeroom teacher → parent of a student in that class (matches ChatDirectory / messaging policy).
         * Random teacher/parent pairs would fail authorization in production.
         */
        SchoolClass homeroomClass = null;
        Section homeroomSection = null;
        outer:
        for (SchoolClass c : classes) {
            for (Section sec : sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId())) {
                if (sec.getClassTeacherId() != null) {
                    homeroomClass = c;
                    homeroomSection = sec;
                    break outer;
                }
            }
        }
        if (homeroomClass == null) {
            homeroomClass = classes.stream().filter(cl -> cl.getClassTeacherId() != null).findFirst().orElse(null);
        }
        if (homeroomClass == null) {
            log.warn("  [Communication] No class/section with homeroom teacher — skipping demo direct messages");
            return;
        }
        Long homeroomTeacherPk = homeroomSection != null ? homeroomSection.getClassTeacherId() : homeroomClass.getClassTeacherId();
        Optional<Teacher> homeroomTeacherOpt = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(homeroomTeacherPk, tenantId);
        if (homeroomTeacherOpt.isEmpty()) {
            log.warn("  [Communication] Homeroom teacher id {} not found — skipping demo direct messages", homeroomTeacherPk);
            return;
        }
        Teacher homeroomTeacher = homeroomTeacherOpt.get();
        List<Student> inClass = homeroomSection != null
                ? studentRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, homeroomClass.getId(), homeroomSection.getId())
                : studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, homeroomClass.getId());
        LinkedHashSet<Long> distinctParentIds = new LinkedHashSet<>();
        for (Student st : inClass) {
            if (st.getParentId() != null) {
                distinctParentIds.add(st.getParentId());
            }
        }
        int n = 0;
        for (Long parentId : distinctParentIds) {
            if (n >= 5) {
                break;
            }
            User parentUser = userRepository.findByIdAndTenantIdAndIsDeletedFalse(parentId, tenantId).orElse(null);
            if (parentUser == null) {
                continue;
            }
            Student anyChild = inClass.stream().filter(s -> parentId.equals(s.getParentId())).findFirst().orElse(null);
            String childFirst = anyChild != null ? anyChild.getFirstName() : "your child";
            Message message = new Message();
            message.setTenantId(tenantId);
            message.setSenderId(homeroomTeacher.getUserId());
            message.setSenderName(homeroomTeacher.getFirstName() + " " + homeroomTeacher.getLastName());
            message.setSenderRole(Enums.Role.TEACHER.toString());
            message.setReceiverId(parentUser.getId());
            message.setReceiverName(parentUser.getName());
            message.setContent("Dear Parent, " + childFirst + " is progressing well in "
                    + homeroomClass.getName() + ". Please encourage regular attendance and punctuality.");
            message.setIsRead(random.nextBoolean());
            message.setIsDeleted(false);
            messageRepository.save(message);
            n++;
        }
    }

    private void saveSeedAnnouncement(
            String tenantId,
            User adminUser,
            String title,
            String content,
            Enums.TargetAudience audience,
            Long targetClassId,
            Long targetSectionId) {
        if (announcementRepository.existsByTenantIdAndIsDeletedFalseAndTitleIgnoreCaseAndTargetAudienceAndTargetClassIdAndTargetSectionId(
                tenantId, title, audience, targetClassId, targetSectionId)) {
            return;
        }
        Announcement announcement = new Announcement();
        announcement.setTenantId(tenantId);
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setAuthor(adminUser.getName());
        announcement.setAuthorRole(adminUser.getRole().toString());
        announcement.setTargetAudience(audience);
        announcement.setTargetClassId(targetClassId);
        announcement.setTargetSectionId(targetSectionId);
        announcement.setIsDeleted(false);
        announcementRepository.save(announcement);
    }

    /**
     * In-app rows are always per {@code user_id}; keep parent-only copy on parents and staff copy on a homeroom teacher.
     */
    private void seedDemoInAppNotifications(String tenantId, String schoolCode) {
        String qaEmail = QA_MULTICHILD_EMAIL_LOCAL + "@parent." + schoolCode.toLowerCase(Locale.ROOT) + ".edu.in";
        userRepository.findByEmailAndTenantIdAndIsDeletedFalse(qaEmail, tenantId).ifPresent(parentUser -> {
            persistDemoInAppNotification(tenantId, parentUser.getId(),
                    "[DEMO] Parent: fee statement",
                    "Sample in-app row for parents only (not a teacher inbox). Clear dues via Fees → Payments.",
                    Enums.NotificationType.INFO, false, "/app/parent/children");
            persistDemoInAppNotification(tenantId, parentUser.getId(),
                    "[DEMO] Parent: transport circular",
                    "Sample read notification for unread-count regression.",
                    Enums.NotificationType.INFO, true, "/app/inbox");
        });

        java.util.Optional<Teacher> anyHomeroomTeacher = java.util.Optional.empty();
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId)) {
            for (Section sec : sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId())) {
                if (sec.getClassTeacherId() != null) {
                    anyHomeroomTeacher = teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(sec.getClassTeacherId(), tenantId);
                    if (anyHomeroomTeacher.isPresent()) {
                        break;
                    }
                }
            }
            if (anyHomeroomTeacher.isPresent()) {
                break;
            }
        }
        if (anyHomeroomTeacher.isEmpty()) {
            anyHomeroomTeacher = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                    .filter(c -> c.getClassTeacherId() != null)
                    .findFirst()
                    .flatMap(c -> teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(c.getClassTeacherId(), tenantId));
        }
        anyHomeroomTeacher.ifPresent(t -> {
                    persistDemoInAppNotification(tenantId, t.getUserId(),
                            "[DEMO] Teacher: invigilation reminder",
                            "Sample unread staff notification (homeroom teacher).",
                            Enums.NotificationType.WARNING, false, "/app/inbox");
                    persistDemoInAppNotification(tenantId, t.getUserId(),
                            "[DEMO] Teacher: timetable published",
                            "Sample read staff notification for bell badge math.",
                            Enums.NotificationType.SUCCESS, true, "/app/timetable");
        });
    }

    private void persistDemoInAppNotification(
            String tenantId,
            Long userId,
            String title,
            String message,
            Enums.NotificationType type,
            boolean read,
            String link) {
        if (notificationRepository.existsByTenantIdAndUserIdAndIsDeletedFalseAndTitleAndMessageAndLink(
                tenantId, userId, title, message, link)) {
            return;
        }
        Notification n = Notification.builder()
                .title(title)
                .message(message)
                .type(type)
                .userId(userId)
                .isRead(read)
                .link(link)
                .build();
        n.setTenantId(tenantId);
        n.setIsDeleted(false);
        notificationRepository.save(n);
    }

    private void createDocuments(String tenantId, List<Student> allStudents,
                                List<Teacher> teachers, Random random) {
        String[][] docData = {
            {"Class 10 Syllabus 2025", "application/pdf", "GENERAL", "Syllabus for Class 10 - All Subjects"},
            {"Class 12 Syllabus 2025", "application/pdf", "GENERAL", "Syllabus for Class 12 - All Subjects"},
            {"School Rules & Regulations", "application/pdf", "GENERAL", "Complete handbook of school rules"},
            {"Annual Report 2024-25", "application/pdf", "ADMIN", "School annual report"},
            {"Fee Structure 2025-26", "application/pdf", "GENERAL", "Detailed fee structure"}
        };

        for (int i = 0; i < docData.length; i++) {
            String[] data = docData[i];
            User uploader = i % 2 == 0 ?
                userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN).get(0) :
                userRepository.findByEmailAndTenantIdAndIsDeletedFalse(teachers.get(0).getEmail(), tenantId).get();

            Document doc = new Document();
            doc.setTenantId(tenantId);
            doc.setName(data[0]);
            doc.setFileType("pdf");
            doc.setMimeType(data[1]);
            doc.setCategory(Enums.DocumentCategory.valueOf(data[2]));
            doc.setUploadedBy(uploader.getName());
            doc.setFileUrl("https://example.com/documents/" + (i + 1) + ".pdf");
            doc.setStorageKey("docs/" + (i + 1) + ".pdf");
            doc.setSizeBytes(1024L * (100 + random.nextInt(900))); // 100KB - 1MB
            doc.setOwnerType(Enums.DocumentOwnerType.GLOBAL);
            doc.setVisibilityScope(Enums.DocumentVisibilityScope.SCHOOL);
            doc.setFileVersion(1);
            doc.setIsDeleted(false);
            documentRepository.save(doc);
        }
    }

    private void createLeaveRequests(String tenantId, List<Teacher> teachers,
                                    List<Student> allStudents, Random random) {
        // Teacher leave requests
        for (int i = 0; i < 5; i++) {
            Teacher teacher = teachers.get(random.nextInt(teachers.size()));

            LocalDate startDate = LocalDate.now().plusDays(random.nextInt(30));
            LocalDate endDate = startDate.plusDays(1 + random.nextInt(3));

            Enums.LeaveStatus status = i % 3 == 0 ? Enums.LeaveStatus.APPROVED :
                                      i % 3 == 1 ? Enums.LeaveStatus.PENDING :
                                      Enums.LeaveStatus.REJECTED;

            LeaveRequest lr = new LeaveRequest();
            lr.setTenantId(tenantId);
            lr.setApplicantUserId(teacher.getUserId());
            lr.setApplicantRole(Enums.Role.TEACHER.toString());
            lr.setTeacherId(teacher.getId());
            lr.setLeaveType(Enums.LeaveTypeCode.SICK.name());
            lr.setStartDate(startDate);
            lr.setEndDate(endDate);
            lr.setDayUnit(Enums.LeaveDayUnit.FULL_DAY);
            lr.setReason("Personal health reasons");
            lr.setStatus(status);
            lr.setApproverUserId(status != Enums.LeaveStatus.PENDING ?
                userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN).get(0).getId() : null);
            lr.setApproverRemarks(status == Enums.LeaveStatus.REJECTED ? "Insufficient leave balance" :
                                 status == Enums.LeaveStatus.APPROVED ? "Approved" : null);
            lr.setIsDeleted(false);
            leaveRequestRepository.save(lr);
        }

        // Student leave requests
        for (int i = 0; i < 10; i++) {
            Student student = allStudents.get(random.nextInt(allStudents.size()));

            LocalDate startDate = LocalDate.now().minusDays(random.nextInt(10));
            LocalDate endDate = startDate.plusDays(random.nextInt(3));

            Enums.LeaveStatus status = i % 2 == 0 ? Enums.LeaveStatus.APPROVED : Enums.LeaveStatus.PENDING;

            LeaveRequest lr = new LeaveRequest();
            lr.setTenantId(tenantId);
            lr.setApplicantUserId(student.getParentId());
            lr.setApplicantRole(Enums.Role.PARENT.toString());
            lr.setStudentId(student.getId());
            lr.setLeaveType(Enums.LeaveTypeCode.SICK.name());
            lr.setStartDate(startDate);
            lr.setEndDate(endDate);
            lr.setDayUnit(Enums.LeaveDayUnit.FULL_DAY);
            lr.setReason("Fever and cold");
            lr.setStatus(status);
            lr.setApproverUserId(status == Enums.LeaveStatus.APPROVED ?
                userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN).get(0).getId() : null);
            lr.setApproverRemarks(status == Enums.LeaveStatus.APPROVED ? "Approved" : null);
            lr.setIsDeleted(false);
            leaveRequestRepository.save(lr);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════════════════════
    // CREDENTIALS SUMMARY PRINTER
    // ═══════════════════════════════════════════════════════════════════════════════════════════

    private void printCredentialsSummary() {
        log.info("");
        log.info("╔══════════════════════════════════════════════════════════════════════════════════╗");
        log.info("║                         DEMO CREDENTIALS SUMMARY                                  ║");
        log.info("║                      Password for all users: admin123                            ║");
        log.info("╚══════════════════════════════════════════════════════════════════════════════════╝");
        log.info("");
        log.info("PLATFORM SUPER ADMIN:");
        log.info("  Email: superadmin@schoolerp.com");
        log.info("");
        log.info("SCHOOL 1: Delhi Public School (DPS-DLH)");
        log.info("  School Code: DPS-DLH  |  Tenant: tenant_dps_delhi_9x4k7m2p");
        log.info("  Admin: admin@dpsdel.edu.in");
        log.info("  Teachers (10, password admin123): aarav.sharma / ananya.verma / aditya.singh / pari.kumar /");
        log.info("    vihaan.gupta / anika.agarwal / arjun.reddy / sara.patel / sai.mehta / myra.joshi @dps-dlh.edu.in");
        log.info("  Parents: see DEMO_CREDENTIALS.md (emails include .father./.mother. + admission token)");
        log.info("  QA multi-child parent (4+ children, same password admin123): qa.multichild.parent@parent.dps-dlh.edu.in");
        log.info("");
        log.info("SCHOOL 2: Kendriya Vidyalaya (KV-MUM)");
        log.info("  School Code: KV-MUM  |  Tenant: tenant_kv_mumbai_7p5n3x8q");
        log.info("  Admin: admin@kvmumbai1.gmail.com");
        log.info("  Teachers: same local-parts as DPS-DLH with @kv-mum.edu.in");
        log.info("  Parents: same pattern with @parent.kv-mum.edu.in (see DEMO_CREDENTIALS.md)");
        log.info("  QA multi-child parent: qa.multichild.parent@parent.kv-mum.edu.in");
        log.info("");
        log.info("QA multi-child E2E: see docs/DEMO_QA_MULTI_CHILD_PARENT.md");
        log.info("For complete list of all credentials, see DEMO_CREDENTIALS.md file");
        log.info("══════════════════════════════════════════════════════════════════════════════════");
    }
}