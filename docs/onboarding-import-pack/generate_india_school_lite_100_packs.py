#!/usr/bin/env python3
"""Generate lighter Cheena + DDEC onboarding packs (~100 learners, ~35 faculty, 5 staff).

Each **teacher CSV row is a distinct employee**: unique name/email/employee_code, and differentiated
qualification + specialization blurbs — even when several educators share the same *timetable subject pool*
(multiple humans teaching English concurrently is realistic; clones with identical specialization text are not).

• Classes 1–5 whole-cohort rows; Classes 6–12 one section ``A`` per grade.
• Timetable Mon–Fri; placement strategy `LiteTimetableStrategy` (**Rule A — fixed periods** default, **Rule B — rotating grid** optional).
• Same concurrency invariants (class / teacher / room uniqueness per slot).
"""

from __future__ import annotations

import csv
import re
from collections import Counter, defaultdict
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


ROOT = Path(__file__).resolve().parent
DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]
PERIOD_TIMES = [
    ("08:00", "08:40"),
    ("08:45", "09:25"),
    ("09:40", "10:20"),
    ("10:35", "11:15"),
    ("11:30", "12:10"),
    ("12:20", "13:00"),
    ("13:10", "13:50"),
]

# Lite layout: Classes 1–5 are whole-cohort streams; Classes 6–12 use **one** section (`A`)
# each so timetable parallelism stays manageable (~12 concurrent classes vs ~19 with A+B everywhere).
CLASS_LAYOUT: list[tuple[int, str | None]] = [(g, None) for g in range(1, 6)] + [(g, "A") for g in range(6, 13)]
# 100 learners: slight bump on early primaries, base load on seniors.
STUDENTS_PER_COHORT: list[int] = [9, 9, 9, 9, 8] + [8] * 7
assert len(STUDENTS_PER_COHORT) == len(CLASS_LAYOUT) == 12
assert sum(STUDENTS_PER_COHORT) == 100


class LiteTimetableStrategy(str, Enum):
    """Timetable generator mode: ``FIXED_PERIOD_WEEKLY`` = Rule A (same slot all week); ``ROTATING_DAY_GRID`` = Rule B."""

    FIXED_PERIOD_WEEKLY = "fixed_period_weekly"
    ROTATING_DAY_GRID = "rotating_day_grid"


# Switch here for onboarding packs without changing call sites (`build_timetable` reads this module global).
LITE_TIMETABLE_STRATEGY = LiteTimetableStrategy.FIXED_PERIOD_WEEKLY


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
    "subject_name (R)",
    "subject_code (O)",
    "day_of_week (R)",
    "period_no (R)",
    "start_time (R)",
    "end_time (R)",
    "room_code (O)",
]

# Mnemonics aligned with backend DEFAULT_SUBJECT_CATALOG (AcademicService) where names match; others are stable school-style codes.
CATALOG_SUBJECT_CODE_BY_NAME: dict[str, str] = {
    "English": "ENG",
    "Mathematics": "MATH",
    "Computer Science": "CS",
    "Physical Education": "PE",
    # Matches deriveSubjectCode("Hindi") / common catalog shape; importer still reconciles aliases (e.g. HIN → HINDI).
    "Hindi": "HINDI",
    "Science": "SCI",
    "EVS": "EVS",
    "Social Science": "SST",
    "Art": "ART",
    "Sanskrit": "SAN",
    "Moral Science": "MOR",
}
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
        slug="cheena-public-school-india-lite-100",
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
        slug="ddec-international-school-india-lite-100",
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

# (catalog subject_for_timetable, headcount). Styling variants come from TEACHER_STYLE_ROTATION.
LITE_TEACHER_PLAN: list[tuple[str, int]] = [
    ("English", 5),
    ("Hindi", 5),
    ("Mathematics", 5),
    ("EVS", 2),
    ("Science", 4),
    ("Social Science", 3),
    ("Computer Science", 2),
    ("Physical Education", 4),
    ("Art", 1),
    ("Sanskrit", 1),
    ("Moral Science", 1),
]
assert sum(c for _, c in LITE_TEACHER_PLAN) == 33
MAX_TEACHER_APPEND = 16

