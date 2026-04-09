package com.school.erp.modules.chat.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.chat.dto.ChatDirectoryDTOs;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ChatDirectoryService {
    private final StudentRepository studentRepository;
    private final SchoolClassRepository classRepository;
    private final UserRepository userRepository;
    private final TeacherRepository teacherRepository;

    @Transactional(readOnly = true)
    public ChatDirectoryDTOs.DirectoryResponse getDirectory() {
        String tenantId = TenantContext.getTenantId();
        Long userId = TenantContext.getUserId();
        String role = TenantContext.getUserRole() != null ? TenantContext.getUserRole().trim().toUpperCase(Locale.ROOT) : "";

        ChatDirectoryDTOs.DirectoryResponse res = new ChatDirectoryDTOs.DirectoryResponse();

        if ("TEACHER".equals(role)) {
            res.setMyClassRosters(getTeacherRosters(tenantId, userId));
            return res;
        }
        if ("PARENT".equals(role)) {
            res.setMyChildren(getParentChildren(tenantId, userId));
            return res;
        }
        if ("ADMIN".equals(role) || "SUPER_ADMIN".equals(role)) {
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
            return res;
        }

        // students and others: keep empty for now (until we add student-user mapping)
        return res;
    }

    private List<ChatDirectoryDTOs.ClassRoster> getTeacherRosters(String tenantId, Long userId) {
        Teacher teacher = teacherRepository.findByTenantIdAndUserIdAndIsDeletedFalse(tenantId, userId).orElse(null);
        if (teacher == null) return List.of();

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
        List<Student> kids = studentRepository.findByTenantIdAndParentIdAndIsDeletedFalse(tenantId, parentUserId);
        if (kids.isEmpty()) return List.of();

        Map<Long, SchoolClass> classMap = classRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId)
                .stream().collect(Collectors.toMap(SchoolClass::getId, c -> c, (a, b) -> a));

        // For now: parent can message class teacher (main teacher). Subject teachers can be added later via timetable/subject mapping.
        List<Long> classTeacherUserIds = kids.stream()
                .map(Student::getClassId)
                .map(classMap::get)
                .filter(Objects::nonNull)
                .map(SchoolClass::getClassTeacherId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> teacherUsers = classTeacherUserIds.isEmpty()
                ? Map.of()
                : classTeacherUserIds.stream()
                .map(id -> userRepository.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toMap(User::getId, u -> u));

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
                        User u = teacherUsers.get(c.getClassTeacherId());
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
                               TeacherRepository teacherRepository) {
        this.studentRepository = studentRepository;
        this.classRepository = classRepository;
        this.userRepository = userRepository;
        this.teacherRepository = teacherRepository;
    }
}

