# Phone-Based Authentication Architecture
## Migration from Email-Primary to Phone-Primary Authentication

**Document Version:** 1.0  
**Date:** 2026-04-14  
**Author:** Senior Architecture Review  
**Status:** ANALYSIS & DESIGN PHASE (No Code Changes Yet)

---

## Executive Summary

This document outlines the architectural strategy for migrating SchoolVault ERP from email-based authentication to phone-based authentication, targeting rural and urban schools where phone accessibility exceeds email usage.

**Key Goals:**
- Make phone number the primary login identifier
- Maintain email as optional secondary identifier
- Support parent-student linking with multiple guardians
- Enable future OTP-based passwordless authentication
- Ensure scalability, modularity, and extensibility

---

## Current State Analysis

### 1. Existing Database Schema

#### User Table (users)
```sql
-- Current constraints and indexes
UNIQUE(tenant_id, email)  -- ❌ BLOCKING: Email required as unique identifier
INDEX(tenant_id, email)    -- ✓ Good for email lookups

-- Fields
email VARCHAR(150) NOT NULL  -- ❌ Must become nullable
phone VARCHAR(20)            -- ✓ Exists but not indexed/unique
password VARCHAR NOT NULL    -- ✓ Keep for now
school_code VARCHAR(100)     -- ✓ Used in login
```

**Issues:**
- Email is mandatory and unique per tenant
- Phone exists but lacks proper indexing
- No composite unique constraint on `{tenant_id, phone}`

#### Guardian Table (guardians) ✓ EXCELLENT FOUNDATION
```sql
-- Already well-designed for phone-based access
primary_phone VARCHAR(30)           -- ✓ Indexed
phones_json JSON                    -- ✓ Supports multiple phones
emails_json JSON                    -- ✓ Optional emails
user_id BIGINT                      -- ✓ Links to User.id for login
INDEX(tenant_id, primary_phone)     -- ✓ Efficient phone lookup
INDEX(tenant_id, user_id)           -- ✓ User linkage
```

**Strengths:**
- Already designed for multiple contacts per guardian
- Supports phone as primary identifier
- Has User linkage mechanism
- Proper indexing for phone-based queries

#### Student Table (students)
```sql
email VARCHAR(150) UNIQUE           -- ⚠️ Student may not have email
phone VARCHAR(20)                   -- ⚠️ May be parent's phone
parent_id BIGINT                    -- ✓ Legacy parent link
primary_contact_guardian_id BIGINT  -- ✓ New guardian system link
```

#### StudentGuardianMapping Table
```sql
student_id BIGINT NOT NULL
guardian_id BIGINT NOT NULL
relation_type ENUM(FATHER, MOTHER, GUARDIAN, OTHER)  -- ✓ Flexible
is_primary BOOLEAN DEFAULT false
is_emergency_contact BOOLEAN DEFAULT false
```

**Key Strength:** Supports multiple guardians per student (father, mother, others)

---

### 2. Current Authentication Flow

#### Backend (Spring Boot)
```java
// Current login method
User user = userRepository.findByEmailAndSchoolCodeAndIsDeletedFalse(
    request.getEmail(), 
    request.getSchoolCode()
);

// ❌ PROBLEM: Only supports email-based lookup
```

#### Frontend (Angular)
```typescript
export interface LoginRequest {
  email: string;      // ❌ Required
  password: string;
  schoolCode: string;
  interfaceLocale?: string;
}
```

---

## Industry Best Practices Analysis

### How Leading School ERPs Handle Multi-Modal Authentication

#### 1. **Fedena, MyClassCampus, SchoolMint Pattern**

**Multi-Identifier Strategy:**
```
Login Identifier = Phone | Email | Username
+ School Code (Tenant Isolation)
+ Password/OTP
```

**Key Features:**
- Normalized phone numbers (E.164 format: +91XXXXXXXXXX)
- Guardian registry with relationship mapping
- SMS gateway with fallback providers
- Template-based notifications
- Bulk import with intelligent guardian linking

#### 2. **Parent-Child Linking Strategies**

**Scenario 1: Single Parent, Multiple Children**
```
Parent Phone: +919876543210
├─ Student A (Class 5) → Guardian Mapping (FATHER, is_primary=true)
├─ Student B (Class 8) → Guardian Mapping (FATHER, is_primary=true)
└─ Student C (Class 3) → Guardian Mapping (FATHER, is_primary=true)

→ ONE Guardian record
→ ONE User account
→ THREE StudentGuardianMapping records
```

**Scenario 2: Both Parents, Shared Phone (Common in India)**
```
Student: Raj Kumar
├─ Father: +919876543210 → Guardian#1 (FATHER, is_primary=true)
└─ Mother: +919876543210 → Guardian#2 (MOTHER, is_primary=false)
                          ↓
                    SAME User account (shared login)
```

**Scenario 3: Both Parents, Different Phones**
```
Student: Priya Sharma
├─ Father: +919876543210 → Guardian#1 → User#1 (separate login)
└─ Mother: +919988776655 → Guardian#2 → User#2 (separate login)

→ Both parents can independently log in
→ Both see Priya in their dashboard
```

**Scenario 4: Multiple Children from Same Parents**
```
Father Phone: +919876543210
Mother Phone: +919988776655

Student A:
├─ Father Guardian#1 → User#1
└─ Mother Guardian#2 → User#2

Student B:
├─ Father Guardian#1 (REUSE) → User#1
└─ Mother Guardian#2 (REUSE) → User#2

→ Guardian records are reused across siblings
→ User accounts are reused across siblings
→ Each student has separate StudentGuardianMapping
```

#### 3. **Phone Normalization Strategy**

```
Input: "98765 43210"  → Normalized: "+919876543210"
Input: "9876543210"   → Normalized: "+919876543210"
Input: "+91987654321" → Normalized: "+919876543210"

Default Country Code: +91 (configurable per tenant)
Validation: Luhn algorithm + carrier lookup
```

---

## Proposed Architecture Design

### Phase 1: Foundation (Weeks 1-2)

#### 1.1 Database Schema Changes

**Migration Script: `V001__add_phone_auth_support.sql`**

```sql
-- Step 1: Make email nullable (backward compatible)
ALTER TABLE users 
  MODIFY COLUMN email VARCHAR(150) NULL;

-- Step 2: Add phone unique constraint
ALTER TABLE users 
  ADD CONSTRAINT uq_user_tenant_phone 
  UNIQUE (tenant_id, phone);

-- Step 3: Add phone index for performance
CREATE INDEX idx_user_phone_lookup 
  ON users(tenant_id, phone, school_code, is_deleted);

-- Step 4: Add identifier type enum for future flexibility
ALTER TABLE users 
  ADD COLUMN primary_identifier_type ENUM('EMAIL', 'PHONE') 
  DEFAULT 'EMAIL';

-- Step 5: Update existing records
UPDATE users 
SET primary_identifier_type = 'EMAIL' 
WHERE email IS NOT NULL;

-- Step 6: Add phone verification fields (future OTP)
ALTER TABLE users 
  ADD COLUMN phone_verified_at TIMESTAMP NULL,
  ADD COLUMN phone_verification_token VARCHAR(100) NULL,
  ADD COLUMN phone_verification_expires_at TIMESTAMP NULL;

-- Step 7: Add password-reset via SMS support
ALTER TABLE users 
  ADD COLUMN password_reset_token VARCHAR(100) NULL,
  ADD COLUMN password_reset_expires_at TIMESTAMP NULL,
  ADD COLUMN password_reset_method ENUM('EMAIL', 'SMS') NULL;
```

**Migration Script: `V002__enhance_guardian_user_link.sql`**

