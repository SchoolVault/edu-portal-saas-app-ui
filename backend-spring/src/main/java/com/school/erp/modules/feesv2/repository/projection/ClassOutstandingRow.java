package com.school.erp.modules.feesv2.repository.projection;

import java.math.BigDecimal;

public interface ClassOutstandingRow {
    Long getClassId();

    BigDecimal getTotalOutstanding();

    BigDecimal getTotalDemanded();
}
