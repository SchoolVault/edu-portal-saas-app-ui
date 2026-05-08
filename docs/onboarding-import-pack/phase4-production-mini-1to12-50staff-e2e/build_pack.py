#!/usr/bin/env python3
"""
Build phase4-production-mini-1to12-50staff-e2e from phase4-production-mini-1to12:
  • Same classes (1–12), students (~119 + optional QA row), timetable + extensions
  • 32 teachers (T001–T032) + 18 staff (S001–S018) = 50 people
  • Fresh phones/emails for isolated tenant E2E testing

Run from repo root:
  python3 docs/onboarding-import-pack/phase4-production-mini-1to12-50staff-e2e/build_pack.py
"""
from __future__ import annotations

import csv
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT.parent / "phase4-production-mini-1to12"
DOMAIN = "vidyaniketan-e2e.import.edu.in"
PASS_PREFIX = "Vne2e"

# Teacher phones T001–T032 (32 distinct)
T_PHONES = [f"98194{i:05d}" for i in range(1, 33)]
# Staff phones S001–S018
S_PHONES = [f"98195{i:05d}" for i in range(1, 19)]


def patch_teacher_line(parts: list[str]) -> list[str]:
    """Teachers / class-teacher second pass — same 28-column layout as phase4."""
    idx_phone = 5
    idx_email = 8
    idx_pw = 18
    idx_bank_holder = 24
    idx_bank_acct = 26
    idx_ifsc = 27
    ec = parts[2].strip()
    if ec.startswith("T") and ec[1:].isdigit():
        n = int(ec[1:])
        if 1 <= n <= 24:
            parts[idx_phone] = T_PHONES[n - 1]
            fn = parts[3].strip()
            ln = parts[4].strip()
            parts[idx_email] = f"{fn.lower().replace(' ', '')}.{ln.lower().replace(' ', '')}@{DOMAIN}"
            parts[idx_pw] = f"{PASS_PREFIX}@T{n:03d}"
            parts[idx_bank_holder] = f"{fn} {ln}"
            parts[idx_bank_acct] = f"710{n:09d}"
            parts[idx_ifsc] = f"HDFC0009{n % 100:02d}"
    return parts


def append_new_teachers(writer: csv.writer) -> None:
    """T025–T032 specialist teachers (no homeroom)."""
    extra = [
        ("T025", "Gauri", "Krishnan", "MA Music", "Music & Choir", "Enrichment", "Music"),
        ("T026", "Sanjay", "Menon", "BFA", "Fine Arts", "Enrichment", "Art"),
        ("T027", "Lakshmi", "Sundaram", "M.A Sanskrit", "Sanskrit", "Languages", "Sanskrit"),
        ("T028", "Harpreet", "Kaur", "M.Sc Psychology", "Counselling", "Wellness", "Life Skills"),
        ("T029", "Nitin", "Deshpande", "M.Tech", "STEM Club", "Enrichment", "Robotics"),
        ("T030", "Snehal", "Patwardhan", "B.Sc", "Primary Lab", "Primary", "Science Lab"),
        ("T031", "Farhan", "Ahmed", "M.A Urdu", "Urdu", "Languages", "Urdu"),
        ("T032", "Cecilia", "Dsouza", "Grade 8 Piano", "Western Music", "Enrichment", "Music"),
    ]
    for i, (code, fn, ln, qual, spec, dept, subjects) in enumerate(extra):
        n = 25 + i
        row = [
            "CURRENT",
            "UPSERT",
            code,
            fn,
            ln,
            T_PHONES[n - 1],
            "2023-08-01",
            "ACTIVE",
            f"{fn.lower().replace(' ', '')}.{ln.lower().replace(' ', '')}@{DOMAIN}",
            "",
            "",
            qual,
            spec,
            dept,
            subjects,
            "N",
            "",
            "Y",
            f"{PASS_PREFIX}@T{n:03d}",
            "TEACHER",
            "",
            "ACADEMIC_STAFF",
            "N",
            str(52000 + n * 450),
            f"{fn} {ln}",
            "HDFC Bank",
            f"710{n:09d}",
            f"HDFC0009{n % 100:02d}",
        ]
        assert len(row) == 28
        writer.writerow(row)


