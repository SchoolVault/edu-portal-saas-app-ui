package com.school.erp.modules.chat.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.chat.dto.ChatDirectoryDTOs;
import com.school.erp.modules.guardian.service.GuardianService;
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
import java.util.HashMap;
import java.util.HashSet;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ChatDirectoryService {

    private static final Logger log = LoggerFactory.getLogger(ChatDirectoryService.class);

    private final StudentRepository studentRepository;
    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;
    private final GuardianService guardianService;

    @Transactional(readOnly = true)
    public ChatDirectoryDTOs.DirectoryResponse getDirectory() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";
        log.debug("Building chat directory tenantId={} userId={} role={}", tenantId, userId, role);

        ChatDirectoryDTOs.DirectoryResponse res = new ChatDirectoryDTOs.DirectoryResponse();

        if ("TEACHER".equals(role)) {
            res.setMyClassRosters(getTeacherRosters(tenantId, userId));
            log.info("Chat directory (teacher) rosterCount={}", res.getMyClassRosters() != null ? res.getMyClassRosters().size() : 0);
            return res;
        }
        if ("PARENT".equals(role)) {
            res.setMyChildren(getParentChildren(tenantId, userId));
            log.info("Chat directory (parent) childGroupCount={}", res.getMyChildren() != null ? res.getMyChildren().size() : 0);
            return res;
        }
        if ("SUPER_ADMIN".equals(role)) {
            log.info("Chat directory (super admin) empty — use GET /platform/school-admins/chat-search");
            return res;
        }
        if ("ADMIN".equals(role)) {
            res.setTeachers(userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.TEACHER)
                    .stream()
                    .map(u -> new ChatDirectoryDTOs.UserCard(u.getId(), u.getName(), u.getRole() != null ? u.getRole().name() : "TEACHER"))
                    .sorted(Comparator.comparing(ChatDirectoryDTOs.UserCard::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                    .collect(Collectors.toList()));
            res.setParents(userRepository.findByTenantIdAndRoleAndIsDeletedFalse(tenantId, Enums.Role.PARENT)
                    .stream()
                    .map(u -> new ChatDirectoryDTOs.UserCard(u.getId(), u.getName(), u.getRole() != null ? u.getRole().name() : "PARENT"))
                    .sorted(Comparator.comparing(ChatDirectoryDTOs.UserCard::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                    .collect(Collectors.toList()));
            log.info("Chat directory (admin) teachers={} parents={}", res.getTeachers().size(), res.getParents().size());
            return res;
        }

        // students and others: keep empty for now (until we add student-user mapping)
        log.info("Chat directory empty for role={}", role.isEmpty() ? "UNKNOWN" : role);
        return res;
    }

    /**
     * Homeroom teacher user ids for all students linked to this parent (same rules as parent directory cards).
     */
    @Transactional(readOnly = true)
    public boolean parentMayMessageTeacherUser(Long parentUserId, Long teacherUserId) {
        if (teacherUserId == null) {
            return false;
        }
        String tenantId = TenantContext.getTenantId();
        return homeroomTeacherUserIdsForParent(tenantId, parentUserId).contains(teacherUserId);
    }

    /**
     * Homeroom teacher may message parents of students in classes where they are assigned class teacher.
     */
    @Transactional(readOnly = true)
    public boolean teacherMayMessageParentUser(Long teacherUserId, Long parentUserId) {
        if (teacherUserId == null || parentUserId == null) {
            return false;
        }
        return parentUserIdsInHomeroomRoster(TenantContext.getTenantId(), teacherUserId).contains(parentUserId);
    }

    private java.util.Set<Long> parentUserIdsInHomeroomRoster(String tenantId, Long teacherUserId) {
        java.util.Set<Long> out = new java.util.HashSet<>();
        Teacher teacher = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, teacherUserId).orElse(null);
        if (teacher == null) {
            return out;
        }
        List<SchoolClass> classes = classRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .filter(c -> Objects.equals(c.getClassTeacherId(), teacher.getId()) || Objects.equals(c.getClassTeacherId(), teacherUserId))
                .collect(Collectors.toList());
        for (SchoolClass c : classes) {
            for (Student s : studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId())) {
                if (s.getParentId() != null) {
                    out.add(s.getParentId());
                }
            }
        }
        return out;
    }

    private Set<Long> homeroomTeacherUserIdsForParent(String tenantId, Long parentUserId) {
        List<Student> kids = guardianService.findStudentsForParentUser(tenantId, parentUserId);
        if (kids.isEmpty()) {
            return Set.of();
        }
        Map<Long, SchoolClass> classMap = classRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId)
                .stream().collect(Collectors.toMap(SchoolClass::getId, c -> c, (a, b) -> a));
        Set<Long> out = new HashSet<>();
        for (Student s : kids) {
            SchoolClass c = s.getClassId() != null ? classMap.get(s.getClassId()) : null;
            if (c == null || c.getClassTeacherId() == null) {
                continue;
            }
            teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(c.getClassTeacherId(), tenantId)
                    .map(Teacher::getUserId)
                    .ifPresent(out::add);
        }
        return out;
    }

    private List<ChatDirectoryDTOs.ClassRoster> getTeacherRosters(String tenantId, Long userId) {
        Teacher teacher = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId).orElse(null);
        if (teacher == null) {
            log.warn("Chat directory: no teacher row for userId={} tenantId={}", userId, tenantId);
            return List.of();
        }

        List<SchoolClass> classes = classRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId).stream()
                .filter(c -> Objects.equals(c.getClassTeacherId(), teacher.getId()) || Objects.equals(c.getClassTeacherId(), userId))
                .collect(Collectors.toList());

        // existing schema: students link to classId/sectionId; this roster currently uses class-only grouping.
        Map<Long, List<Student>> studentsByClass = classes.stream()
                .collect(Collectors.toMap(SchoolClass::getId, c -> studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId())));

        // Build parent cards via Student.parentId -> User
        List<Long> parentIds = studentsByClass.values().stream()
                .flatMap(List::stream)
                .map(Student::getParentId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<Long, User> parents = parentIds.isEmpty()
                ? Map.of()
                : parentIds.stream()
                .map(pid -> userRepository.findByIdAndTenantIdAndIsDeletedFalse(pid, tenantId).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(User::getId, u -> u));

        List<ChatDirectoryDTOs.ClassRoster> rosters = new ArrayList<>();
        for (SchoolClass c : classes) {
            ChatDirectoryDTOs.ClassRoster r = new ChatDirectoryDTOs.ClassRoster();
            r.setClassId(c.getId());
            r.setClassName(c.getName());
            r.setSectionId(null);
            r.setSectionName(null);
            List<ChatDirectoryDTOs.StudentCard> students = studentsByClass.getOrDefault(c.getId(), List.of()).stream()
                    .map(s -> {
                        ChatDirectoryDTOs.StudentCard sc = new ChatDirectoryDTOs.StudentCard();
                        sc.setStudentId(s.getId());
                        sc.setStudentName((s.getFirstName() != null ? s.getFirstName() : "") + " " + (s.getLastName() != null ? s.getLastName() : ""));
                        User pu = s.getParentId() != null ? parents.get(s.getParentId()) : null;
                        if (pu != null) {
                            sc.setParent(new ChatDirectoryDTOs.UserCard(pu.getId(), pu.getName(), pu.getRole() != null ? pu.getRole().name() : "PARENT"));
                        }
                        return sc;
                    })
                    .sorted(Comparator.comparing(ChatDirectoryDTOs.StudentCard::getStudentName, Comparator.nullsLast(String::compareToIgnoreCase)))
                    .collect(Collectors.toList());
            r.setStudents(students);
            rosters.add(r);
        }
        return rosters;
    }

    private List<ChatDirectoryDTOs.ParentChildRoster> getParentChildren(String tenantId, Long parentUserId) {
        List<Student> kids = guardianService.findStudentsForParentUser(tenantId, parentUserId);
        if (kids.isEmpty()) {
            return List.of();
        }

        Map<Long, SchoolClass> classMap = classRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId)
                .stream().collect(Collectors.toMap(SchoolClass::getId, c -> c, (a, b) -> a));

        List<Long> classTeacherTeacherPks = kids.stream()
                .map(Student::getClassId)
                .map(classMap::get)
                .filter(Objects::nonNull)
                .map(SchoolClass::getClassTeacherId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> homeroomTeacherUserByTeacherPk = new HashMap<>();
        for (Long teacherPk : classTeacherTeacherPks) {
            teacherRepository.findByIdAndTenantIdAndIsDeletedFalse(teacherPk, tenantId)
                    .map(Teacher::getUserId)
                    .flatMap(uid -> userRepository.findByIdAndTenantIdAndIsDeletedFalse(uid, tenantId))
                    .ifPresent(u -> homeroomTeacherUserByTeacherPk.put(teacherPk, u));
        }

        return kids.stream().map(s -> {
                    ChatDirectoryDTOs.ParentChildRoster r = new ChatDirectoryDTOs.ParentChildRoster();
                    r.setStudentId(s.getId());
                    r.setStudentName((s.getFirstName() != null ? s.getFirstName() : "") + " " + (s.getLastName() != null ? s.getLastName() : ""));
                    r.setClassId(s.getClassId());
                    SchoolClass c = s.getClassId() != null ? classMap.get(s.getClassId()) : null;
                    r.setClassName(c != null ? c.getName() : null);
                    r.setSectionId(s.getSectionId());
                    r.setSectionName(null);
                    if (c != null && c.getClassTeacherId() != null) {
                        User u = homeroomTeacherUserByTeacherPk.get(c.getClassTeacherId());
                        if (u != null) {
                            r.setClassTeacher(new ChatDirectoryDTOs.UserCard(u.getId(), u.getName(), u.getRole() != null ? u.getRole().name() : "TEACHER"));
                        }
                    }
                    return r;
                })
                .sorted(Comparator.comparing(ChatDirectoryDTOs.ParentChildRoster::getStudentName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .collect(Collectors.toList());
    }

    public ChatDirectoryService(StudentRepository studentRepository,
                               SchoolClassRepository classRepository,
                               UserRepository userRepository,
                               TeacherRepository teacherRepository,
                               GuardianService guardianService) {
        this.studentRepository = studentRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
        this.guardianService = guardianService;
    }
}

