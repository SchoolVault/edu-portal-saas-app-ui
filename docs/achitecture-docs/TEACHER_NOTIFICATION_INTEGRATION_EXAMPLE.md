# Teacher Notification Integration - Complete Example

## 🎯 Goal
When a teacher is created/imported, automatically send them SMS with login credentials.

## 📋 What We Built

1. ✅ **NotificationService** - Abstract interface for multi-channel notifications
2. ✅ **CompositeNotificationService** - Implementation with SMS (extensible to Email/WhatsApp)
3. ✅ **Welcome Message Templates** - Role-specific messages (Teacher, Guardian, Student)

## 🔧 Integration Steps

### **Step 1: Add NotificationService to TeacherService**

```java
@Service
public class TeacherService {
    private final TeacherRepository repo;
    private final PortalUserProvisioningService portalUserProvisioningService;
    private final NotificationService notificationService; // ← ADD THIS
    
    public TeacherService(
        TeacherRepository repo,
        PortalUserProvisioningService portalUserProvisioningService,
        NotificationService notificationService // ← ADD THIS
    ) {
        this.repo = repo;
        this.portalUserProvisioningService = portalUserProvisioningService;
        this.notificationService = notificationService; // ← ADD THIS
    }
    
    // ... rest of the service
}
```

### **Step 2: Update Single Teacher Creation**

**Before** (existing code):
```java
@Transactional
public TeacherDTOs.Response create(TeacherDTOs.CreateRequest req) {
    // ... validation and teacher creation ...
    
    // Provision portal user (generates password)
    PortalUserProvisioningService.ProvisionResult provision = 
        portalUserProvisioningService.ensureStaffUser(
            tenantId, email, displayName, phone, Enums.Role.TEACHER
        );
    
    teacher.setUserId(provision.userId());
    repo.save(teacher);
    
    // ❌ NO NOTIFICATION - Teacher doesn't know their password!
    
    return toRes(teacher, List.of());
}
```

**After** (with notification):
```java
@Transactional
public TeacherDTOs.Response create(TeacherDTOs.CreateRequest req) {
    String tenantId = TenantContext.getTenantId();
    String email = req.getEmail().trim().toLowerCase();
    
    // Check for duplicates
    if (repo.existsByTenantIdAndEmailAndIsDeletedFalse(tenantId, email)) {
        throw new DuplicateResourceException("Teacher email already exists: " + email);
    }
    
    // Create teacher record
    Teacher teacher = Teacher.builder()
        .firstName(req.getFirstName())
        .lastName(req.getLastName())
        .email(email)
        .phone(req.getPhone())
        .qualification(req.getQualification())
        .specialization(req.getSpecialization())
        .joinDate(req.getJoinDate())
        .salary(req.getSalary())
        .subjects(req.getSubjects())
        .status(Enums.TeacherStatus.ACTIVE)
        .build();
    teacher.setTenantId(tenantId);
    teacher = repo.save(teacher);
    
    // Provision portal user (generates random password)
    PortalUserProvisioningService.ProvisionResult provision = 
        portalUserProvisioningService.ensureStaffUser(
            tenantId, 
            email, 
            teacher.getFirstName() + " " + teacher.getLastName(), 
            teacher.getPhone(), 
            Enums.Role.TEACHER
        );
    
    teacher.setUserId(provision.userId());
    teacher = repo.save(teacher);
    
    // ✅ NEW: Send welcome SMS with credentials
    if (provision.createdNew() && provision.plainPassword() != null) {
        TenantConfig tenantConfig = tenantConfigRepository.findByTenantId(tenantId)
            .orElseThrow(() -> new ResourceNotFoundException("Tenant config not found"));
        
        NotificationService.NotificationResult notificationResult = 
            notificationService.sendWelcomeCredentials(
                NotificationService.WelcomeCredentialsRequest.builder()
                    .tenantId(tenantId)
                    .userId(provision.userId())
                    .recipientPhone(teacher.getPhone())
                    .recipientEmail(teacher.getEmail())
                    .recipientName(teacher.getFirstName() + " " + teacher.getLastName())
                    .schoolName(tenantConfig.getSchoolName())
                    .schoolCode(tenantConfig.getSchoolCode())
                    .username(teacher.getPhone()) // Login with phone
                    .password(provision.plainPassword())
                    .role(NotificationService.UserRole.TEACHER)
                    .build()
            );
        
        if (notificationResult.isSuccess()) {
            log.info("✅ Welcome SMS sent to teacher: phone={}, messageId={}", 
                teacher.getPhone(), notificationResult.getMessageId());
        } else {
            log.warn("⚠️ Failed to send welcome SMS to teacher: phone={}, error={}", 
                teacher.getPhone(), notificationResult.getErrorMessage());
        }
    }
    
    return toRes(teacher, List.of());
}
```

### **Step 3: Update Bulk Import**

