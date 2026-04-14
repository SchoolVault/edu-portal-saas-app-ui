# Demo Data Seed Service - Fixes Applied

## Issue: Duplicate Receipt Number Constraint Violation

### Error Message:
```
Caused by: java.sql.SQLIntegrityConstraintViolationException: 
Duplicate entry 'tenant_dps_delhi_9x4k7m2p-RCP1776155328078595' 
for key 'fee_payments.uq_fee_payment_tenant_receipt'
```

## Root Cause Analysis

The `FeePayment` entity has a unique constraint on `(tenant_id, receipt_number)`:

```java
@UniqueConstraint(
    name = "uq_fee_payment_tenant_receipt",
    columnNames = {"tenant_id", "receipt_number"}
)
```

The original receipt number generation was:
```java
"RCP" + System.currentTimeMillis() + random.nextInt(1000)
```

**Problem:** When creating hundreds of fee payments in quick succession:
- `System.currentTimeMillis()` returns the same value for multiple payments (millisecond precision)
- `random.nextInt(1000)` has only 1000 possible values
- High collision probability when creating 900+ payments

## Fixes Applied

### 1. ✅ Fixed Receipt Number Generation

**Before:**
```java
payment.setReceiptNumber(feeStatus != Enums.FeeStatus.UNPAID ?
    "RCP" + System.currentTimeMillis() + random.nextInt(1000) : null);
```

**After:**
```java
long receiptCounter = System.currentTimeMillis(); // Start counter
for (Student student : allStudents) {
    // ... create payment ...
    payment.setReceiptNumber(feeStatus != Enums.FeeStatus.UNPAID ?
        "RCP" + (receiptCounter++) : null);
}
```

**Why this works:**
- Counter is incremented for each payment (receiptCounter++)
- Guaranteed unique within a single execution
- Still includes timestamp for uniqueness across multiple executions

### 2. ✅ Added Idempotency Check

**Added to `seedSchool()` method:**
```java
// Check if school already has data - if yes, skip to avoid duplicates
long existingStudents = studentRepository.countByTenantIdAndIsDeletedFalse(tenantId);
if (existingStudents > 0) {
    log.info("  ⚠️  School {} already has {} students - SKIPPING to avoid duplicates",
             schoolCode, existingStudents);
    log.info("  To re-seed, manually delete existing data or use a fresh database");
    return;
}
```

**Benefits:**
- Prevents duplicate data creation
- Safe to run seed service multiple times
- Clear messaging about what's happening

### 3. ✅ Enhanced Error Handling

**Added try-catch in `seedIfNeeded()`:**
```java
try {
    // ... seeding logic ...
} catch (Exception e) {
    log.error("❌ DEMO DATA SEED FAILED!");
    log.error("Error: {}", e.getMessage());
    log.error("Troubleshooting tips:");
    log.error("1. Check if database is accessible");
    log.error("2. If you see duplicate key errors, data might already exist");
    log.error("3. To re-seed, use a fresh database or manually delete existing data");
    throw new RuntimeException("Demo data seeding failed", e);
}
```

**Benefits:**
- Clear error messages
- Actionable troubleshooting tips
- Prevents silent failures

### 4. ✅ Improved Logging

**Added progress indicators and summaries:**
```java
log.info("  🏫 Starting seed for {} (tenant: {})", schoolName, tenantId);
log.info("  [1/15] Tenant Config...");
log.info("  [2/15] Admin User...");
// ... etc ...
log.info("══════════════════════════════════════════════════════════════");
log.info("✅ School {} SEEDED SUCCESSFULLY!", schoolCode);
log.info("   Students: {}", allStudents.size());
log.info("   Teachers: {}", teachers.size());
```

## Other Potential Issues Fixed

### Admission Number Uniqueness
✅ Already handled correctly with counter:
```java
int admissionCounter = 1000;
String admissionNumber = schoolCode + "-2025-" + String.format("%04d", admissionCounter++);
```

### User Email Uniqueness
✅ Already handled correctly with:
```java
if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(email, tenantId)) {
    return userRepository.findByEmailAndTenantIdAndIsDeletedFalse(email, tenantId).get();
}
```