```sql
-- Add metadata for guardian user provisioning
ALTER TABLE guardians 
  ADD COLUMN user_provisioned_at TIMESTAMP NULL,
  ADD COLUMN user_provisioning_method ENUM('MANUAL', 'AUTO_ONBOARD', 'BULK_IMPORT') NULL,
  ADD COLUMN notification_preferences JSON NULL 
    COMMENT 'SMS/Email/Push preferences';

-- Index for faster guardian-to-user lookups
CREATE INDEX idx_guardian_user_lookup 
  ON guardians(tenant_id, user_id, is_deleted);
```

#### 1.2 Entity Layer Changes

**New Interface: `AuthenticationIdentifier.java`**

```java
package com.school.erp.modules.auth.identity;

public interface AuthenticationIdentifier {
    String getValue();
    IdentifierType getType();
    boolean isVerified();
    
    enum IdentifierType {
        EMAIL, PHONE, USERNAME
    }
}
```

**Enhanced User Entity:**

```java
@Entity
@Table(name = "users", 
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"tenant_id", "email"}),
        @UniqueConstraint(columnNames = {"tenant_id", "phone"})  // NEW
    },
    indexes = {
        @Index(name = "idx_user_tenant", columnList = "tenant_id"),
        @Index(name = "idx_user_email", columnList = "tenant_id, email"),
        @Index(name = "idx_user_phone_lookup",  // NEW
               columnList = "tenant_id, phone, school_code, is_deleted")
    }
)
public class User extends BaseEntity {
    @Column(nullable = true, length = 150)  // Changed from nullable = false
    private String email;
    
    @Column(nullable = true, length = 20)
    private String phone;  // Now can be unique identifier
    
    @Enumerated(EnumType.STRING)
    @Column(name = "primary_identifier_type", length = 20)
    private PrimaryIdentifierType primaryIdentifierType = PrimaryIdentifierType.EMAIL;
    
    @Column(name = "phone_verified_at")
    private LocalDateTime phoneVerifiedAt;
    
    // ... rest of fields
}
```

#### 1.3 Repository Layer Changes

**Enhanced UserRepository:**

```java
@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Existing method - keep for backward compatibility
    Optional<User> findByEmailAndSchoolCodeAndIsDeletedFalse(
        String email, String schoolCode);
    
    // NEW: Phone-based lookup
    Optional<User> findByPhoneAndSchoolCodeAndIsDeletedFalse(
        String phone, String schoolCode);
    
    // NEW: Multi-identifier lookup (PREFERRED METHOD)
    @Query("""
        SELECT u FROM User u 
        WHERE u.schoolCode = :schoolCode 
        AND u.isDeleted = false 
        AND u.isActive = true
        AND (
            (:identifier = u.email) OR 
            (:identifier = u.phone)
        )
    """)
    Optional<User> findByIdentifierAndSchoolCode(
        @Param("identifier") String identifier,
        @Param("schoolCode") String schoolCode
    );
    
    // NEW: Check phone availability
    boolean existsByPhoneAndTenantIdAndIsDeletedFalse(
        String phone, String tenantId);
    
    // NEW: Find user by guardian
    @Query("""
        SELECT u FROM User u 
        WHERE u.id = (
            SELECT g.userId FROM Guardian g 
            WHERE g.primaryPhone = :phone 
            AND g.tenantId = :tenantId 
            AND g.isDeleted = false
        )
    """)
    Optional<User> findByGuardianPhone(
        @Param("phone") String phone,
        @Param("tenantId") String tenantId
    );
}
```

**New GuardianRepository Methods:**

```java
@Repository
public interface GuardianRepository extends JpaRepository<Guardian, Long> {
    
    // NEW: Find guardian by phone for linking
    Optional<Guardian> findByPrimaryPhoneAndTenantIdAndIsDeletedFalse(
        String primaryPhone, String tenantId);
    
    // NEW: Find all guardians for a student
    @Query("""
        SELECT g FROM Guardian g
        JOIN StudentGuardianMapping sgm ON g.id = sgm.guardianId
        WHERE sgm.studentId = :studentId
        AND sgm.tenantId = :tenantId
        AND sgm.isDeleted = false
    """)
    List<Guardian> findByStudentId(
        @Param("studentId") Long studentId,
        @Param("tenantId") String tenantId
    );
    
    // NEW: Find all students for a guardian (via User)
    @Query("""
        SELECT s FROM Student s
        JOIN StudentGuardianMapping sgm ON s.id = sgm.studentId
        JOIN Guardian g ON sgm.guardianId = g.id
        WHERE g.userId = :userId
        AND g.tenantId = :tenantId
        AND sgm.isDeleted = false
        AND s.isDeleted = false
    """)
    List<Student> findStudentsByGuardianUserId(
        @Param("userId") Long userId,
        @Param("tenantId") String tenantId
    );
}
```

---

### Phase 2: Authentication Strategy Pattern (Weeks 3-4)

#### 2.1 Design Pattern: Strategy Pattern for Multi-Modal Auth

**Interface: `AuthenticationStrategy.java`**

```java
package com.school.erp.modules.auth.strategy;

public interface AuthenticationStrategy {
    /**
     * Authenticate user with provided credentials
     * @return AuthenticationResult with User and tokens
     */
    AuthenticationResult authenticate(
        AuthenticationRequest request,
        String tenantId
    );
    
    /**
     * Check if this strategy can handle the given identifier
     */
    boolean supports(String identifier);
    
    /**
     * Get strategy type
     */
    AuthStrategyType getType();
    
    enum AuthStrategyType {
        EMAIL_PASSWORD,
        PHONE_PASSWORD,
        PHONE_OTP,        // Future
        LDAP,             // Future
        SSO               // Future
    }
}
```

**Implementation: `PhonePasswordAuthStrategy.java`**

```java
@Component
public class PhonePasswordAuthStrategy implements AuthenticationStrategy {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PhoneNormalizationService phoneService;
    
    @Override
    public AuthenticationResult authenticate(
        AuthenticationRequest request,
        String tenantId
    ) {
        // 1. Normalize phone number
        String normalizedPhone = phoneService.normalize(
            request.getIdentifier(), 
            tenantId
        );
        
        // 2. Find user by phone + school code
        User user = userRepository
            .findByPhoneAndSchoolCodeAndIsDeletedFalse(
                normalizedPhone,
                request.getSchoolCode()
            )
            .orElseThrow(() -> new UnauthorizedException(
                "Invalid credentials or school code"
            ));
        
        // 3. Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new UnauthorizedException("Invalid credentials");
        }
        
        // 4. Check tenant status
        validateTenantActive(user.getTenantId());
        
        // 5. Generate tokens
        return AuthenticationResult.success(user);
    }
    
    @Override
    public boolean supports(String identifier) {
        return phoneService.isValidPhoneNumber(identifier);
    }
    
    @Override
    public AuthStrategyType getType() {
        return AuthStrategyType.PHONE_PASSWORD;
    }
}
```

**Implementation: `EmailPasswordAuthStrategy.java`**

```java
@Component
public class EmailPasswordAuthStrategy implements AuthenticationStrategy {
    // Similar to current implementation
    // Keep for backward compatibility and admin users
}
```

**Orchestrator: `AuthenticationService.java` (Refactored)**

```java
@Service
public class AuthenticationService {
    
    private final List<AuthenticationStrategy> strategies;
    
    public AuthenticationService(List<AuthenticationStrategy> strategies) {
        this.strategies = strategies;
    }
    
    public AuthDTOs.LoginResponse login(AuthDTOs.LoginRequest request) {
        String identifier = determineIdentifier(request);
        
        // Find appropriate strategy
        AuthenticationStrategy strategy = strategies.stream()
            .filter(s -> s.supports(identifier))
            .findFirst()
            .orElseThrow(() -> new BusinessException(
                "No authentication method available for this identifier"
            ));
        
        // Authenticate
        AuthenticationResult result = strategy.authenticate(
            toAuthRequest(request),
            resolveTenantId(request.getSchoolCode())
        );
        
        // Generate JWT and refresh token
        return buildLoginResponse(result.getUser());
    }
    
    private String determineIdentifier(AuthDTOs.LoginRequest request) {
        // Try phone first, fallback to email
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            return request.getPhone();
        }
        return request.getEmail();
    }
}
```

