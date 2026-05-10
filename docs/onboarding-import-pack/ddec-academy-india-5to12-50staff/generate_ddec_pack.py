#!/usr/bin/env python3
"""
Generates DDEC Academy (Indian CBSE-style) onboarding CSVs: classes 5–12, ~50 staff, students, timetable.
Run from repo root: python3 docs/onboarding-import-pack/ddec-academy-india-5to12-50staff/generate_ddec_pack.py
"""
from __future__ import annotations

import csv
from pathlib import Path

OUT = Path(__file__).resolve().parent
SCHOOL_DOMAIN = "ddecacademy.edu.in"
SCHOOL_SHORT = "DDEC Academy"

GRADES = list(range(5, 13))
SECTIONS = ["A", "B", "C"]

# Homeroom teachers T001–T024 → phones 9825510001–9825510024
# Specialists T025–T032 → 9825510025–9825510032 (used in teacher rows; timetable uses homeroom-only model below)

FIRST_NAMES_M = (
    "Aarav,Vivaan,Aditya,Vihaan,Arjun,Reyansh,Krishna,Ishaan,Shaurya,Advik,Rudra,Siddharth"
    ",Kabir,Dev,Aryan,Rohan,Manav,Karan,Neil,Ritesh"
).split(",")
FIRST_NAMES_F = (
    "Ananya,Diya,Kiara,Pihu,Saanvi,Navya,Ira,Mira,Tara,Avni,Kavya,Riya"
    ",Meera,Tanvi,Ishita,Sneha,Priya,Neha,Shruti,Aditi"
).split(",")

LAST_NAMES = (
    "Sharma,Verma,Patel,Singh,Reddy,Iyer,Menon,Nair,Kapoor,Joshi,Gupta,Agarwal"
    ",Malhotra,Bansal,Chopra,Kulkarni,Rao,Desai,Mukherjee,Bose"
).split(",")