SUBJECT_DEPARTMENT: dict[str, str] = {
    "English": "Languages",
    "Hindi": "Languages",
    "Sanskrit": "Languages",
    "Mathematics": "STEM",
    "Science": "STEM",
    "EVS": "Primary",
    "Social Science": "Social Studies",
    "Computer Science": "Technology",
    "Physical Education": "Sports",
    "Art": "Creative Arts",
    "Moral Science": "Pastoral Care",
}


# Rotate (qualification, specialization_title) — keeps CSV human-readable vs copy-pasted clones.
TEACHER_STYLE_ROTATION: dict[str, list[tuple[str, str]]] = {
    "English": [
        ("M.A English Literature", "Literature emphasis — prose & poetry"),
        ("B.Ed (+ English specialization)", "Foundational literacy — primary"),
        ("M.Ed (English Language Teaching)", "Communicative English — middle school"),
        ("M.Phil Applied Linguistics", "Writing strategies & phonics scaffold"),
        ("M.A English (Communication Skills)", "Debate club & vocabulary lab"),
        ("M.A Comparative Literature", "World literature excerpts — seniors"),
        ("M.A Journalism", "Media literacy tied to curriculum"),
        ("P.G.D.T.E.", "Remediation & bridging readers"),
    ],
    "Hindi": [
        ("M.A Hindi", "संस्करण काव्य व लेखन (classical-modern balance)"),
        ("B.Ed (Hindi specialization)", "मूल भाषा और मौखिक निपुणता"),
        ("M.Phil Linguistics", "भाषाई संरचना व व्याकरण कार्यशाला"),
        ("M.Ed (Teaching of Hindi)", "पठन प्रवाह व अनुवाद कौशल"),
        ("M.A Hindi Journalism", "समाचार लेखन — शाला पत्रिका"),
        ("Certificate Praveen", "मातृभाषा पुस्तकालय पठन"),
        ("M.A Functional Hindi", "प्रशासनिक हिंदी व आधिकारिक पत्राचार"),
        ("Diploma Sanskrit-Hindi Bridge", "द्विभाषिक समन्वय — प्राथमिक"),
    ],
    "Mathematics": [
        ("M.Sc Mathematics", "Algebra & calculus stream"),
        ("M.Sc Applied Mathematics", "Modelling workshops — interdisciplinary"),
        ("B.Ed (Mathematics specialization)", "Conceptual grounding — foundational"),
        ("M.Ed Mathematics Education", "Manipulatives & formative assessment"),
        ("M.Stat", "Introductory probability & charts"),
        ("M.Sc Computational Mathematics", "Spreadsheet & logic puzzles"),
        ("M.Ed STEM Integration", "Mathematics laboratories"),
        ("M.Phil Discrete Mathematics", "Algorithmic puzzles club"),
    ],
    "Science": [
        ("M.Sc Integrated Sciences", "Inquiry-led experiments"),
        ("B.Sc Chemistry + B.Ed", "Lab safety marshal — Chemistry"),
        ("M.Sc Physics", "Demonstration physics carousel"),
        ("M.Sc Life Sciences + B.Ed", "Microscopy & taxonomy"),
        ("M.Ed Science Education", "STEM fair coordination"),
        ("M.Env.Sc", "Sustainability & earth systems"),
        ("Diploma Forensic Basics", "Observational analysis lab"),
        ("M.Sc Biochemistry bridge", "Health science tie-ins"),
    ],
    "EVS": [
        ("M.Sc Environmental Science", "Field trips — water & habitats"),
        ("B.Ed (Environmental Education)", "Local ecosystem scrapbooks"),
    ],
    "Social Science": [
        ("M.A History", "Civics & constitutional stories"),
        ("M.A Political Science + B.Ed", "Mock parliament facilitator"),
        ("M.Geography", "Map skills & atlas studio"),
        ("M.Ed Social Studies", "Project-based community interviews"),
        ("M.A Economics", "Household budgeting mini-projects"),
        ("M.Ed Integrated Social Science", "Interdisciplinary thematic weeks"),
        ("M.Phil Sociology of Education", "Classroom restorative circles"),
    ],
    "Computer Science": [
        ("MCA", "Algorithms & Scratch bridging"),
        ("M.Sc IT + B.Ed", "Digital citizenship & keyboarding"),
        ("PG Diploma Robotics", "STEAM hour coordinator"),
        ("BCA (+ teaching certification)", "Productivity suites & LMS hygiene"),
        ("M.Tech Educational Technology", "Flipped-lesson authoring"),
        ("MCA (Cybersecurity elective)", "Safe browsing drills"),
        ("PGDCA", "ICT lab rollout support"),
        ("M.Ed Learning Sciences", "Formative quizzes with analytics"),
    ],
    "Physical Education": [
        ("B.P.Ed", "Fitness conditioning & relays"),
        ("M.P.Ed", "Athletics biomechanics fundamentals"),
        ("Diploma Yoga Education", "Mindfulness circuits"),
        ("Bachelor Sports Coaching", "Inter-house tournament referee"),
        ("M.P.Ed (Sports Psychology elective)", "Youth motivational workshops"),
        ("Certificate Martial Arts Basics", "Discipline drills & coordination"),
        ("B.P.Ed (Adapted PE elective)", "Inclusion athletics"),
        ("Diploma Sports Nutrition Basics", "Hydration clinics"),
    ],
    "Art": [
        ("BFA Painting", "Visual arts — colour theory lab"),
        ("MVA Art Education", "Paper craft & set design studio"),
        ("Diploma Digital Illustration", "Portfolio sketchbooks"),
        ("B.Ed Creative Arts elective", "Mural rotations"),
        ("MFA Sculpture basics", "Hands-on ceramics intro"),
        ("B.Design (Visual)", "Poster design for assemblies"),
        ("Certificate Folk Arts", "Regional craft showcase"),
        ("M.A Performing Arts elective", "Drama tableau coach"),
    ],
    "Sanskrit": [
        ("M.A Sanskrit", "श्लोकानुशासनम् व भाषागत अध्ययन"),
        ("Vidya Varidhi Sanskrit", "व्याकरण दीपिका कार्यालयः"),
        ("M.Ed Classical Languages bridge", "Sanskrit chanting assembly"),
        ("Shiksha Shastri (Sanskrit)", "शिक्षाशास्त्रीय पाठ व्यवस्था"),
        ("M.Phil Comparative Philology", "Root tracing across languages"),
        ("Certificate Vyakarana Basics", "लघुप्रक्रिया अभ्यास"),
        ("M.A Theology Studies elective", "Ethical parables facilitator"),
        ("Diploma Indology", "Festivals timeline studio"),
    ],
    "Moral Science": [
        ("M.A Value Education + B.Ed", "SEL circle facilitator"),
        ("M.Ed Guidance & Counselling", "Peer mediation scaffolding"),
        ("M.Phil Ethics", "Service-learning coordination"),
        ("M.Sc Psychology bridging", "Classroom restorative scripts"),
        ("M.A Comparative Religion Studies", "Interfaith etiquette dialogues"),
        ("Diploma Life Skills Coaching", "Career aptitude awareness"),
        ("M.S.W", "Community outreach liaison"),
        ("M.Ed Character Education elective", "Gratitude journaling routines"),
    ],
}


