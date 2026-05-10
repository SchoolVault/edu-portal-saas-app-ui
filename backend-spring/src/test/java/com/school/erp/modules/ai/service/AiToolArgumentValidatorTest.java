package com.school.erp.modules.ai.service;

import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import com.school.erp.modules.academic.service.CurrentAcademicYearResolver;

class AiToolArgumentValidatorTest {

    private final CurrentAcademicYearResolver currentAcademicYearResolver = Mockito.mock(CurrentAcademicYearResolver.class);
    private final AiToolArgumentValidator validator = new AiToolArgumentValidator(new AiEntityResolver(), currentAcademicYearResolver);
    private static final AiTooling.ToolDefinition DEFAULT_DEF =
            new AiTooling.ToolDefinition("x", "x", java.util.List.of());
    private static final AiTooling.ToolDefinition YEAR_DEF =
            new AiTooling.ToolDefinition("y", "y", java.util.List.of(), java.util.List.of(), java.util.List.of(), java.util.List.of(), true);

    @Test
    void shouldExtractClassAndSectionForCountStudentsTool() {
        var result = validator.validateAndNormalize(
                DEFAULT_DEF,
                "CountStudentsTool",
                Map.of("asOf", "today"),
                "Show me count of all students in class 9 and section A",
                "tenant-a");

        Assertions.assertTrue(result.valid());
        Assertions.assertEquals("Class 9", result.normalizedInput().get("className"));
        Assertions.assertEquals("A", result.normalizedInput().get("sectionName"));

        var hyphen = validator.validateAndNormalize(
                DEFAULT_DEF,
                "CountStudentsTool",
                Map.of("asOf", "today"),
                "how many students are there in class 9 - A",
                "tenant-a");
        Assertions.assertTrue(hyphen.valid());
        Assertions.assertEquals("Class 9", hyphen.normalizedInput().get("className"));
        Assertions.assertEquals("A", hyphen.normalizedInput().get("sectionName"));
    }

    @Test
    void shouldRequireClassSectionForRosterTools() {
        var ok = validator.validateAndNormalize(
                DEFAULT_DEF,
                "StudentRosterTool",
                Map.of("query", "Show all students from class 8 section A"),
                "Show all students from class 8 section A",
                "tenant-a");
        Assertions.assertTrue(ok.valid());
        Assertions.assertEquals("Class 8", ok.normalizedInput().get("className"));
        Assertions.assertEquals("A", ok.normalizedInput().get("sectionName"));

        var bad = validator.validateAndNormalize(DEFAULT_DEF, "StudentRosterTool", Map.of("query", "Show all students"), "Show all students", "tenant-a");
        Assertions.assertFalse(bad.valid());
    }

    @Test
    void shouldAllowAcademicManagementPromptAndExtractClassHint() {
        var result = validator.validateAndNormalize(
                DEFAULT_DEF,
                "AcademicManagementTool",
                Map.of("query", "Show section details for class 8"),
                "Show section details for class 8",
                "tenant-a");
        Assertions.assertTrue(result.valid());
        Assertions.assertEquals("Class 8", result.normalizedInput().get("className"));
    }

    @Test
    void shouldNormalizeMonthForFeeAndPayrollTools() {
        var feeResult = validator.validateAndNormalize(DEFAULT_DEF, "GenerateFeeReportTool", Map.of(), "fee collection summary for april", "tenant-a");
        var payrollResult = validator.validateAndNormalize(DEFAULT_DEF, "PayrollPendingApprovalsTool", Map.of(), "payroll pending approvals this month", "tenant-a");

        Assertions.assertTrue(feeResult.valid());
        Assertions.assertTrue(String.valueOf(feeResult.normalizedInput().get("month")).matches("\\d{4}-\\d{2}"));
        Assertions.assertTrue(payrollResult.valid());
        Assertions.assertTrue(String.valueOf(payrollResult.normalizedInput().get("month")).matches("\\d{4}-\\d{2}"));
    }

    @Test
    void shouldInjectAcademicYearWhenToolRequiresIt() {
        Mockito.when(currentAcademicYearResolver.resolveCurrentAcademicYearId("tenant-a")).thenReturn(2026L);
        var result = validator.validateAndNormalize(YEAR_DEF, "TeacherModuleTool", Map.of("query", "teacher summary"), "teacher summary", "tenant-a");
        Assertions.assertTrue(result.valid());
        Assertions.assertEquals(2026L, result.normalizedInput().get("academicYearId"));
    }

    @Test
    void shouldRejectWhenAcademicYearMissingForYearSensitiveTool() {
        Mockito.when(currentAcademicYearResolver.resolveCurrentAcademicYearId("tenant-b")).thenReturn(null);
        var result = validator.validateAndNormalize(YEAR_DEF, "TeacherModuleTool", Map.of("query", "teacher summary"), "teacher summary", "tenant-b");
        Assertions.assertFalse(result.valid());
        Assertions.assertTrue(result.errors().stream().anyMatch(e -> e.contains("academicYearId")));
    }
}
