package com.school.erp.bootstrap.demo;

import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
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
import java.util.List;
import java.util.Optional;

/**
 * Optional demo rows for modules not covered in the core {@code DemoDataSeedService} baseline.
 * Idempotent per tenant via a dedicated inventory SKU marker row.
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
        this.feePaymentRepository = feePaymentRepository;
    }

    private static String markerSku(String schoolCode) {
        return "DEMO-EXT-MARKER-" + schoolCode.replace('-', '_');
    }

    @Transactional
    public void seedExtendedModuleRows(String tenantId, String schoolCode) {
        String sku = markerSku(schoolCode);
        if (inventoryItemRepository.findByTenantIdAndSkuAndIsDeletedFalse(tenantId, sku).isPresent()) {
            return;
        }

        User admin = userRepository.findByEmailAndSchoolCodeAndIsDeletedFalse(
                "STXHER-KOL".equals(schoolCode) ? "principal@stxheritage.edu" : "principal@meridianridge.edu",
                schoolCode).orElse(null);
        List<Student> students = studentRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<Teacher> teachers = teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId);
        List<SchoolClass> classes = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId);
        if (students.isEmpty() || teachers.size() < 2 || classes.isEmpty()) {
            log.warn("Skipping extended demo seed for tenant {} — core students/teachers/classes not ready", tenantId);
            return;
        }

        Student s0 = students.get(0);
        SchoolClass c0 = classes.get(0);
        Teacher tRegular = teachers.get(0);
        Teacher tCover = teachers.get(teachers.size() > 1 ? 1 : 0);

        InventoryItem marker = new InventoryItem();
        marker.setTenantId(tenantId);
        marker.setSku(sku);
        marker.setName("(Demo marker) extended module seed");
        marker.setCategory("META");
        marker.setQuantityOnHand(0);
        marker.setReorderLevel(0);
        marker.setLocation("N/A");
        inventoryItemRepository.save(marker);

        inv(tenantId, "CHALK-WB-01", "White chalk — box", "Consumables", 120, 24, "Store A");
        inv(tenantId, "LAB-ETOH-500", "Ethanol 500ml", "Science lab", 18, 6, "Lab store");
        inv(tenantId, "SPT-CONES-50", "Sports cones set", "PE", 8, 2, "Equipment room");

        OperationalStaff sec = new OperationalStaff();
        sec.setTenantId(tenantId);
        sec.setStaffRole("SECURITY");
        sec.setFullName("Bimal Chakraborty");
        sec.setPhone("+91-98310-22001");
        sec.setEmail("security.desk@" + ("STXHER-KOL".equals(schoolCode) ? "stxheritage.edu" : "meridianridge.edu"));
        sec.setEmployeeCode("OPS-SEC-01");
        operationalStaffRepository.save(sec);

        OperationalStaff nurse = new OperationalStaff();
        nurse.setTenantId(tenantId);
        nurse.setStaffRole("NURSE");
        nurse.setFullName("Anjali Menon");
        nurse.setPhone("+91-98400-33002");
        nurse.setEmployeeCode("OPS-HLTH-01");
        operationalStaffRepository.save(nurse);

        if (admin != null) {
            GatePass gp = new GatePass();
            gp.setTenantId(tenantId);
            gp.setStudentId(s0.getId());
            gp.setIssuedToName(s0.getFirstName() + " " + s0.getLastName());
            gp.setValidFrom(LocalDate.now().minusDays(1));
            gp.setValidTo(LocalDate.now().plusDays(6));
            gp.setPurpose("Inter-school debate — late exit authorized");
            gp.setIssuedByUserId(admin.getId());
            gp.setStatus("ACTIVE");
            gatePassRepository.save(gp);
        }

        VisitorLog vl = new VisitorLog();
        vl.setTenantId(tenantId);
        vl.setVisitorName("Vendor — smartboard maintenance");
        vl.setPhone("+91-90000-44033");
        vl.setPurpose("Calibrate projectors — Block B");
        vl.setHostName(admin != null ? admin.getName() : "Front office");
        vl.setBadgeNo("V-" + schoolCode.substring(0, 3) + "-901");
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

        AttendanceCoverAssignment ac = new AttendanceCoverAssignment();
        ac.setTenantId(tenantId);
        ac.setCoverDate(LocalDate.now().plusDays(1));
        ac.setPeriodNumber(1);
        ac.setClassId(c0.getId());
        ac.setSectionId(null);
        ac.setRegularTeacherId(tRegular.getId());
        ac.setCoveringTeacherId(tCover.getId());
        ac.setReason("Demo: planned leave — cover period");
        ac.setStatus("ACTIVE");
        attendanceCoverAssignmentRepository.save(ac);

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
