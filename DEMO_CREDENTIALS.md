# Demo Credentials - School ERP System

This file contains all login credentials for the comprehensive demo data seeded in the School ERP system.

**ALL USERS PASSWORD: `admin123`**

---

## Platform Level

### Super Admin (Multi-Tenant Administration)
- **Email:** `superadmin@schoolerp.com`
- **Password:** `admin123`
- **Role:** SUPER_ADMIN
- **Access:** Can manage all schools across the platform

---

## School 1: Delhi Public School (DPS-DLH)

### School Information
- **School Code:** `DPS-DLH`
- **School Name:** Delhi Public School
- **Location:** A-Block, Defence Colony, New Delhi 110024, Delhi
- **Phone:** +91-11-2433-5050
- **Email:** office@dpsdel.edu.in

### Administrator
- **Email:** `admin@dpsdel.edu.in`
- **Password:** `admin123`
- **Role:** ADMIN
- **Access:** Full school administration, can manage all users, classes, students, fees, exams, etc.

### Sample Teachers
The system creates 30 teachers for DPS-DLH. Email format: `{firstname}.{lastname}@dps-dlh.edu.in`

**Sample teacher emails (you can use any of these):**
- Mathematics Teachers
- Science Teachers  
- English Teachers
- Hindi Teachers
- Social Studies Teachers
- Physics/Chemistry/Biology Teachers (for higher classes)
- Computer Science Teachers
- Physical Education Teachers

**To find all teacher emails:**
Query the database: `SELECT email FROM users WHERE tenant_id='tenant_dps_delhi_9x4k7m2p' AND role='TEACHER'`

**Example teachers:**
- First few teachers will have emails like:
  - `aarav.sharma@dps-dlh.edu.in`
  - `ananya.verma@dps-dlh.edu.in`
  - `vivaan.singh@dps-dlh.edu.in`
  - etc.

### Sample Parents
The system creates parent accounts for all students. Email format: `{firstname}.{lastname}@parent.dps-dlh.edu.in`

**Sample parent emails:**
- `rajesh.sharma@parent.dps-dlh.edu.in`
- `amit.verma@parent.dps-dlh.edu.in`
- `suresh.singh@parent.dps-dlh.edu.in`
- `sunita.sharma@parent.dps-dlh.edu.in`
- `kavita.verma@parent.dps-dlh.edu.in`
- etc.

**To find all parent emails:**
Query: `SELECT email FROM users WHERE tenant_id='tenant_dps_delhi_9x4k7m2p' AND role='PARENT'`

**Parent Access:**
- Can view their children's details
- Can see attendance, marks, fee payments
- Can communicate with teachers
- Can request leave for their children
- Can see timetable, announcements

### Sample Students (for testing student portal if enabled)
Students don't have login credentials by default, but can be enabled if needed.
Email format: `{firstname}.{lastname}@student.dps-dlh.edu.in`

### Library Staff
One or two teachers are assigned library staff roles.
**Access same as teacher**, plus:
- Can manage library books
- Can issue/return books
- Can calculate fines

---

## School 2: Kendriya Vidyalaya (KV-MUM)

### School Information
- **School Code:** `KV-MUM`
- **School Name:** Kendriya Vidyalaya No. 1
- **Location:** INS Hamla, Marve Road, Malad West, Mumbai 400095, Maharashtra
- **Phone:** +91-22-2844-6633
- **Email:** kvmumbai1@gmail.com

### Administrator
- **Email:** `admin@kvmumbai1.gmail.com`
- **Password:** `admin123`
- **Role:** ADMIN
- **Access:** Full school administration

### Sample Teachers
30 teachers with email format: `{firstname}.{lastname}@kv-mum.edu.in`

**To find all teacher emails:**
Query: `SELECT email FROM users WHERE tenant_id='tenant_kv_mumbai_7p5n3x8q' AND role='TEACHER'`

### Sample Parents
Parent accounts with email format: `{firstname}.{lastname}@parent.kv-mum.edu.in`

**To find all parent emails:**
Query: `SELECT email FROM users WHERE tenant_id='tenant_kv_mumbai_7p5n3x8q' AND role='PARENT'`

