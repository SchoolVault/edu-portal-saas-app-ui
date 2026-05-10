package com.school.erp.modules.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.modules.ai.domain.AiToolLog;
import com.school.erp.modules.ai.repository.AiToolLogRepository;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

class AiFollowupContextResolverTest {

    @Test
    void shouldHydrateClassSectionFromLastSuccessfulToolCall() {
        AiToolLogRepository repository = Mockito.mock(AiToolLogRepository.class);
        AiToolLog log = new AiToolLog();
        log.setStatus("SUCCESS");
        log.setToolName("StudentRosterTool");
        log.setRequestJson("{\"query\":\"show all students from class 9 section A\",\"className\":\"Class 9\",\"sectionName\":\"A\"}");
        Mockito.when(repository.findTop20ByTenantIdAndConversationKeyAndIsDeletedFalseOrderByIdDesc("t1", "c1"))
                .thenReturn(List.of(log));

        AiFollowupContextResolver resolver = new AiFollowupContextResolver(repository, new ObjectMapper());
        Map<String, Object> resolved = resolver.resolve(
                "t1",
                "c1",
                "show only section-wise for that class",
                "AcademicManagementTool",
                Map.of("query", "show only section-wise for that class"));

        Assertions.assertEquals("Class 9", resolved.get("className"));
        Assertions.assertEquals("A", resolved.get("sectionName"));
    }
}
