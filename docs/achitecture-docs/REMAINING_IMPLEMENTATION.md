# Remaining Implementation Tasks

## ✅ What's Already Complete

1. ✅ Database migrations (V14)
2. ✅ Backend entities (Guardian, StudentGuardian, OtpVerification)
3. ✅ Repositories (Guardian, StudentGuardian, OtpVerification)
4. ✅ DTOs (PhoneAuth, Guardian, Provisioning)
5. ✅ SMS Service layer (Mock, Twilio, AWS SNS)
6. ✅ OTP Service (complete with rate limiting, security)
7. ✅ Guardian Service (complete CRUD)

## 🚧 Remaining Backend Tasks

Due to token limits, I'll provide you with implementation guidance for the remaining components:

### 1. Phone Auth Service

Create: `backend-spring/src/main/java/com/school/erp/modules/identity/service/PhoneAuthService.java`

**Key Methods**:
- `sendLoginOtp(SendOtpRequest)` - Delegates to OtpService
- `verifyLoginOtp(VerifyOtpRequest)` - Validates OTP
- `phoneLogin(PhoneLoginRequest)` - Validates verification token and returns JWT
- `validatePhoneUser(phone, schoolCode)` - Check if user exists

**Integration Points**:
- Use OtpService for OTP generation/verification
- Use JWT utility for token generation
- Check UserRepository for existing users
- Create User if doesn't exist (for guardian portal auto-provision)

### 2. Student Provisioning Service Enhancement

Update existing `StudentService` to add:

**Method**: `createStudentWithGuardians(CreateStudentWithGuardiansRequest)`
```java
@Transactional
public Student createStudentWithGuardians(CreateStudentWithGuardiansRequest request) {
    // 1. Create or find guardians by phone
    // 2. Create student
    // 3. Create student-guardian mappings
    // 4. Optionally provision portal access
    return student;
}
```

**Method**: `bulkImportStudents(BulkStudentImportRequest)`
```java
@Transactional
public BulkStudentImportResponse bulkImportStudents(BulkStudentImportRequest request) {
    // 1. Validate all rows
    // 2. Create bulk_import_job record
    // 3. For each row:
    //    - Find or create guardians
    //    - Create student
    //    - Link relationships
    // 4. Return summary with errors
}
```

### 3. Teacher Provisioning Service Enhancement

Update existing `TeacherService` to add phone-based authentication support.

**Method**: `createTeacherWithPhone(CreateTeacherRequest)`
**Method**: `bulkImportTeachers(BulkTeacherImportRequest)`

### 4. REST Controllers

#### PhoneAuthController
Path: `/api/v1/auth/phone`

Endpoints:
- `POST /send-otp` → sendOtp()
- `POST /verify-otp` → verifyOtp()
- `POST /login` → phoneLogin()
- `POST /resend-otp` → resendOtp()

#### GuardianController
Path: `/api/v1/guardians`

Endpoints:
- `POST /` → createGuardian()
- `PUT /{id}` → updateGuardian()
- `GET /{id}` → getGuardian()
- `GET /search` → searchGuardians()
- `POST /link-student` → linkToStudent()
- `POST /{id}/provision-portal` → provisionPortal()

#### Student/Teacher Controllers
Update existing controllers to add bulk import endpoints.

## 🎨 Frontend Implementation

### 1. Update Frontend Models

File: `frontend/src/app/core/models/models.ts`

Add these interfaces:

```typescript
export interface Guardian {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string;
  email?: string;
  relationType: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
  occupation?: string;
  city?: string;
  hasPortalAccess: boolean;
  linkedStudentCount: number;
  linkedStudents?: LinkedStudent[];
}

export interface LinkedStudent {
  studentId: number;
  studentName: string;
  className: string;
  sectionName: string;
  relationType: string;
  isPrimary: boolean;
}

export interface SendOtpRequest {
  phone: string;
  schoolCode: string;
  purpose: 'LOGIN' | 'SIGNUP' | 'PASSWORD_RESET';
  channel?: 'SMS' | 'WHATSAPP';
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  requestId: string;
  expiresInSeconds: number;
  canRetryAfterSeconds: number;
  devOtpCode?: string; // For development only
}

export interface VerifyOtpRequest {
  phone: string;
  schoolCode: string;
  otpCode: string;
  purpose: string;
}

export interface VerifyOtpResponse {
  verified: boolean;
  message: string;
  remainingAttempts: number;
  verificationToken?: string;
}

export interface PhoneLoginRequest {
  phone: string;
  schoolCode: string;
  verificationToken: string;
  interfaceLocale?: string;
}
```

