package com.school.erp.bootstrap.demo;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.attendance.entity.AttendanceCoverAssignment;
import com.school.erp.modules.attendance.repository.AttendanceCoverAssignmentRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.operations.entity.FeeReminderQueue;
import com.school.erp.modules.operations.entity.GatePass;
import com.school.erp.modules.operations.entity.InventoryItem;
import com.school.erp.modules.operations.entity.OperationalStaff;
import com.school.erp.modules.operations.entity.VisitorLog;
import com.school.erp.modules.operations.repository.FeeReminderQueueRepository;
import com.school.erp.modules.operations.repository.GatePassRepository;
import com.school.erp.modules.operations.repository.InventoryItemRepository;
import com.school.erp.modules.operations.repository.OperationalStaffRepository;
import com.school.erp.modules.operations.repository.VisitorLogRepository;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Optional demo rows for modules not covered in the core {@code DemoDataSeedService} baseline.
 * Idempotent per tenant via a dedicated inventory SKU marker row.
 *
 * <p>Resolves school admin and email domains from the seeded tenant (DPS-DLH, KV-MUM, etc.) — not hardcoded
 * showcase schools.</p>
 */
@Service
@Profile({"dev", "showcase-seed", "demo-seed"})
public class DemoExtendedTablesSeed {

    private static final Logger log = LoggerFactory.getLogger(DemoExtendedTablesSeed.class);

    private final InventoryItemRepository inventoryItemRepository;
    private final OperationalStaffRepository operationalStaffRepository;
    private final GatePassRepository gatePassRepository;
    private final VisitorLogRepository visitorLogRepository;
    private final FeeReminderQueueRepository feeReminderQueueRepository;
    private final AttendanceCoverAssignmentRepository attendanceCoverAssignmentRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final TeacherRepository teacherRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final TenantConfigRepository tenantConfigRepository;
    private final FeePaymentRepository feePaymentRepository;

    public DemoExtendedTablesSeed(
            InventoryItemRepository inventoryItemRepository,
            OperationalStaffRepository operationalStaffRepository,
            GatePassRepository gatePassRepository,
            VisitorLogRepository visitorLogRepository,
            FeeReminderQueueRepository feeReminderQueueRepository,
            AttendanceCoverAssignmentRepository attendanceCoverAssignmentRepository,
            UserRepository userRepository,
            StudentRepository studentRepository,
            TeacherRepository teacherRepository,
            SchoolClassRepository schoolClassRepository,
            SectionRepository sectionRepository,
            TenantConfigRepository tenantConfigRepository,
            FeePaymentRepository feePaymentRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.operationalStaffRepository = operationalStaffRepository;
        this.gatePassRepository = gatePassRepository;
        this.visitorLogRepository = visitorLogRepository;
        this.feeReminderQueueRepository = feeReminderQueueRepository;
        this.attendanceCoverAssignmentRepository = attendanceCoverAssignmentRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.teacherRepository = teacherRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.tenantConfigRepository = tenantConfigRepository;
        this.feePaymentRepository = feePaymentRepository;
    }

    private static String markerSku(String schoolCode) {
        return "DEMO-EXT-MARKER-" + schoolCode.replace('-', '_');
    }