---

### Phase 3: SMS Notification Infrastructure (Weeks 5-6)

#### 3.1 Design Pattern: Factory + Strategy for SMS Providers

**Interface: `SmsProvider.java`**

```java
package com.school.erp.common.notification.sms;

public interface SmsProvider {
    /**
     * Send SMS message
     * @return Message ID from provider
     */
    SmsResult send(SmsRequest request);
    
    /**
     * Get provider name (twilio, aws_sns, custom, etc.)
     */
    String getProviderName();
    
    /**
     * Check if provider is healthy
     */
    boolean isHealthy();
}

public class SmsRequest {
    private String to;           // Normalized phone: +919876543210
    private String message;
    private String templateId;   // Optional template reference
    private Map<String, String> params;  // Template variables
    private String tenantId;
    private Priority priority = Priority.NORMAL;
    
    public enum Priority { HIGH, NORMAL, LOW }
}

public class SmsResult {
    private boolean success;
    private String messageId;
    private String providerResponse;
    private Instant sentAt;
    private String errorCode;
    private String errorMessage;
}
```

**Implementation: `TwilioSmsProvider.java`**

```java
@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "twilio")
public class TwilioSmsProvider implements SmsProvider {
    
    @Value("${app.sms.twilio.account-sid}")
    private String accountSid;
    
    @Value("${app.sms.twilio.auth-token}")
    private String authToken;
    
    @Value("${app.sms.twilio.from-number}")
    private String fromNumber;
    
    private Twilio twilioClient;
    
    @PostConstruct
    public void init() {
        Twilio.init(accountSid, authToken);
    }
    
    @Override
    public SmsResult send(SmsRequest request) {
        try {
            Message message = Message.creator(
                new PhoneNumber(request.getTo()),
                new PhoneNumber(fromNumber),
                request.getMessage()
            ).create();
            
            return SmsResult.success(message.getSid(), Instant.now());
            
        } catch (TwilioException e) {
            log.error("Twilio SMS failed: {}", e.getMessage());
            return SmsResult.failure(e.getCode(), e.getMessage());
        }
    }
    
    @Override
    public String getProviderName() {
        return "twilio";
    }
    
    @Override
    public boolean isHealthy() {
        // Implement health check
        return true;
    }
}
```

**Implementation: `AwsSnsSmsProvider.java`**

```java
@Component
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "aws_sns")
public class AwsSnsSmsProvider implements SmsProvider {
    
    private final SnsClient snsClient;
    
    @Override
    public SmsResult send(SmsRequest request) {
        try {
            PublishRequest publishRequest = PublishRequest.builder()
                .phoneNumber(request.getTo())
                .message(request.getMessage())
                .build();
            
            PublishResponse response = snsClient.publish(publishRequest);
            
            return SmsResult.success(response.messageId(), Instant.now());
            
        } catch (SnsException e) {
            log.error("AWS SNS SMS failed: {}", e.getMessage());
            return SmsResult.failure(e.awsErrorDetails().errorCode(), 
                                     e.getMessage());
        }
    }
    
    @Override
    public String getProviderName() {
        return "aws_sns";
    }
}
```

**Implementation: `MockSmsProvider.java` (Development)**

```java
@Component
@Profile("dev")
@ConditionalOnProperty(name = "app.sms.provider", havingValue = "mock")
public class MockSmsProvider implements SmsProvider {
    
    @Override
    public SmsResult send(SmsRequest request) {
        log.info("📱 MOCK SMS TO: {} | MESSAGE: {}", 
                 request.getTo(), request.getMessage());
        return SmsResult.success("mock-" + UUID.randomUUID(), Instant.now());
    }
    
    @Override
    public String getProviderName() {
        return "mock";
    }
}
```

**Factory: `SmsProviderFactory.java`**

```java
@Component
public class SmsProviderFactory {
    
    private final List<SmsProvider> providers;
    
    @Value("${app.sms.provider}")
    private String primaryProvider;
    
    @Value("${app.sms.fallback-provider:}")
    private String fallbackProvider;
    
    public SmsProviderFactory(List<SmsProvider> providers) {
        this.providers = providers;
    }
    
    public SmsProvider getPrimary() {
        return findProvider(primaryProvider)
            .orElseThrow(() -> new RuntimeException(
                "Primary SMS provider not configured: " + primaryProvider
            ));
    }
    
    public Optional<SmsProvider> getFallback() {
        if (fallbackProvider == null || fallbackProvider.isBlank()) {
            return Optional.empty();
        }
        return findProvider(fallbackProvider);
    }
    
    private Optional<SmsProvider> findProvider(String name) {
        return providers.stream()
            .filter(p -> p.getProviderName().equals(name))
            .findFirst();
    }
}
```

**Service: `SmsNotificationService.java`**

```java
@Service
public class SmsNotificationService {
    
    private final SmsProviderFactory providerFactory;
    private final SmsTemplateService templateService;
    
    @Async
    public CompletableFuture<SmsResult> sendAsync(SmsRequest request) {
        return CompletableFuture.supplyAsync(() -> send(request));
    }
    
    public SmsResult send(SmsRequest request) {
        // 1. Resolve template if templateId provided
        if (request.getTemplateId() != null) {
            String message = templateService.render(
                request.getTemplateId(),
                request.getParams(),
                request.getTenantId()
            );
            request.setMessage(message);
        }
        
        // 2. Try primary provider
        SmsProvider primary = providerFactory.getPrimary();
        SmsResult result = primary.send(request);
        
        // 3. Fallback if primary fails
        if (!result.isSuccess()) {
            Optional<SmsProvider> fallback = providerFactory.getFallback();
            if (fallback.isPresent()) {
                log.warn("Primary SMS failed, trying fallback provider");
                result = fallback.get().send(request);
            }
        }
        
        // 4. Log result
        logSmsEvent(request, result);
        
        return result;
    }
    
    /**
     * Send credentials to guardian via SMS
     */
    public void sendGuardianCredentials(
        String phone,
        String schoolCode,
        String password,
        String guardianName,
        String tenantId
    ) {
        SmsRequest request = SmsRequest.builder()
            .to(phone)
            .templateId("guardian_credentials")
            .params(Map.of(
                "name", guardianName,
                "schoolCode", schoolCode,
                "password", password,
                "loginUrl", "https://schoolvault.edu/login"
            ))
            .tenantId(tenantId)
            .priority(SmsRequest.Priority.HIGH)
            .build();
        
        sendAsync(request);
    }
    
    private void logSmsEvent(SmsRequest request, SmsResult result) {
        // Store in sms_notifications table for audit
    }
}
```

**Template Service: `SmsTemplateService.java`**

```java
@Service
public class SmsTemplateService {
    
    private static final Map<String, String> TEMPLATES = Map.of(
        "guardian_credentials",
        "Welcome {name}! Your child has been registered at {schoolCode}. " +
        "Login: {loginUrl} | Phone: {phone} | Password: {password}",
        
        "otp_login",
        "Your SchoolVault OTP is {otp}. Valid for 5 minutes. " +
        "School: {schoolCode}",
        
        "password_reset",
        "Password reset OTP: {otp}. Valid for 10 minutes. " +
        "If you didn't request this, contact school admin.",
        
        "student_admitted",
        "Congratulations! {studentName} has been admitted to {schoolCode}. " +
        "Admission No: {admissionNumber}. Login to view details."
    );
    
    public String render(String templateId, Map<String, String> params, String tenantId) {
        String template = TEMPLATES.get(templateId);
        if (template == null) {
            throw new BusinessException("SMS template not found: " + templateId);
        }
        
        // Simple variable replacement
        String rendered = template;
        for (Map.Entry<String, String> param : params.entrySet()) {
            rendered = rendered.replace("{" + param.getKey() + "}", param.getValue());
        }
        
        // Tenant-specific customization (future)
        return customizeForTenant(rendered, tenantId);
    }
    
    private String customizeForTenant(String message, String tenantId) {
        // Allow tenants to customize templates
        // Fetch from tenant_sms_templates table if exists
        return message;
    }
}
```