def flatten_teacher_plan(plan: list[tuple]) -> list[str]:
    expanded: list[str] = []
    for entry in plan:
        subject = entry[0]
        count = entry[1]
        expanded.extend([subject] * int(count))
    return expanded


def faculty_display_name(sequence_index: int) -> tuple[str, str, str]:
    """Return (first, last, gender) with varied surnames (not one surname for half the CSV)."""
    given_order = [*FIRST_NAMES_M, *FIRST_NAMES_F]
    i = sequence_index - 1
    n_given = len(given_order)
    first = given_order[i % n_given]
    last = LAST_NAMES[(i * 11 + i // max(n_given, 1)) % len(LAST_NAMES)]
    gender = "female" if first in FEMALE_NAMES else "male"
    return first, last, gender


def style_pick_for_subject(pool_subject: str, variant_index: int) -> tuple[str, str]:
    styles = TEACHER_STYLE_ROTATION.get(
        pool_subject,
        [("Graduate Diploma (Education)", f"{pool_subject} instruction")],
    )
    return styles[variant_index % len(styles)]


def build_teachers(
    school: SchoolSpec,
    homeroom_slots: list[str],
    teacher_plan: list[tuple],
) -> tuple[list[list[str]], dict[str, list[str]]]:
    subject_sequence = flatten_teacher_plan(teacher_plan)
    rows = [PEOPLE_HEADER]
    pools: dict[str, list[str]] = defaultdict(list)
    subject_variant_idx: defaultdict[str, int] = defaultdict(int)

    teacher_no = 1
    for pool_subject in subject_sequence:
        first, last, gender = faculty_display_name(teacher_no)
        vi = subject_variant_idx[pool_subject]
        subject_variant_idx[pool_subject] = vi + 1
        qualification, specialization = style_pick_for_subject(pool_subject, vi)
        department = SUBJECT_DEPARTMENT.get(pool_subject, "Academics")
        code = f"T{teacher_no:03d}"
        can_class_teacher = "Y" if teacher_no <= len(homeroom_slots) else "N"
        class_teacher_slot = homeroom_slots[teacher_no - 1] if teacher_no <= len(homeroom_slots) else ""
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
                local_email(first, last, school.domain, f".{code.lower()}"),
                gender,
                "",
                qualification,
                specialization,
                department,
                pool_subject,
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
        pools[pool_subject].append(code)
        teacher_no += 1
    return rows, pools


STAFF_ROWS = [
    ("Library", "MLIS", "Library", "Library", "LIBRARY_STAFF", "LIBRARIAN", "LIBRARY_OPERATIONS"),
    ("Circulation", "BLIS", "Circulation", "Library", "LIBRARY_STAFF", "ASSISTANT", "LIBRARY_OPERATIONS"),
    ("Office Admin", "B.A", "Office Administration", "Admin", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Accounts Clerk", "B.Com", "Accounts", "Accounts", "SCHOOL_STAFF", "", "BASE_SCHOOL_STAFF"),
    ("Fee Desk", "M.Com", "Fee Operations", "Accounts", "SCHOOL_STAFF", "", "FEE_OFFICE,BASE_SCHOOL_STAFF"),
]


def phone(prefix: str, n: int) -> str:
    return f"{prefix}{n:05d}"


def local_email(first_name: str, last_name: str, domain: str, suffix: str = "") -> str:
    local = f"{first_name}.{last_name}{suffix}".lower().replace(" ", "")
    return f"{local}@{domain}"


def write_csv(path: Path, rows: list[list[str]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as f:
        csv.writer(f, quoting=csv.QUOTE_MINIMAL).writerows(rows)


def homeroom_slot(grade: int, section: str | None) -> str:
    return f"{grade}{section}" if section else str(grade)


def build_classes() -> list[list[str]]:
    rows = [CLASS_HEADER]
    seen_grade_whole: set[int] = set()
    for grade, section in CLASS_LAYOUT:
        if section is None:
            rows.append(["CURRENT", f"G{grade:02d}", f"Class {grade}", str(grade), "", "", "48", "", "UPSERT"])
            seen_grade_whole.add(grade)
        else:
            capacity = "36" if grade <= 10 else "34"
            rows.append(
                ["CURRENT", f"G{grade:02d}", f"Class {grade}", str(grade), section, section, "", capacity, "UPSERT"]
            )
    sections_seen = {sec for _, sec in CLASS_LAYOUT}
    assert seen_grade_whole == {1, 2, 3, 4, 5}
    assert sections_seen == {None, "A"}
    return rows


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
    for (grade, section), cohort_size in zip(CLASS_LAYOUT, STUDENTS_PER_COHORT):
        for roll in range(1, cohort_size + 1):
            use_female = (adm + roll) % 3 == 0
            first = (FIRST_NAMES_F if use_female else FIRST_NAMES_M)[(adm + roll) % len(FIRST_NAMES_F)]
            last = LAST_NAMES[(adm * 2 + roll) % len(LAST_NAMES)]
            guardian_first = FIRST_NAMES_F[(adm + 4) % len(FIRST_NAMES_F)] if adm % 2 else FIRST_NAMES_M[(adm + 5) % len(FIRST_NAMES_M)]
            guardian_relation = "MOTHER" if guardian_first in FEMALE_NAMES else "FATHER"
            dob_year = 2020 - grade
            dob_month = 1 + (adm % 12)
            dob_day = 1 + (adm % 27)
            sec_display = section if section else ""
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
                    sec_display,
                    str(roll),
                    f"{school.admission_prefix}-{adm:04d}",
                    "2026-04-01",
                    guardian_relation,
                    f"{guardian_first} {last}",
                    f"guardian.{school.admission_prefix.lower()}-{adm:04d}@{school.domain}",
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


ALL_GRADES = list(range(1, 13))


def rule_a_period_subjects_for_grade(grade: int) -> list[str]:
    """Base lane (length ``len(PERIOD_TIMES)``) before cohort rotation — one subject per period column Mon–Fri."""
    if grade <= 5:
        return [
            "English",
            "Hindi",
            "Mathematics",
            "EVS",
            "Computer Science",
            "Physical Education",
            "Art",
        ]
    if grade <= 8:
        return [
            "English",
            "Hindi",
            "Mathematics",
            "Science",
            "Social Science",
            "Sanskrit",
            "Computer Science",
        ]
    return [
        "English",
        "Hindi",
        "Mathematics",
        "Science",
        "Social Science",
        "Sanskrit",
        "Physical Education",
    ]


def _rotated_rule_a_period_row(grade: int, section: str | None) -> list[str]:
    """Rotate the base template so parallel grades do not all demand the same subject in period 1 (pool-safe)."""
    base = rule_a_period_subjects_for_grade(grade)
    span = len(base)
    bump = ord(section[0]) if section else 0
    shift = ((grade - 1) * 3 + bump) % span
    return base[shift:] + base[:shift]


def _teacher_unused_slot_all_week(
    teacher_busy: set[tuple[str, int, str]], employee_code: str, period_no: int
) -> bool:
    return all((day, period_no, employee_code) not in teacher_busy for day in DAYS)


def subject_counts_for_grade(grade: int) -> Counter[str]:
    """Rule B only: weekly slot totals = len(DAYS) * len(PERIOD_TIMES) (lite: 5×7 = 35)."""
    if grade <= 5:
        return Counter(
            {
                "English": 6,
                "Hindi": 6,
                "Mathematics": 6,
                "EVS": 6,
                "Computer Science": 3,
                "Physical Education": 3,
                "Art": 3,
                "Moral Science": 2,
            }
        )
    if grade <= 8:
        return Counter(
            {
                "English": 5,
                "Hindi": 4,
                "Mathematics": 6,
                "Science": 6,
                "Social Science": 5,
                "Sanskrit": 3,
                "Computer Science": 2,
                "Physical Education": 2,
                "Art": 2,
            }
        )
    return Counter(
        {
            "English": 5,
            "Hindi": 4,
            "Mathematics": 6,
            "Science": 6,
            "Social Science": 5,
            "Sanskrit": 3,
            "Computer Science": 3,
            "Physical Education": 2,
            "Art": 1,
        }
    )


def balanced_subject_sequence(grade: int) -> list[str]:
    """Rule B only — balanced rotation order over the full weekday×period strip."""
    remaining = subject_counts_for_grade(grade)
    sequence: list[str] = []
    while sum(remaining.values()):
        candidates = sorted(remaining, key=lambda subject: (-remaining[subject], subject))
        picked = False
        for subject in candidates:
            if remaining[subject] <= 0:
                continue
            if len(sequence) >= 2 and subject in sequence[-2:]:
                continue
            sequence.append(subject)
            remaining[subject] -= 1
            picked = True
            break
        if not picked:
            subject = max(remaining, key=remaining.get)
            sequence.append(subject)
            remaining[subject] -= 1
    slots = len(DAYS) * len(PERIOD_TIMES)
    if len(sequence) != slots:
        raise RuntimeError(f"Bad timetable subject count for grade {grade}: {len(sequence)} vs {slots}")
    return sequence


def room_for(school: SchoolSpec, grade: int, section: str | None) -> str:
    if section:
        return f"{school.short_code}-{grade}{section}-ROOM"
    return f"{school.short_code}-{grade}-ROOM"


def build_timetable(school: SchoolSpec, teacher_pools: dict[str, list[str]]) -> list[list[str]]:
    if LITE_TIMETABLE_STRATEGY == LiteTimetableStrategy.FIXED_PERIOD_WEEKLY:
        return _build_timetable_fixed_period_weekly(school, teacher_pools)
    if LITE_TIMETABLE_STRATEGY == LiteTimetableStrategy.ROTATING_DAY_GRID:
        return _build_timetable_rotating_day_grid(school, teacher_pools)
    raise RuntimeError(f"Unsupported LITE_TIMETABLE_STRATEGY: {LITE_TIMETABLE_STRATEGY!r}")


def _build_timetable_fixed_period_weekly(school: SchoolSpec, teacher_pools: dict[str, list[str]]) -> list[list[str]]:
    """Rule A — same subject + same teacher for every weekday in that period for each class-section."""
    rows = [TIMETABLE_HEADER]
    teacher_busy: set[tuple[str, int, str]] = set()
    room_busy: set[tuple[str, int, str]] = set()
    class_busy: set[tuple[int, str, str, int]] = set()
    teacher_load: Counter[str] = Counter()

    for (_section_index, (grade, section)) in enumerate(CLASS_LAYOUT):
        section_ref = section if section else ""
        rm = room_for(school, grade, section)
        period_row = _rotated_rule_a_period_row(grade, section)
        if len(period_row) != len(PERIOD_TIMES):
            raise RuntimeError(
                f"rule_a_period_subjects_for_grade({grade}) length {len(period_row)} != {len(PERIOD_TIMES)}"
            )

        for period_index, subject in enumerate(period_row):
            period_no = period_index + 1
            start, end = PERIOD_TIMES[period_index]
            codes = teacher_pools.get(subject) or []
            available = [c for c in codes if _teacher_unused_slot_all_week(teacher_busy, c, period_no)]
            if not available:
                raise RuntimeError(
                    f"No teacher for {subject} Class {grade} {section_ref} period {period_no} "
                    "across weekdays (fixed-period model)."
                )
            teacher_code = min(available, key=lambda c: (teacher_load[c], c))
            teacher_load[teacher_code] += len(DAYS)
            subj_code = CATALOG_SUBJECT_CODE_BY_NAME.get(
                subject, "".join(c for c in subject.upper() if c.isalnum())[:8] or "SUBJ"
            )

            for day in DAYS:
                class_key = (grade, section or "", day, period_no)
                room_key = (day, period_no, rm)
                if class_key in class_busy:
                    raise RuntimeError(f"Class conflict: {class_key}")
                if room_key in room_busy:
                    raise RuntimeError(f"Room conflict: {room_key}")
                teacher_busy.add((day, period_no, teacher_code))
                room_busy.add(room_key)
                class_busy.add(class_key)

                rows.append(
                    [
                        "CURRENT",
                        "UPSERT",
                        "EMPLOYEE_CODE",
                        teacher_code,
                        f"Class {grade}",
                        section_ref,
                        subject,
                        subj_code,
                        day,
                        str(period_no),
                        start,
                        end,
                        rm,
                    ]
                )
    return rows


def _build_timetable_rotating_day_grid(school: SchoolSpec, teacher_pools: dict[str, list[str]]) -> list[list[str]]:
    """Rule B — subject (and typical specialist) rotates by weekday within each period lane."""
    rows = [TIMETABLE_HEADER]
    teacher_busy: set[tuple[str, int, str]] = set()
    room_busy: set[tuple[str, int, str]] = set()
    class_busy: set[tuple[int, str, str, int]] = set()
    teacher_load: Counter[str] = Counter()
    base_sequences = {grade: balanced_subject_sequence(grade) for grade in ALL_GRADES}

    for section_index, (grade, section) in enumerate(CLASS_LAYOUT):
        sequence = base_sequences[grade]
        shift = (section_index * 11 + grade * 5 + (ord(section or " ") * 3)) % len(sequence)
        section_ref = section if section else ""
        rm = room_for(school, grade, section)

        slot_enumerate = [(day, p) for day in DAYS for p in range(len(PERIOD_TIMES))]
        for slot_index, (day, period_index) in enumerate(slot_enumerate):
            subject = sequence[(slot_index + shift) % len(sequence)]
            period = period_index + 1
            start, end = PERIOD_TIMES[period_index]
            class_key = (grade, section or "", day, period)
            room_key = (day, period, rm)

            if class_key in class_busy:
                raise RuntimeError(f"Class conflict: {class_key}")
            if room_key in room_busy:
                raise RuntimeError(f"Room conflict: {room_key}")

            available = [code for code in teacher_pools[subject] if (day, period, code) not in teacher_busy]
            if not available:
                raise RuntimeError(f"No teacher for {subject} Class {grade} {section_ref} {day} P{period}")
            teacher_code = min(available, key=lambda code: (teacher_load[code], code))
            teacher_busy.add((day, period, teacher_code))
            room_busy.add(room_key)
            class_busy.add(class_key)
            teacher_load[teacher_code] += 1

            subj_code = CATALOG_SUBJECT_CODE_BY_NAME.get(
                subject, "".join(c for c in subject.upper() if c.isalnum())[:8] or "SUBJ"
            )
            rows.append(
                [
                    "CURRENT",
                    "UPSERT",
                    "EMPLOYEE_CODE",
                    teacher_code,
                    f"Class {grade}",
                    section_ref,
                    subject,
                    subj_code,
                    day,
                    str(period),
                    start,
                    end,
                    rm,
                ]
            )
    return rows


def build_fees() -> list[list[str]]:
    rows = [FEE_HEADER]
    for grade in ALL_GRADES:
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


def write_readme(
    out_dir: Path,
    school: SchoolSpec,
    n_teachers: int,
    n_staff: int,
    n_students: int,
    tt_rows: int,
    homeroom_slots: int,
) -> None:
    slots_per_week = len(DAYS) * len(PERIOD_TIMES)
    timetable_blurb = (
        "Timetable uses **Rule A (fixed periods)**: same subject + same teacher Mon–Fri in each period lane; templates are "
        "**rotated by grade** so parallel classes rarely share one subject at the same bell (pool sizing). Toggle "
        f"`LITE_TIMETABLE_STRATEGY = LiteTimetableStrategy.ROTATING_DAY_GRID` inside `{Path(__file__).name}` for **Rule B**."
        if LITE_TIMETABLE_STRATEGY == LiteTimetableStrategy.FIXED_PERIOD_WEEKLY
        else "Timetable uses **Rule B (rotating day grid)**. Set `LITE_TIMETABLE_STRATEGY = LiteTimetableStrategy.FIXED_PERIOD_WEEKLY` for Rule A."
    )
    text = f"""# {school.name} — Lite 100 onboarding pack

Lightweight onboarding set (same conventions as `{school.short_code}` 300-pack imports):
**{n_students} students**, **{n_teachers} teachers** (**{homeroom_slots} homerooms** on **T001…T{homeroom_slots:03d}**; remaining rows satisfy parallel-subject pooling on Mon–Fri),
**{n_staff} staff**, **classes 1–12** — **1–5** whole-cohort (**no section**); **6–12** use a **single section A** per grade (smaller teacher pool than A+B).
Calendar: **Monday–Friday**, **{slots_per_week} periods/week**, conflict-free classroom / teacher / room usage.

{timetable_blurb}

Fees: matching component pattern (tuition, activity, lab, sports, annual, transport).

> **Teacher count:** a full subject mix plus **twelve simultaneous classes** requires more specialists than twenty.
  This lite pack trims **calendar load** (no Saturday) instead of weakening academic columns. If your policy demands
  strictly twenty teacher rows, drop periods/days further or consolidate subjects in `{Path(__file__).name}` before regenerating.

## Contents

- `01_classes_sections.csv`: class rows above (whole primaries + one section band per senior grade).
- `02_teachers.csv`: `{n_teachers}` rows + header; each row has distinct name + credential-style qualification/specialization (pool subject still matches timetable); emails `firstname.lastname.t###@{school.domain}`.
- `03_staff.csv`: `{n_staff}` operations staff rows.
- `04_students.csv`: `{n_students}` admissions; guardian emails `guardian.<admission>-{{seq}}@{school.domain}`.
- `05_timetable.csv`: `{tt_rows}` recurring slots referencing `employee_code`s; **`subject_name`** + optional stable **`subject_code`** (ERP mnemonic, aligned with seeded catalog defaults where applicable).
- `06_fee_structures.csv`: `{len(ALL_GRADES)}` annual fee bundles (Class 1–12).

## Import order

1. Classes/sections · 2. Teachers · 3. Staff · 4. Students · 5. Fee structures · 6. Timetable

Generate / refresh CSVs:

`python3 docs/onboarding-import-pack/{Path(__file__).name}`
"""
    (out_dir / "README.md").write_text(text, encoding="utf-8")


def grow_teacher_plan_for_timetable(
    school: SchoolSpec,
    homerooms: list[str],
) -> tuple[list[list[str]], list[list[str]], int]:
    plan: list[tuple[str, int]] = [tuple(p) for p in LITE_TEACHER_PLAN]
    appended = 0
    last_error: RuntimeError | None = None
    while appended <= MAX_TEACHER_APPEND:
        teacher_rows, pools = build_teachers(school, homerooms, plan)
        try:
            timetable = build_timetable(school, pools)
            return teacher_rows, timetable, appended
        except RuntimeError as e:
            last_error = e
            msg = str(e)
            match = re.match(r"No teacher for (.+?) Class\b", msg)
            subject = match.group(1).strip() if match else None
            if subject is None or appended >= MAX_TEACHER_APPEND:
                break
            plan.append((subject, 1))
            appended += 1
    raise RuntimeError(
        f"Unable to satisfy lite timetable within +{MAX_TEACHER_APPEND} pool rows"
    ) from last_error


def generate_school(school: SchoolSpec) -> None:
    homerooms = [homeroom_slot(g, s) for g, s in CLASS_LAYOUT]
    assert len(homerooms) == len(CLASS_LAYOUT)

    out_dir = ROOT / school.slug
    out_dir.mkdir(parents=True, exist_ok=True)
    try:
        teachers, pools = build_teachers(school, homerooms, LITE_TEACHER_PLAN)
        timetable = build_timetable(school, pools)
        pool_overhead = 0
    except RuntimeError:
        teachers, timetable, pool_overhead = grow_teacher_plan_for_timetable(school, homerooms)

    write_csv(out_dir / "01_classes_sections.csv", build_classes())
    write_csv(out_dir / "02_teachers.csv", teachers)
    write_csv(out_dir / "03_staff.csv", build_staff(school))
    write_csv(out_dir / "04_students.csv", build_students(school))
    write_csv(out_dir / "05_timetable.csv", timetable)
    write_csv(out_dir / "06_fee_structures.csv", build_fees())
    write_readme(
        out_dir,
        school,
        len(teachers) - 1,
        len(STAFF_ROWS),
        sum(STUDENTS_PER_COHORT),
        len(timetable) - 1,
        len(homerooms),
    )

    print(
        f"{school.name}: cohorts={len(CLASS_LAYOUT)} teachers={len(teachers)-1} (+{pool_overhead} auto pool) "
        f"staff={len(STAFF_ROWS)} students={sum(STUDENTS_PER_COHORT)} timetable={len(timetable)-1} "
        f"fees={len(ALL_GRADES)} → {out_dir}"
    )


def main() -> None:
    for spec in SCHOOLS:
        generate_school(spec)


if __name__ == "__main__":
    main()