### Library Staff
One or two teachers assigned library roles.

---

## Data Coverage

### Classes & Sections
Both schools have:
- **Classes:** 6, 7, 8, 9, 10, 11, 12 (7 classes)
- **Sections:** A, B per class (14 sections total)
- **Students:** 7-8 per section (~100 students per school)
- **Teachers:** 10 teachers per school

⚠️ **OPTIMIZED FOR RENDER FREE TIER** (0.1 CPU, 512MB RAM) - Reduced data volume by ~90%

### Comprehensive Module Coverage

#### 1. **Academic Structure**
- Academic Year: 2025-2026 (current)
- Subjects: Mathematics, Science, Physics, Chemistry, Biology, English, Hindi, Sanskrit, History, Geography, Civics, Economics, Computer Science, Physical Education, Art & Craft
- Class Teacher Assignments: Each section has a designated class teacher
- Subject Teacher Assignments: Each subject taught by specialized teachers

#### 2. **Students & Guardians**
- ~100 students per school across all classes
- Each student has:
  - Father (with PARENT role user account)
  - Mother (with PARENT role user account)
  - Proper guardian mappings (Father as primary, Mother as secondary)
  - Complete details: DOB, gender, blood group, address, admission number
  - Roll numbers, class and section assignments

#### 3. **Fees Module**
- Fee structures for each class (varies by grade)
- Components: Tuition, Transport, Library, Exam, Sports fees
- Fee payments with varied statuses:
  - 60% PAID (full payment made)
  - 25% PARTIAL (partial payment made)
  - 15% UNPAID (no payment yet)
- Receipt numbers, payment methods, payment dates

#### 4. **Exams & Marks**
- 4 exams per year:
  - Unit Test 1 (COMPLETED, results published)
  - Mid-Term Exam (COMPLETED)
  - Unit Test 2 (UPCOMING)
  - Final Exam (UPCOMING)
- Complete exam schedules with date, time, room
- Mark records for completed exams (Unit Test 1)
- Subjects: Mathematics, Science, English, Hindi, Social Studies
- Grades: A+, A, B+, B, C, D based on marks

#### 5. **Attendance**
- Last 5 days of attendance for all students
- Status distribution:
  - 85% PRESENT
  - 10% ABSENT
  - 5% LATE
- Marked by respective teachers

#### 6. **Timetable**
- Complete weekly timetable for all classes
- 6 periods per day, 6 days a week (Monday-Saturday)
- Subject assignments with teachers and rooms
- Period times: 8:30 AM - 1:30 PM (45-minute periods)

#### 7. **Transport**
- 2 routes per school
- Vehicles: Buses with registration numbers
- Drivers: With license details
- Route stops: 6 stops per route with GPS coordinates
- ~8 students assigned to each route (~16 students using transport)
- Pickup and drop stop assignments

#### 8. **Library**
- 30 books per school
- Categories: Fiction, Computer Science, Science, History
- Famous titles: Harry Potter, 1984, Introduction to Algorithms, etc.
- 2-4 copies per book
- 10 book issues (mix of issued, returned, overdue)
- Automatic fine calculation for overdue books (Rs.10/day)

#### 9. **Hostel**
- 2 hostels per school: Boys Hostel, Girls Hostel
- 8 rooms per hostel
- Room types: Double (2 students), Triple (3 students), Dormitory (6 students)
- Student allocations (50% occupancy)
- Room status tracking

#### 10. **Payroll (Teachers)**
- Salary structures for all teachers
- Components:
  - Basic Salary
  - Allowances: DA (12%), HRA (20%), TA (Rs.2000)
  - Deductions: TDS (10%), PF (12%)
- Payslips for last 3 months
- Bank details for salary disbursement

#### 11. **Communication**
- 3 announcements per school
  - School reopening, parent-teacher meeting, exams
- 5 direct messages (teacher to parent)
- Target audiences: ALL, TEACHERS, PARENTS, CLASS, SECTION

#### 12. **Documents**
- 5 sample documents:
  - Class syllabuses (Class 10, 12)
  - School rules
  - Annual reports
  - Fee structures
- Uploaded by admins and teachers
- Visibility scopes: SCHOOL-wide, CLASS-specific, PRIVATE