---

### Phase 4: Guardian-User Provisioning Service (Weeks 7-8)

#### 4.1 Intelligent Guardian Linking Service

**Service: `GuardianProvisioningService.java`**

```java
@Service
public class GuardianProvisioningService {
    
    private final GuardianRepository guardianRepository;
    private final UserRepository userRepository;
    private final StudentGuardianMappingRepository mappingRepository;
    private final PhoneNormalizationService phoneService;
    private final SmsNotificationService smsService;
    private final PasswordEncoder passwordEncoder;
    
    /**
     * Provision guardian user accounts when student is added/imported
     * Handles all scenarios: new guardian, existing guardian, shared phone, etc.
     */
    @Transactional
    public GuardianProvisioningResult provisionGuardians(
        Long studentId,
        List<GuardianInput> guardianInputs,
        String tenantId
    ) {
        GuardianProvisioningResult result = new GuardianProvisioningResult();
        
        for (GuardianInput input : guardianInputs) {
            try {
                // Normalize phone
                String normalizedPhone = phoneService.normalize(
                    input.getPhone(), 
                    tenantId
                );
                
                // Check if guardian already exists by phone
                Optional<Guardian> existingGuardian = guardianRepository
                    .findByPrimaryPhoneAndTenantIdAndIsDeletedFalse(
                        normalizedPhone, 
                        tenantId
                    );
                
                Guardian guardian;
                User user;
                boolean isNewUser = false;
                
                if (existingGuardian.isPresent()) {
                    // SCENARIO: Guardian exists (sibling or shared phone)
                    guardian = existingGuardian.get();
                    
                    if (guardian.getUserId() != null) {
                        // User account already exists, reuse it
                        user = userRepository.findById(guardian.getUserId())
                            .orElseThrow();
                        result.addReusedUser(user);
                    } else {
                        // Guardian exists but no user account - create one
                        user = createUserForGuardian(guardian, tenantId);
                        guardian.setUserId(user.getId());
                        guardian.setUserProvisionedAt(LocalDateTime.now());
                        guardianRepository.save(guardian);
                        isNewUser = true;
                        result.addCreatedUser(user);
                    }
                    
                } else {
                    // SCENARIO: New guardian
                    guardian = createGuardian(input, normalizedPhone, tenantId);
                    user = createUserForGuardian(guardian, tenantId);
                    guardian.setUserId(user.getId());
                    guardian.setUserProvisionedAt(LocalDateTime.now());
                    guardian.setUserProvisioningMethod(
                        Guardian.ProvisioningMethod.AUTO_ONBOARD
                    );
                    guardianRepository.save(guardian);
                    isNewUser = true;
                    result.addCreatedUser(user);
                }
                
                // Create StudentGuardianMapping
                StudentGuardianMapping mapping = new StudentGuardianMapping();
                mapping.setStudentId(studentId);
                mapping.setGuardianId(guardian.getId());
                mapping.setRelationType(input.getRelationType());
                mapping.setIsPrimary(input.isPrimary());
                mapping.setTenantId(tenantId);
                mappingRepository.save(mapping);
                
                // Send SMS notification for new users
                if (isNewUser) {
                    sendCredentialsViaSms(user, guardian, tenantId);
                }
                
                result.addMapping(mapping);
                
            } catch (Exception e) {
                log.error("Failed to provision guardian: {}", input.getPhone(), e);
                result.addError(input, e.getMessage());
            }
        }
        
        return result;
    }
    
    private Guardian createGuardian(
        GuardianInput input, 
        String normalizedPhone, 
        String tenantId
    ) {
        Guardian guardian = new Guardian();
        guardian.setFullName(input.getName());
        guardian.setPrimaryPhone(normalizedPhone);
        guardian.setOccupation(input.getOccupation());
        guardian.setTenantId(tenantId);
        guardian.setIsActive(true);
        guardian.setIsDeleted(false);
        
        // Store additional phones if provided
        if (input.getAlternatePhones() != null) {
            guardian.setPhonesJson(toJson(input.getAlternatePhones()));
        }
        
        return guardianRepository.save(guardian);
    }
    
    private User createUserForGuardian(Guardian guardian, String tenantId) {
        // Generate secure random password
        String generatedPassword = PasswordGenerator.generate();
        
        User user = User.builder()
            .name(guardian.getFullName())
            .phone(guardian.getPrimaryPhone())
            .password(passwordEncoder.encode(generatedPassword))
            .role(Enums.Role.PARENT)
            .schoolCode(resolveSchoolCode(tenantId))
            .primaryIdentifierType(User.PrimaryIdentifierType.PHONE)
            .build();
        
        user.setTenantId(tenantId);
        user.setIsActive(true);
        user.setIsDeleted(false);
        user = userRepository.save(user);
        
        // Store plain password temporarily for SMS (only in memory)
        user.setPlainPassword(generatedPassword);  // Transient field
        
        return user;
    }
    
    private void sendCredentialsViaSms(User user, Guardian guardian, String tenantId) {
        smsService.sendGuardianCredentials(
            user.getPhone(),
            user.getSchoolCode(),
            user.getPlainPassword(),  // From transient field
            guardian.getFullName(),
            tenantId
        );
    }
}
```

**DTO: `GuardianInput.java`**

```java
public class GuardianInput {
    private String name;
    private String phone;
    private String email;  // Optional
    private String occupation;
    private Enums.GuardianRelationType relationType;  // FATHER, MOTHER, etc.
    private boolean isPrimary;
    private List<String> alternatePhones;
    
    // Getters/setters
}
```

**Result: `GuardianProvisioningResult.java`**

```java
public class GuardianProvisioningResult {
    private List<User> createdUsers = new ArrayList<>();
    private List<User> reusedUsers = new ArrayList<>();
    private List<StudentGuardianMapping> mappings = new ArrayList<>();
    private Map<GuardianInput, String> errors = new HashMap<>();
    
    public int getCreatedCount() { return createdUsers.size(); }
    public int getReusedCount() { return reusedUsers.size(); }
    public boolean hasErrors() { return !errors.isEmpty(); }
    
    // Getters/adders
}
```

---

### Phase 5: Frontend Changes (Weeks 9-10)

#### 5.1 Updated TypeScript Models

**frontend/src/app/core/models/models.ts:**

```typescript
export interface LoginRequest {
  // NEW: Support both phone and email
  identifier?: string;  // Can be phone or email
  email?: string;       // Kept for backward compatibility
  phone?: string;       // NEW: Direct phone login
  password: string;
  schoolCode: string;
  interfaceLocale?: string;
}

export interface OnboardSchoolRequest {
  schoolName: string;
  schoolCode: string;
  adminName: string;
  adminPhone: string;      // NEW: Primary
  adminEmail?: string;     // NEW: Optional
  adminPassword: string;
  address?: string;
  interfaceLocale?: string;
}

export interface User {
  id: number;
  email?: string;          // NEW: Optional
  phone?: string;          // NEW: Can be primary
  name: string;
  role: AppRole;
  tenantId: string;
  avatar?: string;
  primaryIdentifier: 'email' | 'phone';  // NEW
  phoneVerified?: boolean;               // NEW
  interfaceLocale?: string;
}

// NEW: Guardian details for student add/import
export interface GuardianDetails {
  name: string;
  phone: string;
  email?: string;
  occupation?: string;
  relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
  isPrimary: boolean;
  alternatePhones?: string[];
}

export interface AddStudentRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  classId: number;
  sectionId: number;
  admissionNumber: string;
  guardians: GuardianDetails[];  // NEW: Array of guardians
  address?: string;
  bloodGroup?: string;
}
```