def patch_staff_line(parts: list[str]) -> list[str]:
    ec = parts[2].strip()
    if ec.startswith("S") and ec[1:].isdigit():
        n = int(ec[1:])
        fn = parts[3].strip()
        ln = parts[4].strip()
        parts[5] = S_PHONES[n - 1]
        local = parts[8].split("@")[0] if "@" in parts[8] else f"{fn.lower().replace(' ', '')}.{ln.lower().replace(' ', '')}.staff"
        parts[8] = f"{local}@{DOMAIN}"
        parts[18] = f"{PASS_PREFIX}@S{n:03d}"
        parts[24] = f"{fn} {ln}"
        parts[26] = f"820001000{n:03d}"
        parts[27] = f"HDFC0007{n:02d}"
    return parts


def patch_student_row(row: dict[str, str], *, row_index: int) -> dict[str, str]:
    """Remap guardian emails/phones off phase4 seed domain; one distinct parent login per CSV row."""
    out = dict(row)
    em = (out.get("primary_guardian_email (O)", "") or "").strip()

    if "yopmail.com" in em.lower():
        out["primary_guardian_email (O)"] = f"guardian.qa.vne@{DOMAIN}"
        out["primary_guardian_phone (R)"] = "9820600999"
        return out

    if "sunrisepublicschool.in" in em:
        local = em.split("@")[0].strip()
        out["primary_guardian_email (O)"] = f"{local}@{DOMAIN}"

    out["primary_guardian_phone (R)"] = str(9821600001 + row_index)
    return out


def extend_timetable(lines: list[str]) -> list[str]:
    """Append SATURDAY enrichment slots for T025–T032 (employee_code refs)."""
    extra = [
        "CURRENT,UPSERT,EMPLOYEE_CODE,T025,Class 1,,Music & Movement,SATURDAY,1,08:00,08:40,VNE-E2E-M01\n",
        "CURRENT,UPSERT,EMPLOYEE_CODE,T026,Class 3,,Visual Arts Workshop,SATURDAY,1,08:00,08:40,VNE-E2E-ART\n",
        "CURRENT,UPSERT,EMPLOYEE_CODE,T027,Class 5,,Sanskrit Culture Hour,SATURDAY,2,08:45,09:25,VNE-E2E-SAN\n",
        "CURRENT,UPSERT,EMPLOYEE_CODE,T028,Class 8,A,Study Skills,SATURDAY,2,08:45,09:25,VNE-E2E-COU\n",
        "CURRENT,UPSERT,EMPLOYEE_CODE,T029,Class 10,B,Robotics Club,SATURDAY,3,09:40,10:20,VNE-E2E-STM\n",
        "CURRENT,UPSERT,EMPLOYEE_CODE,T030,Class 4,,Nature Lab,SATURDAY,3,09:40,10:20,VNE-E2E-LAB\n",
        "CURRENT,UPSERT,EMPLOYEE_CODE,T031,Class 7,B,Urdu Literature,SATURDAY,4,10:35,11:15,VNE-E2E-URD\n",
        "CURRENT,UPSERT,EMPLOYEE_CODE,T032,Class 12,C,Choir Practice,SATURDAY,4,10:35,11:15,VNE-E2E-WMU\n",
    ]
    return lines + extra


