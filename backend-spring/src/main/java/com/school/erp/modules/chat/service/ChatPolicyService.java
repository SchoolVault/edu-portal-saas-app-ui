package com.school.erp.modules.chat.service;

import com.school.erp.common.enums.Enums;

import java.util.Locale;

/**
 * Central place for role-to-role chat rules.
 * Keep policy pure + deterministic so it can be reused by REST and WebSocket flows.
 */
public class ChatPolicyService {
    public boolean canStartConversation(String initiatorRole, String targetRole) {
        String a = norm(initiatorRole);
        String b = norm(targetRole);

        // Platform operators may open threads only with campus administrators (not parents/teachers here).
        if (Enums.Role.SUPER_ADMIN.name().equals(a)) {
            return Enums.Role.ADMIN.name().equals(b);
        }

        if (Enums.Role.ADMIN.name().equals(a)) {
            return true;
        }

        // Library / generic school staff: coordinate with admins and teachers only.
        if (Enums.Role.LIBRARY_STAFF.name().equals(a) || Enums.Role.SCHOOL_STAFF.name().equals(a)) {
            return Enums.Role.ADMIN.name().equals(b) || Enums.Role.TEACHER.name().equals(b);
        }

        // Teachers can talk to parents/students/admins
        if (Enums.Role.TEACHER.name().equals(a)) {
            return Enums.Role.PARENT.name().equals(b)
                    || Enums.Role.STUDENT.name().equals(b)
                    || Enums.Role.ADMIN.name().equals(b)
                    || Enums.Role.LIBRARY_STAFF.name().equals(b)
                    || Enums.Role.SCHOOL_STAFF.name().equals(b);
        }

        // Parents may start chats only with teachers (homeroom/subject linkage enforced in ChatService).
        if (Enums.Role.PARENT.name().equals(a)) {
            return Enums.Role.TEACHER.name().equals(b);
        }

        // Students can talk to teachers/admins
        if (Enums.Role.STUDENT.name().equals(a)) {
            return Enums.Role.TEACHER.name().equals(b)
                    || Enums.Role.ADMIN.name().equals(b);
        }

        return false;
    }

    private String norm(String role) {
        return role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
    }
}

