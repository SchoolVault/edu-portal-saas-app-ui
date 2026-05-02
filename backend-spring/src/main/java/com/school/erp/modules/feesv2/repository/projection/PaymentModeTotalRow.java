package com.school.erp.modules.feesv2.repository.projection;

import com.school.erp.modules.feesv2.domain.FeeV2Enums.PaymentMode;
import java.math.BigDecimal;

public interface PaymentModeTotalRow {
    PaymentMode getPaymentMode();

    BigDecimal getTotalAmount();

    Long getPaymentCount();
}