#### 5.2 Login Component Updates

**frontend/src/app/features/auth/login/login.component.ts:**

```typescript
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  identifierType: 'phone' | 'email' = 'phone';  // Default to phone
  
  ngOnInit() {
    this.loginForm = this.fb.group({
      identifier: ['', [Validators.required]],
      password: ['', [Validators.required]],
      schoolCode: ['', [Validators.required]],
      identifierType: ['phone']  // Toggle between phone/email
    });
  }
  
  onIdentifierTypeChange(type: 'phone' | 'email') {
    this.identifierType = type;
    const control = this.loginForm.get('identifier');
    
    if (type === 'phone') {
      control?.setValidators([
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/)  // Indian phone
      ]);
    } else {
      control?.setValidators([
        Validators.required,
        Validators.email
      ]);
    }
    control?.updateValueAndValidity();
  }
  
  onSubmit() {
    if (this.loginForm.invalid) return;
    
    const identifier = this.loginForm.value.identifier;
    const request: LoginRequest = {
      schoolCode: this.loginForm.value.schoolCode,
      password: this.loginForm.value.password,
      interfaceLocale: this.translate.currentLang
    };
    
    // Send as phone or email based on type
    if (this.identifierType === 'phone') {
      request.phone = identifier;
    } else {
      request.email = identifier;
    }
    
    this.authService.login(request).subscribe({
      next: (response) => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMessage = this.getErrorMessage(err);
      }
    });
  }
}
```

**frontend/src/app/features/auth/login/login.component.html:**

```html
<form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
  <!-- School Code -->
  <mat-form-field appearance="outline">
    <mat-label>{{ 'auth.schoolCode' | translate }}</mat-label>
    <input matInput formControlName="schoolCode" placeholder="Enter school code">
  </mat-form-field>
  
  <!-- NEW: Identifier Type Toggle -->
  <mat-button-toggle-group 
    [(value)]="identifierType" 
    (change)="onIdentifierTypeChange($event.value)">
    <mat-button-toggle value="phone">
      📱 {{ 'auth.loginWithPhone' | translate }}
    </mat-button-toggle>
    <mat-button-toggle value="email">
      📧 {{ 'auth.loginWithEmail' | translate }}
    </mat-button-toggle>
  </mat-button-toggle-group>
  
  <!-- Identifier Input -->
  <mat-form-field appearance="outline">
    <mat-label>
      {{ identifierType === 'phone' ? 
         ('auth.phoneNumber' | translate) : 
         ('auth.email' | translate) }}
    </mat-label>
    <input 
      matInput 
      formControlName="identifier" 
      [placeholder]="identifierType === 'phone' ? 
                     '9876543210' : 
                     'user@example.com'">
    <mat-error *ngIf="loginForm.get('identifier')?.hasError('required')">
      {{ 'validation.required' | translate }}
    </mat-error>
    <mat-error *ngIf="loginForm.get('identifier')?.hasError('pattern')">
      {{ 'validation.invalidPhone' | translate }}
    </mat-error>
  </mat-form-field>
  
  <!-- Password -->
  <mat-form-field appearance="outline">
    <mat-label>{{ 'auth.password' | translate }}</mat-label>
    <input matInput type="password" formControlName="password">
  </mat-form-field>
  
  <button mat-raised-button color="primary" type="submit">
    {{ 'auth.login' | translate }}
  </button>
</form>
```

#### 5.3 Student Add Component with Guardian Details

**frontend/src/app/features/students/add-student/add-student.component.ts:**

```typescript
export class AddStudentComponent implements OnInit {
  studentForm: FormGroup;
  guardiansArray: FormArray;
  
  ngOnInit() {
    this.studentForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      classId: ['', Validators.required],
      sectionId: ['', Validators.required],
      admissionNumber: ['', Validators.required],
      guardians: this.fb.array([])  // NEW: Guardian array
    });
    
    // Add default father and mother fields
    this.addGuardian('FATHER', true);
    this.addGuardian('MOTHER', false);
  }
  
  get guardians(): FormArray {
    return this.studentForm.get('guardians') as FormArray;
  }
  
  addGuardian(relationType: string = 'GUARDIAN', isPrimary: boolean = false) {
    const guardianGroup = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [
        Validators.required,
        Validators.pattern(/^[6-9]\d{9}$/)
      ]],
      email: ['', Validators.email],
      occupation: [''],
      relationType: [relationType],
      isPrimary: [isPrimary],
      alternatePhones: [[]]
    });
    
    this.guardians.push(guardianGroup);
  }
  
  removeGuardian(index: number) {
    if (this.guardians.length > 1) {
      this.guardians.removeAt(index);
    }
  }
  
  onSubmit() {
    if (this.studentForm.invalid) return;
    
    const request: AddStudentRequest = this.studentForm.value;
    
    this.studentService.addStudent(request).subscribe({
      next: (result) => {
        // Show success message with SMS notification info
        this.snackBar.open(
          `Student added successfully! SMS sent to ${result.notifiedGuardians} guardian(s).`,
          'Close',
          { duration: 5000 }
        );
        this.router.navigate(['/students']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to add student';
      }
    });
  }
}
```

---

### Phase 6: Phone Normalization & Validation (Week 11)

#### 6.1 Phone Normalization Service

**Service: `PhoneNormalizationService.java`**

```java
@Service
public class PhoneNormalizationService {
    
    private final TenantConfigRepository tenantConfigRepository;
    
    @Value("${app.phone.default-country-code:+91}")
    private String defaultCountryCode;
    
    /**
     * Normalize phone to E.164 format: +919876543210
     */
    public String normalize(String phone, String tenantId) {
        if (phone == null || phone.isBlank()) {
            throw new ValidationException("Phone number is required");
        }
        
        // Remove all non-digits
        String digits = phone.replaceAll("[^0-9]", "");
        
        // Check if already has country code
        if (digits.length() == 12 && digits.startsWith("91")) {
            return "+" + digits;
        }
        
        // Check for 10-digit Indian mobile
        if (digits.length() == 10 && digits.matches("^[6-9]\\d{9}$")) {
            String countryCode = getCountryCodeForTenant(tenantId);
            return countryCode + digits;
        }
        
        throw new ValidationException(
            "Invalid phone number format. Expected 10-digit mobile number."
        );
    }
    
    /**
     * Validate phone number format
     */
    public boolean isValid(String phone) {
        if (phone == null || phone.isBlank()) return false;
        
        String digits = phone.replaceAll("[^0-9]", "");
        
        // Indian mobile: starts with 6-9, 10 digits
        if (digits.length() == 10) {
            return digits.matches("^[6-9]\\d{9}$");
        }
        
        // With country code: +91XXXXXXXXXX
        if (digits.length() == 12) {
            return digits.matches("^91[6-9]\\d{9}$");
        }
        
        return false;
    }
    
    /**
     * Format for display: +91 98765 43210
     */
    public String formatForDisplay(String normalizedPhone) {
        if (normalizedPhone == null) return "";
        
        String digits = normalizedPhone.replaceAll("[^0-9]", "");
        
        if (digits.length() == 12 && digits.startsWith("91")) {
            return String.format("+91 %s %s",
                digits.substring(2, 7),
                digits.substring(7, 12)
            );
        }
        
        return normalizedPhone;
    }
    
    /**
     * Mask phone for security: +91 98765 ***10
     */
    public String mask(String normalizedPhone) {
        if (normalizedPhone == null) return "";
        
        String display = formatForDisplay(normalizedPhone);
        if (display.length() < 8) return display;
        
        return display.substring(0, display.length() - 5) + 
               "***" + 
               display.substring(display.length() - 2);
    }
    
    private String getCountryCodeForTenant(String tenantId) {
        // Allow tenant-specific country code override
        return tenantConfigRepository.findByTenantId(tenantId)
            .map(config -> config.getCountryCode())
            .orElse(defaultCountryCode);
    }
}
```

