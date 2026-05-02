package com.school.erp.modules.feesv2.repository.projection;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Spring Data JPA projection for outstanding fee demands grouped by student. */
public interface DefaulterSummaryRow {
    Long getStudentId();

    Long getClassId();

    BigDecimal getTotalOutstanding();

    Long getDemandCount();

    LocalDate getOldestDueDate();
}
