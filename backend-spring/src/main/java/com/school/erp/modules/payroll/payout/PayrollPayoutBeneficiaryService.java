package com.school.erp.modules.payroll.payout;

import com.school.erp.modules.payroll.entity.PayrollPayoutBeneficiary;
import com.school.erp.modules.payroll.repository.PayrollPayoutBeneficiaryRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayrollPayoutBeneficiaryService {
    private final PayrollPayoutBeneficiaryRepository repository;

    public PayrollPayoutBeneficiaryService(PayrollPayoutBeneficiaryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public Optional<PayrollPayoutBeneficiary> findExisting(
            String tenantId, Long teacherId, String provider, String accountNumber, String ifsc) {
        String fingerprint = bankFingerprint(accountNumber, ifsc);
        return repository.findByTenantIdAndTeacherIdAndProviderAndBankFingerprintAndIsDeletedFalse(
                tenantId, teacherId, provider, fingerprint);
    }

    @Transactional
    public PayrollPayoutBeneficiary saveOrReuse(
            String tenantId,
            Long teacherId,
            String provider,
            String accountNumber,
            String ifsc,
            String contactId,
            String fundAccountId) {
        String fingerprint = bankFingerprint(accountNumber, ifsc);
        Optional<PayrollPayoutBeneficiary> existing = repository
                .findByTenantIdAndTeacherIdAndProviderAndBankFingerprintAndIsDeletedFalse(tenantId, teacherId, provider, fingerprint);
        if (existing.isPresent()) {
            return existing.get();
        }
        PayrollPayoutBeneficiary row = new PayrollPayoutBeneficiary();
        row.setTenantId(tenantId);
        row.setTeacherId(teacherId);
        row.setProvider(provider);
        row.setContactId(contactId);
        row.setFundAccountId(fundAccountId);
        row.setBankFingerprint(fingerprint);
        row.setIfscCode(ifsc != null ? ifsc.trim().toUpperCase(Locale.ROOT) : null);
        row.setAccountMasked(maskAccount(accountNumber));
        return repository.save(row);
    }

    private static String bankFingerprint(String accountNumber, String ifsc) {
        String raw = (accountNumber != null ? accountNumber.replaceAll("\\s+", "") : "")
                + "|"
                + (ifsc != null ? ifsc.trim().toUpperCase(Locale.ROOT) : "");
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    private static String maskAccount(String accountNumber) {
        if (accountNumber == null || accountNumber.isBlank()) return "****";
        String cleaned = accountNumber.replaceAll("\\s+", "");
        if (cleaned.length() <= 4) return "****";
        return "****" + cleaned.substring(cleaned.length() - 4);
    }
}