### 2. Update Auth Service

File: `frontend/src/app/core/services/auth.service.ts`

Add methods:

```typescript
sendLoginOtp(request: SendOtpRequest): Observable<SendOtpResponse> {
  if (runtimeConfig.useMocks) {
    // Return mock OTP (always "123456" for testing)
    return of({
      success: true,
      message: 'OTP sent successfully',
      requestId: 'mock-' + Date.now(),
      expiresInSeconds: 300,
      canRetryAfterSeconds: 60,
      devOtpCode: '123456'
    }).pipe(delay(800));
  }
  return this.api.post<SendOtpResponse>('/auth/phone/send-otp', request);
}

verifyLoginOtp(request: VerifyOtpRequest): Observable<VerifyOtpResponse> {
  if (runtimeConfig.useMocks) {
    const verified = request.otpCode === '123456';
    return of({
      verified,
      message: verified ? 'OTP verified' : 'Invalid OTP',
      remainingAttempts: verified ? 3 : 2,
      verificationToken: verified ? 'mock-verify-token-' + Date.now() : undefined
    }).pipe(delay(500));
  }
  return this.api.post<VerifyOtpResponse>('/auth/phone/verify-otp', request);
}

phoneLogin(request: PhoneLoginRequest): Observable<LoginResponse> {
  if (runtimeConfig.useMocks) {
    // Mock phone login - similar to email login
    const response: LoginResponse = {
      token: 'mock-phone-token-' + Date.now(),
      refreshToken: 'mock-refresh-' + Date.now(),
      user: {
        id: 100,
        email: request.phone + '@parent.school',
        name: 'Parent User',
        phone: request.phone,
        role: 'parent',
        tenantId: 'tenant_' + request.schoolCode,
        interfaceLocale: request.interfaceLocale || 'en'
      }
    };
    return of(response).pipe(delay(600), tap(res => {
      this.applyTokenPair(res.token, res.refreshToken);
      localStorage.setItem(ERP_USER_KEY, JSON.stringify(res.user));
      this.currentUserSubject.next(res.user);
      this.persistMockSessionFromNow();
    }));
  }
  return this.api.post<LoginResponse>('/auth/phone/login', request).pipe(
    tap(res => {
      this.applyTokenPair(res.token, res.refreshToken);
      localStorage.setItem(ERP_USER_KEY, JSON.stringify(res.user));
      this.currentUserSubject.next(res.user);
    })
  );
}
```

### 3. Create Phone Login Component

File: `frontend/src/app/features/auth/phone-login/phone-login.component.ts`

**Features**:
- Phone number input with validation
- School code input
- OTP request button
- OTP input (6 digits)
- Resend OTP with countdown timer
- Error handling
- Loading states
- Language switching

**Template Structure**:
```html
<div class="phone-login-container">
  <div class="login-card">
    <!-- Step 1: Phone + School Code -->
    <div *ngIf="step === 'PHONE'">
      <input [(ngModel)]="phone" placeholder="+91 Phone Number" />
      <input [(ngModel)]="schoolCode" placeholder="School Code" />
      <button (click)="sendOtp()">{{ 'auth.sendOtp' | translate }}</button>
    </div>

    <!-- Step 2: OTP Verification -->
    <div *ngIf="step === 'OTP'">
      <input [(ngModel)]="otpCode" maxlength="6" placeholder="Enter 6-digit OTP" />
      <button (click)="verifyOtp()">{{ 'auth.verify' | translate }}</button>
      <button (click)="resendOtp()" [disabled]="resendCountdown > 0">
        {{ resendCountdown > 0 ? ('auth.resendIn' | translate) + ' ' + resendCountdown + 's' : ('auth.resend' | translate) }}
      </button>
    </div>

    <!-- Loading / Error States -->
    <div *ngIf="loading" class="spinner"></div>
    <div *ngIf="error" class="error">{{ error }}</div>
  </div>
</div>
```