def main() -> None:
    sections_flat: list[tuple[int, str]] = [(g, s) for g in GRADES for s in SECTIONS]

    # --- 01 classes ---
    cls_header = (
        "academic_year (O),class_code (O),class_name (R),grade (R),section_code (O),"
        "section_name (O),class_capacity (O),section_capacity (O),import_mode (O)"
    )
    cls_lines = [cls_header]
    for g in GRADES:
        code = f"G{g:02d}"
        for sec in SECTIONS:
            cap = 40 if g <= 8 else 36
            cls_lines.append(
                f"CURRENT,{code},Class {g},{g},{sec},{sec},,{cap},UPSERT"
            )
    (OUT / "01_classes_sections.csv").write_text("\n".join(cls_lines) + "\n", encoding="utf-8")

    # --- 02 teachers ---
    th = [
        "academic_year_id (R),import_mode (O),employee_code (R),first_name (R),last_name (R),phone (R),"
        "join_date (O),status (O),email (O),gender (O),dob (O),qualification (O),specialization (O),"
        "department (O),subjects (O),can_class_teacher (O),class_teacher_slot (O),create_portal (O),"
        "portal_password (O),portal_role (O),library_role (O),school_role_codes (O),notify_credentials (O),"
        "salary (O),bank_account_holder (O),bank_name (O),bank_account_number (O),bank_ifsc (O)"
    ]
    slots = [f"{g}{s}" for g, s in sections_flat]
    subs_specialty = [
        "Mathematics",
        "Science",
        "English",
        "Hindi",
        "Social Science",
        "Computer Science",
        "Physical Education",
        "Art",
        "Sanskrit",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Economics",
        "Accountancy",
        "Business Studies",
        "Political Science",
        "History",
        "Geography",
        "English",
        "Mathematics",
        "Science",
        "Computer Science",
        "Physical Education",
        "Music",
        "Library Science",
        "Psychology",
        "Fine Arts",
        "Sports Science",
        "Informatics Practices",
        "Environmental Science",
        "Career Counselling",
    ]
    for i in range(24):
        fn = FIRST_NAMES_M[i % len(FIRST_NAMES_M)] if i % 2 == 0 else FIRST_NAMES_F[i % len(FIRST_NAMES_F)]
        ln = LAST_NAMES[i % len(LAST_NAMES)]
        phone = f"982551{i+1:04d}"
        em = f"{fn.lower()}.{ln.lower()}@{SCHOOL_DOMAIN}"
        spec = subs_specialty[i]
        bank_no = f"501000{i+1:06d}"
        th.append(
            "CURRENT,UPSERT,"
            f"T{i+1:03d},{fn},{ln},{phone},2023-06-{15+(i%14):02d},ACTIVE,{em},,,"
            f"M.Ed,{spec},Senior Secondary,{spec},{spec},Y,{slots[i]},Y,Ddec@Teach{i+1},TEACHER,,ACADEMIC_STAFF,N,"
            f"{52000+i*800},{fn} {ln},HDFC Bank,{bank_no},HDFC0009{(i%90)+10:02d}"
        )
    # Floaters T025–T032 (no homeroom)
    floater_specs = subs_specialty[24:32]
    for j in range(8):
        i = 24 + j
        fn = FIRST_NAMES_M[(i + 3) % len(FIRST_NAMES_M)]
        ln = LAST_NAMES[(i + 5) % len(LAST_NAMES)]
        phone = f"982551{i+1:04d}"
        em = f"{fn.lower()}.{ln.lower()}@{SCHOOL_DOMAIN}"
        spec = floater_specs[j]
        bank_no = f"501000{i+1:06d}"
        th.append(
            "CURRENT,UPSERT,"
            f"T{i+1:03d},{fn},{ln},{phone},2024-01-{10+j:02d},ACTIVE,{em},,,"
            f"M.A,{spec},Activity,{spec},{spec},N,,Y,Ddec@Teach{i+1},TEACHER,,ACADEMIC_STAFF,N,"
            f"{56000+j*900},{fn} {ln},HDFC Bank,{bank_no},HDFC0009{(i%90)+10:02d}"
        )
    (OUT / "02_teachers.csv").write_text("\n".join(th) + "\n", encoding="utf-8")

    # --- 03 staff (18) ---
    staff_roles = [
        ("S001", "Madhuri", "Kulkarni", "9825520001", "MLIS", "Library", "Library", "LIBRARY_STAFF", "LIBRARIAN"),
        ("S002", "Kiran", "Shetty", "9825520002", "BLIS", "Circulation", "Library", "LIBRARY_STAFF", "ASSISTANT"),
        ("S003", "Asha", "Banerjee", "9825520003", "B.A", "Office Admin", "Admin", "SCHOOL_STAFF", ""),
        ("S004", "Vikram", "Sood", "9825520004", "B.Com", "Accounts Clerk", "Accounts", "SCHOOL_STAFF", ""),
        ("S005", "Neha", "Pillai", "9825520005", "M.Com", "Fee Desk", "Accounts", "SCHOOL_STAFF", "FEE_OFFICE"),
        ("S006", "Omar", "Siddiqui", "9825520006", "B.Lib", "Stacks", "Library", "SCHOOL_STAFF", "LIBRARY_OPERATIONS"),
        ("S007", "Rajesh", "Yadav", "9825520007", "Diploma", "Transport", "Transport", "SCHOOL_STAFF", "TRANSPORT_LOGISTICS"),
        ("S008", "Priya", "Nambiar", "9825520008", "B.Sc", "Lab Attendant", "Science Lab", "SCHOOL_STAFF", ""),
        ("S009", "Suresh", "Menon", "9825520009", "ITI", "Electrician", "Facilities", "SCHOOL_STAFF", ""),
        ("S010", "Kavita", "Rao", "9825520010", "B.Com", "HR Assistant", "Admin", "SCHOOL_STAFF", ""),
        ("S011", "Ravi", "Krishnan", "9825520011", "M.Sc", "ICT Support", "IT", "SCHOOL_STAFF", ""),
        ("S012", "Anjali", "Desai", "9825520012", "B.P.Ed", "Sports Admin", "Sports", "SCHOOL_STAFF", ""),
        ("S013", "Deepak", "Haldar", "9825520013", "Diploma", "Security Supervisor", "Admin", "SCHOOL_STAFF", ""),
        ("S014", "Megha", "Thomas", "9825520014", "GNM", "Infirmary", "Health", "SCHOOL_STAFF", ""),
        ("S015", "Sunil", "Khanna", "9825520015", "B.A", "Reception", "Front Office", "SCHOOL_STAFF", ""),
        ("S016", "Fatima", "Sheikh", "9825520016", "M.A", "Counsellor", "Wellness", "SCHOOL_STAFF", ""),
        ("S017", "Gaurav", "Bhatt", "9825520017", "B.Tech", "Stock", "Stores", "SCHOOL_STAFF", ""),
        ("S018", "Lakshmi", "Subramaniam", "9825520018", "M.Lib", "Digital Resources", "Library", "LIBRARY_STAFF", "ASSISTANT"),
    ]
    sh = [
        "academic_year_id (R),import_mode (O),employee_code (R),first_name (R),last_name (R),phone (R),"
        "join_date (O),status (O),email (O),gender (O),dob (O),qualification (O),specialization (O),"
        "department (O),subjects (O),can_class_teacher (O),class_teacher_slot (O),create_portal (O),"
        "portal_password (O),portal_role (O),library_role (O),school_role_codes (O),notify_credentials (O),"
        "salary (O),bank_account_holder (O),bank_name (O),bank_account_number (O),bank_ifsc (O)"
    ]
    for idx, row in enumerate(staff_roles):
        code, fn, ln, phone, qual, spec, dept, portal_role, lib_role = row
        em = f"{fn.lower()}.{ln.lower()}.staff@{SCHOOL_DOMAIN}"
        lr = lib_role if lib_role else ""
        school_codes = "LIBRARY_OPERATIONS" if "LIBRARY" in dept else "BASE_SCHOOL_STAFF"
        sh.append(
            "CURRENT,UPSERT,"
            f"{code},{fn},{ln},{phone},2024-04-{1+(idx%28):02d},ACTIVE,{em},,,"
            f"{qual},{spec},{spec},{dept},General,N,,Y,Ddec@Staff{idx+1},{portal_role},{lr},{school_codes},N,"
            f"{28000+(idx*400)},{fn} {ln},HDFC Bank,502000{idx+1:06d},HDFC0009{idx+20:02d}"
        )
    (OUT / "03_staff.csv").write_text("\n".join(sh) + "\n", encoding="utf-8")

    # --- 04 students (~12 per section); use CSV writer for commas in address ---
    st_path = OUT / "04_students.csv"
    fn_set_f = set(FIRST_NAMES_F)
    with st_path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
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
        )
        adm = 1
        roll = 1
        for g, sec in sections_flat:
            for k in range(12):
                fn = FIRST_NAMES_M[(adm + k) % len(FIRST_NAMES_M)]
                if k % 3 == 1:
                    fn = FIRST_NAMES_F[(adm + k) % len(FIRST_NAMES_F)]
                ln = LAST_NAMES[(adm + k * 2) % len(LAST_NAMES)]
                gender = "female" if fn in fn_set_f else "male"
                parent_phone = f"97120{(adm % 90000):05d}"
                guardian = f"{fn} {ln} parent"
                pemail = f"parent.{adm}@{SCHOOL_DOMAIN}"
                dob_y = 2006 - (g - 5)
                dob_m = 3 + (adm % 9)
                dob_d = 1 + (adm % 27)
                addr = f"{10 + (adm % 90)}, Sector {adm % 62}, Gurugram, Haryana"
                bg = ["O+", "A+", "B+", "AB+", "O-"][adm % 5]
                w.writerow(
                    [
                        "CURRENT",
                        "UPSERT",
                        fn,
                        ln,
                        gender,
                        f"{dob_y}-{dob_m:02d}-{dob_d:02d}",
                        "",
                        "AUTO",
                        "AUTO",
                        f"Class {g}",
                        sec,
                        str(roll),
                        f"DDADM2026-{adm:04d}",
                        "2026-04-01",
                        "",
                        guardian,
                        pemail,
                        parent_phone,
                        "AUTO",
                        "Y",
                        "N",
                        addr,
                        bg,
                    ]
                )
                adm += 1
                roll += 1
            roll = 1

    # --- 05 timetable: homeroom teaches own section all periods (no cross-period conflict) ---
    days = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
    core_subjects = [
        "Mathematics",
        "English",
        "Hindi",
        "Science",
        "Social Science",
        "Computer Science",
        "Physical Education",
    ]
    period_times = [
        ("08:00", "08:40"),
        ("08:45", "09:25"),
        ("09:40", "10:20"),
        ("10:35", "11:15"),
        ("11:30", "12:10"),
        ("12:20", "13:00"),
        ("13:10", "13:50"),
    ]
    tt = [
        "academic_year_id (R),import_mode (O),teacher_ref_type (R),teacher_ref (R),class_ref (R),section_ref (O),"
        "subject_code (R),day_of_week (R),period_no (R),start_time (R),end_time (R),room_code (O)"
    ]
    for si, (g, sec) in enumerate(sections_flat):
        phone = f"982551{si+1:04d}"
        for di, day in enumerate(days):
            for pi in range(7):
                subj = core_subjects[(di + pi) % len(core_subjects)]
                st, en = period_times[pi]
                room = f"DDEC-{g}{sec}-P{pi+1}"
                tt.append(
                    "CURRENT,UPSERT,PHONE,"
                    f"{phone},Class {g},{sec},{subj},{day},{pi+1},{st},{en},{room}"
                )
    (OUT / "05_timetable.csv").write_text("\n".join(tt) + "\n", encoding="utf-8")

    # --- 06 fee structures ---
    fh = ["name (R),class_id (O),class_name (R),academic_year_id (R),component_spec (R),import_mode (O)"]
    base = 18500
    for g in GRADES:
        step = (g - 5) * 2200
        tuition = base + step
        lab = 2200 + (g - 5) * 350
        sports = 1600 + (g - 5) * 120
        annual = 1100 + (g - 5) * 100
        fh.append(
            f"Class {g} Annual Fee,,Class {g},CURRENT,"
            f"Tuition:{tuition}:TUITION|Lab:{lab}:LAB|Sports:{sports}:SPORTS|Annual:{annual}:MISC,UPSERT"
        )
    (OUT / "06_fee_structures.csv").write_text("\n".join(fh) + "\n", encoding="utf-8")

    print(f"Wrote CSV pack to {OUT}")
    print(f"  classes: {len(sections_flat)} section rows")
    print(f"  teachers: 32, staff: 18, students: {adm-1}, timetable lines: {len(tt)-1}")


if __name__ == "__main__":
    main()