#### 13. **Leave Requests**
- Teacher leaves: 5 requests (mix of approved, pending, rejected)
- Student leaves: 10 requests (mix of approved, pending)
- Leave types: SICK, CASUAL, EMERGENCY
- Approver remarks included

---

## Testing Scenarios

### For Parent Role Testing
1. **Login as parent:** Use any parent email from the school
2. **View children:** Should see all children mapped to this parent
3. **Check attendance:** View attendance records for each child
4. **Check marks:** View exam results for each child
5. **Check fees:** View fee payments and outstanding dues
6. **View timetable:** See class schedule
7. **Messages:** Send/receive messages to/from teachers
8. **Leave requests:** Request leave for children

### For Teacher Role Testing
1. **Login as teacher:** Use any teacher email
2. **View assigned classes:** See classes and sections assigned
3. **View students:** See students in assigned classes
4. **Mark attendance:** Mark attendance for students
5. **Enter marks:** Enter exam marks for subjects taught
6. **View timetable:** See teaching schedule
7. **View salary:** Check salary structure and payslips
8. **Submit leave:** Request leave

### For Admin Role Testing
1. **Login as admin:** Use school admin email
2. **Manage users:** Create/edit users (teachers, parents)
3. **Manage academic structure:** Classes, sections, subjects
4. **Manage students:** Add/edit student information
5. **Manage fees:** Create fee structures, view payments
6. **Manage exams:** Schedule exams, view results
7. **View reports:** Attendance reports, fee collection, etc.
8. **Manage transport:** Routes, vehicles, student assignments
9. **Manage library:** Books, issues, fines
10. **Manage hostel:** Rooms, allocations
11. **Approve leaves:** Approve/reject leave requests
12. **Announcements:** Create school-wide announcements

### For Super Admin Role Testing
1. **Login as super admin:** `superadmin@schoolerp.com`
2. **View all schools:** See both DPS-DLH and KV-MUM
3. **Multi-tenant access:** Switch between schools
4. **Platform-level reports:** Cross-school analytics
5. **User management:** Manage admins across schools

---

## Database Query Helpers

### Get all users for a school:
```sql
-- DPS-DLH
SELECT id, name, email, role FROM users 
WHERE tenant_id='tenant_dps_delhi_9x4k7m2p' AND is_deleted=FALSE
ORDER BY role, name;

-- KV-MUM
SELECT id, name, email, role FROM users 
WHERE tenant_id='tenant_kv_mumbai_7p5n3x8q' AND is_deleted=FALSE
ORDER BY role, name;
```

### Get all students with parents:
```sql
SELECT 
  s.id, 
  s.first_name, 
  s.last_name, 
  s.email as student_email,
  s.admission_number,
  sc.name as class_name,
  sec.name as section_name,
  u.name as parent_name,
  u.email as parent_email
FROM students s
JOIN school_classes sc ON s.class_id = sc.id
JOIN sections sec ON s.section_id = sec.id
LEFT JOIN users u ON s.parent_id = u.id
WHERE s.tenant_id = 'tenant_dps_delhi_9x4k7m2p'
AND s.is_deleted = FALSE
ORDER BY sc.grade, sec.name, s.roll_number;
```

### Get teacher-class assignments:
```sql
SELECT 
  t.first_name || ' ' || t.last_name as teacher_name,
  sc.name as class_name,
  sec.name as section_name,
  sta.subject_name
FROM subject_teacher_assignments sta
JOIN teachers t ON sta.teacher_id = t.id
JOIN school_classes sc ON sta.class_id = sc.id
JOIN sections sec ON sta.section_id = sec.id
WHERE sta.tenant_id = 'tenant_dps_delhi_9x4k7m2p'
AND sta.is_deleted = FALSE
ORDER BY sc.grade, sec.name, sta.subject_name;
```

### Get fee payment summary:
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  SUM(paid_amount) as total_paid,
  SUM(due_amount) as total_due