### 4. Create Guardian Service

File: `frontend/src/app/core/services/guardian.service.ts`

Methods:
- `getGuardians(page, size): Observable<GuardianPageResponse>`
- `searchGuardians(searchTerm): Observable<Guardian[]>`
- `getGuardian(id): Observable<Guardian>`
- `createGuardian(request): Observable<Guardian>`
- `updateGuardian(id, request): Observable<Guardian>`
- `linkToStudent(request): Observable<StudentGuardianResponse>`
- `provisionPortal(guardianId, password): Observable<ProvisionResponse>`

### 5. Create Guardian Management UI

Components needed:
- `guardian-list.component` - List with search/filter
- `guardian-form.component` - Add/Edit form
- `guardian-detail.component` - View guardian details
- `student-guardian-link.component` - Link guardian to student

### 6. Update Student Provisioning UI

Enhance existing student form to include:
- Guardian details section (1-4 guardians)
- Dynamic guardian form array
- Validation for at least 1 guardian
- Phone number validation
- Bulk import template with guardian columns

### 7. Translations

Add to `en.json`:
```json
{
  "phoneAuth": {
    "title": "Phone Login",
    "phoneNumber": "Phone Number",
    "enterPhone": "Enter your phone number",
    "schoolCode": "School Code",
    "sendOtp": "Send OTP",
    "otpSent": "OTP sent to {phone}",
    "enterOtp": "Enter 6-digit OTP",
    "verify": "Verify",
    "resend": "Resend OTP",
    "resendIn": "Resend in",
    "invalidOtp": "Invalid OTP",
    "otpExpired": "OTP expired. Request a new one.",
    "attemptsRemaining": "{count} attempts remaining"
  },
  "guardian": {
    "title": "Guardians",
    "addGuardian": "Add Guardian",
    "editGuardian": "Edit Guardian",
    "firstName": "First Name",
    "lastName": "Last Name",
    "phone": "Phone Number",
    "email": "Email",
    "relationType": "Relation",
    "father": "Father",
    "mother": "Mother",
    "guardian": "Guardian",
    "occupation": "Occupation",
    "city": "City",
    "hasPortalAccess": "Portal Access",
    "linkedStudents": "Linked Students",
    "provisionPortal": "Provision Portal Access",
    "portalProvisioned": "Portal access provisioned successfully"
  }
}
```

Add corresponding Hindi translations to `hi.json`.

## 📊 Implementation Priority

1. **HIGH**: Phone Login UI + Auth Service methods
2. **HIGH**: Guardian Service (backend controllers)
3. **MEDIUM**: Guardian Management UI
4. **MEDIUM**: Student/Teacher bulk import enhancements
5. **LOW**: Email provider integration
6. **LOW**: Advanced features (audit logs UI, etc.)

## 🧪 Testing Checklist

- [ ] Phone OTP send/verify flow
- [ ] Phone login with mock data
- [ ] Guardian CRUD operations
- [ ] Student creation with guardians
- [ ] Bulk student import with guardians
- [ ] Teacher creation with phone
- [ ] Portal provisioning for guardians
- [ ] Language switching (en/hi)
- [ ] Theme consistency across all new components
- [ ] Mobile responsiveness
- [ ] Error handling and validation
- [ ] Rate limiting behavior

## 📚 Documentation

Create API documentation for:
- Phone auth endpoints
- Guardian endpoints  
- Bulk import endpoints

## 🔒 Security Considerations

- ✅ OTP hashing implemented
- ✅ Rate limiting implemented
- ✅ Cooldown management implemented
- ✅ Attempt tracking implemented
- [ ] Add CAPTCHA for OTP request (future)
- [ ] Add device fingerprinting (future)
- [ ] Add IP-based rate limiting (future)

## 🚀 Deployment Notes

1. Configure SMS provider (MOCK for dev, TWILIO/AWS_SNS for prod)
2. Set OTP configuration in application.properties
3. Run Flyway migration V14
4. Test with mock SMS in dev environment
5. Verify rate limiting behavior
6. Test bulk import with sample CSV files
7. Configure notification preferences

