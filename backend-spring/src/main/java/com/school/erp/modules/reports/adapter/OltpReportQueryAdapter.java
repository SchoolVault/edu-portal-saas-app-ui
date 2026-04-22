package com.school.erp.modules.reports.adapter;

import com.school.erp.common.jpa.EntitySnapshotCollections;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.modules.exams.repository.MarkRecordRepository;
import com.school.erp.modules.exams.entity.Exam;
import com.school.erp.modules.exams.repository.ExamRepository;
import com.school.erp.modules.fees.repository.FeePaymentRepository;
import com.school.erp.modules.attendance.repository.AttendanceRepository;
import com.school.erp.modules.academic.entity.ClassTeacherAssignment;
import com.school.erp.modules.academic.repository.AcademicYearRepository;
import com.school.erp.modules.academic.repository.ClassTeacherAssignmentRepository;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.modules.chat.entity.ChatConversation;
import com.school.erp.modules.chat.entity.ChatParticipant;
import com.school.erp.modules.chat.repository.ChatConversationRepository;
import com.school.erp.modules.chat.repository.ChatParticipantRepository;
import com.school.erp.modules.communication.repository.AnnouncementRepository;
import com.school.erp.modules.notification.repository.NotificationRepository;
import com.school.erp.modules.reports.dto.ParentDashboardDtos;
import com.school.erp.modules.reports.dto.ReportDashboardDTOs;
import com.school.erp.modules.reports.port.ReportQueryPort;
import com.school.erp.modules.guardian.service.GuardianService;
import com.school.erp.modules.exams.service.ExamService;
import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.common.enums.Enums;
import com.school.erp.modules.attendance.entity.AttendanceRecord;
import com.school.erp.modules.fees.entity.FeePayment;
import com.school.erp.modules.timetable.entity.TimetableEntry;
import com.school.erp.modules.timetable.repository.TimetableRepository;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;
import java.util.Locale;

@Component
public class OltpReportQueryAdapter implements ReportQueryPort {

    private static final Logger log = LoggerFactory.getLogger(OltpReportQueryAdapter.class);

    private final StudentRepository studentRepo;
    private final TeacherRepository teacherRepo;
    private final MarkRecordRepository markRepo;
    private final FeePaymentRepository feePaymentRepo;
    private final AttendanceRepository attendanceRepo;
    private final NotificationRepository notificationRepo;
    private final ExamRepository examRepo;
    private final TimetableRepository timetableRepo;
    private final SchoolClassRepository classRepo;
    private final SectionRepository sectionRepo;
    private final AcademicYearRepository academicYearRepo;
    private final ClassTeacherAssignmentRepository classTeacherAssignmentRepo;
    private final ChatConversationRepository chatConversationRepo;
    private final ChatParticipantRepository chatParticipantRepo;
    private final AnnouncementRepository announcementRepo;
    private final GuardianService guardianService;
    private final ExamService examService;

    private static final int PARENT_ATTENDANCE_THRESHOLD = 85;
    private static final double HIGH_FEE_ABS_INR = 15000d;

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardKPIs() {
        String tenantId = TenantContext.getTenantId();
        log.debug("Building dashboard KPIs tenantId={}", tenantId);
        Map<String, Object> kpis = new HashMap<>();
        kpis.put("totalStudents", studentRepo.countByTenantIdAndIsDeletedFalse(tenantId));
        kpis.put("totalTeachers", teacherRepo.countByTenantIdAndIsDeletedFalse(tenantId));
        var payments = feePaymentRepo.findByTenantIdAndIsDeletedFalse(tenantId);
        double totalCollected = payments.stream().mapToDouble(p -> p.getPaidAmount() != null ? p.getPaidAmount().doubleValue() : 0).sum();
        double totalPending = payments.stream().mapToDouble(p -> p.getDueAmount() != null ? p.getDueAmount().doubleValue() : 0).sum();
        kpis.put("feesCollected", totalCollected);
        kpis.put("feesPending", totalPending);
        kpis.put("collectionRate", totalCollected + totalPending > 0 ? Math.round((totalCollected / (totalCollected + totalPending)) * 100) : 0);
        log.info("Dashboard KPIs tenantId={} students={} teachers={}", tenantId, kpis.get("totalStudents"), kpis.get("totalTeachers"));
        return kpis;
    }

