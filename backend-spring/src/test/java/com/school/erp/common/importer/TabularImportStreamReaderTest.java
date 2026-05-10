package com.school.erp.common.importer;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class TabularImportStreamReaderTest {

    @Test
    void normalizeImportedHeaderLabel_stripsTemplateRequiredOptionalSuffix() {
        assertEquals("subject_code", TabularImportStreamReader.normalizeImportedHeaderLabel("subject_code (R)"));
        assertEquals("academic_year_id", TabularImportStreamReader.normalizeImportedHeaderLabel("academic_year_id (O) "));
        assertEquals("period_no", TabularImportStreamReader.normalizeImportedHeaderLabel("PERIOD_NO (r)"));
    }
}
