#!/usr/bin/env python3
"""Generate two realistic Indian school onboarding CSV packs with 300 students each.

The timetable writer keeps the same conflict invariants enforced by the app:
one class/section slot per day/period, one teacher per day/period, and one room
per day/period.
"""

from __future__ import annotations

import csv
from collections import Counter, defaultdict
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
PERIOD_TIMES = [
    ("08:00", "08:40"),
    ("08:45", "09:25"),
    ("09:40", "10:20"),
    ("10:35", "11:15"),
    ("11:30", "12:10"),
    ("12:20", "13:00"),
    ("13:10", "13:50"),
]
GRADES = list(range(1, 11))
SECTIONS = ["A", "B"]
STUDENTS_PER_SECTION = 15

CLASS_HEADER = [
    "academic_year (O)",
    "class_code (O)",
    "class_name (R)",
    "grade (R)",
    "section_code (O)",
    "section_name (O)",
    "class_capacity (O)",
    "section_capacity (O)",
    "import_mode (O)",
]
PEOPLE_HEADER = [
    "academic_year_id (R)",
    "import_mode (O)",
    "employee_code (R)",
    "first_name (R)",
    "last_name (R)",
    "phone (R)",
    "join_date (O)",
    "status (O)",
    "email (O)",
    "gender (O)",
    "dob (O)",
    "qualification (O)",
    "specialization (O)",
    "department (O)",
    "subjects (O)",
    "can_class_teacher (O)",
    "class_teacher_slot (O)",
    "create_portal (O)",
    "portal_password (O)",
    "portal_role (O)",
    "library_role (O)",
    "school_role_codes (O)",
    "notify_credentials (O)",
    "salary (O)",
    "bank_account_holder (O)",
    "bank_name (O)",
    "bank_account_number (O)",
    "bank_ifsc (O)",
]
STUDENT_HEADER = [
    "academic_year_id (R)",
    "import_mode (O)",
    "first_name (R)",
    "last_name (R)",
    "gender (O)",
    "date_of_birth (O)",
    "student_email (O)",
    "class_id (O)",
    "section_id (O)",
    "classname (R)",
    "sectionname (O)",
    "roll_number (O)",
    "admission_number (R)",
    "admission_date (O)",
    "primary_guardian_relation (O)",
    "primary_guardian_name (R)",
    "primary_guardian_email (O)",
    "primary_guardian_phone (R)",
    "parent_id (O)",
    "create_parent_portal (O)",
    "notify_credentials (O)",
    "address (O)",
    "blood_group (O)",
]
TIMETABLE_HEADER = [
    "academic_year_id (R)",
    "import_mode (O)",
    "teacher_ref_type (R)",
    "teacher_ref (R)",
    "class_ref (R)",
    "section_ref (O)",
    "subject_code (R)",
    "day_of_week (R)",
    "period_no (R)",
    "start_time (R)",
    "end_time (R)",
    "room_code (O)",
]
FEE_HEADER = [
    "name (R)",
    "class_id (O)",
    "class_name (R)",
    "academic_year_id (R)",
    "component_spec (R)",
    "import_mode (O)",
]

FIRST_NAMES_M = [
    "Aarav",
    "Vivaan",
    "Aditya",
    "Vihaan",
    "Arjun",
    "Reyansh",
    "Krishna",
    "Ishaan",
    "Shaurya",
    "Advik",
    "Rudra",
    "Siddharth",
    "Kabir",
    "Dev",
    "Aryan",
    "Rohan",
    "Manav",
    "Karan",
    "Neil",
    "Ritesh",
    "Yash",
    "Dhruv",
    "Om",
    "Atharv",
]
FIRST_NAMES_F = [
    "Ananya",
    "Diya",
    "Kiara",
    "Pihu",
    "Saanvi",
    "Navya",
    "Ira",
    "Mira",
    "Tara",
    "Avni",
    "Kavya",
    "Riya",
    "Meera",
    "Tanvi",
    "Ishita",
    "Sneha",
    "Priya",
    "Neha",
    "Shruti",
    "Aditi",
    "Naina",
    "Anika",
    "Myra",
    "Prisha",
]
LAST_NAMES = [
    "Sharma",
    "Verma",
    "Patel",
    "Singh",
    "Reddy",
    "Iyer",
    "Menon",
    "Nair",
    "Kapoor",
    "Joshi",
    "Gupta",
    "Agarwal",
    "Malhotra",
    "Bansal",
    "Chopra",
    "Kulkarni",
    "Rao",
    "Desai",
    "Mukherjee",
    "Bose",
    "Saxena",
    "Chauhan",
    "Mehta",
    "Pillai",
]
FEMALE_NAMES = set(FIRST_NAMES_F)


