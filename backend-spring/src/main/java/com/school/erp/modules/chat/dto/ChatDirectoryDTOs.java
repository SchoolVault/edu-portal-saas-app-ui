package com.school.erp.modules.chat.dto;

import java.util.List;

/** Frontend mirror: {@code frontend/src/app/core/models/chat-directory.dto.ts} ({@code ChatDirectoryDtos}). */
public class ChatDirectoryDTOs {
    public static class DirectoryResponse {
        private List<ClassRoster> myClassRosters;       // teacher/admin
        private List<ParentChildRoster> myChildren;     // parent
        private List<UserCard> teachers;                // admin
        private List<UserCard> parents;                 // admin

        public List<ClassRoster> getMyClassRosters() { return myClassRosters; }
        public void setMyClassRosters(List<ClassRoster> myClassRosters) { this.myClassRosters = myClassRosters; }
        public List<ParentChildRoster> getMyChildren() { return myChildren; }
        public void setMyChildren(List<ParentChildRoster> myChildren) { this.myChildren = myChildren; }
        public List<UserCard> getTeachers() { return teachers; }
        public void setTeachers(List<UserCard> teachers) { this.teachers = teachers; }
        public List<UserCard> getParents() { return parents; }
        public void setParents(List<UserCard> parents) { this.parents = parents; }
    }

    public static class ClassRoster {
        private Long classId;
        private String className;
        private Long sectionId;
        private String sectionName;
        private List<StudentCard> students;

        public Long getClassId() { return classId; }
        public void setClassId(Long classId) { this.classId = classId; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public Long getSectionId() { return sectionId; }
        public void setSectionId(Long sectionId) { this.sectionId = sectionId; }
        public String getSectionName() { return sectionName; }
        public void setSectionName(String sectionName) { this.sectionName = sectionName; }
        public List<StudentCard> getStudents() { return students; }
        public void setStudents(List<StudentCard> students) { this.students = students; }
    }

    public static class ParentChildRoster {
        private Long studentId;
        private String studentName;
        private Long classId;
        private String className;
        private Long sectionId;
        private String sectionName;
        private UserCard classTeacher; // primary teacher for now

        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public Long getClassId() { return classId; }
        public void setClassId(Long classId) { this.classId = classId; }
        public String getClassName() { return className; }
        public void setClassName(String className) { this.className = className; }
        public Long getSectionId() { return sectionId; }
        public void setSectionId(Long sectionId) { this.sectionId = sectionId; }
        public String getSectionName() { return sectionName; }
        public void setSectionName(String sectionName) { this.sectionName = sectionName; }
        public UserCard getClassTeacher() { return classTeacher; }
        public void setClassTeacher(UserCard classTeacher) { this.classTeacher = classTeacher; }
    }

    public static class StudentCard {
        private Long studentId;
        private String studentName;
        private UserCard parent;

        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public UserCard getParent() { return parent; }
        public void setParent(UserCard parent) { this.parent = parent; }
    }

    public static class UserCard {
        private Long userId;
        private String name;
        private String role;
        /** Admin directory: children linked to this parent account (for chat identity). */
        private List<LinkedStudentBrief> linkedStudents;
        private Integer linkedStudentTotal;

        public UserCard() {}
        public UserCard(Long userId, String name, String role) {
            this.userId = userId;
            this.name = name;
            this.role = role;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public List<LinkedStudentBrief> getLinkedStudents() { return linkedStudents; }
        public void setLinkedStudents(List<LinkedStudentBrief> linkedStudents) { this.linkedStudents = linkedStudents; }
        public Integer getLinkedStudentTotal() { return linkedStudentTotal; }
        public void setLinkedStudentTotal(Integer linkedStudentTotal) { this.linkedStudentTotal = linkedStudentTotal; }
    }

    public static class LinkedStudentBrief {
        private Long studentId;
        private String studentName;
        private String classShort;

        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        public String getClassShort() { return classShort; }
        public void setClassShort(String classShort) { this.classShort = classShort; }
    }
}

