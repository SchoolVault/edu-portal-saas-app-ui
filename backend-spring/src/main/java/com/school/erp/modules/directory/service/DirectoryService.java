package com.school.erp.modules.directory.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
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
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class DirectoryService {

    private static final Logger log = LoggerFactory.getLogger(DirectoryService.class);
    private static final int CAP_PER_KIND = 25;
    private static final Set<String> ALLOWED_KINDS = Set.of("teacher", "student", "staff");

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
                ? ALLOWED_KINDS
                : kindsFilter.stream()
                        .map(k -> k.toLowerCase(Locale.ROOT))
                        .filter(ALLOWED_KINDS::contains)
                        .collect(Collectors.toCollection(LinkedHashSet::new));

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
        merged = dedupeDirectoryEntries(merged);
        merged.sort(Comparator.comparing(DirectoryDTOs.Entry::getDisplayName, String.CASE_INSENSITIVE_ORDER));
        res.setResults(merged);
        log.info("Directory search tenant={} qLen={} hits={}", tenantId, q.length(), merged.size());
        return res;
    }

    /**
     * Same matching rules as {@link #search(String, Set)} (per-kind caps), then windowed for UI pagination.
     */
    @Transactional(readOnly = true)
    public PageResponse<DirectoryDTOs.Entry> searchPaged(String rawQuery, Set<String> kindsFilter, int page, int size) {
        DirectoryDTOs.SearchResponse full = search(rawQuery, kindsFilter);
        List<DirectoryDTOs.Entry> merged = full.getResults() != null ? full.getResults() : List.of();
        long total = merged.size();
        int from = page * size;
        if (from >= merged.size()) {
            return PageResponse.of(List.of(), page, size, total);
        }
        int to = Math.min(from + size, merged.size());
        return PageResponse.of(merged.subList(from, to), page, size, total);
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
                .map(this::toStaffEntry)
                .limit(CAP_PER_KIND)
                .collect(Collectors.toList());
    }

    private static boolean contains(String a, String b, String extra, String q) {
        String blob = ((a != null ? a : "") + " " + (b != null ? b : "") + " " + (extra != null ? extra : "")).toLowerCase(Locale.ROOT);
        return blob.contains(q);
    }

    /**
     * One row per portal identity: same {@code chatUserId} (or same email) should not list teacher + staff twice.
     */
    private List<DirectoryDTOs.Entry> dedupeDirectoryEntries(List<DirectoryDTOs.Entry> merged) {
        Map<String, DirectoryDTOs.Entry> byPortalUser = new LinkedHashMap<>();
        List<DirectoryDTOs.Entry> withoutPortalKey = new ArrayList<>();
        for (DirectoryDTOs.Entry e : merged) {
            String uid = e.getChatUserId();
            if (uid == null || uid.isBlank()) {
                withoutPortalKey.add(e);
                continue;
            }
            byPortalUser.merge(uid, e, DirectoryService::preferDirectoryEntryKind);
        }
        Map<String, DirectoryDTOs.Entry> byEmail = new LinkedHashMap<>();
        List<DirectoryDTOs.Entry> leftover = new ArrayList<>();
        for (DirectoryDTOs.Entry e : withoutPortalKey) {
            String em = e.getEmail() != null ? e.getEmail().trim().toLowerCase(Locale.ROOT) : "";
            if (em.isEmpty()) {
                leftover.add(e);
                continue;
            }
            byEmail.merge(em, e, DirectoryService::preferDirectoryEntryKind);
        }
        List<DirectoryDTOs.Entry> out = new ArrayList<>(byPortalUser.values());
        out.addAll(byEmail.values());
        out.addAll(leftover);
        return out;
    }

    private static DirectoryDTOs.Entry preferDirectoryEntryKind(DirectoryDTOs.Entry a, DirectoryDTOs.Entry b) {
        return directoryKindRank(a.getKind()) <= directoryKindRank(b.getKind()) ? a : b;
    }

    /**
     * Lower rank wins merges when the same portal user appears as multiple roster kinds.
     * Prefer {@code staff} over {@code teacher} so operational desk identities are not mislabeled as faculty.
     */
    private static int directoryKindRank(String kind) {
        if (kind == null) {
            return 9;
        }
        return switch (kind.toLowerCase(Locale.ROOT)) {
            case "staff" -> 0;
            case "teacher" -> 1;
            case "student" -> 2;
            default -> 5;
        };
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
        e.setDeepLink("/app/staff/" + s.getId());
        if (s.getUserId() != null) {
            e.setChatUserId(String.valueOf(s.getUserId()));
            e.setChatTargetRole("STAFF");
        }
        return e;
    }

}