---

### Phase 7: Future OTP-Based Passwordless Authentication (Weeks 12-14)

#### 7.1 OTP Service Design (Implementation Later)

**Entity: `Otp.java`**

```java
@Entity
@Table(name = "otps",
    indexes = {
        @Index(name = "idx_otp_phone", columnList = "phone, otp_type, is_used"),
        @Index(name = "idx_otp_expiry", columnList = "expires_at")
    }
)
public class Otp extends BaseEntity {
    
    @Column(nullable = false, length = 6)
    private String code;  // 6-digit OTP
    
    @Column(nullable = false, length = 20)
    private String phone;  // Normalized phone
    
    @Enumerated(EnumType.STRING)
    @Column(name = "otp_type", nullable = false)
    private OtpType type;
    
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(name = "is_used")
    private Boolean isUsed = false;
    
    @Column(name = "used_at")
    private LocalDateTime usedAt;
    
    @Column(name = "attempts")
    private Integer attempts = 0;
    
    @Column(name = "max_attempts")
    private Integer maxAttempts = 3;
    
    public enum OtpType {
        LOGIN,
        PASSWORD_RESET,
        PHONE_VERIFICATION,
        TRANSACTION
    }
}
```

**Service: `OtpService.java` (Stub for Future)**

```java
@Service
public class OtpService {
    
    private final OtpRepository otpRepository;
    private final SmsNotificationService smsService;
    private final PhoneNormalizationService phoneService;
    
    /**
     * Generate and send OTP for login
     */
    public void sendLoginOtp(String phone, String schoolCode) {
        String normalizedPhone = phoneService.normalize(phone, 
            resolveTenantId(schoolCode));
        
        // Check rate limiting
        checkRateLimit(normalizedPhone);
        
        // Generate 6-digit OTP
        String otpCode = generateSecureOtp();
        
        // Store in database
        Otp otp = new Otp();
        otp.setCode(otpCode);
        otp.setPhone(normalizedPhone);
        otp.setType(Otp.OtpType.LOGIN);
        otp.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        otp.setTenantId(resolveTenantId(schoolCode));
        otpRepository.save(otp);
        
        // Send via SMS
        smsService.send(SmsRequest.builder()
            .to(normalizedPhone)
            .templateId("otp_login")
            .params(Map.of(
                "otp", otpCode,
                "schoolCode", schoolCode
            ))
            .build()
        );
    }
    
    /**
     * Verify OTP and return user
     */
    public User verifyLoginOtp(String phone, String otpCode, String schoolCode) {
        String normalizedPhone = phoneService.normalize(phone, 
            resolveTenantId(schoolCode));
        
        Otp otp = otpRepository
            .findByPhoneAndCodeAndTypeAndIsUsedFalse(
                normalizedPhone, 
                otpCode, 
                Otp.OtpType.LOGIN
            )
            .orElseThrow(() -> new UnauthorizedException("Invalid OTP"));
        
        // Check expiry
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("OTP expired");
        }
        
        // Check attempts
        otp.setAttempts(otp.getAttempts() + 1);
        if (otp.getAttempts() > otp.getMaxAttempts()) {
            throw new UnauthorizedException("Too many attempts");
        }
        
        // Mark as used
        otp.setIsUsed(true);
        otp.setUsedAt(LocalDateTime.now());
        otpRepository.save(otp);
        
        // Find and return user
        return userRepository
            .findByPhoneAndSchoolCodeAndIsDeletedFalse(normalizedPhone, schoolCode)
            .orElseThrow(() -> new UnauthorizedException("User not found"));
    }
    
    private String generateSecureOtp() {
        return String.format("%06d", 
            ThreadLocalRandom.current().nextInt(100000, 999999));
    }
    
    private void checkRateLimit(String phone) {
        // Implement rate limiting: max 3 OTPs per 15 minutes
        long recentCount = otpRepository.countByPhoneAndCreatedAtAfter(
            phone,
            LocalDateTime.now().minusMinutes(15)
        );
        
        if (recentCount >= 3) {
            throw new BusinessException(
                "Too many OTP requests. Please try after 15 minutes."
            );
        }
    }
}
```

**Strategy: `PhoneOtpAuthStrategy.java` (Future)**

```java
@Component
public class PhoneOtpAuthStrategy implements AuthenticationStrategy {
    
    private final OtpService otpService;
    private final JwtUtil jwtUtil;
    
    @Override
    public AuthenticationResult authenticate(
        AuthenticationRequest request,
        String tenantId
    ) {
        // Verify OTP
        User user = otpService.verifyLoginOtp(
            request.getIdentifier(),
            request.getOtpCode(),
            request.getSchoolCode()
        );
        
        // Generate tokens
        return AuthenticationResult.success(user);
    }
    
    @Override
    public boolean supports(String identifier) {
        // OTP auth is explicitly requested
        return false;  // Will be enabled via request flag
    }
    
    @Override
    public AuthStrategyType getType() {
        return AuthStrategyType.PHONE_OTP;
    }
}
```

---

## Implementation Roadmap

### **Phase 1: Foundation (Weeks 1-2)** ✅ CRITICAL
**Goal:** Prepare database and core models

- [ ] Database migration: Make email nullable, add phone unique constraint
- [ ] Update User entity and repository
- [ ] Add phone normalization service
- [ ] Update unit tests
- [ ] Deploy to staging for validation

**Deliverables:**
- Migration scripts tested
- User repository extended
- Phone validation working

---

### **Phase 2: Multi-Modal Authentication (Weeks 3-4)** ✅ CRITICAL
**Goal:** Support both email and phone login

- [ ] Implement authentication strategy pattern
- [ ] Create PhonePasswordAuthStrategy
- [ ] Refactor AuthenticationService to use strategies
- [ ] Update login API to accept phone or email
- [ ] Update JWT generation
- [ ] Integration tests for phone login

**Deliverables:**
- Phone login working in backend
- Both email and phone login supported
- No breaking changes to existing email flow

---

### **Phase 3: SMS Infrastructure (Weeks 5-6)** 🔧 HIGH PRIORITY
**Goal:** SMS notification system

- [ ] Create SMS provider abstraction
- [ ] Implement Twilio provider
- [ ] Implement AWS SNS provider
- [ ] Implement Mock provider for development
- [ ] Create SMS template service
- [ ] Add SMS notification audit logging
- [ ] Configuration management

**Deliverables:**
- Working SMS integration
- Template system operational
- Fallback mechanism tested

---

### **Phase 4: Guardian Provisioning (Weeks 7-8)** 👨‍👩‍👧 HIGH PRIORITY
**Goal:** Auto-create parent accounts

- [ ] Implement GuardianProvisioningService
- [ ] Handle duplicate phone detection
- [ ] Implement sibling linking logic
- [ ] Auto-generate secure passwords
- [ ] Send SMS credentials to guardians
- [ ] Update student add/import APIs

**Deliverables:**
- Guardian auto-provisioning working
- Parent receives SMS with credentials
- Multiple children linking validated

---

### **Phase 5: Frontend Updates (Weeks 9-10)** 🎨 MEDIUM PRIORITY
**Goal:** UI support for phone authentication

- [ ] Update login component for phone/email toggle
- [ ] Update signup component
- [ ] Add guardian details form in student add
- [ ] Phone number input component with validation
- [ ] Update mock data for phone-based users
- [ ] i18n translations for new fields

