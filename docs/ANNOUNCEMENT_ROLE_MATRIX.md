# Announcement Role Matrix (Who Sees What)

This page explains announcement visibility in plain language.

## Quick Rules

- Announcements are always scoped to the same school (tenant).
- Only `Admin` and `Super Admin` can publish announcements.
- `Teacher`, `Parent`, and `Student` are read-only for announcements.
- Parent audience view includes child-related class/section announcements.

## Role Matrix

| Role | Can Publish? | Can See `Everyone` | Can See `Teachers` | Can See `Parents` | Can See `Class` | Can See `Section` | Notes |
|---|---|---|---|---|---|---|---|
| Admin / Super Admin | Yes | Yes | Yes | Yes | Yes | Yes | Full school announcement access |
| Teacher | No | Yes | Yes | No | Yes (their scope) | Yes (their scope) | Teacher-only + assigned class/section scope |
| Parent | No | Yes | No | Yes | Yes (for their child/children) | Yes (for their child/children) | Parent-level includes children targeting |
| Student | No | Yes | No | Yes (as configured with parent-style rules) | Yes (mapped scope) | Yes (mapped scope) | Student follows current parent-style visibility model |

## Plain Examples

| Published Audience | Admin Sees? | Teacher Sees? | Parent Sees? | Student Sees? |
|---|---|---|---|---|
| `Everyone` | Yes | Yes | Yes | Yes |
| `Teachers` | Yes | Yes | No | No |
| `Parents` | Yes | No | Yes | Yes (current model) |
| `Class: Grade 5` | Yes | Only teachers linked to Grade 5 | Parents with child in Grade 5 | Students mapped to Grade 5 scope |
| `Section: Grade 8-A` | Yes | Only teachers linked to Grade 8-A | Parents with child in Grade 8-A | Students mapped to Grade 8-A scope |

## Filter Dropdown (UI)

- Parent dropdown: `Any`, `Everyone`, `Parents`
- Teacher dropdown: `Any`, `Everyone`, `Teachers`
- Admin dropdown: all audience filters

## Publish UX Behavior

- When admin clicks publish, UI shows **Publishing...**
- Publish button is locked during processing (prevents double-click duplicates)
- On success, modal closes and feed refreshes
- On failure, error message is shown

## Data Safety and Validation

- Class/section must belong to the same school.
- Section must belong to selected class.
- Audience-field combinations are validated (for example, section cannot be set for `Everyone`).
- Duplicate quick re-publish is blocked for similar announcement payloads.
