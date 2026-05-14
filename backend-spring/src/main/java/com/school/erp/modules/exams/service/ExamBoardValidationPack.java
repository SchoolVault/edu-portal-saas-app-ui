package com.school.erp.modules.exams.service;

import com.school.erp.common.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

@Component
public class ExamBoardValidationPack {
    private static final Set<String> SUPPORTED_BOARDS = Set.of("CBSE", "ICSE", "STATE", "IB", "CAMBRIDGE");
    private static final Set<String> SUPPORTED_SESSION_TYPES = Set.of("PERIODIC", "HALF_YEARLY", "ANNUAL", "BOARD");
    private static final Set<String> SUPPORTED_ASSESSMENT_KINDS = Set.of("THEORY", "PRACTICAL", "VIVA", "PROJECT", "HYBRID");

    public void validateExamDefinition(String boardCode, String sessionType, String assessmentKind, String termCode) {
        String board = normalizeOrDefault(boardCode, "STATE");
        String session = normalizeOrDefault(sessionType, "PERIODIC");
        String kind = normalizeOrDefault(assessmentKind, "THEORY");
        String term = normalizeOrDefault(termCode, "TERM1");
        if (!SUPPORTED_BOARDS.contains(board)) {
            throw new BusinessException("Unsupported board. Allowed: " + SUPPORTED_BOARDS);
        }
        if (!SUPPORTED_SESSION_TYPES.contains(session)) {
            throw new BusinessException("Unsupported sessionType. Allowed: " + SUPPORTED_SESSION_TYPES);
        }
        if (!SUPPORTED_ASSESSMENT_KINDS.contains(kind)) {
            throw new BusinessException("Unsupported assessmentKind. Allowed: " + SUPPORTED_ASSESSMENT_KINDS);
        }
        if (!term.matches("[A-Z0-9_\\-]{3,20}")) {
            throw new BusinessException("Term code must be 3-20 chars, uppercase letters/digits/_/-.");
        }
    }

    public void validateMarksRange(String boardCode, double marksObtained, double maxMarks) {
        String board = normalizeOrDefault(boardCode, "STATE");
        if ("IB".equals(board) && maxMarks > 8) {
            throw new BusinessException("IB aligned assessments should use small-band max marks (<= 8) unless using converted scale.");
        }
        if (marksObtained < 0 || maxMarks <= 0 || marksObtained > maxMarks) {
            throw new BusinessException("Marks must satisfy 0 <= obtained <= max.");
        }
    }

    public String normalizeOrDefault(String raw, String fallback) {
        if (raw == null || raw.isBlank()) {
            return fallback;
        }
        return raw.trim().toUpperCase(Locale.ROOT);
    }
}
