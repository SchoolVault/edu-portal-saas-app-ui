package com.school.erp.modules.directory.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.directory.dto.DirectoryDTOs;
import com.school.erp.modules.operations.entity.OperationalStaff;
import com.school.erp.modules.operations.repository.OperationalStaffRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DirectoryService {

    private static final Logger log = LoggerFactory.getLogger(DirectoryService.class);
    private static final int CAP_PER_KIND = 25;

    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final OperationalStaffRepository operationalStaffRepository;
    private final UserRepository userRepository;

    public DirectoryService(
            TeacherRepository teacherRepository,
            StudentRepository studentRepository,
            OperationalStaffRepository operationalStaffRepository,
            UserRepository userRepository) {
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.operationalStaffRepository = operationalStaffRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public DirectoryDTOs.SearchResponse search(String rawQuery, Set<String> kindsFilter) {
        String tenantId = TenantContext.getTenantId();
        String q = rawQuery == null ? "" : rawQuery.trim().toLowerCase(Locale.ROOT);
        DirectoryDTOs.SearchResponse res = new DirectoryDTOs.SearchResponse();
        res.setQuery(rawQuery != null ? rawQuery.trim() : "");
        if (q.length() < 2) {
            return res;
        }
        Set<String> kinds = kindsFilter == null || kindsFilter.isEmpty()
                ? Set.of("teacher", "student", "staff", "user")
                : kindsFilter.stream().map(k -> k.toLowerCase(Locale.ROOT)).collect(Collectors.toCollection(LinkedHashSet::new));

        List<DirectoryDTOs.Entry> merged = new ArrayList<>();
        if (kinds.contains("teacher")) {
            merged.addAll(matchTeachers(tenantId, q));
        }
        if (kinds.contains("student")) {
            merged.addAll(matchStudents(tenantId, q));
        }
        if (kinds.contains("staff")) {
            merged.addAll(matchStaff(tenantId, q));
        }
        if (kinds.contains("user")) {
            merged.addAll(matchUsers(tenantId, q));
        }
        merged.sort(Comparator.comparing(DirectoryDTOs.Entry::getDisplayName, String.CASE_INSENSITIVE_ORDER));
        res.setResults(merged);
        log.info("Directory search tenant={} qLen={} hits={}", tenantId, q.length(), merged.size());
        return res;
    }

    private List<DirectoryDTOs.Entry> matchTeachers(String tenantId, String q) {
        return teacherRepository.findByTenantIdAndIsDeletedFalse(tenantId, org.springframework.data.domain.PageRequest.of(0, 200)).getContent().stream()
                .filter(t -> contains(t.getFirstName(), t.getLastName(), t.getEmail(), q))
                .limit(CAP_PER_KIND)
                .map(this::toTeacherEntry)
                .collect(Collectors.toList());
    }

    private List<DirectoryDTOs.Entry> matchStudents(String tenantId, String q) {
        return studentRepository.findByTenantIdAndIsDeletedFalse(tenantId, org.springframework.data.domain.PageRequest.of(0, 300)).getContent().stream()
                .filter(s -> contains(s.getFirstName(), s.getLastName(), s.getAdmissionNumber(), q))
                .limit(CAP_PER_KIND)
                .map(this::toStudentEntry)
                .collect(Collectors.toList());
    }

    private List<DirectoryDTOs.Entry> matchStaff(String tenantId, String q) {
        return operationalStaffRepository.findByTenantIdAndIsDeletedFalseOrderByFullNameAsc(tenantId).stream()
                .filter(s -> contains(s.getFullName(), null, s.getEmail(), q))
                .limit(CAP_PER_KIND)
                .map(this::toStaffEntry)
                .collect(Collectors.toList());
    }

    private List<DirectoryDTOs.Entry> matchUsers(String tenantId, String q) {
        return userRepository.findByTenantIdAndIsDeletedFalseOrderByNameAsc(tenantId).stream()
                .filter(u -> contains(u.getName(), null, u.getEmail(), q))
                .limit(CAP_PER_KIND)
                .map(this::toUserEntry)
                .collect(Collectors.toList());
    }

    private static boolean contains(String a, String b, String extra, String q) {
        String blob = ((a != null ? a : "") + " " + (b != null ? b : "") + " " + (extra != null ? extra : "")).toLowerCase(Locale.ROOT);
        return blob.contains(q);
    }

    private DirectoryDTOs.Entry toTeacherEntry(Teacher t) {
        DirectoryDTOs.Entry e = new DirectoryDTOs.Entry();
        e.setKind("teacher");
        e.setId(t.getId());
        e.setDisplayName((t.getFirstName() + " " + t.getLastName()).trim());
        e.setSubtitle(t.getSpecialization() != null ? t.getSpecialization() : "Teacher");
        e.setEmail(t.getEmail());
        e.setPhone(t.getPhone());
        e.setDeepLink("/app/teachers/" + t.getId());
        if (t.getUserId() != null) {
            e.setChatUserId(String.valueOf(t.getUserId()));
            e.setChatTargetRole("TEACHER");
        }
        return e;
    }

    private DirectoryDTOs.Entry toStudentEntry(Student s) {
        DirectoryDTOs.Entry e = new DirectoryDTOs.Entry();
        e.setKind("student");
        e.setId(s.getId());
        e.setDisplayName((s.getFirstName() + " " + s.getLastName()).trim());
        String subtitle = s.getAdmissionNumber() != null ? "Adm. " + s.getAdmissionNumber() : "Student";
        if (s.getParentName() != null && !s.getParentName().isBlank()) {
            subtitle = subtitle + " · Parent: " + s.getParentName();
        }
        e.setSubtitle(subtitle);
        e.setEmail(s.getEmail());
        e.setPhone(s.getPhone());
        e.setDeepLink("/app/students/" + s.getId());
        enrichStudentChatParent(s, e);
        return e;
    }

    private void enrichStudentChatParent(Student s, DirectoryDTOs.Entry e) {
        if (s.getParentId() == null) {
            return;
        }
        userRepository.findById(s.getParentId()).ifPresent(u -> {
            if (!TenantContext.getTenantId().equals(u.getTenantId())) {
                return;
            }
            if (u.getRole() == Enums.Role.PARENT) {
                e.setChatUserId(String.valueOf(u.getId()));
                e.setChatTargetRole("PARENT");
                e.setContextType("student");
                e.setContextId(String.valueOf(s.getId()));
            }
        });
    }

    private DirectoryDTOs.Entry toStaffEntry(OperationalStaff s) {
        DirectoryDTOs.Entry e = new DirectoryDTOs.Entry();
        e.setKind("staff");
        e.setId(s.getId());
        e.setDisplayName(s.getFullName());
        e.setSubtitle(s.getStaffRole() != null ? s.getStaffRole() : "Operations");
        e.setEmail(s.getEmail());
        e.setPhone(s.getPhone());
        e.setDeepLink("/app/operations");
        if (s.getUserId() != null) {
            e.setChatUserId(String.valueOf(s.getUserId()));
            e.setChatTargetRole("STAFF");
        }
        return e;
    }

    private DirectoryDTOs.Entry toUserEntry(User u) {
        DirectoryDTOs.Entry e = new DirectoryDTOs.Entry();
        e.setKind("user");
        e.setId(u.getId());
        e.setDisplayName(u.getName());
        e.setSubtitle(u.getRole() != null ? u.getRole().name() : "User");
        e.setEmail(u.getEmail());
        e.setPhone(u.getPhone());
        e.setDeepLink("/app/settings");
        e.setChatUserId(String.valueOf(u.getId()));
        if (u.getRole() != null) {
            e.setChatTargetRole(u.getRole().name());
        }
        return e;
    }
}