**Deliverables:**
- Login with phone working
- Guardian details captured in student add
- Mobile-friendly phone input

---

### **Phase 6: Testing & Validation (Week 11)** ✅ CRITICAL
**Goal:** Comprehensive testing

- [ ] Unit tests for all new services
- [ ] Integration tests for auth flows
- [ ] E2E tests for login scenarios
- [ ] Guardian provisioning edge cases
- [ ] Performance testing for phone lookups
- [ ] Security audit

**Deliverables:**
- 90%+ test coverage
- All edge cases validated
- Performance benchmarks met

---

### **Phase 7: OTP Infrastructure (Weeks 12-14)** 🚀 FUTURE
**Goal:** Passwordless authentication (Future release)

- [ ] Implement OTP entity and repository
- [ ] Create OtpService with rate limiting
- [ ] Implement PhoneOtpAuthStrategy
- [ ] Add OTP verification API
- [ ] Frontend: OTP input component
- [ ] Redis integration for OTP storage

**Deliverables:**
- OTP login working
- Rate limiting operational
- Security hardened

---

## Change Impact Analysis

### Database Changes

| Table | Change | Impact | Backward Compatible? |
|-------|--------|--------|---------------------|
| `users` | `email` NULL allowed | HIGH | ✅ Yes |
| `users` | Add UNIQUE(`tenant_id`, `phone`) | HIGH | ✅ Yes (phone already exists) |
| `users` | Add `primary_identifier_type` | MEDIUM | ✅ Yes (default EMAIL) |
| `users` | Add phone verification fields | LOW | ✅ Yes (nullable) |
| `guardians` | Add `user_provisioned_at` | LOW | ✅ Yes (nullable) |

**Migration Strategy:**
- Deploy migrations during maintenance window
- Existing records default to EMAIL identifier
- No data loss
- Rollback scripts prepared

---

### Backend Code Changes

#### High Impact (Breaks Existing Code)
- ❌ **NONE** - Design is backward compatible

#### Medium Impact (Requires Updates)
- ⚠️ `AuthService.login()` - Add phone parameter support
- ⚠️ `UserRepository` - Add phone-based queries
- ⚠️ `AuthDTOs.LoginRequest` - Add phone field

#### Low Impact (New Features)
- ✅ New: `PhoneNormalizationService`
- ✅ New: `SmsNotificationService`
- ✅ New: `GuardianProvisioningService`
- ✅ New: `AuthenticationStrategy` implementations

**Files Modified:**
```
backend-spring/src/main/java/com/school/erp/
├── modules/auth/
│   ├── entity/User.java                        (MODIFY: add phone fields)
│   ├── dto/AuthDTOs.java                       (MODIFY: add phone to LoginRequest)
│   ├── repository/UserRepository.java          (MODIFY: add phone queries)
│   ├── service/AuthService.java                (MODIFY: support phone login)
│   ├── strategy/                               (NEW: auth strategies)
│   │   ├── AuthenticationStrategy.java
│   │   ├── PhonePasswordAuthStrategy.java
│   │   └── EmailPasswordAuthStrategy.java
├── modules/guardian/
│   ├── service/GuardianProvisioningService.java (NEW)
│   └── dto/GuardianProvisioningDTOs.java        (NEW)
├── common/notification/
│   ├── sms/
│   │   ├── SmsProvider.java                    (NEW: interface)
│   │   ├── TwilioSmsProvider.java              (NEW)
│   │   ├── AwsSnsSmsProvider.java              (NEW)
│   │   ├── MockSmsProvider.java                (NEW)
│   │   ├── SmsNotificationService.java         (NEW)
│   │   └── SmsTemplateService.java             (NEW)
│   └── phone/
│       └── PhoneNormalizationService.java      (NEW)
```

---

### Frontend Code Changes

**Files Modified:**
```
frontend/src/app/
├── core/
│   ├── models/models.ts                        (MODIFY: add phone fields)
│   ├── services/auth.service.ts                (MODIFY: support phone login)
│   └── mocks/auth.mock-data.ts                 (MODIFY: add phone users)
├── features/auth/
│   ├── login/login.component.ts                (MODIFY: phone/email toggle)
│   ├── login/login.component.html              (MODIFY: add phone input)
│   └── signup/signup.component.ts              (MODIFY: phone primary)
├── features/students/
│   ├── add-student/
│   │   ├── add-student.component.ts            (MODIFY: guardian form)
│   │   └── add-student.component.html          (MODIFY: guardian inputs)
│   └── import-students/
│       └── import-students.component.ts        (MODIFY: guardian columns)
├── shared/
│   └── components/
│       ├── phone-input/phone-input.component.ts (NEW)
│       └── guardian-form/guardian-form.component.ts (NEW)
└── assets/i18n/
    ├── en.json                                 (MODIFY: add translations)
    └── hi.json                                 (MODIFY: add translations)
```

---

### Configuration Changes

**application.yml:**

```yaml
app:
  # Phone configuration
  phone:
    default-country-code: "+91"
    validation-enabled: true
    normalization-enabled: true
  
  # SMS provider configuration
  sms:
    provider: "mock"  # Options: twilio, aws_sns, mock
    fallback-provider: ""
    
    twilio:
      account-sid: "${TWILIO_ACCOUNT_SID}"
      auth-token: "${TWILIO_AUTH_TOKEN}"
      from-number: "${TWILIO_FROM_NUMBER}"
    
    aws-sns:
      region: "ap-south-1"
      access-key: "${AWS_SNS_ACCESS_KEY}"
      secret-key: "${AWS_SNS_SECRET_KEY}"
    
    # Rate limiting
    rate-limit:
      enabled: true
      max-sms-per-phone-per-hour: 5
      max-sms-per-phone-per-day: 20
  
  # OTP configuration (future)
  otp:
    enabled: false
    expiry-minutes: 5
    max-attempts: 3
    resend-cooldown-seconds: 60
```

**Environment Variables:**

```bash
# Development
SMS_PROVIDER=mock

# Production
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+919876543210

# Or AWS SNS
SMS_PROVIDER=aws_sns
AWS_SNS_ACCESS_KEY=AKIA...
AWS_SNS_SECRET_KEY=...
AWS_SNS_REGION=ap-south-1
```

---

## Security Considerations

### 1. Phone Number Privacy
- Store normalized phones with proper encryption
- Mask phone numbers in logs: `+91 98765 ***10`
- GDPR/Data protection compliance
- Allow users to delete/modify phone

### 2. SMS Security
- Rate limiting: Max 5 SMS per phone per hour
- OTP brute-force protection
- Audit all SMS sends
- Monitor SMS costs

### 3. Password Security (Current Phase)
- Generate strong random passwords (12+ chars)
- Enforce password complexity
- Password reset via SMS
- Monitor failed login attempts

### 4. OTP Security (Future Phase)
- 6-digit numeric OTP
- 5-minute expiry
- Max 3 verification attempts
- Redis-based storage for quick expiry

### 5. Guardian Account Security
- Verify phone ownership before provisioning
- Send SMS notification on account creation
- Prevent unauthorized guardian linking
- Audit guardian-student mappings

---

## Scalability & Performance

### 1. Database Indexes
```sql
-- Critical indexes for phone-based lookups
CREATE INDEX idx_user_phone_lookup 
  ON users(tenant_id, phone, school_code, is_deleted);

CREATE INDEX idx_guardian_phone_lookup 
  ON guardians(tenant_id, primary_phone, is_deleted);

-- For OTP lookups (future)
CREATE INDEX idx_otp_verification 
  ON otps(phone, otp_type, is_used, expires_at);
```

### 2. Caching Strategy
- Cache guardian-to-user mappings (Redis)
- Cache phone normalization rules
- Cache SMS templates

### 3. Async Processing
- Send SMS notifications asynchronously
- Guardian provisioning as background job for bulk imports
- OTP generation and cleanup via scheduled tasks

