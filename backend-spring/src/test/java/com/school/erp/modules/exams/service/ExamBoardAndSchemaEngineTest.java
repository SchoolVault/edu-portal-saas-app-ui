package com.school.erp.modules.exams.service;

import com.school.erp.modules.exams.dto.ExamDTOs;
import com.school.erp.modules.exams.entity.MarkRecord;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

class ExamBoardAndSchemaEngineTest {

    private final ExamBoardValidationPack boardValidationPack = new ExamBoardValidationPack();
    private final ExamReportCardSchemaEngine schemaEngine = new ExamReportCardSchemaEngine();

    @Test
    void boardPackAcceptsSupportedDefinition() {
        boardValidationPack.validateExamDefinition("CBSE", "PERIODIC", "THEORY", "TERM1");
        boardValidationPack.validateMarksRange("CBSE", 89, 100);
    }

    @Test
    void boardPackRejectsUnknownBoard() {
        Assertions.assertThrows(RuntimeException.class, () ->
                boardValidationPack.validateExamDefinition("UNKNOWN", "PERIODIC", "THEORY", "TERM1"));
    }

    @Test
    void schemaEngineRendersConfiguredSections() {
        ExamDTOs.MarkResponse row = ExamDTOs.MarkResponse.builder()
                .studentId(10L)
                .subjectName("Math")
                .marksObtained(91.0)
                .maxMarks(100.0)
                .grade("A1")
                .build();
        List<ExamDTOs.ReportCardSection> sections = schemaEngine.renderSections(
                Map.of("sections", List.of("header", "subjects", "totals", "remarks")),
                List.<MarkRecord>of(),
                List.of(row),
                91.0,
                100.0,
                91.0,
                "A1",
                "en");
        Assertions.assertEquals(4, sections.size());
        Assertions.assertEquals("header", sections.get(0).getKey());
        Assertions.assertEquals("subjects", sections.get(1).getKey());
    }
}