    @Transactional(readOnly = true)
    public ReportDashboardDTOs.AdminDashboardResponse getAdminDashboard() {
        String tenantId = TenantContext.getTenantId();
        log.debug("Building admin dashboard tenantId={}", tenantId);
        LocalDate today = LocalDate.now();
        var payments = feePaymentRepo.findByTenantIdAndIsDeletedFalse(tenantId);

        ReportDashboardDTOs.AdminDashboardResponse response = new ReportDashboardDTOs.AdminDashboardResponse();
        response.setTotalStudents(studentRepo.countByTenantIdAndIsDeletedFalse(tenantId));
        response.setTotalTeachers(teacherRepo.countByTenantIdAndIsDeletedFalse(tenantId));
        response.setFeesCollected(payments.stream().mapToDouble(p -> p.getPaidAmount() != null ? p.getPaidAmount().doubleValue() : 0).sum());
        response.setFeesPending(payments.stream().mapToDouble(p -> p.getDueAmount() != null ? p.getDueAmount().doubleValue() : 0).sum());
        response.setCollectionRate(response.getFeesCollected() + response.getFeesPending() > 0 ? Math.round((response.getFeesCollected() / (response.getFeesCollected() + response.getFeesPending())) * 100) : 0);
        response.setMonthlyAdmissions(buildMonthlyAdmissions(tenantId));
        response.setMonthlyCollections(buildMonthlyCollections(payments));
        response.setAttendanceOverview(buildAttendanceOverview(tenantId, today));
        List<ReportDashboardDTOs.ActivityItem> activities = notificationRepo.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, TenantContext.getUserId()).stream()
                .limit(5)
                .map(notification -> new ReportDashboardDTOs.ActivityItem(notification.getTitle(), notification.getMessage(), notification.getType() != null ? notification.getType().name().toLowerCase() : "info", notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : ""))
                .collect(Collectors.toList());
        if (activities.isEmpty()) {
            activities = announcementRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream()
                    .limit(5)
                    .map(a -> new ReportDashboardDTOs.ActivityItem(a.getTitle(), a.getContent() != null && a.getContent().length() > 120 ? a.getContent().substring(0, 117) + "…" : (a.getContent() != null ? a.getContent() : ""), "info", a.getCreatedAt() != null ? a.getCreatedAt().toString() : ""))
                    .collect(Collectors.toList());
        }
        response.setRecentActivities(activities);
        response.setUpcomingEvents(examRepo.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(exam -> exam.getEndDate() == null || !exam.getEndDate().isBefore(today))
                .sorted(Comparator.comparing(exam -> exam.getStartDate() != null ? exam.getStartDate() : today))
                .limit(5)
                .map(exam -> {
                    ReportDashboardDTOs.UpcomingEvent event = new ReportDashboardDTOs.UpcomingEvent();
                    event.setId(exam.getId());
                    event.setTitle(exam.getName());
                    event.setDate(exam.getStartDate() != null ? exam.getStartDate().toString() : "");
                    event.setDescription("Exam window ends " + (exam.getEndDate() != null ? exam.getEndDate() : "TBD"));
                    return event;
                })
                .collect(Collectors.toList()));
        List<ReportDashboardDTOs.ClassHomeroomGap> homeroomGaps = classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .filter(c -> c.getClassTeacherId() == null)
                .map(c -> new ReportDashboardDTOs.ClassHomeroomGap(c.getId(), c.getName(), c.getGrade()))
                .collect(Collectors.toList());
        response.setClassesWithoutHomeroomTeacher(homeroomGaps);
        log.info("Admin dashboard ready tenantId={} students={} activities={} homeroomGaps={}", tenantId, response.getTotalStudents(), response.getRecentActivities().size(), homeroomGaps.size());
        return response;
    }

    @Transactional(readOnly = true)
    public ReportDashboardDTOs.TeacherDashboardResponse getTeacherDashboard(String monthParam) {
        String tenantId = TenantContext.getTenantId();
        log.debug("Building teacher dashboard tenantId={} userId={} month={}", tenantId, TenantContext.getUserId(), monthParam);
        LocalDate today = LocalDate.now();
        DayOfWeek dayOfWeek = today.getDayOfWeek();
        YearMonth ym;
        try {
            ym = monthParam != null && !monthParam.isBlank() ? YearMonth.parse(monthParam) : YearMonth.from(today);
        } catch (Exception e) {
            ym = YearMonth.from(today);
        }
        ReportDashboardDTOs.TeacherDashboardResponse response = new ReportDashboardDTOs.TeacherDashboardResponse();
        var teacherOpt = teacherRepo.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, TenantContext.getUserId());
        if (teacherOpt.isEmpty()) {
            log.warn("Teacher dashboard: no teacher profile for userId={} tenantId={}", TenantContext.getUserId(), tenantId);
            return response;
        }

        var teacher = teacherOpt.get();
        var schedule = timetableRepo.findByTenantIdAndTeacherIdAndIsDeletedFalse(tenantId, teacher.getId());
        Map<Long, String> classNames = classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .collect(Collectors.toMap(cls -> cls.getId(), cls -> cls.getName()));
        Map<Long, String> sectionNames = classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .flatMap(cls -> sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, cls.getId()).stream())
                .collect(Collectors.toMap(section -> section.getId(), section -> section.getName()));
        Set<Long> classIds = schedule.stream().map(entry -> entry.getClassId()).filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> studentIds = new HashSet<>();
        classIds.forEach(classId -> studentRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId).forEach(student -> studentIds.add(student.getId())));

        response.setAssignedClasses(classIds.size());
        response.setUpcomingExams(examRepo.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(exam -> exam.getStatus() != null && exam.getStatus() != Enums.ExamStatus.COMPLETED)
                .count());
        long unread = notificationRepo.countByTenantIdAndUserIdAndIsReadFalse(tenantId, TenantContext.getUserId());
        response.setUnreadNotifications(unread);
        List<ReportDashboardDTOs.TeacherScheduleItem> todaySlots = schedule.stream()
                .filter(entry -> entry.getDay() != null && entry.getDay().name().equals(dayOfWeek.name()))
                .sorted(Comparator.comparingInt(entry -> entry.getPeriod() != null ? entry.getPeriod() : 0))
                .map(entry -> toScheduleItem(entry, classNames, sectionNames))
                .collect(Collectors.toList());
        if (todaySlots.isEmpty()) {
            todaySlots = schedule.stream()
                    .sorted(Comparator.comparing((com.school.erp.modules.timetable.entity.TimetableEntry e) -> e.getDay() != null ? e.getDay().ordinal() : 0)
                            .thenComparing(e -> e.getPeriod() != null ? e.getPeriod() : 0))
                    .limit(8)
                    .map(entry -> toScheduleItem(entry, classNames, sectionNames))
                    .collect(Collectors.toList());
        }
        response.setTodaySchedule(todaySlots);

        long pendingAtt = schedule.stream()
                .filter(entry -> entry.getDay() != null && entry.getDay().name().equals(dayOfWeek.name()))
                .filter(entry -> {
                    Long cid = entry.getClassId();
                    if (cid == null) {
                        return false;
                    }
                    Long sid = entry.getSectionId();
                    if (sid != null) {
                        return attendanceRepo.findByTenantIdAndClassIdAndSectionIdAndDate(tenantId, cid, sid, today).isEmpty();
                    }
                    return attendanceRepo.findByTenantIdAndClassIdAndDateBetweenAndIsDeletedFalse(tenantId, cid, today, today).isEmpty();
                })
                .count();
        response.setPendingAttendanceSessions(pendingAtt);

        Long currentAyId = academicYearRepo.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .filter(y -> Boolean.TRUE.equals(y.getIsCurrent()))
                .findFirst()
                .map(y -> y.getId())
                .orElse(null);
        if (currentAyId != null) {
            for (var a : classTeacherAssignmentRepo.findActiveForTeacher(tenantId, teacher.getId(), today)) {
                if (!currentAyId.equals(a.getAcademicYearId())) {
                    continue;
                }
                String cname = classNames.getOrDefault(a.getClassId(), "Class");
                String sname = a.getSectionId() != null ? sectionNames.getOrDefault(a.getSectionId(), "") : "";
                int count = a.getSectionId() != null
                        ? studentRepo.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, a.getClassId(), a.getSectionId()).size()
                        : studentRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, a.getClassId()).size();
                response.getClassTeacherOf().add(new ReportDashboardDTOs.TeacherClassTeacherRow(a.getClassId(), cname, sname, a.getSectionId(), count));
            }
        }

        if (!response.getClassTeacherOf().isEmpty()) {
            response.setStudentsAssigned(response.getClassTeacherOf().get(0).getTotalStudents());
        } else {
            response.setStudentsAssigned(classIds.isEmpty() ? 0 : studentIds.size());
        }

        boolean homeroomMarked = false;
        if (!response.getClassTeacherOf().isEmpty()) {
            ReportDashboardDTOs.TeacherClassTeacherRow row = response.getClassTeacherOf().get(0);
            Long cid = row.getClassId();
            Long sid = row.getSectionId();
            if (cid != null && sid != null) {
                homeroomMarked = !attendanceRepo.findByTenantIdAndClassIdAndSectionIdAndDate(tenantId, cid, sid, today).isEmpty();
            } else if (cid != null) {
                homeroomMarked = !attendanceRepo.findByTenantIdAndClassIdAndDateBetweenAndIsDeletedFalse(tenantId, cid, today, today).isEmpty();
            }
        }
        response.setHomeroomTodayAttendanceComplete(homeroomMarked);

        response.setMessageQueue(new ArrayList<>());
        response.setAttendanceTrend(buildTeacherMonthlyAttendanceTrend(tenantId, classIds));
        response.setHomeroomAttendance(buildTeacherHomeroomAttendance(tenantId, teacher.getId(), classNames, sectionNames, ym, currentAyId, today));
        response.setRecentActivities(buildTeacherRecentActivityFeed(tenantId));

        List<ReportDashboardDTOs.ActivityItem> pendingTasks = notificationRepo.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, TenantContext.getUserId()).stream()
                .filter(notification -> !Boolean.TRUE.equals(notification.getIsRead()))
                .limit(5)
                .map(notification -> new ReportDashboardDTOs.ActivityItem(notification.getTitle(), notification.getMessage(), notification.getType() != null ? notification.getType().name().toLowerCase() : "info", notification.getCreatedAt() != null ? notification.getCreatedAt().toString() : ""))
                .collect(Collectors.toList());
        if (pendingTasks.isEmpty()) {
            pendingTasks = examRepo.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                    .filter(exam -> exam.getStatus() != Enums.ExamStatus.COMPLETED)
                    .limit(3)
                    .map(exam -> new ReportDashboardDTOs.ActivityItem("Prepare " + exam.getName(), "Review upcoming schedule and mark entry readiness", "info", exam.getStartDate() != null ? exam.getStartDate().toString() : ""))
                    .collect(Collectors.toList());
        }
        response.setPendingTasks(pendingTasks);
        log.info("Teacher dashboard ready teacherId={} assignedClasses={}", teacher.getId(), response.getAssignedClasses());
        return response;
    }

    private List<ReportDashboardDTOs.TeacherAttendanceTrendPoint> buildTeacherMonthlyAttendanceTrend(String tenantId, Set<Long> classIds) {
        List<ReportDashboardDTOs.TeacherAttendanceTrendPoint> out = new ArrayList<>();
        YearMonth end = YearMonth.now();
        YearMonth start = end.minusMonths(5);
        for (YearMonth ym = start; !ym.isAfter(end); ym = ym.plusMonths(1)) {
            LocalDate from = ym.atDay(1);
            LocalDate to = ym.atEndOfMonth();
            long present = 0;
            long total = 0;
            for (Long cid : classIds) {
                List<AttendanceRecord> recs = attendanceRepo.findByTenantIdAndClassIdAndDateBetweenAndIsDeletedFalse(tenantId, cid, from, to);
                for (AttendanceRecord a : recs) {
                    total++;
                    if (a.getStatus() == Enums.AttendanceStatus.PRESENT) {
                        present++;
                    }
                }
            }
            ReportDashboardDTOs.TeacherAttendanceTrendPoint pt = new ReportDashboardDTOs.TeacherAttendanceTrendPoint();
            pt.setMonth(ym.toString());
            pt.setPresentPercent(total == 0 ? 0d : (100.0 * present / total));
            out.add(pt);
        }
        return out;
    }

    private ReportDashboardDTOs.TeacherHomeroomAttendanceDetail buildTeacherHomeroomAttendance(
            String tenantId,
            Long teacherRecordId,
            Map<Long, String> classNames,
            Map<Long, String> sectionNames,
            YearMonth ym,
            Long currentAyId,
            LocalDate today) {
        if (currentAyId == null) {
            return null;
        }
        Optional<ClassTeacherAssignment> pick = classTeacherAssignmentRepo
                .findActiveForTeacher(tenantId, teacherRecordId, today)
                .stream()
                .filter(a -> currentAyId.equals(a.getAcademicYearId()))
                .findFirst();
        if (pick.isEmpty()) {
            return null;
        }
        var a = pick.get();
        Long classId = a.getClassId();
        Long sectionId = a.getSectionId();
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();
        List<AttendanceRecord> recs = sectionId != null
                ? attendanceRepo.findByTenantIdAndClassIdAndSectionIdAndDateBetweenAndIsDeletedFalse(tenantId, classId, sectionId, from, to)
                : attendanceRepo.findByTenantIdAndClassIdAndDateBetweenAndIsDeletedFalse(tenantId, classId, from, to);
        ReportDashboardDTOs.TeacherHomeroomAttendanceDetail detail = new ReportDashboardDTOs.TeacherHomeroomAttendanceDetail();
        detail.setMonth(ym.toString());
        String cn = classNames.getOrDefault(classId, "Class");
        String sn = sectionId != null ? sectionNames.getOrDefault(sectionId, "") : "";
        detail.setClassLabel(sn == null || sn.isBlank() ? cn : cn + " · " + sn);
        ReportDashboardDTOs.TeacherAttendanceBreakdown br = new ReportDashboardDTOs.TeacherAttendanceBreakdown();
        for (AttendanceRecord r : recs) {
            switch (r.getStatus()) {
                case PRESENT -> br.setPresent(br.getPresent() + 1);
                case ABSENT -> br.setAbsent(br.getAbsent() + 1);
                case LATE -> br.setLate(br.getLate() + 1);
                case EXCUSED -> br.setExcused(br.getExcused() + 1);
                default -> {
                }
            }
        }
        detail.setBreakdown(br);
        Map<LocalDate, List<AttendanceRecord>> byDate = recs.stream().collect(Collectors.groupingBy(AttendanceRecord::getDate));
        List<ReportDashboardDTOs.TeacherHomeroomDayPoint> daily = new ArrayList<>();
        for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
            List<AttendanceRecord> day = byDate.getOrDefault(d, List.of());
            long pr = 0;
            long ab = 0;
            long la = 0;
            long ex = 0;
            for (AttendanceRecord x : day) {
                if (x.getStatus() == null) {
                    continue;
                }
                switch (x.getStatus()) {
                    case PRESENT -> pr++;
                    case ABSENT -> ab++;
                    case LATE -> la++;
                    case EXCUSED -> ex++;
                    default -> {
                    }
                }
            }
            long tot = pr + ab + la + ex;
            ReportDashboardDTOs.TeacherHomeroomDayPoint dp = new ReportDashboardDTOs.TeacherHomeroomDayPoint();
            dp.setDate(d.toString());
            dp.setPresentCount(pr);
            dp.setAbsentCount(ab);
            dp.setLateCount(la);
            dp.setExcusedCount(ex);
            if (tot == 0) {
                dp.setPresentPercent(0d);
                dp.setAbsentPercent(0d);
                dp.setLatePercent(0d);
                dp.setExcusedPercent(0d);
            } else {
                dp.setPresentPercent(100.0 * pr / tot);
                dp.setAbsentPercent(100.0 * ab / tot);
                dp.setLatePercent(100.0 * la / tot);
                dp.setExcusedPercent(100.0 * ex / tot);
            }
            daily.add(dp);
        }
        detail.setDaily(daily);
        return detail;
    }

    private List<ReportDashboardDTOs.TeacherRecentActivityItem> buildTeacherRecentActivityFeed(String tenantId) {
        List<ReportDashboardDTOs.TeacherRecentActivityItem> rows = new ArrayList<>();
        List<Exam> examsForFeed = examRepo.findByTenantIdAndIsDeletedFalse(tenantId);
        examsForFeed.stream()
                .filter(ex -> ex.getStatus() != null && ex.getStatus() != Enums.ExamStatus.COMPLETED)
                .sorted(Comparator.comparing((Exam ex) -> ex.getStartDate() != null ? ex.getStartDate() : LocalDate.MIN).reversed())
                .limit(3)
                .forEach((Exam ex) -> {
                    ReportDashboardDTOs.TeacherRecentActivityItem it = new ReportDashboardDTOs.TeacherRecentActivityItem();
                    it.setCode("EXAM_SCHEDULED");
                    it.setType("warning");
                    it.setTimestamp(ex.getStartDate() != null ? ex.getStartDate().atStartOfDay().toString() : LocalDate.now().atStartOfDay().toString());
                    it.getParams().put("title", ex.getName());
                    it.setLinkRoute("/app/exams");
                    rows.add(it);
                });
        announcementRepo.findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(tenantId).stream().limit(2).forEach(ann -> {
            ReportDashboardDTOs.TeacherRecentActivityItem it = new ReportDashboardDTOs.TeacherRecentActivityItem();
            it.setCode("ADMIN_ANNOUNCEMENT");
            it.setType("info");
            it.setTimestamp(ann.getCreatedAt() != null ? ann.getCreatedAt().toString() : LocalDate.now().toString());
            it.setLinkRoute("/app/inbox");
            rows.add(it);
        });
        rows.sort(Comparator.comparing((ReportDashboardDTOs.TeacherRecentActivityItem x) -> x.getTimestamp() != null ? x.getTimestamp() : "").reversed());
        return rows.stream().limit(8).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ParentDashboardDtos.Response     getParentDashboard(String fromIso, String toIso, Long requestedChildId) {
        String tenantId = TenantContext.getTenantId();
        Long uid = TenantContext.getUserId();
        log.debug("Building parent dashboard tenantId={} userId={} childId={}", tenantId, uid, requestedChildId);
        ParentDashboardDtos.Response out = new ParentDashboardDtos.Response();
        LocalDate from = LocalDate.parse(fromIso);
        LocalDate to = LocalDate.parse(toIso);

        List<Student> children = guardianService.findStudentsForParentUser(tenantId, uid).stream()
                .filter(s -> s.getStatus() == com.school.erp.common.enums.Enums.StudentStatus.ACTIVE)
                .sorted(Comparator.comparing(Student::getId))
                .collect(Collectors.toList());
        out.setChildren(children);
        out.setChildCount(children.size());
        if (children.isEmpty()) {
            return out;
        }
        Student selected = requestedChildId != null
                ? children.stream().filter(s -> requestedChildId.equals(s.getId())).findFirst().orElse(children.get(0))
                : children.get(0);
        out.setSelectedChild(selected);
        out.setSelectedChildId(selected.getId());

        List<AttendanceRecord> records = attendanceRepo.findByTenantIdAndStudentIdAndDateBetween(tenantId, selected.getId(), from, to);
        long present = records.stream().filter(r -> r.getStatus() == com.school.erp.common.enums.Enums.AttendanceStatus.PRESENT).count();
        long absent = records.stream().filter(r -> r.getStatus() == com.school.erp.common.enums.Enums.AttendanceStatus.ABSENT).count();
        long late = records.stream().filter(r -> r.getStatus() == com.school.erp.common.enums.Enums.AttendanceStatus.LATE).count();
        long excused = records.stream().filter(r -> r.getStatus() == com.school.erp.common.enums.Enums.AttendanceStatus.EXCUSED).count();
        long total = records.size();
        double pct = total > 0 ? (double) (present + late) / total * 100 : 0;
        out.setAttendancePercentage(Math.round(pct * 10) / 10.0);
        out.getAttendanceSnapshot().setTotalDays(total);
        out.getAttendanceSnapshot().setPresent(present);
        out.getAttendanceSnapshot().setAbsent(absent);
        out.getAttendanceSnapshot().setLate(late);
        out.getAttendanceSnapshot().setExcused(excused);

        Long sectionParam = selected.getSectionId() != null && selected.getSectionId() > 0 ? selected.getSectionId() : null;
        List<ExamDTOs.MarkResponse> marks = examService.listPublishedMarksForParentStudent(selected.getId(), selected.getClassId(), sectionParam);
        out.setChildPerformance(marks);
        String grade = overallGradeFromMarkResponses(marks);
        out.setOverallGrade(grade);

        List<FeePayment> fees = feePaymentRepo.findByTenantIdAndStudentIdAndIsDeletedFalse(tenantId, selected.getId());
        out.setFeeStatus(fees);
        double feeDue = fees.stream().mapToDouble(f -> f.getDueAmount() != null ? f.getDueAmount().doubleValue() : 0).sum();
        out.setFeeDue(feeDue);

        out.getAttendanceMetric().setBand(attendanceBand(pct));
        out.getAttendanceMetric().setSchoolThresholdPercent(PARENT_ATTENDANCE_THRESHOLD);

        double avgPct = averagePercentFromMarkResponses(marks);
        out.getResultMetric().setBand(resultBand(grade));
        out.getResultMetric().setAveragePercent(Double.isNaN(avgPct) ? null : Math.round(avgPct * 10) / 10.0);

        ParentDashboardDtos.FeeMetric fm = buildParentFeeMetric(feeDue, fees);
        out.setFeeMetric(fm);

        out.setRecentActivities(buildParentRecentActivities(tenantId, uid, selected, records, fees, !marks.isEmpty()));
        log.info("Parent dashboard ready studentId={} attendancePct={} feeDue={}", selected.getId(), out.getAttendancePercentage(), feeDue);
        return out;
    }

    private static String attendanceBand(double pct) {
        if (pct >= 95) {
            return "excellent";
        }
        if (pct >= PARENT_ATTENDANCE_THRESHOLD) {
            return "good";
        }
        if (pct >= 70) {
            return "fair";
        }
        if (pct >= 50) {
            return "needs_attention";
        }
        return "critical";
    }

    private static String resultBand(String grade) {
        if (grade == null || grade.isBlank() || "-".equals(grade.trim())) {
            return "fair";
        }
        char c = Character.toUpperCase(grade.trim().charAt(0));
        if (c == 'A') {
            return "excellent";
        }
        if (c == 'B') {
            return "good";
        }
        if (c == 'C') {
            return "fair";
        }
        if (c == 'D') {
            return "needs_attention";
        }
        return "critical";
    }

    private static double averagePercentFromMarkResponses(List<ExamDTOs.MarkResponse> marks) {
        if (marks == null || marks.isEmpty()) {
            return Double.NaN;
        }
        double sum = 0;
        int n = 0;
        for (ExamDTOs.MarkResponse m : marks) {
            Double mm = m.getMaxMarks();
            Double mo = m.getMarksObtained();
            if (mm == null || mm <= 0) {
                continue;
            }
            double obt = mo != null ? mo : 0d;
            sum += (obt / mm) * 100.0;
            n++;
        }
        return n > 0 ? sum / n : Double.NaN;
    }

    private static String overallGradeFromMarkResponses(List<ExamDTOs.MarkResponse> marks) {
        double avg = averagePercentFromMarkResponses(marks);
        if (Double.isNaN(avg)) {
            return "-";
        }
        if (avg >= 90) {
            return "A+";
        }
        if (avg >= 80) {
            return "A";
        }
        if (avg >= 70) {
            return "B+";
        }
        if (avg >= 60) {
            return "B";
        }
        if (avg >= 50) {
            return "C";
        }
        return "D";
    }

    private static ParentDashboardDtos.FeeMetric buildParentFeeMetric(double feeDue, List<FeePayment> fees) {
        ParentDashboardDtos.FeeMetric fm = new ParentDashboardDtos.FeeMetric();
        if (feeDue <= 0) {
            fm.setUrgency("none");
            return fm;
        }
        LocalDate today = LocalDate.now();
        FeePayment earliest = null;
        LocalDate earliestDate = null;
        for (FeePayment f : fees) {
            if (f.getDueAmount() == null || f.getDueAmount().doubleValue() <= 0) {
                continue;
            }
            com.school.erp.common.enums.Enums.FeeStatus st = f.getStatus();
            if (st != com.school.erp.common.enums.Enums.FeeStatus.UNPAID
                    && st != com.school.erp.common.enums.Enums.FeeStatus.PARTIAL
                    && st != com.school.erp.common.enums.Enums.FeeStatus.OVERDUE) {
                continue;
            }
            if (f.getDueDate() == null) {
                continue;
            }
            if (earliestDate == null || f.getDueDate().isBefore(earliestDate)) {
                earliestDate = f.getDueDate();
                earliest = f;
            }
        }
        Integer daysUntil = null;
        if (earliest != null && earliest.getDueDate() != null) {
            daysUntil = (int) java.time.temporal.ChronoUnit.DAYS.between(today, earliest.getDueDate());
            fm.setNextDueDate(earliest.getDueDate().toString());
        }
        String urgency = "low";
        if (daysUntil != null) {
            if (daysUntil < 0) {
                urgency = "high";
            } else if (daysUntil <= 7) {
                urgency = feeDue >= HIGH_FEE_ABS_INR ? "high" : "medium";
            }
        }
        if (feeDue >= HIGH_FEE_ABS_INR && !"high".equals(urgency)) {
            urgency = "medium";
        }
        fm.setUrgency(urgency);
        fm.setDaysUntilDue(daysUntil);
        return fm;
    }

    private List<ParentDashboardDtos.ActivityCoded> buildParentRecentActivities(
            String tenantId,
            Long parentUserId,
            Student selected,
            List<AttendanceRecord> recordsInRange,
            List<FeePayment> fees,
            boolean hasPublishedMarks) {
        List<ParentDashboardDtos.ActivityCoded> out = new ArrayList<>();
        String childName = selected.getFirstName() != null ? selected.getFirstName() : "Student";
        String classLabel = (selected.getClassName() != null ? selected.getClassName() : "Class")
                + (selected.getSectionName() != null ? " · " + selected.getSectionName() : "");

        notificationRepo.findByTenantIdAndUserIdOrderByCreatedAtDesc(tenantId, parentUserId).stream()
                .limit(4)
                .forEach(n -> {
                    ParentDashboardDtos.ActivityCoded a = new ParentDashboardDtos.ActivityCoded();
                    a.setCode("ANNOUNCEMENT_POSTED");
                    a.setType("info");
                    a.setTimestamp(n.getCreatedAt() != null ? n.getCreatedAt().toString() : "");
                    Map<String, Object> p = new HashMap<>();
                    p.put("title", n.getTitle() != null ? n.getTitle() : "");
                    a.setParams(p);
                    out.add(a);
                });

        if (!recordsInRange.isEmpty()) {
            ParentDashboardDtos.ActivityCoded a = new ParentDashboardDtos.ActivityCoded();
            a.setCode("ATTENDANCE_MARKED");
            a.setType("info");
            recordsInRange.stream().map(AttendanceRecord::getDate).filter(Objects::nonNull).max(LocalDate::compareTo)
                    .ifPresent(d -> a.setTimestamp(d.atStartOfDay().toString()));
            if (a.getTimestamp() == null) {
                a.setTimestamp(LocalDate.now().toString());
            }
            Map<String, Object> p = new HashMap<>();
            p.put("child", childName);
            p.put("classLabel", classLabel);
            a.setParams(p);
            out.add(0, a);
        }

        boolean paidRecently = fees.stream()
                .anyMatch(f -> f.getPaymentDate() != null
                        && !f.getPaymentDate().isBefore(LocalDate.now().minusDays(45))
                        && f.getPaidAmount() != null
                        && f.getPaidAmount().doubleValue() > 0);
        if (paidRecently) {
            ParentDashboardDtos.ActivityCoded a = new ParentDashboardDtos.ActivityCoded();
            a.setCode("FEE_PAYMENT_RECORDED");
            a.setType("success");
            a.setTimestamp(LocalDate.now().toString());
            Map<String, Object> p = new HashMap<>();
            p.put("child", childName);
            a.setParams(p);
            if (out.isEmpty()) {
                out.add(a);
            } else {
                out.add(1, a);
            }
        }

        if (hasPublishedMarks && out.stream().noneMatch(x -> "RESULT_PUBLISHED".equals(x.getCode()))) {
            ParentDashboardDtos.ActivityCoded a = new ParentDashboardDtos.ActivityCoded();
            a.setCode("RESULT_PUBLISHED");
            a.setType("success");
            a.setTimestamp(LocalDate.now().toString());
            Map<String, Object> p = new HashMap<>();
            p.put("child", childName);
            a.setParams(p);
            out.add(a);
        }

        return out.stream().limit(8).collect(Collectors.toList());
    }

    private static ReportDashboardDTOs.TeacherScheduleItem toScheduleItem(
            com.school.erp.modules.timetable.entity.TimetableEntry entry,
            Map<Long, String> classNames,
            Map<Long, String> sectionNames) {
        ReportDashboardDTOs.TeacherScheduleItem item = new ReportDashboardDTOs.TeacherScheduleItem();
        item.setClassId(entry.getClassId());
        item.setSectionId(entry.getSectionId());
        item.setPeriod(entry.getPeriod() != null ? entry.getPeriod() : 0);
        item.setSubject(entry.getSubjectName());
        item.setClassName(classNames.getOrDefault(entry.getClassId(), "Class"));
        item.setSectionName(sectionNames.getOrDefault(entry.getSectionId(), ""));
        item.setRoom(entry.getRoom());
        item.setStartTime(entry.getStartTime() != null ? entry.getStartTime().toString() : "");
        item.setEndTime(entry.getEndTime() != null ? entry.getEndTime().toString() : "");
        return item;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStudentPerformanceReport(Long classId, Long examId) {
        String tenantId = TenantContext.getTenantId();
        log.debug("Student performance report classId={} examId={} tenantId={}", classId, examId, tenantId);
        var marks = markRepo.findByTenantIdAndExamIdAndClassId(tenantId, examId, classId);
        Map<Long, Map<String, Object>> studentMap = new LinkedHashMap<>();
        for (var m : marks) {
            studentMap.computeIfAbsent(m.getStudentId(), k -> {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("studentId", m.getStudentId());
                row.put("studentName", m.getStudentName());
                row.put("subjects", new HashMap<String, Double>());
                row.put("totalMarks", 0.0);
                row.put("totalMax", 0.0);
                return row;
            });
            Map<String, Object> row = studentMap.get(m.getStudentId());
            ((Map<String, Double>) row.get("subjects")).put(m.getSubjectName(), m.getMarksObtained());
            row.put("totalMarks", (double) row.get("totalMarks") + m.getMarksObtained());
            row.put("totalMax", (double) row.get("totalMax") + m.getMaxMarks());
        }
        List<Map<String, Object>> result = new ArrayList<>(studentMap.values());
        result.forEach(r -> {
            double pct = (double) r.get("totalMax") > 0 ? ((double) r.get("totalMarks") / (double) r.get("totalMax")) * 100 : 0;
            r.put("percentage", Math.round(pct * 10) / 10.0);
            r.put("grade", pct >= 90 ? "A+" : pct >= 80 ? "A" : pct >= 70 ? "B+" : pct >= 60 ? "B" : pct >= 50 ? "C" : "D");
        });
        result.sort((a, b) -> Double.compare((double) b.get("percentage"), (double) a.get("percentage")));
        for (int i = 0; i < result.size(); i++) {
            result.get(i).put("rank", i + 1);
        }
        log.info("Student performance report rows={} classId={} examId={}", result.size(), classId, examId);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAttendanceSummary(Long classId, String month) {
        String tenantId = TenantContext.getTenantId();
        log.debug("Attendance summary classId={} month={}", classId, month);
        java.time.YearMonth ym = java.time.YearMonth.parse(month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();
        List<com.school.erp.modules.student.entity.Student> students = studentRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId);
        Map<Long, long[]> statByStudent = new HashMap<>();
        for (Object[] row : attendanceRepo.getAttendanceStatsByClassAndDateRange(tenantId, classId, from, to)) {
            Long studentId = (Long) row[0];
            Enums.AttendanceStatus status = (Enums.AttendanceStatus) row[1];
            long count = (Long) row[2];
            long[] counters = statByStudent.computeIfAbsent(studentId, key -> new long[4]);
            switch (status) {
                case PRESENT -> counters[0] = count;
                case ABSENT -> counters[1] = count;
                case LATE -> counters[2] = count;
                case EXCUSED -> counters[3] = count;
                default -> {
                }
            }
        }
        List<Map<String, Object>> rows = students.stream().map(student -> {
            long[] counters = statByStudent.getOrDefault(student.getId(), new long[4]);
            long present = counters[0];
            long absent = counters[1];
            long late = counters[2];
            long excused = counters[3];
            long total = present + absent + late + excused;
            double percentage = total > 0 ? ((present + (late * 0.5)) / total) * 100 : 0;
            return Map.<String, Object>of(
                    "studentId", student.getId(),
                    "studentName", student.getFirstName() + " " + student.getLastName(),
                    "present", present,
                    "absent", absent,
                    "late", late,
                    "excused", excused,
                    "totalDays", total,
                    "attendancePercentage", Math.round(percentage * 10) / 10.0
            );
        }).collect(Collectors.toList());
        log.info("Attendance summary rows={} classId={} month={}", rows.size(), classId, month);
        return rows;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFeeCollectionReport(Long classId) {
        String tenantId = TenantContext.getTenantId();
        log.debug("Fee collection report classId={} (tenant-scoped payments)", classId);
        var payments = feePaymentRepo.findByTenantIdAndIsDeletedFalse(tenantId);
        double collected = payments.stream().mapToDouble(p -> p.getPaidAmount() != null ? p.getPaidAmount().doubleValue() : 0).sum();
        double pending = payments.stream().mapToDouble(p -> p.getDueAmount() != null ? p.getDueAmount().doubleValue() : 0).sum();
        long overdueCount = payments.stream().filter(p -> p.getStatus() == com.school.erp.common.enums.Enums.FeeStatus.OVERDUE).count();
        Map<String, Object> report = Map.of("totalCollected", collected, "totalPending", pending, "overdueCount", overdueCount, "totalStudents", payments.size(), "collectionRate", collected + pending > 0 ? Math.round((collected / (collected + pending)) * 100) : 0);
        log.info("Fee collection report tenantId={} overdueCount={}", tenantId, overdueCount);
        return report;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getClassSummary() {
        String tenantId = TenantContext.getTenantId();
        log.debug("Building class summary tenantId={}", tenantId);
        List<com.school.erp.modules.academic.entity.SchoolClass> classes =
                classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId);
        List<Map<String, Object>> list = buildClassSummaryRows(tenantId, classes);
        log.info("Class summary rows={} tenantId={}", list.size(), tenantId);
        return list;
    }

    private String resolveTeacherNameById(String tenantId, Long teacherId) {
        if (teacherId == null) {
            return "";
        }
        return teacherRepo.findByIdAndTenantIdAndIsDeletedFalse(teacherId, tenantId)
                .map(teacher -> String.format("%s %s",
                        teacher.getFirstName() != null ? teacher.getFirstName().trim() : "",
                        teacher.getLastName() != null ? teacher.getLastName().trim() : "").trim())
                .orElse("");
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSectionSummary() {
        String tenantId = TenantContext.getTenantId();
        log.debug("Building section summary tenantId={}", tenantId);
        List<Map<String, Object>> rows = new ArrayList<>();
        for (com.school.erp.modules.academic.entity.SchoolClass cls : classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId)) {
            for (com.school.erp.modules.academic.entity.Section sec : sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, cls.getId())) {
                int count = studentRepo.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, cls.getId(), sec.getId()).size();
                rows.add(Map.of(
                        "sectionId", sec.getId(),
                        "sectionName", sec.getName(),
                        "classId", cls.getId(),
                        "className", cls.getName(),
                        "studentCount", count,
                        "classTeacherName", resolveSectionTeacherName(tenantId, cls.getId(), cls.getClassTeacherId(), cls.getClassTeacherName(), sec, LocalDate.now())
                ));
            }
        }
        log.info("Section summary rows={} tenantId={}", rows.size(), tenantId);
        return rows;
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getSectionSummaryPaged(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        PageRequest pageable = PageRequest.of(safePage, safeSize);
        Page<com.school.erp.modules.academic.entity.Section> sectionPage =
                sectionRepo.findByTenantIdAndIsDeletedFalseOrderByClassIdAscNameAsc(tenantId, pageable);
        if (sectionPage.isEmpty()) {
            return Page.empty(pageable);
        }
        Set<Long> classIds = sectionPage.getContent().stream()
                .map(com.school.erp.modules.academic.entity.Section::getClassId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, String> classNamesById = classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .filter(c -> classIds.contains(c.getId()))
                .collect(Collectors.toMap(
                        com.school.erp.modules.academic.entity.SchoolClass::getId,
                        com.school.erp.modules.academic.entity.SchoolClass::getName,
                        (left, right) -> left));
        List<Map<String, Object>> rows = sectionPage.getContent().stream()
                .map(sec -> {
                    int count = studentRepo.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, sec.getClassId(), sec.getId()).size();
                    return Map.<String, Object>of(
                            "sectionId", sec.getId(),
                            "sectionName", sec.getName(),
                            "classId", sec.getClassId(),
                            "className", classNamesById.getOrDefault(sec.getClassId(), "Class"),
                            "studentCount", count,
                            "classTeacherName", resolveSectionTeacherName(tenantId, sec.getClassId(), null, null, sec, LocalDate.now()));
                })
                .collect(Collectors.toList());
        return new PageImpl<>(rows, pageable, sectionPage.getTotalElements());
    }

    private String resolveSectionTeacherName(
            String tenantId,
            Long classId,
            Long classTeacherId,
            String classTeacherName,
            com.school.erp.modules.academic.entity.Section section,
            LocalDate asOfDate) {
        if (section.getClassTeacherName() != null && !section.getClassTeacherName().isBlank()) {
            return section.getClassTeacherName().trim();
        }
        if (section.getClassTeacherId() != null) {
            String fromSectionId = resolveTeacherNameById(tenantId, section.getClassTeacherId());
            if (!fromSectionId.isBlank()) {
                return fromSectionId;
            }
        }
        String fromAssignment = classTeacherAssignmentRepo.findActiveForClass(tenantId, classId, section.getId(), asOfDate).stream()
                .map(ClassTeacherAssignment::getTeacherId)
                .filter(Objects::nonNull)
                .distinct()
                .map(teacherId -> resolveTeacherNameById(tenantId, teacherId))
                .filter(name -> !name.isBlank())
                .findFirst()
                .orElse("");
        if (!fromAssignment.isBlank()) {
            return fromAssignment;
        }
        if (classTeacherName != null && !classTeacherName.isBlank()) {
            return classTeacherName.trim();
        }
        if (classTeacherId != null) {
            String fromClassId = resolveTeacherNameById(tenantId, classTeacherId);
            if (!fromClassId.isBlank()) {
                return fromClassId;
            }
        }
        return "-";
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTeacherWorkload() {
        String tenantId = TenantContext.getTenantId();
        log.debug("Building teacher workload tenantId={}", tenantId);
        var teachers = teacherRepo.findByTenantIdAndIsDeletedFalse(tenantId);
        List<Map<String, Object>> result = buildTeacherWorkloadRows(tenantId, teachers);
        log.info("Teacher workload rows={} tenantId={}", result.size(), tenantId);
        return result;
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getTeacherWorkloadPaged(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        PageRequest pageable = PageRequest.of(safePage, safeSize);
        Page<com.school.erp.modules.teacher.entity.Teacher> teachers = teacherRepo.findByTenantIdAndIsDeletedFalse(tenantId, pageable);
        if (teachers.isEmpty()) {
            return Page.empty(pageable);
        }
        List<Map<String, Object>> rows = buildTeacherWorkloadRows(tenantId, teachers.getContent());
        return new PageImpl<>(rows, pageable, teachers.getTotalElements());
    }

    private List<Map<String, Object>> buildTeacherWorkloadRows(
            String tenantId,
            List<com.school.erp.modules.teacher.entity.Teacher> teachers) {
        if (teachers.isEmpty()) {
            return List.of();
        }
        LocalDate today = LocalDate.now();
        List<Long> teacherIds = teachers.stream().map(com.school.erp.modules.teacher.entity.Teacher::getId).filter(Objects::nonNull).toList();
        Map<Long, List<TimetableEntry>> timetableByTeacher = timetableRepo.findByTenantIdAndTeacherIdInAndIsDeletedFalse(tenantId, teacherIds).stream()
                .collect(Collectors.groupingBy(TimetableEntry::getTeacherId));
        Map<Long, List<ClassTeacherAssignment>> homeroomByTeacher = classTeacherAssignmentRepo
                .findActiveForTeacherIds(tenantId, teacherIds, today)
                .stream()
                .collect(Collectors.groupingBy(ClassTeacherAssignment::getTeacherId));
        Map<Long, String> classNamesById = classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .collect(Collectors.toMap(
                        com.school.erp.modules.academic.entity.SchoolClass::getId,
                        com.school.erp.modules.academic.entity.SchoolClass::getName,
                        (left, right) -> left,
                        LinkedHashMap::new));
        Map<Long, String> sectionNamesById = new LinkedHashMap<>();
        classNamesById.keySet().forEach(classId ->
                sectionRepo.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId).forEach(section ->
                        sectionNamesById.putIfAbsent(section.getId(), section.getName())));
        return teachers.stream().map(t -> {
            List<TimetableEntry> timetableRows = timetableByTeacher.getOrDefault(t.getId(), List.of());
            Set<Long> classIdsFromTimetable = timetableRows.stream()
                    .map(TimetableEntry::getClassId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toCollection(LinkedHashSet::new));
            int weeklyPeriods = (int) timetableRows.stream()
                    .map(row -> String.format("%s-%s-%s", row.getDay(), row.getPeriod(), row.getSectionId()))
                    .distinct()
                    .count();
            String homeroomClasses = homeroomByTeacher.getOrDefault(t.getId(), List.of()).stream()
                    .map(a -> formatHomeroomLabel(a.getClassId(), a.getSectionId(), classNamesById, sectionNamesById))
                    .filter(label -> !label.isBlank())
                    .distinct()
                    .sorted()
                    .collect(Collectors.joining(", "));
            return Map.of(
                    "teacherId", t.getId(),
                    "teacherName", t.getFirstName() + " " + t.getLastName(),
                    "specialization", t.getSpecialization() != null ? t.getSpecialization() : "",
                    "subjects", EntitySnapshotCollections.detachList(t.getSubjects()),
                    "status", t.getStatus() != null ? t.getStatus().name() : "ACTIVE",
                    "homeroomClasses", homeroomClasses.isBlank() ? "-" : homeroomClasses,
                    "assignedClasses", classIdsFromTimetable.size(),
                    "weeklyPeriods", weeklyPeriods);
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<Map<String, Object>> getClassSummaryPaged(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        PageRequest pageable = PageRequest.of(safePage, safeSize);
        Page<com.school.erp.modules.academic.entity.SchoolClass> classPage =
                classRepo.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId, pageable);
        if (classPage.isEmpty()) {
            return Page.empty(pageable);
        }
        List<Map<String, Object>> rows = buildClassSummaryRows(tenantId, classPage.getContent());
        return new PageImpl<>(rows, pageable, classPage.getTotalElements());
    }

    private List<Map<String, Object>> buildClassSummaryRows(
            String tenantId,
            List<com.school.erp.modules.academic.entity.SchoolClass> classes) {
        if (classes.isEmpty()) {
            return List.of();
        }
        LocalDate today = LocalDate.now();
        List<Long> classIds = classes.stream()
                .map(com.school.erp.modules.academic.entity.SchoolClass::getId)
                .filter(Objects::nonNull)
                .toList();
        Map<Long, Long> studentCountByClassId = mapLongAggregate(studentRepo.countStudentsByClassIds(tenantId, classIds));
        Map<Long, Long> sectionCountByClassId = mapLongAggregate(sectionRepo.countSectionsByClassIds(tenantId, classIds));
        Map<Long, Double> performanceByClassId = mapDoubleAggregate(markRepo.getAveragePerformanceByClassIds(tenantId, classIds));
        Map<Long, double[]> attendanceByClassId = mapAttendanceAggregates(
                attendanceRepo.getClassAttendanceStatsByClassIds(tenantId, classIds, today));
        Map<Long, double[]> feeByClassId =
                mapFeeAggregates(feePaymentRepo.getClassFeeSummaryByClassIds(
                        tenantId,
                        classIds,
                        com.school.erp.common.enums.Enums.FeeStatus.OVERDUE));

        return classes.stream()
                .map(schoolClass -> toClassSummaryRow(
                        schoolClass,
                        studentCountByClassId,
                        sectionCountByClassId,
                        performanceByClassId,
                        attendanceByClassId,
                        feeByClassId))
                .toList();
    }

    private Map<String, Object> toClassSummaryRow(
            com.school.erp.modules.academic.entity.SchoolClass schoolClass,
            Map<Long, Long> studentCountByClassId,
            Map<Long, Long> sectionCountByClassId,
            Map<Long, Double> performanceByClassId,
            Map<Long, double[]> attendanceByClassId,
            Map<Long, double[]> feeByClassId) {
        Long classId = schoolClass.getId();
        long studentCount = studentCountByClassId.getOrDefault(classId, 0L);
        long sectionCount = sectionCountByClassId.getOrDefault(classId, 0L);
        double[] attendanceStats = attendanceByClassId.getOrDefault(classId, new double[]{0.0, 0.0});
        double[] feeStats = feeByClassId.getOrDefault(classId, new double[]{0.0, 0.0, 0.0});
        double attendancePercentage = attendanceStats[1] > 0
                ? (attendanceStats[0] * 100.0) / attendanceStats[1]
                : 0.0;
        double performance = performanceByClassId.getOrDefault(classId, 0.0);
        double collectionPercentage = feeStats[1] > 0
                ? Math.round((feeStats[0] / feeStats[1]) * 1000.0) / 10.0
                : 0.0;
        return Map.of(
                "classId", classId,
                "className", schoolClass.getName(),
                "grade", schoolClass.getGrade(),
                "sections", sectionCount,
                "totalStudents", studentCount,
                "attendancePercentage", Math.round(attendancePercentage * 10.0) / 10.0,
                "performancePercentage", Math.round(performance * 10.0) / 10.0,
                "feeCollectionPercentage", collectionPercentage,
                "overdueAccounts", (long) feeStats[2]);
    }

    private Map<Long, Long> mapLongAggregate(List<Object[]> rows) {
        Map<Long, Long> aggregates = new HashMap<>();
        for (Object[] row : rows) {
            Long classId = (Long) row[0];
            Number count = (Number) row[1];
            if (classId != null) {
                aggregates.put(classId, count != null ? count.longValue() : 0L);
            }
        }
        return aggregates;
    }

    private Map<Long, Double> mapDoubleAggregate(List<Object[]> rows) {
        Map<Long, Double> aggregates = new HashMap<>();
        for (Object[] row : rows) {
            Long classId = (Long) row[0];
            Number value = (Number) row[1];
            if (classId != null) {
                aggregates.put(classId, value != null ? value.doubleValue() : 0.0);
            }
        }
        return aggregates;
    }

    private Map<Long, double[]> mapAttendanceAggregates(List<Object[]> rows) {
        Map<Long, double[]> aggregates = new HashMap<>();
        for (Object[] row : rows) {
            Long classId = (Long) row[0];
            Enums.AttendanceStatus status = (Enums.AttendanceStatus) row[1];
            Number count = (Number) row[2];
            if (classId == null) {
                continue;
            }
            double[] values = aggregates.computeIfAbsent(classId, key -> new double[]{0.0, 0.0});
            double currentCount = count != null ? count.doubleValue() : 0.0;
            values[1] += currentCount;
            if (status == Enums.AttendanceStatus.PRESENT) {
                values[0] += currentCount;
            }
        }
        return aggregates;
    }

    private Map<Long, double[]> mapFeeAggregates(List<Object[]> rows) {
        Map<Long, double[]> aggregates = new HashMap<>();
        for (Object[] row : rows) {
            Long classId = (Long) row[0];
            if (classId == null) {
                continue;
            }
            Number totalCollected = (Number) row[1];
            Number totalAmount = (Number) row[2];
            Number overdue = (Number) row[3];
            aggregates.put(classId, new double[]{
                    totalCollected != null ? totalCollected.doubleValue() : 0.0,
                    totalAmount != null ? totalAmount.doubleValue() : 0.0,
                    overdue != null ? overdue.doubleValue() : 0.0
            });
        }
        return aggregates;
    }

    private String formatHomeroomLabel(
            Long classId,
            Long sectionId,
            Map<Long, String> classNamesById,
            Map<Long, String> sectionNamesById) {
        String className = classId != null ? classNamesById.getOrDefault(classId, "Class") : "Class";
        if (sectionId == null) {
            return className;
        }
        String sectionName = sectionNamesById.getOrDefault(sectionId, "");
        return sectionName.isBlank() ? className : className + " - " + sectionName;
    }

    private List<ReportDashboardDTOs.MetricPoint> buildMonthlyAdmissions(String tenantId) {
        Map<YearMonth, Long> monthlyCounts = new LinkedHashMap<>();
        List<YearMonth> months = new ArrayList<>();
        YearMonth current = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            months.add(month);
            monthlyCounts.put(month, 0L);
        }
        for (var student : studentRepo.findByTenantIdAndIsDeletedFalse(tenantId, Pageable.unpaged()).getContent()) {
            LocalDate referenceDate = student.getAdmissionDate() != null ? student.getAdmissionDate() : (student.getCreatedAt() != null ? student.getCreatedAt().toLocalDate() : null);
            YearMonth month = null;
            if (referenceDate != null) {
                month = YearMonth.from(referenceDate);
            }
            if (month == null || !monthlyCounts.containsKey(month)) {
                month = months.get((int) (Math.abs(student.getId()) % months.size()));
            }
            monthlyCounts.put(month, monthlyCounts.get(month) + 1);
        }
        return months.stream()
                .map(month -> new ReportDashboardDTOs.MetricPoint(month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH), monthlyCounts.getOrDefault(month, 0L)))
                .collect(Collectors.toList());
    }

    private List<ReportDashboardDTOs.MetricPoint> buildMonthlyCollections(List<com.school.erp.modules.fees.entity.FeePayment> payments) {
        Map<YearMonth, Double> monthlyCollections = new LinkedHashMap<>();
        List<YearMonth> months = new ArrayList<>();
        YearMonth current = YearMonth.now();
        for (int i = 5; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            months.add(month);
            monthlyCollections.put(month, 0.0);
        }
        payments.forEach(payment -> {
            LocalDate referenceDate = payment.getPaymentDate() != null ? payment.getPaymentDate() : (payment.getCreatedAt() != null ? payment.getCreatedAt().toLocalDate() : null);
            YearMonth month = null;
            if (referenceDate != null) {
                month = YearMonth.from(referenceDate);
            }
            if (month == null || !monthlyCollections.containsKey(month)) {
                month = months.get((int) (Math.abs(payment.getId() != null ? payment.getId() : 0) % months.size()));
            }
            monthlyCollections.put(month, monthlyCollections.get(month) + (payment.getPaidAmount() != null ? payment.getPaidAmount().doubleValue() : 0));
        });
        return months.stream()
                .map(month -> new ReportDashboardDTOs.MetricPoint(month.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH), Math.round(monthlyCollections.getOrDefault(month, 0.0) * 100.0) / 100.0))
                .collect(Collectors.toList());
    }

    private ReportDashboardDTOs.AttendanceOverview buildAttendanceOverview(String tenantId, LocalDate date) {
        ReportDashboardDTOs.AttendanceOverview overview = new ReportDashboardDTOs.AttendanceOverview();
        overview.setTotal(attendanceRepo.countByTenantIdAndDate(tenantId, date));
        overview.setPresent(attendanceRepo.countByTenantIdAndDateAndStatus(tenantId, date, com.school.erp.common.enums.Enums.AttendanceStatus.PRESENT));
        overview.setAbsent(attendanceRepo.countByTenantIdAndDateAndStatus(tenantId, date, com.school.erp.common.enums.Enums.AttendanceStatus.ABSENT));
        overview.setLate(attendanceRepo.countByTenantIdAndDateAndStatus(tenantId, date, com.school.erp.common.enums.Enums.AttendanceStatus.LATE));
        overview.setExcused(attendanceRepo.countByTenantIdAndDateAndStatus(tenantId, date, com.school.erp.common.enums.Enums.AttendanceStatus.EXCUSED));
        return overview;
    }

    public OltpReportQueryAdapter(
            final StudentRepository studentRepo,
            final TeacherRepository teacherRepo,
            final MarkRecordRepository markRepo,
            final FeePaymentRepository feePaymentRepo,
            final AttendanceRepository attendanceRepo,
            final NotificationRepository notificationRepo,
            final ExamRepository examRepo,
            final TimetableRepository timetableRepo,
            final SchoolClassRepository classRepo,
            final SectionRepository sectionRepo,
            final AcademicYearRepository academicYearRepo,
            final ClassTeacherAssignmentRepository classTeacherAssignmentRepo,
            final ChatConversationRepository chatConversationRepo,
            final ChatParticipantRepository chatParticipantRepo,
            final AnnouncementRepository announcementRepo,
            final GuardianService guardianService,
            final ExamService examService) {
        this.studentRepo = studentRepo;
        this.teacherRepo = teacherRepo;
        this.markRepo = markRepo;
        this.feePaymentRepo = feePaymentRepo;
        this.attendanceRepo = attendanceRepo;
        this.notificationRepo = notificationRepo;
        this.examRepo = examRepo;
        this.timetableRepo = timetableRepo;
        this.classRepo = classRepo;
        this.sectionRepo = sectionRepo;
        this.academicYearRepo = academicYearRepo;
        this.classTeacherAssignmentRepo = classTeacherAssignmentRepo;
        this.chatConversationRepo = chatConversationRepo;
        this.chatParticipantRepo = chatParticipantRepo;
        this.announcementRepo = announcementRepo;
        this.guardianService = guardianService;
        this.examService = examService;
    }
}