def main() -> None:
    if not SOURCE.is_dir():
        raise SystemExit(f"Missing source pack: {SOURCE}")

    out_dir = ROOT
    out_dir.mkdir(parents=True, exist_ok=True)

    shutil.copy2(SOURCE / "01_classes_sections.csv", out_dir / "01_classes_sections.csv")
    shutil.copy2(SOURCE / "05_fee_structures.csv", out_dir / "05_fee_structures.csv")

    # Teachers
    with (SOURCE / "02_teachers.csv").open(newline="", encoding="utf-8") as f:
        r = csv.reader(f)
        rows = list(r)
    header = rows[0]
    out_rows = [header]
    for parts in rows[1:]:
        out_rows.append(patch_teacher_line(parts))
    with (out_dir / "02_teachers.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        for row in out_rows:
            w.writerow(row)
        append_new_teachers(w)

    # Staff — patch 16 rows + add S017 S018
    with (SOURCE / "03_staff.csv").open(newline="", encoding="utf-8") as f:
        r = csv.reader(f)
        srows = list(r)
    sheader = srows[0]
    out_staff = [sheader]
    for parts in srows[1:]:
        out_staff.append(patch_staff_line(parts))

    def staff_row(
        code: str,
        fn: str,
        ln: str,
        qual: str,
        spec: str,
        dept: str,
        portal_role: str,
        library_role: str,
        school_codes: str,
        notify: str,
        salary: str,
    ) -> list[str]:
        n = int(code[1:])
        return [
            "CURRENT",
            "UPSERT",
            code,
            fn,
            ln,
            S_PHONES[n - 1],
            "2023-10-01",
            "ACTIVE",
            f"{fn.lower().replace(' ', '')}.{ln.lower().replace(' ', '')}.staff@{DOMAIN}",
            "",
            "",
            qual,
            spec,
            dept,
            "",
            "N",
            "",
            "Y",
            f"{PASS_PREFIX}@S{n:03d}",
            portal_role,
            library_role,
            school_codes,
            notify,
            salary,
            f"{fn} {ln}",
            "HDFC Bank",
            f"820001000{n:03d}",
            f"HDFC0007{n:02d}",
        ]

    out_staff.append(
        staff_row(
            "S017",
            "Prakash",
            "Natarajan",
            "Diploma",
            "Stores & Inventory",
            "Operations",
            "SCHOOL_STAFF",
            "",
            "BASE_SCHOOL_STAFF,OPERATIONS_DESK",
            "N",
            "34200",
        )
    )
    out_staff.append(
        staff_row(
            "S018",
            "Meenakshi",
            "Bhosale",
            "B.Sc",
            "Science Prep Room",
            "STEM",
            "SCHOOL_STAFF",
            "",
            "BASE_SCHOOL_STAFF,ACADEMIC_ADMIN_DESK",
            "N",
            "33800",
        )
    )

    with (out_dir / "03_staff.csv").open("w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(out_staff)

    # Students — same filename pattern as phase4 (duplicate 03_ prefix as upstream pack)
    with (SOURCE / "03_students.csv").open(newline="", encoding="utf-8") as f:
        r = csv.DictReader(f)
        fieldnames = r.fieldnames
        assert fieldnames
        st_out = list(r)
    patched = [patch_student_row(row, row_index=i) for i, row in enumerate(st_out)]
    with (out_dir / "03_students.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(patched)

    # Timetable
    raw_tt = (SOURCE / "04_timetable.csv").read_text(encoding="utf-8")
    lines = raw_tt.splitlines(keepends=True)
    if lines and not lines[-1].endswith("\n"):
        lines[-1] += "\n"
    (out_dir / "04_timetable.csv").write_text("".join(extend_timetable(lines)), encoding="utf-8")

    # Class teacher second pass
    with (SOURCE / "06_class_teacher_assignment_second_pass.csv").open(newline="", encoding="utf-8") as f:
        r = csv.reader(f)
        cta = list(r)
    cheader = cta[0]
    out_cta = [cheader]
    for parts in cta[1:]:
        out_cta.append(patch_teacher_line(parts))
    with (out_dir / "06_class_teacher_assignment_second_pass.csv").open("w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(out_cta)

    n_teachers = len(out_rows) - 1 + 8
    n_staff = len(out_staff) - 1
    n_tt = sum(1 for _ in (out_dir / "04_timetable.csv").open(encoding="utf-8")) - 1

    print(f"Wrote pack to {out_dir}")
    print(f"  Teachers: {n_teachers} (02_teachers.csv)")
    print(f"  Staff: {n_staff} (03_staff.csv)")
    print(f"  Students: {len(patched)} (03_students.csv)")
    print(f"  Timetable rows: {n_tt} (04_timetable.csv)")
    print(f"  Domain / passwords: @{DOMAIN} / {PASS_PREFIX}@T### / {PASS_PREFIX}@S###")


if __name__ == "__main__":
    main()