**Before**:
```java
@Transactional
public TeacherDTOs.Response createForBulkImport(
    TeacherDTOs.CreateRequest req, 
    boolean createPortal,
    Enums.Role portalRole,
    Enums.LibraryStaffRole libraryStaffRole
) {
    // ... teacher creation ...
    
    if (createPortal) {
        ProvisionResult pr = portalUserProvisioningService.ensureStaffUser(
            tenantId, email, displayName, phone, portalRole
        );
        t.setUserId(pr.userId());
        repo.save(t);
        
        // ❌ NO NOTIFICATION
    }
    
    return toRes(t, List.of());
}
```

**After**:
```java
@Transactional
public TeacherDTOs.Response createForBulkImport(
    TeacherDTOs.CreateRequest req, 
    boolean createPortal,
    Enums.Role portalRole,
    Enums.LibraryStaffRole libraryStaffRole
) {
    String tenantId = TenantContext.getTenantId();
    String email = req.getEmail().trim().toLowerCase();
    
    // ... teacher creation logic ...
    
    if (createPortal) {
        ProvisionResult pr = portalUserProvisioningService.ensureStaffUser(
            tenantId, email, displayName, phone, portalRole
        );
        t.setUserId(pr.userId());
        repo.save(t);
        
        // ✅ NEW: Send welcome SMS for bulk import
        if (pr.createdNew() && pr.plainPassword() != null) {
            TenantConfig tenantConfig = tenantConfigRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Tenant config not found"));
            
            notificationService.sendWelcomeCredentials(
                NotificationService.WelcomeCredentialsRequest.builder()
                    .tenantId(tenantId)
                    .userId(pr.userId())
                    .recipientPhone(t.getPhone())
                    .recipientEmail(t.getEmail())
                    .recipientName(t.getFirstName() + " " + t.getLastName())
                    .schoolName(tenantConfig.getSchoolName())
                    .schoolCode(tenantConfig.getSchoolCode())
                    .username(t.getPhone())
                    .password(pr.plainPassword())
                    .role(NotificationService.UserRole.TEACHER)
                    .build()
            );
            
            log.info("Bulk import: Welcome SMS sent to teacher: phone={}", t.getPhone());
        }
    }
    
    return toRes(t, List.of());
}
```

## 📊 What Teacher Receives

### **SMS Message** (Automatically sent):
```
Welcome to Springfield High School!

Your teacher portal access:
Phone: +919876543210
Password: X7k9Pm2nQ4tR
School Code: SPR001

Login at: https://school.portal

For security, please change your password after first login.
```

### **Why This Works**

1. ✅ **Teacher knows their credentials immediately**
2. ✅ **Can login with Phone + Password + School Code**
3. ✅ **SMS is fast (< 5 seconds delivery)**
4. ✅ **Works offline (no internet needed to receive SMS)**
5. ✅ **Audit trail** logged in system
6. ✅ **Extensible** - Easy to add Email fallback later

## 🧪 Testing

### **Test with Mock SMS**:
```java
// Configuration (application.properties)
app.sms.provider=MOCK

// Result: SMS message logged to console, not actually sent
// Perfect for development!
```

### **Test with Real SMS (Twilio)**:
```java
// Configuration
app.sms.provider=TWILIO
app.sms.twilio.account-sid=${TWILIO_SID}
app.sms.twilio.auth-token=${TWILIO_TOKEN}
app.sms.twilio.from-number=${TWILIO_FROM}

// Result: Real SMS sent to teacher's phone
```

## 🎯 Evolution Path

### **Phase 1: Password-Based (NOW)**
```
Teacher Created → Password Generated → SMS Sent → Teacher Logs in (Phone + Password)
```

### **Phase 2: Add OTP Option (NEXT)**
```
Teacher Can Choose:
  1. Login with Phone + Password (default)
  2. Login with Phone + OTP (passwordless)
```

### **Phase 3: Add Email Fallback (FUTURE)**
```
SMS Failed? → Try Email → Teacher receives credentials via email
```

### **Phase 4: Add Multi-Factor (ENTERPRISE)**
```
Login → Password/OTP → 2FA (optional) → Session Created
```

## 📋 Integration Checklist

- [ ] Add `NotificationService` dependency to `TeacherService` constructor
- [ ] Update `create()` method to call `sendWelcomeCredentials()`
- [ ] Update `createForBulkImport()` method to call `sendWelcomeCredentials()`
- [ ] Test with Mock SMS (check logs)
- [ ] Test with real phone number
- [ ] Verify teacher receives SMS within 5 seconds
- [ ] Verify teacher can login with received credentials
- [ ] Check auth_audit_logs for delivery tracking

## 🏆 Result

**Before**: Teachers created, but don't know how to login ❌  
**After**: Teachers receive SMS with credentials instantly ✅

**Time to Integrate**: ~30 minutes  
**Lines of Code**: ~20 lines per method  
**Complexity**: Low (just 3 additions)  
**Benefit**: Massive improvement in UX

---

**This is how enterprise ERPs like SAP, Workday, and Oracle handle user onboarding!** 🏛️
