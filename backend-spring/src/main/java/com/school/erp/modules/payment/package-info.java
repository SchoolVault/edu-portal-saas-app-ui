/**
 * Shared payment contracts for the ERP: DTOs ({@link com.school.erp.modules.payment.dto.PaymentDTOs}),
 * canonical provider ids ({@link com.school.erp.modules.payment.domain.PaymentProviderIds}),
 * and checkout purpose strings ({@link com.school.erp.modules.payment.domain.PaymentCheckoutPurpose}).
 *
 * <p><strong>Extension:</strong> Domain modules (fees, payroll) plug gateways via their own
 * strategy interfaces; reuse this package for identifiers and cross-cutting DTOs only.
 */
package com.school.erp.modules.payment;