### 4. SMS Provider Failover
```
Primary: Twilio
  ↓ (if failed)
Fallback: AWS SNS
  ↓ (if failed)
Log error + Manual intervention
```

---

## Testing Strategy

### Unit Tests
- Phone normalization service
- Authentication strategies
- Guardian provisioning logic
- SMS template rendering

### Integration Tests
- Phone login flow end-to-end
- Guardian auto-provisioning
- SMS sending with mock provider
- Multi-guardian scenarios

### E2E Tests (Playwright)
- User logs in with phone number
- User logs in with email (backward compat)
- Admin adds student with guardians
- Guardian receives SMS credentials
- Guardian logs in with phone

### Load Tests
- 1000 concurrent phone logins
- 500 SMS sends per minute
- Guardian provisioning for bulk import (1000 students)

---

## Rollback Strategy

### Phase 1-2 Rollback (Database + Auth)
1. Revert code deployment
2. Run rollback migration:
   ```sql
   ALTER TABLE users MODIFY COLUMN email VARCHAR(150) NOT NULL;
   DROP INDEX idx_user_phone_lookup ON users;
   ```
3. Clear auth caches
4. Monitor error rates

### Phase 3-4 Rollback (SMS + Guardian)
1. Disable SMS provider: `app.sms.provider=mock`
2. Disable guardian auto-provisioning
3. Manually provision affected guardians
4. Revert code

### Data Integrity
- All operations are transactional
- Guardian-student mappings are atomic
- Failed provisioning does not block student creation
- Audit logs capture all changes

---

## Cost Estimation

### SMS Costs (India - Twilio)
- Transactional SMS: ₹0.25 per SMS
- Estimated monthly volume:
  - 500 schools × 50 new students/month × 2 guardians = 50,000 SMS
  - Cost: ₹12,500/month
- OTP SMS (future): ₹0.25 per OTP
  - Daily logins: 10,000 users × 0.3 OTP rate = 3,000 OTP/day
  - Cost: ₹22,500/month

**Total SMS Cost:** ~₹35,000/month (~$420/month)

### AWS SNS Costs (Alternative)
- $0.00645 per SMS to India
- 50,000 SMS = $322.50/month (cheaper than Twilio)

### Infrastructure Costs
- Redis for OTP caching: $20/month
- Monitoring & logging: $50/month

**Recommendation:** Start with AWS SNS for cost optimization

---

## Migration Timeline

| Phase | Duration | Parallel Work Possible? | Risk Level |
|-------|----------|------------------------|------------|
| Phase 1: Database | 2 weeks | ❌ No (foundation) | 🔴 HIGH |
| Phase 2: Auth Strategies | 2 weeks | ❌ No (depends on P1) | 🔴 HIGH |
| Phase 3: SMS Infrastructure | 2 weeks | ✅ Yes (parallel to P4) | 🟡 MEDIUM |
| Phase 4: Guardian Provisioning | 2 weeks | ✅ Yes (parallel to P3) | 🟡 MEDIUM |
| Phase 5: Frontend | 2 weeks | ✅ Yes (parallel to P3-4) | 🟢 LOW |
| Phase 6: Testing | 1 week | ❌ No (validation) | 🟡 MEDIUM |
| Phase 7: OTP (Future) | 3 weeks | ✅ Yes (next release) | 🟢 LOW |

**Total Duration:** 11 weeks (excluding OTP)
**With OTP:** 14 weeks

---

## Success Criteria

### Phase 1-2 Success Metrics
- ✅ Phone login works without breaking email login
- ✅ 100% backward compatibility with existing users
- ✅ Phone-based users can authenticate
- ✅ Zero production errors

### Phase 3-4 Success Metrics
- ✅ Guardian provisioning success rate > 95%
- ✅ SMS delivery rate > 98%
- ✅ Sibling linking accuracy 100%
- ✅ No duplicate user accounts created

### Phase 5 Success Metrics
- ✅ Users can switch between phone/email login
- ✅ Guardian form captures all required details
- ✅ Mobile-friendly phone input
- ✅ Translations complete (EN/HI)

### Overall Success Metrics
- ✅ 90%+ test coverage
- ✅ <500ms authentication response time
- ✅ <2 second guardian provisioning per student
- ✅ Zero data loss during migration
- ✅ SMS cost under budget (₹35K/month)

---

## Recommendations

### Immediate Actions (Next 2 Weeks)
1. ✅ **Approve this architecture document**
2. ✅ **Set up SMS provider accounts** (Twilio or AWS SNS)
3. ✅ **Create database migration scripts**
4. ✅ **Set up staging environment for testing**
5. ✅ **Assign development team members to phases**

### Best Practices to Follow
1. **Phone Normalization:** Always normalize to E.164 format
2. **SMS Rate Limiting:** Prevent abuse and cost overruns
3. **Audit Logging:** Log all authentication attempts
4. **Graceful Degradation:** SMS failure should not block user creation
5. **Backward Compatibility:** Never break existing email-based users

### Risk Mitigation
1. **Risk:** SMS delivery failures
   - **Mitigation:** Implement fallback provider
   
2. **Risk:** Phone number conflicts
   - **Mitigation:** Strict uniqueness validation + conflict resolution UI
   
3. **Risk:** Cost overruns from SMS
   - **Mitigation:** Rate limiting + monitoring + alerts
   
4. **Risk:** Guardian linking errors
   - **Mitigation:** Transactional operations + manual correction UI

---

## Comparison: How Big ERPs Handle This

### Fedena (Ruby on Rails)
- **Auth:** Username + Password (not phone-centric)
- **Guardian:** Separate guardian records, manual linking
- **SMS:** Third-party gem (Twilio, TextLocal)
- **Limitations:** No auto-provisioning of parent accounts

### MyClassCampus (PHP/Laravel)
- **Auth:** Phone OR Email + Password
- **Guardian:** `guardians` table with `user_id` FK
- **SMS:** SMS gateway abstraction layer
- **Strengths:** Good guardian linking, but manual password setup

### Classe365 (.NET)
- **Auth:** Email-first (phone optional)
- **Guardian:** Complex multi-guardian support
- **SMS:** Azure Communication Services
- **Limitations:** Not designed for low-email environments

### **Our Approach - SchoolVault (Java/Spring Boot + Angular)**
- ✅ **Phone-first by design** (rural/urban India)
- ✅ **Auto-provision guardian accounts** (unique selling point)
- ✅ **Multi-guardian support** (father, mother, others)
- ✅ **Strategy pattern** (extensible auth methods)
- ✅ **SMS provider abstraction** (vendor-agnostic)
- ✅ **OTP-ready architecture** (future passwordless)

**Key Differentiator:** We're building for India-first use case where phone >> email

---

## Conclusion

This architecture provides a **robust, scalable, and future-proof solution** for migrating SchoolVault from email-based to phone-based authentication.

**Key Strengths:**
1. ✅ **Backward Compatible:** Existing email users unaffected
2. ✅ **Extensible:** Strategy pattern allows adding new auth methods
3. ✅ **Scalable:** Proper indexing, caching, async processing
4. ✅ **Secure:** Rate limiting, audit logs, OTP-ready
5. ✅ **Cost-Effective:** SMS provider abstraction allows cost optimization
6. ✅ **User-Friendly:** Auto-provisions parent accounts, sends credentials via SMS

**Next Steps:**
1. ✅ Review and approve this document
2. ✅ Assign development team
3. ✅ Begin Phase 1 (Database migration)
4. ✅ Set up SMS provider accounts
5. ✅ Create project tickets for each phase

**Estimated Timeline:** 11 weeks to production-ready phone authentication

---

**Document Prepared By:** Senior Architecture Team  
**Review Status:** ⏳ Awaiting Approval  
**Version:** 1.0  
**Last Updated:** 2026-04-14