### Other Unique Constraints
All other unique constraints checked:
- ✅ Student: (tenant_id, admission_number) - uses counter
- ✅ Student: (tenant_id, email) - uses counter + name combination
- ✅ User: (tenant_id, email) - checked before creation
- ✅ FeePayment: (tenant_id, receipt_number) - **FIXED with counter**

## Testing Recommendations

### 1. Fresh Database Test
```bash
# Drop and recreate database
mysql -u root -p
DROP DATABASE school_erp;
CREATE DATABASE school_erp;

# Run application with demo-seed profile
spring.profiles.active=demo-seed
```

### 2. Idempotency Test
```bash
# Run seed service twice - should skip on second run
# First run: creates all data
# Second run: logs "already has X students - SKIPPING"
```

### 3. Data Verification
```sql
-- Check receipt number uniqueness
SELECT receipt_number, COUNT(*) as count
FROM fee_payments
WHERE receipt_number IS NOT NULL
GROUP BY receipt_number
HAVING count > 1;
-- Should return 0 rows

-- Check admission number uniqueness
SELECT admission_number, COUNT(*) as count
FROM students
GROUP BY admission_number
HAVING count > 1;
-- Should return 0 rows

-- Check user email uniqueness per tenant
SELECT tenant_id, email, COUNT(*) as count
FROM users
GROUP BY tenant_id, email
HAVING count > 1;
-- Should return 0 rows
```

### 4. Data Completeness Check
```sql
-- School 1: DPS-DLH
SELECT 
    (SELECT COUNT(*) FROM students WHERE tenant_id='tenant_dps_delhi_9x4k7m2p') as students,
    (SELECT COUNT(*) FROM teachers WHERE tenant_id='tenant_dps_delhi_9x4k7m2p') as teachers,
    (SELECT COUNT(*) FROM fee_payments WHERE tenant_id='tenant_dps_delhi_9x4k7m2p') as fee_payments,
    (SELECT COUNT(*) FROM attendance_records WHERE tenant_id='tenant_dps_delhi_9x4k7m2p') as attendance,
    (SELECT COUNT(*) FROM mark_records WHERE tenant_id='tenant_dps_delhi_9x4k7m2p') as marks;

-- Expected: ~900 students, 30 teachers, ~900 fee payments, ~8100 attendance records, ~4500 marks
```

## Performance Metrics

**Expected Seeding Time:**
- School 1 (DPS-DLH): 30-45 seconds
- School 2 (KV-MUM): 30-45 seconds
- **Total: ~1-2 minutes**

**Data Created Per School:**
- Students: ~850-945
- Teachers: 30
- Guardians: ~1800 (father + mother per student)
- Classes: 9 (grades 4-12)
- Sections: 27 (A, B, C per class)
- Fee Payments: ~900
- Attendance Records: ~8,000+ (10 days × ~900 students)
- Mark Records: ~4,500 (1 exam × 5 subjects × ~900 students)
- Timetable Entries: ~972 (6 days × 6 periods × 27 sections)
- Books: 100
- Hostel Rooms: 30
- Transport Routes: 3
- Announcements: 5
- Messages: 10
- Documents: 5
- Leave Requests: 15

## Files Modified

1. ✅ `DemoDataSeedService.java` - Fixed receipt generation, added idempotency, enhanced error handling
2. ✅ `DEMO_CREDENTIALS.md` - Added troubleshooting section
3. ✅ `SEED_SERVICE_FIXES.md` - This file (documentation)

## Summary

All identified issues have been fixed:
- ✅ Receipt number duplicate constraint violation - **FIXED**
- ✅ Idempotency for re-runs - **ADDED**
- ✅ Error handling and logging - **ENHANCED**
- ✅ Documentation and troubleshooting - **IMPROVED**

The seed service is now **production-ready** for QA testing!

---

**Fixed By:** Claude Code
**Date:** 2026-04-14
**Status:** ✅ RESOLVED - Ready for testing