@dataclass(frozen=True)
class SchoolSpec:
    slug: str
    name: str
    short_code: str
    domain: str
    city: str
    state: str
    teacher_phone_prefix: str
    staff_phone_prefix: str
    parent_phone_prefix: str
    admission_prefix: str
    password_prefix: str


SCHOOLS = [
    SchoolSpec(
        slug="cheena-public-school-india-300",
        name="Cheena Public School",
        short_code="CPS",
        domain="cheenapublicschool.edu.in",
        city="Delhi",
        state="Delhi",
        teacher_phone_prefix="98131",
        staff_phone_prefix="98132",
        parent_phone_prefix="98133",
        admission_prefix="CPSADM2026",
        password_prefix="Cps",
    ),
    SchoolSpec(
        slug="ddec-international-school-india-300",
        name="DDEC International School",
        short_code="DDEC",
        domain="ddecinternational.edu.in",
        city="Gurugram",
        state="Haryana",
        teacher_phone_prefix="98261",
        staff_phone_prefix="98262",
        parent_phone_prefix="98263",
        admission_prefix="DDECADM2026",
        password_prefix="Ddec",
    ),
]


TEACHER_PLAN = [
    ("English", 6, "M.A English", "Languages"),
    ("Hindi", 6, "M.A Hindi", "Languages"),
    ("Mathematics", 6, "M.Sc Mathematics", "Mathematics"),
    ("EVS", 5, "M.Sc Environmental Science", "Primary"),
    ("Science", 6, "M.Sc Science", "Science"),
    ("Social Science", 5, "M.A Social Science", "Social Science"),
    ("Computer Science", 4, "MCA", "Computer Science"),
    ("Physical Education", 4, "B.P.Ed", "Sports"),
    ("Art", 3, "BFA", "Arts"),
    ("Sanskrit", 3, "M.A Sanskrit", "Languages"),
    ("Moral Science", 3, "M.A Education", "Wellness"),
]