FROM fee_payments
WHERE tenant_id = 'tenant_dps_delhi_9x4k7m2p'
AND is_deleted = FALSE
GROUP BY status;
```

---

## Notes

1. **Idempotent Seeding:** The seed service can be run multiple times. It checks if schools already exist before creating them.

2. **Realistic Data:** All data uses realistic Indian names, addresses, phone numbers, and school structures typical of Indian CBSE/ICSE schools.

3. **Role-Based Access:** Each role has specific permissions:
   - **PARENT:** Can only see their own children's data
   - **TEACHER:** Can see assigned classes and students
   - **ADMIN:** Can see and manage all school data
   - **SUPER_ADMIN:** Can see and manage all schools

4. **Data Relationships:** All relationships are properly maintained:
   - Students ↔ Guardians (many-to-many via mapping)
   - Students ↔ Classes & Sections (many-to-one)
   - Students ↔ Fee Payments (one-to-many)
   - Students ↔ Attendance Records (one-to-many)
   - Teachers ↔ Class Assignments (one-to-many)
   - Teachers ↔ Subject Assignments (one-to-many)

5. **Testing Coverage:** This comprehensive dataset allows testing:
   - All CRUD operations
   - Complex queries and reports
   - Role-based access control
   - Parent-teacher-admin workflows
   - Fee collection scenarios
   - Exam and result management
   - Attendance tracking
   - Transport management
   - Library operations
   - Hostel management
   - Payroll processing
   - Communication features
   - Leave management

---

## Quick Start for QA Testing

1. **Start the application** with profile `demo-seed`:
   ```bash
   spring.profiles.active=demo-seed
   ```

2. **Login as Super Admin** to see both schools:
   - Email: `superadmin@schoolerp.com`
   - Password: `admin123`

3. **Login as School Admin** (DPS-DLH):
   - Email: `admin@dpsdel.edu.in`
   - Password: `admin123`

4. **Login as Teacher:**
   - Query database for teacher emails
   - Password: `admin123`

5. **Login as Parent:**
   - Query database for parent emails
   - Password: `admin123`

6. **Verify data consistency:**
   - Parents should see only their children
   - Teachers should see only assigned classes
   - All relationships should be intact
   - No orphan records

---

---

## Troubleshooting

### "Duplicate entry" errors

If you see errors like `Duplicate entry 'tenant_xxx-RCPxxx' for key 'fee_payments.uq_fee_payment_tenant_receipt'`, it means data already exists in the database.

**Solution:**
1. **Option 1 (Recommended):** Use a fresh database
2. **Option 2:** Manually delete existing data:
   ```sql
   -- Delete all demo data for a school (CAUTION: This deletes all data!)
   DELETE FROM users WHERE tenant_id = 'tenant_dps_delhi_9x4k7m2p';
   DELETE FROM students WHERE tenant_id = 'tenant_dps_delhi_9x4k7m2p';
   -- ... repeat for all tables
   
   -- Or drop and recreate the database
   DROP DATABASE your_database_name;
   CREATE DATABASE your_database_name;
   ```
3. **Option 3:** The seed service is **idempotent** - if schools already exist with data, it will skip them automatically

### Seed service won't run

**Check:**
1. Profile is set to `demo-seed`
2. Database connection is working
3. All Flyway migrations have run successfully

### Data seems incomplete

The seed service creates data in stages. If it fails partway through, you may have incomplete data. Best solution: start with a fresh database.

### Performance is slow

Creating ~900 students per school with all relationships takes time (typically 30-60 seconds per school). This is normal. Watch the logs for progress.

---

## Changes from Original Seed Service

### What was improved:
1. ✅ **Fixed receipt number duplicates** - Now uses a counter instead of timestamp + random
2. ✅ **Idempotent seeding** - Checks if data exists before creating
3. ✅ **Better error handling** - Clear error messages and troubleshooting tips
4. ✅ **Comprehensive data** - All modules fully populated (~100 students per school)
5. ✅ **Realistic Indian data** - Authentic names, addresses, phone numbers
6. ✅ **Proper relationships** - All foreign keys and mappings maintained
7. ✅ **Better logging** - Progress indicators and completion summaries
8. ✅ **Optimized for Render free tier** - Reduced data volume by ~90% (0.1 CPU, 512MB RAM)

---

**Generated by:** DemoDataSeedService.java
**Last Updated:** 2026-04-14
**Password for all users:** admin123