    private Optional<User> resolveSchoolAdmin(String tenantId) {
        List<User> admins = userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.ADMIN);
        return admins.stream().findFirst();
    }

    /** Domain for operational @school emails (from tenant office email). */
    private String emailDomainForTenant(String tenantId) {
        return tenantConfigRepository.findByTenantId(tenantId)
                .map(TenantConfig::getEmail)
                .filter(e -> e != null && e.contains("@"))
                .map(e -> e.substring(e.indexOf('@') + 1).trim())
                .orElse("school.local");
    }

    @Transactional
    public void seedExtendedModuleRows(String tenantId, String schoolCode) {
        String sku = markerSku(schoolCode);
        if (inventoryItemRepository.findByTenantIdAndSkuAndIsDeletedFalse(tenantId, sku).isPresent()) {
            return;
        }

        Optional<User> adminOpt = resolveSchoolAdmin(tenantId);
        List<Student> students = studentRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<Teacher> teachers = teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<SchoolClass> classes = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId);
        if (students.isEmpty() || teachers.size() < 2 || classes.isEmpty()) {
            log.warn("Skipping extended demo seed for tenant {} — core students/teachers/classes not ready", tenantId);
            return;
        }

        String mailDomain = emailDomainForTenant(tenantId);

        // Prefer mid/high grade class with sections for realistic cover + gate pass labelling
        SchoolClass c0 = classes.stream()
                .filter(c -> c.getGrade() != null && c.getGrade() >= 6)
                .min(Comparator.comparingInt(SchoolClass::getGrade))
                .orElse(classes.get(0));

        List<Section> secs = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c0.getId());
        Long sectionIdForCover = secs.isEmpty() ? null : secs.get(0).getId();

        Student s0 = students.stream()
                .filter(s -> c0.getId().equals(s.getClassId()))
                .findFirst()
                .orElse(students.get(0));

        InventoryItem marker = new InventoryItem();
        marker.setTenantId(tenantId);
        marker.setSku(sku);
        marker.setName("(Demo marker) extended module seed");
        marker.setCategory("META");
        marker.setQuantityOnHand(0);
        marker.setReorderLevel(0);
        marker.setLocation("N/A");
        inventoryItemRepository.save(marker);

        inv(tenantId, "CHALK-WB-01", "White chalk — box", "Consumables", 120, 24, "Store A — " + schoolCode);
        inv(tenantId, "LAB-ETOH-500", "Ethanol 500ml", "Science lab", 18, 6, "Lab store");
        inv(tenantId, "SPT-CONES-50", "Sports cones set", "PE", 8, 2, "Equipment room");

        OperationalStaff sec = new OperationalStaff();
        sec.setTenantId(tenantId);
        sec.setStaffRole("SECURITY");
        sec.setFullName("Bimal Chakraborty");
        sec.setPhone("+91-98310-22001");
        sec.setEmail("security.desk@" + mailDomain);
        sec.setEmployeeCode("OPS-SEC-01-" + schoolCode.replace('-', '_'));
        operationalStaffRepository.save(sec);

        OperationalStaff nurse = new OperationalStaff();
        nurse.setTenantId(tenantId);
        nurse.setStaffRole("NURSE");
        nurse.setFullName("Anjali Menon");
        nurse.setPhone("+91-98400-33002");
        nurse.setEmail("health.office@" + mailDomain);
        nurse.setEmployeeCode("OPS-HLTH-01-" + schoolCode.replace('-', '_'));
        operationalStaffRepository.save(nurse);

        if (adminOpt.isPresent()) {
            User admin = adminOpt.get();
            GatePass gp = new GatePass();
            gp.setTenantId(tenantId);
            gp.setStudentId(s0.getId());
            gp.setIssuedToName(s0.getFirstName() + " " + s0.getLastName());
            gp.setValidFrom(LocalDate.now().minusDays(1));
            gp.setValidTo(LocalDate.now().plusDays(6));
            gp.setPurpose("Inter-school debate — late exit authorized (demo)");
            gp.setIssuedByUserId(admin.getId());
            gp.setStatus("ACTIVE");
            gatePassRepository.save(gp);
        }

        VisitorLog vl = new VisitorLog();
        vl.setTenantId(tenantId);
        vl.setVisitorName("Vendor — smartboard maintenance");
        vl.setPhone("+91-90000-44033");
        vl.setPurpose("Calibrate projectors — Block B (demo)");
        vl.setHostName(adminOpt.map(User::getName).orElse("Front office"));
        vl.setBadgeNo("V-" + schoolCode.replace("-", "").substring(0, Math.min(5, schoolCode.length())) + "-901");
        vl.setCheckInAt(LocalDateTime.now().minusHours(3));
        vl.setCheckOutAt(LocalDateTime.now().minusHours(1));
        vl.setStatus("CHECKED_OUT");
        visitorLogRepository.save(vl);

        Optional<FeePayment> partial = feePaymentRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(p -> p.getDueAmount() != null && p.getDueAmount().compareTo(BigDecimal.ZERO) > 0)
                .findFirst();
        if (partial.isPresent()) {
            FeeReminderQueue q = new FeeReminderQueue();
            q.setTenantId(tenantId);
            q.setStudentId(partial.get().getStudentId());
            q.setFeePaymentId(partial.get().getId());
            q.setDueDate(partial.get().getDueDate());
            q.setChannel("EMAIL");
            q.setStatus("PENDING");
            q.setScheduledAt(LocalDateTime.now().plusHours(2));
            feeReminderQueueRepository.save(q);
        }

        // Last five calendar days (including today): one active cover per day so teacher timetable + ops demos show history.
        LocalDate today = LocalDate.now();
        for (int i = 0; i < 5; i++) {
            LocalDate coverDay = today.minusDays(i);
            Teacher regular = teachers.get(i % teachers.size());
            Teacher cover = teachers.stream()
                    .filter(t -> !t.getId().equals(regular.getId()))
                    .findFirst()
                    .orElse(teachers.get((i + 1) % teachers.size()));
            AttendanceCoverAssignment ac = new AttendanceCoverAssignment();
            ac.setTenantId(tenantId);
            ac.setCoverDate(coverDay);
            ac.setPeriodNumber(1 + (i % 6));
            ac.setClassId(c0.getId());
            ac.setSectionId(sectionIdForCover);
            ac.setRegularTeacherId(regular.getId());
            ac.setCoveringTeacherId(cover.getId());
            ac.setReason("Demo: attendance cover " + (i + 1) + "/5 — " + schoolCode + " (" + coverDay + ")");
            ac.setStatus("ACTIVE");
            attendanceCoverAssignmentRepository.save(ac);
        }

        log.info("Extended demo module rows applied for tenant {} (school_code={})", tenantId, schoolCode);
    }

    private void inv(String tenantId, String sku, String name, String cat, int qty, int reorder, String loc) {
        InventoryItem i = new InventoryItem();
        i.setTenantId(tenantId);
        i.setSku(sku);
        i.setName(name);
        i.setCategory(cat);
        i.setQuantityOnHand(qty);
        i.setReorderLevel(reorder);
        i.setLocation(loc);
        inventoryItemRepository.save(i);
    }
}