# (title, qualification, specialization, dept, portal_role, library_staff_role_or_empty, school_role_codes_csv)
# library_staff_role_or_empty: ASSISTANT / LIBRARIAN only when portal_role is LIBRARY_STAFF (never RBAC duty codes).
# school_role_codes: tenant RBAC duties; comma-separated cells are quoted automatically by CSV writers.
STAFF_ROWS = [
    ("Library", "MLIS", "Library", "Library", "LIBRARY_STAFF", "LIBRARIAN", "LIBRARY_OPERATIONS"),
    ("Circulation", "BLIS", "Circulation", "Library", "LIBRARY_STAFF", "ASSISTANT", "LIBRARY_OPERATIONS"),
    ("Office Admin", "B.A", "Office Administration", "Admin", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Accounts Clerk", "B.Com", "Accounts", "Accounts", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Fee Desk", "M.Com", "Fee Operations", "Accounts", "SCHOOL_STAFF", "", "FEE_OFFICE,BASE_SCHOOL_STAFF"),
    ("Transport Coordinator", "Diploma", "Transport", "Transport", "SCHOOL_STAFF", "", "TRANSPORT_LOGISTICS,BASE_SCHOOL_STAFF"),
    ("Lab Attendant", "B.Sc", "Science Lab", "Science Lab", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("ICT Support", "B.Tech", "IT Support", "IT", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Reception", "B.A", "Front Office", "Front Office", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("HR Assistant", "B.Com", "HR", "Admin", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Sports Assistant", "B.P.Ed", "Sports", "Sports", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Security Supervisor", "Diploma", "Security", "Admin", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Infirmary Nurse", "GNM", "Infirmary", "Health", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Counsellor", "M.A Psychology", "Counselling", "Wellness", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Stores Assistant", "B.Com", "Stores", "Stores", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Maintenance", "ITI", "Facilities", "Facilities", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Digital Resources", "M.Lib", "Digital Library", "Library", "LIBRARY_STAFF", "ASSISTANT", "LIBRARY_OPERATIONS"),
    ("Exam Cell Assistant", "B.Sc", "Exam Cell", "Academics", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
]


def phone(prefix: str, n: int) -> str:
    return f"{prefix}{n:05d}"


def local_email(first_name: str, last_name: str, domain: str, suffix: str = "") -> str:
    local = f"{first_name}.{last_name}{suffix}".lower().replace(" ", "")
    return f"{local}@{domain}"


def write_csv(path: Path, rows: list[list[str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        csv.writer(f, quoting=csv.QUOTE_MINIMAL).writerows(rows)


def section_pairs() -> list[tuple[int, str]]:
    return [(grade, section) for grade in GRADES for section in SECTIONS]


def build_classes() -> list[list[str]]:
    rows = [CLASS_HEADER]
    for grade in GRADES:
        capacity = 30 if grade <= 5 else 32
        for section in SECTIONS:
            rows.append(["CURRENT", f"G{grade:02d}", f"Class {grade}", str(grade), section, section, "", str(capacity), "UPSERT"])
    return rows


def build_teachers(school: SchoolSpec) -> tuple[list[list[str]], dict[str, list[str]]]:
    rows = [PEOPLE_HEADER]
    pools: dict[str, list[str]] = defaultdict(list)
    homerooms = [f"{grade}{section}" for grade, section in section_pairs()]
    teacher_no = 1
    for subject, count, qualification, department in TEACHER_PLAN:
        for _ in range(count):
            first = (FIRST_NAMES_M if teacher_no % 2 else FIRST_NAMES_F)[teacher_no % len(FIRST_NAMES_M)]
            last = LAST_NAMES[(teacher_no * 3) % len(LAST_NAMES)]
            code = f"T{teacher_no:03d}"
            can_class_teacher = "Y" if teacher_no <= len(homerooms) else "N"
            class_teacher_slot = homerooms[teacher_no - 1] if teacher_no <= len(homerooms) else ""
            rows.append(
                [
                    "CURRENT",
                    "UPSERT",
                    code,
                    first,
                    last,
                    phone(school.teacher_phone_prefix, teacher_no),
                    f"2023-06-{10 + (teacher_no % 18):02d}",
                    "ACTIVE",
                    # Stable unique mailbox per employee_code (name cycles repeat in FIRST_NAMES/LAST_NAMES pools).
                    local_email(first, last, school.domain, f".{code.lower()}"),
                    "female" if first in FEMALE_NAMES else "male",
                    "",
                    qualification,
                    subject,
                    department,
                    subject,
                    can_class_teacher,
                    class_teacher_slot,
                    "Y",
                    f"{school.password_prefix}@Teach{teacher_no:03d}",
                    "TEACHER",
                    "",
                    "ACADEMIC_STAFF",
                    "N",
                    str(41000 + teacher_no * 900),
                    f"{first} {last}",
                    "HDFC Bank",
                    f"50{teacher_no:010d}",
                    f"HDFC000{700 + teacher_no:03d}",
                ]
            )
            pools[subject].append(code)
            teacher_no += 1
    return rows, pools


def build_staff(school: SchoolSpec) -> list[list[str]]:
    rows = [PEOPLE_HEADER]
    for idx, row_spec in enumerate(STAFF_ROWS, start=1):
        first_hint, qualification, specialization, department, portal_role, library_role_csv, school_role_codes = row_spec
        first = FIRST_NAMES_F[(idx * 2) % len(FIRST_NAMES_F)] if idx % 2 else FIRST_NAMES_M[(idx * 2) % len(FIRST_NAMES_M)]
        last = LAST_NAMES[(idx * 5) % len(LAST_NAMES)]
        code = f"S{idx:03d}"
        rows.append(
            [
                "CURRENT",
                "UPSERT",
                code,
                first,
                last,
                phone(school.staff_phone_prefix, idx),
                f"2023-08-{1 + (idx % 24):02d}",
                "ACTIVE",
                # Unique mailbox per employee_code (names cycle in FIRST_NAMES/LAST_NAMES).
                local_email(first, last, school.domain, f".staff.{code.lower()}"),
                "female" if first in FEMALE_NAMES else "male",
                "",
                qualification,
                first_hint,
                department,
                specialization,
                "N",
                "",
                "Y",
                f"{school.password_prefix}@Staff{idx:03d}",
                portal_role,
                library_role_csv,
                school_role_codes,
                "N",
                str(24000 + idx * 650),
                f"{first} {last}",
                "HDFC Bank",
                f"60{idx:010d}",
                f"HDFC000{800 + idx:03d}",
            ]
        )
    return rows


def build_students(school: SchoolSpec) -> list[list[str]]:
    rows = [STUDENT_HEADER]
    adm = 1
    for grade, section in section_pairs():
        for roll in range(1, STUDENTS_PER_SECTION + 1):
            use_female = (adm + roll) % 3 == 0
            first = (FIRST_NAMES_F if use_female else FIRST_NAMES_M)[(adm + roll) % len(FIRST_NAMES_F)]
            last = LAST_NAMES[(adm * 2 + roll) % len(LAST_NAMES)]
            guardian_first = FIRST_NAMES_F[(adm + 4) % len(FIRST_NAMES_F)] if adm % 2 else FIRST_NAMES_M[(adm + 5) % len(FIRST_NAMES_M)]
            guardian_relation = "MOTHER" if guardian_first in FEMALE_NAMES else "FATHER"
            dob_year = 2020 - grade
            dob_month = 1 + (adm % 12)
            dob_day = 1 + (adm % 27)
            rows.append(
                [
                    "CURRENT",
                    "UPSERT",
                    first,
                    last,
                    "female" if first in FEMALE_NAMES else "male",
                    f"{dob_year}-{dob_month:02d}-{dob_day:02d}",
                    "",
                    "AUTO",
                    "AUTO",
                    f"Class {grade}",
                    section,
                    str(roll),
                    f"{school.admission_prefix}-{adm:04d}",
                    "2026-04-01",
                    guardian_relation,
                    f"{guardian_first} {last}",
                    f"parent.{adm:04d}@{school.domain}",
                    phone(school.parent_phone_prefix, adm),
                    "AUTO",
                    "Y",
                    "N",
                    f"House {20 + adm % 80}, Sector {1 + adm % 48}, {school.city}, {school.state}",
                    ["O+", "A+", "B+", "AB+", "O-", "A-"][adm % 6],
                ]
            )
            adm += 1
    return rows


def subject_counts_for_grade(grade: int) -> Counter[str]:
    if grade <= 5:
        return Counter(
            {
                "English": 7,
                "Hindi": 6,
                "Mathematics": 7,
                "EVS": 7,
                "Computer Science": 4,
                "Physical Education": 4,
                "Art": 4,
                "Moral Science": 3,
            }
        )
    if grade <= 8:
        return Counter(
            {
                "English": 6,
                "Hindi": 5,
                "Mathematics": 7,
                "Science": 7,
                "Social Science": 6,
                "Sanskrit": 4,
                "Computer Science": 3,
                "Physical Education": 2,
                "Art": 2,
            }
        )
    return Counter(
        {
            "English": 6,
            "Hindi": 4,
            "Mathematics": 7,
            "Science": 8,
            "Social Science": 7,
            "Sanskrit": 3,
            "Computer Science": 4,
            "Physical Education": 2,
            "Art": 1,
        }
    )


def balanced_subject_sequence(grade: int) -> list[str]:
    remaining = subject_counts_for_grade(grade)
    sequence: list[str] = []
    while sum(remaining.values()):
        candidates = sorted(remaining, key=lambda subject: (-remaining[subject], subject))
        for subject in candidates:
            if remaining[subject] <= 0:
                continue
            if len(sequence) >= 2 and subject in sequence[-2:]:
                continue
            sequence.append(subject)
            remaining[subject] -= 1
            break
        else:
            subject = max(remaining, key=remaining.get)
            sequence.append(subject)
            remaining[subject] -= 1
    if len(sequence) != len(DAYS) * len(PERIOD_TIMES):
        raise RuntimeError(f"Bad timetable subject count for grade {grade}: {len(sequence)}")
    return sequence


def build_timetable(school: SchoolSpec, teacher_pools: dict[str, list[str]]) -> list[list[str]]:
    rows = [TIMETABLE_HEADER]
    teacher_busy: set[tuple[str, int, str]] = set()
    room_busy: set[tuple[str, int, str]] = set()
    class_busy: set[tuple[int, str, str, int]] = set()
    teacher_load: Counter[str] = Counter()
    base_sequences = {grade: balanced_subject_sequence(grade) for grade in GRADES}

    for section_index, (grade, section) in enumerate(section_pairs()):
        sequence = base_sequences[grade]
        shift = (section_index * 5 + grade) % len(sequence)
        room = f"{school.short_code}-{grade}{section}-ROOM"
        for slot_index, (day, period_index) in enumerate((day, p) for day in DAYS for p in range(len(PERIOD_TIMES))):
            subject = sequence[(slot_index + shift) % len(sequence)]
            period = period_index + 1
            start, end = PERIOD_TIMES[period_index]
            class_key = (grade, section, day, period)
            room_key = (day, period, room)
            if class_key in class_busy:
                raise RuntimeError(f"Class conflict: {class_key}")
            if room_key in room_busy:
                raise RuntimeError(f"Room conflict: {room_key}")

            available = [code for code in teacher_pools[subject] if (day, period, code) not in teacher_busy]
            if not available:
                raise RuntimeError(f"No available {subject} teacher for Class {grade}-{section} {day} P{period}")
            teacher_code = min(available, key=lambda code: (teacher_load[code], code))
            teacher_key = (day, period, teacher_code)
            teacher_busy.add(teacher_key)
            room_busy.add(room_key)
            class_busy.add(class_key)
            teacher_load[teacher_code] += 1
            rows.append(
                [
                    "CURRENT",
                    "UPSERT",
                    "EMPLOYEE_CODE",
                    teacher_code,
                    f"Class {grade}",
                    section,
                    subject,
                    day,
                    str(period),
                    start,
                    end,
                    room,
                ]
            )
    return rows


def build_fees() -> list[list[str]]:
    rows = [FEE_HEADER]
    for grade in GRADES:
        tuition = 20500 + grade * 1850
        activity = 1800 + grade * 125
        lab = 900 + grade * 250 if grade >= 3 else 600
        sports = 1400 + grade * 100
        annual = 2500 + grade * 200
        transport = 0
        component_spec = (
            f"Tuition:{tuition}:TUITION|Activity:{activity}:MISC|"
            f"Lab:{lab}:LAB|Sports:{sports}:SPORTS|Annual:{annual}:MISC|Transport:{transport}:TRANSPORT"
        )
        rows.append([f"Class {grade} Annual Fee", "", f"Class {grade}", "CURRENT", component_spec, "UPSERT"])
    return rows


def write_readme(out_dir: Path, school: SchoolSpec, teacher_rows: int, timetable_rows: int) -> None:
    text = f"""# {school.name} Import Pack

Production-like Indian school dataset for the CURRENT academic year.

## Contents

- `01_classes_sections.csv`: Classes 1-10, sections A/B, 20 section rows.
- `02_teachers.csv`: {teacher_rows} teachers with employee codes, portal logins, payroll bank metadata, and 20 class-teacher assignments.
- `03_staff.csv`: 18 non-teaching staff across library, fees, admin, transport, lab, IT, health, and operations.
- `04_students.csv`: 300 students, 15 per section, with admission numbers, guardian contacts, parent portal anchors, addresses, and blood groups.
- `05_timetable.csv`: {timetable_rows} weekly recurring timetable slots, Monday-Saturday, 7 periods per day.
- `06_fee_structures.csv`: Class-wise annual fee structures with tuition, activity, lab, sports, annual, and transport components.

## Import Order

1. Classes and sections
2. Teachers
3. Staff
4. Students
5. Fee structures
6. Timetable

**Timetable:** Run step 6 only after step 2 completes for the same tenant. `teacher_ref` resolves to live `employee_code` rows. Super Admin imports must use the same **schoolCode** for every step.

**Data hygiene (Phase-4 style):** Teacher emails use `firstname.lastname.{{code}}@domain` so every `employee_code` maps to a unique mailbox (avoids import merge by email). Staff use `.staff.s###@`. Parent emails are `parent.{{seq}}@domain` (unique per student).

## Timetable validation (generator)

Generated by `../generate_india_school_300_packs.py`:

- No duplicate class/section for the same day and period.
- No teacher appears in two classes for the same day and period.
- No room is reused by two rows for the same day and period.
"""
    (out_dir / "README.md").write_text(text, encoding="utf-8")


def generate_school(school: SchoolSpec) -> None:
    out_dir = ROOT / school.slug
    out_dir.mkdir(parents=True, exist_ok=True)
    teachers, pools = build_teachers(school)
    timetable = build_timetable(school, pools)

    write_csv(out_dir / "01_classes_sections.csv", build_classes())
    write_csv(out_dir / "02_teachers.csv", teachers)
    write_csv(out_dir / "03_staff.csv", build_staff(school))
    write_csv(out_dir / "04_students.csv", build_students(school))
    write_csv(out_dir / "05_timetable.csv", timetable)
    write_csv(out_dir / "06_fee_structures.csv", build_fees())
    write_readme(out_dir, school, len(teachers) - 1, len(timetable) - 1)

    print(
        f"{school.name}: classes=20 teachers={len(teachers)-1} staff=18 "
        f"students=300 timetable={len(timetable)-1} fees=10"
    )


def main() -> None:
    for school in SCHOOLS:
        generate_school(school)


if __name__ == "__main__":
    main()
